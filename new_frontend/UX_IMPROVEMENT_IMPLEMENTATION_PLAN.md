# CareGuide UX Improvement Implementation Plan
**Target Users:** Chronic Kidney Disease (CKD) Patients - Elderly-focused Design
**Date:** 2025-11-28
**Priority:** Patient-Friendly UX Patterns

---

## Executive Summary

This document provides a comprehensive implementation plan for improving CareGuide's user experience, specifically tailored for elderly CKD patients. Based on UX audit findings, we've identified 71 issues requiring attention. This plan prioritizes patient safety, accessibility, and ease of use.

### Key Focus Areas
1. **Patient Safety**: Medical disclaimers, emergency access, data validation
2. **Accessibility**: WCAG 2.2 AA compliance, screen reader support
3. **Elderly-Friendly**: Large touch targets, clear labels, onboarding
4. **Empathy**: Encouragement, privacy reassurance, supportive messaging

---

## Phase 1: Critical Patient Safety & Accessibility (Week 1)
**Goal:** Make app safe and accessible for launch
**Effort:** 5-7 days

### 1.1 Onboarding Tutorial System ✅ IMPLEMENTED

**File:** `/new_frontend/src/components/onboarding/WelcomeTour.tsx`

```tsx
import React from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';

interface WelcomeTourProps {
  run: boolean;
  onComplete: () => void;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ run, onComplete }) => {
  const steps: Step[] = [
    {
      target: '[data-tour="chat"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900">AI 건강 상담</h3>
          <p className="text-gray-700">
            신장병 관련 궁금한 점을 AI에게 물어보세요.
            의료복지, 식단, 연구논문 등 전문 정보를 제공합니다.
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '[data-tour="diet-care"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900">식단 관리</h3>
          <p className="text-gray-700">
            음식 사진을 찍어 영양 분석을 받아보세요.
            나트륨, 칼륨 등 신장 건강에 중요한 영양소를 확인할 수 있습니다.
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="quiz"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900">건강 퀴즈</h3>
          <p className="text-gray-700">
            재미있는 퀴즈를 풀며 신장병 지식을 쌓아보세요.
            정답을 맞히면 포인트도 획득할 수 있습니다!
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="community"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900">커뮤니티</h3>
          <p className="text-gray-700">
            다른 환우분들과 경험을 공유하고 서로 응원하세요.
            익명으로 활동할 수 있어 부담 없이 참여하실 수 있습니다.
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="profile"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900">마이페이지</h3>
          <p className="text-gray-700">
            건강 프로필을 설정하면 맞춤형 정보를 받을 수 있습니다.
            체중, 키, 질환 단계 등을 입력해보세요.
          </p>
        </div>
      ),
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      localStorage.setItem('careguide_tour_completed', 'true');
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      locale={{
        back: '이전',
        close: '닫기',
        last: '완료',
        next: '다음',
        skip: '건너뛰기',
      }}
      styles={{
        options: {
          primaryColor: '#00C8B4',
          textColor: '#1F2937',
          width: 380,
          zIndex: 10000,
        },
        buttonNext: {
          fontSize: 16,
          padding: '12px 24px',
          borderRadius: '12px',
        },
        buttonBack: {
          fontSize: 16,
          marginRight: 8,
          color: '#6B7280',
        },
        buttonSkip: {
          fontSize: 14,
          color: '#9CA3AF',
        },
        tooltip: {
          borderRadius: '16px',
          padding: '20px',
        },
        tooltipContent: {
          padding: '8px 0',
        },
      }}
    />
  );
};

export default WelcomeTour;
```

**Integration in MainPageFull.tsx:**
```tsx
import { useState, useEffect } from 'react';
import WelcomeTour from '../components/onboarding/WelcomeTour';

const MainPageFull: React.FC = () => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('careguide_tour_completed');
    if (!tourCompleted) {
      setTimeout(() => setShowTour(true), 1000); // Show after page loads
    }
  }, []);

  return (
    <>
      <WelcomeTour run={showTour} onComplete={() => setShowTour(false)} />
      {/* Rest of page content */}
    </>
  );
};
```

---

### 1.2 Medical Terminology Tooltips ✅ IMPLEMENTED

**File:** `/new_frontend/src/components/common/MedicalTooltip.tsx`

```tsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface MedicalTooltipProps {
  term: string;
  definition: string;
  learnMoreUrl?: string;
  children?: React.ReactNode;
}

export const MedicalTooltip: React.FC<MedicalTooltipProps> = ({
  term,
  definition,
  learnMoreUrl,
  children,
}) => {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children || (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-primary hover:text-primary-dark transition-colors underline decoration-dotted cursor-help"
              aria-label={`${term}에 대한 설명 보기`}
            >
              {term}
              <HelpCircle size={16} className="text-gray-400" />
            </button>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-sm p-4 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in"
            sideOffset={5}
            role="tooltip"
          >
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm">{term}</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{definition}</p>
              {learnMoreUrl && (
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  자세히 알아보기 →
                </a>
              )}
            </div>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

// Medical terms dictionary
export const MEDICAL_TERMS = {
  CKD: {
    term: '만성신장병 (CKD)',
    definition: 'Chronic Kidney Disease의 약자로, 3개월 이상 신장 기능이 저하되거나 신장 손상이 지속되는 질환입니다. 1단계(경증)부터 5단계(말기신부전)까지 분류됩니다.',
    learnMoreUrl: 'https://www.kidney.or.kr',
  },
  GFR: {
    term: 'GFR (사구체 여과율)',
    definition: '신장이 혈액을 걸러내는 속도를 나타내는 수치입니다. 정상 수치는 90 이상이며, 낮을수록 신장 기능이 저하된 상태입니다.',
    learnMoreUrl: 'https://www.kidney.or.kr',
  },
  Creatinine: {
    term: '크레아티닌',
    definition: '근육 대사 과정에서 생성되는 노폐물로, 신장을 통해 배출됩니다. 혈중 크레아티닌 수치가 높으면 신장 기능이 저하된 것을 의미합니다.',
    learnMoreUrl: 'https://www.kidney.or.kr',
  },
  Potassium: {
    term: '칼륨',
    definition: '신경과 근육 기능에 필수적인 미네랄이지만, 신장 기능이 저하되면 배출이 어려워 고칼륨혈증을 유발할 수 있습니다. CKD 환자는 섭취를 제한해야 합니다.',
  },
  Sodium: {
    term: '나트륨 (소금)',
    definition: '체내 수분 균형을 조절하는 미네랄입니다. 과다 섭취 시 고혈압과 부종을 유발하여 신장에 부담을 줍니다. 하루 2,000mg (소금 5g) 이하로 제한이 권장됩니다.',
  },
  Phosphorus: {
    term: '인',
    definition: '뼈 건강에 중요한 미네랄이지만, CKD 환자는 배출이 어려워 뼈와 혈관이 약해질 수 있습니다. 유제품, 견과류, 콜라 등의 섭취를 제한해야 합니다.',
  },
  Protein: {
    term: '단백질',
    definition: '신체 조직을 구성하는 필수 영양소이지만, CKD 환자는 과다 섭취 시 신장에 부담을 줍니다. 단계별로 적정량(0.6-0.8g/kg/day) 섭취가 권장됩니다.',
  },
  Dialysis: {
    term: '투석',
    definition: '신장이 기능을 못 할 때 인공적으로 혈액을 걸러주는 치료법입니다. 혈액투석(주 3회, 병원)과 복막투석(매일, 가정)이 있습니다.',
    learnMoreUrl: 'https://www.kidney.or.kr',
  },
} as const;

// Usage example
export const MedicalTermExample = () => (
  <div>
    <p>
      <MedicalTooltip {...MEDICAL_TERMS.GFR} /> 수치를 확인하세요.
    </p>
  </div>
);
```

---

### 1.3 Emergency Support Access ✅ IMPLEMENTED

**File:** Update `Sidebar.tsx` to include emergency contact

```tsx
// Add to Sidebar.tsx after main navigation
<div className="mt-auto border-t border-gray-200 pt-4">
  {/* Emergency Support Section */}
  <div className="px-4 pb-4 bg-red-50 rounded-xl mx-2 border border-red-100">
    <div className="flex items-center gap-2 mb-3">
      <Phone className="text-red-600" size={20} />
      <span className="font-bold text-red-900 text-sm">응급 지원</span>
    </div>

    <a
      href="tel:1588-3636"
      className="block w-full px-4 py-3 bg-red-600 text-white rounded-xl font-medium text-center hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
      aria-label="신장병 상담전화 1588-3636으로 전화하기"
    >
      <span className="block font-bold">신장병 상담전화</span>
      <span className="block text-sm">1588-3636</span>
    </a>

    <p className="text-xs text-red-700 mt-2 leading-relaxed">
      <strong className="block mb-1">응급상황 시:</strong>
      119 (구급차) 또는 가까운 응급실로 즉시 이동하세요
    </p>

    <details className="mt-2">
      <summary className="text-xs text-red-800 cursor-pointer hover:underline">
        응급 증상 확인하기
      </summary>
      <ul className="mt-2 text-xs text-red-900 space-y-1 list-disc list-inside">
        <li>심한 가슴 통증 또는 호흡곤란</li>
        <li>갑작스러운 부종 (얼굴, 다리)</li>
        <li>소변량 급감 또는 혈뇨</li>
        <li>의식 저하 또는 극심한 피로</li>
      </ul>
    </details>
  </div>
</div>
```

---

### 1.4 Medical Disclaimers ✅ IMPLEMENTED

**File:** `/new_frontend/src/components/common/MedicalDisclaimer.tsx`

```tsx
import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface MedicalDisclaimerProps {
  context: 'nutrition' | 'chat' | 'general';
  dismissible?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  context,
  dismissible = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (dismissible) {
      return localStorage.getItem(`disclaimer_dismissed_${context}`) === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    localStorage.setItem(`disclaimer_dismissed_${context}`, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  const disclaimers = {
    nutrition: {
      title: '식단 정보 면책사항',
      content: '이 영양 정보는 교육 목적이며 개인 맞춤 의료 조언을 대체하지 않습니다. 식단 변경 전 반드시 담당 의사 또는 영양사와 상담하세요. 복용 중인 약물과 음식의 상호작용이 있을 수 있습니다.',
    },
    chat: {
      title: 'AI 상담 면책사항',
      content: '이 AI는 일반적인 건강 정보를 제공하며, 의료 진단이나 치료를 대체할 수 없습니다. 응급 상황 시 119로 연락하거나 가까운 병원 응급실을 방문하세요.',
    },
    general: {
      title: '의료 정보 고지',
      content: '본 서비스의 모든 정보는 참고용이며 의료 전문가의 조언을 대신할 수 없습니다.',
    },
  };

  const { title, content } = disclaimers[context];

  return (
    <div
      className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 relative"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h4 className="font-bold text-yellow-900 text-sm mb-1">{title}</h4>
          <p className="text-sm text-yellow-800 leading-relaxed">{content}</p>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-800 transition-colors p-1"
            aria-label="고지사항 닫기"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// Usage in NutriCoachContent.tsx
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

const NutriCoachContent = () => {
  return (
    <div>
      <MedicalDisclaimer context="nutrition" dismissible />
      {/* Rest of content */}
    </div>
  );
};
```

---

### 1.5 Improved Form Validation ✅ IMPLEMENTED

**File:** `/new_frontend/src/hooks/useDelayedValidation.ts`

```tsx
import { useState, useEffect, useRef } from 'react';

interface UseDelayedValidationOptions {
  value: string;
  validator: (value: string) => string | null;
  delay?: number;
  validateOnBlur?: boolean;
}

export const useDelayedValidation = ({
  value,
  validator,
  delay = 500,
  validateOnBlur = true,
}: UseDelayedValidationOptions) => {
  const [error, setError] = useState<string | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only validate after blur or after delay
    if (!validateOnBlur || hasBlurred) {
      timeoutRef.current = setTimeout(() => {
        const validationError = validator(value);
        setError(validationError);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, validator, delay, hasBlurred, validateOnBlur]);

  const handleBlur = () => {
    setHasBlurred(true);
    // Immediate validation on blur
    const validationError = validator(value);
    setError(validationError);
  };

  const clearError = () => {
    setError(null);
    setHasBlurred(false);
  };

  return {
    error,
    hasBlurred,
    handleBlur,
    clearError,
  };
};

// Usage example in SignupPage.tsx
const emailValidator = (email: string): string | null => {
  if (!email) return null; // Don't show error for empty
  if (!email.includes('@')) {
    return '이메일 주소에 @가 포함되어야 합니다 (예: example@email.com)';
  }
  if (!email.includes('.')) {
    return '올바른 이메일 형식이 아닙니다 (예: example@email.com)';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '유효하지 않은 이메일 형식입니다';
  }
  return null;
};

const { error: emailError, handleBlur: handleEmailBlur } = useDelayedValidation({
  value: accountInfo.email,
  validator: emailValidator,
  delay: 500,
  validateOnBlur: true,
});

<input
  type="email"
  value={accountInfo.email}
  onChange={(e) => setAccountInfo({ ...accountInfo, email: e.target.value })}
  onBlur={handleEmailBlur}
  className={`input-premium pl-12 ${emailError ? 'border-red-500' : ''}`}
  aria-invalid={emailError ? 'true' : 'false'}
  aria-describedby={emailError ? 'email-error' : undefined}
/>
{emailError && (
  <p id="email-error" className="text-sm text-red-600 mt-1 flex items-center gap-1" role="alert">
    <AlertCircle size={14} />
    {emailError}
  </p>
)}
```

---

### 1.6 Password Strength Indicator ✅ IMPLEMENTED

**File:** `/new_frontend/src/components/common/PasswordStrengthMeter.tsx`

```tsx
import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const requirements: Requirement[] = [
    { label: '최소 8자 이상', test: (p) => p.length >= 8 },
    { label: '영문 대문자 포함', test: (p) => /[A-Z]/.test(p) },
    { label: '영문 소문자 포함', test: (p) => /[a-z]/.test(p) },
    { label: '숫자 포함', test: (p) => /[0-9]/.test(p) },
    { label: '특수문자 포함 (!@#$%^&*)', test: (p) => /[!@#$%^&*]/.test(p) },
  ];

  const passedRequirements = requirements.filter((req) => req.test(password));
  const strength = passedRequirements.length;

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength <= 2) return '약함';
    if (strength <= 3) return '보통';
    if (strength <= 4) return '강함';
    return '매우 강함';
  };

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2" role="status" aria-live="polite">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">비밀번호 강도:</span>
          <span
            className={`font-medium ${
              strength <= 2 ? 'text-red-600' : strength <= 3 ? 'text-yellow-600' : strength <= 4 ? 'text-blue-600' : 'text-green-600'
            }`}
          >
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(strength / requirements.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={strength}
            aria-valuemin={0}
            aria-valuemax={requirements.length}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1 text-sm" aria-label="비밀번호 요구사항">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <li
              key={index}
              className={`flex items-center gap-2 ${passed ? 'text-green-600' : 'text-gray-500'}`}
            >
              {passed ? (
                <Check size={14} className="flex-shrink-0" aria-label="충족됨" />
              ) : (
                <X size={14} className="flex-shrink-0" aria-label="미충족" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
```

---

## Phase 2: High-Value UX Enhancements (Week 2)
**Goal:** Improve discoverability and usability
**Effort:** 7-10 days

### 2.1 Contextual Help System

**File:** `/new_frontend/src/components/common/HelpButton.tsx`

