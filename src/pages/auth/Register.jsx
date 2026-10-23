import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Loader2, Home, Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { t, isRtl } = useTranslation();

  const passwordChecks = useMemo(() => {
    const pwd = formData.password;
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
    };
  }, [formData.password]);

  const isPasswordValid = PASSWORD_REGEX.test(formData.password);
  const showPasswordHints = formData.password.length > 0 && !isPasswordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError(
        isRtl
          ? 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير، وحرف صغير، ورقم.'
          : 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.'
      );
      return;
    }

    const normalizedData = {
      ...formData,
      email: formData.email.trim().toLowerCase(),
    };

    const result = await register(normalizedData);

    if (result.success) {
      const role = result.user?.role;
      if (role === 'admin') {
        navigate('/admin');
        return;
      }
      navigate(role === 'host' ? '/host-dashboard' : '/dashboard');
      return;
    }

    setError(result.message);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const PasswordCheckItem = ({ passed, label }) => (
    <li className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {passed ? <Check size={13} /> : <XIcon size={13} />}
      {label}
    </li>
  );

  return (
    <main
      className="min-h-[82vh] bg-bg-gray px-4 py-10 transition-colors dark:bg-gray-950"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <section className="mx-auto grid w-full max-w-262.5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-2">
        {/* Branding Hero Panel */}
        <div className="hidden bg-[#2DB4A0] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-2xl font-black">
              <Home size={28} />
              <span>MyDar</span>
            </Link>
            <h1 className="mb-4 text-4xl font-black leading-tight">
              {t('auth.joinTitle') || (isRtl ? 'انضم إلينا اليوم!' : 'Join us today!')}
            </h1>
            <p className="max-w-sm text-white/90">
              {t('auth.joinIntro') ||
                (isRtl
                  ? 'أنشئ حسابك لبدء حجز العقارات المميزة أو إدراج عقارك الخاص.'
                  : 'Create an account to start booking properties or listing your own space.')}
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
            {t('auth.registerTitle') || (isRtl ? 'إنشاء حساب جديد' : 'Create an account')}
          </h2>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            {t('auth.registerSubtitle') ||
              (isRtl ? 'أدخل معلوماتك الشخصية للبدء' : 'Enter your details to register')}
          </p>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('auth.fullName') || (isRtl ? 'الاسم الكامل' : 'Full Name')}
              </label>
              <div className="relative">
                <User
                  className={`absolute top-3.5 h-5 w-5 text-gray-400 ${
                    isRtl ? 'right-3.5' : 'left-3.5'
                  }`}
                />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full rounded-2xl border border-gray-300 bg-gray-50 py-3 text-gray-900 outline-none transition focus:border-[#2DB4A0] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-[#2DB4A0] ${
                    isRtl ? 'pl-4 pr-11' : 'pl-11 pr-4'
                  }`}
                  placeholder={t('auth.fullNamePlaceholder') || (isRtl ? 'الاسم الكامل' : 'John Doe')}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('auth.email') || (isRtl ? 'البريد الإلكتروني' : 'Email Address')}
              </label>
              <div className="relative">
                <Mail
                  className={`absolute top-3.5 h-5 w-5 text-gray-400 ${
                    isRtl ? 'right-3.5' : 'left-3.5'
                  }`}
                />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={`w-full rounded-2xl border border-gray-300 bg-gray-50 py-3 text-gray-900 outline-none transition focus:border-[#2DB4A0] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-[#2DB4A0] ${
                    isRtl ? 'pl-4 pr-11' : 'pl-11 pr-4'
                  }`}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('auth.password') || (isRtl ? 'كلمة المرور' : 'Password')}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute top-3.5 h-5 w-5 text-gray-400 ${
                    isRtl ? 'right-3.5' : 'left-3.5'
                  }`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
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

              {showPasswordHints && (
                <ul className="mt-2 space-y-1 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                  <PasswordCheckItem passed={passwordChecks.length} label={isRtl ? '8 أحرف على الأقل' : 'At least 8 characters'} />
                  <PasswordCheckItem passed={passwordChecks.uppercase} label={isRtl ? 'حرف كبير واحد على الأقل (A-Z)' : 'At least one uppercase letter'} />
                  <PasswordCheckItem passed={passwordChecks.lowercase} label={isRtl ? 'حرف صغير واحد على الأقل (a-z)' : 'At least one lowercase letter'} />
                  <PasswordCheckItem passed={passwordChecks.number} label={isRtl ? 'رقم واحد على الأقل (0-9)' : 'At least one number'} />
                </ul>
              )}
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DB4A0] py-3.5 font-bold text-white shadow-lg shadow-[#2DB4A0]/20 transition hover:bg-[#249181] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              {t('auth.register') || (isRtl ? 'إنشاء الحساب' : 'Create Account')}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.haveAccount') || (isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?')}{' '}
            <Link to="/login" className="font-bold text-[#2DB4A0] hover:underline">
              {t('auth.signin') || (isRtl ? 'تسجيل الدخول' : 'Sign in')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Register;