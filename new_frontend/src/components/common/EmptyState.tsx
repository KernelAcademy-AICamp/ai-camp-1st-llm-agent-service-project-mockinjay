/**
 * EmptyState Component
 *
 * Reusable empty state component with actionable CTAs.
 * Converts potentially frustrating moments into opportunities for engagement.
 *
 * Features:
 * - Multiple variants for different contexts
 * - Optional illustration
 * - Primary and secondary actions
 * - Supportive, non-judgmental messaging
 * - Accessible with proper ARIA labels
 */

import React from 'react';
import {
  Inbox,
  MessageSquare,
  FileText,
  Heart,
  Calendar,
  Search,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export type EmptyStateVariant =
  | 'no-data'
  | 'no-messages'
  | 'no-results'
  | 'no-posts'
  | 'no-bookmarks'
  | 'no-logs'
  | 'error'
  | 'welcome';

interface EmptyStateProps {
  /** Visual variant affecting icon and messaging */
  variant?: EmptyStateVariant;
  /** Custom title (overrides variant default) */
  title?: string;
  /** Custom description (overrides variant default) */
  description?: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Custom icon (overrides variant default) */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  className = '',
}) => {
  // Variant configurations
  const variantConfig = {
    'no-data': {
      icon: <Inbox size={48} className="text-gray-400" />,
      title: '데이터가 없습니다',
      description: '아직 표시할 내용이 없습니다.',
    },
    'no-messages': {
      icon: <MessageSquare size={48} className="text-gray-400" />,
      title: '대화를 시작해보세요',
      description:
        '궁금한 점이 있으신가요? AI 전문가가 언제든 도와드릴 준비가 되어 있습니다.',
    },
    'no-results': {
      icon: <Search size={48} className="text-gray-400" />,
      title: '검색 결과가 없습니다',
      description: '다른 키워드로 검색해보시거나, 필터를 조정해보세요.',
    },
    'no-posts': {
      icon: <FileText size={48} className="text-gray-400" />,
      title: '아직 게시글이 없습니다',
      description:
        '첫 번째로 게시글을 작성해보세요. 여러분의 이야기가 누군가에게 큰 도움이 될 수 있습니다.',
    },
    'no-bookmarks': {
      icon: <Heart size={48} className="text-gray-400" />,
      title: '북마크한 항목이 없습니다',
      description: '유용한 논문이나 정보를 발견하면 북마크해보세요.',
    },
    'no-logs': {
      icon: <Calendar size={48} className="text-gray-400" />,
      title: '식단 기록이 없습니다',
      description:
        '오늘의 식단을 기록하고 건강 관리를 시작해보세요. 하루 한 끼씩 천천히 해도 괜찮아요.',
    },
    error: {
      icon: <AlertCircle size={48} className="text-red-400" />,
      title: '오류가 발생했습니다',
      description: '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    },
    welcome: {
      icon: <Sparkles size={48} className="text-primary-500" />,
      title: '환영합니다!',
      description: '건강 관리의 첫 걸음을 시작해볼까요?',
    },
  };

  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      role="region"
      aria-label="Empty state"
    >
      {/* Icon */}
      <div
        className="mb-6 p-4 bg-gray-50 rounded-full"
        aria-hidden="true"
      >
        {displayIcon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{displayTitle}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 max-w-md leading-relaxed mb-6">
        {displayDescription}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-purple text-white rounded-lg font-medium hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Specialized Empty States for Common Use Cases
 */

export const NoChatMessagesEmpty: React.FC<{
  onStartChat: () => void;
}> = ({ onStartChat }) => (
  <EmptyState
    variant="no-messages"
    primaryAction={{
      label: '대화 시작하기',
      onClick: onStartChat,
      icon: <MessageSquare size={18} />,
    }}
  />
);

export const NoMealLogsEmpty: React.FC<{
  onAddMeal: () => void;
}> = ({ onAddMeal }) => (
  <EmptyState
    variant="no-logs"
    primaryAction={{
      label: '식단 기록하기',
      onClick: onAddMeal,
      icon: <Calendar size={18} />,
    }}
    secondaryAction={{
      label: '예시 보기',
      onClick: () => {
        // Open help modal or tutorial
      },
      icon: <Heart size={18} />,
    }}
  />
);

export const NoCommunityPostsEmpty: React.FC<{
  onCreatePost: () => void;
}> = ({ onCreatePost }) => (
  <EmptyState
    variant="no-posts"
    title="함께 나누는 이야기"
    description="비슷한 경험을 가진 분들과 이야기를 나눠보세요. 여러분의 경험이 누군가에게 큰 힘이 될 수 있습니다."
    primaryAction={{
      label: '게시글 작성하기',
      onClick: onCreatePost,
      icon: <FileText size={18} />,
    }}
  />
);

export const NoSearchResultsEmpty: React.FC<{
  onClearSearch: () => void;
}> = ({ onClearSearch }) => (
  <EmptyState
    variant="no-results"
    secondaryAction={{
      label: '검색 초기화',
      onClick: onClearSearch,
    }}
  />
);

export const ErrorStateEmpty: React.FC<{
  onRetry: () => void;
  errorMessage?: string;
}> = ({ onRetry, errorMessage }) => (
  <EmptyState
    variant="error"
    description={
      errorMessage ||
      '일시적인 문제가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.'
    }
    primaryAction={{
      label: '다시 시도',
      onClick: onRetry,
    }}
  />
);

/**
 * Usage Examples:
 *
 * // Basic empty state
 * <EmptyState variant="no-data" />
 *
 * // Custom empty state with actions
 * <EmptyState
 *   icon={<Trophy size={48} className="text-amber-400" />}
 *   title="퀴즈를 시작해보세요!"
 *   description="건강 상식을 재미있게 배우고 포인트도 획득하세요."
 *   primaryAction={{
 *     label: '퀴즈 시작',
 *     onClick: () => navigate('/quiz'),
 *     icon: <Trophy size={18} />
 *   }}
 * />
 *
 * // Specialized empty states
 * <NoChatMessagesEmpty onStartChat={handleStartChat} />
 * <NoMealLogsEmpty onAddMeal={handleAddMeal} />
 * <NoCommunityPostsEmpty onCreatePost={handleCreatePost} />
 * <NoSearchResultsEmpty onClearSearch={handleClearSearch} />
 * <ErrorStateEmpty onRetry={handleRetry} errorMessage="서버 연결 실패" />
 */
