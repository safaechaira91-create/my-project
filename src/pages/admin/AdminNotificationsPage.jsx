import { useState } from 'react';
import adminService from '../../services/adminService';
import { useTranslation } from '../../hooks/useTranslation';

const AdminNotificationsPage = () => {
  const { t, isRtl } = useTranslation();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await adminService.sendNotification({
        title: title.trim() || undefined,
        audience,
        message: message.trim(),
      });

      const count = res?.sent ?? res?.count ?? 0;
      setResult({
        type: 'success',
        text: isRtl
          ? `تم إرسال الإشعار بنجاح إلى ${count} مستخدم.`
          : `Notification successfully sent to ${count} users.`,
      });

      setTitle('');
      setMessage('');
    } catch (err) {
      console.error('Failed to send notification:', err);
      setResult({
        type: 'error',
        text: isRtl
          ? 'حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.'
          : 'Failed to send notification. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-5 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('admin.notificationsSystem') || (isRtl ? 'نظام الإشعارات' : 'Notifications System')}
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {isRtl
            ? 'بث الإشعارات التنبيهية الفورية لجميع مستخدمي المنصة أو المضيفين أو الضيوف.'
            : 'Broadcast system-wide or targeted notifications to users, hosts, or guests.'}
        </p>
      </div>

      {/* Target Audience Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {isRtl ? 'الجمهور المستهدف:' : 'Target Audience:'}
        </label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-[#2DB4A0] focus:ring-1 focus:ring-[#2DB4A0] transition-colors"
        >
          <option value="all">{isRtl ? 'جميع المستخدمين' : 'All users'}</option>
          <option value="hosts">{isRtl ? 'المضيفون فقط' : 'Hosts only'}</option>
          <option value="guests">{isRtl ? 'الضيوف فقط' : 'Guests only'}</option>
        </select>
      </div>

      {/* Optional Notification Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {isRtl ? 'عنوان الإشعار (اختياري):' : 'Notification Title (Optional):'}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isRtl ? 'مثال: تحديث هام في شروط الخدمة' : 'e.g., Important terms update'}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-[#2DB4A0] focus:ring-1 focus:ring-[#2DB4A0] transition-colors"
        />
      </div>

      {/* Message Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {isRtl ? 'نص الإشعار:' : 'Message Content:'}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-[#2DB4A0] focus:ring-1 focus:ring-[#2DB4A0] transition-colors"
          placeholder={isRtl ? 'اكتب نص الإشعار هنا...' : 'Write your notification message...'}
          required
        />
      </div>

      {/* Result Alert */}
      {result && (
        <div
          className={`rounded-xl border p-3.5 text-sm font-semibold transition-all ${
            result.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          }`}
        >
          {result.text}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !message.trim()}
        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#2DB4A0] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-[#249181] disabled:opacity-50"
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {loading
          ? isRtl
            ? 'جاري الإرسال...'
            : 'Sending...'
          : isRtl
          ? 'إرسال الإشعار'
          : 'Send Notification'}
      </button>
    </form>
  );
};

export default AdminNotificationsPage;