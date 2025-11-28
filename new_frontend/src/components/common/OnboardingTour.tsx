/**
 * OnboardingTour Component
 *
 * Interactive guided tour for first-time users.
 * Essential for CKD patients with varying tech literacy.
 *
 * Features:
 * - Step-by-step tutorial
 * - Spotlight effect on target elements
 * - Skippable at any time
 * - Progress indicator
 * - "Don't show again" option
 * - Keyboard navigation (← → keys)
 * - LocalStorage persistence
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface TourStep {
  /** Unique identifier for this step */
  id: string;
  /** CSS selector for element to highlight */
  target: string;
  /** Title of the step */
  title: string;
  /** Description/content of the step */
  content: string | React.ReactNode;
  /** Placement of the tooltip */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Optional: disable "Next" button until user interacts */
  requiresAction?: boolean;
}

interface OnboardingTourProps {
  /** Unique tour identifier (for localStorage) */
  tourId: string;
  /** Array of tour steps */
  steps: TourStep[];
  /** Whether the tour is active */
  isActive: boolean;
  /** Callback when tour completes */
  onComplete: () => void;
  /** Callback when tour is skipped */
  onSkip: () => void;
  /** Show "Don't show again" option */
  showDontShowAgain?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  tourId,
  steps,
  isActive,
  onComplete,
  onSkip,
  showDontShowAgain = true,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Update target element position
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(currentStep.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleSkip();
          break;
        case 'ArrowRight':
          if (!isLastStep) handleNext();
          break;
        case 'ArrowLeft':
          if (!isFirstStep) handlePrevious();
          break;
        case 'Enter':
          if (isLastStep) handleComplete();
          else handleNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex, isLastStep, isFirstStep]);

  // Scroll target element into view
  useEffect(() => {
    if (!isActive || !currentStep || !targetRect) return;

    const targetElement = document.querySelector(currentStep.target);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [currentStep, targetRect, isActive]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
    handleComplete();
  };

  if (!isActive || !currentStep) return null;

  // Calculate tooltip position
  const getTooltipPosition = (): React.CSSProperties => {
    if (!targetRect) {
      // Center position when no target
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const placement = currentStep.placement || 'bottom';
    const gap = 16; // Gap between tooltip and target
    const style: React.CSSProperties = {
      position: 'fixed',
    };

    switch (placement) {
      case 'top':
        style.bottom = `${window.innerHeight - targetRect.top + gap}px`;
        style.left = `${targetRect.left + targetRect.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        style.top = `${targetRect.bottom + gap}px`;
        style.left = `${targetRect.left + targetRect.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.right = `${window.innerWidth - targetRect.left + gap}px`;
        style.top = `${targetRect.top + targetRect.height / 2}px`;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.left = `${targetRect.right + gap}px`;
        style.top = `${targetRect.top + targetRect.height / 2}px`;
        style.transform = 'translateY(-50%)';
        break;
      case 'center':
        style.top = '50%';
        style.left = '50%';
        style.transform = 'translate(-50%, -50%)';
        break;
    }

    return style;
  };

  return (
    <>
      {/* Backdrop with spotlight effect */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 animate-in fade-in duration-300" />

        {/* Spotlight cutout */}
        {targetRect && (
          <div
            className="absolute border-4 border-white rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            style={{
              left: `${targetRect.left - 4}px`,
              top: `${targetRect.top - 4}px`,
              width: `${targetRect.width + 8}px`,
              height: `${targetRect.height + 8}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={getTooltipPosition()}
        className="z-[101] pointer-events-auto w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-purple p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                  <span>
                    단계 {currentStepIndex + 1} / {steps.length}
                  </span>
                  <div className="flex gap-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index <= currentStepIndex
                            ? 'w-6 bg-white'
                            : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {currentStep.title}
                </h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-500"
                aria-label="둘러보기 건너뛰기"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-gray-700 leading-relaxed">
              {typeof currentStep.content === 'string' ? (
                <p>{currentStep.content}</p>
              ) : (
                currentStep.content
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4">
            {showDontShowAgain && isLastStep && (
              <div className="mb-4">
                <button
                  onClick={handleDontShowAgain}
                  className="text-sm text-gray-600 hover:text-gray-800 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                >
                  다시 보지 않기
                </button>
              </div>
            )}

            <div className="flex gap-3 justify-between">
              <button
                onClick={handleSkip}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg"
              >
                건너뛰기
              </button>

              <div className="flex gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    이전
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-purple text-white rounded-lg font-medium hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-2 min-w-[100px] justify-center"
                >
                  {isLastStep ? (
                    <>
                      완료
                      <Check size={16} />
                    </>
                  ) : (
                    <>
                      다음
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="mt-3 text-center text-xs text-white/80">
          <kbd className="px-2 py-1 bg-white/20 rounded">←</kbd>{' '}
          <kbd className="px-2 py-1 bg-white/20 rounded">→</kbd> 이동 |{' '}
          <kbd className="px-2 py-1 bg-white/20 rounded">ESC</kbd> 건너뛰기
        </div>
      </div>
    </>
  );
};

/**
 * Helper function to check if tour should be shown
 */
export const shouldShowTour = (tourId: string): boolean => {
  return localStorage.getItem(`tour_${tourId}_completed`) !== 'true';
};

/**
 * Usage Example:
 *
 * const chatTourSteps: TourStep[] = [
 *   {
 *     id: 'welcome',
 *     target: 'body',
 *     title: '환영합니다!',
 *     content: 'CareGuide의 AI 챗봇을 소개합니다. 건강 관련 질문을 자유롭게 해보세요.',
 *     placement: 'center',
 *   },
 *   {
 *     id: 'agent-tabs',
 *     target: '[data-tour="agent-tabs"]',
 *     title: '에이전트 선택',
 *     content: '의료복지, 식이영양, 연구논문 전문가 중에서 선택할 수 있습니다.',
 *     placement: 'bottom',
 *   },
 *   {
 *     id: 'suggestions',
 *     target: '[data-tour="suggestion-chips"]',
 *     title: '추천 질문',
 *     content: '무엇을 물어볼지 모르겠다면, 이 추천 질문을 클릭해보세요.',
 *     placement: 'top',
 *   },
 * ];
 *
 * function ChatPage() {
 *   const [showTour, setShowTour] = useState(() => shouldShowTour('chat-intro'));
 *
 *   return (
 *     <>
 *       <OnboardingTour
 *         tourId="chat-intro"
 *         steps={chatTourSteps}
 *         isActive={showTour}
 *         onComplete={() => setShowTour(false)}
 *         onSkip={() => setShowTour(false)}
 *       />
 *       {/* Your chat page content *\/}
 *     </>
 *   );
 * }
 */
