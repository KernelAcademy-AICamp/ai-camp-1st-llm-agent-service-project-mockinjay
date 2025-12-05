/**
 * ButtonWithIcon Component
 * 아이콘 + 텍스트 조합 버튼 컴포넌트
 *
 * Features:
 * - Icon positioned before or after text
 * - Consistent spacing and alignment
 * - Inherits button variant styles
 * - Loading state support
 */

import React from 'react';
import { cn } from './utils';
import { Icon } from './Icon';
import { Button, type ButtonProps } from './button';
import type { IconName, LucideIcon } from '../../config/iconSystem';

// ===========================================
// TYPES
// ===========================================

interface BaseButtonWithIconProps extends Omit<ButtonProps, 'children'> {
  children: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconClassName?: string;
  loading?: boolean;
}

interface ButtonWithIconNameProps extends BaseButtonWithIconProps {
  icon: IconName;
  iconComponent?: never;
}

interface ButtonWithIconComponentProps extends BaseButtonWithIconProps {
  iconComponent: LucideIcon;
  icon?: never;
}

type ButtonWithIconProps = ButtonWithIconNameProps | ButtonWithIconComponentProps;

// ===========================================
// COMPONENT
// ===========================================

/**
 * ButtonWithIcon Component
 *
 * @example
 * <ButtonWithIcon icon="send" variant="primary">
 *   전송
 * </ButtonWithIcon>
 *
 * @example
 * <ButtonWithIcon
 *   iconComponent={Heart}
 *   iconPosition="right"
 *   variant="outline"
 * >
 *   좋아요
 * </ButtonWithIcon>
 */
export const ButtonWithIcon = React.forwardRef<HTMLButtonElement, ButtonWithIconProps>(
  (
    {
      icon,
      iconComponent,
      iconPosition = 'left',
      iconClassName,
      loading = false,
      children,
      disabled,
      className,
      size,
      ...props
    },
    ref
  ) => {
    // Determine icon size based on button size
    const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

    // Render icon element
    const iconElement = loading ? (
      <Icon
        name="spinner"
        size={iconSize}
        className={cn('animate-spin', iconClassName)}
        aria-hidden
      />
    ) : icon ? (
      <Icon
        name={icon}
        size={iconSize}
        className={iconClassName}
        aria-hidden
      />
    ) : iconComponent ? (
      <Icon
        icon={iconComponent}
        size={iconSize}
        className={iconClassName}
        aria-hidden
      />
    ) : null;

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        size={size}
        className={className}
        {...props}
      >
        {iconPosition === 'left' && (
          <span className="mr-2">{iconElement}</span>
        )}
        {children}
        {iconPosition === 'right' && (
          <span className="ml-2">{iconElement}</span>
        )}
      </Button>
    );
  }
);

ButtonWithIcon.displayName = 'ButtonWithIcon';

// ===========================================
// SPECIALIZED VARIANTS
// ===========================================

/**
 * Send Button
 */
interface SendButtonProps extends Omit<BaseButtonWithIconProps, 'icon' | 'iconComponent' | 'iconPosition'> {
  sending?: boolean;
}

export const SendButton = React.forwardRef<HTMLButtonElement, SendButtonProps>(
  ({ sending = false, children = '전송', ...props }, ref) => {
    return (
      <ButtonWithIcon
        ref={ref}
        icon="send"
        iconPosition="right"
        loading={sending}
        {...props}
      >
        {children}
      </ButtonWithIcon>
    );
  }
);

SendButton.displayName = 'SendButton';

/**
 * Download Button
 */
interface DownloadButtonProps extends Omit<BaseButtonWithIconProps, 'icon' | 'iconComponent'> {
  downloading?: boolean;
}

export const DownloadButton = React.forwardRef<HTMLButtonElement, DownloadButtonProps>(
  ({ downloading = false, children = '다운로드', iconPosition = 'left', ...props }, ref) => {
    return (
      <ButtonWithIcon
        ref={ref}
        icon="download"
        iconPosition={iconPosition}
        loading={downloading}
        {...props}
      >
        {children}
      </ButtonWithIcon>
    );
  }
);

DownloadButton.displayName = 'DownloadButton';

/**
 * Add Button
 */
interface AddButtonProps extends Omit<BaseButtonWithIconProps, 'icon' | 'iconComponent'> {}

export const AddButton = React.forwardRef<HTMLButtonElement, AddButtonProps>(
  ({ children = '추가', iconPosition = 'left', ...props }, ref) => {
    return (
      <ButtonWithIcon
        ref={ref}
        icon="add"
        iconPosition={iconPosition}
        {...props}
      >
        {children}
      </ButtonWithIcon>
    );
  }
);

AddButton.displayName = 'AddButton';

/**
 * Edit Button
 */
interface EditButtonProps extends Omit<BaseButtonWithIconProps, 'icon' | 'iconComponent'> {}

export const EditButton = React.forwardRef<HTMLButtonElement, EditButtonProps>(
  ({ children = '수정', iconPosition = 'left', ...props }, ref) => {
    return (
      <ButtonWithIcon
        ref={ref}
        icon="edit"
        iconPosition={iconPosition}
        {...props}
      >
        {children}
      </ButtonWithIcon>
    );
  }
);

EditButton.displayName = 'EditButton';

/**
 * Delete Button
 */
interface DeleteButtonProps extends Omit<BaseButtonWithIconProps, 'icon' | 'iconComponent'> {
  deleting?: boolean;
}

export const DeleteButton = React.forwardRef<HTMLButtonElement, DeleteButtonProps>(
  ({ deleting = false, children = '삭제', iconPosition = 'left', variant = 'destructive', ...props }, ref) => {
    return (
      <ButtonWithIcon
        ref={ref}
        icon="delete"
        iconPosition={iconPosition}
        loading={deleting}
        variant={variant}
        {...props}
      >
        {children}
      </ButtonWithIcon>
    );
  }
);

DeleteButton.displayName = 'DeleteButton';

/**
 * Share Button
 */
interface ShareButtonProps extends Omit<BaseButtonWithIconProps, 'icon' | 'iconComponent'> {}

export const ShareButton = React.forwardRef<HTMLButtonElement, ShareButtonProps>(
  ({ children = '공유', iconPosition = 'left', ...props }, ref) => {
    return (
      <ButtonWithIcon
        ref={ref}
        icon="share"
        iconPosition={iconPosition}
        {...props}
      >
        {children}
      </ButtonWithIcon>
    );
  }
);

ShareButton.displayName = 'ShareButton';

/**
 * Refresh Button
 */
interface RefreshButtonProps extends Omit<BaseButtonWithIconProps, 'icon' | 'iconComponent'> {
  refreshing?: boolean;
}

export const RefreshButton = React.forwardRef<HTMLButtonElement, RefreshButtonProps>(
  ({ refreshing = false, children = '새로고침', iconPosition = 'left', ...props }, ref) => {
    return (
      <ButtonWithIcon
        ref={ref}
        icon="refresh"
        iconPosition={iconPosition}
        loading={refreshing}
        iconClassName={refreshing ? 'animate-spin' : ''}
        {...props}
      >
        {children}
      </ButtonWithIcon>
    );
  }
);

RefreshButton.displayName = 'RefreshButton';

// ===========================================
// EXPORT TYPES
// ===========================================

export type {
  ButtonWithIconProps,
  SendButtonProps,
  DownloadButtonProps,
  AddButtonProps,
  EditButtonProps,
  DeleteButtonProps,
  ShareButtonProps,
  RefreshButtonProps,
};
