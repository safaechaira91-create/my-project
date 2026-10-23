import { Bell, CalendarDays, MessageCircle, Clock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const NotificationsPanel = ({ notifications, upcoming }) => {
  const { t, isRtl } = useTranslation();

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الإشعارات */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Bell size={16} className="text-[#2DB4A0]" />
          {t('dashboardNotifications.notifications')}
        </h3>
        <div className="space-y-2">
          {!notifications || notifications.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardNotifications.noNotifications')}</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className="flex items-start justify-between gap-2 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {n.message || t('dashboardNotifications.newUpdate')}
                  </p>
                  {(n.createdAt || n.date) && (
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={12} />
                      {formatDate(n.createdAt || n.date)}
                    </span>
                  )}
                </div>
                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-[#f97316]" title="Unread" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* الحجوزات القادمة */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
          <CalendarDays size={16} className="text-[#2DB4A0]" />
          {t('dashboardNotifications.upcomingReservations')}
        </h3>
        <div className="space-y-2">
          {!upcoming || upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('dashboardNotifications.noUpcomingReservations')}
            </p>
          ) : (
            upcoming.map((b) => (
              <div
                key={b._id}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-3"
              >
                <p className="truncate text-sm font-semibold text-gray-800">
                  {b.listing?.title || t('dashboardNotifications.property')}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(b.startDate)} - {formatDate(b.endDate)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* التنبيهات والنصائح */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
          <MessageCircle size={16} className="text-[#2DB4A0]" />
          {t('dashboardNotifications.alerts')}
        </h3>
        <ul className="space-y-2 text-xs font-medium text-gray-700">
          <li className="rounded-xl bg-[#2DB4A0]/10 p-2.5 text-[#1e7a6d]">
            {t('dashboardNotifications.newBookingActivity')}
          </li>
          <li className="rounded-xl bg-amber-50 p-2.5 text-amber-800">
            {t('dashboardNotifications.checkPendingReservations')}
          </li>
          <li className="rounded-xl bg-gray-100 p-2.5 text-gray-700">
            {t('dashboardNotifications.keepCalendarUpdated')}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationsPanel;