/**
 * MobileHeader - Mobile-optimized header component
 *
 * Features:
 * - Back button or hamburger menu (configurable)
 * - Centered page title
 * - Right action slot (profile, custom actions)
 * - Safe area support for notched devices
 * - Touch-friendly button sizes (min 48x48 for Android)
 * - Smooth transitions with haptic feedback
 * - Notification badge support
 */

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { Icon } from '../ui/Icon';
import { HEADER, TOUCH_TARGET } from './constants';

// ============================================================================
// TYPES
// ============================================================================

interface MobileHeaderProps {
  /** Page title displayed in center */
  title: string;
  /** Custom back button handler (default: navigate(-1)) */
  onBack?: () => void;
  /** Custom right action element */
  rightAction?: React.ReactNode;
  /** Show hamburger menu instead of back button */
  showMenu?: boolean;
  /** Show profile/login button on the right */
  showProfile?: boolean;
  /** Custom menu click handler */
  onMenuClick?: () => void;
  /** Background variant */
  variant?: 'default' | 'transparent';
  /** Show notification indicator */
  hasNotifications?: boolean;
  /** Subtitle text (optional) */
  subtitle?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MobileHeader({
  title,
  onBack,
  rightAction,
  showMenu = false,
  showProfile = false,
  onMenuClick,
  variant = 'default',
  hasNotifications = true,
  subtitle,
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openDrawer } = useDrawer();
  const [isPressed, setIsPressed] = useState<string | null>(null);

  // ========== Event Handlers with Haptic Feedback ==========

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleBack = useCallback(() => {
    triggerHaptic();
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [onBack, navigate, triggerHaptic]);

  const handleProfileClick = useCallback(() => {
    triggerHaptic();
    if (isAuthenticated) {
      navigate('/mypage');
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, triggerHaptic]);

  const handleMenuClick = useCallback(() => {
    triggerHaptic();
    if (onMenuClick) {
      onMenuClick();
    } else {
      openDrawer();
    }
  }, [onMenuClick, openDrawer, triggerHaptic]);

  // Touch feedback handlers
  const handleTouchStart = useCallback((buttonId: string) => {
    setIsPressed(buttonId);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(null);
  }, []);

  // ========== Render ==========

  const bgClasses = variant === 'transparent'
    ? 'bg-transparent'
    : 'bg-white/95 backdrop-blur-md border-b border-gray-100';

  return (
    <header
      className={`lg:hidden flex items-center justify-between sticky top-0 z-50 ${bgClasses}`}
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        paddingBottom: '12px',
        paddingLeft: 'max(env(safe-area-inset-left), 16px)',
        paddingRight: 'max(env(safe-area-inset-right), 16px)',
        minHeight: HEADER.MOBILE_HEIGHT,
      }}
    >
      {/* Left Section: Back/Menu Button */}
      <div
        className="flex items-center"
        style={{ width: TOUCH_TARGET.RECOMMENDED }}
      >
        {showMenu ? (
          <button
            onClick={handleMenuClick}
            onTouchStart={() => handleTouchStart('menu')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`p-2 -ml-2 transition-all duration-150 rounded-xl flex items-center justify-center select-none ${
              isPressed === 'menu' ? 'bg-gray-100 scale-90' : 'hover:bg-gray-100'
            }`}
            style={{
              minWidth: TOUCH_TARGET.RECOMMENDED,
              minHeight: TOUCH_TARGET.RECOMMENDED,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="메뉴 열기"
          >
            <Icon name="menu" size="lg" strokeWidth="medium" color="default" />
          </button>
        ) : (
          <button
            onClick={handleBack}
            onTouchStart={() => handleTouchStart('back')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`p-2 -ml-2 transition-all duration-150 rounded-xl flex items-center justify-center select-none ${
              isPressed === 'back' ? 'bg-gray-100 scale-90' : 'hover:bg-gray-100'
            }`}
            style={{
              minWidth: TOUCH_TARGET.RECOMMENDED,
              minHeight: TOUCH_TARGET.RECOMMENDED,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="뒤로가기"
          >
            <Icon name="back" size="lg" strokeWidth="medium" color="default" />
          </button>
        )}
      </div>

      {/* Center Section: Page Title with optional subtitle */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 text-center"
        style={{ maxWidth: '60%' }}
      >
        <h1 className="text-base font-bold text-gray-800 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right Section: Profile/Custom Action */}
      <div
        className="flex items-center justify-end"
        style={{ width: TOUCH_TARGET.RECOMMENDED }}
      >
        {rightAction ? (
          rightAction
        ) : showProfile ? (
          <button
            onClick={handleProfileClick}
            onTouchStart={() => handleTouchStart('profile')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`p-2 -mr-2 relative transition-all duration-150 rounded-xl flex items-center justify-center select-none ${
              isPressed === 'profile' ? 'bg-gray-100 scale-90' : 'hover:bg-gray-100'
            }`}
            style={{
              minWidth: TOUCH_TARGET.RECOMMENDED,
              minHeight: TOUCH_TARGET.RECOMMENDED,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label={isAuthenticated ? '마이페이지' : '로그인'}
          >
            {isAuthenticated ? (
              <>
                <Icon name="mypage" size="lg" strokeWidth="medium" color="muted" />
                {/* Notification Badge with subtle animation */}
                {hasNotifications && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white animate-pulse"
                    aria-hidden="true"
                  />
                )}
              </>
            ) : (
              <Icon name="login" size="lg" strokeWidth="medium" color="muted" />
            )}
          </button>
        ) : null}
      </div>
    </header>
  );
}

export default MobileHeader;
