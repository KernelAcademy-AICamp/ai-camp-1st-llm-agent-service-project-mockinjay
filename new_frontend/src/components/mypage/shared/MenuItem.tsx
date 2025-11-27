/**
 * MenuItem Component
 *
 * Reusable menu item component for MyPage navigation
 * Supports badges, disabled state, and full accessibility
 *
 * @example
 * ```tsx
 * import { MenuItem } from '@/components/mypage/shared';
 *
 * <MenuItem
 *   icon={<User size={20} />}
 *   label="Profile Information"
 *   onClick={() => navigate('/profile')}
 *   badge={3}
 *   ariaLabel="View profile information (3 notifications)"
 * />
 * ```
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface MenuItemProps {
  /** Icon to display (Lucide React component recommended) */
  icon: React.ReactNode;
  /** Label text for the menu item */
  label: string;
  /** Click handler function */
  onClick?: () => void;
  /** Optional badge number to display */
  badge?: number;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MenuItem component for navigation lists
 * Features:
 * - Icon with hover state
 * - Optional badge display
 * - Disabled state support
 * - Full keyboard navigation
 * - ARIA attributes for accessibility
 * - Memoized for performance
 */
export const MenuItem: React.FC<MenuItemProps> = React.memo(({
  icon,
  label,
  onClick,
  badge,
  disabled = false,
  ariaLabel,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-disabled={disabled}
      className={`
        w-full px-6 py-4 flex items-center justify-between
        transition-colors text-left group
        ${disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset'
        }
        ${className}
      `}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div
          className={`
            flex-shrink-0 mr-4 transition-colors
            ${disabled
              ? 'text-gray-300'
              : 'text-gray-400 group-hover:text-primary-600'
            }
          `}
        >
          {icon}
        </div>
        <span
          className={`
            font-medium transition-colors truncate
            ${disabled
              ? 'text-gray-400'
              : 'text-gray-700 group-hover:text-gray-900'
            }
          `}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {badge !== undefined && badge > 0 && (
          <span
            className="px-2.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full"
            aria-label={`${badge} items`}
          >
            {badge}
          </span>
        )}
        {!disabled && (
          <ChevronRight
            size={20}
            className="text-gray-300 group-hover:text-gray-500 transition-colors"
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  );
});

MenuItem.displayName = 'MenuItem';

export default MenuItem;
