import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage(props: { onLogin?: () => void }) {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      if (props.onLogin) props.onLogin();
      navigate('/');
    } catch (loginError) {
      console.error('로그인에 실패했습니다.', loginError);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{ background: 'var(--color-bg-white)' }}
    >
      {/* Back Button - Top Left */}
      <button
        onClick={() => navigate('/chat')}
        className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="메인으로 돌아가기"
      >
        <ChevronLeft className="text-[#1F2937]" size={24} strokeWidth={2} />
      </button>

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
              disabled={isLoading}
              style={{
                background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            {error && (
              <p className="text-center text-sm" style={{ color: '#EF4444' }}>
                {error}
              </p>
            )}
          </form>

          {/* 하단 링크 영역 - 아이디/비밀번호 찾기 & 회원가입 */}
          <div className="space-y-3 pt-2">
            {/* 아이디/비밀번호 찾기 */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  // TODO: 아이디/비밀번호 찾기 페이지로 이동
                  alert('아이디/비밀번호 찾기 기능은 준비 중입니다.');
                }}
                style={{ fontSize: '14px', color: '#6B7280' }}
                className="hover:underline transition-colors"
              >
                아이디/비밀번호 찾기
              </button>
            </div>

            {/* 구분선 */}
            <div className="flex items-center gap-3 px-8">
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }}></div>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>또는</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }}></div>
            </div>

            {/* 회원가입 */}
            <div className="text-center">
              <button
                onClick={() => navigate('/signup')}
                style={{ fontSize: '14px', color: '#6B7280' }}
                className="transition-colors"
              >
                계정이 없으신가요? <span style={{ color: '#00C8B4', fontWeight: '500' }}>회원가입</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
