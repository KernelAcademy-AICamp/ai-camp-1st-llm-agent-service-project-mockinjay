"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Progress Component - Design System v2.0
 *
 * Progress indicators show the completion status of a task.
 */
const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-1",
        sm: "h-1.5",
        default: "h-2.5",
        lg: "h-3.5",
        xl: "h-5",
      },
      variant: {
        default: "bg-gray-200 dark:bg-gray-700",
        primary: "bg-primary/15",
        secondary: "bg-secondary/15",
        success: "bg-success/15",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 rounded-full transition-transform duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        primary: "bg-primary",
        secondary: "bg-secondary",
        success: "bg-success",
        gradient: "bg-gradient-to-r from-primary to-secondary",
        animated: "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-shimmer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  /** Indicator variant (can differ from track variant) */
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"];
  /** Show glow effect on indicator */
  showGlow?: boolean;
  /** Show label with percentage */
  showLabel?: boolean;
  /** Custom label format */
  labelFormat?: (value: number) => string;
}

function Progress({
  className,
  value,
  size,
  variant,
  indicatorVariant,
  showGlow = false,
  showLabel = false,
  labelFormat = (v) => `${Math.round(v)}%`,
  ...props
}: ProgressProps) {
  const percentage = value || 0;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-secondary">Progress</span>
          <span className="text-sm font-semibold text-foreground">{labelFormat(percentage)}</span>
        </div>
      )}
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(progressVariants({ size, variant }), className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            progressIndicatorVariants({ variant: indicatorVariant || (variant === "default" ? "primary" : variant) }),
            showGlow && "shadow-glow-primary"
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

// Circular Progress (alternative representation)
interface CircularProgressProps {
  /** Value from 0-100 */
  value?: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  variant?: "primary" | "secondary" | "success";
  /** Show label */
  showLabel?: boolean;
  /** Custom label format */
  labelFormat?: (value: number) => string;
  className?: string;
}

function CircularProgress({
  value = 0,
  size = 64,
  strokeWidth = 6,
  variant = "primary",
  showLabel = true,
  labelFormat = (v) => `${Math.round(v)}%`,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorMap = {
    primary: "stroke-primary",
    secondary: "stroke-secondary",
    success: "stroke-success",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(colorMap[variant], "transition-all duration-500 ease-out")}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-semibold text-foreground">
          {labelFormat(value)}
        </span>
      )}
    </div>
  );
}

export { Progress, CircularProgress, progressVariants, progressIndicatorVariants };
