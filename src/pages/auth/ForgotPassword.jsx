import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import authService from '../../services/authService';
import { useTranslation } from '../../hooks/useTranslation';

const ForgotPassword = () => {
  const { t, isRtl } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await authService.requestPasswordReset(email);
      setMessage(
        result.message ||
          (isRtl
            ? 'إذا كان البريد الإلكتروني مسجلاً، فقد تم إرسال رابط إعادة تعيين كلمة المرور.'
            : 'If the email exists, a reset link will be sent.')
      );
      setEmail(''); // Reset field on success
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isRtl
            ? 'تعذر إرسال طلب إعادة تعيين كلمة المرور.'
            : 'Unable to request password reset.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="mx-auto flex min-h-[75vh] max-w-xl items-center px-4 py-12 transition-colors"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
          {t('auth.backToLogin') || (isRtl ? 'العودة لصفحة التسجيل' : 'Back to login')}
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          {t('auth.forgotPasswordTitle') || (isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password')}
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {t('auth.forgotPasswordSubtitle') ||
            (isRtl
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
              : 'Enter your email and we will send you a reset link.')}
        </p>

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail
              className={`absolute top-3.5 text-gray-400 ${
                isRtl ? 'right-3.5' : 'left-3.5'
              }`}
              size={18}
            />
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 text-gray-900 outline-none transition focus:border-[#2DB4A0] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-[#2DB4A0] ${
                isRtl ? 'pl-4 pr-11' : 'pl-11 pr-4'
              }`}
              placeholder={
                t('auth.emailPlaceholder') ||
                (isRtl ? 'البريد الإلكتروني' : 'name@example.com')
              }
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DB4A0] py-3.5 font-bold text-white shadow-lg shadow-[#2DB4A0]/20 transition hover:bg-[#249181] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {t('auth.sendResetLink') || (isRtl ? 'إرسال رابط التعيين' : 'Send reset link')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.rememberedPassword') || (isRtl ? 'تذكرت كلمة المرور؟' : 'Remembered it?')}{' '}
          <Link to="/login" className="font-semibold text-[#2DB4A0] hover:underline">
            {t('auth.loginLink') || (isRtl ? 'تسجيل الدخول' : 'Back to login')}
          </Link>
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;