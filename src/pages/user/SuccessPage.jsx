import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Calendar, Home } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const SuccessPage = () => {
  const { t, isRtl } = useTranslation();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <main 
      className="mx-auto flex min-h-[72vh] max-w-225 items-center justify-center px-4 py-10"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <section className="w-full rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#2DB4A0]/10">
          <CheckCircle2 size={56} className="text-[#2DB4A0]" />
        </div>

        <h1 className="mb-2 text-3xl font-semibold text-airbnb-dark">
          {t('success.title', 'تم تأكيد الحجز بنجاح')}
        </h1>

        <p className="mx-auto mb-6 max-w-md text-gray-600">
          {t('success.description', 'شكرا لاختيارك MyDar. تم تسجيل الحجز بنجاح ويمكنك متابعة التفاصيل من صفحة حجوزاتي.')}
        </p>

        {bookingId && (
          <div className="mx-auto mb-8 inline-block rounded-xl bg-gray-50 px-4 py-2 text-xs font-mono text-gray-500 border border-gray-200">
            {t('success.bookingReference', 'رقم المرجع')}: {bookingId}
          </div>
        )}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/my-bookings"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2DB4A0] px-7 py-3 font-bold text-white transition hover:bg-[#249181]"
          >
            <Calendar size={18} />
            {t('success.viewBookings', 'عرض حجوزاتي')}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-7 py-3 font-bold text-airbnb-dark transition hover:bg-gray-50"
          >
            <Home size={18} />
            {t('success.backToHome', 'الرجوع للرئيسية')}
          </Link>
        </div>
      </section>
    </main>
  );
};

export default SuccessPage;