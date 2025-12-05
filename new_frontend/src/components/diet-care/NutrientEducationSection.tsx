import React from 'react';
import { BarChart2 } from 'lucide-react';

/**
 * Nutrient information structure
 */
export interface NutrientInfo {
  id: string;
  nameKo: string;
  nameEn: string;
  bulletPoints: {
    ko: string[];
    en: string[];
  };
}

/**
 * Props for NutrientEducationSection component
 */
export interface NutrientEducationSectionProps {
  /**
   * Nutrient information to display
   */
  nutrient: NutrientInfo;
  /**
   * Language for display ('en' for English, 'ko' for Korean)
   * @default 'ko'
   */
  language?: 'en' | 'ko';
  /**
   * Additional content to render below the bullet points (e.g., Safe/Warning cards)
   */
  children?: React.ReactNode;
  /**
   * Additional CSS classes for the section container
   */
  className?: string;
}

/**
 * NutrientEducationSection Component
 *
 * Displays educational content about specific nutrients (e.g., Potassium, Phosphorus)
 * with support for bilingual content and dark mode.
 *
 * @example
 * ```tsx
 * const potassiumInfo: NutrientInfo = {
 *   id: 'potassium',
 *   nameKo: '칼륨',
 *   nameEn: 'Potassium',
 *   bulletPoints: {
 *     ko: [
 *       '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
 *       '신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다'
 *     ],
 *     en: [
 *       'Potassium is a crucial mineral for nerve and muscle function',
 *       'When kidney function declines, potassium can accumulate in the body'
 *     ]
 *   }
 * };
 *
 * <NutrientEducationSection
 *   nutrient={potassiumInfo}
 *   language="ko"
 * >
 *   <SafeFoodCard foods={safeFoods} />
 *   <WarningFoodCard foods={warningFoods} />
 * </NutrientEducationSection>
 * ```
 */
export const NutrientEducationSection: React.FC<NutrientEducationSectionProps> = React.memo(({
  nutrient,
  language = 'ko',
  children,
  className = ''
}) => {
  // Select appropriate text based on language
  const displayName = language === 'ko' ? nutrient.nameKo : nutrient.nameEn;
  const bullets = nutrient.bulletPoints[language];

  // Validation: Ensure bullet points exist for selected language
  if (!bullets || bullets.length === 0) {
    console.warn(
      `NutrientEducationSection: No bullet points found for nutrient "${nutrient.id}" in language "${language}"`
    );
  }

  return (
    <section
      className={className}
      data-testid={`nutrient-section-${nutrient.id}`}
      aria-labelledby={`nutrient-heading-${nutrient.id}`}
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart2
          className="text-[#1F2937] dark:text-white"
          size={24}
          aria-hidden="true"
        />
        <h3
          id={`nutrient-heading-${nutrient.id}`}
          className="text-lg font-bold text-[#1F2937] dark:text-white"
        >
          {displayName} ({language === 'ko' ? nutrient.nameEn : nutrient.nameKo})
        </h3>
      </div>

      {/* Bullet points */}
      {bullets && bullets.length > 0 && (
        <div className="text-sm text-[#4B5563] dark:text-gray-400 space-y-2 mb-6 pl-1">
          {bullets.map((point, index) => (
            <p key={`${nutrient.id}-bullet-${index}`}>
              • {point}
            </p>
          ))}
        </div>
      )}

      {/* Additional content (e.g., Safe/Warning cards) */}
      {children && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </section>
  );
});

NutrientEducationSection.displayName = 'NutrientEducationSection';

export default NutrientEducationSection;
