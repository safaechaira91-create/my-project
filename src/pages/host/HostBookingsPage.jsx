import { useEffect, useMemo, useState, useCallback } from 'react';
import { Check, Loader2, X, CalendarX, User, Building, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../utils/errorMessage';

const statusClasses = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
  confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
  completed: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50',
};

const PAGE_SIZE = 15;

const HostBookingsPage = () => {
  const { isRtl, showNotification, language } = useAppContext();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const copy = {
    title: isRtl ? 'إدارة حجوزات المالك' : 'Owner booking requests',
    subtitle: isRtl ? 'راجع الطلبات المعلقة وقم بقبولها أو رفضها.' : 'Review pending booking requests and approve or reject them.',
    empty: isRtl ? 'لا توجد حجوزات حالياً.' : 'No bookings yet.',
    approve: isRtl ? 'قبول' : 'Approve',
    reject: isRtl ? 'رفض' : 'Reject',
    guest: isRtl ? 'الضيف' : 'Guest',
    property: isRtl ? 'العقار' : 'Property',
    dates: isRtl ? 'التواريخ' : 'Dates',
    total: isRtl ? 'المجموع' : 'Total',
    status: isRtl ? 'الحالة' : 'Status',
    actions: isRtl ? 'الإجراءات' : 'Actions',
    updated: isRtl ? 'تم تحديث الحجز' : 'Booking updated',
    failed: isRtl ? 'تعذر تحديث الحجز' : 'Could not update booking',
    loadFailed: isRtl ? 'تعذر تحميل الحجوزات' : 'Could not load bookings',
    accessDenied: language === 'ar' ? 'عذراً، ليس لديك صلاحية دخول هذه الصفحة. هذه الصفحة خاصة بالمضيفين فقط.' : 'Access denied. This page is for hosts only.',
    loadMore: isRtl ? 'عرض المزيد' : 'Show more',
    statusMap: {
      pending: isRtl ? 'معلق' : 'Pending',
      confirmed: isRtl ? 'مؤكد' : 'Confirmed',
      rejected: isRtl ? 'مرفوض' : 'Rejected',
      cancelled: isRtl ? 'ملغى' : 'Cancelled',
      completed: isRtl ? 'مكتمل' : 'Completed',
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role !== 'host' && user.role !== 'admin') {
      navigate('/');
    }
  }, [user?.role, authLoading, navigate]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/host-bookings');
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showNotification(getErrorMessage(error, copy.loadFailed), 'error');
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed, showNotification]);

  useEffect(() => {
    if (user && (user.role === 'host' || user.role === 'admin')) {
      loadBookings();
    }
  }, [user?._id, user?.role, loadBookings]);

  const sortedBookings = useMemo(() => {
    const priority = { pending: 0, confirmed: 1, rejected: 2, cancelled: 3, completed: 4 };
    return [...bookings].sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9));
  }, [bookings]);

  const visibleBookings = useMemo(
    () => sortedBookings.slice(0, visibleCount),
    [sortedBookings, visibleCount]
  );

  const updateBooking = async (bookingId, action) => {
    setUpdatingId(bookingId);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/${action}`);
      const updatedItem = data?.booking || data;
      setBookings((prev) => 
        prev.map((booking) => (booking._id === bookingId ? { ...booking, ...updatedItem } : booking))
      );
      showNotification(copy.updated, 'success');
    } catch (error) {
      console.error(error);
      showNotification(getErrorMessage(error, copy.failed), 'error');
    } finally {
      setUpdatingId('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(isRtl ? 'ar-MA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-[#2DB4A0]">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (!user || (user.role !== 'host' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-md p-8 border border-rose-200 dark:border-rose-900/40 rounded-3xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-bold shadow-sm">
          {copy.accessDenied}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{copy.title}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{copy.subtitle}</p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        {loading ? (
          <div className="flex justify-center p-16 text-[#2DB4A0]">
            <Loader2 className="animate-spin" size={36} />
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-gray-500 dark:text-gray-400">
            <CalendarX size={48} className="mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-base font-semibold">{copy.empty}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-start font-bold">{copy.property}</th>
                    <th className="px-6 py-4 text-start font-bold">{copy.guest}</th>
                    <th className="px-6 py-4 text-start font-bold">{copy.dates}</th>
                    <th className="px-6 py-4 text-start font-bold">{copy.total}</th>
                    <th className="px-6 py-4 text-start font-bold">{copy.status}</th>
                    <th className="px-6 py-4 text-center font-bold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {visibleBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-[#2DB4A0] shrink-0" />
                          <span className="truncate max-w-50">{booking.listing?.title || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2 font-semibold">
                          <User size={14} className="text-gray-400 shrink-0" />
                          <span>{booking.user?.name || '-'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{booking.user?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                          <Clock size={14} className="text-gray-400 shrink-0" />
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                        {Number(booking.totalPrice || 0).toLocaleString()} DH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusClasses[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                          {copy.statusMap[booking.status] || booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.status === 'pending' ? (
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              disabled={updatingId === booking._id}
                              onClick={() => updateBooking(booking._id, 'approve')}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition disabled:opacity-60"
                            >
                              {updatingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              {copy.approve}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === booking._id}
                              onClick={() => updateBooking(booking._id, 'reject')}
                              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition disabled:opacity-60"
                            >
                              {updatingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                              {copy.reject}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium">—</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visibleCount < sortedBookings.length && (
              <div className="flex justify-center border-t border-gray-100 dark:border-gray-800 p-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {copy.loadMore} ({sortedBookings.length - visibleCount})
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default HostBookingsPage;