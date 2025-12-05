import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SessionContextType {
  sessionId: string | null;
  isSessionActive: boolean;
  startSession: () => void;
  endSession: () => void;
  updateLastActivity: () => void;
  sessionStartTime: number | null;
  lastActivityTime: number | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// 세션 타임아웃 설정 (30분)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
// 활동 체크 간격 (1분)
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;

/**
 * 세션 ID 생성
 * Generates a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  /**
   * 세션 시작
   * Starts a new session
   */
  const startSession = useCallback(() => {
    const newSessionId = generateSessionId();
    const now = Date.now();

    setSessionId(newSessionId);
    setIsSessionActive(true);
    setLastActivityTime(now);
    setSessionStartTime(now);

    // localStorage에 세션 정보 저장
    localStorage.setItem('careGuideSessionId', newSessionId);
    localStorage.setItem('careGuideSessionStart', now.toString());
    localStorage.setItem('careGuideLastActivity', now.toString());

    console.log('Session started:', newSessionId);
  }, []);

  /**
   * 세션 종료
   * Ends the current session
   */
  const endSession = useCallback(() => {
    setSessionId(null);
    setIsSessionActive(false);
    setLastActivityTime(null);
    setSessionStartTime(null);

    // localStorage에서 세션 정보 제거
    localStorage.removeItem('careGuideSessionId');
    localStorage.removeItem('careGuideSessionStart');
    localStorage.removeItem('careGuideLastActivity');

    console.log('Session ended');
  }, []);

  /**
   * 마지막 활동 시간 업데이트
   * Updates the last activity timestamp
   */
  const updateLastActivity = useCallback(() => {
    if (isSessionActive) {
      const now = Date.now();
      setLastActivityTime(now);
      localStorage.setItem('careGuideLastActivity', now.toString());
    }
  }, [isSessionActive]);

  /**
   * 컴포넌트 마운트 시 기존 세션 복구
   * Restores existing session on component mount
   */
  useEffect(() => {
    const savedSessionId = localStorage.getItem('careGuideSessionId');
    const savedSessionStart = localStorage.getItem('careGuideSessionStart');
    const savedLastActivity = localStorage.getItem('careGuideLastActivity');

    if (savedSessionId && savedSessionStart && savedLastActivity) {
      const sessionAge = Date.now() - parseInt(savedLastActivity);

      // 30분 이내의 세션만 복구
      if (sessionAge < SESSION_TIMEOUT_MS) {
        setSessionId(savedSessionId);
        setIsSessionActive(true);
        setSessionStartTime(parseInt(savedSessionStart));
        setLastActivityTime(parseInt(savedLastActivity));
        console.log('Session restored:', savedSessionId);
      } else {
        // 만료된 세션 정리
        endSession();
        console.log('Expired session cleared');
      }
    }
  }, [endSession]);

  /**
   * 인증 상태 변경 감지
   * Watches for authentication state changes
   */
  useEffect(() => {
    if (isAuthenticated && !isSessionActive) {
      // 로그인 시 세션 시작
      startSession();
    } else if (!isAuthenticated && isSessionActive) {
      // 로그아웃 시 세션 종료
      endSession();
    }
  }, [isAuthenticated, isSessionActive, startSession, endSession]);

  /**
   * 세션 타임아웃 체크 (30분 비활동 시 자동 로그아웃)
   * Checks for session timeout (auto-logout after 30 minutes of inactivity)
   */
  useEffect(() => {
    if (!isSessionActive || !lastActivityTime) return;

    const checkTimeout = () => {
      const inactiveTime = Date.now() - lastActivityTime;

      if (inactiveTime > SESSION_TIMEOUT_MS) {
        console.log('Session timeout - logging out');
        endSession();
        logout();
      }
    };

    // 1분마다 타임아웃 체크
    const interval = setInterval(checkTimeout, ACTIVITY_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isSessionActive, lastActivityTime, endSession, logout]);

  /**
   * 사용자 활동 감지 (클릭, 키보드, 스크롤, 터치)
   * Detects user activity (click, keyboard, scroll, touch)
   */
  useEffect(() => {
    if (!isSessionActive) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      updateLastActivity();
    };

    // 이벤트 리스너 등록
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isSessionActive, updateLastActivity]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        isSessionActive,
        startSession,
        endSession,
        updateLastActivity,
        sessionStartTime,
        lastActivityTime,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/**
 * 세션 컨텍스트 훅
 * Session context hook
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
