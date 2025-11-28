import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Button Component - Design System v2.0
 *
 * Variants:
 * - default (primary): Main CTA buttons, primary actions
 * - secondary: Secondary actions, alternative to primary
 * - destructive: Dangerous/irreversible actions
 * - outline: Bordered buttons for secondary emphasis
 * - ghost: Text-only buttons, minimal emphasis
 * - link: Hyperlink-style buttons
 *
 * Sizes:
 * - sm: 32px height, compact UI
 * - default: 40px height, standard UI
 * - lg: 48px height, prominent CTAs
 * - icon/icon-sm/icon-lg: Square icon buttons
 */
const buttonVariants = cva(
  // Base styles - consistent across all variants
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap text-sm font-semibold",
    "transition-all duration-200 ease-smooth",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    "shrink-0 outline-none relative overflow-hidden",
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Accessibility: aria-invalid styling
    "aria-invalid:ring-error/20 dark:aria-invalid:ring-error/40 aria-invalid:border-error",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary - Main brand CTA
        default: [
          "bg-primary text-white rounded-button",
          "shadow-button",
          "hover:bg-primary-hover hover:shadow-button-hover hover:-translate-y-0.5",
          "active:bg-primary-pressed active:translate-y-0 active:shadow-button",
          "focus-visible:ring-primary/50",
        ].join(" "),

        // Secondary - Purple accent
        secondary: [
          "bg-secondary text-white rounded-button",
          "shadow-button",
          "hover:bg-secondary-hover hover:shadow-button-hover hover:-translate-y-0.5",
          "active:bg-secondary-pressed active:translate-y-0 active:shadow-button",
          "focus-visible:ring-secondary/50",
        ].join(" "),

        // Destructive - Error/danger actions
        destructive: [
          "bg-error text-white rounded-button",
          "shadow-button",
          "hover:bg-error-600 hover:shadow-button-hover hover:-translate-y-0.5",
          "active:bg-error-700 active:translate-y-0 active:shadow-button",
          "focus-visible:ring-error/50",
          "dark:bg-error/80 dark:hover:bg-error/90",
        ].join(" "),

        // Outline - Bordered secondary
        outline: [
          "border-2 border-primary/30 bg-white text-primary rounded-button",
          "shadow-sm",
          "hover:bg-primary-light hover:border-primary/50 hover:-translate-y-0.5",
          "active:bg-primary-100 active:translate-y-0",
          "focus-visible:ring-primary/50",
          "dark:bg-transparent dark:border-primary/40 dark:hover:bg-primary/10",
        ].join(" "),

        // Ghost - Minimal, text-only feel
        ghost: [
          "rounded-button-sm text-text-secondary",
          "hover:bg-gray-100 hover:text-text-primary",
          "active:bg-gray-200",
          "focus-visible:ring-primary/30",
          "dark:hover:bg-gray-800 dark:hover:text-gray-100",
        ].join(" "),

        // Link - Hyperlink style
        link: [
          "text-primary underline-offset-4 rounded-sm px-1",
          "hover:underline",
          "focus-visible:ring-primary/30",
        ].join(" "),

        // Success - Positive/confirmation actions
        success: [
          "bg-success text-white rounded-button",
          "shadow-button",
          "hover:bg-success-600 hover:shadow-button-hover hover:-translate-y-0.5",
          "active:bg-success-700 active:translate-y-0 active:shadow-button",
          "focus-visible:ring-success/50",
        ].join(" "),
      },
      size: {
        // Small - Compact UI, tables, dense layouts
        sm: "h-8 rounded-button-sm gap-1.5 px-4 text-xs has-[>svg]:px-3",

        // Default - Standard buttons
        default: "h-10 px-6 py-2.5 has-[>svg]:px-4",

        // Large - Prominent CTAs, full-width mobile
        lg: "h-12 rounded-button-lg px-8 text-base has-[>svg]:px-6",

        // Icon buttons - Square, for icon-only
        icon: "size-10 rounded-button p-0",
        "icon-sm": "size-8 rounded-button-sm p-0",
        "icon-lg": "size-12 rounded-button-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ButtonProps type for external use
export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render as child component (for Link wrappers, etc.) */
    asChild?: boolean;
    /** Show loading spinner */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || loading;

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin rounded-full border-2 border-current border-t-transparent size-4" />
          <span className="sr-only">Loading...</span>
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
