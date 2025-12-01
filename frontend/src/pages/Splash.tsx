import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    // 3초 후 자동으로 Chat으로 이동 (또는 사용자가 클릭할 때까지 대기)
    const timer = setTimeout(() => {
      // 자동 이동을 원하지 않으면 이 부분을 제거
      // navigate('/chat')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  const handleStart = () => {
    navigate('/chat')
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'var(--gradient-primary)' }}>
      <div className="text-center px-6">
        {/* 로고/타이틀 */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-6xl font-bold text-white mb-4">
            CareGuide
          </h1>
          <p className="text-xl text-white opacity-90">
            만성콩팥병 환자를 위한 AI 건강 케어
          </p>
        </div>

        {/* 서브 타이틀 */}
        <p className="text-lg text-white opacity-80 mb-12">
          식단 관리부터 건강 정보까지, 당신의 건강을 함께 지킵니다
        </p>

        {/* 시작 버튼 */}
        <button
          onClick={handleStart}
          className="btn-primary-action text-lg px-12 py-4 transform hover:scale-105 transition-all duration-200 shadow-xl"
        >
          시작하기
        </button>

        {/* 추가 정보 */}
        <div className="mt-16 text-white opacity-70">
          <p className="text-sm">
            AI 챗봇과 대화하며 맞춤형 건강 관리를 받아보세요
          </p>
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  )
}
