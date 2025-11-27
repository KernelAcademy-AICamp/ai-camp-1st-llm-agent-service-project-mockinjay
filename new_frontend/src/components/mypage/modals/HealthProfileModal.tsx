/**
 * HealthProfileModal Component
 * 건강 프로필 설정 모달
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  AlertCircle,
  Pill,
  Activity,
} from 'lucide-react';

interface HealthCondition {
  id: string;
  name: string;
  checked: boolean;
}

interface HealthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const HealthProfileModal: React.FC<HealthProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'conditions' | 'allergies' | 'info'>('conditions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const selectedConditions = conditions
      .filter((c) => c.checked)
      .map((c) => c.name);

    try {
      await onSave({
        conditions: selectedConditions,
        allergies,
        medications,
        bloodType: basicInfo.bloodType,
        height: basicInfo.height,
        weight: basicInfo.weight,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save health profile:', error);
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
        aria-labelledby="health-profile-title"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 id="health-profile-title" className="text-xl font-bold text-gray-900">
              건강 프로필 설정
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

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'conditions'}
              aria-controls="conditions-panel"
              onClick={() => setActiveTab('conditions')}
              className={activeTab === 'conditions' ? 'tab-selected' : 'tab-unselected'}
            >
              <Heart size={16} className="inline mr-1" />
              질환
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'allergies'}
              aria-controls="allergies-panel"
              onClick={() => setActiveTab('allergies')}
              className={activeTab === 'allergies' ? 'tab-selected' : 'tab-unselected'}
            >
              <AlertCircle size={16} className="inline mr-1" />
              알레르기
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'info'}
              aria-controls="info-panel"
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
              <div role="tabpanel" id="conditions-panel" className="space-y-4">
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
                        aria-label={condition.name}
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
              <div role="tabpanel" id="allergies-panel" className="space-y-6">
                <div>
                  <label
                    htmlFor="allergy-input"
                    className="block text-sm font-medium text-gray-700 mb-3"
                  >
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
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      className="btn-primary px-4"
                      aria-label="알레르기 추가"
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
                          aria-label={`${allergy} 삭제`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="medication-input"
                    className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"
                  >
                    <Pill size={16} className="text-gray-400" />
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
                    />
                    <button
                      type="button"
                      onClick={addMedication}
                      className="btn-primary px-4"
                      aria-label="약물 추가"
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
                          aria-label={`${med} 삭제`}
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
              <div role="tabpanel" id="info-panel" className="space-y-4">
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
                        aria-label={`${type}형 선택`}
                        aria-pressed={basicInfo.bloodType === type}
                      >
                        {type}형
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="height"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      키 (cm)
                    </label>
                    <input
                      id="height"
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
                    <label
                      htmlFor="weight"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      몸무게 (kg)
                    </label>
                    <input
                      id="weight"
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
