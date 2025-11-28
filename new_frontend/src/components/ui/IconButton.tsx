/**
 * IconButton Component
 * 아이콘 전용 버튼 컴포넌트
 *
 * Features:
 * - Consistent icon button styling
 * - Multiple size variants
 * - Accessibility compliant
 * - Hover and active states
 */

import React from 'react';
import { cn } from './utils';
import { Icon } from './Icon';
import type { IconName, IconSize, LucideIcon } from '../../config/iconSystem';

// ===========================================
// TYPES
// ===========================================

interface BaseIconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline' | 'primary' | 'destructive';
  rounded?: boolean;
  disabled?: boolean;
  loading?: boolean;
  'aria-label': string; // Required for accessibility
}

interface IconButtonWithNameProps extends BaseIconButtonProps {
  icon: IconName;
  iconComponent?: never;
}

interface IconButtonWithComponentProps extends BaseIconButtonProps {
  iconComponent: LucideIcon;
  icon?: never;
}

type IconButtonProps = IconButtonWithNameProps | IconButtonWithComponentProps;

// ===========================================
// SIZE CONFIGURATIONS
// ===========================================

/**
 * Size configurations for IconButton
 *
 * Touch target sizes follow WCAG 2.2 guidelines:
 * - Minimum target size: 44x44px
 * - 'sm' uses 36px but has 44px touch area via min-w/min-h
 * - 'md' uses 40px (default)
 * - 'lg' uses 48px
 *
 * Mobile-first: All sizes meet minimum touch target requirements
 */
const SIZE_CONFIG = {
  sm: {
    button: 'w-9 h-9 min-w-[44px] min-h-[44px]',
    icon: 'sm' as IconSize,
  },
  md: {
    button: 'w-10 h-10 min-w-[44px] min-h-[44px]',
    icon: 'md' as IconSize,
  },
  lg: {
    button: 'w-12 h-12',
    icon: 'lg' as IconSize,
  },
} as const;

// ===========================================
// VARIANT STYLES
// ===========================================

const VARIANT_STYLES = {
  default: 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  outline: 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:-translate-y-0.5',
  destructive: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg',
} as const;

// ===========================================
// COMPONENT
// ===========================================

/**
 * IconButton Component
 *
 * @example
 * <IconButton
 *   icon="close"
 *   aria-label="닫기"
 *   onClick={handleClose}
 * />
 *
 * @example
 * <IconButton
 *   iconComponent={Heart}
 *   variant="primary"
 *   size="lg"
 *   aria-label="좋아요"
 *   onClick={handleLike}
 * />
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      iconComponent,
      size = 'md',
      variant = 'default',
      rounded = true,
      disabled = false,
      loading = false,
      className,
      'aria-label': ariaLabel,
      onClick,
      ...props
    },
    ref
  ) => {
    const sizeConfig = SIZE_CONFIG[size];

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-busy={loading}
        onClick={onClick}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',

          // Size
          sizeConfig.button,

          // Rounded
          rounded ? 'rounded-xl' : 'rounded-lg',

          // Variant
          VARIANT_STYLES[variant],

          className
        )}
        {...props}
      >
        {loading ? (
          <Icon
            name="spinner"
            size={sizeConfig.icon}
            className="animate-spin"
            aria-hidden
          />
        ) : icon ? (
          <Icon
            name={icon}
            size={sizeConfig.icon}
            aria-hidden
          />
        ) : iconComponent ? (
          <Icon
            icon={iconComponent}
            size={sizeConfig.icon}
            aria-hidden
          />
        ) : null}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ===========================================
// SPECIALIZED VARIANTS
// ===========================================

/**
 * Close Button
 * Commonly used close/dismiss button
 */
interface CloseButtonProps extends Omit<BaseIconButtonProps, 'icon' | 'iconComponent' | 'aria-label'> {
  'aria-label'?: string;
}

export const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ 'aria-label': ariaLabel = '닫기', ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        icon="close"
        variant="ghost"
        aria-label={ariaLabel}
        {...props}
      />
    );
  }
);

CloseButton.displayName = 'CloseButton';

/**
 * Menu Button
 * Hamburger menu button
 */
interface MenuButtonProps extends Omit<BaseIconButtonProps, 'icon' | 'iconComponent' | 'aria-label'> {
  'aria-label'?: string;
  isOpen?: boolean;
}

export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ 'aria-label': ariaLabel = '메뉴', isOpen = false, ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        icon={isOpen ? 'close' : 'menu'}
        variant="ghost"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        {...props}
      />
    );
  }
);

MenuButton.displayName = 'MenuButton';

/**
 * Back Button
 * Navigation back button
 */
interface BackButtonProps extends Omit<BaseIconButtonProps, 'icon' | 'iconComponent' | 'aria-label'> {
  'aria-label'?: string;
}

export const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ 'aria-label': ariaLabel = '뒤로 가기', ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        icon="back"
        variant="ghost"
        aria-label={ariaLabel}
        {...props}
      />
    );
  }
);

BackButton.displayName = 'BackButton';

/**
 * Search Button
 */
interface SearchButtonProps extends Omit<BaseIconButtonProps, 'icon' | 'iconComponent' | 'aria-label'> {
  'aria-label'?: string;
}

export const SearchButton = React.forwardRef<HTMLButtonElement, SearchButtonProps>(
  ({ 'aria-label': ariaLabel = '검색', ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        icon="search"
        variant="ghost"
        aria-label={ariaLabel}
        {...props}
      />
    );
  }
);

SearchButton.displayName = 'SearchButton';

/**
 * More Button
 * Three dots menu button
 */
interface MoreButtonProps extends Omit<BaseIconButtonProps, 'icon' | 'iconComponent' | 'aria-label'> {
  'aria-label'?: string;
  orientation?: 'vertical' | 'horizontal';
}

export const MoreButton = React.forwardRef<HTMLButtonElement, MoreButtonProps>(
  ({ 'aria-label': ariaLabel = '더보기', orientation = 'vertical', ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        icon={orientation === 'vertical' ? 'moreVertical' : 'moreHorizontal'}
        variant="ghost"
        aria-label={ariaLabel}
        {...props}
      />
    );
  }
);

MoreButton.displayName = 'MoreButton';

// ===========================================
// EXPORT TYPES
// ===========================================

export type {
  IconButtonProps,
  CloseButtonProps,
  MenuButtonProps,
  BackButtonProps,
  SearchButtonProps,
  MoreButtonProps,
};
