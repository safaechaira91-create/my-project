import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  BadgeDollarSign,
  MessageSquare,
  LifeBuoy,
  Bell,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const AdminSidebar = ({ onLogout, isOpen = false, onClose }) => {
  const { t, isRtl } = useTranslation();

  const items = useMemo(
    () => [
      { to: '/admin', icon: LayoutDashboard, label: t('admin.dashboard') },
      { to: '/admin/users', icon: Users, label: t('admin.users') },
      { to: '/admin/listings', icon: Building2, label: t('admin.listings') },
      { to: '/admin/bookings', icon: CalendarCheck2, label: t('admin.bookings') },
      { to: '/admin/analytics', icon: BadgeDollarSign, label: t('admin.analytics') },
      { to: '/admin/messages', icon: MessageSquare, label: t('admin.messages') },
      { to: '/admin/support-requests', icon: LifeBuoy, label: t('navbar.supportRequests') },
      { to: '/admin/notifications', icon: Bell, label: t('admin.notifications') },
      { to: '/admin/settings', icon: Settings, label: t('admin.settings') },
    ],
    [t]
  );

  const sidebarContent = (
    <>
      <div>
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-2xl font-black text-[#2DB4A0]">
            {t('admin.brand') || 'MyDar Admin'}
          </h2>
          {/* Close button - only relevant/visible on mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close') || 'Close'}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#2DB4A0] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#f4faf7] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-[#2DB4A0]'
                }`
              }
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 pb-6">
        <button
          type="button"
          aria-label={t('common.logout')}
          onClick={() => onLogout?.()}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#f97316] transition hover:bg-orange-50 dark:hover:bg-orange-950/20"
        >
          <LogOut size={18} aria-hidden="true" />
          {t('common.logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: always-visible static sidebar */}
      <aside
        className="sticky top-0 hidden min-h-screen w-72 flex-col justify-between border-e border-gray-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900 md:flex"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {sidebarContent}
      </aside>

      {/* Mobile: overlay backdrop + slide-in drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="button"
        aria-label={t('common.close') || 'Close menu'}
        onClick={onClose}
      />
      <aside
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`fixed ${isRtl ? 'right-0' : 'left-0'} top-0 z-50 flex h-screen w-72 flex-col justify-between bg-white shadow-xl transition-transform dark:bg-gray-900 md:hidden ${
          isOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;