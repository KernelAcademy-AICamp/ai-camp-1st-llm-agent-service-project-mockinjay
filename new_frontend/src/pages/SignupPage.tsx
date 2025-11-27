import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { Mail, Lock, User, ArrowRight, Users, Stethoscope, FlaskConical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile: 'patient' as 'general' | 'patient' | 'researcher',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      // Validate step 1
      if (!formData.name || !formData.email) {
        toast.error('이름과 이메일을 입력해주세요.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2
      if (!formData.password || !formData.confirmPassword) {
        toast.error('비밀번호를 입력해주세요.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('비밀번호가 일치하지 않습니다.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signup({
        username: formData.email,
        email: formData.email,
        password: formData.password,
        fullName: formData.name,
        profile: formData.profile,
      });

      toast.success('회원가입이 완료되었습니다!');
      navigate(ROUTES.MAIN);
    } catch (error: any) {
      toast.error(error.message || '회원가입에 실패했습니다.');
    }
  };

  const handleProfileSelect = (profile: 'general' | 'patient' | 'researcher') => {
    setFormData({ ...formData, profile });
  };

  const profileOptions = [
    {
      id: 'patient' as const,
      name: '환자(신장병 환우)',
      description: '신장 질환을 앓고 있는 환자',
      icon: Stethoscope,
      color: 'from-rose-400 to-pink-500',
    },
    {
      id: 'general' as const,
      name: '일반인(간병인)',
      description: '환자를 돌보는 간병인 또는 가족',
      icon: Users,
      color: 'from-blue-400 to-cyan-500',
    },
    {
      id: 'researcher' as const,
      name: '연구원',
      description: '의료/건강 분야 연구자',
      icon: FlaskConical,
      color: 'from-purple-400 to-indigo-500',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">
            CarePlus와 함께 건강한 삶을 시작하세요
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 w-16 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'bg-gradient-to-r from-[#00C8B4] to-[#9F7AEA]'
                  : step < currentStep
                  ? 'bg-[#00C8B4]'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Account Info */}
        {currentStep === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleNext}>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute top-3.5 left-3 text-gray-400" size={20} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#00C8B4] focus:border-[#00C8B4] sm:text-sm"
                  placeholder="이름"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <Mail className="absolute top-3.5 left-3 text-gray-400" size={20} />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-xl relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#00C8B4] focus:border-[#00C8B4] sm:text-sm"
                  placeholder="이메일"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white transition-all shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)' }}
              >
                다음
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Password */}
        {currentStep === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleNext}>
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute top-3.5 left-3 text-gray-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#00C8B4] focus:border-[#00C8B4] sm:text-sm"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <Lock className="absolute top-3.5 left-3 text-gray-400" size={20} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#00C8B4] focus:border-[#00C8B4] sm:text-sm"
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white transition-all shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)' }}
              >
                다음
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Profile Selection */}
        {currentStep === 3 && (
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">프로필을 선택해주세요</h3>
              <p className="text-sm text-gray-500 mt-1">맞춤 정보를 제공해드립니다</p>
            </div>

            <div className="space-y-3">
              {profileOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.profile === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleProfileSelect(option.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-[#00C8B4] bg-[#F2FFFD] shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${option.color}`}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{option.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#00C8B4] flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white transition-all shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)' }}
              >
                회원가입 완료
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link to={ROUTES.LOGIN} className="font-medium text-[#00C8B4] hover:text-[#00B3A3]">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
