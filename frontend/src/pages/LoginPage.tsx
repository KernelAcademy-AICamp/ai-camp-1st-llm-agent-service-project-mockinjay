import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function LoginPage(props: { onLogin?: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - navigate to chat
    localStorage.setItem('isLoggedIn', 'true');
    if (props.onLogin) props.onLogin();
    navigate('/chat');
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--color-bg-white)' }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <h1 className="text-center" style={{ color: '#1F2937', fontSize: '24px' }}>
            로그인
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block mb-2"
                style={{ fontSize: '14px', color: '#374151' }}
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full px-4 py-3 rounded-lg border transition-all duration-200"
                style={{
                  borderColor: '#E5E7EB',
                  background: 'white',
                  outline: 'none',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block mb-2"
                style={{ fontSize: '14px', color: '#374151' }}
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 rounded-lg border transition-all duration-200"
                style={{
                  borderColor: '#E5E7EB',
                  background: 'white',
                  outline: 'none',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg transition-all duration-200"
              style={{
                background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              로그인
            </button>
          </form>

          <div className="text-center space-y-2">
            <button
              onClick={() => navigate('/signup')}
              style={{ fontSize: '14px', color: '#6B7280' }}
            >
              계정이 없으신가요? <span style={{ color: '#00C8B4' }}>회원가입</span>
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              style={{ fontSize: '14px', color: '#9CA3AF' }}
            >
              ← 메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
