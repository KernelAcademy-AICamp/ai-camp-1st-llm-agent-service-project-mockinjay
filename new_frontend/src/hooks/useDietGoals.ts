/**
 * useDietGoals Hook
 * Manages diet goal setting and retrieval
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { updateGoals, getGoals } from '../services/dietCareApi';
import type { NutritionGoals, UpdateGoalsRequest } from '../types/diet-care';
import { useAuth } from '../contexts/AuthContext';

export interface DietGoalsFormData {
  calories_kcal: number;
  protein_g: number;
  sodium_mg: number;
  potassium_mg: number;
  phosphorus_mg: number;
  fluid_ml: number;
}

export interface UseDietGoalsReturn {
  goals: NutritionGoals | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveGoals: (data: UpdateGoalsRequest) => Promise<void>;
  refreshGoals: () => Promise<void>;
}

const DEFAULT_GOALS: NutritionGoals = {
  calories_kcal: 2000,
  protein_g: 50,
  sodium_mg: 2000,
  potassium_mg: 2000,
  phosphorus_mg: 1000,
  fluid_ml: 2000,
};

export function useDietGoals(language: 'en' | 'ko' = 'ko'): UseDietGoalsReturn {
  const { user } = useAuth();
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
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
      const response = await getGoals();
      setGoals(response.goals);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setGoals(DEFAULT_GOALS);
      setError(language === 'ko' ? '목표를 불러오는데 실패했습니다.' : 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, language]);

  const saveGoals = useCallback(async (data: UpdateGoalsRequest) => {
    if (!user?.id) {
      toast.error(language === 'ko' ? '로그인이 필요합니다.' : 'Please login first.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await updateGoals(data);
      setGoals(response.goals);
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
