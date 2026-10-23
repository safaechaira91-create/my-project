﻿﻿import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bell, Trash2, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { arMA, enUS } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NotificationsPage = ({ language = 'ar' }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { showNotification, refreshUnreadCount } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const isRtl = language === 'ar';

  const fetchNotifications = useCallback(async (targetPage = 1) => {
    if (authLoading) return;
    if (!authUser?.uid && !authUser?._id) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/notifications', { params: { page: targetPage, limit: 20 } });
      const data = response.data;
      // Backward-compatible: supports both the paginated shape { notifications, page, pages }
      // and a plain array, in case an older cached frontend build is still in use.
      const rows = Array.isArray(data) ? data : data?.notifications || [];
      setNotifications(rows);
      setPage(data?.page || 1);
      setPages(data?.pages || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser?._id, authUser?.uid, authLoading]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUnreadCount();
      if (showNotification) {
        showNotification(isRtl ? 'تم تحديد الكل كمقروء' : 'All marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      setNotifications((prev) => prev.map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n)));
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
      refreshUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#2DB4A0]" size={40} />
      </div>
    );
  }

  if (!authUser) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-28 pb-10 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 shadow-xs">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isRtl ? 'يرجى تسجيل الدخول لعرض الإشعارات' : 'Please log in to view notifications'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-2xl min-h-screen p-6 pt-28 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-extrabold text-gray-900 dark:text-white">
          <Bell className="text-[#2DB4A0]" />
          <span>{isRtl ? 'الإشعارات' : 'Notifications'}</span>
        </h1>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm font-bold text-[#2DB4A0] hover:underline cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>{isRtl ? 'تحديد الكل كمقروء' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-20 text-center font-medium text-gray-400 dark:text-gray-500">
            {isRtl ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
          </div>
        ) : (
          notifications.map((n) => {
            const notifId = n._id || n.id;
            const isRead = n.read;

            return (
              <div
                key={notifId}
                onClick={() => !isRead && markAsRead(notifId)}
                className={`rounded-2xl border p-5 transition-all duration-300 ${
                  !isRead ? 'cursor-pointer' : ''
                } ${
                  isRead
                    ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                    : 'border-[#2DB4A0]/30 bg-[#2DB4A0]/5 dark:bg-[#2DB4A0]/10 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 text-start">
                    {n.senderName && (
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{n.senderName}</p>
                    )}
                    <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{n.message}</p>
                    {n.createdAt && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                        <Clock size={13} />
                        <span>
                          {format(new Date(n.createdAt), 'd MMMM yyyy, HH:mm', {
                            locale: isRtl ? arMA : enUS,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notifId);
                    }}
                    className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition cursor-pointer"
                    title={isRtl ? 'حذف الإشعار' : 'Delete notification'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => fetchNotifications(p)}
                className={`h-8 w-8 rounded-full text-sm font-semibold transition ${
                  p === page
                    ? 'bg-[#2DB4A0] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;