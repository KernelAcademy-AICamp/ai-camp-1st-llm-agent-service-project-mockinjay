import React from 'react';
import { Check } from 'lucide-react';
import type { TermsCheckboxProps } from './types';

/**
 * TermsCheckbox Component
 * Accessible checkbox component for terms agreement
 *
 * Features:
 * - Keyboard accessible
 * - Screen reader friendly
 * - Visual feedback for checked state
 * - Support for required/optional distinction
 */
export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  checked,
  onChange,
  label,
  required = false,
  disabled = false,
  ariaLabel,
}) => {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          checked
            ? 'bg-primary border-primary'
            : 'border-gray-300 bg-white hover:border-gray-400'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          aria-label={ariaLabel || label}
        />
        {checked && (
          <Check
            size={14}
            className="text-white animate-scale-in"
            strokeWidth={3}
            aria-hidden="true"
          />
        )}
      </div>
      <span className="text-sm font-medium text-gray-700 select-none">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="필수">*</span>}
      </span>
    </label>
  );
};

/**
 * CustomCheckbox Component (Legacy support)
 * Simple checkbox without label for inline use
 */
export const CustomCheckbox: React.FC<{
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <div
    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
      checked ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="hidden"
    />
    {checked && <Check size={14} className="text-white" strokeWidth={3} />}
  </div>
);
