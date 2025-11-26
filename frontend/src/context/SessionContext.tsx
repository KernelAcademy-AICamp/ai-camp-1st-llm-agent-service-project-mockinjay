import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SessionContextType {
  sessionId: string | null
  isSessionActive: boolean
  startSession: () => void
  endSession: () => void
  updateLastActivity: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // 세션 ID 생성
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 세션 시작
  const startSession = () => {
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    setIsSessionActive(true)
    setLastActivity(Date.now())
    localStorage.setItem('careGuideSessionId', newSessionId)
    localStorage.setItem('careGuideSessionStart', Date.now().toString())
  }

  // 세션 종료
  const endSession = () => {
    setSessionId(null)
    setIsSessionActive(false)
    localStorage.removeItem('careGuideSessionId')
    localStorage.removeItem('careGuideSessionStart')
  }

  // 마지막 활동 시간 업데이트
  const updateLastActivity = () => {
    setLastActivity(Date.now())
  }

  // 컴포넌트 마운트 시 기존 세션 복구
  useEffect(() => {
    const savedSessionId = localStorage.getItem('careGuideSessionId')
    const savedSessionStart = localStorage.getItem('careGuideSessionStart')

    if (savedSessionId && savedSessionStart) {
      const sessionAge = Date.now() - parseInt(savedSessionStart)
      // 30분 이상 지난 세션은 무효화
      if (sessionAge < 30 * 60 * 1000) {
        setSessionId(savedSessionId)
        setIsSessionActive(true)
      } else {
        endSession()
      }
    }
  }, [])

  // 세션 타임아웃 체크 (30분 비활동시 자동 종료)
  useEffect(() => {
    if (!isSessionActive) return

    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity
      // 30분(1800000ms) 이상 비활동시 세션 종료
      if (inactiveTime > 30 * 60 * 1000) {
        endSession()
      }
    }, 60000) // 1분마다 체크

    return () => clearInterval(interval)
  }, [isSessionActive, lastActivity])

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        isSessionActive,
        startSession,
        endSession,
        updateLastActivity,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
