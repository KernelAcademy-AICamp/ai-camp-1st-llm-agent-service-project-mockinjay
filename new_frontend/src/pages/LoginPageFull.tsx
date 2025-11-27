import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ROUTES } from '../types/careguide-ia';
import { LogIn } from 'lucide-react';

const LoginPageFull: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(language === 'ko' ? '아이디와 비밀번호를 입력해주세요' : 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      // Force page reload to ensure state is updated
      window.location.href = ROUTES.MAIN;
    } catch (err: any) {
      setError(err.message || (language === 'ko' ? '로그인에 실패했습니다' : 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'ko' ? '로그인' : 'Login'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ko' ? 'CareGuide 계정으로 로그인하세요' : 'Sign in to your CareGuide account'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'ko' ? '아이디 또는 이메일' : 'Username or Email'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="input-field dark:bg-gray-700 dark:text-white"
                placeholder={language === 'ko' ? '아이디 또는 이메일' : 'Username or email'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'ko' ? '비밀번호' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="input-field dark:bg-gray-700 dark:text-white"
                placeholder={language === 'ko' ? '비밀번호' : 'Password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-action w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {language === 'ko' ? '로그인 중...' : 'Logging in...'}
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  {language === 'ko' ? '로그인' : 'Login'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {language === 'ko' ? '계정이 없으신가요?' : "Don't have an account?"}{' '}
            <button
              onClick={() => navigate(ROUTES.SIGNUP)}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {language === 'ko' ? '회원가입' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageFull;
