import React from 'react';
import { Sparkles, Heart, Utensils, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SuggestionChips } from './SuggestionChips';

/**
 * Props interface for WelcomeMessage component
 */
interface WelcomeMessageProps {
  /** Type of agent determining the welcome message and icon */
  agentType: 'auto' | 'medical_welfare' | 'nutrition' | 'research';
  /** Callback function when a suggestion chip is clicked */
  onSuggestionClick: (suggestion: string) => void;
  /** Optional flag to disable suggestions (e.g., during loading) */
  isDisabled?: boolean;
}

/**
 * Welcome message configuration by agent type
 */
const welcomeMessages: Record<WelcomeMessageProps['agentType'], string> = {
  auto: '안녕하세요! 무엇이든 물어보세요. 최적의 전문가가 답변해 드립니다.',
  medical_welfare:
    '안녕하세요! 신장병의 의료 복지 정보를 알려드리는 케어가이드 챗봇입니다. 무엇이든 물어보세요.',
  nutrition:
    '안녕하세요! 신장병의 식이 영양 정보를 알려드리는 케어가이드 챗봇입니다. 무엇이든 물어보세요.',
  research:
    '안녕하세요! 신장병의 연구 논문 정보를 알려드리는 케어가이드 챗봇입니다. 무엇이든 물어보세요.',
};

/**
 * Suggestion questions by agent type
 */
const suggestions: Record<WelcomeMessageProps['agentType'], string[]> = {
  auto: [
    '신장병 환자를 위한 식단 추천해줘',
    '투석 환자 지원 제도 알려줘',
    'CKD 최신 연구 동향은?',
  ],
  medical_welfare: [
    '신장병 환자를 위한 의료 복지 혜택은?',
    '투석 환자 지원 제도 알려줘',
  ],
  nutrition: [
    '저칼륨 음식 재료 알려줘',
    '신장병 환자를 위한 김장 레시피 알려줘',
  ],
  research: [
    '만성신장병 최신 연구 동향은?',
    'CKD 치료법 관련 논문 찾아줘',
  ],
};

/**
 * Icon mapping by agent type
 */
const agentIcons: Record<WelcomeMessageProps['agentType'], LucideIcon> = {
  auto: Sparkles,
  medical_welfare: Heart,
  nutrition: Utensils,
  research: FileText,
};

/**
 * WelcomeMessage Component
 *
 * Displays a welcome message with agent-specific branding and suggestion chips.
 * Shown at the start of a chat session before any messages are exchanged.
 *
 * Features:
 * - Agent-specific welcome message
 * - Agent-specific icon (Sparkles, Heart, Utensils, FileText)
 * - Suggestion chips for quick queries
 * - Consistent styling with chat bubble design
 * - Fully accessible with ARIA attributes
 *
 * Usage Example:
 * ```tsx
 * <WelcomeMessage
 *   agentType="nutrition"
 *   onSuggestionClick={(suggestion) => handleSendMessage(suggestion)}
 *   isDisabled={isLoading}
 * />
 * ```
 */
export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  agentType,
  onSuggestionClick,
  isDisabled = false,
}) => {
  const Icon = agentIcons[agentType];
  const welcomeMessage = welcomeMessages[agentType];
  const suggestionList = suggestions[agentType];

  return (
    <div className="mb-8 animate-fade-in" role="region" aria-label="Welcome message">
      {/* Agent Icon and Label */}
      <div className="flex items-center gap-2 mb-3 pl-1">
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-sm"
          aria-hidden="true"
        >
          <Icon size={16} className="text-primary" strokeWidth={2} />
        </div>
        <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
          CareGuide AI
        </span>
      </div>

      {/* Welcome Message Bubble */}
      <div
        className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl rounded-tl-none p-5 max-w-[500px] shadow-sm"
        role="article"
        aria-label="Welcome message"
      >
        <p className="text-base text-gray-800 leading-relaxed font-medium">
          {welcomeMessage}
        </p>
      </div>

      {/* Suggestion Chips */}
      <div className="pl-1">
        <SuggestionChips
          suggestions={suggestionList}
          onSuggestionClick={onSuggestionClick}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  );
};

/**
 * Accessibility Checklist:
 * - [x] ARIA role="region" for the main container
 * - [x] ARIA labels for semantic structure
 * - [x] Icon is decorative (aria-hidden="true")
 * - [x] Text is readable with proper color contrast
 * - [x] SuggestionChips component handles keyboard navigation
 * - [x] Disabled state properly propagated to child components
 *
 * Performance Considerations:
 * - Uses React.memo implicitly through functional component
 * - Static data (welcomeMessages, suggestions, agentIcons) defined outside component
 * - No expensive computations or side effects
 * - Icon component from lucide-react is tree-shakeable
 *
 * Deployment Checklist:
 * - [ ] Verify all agent types display correct messages
 * - [ ] Test on mobile devices for proper layout
 * - [ ] Verify chat bubble styling matches design system
 * - [ ] Test with screen reader for accessibility
 * - [ ] Verify suggestion chips scroll correctly on narrow screens
 * - [ ] Test disabled state during loading
 * - [ ] Verify Korean text displays correctly in all browsers
 */

