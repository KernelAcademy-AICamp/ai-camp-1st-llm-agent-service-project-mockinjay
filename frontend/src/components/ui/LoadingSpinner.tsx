import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "로딩 중..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-6 h-6 md:w-[24px] md:h-[24px] rounded-full border-2 border-[#E0E0E0] border-t-[#00C9B7] animate-spin mb-3"></div>
      <span className="text-xs font-medium text-[#666666]">{message}</span>
    </div>
  );
}
