import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UtensilsCrossed, Trophy, Users, TrendingUp, Bell, Shield, FileText, LogIn, HelpCircle, User } from 'lucide-react';
import { useLayout } from './LayoutContext';

// Chat icon SVG component from Figma (same as MobileNav)
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

// Icon components for better control if needed
const menuItems = [
  { id: 'chat', label: 'AI챗봇', icon: ChatbotIcon, path: '/chat' },
  { id: 'diet', label: '식단케어', icon: UtensilsCrossed, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', icon: Trophy, path: '/quiz/list' },
  { id: 'community', label: '커뮤니티', icon: Users, path: '/community' },
  { id: 'trends', label: '트렌드', icon: TrendingUp, path: '/trends' }
];

const secondaryItems = [
  { id: 'notification', label: '알림', path: '/notifications', icon: Bell },
  { id: 'support', label: '고객지원', path: '/support', icon: HelpCircle },
  { id: 'terms', label: '이용약관', path: '/terms-and-conditions', icon: FileText },
  { id: 'privacy', label: '개인정보 처리방침', path: '/privacy-policy', icon: Shield }
];

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Drawer({ isOpen, onClose }: DrawerProps) {
  const navigate = useNavigate();
  const { isLoggedIn } = useLayout();
  
  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="fixed top-0 left-0 bottom-0 bg-white z-50 lg:hidden overflow-y-auto flex flex-col"
        style={{ 
          width: '80%', 
          maxWidth: '320px',
          boxShadow: 'var(--shadow-default)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[52px] relative">
          <button 
            onClick={onClose}
            className="p-1 -ml-1"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={28} color="#000000" strokeWidth={2.5} />
          </button>
          
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-[18px] font-bold text-black">
            메뉴
          </h1>
          
          <div className="w-8" /> 
        </div>
        
        {/* Main Menu (Icons) */}
        <nav className="px-6 pt-8 pb-4 space-y-6">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="w-full flex items-center gap-4 transition-opacity hover:opacity-70"
              >
                <Icon size={20} color="#000000" strokeWidth={1.5} />
                <span className="text-[15px] text-[#1F2937]">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Divider */}
        <div className="h-[1px] bg-[#E5E7EB] w-full my-2" />
        
        {/* Secondary Menu (Icons added) */}
        <nav className="px-6 py-6 space-y-6 flex-1">
          {/* MyPage Link - Only if logged in */}
          {isLoggedIn && (
            <button
              onClick={() => handleNavigate('/mypage')}
              className="w-full flex items-center gap-4 text-[15px] text-[#1F2937] transition-opacity hover:opacity-70"
            >
               <User size={20} color="#000000" strokeWidth={1.5} />
               <span>마이 페이지</span>
            </button>
          )}

          {secondaryItems.map((item) => {
             const Icon = item.icon;
             return (
                <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="w-full flex items-center gap-4 text-[15px] text-[#1F2937] transition-opacity hover:opacity-70"
                >
                <Icon size={20} color="#000000" strokeWidth={1.5} />
                <span>{item.label}</span>
                </button>
             );
          })}

          {/* Login/Logout Logic */}
          {isLoggedIn ? (
             <>
               {/* Logout is usually handled in sidebar, but here we add it */}
             </>
          ) : (
            <button
              onClick={() => handleNavigate('/login')}
              className="w-full flex items-center gap-4 text-[15px] text-[#1F2937] transition-opacity hover:opacity-70 pt-4 border-t border-gray-100"
            >
              <LogIn size={20} color="#000000" strokeWidth={1.5} />
              <span>로그인 / 회원가입</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
}
