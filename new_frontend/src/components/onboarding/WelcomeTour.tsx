/**
 * WelcomeTour Component
 * Interactive onboarding tour for first-time users
 * Designed for elderly CKD patients with clear, supportive messaging
 */

import React from 'react';
import { X } from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface WelcomeTourProps {
  run: boolean;
  onComplete: () => void;
  steps?: TourStep[];
}

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ run, onComplete, steps }) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(run);

  React.useEffect(() => {
    setIsVisible(run);
    if (run) {
      setCurrentStep(0);
    }
  }, [run]);

  const defaultSteps: TourStep[] = steps || [
    {
      target: '[data-tour="chat"]',
      title: 'AI 건강 상담',
      content: '신장병 관련 궁금한 점을 AI에게 물어보세요. 의료복지, 식단, 연구논문 등 전문 정보를 제공합니다.',
      position: 'right',
    },
    {
      target: '[data-tour="diet-care"]',
      title: '식단 관리',
      content: '음식 사진을 찍어 영양 분석을 받아보세요. 나트륨, 칼륨 등 신장 건강에 중요한 영양소를 확인할 수 있습니다.',
      position: 'right',
    },
    {
      target: '[data-tour="quiz"]',
      title: '건강 퀴즈',
      content: '재미있는 퀴즈를 풀며 신장병 지식을 쌓아보세요. 정답을 맞히면 포인트도 획득할 수 있습니다!',
      position: 'right',
    },
    {
      target: '[data-tour="community"]',
      title: '커뮤니티',
      content: '다른 환우분들과 경험을 공유하고 서로 응원하세요. 익명으로 활동할 수 있어 부담 없이 참여하실 수 있습니다.',
      position: 'right',
    },
    {
      target: '[data-tour="profile"]',
      title: '마이페이지',
      content: '건강 프로필을 설정하면 맞춤형 정보를 받을 수 있습니다. 체중, 키, 질환 단계 등을 입력해보세요.',
      position: 'right',
    },
  ];

  const handleNext = () => {
    if (currentStep < defaultSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('careguide_tour_completed', 'true');
    onComplete();
  };

  if (!isVisible || currentStep >= defaultSteps.length) {
    return null;
  }

  const step = defaultSteps[currentStep];
  const isLastStep = currentStep === defaultSteps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in" onClick={handleSkip} />

      {/* Tour Tooltip */}
      <div
        className="fixed z-[9999] bg-white rounded-2xl shadow-2xl max-w-md w-[calc(100%-2rem)] p-6 animate-scale-in"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          aria-label="둘러보기 종료"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>
              {currentStep + 1} / {defaultSteps.length}
            </span>
            <div className="flex gap-1">
              {defaultSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : index < currentStep ? 'bg-primary/40' : 'bg-gray-200'
                  }`}
                  role="progressbar"
                  aria-valuenow={index <= currentStep ? 100 : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              ))}
            </div>
          </div>

          {/* Title and content */}
          <div>
            <h3 id="tour-title" className="text-xl font-bold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p id="tour-description" className="text-gray-700 leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors min-h-[44px] px-4"
            >
              건너뛰기
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  이전
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all min-h-[44px]"
              >
                {isLastStep ? '시작하기' : '다음'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeTour;
