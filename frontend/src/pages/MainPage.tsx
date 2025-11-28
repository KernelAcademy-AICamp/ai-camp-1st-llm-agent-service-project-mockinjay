import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Send, Stethoscope, Utensils, FileText } from 'lucide-react';

export function MainPage() {
  const [message, setMessage] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      navigate('/chat', { state: { initialMessage: message } });
    }
  };
  
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--color-bg-white)' }}
    >
      <div className={`w-full max-w-2xl space-y-6 transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        
        {/* Description */}
        <div className="text-center mb-6">
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
            케어플러스는 신장병 환우, 간병인, 연구자분들을 위해 만들어진 따뜻한 AI 파트너입니다. 의료·복지, 식이·영양, 연구 정보를 편하게 찾을 수 있도록 정성껏 도와드려요.
          </p>
        </div>
        
        {/* Quick Action Buttons - Subtle styling */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button 
            onClick={() => navigate('/chat', { state: { tab: 'medical' } })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm whitespace-nowrap"
            style={{ 
              borderColor: '#E5E7EB',
              background: 'var(--color-bg-white)',
              color: '#4B5563',
              fontSize: '14px'
            }}
          >
            <Stethoscope size={16} color="#4B5563" />
            의료복지
          </button>
          <button 
            onClick={() => navigate('/chat', { state: { tab: 'nutrition' } })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm whitespace-nowrap"
            style={{ 
              borderColor: '#E5E7EB',
              background: 'var(--color-bg-white)',
              color: '#4B5563',
              fontSize: '14px'
            }}
          >
            <Utensils size={16} color="#4B5563" />
            식이영양
          </button>
          <button 
            onClick={() => navigate('/chat', { state: { tab: 'research' } })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm whitespace-nowrap"
            style={{ 
              borderColor: '#E5E7EB',
              background: 'var(--color-bg-white)',
              color: '#4B5563',
              fontSize: '14px'
            }}
          >
            <FileText size={16} color="#4B5563" />
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
              className="w-full px-5 py-3 pr-12 rounded-xl border transition-all duration-200"
              style={{
                borderColor: '#E5E7EB',
                background: 'var(--color-bg-white)',
                outline: 'none',
                color: 'var(--color-text-primary)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB';
              }}
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2 transition-all duration-200"
              style={{
                background: message.trim() 
                  ? 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)' 
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
}