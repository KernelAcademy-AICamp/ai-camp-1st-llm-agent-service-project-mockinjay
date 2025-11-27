import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ROUTES } from '../types/careguide-ia';
import { UserPlus, User, Stethoscope, FlaskConical } from 'lucide-react';

const SignupPageFull: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { language } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    profile: '' as 'general' | 'patient' | 'researcher' | '',
  });

  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password) {
        setError(language === 'ko' ? '모든 필드를 입력해주세요' : 'Please fill all fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(language === 'ko' ? '비밀번호가 일치하지 않습니다' : 'Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError(language === 'ko' ? '비밀번호는 최소 6자 이상이어야 합니다' : 'Password must be at least 6 characters');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.fullName) {
        setError(language === 'ko' ? '이름을 입력해주세요' : 'Please enter your name');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.profile) {
      setError(language === 'ko' ? '프로필을 선택해주세요' : 'Please select a profile');
      return;
    }

    setLoading(true);
    try {
      await signup(formData as any);
      navigate(ROUTES.MAIN);
    } catch (err: any) {
      setError(err.message || (language === 'ko' ? '회원가입에 실패했습니다' : 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  const profileOptions = [
    {
      value: 'general' as const,
      icon: User,
      title: language === 'ko' ? '일반인' : 'General',
      description: language === 'ko' ? '콩팥병 관련 정보를 찾는 일반인' : 'General user seeking CKD information',
      color: 'blue',
    },
    {
      value: 'patient' as const,
      icon: Stethoscope,
      title: language === 'ko' ? '환자' : 'Patient',
      description: language === 'ko' ? '만성콩팥병 진단을 받은 환자' : 'CKD patient',
      color: 'green',
    },
    {
      value: 'researcher' as const,
      icon: FlaskConical,
      title: language === 'ko' ? '연구자' : 'Researcher',
      description: language === 'ko' ? '의료진 또는 연구자' : 'Medical professional or researcher',
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'ko' ? '회원가입' : 'Sign Up'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ko' ? 'CareGuide에 오신 것을 환영합니다' : 'Welcome to CareGuide'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: 계정 정보 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ko' ? '계정 정보' : 'Account Information'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '아이디' : 'Username'}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '이메일' : 'Email'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '비밀번호' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '비밀번호 확인' : 'Confirm Password'}
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Step 2: 개인 정보 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ko' ? '개인 정보' : 'Personal Information'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'ko' ? '이름' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:text-white"
                  placeholder={language === 'ko' ? '홍길동' : 'John Doe'}
                />
              </div>
            </div>
          )}

          {/* Step 3: 프로필 선택 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ko' ? '프로필 선택' : 'Select Profile'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {language === 'ko'
                  ? '맞춤 정보 제공을 위해 해당하는 유형을 선택해주세요'
                  : 'Select your profile type for personalized information'}
              </p>

              <div className="space-y-3">
                {profileOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, profile: option.value })}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        formData.profile === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={formData.profile === option.value ? `text-${option.color}-600` : 'text-gray-400'}
                          size={24}
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{option.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-ghost"
              >
                {language === 'ko' ? '이전' : 'Back'}
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="btn-primary-action flex-1"
              >
                {language === 'ko' ? '다음' : 'Next'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary-action flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {language === 'ko' ? '가입 중...' : 'Signing up...'}
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    {language === 'ko' ? '가입 완료' : 'Complete Signup'}
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {language === 'ko' ? '이미 계정이 있으신가요?' : 'Already have an account?'}{' '}
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {language === 'ko' ? '로그인' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPageFull;
