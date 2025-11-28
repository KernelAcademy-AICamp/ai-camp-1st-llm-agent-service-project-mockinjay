import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { ChevronLeft, Check, ChevronDown, ChevronUp, User, Mail, Lock, Calendar, Ruler, Weight, Activity, Eye, EyeOff, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { getTerms, checkEmailDuplicate, checkNicknameDuplicate, type TermsData } from '../services/api';
import { Logo } from '../components/common/Logo';

type Step = 0 | 1 | 2 | 3;

// Password strength validation
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: { met: boolean; text: string }[];
}

const getPasswordStrength = (password: string): PasswordStrength => {
  const requirements = [
    { met: password.length >= 6, text: '6자 이상' },
    { met: password.length >= 8, text: '8자 이상 (권장)' },
    { met: /[A-Z]/.test(password), text: '대문자 포함' },
    { met: /[0-9]/.test(password), text: '숫자 포함' },
    { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: '특수문자 포함' },
  ];

  const score = requirements.filter(r => r.met).length;

  if (score <= 1) return { score, label: '매우 약함', color: 'bg-red-500', requirements };
  if (score === 2) return { score, label: '약함', color: 'bg-orange-500', requirements };
  if (score === 3) return { score, label: '보통', color: 'bg-yellow-500', requirements };
  if (score === 4) return { score, label: '강함', color: 'bg-green-500', requirements };
  return { score, label: '매우 강함', color: 'bg-emerald-500', requirements };
};

