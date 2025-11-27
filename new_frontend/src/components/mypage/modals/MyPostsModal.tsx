/**
 * MyPostsModal Component
 * 내 게시글 목록 모달
 */
import React, { useEffect, useRef } from 'react';
import { X, MessageSquare, ThumbsUp, Trash2 } from 'lucide-react';

interface MyPost {
  id: string;
  title: string;
  content: string;
  postType: 'BOARD' | 'CHALLENGE' | 'SURVEY';
  likes: number;
  commentCount: number;
  createdAt: string;
}

interface MyPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: MyPost[];
  onDeletePost: (postId: string) => void;
}

export const MyPostsModal: React.FC<MyPostsModalProps> = ({
  isOpen,
  onClose,
  posts,
  onDeletePost,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      closeButtonRef.current?.focus();
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 포커스 트랩
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab as EventListener);
    return () => modal.removeEventListener('keydown', handleTab as EventListener);
  }, [isOpen]);

  const getPostTypeBadge = (type: string) => {
    const badges = {
      BOARD: 'badge-free',
      CHALLENGE: 'badge-challenge',
      SURVEY: 'badge-survey',
    };
    const labels = {
      BOARD: '게시판',
      CHALLENGE: '챌린지',
      SURVEY: '설문조사',
    };
    return {
      class: badges[type as keyof typeof badges],
      label: labels[type as keyof typeof labels],
    };
  };

  const handleDelete = (postId: string) => {
    if (window.confirm('게시글을 삭제하시겠습니까?')) {
      onDeletePost(postId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-posts-title"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={24} className="text-[var(--color-primary)]" />
              <h2 id="my-posts-title" className="text-xl font-bold text-gray-900">
                내 게시글 ({posts.length})
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="모달 닫기"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {posts.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-center"
                role="status"
                aria-live="polite"
              >
                <MessageSquare size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">작성한 게시글이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => {
                  const badge = getPostTypeBadge(post.postType);
                  return (
                    <div
                      key={post.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badge & Date */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`badge ${badge.class}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Content Preview */}
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {post.content}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <ThumbsUp size={16} />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={16} />
                              {post.commentCount}
                            </span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={`${post.title} 게시글 삭제`}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4">
            <button onClick={onClose} className="btn-ghost w-full">
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
