/**
 * PreferencesModal Component
 * 환경설정 모달
 */
import React, { useState, useEffect } from 'react';
import { X, Loader2, Moon, Sun, Globe, Bell } from 'lucide-react';
import type { UserPreferences, PreferencesUpdateRequest } from '../../types/mypage';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PreferencesUpdateRequest) => Promise<void>;
  currentPreferences?: UserPreferences;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPreferences,
}) => {
  // Form state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    community: true,
    trends: true,
    healthTips: true,
    paperUpdates: true,
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current preferences
  useEffect(() => {
    if (isOpen) {
      if (currentPreferences) {
        setTheme(currentPreferences.theme);
        setLanguage(currentPreferences.language);
        setNotifications({
          email: currentPreferences.notifications.email,
          push: currentPreferences.notifications.push,
          community: currentPreferences.notifications.community,
          trends: currentPreferences.notifications.trends,
          healthTips: currentPreferences.notifications.healthTips ?? true,
          paperUpdates: currentPreferences.notifications.paperUpdates ?? true,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, currentPreferences]);

  // Handle close
  const handleClose = () => {
    if (hasChanges()) {
      if (!window.confirm('변경사항이 있습니다. 닫으시겠습니까?')) {
        return;
      }
    }
    resetForm();
    onClose();
  };

  // Check if there are changes
  const hasChanges = () => {
    if (!currentPreferences) return true;
    return (
      theme !== currentPreferences.theme ||
      language !== currentPreferences.language ||
      JSON.stringify(notifications) !== JSON.stringify(currentPreferences.notifications)
    );
  };

  // Reset form
  const resetForm = () => {
    setTheme('system');
    setLanguage('ko');
    setNotifications({
      email: true,
      push: true,
      community: true,
      trends: true,
      healthTips: true,
      paperUpdates: true,
    });
    setError(null);
  };

  // Handle notification toggle
  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      await onSave({
        theme,
        language,
        notifications,
      });
      onClose();
    } catch (err: unknown) {
      setError('설정 저장 중 오류가 발생했습니다.');
      console.error('Error updating preferences:', err);
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">환경설정</h2>
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

            {/* Theme Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Moon size={16} className="inline mr-2" />
                테마
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <Sun size={18} className="text-amber-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">라이트 모드</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <Moon size={18} className="text-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">다크 모드</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={theme === 'system'}
                    onChange={() => setTheme('system')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex">
                    <Sun size={14} className="text-amber-500" />
                    <Moon size={14} className="text-indigo-500 -ml-1" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">시스템 설정</span>
                </label>
              </div>
            </div>

            {/* Language Selection */}
            <div className="mb-6">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe size={16} className="inline mr-2" />
                언어
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'ko' | 'en')}
                disabled={submitting}
                className="input-field dark:bg-gray-700 dark:text-white"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Notification Preferences */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Bell size={16} className="inline mr-2" />
                알림 설정
              </label>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">이메일 알림</span>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={() => toggleNotification('email')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">푸시 알림</span>
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={() => toggleNotification('push')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">커뮤니티 활동 알림</span>
                  <input
                    type="checkbox"
                    checked={notifications.community}
                    onChange={() => toggleNotification('community')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">건강 정보 알림</span>
                  <input
                    type="checkbox"
                    checked={notifications.healthTips}
                    onChange={() => toggleNotification('healthTips')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">논문 업데이트 알림</span>
                  <input
                    type="checkbox"
                    checked={notifications.paperUpdates}
                    onChange={() => toggleNotification('paperUpdates')}
                    disabled={submitting}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
              </div>
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

export default PreferencesModal;
