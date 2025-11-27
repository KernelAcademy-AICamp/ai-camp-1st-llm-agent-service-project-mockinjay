import React from 'react';
import { Skeleton } from '../skeleton';

/**
 * Skeleton loader for PostCard component
 * Used while loading community posts
 */
export const PostCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
    <div className="flex items-start gap-4">
      {/* Avatar skeleton */}
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

      <div className="flex-1 space-y-3">
        {/* Author name */}
        <Skeleton className="h-4 w-24" />

        {/* Post title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Post content preview */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>

    {/* Post meta (likes, comments, date) */}
    <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20 ml-auto" />
    </div>
  </div>
);

export default PostCardSkeleton;
