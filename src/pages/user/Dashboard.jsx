import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { CalendarCheck2, Clock3, Home, Wallet, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import bookingService from '../../services/bookingService';
import propertyService from '../../services/propertyService';
import api from '../../services/api';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import { useTranslation } from '../../hooks/useTranslation';

// Lazy load heavy dashboard components
const StatsCards = lazy(() => import('../../components/dashboard/StatsCards'));
const RevenueChart = lazy(() => import('../../components/dashboard/RevenueChart'));
const BookingsTable = lazy(() => import('../../components/dashboard/BookingsTable'));
const ListingsGrid = lazy(() => import('../../components/dashboard/ListingsGrid'));
const NotificationsPanel = lazy(() => import('../../components/dashboard/NotificationsPanel'));

const getMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const Dashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { isRtl } = useAppContext();
  const { t } = useTranslation();
  const isHost = user?.role === 'host' || user?.role === 'admin';
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (authLoading) return;
    setLoading(true);
    setError('');
    try {
      if (user) {
        const [bookingsRes, notificationsRes] = await Promise.all([
          bookingService.getMyBookings().catch(() => []),
          api.get('/notifications').then((r) => r.data).catch(() => []),
        ]);
        setBookings(Array.isArray(bookingsRes) ? bookingsRes : bookingsRes?.bookings || []);
        setNotifications(Array.isArray(notificationsRes) ? notificationsRes : notificationsRes?.notifications || []);
      }

      if (isHost) {
        const myListings = await propertyService.getMyProperties().catch(() => []);
        const rows = Array.isArray(myListings) ? myListings : myListings?.listings || [];
        setListings(rows);
      } else {
        setListings([]);
      }
    } catch {
      setError(t('dashboard.loadError') || (isRtl ? 'حدث خطأ في تحميل البيانات' : 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role !== 'host' && user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    loadData();
  }, [user, isHost, authLoading]);

  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings
      .filter((b) => new Date(b.startDate) >= today)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [bookings]);

  const totalEarnings = useMemo(() => {
    return bookings
      .filter((b) => ['confirmed', 'completed'].includes(b.status))
      .reduce((acc, b) => acc + Number(b.totalPrice || b.total || 0), 0);
  }, [bookings]);

  const monthlyData = useMemo(() => {
    const seed = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = getMonthKey(d);
      seed.set(key, { month: key, revenue: 0, bookings: 0, visitors: 0 });
    }

    bookings.forEach((b) => {
      const key = getMonthKey(b.createdAt || b.startDate);
      if (!seed.has(key)) return;
      const row = seed.get(key);
      row.bookings += 1;
      if (['confirmed', 'completed'].includes(b.status)) {
        row.revenue += Number(b.totalPrice || b.total || 0);
      }
      seed.set(key, row);
    });

    listings.forEach((l) => {
      const key = getMonthKey(l.createdAt);
      if (!seed.has(key)) return;
      const row = seed.get(key);
      row.visitors += 8;
      seed.set(key, row);
    });

    return Array.from(seed.values());
  }, [bookings, listings]);

  const stats = [
    {
      label: t('dashboard.stats.totalBookings') || (isRtl ? 'إجمالي الحجوزات' : 'Total Bookings'),
      value: bookings.length,
      growth: 12,
      icon: CalendarCheck2,
      iconBg: 'bg-[#2DB4A0]/10',
      iconColor: 'text-[#2DB4A0]',
    },
    {
      label: t('dashboard.stats.totalEarnings') || (isRtl ? 'إجمالي الأرباح' : 'Total Earnings'),
      value: totalEarnings,
      growth: 9,
      icon: Wallet,
      iconBg: 'bg-orange-100 dark:bg-orange-950/40',
      iconColor: 'text-[#f97316]',
    },
    {
      label: t('dashboard.stats.activeListings') || (isRtl ? 'العقارات النشطة' : 'Active Listings'),
      value: listings.length,
      growth: 4,
      icon: Home,
      iconBg: 'bg-blue-100 dark:bg-blue-950/40',
      iconColor: 'text-blue-600',
    },
    {
      label: t('dashboard.stats.pendingReservations') || (isRtl ? 'طلبات معلقة' : 'Pending Requests'),
      value: bookings.filter((b) => b.status === 'pending').length,
      growth: 0,
      icon: Clock3,
      iconBg: 'bg-amber-100 dark:bg-amber-950/40',
      iconColor: 'text-amber-600',
    },
  ];

  const quickActions = [
    { label: t('dashboard.quickActions.addProperty') || (isRtl ? 'إضافة عقار' : 'Add Property'), to: '/add-property' },
    { label: t('dashboard.quickActions.manageListings') || (isRtl ? 'إدارة العقارات' : 'Manage Listings'), to: '/host-dashboard' },
    { label: t('dashboard.quickActions.messages') || (isRtl ? 'الرسائل' : 'Messages'), to: '/messages' },
    { label: t('dashboard.quickActions.calendar') || (isRtl ? 'التقويم' : 'Calendar'), to: '/my-bookings' },
    { label: t('dashboard.quickActions.earnings') || (isRtl ? 'الأرباح' : 'Earnings'), to: '/dashboard' },
  ];

  const handleDeleteListing = async (id) => {
    try {
      await propertyService.deleteProperty(id);
      setListings((prev) => prev.filter((l) => (l._id || l.id) !== id));
    } catch {
      setError(t('dashboard.deleteListingError') || (isRtl ? 'فشل حذف العقار' : 'Failed to delete listing'));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userAvatar = user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2DB4A0&color=fff`;

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950 dark:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto relative flex max-w-[1600px]">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-4xl border border-gray-100 bg-white p-6 md:p-8 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-4 md:gap-6">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
              >
                <Menu size={24} />
              </button>
              <div className="relative">
                <img src={userAvatar} className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover ring-4 ring-[#2DB4A0]/20" alt={user?.name || 'avatar'} />
                <div className="absolute bottom-1 right-1 h-4 w-4 md:h-5 md:w-5 rounded-full border-2 md:border-4 border-white bg-green-500 dark:border-gray-900" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                  {t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] || 'User' }) || (isRtl ? `مرحباً، ${user?.name?.split(' ')[0] || ''}` : `Welcome, ${user?.name?.split(' ')[0] || ''}`)}
                </h1>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                  {t('dashboard.subtitle') || (isRtl ? 'نظرة عامة على أدائك وعقاراتك اليوم' : 'Overview of your performance and properties today')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => navigate('/add-property')}
                className="w-full md:w-auto text-center rounded-2xl bg-[#2DB4A0] px-6 py-3 font-bold text-white shadow-lg shadow-[#2DB4A0]/20 transition-all hover:bg-[#249181] hover:scale-105 cursor-pointer"
              >
                {t('dashboard.quickActions.addProperty') || (isRtl ? '+ إضافة عقار جديد' : '+ Add New Property')}
              </button>
            </div>
          </header>

          <main className="space-y-6">
            <div className="mb-6 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  type="button"
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 transition hover:border-[#2DB4A0] hover:text-[#2DB4A0] dark:hover:border-[#2DB4A0] cursor-pointer"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm font-semibold text-rose-700 dark:text-rose-400">
                {error}
              </div>
            )}

            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    ))}
                  </div>
                  <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>
              }
            >
              <StatsCards stats={stats} />
              <RevenueChart revenueData={monthlyData} bookingData={monthlyData} visitorsData={monthlyData} />

              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <BookingsTable bookings={bookings.slice(0, 8)} loading={loading} />
                  <ListingsGrid listings={listings} loading={loading} onDelete={handleDeleteListing} />
                </div>
                <div className="lg:col-span-1">
                  <NotificationsPanel notifications={notifications} upcoming={upcomingBookings} />
                </div>
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;