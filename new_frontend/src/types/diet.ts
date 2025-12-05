/**
 * Diet Care Type Definitions
 * TypeScript types for nutrition management system
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CKDStage = 1 | 2 | 3 | 4 | 5;
export type NutrientUnit = 'g' | 'mg' | 'kcal';
export type AmountUnit = 'g' | 'cup' | 'portion' | 'ml' | 'oz';

/**
 * Nutrition data for a food item
 */
export interface NutritionData {
  calories: number;
  protein: number;
  sodium: number;
  potassium: number;
  phosphorus: number;
  carbohydrates?: number;
  fat?: number;
}

/**
 * Food item in a meal
 */
export interface FoodItem {
  id: string;
  name: string;
  amount: number;
  unit: AmountUnit;
  nutrition?: NutritionData;
}

/**
 * Meal log entry
 */
export interface MealLog {
  id: string;
  type: MealType;
  date: string;
  time: string;
  foods: FoodItem[];
  totalNutrition?: NutritionData;
  notes?: string;
}

/**
 * Daily nutrition goals
 */
export interface NutritionGoals {
  calories: number;
  protein: number;
  sodium: number;
  potassium: number;
  phosphorus: number;
}

/**
 * Preset nutrition goals by CKD stage
 */
export interface CKDStagePreset {
  stage: CKDStage;
  name: string;
  description: string;
  goals: NutritionGoals;
}

/**
 * Progress status for a nutrient
 */
export type ProgressStatus = 'good' | 'warning' | 'danger';

/**
 * Daily progress tracking
 */
export interface NutrientProgress {
  nutrient: keyof NutritionData;
  current: number;
  target: number;
  percentage: number;
  status: ProgressStatus;
  unit: NutrientUnit;
}

/**
 * Streak data
 */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastLoggedDate: string;
}

/**
 * Calendar day data for heatmap
 */
export interface CalendarDay {
  date: string;
  logged: boolean;
  mealsLogged: number;
  complianceScore?: number;
}

/**
 * Achievement badge
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

/**
 * Food image analysis result
 */
export interface FoodAnalysisResult {
  foods: Array<{
    name: string;
    confidence: number;
    nutrition?: NutritionData;
  }>;
  totalNutrition?: NutritionData;
  recommendations?: string[];
  warnings?: string[];
}

/**
 * Image upload state
 */
export interface ImageUploadState {
  file: File | null;
  preview: string | null;
  analyzing: boolean;
  result: FoodAnalysisResult | null;
  error: string | null;
}

/**
 * Autocomplete suggestion
 */
export interface FoodSuggestion {
  id: string;
  name: string;
  commonUnit: AmountUnit;
  nutrition?: NutritionData;
}

/**
 * CKD Stage preset templates
 */
export const CKD_STAGE_PRESETS: CKDStagePreset[] = [
  {
    stage: 1,
    name: 'Stage 1',
    description: 'Normal or high kidney function',
    goals: {
      calories: 2000,
      protein: 60,
      sodium: 2300,
      potassium: 3500,
      phosphorus: 1000,
    },
  },
  {
    stage: 2,
    name: 'Stage 2',
    description: 'Mild reduction in kidney function',
    goals: {
      calories: 2000,
      protein: 55,
      sodium: 2000,
      potassium: 3000,
      phosphorus: 900,
    },
  },
  {
    stage: 3,
    name: 'Stage 3',
    description: 'Moderate reduction in kidney function',
    goals: {
      calories: 2000,
      protein: 50,
      sodium: 1500,
      potassium: 2500,
      phosphorus: 800,
    },
  },
  {
    stage: 4,
    name: 'Stage 4',
    description: 'Severe reduction in kidney function',
    goals: {
      calories: 2000,
      protein: 40,
      sodium: 1500,
      potassium: 2000,
      phosphorus: 800,
    },
  },
  {
    stage: 5,
    name: 'Stage 5',
    description: 'Kidney failure',
    goals: {
      calories: 2000,
      protein: 40,
      sodium: 1000,
      potassium: 2000,
      phosphorus: 800,
    },
  },
];

/**
 * Default meal times
 */
export const DEFAULT_MEAL_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '12:00',
  dinner: '18:00',
  snack: '15:00',
};
