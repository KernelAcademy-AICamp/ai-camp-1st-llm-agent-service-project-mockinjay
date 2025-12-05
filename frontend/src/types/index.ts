export * from './chat';
export * from './community';
export * from './trends';
export type {
  MealType,
  AnalysisStatus,
  ActivityLevel,
  NutrientStatus,
  TrafficLightStatus,
  FoodItem,
  NutritionAnalysisResult,
  NutritionGoals,
  NutrientProgress,
  DailySummary,
  AnalysisSession,
  CreateSessionRequest,
  CreateSessionResponse,
  NutritionAnalysisRequest,
  NutritionAnalysisResponse,
  CreateMealRequest,
  MealResponse,
  MealQueryParams,
  MealListResponse,
  GoalsResponse,
  UpdateGoalsRequest,
  DailyProgressResponse,
  WeeklyProgressResponse,
  StreakResponse,
  NutritionAnalysis,
  NutritionGoal,
  NutrientInfo,
  ApiError,
} from './diet-care';

// Re-export frontend MealEntry from service
export type { MealEntry } from '../services/dietCareApi';
export * from './mypage';
