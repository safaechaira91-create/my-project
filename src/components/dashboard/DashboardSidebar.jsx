import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

const DashboardSidebar = ({ open, onClose, onLogout }) => {
  const { t, isRtl } = useTranslation();

  const items = [
    { to: '/dashboard', label: t('dashboardSidebar.home'), icon: LayoutDashboard },
    { to: '/listings?mine=1', label: t('dashboardSidebar.listings'), icon: Building2 },
    { to: '/my-bookings', label: t('dashboardSidebar.bookings'), icon: CalendarDays },
    { to: '/messages', label: t('dashboardSidebar.messages'), icon: MessageSquare },
    { to: '/profile', label: t('dashboardSidebar.settings'), icon: Settings },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/35 transition md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="button"
        aria-label={t('dashboardSidebar.close')}
        onClick={onClose}
      />
      <aside
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`fixed ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} top-0 z-50 flex h-screen w-72 flex-col justify-between border-gray-200 bg-white p-4 shadow-xl transition-transform md:sticky md:z-20 md:translate-x-0 md:shadow-none ${
          open ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div>
          <Link to="/" className="mb-6 flex items-center gap-2 rounded-xl px-2 py-2 text-[#2DB4A0]">
            <div className="h-8 w-8 rounded-lg bg-[#2DB4A0]" aria-hidden="true" />
            <span className="text-xl font-black">MyDar</span>
          </Link>

          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#2DB4A0] text-white'
                      : 'text-gray-700 hover:bg-[#2DB4A0]/10 hover:text-[#2DB4A0]'
                  }`
                }
                onClick={onClose}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
        >
          <LogOut size={18} />
          {t('dashboardSidebar.logout')}
        </button>
      </aside>
    </>
  );
};

export default DashboardSidebar;