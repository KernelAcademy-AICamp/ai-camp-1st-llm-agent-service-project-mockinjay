import React from 'react';
import { Skeleton } from '../skeleton';

/**
 * Skeleton loader for Featured Post card
 * Used while loading featured posts in Community page
 */
export const FeaturedPostSkeleton: React.FC = () => (
  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 space-y-4">
    {/* Badge */}
    <Skeleton className="h-5 w-16 rounded-full" />

    {/* Title */}
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-6 w-3/4" />

    {/* Author & Date */}
    <div className="flex items-center gap-3 pt-2">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>

    {/* Stats */}
    <div className="flex gap-4 pt-2">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

/**
 * Multiple featured post skeletons for carousel
 */
export const FeaturedPostSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <FeaturedPostSkeleton key={index} />
    ))}
  </div>
);

export default FeaturedPostSkeleton;
