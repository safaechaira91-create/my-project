import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAppContext } from '../context/AppContext';

const MainLayout = () => {
  const { language, currency, isRtl, notification, setNotification } = useAppContext();
  const { pathname } = useLocation();

  // Reset scroll position on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notification?.show) return;

    const timer = setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification?.show, setNotification]);

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased"
    >
      {/* Global Notification Banner */}
      {notification?.show && (
        <div
          className={`fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-4 rounded-xl px-5 py-3 shadow-xl transition-all duration-300 ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
          role="alert"
        >
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification((prev) => ({ ...prev, show: false }))}
            className="rounded-lg p-1 transition-colors hover:bg-white/20"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer language={language} currency={currency} />
    </div>
  );
};

export default MainLayout;