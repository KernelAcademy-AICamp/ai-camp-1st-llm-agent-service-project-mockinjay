/**
 * EmptyState Component
 * Displays empty state messages with call-to-action
 */
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox, Heart, FileText, Trophy } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title = '데이터가 없습니다',
  message,
  actionLabel,
  onAction,
  className = '',
  variant = 'default',
}) => {
  if (variant === 'compact') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon className="text-gray-400" size={24} />
        </div>
        <p className="text-sm text-gray-500 mb-3">{message || title}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="text-gray-400" size={40} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {message && <p className="text-gray-600 text-center mb-6 max-w-md">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Health Profile Empty State
export const HealthProfileEmpty: React.FC<{ onSetup?: () => void }> = ({ onSetup }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-900 mb-4">건강 정보</h3>
      <EmptyState
        icon={Heart}
        title="건강 프로필 미설정"
        message="건강 프로필을 설정하면 맞춤형 정보를 제공받을 수 있습니다."
        actionLabel="건강 프로필 설정하기"
        onAction={onSetup}
        variant="compact"
      />
    </div>
  );
};

// Quiz Stats Empty State
export const QuizStatsEmpty: React.FC<{ onStartQuiz?: () => void }> = ({ onStartQuiz }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="text-primary-600" size={24} />
        <h3 className="font-bold text-gray-900">퀴즈 통계</h3>
      </div>
      <EmptyState
        icon={Trophy}
        title="아직 퀴즈를 풀지 않았어요"
        message="첫 퀴즈를 풀고 통계를 확인해보세요!"
        actionLabel="퀴즈 풀러가기"
        onAction={onStartQuiz}
        variant="compact"
      />
    </div>
  );
};

// Bookmarks Empty State
export const BookmarksEmpty: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => {
  return (
    <EmptyState
      icon={FileText}
      title="저장된 논문이 없습니다"
      message="관심있는 논문을 북마크하여 나중에 다시 볼 수 있습니다."
      actionLabel="논문 둘러보기"
      onAction={onExplore}
    />
  );
};

// Posts Empty State
export const PostsEmpty: React.FC<{ onCreatePost?: () => void }> = ({ onCreatePost }) => {
  return (
    <EmptyState
      icon={FileText}
      title="작성한 게시글이 없습니다"
      message="커뮤니티에 첫 게시글을 작성해보세요!"
      actionLabel="게시글 작성하기"
      onAction={onCreatePost}
    />
  );
};

export default EmptyState;
