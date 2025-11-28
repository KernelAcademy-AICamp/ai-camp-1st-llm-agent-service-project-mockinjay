/**
 * useNutritionAnalysis Hook
 * State machine for nutrition analysis workflow
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { analyzeNutrition } from '../services/dietCareApi';
import type { NutritionAnalysis, MealType } from '../types/diet-care';
import { useAuth } from '../contexts/AuthContext';

type AnalysisState = 'idle' | 'analyzing' | 'success' | 'error';

interface State {
  readonly status: AnalysisState;
  readonly result: NutritionAnalysis | null;
  readonly error: string | null;
}

type Action =
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_SUCCESS'; result: NutritionAnalysis }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'RESET' };

const initialState: State = {
  status: 'idle',
  result: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_ANALYSIS':
      return { ...state, status: 'analyzing', error: null };
    case 'ANALYSIS_SUCCESS':
      return { ...state, status: 'success', result: action.result, error: null };
    case 'ANALYSIS_ERROR':
      return { ...state, status: 'error', error: action.error };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export interface UseNutritionAnalysisReturn {
  status: AnalysisState;
  result: NutritionAnalysis | null;
  error: string | null;
  analyze: (imageUrl: string, mealType: MealType) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

export function useNutritionAnalysis(
  language: 'en' | 'ko' = 'ko'
): UseNutritionAnalysisReturn {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (imageUrl: string, mealType: MealType) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      dispatch({ type: 'START_ANALYSIS' });

      const response = await analyzeNutrition(imageUrl, mealType);
      dispatch({ type: 'ANALYSIS_SUCCESS', result: response });
      toast.success(language === 'ko' ? '분석이 완료되었습니다.' : 'Analysis complete.');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        dispatch({ type: 'ANALYSIS_ERROR', error: language === 'ko' ? '분석이 취소되었습니다.' : 'Analysis cancelled.' });
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'ANALYSIS_ERROR', error: errorMessage });
      toast.error(language === 'ko' ? '분석에 실패했습니다.' : 'Analysis failed.');
    }
  }, [user?.id, language]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    dispatch({ type: 'RESET' });
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    status: state.status,
    result: state.result,
    error: state.error,
    analyze,
    reset,
    abort,
  };
}

export default useNutritionAnalysis;
