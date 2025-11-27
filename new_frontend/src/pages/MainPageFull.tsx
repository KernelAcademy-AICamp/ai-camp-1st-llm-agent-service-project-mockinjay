import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ROUTES } from '../types/careguide-ia';
import { Send, Stethoscope, Utensils, FileText, Heart } from 'lucide-react';

const MainPageFull: React.FC = () => {
  const { language } = useApp();
  const [message, setMessage] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer); // 타이머 정리 (Cleanup timer)
  }, []);

  const handleCategoryClick = (route: string) => {
    setIsNavigating(true);
    // 애니메이션 시작 후 네비게이션
    // Animation starts before navigation
    setTimeout(() => {
      navigate(route);
    }, 300);
    // Note: Cleanup not needed here as component will unmount during navigation
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      navigate(ROUTES.CHAT, { state: { initialMessage: message } });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--color-background)' }}
    >
      {/* Splash Animation Overlay */}
      {isNavigating && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 201, 183, 0.1) 0%, rgba(159, 122, 234, 0.1) 100%)',
            animation: 'splash-expand 0.6s ease-out forwards'
          }}
        >
          <div
            className="w-32 h-32 rounded-full"
            style={{
              background: 'var(--gradient-primary)',
              animation: 'splash-ripple 0.6s ease-out forwards',
              opacity: 0.8
            }}
          />
        </div>
      )}

      <div className={`w-full max-w-2xl space-y-6 transition-all duration-1000 ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${isNavigating ? 'opacity-0 scale-95' : ''}`}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <Heart className="text-white" size={32} />
            </div>
            <span className="text-2xl lg:text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>CarePlus</span>
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-6 px-4">
          <p className="text-sm lg:text-base" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
            {language === 'ko'
              ? '케어플러스는 신장병 환자, 간병인(일반인), 연구자에게 신장병과 관련된 식이 및 영양 및 의료 복지 정보를 편리하게 찾도록 돕는 특화 AI 서비스입니다.'
              : 'CarePlus is a specialized AI service that helps kidney disease patients, caregivers, and researchers easily find dietary, nutritional, and medical welfare information related to kidney disease.'}
          </p>
        </div>

        {/* Quick Action Buttons - Subtle styling */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button
            onClick={() => handleCategoryClick(ROUTES.CHAT_MEDICAL_WELFARE)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-md active:scale-95 active:shadow-inner whitespace-nowrap"
            style={{
              borderColor: '#E5E7EB',
              background: 'var(--color-background)',
              color: '#4B5563',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.background = 'var(--color-input-bar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.background = 'var(--color-background)';
            }}
          >
            <Stethoscope size={16} color="#4B5563" />
            {language === 'ko' ? '의료복지' : 'Medical Welfare'}
          </button>
          <button
            onClick={() => handleCategoryClick(ROUTES.CHAT_NUTRITION)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-md active:scale-95 active:shadow-inner whitespace-nowrap"
            style={{
              borderColor: '#E5E7EB',
              background: 'var(--color-background)',
              color: '#4B5563',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.background = 'var(--color-input-bar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.background = 'var(--color-background)';
            }}
          >
            <Utensils size={16} color="#4B5563" />
            {language === 'ko' ? '식이영양' : 'Diet & Nutrition'}
          </button>
          <button
            onClick={() => handleCategoryClick(ROUTES.CHAT_RESEARCH)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-md active:scale-95 active:shadow-inner whitespace-nowrap"
            style={{
              borderColor: '#E5E7EB',
              background: 'var(--color-background)',
              color: '#4B5563',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.background = 'var(--color-input-bar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.background = 'var(--color-background)';
            }}
          >
            <FileText size={16} color="#4B5563" />
            {language === 'ko' ? '연구논문' : 'Research Papers'}
          </button>
        </div>

        {/* Input Section */}
        <form onSubmit={handleSubmit} className="relative mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'ko' ? '궁금한 점을 물어보세요' : 'Ask me anything'}
              className="w-full px-5 py-3 pr-12 rounded-xl border transition-all duration-200"
              style={{
                borderColor: '#E5E7EB',
                background: 'var(--color-background)',
                outline: 'none',
                color: 'var(--color-text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.background = 'var(--color-input-bar)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = 'var(--color-background)';
              }}
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2 transition-all duration-200"
              style={{
                background: message.trim()
                  ? 'var(--gradient-primary)'
                  : '#E5E7EB',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={18} color="white" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-6">
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            © 2025 CarePlus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainPageFull;
