import React from 'react';
import { NutrientEducationSection, type NutrientInfo } from './NutrientEducationSection';

/**
 * Example Usage of NutrientEducationSection Component
 *
 * This file demonstrates how to use the NutrientEducationSection component
 * in different scenarios within the CareGuide application.
 */

// Example 1: Potassium Education Section (Korean)
export const PotassiumSectionKorean: React.FC = () => {
  const potassiumInfo: NutrientInfo = {
    id: 'potassium',
    nameKo: '칼륨',
    nameEn: 'Potassium',
    bulletPoints: {
      ko: [
        '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
        '신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다',
        '고칼륨혈증은 심장 리듬에 영향을 줄 수 있습니다',
        '만성 콩팥병 환자는 칼륨 섭취를 제한해야 합니다',
      ],
      en: [
        'Potassium is a crucial mineral for nerve and muscle function',
        'When kidney function declines, potassium can accumulate in the body',
        'Hyperkalemia can affect heart rhythm',
        'CKD patients need to limit potassium intake',
      ],
    },
  };

  return (
    <NutrientEducationSection
      nutrient={potassiumInfo}
      language="ko"
    />
  );
};

// Example 2: Phosphorus Education Section (English)
export const PhosphorusSectionEnglish: React.FC = () => {
  const phosphorusInfo: NutrientInfo = {
    id: 'phosphorus',
    nameKo: '인',
    nameEn: 'Phosphorus',
    bulletPoints: {
      ko: [
        '인은 뼈와 치아 건강에 필수적인 미네랄입니다',
        '신장이 약해지면 인이 배출되지 않고 체내에 쌓입니다',
        '고인산혈증은 뼈를 약하게 만들고 혈관 석회화를 유발합니다',
        '만성 콩팥병 환자는 인 섭취를 제한해야 합니다',
      ],
      en: [
        'Phosphorus is essential for bone and teeth health',
        'When kidneys weaken, phosphorus is not excreted and accumulates in the body',
        'Hyperphosphatemia weakens bones and causes vascular calcification',
        'CKD patients need to limit phosphorus intake',
      ],
    },
  };

  return (
    <NutrientEducationSection
      nutrient={phosphorusInfo}
      language="en"
    />
  );
};

// Example 3: With Children (Safe/Warning Food Cards)
export const NutrientWithFoodCards: React.FC = () => {
  const sodiumInfo: NutrientInfo = {
    id: 'sodium',
    nameKo: '나트륨',
    nameEn: 'Sodium',
    bulletPoints: {
      ko: [
        '나트륨은 체내 수분 균형과 혈압 조절에 중요합니다',
        '과도한 나트륨 섭취는 혈압 상승과 부종을 유발합니다',
        '만성 콩팥병 환자는 하루 2,000mg 이하로 제한해야 합니다',
      ],
      en: [
        'Sodium is important for fluid balance and blood pressure regulation',
        'Excessive sodium intake causes high blood pressure and edema',
        'CKD patients should limit intake to under 2,000mg per day',
      ],
    },
  };

  return (
    <NutrientEducationSection
      nutrient={sodiumInfo}
      language="ko"
    >
      {/* Safe Foods Card (Placeholder) */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
          안전한 식품
        </h4>
        <p className="text-sm text-green-700 dark:text-green-400">
          무염버터, 신선한 채소, 허브와 향신료
        </p>
      </div>

      {/* Warning Foods Card (Placeholder) */}
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">
          주의 식품
        </h4>
        <p className="text-sm text-red-700 dark:text-red-400">
          가공육, 치즈, 통조림, 인스턴트 식품
        </p>
      </div>
    </NutrientEducationSection>
  );
};

// Example 4: Custom Styling
export const CustomStyledSection: React.FC = () => {
  const calciumInfo: NutrientInfo = {
    id: 'calcium',
    nameKo: '칼슘',
    nameEn: 'Calcium',
    bulletPoints: {
      ko: [
        '칼슘은 뼈와 치아를 강하게 유지하는데 필수적입니다',
        '적절한 칼슘 섭취는 골다공증 예방에 도움이 됩니다',
      ],
      en: [
        'Calcium is essential for maintaining strong bones and teeth',
        'Adequate calcium intake helps prevent osteoporosis',
      ],
    },
  };

  return (
    <NutrientEducationSection
      nutrient={calciumInfo}
      language="ko"
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
    />
  );
};

// Example 5: Complete DietCare Page Usage
export const DietCarePageExample: React.FC = () => {
  const nutrients: NutrientInfo[] = [
    {
      id: 'potassium',
      nameKo: '칼륨',
      nameEn: 'Potassium',
      bulletPoints: {
        ko: [
          '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
          '신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다',
          '고칼륨혈증은 심장 리듬에 영향을 줄 수 있습니다',
        ],
        en: [
          'Potassium is a crucial mineral for nerve and muscle function',
          'When kidney function declines, potassium can accumulate in the body',
          'Hyperkalemia can affect heart rhythm',
        ],
      },
    },
    {
      id: 'phosphorus',
      nameKo: '인',
      nameEn: 'Phosphorus',
      bulletPoints: {
        ko: [
          '인은 뼈와 치아 건강에 필수적인 미네랄입니다',
          '신장이 약해지면 인이 배출되지 않고 체내에 쌓입니다',
          '고인산혈증은 뼈를 약하게 만들고 혈관 석회화를 유발합니다',
        ],
        en: [
          'Phosphorus is essential for bone and teeth health',
          'When kidneys weaken, phosphorus is not excreted and accumulates in the body',
          'Hyperphosphatemia weakens bones and causes vascular calcification',
        ],
      },
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-6">
        영양소 교육
      </h2>

      {nutrients.map((nutrient) => (
        <NutrientEducationSection
          key={nutrient.id}
          nutrient={nutrient}
          language="ko"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        />
      ))}
    </div>
  );
};
