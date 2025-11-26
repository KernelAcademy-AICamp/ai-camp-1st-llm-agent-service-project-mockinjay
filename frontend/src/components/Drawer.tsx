import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Utensils, HelpCircle, Users, BarChart2, Bell, Shield, FileText, LogIn } from 'lucide-react';
import { useLayout } from './LayoutContext';

// Icon components for better control if needed
const menuItems = [
  { id: 'chat', label: 'AI챗봇', icon: MessageSquare, path: '/chat' },
  { id: 'diet', label: '식단케어', icon: Utensils, path: '/diet-care' },
  { id: 'quiz', label: '퀴즈미션', icon: HelpCircle, path: '/quiz/list' },
  { id: 'community', label: '커뮤니티', icon: Users, path: '/community' },
  { id: 'trends', label: '트렌드', icon: BarChart2, path: '/trends' }
];

const secondaryItems = [
  { id: 'notification', label: '알림', path: '/notification', icon: Bell },
  { id: 'support', label: '고객지원', path: '/support', icon: HelpCircle },
  { id: 'terms', label: '이용약관', path: '/terms-and-conditions', icon: FileText },
  { id: 'privacy', label: '개인정보 처리방침', path: '/privacy-policy', icon: Shield }
];

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function Drawer({ isOpen, onClose, isLoggedIn: propIsLoggedIn, onLogout: propOnLogout }: DrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useLayout();
  
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
                <Icon size={24} color="#000000" strokeWidth={1.5} />
                <span className="text-[16px] text-[#1F2937]">{item.label}</span>
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
               <Users size={20} strokeWidth={1.5} />
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
                <Icon size={20} strokeWidth={1.5} />
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
              <LogIn size={20} strokeWidth={1.5} />
              <span>로그인 / 회원가입</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
}