// Step indicator component
interface StepIndicatorProps {
  currentStep: Step;
  steps: { label: string; description: string }[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => (
  <div className="mb-8">
    {/* Progress Bar */}
    <div className="flex justify-between mb-3">
      {steps.map((_, index) => (
        <div key={index} className="flex-1 mx-1">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              index < currentStep
                ? 'bg-primary'
                : index === currentStep
                ? 'bg-primary animate-pulse'
                : 'bg-gray-200'
            }`}
          />
        </div>
      ))}
    </div>

    {/* Step Labels */}
    <div className="flex justify-between px-1">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-center gap-1.5 transition-colors ${
            index <= currentStep ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              index < currentStep
                ? 'bg-primary text-white'
                : index === currentStep
                ? 'bg-primary/20 text-primary border-2 border-primary'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index < currentStep ? <Check size={12} /> : index + 1}
          </div>
          <span className="text-[11px] font-medium hidden sm:inline">{step.label}</span>
        </div>
      ))}
    </div>

    {/* Current Step Description */}
    <p className="text-center text-sm text-gray-500 mt-3 animate-fade-in">
      {steps[currentStep].description}
    </p>
  </div>
);

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Step configuration
  const steps = useMemo(() => [
    { label: '약관동의', description: '서비스 이용을 위한 약관에 동의해주세요' },
    { label: '계정정보', description: '로그인에 사용할 이메일과 비밀번호를 입력해주세요' },
    { label: '개인정보', description: '맞춤 서비스를 위한 기본 정보를 입력해주세요' },
    { label: '건강정보', description: '더 나은 케어를 위해 건강 상태를 알려주세요' },
  ], []);

  // Step 0: Terms Agreement State
  const [termsData, setTermsData] = useState<TermsData | null>(null);
  const [agreements, setAgreements] = useState({
    all: false,
    service: false,
    privacyRequired: false,
    privacyOptional: false,
    marketing: false,
  });
  const [expandedTerms, setExpandedTerms] = useState<{ [key: string]: boolean }>({});

  // Step 1: Account Info State
  const [accountInfo, setAccountInfo] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    emailChecked: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Real-time validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Step 2: Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    nickname: '',
    gender: '' as '' | '남성' | '여성' | '기타',
    userType: 'patient' as 'general' | 'patient' | 'researcher',
    birthDate: '',
    height: '',
    weight: '',
    nicknameChecked: false,
  });
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  // Step 3: Disease Info State
  const [diseaseInfo, setDiseaseInfo] = useState<string>('');

  // Password strength
  const passwordStrength = useMemo(
    () => getPasswordStrength(accountInfo.password),
    [accountInfo.password]
  );

  // Email validation
  const isValidEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

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
    { label: '해당없음', value: 'None' },
  ];

  useEffect(() => {
    const fetchTerms = async () => {
      const terms = await getTerms();
      if (terms) {
        setTermsData(terms);
      } else {
        setTermsData({
          service_terms: {
            title: '서비스 이용약관',
            required: true,
            content: 'CareGuide 서비스 이용약관입니다.\n\n1. 총칙\n본 약관은 CareGuide 서비스 이용에 관한 기본적인 사항을 규정합니다.\n\n2. 서비스 이용\n회원은 본 서비스를 건강 정보 조회 및 커뮤니티 활동 목적으로 이용할 수 있습니다.\n\n3. 회원의 의무\n회원은 정확한 정보를 제공하고, 타인의 권리를 침해하지 않아야 합니다.',
          },
          privacy_required: {
            title: '개인정보 수집·이용 동의 (필수)',
            required: true,
            content: '개인정보 수집·이용에 관한 안내입니다.\n\n1. 수집 항목\n- 이메일, 비밀번호, 닉네임, 성별, 생년월일\n- 건강 정보 (키, 체중, 질환 정보)\n\n2. 수집 목적\n- 회원 식별 및 서비스 제공\n- 맞춤형 건강 정보 제공\n\n3. 보유 기간\n- 회원 탈퇴 시까지',
          },
          privacy_optional: {
            title: '개인정보 수집·이용 동의 (선택)',
            required: false,
            content: '선택적 개인정보 수집·이용에 관한 안내입니다.\n\n1. 수집 항목\n- 건강 기록, 식단 정보\n\n2. 수집 목적\n- 개인화된 건강 분석 및 추천\n\n3. 보유 기간\n- 동의 철회 시까지',
          },
          marketing: {
            title: '마케팅 정보 수신 동의',
            required: false,
            content: '마케팅 정보 수신에 관한 안내입니다.\n\n1. 수신 항목\n- 새로운 기능 안내\n- 건강 관련 뉴스레터\n- 이벤트 및 프로모션 정보\n\n2. 수신 방법\n- 이메일, 앱 푸시 알림\n\n동의를 거부하셔도 서비스 이용에 제한이 없습니다.',
          },
        });
      }
    };
    fetchTerms();
  }, []);

  const handleAllAgreement = (checked: boolean) => {
    setAgreements({
      all: checked,
      service: checked,
      privacyRequired: checked,
      privacyOptional: checked,
      marketing: checked,
    });
  };

  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    const newAgreements = { ...agreements, [key]: checked };
    const allChecked =
      newAgreements.service &&
      newAgreements.privacyRequired &&
      newAgreements.privacyOptional &&
      newAgreements.marketing;
    newAgreements.all = allChecked;
    setAgreements(newAgreements);
  };

  const toggleTermContent = (key: string) => {
    setExpandedTerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canProceedFromTerms = agreements.service && agreements.privacyRequired;

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

  const handleEmailCheck = async () => {
    if (!accountInfo.email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!isValidEmail(accountInfo.email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsCheckingEmail(true);
    setEmailError(null);

    try {
      const result = await checkEmailDuplicate(accountInfo.email);
      if (result.available) {
        setAccountInfo({ ...accountInfo, emailChecked: true });
        toast.success(result.message);
      } else {
        setEmailError(result.message);
      }
    } catch {
      setEmailError('이메일 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleNicknameCheck = async () => {
    if (!personalInfo.nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    if (personalInfo.nickname.length < 2) {
      setNicknameError('닉네임은 2자 이상이어야 합니다.');
      return;
    }

    setIsCheckingNickname(true);
    setNicknameError(null);

    try {
      const result = await checkNicknameDuplicate(personalInfo.nickname);
      if (result.available) {
        setPersonalInfo({ ...personalInfo, nicknameChecked: true });
        toast.success(result.message);
      } else {
        setNicknameError(result.message);
      }
    } catch {
      setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const validateAccountInfo = (): boolean => {
    if (!accountInfo.email) {
      setEmailError('이메일을 입력해주세요.');
      return false;
    }
    if (!isValidEmail(accountInfo.email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return false;
    }
    if (!accountInfo.password) {
      setPasswordError('비밀번호를 입력해주세요.');
      return false;
    }
    if (accountInfo.password.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    if (accountInfo.password !== accountInfo.passwordConfirm) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    setEmailError(null);
    setPasswordError(null);
    return true;
  };

  const validatePersonalInfo = (): boolean => {
    if (!personalInfo.nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      return false;
    }
    if (personalInfo.nickname.length < 2) {
      setNicknameError('닉네임은 2자 이상이어야 합니다.');
      return false;
    }
    if (!personalInfo.gender) {
      toast.error('성별을 선택해주세요.');
      return false;
    }
    if (!personalInfo.birthDate) {
      toast.error('생년월일을 입력해주세요.');
      return false;
    }
    setNicknameError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signup({
        username: accountInfo.email,
        email: accountInfo.email,
        password: accountInfo.password,
        fullName: personalInfo.nickname,
        profile: personalInfo.userType,
        nickname: personalInfo.nickname,
        gender: personalInfo.gender || undefined,
        birthDate: personalInfo.birthDate || undefined,
        height: personalInfo.height ? parseInt(personalInfo.height) : undefined,
        weight: personalInfo.weight ? parseInt(personalInfo.weight) : undefined,
        diseaseInfo: diseaseInfo || undefined,
        agreements: {
          service: agreements.service,
          privacyRequired: agreements.privacyRequired,
          privacyOptional: agreements.privacyOptional,
          marketing: agreements.marketing,
        },
      });

      toast.success('회원가입이 완료되었습니다!');
      navigate(ROUTES.MAIN);
    } catch (error: any) {
      toast.error(error.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-surface-alt">
      {/* Left Side - Decorative (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/20 via-secondary/20 to-primary/10 z-0" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
          <div>
            <Logo size="lg" />
          </div>
          
          <div className="max-w-lg mb-12">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              건강한 삶을 위한<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                첫 걸음을 시작하세요
              </span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              CarePlus는 당신의 건강 데이터를 분석하여<br />
              최적의 맞춤형 케어 솔루션을 제공합니다.
            </p>
          </div>
          
          <div className="text-sm text-gray-400">
            © 2024 CarePlus. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 relative overflow-y-auto">
        <div className="w-full max-w-md z-10 animate-enter my-auto">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo size="md" />
          </div>

          <div className="glass-card p-6 md:p-8">
            {/* Header with Back Button */}
            <div className="flex items-center mb-6 relative">
              <button
                onClick={() => (currentStep === 0 ? navigate(ROUTES.LOGIN) : handlePrevStep())}
                className="absolute left-0 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="w-full text-center text-xl font-bold text-gray-900">
                {currentStep === 0 && '약관 동의'}
                {currentStep === 1 && '계정 정보'}
                {currentStep === 2 && '개인 정보'}
                {currentStep === 3 && '질환 정보'}
              </h2>
            </div>

            {/* Enhanced Step Indicator */}
            <StepIndicator currentStep={currentStep} steps={steps} />

            {/* Step 0: Terms */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                {termsData ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <CustomCheckbox
                          checked={agreements.all}
                          onChange={(e) => handleAllAgreement(e.target.checked)}
                        />
                        <span className="font-bold text-gray-900">서비스 전체 약관에 동의합니다</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <TermItem
                        title={`(필수) ${termsData.service_terms.title}`}
                        content={termsData.service_terms.content}
                        checked={agreements.service}
                        onChange={(checked) => handleAgreementChange('service', checked)}
                        expanded={expandedTerms.service}
                        onToggle={() => toggleTermContent('service')}
                      />
                      <TermItem
                        title={`(필수) ${termsData.privacy_required.title}`}
                        content={termsData.privacy_required.content}
                        checked={agreements.privacyRequired}
                        onChange={(checked) => handleAgreementChange('privacyRequired', checked)}
                        expanded={expandedTerms.privacyRequired}
                        onToggle={() => toggleTermContent('privacyRequired')}
                      />
                      <TermItem
                        title={`(선택) ${termsData.privacy_optional.title}`}
                        content={termsData.privacy_optional.content}
                        checked={agreements.privacyOptional}
                        onChange={(checked) => handleAgreementChange('privacyOptional', checked)}
                        expanded={expandedTerms.privacyOptional}
                        onToggle={() => toggleTermContent('privacyOptional')}
                      />
                      <TermItem
                        title={`(선택) ${termsData.marketing.title}`}
                        content={termsData.marketing.content}
                        checked={agreements.marketing}
                        onChange={(checked) => handleAgreementChange('marketing', checked)}
                        expanded={expandedTerms.marketing}
                        onToggle={() => toggleTermContent('marketing')}
                      />
                    </div>

                    <button
                      onClick={handleNextStep}
                      disabled={!canProceedFromTerms}
                      className="btn-primary w-full mt-4"
                    >
                      다음 단계로
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Account Info */}
            {currentStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); if (validateAccountInfo()) handleNextStep(); }} className="space-y-5 animate-fade-in">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">아이디 (이메일) <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                        emailError ? 'text-red-400' : accountInfo.emailChecked ? 'text-green-500' : 'text-gray-400'
                      }`} size={20} />
                      <input
                        type="email"
                        value={accountInfo.email}
                        onChange={(e) => {
                          setAccountInfo({ ...accountInfo, email: e.target.value, emailChecked: false });
                          setEmailError(null);
                        }}
                        className={`input-premium pl-12 ${
                          emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' :
                          accountInfo.emailChecked ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                        placeholder="example@email.com"
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? 'email-error' : undefined}
                      />
                      {accountInfo.emailChecked && (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleEmailCheck}
                      disabled={isCheckingEmail}
                      className={`px-4 rounded-xl font-medium transition-all min-w-[90px] flex items-center justify-center touch-target ${
                        accountInfo.emailChecked
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                      }`}
                    >
                      {isCheckingEmail ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : accountInfo.emailChecked ? (
                        <Check size={20} />
                      ) : (
                        '중복확인'
                      )}
                    </button>
                  </div>
                  {emailError && (
                    <p id="email-error" className="flex items-center gap-1 text-xs text-red-500 ml-1 mt-1 animate-slide-down">
                      <AlertCircle size={14} />
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">비밀번호 <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      passwordError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'
                    }`} size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accountInfo.password}
                      onChange={(e) => {
                        setAccountInfo({ ...accountInfo, password: e.target.value });
                        setPasswordError(null);
                      }}
                      className={`input-premium pl-12 pr-12 ${
                        passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                      }`}
                      placeholder="6자 이상 입력해주세요"
                      aria-invalid={!!passwordError}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-target"
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {accountInfo.password && (
                    <div className="mt-2 space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-500' :
                          passwordStrength.score === 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {passwordStrength.requirements.slice(0, 3).map((req, idx) => (
                          <span
                            key={idx}
                            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                              req.met ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {req.met ? <Check size={10} className="inline mr-1" /> : null}
                            {req.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Confirm Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">비밀번호 확인 <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      accountInfo.passwordConfirm && accountInfo.password !== accountInfo.passwordConfirm
                        ? 'text-red-400'
                        : accountInfo.passwordConfirm && accountInfo.password === accountInfo.passwordConfirm
                        ? 'text-green-500'
                        : 'text-gray-400 group-focus-within:text-primary'
                    }`} size={20} />
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      value={accountInfo.passwordConfirm}
                      onChange={(e) => {
                        setAccountInfo({ ...accountInfo, passwordConfirm: e.target.value });
                        setPasswordError(null);
                      }}
                      className={`input-premium pl-12 pr-12 ${
                        accountInfo.passwordConfirm && accountInfo.password !== accountInfo.passwordConfirm
                          ? 'border-red-300 focus:border-red-500'
                          : accountInfo.passwordConfirm && accountInfo.password === accountInfo.passwordConfirm
                          ? 'border-green-300 focus:border-green-500'
                          : ''
                      }`}
                      placeholder="비밀번호를 다시 입력해주세요"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-target"
                      aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {accountInfo.passwordConfirm && accountInfo.password !== accountInfo.passwordConfirm && (
                    <p className="flex items-center gap-1 text-xs text-red-500 ml-1 mt-1 animate-slide-down">
                      <AlertCircle size={14} />
                      비밀번호가 일치하지 않습니다
                    </p>
                  )}
                  {accountInfo.passwordConfirm && accountInfo.password === accountInfo.passwordConfirm && (
                    <p className="flex items-center gap-1 text-xs text-green-600 ml-1 mt-1 animate-slide-down">
                      <CheckCircle2 size={14} />
                      비밀번호가 일치합니다
                    </p>
                  )}
                </div>

                {passwordError && (
                  <p className="flex items-center gap-1 text-xs text-red-500 ml-1 animate-slide-down">
                    <AlertCircle size={14} />
                    {passwordError}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full mt-4 touch-target"
                  disabled={!accountInfo.email || !accountInfo.password || !accountInfo.passwordConfirm}
                >
                  다음 단계로
                </button>
              </form>
            )}

            {/* Step 2: Personal Info */}
            {currentStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); if (validatePersonalInfo()) handleNextStep(); }} className="space-y-5 animate-fade-in">
                {/* User Type Selection with Icons */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 ml-1">사용자 유형 <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '일반인', value: 'general', desc: '간병인/가족' },
                      { label: '환우', value: 'patient', desc: 'CKD 환자' },
                      { label: '연구자', value: 'researcher', desc: '의료진/연구' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setPersonalInfo({ ...personalInfo, userType: type.value as 'general' | 'patient' | 'researcher' })}
                        className={`py-4 px-3 rounded-xl text-center transition-all touch-target ${
                          personalInfo.userType === type.value
                            ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95'
                        }`}
                      >
                        <span className="block text-sm font-semibold">{type.label}</span>
                        <span className={`block text-[10px] mt-0.5 ${
                          personalInfo.userType === type.value ? 'text-white/80' : 'text-gray-400'
                        }`}>{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nickname Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">닉네임 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                        nicknameError ? 'text-red-400' : personalInfo.nicknameChecked ? 'text-green-500' : 'text-gray-400'
                      }`} size={20} />
                      <input
                        type="text"
                        value={personalInfo.nickname}
                        onChange={(e) => {
                          setPersonalInfo({ ...personalInfo, nickname: e.target.value, nicknameChecked: false });
                          setNicknameError(null);
                        }}
                        className={`input-premium pl-12 ${
                          nicknameError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' :
                          personalInfo.nicknameChecked ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                        placeholder="2자 이상 입력"
                        aria-invalid={!!nicknameError}
                      />
                      {personalInfo.nicknameChecked && (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleNicknameCheck}
                      disabled={isCheckingNickname}
                      className={`px-4 rounded-xl font-medium transition-all min-w-[90px] flex items-center justify-center touch-target ${
                        personalInfo.nicknameChecked
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                      }`}
                    >
                      {isCheckingNickname ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : personalInfo.nicknameChecked ? (
                        <Check size={20} />
                      ) : (
                        '중복확인'
                      )}
                    </button>
                  </div>
                  {nicknameError && (
                    <p className="flex items-center gap-1 text-xs text-red-500 ml-1 mt-1 animate-slide-down">
                      <AlertCircle size={14} />
                      {nicknameError}
                    </p>
                  )}
                </div>

                {/* Gender Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 ml-1">성별 <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {['남성', '여성', '기타'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setPersonalInfo({ ...personalInfo, gender: gender as '남성' | '여성' | '기타' })}
                        className={`py-3 rounded-xl text-sm font-medium transition-all touch-target ${
                          personalInfo.gender === gender
                            ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Birth Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">생년월일 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={personalInfo.birthDate}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                      className="input-premium pl-12"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Height and Weight */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 ml-1">
                    <label className="text-sm font-medium text-gray-700">신체 정보</label>
                    <span className="text-xs text-gray-400">(선택)</span>
                    <div className="group relative">
                      <Info size={14} className="text-gray-400 cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                        맞춤형 영양 정보 제공에 활용됩니다
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-800 rotate-45" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={personalInfo.height}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, height: e.target.value })}
                        className="input-premium pl-12"
                        placeholder="키 (cm)"
                        min="100"
                        max="250"
                      />
                    </div>
                    <div className="relative">
                      <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={personalInfo.weight}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, weight: e.target.value })}
                        className="input-premium pl-12"
                        placeholder="체중 (kg)"
                        min="20"
                        max="300"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full mt-4 touch-target"
                  disabled={!personalInfo.nickname || !personalInfo.gender || !personalInfo.birthDate}
                >
                  다음 단계로
                </button>
              </form>
            )}

            {/* Step 3: Disease Info */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-1">
                    <Activity size={18} className="text-primary" />
                    <label className="text-sm font-medium text-gray-700">
                      해당하는 질환을 선택해주세요
                    </label>
                  </div>

                  {/* Info Banner */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm">
                    <Info size={18} className="flex-shrink-0 mt-0.5" />
                    <p>선택하신 정보를 바탕으로 맞춤형 건강 정보와 식단 가이드를 제공합니다. 정보는 언제든지 마이페이지에서 수정할 수 있습니다.</p>
                  </div>

                  {/* Disease Options Grid */}
                  <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {diseaseOptions.map((option, index) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 touch-target ${
                          diseaseInfo === option.value
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 active:scale-[0.98]'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          diseaseInfo === option.value
                            ? 'border-primary bg-primary scale-110'
                            : 'border-gray-300'
                        }`}>
                          {diseaseInfo === option.value && (
                            <Check size={12} className="text-white animate-scale-in" strokeWidth={3} />
                          )}
                        </div>
                        <input
                          type="radio"
                          name="disease"
                          checked={diseaseInfo === option.value}
                          onChange={() => setDiseaseInfo(option.value)}
                          className="hidden"
                          aria-label={option.label}
                        />
                        <span className={`font-medium transition-colors ${
                          diseaseInfo === option.value ? 'text-primary' : 'text-gray-700'
                        }`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Skip Option */}
                  <button
                    type="button"
                    onClick={() => setDiseaseInfo('None')}
                    className={`w-full text-center text-sm py-2 rounded-lg transition-colors ${
                      diseaseInfo === 'None'
                        ? 'text-primary font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    해당사항 없음 / 나중에 입력하기
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !diseaseInfo}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 touch-target"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      회원가입 처리 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      가입 완료
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                이미 계정이 있으신가요?{' '}
                <Link to={ROUTES.LOGIN} className="text-primary font-semibold hover:underline">
                  로그인하기
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const CustomCheckbox: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ checked, onChange }) => (
  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
    checked ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
  }`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    {checked && <Check size={14} className="text-white" strokeWidth={3} />}
  </div>
);

const TermItem: React.FC<{
  title: string;
  content: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ title, content, checked, onChange, expanded, onToggle }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
    <div className="p-4 flex items-center justify-between gap-3">
      <label className="flex items-center gap-3 cursor-pointer flex-1">
        <CustomCheckbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </label>
      <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>
    {expanded && (
      <div className="px-4 pb-4 pt-0">
        <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 leading-relaxed whitespace-pre-wrap h-32 overflow-y-auto custom-scrollbar">
          {content}
        </div>
      </div>
    )}
  </div>
);

export default SignupPage;
