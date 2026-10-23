import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { getListingImage } from '../utils/images';

const BookingWidget = ({ listing }) => {
  const { t, isRtl } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user } = useAuth();
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);

  // الحصول على تاريخ اليوم كحد أدنى للحجز
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const bookingDetails = useMemo(() => {
    if (!startDate || !endDate || !listing?.price) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return null;

    const basePrice = nights * Number(listing.price);
    const serviceFee = Math.round(basePrice * 0.1); // 10% رسوم خدمة
    const total = basePrice + serviceFee;

    return {
      listingPrice: Number(listing.price),
      nights,
      basePrice,
      serviceFee,
      total,
    };
  }, [startDate, endDate, listing?.price]);

  const handleBooking = () => {
    if (!user) {
      setError(t('booking.loginRequired') || 'يجب تسجيل الدخول لإتمام الحجز.');
      timeoutRef.current = setTimeout(() => {
        navigate('/login', { state: { from: location.pathname } });
      }, 1500);
      return;
    }

    if (!bookingDetails) return;

    setLoading(true);
    setError('');

    timeoutRef.current = setTimeout(() => {
      navigate('/checkout', {
        state: {
          listingId: listing._id,
          listingImage: getListingImage(listing),
          listingTitle: listing.title,
          listingLocation: `${listing.location?.city || ''}, ${listing.location?.address || ''}`,
          checkinDate: startDate,
          checkoutDate: endDate,
          guests,
          basePrice: bookingDetails.basePrice,
          serviceFee: bookingDetails.serviceFee,
          total: bookingDetails.total,
          nights: bookingDetails.nights,
        },
      });
      setLoading(false);
    }, 500);
  };

  if (!listing) return null;

  return (
    <div
      className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">
          {Number(listing.price).toLocaleString()} DH
        </span>
        <span className="text-sm font-normal text-gray-500">
          / {t('common.night')}
        </span>
      </div>

      <div className="mb-4 overflow-hidden rounded-xl border border-gray-300 focus-within:border-[#2DB4A0]">
        <div className="grid grid-cols-2 border-b border-gray-300">
          <div className="border-e border-gray-300 p-3">
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-600">
              <CalendarDays size={12} /> {t('booking.checkIn')}
            </label>
            <input
              type="date"
              className="mt-1 w-full cursor-pointer bg-transparent text-sm outline-none"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && new Date(e.target.value) >= new Date(endDate)) {
                  setEndDate('');
                }
              }}
              min={today}
            />
          </div>
          <div className="p-3">
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-600">
              <CalendarDays size={12} /> {t('booking.checkOut')}
            </label>
            <input
              type="date"
              className="mt-1 w-full cursor-pointer bg-transparent text-sm outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
              disabled={!startDate}
            />
          </div>
        </div>

        <div className="p-3">
          <label className="block text-[10px] font-bold uppercase text-gray-600">
            {t('booking.guests')}
          </label>
          <select
            className="mt-1 w-full cursor-pointer bg-white text-sm outline-none"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          >
            {[...Array(listing.guests || 1).keys()].map((value) => (
              <option key={value + 1} value={value + 1}>
                {value + 1}{' '}
                {value === 0
                  ? t('booking.guestSingular') || t('booking.guestLabel')
                  : t('booking.guestLabel')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-2 text-center text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleBooking}
        disabled={loading || !bookingDetails}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2DB4A0] py-3.5 font-bold text-white transition-colors hover:bg-[#249181] disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {loading && <Loader2 className="animate-spin" size={18} />}
        {t('booking.reserve')}
      </button>

      {bookingDetails && (
        <div className="mt-5 space-y-3">
          <p className="text-center text-sm font-medium text-gray-500">
            {t('booking.noCharge') || "You won't be charged yet"}
          </p>
          <div className="flex justify-between text-sm text-gray-600">
            <span className="underline">
              {Number(listing.price).toLocaleString()} DH × {bookingDetails.nights}{' '}
              {t('common.nights')}
            </span>
            <span>{bookingDetails.basePrice.toLocaleString()} DH</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span className="underline">
              {t('booking.serviceFee') || 'Service fee'}
            </span>
            <span>{bookingDetails.serviceFee.toLocaleString()} DH</span>
          </div>

          <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-black text-gray-900">
            <span>{t('booking.total')}</span>
            <span>{bookingDetails.total.toLocaleString()} DH</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingWidget;