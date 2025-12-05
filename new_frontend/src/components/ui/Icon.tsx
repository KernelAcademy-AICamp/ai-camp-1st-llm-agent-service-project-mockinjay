/**
 * Icon Component
 * 일관된 아이콘 렌더링을 위한 중앙화된 아이콘 컴포넌트
 *
 * Features:
 * - Centralized icon system
 * - Consistent sizing and styling
 * - Accessibility support
 * - Type-safe icon names
 */

import React from 'react';
import { cn } from '../../lib/utils';
import {
  getIcon,
  getIconSize,
  getIconStrokeWidth,
  getIconPreset,
  ICON_COLORS,
  type IconName,
  type IconSize,
  type IconStrokeWidth,
  type IconColor,
  type IconPreset,
  type LucideIcon,
} from '../../config/iconSystem';

interface BaseIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'size' | 'color' | 'ref'> {
  size?: IconSize | number;
  strokeWidth?: IconStrokeWidth | number;
  color?: IconColor | string;
  className?: string;
}

interface IconWithNameProps extends BaseIconProps {
  name: IconName;
  icon?: never;
}

interface IconWithComponentProps extends BaseIconProps {
  icon: LucideIcon;
  name?: never;
}

interface IconWithPresetProps extends BaseIconProps {
  preset: IconPreset;
  name?: IconName;
  icon?: LucideIcon;
}

type IconComponentProps = IconWithNameProps | IconWithComponentProps | IconWithPresetProps;

/**
 * Icon Component
 *
 * @example
 * // Using icon name
 * <Icon name="heart" size="md" color="primary" />
 *
 * @example
 * // Using icon component directly
 * <Icon icon={Heart} size={24} strokeWidth={2} />
 *
 * @example
 * // Using preset
 * <Icon name="spinner" preset="spinnerLarge" className="animate-spin" />
 */
export const Icon: React.FC<IconComponentProps> = (propsInput) => {
  const {
    name,
    icon,
    preset: presetProp,
    size = 'md',
    strokeWidth = 'normal',
    color,
    className,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    role,
    ...props
  } = propsInput as any;

  // Get preset configuration if provided
  const presetConfig = presetProp ? getIconPreset(presetProp as IconPreset) : undefined;

  // Determine icon component
  const IconComponent = icon || (name ? getIcon(name) : null);

  if (!IconComponent) {
    console.warn('Icon: No icon specified via name or icon prop');
    return null;
  }

  // Determine size (preset > prop > default)
  const iconSize = presetConfig?.size ?? getIconSize(size);

  // Determine stroke width (preset > prop > default)
  const iconStrokeWidth = presetConfig?.strokeWidth ?? getIconStrokeWidth(strokeWidth);

  // Determine color class
  const colorClass = color
    ? (color in ICON_COLORS ? ICON_COLORS[color as IconColor] : color)
    : '';

  // Determine accessibility attributes
  const accessibilityProps: Record<string, any> = {};

  if (ariaHidden !== undefined) {
    accessibilityProps['aria-hidden'] = ariaHidden;
  } else if (ariaLabel) {
    accessibilityProps['aria-label'] = ariaLabel;
    accessibilityProps['role'] = role || 'img';
  } else if (!ariaLabel && !ariaHidden) {
    // Default to decorative if no label provided
    accessibilityProps['aria-hidden'] = true;
  }

  return (
    <IconComponent
      size={iconSize}
      strokeWidth={iconStrokeWidth}
      className={cn(colorClass, className)}
      {...accessibilityProps}
      {...props}
    />
  );
};

Icon.displayName = 'Icon';

// ===========================================
// SPECIALIZED ICON COMPONENTS
// ===========================================

/**
 * Loading Spinner Icon
 */
interface LoadingSpinnerProps extends Omit<BaseIconProps, 'name' | 'icon'> {
  preset?: 'spinner' | 'spinnerLarge';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  preset = 'spinner',
  className,
  ...props
}) => {
  return (
    <Icon
      name="spinner"
      preset={preset}
      className={cn('animate-spin', className)}
      aria-label="로딩 중"
      {...props}
    />
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Status Icon Component
 * Renders appropriate icon based on status
 */
interface StatusIconProps extends Omit<BaseIconProps, 'name' | 'icon'> {
  status: 'success' | 'error' | 'warning' | 'info';
  showColor?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  showColor = true,
  size = 'md',
  className,
  ...props
}) => {
  const iconMap: Record<string, IconName> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const colorMap: Record<string, IconColor> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const iconName = iconMap[status];
  const iconColor = showColor ? colorMap[status] : undefined;

  return (
    <Icon
      name={iconName}
      size={size}
      color={iconColor}
      className={className}
      aria-label={status}
      {...props}
    />
  );
};

StatusIcon.displayName = 'StatusIcon';

/**
 * Empty State Icon
 * Large, subtle icon for empty states
 */
interface EmptyStateIconProps extends Omit<BaseIconProps, 'preset'> {
  name: IconName;
}

export const EmptyStateIcon: React.FC<EmptyStateIconProps> = ({
  name,
  color = 'muted',
  className,
  ...props
}) => {
  return (
    <Icon
      name={name}
      preset="emptyState"
      color={color}
      className={className}
      aria-hidden
      {...props}
    />
  );
};

EmptyStateIcon.displayName = 'EmptyStateIcon';

// ===========================================
// EXPORT TYPES
// ===========================================

export type {
  IconComponentProps,
  BaseIconProps,
  LoadingSpinnerProps,
  StatusIconProps,
  EmptyStateIconProps,
};
