/**
 * MobileNav - Bottom navigation bar for mobile devices
 *
 * Features:
 * - 5-tab fixed bottom navigation
 * - Active state indication with top bar
 * - Safe area support for notched devices
 * - Touch-friendly button sizes (min 48x48 for Android accessibility)
 * - Hides on specific pages (login, signup, splash, main)
 * - Haptic feedback support
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { Icon } from '../ui/Icon';
import type { IconName } from '../../config/iconSystem';
import { BOTTOM_NAV, TOUCH_TARGET, Z_INDEX } from './constants';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  iconName?: IconName;
  path: string;
  icon?: React.ComponentType<{ size?: number }>;
  isCustomIcon?: boolean;
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
// NAVIGATION CONFIGURATION
// ============================================================================

const navItems: NavItem[] = [
  { id: 'chat', label: 'AI챗봇', icon: ChatbotIcon, path: '/chat', isCustomIcon: true },
  { id: 'diet', label: '식단케어', iconName: 'diet' as IconName, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', iconName: 'quiz' as IconName, path: '/quiz' },
  { id: 'community', label: '커뮤니티', iconName: 'community' as IconName, path: '/community' },
  { id: 'trends', label: '트렌드', iconName: 'trends' as IconName, path: '/trends' },
];

/**
 * Paths where bottom navigation should be hidden
 */
const HIDE_NAV_PATHS = ['/', '/splash', '/login', '/signup', '/main'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  // Hide on specific paths
  if (HIDE_NAV_PATHS.includes(location.pathname)) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Handle navigation with optional haptic feedback
  const handleNavigation = useCallback((path: string) => {
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    navigate(path);
  }, [navigate]);

  // Touch feedback handlers
  const handleTouchStart = useCallback((itemId: string) => {
    setPressedItem(itemId);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setPressedItem(null);
  }, []);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md flex items-center justify-around border-t border-gray-100 shadow-lg"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        paddingTop: '8px',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        height: `calc(${BOTTOM_NAV.HEIGHT}px + env(safe-area-inset-bottom))`,
        zIndex: Z_INDEX.HEADER,
      }}
      role="navigation"
      aria-label="하단 네비게이션"
    >
      {navItems.map((item) => {
        const active = isActive(item.path);
        const isPressed = pressedItem === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            onTouchStart={() => handleTouchStart(item.id)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`
              flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl
              transition-all duration-150 relative select-none
              ${active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}
              ${isPressed ? 'scale-90 opacity-80' : ''}
            `}
            style={{
              minWidth: TOUCH_TARGET.RECOMMENDED,
              minHeight: TOUCH_TARGET.RECOMMENDED,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            {/* Active indicator bar with animation */}
            <div
              className={`absolute -top-1 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full transition-all duration-300 ${
                active ? 'w-8 opacity-100' : 'w-0 opacity-0'
              }`}
              aria-hidden="true"
            />

            {/* Icon with subtle scale on active */}
            <div className={`transition-transform duration-150 ${active ? 'scale-110' : ''}`}>
              {item.isCustomIcon && item.icon ? (
                <item.icon size={22} />
              ) : item.iconName ? (
                <Icon
                  name={item.iconName}
                  size="md"
                  strokeWidth={active ? 'medium' : 'normal'}
                />
              ) : null}
            </div>

            {/* Label with active state */}
            <span
              className={`text-[10px] transition-all duration-150 ${
                active ? 'font-bold text-primary' : 'font-medium'
              }`}
            >
              {item.label}
            </span>

            {/* Ripple effect background */}
            {isPressed && (
              <div
                className="absolute inset-0 bg-gray-100 rounded-xl opacity-50 animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default MobileNav;
