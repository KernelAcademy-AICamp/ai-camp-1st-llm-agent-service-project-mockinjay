/**
 * NutriCoachContent Component
 * Displays diet information and food image analysis
 * Enhanced with memoization and accessibility
 */

import React, { useMemo } from 'react';
import { Apple } from 'lucide-react';
import { DietTypeCard } from './DietTypeCard';
import { FoodImageAnalyzer } from './FoodImageAnalyzer';

export interface NutriCoachContentProps {
  language: 'en' | 'ko';
}

/**
 * Diet type configuration interface
 */
interface DietType {
  title: string;
  limit: string;
  tips: string[];
  color: string;
  slug: string;
}

export const NutriCoachContent: React.FC<NutriCoachContentProps> = React.memo(({ language }) => {
  /**
   * Memoize diet types to prevent recreation on every render
   * Only recalculates when language changes
   */
  const dietTypes = useMemo<DietType[]>(() => [
    {
      title: language === 'ko' ? '저염식 (Low Sodium)' : 'Low Sodium Diet',
      limit: language === 'ko' ? '하루 나트륨 섭취량 2,000mg 이하' : 'Daily sodium intake under 2,000mg',
      tips: language === 'ko'
        ? ['신선한 재료 사용', '가공식품 피하기', '천연 향신료 활용']
        : ['Use fresh ingredients', 'Avoid processed foods', 'Use natural spices'],
      color: 'border-blue-200 dark:border-blue-800',
      slug: 'low-sodium',
    },
    {
      title: language === 'ko' ? '저단백식 (Low Protein)' : 'Low Protein Diet',
      limit: language === 'ko' ? '체중 1kg당 0.6-0.8g 단백질' : '0.6-0.8g protein per kg body weight',
      tips: language === 'ko'
        ? ['양질의 단백질 섭취', '식물성 단백질 제한', '영양사 상담 권장']
        : ['Quality protein intake', 'Limit plant protein', 'Consult nutritionist'],
      color: 'border-green-200 dark:border-green-800',
      slug: 'low-protein',
    },
    {
      title: language === 'ko' ? '저칼륨식 (Low Potassium)' : 'Low Potassium Diet',
      limit: language === 'ko' ? '하루 칼륨 섭취량 2,000mg 이하' : 'Daily potassium under 2,000mg',
      tips: language === 'ko'
        ? ['과일/채소 데치기', '고칼륨 식품 피하기', '조리수 2회 이상 교체']
        : ['Blanch fruits/vegetables', 'Avoid high-K foods', 'Change cooking water 2+ times'],
      color: 'border-yellow-200 dark:border-yellow-800',
      slug: 'low-potassium',
    },
    {
      title: language === 'ko' ? '저인식 (Low Phosphorus)' : 'Low Phosphorus Diet',
      limit: language === 'ko' ? '하루 인 섭취량 800-1,000mg' : 'Daily phosphorus 800-1,000mg',
      tips: language === 'ko'
        ? ['유제품 제한', '견과류/잡곡 주의', '인 결합제 복용']
        : ['Limit dairy products', 'Watch nuts/grains', 'Take phosphate binders'],
      color: 'border-purple-200 dark:border-purple-800',
      slug: 'low-phosphorus',
    },
  ], [language]);

  return (
    <div className="space-y-6">
      {/* Diet Information Section */}
      <section
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        aria-labelledby="diet-info-heading"
      >
        <h2
          id="diet-info-heading"
          className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2"
        >
          <Apple className="text-green-600" aria-hidden="true" />
          {language === 'ko' ? '질환식 정보' : 'Disease-Specific Diet Information'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {language === 'ko'
            ? '만성콩팥병 단계별 맞춤 식단 정보와 영양 가이드를 제공합니다.'
            : 'Provides customized diet information and nutrition guides for each CKD stage.'}
        </p>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          role="list"
          aria-label={language === 'ko' ? '식단 유형 목록' : 'Diet types list'}
        >
          {dietTypes.map((diet) => (
            <DietTypeCard
              key={diet.title}
              title={diet.title}
              limit={diet.limit}
              tips={diet.tips}
              color={diet.color}
              dietTypeSlug={diet.slug}
            />
          ))}
        </div>
      </section>

      {/* Food Image Analysis Section */}
      <FoodImageAnalyzer language={language} />
    </div>
  );
});

NutriCoachContent.displayName = 'NutriCoachContent';
