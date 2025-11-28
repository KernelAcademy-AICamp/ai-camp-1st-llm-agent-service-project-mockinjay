import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  isLoggedIn?: boolean;
  userType?: '일반인' | '환우' | '연구자';
}

export function Header({ onMenuClick, isLoggedIn = false, userType }: HeaderProps) {
  const [showUserModal, setShowUserModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    // Determine page title based on path
    const path = location.pathname;
    if (path.startsWith('/chat')) {
      setPageTitle('AI챗봇');
    } else if (path.startsWith('/trends')) {
      setPageTitle('트렌드');
    } else if (path.startsWith('/mypage')) {
      setPageTitle('마이 페이지');
    } else if (path.startsWith('/diet-care')) {
      setPageTitle('식단케어');
    } else if (path.startsWith('/quiz')) {
      setPageTitle('퀴즈미션');
    } else if (path.startsWith('/community')) {
      setPageTitle('커뮤니티');
    } else if (path.startsWith('/dashboard')) {
      setPageTitle('대시보드');
    } else {
      setPageTitle('');
    }
  }, [location]);
  
  const handleLogoClick = () => {
    navigate('/home');
  };
  
  return (
    <>
      {/* Mobile Header Removed as per instruction "Mobile Header Structure" is page specific and implemented in pages like NutriCoachPage */}
      <header 
        className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white z-40 items-center justify-between px-6"
        style={{ borderBottom: '1px solid #E5E7EB' }}
      >
        {/* Desktop Logo */}
        <div className="flex-shrink-0">
          <a
            href="/home"
            onClick={(e) => {
              e.preventDefault();
              handleLogoClick();
            }}
            className="cursor-pointer"
            aria-label="홈으로 이동"
          >
            <Logo size="md" />
          </a>
        </div>
        
        {/* Centered Page Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 
            className="font-bold text-[#1F2937]"
            style={{ fontSize: '20px' }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Right side placeholder to balance the logo if needed, or empty */}
        <div className="w-[140px]"></div>
      </header>
      
      {/* User Type Selection Modal */}
      {showUserModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowUserModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4">사용자 유형을 선택해주세요</h3>
            <div className="flex flex-col gap-3">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowUserModal(false);
                  navigate('/signup?type=일반인');
                }}
              >
                일반인
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowUserModal(false);
                  navigate('/signup?type=환우');
                }}
              >
                신장병 환우
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowUserModal(false);
                  navigate('/signup?type=연구자');
                }}
              >
                연구자
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
