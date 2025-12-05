/**
 * useDietLog Hook
 * Manages daily meal logging
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createMeal, getMeals } from '../services/dietCareApi';
import type { MealEntry, CreateMealRequest, MealType, FoodItem } from '../types/diet-care';
import { useAuth } from '../contexts/AuthContext';

export interface MealFormData {
  foodName: string;
  amount: number;
  unit: string;
}

export interface UseDietLogReturn {
  meals: MealEntry[];
  logging: boolean;
  error: string | null;
  logMeal: (mealType: MealType, foods: FoodItem[], notes?: string) => Promise<void>;
  refreshMeals: () => Promise<void>;
}

export function useDietLog(
  date: string = new Date().toISOString().split('T')[0],
  language: 'en' | 'ko' = 'ko'
): UseDietLogReturn {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMeals = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await getMeals({
        start_date: date,
        end_date: date,
      });
      setMeals([...response.meals]);
    } catch (err) {
      console.error('Failed to load meals:', err);
      setError(language === 'ko' ? '식사 기록을 불러오는데 실패했습니다.' : 'Failed to load meals.');
    }
  }, [user?.id, date, language]);

  const logMeal = useCallback(async (
    mealType: MealType,
    foods: FoodItem[],
    notes?: string
  ) => {
    if (!user?.id) {
      toast.error(language === 'ko' ? '로그인이 필요합니다.' : 'Please login first.');
      return;
    }

    try {
      setLogging(true);
      setError(null);

      const request: CreateMealRequest = {
        meal_type: mealType,
        foods: foods,
        notes,
      };

      const newMeal = await createMeal(request);
      setMeals(prev => [...prev, newMeal]);
      toast.success(language === 'ko' ? '식사가 기록되었습니다.' : 'Meal logged successfully.');
    } catch (err) {
      console.error('Failed to log meal:', err);
      setError(language === 'ko' ? '식사 기록에 실패했습니다.' : 'Failed to log meal.');
      toast.error(language === 'ko' ? '식사 기록에 실패했습니다.' : 'Failed to log meal.');
    } finally {
      setLogging(false);
    }
  }, [user?.id, language]);

  return {
    meals,
    logging,
    error,
    logMeal,
    refreshMeals,
  };
}

export default useDietLog;
