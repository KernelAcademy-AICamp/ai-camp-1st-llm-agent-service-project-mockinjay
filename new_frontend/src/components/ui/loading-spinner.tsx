import React from 'react';
import { cn } from "../../components/ui/utils";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className, size = 'md', ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-[20px] h-[20px] border-2',
    md: 'w-[24px] h-[24px] border-2',
    lg: 'w-[32px] h-[32px] border-[3px]',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} {...props}>
      <div 
        className={cn(
          "animate-spin rounded-full border-[#00C9B7] border-t-transparent",
          sizeClasses[size]
        )}
      />
      <span className="text-xs text-[#666666] font-medium">로딩 중...</span>
    </div>
  );
}
