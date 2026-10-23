import { useEffect, useState } from 'react';
import { 
  Pie, 
  PieChart, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Legend 
} from 'recharts';
import adminService from '../../services/adminService';
import Skeleton from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';

const COLORS = ['#2DB4A0', '#f97316', '#22c55e', '#fb7185', '#3b82f6'];

const AdminAnalyticsPage = () => {
  const { t, isRtl } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    adminService
      .getStats()
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        console.error('Failed to load admin analytics:', err);
        if (isMounted) setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton className="h-100 rounded-2xl" />
        <Skeleton className="h-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500" dir={isRtl ? 'rtl' : 'ltr'}>
        {error 
          ? (t('admin.analyticsLoadError') || (isRtl ? 'حدث خطأ أثناء تحميل البيانات التحليلية.' : 'Failed to load analytics data.'))
          : (t('admin.noAnalyticsData') || (isRtl ? 'لا توجد بيانات تحليلية متاحة حالياً.' : 'No analytics data available.'))
        }
      </div>
    );
  }

  const topCities = data?.topCities || [];
  const topProperties = data?.topProperties || [];

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Cities - Pie Chart */}
      <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">
          {t('admin.topCities') || (isRtl ? 'أعلى المدن حجزاً' : 'Top Cities')}
        </h3>
        <div className="h-80 min-w-0">
          {topCities.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              {isRtl ? 'لا توجد بيانات للمدن' : 'No city data'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={topCities}
                  dataKey="count"
                  nameKey="city"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {topCities.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, isRtl ? 'عدد الحجوزات' : 'Count']}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Properties - Bar Chart */}
      <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">
          {t('admin.topProperties') || (isRtl ? 'العقارات الأكثر أداءً' : 'Top Properties')}
        </h3>
        <div className="h-80 min-w-0">
          {topProperties.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              {isRtl ? 'لا توجد بيانات للعقارات' : 'No property data'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={topProperties} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="title" hide />
                <YAxis tickLine={false} orientation={isRtl ? 'right' : 'left'} />
                <Tooltip 
                  cursor={{ fill: 'rgba(45, 180, 160, 0.05)' }}
                  labelFormatter={(label) => `${isRtl ? 'العقار' : 'Property'}: ${label}`}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar 
                  name={isRtl ? 'الحجوزات' : 'Bookings'} 
                  dataKey="bookings" 
                  fill="#2DB4A0" 
                  radius={[6, 6, 0, 0]} 
                />
                <Bar 
                  name={isRtl ? 'الأرباح (MAD)' : 'Revenue (MAD)'} 
                  dataKey="revenue" 
                  fill="#f97316" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;