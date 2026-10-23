import { useTranslation } from '../../hooks/useTranslation';

const RevenueChart = ({ revenueData, bookingStats, visitorsData }) => {
  const { t, isRtl } = useTranslation();

  // بيانات افتراضية فـ حالة ما دوزتيش props
  const defaultMonthly = revenueData || [
    { month: 'Jan', amount: 4200 },
    { month: 'Feb', amount: 6800 },
    { month: 'Mar', amount: 5100 },
    { month: 'Apr', amount: 9400 },
    { month: 'May', amount: 8200 },
    { month: 'Jun', amount: 11500 },
  ];

  const maxRevenue = Math.max(...defaultMonthly.map((d) => d.amount), 1);

  const defaultStats = bookingStats || {
    confirmed: 65,
    pending: 25,
    cancelled: 10,
  };

  const defaultVisitors = visitorsData || [
    { day: 'Mon', count: 120 },
    { day: 'Tue', count: 210 },
    { day: 'Wed', count: 180 },
    { day: 'Thu', count: 310 },
    { day: 'Fri', count: 290 },
    { day: 'Sat', count: 450 },
    { day: 'Sun', count: 380 },
  ];

  const maxVisitors = Math.max(...defaultVisitors.map((v) => v.count), 1);

  return (
    <div className="grid gap-6 lg:grid-cols-3" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Monthly Revenue Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">
            {t('dashboardCharts.monthlyRevenue')}
          </h3>
          <span className="text-xs font-semibold text-[#2DB4A0]">
            {defaultMonthly.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} DH
          </span>
        </div>
        <div className="flex h-40 items-end gap-2 rounded-xl bg-gray-50 p-4">
          {defaultMonthly.map((item, idx) => {
            const heightPercent = Math.round((item.amount / maxRevenue) * 100);
            return (
              <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                {/* Tooltip */}
                <span className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block z-10 whitespace-nowrap">
                  {item.amount.toLocaleString()} DH
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full rounded-t-md bg-[#2DB4A0] transition-all duration-300 group-hover:bg-[#249181]"
                />
                <span className="mt-2 text-[10px] font-medium text-gray-500">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Booking Analytics Status */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-800">
          {t('dashboardCharts.bookingAnalytics')}
        </h3>
        <div className="flex h-40 flex-col justify-center gap-3 rounded-xl bg-gray-50 p-4">
          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-green-700">{t('dashboard.confirmed') || 'Confirmed'}</span>
              <span className="text-gray-700">{defaultStats.confirmed}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${defaultStats.confirmed}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-amber-700">{t('dashboard.pending') || 'Pending'}</span>
              <span className="text-gray-700">{defaultStats.pending}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${defaultStats.pending}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-red-700">{t('dashboard.cancelled') || 'Cancelled'}</span>
              <span className="text-gray-700">{defaultStats.cancelled}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${defaultStats.cancelled}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visitors Trend */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-800">
          {t('dashboardCharts.visitorsTrend')}
        </h3>
        <div className="flex h-40 items-end gap-1.5 rounded-xl bg-gray-50 p-4">
          {defaultVisitors.map((item, idx) => {
            const heightPercent = Math.round((item.count / maxVisitors) * 100);
            return (
              <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                <span className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block z-10">
                  {item.count}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full rounded-t bg-orange-400 opacity-80 transition-all duration-300 group-hover:opacity-100"
                />
                <span className="mt-2 text-[10px] font-medium text-gray-500">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;