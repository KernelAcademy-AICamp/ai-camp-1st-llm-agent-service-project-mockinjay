/**
 * @fileoverview Diet Care API Service Layer
 * @module services/dietCareApi
 *
 * Production-ready API service for Diet Care feature.
 */

import api from './api';
import type {
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
  MealType,
} from '../types/diet-care';

// ============================================================================
// API Endpoints
// ============================================================================

const ENDPOINTS = {
  SESSION_CREATE: '/api/diet-care/session/create',
  NUTRI_COACH: '/api/diet-care/nutri-coach',
  MEALS: '/api/diet-care/meals',
  GOALS: '/api/diet-care/goals',
  PROGRESS_DAILY: '/api/diet-care/progress/daily',
  PROGRESS_WEEKLY: '/api/diet-care/progress/weekly',
  STREAK: '/api/diet-care/streak',
} as const;

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create a new analysis session
 */
export async function createSession(userId?: string): Promise<CreateSessionResponse> {
  const response = await api.post<CreateSessionResponse>(
    ENDPOINTS.SESSION_CREATE,
    null,
    { params: userId ? { user_id: userId } : undefined }
  );
  return response.data;
}

// ============================================================================
// Nutrition Analysis
// ============================================================================

/**
 * Analyze food image with AI
 */
export async function analyzeNutrition(
  request: NutritionAnalysisRequest
): Promise<NutritionAnalysisResponse> {
  const formData = new FormData();
  formData.append('session_id', request.session_id);

  if (request.image) {
    formData.append('image', request.image);
  }
  if (request.text) {
    formData.append('text', request.text);
  }
  if (request.age !== undefined) {
    formData.append('age', String(request.age));
  }
  if (request.weight_kg !== undefined) {
    formData.append('weight_kg', String(request.weight_kg));
  }
  if (request.height_cm !== undefined) {
    formData.append('height_cm', String(request.height_cm));
  }
  if (request.ckd_stage !== undefined) {
    formData.append('ckd_stage', String(request.ckd_stage));
  }
  if (request.activity_level) {
    formData.append('activity_level', request.activity_level);
  }

  // Set Content-Type to undefined to remove the default 'application/json' header.
  // This allows axios to automatically set the correct multipart/form-data with boundary.
  const response = await api.post<NutritionAnalysisResponse>(
    ENDPOINTS.NUTRI_COACH,
    formData,
    {
      headers: { 'Content-Type': undefined },
    }
  );
  return response.data;
}

// ============================================================================
// Meal Logging
// ============================================================================

/**
 * Log a new meal
 */
export async function createMeal(meal: CreateMealRequest): Promise<MealResponse> {
  const response = await api.post<MealResponse>(ENDPOINTS.MEALS, meal);
  return response.data;
}

/**
 * Get meal history
 */
export async function getMeals(params?: MealQueryParams): Promise<MealListResponse> {
  const response = await api.get<MealListResponse>(ENDPOINTS.MEALS, { params });
  return response.data;
}

/**
 * Delete a meal
 */
export async function deleteMeal(mealId: string): Promise<void> {
  await api.delete(`${ENDPOINTS.MEALS}/${mealId}`);
}

// ============================================================================
// Goals Management
// ============================================================================

/**
 * Get user's nutrition goals
 */
export async function getGoals(): Promise<GoalsResponse> {
  const response = await api.get<GoalsResponse>(ENDPOINTS.GOALS);
  return response.data;
}

/**
 * Update user's nutrition goals
 */
export async function updateGoals(goals: UpdateGoalsRequest): Promise<GoalsResponse> {
  const response = await api.put<GoalsResponse>(ENDPOINTS.GOALS, goals);
  return response.data;
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Get daily progress
 */
export async function getDailyProgress(date?: string): Promise<DailyProgressResponse> {
  const response = await api.get<DailyProgressResponse>(ENDPOINTS.PROGRESS_DAILY, {
    params: date ? { date } : undefined,
  });
  return response.data;
}

/**
 * Get weekly progress
 */
export async function getWeeklyProgress(weekStart?: string): Promise<WeeklyProgressResponse> {
  const response = await api.get<WeeklyProgressResponse>(ENDPOINTS.PROGRESS_WEEKLY, {
    params: weekStart ? { week_start: weekStart } : undefined,
  });
  return response.data;
}

/**
 * Get logging streak
 */
export async function getStreak(): Promise<StreakResponse> {
  const response = await api.get<StreakResponse>(ENDPOINTS.STREAK);
  return response.data;
}

// ============================================================================
// Mock Data for Development
// ============================================================================

/**
 * Get mock nutrition analysis result for development
 */
export function getMockAnalysisResult(): NutritionAnalysisResponse {
  return {
    session_id: 'mock-session-id',
    analysis: {
      foods: [
        {
          name: '현미밥',
          amount: '210g (1공기)',
          calories: 330,
          protein_g: 6.5,
          sodium_mg: 5,
          potassium_mg: 180,
          phosphorus_mg: 200,
          carbs_g: 71,
          fat_g: 2.3,
        },
        {
          name: '된장찌개',
          amount: '200ml',
          calories: 120,
          protein_g: 8,
          sodium_mg: 850,
          potassium_mg: 320,
          phosphorus_mg: 150,
          carbs_g: 8,
          fat_g: 6,
        },
      ],
      total_calories: 450,
      total_protein_g: 14.5,
      total_sodium_mg: 855,
      total_potassium_mg: 500,
      total_phosphorus_mg: 350,
      total_carbs_g: 79,
      total_fat_g: 8.3,
      total_fiber_g: 3.2,
      confidence_score: 0.87,
      recommendations: [
        '나트륨 섭취량이 일일 권장량(2000mg)의 43%입니다.',
        '단백질 섭취가 적절합니다.',
        '칼륨 섭취량이 CKD 3기 권장량에 맞습니다.',
      ],
      warnings: [
        '된장찌개의 나트륨 함량이 높습니다. 국물 섭취를 줄이세요.',
      ],
    },
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Get mock meal entries for development
 */
export function getMockMeals(): MealListResponse {
  const today = new Date().toISOString().split('T')[0];
  return {
    meals: [
      {
        id: 'mock-meal-1',
        user_id: 'mock-user',
        meal_type: 'breakfast' as MealType,
        foods: [
          {
            name: '현미밥',
            amount: '210g',
            calories: 330,
            protein_g: 6.5,
            sodium_mg: 5,
            potassium_mg: 180,
            phosphorus_mg: 200,
          },
        ],
        total_calories: 330,
        total_protein_g: 6.5,
        total_sodium_mg: 5,
        total_potassium_mg: 180,
        total_phosphorus_mg: 200,
        logged_at: `${today}T08:00:00Z`,
        created_at: `${today}T08:30:00Z`,
      },
    ],
    total_count: 1,
    date_range: {
      start: today,
      end: today,
    },
  };
}

// ============================================================================
// Export all functions
// ============================================================================

export const dietCareApi = {
  createSession,
  analyzeNutrition,
  createMeal,
  getMeals,
  deleteMeal,
  getGoals,
  updateGoals,
  getDailyProgress,
  getWeeklyProgress,
  getStreak,
  // Mock functions for development
  getMockAnalysisResult,
  getMockMeals,
};

export default dietCareApi;
