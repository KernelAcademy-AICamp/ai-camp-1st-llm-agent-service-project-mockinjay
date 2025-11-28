/**
 * MedicalTooltip Component
 * Educational tooltips for medical terminology
 * Designed for CKD patients to understand complex medical terms
 */

import React, { useState } from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // max-w-sm equivalent
      const tooltipHeight = 150; // approximate

      // Calculate position to keep tooltip in viewport
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      let top = rect.bottom + 8;

      // Adjust if tooltip would go off screen
      if (left < 10) left = 10;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      if (top + tooltipHeight > window.innerHeight - 10) {
        top = rect.top - tooltipHeight - 8;
      }

      setPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-block">
      {children ? (
        <span ref={triggerRef} onClick={handleToggle} aria-describedby={isOpen ? 'medical-tooltip' : undefined}>
          {children}
        </span>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center gap-1 text-primary hover:text-primary-dark transition-colors underline decoration-dotted cursor-help min-h-[44px] px-1"
          aria-label={`${term}에 대한 설명 보기`}
          aria-expanded={isOpen}
          aria-describedby={isOpen ? 'medical-tooltip' : undefined}
        >
          <span>{term}</span>
          <HelpCircle size={16} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 lg:hidden" onClick={handleClose} />

          {/* Tooltip */}
          <div
            id="medical-tooltip"
            role="tooltip"
            className="fixed lg:absolute max-w-sm p-4 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in"
            style={{
              top: position.top,
              left: position.left,
              // For mobile, center it
              ...window.innerWidth < 1024 && {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 2rem)',
                maxWidth: '400px',
              },
            }}
          >
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-base">{term}</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{definition}</p>
              {learnMoreUrl && (
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary-dark inline-flex items-center gap-1 hover:underline min-h-[44px] py-2"
                >
                  <span>자세히 알아보기</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>

            {/* Arrow for desktop */}
            <div className="hidden lg:block absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />
          </div>
        </>
      )}
    </span>
  );
};

// Medical terms dictionary for CKD patients
export const MEDICAL_TERMS = {
  CKD: {
    term: '만성신장병 (CKD)',
    definition:
      'Chronic Kidney Disease의 약자로, 3개월 이상 신장 기능이 저하되거나 신장 손상이 지속되는 질환입니다. 1단계(경증)부터 5단계(말기신부전)까지 분류됩니다.',
    learnMoreUrl: 'https://www.kidney.or.kr',
  },
  GFR: {
    term: 'GFR (사구체 여과율)',
    definition:
      '신장이 혈액을 걸러내는 속도를 나타내는 수치입니다. 정상 수치는 90 이상이며, 낮을수록 신장 기능이 저하된 상태입니다. 이 수치로 CKD 단계를 판단합니다.',
    learnMoreUrl: 'https://www.kidney.or.kr/ckd/info',
  },
  Creatinine: {
    term: '크레아티닌',
    definition:
      '근육 대사 과정에서 생성되는 노폐물로, 신장을 통해 배출됩니다. 혈중 크레아티닌 수치가 높으면 신장 기능이 저하된 것을 의미합니다. 정상 범위는 남성 0.7-1.3 mg/dL, 여성 0.6-1.1 mg/dL입니다.',
    learnMoreUrl: 'https://www.kidney.or.kr',
  },
  Potassium: {
    term: '칼륨',
    definition:
      '신경과 근육 기능에 필수적인 미네랄이지만, 신장 기능이 저하되면 배출이 어려워 고칼륨혈증을 유발할 수 있습니다. CKD 환자는 바나나, 토마토, 감자 등 칼륨 함량이 높은 음식의 섭취를 제한해야 합니다.',
  },
  Sodium: {
    term: '나트륨 (소금)',
    definition:
      '체내 수분 균형을 조절하는 미네랄입니다. 과다 섭취 시 고혈압과 부종을 유발하여 신장에 부담을 줍니다. CKD 환자는 하루 2,000mg (소금 약 5g) 이하로 제한하는 것이 권장됩니다.',
  },
  Phosphorus: {
    term: '인',
    definition:
      '뼈 건강에 중요한 미네랄이지만, CKD 환자는 배출이 어려워 혈관과 뼈가 약해질 수 있습니다. 유제품, 견과류, 가공식품, 콜라 등의 섭취를 제한하고, 필요시 인 결합제를 복용해야 합니다.',
  },
  Protein: {
    term: '단백질',
    definition:
      '신체 조직을 구성하는 필수 영양소이지만, CKD 환자는 과다 섭취 시 신장에 부담을 줍니다. 단계별로 적정량(0.6-0.8g/kg/day) 섭취가 권장되며, 담당 의사와 상담하여 조절해야 합니다.',
  },
  Dialysis: {
    term: '투석',
    definition:
      '신장이 기능을 못 할 때 인공적으로 혈액을 걸러주는 치료법입니다. 혈액투석(주 3회, 병원 방문)과 복막투석(매일, 가정에서 시행) 두 가지 방법이 있으며, 환자 상태에 따라 선택합니다.',
    learnMoreUrl: 'https://www.kidney.or.kr/dialysis',
  },
  Anemia: {
    term: '빈혈',
    definition:
      'CKD 환자에게 흔한 합병증으로, 신장에서 생성되는 조혈호르몬(EPO) 부족으로 발생합니다. 피로, 어지러움, 숨가쁨 등의 증상이 나타나며, EPO 주사나 철분제로 치료합니다.',
  },
  Edema: {
    term: '부종',
    definition:
      '신장 기능 저하로 체내 수분과 나트륨이 쌓여 발생하는 증상입니다. 주로 발, 다리, 눈 주위에 나타나며, 나트륨 제한과 이뇨제로 관리합니다.',
  },
} as const;

export default MedicalTooltip;
