﻿import { useEffect, useMemo, useState } from 'react';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  Legend 
} from 'recharts';
import adminService from '../../services/adminService';
import { useTranslation } from '../../hooks/useTranslation';
import Skeleton from '../../components/Skeleton';

const StatCard = ({ label, value, loading }) => (
  <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-all">
    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
    {loading ? (
      <Skeleton className="mt-3 h-9 w-24 rounded-lg" />
    ) : (
      <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{value}</p>
    )}
    <div className="mt-4 h-1 w-12 bg-[#2DB4A0] rounded-full"></div>
  </div>
);

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, isRtl } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    adminService
      .getStats()
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard stats:', err);
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totals = data?.totals || {};
  const chartData = useMemo(() => data?.charts || [], [data]);
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard 
          label={t('admin.users') || (isRtl ? 'المستخدمون' : 'Users')} 
          value={totals.totalUsers || 0} 
          loading={loading}
        />
        <StatCard 
          label={t('admin.hosts') || (isRtl ? 'المضيفون' : 'Hosts')} 
          value={totals.totalHosts || 0} 
          loading={loading}
        />
        <StatCard 
          label={t('admin.bookings') || (isRtl ? 'الحجوزات' : 'Bookings')} 
          value={totals.totalBookings || 0} 
          loading={loading}
        />
        <StatCard 
          label={t('admin.listings') || (isRtl ? 'العقارات' : 'Listings')} 
          value={totals.totalProperties || 0} 
          loading={loading}
        />
        <StatCard 
          label={t('admin.totalRevenue') || (isRtl ? 'إجمالي الأرباح' : 'Total Revenue')} 
          value={`${(totals.totalRevenue || 0).toLocaleString()} DH`} 
          loading={loading}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <div className="min-w-0 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            {t('admin.monthlyRevenue') || (isRtl ? 'الإيرادات الشهرية' : 'Monthly Revenue')}
          </h3>
          <div className="h-72 min-w-0">
            {loading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                {isRtl ? 'لا توجد بيانات متاحة' : 'No revenue data'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DB4A0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2DB4A0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                  <XAxis dataKey="month" tickLine={false} stroke="#9CA3AF" />
                  <YAxis tickLine={false} stroke="#9CA3AF" orientation={isRtl ? 'right' : 'left'} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value.toLocaleString()} DH`, isRtl ? 'الإيرادات' : 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2DB4A0" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bookings & Users Growth Chart */}
        <div className="min-w-0 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            {t('admin.bookingsGrowth') || (isRtl ? 'نمو الحجوزات والمستخدمين' : 'Bookings Growth')}
          </h3>
          <div className="h-72 min-w-0">
            {loading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                {isRtl ? 'لا توجد بيانات متاحة' : 'No growth data'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                  <XAxis dataKey="month" tickLine={false} stroke="#9CA3AF" />
                  <YAxis tickLine={false} stroke="#9CA3AF" orientation={isRtl ? 'right' : 'left'} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    name={isRtl ? 'الحجوزات' : 'Bookings'} 
                    dataKey="bookings" 
                    fill="#2DB4A0" 
                    radius={[6, 6, 0, 0]} 
                  />
                  <Bar 
                    name={isRtl ? 'المستخدمين الجدد' : 'New Users'} 
                    dataKey="users" 
                    fill="#f97316" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          {t('admin.recentActivity') || (isRtl ? 'الأنشطة الأخيرة' : 'Recent Activity')}
        </h3>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))
          ) : recentActivity.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {isRtl ? 'لا يوجد نشاط حديث حتى الآن' : 'No recent activity found.'}
            </p>
          ) : (
            recentActivity.map((a) => (
              <div 
                key={a.id || a._id} 
                className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-4 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <p className="font-semibold text-gray-800 dark:text-gray-200">{a.text}</p>
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500" dir="ltr">
                  {new Date(a.at).toLocaleString(isRtl ? 'ar-MA' : 'en-US', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;