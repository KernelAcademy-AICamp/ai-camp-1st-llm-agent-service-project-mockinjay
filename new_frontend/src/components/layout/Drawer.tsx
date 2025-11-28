import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  MessageSquare,
  Utensils,
  Trophy,
  Users,
  TrendingUp,
  Bell,
  HelpCircle,
  FileText,
  Shield,
  LogIn,
  LogOut,
  X,
} from 'lucide-react';
import { useDrawer } from '../../contexts/DrawerContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 메인 네비게이션 메뉴 아이템
 * Main navigation menu items
 */
const menuItems = [
  { id: 'chat', label: 'AI챗봇', icon: MessageSquare, path: '/chat' },
  { id: 'diet', label: '식단케어', icon: Utensils, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', icon: Trophy, path: '/quiz' },
  { id: 'community', label: '커뮤니티', icon: Users, path: '/community' },
  { id: 'trends', label: '트렌드', icon: TrendingUp, path: '/trends' },
];

import { ROUTES } from '../../types/careguide-ia';

/**
 * 보조 메뉴 아이템
 * Secondary menu items
 */
const secondaryItems = [
  { id: 'notification', label: '알림', path: '/notifications', icon: Bell },
  { id: 'support', label: '고객지원', path: '/support', icon: HelpCircle },
  { id: 'terms', label: '이용약관', path: ROUTES.TERMS_CONDITIONS, icon: FileText },
  { id: 'privacy', label: '개인정보 처리방침', path: '/privacy-policy', icon: Shield },
];

/**
 * 모바일 사이드 드로어 컴포넌트
 * Mobile side drawer component
 *
 * 햄버거 메뉴 클릭 시 왼쪽에서 슬라이드되어 나타나는 네비게이션 메뉴입니다.
 * Navigation menu that slides in from the left when hamburger menu is clicked.
 */
export function Drawer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const { isAuthenticated, logout } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  const handleLogout = () => {
    logout();
    closeDrawer();
    navigate('/main');
  };

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Overlay (배경 어둡게) */}
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity duration-300 animate-fade-in"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer 패널 */}
      <div
        className="fixed top-0 left-0 bottom-0 bg-white z-50 lg:hidden overflow-y-auto flex flex-col animate-slide-in-left shadow-2xl"
        style={{
          width: '80%',
          maxWidth: '320px',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="네비게이션 메뉴"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[60px] border-b border-border-light bg-surface-alt">
          <div className="flex items-center gap-3">
            <Menu size={24} strokeWidth={2} className="text-primary" aria-hidden="true" />
            <h2 className="text-[17px] font-bold text-text-primary">메뉴</h2>
          </div>

          <button
            onClick={closeDrawer}
            className="p-2 -mr-2 text-text-tertiary hover:text-text-primary transition-colors active:scale-95"
            aria-label="닫기"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* 메인 메뉴 */}
        <nav className="px-5 pt-8 pb-6 space-y-3" aria-label="메인 네비게이션">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-4 text-left group px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? 'text-primary bg-primary/5 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                  }
                  active:scale-98
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`transition-colors ${isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                </div>
                <span className="text-[16px]">
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>

        {/* 구분선 */}
        <div className="h-px bg-border-light mx-5" />

        {/* 보조 메뉴 */}
        <nav className="px-5 py-6 space-y-2 flex-1" aria-label="보조 네비게이션">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="w-full flex items-center gap-4 text-left text-text-secondary hover:text-text-primary hover:bg-surface-alt px-4 py-3 rounded-xl transition-all active:scale-98"
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-[15px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 로그인/로그아웃 버튼 */}
        <div className="px-5 pb-6 mt-auto border-t border-border-light pt-4">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 text-left text-status-error hover:bg-status-error/5 px-4 py-3 rounded-xl transition-all active:scale-98"
            >
              <LogOut size={22} strokeWidth={1.5} />
              <span className="text-[16px] font-semibold">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavigate('/login')}
              className="w-full flex items-center gap-4 text-left bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              <LogIn size={22} strokeWidth={2} />
              <span className="text-[16px] font-semibold">로그인 / 회원가입</span>
            </button>
          )}
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.25s ease-out;
        }
      `}</style>
    </>
  );
}

export default Drawer;
