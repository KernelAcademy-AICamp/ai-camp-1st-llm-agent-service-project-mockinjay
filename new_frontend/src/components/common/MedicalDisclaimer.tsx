/**
 * MedicalDisclaimer Component
 * Safety disclaimers for medical content
 * Critical for patient safety and legal compliance
 */

import React, { useState } from 'react';
import { AlertTriangle, X, Phone } from 'lucide-react';

interface MedicalDisclaimerProps {
  context: 'nutrition' | 'chat' | 'general' | 'quiz' | 'community';
  dismissible?: boolean;
  showEmergency?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  context,
  dismissible = false,
  showEmergency = false,
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
      content:
        '이 영양 정보는 교육 목적으로 제공되며 개인 맞춤 의료 조언을 대체하지 않습니다. 식단 변경 전 반드시 담당 의사 또는 영양사와 상담하세요.',
      warning: '복용 중인 약물과 음식의 상호작용이 있을 수 있으니 주의하세요.',
      color: 'yellow' as const,
    },
    chat: {
      title: 'AI 상담 면책사항',
      content:
        '이 AI 챗봇은 일반적인 건강 정보를 제공하며, 의료 진단이나 치료를 대체할 수 없습니다. 제공되는 정보는 참고용이며 개인별 상황에 따라 다를 수 있습니다.',
      warning: '응급 상황 시 119로 연락하거나 가까운 병원 응급실을 방문하세요.',
      color: 'yellow' as const,
    },
    general: {
      title: '의료 정보 고지',
      content:
        '본 서비스의 모든 정보는 참고용이며 의료 전문가의 조언을 대신할 수 없습니다. 건강 관련 결정 전에 반드시 담당 의사와 상담하세요.',
      warning: undefined,
      color: 'blue' as const,
    },
    quiz: {
      title: '퀴즈 정보 안내',
      content:
        '이 퀴즈는 교육 목적으로 제공되며, 정답이 모든 환자에게 동일하게 적용되는 것은 아닙니다. 개인의 건강 상태는 담당 의사의 진단을 따르세요.',
      warning: undefined,
      color: 'blue' as const,
    },
    community: {
      title: '커뮤니티 정보 안내',
      content:
        '커뮤니티 게시글은 개인 경험을 공유하는 것으로, 의료 조언이 아닙니다. 다른 사람의 경험이 본인에게 적합하지 않을 수 있으니 의료 결정 전 반드시 의사와 상담하세요.',
      warning: undefined,
      color: 'blue' as const,
    },
  };

  const { title, content, warning, color } = disclaimers[context];

  const colorClasses: Record<'yellow' | 'blue', { bg: string; border: string; icon: string; title: string; text: string; warning: string }> = {
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      text: 'text-yellow-800',
      warning: 'bg-yellow-100 text-yellow-900',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      text: 'text-blue-800',
      warning: 'bg-blue-100 text-blue-900',
    },
  };

  const colors = colorClasses[color as 'yellow' | 'blue'];

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-xl p-4 mb-6 relative`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`${colors.icon} flex-shrink-0 mt-0.5`} size={20} aria-hidden="true" />
        <div className="flex-1 space-y-2">
          <h4 className={`font-bold ${colors.title} text-sm`}>{title}</h4>
          <p className={`text-sm ${colors.text} leading-relaxed`}>{content}</p>
          {warning && (
            <div className={`${colors.warning} rounded-lg p-3 text-sm font-medium`}>
              {warning}
            </div>
          )}
          {showEmergency && (
            <div className="pt-2 border-t border-yellow-200">
              <a
                href="tel:119"
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors min-h-[44px] py-2"
              >
                <Phone size={16} aria-hidden="true" />
                <span>응급 상황 시: 119 (구급차)</span>
              </a>
            </div>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`${colors.icon} hover:opacity-70 transition-opacity p-1 rounded-lg hover:bg-black/5 min-h-[44px] min-w-[44px] flex items-center justify-center`}
            aria-label="고지사항 닫기"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MedicalDisclaimer;
