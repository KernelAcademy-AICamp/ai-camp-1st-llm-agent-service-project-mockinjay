import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Trophy, Users, TrendingUp, User, LogOut, LogIn, Bell, HelpCircle, FileText, Shield } from 'lucide-react';
import { useLayout } from './LayoutContext';

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

const menuItems = [
  { id: 'chat', label: 'AI챗봇', icon: ChatbotIcon, path: '/chat' },
  { id: 'diet', label: '식단케어', icon: UtensilsCrossed, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', icon: Trophy, path: '/quiz/list' },
  { id: 'community', label: '커뮤니티', icon: Users, path: '/community' },
  { id: 'trends', label: '트렌드', icon: TrendingUp, path: '/trends' }
];

// Footer links with icons
const footerLinks = [
  { id: 'notification', label: '알림', icon: Bell, path: '/notifications' },
  { id: 'support', label: '고객지원', icon: HelpCircle, path: '/support' },
  { id: 'terms', label: '이용약관', icon: FileText, path: '/terms-and-conditions' },
  { id: 'privacy', label: '개인정보 처리방침', icon: Shield, path: '/privacy-policy' }
];

interface SidebarProps {
  isLoggedIn?: boolean; // Kept for prop compatibility but using context preference
  onLogout?: () => void;
}

export function Sidebar({ isLoggedIn: propIsLoggedIn, onLogout: propOnLogout }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useLayout();
  
  // Use context value if available, otherwise prop (though context should be primary)
  const authenticated = isLoggedIn;

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  return (
    <aside 
      className="hidden lg:flex fixed left-0 top-[52px] lg:top-16 bottom-0 flex-col bg-white"
      style={{ 
        width: '280px',
        borderRight: '1px solid #E5E7EB',
        zIndex: 40
      }}
    >
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50"
              style={{
                backgroundColor: 'transparent',
                color: active ? '#00C8B4' : '#999999'
              }}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className={`font-medium ${active ? 'text-[#00C8B4]' : 'text-[#999999]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        {/* Login/Signup OR MyPage Logic */}
        {!authenticated ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                border: '1px solid #E0E0E0',
                color: '#666666'
              }}
            >
              로그인
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                background: '#00C9B7',
                color: '#FFFFFF'
              }}
            >
              회원가입
            </button>
          </div>
        ) : (
           <button
            onClick={() => navigate('/mypage')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 mb-2"
            style={{ 
              backgroundColor: 'transparent',
              color: location.pathname.startsWith('/mypage') ? '#00C8B4' : '#999999'
            }}
          >
            <User size={20} strokeWidth={1.5} />
            <span className="font-medium">마이페이지</span>
          </button>
        )}
        
        {/* Footer Links with Icons */}
        <div className="mt-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
             {footerLinks.map((link) => {
               const Icon = link.icon;
               return (
                 <button
                   key={link.id}
                   onClick={() => navigate(link.path)}
                   className="flex items-center gap-2 text-[11px] text-[#9CA3AF] hover:text-[#00C8B4] transition-colors py-1"
                 >
                   <Icon size={12} />
                   <span>{link.label}</span>
                 </button>
               )
             })}
          </div>
          <p style={{ fontSize: '10px', color: '#D1D5DB', marginTop: '12px', textAlign: 'center' }}>
            © 2025 CareGuide
          </p>
        </div>
      </div>
    </aside>
  );
}
