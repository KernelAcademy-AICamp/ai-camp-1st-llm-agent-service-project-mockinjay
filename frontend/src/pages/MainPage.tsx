import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Camera, Stethoscope, Utensils, FileText } from 'lucide-react';
import biLogoGif from '../assets/BI_logo_CarePlus_v1.gif';

export function MainPage() {
  const [message, setMessage] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [displayedLogoText, setDisplayedLogoText] = useState('');
  const navigate = useNavigate();

  const logoText = 'CarePlus';

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  // Typewriter effect for logo text only
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 150;
    let timeoutId: number;

    const typeNextChar = () => {
      if (currentIndex < logoText.length) {
        setDisplayedLogoText(logoText.substring(0, currentIndex + 1));
        currentIndex++;
        timeoutId = window.setTimeout(typeNextChar, typingSpeed);
      }
    };

    const startDelay = window.setTimeout(() => {
      typeNextChar();
    }, 300);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(timeoutId);
    };
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      navigate('/chat', { state: { initialMessage: message } });
    }
  };
  
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 40%, rgb(242, 255, 253) 100%)'
      }}
    >
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-2xl space-y-6 transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          {/* Logo with Typewriter Effect */}
          <div className="flex justify-center items-center mb-8" style={{ marginTop: '-100px' }}>
            <img
              src={biLogoGif}
              alt="CarePlus Logo"
              style={{
                width: 57.6,
                height: 57.6
              }}
            />
            <span
              className="text-3xl font-semibold"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'linear-gradient(135deg, rgb(0, 200, 180) 0%, rgb(110, 100, 210) 55%, rgb(159, 122, 234) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {displayedLogoText}
              <span className="animate-pulse">|</span>
            </span>
          </div>

          {/* Description (no typewriter effect) */}
          <div className="text-center mb-6">
            <p style={{
              color: 'var(--color-text-secondary)',
              lineHeight: '1.8'
            }}>
              케어플러스는 신장병 환우, 간병인, 연구자분들을 위해 만들어진 따뜻한 AI 파트너입니다. 의료·복지, 식이·영양, 연구 정보를 편하게 찾을 수 있도록 정성껏 도와드려요.
            </p>
          </div>
        
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <button
              onClick={() => navigate('/chat', { state: { tab: 'medical' } })}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 whitespace-nowrap"
              style={{
                borderColor: '#E5E7EB',
                background: 'var(--color-bg-white)',
                color: '#4B5563',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(white, white) padding-box, linear-gradient(to right, #00C9B7, #9F7AEA) border-box';
                e.currentTarget.style.border = '2px solid transparent';
                e.currentTarget.style.color = '#00C9B7';
                e.currentTarget.style.fontWeight = 'bold';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 201, 183, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-white)';
                e.currentTarget.style.border = '1px solid #E5E7EB';
                e.currentTarget.style.color = '#4B5563';
                e.currentTarget.style.fontWeight = 'normal';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Stethoscope size={16} className="group-hover:stroke-[#00C9B7] transition-all" color="#4B5563" />
              의료복지
            </button>
            <button
              onClick={() => navigate('/chat', { state: { tab: 'nutrition' } })}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 whitespace-nowrap"
              style={{
                borderColor: '#E5E7EB',
                background: 'var(--color-bg-white)',
                color: '#4B5563',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(white, white) padding-box, linear-gradient(to right, #00C9B7, #9F7AEA) border-box';
                e.currentTarget.style.border = '2px solid transparent';
                e.currentTarget.style.color = '#00C9B7';
                e.currentTarget.style.fontWeight = 'bold';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 201, 183, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-white)';
                e.currentTarget.style.border = '1px solid #E5E7EB';
                e.currentTarget.style.color = '#4B5563';
                e.currentTarget.style.fontWeight = 'normal';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Utensils size={16} className="group-hover:stroke-[#00C9B7] transition-all" color="#4B5563" />
              식이영양
            </button>
            <button
              onClick={() => navigate('/chat', { state: { tab: 'research' } })}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 whitespace-nowrap"
              style={{
                borderColor: '#E5E7EB',
                background: 'var(--color-bg-white)',
                color: '#4B5563',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(white, white) padding-box, linear-gradient(to right, #00C9B7, #9F7AEA) border-box';
                e.currentTarget.style.border = '2px solid transparent';
                e.currentTarget.style.color = '#00C9B7';
                e.currentTarget.style.fontWeight = 'bold';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 201, 183, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-white)';
                e.currentTarget.style.border = '1px solid #E5E7EB';
                e.currentTarget.style.color = '#4B5563';
                e.currentTarget.style.fontWeight = 'normal';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <FileText size={16} className="group-hover:stroke-[#00C9B7] transition-all" color="#4B5563" />
              연구논문
            </button>
          </div>
        
          {/* Input Section */}
          <form onSubmit={handleSubmit} className="relative mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="궁금한 점을 물어보세요"
                className="w-full px-5 py-3 pr-14 rounded-xl border transition-all duration-200"
                style={{
                  borderColor: '#E5E7EB',
                  background: 'var(--color-bg-white)',
                  outline: 'none',
                  color: 'var(--color-text-primary)'
                }}
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="absolute right-2 top-1/2 rounded-full flex items-center justify-center"
                style={{
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  background: message.trim()
                    ? 'linear-gradient(135deg, rgb(0, 200, 180) 0%, rgb(159, 122, 234) 100%)'
                    : 'rgb(243, 244, 246)',
                  cursor: message.trim() ? 'pointer' : 'not-allowed',
                  opacity: '1',
                  transform: 'translateY(-50%)',
                  boxShadow: message.trim()
                    ? '0 8px 20px rgba(159, 122, 234, 0.35)'
                    : 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <Send
                  size={19}
                  color={message.trim() ? 'white' : '#9CA3AF'}
                  strokeWidth={2.3}
                  style={{
                    transform: message.trim() ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
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
    </div>
  );
}