/**
 * GridLayout - Responsive grid system for card layouts
 *
 * Features:
 * - Explicit column counts at each breakpoint
 * - Auto-fit mode for fluid grids
 * - Configurable gaps and alignment
 *
 * Usage:
 * ```tsx
 * // Explicit column counts
 * <GridLayout columns={{ xs: 1, sm: 2, lg: 3, xl: 4 }} gap="md">
 *   <Card />
 *   <Card />
 *   <Card />
 * </GridLayout>
 *
 * // Auto-fit fluid grid
 * <GridLayout autoFit minItemWidth="280px" gap="lg">
 *   <Card />
 *   <Card />
 *   <Card />
 * </GridLayout>
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface GridColumns {
  /** Extra small screens (< 640px) - default: 1 */
  xs?: 1 | 2;
  /** Small screens (>= 640px) - default: 2 */
  sm?: 1 | 2 | 3;
  /** Medium screens (>= 768px) - default: 2 */
  md?: 1 | 2 | 3 | 4;
  /** Large screens (>= 1024px) - default: 3 */
  lg?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Extra large screens (>= 1280px) - default: same as lg */
  xl?: 1 | 2 | 3 | 4 | 5 | 6;
  /** 2X large screens (>= 1536px) */
  '2xl'?: 1 | 2 | 3 | 4 | 5 | 6;
}

interface GridLayoutProps {
  children: React.ReactNode;
  /**
   * Number of columns at each breakpoint
   * Ignored if autoFit is true
   */
  columns?: GridColumns;
  /**
   * Gap between grid items
   * - 'xs': 8px
   * - 'sm': 12px
   * - 'md': 16px (default)
   * - 'lg': 24px
   * - 'xl': 32px
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Use CSS Grid auto-fit to automatically fill columns
   * Requires minItemWidth to be set
   */
  autoFit?: boolean;
  /**
   * Minimum width for each grid item when using autoFit
   * Example: '200px', '280px', '20rem'
   */
  minItemWidth?: string;
  /**
   * Maximum width for each grid item when using autoFit
   */
  maxItemWidth?: string;
  /**
   * Vertical alignment of grid items
   * - 'start': align to top
   * - 'center': center vertically
   * - 'end': align to bottom
   * - 'stretch': stretch to fill (default)
   */
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  /**
   * Horizontal alignment of grid items
   * - 'start': align to left
   * - 'center': center horizontally
   * - 'end': align to right
   * - 'stretch': stretch to fill (default)
   */
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================================================
// CLASS MAPPINGS
// ============================================================================

const gapClasses: Record<string, string> = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignItemsClasses: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyItemsClasses: Record<string, string> = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
};

// Base column classes (always applied for xs breakpoint)
const baseColumnClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

// Responsive column classes for each breakpoint
const smColumnClasses: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
};

const mdColumnClasses: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

const lgColumnClasses: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

const xlColumnClasses: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
};

const xl2ColumnClasses: Record<number, string> = {
  1: '2xl:grid-cols-1',
  2: '2xl:grid-cols-2',
  3: '2xl:grid-cols-3',
  4: '2xl:grid-cols-4',
  5: '2xl:grid-cols-5',
  6: '2xl:grid-cols-6',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = {},
  gap = 'md',
  autoFit = false,
  minItemWidth = '280px',
  maxItemWidth = '1fr',
  alignItems = 'stretch',
  justifyItems = 'stretch',
  className = '',
}) => {
  const gapClass = gapClasses[gap];
  const alignClass = alignItemsClasses[alignItems];
  const justifyClass = justifyItemsClasses[justifyItems];

  // Auto-fit mode: use CSS Grid auto-fit
  if (autoFit) {
    return (
      <div
        className={`grid ${gapClass} ${alignClass} ${justifyClass} ${className}`.trim()}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), ${maxItemWidth}))`,
        }}
      >
        {children}
      </div>
    );
  }

  // Explicit column mode: build responsive classes
  const { xs = 1, sm = 2, md = 2, lg = 3, xl, '2xl': xl2 } = columns;

  // Build class list
  const gridClasses = [
    baseColumnClasses[xs],
    smColumnClasses[sm],
    mdColumnClasses[md],
    lgColumnClasses[lg],
    xl ? xlColumnClasses[xl] : '',
    xl2 ? xl2ColumnClasses[xl2] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`grid ${gridClasses} ${gapClass} ${alignClass} ${justifyClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

// ============================================================================
// CONVENIENCE VARIANTS
// ============================================================================

/**
 * Card grid optimized for card layouts (1->2->3 columns)
 */
export const CardGrid: React.FC<Omit<GridLayoutProps, 'columns'> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <GridLayout columns={{ xs: 1, sm: 2, lg: 3 }} {...props}>
    {children}
  </GridLayout>
);

/**
 * Dense grid for smaller items (2->3->4 columns)
 */
export const DenseGrid: React.FC<Omit<GridLayoutProps, 'columns'> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <GridLayout columns={{ xs: 2, sm: 3, lg: 4, xl: 5 }} gap="sm" {...props}>
    {children}
  </GridLayout>
);

/**
 * Fluid grid that auto-fits based on item width
 */
export const FluidGrid: React.FC<Omit<GridLayoutProps, 'autoFit' | 'columns'> & { children: React.ReactNode }> = ({
  children,
  minItemWidth = '300px',
  ...props
}) => (
  <GridLayout autoFit minItemWidth={minItemWidth} {...props}>
    {children}
  </GridLayout>
);

/**
 * Single column stack layout
 */
export const StackLayout: React.FC<Omit<GridLayoutProps, 'columns'> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <GridLayout columns={{ xs: 1, sm: 1, md: 1, lg: 1 }} {...props}>
    {children}
  </GridLayout>
);

export default GridLayout;
