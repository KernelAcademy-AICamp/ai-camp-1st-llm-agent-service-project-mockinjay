/**
 * useNutritionProgress Hook
 * Calculates daily nutrition progress vs goals
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDailyProgress } from '../services/dietCareApi';
import type { DailyProgressResponse } from '../types/diet-care';
import { useAuth } from '../contexts/AuthContext';

export interface NutritionProgress {
  calories: { current: number; target: number; percentage: number };
  protein: { current: number; target: number; percentage: number };
  sodium: { current: number; target: number; percentage: number };
  potassium: { current: number; target: number; percentage: number };
  phosphorus: { current: number; target: number; percentage: number };
}

export interface UseNutritionProgressReturn {
  summary: DailyProgressResponse | null;
  progress: NutritionProgress | null;
  loading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
}

export function useNutritionProgress(
  date: string = new Date().toISOString().split('T')[0],
  language: 'en' | 'ko' = 'ko'
): UseNutritionProgressReturn {
  const { user } = useAuth();
  // Goals are already included in DailyProgressResponse from backend
  const [summary, setSummary] = useState<DailyProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load daily nutrition summary
   */
  const loadSummary = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDailyProgress(date);
      setSummary(data);
    } catch (err: unknown) {
      console.error('Error loading nutrition summary:', err);
      const errorMessage = language === 'ko'
        ? '영양 정보를 불러오는 중 오류가 발생했습니다'
        : 'Error loading nutrition data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, date, language]);

  /**
   * Calculate progress percentages
   * DailyProgressResponse already contains NutrientProgress objects
   */
  const progress = useMemo<NutritionProgress | null>(() => {
    if (!summary) return null;

    // DailyProgressResponse already has the correct structure
    return {
      calories: {
        current: summary.calories.current,
        target: summary.calories.target,
        percentage: summary.calories.percentage,
      },
      protein: {
        current: summary.protein.current,
        target: summary.protein.target,
        percentage: summary.protein.percentage,
      },
      sodium: {
        current: summary.sodium.current,
        target: summary.sodium.target,
        percentage: summary.sodium.percentage,
      },
      potassium: {
        current: summary.potassium.current,
        target: summary.potassium.target,
        percentage: summary.potassium.percentage,
      },
      phosphorus: {
        current: summary.phosphorus.current,
        target: summary.phosphorus.target,
        percentage: summary.phosphorus.percentage,
      },
    };
  }, [summary]);

  /**
   * Refresh progress data
   */
  const refreshProgress = useCallback(async () => {
    await loadSummary();
  }, [loadSummary]);

  /**
   * Load summary on mount and when date changes
   */
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    progress,
    loading,
    error,
    refreshProgress,
  };
}
