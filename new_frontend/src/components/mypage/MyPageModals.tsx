/**
 * MyPage Modal Components
 * CarePlus 디자인 시스템을 따르는 마이페이지 모달 컴포넌트들
 */
import React, { useState } from 'react';
import {
  X,
  Camera,
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  AlertCircle,
  Pill,
  Activity,
  Bell,
  Moon,
  Globe,
  Lock,
  Bookmark,
  MessageSquare,
  ThumbsUp,
  Clock,
  Trash2,
} from 'lucide-react';

// ===========================================
// TYPES
// ===========================================

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileEditModalProps extends BaseModalProps {
  user: {
    fullName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    avatar?: string;
  };
  onSave: (data: ProfileFormData) => void;
}

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
}

interface HealthCondition {
  id: string;
  name: string;
  checked: boolean;
}

interface HealthProfileModalProps extends BaseModalProps {
  onSave: (data: HealthProfileData) => void;
}

interface HealthProfileData {
  conditions: string[];
  allergies: string[];
  medications: string[];
  bloodType?: string;
  height?: string;
  weight?: string;
}

interface SettingsModalProps extends BaseModalProps {
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

interface BookmarkedPaper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  bookmarkedAt: string;
}

interface BookmarkedPapersModalProps extends BaseModalProps {
  papers: BookmarkedPaper[];
  onRemoveBookmark: (paperId: string) => void;
}

interface MyPost {
  id: string;
  title: string;
  content: string;
  postType: 'BOARD' | 'CHALLENGE' | 'SURVEY';
  likes: number;
  commentCount: number;
  createdAt: string;
}

interface MyPostsModalProps extends BaseModalProps {
  posts: MyPost[];
  onDeletePost: (postId: string) => void;
}

