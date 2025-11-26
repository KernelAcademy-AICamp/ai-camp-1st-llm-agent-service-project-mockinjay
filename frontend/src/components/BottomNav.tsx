import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes'

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  // 네비게이션을 숨겨야 하는 페이지들
  const hideNavPaths = ['/', '/login', '/signup', '/home']
  if (hideNavPaths.includes(location.pathname)) {
    return null
  }

  const navItems = [
    { path: ROUTES.CHAT, label: 'AI 챗봇', icon: '💬' },
    { path: ROUTES.DIET_CARE, label: '식단케어', icon: '🥗' },
    { path: ROUTES.COMMUNITY, label: '커뮤니티', icon: '👥' },
    { path: ROUTES.TRENDS, label: '트렌드', icon: '📊' },
    { path: ROUTES.MYPAGE, label: '마이', icon: '👤' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-line-medium)] z-50"
      style={{ height: '64px' }}
    >
      <div className="max-w-6xl mx-auto h-full flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              isActive(item.path) ? '' : 'opacity-60'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span
              className={`text-xs font-medium ${
                isActive(item.path)
                  ? 'text-[var(--color-nav-selected)]'
                  : 'text-[var(--color-nav-unselected)]'
              }`}
            >
              {item.label}
            </span>
            {isActive(item.path) && (
              <div
                className="absolute bottom-0 h-1 w-12 rounded-t-full"
                style={{ background: 'var(--gradient-primary)' }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
