/**
 * ChatInput Component
 * 채팅 입력 컴포넌트
 *
 * Provides input field with profile selector, image upload, and send button.
 * 프로필 선택기, 이미지 업로드, 전송 버튼이 있는 입력 필드를 제공합니다.
 */

import React, { useRef } from 'react';
import { Send, Image as ImageIcon, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types/chat';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isDisabled: boolean;
  placeholder?: string;
  showImageUpload?: boolean;
  selectedImage?: File | null;
  imagePreview?: string | null;
  onImageSelect?: (file: File) => void;
  onImageRemove?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  isDisabled,
  placeholder = '메시지를 입력하세요...',
  showImageUpload = false,
  selectedImage,
  imagePreview,
  onImageSelect,
  onImageRemove,
}) => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedProfile, setSelectedProfile] = React.useState<UserProfile>(
    user?.profile || 'patient'
  );

  /**
   * Handle profile change
   * 프로필 변경 처리
   *
   * 백엔드 API를 호출하여 프로필을 영구 저장합니다.
   * Calls backend API to persist profile change.
   */
  const handleProfileChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProfile = e.target.value as UserProfile;
    setSelectedProfile(newProfile);
    await updateProfile(newProfile);
  };

  /**
   * Handle image file selection
   * 이미지 파일 선택 처리
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageSelect) {
      // Validate file type
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      // Validate file size (max 10MB)
      // 파일 크기 검증 (최대 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }

      onImageSelect(file);
    }
  };

  /**
   * Handle Enter key press
   * Enter 키 입력 처리
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  /**
   * Handle send button click
   * 전송 버튼 클릭 처리
   */
  const handleSendClick = (e: React.FormEvent) => {
    e.preventDefault();
    onSend();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 lg:p-4">
      {/* Image Preview */}
      {showImageUpload && imagePreview && (
        <div className="mb-3 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-32 rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <button
            onClick={onImageRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            aria-label="Remove image"
            title="이미지 제거"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendClick} className="flex flex-col space-y-2">
        {/* Profile Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            맞춤 정보:
          </span>
          <div className="relative flex items-center gap-1 cursor-pointer">
            <span className="text-[11px] text-[#00c8b4] font-medium">
              {selectedProfile === 'general'
                ? '일반인(간병인)'
                : selectedProfile === 'patient'
                ? '환자(신장병 환우)'
                : '연구원'}
            </span>
            <ChevronDown size={12} color="#00C8B4" />
            <select
              value={selectedProfile}
              onChange={handleProfileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Select user profile"
            >
              <option value="patient">환자(신장병 환우)</option>
              <option value="general">일반인(간병인)</option>
              <option value="researcher">연구원</option>
            </select>
          </div>
        </div>

        {/* Input Field */}
        <div className="flex gap-2 items-center">
          {/* Image Upload Button (only for nutrition agent) */}
          {showImageUpload && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                aria-label="Upload image"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 flex items-center justify-center rounded-full transition-colors flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ color: '#99A1AF' }}
                title="음식 이미지 첨부"
                aria-label="Attach food image"
              >
                <ImageIcon size={20} strokeWidth={1.66} />
              </button>
            </>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isDisabled}
            className="input-field flex-1 text-sm dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Chat input"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isDisabled || (!input.trim() && !selectedImage)}
            className="w-11 h-11 flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background:
                input.trim() || selectedImage
                  ? 'var(--color-primary)'
                  : '#F3F4F6',
            }}
            aria-label="Send message"
            title="메시지 전송"
          >
            <Send
              size={18}
              color={input.trim() || selectedImage ? '#FFFFFF' : '#9CA3AF'}
            />
          </button>
        </div>
      </form>
    </div>
  );
};
