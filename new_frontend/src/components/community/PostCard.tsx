/**
 * PostCard Component
 * 게시글 카드 컴포넌트
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Clock, Edit2, Trash2, ImageIcon } from 'lucide-react';
import { deletePost } from '../../services/communityApi';
import type { PostCard as PostCardType, PostType } from '../../types/community';

interface PostCardProps {
  post: PostCardType;
  onClick?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  language: 'ko' | 'en';
}

const PostCardComponent: React.FC<PostCardProps> = ({ post, onClick, onDelete, language }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  // Safe localStorage access with fallback
  let currentUserId: string | null = null;
  try {
    currentUserId = localStorage.getItem('userId');
  } catch (error) {
    console.warn('Could not access localStorage for userId:', error);
  }
  const isAuthor = currentUserId === post.userId;

  // Format date to relative time (Korean timezone)
  const formatTimeAgo = (dateString: string): string => {
    // Backend stores UTC time without timezone indicator, so add 'Z' to parse as UTC
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (language === 'ko') {
      if (diffInSeconds < 60) return '방금 전';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
      return date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
    } else {
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString('en-US', { timeZone: 'Asia/Seoul' });
    }
  };

  // Post type badge color
  const getBadgeStyle = (type: PostType): string => {
    switch (type) {
      case 'BOARD':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 'CHALLENGE':
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300';
      case 'SURVEY':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  // Post type label
  const getTypeLabel = (type: PostType): string => {
    if (language === 'ko') {
      switch (type) {
        case 'BOARD':
          return '게시판';
        case 'CHALLENGE':
          return '챌린지';
        case 'SURVEY':
          return '설문조사';
        default:
          return type;
      }
    } else {
      switch (type) {
        case 'BOARD':
          return 'Board';
        case 'CHALLENGE':
          return 'Challenge';
        case 'SURVEY':
          return 'Survey';
        default:
          return type;
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-buttons')) {
      return;
    }
    if (onClick) {
      onClick(post.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/community/${post.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmMsg = language === 'ko' ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete this post?';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePost(post.id);
      if (onDelete) {
        onDelete(post.id);
      }
      alert(language === 'ko' ? '게시글이 삭제되었습니다' : 'Post deleted');
    } catch (err: unknown) {
      const errorMsg = language === 'ko' ? '삭제 중 오류가 발생했습니다' : 'Error deleting post';
      alert(errorMsg);
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const t = {
    recent: language === 'ko' ? '최근:' : 'Recent:',
    edit: language === 'ko' ? '수정' : 'Edit',
    delete: language === 'ko' ? '삭제' : 'Delete',
    deleting: language === 'ko' ? '삭제 중...' : 'Deleting...',
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-200 cursor-pointer p-5"
    >
      {/* Header: Title + Image Icon + Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 pr-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
            {post.title}
          </h3>
          {post.thumbnailUrl && (
            <ImageIcon size={18} className="text-primary-500 flex-shrink-0" aria-label={language === 'ko' ? '이미지 포함' : 'Has image'} />
          )}
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getBadgeStyle(post.postType)}`}>
          {getTypeLabel(post.postType)}
        </span>
      </div>

      {/* Author & Time */}
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span className="font-medium">{post.authorName}</span>
        <span className="mx-2">•</span>
        <span>{formatTimeAgo(post.createdAt)}</span>
      </div>

      {/* Preview text */}
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">{post.previewText}</p>

      {/* Footer: Stats + Last Activity + Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icons */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          {/* Comments */}
          <div className="flex items-center space-x-1.5">
            <MessageSquare size={18} />
            <span className="font-medium">{post.commentCount}</span>
          </div>

          {/* Likes */}
          <div className="flex items-center space-x-1.5">
            <ThumbsUp size={18} />
            <span className="font-medium">{post.likes}</span>
          </div>
        </div>

        {/* Center: Last Activity */}
        <div className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
          <Clock size={12} />
          {t.recent} {formatTimeAgo(post.lastActivityAt)}
        </div>

        {/* Right: Action Buttons (Author Only) */}
        {isAuthor && (
          <div className="action-buttons flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-xs font-medium text-primary-600 dark:text-primary-400
                hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors flex items-center gap-1"
              title={t.edit}
            >
              <Edit2 size={12} />
              {t.edit}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors
                disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
              title={t.delete}
            >
              <Trash2 size={12} />
              {isDeleting ? t.deleting : t.delete}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCardComponent;
