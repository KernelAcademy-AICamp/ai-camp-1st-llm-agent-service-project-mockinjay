/**
 * NotificationSettingsPage - Notification settings page
 * 알림 설정 페이지
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, Smartphone, MessageSquare, TrendingUp, Save, Loader2 } from 'lucide-react';
import { getUserPreferences, updateUserPreferences } from '../services/api';

const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    community: true,
    trends: true,
  });

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const prefs = await getUserPreferences();
        if (prefs?.notifications) {
          setNotifications(prefs.notifications);
        }
      } catch (err) {
        setError('알림 설정을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserPreferences({ notifications });
      setSuccess('알림 설정이 저장되었습니다.');
    } catch (err) {
      setError('알림 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const NotificationToggle = ({
    icon: Icon,
    title,
    description,
    enabled,
    onToggle,
  }: {
    icon: typeof Bell;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
  }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-primary-100' : 'bg-gray-200'}`}>
          <Icon size={20} className={enabled ? 'text-primary-600' : 'text-gray-500'} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          <NotificationToggle
            icon={Mail}
            title="이메일 알림"
            description="중요한 업데이트를 이메일로 받습니다."
            enabled={notifications.email}
            onToggle={() => handleToggle('email')}
          />

          <NotificationToggle
            icon={Smartphone}
            title="푸시 알림"
            description="앱 푸시 알림을 받습니다."
            enabled={notifications.push}
            onToggle={() => handleToggle('push')}
          />

          <NotificationToggle
            icon={MessageSquare}
            title="커뮤니티 알림"
            description="댓글, 좋아요 등 커뮤니티 활동 알림을 받습니다."
            enabled={notifications.community}
            onToggle={() => handleToggle('community')}
          />

          <NotificationToggle
            icon={TrendingUp}
            title="트렌드 알림"
            description="관심 분야의 최신 연구 및 뉴스를 받습니다."
            enabled={notifications.trends}
            onToggle={() => handleToggle('trends')}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full mt-6 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              저장 중...
            </>
          ) : (
            <>
              <Save size={20} />
              설정 저장
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default NotificationSettingsPage;