// ===========================================
// 1. PROFILE EDIT MODAL
// ===========================================

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    birthDate: user.birthDate || '',
  });

  const [previewAvatar, setPreviewAvatar] = useState(user.avatar);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900">프로필 수정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent-purple)] flex items-center justify-center overflow-hidden">
                  {previewAvatar ? (
                    <img
                      src={previewAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-white" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera size={18} className="text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">프로필 사진 변경</p>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                이름
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="input-field"
                placeholder="홍길동"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input-field"
                placeholder="example@email.com"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                전화번호
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="input-field"
                placeholder="010-1234-5678"
              />
            </div>

            {/* Birth Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                생년월일
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                className="input-field"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1"
              >
                취소
              </button>
              <button type="submit" className="btn-primary flex-1">
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// ===========================================
// 2. HEALTH PROFILE MODAL
// ===========================================

export const HealthProfileModal: React.FC<HealthProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'conditions' | 'allergies' | 'info'>('conditions');

  const [conditions, setConditions] = useState<HealthCondition[]>([
    { id: '1', name: '고혈압', checked: false },
    { id: '2', name: '당뇨병', checked: false },
    { id: '3', name: '고지혈증', checked: false },
    { id: '4', name: '신장 질환', checked: false },
    { id: '5', name: '간 질환', checked: false },
    { id: '6', name: '심장 질환', checked: false },
    { id: '7', name: '천식', checked: false },
    { id: '8', name: '관절염', checked: false },
  ]);

  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const [medications, setMedications] = useState<string[]>([]);
  const [medicationInput, setMedicationInput] = useState('');

  const [basicInfo, setBasicInfo] = useState({
    bloodType: '',
    height: '',
    weight: '',
  });

  const toggleCondition = (id: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    if (medicationInput.trim()) {
      setMedications([...medications, medicationInput.trim()]);
      setMedicationInput('');
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const selectedConditions = conditions
      .filter((c) => c.checked)
      .map((c) => c.name);

    onSave({
      conditions: selectedConditions,
      allergies,
      medications,
      bloodType: basicInfo.bloodType,
      height: basicInfo.height,
      weight: basicInfo.weight,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">건강 프로필 설정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6">
            <button
              onClick={() => setActiveTab('conditions')}
              className={activeTab === 'conditions' ? 'tab-selected' : 'tab-unselected'}
            >
              <Heart size={16} className="inline mr-1" />
              질환
            </button>
            <button
              onClick={() => setActiveTab('allergies')}
              className={activeTab === 'allergies' ? 'tab-selected' : 'tab-unselected'}
            >
              <AlertCircle size={16} className="inline mr-1" />
              알레르기
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={activeTab === 'info' ? 'tab-selected' : 'tab-unselected'}
            >
              <Activity size={16} className="inline mr-1" />
              기본 정보
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Conditions Tab */}
            {activeTab === 'conditions' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  해당하는 질환을 모두 선택해주세요
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {conditions.map((condition) => (
                    <label
                      key={condition.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        condition.checked
                          ? 'border-[var(--color-primary)] bg-[var(--color-input-bar)]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={condition.checked}
                        onChange={() => toggleCondition(condition.id)}
                        className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="font-medium text-gray-800">
                        {condition.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies Tab */}
            {activeTab === 'allergies' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    알레르기
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                      placeholder="알레르기 항목 입력"
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      className="btn-primary px-4"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium"
                      >
                        {allergy}
                        <button
                          onClick={() => removeAllergy(index)}
                          className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Pill size={16} className="text-gray-400" />
                    복용 중인 약물
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={medicationInput}
                      onChange={(e) => setMedicationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                      placeholder="약물명 입력"
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={addMedication}
                      className="btn-primary px-4"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medications.map((med, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {med}
                        <button
                          onClick={() => removeMedication(index)}
                          className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    혈액형
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['A', 'B', 'AB', 'O'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setBasicInfo({ ...basicInfo, bloodType: type })
                        }
                        className={`py-3 rounded-xl font-medium transition-all ${
                          basicInfo.bloodType === type
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type}형
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      키 (cm)
                    </label>
                    <input
                      type="number"
                      value={basicInfo.height}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, height: e.target.value })
                      }
                      placeholder="170"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      몸무게 (kg)
                    </label>
                    <input
                      type="number"
                      value={basicInfo.weight}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, weight: e.target.value })
                      }
                      placeholder="70"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">
              취소
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1">
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ===========================================
// 3. SETTINGS MODAL
// ===========================================

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

  const handleSubmit = () => {
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900">환경 설정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    언어
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Moon size={16} className="text-gray-400" />
                    테마
                  </label>
                  <select
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
            <button onClick={onClose} className="btn-ghost flex-1">
              취소
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1">
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Setting Toggle Component
const SettingToggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
    </label>
  </div>
);

// ===========================================
// 4. BOOKMARKED PAPERS MODAL
// ===========================================

export const BookmarkedPapersModal: React.FC<BookmarkedPapersModalProps> = ({
  isOpen,
  onClose,
  papers,
  onRemoveBookmark,
}) => {
  const handleRemove = (paperId: string) => {
    if (window.confirm('북마크를 삭제하시겠습니까?')) {
      onRemoveBookmark(paperId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark size={24} className="text-[var(--color-primary)]" />
              <h2 className="text-xl font-bold text-gray-900">
                북마크한 논문 ({papers.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {papers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bookmark size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">북마크한 논문이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {paper.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="truncate">{paper.authors}</p>
                          <p className="text-xs">
                            {paper.journal} • {paper.year}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={14} />
                          <span>
                            {new Date(paper.bookmarkedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(paper.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Bookmark size={20} className="fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
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

// ===========================================
// 5. MY POSTS MODAL
// ===========================================

export const MyPostsModal: React.FC<MyPostsModalProps> = ({
  isOpen,
  onClose,
  posts,
  onDeletePost,
}) => {
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
    return { class: badges[type as keyof typeof badges], label: labels[type as keyof typeof labels] };
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
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={24} className="text-[var(--color-primary)]" />
              <h2 className="text-xl font-bold text-gray-900">
                내 게시글 ({posts.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
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
