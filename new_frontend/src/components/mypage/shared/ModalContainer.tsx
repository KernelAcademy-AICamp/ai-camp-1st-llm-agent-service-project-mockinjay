/**
 * ModalContainer Component
 *
 * Accessible modal wrapper with focus trap, ESC key handling, and backdrop click
 * Follows WCAG 2.1 AA guidelines for modal dialogs
 *
 * @example
 * ```tsx
 * import { ModalContainer } from '@/components/mypage/shared';
 *
 * <ModalContainer
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit Profile"
 *   size="lg"
 * >
 *   <form>
 *     {/* Modal content *\/}
 *   </form>
 * </ModalContainer>
 * ```
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

export interface ModalContainerProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Modal title for accessibility and header */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether to close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Whether to close on ESC key */
  closeOnEscape?: boolean;
  /** Additional CSS classes for modal content */
  className?: string;
  /** Footer content */
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

/**
 * ModalContainer component for dialogs and overlays
 * Features:
 * - Focus trap (keeps focus within modal)
 * - ESC key to close
 * - Backdrop click to close
 * - ARIA attributes for accessibility
 * - Prevents body scroll when open
 * - Smooth animations
 */
export const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key press
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus modal when it opens
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Setup focus trap
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = Array.from(focusableElements || []) as HTMLElement[];
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore focus to previous element
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, handleEscapeKey]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`
          bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]}
          max-h-[90vh] flex flex-col
          animate-slideUp
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2
            id="modal-title"
            className="text-xl font-bold text-gray-900"
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="
                p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
                transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500
              "
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalContainer;
