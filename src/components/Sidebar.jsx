import { useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Bell,
  Home,
  LayoutDashboard,
  User,
  PlusSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const Sidebar = () => {
  const { user } = useAuth();
  const { t, isRtl } = useTranslation();

  // Normalize single role string or roles array safely
  const isHostOrAdmin = useMemo(() => {
    const roles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toLowerCase())
      : [String(user?.role || '').toLowerCase()];

    return roles.some((r) => ['host', 'admin'].includes(r));
  }, [user]);

  const commonLinks = useMemo(
    () => [
      {
        to: '/profile',
        icon: User,
        label: t('sidebar.profile'),
      },
      {
        to: '/notifications',
        icon: Bell,
        label: t('sidebar.notifications'),
      },
    ],
    [t]
  );

  const hostLinks = useMemo(
    () => [
      {
        to: '/dashboard',
        icon: LayoutDashboard,
        label: t('sidebar.home'),
        exact: true,
      },
      {
        to: '/host-bookings',
        icon: Calendar,
        label: t('sidebar.bookings'),
      },
      {
        to: '/listings?mine=1',
        icon: Home,
        label: t('sidebar.listings'),
      },
      {
        to: '/add-property',
        icon: PlusSquare,
        label: t('dashboard.quickActions.addProperty'),
      },
    ],
    [t]
  );

  const linkClass = useCallback(
    ({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-[#2b9a84] text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`,
    []
  );

  return (
    <aside
      dir={isRtl ? 'rtl' : 'ltr'}
      className="sticky top-0 hidden h-screen w-64 flex-col border-e border-gray-200 bg-white lg:flex"
    >
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        <div className="space-y-1">
          {commonLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>

        {isHostOrAdmin && (
          <div className="mt-6 space-y-1 border-t border-gray-100 pt-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('sidebar.listings')}
            </p>

            {hostLinks.map(({ to, icon: Icon, label, exact }) => (
              <NavLink key={to} to={to} end={exact} className={linkClass}>
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;