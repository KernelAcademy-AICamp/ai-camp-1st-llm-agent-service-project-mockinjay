/**
 * PageSection - Reusable section component with consistent vertical spacing
 *
 * Features:
 * - Consistent section spacing
 * - Optional title and subtitle
 * - Action slot for buttons/links
 * - Divider option between sections
 *
 * Usage:
 * ```tsx
 * <PageSection title="My Section" subtitle="Description text">
 *   <Content />
 * </PageSection>
 *
 * <PageSection
 *   title="Recent Activity"
 *   action={<Button>View All</Button>}
 *   spacing="lg"
 * >
 *   <ActivityList />
 * </PageSection>
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface PageSectionProps {
  children: React.ReactNode;
  /** Section title (optional) */
  title?: string;
  /** Section subtitle/description (optional) */
  subtitle?: string;
  /**
   * Vertical spacing after section
   * - 'none': no margin bottom
   * - 'sm': 16px (compact sections)
   * - 'md': 24px (default)
   * - 'lg': 32px (major sections)
   * - 'xl': 48px (page-level divisions)
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Action button or element to display alongside title */
  action?: React.ReactNode;
  /** Show divider line below section */
  divider?: boolean;
  /** Title size variant */
  titleSize?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** ID for anchor linking */
  id?: string;
}

// ============================================================================
// CLASS MAPPINGS
// ============================================================================

const spacingClasses: Record<string, string> = {
  none: '',
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8',
  xl: 'mb-12',
};

const titleSizeClasses: Record<string, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-3xl',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PageSection: React.FC<PageSectionProps> = ({
  children,
  title,
  subtitle,
  spacing = 'md',
  action,
  divider = false,
  titleSize = 'md',
  className = '',
  id,
}) => {
  const spacingClass = spacingClasses[spacing];
  const titleClass = titleSizeClasses[titleSize];

  return (
    <section
      id={id}
      className={`${spacingClass} ${className}`.trim()}
    >
      {/* Section Header */}
      {(title || action) && (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            {title && (
              <h2 className={`font-bold text-gray-900 ${titleClass}`}>
                {title}
              </h2>
            )}
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Section Content */}
      {children}

      {/* Optional Divider */}
      {divider && (
        <hr className="mt-6 sm:mt-8 border-gray-100" />
      )}
    </section>
  );
};

// ============================================================================
// CONVENIENCE VARIANTS
// ============================================================================

/**
 * Compact section with smaller title
 */
export const CompactSection: React.FC<Omit<PageSectionProps, 'titleSize' | 'spacing'>> = (props) => (
  <PageSection titleSize="sm" spacing="sm" {...props} />
);

/**
 * Major section with large title and spacing
 */
export const MajorSection: React.FC<Omit<PageSectionProps, 'titleSize' | 'spacing'>> = (props) => (
  <PageSection titleSize="lg" spacing="lg" {...props} />
);

export default PageSection;
