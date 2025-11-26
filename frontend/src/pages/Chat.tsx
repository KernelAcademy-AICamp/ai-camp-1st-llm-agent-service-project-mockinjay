import { useEffect } from 'react'
import { useSession } from '../context/SessionContext'
import ChatPage from './chat/ChatPage'

export default function Chat() {
  const { isSessionActive, startSession, updateLastActivity } = useSession()

  useEffect(() => {
    // Chat 페이지 진입 시 세션 시작
    if (!isSessionActive) {
      startSession()
    }
  }, [isSessionActive, startSession])

  // 사용자 활동 추적
  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity()
    }

    // 사용자 활동 이벤트 리스너
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
    }
  }, [updateLastActivity])

  return <ChatPage />
}
