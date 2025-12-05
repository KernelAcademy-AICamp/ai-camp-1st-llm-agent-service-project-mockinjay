import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';

/**
 * 스플래시 페이지 컴포넌트
 * Splash Page Component
 *
 * 앱 시작 시 표시되는 환영 화면입니다.
 * Welcome screen displayed when the app starts.
 */
export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 3초 후 자동으로 메인 페이지로 이동 (선택적)
    // Auto-navigate to main page after 3 seconds (optional)
    // const timer = setTimeout(() => {
    //   navigate('/main');
    // }, 3000);
    // return () => clearTimeout(timer);
  }, [navigate]);

  const handleStart = () => {
    navigate('/main');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)',
      }}
    >
      <div className="text-center px-6 animate-fade-in">
        {/* 로고 영역 */}
        <div className="mb-8 flex flex-col items-center">
          {/* 로고 아이콘만 크게 표시 */}
          <div
            className="flex items-center justify-center rounded-full mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              width: 120,
              height: 120,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Logo size="lg" showTextOnMobile={false} />
          </div>

          {/* 앱 이름 */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            CareGuide
          </h1>

          {/* 서브 타이틀 */}
          <p className="text-xl text-white/90">
            만성콩팥병 환자를 위한 AI 건강 케어
          </p>
        </div>

        {/* 설명 텍스트 */}
        <p className="text-lg text-white/80 mb-12 max-w-md mx-auto">
          식단 관리부터 건강 정보까지, 당신의 건강을 함께 지킵니다
        </p>

        {/* 시작 버튼 */}
        <button
          onClick={handleStart}
          className="
            bg-white text-teal-600 font-semibold
            text-lg px-12 py-4 rounded-full
            transform hover:scale-105 active:scale-95
            transition-all duration-200
            shadow-xl hover:shadow-2xl
            focus:outline-none focus:ring-4 focus:ring-white/30
          "
        >
          시작하기
        </button>

        {/* 추가 정보 */}
        <p className="mt-12 text-white/70 text-sm">
          AI 챗봇과 대화하며 맞춤형 건강 관리를 받아보세요
        </p>
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
  );
}
