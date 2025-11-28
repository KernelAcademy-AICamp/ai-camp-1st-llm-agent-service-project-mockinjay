import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Input Component - Design System v2.0
 *
 * Variants:
 * - default: Standard input with border
 * - filled: Subtle background, no border
 * - ghost: Minimal, borderless until focus
 *
 * Sizes:
 * - sm: 32px height
 * - default: 40px height
 * - lg: 48px height
 */
const inputVariants = cva(
  // Base styles
  [
    "flex w-full min-w-0 text-base md:text-sm",
    "bg-white transition-all duration-200 ease-smooth outline-none",
    "placeholder:text-text-tertiary",
    "selection:bg-primary selection:text-white",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
    // File input styling
    "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
    // Dark mode
    "dark:bg-input/30",
  ].join(" "),
  {
    variants: {
      variant: {
        // Default - Standard bordered input
        default: [
          "border-2 border-border-medium rounded-input px-4",
          "hover:border-border-strong",
          "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm",
          // Error state
          "aria-invalid:border-error aria-invalid:focus:border-error aria-invalid:focus:ring-error/20",
        ].join(" "),

        // Filled - Subtle background
        filled: [
          "border-0 bg-gray-100 rounded-input px-4",
          "hover:bg-gray-200/70",
          "focus:bg-white focus:ring-2 focus:ring-primary/20 focus:shadow-sm",
          "dark:bg-gray-800 dark:hover:bg-gray-700",
          "aria-invalid:bg-error-50 aria-invalid:focus:ring-error/20",
        ].join(" "),

        // Ghost - Minimal until focus
        ghost: [
          "border-0 border-b-2 border-transparent rounded-none px-0",
          "hover:border-border-medium",
          "focus:border-primary",
          "aria-invalid:border-error",
        ].join(" "),
      },
      inputSize: {
        sm: "h-8 text-sm",
        default: "h-10",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

// InputProps type for external use
export type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants> & {
    /** Left icon/element */
    leftIcon?: React.ReactNode;
    /** Right icon/element */
    rightIcon?: React.ReactNode;
    /** Error state */
    error?: boolean;
    /** Error message */
    errorMessage?: string;
  };

function Input({
  className,
  type,
  variant,
  inputSize,
  leftIcon,
  rightIcon,
  error,
  errorMessage,
  ...props
}: InputProps) {
  const hasIcons = leftIcon || rightIcon;

  if (hasIcons) {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          data-slot="input"
          aria-invalid={error || undefined}
          className={cn(
            inputVariants({ variant, inputSize }),
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightIcon}
          </div>
        )}
        {error && errorMessage && (
          <p className="mt-1.5 text-sm text-error">{errorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <input
        type={type}
        data-slot="input"
        aria-invalid={error || undefined}
        className={cn(inputVariants({ variant, inputSize, className }))}
        {...props}
      />
      {error && errorMessage && (
        <p className="mt-1.5 text-sm text-error">{errorMessage}</p>
      )}
    </>
  );
}

export { Input, inputVariants };
