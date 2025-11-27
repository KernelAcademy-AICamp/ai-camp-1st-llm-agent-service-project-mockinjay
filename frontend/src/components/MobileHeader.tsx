import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Menu, User, LogIn } from 'lucide-react';
import { useLayout } from './LayoutContext';

export function MobileHeader({ 
  title, 
  onBack, 
  rightAction,
  showMenu = false,
  showProfile = false
}: { 
  title: string; 
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showMenu?: boolean;
  showProfile?: boolean;
}) {
  const navigate = useNavigate();
  const { openDrawer, isLoggedIn } = useLayout();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/mypage');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="lg:hidden px-4 py-3 flex items-center justify-between border-b border-[#E0E0E0] bg-white sticky top-0 z-50 h-[52px]">
      <div className="flex items-center w-10">
        {showMenu ? (
          <button onClick={openDrawer} className="p-1 -ml-1" aria-label="메뉴 열기">
            <Menu size={24} className="text-[#1F2937]" strokeWidth={2} />
          </button>
        ) : (
          <button onClick={handleBack} className="p-1 -ml-1" aria-label="뒤로가기">
            <ChevronLeft size={24} className="text-[#1F2937]" strokeWidth={2} />
          </button>
        )}
      </div>
      
      <h1 className="text-[16px] font-bold text-[#1F2937] absolute left-1/2 transform -translate-x-1/2 text-center truncate max-w-[60%]">
        {title}
      </h1>
      
      <div className="flex items-center justify-end w-10">
        {rightAction ? (
          rightAction
        ) : showProfile ? (
          <button onClick={handleProfileClick} className="p-1 -mr-1 relative" aria-label={isLoggedIn ? "마이페이지" : "로그인"}>
            {isLoggedIn ? (
              <>
                <User size={24} color="#999999" strokeWidth={2} />
                {/* Notification Badge */}
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{ background: '#00C9B7' }}></span>
              </>
            ) : (
               <LogIn size={24} color="#999999" strokeWidth={2} />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
