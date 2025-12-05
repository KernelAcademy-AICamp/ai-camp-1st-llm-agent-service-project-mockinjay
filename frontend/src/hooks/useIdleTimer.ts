import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // milliseconds
  onIdle: () => void;
  onActive?: () => void;
  events?: string[];
  enabled?: boolean;
}

const DEFAULT_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
];

/**
 * Custom hook for detecting user idle state
 * Triggers onIdle callback after specified timeout of inactivity
 * Resets timer on any user activity
 */
export function useIdleTimer({
  timeout,
  onIdle,
  onActive,
  events = DEFAULT_EVENTS,
  enabled = true,
}: UseIdleTimerOptions) {
  // Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout for better browser compatibility
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // If was idle, call onActive
    if (isIdleRef.current && onActive) {
      isIdleRef.current = false;
      onActive();
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      onIdle();
    }, timeout);
  }, [timeout, onIdle, onActive, enabled]);

  // Manual reset function (for external use)
  const reset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Get current idle state
  const isIdle = useCallback(() => {
    return isIdleRef.current;
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Clear timer if disabled
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Add event listeners
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Also listen for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [events, resetTimer, enabled]);

  return { reset, isIdle };
}

export default useIdleTimer;
