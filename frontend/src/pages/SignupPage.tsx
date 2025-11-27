import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Logo } from '../components/Logo';

type Step = 0 | 1 | 2 | 3;

interface TermsData {
  service_terms: { title: string; required: boolean; content: string };
  privacy_required: { title: string; required: boolean; content: string };
  privacy_optional: { title: string; required: boolean; content: string };
  marketing: { title: string; required: boolean; content: string };
}

export function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(0);

  // Step 0: Terms Agreement
  const [termsData, setTermsData] = useState<TermsData | null>(null);
  const [agreements, setAgreements] = useState({
    all: false,
    service: false,
    privacyRequired: false,
    privacyOptional: false,
    marketing: false
  });
  const [expandedTerms, setExpandedTerms] = useState<{[key: string]: boolean}>({});

  // Step 1: Account Info
  const [accountInfo, setAccountInfo] = useState({
    id: '',
    password: '',
    passwordConfirm: '',
    verified: false,
    userType: '신장병 환우',
    emailChecked: false
  });

  // Step 2: Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    nickname: '',
    gender: '',
    userType: '',
    birthDate: '',
    height: '',
    weight: '',
    nicknameChecked: false
  });

  // Step 3: Disease Info
  const [diseaseInfo, setDiseaseInfo] = useState<string>('');

  const diseaseOptions = [
    { label: '만성신장병 1단계', value: 'CKD1' },
    { label: '만성신장병 2단계', value: 'CKD2' },
    { label: '만성신장병 3단계', value: 'CKD3' },
    { label: '만성신장병 4단계', value: 'CKD4' },
    { label: '만성신장병 5단계', value: 'CKD5' },
    { label: '혈액투석환자', value: 'ESRD_HD' },
    { label: '복막투석환자', value: 'ESRD_PD' },
    { label: '이식환자', value: 'CKD_T' },
    { label: '급성신손상', value: 'AKI' },
    { label: '해당없음', value: 'None' }
  ];

  // Fetch terms data
  useEffect(() => {
    fetch('/api/terms/all')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setTermsData(data.terms);
        }
      })
      .catch(err => console.error('Failed to fetch terms:', err));
  }, []);

  // Handle all agreement toggle
  const handleAllAgreement = (checked: boolean) => {
    setAgreements({
      all: checked,
      service: checked,
      privacyRequired: checked,
      privacyOptional: checked,
      marketing: checked
    });
  };

  // Handle individual agreement toggle
  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    const newAgreements = { ...agreements, [key]: checked };

    // Check if all are checked
    const allChecked = newAgreements.service && newAgreements.privacyRequired &&
                       newAgreements.privacyOptional && newAgreements.marketing;
    newAgreements.all = allChecked;

    setAgreements(newAgreements);
  };

  // Toggle term content visibility
  const toggleTermContent = (key: string) => {
    setExpandedTerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDiseaseToggle = (value: string) => {
    setDiseaseInfo(value);
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock signup - navigate to login
    localStorage.setItem('isLoggedIn', 'false');
    alert('회원가입이 완료되었습니다!');
    navigate('/login');
  };

  const canProceedFromTerms = agreements.service && agreements.privacyRequired;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{ background: 'var(--color-bg-white)' }}
    >
      {/* Back Button */}
      <button
        onClick={() => currentStep === 0 ? navigate('/login') : handlePrevStep()}
        className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="뒤로 가기"
      >
        <ChevronLeft className="text-[#1F2937]" size={24} strokeWidth={2} />
      </button>

      <div className="w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === currentStep ? 'w-12' : 'w-2'
              }`}
              style={{
                background: step <= currentStep
                  ? 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)'
                  : '#E5E7EB'
              }}
            />
          ))}
        </div>

        {/* Step 0: Terms Agreement */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <h1 className="text-center" style={{ color: '#1F2937', fontSize: '24px', fontWeight: 'bold' }}>
              약관 동의
            </h1>

            {termsData ? (
              <div className="space-y-4">
                {/* All Agreement Checkbox */}
                <div
                  className="p-4 rounded-lg"
                  style={{ border: '2px solid #00C9B7', backgroundColor: '#F0FDFA' }}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={agreements.all}
                        onChange={(e) => handleAllAgreement(e.target.checked)}
                        className="w-5 h-5 rounded appearance-none border-2 cursor-pointer transition-all duration-200"
                        style={{
                          borderColor: agreements.all ? 'rgb(0, 201, 183)' : '#D1D5DB',
                          backgroundColor: agreements.all ? 'rgb(0, 201, 183)' : 'white'
                        }}
                      />
                      {agreements.all && (
                        <Check
                          size={14}
                          color="#FFFFFF"
                          strokeWidth={3}
                          className="absolute pointer-events-none"
                        />
                      )}
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
                      서비스 전체 약관에 동의합니다.
                    </span>
                  </label>
                </div>

                {/* Individual Terms */}
                <div className="space-y-3">
                  {/* Service Terms */}
                  <TermItem
                    title={`(필수) ${termsData.service_terms.title}`}
                    content={termsData.service_terms.content}
                    checked={agreements.service}
                    onChange={(checked) => handleAgreementChange('service', checked)}
                    expanded={expandedTerms.service}
                    onToggle={() => toggleTermContent('service')}
                  />

                  {/* Privacy Required */}
                  <TermItem
                    title={`(필수) ${termsData.privacy_required.title}`}
                    content={termsData.privacy_required.content}
                    checked={agreements.privacyRequired}
                    onChange={(checked) => handleAgreementChange('privacyRequired', checked)}
                    expanded={expandedTerms.privacyRequired}
                    onToggle={() => toggleTermContent('privacyRequired')}
                  />

                  {/* Privacy Optional */}
                  <TermItem
                    title={`(선택) ${termsData.privacy_optional.title}`}
                    content={termsData.privacy_optional.content}
                    checked={agreements.privacyOptional}
                    onChange={(checked) => handleAgreementChange('privacyOptional', checked)}
                    expanded={expandedTerms.privacyOptional}
                    onToggle={() => toggleTermContent('privacyOptional')}
                  />

                  {/* Marketing */}
                  <TermItem
                    title={`(선택) ${termsData.marketing.title}`}
                    content={termsData.marketing.content}
                    checked={agreements.marketing}
                    onChange={(checked) => handleAgreementChange('marketing', checked)}
                    expanded={expandedTerms.marketing}
                    onToggle={() => toggleTermContent('marketing')}
                  />
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNextStep}
                  disabled={!canProceedFromTerms}
                  className="w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: canProceedFromTerms
                      ? 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)'
                      : '#E5E7EB',
                    color: 'white',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: canProceedFromTerms ? 'pointer' : 'not-allowed'
                  }}
                >
                  다음
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p style={{ color: '#9CA3AF' }}>약관을 불러오는 중...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Account Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h1 className="text-center" style={{ color: '#1F2937', fontSize: '24px' }}>
              계정 정보 입력
            </h1>

            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                  아이디 (이메일)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={accountInfo.id}
                    onChange={(e) => setAccountInfo({ ...accountInfo, id: e.target.value })}
                    placeholder="이메일을 입력하세요"
                    className="flex-1 px-4 py-3 rounded-lg border"
                    style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: 이메일 중복 체크 API 호출
                      setAccountInfo({ ...accountInfo, emailChecked: true });
                      alert('사용 가능한 이메일입니다.');
                    }}
                    className="px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-200"
                    style={{
                      background: accountInfo.emailChecked ? 'rgb(159, 122, 234)' : '#F3F4F6',
                      color: accountInfo.emailChecked ? 'white' : '#374151',
                      border: accountInfo.emailChecked ? '1px solid rgb(159, 122, 234)' : '1px solid #E5E7EB',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {accountInfo.emailChecked ? '확인완료' : '중복체크'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  value={accountInfo.password}
                  onChange={(e) => setAccountInfo({ ...accountInfo, password: e.target.value })}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                  required
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={accountInfo.passwordConfirm}
                  onChange={(e) => setAccountInfo({ ...accountInfo, passwordConfirm: e.target.value })}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                다음
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h1 className="text-center" style={{ color: '#1F2937', fontSize: '24px' }}>
              개인 정보 입력
            </h1>

            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              {/* User Type Selection */}
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                  사용자 유형 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { label: '일반인', value: 'general' },
                    { label: '신장병 환우', value: 'patient' },
                    { label: '연구자', value: 'researcher' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setPersonalInfo({ ...personalInfo, userType: type.value })}
                      className="flex-1 py-3 rounded-lg transition-all duration-200"
                      style={{
                        background: personalInfo.userType === type.value ? 'rgb(0, 201, 183)' : '#F3F4F6',
                        color: personalInfo.userType === type.value ? 'white' : '#6B7280',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                  닉네임 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={personalInfo.nickname}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, nickname: e.target.value })}
                    placeholder="닉네임을 입력하세요"
                    className="flex-1 px-4 py-3 rounded-lg border"
                    style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: 닉네임 중복 체크 API 호출
                      setPersonalInfo({ ...personalInfo, nicknameChecked: true });
                      alert('사용 가능한 닉네임입니다.');
                    }}
                    className="px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-200"
                    style={{
                      background: personalInfo.nicknameChecked ? 'rgb(159, 122, 234)' : '#F3F4F6',
                      color: personalInfo.nicknameChecked ? 'white' : '#374151',
                      border: personalInfo.nicknameChecked ? '1px solid rgb(159, 122, 234)' : '1px solid #E5E7EB',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {personalInfo.nicknameChecked ? '확인완료' : '중복체크'}
                  </button>
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                  성별 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="flex gap-2">
                  {['남성', '여성', '기타'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setPersonalInfo({ ...personalInfo, gender: gender })}
                      className="flex-1 py-3 rounded-lg transition-all duration-200"
                      style={{
                        background: personalInfo.gender === gender ? 'rgb(0, 201, 183)' : '#F3F4F6',
                        color: personalInfo.gender === gender ? 'white' : '#6B7280',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                  생년월일 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={personalInfo.birthDate}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                    키 (cm)
                  </label>
                  <input
                    type="number"
                    value={personalInfo.height}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, height: e.target.value })}
                    placeholder="170"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
                    체중 (kg)
                  </label>
                  <input
                    type="number"
                    value={personalInfo.weight}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, weight: e.target.value })}
                    placeholder="70"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                다음
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Disease Info */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h1 className="text-center" style={{ color: '#1F2937', fontSize: '24px' }}>
              질환 정보 입력
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-4" style={{ fontSize: '14px', color: '#374151' }}>
                  해당하는 질환을 선택해주세요
                </label>
                <div className="space-y-2">
                  {diseaseOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200"
                      style={{
                        borderColor: diseaseInfo === option.value ? '#00C9B7' : '#E5E7EB',
                        backgroundColor: diseaseInfo === option.value ? '#F0FDFA' : 'white'
                      }}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="disease"
                          checked={diseaseInfo === option.value}
                          onChange={() => handleDiseaseToggle(option.value)}
                          className="w-5 h-5 appearance-none rounded-full border-2 cursor-pointer transition-all duration-200"
                          style={{
                            borderColor: diseaseInfo === option.value ? '#00C9B7' : '#D1D5DB',
                            backgroundColor: diseaseInfo === option.value ? '#00C9B7' : 'white'
                          }}
                        />
                        {diseaseInfo === option.value && (
                          <Check
                            size={14}
                            color="#FFFFFF"
                            strokeWidth={3}
                            className="absolute pointer-events-none"
                          />
                        )}
                      </div>
                      <span style={{ fontSize: '14px', color: '#1F2937' }}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                가입 완료
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Term Item Component
function TermItem({
  title,
  content,
  checked,
  onChange,
  expanded,
  onToggle
}: {
  title: string;
  content: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-5 h-5 rounded appearance-none border-2 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: checked ? 'rgb(0, 201, 183)' : '#D1D5DB',
                  backgroundColor: checked ? 'rgb(0, 201, 183)' : 'white'
                }}
              />
              {checked && (
                <Check
                  size={14}
                  color="#FFFFFF"
                  strokeWidth={3}
                  className="absolute pointer-events-none"
                />
              )}
            </div>
            <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
              {title}
            </span>
          </label>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            type="button"
          >
            {expanded ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </button>
        </div>

        {expanded && (
          <div
            className="mt-3 p-4 rounded-lg max-h-60 overflow-y-auto"
            style={{
              backgroundColor: '#F9FAFB',
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#4B5563',
              whiteSpace: 'pre-wrap'
            }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
