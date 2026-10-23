import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import { Calendar, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { arMA, enUS } from 'date-fns/locale';
import { getListingImage } from '../../utils/images';
import { useTranslation } from '../../hooks/useTranslation';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { t, isRtl } = useTranslation();

  useEffect(() => {
    const fetchBookings = async () => {
      if (authLoading) return;
      if (!user || (!user._id && !user.uid)) {
        setLoading(false);
        return;
      }
      try {
        const data = await bookingService.getMyBookings();
        setBookings(Array.isArray(data) ? data : data?.bookings || []);
      } catch (err) {
        console.error('Error fetching user bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, authLoading]);

  const handleCancel = async (id) => {
    if (!window.confirm(t('profile.cancelBookingPrompt') || (isRtl ? 'هل أنت تأكد من إلغاء هذا الحجز؟' : 'Are you sure you want to cancel this booking?'))) {
      return;
    }
    try {
      await bookingService.cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === id ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert(t('profile.cancellationFailed') || (isRtl ? 'فشل إلغاء الحجز' : 'Failed to cancel booking'));
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#2DB4A0]" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 shadow-xs">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isRtl ? 'يرجى تسجيل الدخول لعرض حجوزاتك' : 'Please log in to view your bookings'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900 dark:text-white">
        {t('profile.myBookings') || (isRtl ? 'حجوزاتي' : 'My Bookings')}
      </h1>

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-16 text-center text-gray-600 dark:text-gray-400">
          {t('profile.noBookings') || (isRtl ? 'لا توجد حجوزات حالية' : 'No current bookings')}
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const listing = booking.listing || {};
            const listingTitle = listing.title || (isRtl ? 'عقار غير متاح' : 'Listing Unavailable');
            const statusKey = booking.status || 'pending';
            const canCancel = ['pending', 'confirmed'].includes(statusKey);
            const canReview = statusKey === 'completed' && listing._id;

            return (
              <article
                key={booking._id || booking.id}
                className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs transition hover:shadow-md md:p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row">
                  <img
                    src={getListingImage(listing)}
                    className="h-40 w-full rounded-2xl object-cover md:w-52"
                    alt={listingTitle}
                  />

                  <div className="flex flex-1 flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {listingTitle}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            statusKey === 'confirmed'
                              ? 'bg-[#2DB4A0]/10 text-[#2DB4A0] dark:bg-[#2DB4A0]/20'
                              : statusKey === 'cancelled'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : statusKey === 'completed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {t(`bookingsTable.${statusKey}`) || statusKey}
                        </span>
                      </div>

                      {booking.startDate && booking.endDate && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar size={16} />
                          <span>
                            {format(new Date(booking.startDate), 'dd MMMM', {
                              locale: isRtl ? arMA : enUS,
                            })}{' '}
                            -{' '}
                            {format(new Date(booking.endDate), 'dd MMMM yyyy', {
                              locale: isRtl ? arMA : enUS,
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {booking.totalPrice || booking.total || 0} DH
                      </p>

                      <div className="flex items-center gap-4">
                        {canReview && (
                          <Link
                            to={`/properties/${listing._id}`}
                            className="flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 dark:hover:text-amber-400 transition"
                          >
                            <Star size={16} />
                            {isRtl ? 'أضف تقييماً' : 'Leave a review'}
                          </Link>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancel(booking._id || booking.id)}
                            className="text-sm font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 cursor-pointer underline transition"
                          >
                            {t('profile.cancelBooking') || (isRtl ? 'إلغاء الحجز' : 'Cancel Booking')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default MyBookingsPage;