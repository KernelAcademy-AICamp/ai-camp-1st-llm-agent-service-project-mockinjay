/**
 * useQuizStats Hook Tests
 * 퀴즈 통계 훅 테스트
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useQuizStats } from '../useQuizStats';

// Mock the quiz API
jest.mock('../../../../services/quizApi', () => ({
  getUserQuizStats: jest.fn(() =>
    Promise.resolve({
      userId: 'user123',
      totalSessions: 42,
      totalQuestions: 100,
      correctAnswers: 83,
      totalScore: 830,
      accuracyRate: 0.83,
      currentStreak: 5,
      bestStreak: 10,
      level: 'intermediate',
    })
  ),
}));

describe('useQuizStats', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useQuizStats('user123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should fetch quiz stats successfully', async () => {
    const { result } = renderHook(() => useQuizStats('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
    expect(result.current.stats?.totalQuizzes).toBe(42);
    expect(result.current.stats?.correctAnswers).toBe(83);
    expect(result.current.stats?.averageScore).toBe(83);
    expect(result.current.stats?.streak).toBe(5);
    expect(result.current.error).toBe(null);
  });

  it('should handle missing userId', async () => {
    const { result } = renderHook(() => useQuizStats(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('User ID is required');
  });

  it('should support refetch', async () => {
    const { result } = renderHook(() => useQuizStats('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialStats = result.current.stats;

    // Refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() => useQuizStats('user123'));

    // Should not throw error on unmount
    expect(() => unmount()).not.toThrow();
  });
});
