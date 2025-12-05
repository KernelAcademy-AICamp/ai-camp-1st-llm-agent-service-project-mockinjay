/**
 * NutritionProgressBar Component
 * Displays a visual progress bar for nutrient consumption vs goals
 */

import React from 'react';
import { Progress } from '../ui/progress';

export interface NutritionProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  warningThreshold?: number;
  dangerThreshold?: number;
}

/**
 * Memoized component to prevent unnecessary re-renders
 */
export const NutritionProgressBar: React.FC<NutritionProgressBarProps> = React.memo(({
  label,
  current,
  target,
  unit,
  // color prop available for future customization
  color: _color = 'blue',
  warningThreshold = 80,
  dangerThreshold = 100,
}) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  const getTextColor = (): string => {
    if (percentage >= dangerThreshold) {
      return 'text-red-600 dark:text-red-400';
    } else if (percentage >= warningThreshold) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-gray-900 dark:text-white';
    }
  };

  return (
    <div
      className="space-y-2"
      role="region"
      aria-label={`${label} progress`}
    >
      <div className="flex justify-between items-center">
        <label
          className={`text-sm font-medium ${getTextColor()}`}
          id={`progress-label-${label.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {label}
        </label>
        <span
          className={`text-sm font-medium ${getTextColor()}`}
          aria-live="polite"
        >
          {current.toLocaleString()} / {target.toLocaleString()} {unit}
        </span>
      </div>

      <Progress
        value={percentage}
        className="h-2"
        aria-labelledby={`progress-label-${label.replace(/\s+/g, '-').toLowerCase()}`}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${percentage}% of daily goal`}
      />

      <div className="flex justify-end">
        <span
          className={`text-xs ${getTextColor()}`}
          role="status"
          aria-live="polite"
        >
          {percentage}%
          {percentage >= dangerThreshold && ' - Limit exceeded!'}
          {percentage >= warningThreshold && percentage < dangerThreshold && ' - Near limit'}
        </span>
      </div>
    </div>
  );
});

NutritionProgressBar.displayName = 'NutritionProgressBar';
