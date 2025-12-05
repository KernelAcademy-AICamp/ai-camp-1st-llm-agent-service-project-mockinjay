/**
 * Layout System Constants
 * Centralized configuration for responsive layout behavior
 *
 * BREAKPOINTS (Mobile-First):
 * - xs:  375px  (Mobile S)
 * - sm:  640px  (Mobile L / Small Tablet)
 * - md:  768px  (Tablet)
 * - lg:  1024px (Desktop)
 * - xl:  1280px (Desktop L)
 * - 2xl: 1536px (Desktop XL)
 */

// ============================================================================
// SIDEBAR CONFIGURATION
// ============================================================================

export const SIDEBAR = {
  /** Desktop sidebar width (lg and above) */
  DESKTOP_WIDTH: 280,
  /** Tablet collapsed sidebar width (md to lg) */
  TABLET_WIDTH: 72,
  /** Mobile drawer width (percentage of viewport) */
  MOBILE_DRAWER_WIDTH: '80%',
  /** Mobile drawer max width */
  MOBILE_DRAWER_MAX_WIDTH: 320,
} as const;

// ============================================================================
// HEADER CONFIGURATION
// ============================================================================

export const HEADER = {
  /** Header height across all breakpoints */
  HEIGHT: 64,
  /** Mobile header height (includes safe area) */
  MOBILE_HEIGHT: 56,
} as const;

// ============================================================================
// BOTTOM NAVIGATION CONFIGURATION
// ============================================================================

export const BOTTOM_NAV = {
  /** Bottom navigation height on mobile */
  HEIGHT: 64,
  /** Bottom navigation safe area padding */
  SAFE_AREA_PADDING: 8,
} as const;

// ============================================================================
// CONTAINER CONFIGURATION
// ============================================================================

export const CONTAINER = {
  /** Maximum width for content containers */
  MAX_WIDTH: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  /** Horizontal padding at each breakpoint */
  PADDING: {
    xs: 16,   // px-4
    sm: 16,   // px-4
    md: 24,   // px-6
    lg: 32,   // px-8
  },
} as const;

// ============================================================================
// SPACING CONFIGURATION
// ============================================================================

export const SPACING = {
  /** Page vertical padding */
  PAGE_VERTICAL: {
    mobile: 16,   // py-4
    tablet: 24,   // py-6
    desktop: 32,  // py-8
  },
  /** Section spacing */
  SECTION: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  /** Grid gap sizes */
  GRID_GAP: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const Z_INDEX = {
  /** Base content level */
  BASE: 0,
  /** Sticky elements within content */
  STICKY: 10,
  /** Header and navigation */
  HEADER: 40,
  /** Sidebar */
  SIDEBAR: 30,
  /** Dropdown menus */
  DROPDOWN: 50,
  /** Modal backdrop */
  MODAL_BACKDROP: 50,
  /** Modal content */
  MODAL: 50,
  /** Toast notifications */
  TOAST: 60,
  /** Offline/reconnect banners */
  BANNER: 60,
  /** Tooltips */
  TOOLTIP: 70,
} as const;

// ============================================================================
// BREAKPOINT VALUES
// ============================================================================

export const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================================
// TOUCH TARGET SIZES
// ============================================================================

export const TOUCH_TARGET = {
  /** Minimum touch target size (iOS HIG) */
  MIN: 44,
  /** Recommended touch target size (Android) */
  RECOMMENDED: 48,
  /** Large touch targets for primary actions */
  LARGE: 56,
} as const;

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const ANIMATION = {
  /** Fast micro-interactions */
  FAST: 150,
  /** Standard transitions */
  NORMAL: 200,
  /** Slow, deliberate animations */
  SLOW: 300,
  /** Page transitions */
  PAGE: 400,
} as const;

// ============================================================================
// CSS VARIABLES (for inline styles)
// ============================================================================

export const CSS_VARS = {
  sidebarDesktopWidth: `${SIDEBAR.DESKTOP_WIDTH}px`,
  sidebarTabletWidth: `${SIDEBAR.TABLET_WIDTH}px`,
  headerHeight: `${HEADER.HEIGHT}px`,
  mobileHeaderHeight: `${HEADER.MOBILE_HEIGHT}px`,
  bottomNavHeight: `${BOTTOM_NAV.HEIGHT}px`,
} as const;

// ============================================================================
// TAILWIND CLASS HELPERS
// ============================================================================

/**
 * Sidebar width classes for Tailwind
 */
export const SIDEBAR_CLASSES = {
  desktop: 'w-[280px]',
  tablet: 'w-[72px]',
} as const;

/**
 * Main content offset classes (accounting for sidebar)
 */
export const CONTENT_OFFSET_CLASSES = {
  desktop: 'lg:pl-[280px]',
  tablet: 'md:pl-[72px]',
  header: 'md:pt-16',
} as const;
