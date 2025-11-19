import React, { useState, useEffect } from 'react';
import { createPost } from '../api/community.ts';
import type { PostType } from '../types/community.ts';
import ImageUpload from './ImageUpload.tsx';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (postId: string) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('BOARD');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setContent('');
    setPostType('BOARD');
    setImageUrls([]);
    setError(null);
  };

  // Handle close
  const handleClose = () => {
    if (title.trim() || content.trim() || imageUrls.length > 0) {
      if (!window.confirm('작성 중인 내용이 있습니다. 닫으시겠습니까?')) {
        return;
      }
    }
    resetForm();
    onClose();
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const newPost = await createPost({
        title,
        content,
        postType,
        imageUrls,
      });

      // Success
      alert('게시글이 작성되었습니다. 포인트 5P가 적립되었습니다.');
      resetForm();
      onClose();
      onSuccess(newPost.id);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '게시글 작성 중 오류가 발생했습니다.';
      setError(errorMsg);
      console.error('Error creating post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal
    if (e.currentTarget === e.target) {
      handleClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">새 글 작성</h2>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
              aria-label="모달 닫기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Title Field */}
            <div className="mb-4">
              <label htmlFor="modal-title" className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                id="modal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                disabled={submitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-label="게시글 제목"
                maxLength={200}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200</p>
            </div>

            {/* Content Field */}
            <div className="mb-4">
              <label htmlFor="modal-content" className="block text-sm font-medium text-gray-700 mb-2">
                내용 *
              </label>
              <textarea
                id="modal-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="게시글 내용을 입력하세요"
                disabled={submitting}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                aria-label="게시글 내용"
                maxLength={5000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{content.length}/5000</p>
            </div>

            {/* Post Type Field */}
            <div className="mb-4">
              <label htmlFor="modal-postType" className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 *
              </label>
              <select
                id="modal-postType"
                value={postType}
                onChange={(e) => setPostType(e.target.value as PostType)}
                disabled={submitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                aria-label="게시글 카테고리"
              >
                <option value="BOARD">게시판</option>
                <option value="CHALLENGE">챌린지</option>
                <option value="SURVEY">설문조사</option>
              </select>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <ImageUpload onImagesChange={setImageUrls} />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {submitting ? '작성 중...' : '작성 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePostModal;
