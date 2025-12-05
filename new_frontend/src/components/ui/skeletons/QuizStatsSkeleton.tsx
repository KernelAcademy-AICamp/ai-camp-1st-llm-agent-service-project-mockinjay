import React from 'react';
import { Skeleton } from '../skeleton';

/**
 * Skeleton loader for Quiz Stats section
 * Used while loading quiz statistics on MyPage
 */
export const QuizStatsSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 gap-4">
      {/* Total Sessions */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-12" />
      </div>

      {/* Accuracy Rate */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>

      {/* Current Streak */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-10" />
      </div>

      {/* Level */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-8 w-14" />
      </div>
    </div>

    {/* Progress bar */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  </div>
);

export default QuizStatsSkeleton;
