/**
 * Sidebar - Responsive sidebar navigation component
 *
 * Variants:
 * - desktop: Full sidebar with icons and labels (280px)
 * - tablet: Collapsed sidebar with icons only (72px)
 *
 * Features:
 * - Active state indication
 * - Login/Signup buttons for unauthenticated users
 * - MyPage button for authenticated users
 * - Footer links (notifications, support, terms, privacy)
 * - Glassmorphism design
 * - Keyboard accessible
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../ui/Icon';
import type { IconName } from '../../config/iconSystem';
import { ROUTES } from '../../types/careguide-ia';
import { SIDEBAR, HEADER } from './constants';

// ============================================================================
// TYPES
// ============================================================================

interface SidebarProps {
  /** Layout variant - controls width and label visibility */
  variant?: 'desktop' | 'tablet';
}

interface MenuItem {
  id: string;
  label: string;
  iconName?: IconName;
  path: string;
  icon?: React.ComponentType<{ size?: number }>;
  isCustomIcon?: boolean;
}

interface FooterLink {
  id: string;
  label: string;
  iconName: IconName;
  path: string;
}

// ============================================================================
// CUSTOM ICONS
// ============================================================================

/**
 * Custom chatbot icon (Figma design)
 */
function ChatbotIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M5.33333 4.33333H5.34M8.66667 4.33333H8.67333M11 1C11.5304 1 12.0391 1.21071 12.4142 1.58579C12.7893 1.96086 13 2.46957 13 3V8.33333C13 8.86377 12.7893 9.37247 12.4142 9.74755C12.0391 10.1226 11.5304 10.3333 11 10.3333H7.66667L4.33333 12.3333V10.3333H3C2.46957 10.3333 1.96086 10.1226 1.58579 9.74755C1.21071 9.37247 1 8.86377 1 8.33333V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H11Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// MENU CONFIGURATION
// ============================================================================

const menuItems: MenuItem[] = [
  { id: 'chat', label: 'AI챗봇', icon: ChatbotIcon, path: '/chat', isCustomIcon: true },
  { id: 'diet', label: '식단케어', iconName: 'diet' as IconName, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', iconName: 'quiz' as IconName, path: '/quiz/list' },
  { id: 'community', label: '커뮤니티', iconName: 'community' as IconName, path: '/community' },
  { id: 'trends', label: '트렌드', iconName: 'trends' as IconName, path: '/trends' },
];

const footerLinks: FooterLink[] = [
  { id: 'notification', label: '알림', iconName: 'notification' as IconName, path: '/notifications' },
  { id: 'support', label: '고객지원', iconName: 'help' as IconName, path: '/support' },
  { id: 'terms', label: '이용약관', iconName: 'document' as IconName, path: ROUTES.TERMS_CONDITIONS },
  { id: 'privacy', label: '개인정보 처리방침', iconName: 'shield' as IconName, path: '/privacy-policy' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Sidebar({ variant = 'desktop' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isDesktop = variant === 'desktop';

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="flex flex-col h-full bg-white/80 backdrop-blur-md border-r border-gray-100 shadow-sm"
      style={{
        width: isDesktop ? SIDEBAR.DESKTOP_WIDTH : SIDEBAR.TABLET_WIDTH,
        paddingTop: HEADER.HEIGHT,
      }}
      aria-label="사이드바 네비게이션"
    >
      {/* Main Navigation */}
      <nav
        className={`flex-1 overflow-y-auto custom-scrollbar space-y-2 ${isDesktop ? 'p-4' : 'p-2'}`}
        aria-label="주요 네비게이션"
      >
        {menuItems.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3
                ${isDesktop ? 'justify-start px-4' : 'justify-center px-2'}
                py-3.5 rounded-2xl transition-all duration-300 group
                min-h-[48px]
                ${active
                  ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon container */}
              <div
                className={`
                  p-2 rounded-xl transition-colors flex-shrink-0
                  ${active
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-transparent group-hover:bg-white group-hover:shadow-sm'
                  }
                `}
              >
                {item.isCustomIcon && item.icon ? (
                  <item.icon size={20} />
                ) : item.iconName ? (
                  <Icon name={item.iconName} size="md" strokeWidth="normal" />
                ) : null}
              </div>

              {/* Label (desktop only) */}
              {isDesktop && (
                <span className="font-semibold text-[15px] truncate">
                  {item.label}
                </span>
              )}

              {/* Active indicator (desktop only) */}
              {active && isDesktop && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div
        className={`border-t border-gray-100 bg-white/50 backdrop-blur-sm ${isDesktop ? 'p-4' : 'p-2'}`}
      >
        {/* Auth Section: Login/Signup OR MyPage */}
        {!isAuthenticated ? (
          // Not authenticated: Show login/signup buttons
          isDesktop ? (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 min-h-[44px]"
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 min-h-[44px]"
              >
                회원가입
              </button>
            </div>
          ) : (
            // Tablet: Icon-only login
            <div className="flex flex-col items-center gap-2 mb-4">
              <button
                onClick={() => navigate('/login')}
                className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="로그인"
                aria-label="로그인"
              >
                <Icon name="mypage" size="md" strokeWidth="normal" />
              </button>
            </div>
          )
        ) : (
          // Authenticated: Show MyPage button
          <button
            onClick={() => navigate('/mypage')}
            className={`
              w-full flex items-center gap-3
              ${isDesktop ? 'justify-start px-4' : 'justify-center px-2'}
              py-3.5 rounded-2xl transition-all duration-300 mb-4 group border border-transparent
              min-h-[48px]
              ${isActive('/mypage')
                ? 'bg-white border-gray-100 shadow-md text-primary'
                : 'hover:bg-white hover:shadow-md hover:border-gray-100 text-gray-600'
              }
            `}
            title="마이페이지"
            aria-label="마이페이지"
            aria-current={isActive('/mypage') ? 'page' : undefined}
          >
            <div
              className={`
                p-2 rounded-xl transition-colors flex-shrink-0
                ${isActive('/mypage')
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-50 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                }
              `}
            >
              <Icon name="mypage" size="md" strokeWidth="normal" />
            </div>

            {isDesktop && (
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">마이페이지</span>
                <span className="text-xs text-gray-400 font-medium">내 정보 관리</span>
              </div>
            )}
          </button>
        )}

        {/* Footer Links - Desktop: Full labels */}
        {isDesktop && (
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {footerLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-gray-50"
                  title={link.label}
                >
                  <Icon name={link.iconName} size="xs" strokeWidth="normal" />
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-300 mt-4 text-center font-medium">
              Copyright 2025 CareGuide
            </p>
          </div>
        )}

        {/* Footer Links - Tablet: Icon only */}
        {!isDesktop && (
          <div className="flex flex-col gap-2 pt-2">
            {footerLinks.slice(0, 2).map((link) => (
              <button
                key={link.id}
                onClick={() => navigate(link.path)}
                className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-50 flex items-center justify-center min-w-[44px] min-h-[44px]"
                title={link.label}
                aria-label={link.label}
              >
                <Icon name={link.iconName} size="sm" strokeWidth="normal" />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
