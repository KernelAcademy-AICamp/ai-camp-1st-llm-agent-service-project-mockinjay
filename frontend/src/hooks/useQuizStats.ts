/**
 * useQuizStats Custom Hook
 * Manages quiz statistics loading, error handling, and refetching
 */
import { useState, useEffect, useCallback } from 'react';
import { getUserQuizStats } from '../services/quizApi';
import type { UserQuizStats } from '../services/quizApi';

interface UseQuizStatsReturn {
  stats: UserQuizStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useQuizStats = (userId?: number | string): UseQuizStatsReturn => {
  const [stats, setStats] = useState<UserQuizStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserQuizStats(String(userId));
      setStats(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('퀴즈 통계를 불러오는데 실패했습니다.');
      setError(error);
      console.error('Failed to load quiz stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
};

export default useQuizStats;
