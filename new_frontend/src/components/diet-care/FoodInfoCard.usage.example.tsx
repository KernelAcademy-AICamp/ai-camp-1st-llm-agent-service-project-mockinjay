/**
 * FoodInfoCard Usage Examples
 *
 * This file demonstrates how to use SafeFoodCard and WarningFoodCard components
 * in various scenarios within the DietCare page.
 */

import React from 'react';
import { SafeFoodCard, WarningFoodCard, type FoodCategory } from './FoodInfoCard';
import { NutrientEducationSection, type NutrientInfo } from './NutrientEducationSection';

// =============================================================================
// EXAMPLE 1: Basic Usage with Potassium Information
// =============================================================================

export const PotassiumFoodExample: React.FC = () => {
  // Define safe food categories for low potassium
  const safePotassiumFoods: FoodCategory[] = [
    { label: '과일', items: ['사과', '베리류', '체리', '포도', '배', '파인애플', '수박'] },
    { label: '채소', items: ['양배추', '오이', '가지', '상추', '양파', '피망', '무'] },
    { label: '곡물', items: ['흰 쌀밥', '흰 빵', '파스타', '크래커'] },
    { label: '기타', items: ['초콜릿', '커피'] }
  ];

  // Define warning food categories for high potassium
  const warningPotassiumFoods: FoodCategory[] = [
    { label: '과일', items: ['바나나', '오렌지', '키위', '멜론', '아보카도', '토마토'] },
    { label: '채소', items: ['시금치', '감자', '고구마', '호박', '브로콜리', '당근', '버섯'] },
    { label: '견과류', items: ['모든 견과류'] }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <SafeFoodCard
        title="저칼륨 음식 (먹어도 되는 음식)"
        categories={safePotassiumFoods}
        language="ko"
      />
      <WarningFoodCard
        title="고칼륨 음식 (피해야 하는 음식)"
        categories={warningPotassiumFoods}
        language="ko"
      />
    </div>
  );
};

// =============================================================================
// EXAMPLE 2: Phosphorus Information with Nutrient Education Section
// =============================================================================

export const PhosphorusFoodExample: React.FC = () => {
  // Define safe food categories for low phosphorus
  const safePhosphorusFoods: FoodCategory[] = [
    { label: '단백질', items: ['신선한 닭고기', '계란', '생선(참치, 연어)'] },
    { label: '유제품 대체', items: ['쌀 우유', '아몬드 우유', '두유(무인 제품)'] },
    { label: '곡물', items: ['흰 쌀밥', '파스타'] },
    { label: '스낵', items: ['무염 팝콘', '쌀과자', '과일 스낵'] }
  ];

  // Define warning food categories for high phosphorus
  const warningPhosphorusFoods: FoodCategory[] = [
    { label: '단백질', items: ['붉은 육류', '햄/소시지', '치즈', '우유', '요구르트'] },
    { label: '가공식품', items: ['냉동식품', '인스턴트 식품'] },
    { label: '음료', items: ['콜라/탄산음료', '맥주'] },
    { label: '기타', items: ['견과류', '초콜릿'] }
  ];

  // Define nutrient information
  const phosphorusInfo: NutrientInfo = {
    id: 'phosphorus',
    nameKo: '인',
    nameEn: 'Phosphorus',
    bulletPoints: {
      ko: [
        '인은 뼈와 치아 건강에 필수적인 미네랄입니다',
        '신장 질환 시 인이 혈액에 축적됩니다',
        '고인혈증은 뼈를 약하게 만들고 혈관을 석회화시킵니다',
        '가공식품과 탄산음료에 인이 많이 들어있습니다'
      ],
      en: [
        'Phosphorus is essential for bone and tooth health',
        'During kidney disease, phosphorus accumulates in the blood',
        'Hyperphosphatemia weakens bones and calcifies blood vessels',
        'Processed foods and carbonated drinks contain high phosphorus'
      ]
    }
  };

  return (
    <NutrientEducationSection nutrient={phosphorusInfo} language="ko">
      <div className="grid md:grid-cols-2 gap-6">
        <SafeFoodCard
          title="저인 음식"
          categories={safePhosphorusFoods}
          language="ko"
        />
        <WarningFoodCard
          title="고인 음식"
          categories={warningPhosphorusFoods}
          language="ko"
        />
      </div>
    </NutrientEducationSection>
  );
};

