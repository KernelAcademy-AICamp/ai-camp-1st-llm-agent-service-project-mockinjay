/**
 * useNutritionProgress Hook
 * Calculates daily nutrition progress vs goals
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchDailyProgress } from '../services/dietCareApi';
import { useAuth } from '../contexts/AuthContext';
import type { NutritionAnalysis, NutritionGoal } from '../types/diet-care';

export interface NutrientProgressItem {
  current: number;
  target: number;
  percentage: number;
}

export interface NutritionProgress {
  calories: NutrientProgressItem;
  protein: NutrientProgressItem;
  sodium: NutrientProgressItem;
  potassium: NutrientProgressItem;
  phosphorus: NutrientProgressItem;
}

export interface DailyProgressData {
  consumed: NutritionAnalysis;
  goals: NutritionGoal;
  percentage: number;
}

export interface UseNutritionProgressReturn {
  data: DailyProgressData | null;
  progress: NutritionProgress | null;
  loading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
}

export function useNutritionProgress(
  date?: string,
  language: 'en' | 'ko' = 'ko'
): UseNutritionProgressReturn {
  const { user } = useAuth();
  const [data, setData] = useState<DailyProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveDate = date ?? new Date().toISOString().split('T')[0];

  const loadProgress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchDailyProgress(effectiveDate);
      setData(response);
    } catch (err: unknown) {
      console.error('Error loading nutrition progress:', err);
      const errorMessage = language === 'ko'
        ? '영양 정보를 불러오는 중 오류가 발생했습니다'
        : 'Error loading nutrition data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, effectiveDate, language]);

  const progress = useMemo<NutritionProgress | null>(() => {
    if (!data) return null;

    const { consumed, goals } = data;

    return {
      calories: {
        current: consumed.calories,
        target: goals.dailyCalories,
        percentage: Math.min((consumed.calories / goals.dailyCalories) * 100, 100),
      },
      protein: {
        current: consumed.protein,
        target: goals.dailyProtein,
        percentage: Math.min((consumed.protein / goals.dailyProtein) * 100, 100),
      },
      sodium: {
        current: consumed.sodium,
        target: goals.dailySodium,
        percentage: Math.min((consumed.sodium / goals.dailySodium) * 100, 100),
      },
      potassium: {
        current: consumed.potassium,
        target: goals.dailyPotassium,
        percentage: Math.min((consumed.potassium / goals.dailyPotassium) * 100, 100),
      },
      phosphorus: {
        current: consumed.phosphorus,
        target: goals.dailyPhosphorus,
        percentage: Math.min((consumed.phosphorus / goals.dailyPhosphorus) * 100, 100),
      },
    };
  }, [data]);

  const refreshProgress = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    data,
    progress,
    loading,
    error,
    refreshProgress,
  };
}
