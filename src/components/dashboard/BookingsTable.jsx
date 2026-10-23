import { useTranslation } from '../../hooks/useTranslation';

const statusClass = {
  confirmed: 'bg-green-50 text-green-700',
  approved: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
  rejected: 'bg-red-50 text-red-700',
  completed: 'bg-blue-50 text-blue-700',
};

const BookingsTable = ({ bookings, loading }) => {
  const { t, isRtl } = useTranslation();

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const d = new Date(dateValue);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
        {t('bookingsTable.loading')}
      </div>
    );
  }

  if (!bookings?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        {t('bookingsTable.empty')}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-bold text-gray-800">{t('bookingsTable.recent')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead
            className={`bg-gray-50 text-xs uppercase tracking-wide text-gray-500 ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            <tr>
              <th className="px-5 py-3">{t('bookingsTable.guest')}</th>
              <th className="px-5 py-3">{t('bookingsTable.property')}</th>
              <th className="px-5 py-3">{t('bookingsTable.checkIn')}</th>
              <th className="px-5 py-3">{t('bookingsTable.checkOut')}</th>
              <th className="px-5 py-3">{t('bookingsTable.amount')}</th>
              <th className="px-5 py-3">{t('bookingsTable.status')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      loading="lazy"
                      src={
                        b.user?.image ||
                        'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                      }
                      alt={b.user?.name || t('bookingsTable.guest')}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="font-semibold text-gray-800">
                      {b.user?.name || t('bookingsTable.guest')}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {b.listing?.title || t('bookingsTable.property')}
                </td>
                <td className="px-5 py-3 text-gray-700">{formatDate(b.startDate)}</td>
                <td className="px-5 py-3 text-gray-700">{formatDate(b.endDate)}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">
                  {Number(b.totalPrice || 0).toLocaleString()} DH
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusClass[b.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {t(`bookingsTable.${b.status}`) || b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsTable;