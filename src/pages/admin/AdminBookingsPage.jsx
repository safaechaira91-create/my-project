import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminService from '../../services/adminService';
import Skeleton from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const AdminBookingsPage = () => {
  const { t, isRtl } = useTranslation();
  const context = useOutletContext();
  const globalSearch = context?.globalSearch || '';

  const [status, setStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const statusLabels = {
    pending: isRtl ? 'قيد الانتظار' : 'Pending',
    confirmed: isRtl ? 'مؤكد' : 'Confirmed',
    completed: isRtl ? 'مكتمل' : 'Completed',
    cancelled: isRtl ? 'ملغى' : 'Cancelled',
  };

  const loadBookings = (targetPage = 1) => {
    setLoading(true);
    adminService
      .getBookings({ q: globalSearch, status, page: targetPage, limit: 20 })
      .then((data) => {
        const rows = Array.isArray(data) ? data : data?.bookings || [];
        setBookings(rows);
        setPage(data?.page || 1);
        setPages(data?.pages || 1);
      })
      .catch((err) => console.error('Failed to load bookings:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings(1);
  }, [globalSearch, status]);

  const handleUpdateStatus = async (bookingId, payload, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setUpdatingId(bookingId);
    try {
      await adminService.updateBooking(bookingId, payload);
      await loadBookings(page);
    } catch (err) {
      console.error('Failed to update booking:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {t('admin.bookingManagement') || (isRtl ? 'إدارة الحجوزات' : 'Booking Management')}
        </h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        >
          <option value="all">{isRtl ? 'جميع الحالات' : 'All status'}</option>
          <option value="pending">{statusLabels.pending}</option>
          <option value="confirmed">{statusLabels.confirmed}</option>
          <option value="cancelled">{statusLabels.cancelled}</option>
          <option value="completed">{statusLabels.completed}</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="py-3 px-2">{isRtl ? 'معرف الحجز' : 'Booking ID'}</th>
              <th className="px-2">{isRtl ? 'المستخدم' : 'User'}</th>
              <th className="px-2">{isRtl ? 'العقار' : 'Listing'}</th>
              <th className="px-2">{isRtl ? 'الحالة' : 'Status'}</th>
              <th className="px-2">{isRtl ? 'المبلغ' : 'Total'}</th>
              <th className="px-2">{isRtl ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-2"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-2"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-2"><Skeleton className="h-6 w-28 rounded" /></td>
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  {isRtl ? 'لا توجد حجوزات مطابقة' : 'No bookings found'}
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-2 font-mono text-xs font-semibold text-gray-600">
                    #{b._id.slice(-8)}
                  </td>
                  <td className="px-2 font-medium text-gray-800">{b.user?.name || '-'}</td>
                  <td className="px-2 text-gray-700 max-w-50 truncate" title={b.listing?.title}>
                    {b.listing?.title || '-'}
                  </td>
                  <td className="px-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGES[b.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabels[b.status] || b.status}
                    </span>
                  </td>
                  <td className="px-2 font-semibold text-gray-900">{b.totalPrice} DH</td>
                  <td className="px-2">
                    {['pending', 'confirmed'].includes(b.status) ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={updatingId === b._id}
                          onClick={() =>
                            handleUpdateStatus(
                              b._id,
                              { status: 'cancelled' },
                              isRtl ? 'هل أنت متأكد من إلغاء هذا الحجز؟' : 'Are you sure you want to cancel this booking?'
                            )
                          }
                          className="rounded bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          disabled={updatingId === b._id}
                          onClick={() =>
                            handleUpdateStatus(
                              b._id,
                              { status: 'cancelled', refundAmount: b.totalPrice * 0.5 },
                              isRtl ? 'إلغاء وإرجاع 50% من المبلغ للمستخدم؟' : 'Cancel and refund 50% to user?'
                            )
                          }
                          className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                        >
                          {isRtl ? 'استرداد 50%' : 'Refund 50%'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {isRtl ? 'لا توجد إجراءات' : 'No actions'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => loadBookings(p)}
              className={`h-8 w-8 rounded-full text-sm font-semibold transition ${
                p === page
                  ? 'bg-[#2DB4A0] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;