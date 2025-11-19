import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deletePost } from '../api/community.ts';
import type { PostCard as PostCardType } from '../types/community.ts';

interface PostCardProps {
  post: PostCardType;
  onClick?: (postId: string) => void;
  onDelete?: (postId: string) => void;  // Callback with postId to remove from list
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, onDelete }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUserId = localStorage.getItem('userId');
  const isAuthor = currentUserId === post.userId;
  const isLoggedIn = !!localStorage.getItem('token');
  // Format date to relative time
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // Post type badge color
  const getBadgeColor = (type: string): string => {
    switch (type) {
      case 'BOARD':
        return 'bg-gray-100 text-gray-700';
      case 'CHALLENGE':
        return 'bg-teal-100 text-teal-700';
      case 'SURVEY':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Post type label
  const getTypeLabel = (type: string): string => {
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
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
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

    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePost(post.id);
      // Call onDelete with postId to remove from list immediately
      if (onDelete) {
        onDelete(post.id);
      }
      alert('게시글이 삭제되었습니다');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '삭제 중 오류가 발생했습니다';
      alert(errorMsg);
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer p-5"
    >
      {/* Header: Title + Badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1 pr-3">
          {post.title}
        </h3>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getBadgeColor(
            post.postType
          )}`}
        >
          {getTypeLabel(post.postType)}
        </span>
      </div>

      {/* Author & Time */}
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <span className="font-medium">{post.authorName}</span>
        <span className="mx-2">•</span>
        <span>{formatTimeAgo(post.createdAt)}</span>
      </div>

      {/* Preview text */}
      <p className="text-sm text-gray-700 line-clamp-2 mb-4">
        {post.previewText}
      </p>

      {/* Footer: Stats + Last Activity + Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icons */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {/* Comments */}
          <div className="flex items-center space-x-1.5">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium">{post.commentCount}</span>
          </div>

          {/* Likes */}
          <div className="flex items-center space-x-1.5">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span className="font-medium">{post.likes}</span>
          </div>
        </div>

        {/* Center: Last Activity */}
        <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
          최근: {formatTimeAgo(post.lastActivityAt)}
        </div>

        {/* Right: Action Buttons (Author Only) */}
        {isAuthor && (
          <div className="action-buttons flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="글 수정"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
              title="글 삭제"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
