/**
 * FoodInfoCard Component
 *
 * Reusable card components for displaying safe and warning foods in the DietCare page.
 * Supports bilingual content (Korean/English) and dark mode.
 *
 * Usage Example:
 * ```tsx
 * import { SafeFoodCard, WarningFoodCard } from './components/diet-care/FoodInfoCard';
 *
 * const safePotassiumFoods: FoodCategory[] = [
 *   { label: '과일', items: ['사과', '베리류', '체리'] },
 *   { label: '채소', items: ['양배추', '오이', '가지'] }
 * ];
 *
 * const warningPotassiumFoods: FoodCategory[] = [
 *   { label: '과일', items: ['바나나', '오렌지', '키위'] },
 *   { label: '채소', items: ['시금치', '감자', '고구마'] }
 * ];
 *
 * <SafeFoodCard
 *   title="저칼륨 음식 (먹어도 되는 음식)"
 *   categories={safePotassiumFoods}
 *   language="ko"
 * />
 *
 * <WarningFoodCard
 *   title="고칼륨 음식 (피해야 하는 음식)"
 *   categories={warningPotassiumFoods}
 *   language="ko"
 * />
 * ```
 */

import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

/**
 * Food category structure
 * Represents a labeled group of food items
 */
export interface FoodCategory {
  /**
   * Category label (e.g., '과일', '채소', '곡물')
   */
  label: string;
  /**
   * Array of food items in this category
   */
  items: string[];
}

/**
 * Props for FoodInfoCard component
 */
export interface FoodInfoCardProps {
  /**
   * Card type - determines icon and styling
   * - 'safe': Green check icon for recommended foods
   * - 'warning': Red alert triangle for foods to avoid
   */
  type: 'safe' | 'warning';
  /**
   * Card title displayed in the header
   */
  title: string;
  /**
   * Array of food categories to display
   */
  categories: FoodCategory[];
  /**
   * Language for display ('en' for English, 'ko' for Korean)
   * Currently used for ARIA labels
   * @default 'ko'
   */
  language?: 'en' | 'ko';
  /**
   * Additional CSS classes for the card container
   */
  className?: string;
}

/**
 * FoodInfoCard Component
 *
 * Generic card component for displaying categorized food information.
 * Renders either a safe foods card (green check) or warning foods card (red alert).
 *
 * Features:
 * - Accessible with proper ARIA labels and semantic HTML
 * - Dark mode support
 * - Responsive grid layout for categories
 * - Memoized for performance optimization
 */
export const FoodInfoCard: React.FC<FoodInfoCardProps> = React.memo(({
  type,
  title,
  categories,
  language = 'ko',
  className = ''
}) => {
  // Icon configuration based on card type
  const iconConfig = {
    safe: {
      Icon: Check,
      iconSize: 16,
      containerClasses: 'w-6 h-6 rounded bg-[#22C55E] dark:bg-green-600 flex items-center justify-center',
      iconColor: 'white',
      ariaLabel: language === 'ko' ? '안전한 음식' : 'Safe food'
    },
    warning: {
      Icon: AlertTriangle,
      iconSize: 24,
      containerClasses: 'text-[#EF4444] dark:text-red-500',
      iconColor: undefined,
      ariaLabel: language === 'ko' ? '주의 음식' : 'Warning food'
    }
  };

  const config = iconConfig[type];
  const Icon = config.Icon;

  return (
    <div
      className={`border border-[#E5E7EB] dark:border-gray-700 rounded-2xl p-6 bg-white dark:bg-gray-800 transition-colors ${className}`}
      role="region"
      aria-labelledby={`food-card-title-${type}`}
      data-testid={`food-info-card-${type}`}
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-2 mb-6">
        {type === 'safe' ? (
          <div className={config.containerClasses} aria-label={config.ariaLabel}>
            <Icon size={config.iconSize} color={config.iconColor} strokeWidth={3} aria-hidden="true" />
          </div>
        ) : (
          <Icon
            size={config.iconSize}
            className={config.containerClasses}
            aria-label={config.ariaLabel}
            aria-hidden="true"
          />
        )}
        <h4
          id={`food-card-title-${type}`}
          className="font-bold text-[#1F2937] dark:text-white"
        >
          {title}
        </h4>
      </div>

      {/* Food categories */}
      <div className="space-y-4 text-sm">
        {categories.map((category, index) => (
          <div
            key={`${type}-category-${index}`}
            className="flex gap-3"
            data-testid={`food-category-${index}`}
          >
            <span className="font-bold min-w-[40px] text-[#1F2937] dark:text-white flex-shrink-0">
              {category.label}:
            </span>
            <span className="text-[#6B7280] dark:text-gray-400">
              {category.items.join(', ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

FoodInfoCard.displayName = 'FoodInfoCard';

/**
 * Props for SafeFoodCard component
 */
export interface SafeFoodCardProps {
  /**
   * Card title (e.g., "저칼륨 음식 (먹어도 되는 음식)")
   */
  title: string;
  /**
   * Array of food categories to display
   */
  categories: FoodCategory[];
  /**
   * Language for display
   * @default 'ko'
   */
  language?: 'en' | 'ko';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SafeFoodCard Component
 *
 * Specialized card for displaying safe/recommended foods.
 * Features a green check icon in the header.
 *
 * @example
 * ```tsx
 * const safeFoods: FoodCategory[] = [
 *   { label: '과일', items: ['사과', '베리류', '체리', '포도'] },
 *   { label: '채소', items: ['양배추', '오이', '가지'] }
 * ];
 *
 * <SafeFoodCard
 *   title="저칼륨 음식 (먹어도 되는 음식)"
 *   categories={safeFoods}
 *   language="ko"
 * />
 * ```
 */
export const SafeFoodCard: React.FC<SafeFoodCardProps> = React.memo((props) => {
  return <FoodInfoCard type="safe" {...props} />;
});

SafeFoodCard.displayName = 'SafeFoodCard';

/**
 * Props for WarningFoodCard component
 */
export interface WarningFoodCardProps {
  /**
   * Card title (e.g., "고칼륨 음식 (피해야 하는 음식)")
   */
  title: string;
  /**
   * Array of food categories to display
   */
  categories: FoodCategory[];
  /**
   * Language for display
   * @default 'ko'
   */
  language?: 'en' | 'ko';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * WarningFoodCard Component
 *
 * Specialized card for displaying warning/restricted foods.
 * Features a red alert triangle icon in the header.
 *
 * @example
 * ```tsx
 * const warningFoods: FoodCategory[] = [
 *   { label: '과일', items: ['바나나', '오렌지', '키위'] },
 *   { label: '채소', items: ['시금치', '감자', '고구마'] }
 * ];
 *
 * <WarningFoodCard
 *   title="고칼륨 음식 (피해야 하는 음식)"
 *   categories={warningFoods}
 *   language="ko"
 * />
 * ```
 */
export const WarningFoodCard: React.FC<WarningFoodCardProps> = React.memo((props) => {
  return <FoodInfoCard type="warning" {...props} />;
});

WarningFoodCard.displayName = 'WarningFoodCard';

export default FoodInfoCard;
