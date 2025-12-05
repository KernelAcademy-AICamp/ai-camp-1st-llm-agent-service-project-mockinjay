/**
 * PageContainer - Standard container for all page content
 *
 * Features:
 * - Consistent max-width across pages
 * - Responsive horizontal padding (16px mobile, 24px tablet, 32px desktop)
 * - Configurable vertical padding
 * - Safe area support for mobile devices
 * - Center alignment option for auth pages
 *
 * Usage:
 * ```tsx
 * <PageContainer>
 *   <YourPageContent />
 * </PageContainer>
 *
 * <PageContainer maxWidth="full" noPadding>
 *   <CustomLayoutContent />
 * </PageContainer>
 *
 * <PageContainer centered verticalPadding="lg">
 *   <CenteredContent />
 * </PageContainer>
 * ```
 */

import React from 'react';
import { CONTAINER } from './constants';

// ============================================================================
// TYPES
// ============================================================================

interface PageContainerProps {
  children: React.ReactNode;
  /**
   * Maximum width of the container
   * - 'sm': 640px (forms, single-column content)
   * - 'md': 768px (articles, reading content)
   * - 'lg': 1024px (default - standard pages)
   * - 'xl': 1280px (dashboards, wide content)
   * - '2xl': 1536px (very wide layouts)
   * - 'full': no max-width constraint
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /**
   * Horizontal padding size
   * - 'none': no horizontal padding
   * - 'sm': 12px (compact layouts)
   * - 'md': responsive (16px mobile, 24px tablet, 32px desktop) - default
   * - 'lg': larger responsive padding
   */
  horizontalPadding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Vertical padding size
   * - 'none': no vertical padding
   * - 'sm': 16px top/bottom
   * - 'md': responsive (16px mobile, 24px tablet, 32px desktop) - default
   * - 'lg': 32px top/bottom
   * - 'xl': 48px top/bottom
   */
  verticalPadding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Center content vertically in viewport (useful for auth pages)
   */
  centered?: boolean;
  /**
   * Apply safe area insets for mobile devices with notches
   */
  useSafeArea?: boolean;
  /**
   * Full height container (100vh minus header/nav)
   */
  fullHeight?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * HTML element to render as (default: div)
   */
  as?: 'div' | 'section' | 'article' | 'main';
}

// ============================================================================
// CLASS MAPPINGS
// ============================================================================

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-screen-sm',    // 640px
  md: 'max-w-screen-md',    // 768px
  lg: 'max-w-screen-lg',    // 1024px
  xl: 'max-w-screen-xl',    // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
  full: 'max-w-full',
};

const horizontalPaddingClasses: Record<string, string> = {
  none: '',
  sm: 'px-3',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12',
};

const verticalPaddingClasses: Record<string, string> = {
  none: '',
  sm: 'py-4',
  md: 'py-4 sm:py-6 lg:py-8',
  lg: 'py-8',
  xl: 'py-12',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'lg',
  horizontalPadding = 'md',
  verticalPadding = 'md',
  centered = false,
  useSafeArea = false,
  fullHeight = false,
  className = '',
  as: Component = 'div',
}) => {
  const widthClass = maxWidthClasses[maxWidth];
  const hPaddingClass = horizontalPaddingClasses[horizontalPadding];
  const vPaddingClass = verticalPaddingClasses[verticalPadding];

  // Center alignment for auth/splash pages
  const centeredClass = centered
    ? 'flex flex-col items-center justify-center min-h-screen'
    : '';

  // Full height support
  const heightClass = fullHeight && !centered ? 'min-h-full' : '';

  // Safe area styles for mobile notches
  const safeAreaStyle = useSafeArea
    ? {
        paddingLeft: `max(${CONTAINER.PADDING.xs}px, env(safe-area-inset-left))`,
        paddingRight: `max(${CONTAINER.PADDING.xs}px, env(safe-area-inset-right))`,
      }
    : {};

  return (
    <Component
      className={`
        w-full
        ${hPaddingClass}
        ${vPaddingClass}
        ${centeredClass}
        ${heightClass}
        ${className}
      `.trim()}
      style={useSafeArea ? safeAreaStyle : undefined}
    >
      <div className={`${widthClass} mx-auto w-full`}>
        {children}
      </div>
    </Component>
  );
};

// ============================================================================
// CONVENIENCE VARIANTS
// ============================================================================

/**
 * Narrow container for forms and single-column content
 */
export const NarrowContainer: React.FC<Omit<PageContainerProps, 'maxWidth'>> = (props) => (
  <PageContainer maxWidth="sm" {...props} />
);

/**
 * Wide container for dashboards and data-heavy pages
 */
export const WideContainer: React.FC<Omit<PageContainerProps, 'maxWidth'>> = (props) => (
  <PageContainer maxWidth="xl" {...props} />
);

/**
 * Full-width container with no constraints
 */
export const FluidContainer: React.FC<Omit<PageContainerProps, 'maxWidth'>> = (props) => (
  <PageContainer maxWidth="full" {...props} />
);

export default PageContainer;
