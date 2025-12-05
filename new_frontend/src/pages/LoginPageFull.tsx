import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ROUTES } from '../types/careguide-ia';
import { ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Logo } from '../components/common/Logo';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface LoginError {
  message: string;
  field?: 'username' | 'password' | 'general';
}

const LoginPageFull: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language } = useApp();

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Translation object for better maintainability
  const t = {
    welcomeTitle: language === 'ko' ? '환영합니다' : 'Welcome Back',
    welcomeSubtitle: language === 'ko' ? '계정에 로그인하여 시작하세요' : 'Sign in to continue to your dashboard',
    usernameLabel: language === 'ko' ? '아이디' : 'Username',
    usernamePlaceholder: language === 'ko' ? '아이디를 입력하세요' : 'Enter your username',
    passwordLabel: language === 'ko' ? '비밀번호' : 'Password',
    passwordPlaceholder: language === 'ko' ? '비밀번호를 입력하세요' : 'Enter your password',
    rememberMe: language === 'ko' ? '로그인 유지' : 'Remember me',
    forgotPassword: language === 'ko' ? '비밀번호 찾기' : 'Forgot password?',
    loginButton: language === 'ko' ? '로그인' : 'Sign In',
    noAccount: language === 'ko' ? '계정이 없으신가요?' : "Don't have an account?",
    createAccount: language === 'ko' ? '회원가입하기' : 'Create account',
    brandTitle: language === 'ko' ? '만성콩팥병 관리를 위한' : 'Your Personal Assistant for',
    brandSubtitle: language === 'ko' ? '스마트 케어 파트너' : 'Chronic Kidney Disease Care',
    brandDescription: language === 'ko'
      ? 'CarePlus와 함께 더 건강한 내일을 만들어가세요. 맞춤형 식단 관리부터 전문가 상담까지, 당신의 건강 여정을 함께합니다.'
      : 'Join CarePlus for a healthier tomorrow. From personalized diet plans to expert consultations, we are here for your health journey.',
    emptyFieldsError: language === 'ko' ? '아이디와 비밀번호를 입력해주세요' : 'Please enter username and password',
    loginFailedError: language === 'ko' ? '로그인에 실패했습니다' : 'Login failed',
    showPassword: language === 'ko' ? '비밀번호 표시' : 'Show password',
    hidePassword: language === 'ko' ? '비밀번호 숨기기' : 'Hide password',
  };

  const handleInputChange = useCallback((field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.password) {
      setError({ message: t.emptyFieldsError, field: 'general' });
      return;
    }

    setLoading(true);
    try {
      await login(formData.username, formData.password);
      // Force page reload to ensure state is updated
      window.location.href = ROUTES.MAIN;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t.loginFailedError;
      setError({ message: errorMessage, field: 'general' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-surface-alt">
      {/* Left Side - Decorative (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-dark" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/20 via-secondary/20 to-primary/10 z-0" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
          <div>
            <Logo size="lg" />
          </div>

          <div className="max-w-lg mb-12">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              {t.brandTitle}
              <br />
              <span className="gradient-text">
                {t.brandSubtitle}
              </span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t.brandDescription}
            </p>
          </div>

          <div className="flex gap-4 text-sm text-gray-400">
            <span>© 2025 CarePlus</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative safe-area-top safe-area-bottom">
        {/* Mobile background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-light/30 to-transparent lg:hidden z-0" />

        <div className="w-full max-w-md z-10 animate-enter">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="glass-card p-6 sm:p-8 md:p-10">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t.welcomeTitle}
              </h1>
              <p className="text-gray-500">
                {t.welcomeSubtitle}
              </p>
            </header>

            {/* Error Message */}
            {error && (
              <div
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-slide-down"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Username Field */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 ml-1">
                  {t.usernameLabel}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                    <Mail size={20} aria-hidden="true" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="input-premium pl-12"
                    placeholder={t.usernamePlaceholder}
                    autoComplete="username"
                    aria-describedby={error?.field === 'username' ? 'username-error' : undefined}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 ml-1">
                  {t.passwordLabel}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                    <Lock size={20} aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="input-premium pl-12 pr-12"
                    placeholder={t.passwordPlaceholder}
                    autoComplete="current-password"
                    aria-describedby={error?.field === 'password' ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-target"
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900 touch-target">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span>{t.rememberMe}</span>
                </label>
                <button
                  type="button"
                  className="text-primary hover:text-primary-dark font-medium hover:underline touch-target"
                >
                  {t.forgotPassword}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 group mt-2 touch-target"
                aria-busy={loading}
              >
                {loading ? (
                  <div className="loading-spinner w-6 h-6" aria-label="Loading" />
                ) : (
                  <>
                    {t.loginButton}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <footer className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                {t.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.SIGNUP)}
                  className="text-primary font-semibold hover:text-primary-dark hover:underline transition-colors"
                >
                  {t.createAccount}
                </button>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageFull;
