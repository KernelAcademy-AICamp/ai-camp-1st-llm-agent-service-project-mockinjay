import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Badge Component - Design System v2.0
 *
 * Badges are small status indicators, labels, or counters.
 *
 * Variants:
 * - default: Primary brand color
 * - secondary: Secondary brand color
 * - success/warning/error/info: Status indicators
 * - outline: Bordered style
 * - soft: Subtle background with colored text
 *
 * Sizes:
 * - sm: Compact (for dense UIs)
 * - default: Standard
 * - lg: Prominent
 */
const badgeVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center",
    "rounded-badge font-semibold whitespace-nowrap",
    "transition-all duration-200 ease-smooth",
    "[&>svg]:size-3 [&>svg]:pointer-events-none gap-1.5",
    "shrink-0 w-fit overflow-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary - Main brand
        default: [
          "bg-primary text-white shadow-sm",
          "[a&]:hover:bg-primary-hover [a&]:hover:shadow-md [a&]:hover:-translate-y-0.5",
        ].join(" "),

        // Secondary - Purple accent
        secondary: [
          "bg-secondary text-white shadow-sm",
          "[a&]:hover:bg-secondary-hover [a&]:hover:shadow-md [a&]:hover:-translate-y-0.5",
        ].join(" "),

        // Status - Success
        success: [
          "bg-success text-white shadow-sm",
          "[a&]:hover:bg-success-600 [a&]:hover:shadow-md",
        ].join(" "),

        // Status - Warning
        warning: [
          "bg-warning text-white shadow-sm",
          "[a&]:hover:bg-warning-600 [a&]:hover:shadow-md",
        ].join(" "),

        // Status - Error/Destructive
        error: [
          "bg-error text-white shadow-sm",
          "[a&]:hover:bg-error-600 [a&]:hover:shadow-md",
        ].join(" "),
        destructive: [
          "bg-error text-white shadow-sm",
          "[a&]:hover:bg-error-600 [a&]:hover:shadow-md",
        ].join(" "),

        // Status - Info
        info: [
          "bg-info text-white shadow-sm",
          "[a&]:hover:bg-info-600 [a&]:hover:shadow-md",
        ].join(" "),

        // Outline - Bordered
        outline: [
          "border-2 border-border-medium bg-white text-text-primary",
          "[a&]:hover:bg-gray-50 [a&]:hover:border-primary/40",
        ].join(" "),

        // Soft - Subtle background
        soft: [
          "bg-primary-light text-primary border border-primary/20",
          "[a&]:hover:bg-primary/15 [a&]:hover:border-primary/30",
        ].join(" "),

        // Soft variants for each status
        "soft-success": [
          "bg-success-50 text-success-700 border border-success/20",
          "[a&]:hover:bg-success-100",
        ].join(" "),

        "soft-warning": [
          "bg-warning-50 text-warning-700 border border-warning/20",
          "[a&]:hover:bg-warning-100",
        ].join(" "),

        "soft-error": [
          "bg-error-50 text-error-700 border border-error/20",
          "[a&]:hover:bg-error-100",
        ].join(" "),

        "soft-info": [
          "bg-info-50 text-info-700 border border-info/20",
          "[a&]:hover:bg-info-100",
        ].join(" "),

        // Ghost - Minimal
        ghost: [
          "bg-transparent text-text-secondary",
          "[a&]:hover:bg-gray-100 [a&]:hover:text-text-primary",
        ].join(" "),
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// BadgeProps type for external use
export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Render as child component */
    asChild?: boolean;
    /** Show dot indicator before text */
    dot?: boolean;
    /** Dot color (defaults to current color) */
    dotColor?: string;
  };

function Badge({
  className,
  variant,
  size,
  asChild = false,
  dot = false,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            dotColor ? `bg-[${dotColor}]` : "bg-current"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </Comp>
  );
}

// Counter Badge (for notification counts)
function BadgeCounter({
  count,
  max = 99,
  className,
  ...props
}: Omit<BadgeProps, "children"> & {
  count: number;
  max?: number;
}) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="error"
      size="sm"
      className={cn("min-w-[1.25rem] px-1.5 aspect-square", className)}
      {...props}
    >
      {displayCount}
    </Badge>
  );
}

export { Badge, BadgeCounter, badgeVariants };
