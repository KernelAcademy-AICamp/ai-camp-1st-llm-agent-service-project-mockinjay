/**
 * Core domain types for Diet Care feature
 */

// ============================================================================
// Enums
// ============================================================================

export const MealType = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snack: 'snack',
} as const;
export type MealType = typeof MealType[keyof typeof MealType];

export const AnalysisStatus = {
  Pending: 'pending',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const;
export type AnalysisStatus = typeof AnalysisStatus[keyof typeof AnalysisStatus];

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type NutrientStatus = 'under' | 'optimal' | 'over';
export type TrafficLightStatus = 'green' | 'yellow' | 'red';

// ============================================================================
// Core Data Types
// ============================================================================

export interface FoodItem {
  readonly name: string;
  readonly amount: string;
  readonly calories: number;
  readonly protein_g: number;
  readonly sodium_mg: number;
  readonly potassium_mg: number;
  readonly phosphorus_mg: number;
  readonly carbs_g?: number;
  readonly fat_g?: number;
  readonly fiber_g?: number;
}

export interface HealthProfile {
  readonly age?: number;
  readonly weight_kg?: number;
  readonly height_cm?: number;
  readonly ckd_stage?: number;
  readonly activity_level?: ActivityLevel;
  readonly medical_conditions?: readonly string[];
  readonly allergies?: readonly string[];
}

export type DietCareUserProfile = HealthProfile;

export interface NutritionAnalysisResult {
  readonly foods: readonly FoodItem[];
  readonly total_calories: number;
  readonly total_protein_g: number;
  readonly total_sodium_mg: number;
  readonly total_potassium_mg: number;
  readonly total_phosphorus_mg: number;
  readonly total_carbs_g: number;
  readonly total_fat_g: number;
  readonly total_fiber_g: number;
  readonly meal_type_suggestion?: MealType;
  readonly confidence_score: number;
  readonly recommendations: readonly string[];
  readonly warnings: readonly string[];
  readonly analysis_notes?: string;
}

export interface NutritionGoals {
  readonly calories_kcal: number;
  readonly protein_g: number;
  readonly sodium_mg: number;
  readonly potassium_mg: number;
  readonly phosphorus_mg: number;
  readonly fluid_ml: number;
}

export interface NutrientProgress {
  readonly current: number;
  readonly target: number;
  readonly percentage: number;
  readonly status: NutrientStatus;
}

export interface DailySummary {
  readonly date: string;
  readonly total_calories: number;
  readonly total_protein_g: number;
  readonly total_sodium_mg: number;
  readonly total_potassium_mg: number;
  readonly total_phosphorus_mg: number;
  readonly meals_count: number;
  readonly compliance_score: number;
}

export interface MealEntry {
  readonly id: string;
  readonly user_id: string;
  readonly meal_type: MealType;
  readonly foods: readonly FoodItem[];
  readonly total_calories: number;
  readonly total_protein_g: number;
  readonly total_sodium_mg: number;
  readonly total_potassium_mg: number;
  readonly total_phosphorus_mg: number;
  readonly logged_at: string;
  readonly notes?: string;
  readonly image_url?: string;
  readonly created_at: string;
}

export interface AnalysisSession {
  readonly session_id: string;
  readonly user_id: string;
  readonly status: AnalysisStatus;
  readonly created_at: string;
  readonly expires_at: string;
  readonly analysis_result?: NutritionAnalysisResult;
  readonly image_url?: string;
  readonly analyzed_at?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateSessionRequest {
  readonly user_id?: string;
}

export interface CreateSessionResponse {
  readonly session_id: string;
  readonly created_at: string;
  readonly expires_at: string;
}

export interface NutritionAnalysisRequest {
  readonly session_id: string;
  readonly image?: File;
  readonly text?: string;
  readonly age?: number;
  readonly weight_kg?: number;
  readonly height_cm?: number;
  readonly ckd_stage?: number;
  readonly activity_level?: ActivityLevel;
}

export interface NutritionAnalysisResponse {
  readonly session_id: string;
  readonly analysis: NutritionAnalysisResult;
  readonly analyzed_at: string;
  readonly image_url?: string;
}

export interface CreateMealRequest {
  readonly meal_type: MealType;
  readonly foods: readonly FoodItem[];
  readonly logged_at?: string;
  readonly notes?: string;
  readonly image_url?: string;
}

export type MealResponse = MealEntry;

export interface MealQueryParams {
  readonly start_date?: string;
  readonly end_date?: string;
}

export interface MealListResponse {
  readonly meals: readonly MealEntry[];
  readonly total_count: number;
  readonly date_range: {
    readonly start: string;
    readonly end: string;
  };
}

export interface GoalsResponse {
  readonly user_id: string;
  readonly goals: NutritionGoals;
  readonly last_updated: string;
}

export interface UpdateGoalsRequest {
  readonly calories_kcal?: number;
  readonly protein_g?: number;
  readonly sodium_mg?: number;
  readonly potassium_mg?: number;
  readonly phosphorus_mg?: number;
  readonly fluid_ml?: number;
}

export interface DailyProgressResponse {
  readonly date: string;
  readonly calories: NutrientProgress;
  readonly protein: NutrientProgress;
  readonly sodium: NutrientProgress;
  readonly potassium: NutrientProgress;
  readonly phosphorus: NutrientProgress;
  readonly meals_logged: number;
  readonly total_meals: number;
}

export interface WeeklyProgressResponse {
  readonly week_start: string;
  readonly week_end: string;
  readonly daily_summaries: readonly DailySummary[];
  readonly average_compliance: number;
  readonly streak_days: number;
  readonly total_meals_logged: number;
}

export interface StreakResponse {
  readonly current_streak: number;
  readonly longest_streak: number;
  readonly last_log_date?: string;
}

// Legacy types for backward compatibility
export interface NutritionAnalysis {
  calories: number;
  protein: number;
  sodium: number;
  potassium: number;
  phosphorus: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface NutritionGoal {
  userId: string;
  dailyCalories: number;
  dailyProtein: number;
  dailySodium: number;
  dailyPotassium: number;
  dailyPhosphorus: number;
}

export interface NutrientInfo {
  name: string;
  value: number;
  unit: string;
  status: TrafficLightStatus;
  recommendation: string;
}

export interface ApiError {
  readonly detail: string;
  readonly status?: number;
  readonly code?: string;
}
