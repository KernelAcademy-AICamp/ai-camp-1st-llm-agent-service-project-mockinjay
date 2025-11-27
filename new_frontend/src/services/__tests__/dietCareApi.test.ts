/**
 * @fileoverview Unit tests for Diet Care API Service
 * @module services/__tests__/dietCareApi.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import {
  createSession,
  getSession,
  analyzeFood,
  analyzeFoodText,
  getGoals,
  saveGoals,
  getMeals,
  logMeal,
  deleteMeal,
  getDailyProgress,
  getWeeklyStats,
  getStreak,
  DietCareApiError,
  ErrorCodes,
  mockAnalyzeFood,
  mockAnalyzeFoodError,
  enableMocks,
  disableMocks,
  shouldUseMocks,
} from '../dietCareApi';
import {
  CKDStage,
  MealType,
  type SessionId,
  type MealEntryId,
  type FoodItemId,
  type UserProfile,
  type DietGoals,
} from '../../types/diet-care';

describe('DietCareApi', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
  });

  afterEach(() => {
    mockAxios.restore();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Session Management Tests
  // ============================================================================

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const userProfile: UserProfile = {
        ckdStage: CKDStage.Stage3a,
        age: 45,
        weight: 70,
        height: 170,
        sex: 'MALE',
        activityLevel: 'MODERATE',
      };

      const mockResponse = {
        session: {
          id: 'session_123' as SessionId,
          userProfile,
          goals: {
            ckdStage: CKDStage.Stage3a,
            dailyCalories: 2000,
            dailyProtein: 50,
            dailySodium: 2000,
            dailyPotassium: 2000,
            dailyPhosphorus: 1000,
          },
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          status: 'ACTIVE' as const,
          messageCount: 0,
        },
        goals: {
          ckdStage: CKDStage.Stage3a,
          dailyCalories: 2000,
          dailyProtein: 50,
          dailySodium: 2000,
          dailyPotassium: 2000,
          dailyPhosphorus: 1000,
        },
      };

      mockAxios.onPost('/api/diet-care/session/create').reply(200, mockResponse);

      const result = await createSession(userProfile);

      expect(result).toEqual(mockResponse);
      expect(result.session.id).toBe('session_123');
    });

    it('should throw DietCareApiError on failure', async () => {
      const userProfile: UserProfile = {
        ckdStage: CKDStage.Stage3a,
        age: 45,
        weight: 70,
        height: 170,
        sex: 'MALE',
        activityLevel: 'MODERATE',
      };

      mockAxios.onPost('/api/diet-care/session/create').reply(500, {
        code: ErrorCodes.SERVER_ERROR,
        message: 'Internal server error',
      });

      await expect(createSession(userProfile)).rejects.toThrow(DietCareApiError);
    });
  });

  describe('getSession', () => {
    it('should retrieve session by ID', async () => {
      const sessionId = 'session_123' as SessionId;
      const mockSession = {
        id: sessionId,
        userProfile: {
          ckdStage: CKDStage.Stage3a,
          age: 45,
          weight: 70,
          height: 170,
          sex: 'MALE' as const,
          activityLevel: 'MODERATE' as const,
        },
        goals: {
          ckdStage: CKDStage.Stage3a,
          dailyCalories: 2000,
          dailyProtein: 50,
          dailySodium: 2000,
          dailyPotassium: 2000,
          dailyPhosphorus: 1000,
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'ACTIVE' as const,
        messageCount: 0,
      };

      mockAxios.onGet(`/api/diet-care/session/${sessionId}`).reply(200, mockSession);

      const result = await getSession(sessionId);

      expect(result).toEqual(mockSession);
    });

    it('should return null for non-existent session', async () => {
      const sessionId = 'nonexistent' as SessionId;

      mockAxios.onGet(`/api/diet-care/session/${sessionId}`).reply(404);

      const result = await getSession(sessionId);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Nutrition Analysis Tests
  // ============================================================================

  describe('analyzeFood', () => {
    it('should analyze food from image successfully', async () => {
      const sessionId = 'session_123' as SessionId;
      const mockFile = new File(['mock'], 'food.jpg', { type: 'image/jpeg' });

      const mockResponse = {
        result: {
          type: 'success',
          foods: [
            {
              id: 'food_1' as FoodItemId,
              name: 'Apple',
              servingSize: '1 medium',
              nutrition: {
                calories: 95,
                protein: 0.5,
                carbohydrates: 25,
                fat: 0.3,
                sodium: 2,
                potassium: 195,
                phosphorus: 20,
              },
            },
          ],
          totals: {
            calories: 95,
            protein: 0.5,
            carbohydrates: 25,
            fat: 0.3,
            sodium: 2,
            potassium: 195,
            phosphorus: 20,
            itemCount: 1,
            calculatedAt: new Date().toISOString(),
          },
          analysis: 'A healthy snack option.',
          confidence: 0.95,
          analyzedAt: new Date().toISOString(),
        },
        processingTimeMs: 1200,
      };

      mockAxios.onPost('/api/diet-care/nutri-coach').reply(200, mockResponse);

      const result = await analyzeFood(sessionId, mockFile);

      expect(result.type).toBe('success');
      if (result.type === 'success') {
        expect(result.foods).toHaveLength(1);
        expect(result.foods[0].name).toBe('Apple');
      }
    });

    it('should handle analysis errors', async () => {
      const sessionId = 'session_123' as SessionId;
      const mockFile = new File(['mock'], 'food.jpg', { type: 'image/jpeg' });

      const mockResponse = {
        result: {
          type: 'error',
          code: 'NO_FOOD_DETECTED',
          message: 'No food detected in image',
          occurredAt: new Date().toISOString(),
        },
      };

      mockAxios.onPost('/api/diet-care/nutri-coach').reply(200, mockResponse);

      const result = await analyzeFood(sessionId, mockFile);

      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.code).toBe('NO_FOOD_DETECTED');
      }
    });
  });

  describe('analyzeFoodText', () => {
    it('should analyze food from text description', async () => {
      const sessionId = 'session_123' as SessionId;
      const description = '1 cup of rice with grilled chicken';

      const mockResponse = {
        result: {
          type: 'success',
          foods: [
            {
              id: 'food_1' as FoodItemId,
              name: 'White Rice',
              servingSize: '1 cup',
              nutrition: {
                calories: 206,
                protein: 4.3,
                carbohydrates: 45,
                fat: 0.4,
                sodium: 2,
                potassium: 55,
                phosphorus: 68,
              },
            },
          ],
          totals: {
            calories: 206,
            protein: 4.3,
            carbohydrates: 45,
            fat: 0.4,
            sodium: 2,
            potassium: 55,
            phosphorus: 68,
            itemCount: 1,
            calculatedAt: new Date().toISOString(),
          },
          analysis: 'Good carbohydrate source.',
          confidence: 0.88,
          analyzedAt: new Date().toISOString(),
        },
      };

      mockAxios.onPost('/api/diet-care/nutri-coach').reply(200, mockResponse);

      const result = await analyzeFoodText(sessionId, description);

      expect(result.type).toBe('success');
    });
  });

  // ============================================================================
  // Goals Management Tests
  // ============================================================================

  describe('getGoals', () => {
    it('should retrieve user goals', async () => {
      const userId = 'user_123';
      const mockGoals: DietGoals = {
        ckdStage: CKDStage.Stage3a,
        dailyCalories: 2000,
        dailyProtein: 50,
        dailySodium: 2000,
        dailyPotassium: 2000,
        dailyPhosphorus: 1000,
      };

      mockAxios.onGet('/api/diet-care/goals').reply(200, {
        user_id: userId,
        goals: mockGoals,
        last_updated: new Date().toISOString(),
      });

      const result = await getGoals(userId);

      expect(result).toEqual(mockGoals);
    });
  });

  describe('saveGoals', () => {
    it('should update user goals', async () => {
      const userId = 'user_123';
      const updatedGoals = {
        dailySodium: 1800,
        dailyProtein: 45,
      };

      const mockResponse = {
        user_id: userId,
        goals: {
          ckdStage: CKDStage.Stage3a,
          dailyCalories: 2000,
          dailyProtein: 45,
          dailySodium: 1800,
          dailyPotassium: 2000,
          dailyPhosphorus: 1000,
        },
        last_updated: new Date().toISOString(),
      };

      mockAxios.onPut('/api/diet-care/goals').reply(200, mockResponse);

      const result = await saveGoals(userId, updatedGoals);

      expect(result.dailySodium).toBe(1800);
      expect(result.dailyProtein).toBe(45);
    });
  });

  // ============================================================================
  // Meal Logging Tests
  // ============================================================================

  describe('getMeals', () => {
    it('should retrieve meals for date range', async () => {
      const userId = 'user_123';
      const startDate = '2025-01-01T00:00:00Z';
      const endDate = '2025-01-07T23:59:59Z';

      const mockResponse = {
        meals: [
          {
            id: 'meal_1',
            user_id: userId,
            meal_type: 'BREAKFAST',
            foods: [],
            total_calories: 350,
            total_protein_g: 15,
            total_sodium_mg: 200,
            total_potassium_mg: 300,
            total_phosphorus_mg: 150,
            logged_at: '2025-01-01T08:00:00Z',
            created_at: '2025-01-01T08:05:00Z',
          },
        ],
        total_count: 1,
        date_range: { start: startDate, end: endDate },
      };

      mockAxios.onGet('/api/diet-care/meals').reply(200, mockResponse);

      const result = await getMeals(userId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].mealType).toBe('BREAKFAST');
    });
  });

  describe('logMeal', () => {
    it('should log a new meal', async () => {
      const userId = 'user_123';
      const meal = {
        sessionId: 'session_123' as SessionId,
        mealType: MealType.Breakfast,
        consumedAt: new Date().toISOString(),
        foods: [
          {
            id: 'food_1' as FoodItemId,
            name: 'Oatmeal',
            servingSize: '1 cup',
            nutrition: {
              calories: 150,
              protein: 5,
              carbohydrates: 27,
              fat: 3,
              sodium: 0,
              potassium: 150,
              phosphorus: 180,
            },
          },
        ],
        totals: {
          calories: 150,
          protein: 5,
          carbohydrates: 27,
          fat: 3,
          sodium: 0,
          potassium: 150,
          phosphorus: 180,
          itemCount: 1,
          calculatedAt: new Date().toISOString(),
        },
      };

      const mockResponse = {
        id: 'meal_123',
        user_id: userId,
        meal_type: 'BREAKFAST',
        foods: meal.foods,
        total_calories: 150,
        total_protein_g: 5,
        total_sodium_mg: 0,
        total_potassium_mg: 150,
        total_phosphorus_mg: 180,
        logged_at: meal.consumedAt,
        created_at: new Date().toISOString(),
      };

      mockAxios.onPost('/api/diet-care/meals').reply(201, mockResponse);

      const result = await logMeal(userId, meal);

      expect(result.id).toBe('meal_123');
      expect(result.mealType).toBe(MealType.Breakfast);
    });
  });

  describe('deleteMeal', () => {
    it('should delete a meal', async () => {
      const userId = 'user_123';
      const mealId = 'meal_123' as MealEntryId;

      mockAxios.onDelete(`/api/diet-care/meals/${mealId}`).reply(204);

      await expect(deleteMeal(userId, mealId)).resolves.toBeUndefined();
    });
  });

  // ============================================================================
  // Progress Tracking Tests
  // ============================================================================

  describe('getDailyProgress', () => {
    it('should retrieve daily progress', async () => {
      const userId = 'user_123';
      const date = '2025-01-15';

      const mockResponse = {
        date,
        calories: { current: 1500, target: 2000, percentage: 75, status: 'under' },
        protein: { current: 40, target: 50, percentage: 80, status: 'optimal' },
        sodium: { current: 1800, target: 2000, percentage: 90, status: 'optimal' },
        potassium: { current: 1600, target: 2000, percentage: 80, status: 'optimal' },
        phosphorus: { current: 850, target: 1000, percentage: 85, status: 'optimal' },
        meals_logged: 2,
        total_meals: 3,
      };

      mockAxios.onGet('/api/diet-care/progress/daily').reply(200, mockResponse);

      const result = await getDailyProgress(userId, date);

      expect(result.date).toBe(date);
      expect(result.meals_logged).toBe(2);
    });
  });

  describe('getWeeklyStats', () => {
    it('should retrieve weekly statistics', async () => {
      const userId = 'user_123';

      const mockResponse = {
        week_start: '2025-01-13',
        week_end: '2025-01-19',
        daily_summaries: [
          {
            date: '2025-01-13',
            total_calories: 1950,
            total_protein_g: 48,
            total_sodium_mg: 1900,
            total_potassium_mg: 1850,
            total_phosphorus_mg: 950,
            meals_count: 3,
            compliance_score: 92.5,
          },
        ],
        average_compliance: 92.5,
        streak_days: 5,
        total_meals_logged: 21,
      };

      mockAxios.onGet('/api/diet-care/progress/weekly').reply(200, mockResponse);

      const result = await getWeeklyStats(userId);

      expect(result.streak_days).toBe(5);
      expect(result.daily_summaries).toHaveLength(1);
    });
  });

  describe('getStreak', () => {
    it('should retrieve logging streak', async () => {
      const userId = 'user_123';

      const mockResponse = {
        current_streak: 7,
        longest_streak: 14,
        last_log_date: '2025-01-15',
      };

      mockAxios.onGet('/api/diet-care/streak').reply(200, mockResponse);

      const result = await getStreak(userId);

      expect(result.current_streak).toBe(7);
      expect(result.longest_streak).toBe(14);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('DietCareApiError', () => {
    it('should identify error types correctly', () => {
      const error = new DietCareApiError(
        'Unauthorized',
        ErrorCodes.UNAUTHORIZED,
        401
      );

      expect(error.is(ErrorCodes.UNAUTHORIZED)).toBe(true);
      expect(error.is(ErrorCodes.NOT_FOUND)).toBe(false);
    });

    it('should determine if error is retryable', () => {
      const retryableError = new DietCareApiError(
        'Server error',
        ErrorCodes.SERVER_ERROR,
        500
      );

      const nonRetryableError = new DietCareApiError(
        'Not found',
        ErrorCodes.NOT_FOUND,
        404
      );

      expect(retryableError.isRetryable()).toBe(true);
      expect(nonRetryableError.isRetryable()).toBe(false);
    });
  });

  // ============================================================================
  // Mock Implementation Tests
  // ============================================================================

  describe('Mock implementations', () => {
    it('should return mock data when enabled', async () => {
      const sessionId = 'session_123' as SessionId;
      const mockFile = new File(['mock'], 'food.jpg', { type: 'image/jpeg' });

      const result = await mockAnalyzeFood(sessionId, mockFile);

      expect(result.type).toBe('success');
      if (result.type === 'success') {
        expect(result.foods.length).toBeGreaterThan(0);
      }
    });

    it('should return mock error when requested', async () => {
      const result = await mockAnalyzeFoodError();

      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.code).toBe('NO_FOOD_DETECTED');
      }
    });

    it('should enable and disable mocks correctly', () => {
      disableMocks();
      expect(shouldUseMocks()).toBe(false);

      enableMocks();
      expect(shouldUseMocks()).toBe(false); // False because not in dev mode in tests

      disableMocks();
    });
  });
});
