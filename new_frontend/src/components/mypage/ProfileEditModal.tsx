/**
 * ProfileEditModal Component
 * 프로필 수정 모달
 */
import React, { useState, useEffect } from 'react';
import { X, Loader2, User } from 'lucide-react';
import type { UserProfile, ProfileUpdateRequest } from '../../types/mypage';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileUpdateRequest) => Promise<void>;
  currentProfile: UserProfile;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProfile,
}) => {
  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current profile
  useEffect(() => {
    if (isOpen && currentProfile) {
      setFullName(currentProfile.fullName || '');
      setBio(currentProfile.bio || '');
    }
  }, [isOpen, currentProfile]);

  // Handle close
  const handleClose = () => {
    if (fullName !== (currentProfile.fullName || '') || bio !== (currentProfile.bio || '')) {
      if (!window.confirm('변경사항이 있습니다. 닫으시겠습니까?')) {
        return;
      }
    }
    resetForm();
    onClose();
  };

  // Reset form
  const resetForm = () => {
    setFullName(currentProfile.fullName || '');
    setBio(currentProfile.bio || '');
    setError(null);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        fullName: fullName.trim(),
        bio: bio.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError('프로필 수정 중 오류가 발생했습니다.');
      console.error('Error updating profile:', err);
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
  }, [isOpen, fullName, bio]);

  if (!isOpen) return null;

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">프로필 수정</h2>
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

            {/* Profile Image Placeholder */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-3xl font-bold">
                {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : <User size={40} />}
              </div>
            </div>

            {/* Full Name Field */}
            <div className="mb-4">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                이름 *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="이름을 입력하세요"
                disabled={submitting}
                className="input-field dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                maxLength={100}
                required
              />
            </div>

            {/* Bio Field */}
            <div className="mb-4">
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                자기소개
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="자기소개를 입력하세요"
                disabled={submitting}
                rows={4}
                className="input-field resize-none dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{bio.length}/500</p>
            </div>

            {/* Email (Read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={currentProfile.email}
                disabled
                className="input-field bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">이메일은 변경할 수 없습니다</p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary-action flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProfileEditModal;
