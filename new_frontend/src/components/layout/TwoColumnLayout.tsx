/**
 * TwoColumnLayout - Responsive two-column layout component
 *
 * Features:
 * - Stacks vertically on mobile, side-by-side on tablet/desktop
 * - Configurable width ratios
 * - Sticky sidebar option
 * - Multiple breakpoint options
 *
 * Common use cases:
 * - Sidebar + main content
 * - List + detail view
 * - Form + preview
 * - Filter panel + results
 *
 * Usage:
 * ```tsx
 * <TwoColumnLayout
 *   left={<Sidebar />}
 *   right={<MainContent />}
 *   leftWidth="1/3"
 * />
 *
 * <TwoColumnLayout
 *   left={<FilterPanel />}
 *   right={<Results />}
 *   leftWidth="1/4"
 *   stickyLeft
 *   breakpoint="md"
 * />
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TwoColumnLayoutProps {
  /** Left column content */
  left: React.ReactNode;
  /** Right column content */
  right: React.ReactNode;
  /**
   * Width ratio of left column on desktop
   * - '1/4': 25% left, 75% right
   * - '1/3': 33% left, 67% right (default)
   * - '2/5': 40% left, 60% right
   * - '1/2': 50% left, 50% right
   * - '3/5': 60% left, 40% right
   * - '2/3': 67% left, 33% right
   * - '3/4': 75% left, 25% right
   */
  leftWidth?: '1/4' | '1/3' | '2/5' | '1/2' | '3/5' | '2/3' | '3/4';
  /**
   * Gap between columns
   * - 'xs': 8px
   * - 'sm': 16px
   * - 'md': 24px (default)
   * - 'lg': 32px
   * - 'xl': 48px
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Reverse column order on mobile (show right column first)
   */
  reverseOnMobile?: boolean;
  /**
   * Breakpoint where columns appear side-by-side
   * - 'sm': 640px
   * - 'md': 768px (default)
   * - 'lg': 1024px
   */
  breakpoint?: 'sm' | 'md' | 'lg';
  /**
   * Make left column sticky (stays in view while scrolling)
   */
  stickyLeft?: boolean;
  /**
   * Make right column sticky (stays in view while scrolling)
   */
  stickyRight?: boolean;
  /**
   * Sticky offset from top (accounts for header)
   */
  stickyOffset?: number;
  /**
   * Hide left column on mobile (only show right)
   */
  hideLeftOnMobile?: boolean;
  /**
   * Hide right column on mobile (only show left)
   */
  hideRightOnMobile?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================================================
// CLASS MAPPINGS
// ============================================================================

// Width classes for each breakpoint
const widthClasses = {
  '1/4': {
    sm: { left: 'sm:w-1/4', right: 'sm:w-3/4' },
    md: { left: 'md:w-1/4', right: 'md:w-3/4' },
    lg: { left: 'lg:w-1/4', right: 'lg:w-3/4' },
  },
  '1/3': {
    sm: { left: 'sm:w-1/3', right: 'sm:w-2/3' },
    md: { left: 'md:w-1/3', right: 'md:w-2/3' },
    lg: { left: 'lg:w-1/3', right: 'lg:w-2/3' },
  },
  '2/5': {
    sm: { left: 'sm:w-2/5', right: 'sm:w-3/5' },
    md: { left: 'md:w-2/5', right: 'md:w-3/5' },
    lg: { left: 'lg:w-2/5', right: 'lg:w-3/5' },
  },
  '1/2': {
    sm: { left: 'sm:w-1/2', right: 'sm:w-1/2' },
    md: { left: 'md:w-1/2', right: 'md:w-1/2' },
    lg: { left: 'lg:w-1/2', right: 'lg:w-1/2' },
  },
  '3/5': {
    sm: { left: 'sm:w-3/5', right: 'sm:w-2/5' },
    md: { left: 'md:w-3/5', right: 'md:w-2/5' },
    lg: { left: 'lg:w-3/5', right: 'lg:w-2/5' },
  },
  '2/3': {
    sm: { left: 'sm:w-2/3', right: 'sm:w-1/3' },
    md: { left: 'md:w-2/3', right: 'md:w-1/3' },
    lg: { left: 'lg:w-2/3', right: 'lg:w-1/3' },
  },
  '3/4': {
    sm: { left: 'sm:w-3/4', right: 'sm:w-1/4' },
    md: { left: 'md:w-3/4', right: 'md:w-1/4' },
    lg: { left: 'lg:w-3/4', right: 'lg:w-1/4' },
  },
};

const gapClasses = {
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

const flexRowClasses = {
  sm: 'sm:flex-row',
  md: 'md:flex-row',
  lg: 'lg:flex-row',
};

const stickyClasses = {
  sm: 'sm:sticky sm:self-start',
  md: 'md:sticky md:self-start',
  lg: 'lg:sticky lg:self-start',
};

const hiddenClasses = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  left,
  right,
  leftWidth = '1/3',
  gap = 'md',
  reverseOnMobile = false,
  breakpoint = 'md',
  stickyLeft = false,
  stickyRight = false,
  stickyOffset = 80, // Default: 64px header + 16px padding
  hideLeftOnMobile = false,
  hideRightOnMobile = false,
  className = '',
}) => {
  const widthClass = widthClasses[leftWidth][breakpoint];
  const gapClass = gapClasses[gap];
  const flexDirection = reverseOnMobile ? 'flex-col-reverse' : 'flex-col';
  const breakpointClass = flexRowClasses[breakpoint];

  // Build sticky classes
  const leftStickyClass = stickyLeft ? stickyClasses[breakpoint] : '';
  const rightStickyClass = stickyRight ? stickyClasses[breakpoint] : '';

  // Build visibility classes
  const leftVisibilityClass = hideLeftOnMobile ? hiddenClasses[breakpoint] : '';
  const rightVisibilityClass = hideRightOnMobile ? hiddenClasses[breakpoint] : '';

  return (
    <div
      className={`
        flex ${flexDirection} ${breakpointClass} ${gapClass}
        ${className}
      `.trim()}
    >
      {/* Left Column */}
      <div
        className={`
          w-full ${widthClass.left}
          ${leftStickyClass}
          ${leftVisibilityClass}
        `.trim()}
        style={stickyLeft ? { top: stickyOffset } : undefined}
      >
        {left}
      </div>

      {/* Right Column */}
      <div
        className={`
          w-full ${widthClass.right}
          ${rightStickyClass}
          ${rightVisibilityClass}
        `.trim()}
        style={stickyRight ? { top: stickyOffset } : undefined}
      >
        {right}
      </div>
    </div>
  );
};

// ============================================================================
// CONVENIENCE VARIANTS
// ============================================================================

/**
 * Sidebar layout with narrow left column
 */
export const SidebarLayout: React.FC<Omit<TwoColumnLayoutProps, 'leftWidth'>> = (props) => (
  <TwoColumnLayout leftWidth="1/4" stickyLeft {...props} />
);

/**
 * Equal split layout
 */
export const SplitLayout: React.FC<Omit<TwoColumnLayoutProps, 'leftWidth'>> = (props) => (
  <TwoColumnLayout leftWidth="1/2" {...props} />
);

/**
 * Master-detail layout (wide left, narrow right)
 */
export const MasterDetailLayout: React.FC<Omit<TwoColumnLayoutProps, 'leftWidth'>> = (props) => (
  <TwoColumnLayout leftWidth="2/3" {...props} />
);

export default TwoColumnLayout;
