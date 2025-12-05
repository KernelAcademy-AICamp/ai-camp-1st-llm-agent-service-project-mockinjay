/**
 * AppLayout - Main application shell with responsive layout
 *
 * Layout Structure:
 * - Desktop (lg+): Fixed sidebar (280px) + Header + Main content
 * - Tablet (md-lg): Collapsed sidebar (72px) + Header + Main content
 * - Mobile (<md): Bottom navigation + Drawer + Main content
 *
 * Features:
 * - Responsive sidebar with collapse behavior
 * - Network status indicators (offline/reconnect)
 * - Safe area support for mobile devices
 * - Smooth transitions between layouts
 * - Chat page specific layout handling
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { WifiOff, RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Drawer } from './Drawer';
import { ROUTES } from '../../types/careguide-ia';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  SIDEBAR,
  HEADER,
  Z_INDEX,
} from './constants';

// ============================================================================
// TYPES
// ============================================================================

interface LayoutConfig {
  showLayout: boolean;
  isChatPage: boolean;
  isFullScreenPage: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines layout configuration based on current path
 */
function getLayoutConfig(pathname: string): LayoutConfig {
  const noLayoutPaths: readonly string[] = [
    ROUTES.MAIN,
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    '/',
    '/splash',
    '/main',
  ];

  const showLayout = !noLayoutPaths.includes(pathname);
  const isChatPage = pathname.startsWith('/chat');
  const isFullScreenPage = isChatPage;

  return { showLayout, isChatPage, isFullScreenPage };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Network status banner component
 */
const NetworkBanner: React.FC<{
  isOnline: boolean;
  showReconnect: boolean;
}> = ({ isOnline, showReconnect }) => {
  if (isOnline && !showReconnect) return null;

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div
          className="fixed top-0 left-0 right-0 bg-error text-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium shadow-md animate-slide-down"
          style={{ zIndex: Z_INDEX.BANNER }}
          role="alert"
          aria-live="assertive"
        >
          <WifiOff size={18} aria-hidden="true" />
          <span>인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.</span>
        </div>
      )}

      {/* Reconnected Banner */}
      {showReconnect && (
        <div
          className="fixed top-0 left-0 right-0 bg-success text-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium shadow-md animate-slide-down"
          style={{ zIndex: Z_INDEX.BANNER }}
          role="status"
          aria-live="polite"
        >
          <RefreshCw size={18} className="animate-spin" aria-hidden="true" />
          <span>인터넷에 다시 연결되었습니다!</span>
        </div>
      )}
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnect, setShowReconnect] = useState(false);

  const { showLayout, isFullScreenPage } = getLayoutConfig(location.pathname);

  // Handle reconnection banner
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnect(true);
      const timer = setTimeout(() => setShowReconnect(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // No layout pages (login, signup, main, splash)
  if (!showLayout) {
    return <Outlet />;
  }

  // Calculate banner offset
  const hasBanner = !isOnline || showReconnect;
  const bannerOffset = hasBanner ? 'pt-12' : '';

  return (
    <div className="min-h-screen bg-surface-alt transition-colors duration-300">
      {/* Network Status Banners */}
      <NetworkBanner isOnline={isOnline} showReconnect={showReconnect} />

      {/* ================================================================== */}
      {/* DESKTOP LAYOUT (lg and above) */}
      {/* ================================================================== */}

      {/* Desktop Sidebar - Fixed left */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 flex-col"
        style={{
          width: SIDEBAR.DESKTOP_WIDTH,
          zIndex: Z_INDEX.SIDEBAR,
        }}
      >
        <Sidebar variant="desktop" />
      </aside>

      {/* Desktop Header - Fixed top, offset by sidebar */}
      <header
        className="hidden lg:block fixed top-0 right-0"
        style={{
          left: SIDEBAR.DESKTOP_WIDTH,
          height: HEADER.HEIGHT,
          zIndex: Z_INDEX.HEADER,
        }}
      >
        <Header variant="desktop" />
      </header>

      {/* ================================================================== */}
      {/* TABLET LAYOUT (md to lg) */}
      {/* ================================================================== */}

      {/* Tablet Sidebar - Collapsed (icon only) */}
      <aside
        className="hidden md:flex lg:hidden fixed inset-y-0 left-0 flex-col"
        style={{
          width: SIDEBAR.TABLET_WIDTH,
          zIndex: Z_INDEX.SIDEBAR,
        }}
      >
        <Sidebar variant="tablet" />
      </aside>

      {/* Tablet Header - Fixed top, offset by collapsed sidebar */}
      <header
        className="hidden md:block lg:hidden fixed top-0 right-0"
        style={{
          left: SIDEBAR.TABLET_WIDTH,
          height: HEADER.HEIGHT,
          zIndex: Z_INDEX.HEADER,
        }}
      >
        <Header variant="tablet" />
      </header>

      {/* ================================================================== */}
      {/* MOBILE LAYOUT (below md) */}
      {/* ================================================================== */}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden">
        <MobileNav />
      </nav>

      {/* Mobile Side Drawer (hamburger menu) */}
      <Drawer />

      {/* ================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ================================================================== */}

      <main
        className={`
          transition-all duration-300 ease-in-out
          ${bannerOffset}
        `}
        style={{
          // Mobile: no offset
          // Tablet: offset by collapsed sidebar width
          // Desktop: offset by full sidebar width
          paddingLeft: 0,
          paddingTop: 0,
        }}
        role="main"
        aria-label="주요 콘텐츠"
      >
        {/* Content wrapper with responsive offsets */}
        <div
          className={`
            md:pl-[72px] lg:pl-[280px]
            md:pt-16
            ${isFullScreenPage
              ? 'h-screen overflow-hidden'
              : 'min-h-screen'
            }
            ${!isFullScreenPage
              ? 'pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8'
              : ''
            }
          `}
        >
          {/* Inner content container */}
          <div
            className={`
              h-full
              ${isFullScreenPage
                ? 'w-full'
                : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'
              }
            `}
          >
            {/* Animated page content */}
            <div className="animate-fade-in h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
