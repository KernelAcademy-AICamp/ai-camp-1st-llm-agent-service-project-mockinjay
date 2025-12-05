import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";

import { cn } from "./utils";

/**
 * Alert Component - Design System v2.0
 *
 * Alerts display important messages to users.
 *
 * Variants:
 * - default: Neutral information
 * - info: Informational messages
 * - success: Positive feedback
 * - warning: Caution/attention needed
 * - destructive: Error/critical messages
 */
const alertVariants = cva(
  // Base styles
  [
    "relative w-full rounded-xl px-4 py-3.5",
    "border-l-4 shadow-soft",
    "text-sm transition-all duration-200",
    "grid has-[>svg]:grid-cols-[1.25rem_1fr] grid-cols-[0_1fr]",
    "has-[>svg]:gap-x-3 gap-y-1 items-start",
    "[&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  ].join(" "),
  {
    variants: {
      variant: {
        // Default - Neutral
        default: [
          "bg-gray-50 border-l-gray-400 text-gray-800",
          "[&>svg]:text-gray-500",
        ].join(" "),

        // Info - Blue
        info: [
          "bg-info-50 border-l-info text-info-800",
          "[&>svg]:text-info",
        ].join(" "),

        // Success - Green
        success: [
          "bg-success-50 border-l-success text-success-800",
          "[&>svg]:text-success",
        ].join(" "),

        // Warning - Yellow/Amber
        warning: [
          "bg-warning-50 border-l-warning text-warning-800",
          "[&>svg]:text-warning-600",
        ].join(" "),

        // Destructive/Error - Red
        destructive: [
          "bg-error-50 border-l-error text-error-800",
          "[&>svg]:text-error",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Icon mapping for automatic icon rendering
const alertIcons = {
  default: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
};

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Show icon automatically based on variant */
    showIcon?: boolean;
    /** Custom icon (overrides automatic icon) */
    icon?: React.ReactNode;
  };

function Alert({
  className,
  variant = "default",
  showIcon = true,
  icon,
  children,
  ...props
}: AlertProps) {
  const IconComponent = alertIcons[variant || "default"];
  const shouldShowIcon = showIcon || icon;

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {shouldShowIcon && (icon || <IconComponent />)}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-5 font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 text-sm leading-relaxed opacity-90 [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

// Convenience components for common use cases
function InfoAlert({ children, ...props }: Omit<AlertProps, "variant">) {
  return (
    <Alert variant="info" {...props}>
      {children}
    </Alert>
  );
}

function SuccessAlert({ children, ...props }: Omit<AlertProps, "variant">) {
  return (
    <Alert variant="success" {...props}>
      {children}
    </Alert>
  );
}

function WarningAlert({ children, ...props }: Omit<AlertProps, "variant">) {
  return (
    <Alert variant="warning" {...props}>
      {children}
    </Alert>
  );
}

function ErrorAlert({ children, ...props }: Omit<AlertProps, "variant">) {
  return (
    <Alert variant="destructive" {...props}>
      {children}
    </Alert>
  );
}

export {
  Alert,
  AlertTitle,
  AlertDescription,
  InfoAlert,
  SuccessAlert,
  WarningAlert,
  ErrorAlert,
  alertVariants,
};
