/**
 * MealEntryCard Component
 * Displays individual meal history entry with foods and calorie information
 * Memoized to prevent unnecessary re-renders
 *
 * Usage Example:
 * ```tsx
 * import { MealEntryCard, type MealLog } from '@/components/diet-care';
 *
 * const log: MealLog = {
 *   date: '2025-11-23',
 *   meal: '아침',
 *   foods: ['현미밥', '된장찌개', '배추김치'],
 *   calories: 450
 * };
 *
 * <MealEntryCard
 *   log={log}
 *   language="ko"
 *   onClick={() => console.log('Card clicked')}
 * />
 * ```
 */

import React from 'react';

/**
 * Meal log data structure
 */
export interface MealLog {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Meal type (e.g., '아침', '점심', '저녁' in Korean or 'Breakfast', 'Lunch', 'Dinner' in English) */
  meal: string;
  /** Array of food items consumed in the meal */
  foods: string[];
  /** Total calories for the meal */
  calories: number;
}

/**
 * MealEntryCard component props
 */
export interface MealEntryCardProps {
  /** Meal log data to display */
  log: MealLog;
  /** Language for accessibility labels */
  language: 'en' | 'ko';
  /** Optional click handler for card interaction */
  onClick?: () => void;
}

/**
 * Memoized meal entry card component
 * Only re-renders when props change
 *
 * Displays:
 * - Meal type and date
 * - Calorie badge
 * - List of food items as tags
 *
 * Accessibility:
 * - Proper ARIA labels
 * - Keyboard navigation support
 * - Screen reader friendly structure
 * - Semantic HTML elements
 */
export const MealEntryCard: React.FC<MealEntryCardProps> = React.memo(({
  log,
  language,
  onClick
}) => {
  // Generate stable ID for ARIA labeling
  const cardId = `meal-entry-${log.date}-${log.meal.replace(/\s+/g, '-').toLowerCase()}`;

  // Accessibility labels based on language
  const a11yLabels = language === 'ko'
    ? {
        calories: '칼로리',
        foods: '음식 목록',
        clickToView: '자세히 보기',
      }
    : {
        calories: 'Calories',
        foods: 'Foods list',
        clickToView: 'Click to view details',
      };

  const cardContent = (
    <>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4
            id={`${cardId}-title`}
            className="font-bold text-[#1F2937] dark:text-white text-base"
          >
            {log.meal}
          </h4>
          <p
            className="text-sm text-[#9CA3AF] dark:text-gray-500 mt-1"
            aria-label={`Date: ${log.date}`}
          >
            {log.date}
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-lg text-sm font-medium bg-[#F3F4F6] dark:bg-gray-700 text-[#00C9B7] flex-shrink-0"
          aria-label={`${log.calories} ${a11yLabels.calories}`}
          role="status"
        >
          {log.calories} kcal
        </span>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="list"
        aria-label={a11yLabels.foods}
      >
        {log.foods.map((food, idx) => (
          <span
            key={idx}
            className="px-3 py-1 rounded-lg text-sm bg-[#F9FAFB] dark:bg-gray-700 text-[#4B5563] dark:text-gray-300"
            role="listitem"
          >
            {food}
          </span>
        ))}
      </div>
    </>
  );

  // Render as button if onClick is provided, otherwise as article
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg hover:border-[#00C9B7] border-2 border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C9B7] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-labelledby={`${cardId}-title`}
        aria-describedby={`${cardId}-foods`}
      >
        {cardContent}
        <span className="sr-only">{a11yLabels.clickToView}</span>
      </button>
    );
  }

  return (
    <article
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-transparent transition-shadow hover:shadow-md"
      aria-labelledby={`${cardId}-title`}
      role="article"
    >
      {cardContent}
    </article>
  );
});

MealEntryCard.displayName = 'MealEntryCard';
