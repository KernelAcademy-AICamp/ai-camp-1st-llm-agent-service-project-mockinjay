/**
 * useQuizStats Hook
 * 퀴즈 통계 데이터 로딩 및 관리
 */
import { useState, useEffect, useCallback } from 'react';
import { getUserQuizStats } from '../../../services/quizApi';
import type { UserQuizStats } from '../../../services/quizApi';

/**
 * Quiz Statistics Data
 * 퀴즈 통계 데이터 타입 (Frontend format)
 */
export interface QuizStats {
  totalQuizzes: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageScore: number;
  streak: number;
  lastQuizDate?: string;
  categoryStats?: Array<{
    category: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

/**
 * useQuizStats Return Type
 */
interface UseQuizStatsReturn {
  /** Quiz statistics data */
  stats: QuizStats | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch statistics */
  refetch: () => Promise<void>;
}

/**
 * Convert backend UserQuizStats to frontend QuizStats format
 */
function mapQuizStatsToFrontend(backendStats: UserQuizStats): QuizStats {
  const totalQuestions = backendStats.totalQuestions || backendStats.correctAnswers;
  const incorrectAnswers = totalQuestions - backendStats.correctAnswers;

  return {
    totalQuizzes: backendStats.totalSessions,
    correctAnswers: backendStats.correctAnswers,
    incorrectAnswers,
    averageScore: backendStats.accuracyRate * 100, // Convert to percentage
    streak: backendStats.currentStreak,
    // Note: Backend doesn't provide categoryStats yet
    // This can be added when backend supports it
  };
}

/**
 * Fetch quiz statistics from backend API
 */
async function fetchQuizStats(userId: string, signal?: AbortSignal): Promise<QuizStats> {
  // Check if request was aborted before making API call
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }

  const backendStats = await getUserQuizStats(userId);
  return mapQuizStatsToFrontend(backendStats);
}

/**
 * useQuizStats Hook
 *
 * 사용자의 퀴즈 통계 데이터를 로딩하고 관리합니다.
 * AbortController를 사용하여 컴포넌트 언마운트 시 요청을 취소합니다.
 *
 * @param userId - User ID
 * @returns Quiz statistics and control methods
 *
 * @example
 * ```tsx
 * const { stats, loading, error, refetch } = useQuizStats(userId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     <p>Total Quizzes: {stats?.totalQuizzes}</p>
 *     <p>Average Score: {stats?.averageScore}%</p>
 *     <button onClick={refetch}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useQuizStats(userId: string): UseQuizStatsReturn {
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch quiz statistics
   */
  const fetchStats = useCallback(async () => {
    if (!userId) {
      setError(new Error('User ID is required'));
      setLoading(false);
      return;
    }

    // Create AbortController for cleanup
    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await fetchQuizStats(userId, controller.signal);
      setStats(data);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.message !== 'Request aborted') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [userId]);

  /**
   * Refetch statistics (public API)
   */
  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  /**
   * Initial fetch on mount or userId change
   */
  useEffect(() => {
    const cleanup = fetchStats();
    return () => {
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
