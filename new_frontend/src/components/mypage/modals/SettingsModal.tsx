/**
 * SettingsModal Component
 * 환경 설정 모달
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, Lock, Globe, Moon } from 'lucide-react';
import { SettingToggle } from '../shared/SettingToggle';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
}

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    community: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
  };
  preferences: {
    language: 'ko' | 'en';
    theme: 'light' | 'dark' | 'auto';
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      community: true,
    },
    privacy: {
      showProfile: true,
      showActivity: true,
    },
    preferences: {
      language: 'ko',
      theme: 'light',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSubmitting(false);
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
        aria-labelledby="settings-title"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 id="settings-title" className="text-xl font-bold text-gray-900">
              환경 설정
            </h2>
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
          <div className="p-6 space-y-6">
            {/* Notifications Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell size={18} className="text-[var(--color-primary)]" />
                알림 설정
              </h3>
              <div className="space-y-3">
                <SettingToggle
                  label="이메일 알림"
                  description="중요한 소식을 이메일로 받습니다"
                  checked={settings.notifications.email}
                  onChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: checked },
                    })
                  }
                />
                <SettingToggle
                  label="푸시 알림"
                  description="앱 알림을 받습니다"
                  checked={settings.notifications.push}
                  onChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, push: checked },
                    })
                  }
                />
                <SettingToggle
                  label="커뮤니티 알림"
                  description="댓글과 좋아요 알림을 받습니다"
                  checked={settings.notifications.community}
                  onChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, community: checked },
                    })
                  }
                />
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Privacy Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock size={18} className="text-[var(--color-primary)]" />
                개인정보 설정
              </h3>
              <div className="space-y-3">
                <SettingToggle
                  label="프로필 공개"
                  description="다른 사용자에게 프로필을 공개합니다"
                  checked={settings.privacy.showProfile}
                  onChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, showProfile: checked },
                    })
                  }
                />
                <SettingToggle
                  label="활동 공개"
                  description="내 활동 기록을 공개합니다"
                  checked={settings.privacy.showActivity}
                  onChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, showActivity: checked },
                    })
                  }
                />
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Preferences Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe size={18} className="text-[var(--color-primary)]" />
                환경 설정
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    언어
                  </label>
                  <select
                    id="language"
                    value={settings.preferences.language}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        preferences: {
                          ...settings.preferences,
                          language: e.target.value as 'ko' | 'en',
                        },
                      })
                    }
                    className="input-field"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="theme"
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                  >
                    <Moon size={16} className="text-gray-400" />
                    테마
                  </label>
                  <select
                    id="theme"
                    value={settings.preferences.theme}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        preferences: {
                          ...settings.preferences,
                          theme: e.target.value as 'light' | 'dark' | 'auto',
                        },
                      })
                    }
                    className="input-field"
                  >
                    <option value="light">라이트</option>
                    <option value="dark">다크</option>
                    <option value="auto">자동</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary flex-1"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
