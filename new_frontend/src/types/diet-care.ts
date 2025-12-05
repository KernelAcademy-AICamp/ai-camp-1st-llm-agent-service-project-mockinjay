/**
 * @fileoverview Core domain types for Diet Care feature
 * @module types/diet-care
 *
 * This file contains types that align with the backend API structure
 * defined in backend/app/models/diet_care.py
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Meal types for categorizing food intake throughout the day
 * Backend: MealType(str, Enum)
 * Using const object instead of enum for erasableSyntaxOnly compatibility
 */
export const MealType = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snack: 'snack',
} as const;
export type MealType = typeof MealType[keyof typeof MealType];

/**
 * Analysis session status
 * Backend: AnalysisStatus(str, Enum)
 * Using const object instead of enum for erasableSyntaxOnly compatibility
 */
export const AnalysisStatus = {
  Pending: 'pending',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const;
export type AnalysisStatus = typeof AnalysisStatus[keyof typeof AnalysisStatus];

/**
 * Activity levels for user profile
 */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/**
 * Nutrient status indicators
 */
export type NutrientStatus = 'under' | 'optimal' | 'over';

// ============================================================================
// Core Data Types
// ============================================================================

/**
 * Individual food item with nutritional information
 * Backend: FoodItem(BaseModel)
 */
export interface FoodItem {
  /** Food name */
  readonly name: string;
  /** Amount consumed (e.g., '100g', '1 cup') */
  readonly amount: string;
  /** Calories in kcal */
  readonly calories: number;
  /** Protein in grams */
  readonly protein_g: number;
  /** Sodium in milligrams */
  readonly sodium_mg: number;
  /** Potassium in milligrams */
  readonly potassium_mg: number;
  /** Phosphorus in milligrams */
  readonly phosphorus_mg: number;
  /** Carbohydrates in grams (optional) */
  readonly carbs_g?: number;
  /** Fat in grams (optional) */
  readonly fat_g?: number;
  /** Fiber in grams (optional) */
  readonly fiber_g?: number;
}

/**
 * User health profile for personalized nutrition analysis
 * Backend: UserProfile(BaseModel)
 * Renamed to HealthProfile to avoid conflict with UserProfile in chat.ts
 */
export interface HealthProfile {
  /** Age in years (0-150) */
  readonly age?: number;
  /** Weight in kilograms (0-500) */
  readonly weight_kg?: number;
  /** Height in centimeters (0-300) */
  readonly height_cm?: number;
  /** Chronic Kidney Disease stage (1-5) */
  readonly ckd_stage?: number;
  /** Physical activity level */
  readonly activity_level?: ActivityLevel;
  /** List of medical conditions */
  readonly medical_conditions?: readonly string[];
  /** List of allergies */
  readonly allergies?: readonly string[];
}

/** @deprecated Use HealthProfile instead - kept for backward compatibility */
export type DietCareUserProfile = HealthProfile;

/**
 * Structured nutrition analysis result from GPT-4 Vision
 * Backend: NutritionAnalysisResult(BaseModel)
 */
export interface NutritionAnalysisResult {
  /** Identified food items */
  readonly foods: readonly FoodItem[];
  /** Total calories (kcal) */
  readonly total_calories: number;
  /** Total protein (g) */
  readonly total_protein_g: number;
  /** Total sodium (mg) */
  readonly total_sodium_mg: number;
  /** Total potassium (mg) */
  readonly total_potassium_mg: number;
  /** Total phosphorus (mg) */
  readonly total_phosphorus_mg: number;
  /** Total carbohydrates (g) */
  readonly total_carbs_g: number;
  /** Total fat (g) */
  readonly total_fat_g: number;
  /** Total fiber (g) */
  readonly total_fiber_g: number;
  /** AI-suggested meal type */
  readonly meal_type_suggestion?: MealType;
  /** AI confidence score (0-1) */
  readonly confidence_score: number;
  /** Personalized recommendations */
  readonly recommendations: readonly string[];
  /** Health warnings for CKD patients */
  readonly warnings: readonly string[];
  /** Additional analysis notes */
  readonly analysis_notes?: string;
}

/**
 * Daily nutrition goals
 * Backend: NutritionGoals(BaseModel)
 */
export interface NutritionGoals {
  /** Daily calorie target (kcal) */
  readonly calories_kcal: number;
  /** Daily protein target (g) */
  readonly protein_g: number;
  /** Daily sodium limit (mg) */
  readonly sodium_mg: number;
  /** Daily potassium limit (mg) */
  readonly potassium_mg: number;
  /** Daily phosphorus limit (mg) */
  readonly phosphorus_mg: number;
  /** Daily fluid limit (ml) */
  readonly fluid_ml: number;
}

/**
 * Progress tracking for a single nutrient
 * Backend: NutrientProgress(BaseModel)
 */
export interface NutrientProgress {
  /** Current consumed amount */
  readonly current: number;
  /** Target/goal amount */
  readonly target: number;
  /** Percentage of target achieved */
  readonly percentage: number;
  /** Status indicator */
  readonly status: NutrientStatus;
}

/**
 * Daily summary of nutrition intake
 * Backend: DailySummary(BaseModel)
 */
export interface DailySummary {
  /** Date in ISO format */
  readonly date: string;
  /** Total calories consumed */
  readonly total_calories: number;
  /** Total protein consumed (g) */
  readonly total_protein_g: number;
  /** Total sodium consumed (mg) */
  readonly total_sodium_mg: number;
  /** Total potassium consumed (mg) */
  readonly total_potassium_mg: number;
  /** Total phosphorus consumed (mg) */
  readonly total_phosphorus_mg: number;
  /** Number of meals logged */
  readonly meals_count: number;
  /** Goal adherence score (0-100) */
  readonly compliance_score: number;
}

/**
 * Meal entry logged by the user
 * Backend: MealResponse(BaseModel)
 */
export interface MealEntry {
  /** Unique identifier (MongoDB ObjectId) */
  readonly id: string;
  /** User ID who owns this meal */
  readonly user_id: string;
  /** Meal type classification */
  readonly meal_type: MealType;
  /** Food items in this meal */
  readonly foods: readonly FoodItem[];
  /** Total calories (kcal) */
  readonly total_calories: number;
  /** Total protein (g) */
  readonly total_protein_g: number;
  /** Total sodium (mg) */
  readonly total_sodium_mg: number;
  /** Total potassium (mg) */
  readonly total_potassium_mg: number;
  /** Total phosphorus (mg) */
  readonly total_phosphorus_mg: number;
  /** When the meal was consumed (ISO 8601) */
  readonly logged_at: string;
  /** Optional user notes */
  readonly notes?: string;
  /** Optional meal image URL */
  readonly image_url?: string;
  /** When entry was created (ISO 8601) */
  readonly created_at: string;
}

/**
 * Analysis session for tracking food analysis workflow
 */
export interface AnalysisSession {
  /** Unique session identifier */
  readonly session_id: string;
  /** User ID who owns this session */
  readonly user_id: string;
  /** Current session status */
  readonly status: AnalysisStatus;
  /** Session creation timestamp (ISO 8601) */
  readonly created_at: string;
  /** Session expiration timestamp (ISO 8601) */
  readonly expires_at: string;
  /** Analysis result if completed */
  readonly analysis_result?: NutritionAnalysisResult;
  /** Image URL if uploaded */
  readonly image_url?: string;
  /** Analysis completion timestamp (ISO 8601) */
  readonly analyzed_at?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to create a new analysis session
 * Backend: POST /api/diet-care/session/create
 */
export interface CreateSessionRequest {
  /** User ID (optional, can be extracted from JWT) */
  readonly user_id?: string;
}

/**
 * Response from session creation
 * Backend: CreateSessionResponse(BaseModel)
 */
export interface CreateSessionResponse {
  /** Created session ID */
  readonly session_id: string;
  /** Creation timestamp (ISO 8601) */
  readonly created_at: string;
  /** Expiration timestamp (ISO 8601) */
  readonly expires_at: string;
}

/**
 * Request for nutrition analysis
 * Backend: POST /api/diet-care/nutri-coach (multipart/form-data)
 *
 * Note: This is sent as FormData, not JSON
 */
export interface NutritionAnalysisRequest {
  /** Session ID from create_analysis_session */
  readonly session_id: string;
  /** Food image file (optional) */
  readonly image?: File;
  /** Text description of the meal (optional) */
  readonly text?: string;
  /** User age (optional) */
  readonly age?: number;
  /** User weight in kg (optional) */
  readonly weight_kg?: number;
  /** User height in cm (optional) */
  readonly height_cm?: number;
  /** CKD stage 1-5 (optional) */
  readonly ckd_stage?: number;
  /** Activity level (optional) */
  readonly activity_level?: ActivityLevel;
}

/**
 * Response from nutrition analysis
 * Backend: NutriCoachResponse(BaseModel)
 */
export interface NutritionAnalysisResponse {
  /** Session ID */
  readonly session_id: string;
  /** Analysis result */
  readonly analysis: NutritionAnalysisResult;
  /** Analysis timestamp (ISO 8601) */
  readonly analyzed_at: string;
  /** Image URL if uploaded */
  readonly image_url?: string;
}

/**
 * Request to create a meal log entry
 * Backend: CreateMealRequest(BaseModel)
 */
export interface CreateMealRequest {
  /** Meal type */
  readonly meal_type: MealType;
  /** Food items consumed */
  readonly foods: readonly FoodItem[];
  /** When meal was consumed (optional, defaults to now) */
  readonly logged_at?: string;
  /** Optional user notes */
  readonly notes?: string;
  /** Optional meal image URL */
  readonly image_url?: string;
}

/**
 * Response from meal creation
 * Backend: MealResponse(BaseModel)
 */
export type MealResponse = MealEntry;

/**
 * Request to query meal logs
 * Backend: GET /api/diet-care/meals?start_date&end_date
 */
export interface MealQueryParams {
  /** Start date (ISO 8601, optional) */
  readonly start_date?: string;
  /** End date (ISO 8601, optional) */
  readonly end_date?: string;
}

/**
 * Response from meal query
 * Backend: MealListResponse(BaseModel)
 */
export interface MealListResponse {
  /** Array of meal entries */
  readonly meals: readonly MealEntry[];
  /** Total number of meals in response */
  readonly total_count: number;
  /** Date range queried */
  readonly date_range: {
    readonly start: string;
    readonly end: string;
  };
}

/**
 * Response for user's nutrition goals
 * Backend: GoalsResponse(BaseModel)
 */
export interface GoalsResponse {
  /** User ID */
  readonly user_id: string;
  /** Nutrition goals */
  readonly goals: NutritionGoals;
  /** Last update timestamp (ISO 8601) */
  readonly last_updated: string;
}

/**
 * Request to update nutrition goals
 * Backend: UpdateGoalsRequest(BaseModel)
 */
export interface UpdateGoalsRequest {
  /** Daily calorie target (optional) */
  readonly calories_kcal?: number;
  /** Daily protein target (optional) */
  readonly protein_g?: number;
  /** Daily sodium limit (optional) */
  readonly sodium_mg?: number;
  /** Daily potassium limit (optional) */
  readonly potassium_mg?: number;
  /** Daily phosphorus limit (optional) */
  readonly phosphorus_mg?: number;
  /** Daily fluid limit (optional) */
  readonly fluid_ml?: number;
}

/**
 * Response for daily progress
 * Backend: DailyProgressResponse(BaseModel)
 */
export interface DailyProgressResponse {
  /** Date (ISO 8601) */
  readonly date: string;
  /** Calorie progress */
  readonly calories: NutrientProgress;
  /** Protein progress */
  readonly protein: NutrientProgress;
  /** Sodium progress */
  readonly sodium: NutrientProgress;
  /** Potassium progress */
  readonly potassium: NutrientProgress;
  /** Phosphorus progress */
  readonly phosphorus: NutrientProgress;
  /** Number of meals logged today */
  readonly meals_logged: number;
  /** Expected total meals (default: 3) */
  readonly total_meals: number;
}

/**
 * Response for weekly progress
 * Backend: WeeklyProgressResponse(BaseModel)
 */
export interface WeeklyProgressResponse {
  /** Week start date (ISO 8601) */
  readonly week_start: string;
  /** Week end date (ISO 8601) */
  readonly week_end: string;
  /** Daily summaries for each day */
  readonly daily_summaries: readonly DailySummary[];
  /** Average compliance score across week */
  readonly average_compliance: number;
  /** Current logging streak in days */
  readonly streak_days: number;
  /** Total meals logged in week */
  readonly total_meals_logged: number;
}

/**
 * Response for logging streak
 * Backend: StreakResponse(BaseModel)
 */
export interface StreakResponse {
  /** Current consecutive days with at least 1 meal logged */
  readonly current_streak: number;
  /** Longest streak ever achieved */
  readonly longest_streak: number;
  /** Last log date (ISO 8601) */
  readonly last_log_date?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error response structure
 */
export interface ApiError {
  /** Error detail message */
  readonly detail: string;
  /** HTTP status code */
  readonly status?: number;
  /** Error code for categorization */
  readonly code?: string;
}