// =============================================================================
// EXAMPLE 3: English Version with Sodium Information
// =============================================================================

export const SodiumFoodExampleEnglish: React.FC = () => {
  // Define safe food categories for low sodium (English)
  const safeSodiumFoods: FoodCategory[] = [
    { label: 'Vegetables', items: ['Fresh vegetables', 'Unsalted tomatoes', 'Leafy greens'] },
    { label: 'Proteins', items: ['Fresh poultry', 'Unsalted fish', 'Eggs'] },
    { label: 'Grains', items: ['Unsalted rice', 'Unsalted pasta', 'Whole grain bread'] },
    { label: 'Seasonings', items: ['Herbs', 'Spices', 'Lemon juice', 'Vinegar'] }
  ];

  // Define warning food categories for high sodium (English)
  const warningSodiumFoods: FoodCategory[] = [
    { label: 'Processed', items: ['Canned soups', 'Deli meats', 'Frozen meals'] },
    { label: 'Condiments', items: ['Soy sauce', 'Ketchup', 'Salad dressings'] },
    { label: 'Snacks', items: ['Chips', 'Pretzels', 'Salted nuts'] },
    { label: 'Fast food', items: ['All fast food items'] }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <SafeFoodCard
        title="Low Sodium Foods (Safe to Eat)"
        categories={safeSodiumFoods}
        language="en"
      />
      <WarningFoodCard
        title="High Sodium Foods (Foods to Avoid)"
        categories={warningSodiumFoods}
        language="en"
      />
    </div>
  );
};

// =============================================================================
// EXAMPLE 4: Complete DietCare Page Integration
// =============================================================================

