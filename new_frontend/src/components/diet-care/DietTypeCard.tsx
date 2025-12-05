/**
 * DietTypeCard Component
 * Displays disease-specific diet information card
 * Memoized to prevent unnecessary re-renders
 * Now clickable to navigate to detail page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface DietTypeCardProps {
  title: string;
  limit: string;
  tips: string[];
  color: string;
  dietTypeSlug?: string;
}

/**
 * Memoized diet type card component
 * Only re-renders when props change
 */
export const DietTypeCard: React.FC<DietTypeCardProps> = React.memo(({
  title,
  limit,
  tips,
  color,
  dietTypeSlug,
}) => {
  // Generate a stable ID from title for ARIA labeling
  const cardId = `diet-card-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const listId = `${cardId}-tips`;

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <h3
          id={`${cardId}-title`}
          className="font-semibold text-lg mb-2 text-gray-900 dark:text-white"
        >
          {title}
        </h3>
        {dietTypeSlug && (
          <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" size={20} />
        )}
      </div>
      <p
        className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium"
        aria-label={`Recommended limit: ${limit}`}
      >
        {limit}
      </p>
      <ul
        id={listId}
        className="space-y-1 text-sm text-gray-700 dark:text-gray-300"
        aria-label={`Tips for ${title}`}
      >
        {tips.map((tip, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      {dietTypeSlug && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
            자세히 보기 →
          </span>
        </div>
      )}
    </>
  );

  if (dietTypeSlug) {
    return (
      <Link
        to={`/diet-care/diet-type/${dietTypeSlug}`}
        className={`block border ${color} p-4 rounded-lg bg-white dark:bg-gray-800 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all group cursor-pointer`}
        aria-labelledby={`${cardId}-title`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article
      className={`border ${color} p-4 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow`}
      aria-labelledby={`${cardId}-title`}
      role="region"
    >
      {cardContent}
    </article>
  );
});

DietTypeCard.displayName = 'DietTypeCard';
