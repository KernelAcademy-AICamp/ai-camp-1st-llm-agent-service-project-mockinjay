import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Moon, Sun, Globe } from 'lucide-react';
import clsx from 'clsx';

const Layout: React.FC = () => {
  const { theme, toggleTheme, language, setLanguage, t } = useApp();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  console.log('Layout render - isAuthenticated:', isAuthenticated);
  console.log('Layout render - user:', user);

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) => clsx(
    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
    isActive(path)
      ? 'border-blue-500 text-gray-900 dark:text-white'
      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to={ROUTES.MAIN} className="text-xl font-bold text-blue-600 dark:text-blue-400">CareGuide</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to={ROUTES.CHAT} className={navLinkClass(ROUTES.CHAT)}>
                  {t.nav.aiChatbot}
                </Link>
                <Link to={ROUTES.DIET_CARE} className={navLinkClass(ROUTES.DIET_CARE)}>
                  {t.nav.dietCare}
                </Link>
                <Link to={ROUTES.QUIZ} className={navLinkClass(ROUTES.QUIZ)}>
                  {t.nav.quiz}
                </Link>
                <Link to={ROUTES.COMMUNITY} className={navLinkClass(ROUTES.COMMUNITY)}>
                  {t.nav.community}
                </Link>
                <Link to={ROUTES.TRENDS} className={navLinkClass(ROUTES.TRENDS)}>
                  {t.nav.trends}
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                title="Toggle Language"
              >
                <Globe size={20} className="mr-1" />
                <span className="text-sm font-medium">{language.toUpperCase()}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {isAuthenticated ? (
                <>
                  <Link to={ROUTES.MY_PAGE} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                    {user?.fullName || user?.username || t.nav.myPage}
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <Link to={ROUTES.LOGIN} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                  {t.nav.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900 dark:text-gray-100">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">&copy; 2024 CareGuide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
