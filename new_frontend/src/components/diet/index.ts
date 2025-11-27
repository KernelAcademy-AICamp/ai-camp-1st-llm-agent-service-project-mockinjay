/**
 * Diet Care Components
 * Export all diet-related components
 */

export { FoodImageAnalyzer } from './FoodImageAnalyzer';
export { MealLogForm } from './MealLogForm';
export { DailyProgress } from './DailyProgress';
export { GoalSettingForm } from './GoalSettingForm';
export { StreakDisplay } from './StreakDisplay';

// Re-export types for convenience
export type {
  MealType,
  CKDStage,
  NutrientUnit,
  AmountUnit,
  NutritionData,
  FoodItem,
  MealLog,
  NutritionGoals,
  CKDStagePreset,
  ProgressStatus,
  NutrientProgress,
  StreakData,
  CalendarDay,
  Achievement,
  FoodAnalysisResult,
  ImageUploadState,
  FoodSuggestion,
} from '../../types/diet';
