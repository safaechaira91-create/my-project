import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2, Home, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');
  const { t, isRtl } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const normalizedEmail = email.trim().toLowerCase();
    const result = await login({ email: normalizedEmail, password });

    if (result.success) {
      const role = result.user?.role;
      if (role === 'admin') {
        navigate('/admin');
        return;
      }
      navigate(role === 'host' ? '/host-dashboard' : '/dashboard');
      return;
    }

    setLocalError(result.message);
  };

  return (
    <main className="min-h-[82vh] bg-bg-gray px-4 py-10 dark:bg-gray-950 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="mx-auto grid w-full max-w-262.5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-2">
        {/* Branding Hero Panel */}
        <div className="hidden bg-[#2DB4A0] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-2xl font-black">
              <Home size={28} />
              <span>MyDar</span>
            </Link>
            <h1 className="mb-4 text-4xl font-black leading-tight">
              {t('auth.welcomeBack') || (isRtl ? 'مرحباً بعودتك!' : 'Welcome back!')}
            </h1>
            <p className="max-w-sm text-white/90">
              {t('auth.loginIntro') || (isRtl ? 'سجل دخولك لإدارة عقاراتك أو حجز إقامتك القادمة.' : 'Sign in to manage your properties or book your next stay.')}
            </p>
          </div>
          <div className="text-xs text-white/70">
            &copy; {new Date().getFullYear()} MyDar. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 md:p-10">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white lg:hidden"
          >
            <Home size={16} />
            {isRtl ? 'العودة للرئيسية' : 'Back to home'}
          </Link>

          <h2 className="mb-2 text-3xl font-semibold text-airbnb-dark dark:text-white">
            {t('auth.loginTitle') || (isRtl ? 'تسجيل الدخول' : 'Sign in')}
          </h2>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            {t('auth.loginSubtitle') || (isRtl ? 'أدخل معلومات حسابك للبدء' : 'Enter your credentials to access your account')}
          </p>

          {localError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('auth.email') || (isRtl ? 'البريد الإلكتروني' : 'Email Address')}
              </label>
              <div className="relative">
                <Mail className={`absolute top-3.5 h-5 w-5 text-gray-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (localError) setLocalError('');
                  }}
                  className={`w-full rounded-2xl border border-gray-300 bg-gray-50 py-3 text-gray-900 outline-none transition focus:border-[#2DB4A0] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-[#2DB4A0] ${
                    isRtl ? 'pl-4 pr-11' : 'pl-11 pr-4'
                  }`}
                  placeholder={t('auth.emailPlaceholder') || 'name@example.com'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.password') || (isRtl ? 'كلمة المرور' : 'Password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#2DB4A0] hover:underline"
                >
                  {t('auth.forgotPassword') || (isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?')}
                </Link>
              </div>
              <div className="relative">
                <Lock className={`absolute top-3.5 h-5 w-5 text-gray-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (localError) setLocalError('');
                  }}
                  className={`w-full rounded-2xl border border-gray-300 bg-gray-50 py-3 text-gray-900 outline-none transition focus:border-[#2DB4A0] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-[#2DB4A0] ${
                    isRtl ? 'pl-11 pr-11' : 'pl-11 pr-11'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${
                    isRtl ? 'left-3.5' : 'right-3.5'
                  }`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DB4A0] py-3.5 font-bold text-white shadow-lg shadow-[#2DB4A0]/20 transition hover:bg-[#249181] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {t('auth.login') || (isRtl ? 'تسجيل الدخول' : 'Sign In')}
            </button>
          </form>

          {/* Registration Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.noAccount') || (isRtl ? 'ليس لديك حساب؟' : "Don't have an account?")}{' '}
            <Link to="/register" className="font-bold text-[#2DB4A0] hover:underline">
              {t('auth.createAccount') || (isRtl ? 'إنشاء حساب جديد' : 'Create an account')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;