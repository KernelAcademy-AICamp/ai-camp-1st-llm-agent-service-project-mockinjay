/**
 * EditPostModal Component
 * 게시글 수정 모달
 */
import React, { useState, useEffect } from 'react';
import { X, Image, Loader2 } from 'lucide-react';
import { updatePost, uploadImage } from '../../services/communityApi';
import type { PostDetail, PostType } from '../../types/community';

interface EditPostModalProps {
  isOpen: boolean;
  post: PostDetail | null;
  onClose: () => void;
  onSuccess: (updatedPost: PostDetail) => void;
  language: 'ko' | 'en';
}

const MAX_IMAGES = 2;

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, post, onClose, onSuccess, language }) => {
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('BOARD');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translations
  const t = {
    title: language === 'ko' ? '게시글 수정' : 'Edit Post',
    titleLabel: language === 'ko' ? '제목 *' : 'Title *',
    titlePlaceholder: language === 'ko' ? '게시글 제목을 입력하세요' : 'Enter post title',
    contentLabel: language === 'ko' ? '내용 *' : 'Content *',
    contentPlaceholder: language === 'ko' ? '게시글 내용을 입력하세요' : 'Enter post content',
    categoryLabel: language === 'ko' ? '카테고리 *' : 'Category *',
    board: language === 'ko' ? '게시판' : 'Board',
    challenge: language === 'ko' ? '챌린지' : 'Challenge',
    survey: language === 'ko' ? '설문조사' : 'Survey',
    images: language === 'ko' ? '이미지 첨부' : 'Attach Images',
    cancel: language === 'ko' ? '취소' : 'Cancel',
    submit: language === 'ko' ? '수정 완료' : 'Update',
    submitting: language === 'ko' ? '수정 중...' : 'Updating...',
    closeConfirm: language === 'ko' ? '수정 중인 내용이 있습니다. 닫으시겠습니까?' : 'You have unsaved changes. Are you sure you want to close?',
    titleRequired: language === 'ko' ? '제목을 입력해주세요.' : 'Please enter a title.',
    contentRequired: language === 'ko' ? '내용을 입력해주세요.' : 'Please enter content.',
    updateError: language === 'ko' ? '게시글 수정 중 오류가 발생했습니다.' : 'Error updating post.',
    success: language === 'ko' ? '게시글이 수정되었습니다.' : 'Post updated successfully.',
    maxImages: language === 'ko' ? `최대 ${MAX_IMAGES}개의 이미지를 첨부할 수 있습니다` : `You can attach up to ${MAX_IMAGES} images`,
  };

  // Initialize form with post data
  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title);
      setContent(post.content);
      setPostType(post.postType);
      setImageUrls(post.imageUrls || []);
      setError(null);
    }
  }, [post, isOpen]);

  // Handle close
  const handleClose = () => {
    const hasChanges = post && (
      title !== post.title ||
      content !== post.content ||
      postType !== post.postType ||
      JSON.stringify(imageUrls) !== JSON.stringify(post.imageUrls || [])
    );

    if (hasChanges) {
      if (!window.confirm(t.closeConfirm)) {
        return;
      }
    }
    onClose();
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    if (files.length > 1) {
      alert(language === 'ko'
        ? '이미지는 한 번에 1개씩만 업로드할 수 있습니다.'
        : 'You can only upload 1 image at a time.');
      e.target.value = '';
      return;
    }

    if (imageUrls.length >= MAX_IMAGES) {
      alert(t.maxImages);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadImage(files[0]);
      setImageUrls((prev) => [...prev, result.url].slice(0, MAX_IMAGES));
    } catch (err) {
      console.error('Image upload error:', err);
      alert(language === 'ko' ? '이미지 업로드 중 오류가 발생했습니다.' : 'Error uploading images.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!post) return;

    if (!title.trim()) {
      setError(t.titleRequired);
      return;
    }

    if (!content.trim()) {
      setError(t.contentRequired);
      return;
    }

    try {
      setSubmitting(true);
      const updatedPost = await updatePost(post.id, {
        title,
        content,
        imageUrls,
      });

      alert(t.success);
      onSuccess({ ...post, ...updatedPost, title, content, imageUrls });
      onClose();
    } catch (err: unknown) {
      setError(t.updateError);
      console.error('Error updating post:', err);
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

  if (!isOpen || !post) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                disabled:text-gray-300 disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Title Field */}
            <div className="mb-4">
              <label
                htmlFor="edit-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t.titleLabel}
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                disabled={submitting}
                className="input-field dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                maxLength={200}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{title.length}/200</p>
            </div>

            {/* Content Field */}
            <div className="mb-4">
              <label
                htmlFor="edit-content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t.contentLabel}
              </label>
              <textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.contentPlaceholder}
                disabled={submitting}
                rows={6}
                className="input-field resize-none dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                maxLength={5000}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{content.length}/5000</p>
            </div>

            {/* Post Type (Read-only) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.categoryLabel}
              </label>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                {postType === 'BOARD' ? t.board : postType === 'CHALLENGE' ? t.challenge : t.survey}
                <span className="text-xs ml-2">(수정 불가)</span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.images} ({imageUrls.length}/{MAX_IMAGES})
              </label>
              {/* Image Preview */}
              {imageUrls.length > 0 && (
                <div className="flex justify-center mb-3">
                  <div className="w-2/3 grid grid-cols-2 gap-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {imageUrls.length < MAX_IMAGES && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
                  <span>{uploading ? 'Uploading...' : t.images}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || submitting}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t.maxImages}</p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary-action flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditPostModal;
