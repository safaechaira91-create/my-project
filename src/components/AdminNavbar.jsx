import React from 'react';
import { Bell, Menu, Moon, Search, Sun, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const AdminNavbar = ({
  darkMode,
  onToggleDarkMode,
  search = '',
  onSearch,
  user,
  unreadCount = 0,
  onToggleSidebar,
}) => {
  const { t, isRtl } = useTranslation();

  return (
    <header
      className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur transition-colors dark:border-gray-800 dark:bg-gray-900/95 dark:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex flex-1 items-center gap-3">
          {/* Hamburger menu - opens the mobile sidebar drawer */}
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={t('common.openMenu') || 'Open menu'}
            className="rounded-xl border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 md:hidden"
          >
            <Menu size={18} />
          </button>

          {/* شريط البحث */}
          <div className="relative w-full max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-3 start-3 text-gray-400"
              size={16}
            />
            <input
              autoComplete="off"
              type="search"
              value={search}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={t('common.search') || 'بحث...'}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 ps-9 pe-3 text-sm text-gray-900 outline-none transition focus:border-[#2DB4A0] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* عناصر التحكم والبروفايل */}
        <div className="flex items-center gap-3">
          {/* زر تبديل الوضع الليلي */}
          <button
            type="button"
            aria-label={
              darkMode
                ? t('common.lightMode') || 'Light mode'
                : t('common.darkMode') || 'Dark mode'
            }
            onClick={onToggleDarkMode}
            className="rounded-xl border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {darkMode ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {/* زر الإشعارات - يودي للإشعارات الشخصية ديال الأدمن */}
          <Link
            to="/notifications"
            aria-label={t('common.notifications') || 'Notifications'}
            className="relative rounded-xl border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* معلومات المدير */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 dark:border-gray-700">
            {user?.image ? (
              <img
                loading="lazy"
                src={user.image}
                alt={user?.name || 'Admin'}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <UserCircle2 size={22} className="text-[#2DB4A0]" />
            )}
            <div className="hidden text-xs md:block">
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {user?.name || t('common.adminUser')}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;