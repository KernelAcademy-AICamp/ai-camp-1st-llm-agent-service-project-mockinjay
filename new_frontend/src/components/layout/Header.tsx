import { useLocation } from 'react-router-dom'

const pageNames: Record<string, string> = {
  '/chat': '채팅',
  '/chat/medical-welfare': '의료복지 상담',
  '/chat/nutrition': '영양 상담',
  '/chat/research': '연구 정보',
  '/diet-care': '식단 관리',
  '/nutri-coach': '영양 코치',
  '/diet-log': '식단 기록',
  '/community': '커뮤니티',
  '/community/list': '커뮤니티',
  '/trends': '트렌드',
  '/trends/list': '트렌드',
  '/quiz': '퀴즈',
  '/quiz/list': '퀴즈',
  '/mypage': '마이페이지',
  '/subscribe': '구독',
  '/notification': '알림',
}

export function Header() {
  const location = useLocation()
  const pageName = pageNames[location.pathname] || 'CarePlus'

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 lg:pl-[280px]">
      <div className="h-full flex items-center justify-center px-4">
        <h1 className="text-xl font-semibold text-gray-900">{pageName}</h1>
      </div>
    </header>
  )
}
