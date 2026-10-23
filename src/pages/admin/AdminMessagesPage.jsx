import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import adminService from '../../services/adminService';
import Skeleton from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/errorMessage';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
};

const AdminMessagesPage = () => {
  const { t, isRtl } = useTranslation();
  const location = useLocation();
  const supportMode = location.pathname.includes('/support');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const type = supportMode ? 'support' : 'all';

  const statusLabels = {
    pending: isRtl ? 'قيد الانتظار' : 'Pending',
    resolved: isRtl ? 'تم الحل' : 'Resolved',
    approved: isRtl ? 'مقبول' : 'Approved',
    rejected: isRtl ? 'مرفوض' : 'Rejected',
  };

  const typeLabels = {
    'host-upgrade': isRtl ? 'طلب مضيف' : 'Host Upgrade',
    support: isRtl ? 'دعم فني' : 'Support',
    contact: isRtl ? 'استفسار' : 'Contact',
  };

  const loadMessages = () => {
    setLoading(true);
    setErrorMessage('');
    adminService
      .getMessages({ type })
      .then((data) => setRows(data || []))
      .catch((err) => {
        console.error('Failed to load messages:', err);
        setErrorMessage(getErrorMessage(err, isRtl ? 'تعذر تحميل الرسائل.' : 'Failed to load messages.'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, [type]);

  const handleHostRequest = async (id, status) => {
    setActionId(id);
    try {
      await adminService.updateHostRequest(id, { status });
      await loadMessages();
    } catch (err) {
      console.error('Failed to update host request status:', err);
      setErrorMessage(getErrorMessage(err, isRtl ? 'تعذر تحديث طلب المضيف.' : 'Failed to update host request.'));
    } finally {
      setActionId(null);
    }
  };

  const handleReplyAndResolve = async (id) => {
    const text = replyText[id] || '';
    setActionId(id);
    try {
      await adminService.updateMessage(id, { adminReply: text, status: 'resolved' });
      setReplyText((prev) => ({ ...prev, [id]: '' }));
      await loadMessages();
    } catch (err) {
      console.error('Failed to resolve message:', err);
      setErrorMessage(getErrorMessage(err, isRtl ? 'تعذر إغلاق الرسالة.' : 'Failed to resolve message.'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      isRtl ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?'
    );
    if (!confirmDelete) return;

    setActionId(id);
    try {
      await adminService.deleteMessage(id);
      await loadMessages();
    } catch (err) {
      console.error('Failed to delete message:', err);
      setErrorMessage(getErrorMessage(err, isRtl ? 'تعذر حذف الرسالة.' : 'Failed to delete message.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {supportMode
          ? t('admin.supportRequests') || (isRtl ? 'طلبات الدعم الفني' : 'Support Requests')
          : t('admin.messagesAndHostRequests') || (isRtl ? 'الرسائل وطلبات المضيفين' : 'Messages & Host Requests')}
      </h2>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
            <Skeleton className="h-5 w-1/3 rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {isRtl ? 'لا توجد رسائل أو طلبات حالياً.' : 'No messages or requests found.'}
        </p>
      ) : (
        rows.map((r) => (
          <div
            key={r._id}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-5 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">
                {r.name} <span className="font-normal text-gray-500 dark:text-gray-400">• {r.email}</span>
              </p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  STATUS_BADGES[r.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {typeLabels[r.type] || r.type} / {statusLabels[r.status] || r.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              {r.message}
            </p>

            {r.adminReply && (
              <div className="mt-2 text-xs text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-100 dark:border-teal-900/50">
                <span className="font-bold">{isRtl ? 'رد الأدمن:' : 'Admin Reply:'}</span> {r.adminReply}
              </div>
            )}

            {r.type === 'host-upgrade' && r.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button
                  disabled={actionId === r._id}
                  onClick={() => handleHostRequest(r._id, 'approved')}
                  className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                >
                  {isRtl ? 'ترقية كمضيف' : 'Approve Host'}
                </button>
                <button
                  disabled={actionId === r._id}
                  onClick={() => handleHostRequest(r._id, 'rejected')}
                  className="rounded-lg bg-orange-100 dark:bg-orange-900/40 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-200 transition-colors disabled:opacity-50"
                >
                  {isRtl ? 'رفض الطلب' : 'Reject Host'}
                </button>
              </div>
            )}

            {r.status !== 'resolved' && r.type !== 'host-upgrade' && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={replyText[r._id] || ''}
                  onChange={(e) => setReplyText((p) => ({ ...p, [r._id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReplyAndResolve(r._id);
                  }}
                  maxLength={3000}
                  placeholder={isRtl ? 'اكتب رداً على هذا الطلب...' : 'Reply to this request...'}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  disabled={actionId === r._id}
                  onClick={() => handleReplyAndResolve(r._id)}
                  className="rounded-xl bg-[#2DB4A0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#259787] transition-colors disabled:opacity-50 shrink-0"
                >
                  {isRtl ? 'الرد وإغلاق' : 'Reply + Resolve'}
                </button>
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <button
                disabled={actionId === r._id}
                onClick={() => handleDelete(r._id)}
                className="rounded-xl bg-rose-100 dark:bg-rose-900/40 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-200 transition-colors disabled:opacity-50 shrink-0"
              >
                {isRtl ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminMessagesPage;