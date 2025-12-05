/**
 * Header - Responsive header component for desktop and tablet layouts
 *
 * Variants:
 * - desktop: Full header with logo and page title
 * - tablet: Compact header with page title only
 *
 * Features:
 * - Dynamic page title based on current route
 * - Glassmorphism design
 * - User type selection modal
 * - Responsive sizing
 */

import { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { HEADER } from './constants';
import { ROUTES } from '../../types/careguide-ia';

// ============================================================================
// TYPES
// ============================================================================

interface HeaderProps {
  /** Layout variant */
  variant?: 'desktop' | 'tablet';
  /** Click handler for menu button (tablet) */
  onMenuClick?: () => void;
}

// ============================================================================
// PAGE TITLE MAPPING
// ============================================================================

const PAGE_TITLES: Record<string, string> = {
  '/chat': 'AI챗봇',
  '/trends': '트렌드',
  '/mypage': '마이 페이지',
  '/diet-care': '식단케어',
  '/quiz': '퀴즈미션',
  '/community': '커뮤니티',
  '/dashboard': '대시보드',
  '/notifications': '알림',
  '/support': '고객지원',
  '/profile': '프로필 설정',
};

/**
 * Get page title from pathname
 */
function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  // Prefix match for nested routes
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) {
      return title;
    }
  }

  return '';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Header({ variant = 'desktop' }: HeaderProps) {
  const [showUserModal, setShowUserModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('');

  // Update page title on route change
  useEffect(() => {
    setPageTitle(getPageTitle(location.pathname));
  }, [location.pathname]);

  const handleLogoClick = () => {
    navigate(ROUTES.MAIN);
  };

  const isDesktop = variant === 'desktop';

  return (
    <>
      <div
        className="flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300 h-full w-full"
        style={{ height: HEADER.HEIGHT }}
      >
        {/* Left Section: Logo (desktop only) */}
        <div className={`flex-shrink-0 ${isDesktop ? 'pl-6' : 'pl-4'}`}>
          {isDesktop ? (
            <a
              href={ROUTES.MAIN}
              onClick={(e) => {
                e.preventDefault();
                handleLogoClick();
              }}
              className="cursor-pointer block hover:opacity-80 transition-opacity"
              aria-label="홈으로 이동"
            >
              <Logo size="md" />
            </a>
          ) : (
            // Tablet: No logo, just spacing
            <div className="w-10" />
          )}
        </div>

        {/* Center Section: Page Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Right Section: Placeholder for balance */}
        <div className={`${isDesktop ? 'w-[140px] pr-6' : 'w-10 pr-4'}`} />
      </div>

      {/* User Type Selection Modal */}
      {showUserModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowUserModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-type-modal-title"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="user-type-modal-title"
              className="mb-4 text-lg font-bold text-gray-900 text-center"
            >
              사용자 유형을 선택해주세요
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { type: '일반인', label: '일반인' },
                { type: '환우', label: '신장병 환우' },
                { type: '연구자', label: '연구자' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-primary/30 hover:text-primary transition-all duration-200 min-h-[48px]"
                  onClick={() => {
                    setShowUserModal(false);
                    navigate(`/signup?type=${type}`);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
