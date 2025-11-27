/**
 * DailyProgress Component
 * Circular progress rings for nutrient tracking
 */

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import type { NutrientProgress, ProgressStatus, NutritionData } from '../../types/diet';

interface DailyProgressProps {
  current: Partial<NutritionData>;
  target: Partial<NutritionData>;
  onNutrientClick?: (nutrient: keyof NutritionData) => void;
  language?: 'en' | 'ko';
}

/**
 * Get progress status based on percentage
 */
function getProgressStatus(percentage: number): ProgressStatus {
  if (percentage <= 80) return 'good';
  if (percentage <= 100) return 'warning';
  return 'danger';
}

/**
 * Get status color
 */
function getStatusColor(status: ProgressStatus): string {
  switch (status) {
    case 'good':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'danger':
      return 'text-red-600 dark:text-red-400';
  }
}

/**
 * Get status background color
 */
function getStatusBgColor(status: ProgressStatus): string {
  switch (status) {
    case 'good':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'danger':
      return 'bg-red-500';
  }
}

/**
 * Circular Progress Ring Component
 */
const CircularProgress = memo<{
  percentage: number;
  status: ProgressStatus;
  size?: number;
  strokeWidth?: number;
}>(({ percentage, status, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const statusColor = useMemo(() => {
    switch (status) {
      case 'good': return '#22c55e';
      case 'warning': return '#eab308';
      case 'danger': return '#ef4444';
    }
  }, [status]);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted-foreground/20"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={statusColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
});

CircularProgress.displayName = 'CircularProgress';

/**
 * Daily Progress Component
 * Features: circular progress rings, color-coded status, animated updates
 */
export const DailyProgress = memo<DailyProgressProps>(({
  current,
  target,
  onNutrientClick,
  language = 'en',
}) => {
  const nutrientLabels = useMemo(() => ({
    calories: language === 'ko' ? '칼로리' : 'Calories',
    protein: language === 'ko' ? '단백질' : 'Protein',
    sodium: language === 'ko' ? '나트륨' : 'Sodium',
    potassium: language === 'ko' ? '칼륨' : 'Potassium',
    phosphorus: language === 'ko' ? '인' : 'Phosphorus',
  }), [language]);

  const nutrientUnits: Record<keyof NutritionData, string> = {
    calories: 'kcal',
    protein: 'g',
    sodium: 'mg',
    potassium: 'mg',
    phosphorus: 'mg',
    carbohydrates: 'g',
    fat: 'g',
  };

  /**
   * Calculate progress for all nutrients
   */
  const progressData = useMemo((): NutrientProgress[] => {
    const nutrients: (keyof NutritionData)[] = ['calories', 'protein', 'sodium', 'potassium', 'phosphorus'];

    return nutrients.map(nutrient => {
      const currentValue = current[nutrient] || 0;
      const targetValue = target[nutrient] || 0;
      const percentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
      const status = getProgressStatus(percentage);

      return {
        nutrient,
        current: currentValue,
        target: targetValue,
        percentage,
        status,
        unit: nutrientUnits[nutrient] as 'g' | 'mg' | 'kcal',
      };
    });
  }, [current, target]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {language === 'ko' ? '오늘의 영양 섭취' : 'Today\'s Nutrition'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {progressData.map((nutrient) => (
            <button
              key={nutrient.nutrient}
              onClick={() => onNutrientClick?.(nutrient.nutrient)}
              className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={`${nutrientLabels[nutrient.nutrient as keyof typeof nutrientLabels]} progress`}
            >
              {/* Circular Progress */}
              <div className="relative">
                <CircularProgress
                  percentage={nutrient.percentage}
                  status={nutrient.status}
                  size={100}
                  strokeWidth={8}
                />
                {/* Percentage in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-bold ${getStatusColor(nutrient.status)}`}>
                    {Math.round(nutrient.percentage)}%
                  </span>
                </div>
              </div>

              {/* Nutrient Info */}
              <div className="text-center space-y-1">
                <h4 className="font-semibold text-sm">
                  {nutrientLabels[nutrient.nutrient as keyof typeof nutrientLabels]}
                </h4>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{nutrient.current}</span>
                  {' / '}
                  <span>{nutrient.target}</span>
                  {' '}
                  {nutrient.unit}
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`w-full h-1 rounded-full ${getStatusBgColor(nutrient.status)}`} />
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {progressData.filter(n => n.status === 'good').length}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'ko' ? '목표 달성' : 'On Track'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {progressData.filter(n => n.status === 'warning').length}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'ko' ? '주의' : 'Warning'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {progressData.filter(n => n.status === 'danger').length}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'ko' ? '초과' : 'Over Limit'}
              </div>
            </div>
          </div>
        </div>

        {/* Linear Progress Bars (Alternative view for mobile) */}
        <div className="mt-6 space-y-3 md:hidden">
          {progressData.map((nutrient) => (
            <div key={`linear-${nutrient.nutrient}`} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {nutrientLabels[nutrient.nutrient as keyof typeof nutrientLabels]}
                </span>
                <span className={`text-xs font-semibold ${getStatusColor(nutrient.status)}`}>
                  {Math.round(nutrient.percentage)}%
                </span>
              </div>
              <Progress value={Math.min(nutrient.percentage, 100)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {nutrient.current} / {nutrient.target} {nutrient.unit}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

DailyProgress.displayName = 'DailyProgress';
