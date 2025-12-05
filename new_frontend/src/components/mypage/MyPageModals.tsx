/**
 * MyPage Modal Components
 * CarePlus 디자인 시스템을 따르는 마이페이지 모달 컴포넌트들
 * WCAG 2.1 AA 접근성 기준 준수
 */
import React, { useState, useEffect, useRef } from 'react';
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
  journal?: string;
  year?: string;
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
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    // Focus first input when modal opens
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    // ESC key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Focus trap
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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

    // Validate form
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = '이름을 입력해주세요';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 주소를 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 id="profile-modal-title" className="text-xl font-bold text-gray-900">프로필 수정</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="모달 닫기"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent-purple)] flex items-center justify-center overflow-hidden">
                  {previewAvatar ? (
                    <img
                      src={previewAvatar}
                      alt="프로필 사진"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-white" aria-hidden="true" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Camera size={18} className="text-gray-600" aria-hidden="true" />
                  <span className="sr-only">프로필 사진 변경</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="sr-only"
                    aria-label="프로필 사진 파일 선택"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-2" aria-live="polite">프로필 사진 변경</p>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-gray-500" aria-hidden="true" />
                이름 <span className="text-red-500" aria-label="필수">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
                className={`input-field ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="홍길동"
                aria-required="true"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-gray-500" aria-hidden="true" />
                이메일 <span className="text-red-500" aria-label="필수">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="example@email.com"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-gray-500" aria-hidden="true" />
                전화번호
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="input-field"
                placeholder="010-1234-5678"
                aria-describedby="phone-help"
              />
              <p id="phone-help" className="text-xs text-gray-600 mt-1">선택사항입니다</p>
            </div>

            {/* Birth Date Field */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" aria-hidden="true" />
                생년월일
              </label>
              <input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                className="input-field"
                aria-describedby="birthDate-help"
              />
              <p id="birthDate-help" className="text-xs text-gray-600 mt-1">선택사항입니다</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                취소
              </button>
              <button type="submit" className="btn-primary flex-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-600">
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

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-modal-title"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 id="health-modal-title" className="text-xl font-bold text-gray-900">건강 프로필 설정</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="모달 닫기"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6" role="tablist" aria-label="건강 프로필 정보 탭">
            <button
              role="tab"
              aria-selected={activeTab === 'conditions'}
              aria-controls="conditions-panel"
              id="conditions-tab"
              onClick={() => setActiveTab('conditions')}
              className={`${activeTab === 'conditions' ? 'tab-selected' : 'tab-unselected'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 min-h-[44px]`}
            >
              <Heart size={16} className="inline mr-1" aria-hidden="true" />
              질환
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'allergies'}
              aria-controls="allergies-panel"
              id="allergies-tab"
              onClick={() => setActiveTab('allergies')}
              className={`${activeTab === 'allergies' ? 'tab-selected' : 'tab-unselected'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 min-h-[44px]`}
            >
              <AlertCircle size={16} className="inline mr-1" aria-hidden="true" />
              알레르기
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'info'}
              aria-controls="info-panel"
              id="info-tab"
              onClick={() => setActiveTab('info')}
              className={`${activeTab === 'info' ? 'tab-selected' : 'tab-unselected'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 min-h-[44px]`}
            >
              <Activity size={16} className="inline mr-1" aria-hidden="true" />
              기본 정보
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Conditions Tab */}
            {activeTab === 'conditions' && (
              <div
                role="tabpanel"
                id="conditions-panel"
                aria-labelledby="conditions-tab"
                className="space-y-4"
              >
                <p className="text-sm text-gray-600 mb-4">
                  해당하는 질환을 모두 선택해주세요
                </p>
                <fieldset className="grid grid-cols-2 gap-3">
                  <legend className="sr-only">건강 질환 선택</legend>
                  {conditions.map((condition) => (
                    <label
                      key={condition.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all min-h-[44px] ${
                        condition.checked
                          ? 'border-[var(--color-primary)] bg-[var(--color-input-bar)]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={condition.checked}
                        onChange={() => toggleCondition(condition.id)}
                        className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-2"
                        aria-label={condition.name}
                      />
                      <span className="font-medium text-gray-800">
                        {condition.name}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
            )}

            {/* Allergies Tab */}
            {activeTab === 'allergies' && (
              <div
                role="tabpanel"
                id="allergies-panel"
                aria-labelledby="allergies-tab"
                className="space-y-6"
              >
                <div>
                  <label htmlFor="allergy-input" className="block text-sm font-medium text-gray-700 mb-3">
                    알레르기
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      id="allergy-input"
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                      placeholder="알레르기 항목 입력"
                      className="input-field flex-1"
                      aria-describedby="allergy-help"
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      className="btn-primary px-4 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-600"
                      aria-label="알레르기 추가"
                    >
                      추가
                    </button>
                  </div>
                  <p id="allergy-help" className="sr-only">Enter 키를 눌러 알레르기를 추가할 수 있습니다</p>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="추가된 알레르기 목록">
                    {allergies.map((allergy, index) => (
                      <span
                        key={index}
                        role="listitem"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium"
                      >
                        {allergy}
                        <button
                          onClick={() => removeAllergy(index)}
                          className="hover:bg-red-200 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[24px] min-w-[24px]"
                          aria-label={`${allergy} 삭제`}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="medication-input" className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Pill size={16} className="text-gray-500" aria-hidden="true" />
                    복용 중인 약물
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      id="medication-input"
                      type="text"
                      value={medicationInput}
                      onChange={(e) => setMedicationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                      placeholder="약물명 입력"
                      className="input-field flex-1"
                      aria-describedby="medication-help"
                    />
                    <button
                      type="button"
                      onClick={addMedication}
                      className="btn-primary px-4 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-600"
                      aria-label="약물 추가"
                    >
                      추가
                    </button>
                  </div>
                  <p id="medication-help" className="sr-only">Enter 키를 눌러 약물을 추가할 수 있습니다</p>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="추가된 약물 목록">
                    {medications.map((med, index) => (
                      <span
                        key={index}
                        role="listitem"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {med}
                        <button
                          onClick={() => removeMedication(index)}
                          className="hover:bg-blue-200 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[24px] min-w-[24px]"
                          aria-label={`${med} 삭제`}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'info' && (
              <div
                role="tabpanel"
                id="info-panel"
                aria-labelledby="info-tab"
                className="space-y-4"
              >
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-2">
                    혈액형
                  </legend>
                  <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="혈액형 선택">
                    {['A', 'B', 'AB', 'O'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={basicInfo.bloodType === type}
                        onClick={() =>
                          setBasicInfo({ ...basicInfo, bloodType: type })
                        }
                        className={`py-3 rounded-xl font-medium transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          basicInfo.bloodType === type
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type}형
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="height-input" className="block text-sm font-medium text-gray-700 mb-2">
                      키 (cm)
                    </label>
                    <input
                      id="height-input"
                      type="number"
                      value={basicInfo.height}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, height: e.target.value })
                      }
                      placeholder="170"
                      className="input-field"
                      min="0"
                      max="300"
                      aria-describedby="height-help"
                    />
                    <p id="height-help" className="text-xs text-gray-600 mt-1">센티미터 단위로 입력해주세요</p>
                  </div>
                  <div>
                    <label htmlFor="weight-input" className="block text-sm font-medium text-gray-700 mb-2">
                      몸무게 (kg)
                    </label>
                    <input
                      id="weight-input"
                      type="number"
                      value={basicInfo.weight}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, weight: e.target.value })
                      }
                      placeholder="70"
                      className="input-field"
                      min="0"
                      max="500"
                      aria-describedby="weight-help"
                    />
                    <p id="weight-help" className="text-xs text-gray-600 mt-1">킬로그램 단위로 입력해주세요</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500">
              취소
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-600">
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

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div ref={modalRef} className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 id="settings-modal-title" className="text-xl font-bold text-gray-900">환경 설정</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="모달 닫기"
            >
              <X size={24} aria-hidden="true" />
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
            <button onClick={onClose} className="btn-ghost flex-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500">
              취소
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-600">
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
}> = ({ label, description, checked, onChange }) => {
  const toggleId = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900" id={`${toggleId}-label`}>{label}</p>
        <p className="text-xs text-gray-600 mt-0.5" id={`${toggleId}-desc`}>{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          id={toggleId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${toggleId}-label`}
          aria-describedby={`${toggleId}-desc`}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
      </label>
    </div>
  );
};

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

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
        aria-labelledby="bookmarks-modal-title"
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark size={24} className="text-[var(--color-primary)]" aria-hidden="true" />
              <h2 id="bookmarks-modal-title" className="text-xl font-bold text-gray-900">
                북마크한 논문 ({papers.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="모달 닫기"
            >
              <X size={24} aria-hidden="true" />
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
            <button onClick={onClose} className="btn-ghost w-full min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500">
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

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
        aria-labelledby="posts-modal-title"
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={24} className="text-[var(--color-primary)]" aria-hidden="true" />
              <h2 id="posts-modal-title" className="text-xl font-bold text-gray-900">
                내 게시글 ({posts.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="모달 닫기"
            >
              <X size={24} aria-hidden="true" />
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
            <button onClick={onClose} className="btn-ghost w-full min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500">
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
