import { useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Trophy, Users, TrendingUp } from 'lucide-react';

// Chat icon SVG component from Figma
function ChatbotIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M5.33333 4.33333H5.34M8.66667 4.33333H8.67333M11 1C11.5304 1 12.0391 1.21071 12.4142 1.58579C12.7893 1.96086 13 2.46957 13 3V8.33333C13 8.86377 12.7893 9.37247 12.4142 9.74755C12.0391 10.1226 11.5304 10.3333 11 10.3333H7.66667L4.33333 12.3333V10.3333H3C2.46957 10.3333 1.96086 10.1226 1.58579 9.74755C1.21071 9.37247 1 8.86377 1 8.33333V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H11Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems = [
  { id: 'chat', label: 'AI챗봇', icon: ChatbotIcon, path: '/chat' },
  { id: 'diet', label: '식단케어', icon: UtensilsCrossed, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', icon: Trophy, path: '/quiz/list' },
  { id: 'community', label: '커뮤니티', icon: Users, path: '/community' },
  { id: 'trends', label: '트렌드', icon: TrendingUp, path: '/trends' }
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
        height: '64px',
        boxShadow: 'none' // Explicitly no shadow
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]"
            style={{
              color: active ? '#00C8B4' : '#999999' // Corrected inactive color
            }}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