export const CompleteDietCareExample: React.FC = () => {
  // Potassium nutrient info
  const potassiumInfo: NutrientInfo = {
    id: 'potassium',
    nameKo: '칼륨',
    nameEn: 'Potassium',
    bulletPoints: {
      ko: [
        '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
        '신장 기능이 저하되면 칼륨이 체내에 축적됩니다',
        '고칼륨혈증은 심장 박동 이상을 일으킬 수 있습니다',
        '투석 환자는 칼륨 섭취를 제한해야 합니다'
      ],
      en: [
        'Potassium is crucial for nerve and muscle function',
        'When kidney function declines, potassium accumulates',
        'Hyperkalemia can cause heart rhythm abnormalities',
        'Dialysis patients must limit potassium intake'
      ]
    }
  };

  // Define safe and warning foods for potassium
  const safePotassiumFoods: FoodCategory[] = [
    { label: '과일', items: ['사과', '베리류', '체리', '포도', '배', '파인애플', '수박'] },
    { label: '채소', items: ['양배추', '오이', '가지', '상추', '양파', '피망', '무'] },
    { label: '곡물', items: ['흰 쌀밥', '흰 빵', '파스타', '크래커'] },
    { label: '기타', items: ['초콜릿', '커피'] }
  ];

  const warningPotassiumFoods: FoodCategory[] = [
    { label: '과일', items: ['바나나', '오렌지', '키위', '멜론', '아보카도', '토마토'] },
    { label: '채소', items: ['시금치', '감자', '고구마', '호박', '브로콜리', '당근', '버섯'] },
    { label: '견과류', items: ['모든 견과류'] }
  ];

  // Phosphorus nutrient info
  const phosphorusInfo: NutrientInfo = {
    id: 'phosphorus',
    nameKo: '인',
    nameEn: 'Phosphorus',
    bulletPoints: {
      ko: [
        '인은 뼈와 치아 건강에 필수적인 미네랄입니다',
        '신장 질환 시 인이 혈액에 축적됩니다',
        '고인혈증은 뼈를 약하게 만들고 혈관을 석회화시킵니다',
        '가공식품과 탄산음료에 인이 많이 들어있습니다'
      ],
      en: [
        'Phosphorus is essential for bone and tooth health',
        'During kidney disease, phosphorus accumulates',
        'Hyperphosphatemia weakens bones and calcifies vessels',
        'Processed foods and soda contain high phosphorus'
      ]
    }
  };

  // Define safe and warning foods for phosphorus
  const safePhosphorusFoods: FoodCategory[] = [
    { label: '단백질', items: ['신선한 닭고기', '계란', '생선(참치, 연어)'] },
    { label: '유제품 대체', items: ['쌀 우유', '아몬드 우유', '두유(무인 제품)'] },
    { label: '곡물', items: ['흰 쌀밥', '파스타'] },
    { label: '스낵', items: ['무염 팝콘', '쌀과자', '과일 스낵'] }
  ];

  const warningPhosphorusFoods: FoodCategory[] = [
    { label: '단백질', items: ['붉은 육류', '햄/소시지', '치즈', '우유', '요구르트'] },
    { label: '가공식품', items: ['냉동식품', '인스턴트 식품'] },
    { label: '음료', items: ['콜라/탄산음료', '맥주'] },
    { label: '기타', items: ['견과류', '초콜릿'] }
  ];

  return (
    <div className="space-y-12">
      {/* Potassium Section */}
      <NutrientEducationSection nutrient={potassiumInfo} language="ko">
        <div className="grid md:grid-cols-2 gap-6">
          <SafeFoodCard
            title="저칼륨 음식 (먹어도 되는 음식)"
            categories={safePotassiumFoods}
            language="ko"
          />
          <WarningFoodCard
            title="고칼륨 음식 (피해야 하는 음식)"
            categories={warningPotassiumFoods}
            language="ko"
          />
        </div>
      </NutrientEducationSection>

      {/* Phosphorus Section */}
      <NutrientEducationSection nutrient={phosphorusInfo} language="ko">
        <div className="grid md:grid-cols-2 gap-6">
          <SafeFoodCard
            title="저인 음식"
            categories={safePhosphorusFoods}
            language="ko"
          />
          <WarningFoodCard
            title="고인 음식"
            categories={warningPhosphorusFoods}
            language="ko"
          />
        </div>
      </NutrientEducationSection>
    </div>
  );
};

// =============================================================================
// EXAMPLE 5: Single Column Layout (Mobile-First)
// =============================================================================

export const MobileLayoutExample: React.FC = () => {
  const safeFoods: FoodCategory[] = [
    { label: '과일', items: ['사과', '베리류', '체리'] },
    { label: '채소', items: ['양배추', '오이', '가지'] }
  ];

  const warningFoods: FoodCategory[] = [
    { label: '과일', items: ['바나나', '오렌지', '키위'] },
    { label: '채소', items: ['시금치', '감자', '고구마'] }
  ];

  return (
    <div className="space-y-6">
      <SafeFoodCard
        title="저칼륨 음식"
        categories={safeFoods}
        language="ko"
      />
      <WarningFoodCard
        title="고칼륨 음식"
        categories={warningFoods}
        language="ko"
      />
    </div>
  );
};

// =============================================================================
// EXAMPLE 6: Custom Styling with Additional Classes
// =============================================================================

export const CustomStyledExample: React.FC = () => {
  const foods: FoodCategory[] = [
    { label: '과일', items: ['사과', '베리류'] }
  ];

  return (
    <div className="space-y-4">
      <SafeFoodCard
        title="Safe Foods"
        categories={foods}
        language="en"
        className="shadow-lg hover:shadow-xl transition-shadow"
      />
      <WarningFoodCard
        title="Warning Foods"
        categories={foods}
        language="en"
        className="border-2 border-red-300"
      />
    </div>
  );
};
