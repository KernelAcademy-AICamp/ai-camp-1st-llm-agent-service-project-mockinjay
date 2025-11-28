/**
 * useDietLog Hook
 * Manages daily meal logging
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createMealEntry, fetchMealHistory, type MealEntry } from '../services/dietCareApi';
import type { MealType } from '../types/diet-care';
import { useAuth } from '../contexts/AuthContext';

export interface UseDietLogReturn {
  meals: MealEntry[];
  logging: boolean;
  error: string | null;
  logMeal: (mealType: MealType, foods: string[], imageUrl?: string) => Promise<void>;
  refreshMeals: () => Promise<void>;
}

export function useDietLog(
  date?: string,
  language: 'en' | 'ko' = 'ko'
): UseDietLogReturn {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveDate = date ?? new Date().toISOString().split('T')[0];

  const refreshMeals = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetchMealHistory(effectiveDate, effectiveDate);
      setMeals([...response]);
    } catch (err) {
      console.error('Failed to load meals:', err);
      setError(language === 'ko' ? '식사 기록을 불러오는데 실패했습니다.' : 'Failed to load meals.');
    }
  }, [user?.id, effectiveDate, language]);

  const logMeal = useCallback(async (
    mealType: MealType,
    foods: string[],
    imageUrl?: string
  ) => {
    if (!user?.id) {
      toast.error(language === 'ko' ? '로그인이 필요합니다.' : 'Please login first.');
      return;
    }

    try {
      setLogging(true);
      setError(null);

      const newMeal = await createMealEntry({
        mealType,
        foods,
        imageUrl,
      });
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
