/**
 * Layout System - Centralized exports
 *
 * This module provides a comprehensive responsive layout system with the following components:
 *
 * SHELL COMPONENTS:
 * - AppLayout: Main application wrapper with sidebar, header, and navigation
 * - Sidebar: Desktop/tablet sidebar navigation (280px desktop, 72px tablet)
 * - Header: Top header bar with page title
 * - MobileHeader: Mobile-specific header with back/menu button
 * - MobileNav: Bottom navigation bar for mobile devices
 * - Drawer: Mobile side drawer (hamburger menu)
 *
 * CONTAINER COMPONENTS:
 * - PageContainer: Standard page content wrapper with max-width and padding
 * - NarrowContainer: Narrow variant (640px max) for forms
 * - WideContainer: Wide variant (1280px max) for dashboards
 * - FluidContainer: Full-width container
 *
 * LAYOUT COMPONENTS:
 * - PageSection: Section wrapper with title, subtitle, and spacing
 * - CompactSection: Small section variant
 * - MajorSection: Large section variant
 * - TwoColumnLayout: Two-column responsive layout
 * - SidebarLayout: Two-column with sticky narrow left
 * - SplitLayout: Equal 50/50 split
 * - MasterDetailLayout: Wide left, narrow right
 * - GridLayout: Responsive grid system
 * - CardGrid: Pre-configured card grid (1-2-3 columns)
 * - DenseGrid: Pre-configured dense grid (2-3-4-5 columns)
 * - FluidGrid: Auto-fit fluid grid
 * - StackLayout: Single column stack
 *
 * CONSTANTS:
 * - SIDEBAR, HEADER, BOTTOM_NAV: Dimension constants
 * - Z_INDEX: Z-index scale
 * - BREAKPOINTS: Responsive breakpoints
 * - TOUCH_TARGET: Touch-friendly sizing
 * - CONTAINER, SPACING: Spacing configuration
 */

// ============================================================================
// SHELL COMPONENTS
// ============================================================================

export { default as AppLayout } from './AppLayout';
export { default as Sidebar } from './Sidebar';
export { Header } from './Header';
export { MobileHeader } from './MobileHeader';
export { MobileNav } from './MobileNav';
export { Drawer } from './Drawer';

// ============================================================================
// CONTAINER COMPONENTS
// ============================================================================

export {
  PageContainer,
  NarrowContainer,
  WideContainer,
  FluidContainer,
} from './PageContainer';

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

export {
  PageSection,
  CompactSection,
  MajorSection,
} from './PageSection';

// ============================================================================
// TWO-COLUMN LAYOUTS
// ============================================================================

export {
  TwoColumnLayout,
  SidebarLayout,
  SplitLayout,
  MasterDetailLayout,
} from './TwoColumnLayout';

// ============================================================================
// GRID LAYOUTS
// ============================================================================

export {
  GridLayout,
  CardGrid,
  DenseGrid,
  FluidGrid,
  StackLayout,
} from './GridLayout';

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  SIDEBAR,
  HEADER,
  BOTTOM_NAV,
  CONTAINER,
  SPACING,
  Z_INDEX,
  BREAKPOINTS,
  TOUCH_TARGET,
  ANIMATION,
  CSS_VARS,
  SIDEBAR_CLASSES,
  CONTENT_OFFSET_CLASSES,
} from './constants';
