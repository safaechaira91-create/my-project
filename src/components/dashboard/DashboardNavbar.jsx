import { useMemo } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

const DashboardNavbar = ({ user, unreadCount, onOpenSidebar }) => {
  const { t, isRtl } = useTranslation();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(isRtl ? 'ar-MA' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [isRtl]
  );

  const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'G';

  return (
    <header
      className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 md:hidden"
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-xs font-medium text-gray-500">{today}</p>
            <h1 className="text-lg font-bold text-gray-900">
              {t('dashboard.welcomeBack', { name: firstName })}
            </h1>
          </div>
        </div>

        <div className="hidden w-full max-w-sm items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 md:flex">
          <Search size={16} className="text-gray-400" />
          <input
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            type="search"
            placeholder={t('dashboard.searchPlaceholder')}
          />
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="relative rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-amber-50 text-amber-700 font-bold">
            {user?.image ? (
              <img
                loading="lazy"
                decoding="async"
                src={user.image}
                alt={user?.name || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;