import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../components/ui/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-t-transparent transition-all duration-300",
  {
    variants: {
      size: {
        xs: "w-4 h-4 border-2",
        sm: "w-5 h-5 border-2",
        md: "w-6 h-6 border-2",
        lg: "w-8 h-8 border-[3px]",
        xl: "w-12 h-12 border-[3px]",
      },
      variant: {
        primary: "border-primary",
        secondary: "border-secondary",
        white: "border-white",
        muted: "border-gray-400",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  showLabel?: boolean;
  label?: string;
}

export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'primary',
  showLabel = true,
  label = '로딩 중...',
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <div className={cn(spinnerVariants({ size, variant }))} />
      {showLabel && (
        <span className="text-sm text-text-secondary font-medium animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

export function InlineSpinner({
  size = 'sm',
  variant = 'primary',
  className,
}: VariantProps<typeof spinnerVariants> & { className?: string }) {
  return (
    <div className={cn(spinnerVariants({ size, variant }), className)} role="status" aria-label="Loading" />
  );
}
