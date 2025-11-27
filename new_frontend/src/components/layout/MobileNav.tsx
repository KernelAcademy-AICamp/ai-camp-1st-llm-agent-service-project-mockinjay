import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Utensils, Trophy, Users, User } from 'lucide-react';

const navItems = [
  { id: 'chat', label: 'AI챗봇', icon: MessageSquare, path: '/chat' },
  { id: 'diet', label: '식단케어', icon: Utensils, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', icon: Trophy, path: '/quiz' },
  { id: 'community', label: '커뮤니티', icon: Users, path: '/community' },
  { id: 'mypage', label: '마이페이지', icon: User, path: '/mypage' }
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-40 flex items-center justify-around px-2 py-2"
      style={{
        borderTop: '1px solid #E0E0E0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        minHeight: '64px'
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors"
            style={{
              color: active ? 'var(--color-nav-selected)' : 'var(--color-nav-unselected)'
            }}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