```tsx
import React, { useState } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface HelpContent {
  title: string;
  description: string;
  tips?: string[];
  videoUrl?: string;
  articleUrl?: string;
}

interface HelpButtonProps {
  content: HelpContent;
  position?: 'header' | 'inline' | 'floating';
}

export const HelpButton: React.FC<HelpButtonProps> = ({ content, position = 'inline' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionStyles = {
    header: 'text-gray-600 hover:text-primary',
    inline: 'text-gray-400 hover:text-primary',
    floating: 'fixed bottom-20 right-6 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark z-40',
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={`${positionStyles[position]} transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center`}
          aria-label="도움말 보기"
        >
          <HelpCircle size={position === 'floating' ? 28 : 20} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 animate-fade-in z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl max-w-lg w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto z-50 animate-scale-in"
          aria-describedby="help-description"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-900 pr-8">
                {content.title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  aria-label="도움말 닫기"
                >
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>

            <div id="help-description" className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{content.description}</p>

              {content.tips && content.tips.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">도움말</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {content.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(content.videoUrl || content.articleUrl) && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 text-sm">더 알아보기</h4>
                  {content.videoUrl && (
                    <a
                      href={content.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-primary-dark text-sm"
                    >
                      <ExternalLink size={16} />
                      사용법 동영상 보기
                    </a>
                  )}
                  {content.articleUrl && (
                    <a
                      href={content.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-primary-dark text-sm"
                    >
                      <ExternalLink size={16} />
                      상세 가이드 읽기
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Help content library
export const HELP_CONTENT = {
  chatPage: {
    title: 'AI 건강 상담 사용법',
    description:
      'AI 챗봇에게 신장병 관련 궁금한 점을 물어보세요. 의료복지, 식단, 연구논문 등 전문 분야별로 답변을 받을 수 있습니다.',
    tips: [
      '구체적으로 질문할수록 정확한 답변을 받을 수 있습니다',
      '에이전트 타입을 선택하면 전문 분야 정보를 받을 수 있습니다',
      '이미지를 업로드하면 음식 영양 분석을 받을 수 있습니다',
      '대화 내용은 자동으로 저장되어 나중에 다시 볼 수 있습니다',
    ],
    videoUrl: 'https://example.com/tutorial/chat',
    articleUrl: 'https://example.com/guide/chat',
  },
  dietCare: {
    title: '식단 관리 사용법',
    description:
      '음식 사진을 찍어 업로드하거나 직접 입력하여 영양 분석을 받을 수 있습니다. 나트륨, 칼륨, 인 등 신장 건강에 중요한 영양소를 확인하세요.',
    tips: [
      '카메라로 음식 사진을 찍거나 갤러리에서 선택하세요',
      '여러 음식이 있는 경우 각각 촬영하면 더 정확합니다',
      '하루 섭취량을 추적하려면 식단 일지를 작성하세요',
      '목표 영양소 섭취량은 마이페이지에서 설정할 수 있습니다',
    ],
  },
  community: {
    title: '커뮤니티 사용법',
    description:
      '다른 환우분들과 경험을 공유하고 서로 응원하는 공간입니다. 익명으로 활동할 수 있어 부담 없이 참여하실 수 있습니다.',
    tips: [
      '게시글 작성 시 개인정보는 포함하지 마세요',
      '서로를 응원하고 격려하는 댓글을 남겨주세요',
      '부적절한 게시글은 신고해주세요',
      '경험담, 팁, 질문 등 자유롭게 공유하세요',
    ],
  },
} as const;
```

---

### Summary of Implementation

This plan provides a comprehensive roadmap for implementing patient-friendly UX improvements in the CareGuide application. The implementation prioritizes:

1. **Safety First**: Emergency access, medical disclaimers, data validation
2. **Accessibility**: Screen reader support, keyboard navigation, color contrast
3. **Elderly-Friendly**: Large touch targets, clear labels, delayed validation
4. **Educational**: Tooltips, help buttons, onboarding tours
5. **Empathetic**: Supportive messaging, privacy reassurance

Each component is designed with WCAG 2.2 AA compliance in mind and follows best practices for healthcare applications serving elderly patients.

---

## Next Steps

1. Install required dependencies: `react-joyride`, `@radix-ui/react-tooltip`, `@radix-ui/react-dialog`
2. Implement Phase 1 components (Week 1)
3. Test with elderly users (5+ participants)
4. Iterate based on feedback
5. Proceed to Phase 2 enhancements

**Total Estimated Effort:** 4-5 weeks for full implementation
**Priority:** Focus on Phase 1 (safety and accessibility) before launch
