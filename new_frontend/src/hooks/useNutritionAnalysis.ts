/**
 * useNutritionAnalysis Hook
 * State machine for nutrition analysis workflow
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { analyzeNutrition, createSession } from '../services/dietCareApi';
import type { NutritionAnalysisResult, NutritionAnalysisRequest } from '../types/diet-care';
import { useAuth } from '../contexts/AuthContext';

type AnalysisState = 'idle' | 'creating_session' | 'analyzing' | 'success' | 'error';

interface State {
  readonly status: AnalysisState;
  readonly result: NutritionAnalysisResult | null;
  readonly error: string | null;
  readonly sessionId: string | null;
}

type Action =
  | { type: 'START_SESSION' }
  | { type: 'SESSION_CREATED'; sessionId: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_SUCCESS'; result: NutritionAnalysisResult }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'RESET' };

const initialState: State = {
  status: 'idle',
  result: null,
  error: null,
  sessionId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_SESSION':
      return { ...state, status: 'creating_session', error: null };
    case 'SESSION_CREATED':
      return { ...state, status: 'analyzing', sessionId: action.sessionId };
    case 'START_ANALYSIS':
      return { ...state, status: 'analyzing' };
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
  result: NutritionAnalysisResult | null;
  error: string | null;
  analyze: (image: File, text?: string) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

export function useNutritionAnalysis(
  language: 'en' | 'ko' = 'ko'
): UseNutritionAnalysisReturn {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (image: File, text?: string) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      dispatch({ type: 'START_SESSION' });

      // Create session
      const sessionResponse = await createSession(user?.id);
      dispatch({ type: 'SESSION_CREATED', sessionId: sessionResponse.session_id });

      // Analyze nutrition
      const request: NutritionAnalysisRequest = {
        session_id: sessionResponse.session_id,
        image,
        text: text || (language === 'ko'
          ? '이 음식의 영양 성분을 분석해주세요.'
          : 'Please analyze the nutritional content of this food.'),
      };

      const response = await analyzeNutrition(request);
      dispatch({ type: 'ANALYSIS_SUCCESS', result: response.analysis });
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

  // Cleanup on unmount
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
