import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../types/careguide-ia';
import { useAuth } from '../../contexts/AuthContext';
import {
  MessageSquare,
  Utensils,
  Trophy,
  Users,
  TrendingUp,
  BarChart3,
  User,
  LogOut,
  LogIn,
  Heart
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const mainNavItems: NavItem[] = [
  { path: ROUTES.CHAT, icon: <MessageSquare size={20} />, label: 'AI챗봇' },
  { path: ROUTES.DIET_CARE, icon: <Utensils size={20} />, label: '식단케어' },
  { path: '/quiz', icon: <Trophy size={20} />, label: '퀴즈미션' },
  { path: ROUTES.COMMUNITY, icon: <Users size={20} />, label: '커뮤니티' },
  { path: ROUTES.TRENDS, icon: <TrendingUp size={20} />, label: '트렌드' },
  { path: '/dashboard', icon: <BarChart3 size={20} />, label: '대시보드' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const isActive = (path: string) => {
    if (path === ROUTES.CHAT) {
      return location.pathname.startsWith('/chat');
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.MAIN);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <Link to={ROUTES.MAIN} className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
          <Heart className="text-white" size={22} />
        </div>
        <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>CarePlus</span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={isActive(item.path)
                  ? { color: 'var(--color-nav-selected)', backgroundColor: 'var(--color-input-bar)' }
                  : { color: 'var(--color-nav-unselected)' }
                }
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-4">
        {/* User Section */}
        {isAuthenticated ? (
          <>
            {/* User Info */}
            <div className="mb-2 px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-careplus-text-primary truncate">
                {user?.fullName || user?.username || '사용자'}
              </p>
              <p className="text-xs text-careplus-text-muted truncate">
                {user?.email}
              </p>
            </div>

            {/* My Page */}
            <Link
              to={ROUTES.MY_PAGE}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
              style={location.pathname === ROUTES.MY_PAGE
                ? { color: 'var(--color-nav-selected)', backgroundColor: 'var(--color-input-bar)' }
                : { color: 'var(--color-nav-unselected)' }
              }
            >
              <User size={20} />
              <span className="font-medium">마이페이지</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left"
              style={{ color: 'var(--color-nav-unselected)' }}
            >
              <LogOut size={20} />
              <span className="font-medium">로그아웃</span>
            </button>
          </>
        ) : (
          <>
            {/* Login Button */}
            <Link
              to={ROUTES.LOGIN}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
              style={{ color: 'var(--color-nav-unselected)' }}
            >
              <LogIn size={20} />
              <span className="font-medium">로그인</span>
            </Link>
          </>
        )}

        {/* Footer Links */}
        <div className="mt-4 pt-4 border-t border-careplus-border">
          <p className="text-xs text-careplus-text-muted px-4 mb-2">
            &copy; 2025 CareGuide
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-4">
            <Link to={ROUTES.SUPPORT} className="text-xs text-careplus-text-muted hover:text-primary-600">
              도움말
            </Link>
            <Link to={ROUTES.TERMS_CONDITIONS} className="text-xs text-careplus-text-muted hover:text-primary-600">
              약관
            </Link>
            <Link to={ROUTES.PRIVACY_POLICY} className="text-xs text-careplus-text-muted hover:text-primary-600">
              개인정보 처리방침
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
