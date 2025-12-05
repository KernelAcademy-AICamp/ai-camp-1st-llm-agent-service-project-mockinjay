/**
 * ConfirmDialog Component
 * Accessible confirmation dialog for destructive actions
 * Prevents accidental data loss for elderly users
 */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'danger',
  icon,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="text-red-600" size={24} />,
      iconBg: 'bg-red-100',
      title: 'text-red-900',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-600" size={24} />,
      iconBg: 'bg-yellow-100',
      title: 'text-yellow-900',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: <AlertTriangle className="text-blue-600" size={24} />,
      iconBg: 'bg-blue-100',
      title: 'text-blue-900',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div ref={dialogRef} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`${style.iconBg} rounded-full p-3`}>{icon || style.icon}</div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${style.title} mb-2`}>{title}</h3>
            <p className="text-gray-700">{description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px]">
            <X size={20} />
          </button>
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t">
          <button ref={cancelButtonRef} onClick={onClose} className="px-6 py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 min-h-[48px]">
            {cancelText}
          </button>
          <button onClick={handleConfirm} className={`px-6 py-3 rounded-xl font-medium text-white ${style.button} min-h-[48px]`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
