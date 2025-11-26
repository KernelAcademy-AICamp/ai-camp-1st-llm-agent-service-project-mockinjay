import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '../components/Logo';

type Step = 1 | 2 | 3;

export function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Step 1: Account Info
  const [accountInfo, setAccountInfo] = useState({
    id: '',
    password: '',
    passwordConfirm: '',
    verified: false
  });
  
  // Step 2: Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    nickname: '',
    gender: '',
    race: '',
    birthDate: '',
    height: '',
    weight: ''
  });
  
  // Step 3: Disease Info
  const [diseaseInfo, setDiseaseInfo] = useState<string>('');
  
  const diseaseOptions = [
    '만성신장병 1기',
    '만성신장병 2기',
    '만성신장병 3기',
    '만성신장병 4기',
    '만성신장병 5기',
    '혈액투석',
    '복막투석',
    '신장 이식 후 관리',
    '해당 사항 없음'
  ];

  const handleDiseaseToggle = (option: string) => {
    setDiseaseInfo(option);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!accountInfo.id || !accountInfo.password || !accountInfo.passwordConfirm) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      if (accountInfo.password !== accountInfo.passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (!accountInfo.verified) {
        alert('인증을 완료해주세요.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!personalInfo.nickname || !personalInfo.gender || !personalInfo.race || 
          !personalInfo.birthDate || !personalInfo.height || !personalInfo.weight) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (diseaseInfo === '') {
        alert('질환 정보를 선택해주세요.');
        return;
      }
      // Handle signup completion
      alert('회원가입이 완료되었습니다!');
      navigate('/dashboard');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-white)' }}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}>
        <button
          onClick={() => currentStep === 1 ? navigate('/') : handlePrevStep()}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={24} />
        </button>
        
        <Logo size="sm" />
        
        <div style={{ width: '24px' }} />
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: currentStep >= step 
                      ? 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)' 
                      : '#E5E7EB',
                    color: 'white'
                  }}
                >
                  {currentStep > step ? <Check size={20} /> : step}
                </div>
                <span className="text-xs mt-2" style={{ color: currentStep >= step ? 'var(--color-primary)' : '#9CA3AF' }}>
                  {step === 1 ? '계정정보' : step === 2 ? '개인정보' : '질환정보'}
                </span>
              </div>
              {step < 3 && (
                <div 
                  className="flex-1 h-1 mx-2 rounded transition-all"
                  style={{ background: currentStep > step ? 'var(--color-primary)' : '#E5E7EB' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2" style={{ color: 'var(--color-text-primary)' }}>계정 정보를 입력해주세요</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  안전한 계정을 위해 정확한 정보를 입력해주세요.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  아이디
                </label>
                <input
                  type="text"
                  value={accountInfo.id}
                  onChange={(e) => setAccountInfo({ ...accountInfo, id: e.target.value })}
                  placeholder="아이디를 입력하세요"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  value={accountInfo.password}
                  onChange={(e) => setAccountInfo({ ...accountInfo, password: e.target.value })}
                  placeholder="비밀번호를 입력하세요"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={accountInfo.passwordConfirm}
                  onChange={(e) => setAccountInfo({ ...accountInfo, passwordConfirm: e.target.value })}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  인증
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="인증번호를 입력하세요"
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => setAccountInfo({ ...accountInfo, verified: true })}
                    className="px-4 py-2 rounded-lg whitespace-nowrap"
                    style={{
                      background: accountInfo.verified ? '#10B981' : 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    {accountInfo.verified ? '인증완료' : '인증하기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2" style={{ color: 'var(--color-text-primary)' }}>개인 정보를 입력해주세요</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  맞춤형 케어 서비스를 위해 필요합니다.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  닉네임
                </label>
                <input
                  type="text"
                  value={personalInfo.nickname}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, nickname: e.target.value })}
                  placeholder="닉네임을 입력하세요"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  성별
                </label>
                <div className="flex gap-2">
                  {['남성', '여성', '기타'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setPersonalInfo({ ...personalInfo, gender: option })}
                      className="flex-1 py-2 rounded-lg transition-all"
                      style={{
                        background: personalInfo.gender === option ? 'var(--color-primary)' : 'var(--color-bg-input)',
                        color: personalInfo.gender === option ? 'white' : 'var(--color-text-secondary)'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  인종
                </label>
                <select
                  value={personalInfo.race}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, race: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">선택하세요</option>
                  <option value="아시아">아시아</option>
                  <option value="백인">백인</option>
                  <option value="흑인">흑인</option>
                  <option value="히스패닉">히스패닉</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  생년월일
                </label>
                <input
                  type="date"
                  value={personalInfo.birthDate}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    키 (cm)
                  </label>
                  <input
                    type="number"
                    value={personalInfo.height}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, height: e.target.value })}
                    placeholder="170"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    체중 (kg)
                  </label>
                  <input
                    type="number"
                    value={personalInfo.weight}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, weight: e.target.value })}
                    placeholder="70"
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  병원에서 만성신장병 진단을 받으셨나요?
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  해당하는 항목을 선택해주세요.
                </p>
              </div>

              <div className="space-y-3">
                {diseaseOptions.map((option) => {
                  const isSelected = diseaseInfo === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleDiseaseToggle(option)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl transition-all"
                      style={{
                        background: isSelected ? '#E6F9F7' : 'var(--color-bg-input)',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}`
                      }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: isSelected ? 'var(--color-primary)' : '#E5E7EB'
                        }}
                      >
                        {isSelected && <Check size={16} color="white" />}
                      </div>
                      <span 
                        className="flex-1 text-left"
                        style={{ 
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                          fontWeight: isSelected ? '600' : '400'
                        }}
                      >
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleNextStep}
            className="w-full mt-8 py-4 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            style={{
              background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)'
            }}
          >
            {currentStep === 3 ? '회원가입 완료' : '다음'}
          </button>

          {currentStep === 1 && (
            <p className="text-center mt-4" style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => navigate('/login')}
                className="underline"
                style={{ color: 'var(--color-primary)' }}
              >
                로그인
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}