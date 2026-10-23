import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, HandCoins, Loader2, Wallet, AlertTriangle } from 'lucide-react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import api from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { getImageUrl } from '../../utils/images';

const toDateInputValue = (date) => date.toISOString().split('T')[0];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getNightCount = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Number.isFinite(nights) && nights > 0 ? nights : 1;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { showNotification, currency } = useAppContext();
  const { t, isRtl, language } = useTranslation();

  const [isCompleting, setIsCompleting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    state?.paymentMethod === 'paypal' ? 'paypal' : 'cash'
  );

  const today = useMemo(() => toDateInputValue(new Date()), []);
  const tomorrow = useMemo(() => toDateInputValue(addDays(new Date(), 1)), []);

  const [checkinDate, setCheckinDate] = useState(
    state?.startDate || state?.checkinDate || state?.checkIn || today
  );
  const [checkoutDate, setCheckoutDate] = useState(
    state?.endDate || state?.checkoutDate || state?.checkOut || tomorrow
  );
  const [guestCount] = useState(Number(state?.guests || 1));

  if (!state?.listingId) {
    return (
      <div className="mx-auto max-w-275 px-4 py-14" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center shadow-xs">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('checkout.noData') || (isRtl ? 'لا توجد بيانات تفاصيل الحجز.' : 'No booking details found.')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 rounded-xl bg-[#2DB4A0] px-5 py-2.5 font-semibold text-white transition hover:bg-[#249181] cursor-pointer"
          >
            {t('checkout.backToHome') || (isRtl ? 'العودة للرئيسية' : 'Back to Home')}
          </button>
        </div>
      </div>
    );
  }

  const {
    listingId,
    listingImage,
    listingTitle,
    listingLocation,
    total,
    nights,
    displaySymbol,
  } = state;

  const computedNights = getNightCount(checkinDate, checkoutDate);
  const nightlyPrice = Number(total || 0) / Number(nights || computedNights || 1);
  const bookingTotal = Math.max(0, Math.round(nightlyPrice * computedNights));
  const symbol = displaySymbol || currency?.symbol || 'MAD';
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const isValidBooking = computedNights > 0 && bookingTotal > 0;

  const labels = {
    cash: language === 'ar' ? 'الدفع عند الوصول' : 'Cash on arrival',
    paypal: 'PayPal',
    missingPayPal:
      language === 'ar'
        ? 'PayPal غير مفعّل. أضف VITE_PAYPAL_CLIENT_ID في ملف البيئة.'
        : 'PayPal is not configured. Add VITE_PAYPAL_CLIENT_ID to your environment.',
    invalidDates:
      language === 'ar'
        ? 'تاريخ الخروج يجب أن يكون بعد تاريخ الدخول'
        : 'Checkout date must be after check-in date',
    paypalCurrencyNotice:
      language === 'ar'
        ? 'ملاحظة: سيتم الدفع عبر PayPal بالدولار الأمريكي (USD) وفق سعر الصرف الحالي، وقد يختلف المبلغ النهائي قليلاً عن السعر المعروض بالدرهم.'
        : 'Note: PayPal payments are processed in USD at the current exchange rate; the final charged amount may differ slightly from the MAD price shown.',
  };

  const createBooking = async ({ paymentMethod, paymentStatus, paypalOrderId = '' }) => {
    if (new Date(checkoutDate) <= new Date(checkinDate)) {
      throw new Error(labels.invalidDates);
    }

    const res = await api.post('/bookings', {
      listingId,
      startDate: checkinDate,
      endDate: checkoutDate,
      guests: Number(guestCount || 1),
      paymentMethod,
      paymentStatus,
      paypalOrderId,
    });

    return res.data;
  };

  const handleCheckinChange = (value) => {
    setCheckinDate(value);
    if (new Date(checkoutDate) <= new Date(value)) {
      setCheckoutDate(toDateInputValue(addDays(new Date(value), 1)));
    }
  };

  const handleCashBooking = async () => {
    try {
      setIsCompleting(true);
      setStatus({ type: '', text: '' });
      await createBooking({ paymentMethod: 'cash', paymentStatus: 'pending' });
      showNotification(
        t('checkout.bookingSuccess') || (isRtl ? 'تم تأكيد حجزك بنجاح!' : 'Booking confirmed successfully!'),
        'success'
      );
      navigate('/success');
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        text:
          error?.response?.data?.message ||
          error.message ||
          t('checkout.confirmingError') ||
          'Error confirming booking',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const createPayPalOrder = async () => {
    if (new Date(checkoutDate) <= new Date(checkinDate)) {
      throw new Error(labels.invalidDates);
    }

    const res = await api.post('/orders/create', {
      listingId,
      startDate: checkinDate,
      endDate: checkoutDate,
      guests: Number(guestCount || 1),
    });

    return res.data.id;
  };

  const handlePayPalApprove = async (data) => {
    try {
      setIsCompleting(true);
      setStatus({ type: '', text: '' });
      await api.post('/orders/capture', {
        orderID: data.orderID,
      });
      showNotification(
        t('checkout.bookingSuccess') || (isRtl ? 'تم الدفع وتأكيد حجزك بنجاح!' : 'Payment captured successfully!'),
        'success'
      );
      navigate('/success');
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        text: error?.response?.data?.message || t('checkout.paymentFailed') || 'Payment processing failed',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <main
      className="mx-auto max-w-280 px-4 py-8 sm:px-6 transition-all"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        disabled={isCompleting}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
      >
        <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
        <span>{t('checkout.back') || (isRtl ? 'رجوع' : 'Back')}</span>
      </button>

      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        {t('checkout.title') || (isRtl ? 'تأكيد الحجز والدفع' : 'Confirm and Pay')}
      </h1>

      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        {/* Main Section */}
        <section className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {t('checkout.paymentMethod') || (isRtl ? 'طريقة الدفع' : 'Payment Method')}
          </h2>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('cash')}
              disabled={isCompleting}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition cursor-pointer disabled:opacity-50 ${
                selectedPaymentMethod === 'cash'
                  ? 'border-[#2DB4A0] bg-[#2DB4A0]/10 dark:bg-[#2DB4A0]/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <HandCoins size={22} className="text-[#2DB4A0]" />
              <span className="font-semibold text-gray-900 dark:text-white">{labels.cash}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('paypal')}
              disabled={isCompleting}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition cursor-pointer disabled:opacity-50 ${
                selectedPaymentMethod === 'paypal'
                  ? 'border-[#2DB4A0] bg-[#2DB4A0]/10 dark:bg-[#2DB4A0]/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Wallet size={22} className="text-[#2DB4A0]" />
              <span className="font-semibold text-gray-900 dark:text-white">{labels.paypal}</span>
            </button>
          </div>

          {/* PayPal currency notice */}
          {selectedPaymentMethod === 'paypal' && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs font-medium text-amber-800 dark:text-amber-400">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{labels.paypalCurrencyNotice}</span>
            </div>
          )}

          {/* Dates Input Container */}
          <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="border-e border-gray-200 dark:border-gray-700 p-3">
              <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                {t('checkout.checkIn') || (isRtl ? 'تاريخ الدخول' : 'Check-In')}
              </label>
              <input
                type="date"
                value={checkinDate}
                min={today}
                disabled={isCompleting}
                onChange={(e) => handleCheckinChange(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <div className="p-3">
              <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                {t('checkout.checkOut') || (isRtl ? 'تاريخ المغادرة' : 'Check-Out')}
              </label>
              <input
                type="date"
                value={checkoutDate}
                min={toDateInputValue(addDays(new Date(checkinDate || today), 1))}
                disabled={isCompleting}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {t('checkout.total') || (isRtl ? 'المبلغ الإجمالي' : 'Total')}
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {bookingTotal.toLocaleString()} {symbol}
            </span>
          </div>

          {!isValidBooking && (
            <p className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
              {labels.invalidDates}
            </p>
          )}

          {/* Action Button / PayPal */}
          {selectedPaymentMethod === 'paypal' ? (
            paypalClientId ? (
              <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD' }}>
                <PayPalButtons
                  style={{ layout: 'vertical', shape: 'pill' }}
                  disabled={isCompleting || !isValidBooking}
                  createOrder={createPayPalOrder}
                  onApprove={handlePayPalApprove}
                  onError={(error) => {
                    console.error(error);
                    setStatus({
                      type: 'error',
                      text: t('checkout.paypalFailed') || 'PayPal payment failed',
                    });
                  }}
                />
              </PayPalScriptProvider>
            ) : (
              <p className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm font-semibold text-amber-800 dark:text-amber-400">
                {labels.missingPayPal}
              </p>
            )
          ) : (
            <button
              type="button"
              onClick={handleCashBooking}
              disabled={isCompleting || !isValidBooking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2DB4A0] py-3.5 font-bold text-white transition hover:bg-[#249181] active:scale-98 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {isCompleting && <Loader2 size={18} className="animate-spin" />}
              {isCompleting
                ? t('checkout.confirming') || (isRtl ? 'جاري التأكيد...' : 'Confirming...')
                : t('checkout.confirmBooking') || (isRtl ? 'تأكيد الحجز' : 'Confirm Booking')}
            </button>
          )}

          {status.text && (
            <p
              className={`mt-3 text-sm font-semibold ${
                status.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {status.text}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#2DB4A0]">
            <CheckCircle2 size={17} />
            <span>
              {t('checkout.pressConfirm') || (isRtl ? 'حجزك محمي ومضمون عبر منصتنا' : 'Your booking is safe & secured')}
            </span>
          </div>
        </section>

        {/* Aside Summary Section */}
        <aside className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs h-fit">
          <div className="mb-5 flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
            <img
              src={listingImage ? getImageUrl(listingImage) : '/placeholder-property.jpg'}
              alt={listingTitle || t('checkout.entirePlace')}
              className="h-24 w-24 rounded-2xl object-cover bg-gray-100 dark:bg-gray-800"
            />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('checkout.entirePlace') || (isRtl ? 'مكان إقامة بالكامل' : 'Entire place')}
              </p>
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {listingTitle}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{listingLocation}</p>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
            {t('checkout.priceDetails') || (isRtl ? 'تفاصيل السعر' : 'Price Details')}
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>
                {computedNights} {t('checkout.nights') || (isRtl ? 'ليالي' : 'nights')}
              </span>
              <span>
                {bookingTotal.toLocaleString()} {symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('checkout.guests') || (isRtl ? 'الضيوف' : 'Guests')}</span>
              <span>{guestCount || 1}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('checkout.checkIn') || (isRtl ? 'تاريخ الدخول' : 'Check-In')}</span>
              <span className="font-mono text-xs">{checkinDate}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('checkout.checkOut') || (isRtl ? 'تاريخ المغادرة' : 'Check-Out')}</span>
              <span className="font-mono text-xs">{checkoutDate}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-gray-100 dark:border-gray-800 pt-3 text-base font-bold text-gray-900 dark:text-white">
              <span>{t('checkout.finalTotal') || (isRtl ? 'المبلغ النهائي' : 'Final Total')}</span>
              <span>
                {bookingTotal.toLocaleString()} {symbol}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default CheckoutPage;