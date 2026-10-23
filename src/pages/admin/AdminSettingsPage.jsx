import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useTranslation } from '../../hooks/useTranslation';

const AdminSettingsPage = () => {
  const { t, isRtl } = useTranslation();

  const [settings, setSettings] = useState({
    commissionRate: 10,
    maintenanceMode: false,
    requireHostApproval: true,
    currency: 'MAD',
  });

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  // Fetch current initial settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (adminService.getSettings) {
          const res = await adminService.getSettings();
          if (res?.data) {
            setSettings((prev) => ({ ...prev, ...res.data }));
          } else if (res) {
            setSettings((prev) => ({ ...prev, ...res }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      if (adminService.updateSettings) {
        await adminService.updateSettings(settings);
      }
      setStatus({
        type: 'success',
        message: isRtl
          ? 'تم حفظ الإعدادات بنجاح!'
          : 'Settings updated successfully!',
      });
    } catch (err) {
      console.error('Failed to update settings:', err);
      setStatus({
        type: 'error',
        message: isRtl
          ? 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.'
          : 'Failed to update settings. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#2DB4A0] border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="max-w-3xl space-y-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('admin.settings') || (isRtl ? 'إعدادات المنصة والأمان' : 'Admin Settings')}
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {isRtl
            ? 'لوحة التحكم في إعدادات المنصة العامة والأمان. بروتوكولات JWT مفعّلة لحماية هذا القسم.'
            : 'Security and platform configuration panel. JWT middleware is active and only admins can access this area.'}
        </p>
      </div>

      {/* Security Tip Banner */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs font-medium text-amber-800 dark:text-amber-400">
        💡 {isRtl ? 'تلميح أمني:' : 'Tip:'}{' '}
        {isRtl
          ? 'قم بتدوير مفاتيح JWT بشكل دوري وراقب الطلبات المشبوهة من خلال سجلات الخادم.'
          : 'Rotate JWT secrets regularly and monitor suspicious requests via server logs.'}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Platform Configuration Section */}
        <div className="space-y-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {isRtl ? 'إعدادات الحجوزات والعمولة' : 'Platform & Fees'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isRtl ? 'نسبة عمولة المنصة (%)' : 'Platform Commission (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.commissionRate}
                onChange={(e) => handleChange('commissionRate', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-[#2DB4A0] focus:ring-1 focus:ring-[#2DB4A0] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isRtl ? 'العملة الافتراضية' : 'Default Currency'}
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-[#2DB4A0] focus:ring-1 focus:ring-[#2DB4A0] transition-colors"
              >
                <option value="MAD">MAD (درهم مغربي)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {isRtl ? 'الموافقة المسبقة على المضيفين' : 'Require Host Manual Approval'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {isRtl
                  ? 'مراجعة طلبات الترقية كمضيف قبل التفعيل.'
                  : 'Review host upgrade requests before activation.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireHostApproval}
              onChange={(e) => handleChange('requireHostApproval', e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#2DB4A0] focus:ring-[#2DB4A0]"
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {isRtl ? 'وضع الصيانة (Maintenance Mode)' : 'Maintenance Mode'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {isRtl
                  ? 'إغلاق الوصول للمستخدمين العاديين مؤقتاً.'
                  : 'Temporarily disable public access for non-admin users.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Status Alert Banner */}
        {status.message && (
          <div
            className={`rounded-xl border p-3.5 text-xs font-semibold transition-all ${
              status.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#2DB4A0] px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#249181] disabled:opacity-50"
        >
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {loading
            ? isRtl
              ? 'جاري الحفظ...'
              : 'Saving...'
            : isRtl
            ? 'حفظ الإعدادات'
            : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettingsPage;