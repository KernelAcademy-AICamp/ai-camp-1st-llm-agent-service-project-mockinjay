/**
 * Nutrition data constants for CKD (Chronic Kidney Disease) diet education.
 *
 * This file contains structured data for potassium and phosphorus dietary guidance,
 * including safe and warning-level foods in both Korean and English.
 *
 * @module nutritionData
 */

/**
 * Multilingual bullet point information
 */
interface BulletPoints {
  ko: string[];
  en: string[];
}

/**
 * Nutrient information with localized names and descriptions
 */
interface NutrientInfo {
  id: string;
  nameKo: string;
  nameEn: string;
  bulletPoints: BulletPoints;
}

/**
 * Food categories organized by type (e.g., fruits, vegetables, grains)
 */
interface FoodCategories {
  ko: Record<string, string[]>;
  en: Record<string, string[]>;
}

/**
 * Complete nutrient data structure
 */
interface NutrientData {
  info: NutrientInfo;
  safe: FoodCategories;
  warning: FoodCategories;
}

/**
 * Food category with label and items for UI rendering
 */
export interface FoodCategory {
  label: string;
  items: string[];
}

/**
 * Potassium (칼륨) dietary guidance data.
 *
 * Contains information about potassium's role in kidney disease,
 * safe foods (low potassium), and warning foods (high potassium).
 */
export const potassiumData: NutrientData = {
  info: {
    id: 'potassium',
    nameKo: '칼륨 (Potassium)',
    nameEn: 'Potassium',
    bulletPoints: {
      ko: [
        '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
        '신장 기능이 저하되면 칼륨이 체내에 축적됩니다',
        '고칼륨혈증은 심장 박동 이상을 일으킬 수 있습니다',
        '투석 환자는 칼륨 섭취를 제한해야 합니다'
      ],
      en: [
        'Potassium is an important mineral for nerve and muscle function',
        'When kidney function decreases, potassium accumulates in the body',
        'Hyperkalemia can cause abnormal heart rhythms',
        'Dialysis patients should limit potassium intake'
      ]
    }
  },
  safe: {
    ko: {
      과일: ['사과', '베리류', '체리', '포도', '배', '파인애플', '수박'],
      채소: ['양배추', '오이', '가지', '상추', '양파', '피망', '무'],
      곡물: ['흰 쌀밥', '흰 빵', '파스타', '크래커'],
      기타: ['초콜릿', '커피']
    },
    en: {
      Fruits: ['Apple', 'Berries', 'Cherry', 'Grape', 'Pear', 'Pineapple', 'Watermelon'],
      Vegetables: ['Cabbage', 'Cucumber', 'Eggplant', 'Lettuce', 'Onion', 'Bell pepper', 'Radish'],
      Grains: ['White rice', 'White bread', 'Pasta', 'Crackers'],
      Others: ['Chocolate', 'Coffee']
    }
  },
  warning: {
    ko: {
      과일: ['바나나', '오렌지', '키위', '멜론', '아보카도', '토마토'],
      채소: ['시금치', '감자', '고구마', '호박', '브로콜리', '당근', '버섯'],
      견과류: ['모든 견과류']
    },
    en: {
      Fruits: ['Banana', 'Orange', 'Kiwi', 'Melon', 'Avocado', 'Tomato'],
      Vegetables: ['Spinach', 'Potato', 'Sweet potato', 'Pumpkin', 'Broccoli', 'Carrot', 'Mushroom'],
      Nuts: ['All nuts']
    }
  }
};

/**
 * Phosphorus (인) dietary guidance data.
 *
 * Contains information about phosphorus's role in kidney disease,
 * safe foods (low phosphorus), and warning foods (high phosphorus).
 */
export const phosphorusData: NutrientData = {
  info: {
    id: 'phosphorus',
    nameKo: '인 (Phosphorus)',
    nameEn: 'Phosphorus',
    bulletPoints: {
      ko: [
        '인은 뼈와 치아 건강에 필수적인 미네랄입니다',
        '신장 질환 시 인이 혈액에 축적됩니다',
        '고인혈증은 뼈를 약하게 만들고 혈관을 석회화시킵니다',
        '가공식품과 탄산음료에 인이 많이 들어있습니다'
      ],
      en: [
        'Phosphorus is essential for bone and teeth health',
        'In kidney disease, phosphorus accumulates in the blood',
        'High phosphorus weakens bones and calcifies blood vessels',
        'Processed foods and carbonated drinks contain high phosphorus'
      ]
    }
  },
  safe: {
    ko: {
      단백질: ['신선한 닭고기', '계란', '생선(참치, 연어)'],
      '유제품 대체': ['쌀 우유', '아몬드 우유', '두유(무인 제품)'],
      곡물: ['흰 쌀밥', '파스타'],
      스낵: ['무염 팝콘', '쌀과자', '과일 스낵']
    },
    en: {
      Protein: ['Fresh chicken', 'Eggs', 'Fish (tuna, salmon)'],
      'Dairy alternatives': ['Rice milk', 'Almond milk', 'Soy milk (phosphorus-free)'],
      Grains: ['White rice', 'Pasta'],
      Snacks: ['Unsalted popcorn', 'Rice crackers', 'Fruit snacks']
    }
  },
  warning: {
    ko: {
      단백질: ['붉은 육류', '햄/소시지', '치즈', '우유', '요구르트'],
      가공식품: ['냉동식품', '인스턴트 식품'],
      음료: ['콜라/탄산음료', '맥주'],
      기타: ['견과류', '초콜릿']
    },
    en: {
      Protein: ['Red meat', 'Ham/Sausage', 'Cheese', 'Milk', 'Yogurt'],
      'Processed foods': ['Frozen foods', 'Instant foods'],
      Beverages: ['Cola/Carbonated drinks', 'Beer'],
      Others: ['Nuts', 'Chocolate']
    }
  }
};

/**
 * Converts a localized food categories object to an array of FoodCategory objects
 * suitable for UI rendering.
 *
 * @param data - Localized food categories (ko or en from NutrientData.safe/warning)
 * @returns Array of food categories with label and items
 *
 * @example
 * ```typescript
 * const categories = toFoodCategories(potassiumData.safe.ko);
 * // Returns: [
 * //   { label: '과일', items: ['사과', '베리류', ...] },
 * //   { label: '채소', items: ['양배추', '오이', ...] },
 * //   ...
 * // ]
 * ```
 */
export function toFoodCategories(
  data: Record<string, string[]>
): FoodCategory[] {
  return Object.entries(data).map(([label, items]) => ({ label, items }));
}

/**
 * All available nutrients for iteration or selection
 */
export const allNutrients = {
  potassium: potassiumData,
  phosphorus: phosphorusData
} as const;

/**
 * Type for nutrient keys
 */
export type NutrientKey = keyof typeof allNutrients;
