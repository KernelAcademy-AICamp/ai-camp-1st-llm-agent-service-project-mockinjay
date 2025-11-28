/**
 * useDietGoals Hook
 * Manages diet goal setting and retrieval
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchNutritionGoals, updateNutritionGoals } from '../services/dietCareApi';
import type { NutritionGoal } from '../types/diet-care';
import { useAuth } from '../contexts/AuthContext';

export interface UseDietGoalsReturn {
  goals: NutritionGoal | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveGoals: (data: Partial<NutritionGoal>) => Promise<void>;
  refreshGoals: () => Promise<void>;
}

const DEFAULT_GOALS: NutritionGoal = {
  userId: '',
  dailyCalories: 2000,
  dailyProtein: 50,
  dailySodium: 2000,
  dailyPotassium: 2000,
  dailyPhosphorus: 1000,
};

export function useDietGoals(language: 'en' | 'ko' = 'ko'): UseDietGoalsReturn {
  const { user } = useAuth();
  const [goals, setGoals] = useState<NutritionGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!user?.id) {
      setGoals(DEFAULT_GOALS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchNutritionGoals();
      setGoals(response);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setGoals(DEFAULT_GOALS);
      setError(language === 'ko' ? '목표를 불러오는데 실패했습니다.' : 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, language]);

  const saveGoals = useCallback(async (data: Partial<NutritionGoal>) => {
    if (!user?.id) {
      toast.error(language === 'ko' ? '로그인이 필요합니다.' : 'Please login first.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await updateNutritionGoals(data);
      setGoals(response);
      toast.success(language === 'ko' ? '목표가 저장되었습니다.' : 'Goals saved successfully.');
    } catch (err) {
      console.error('Failed to save goals:', err);
      setError(language === 'ko' ? '목표 저장에 실패했습니다.' : 'Failed to save goals.');
      toast.error(language === 'ko' ? '목표 저장에 실패했습니다.' : 'Failed to save goals.');
    } finally {
      setSaving(false);
    }
  }, [user?.id, language]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  return {
    goals,
    loading,
    saving,
    error,
    saveGoals,
    refreshGoals: loadGoals,
  };
}

export default useDietGoals;
