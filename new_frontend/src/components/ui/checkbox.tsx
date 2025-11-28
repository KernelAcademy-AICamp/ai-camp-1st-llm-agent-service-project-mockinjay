"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Checkbox Component - Design System v2.0
 *
 * Accessible checkbox with indeterminate state support.
 */
const checkboxVariants = cva(
  // Base styles
  [
    "peer shrink-0",
    "border-2 bg-white rounded-md shadow-sm",
    "transition-all duration-200 ease-smooth outline-none",
    // States
    "hover:border-primary/50",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
    // Checked state
    "data-[state=checked]:bg-primary data-[state=checked]:text-white data-[state=checked]:border-primary",
    "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-white data-[state=indeterminate]:border-primary",
    // Disabled state
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
    // Error state
    "aria-invalid:border-error aria-invalid:focus:ring-error/20",
    // Dark mode
    "dark:bg-input/30",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-4",
        default: "size-5",
        lg: "size-6",
      },
      variant: {
        default: "border-border-medium",
        primary: "border-primary/30 data-[state=checked]:border-primary",
        success: "border-success/30 data-[state=checked]:bg-success data-[state=checked]:border-success",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants> & {
    /** Label text */
    label?: string;
    /** Description text below label */
    description?: string;
    /** Error state */
    error?: boolean;
    /** Error message */
    errorMessage?: string;
  };

function Checkbox({
  className,
  size,
  variant,
  label,
  description,
  error,
  errorMessage,
  id,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  const checkbox = (
    <CheckboxPrimitive.Root
      id={checkboxId}
      data-slot="checkbox"
      aria-invalid={error || undefined}
      className={cn(checkboxVariants({ size, variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-transform duration-150 scale-0 data-[state=checked]:scale-100 data-[state=indeterminate]:scale-100"
      >
        {props.checked === "indeterminate" ? (
          <MinusIcon className={cn(size === "sm" ? "size-3" : size === "lg" ? "size-4" : "size-3.5", "stroke-[3]")} />
        ) : (
          <CheckIcon className={cn(size === "sm" ? "size-3" : size === "lg" ? "size-4" : "size-3.5", "stroke-[3]")} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  // Without label
  if (!label) {
    return (
      <div>
        {checkbox}
        {error && errorMessage && (
          <p className="mt-1.5 text-sm text-error">{errorMessage}</p>
        )}
      </div>
    );
  }

  // With label
  return (
    <div className="flex items-start gap-3">
      {checkbox}
      <div className="flex-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            "text-sm font-medium leading-none cursor-pointer",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-error"
          )}
        >
          {label}
        </label>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
        {error && errorMessage && (
          <p className="mt-1 text-sm text-error">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

export { Checkbox, checkboxVariants };
