import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';

const AdminLayout = () => {
  const { user, logout, loading } = useAuth();
  const { unreadCount, isRtl } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('admin_dark_mode') === 'true';
  });

  // إغلاق الـ Sidebar تلقائياً عند تغيير الصفحة فـ Mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // التحكم فـ Dark Mode
  useEffect(() => {
    localStorage.setItem('admin_dark_mode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // الاستمرار في التنقل حتى لو فشل الطلب
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // حماية المسار: السماح فقط للمسؤولين (Admins)
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'dark bg-gray-950 text-white' : 'bg-[#f8faf9] text-gray-900'
      }`}
    >
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <AdminSidebar
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminNavbar
            user={user}
            search={search}
            onSearch={setSearch}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            unreadCount={unreadCount}
            onToggleSidebar={handleToggleSidebar}
          />

          <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
            <Outlet context={{ globalSearch: search, darkMode }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;