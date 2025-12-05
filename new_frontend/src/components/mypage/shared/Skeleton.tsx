/**
 * Skeleton Component
 * Loading placeholder component for MyPage
 */
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Quiz Stats Skeleton
export const QuizStatsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={100} height={20} />
      </div>

      {/* Total Points Card Skeleton */}
      <div className="rounded-xl p-4 mb-4 bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton variant="text" width={80} height={36} className="mb-2" />
            <Skeleton variant="text" width={100} height={16} />
          </div>
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </div>

      {/* Detailed Stats Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={80} height={16} />
            </div>
            <Skeleton variant="text" width={60} height={16} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Profile Card Skeleton
export const ProfileCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <div className="p-8 flex items-center">
        <Skeleton variant="circular" width={80} height={80} className="mr-6" />
        <div className="flex-1">
          <Skeleton variant="text" width={200} height={28} className="mb-2" />
          <Skeleton variant="text" width={250} height={20} className="mb-3" />
          <Skeleton variant="rounded" width={120} height={24} />
        </div>
      </div>
    </div>
  );
};

// Menu Item Skeleton
export const MenuItemSkeleton: React.FC = () => {
  return (
    <div className="px-6 py-4 flex items-center">
      <Skeleton variant="circular" width={20} height={20} className="mr-4" />
      <Skeleton variant="text" width={150} height={16} className="flex-1" />
      <Skeleton variant="circular" width={20} height={20} />
    </div>
  );
};

// Menu Section Skeleton
export const MenuSectionSkeleton: React.FC<{ items?: number }> = ({ items = 4 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <Skeleton variant="text" width={150} height={20} />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: items }).map((_, index) => (
          <MenuItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

// Health Info Card Skeleton
export const HealthInfoSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Skeleton variant="text" width={100} height={20} className="mb-4" />
      <div className="space-y-3">
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="80%" height={16} />
      </div>
      <Skeleton variant="rounded" width="100%" height={40} className="mt-4" />
    </div>
  );
};

// Full Page Skeleton
export const MyPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton variant="text" width={150} height={36} className="mb-8" />

      <ProfileCardSkeleton />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          <MenuSectionSkeleton items={4} />
          <MenuSectionSkeleton items={2} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuizStatsSkeleton />
          <HealthInfoSkeleton />
          <Skeleton variant="rounded" width="100%" height={48} />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
