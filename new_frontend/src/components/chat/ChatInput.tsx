/**
 * ChatInput Component
 * 채팅 입력 컴포넌트
 *
 * Provides input field with profile selector, image upload, and send button.
 * 프로필 선택기, 이미지 업로드, 전송 버튼이 있는 입력 필드를 제공합니다.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import type { UserProfile } from '../../types/chat';
import { AlertCircle } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedProfile, setSelectedProfile] = useState<UserProfile>(
    user?.profile || 'patient'
  );
  const [isFocused, setIsFocused] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 2000;

  // Update character count
  useEffect(() => {
    setCharCount(input.length);
  }, [input]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !isDisabled) {
      inputRef.current.focus();
    }
  }, [isDisabled]);

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
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (file && onImageSelect) {
      // Validate file type
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setUploadError('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      // Validate file size (max 10MB)
      // 파일 크기 검증 (최대 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }

      onImageSelect(file);
    }
  }, [onImageSelect]);

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
    <div className="bg-white/80 backdrop-blur-md border-t border-white/20 p-3 lg:px-6 z-20 safe-area-bottom">
      {/* Upload Error Message */}
      {uploadError && (
        <div className="max-w-[832px] mx-auto mb-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg animate-slide-down">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
            aria-label="닫기"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>
      )}

      {/* Input Container - Styled like original ChatPage */}
      <div className={`max-w-[832px] mx-auto bg-white rounded-2xl border shadow-sm transition-all duration-300 p-2 ${
        isFocused
          ? 'border-primary/40 shadow-md ring-2 ring-primary/10'
          : 'border-gray-100'
      }`}>
        {/* Image Preview */}
        {showImageUpload && imagePreview && (
          <div className="mb-3 relative inline-block px-2 animate-fade-in">
            <div className="relative group">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-xl border border-gray-100 shadow-sm"
              />
              <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <IconButton
                icon="close"
                onClick={onImageRemove}
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2"
                aria-label="이미지 제거"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSendClick} className="flex flex-col">
          {/* Input Field Row */}
          <div className="flex items-center gap-2 mb-2 min-h-[44px]">
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
                <IconButton
                  icon="image"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  aria-label="음식 이미지 첨부"
                  title="음식 이미지 첨부"
                />
              </>
            )}

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  onInputChange(e.target.value);
                }
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isDisabled}
              maxLength={MAX_CHARS}
              className="flex-1 h-full bg-transparent outline-none text-base text-gray-800 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed px-2"
              aria-label="Chat input"
              autoComplete="off"
            />

            {/* Send Button */}
            <IconButton
              icon="send"
              type="submit"
              disabled={isDisabled || (!input.trim() && !selectedImage)}
              variant={(input.trim() || selectedImage) ? 'primary' : 'default'}
              aria-label="메시지 전송"
              title="메시지 전송"
              data-send-button
            />
          </div>

          {/* Profile Selector Row */}
          <div className="border-t border-gray-50 pt-2 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                맞춤 정보:
              </span>
              <div className="relative flex items-center gap-1.5 cursor-pointer group">
                <span className="text-xs text-primary font-semibold group-hover:text-primary-dark transition-colors">
                  {selectedProfile === 'general'
                    ? '일반인(간병인)'
                    : selectedProfile === 'patient'
                    ? '신장병 환우'
                    : '연구자'}
                </span>
                <Icon name="down" size="xs" color="primary" />
                <select
                  value={selectedProfile}
                  onChange={handleProfileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full touch-target"
                  disabled={isDisabled}
                  aria-label="Select user profile"
                >
                  <option value="patient">신장병 환우</option>
                  <option value="general">일반인(간병인)</option>
                  <option value="researcher">연구자</option>
                </select>
              </div>
            </div>

            {/* Character count indicator */}
            {charCount > 0 && (
              <span className={`text-[10px] transition-colors ${
                charCount > MAX_CHARS * 0.9
                  ? 'text-orange-500'
                  : charCount > MAX_CHARS * 0.8
                  ? 'text-yellow-500'
                  : 'text-gray-400'
              }`}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

