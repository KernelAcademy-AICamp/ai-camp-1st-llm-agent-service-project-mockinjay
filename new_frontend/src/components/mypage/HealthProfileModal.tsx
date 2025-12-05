/**
 * HealthProfileModal Component
 * 건강 프로필 설정 모달
 */
import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Minus } from 'lucide-react';
import type { HealthProfile, HealthProfileUpdateRequest } from '../../types/mypage';
import { HEALTH_CONDITIONS, DIETARY_RESTRICTIONS } from '../../types/mypage';

interface HealthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HealthProfileUpdateRequest) => Promise<void>;
  currentProfile?: HealthProfile;
}

const HealthProfileModal: React.FC<HealthProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProfile,
}) => {
  // Form state
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [age, setAge] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [medications, setMedications] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Temporary inputs for adding items
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current profile
  useEffect(() => {
    if (isOpen) {
      if (currentProfile) {
        setHealthConditions(currentProfile.healthConditions || []);
        setAllergies(currentProfile.allergies || []);
        setDietaryRestrictions(currentProfile.dietaryRestrictions || []);
        setAge(currentProfile.age);
        setGender(currentProfile.gender || 'prefer_not_to_say');
        setMedications(currentProfile.medications || []);
        setNotes(currentProfile.notes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, currentProfile]);

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
    if (!currentProfile) return true;
    return (
      JSON.stringify(healthConditions) !== JSON.stringify(currentProfile.healthConditions || []) ||
      JSON.stringify(allergies) !== JSON.stringify(currentProfile.allergies || []) ||
      JSON.stringify(dietaryRestrictions) !== JSON.stringify(currentProfile.dietaryRestrictions || []) ||
      age !== currentProfile.age ||
      gender !== currentProfile.gender ||
      JSON.stringify(medications) !== JSON.stringify(currentProfile.medications || []) ||
      notes !== (currentProfile.notes || '')
    );
  };

  // Reset form
  const resetForm = () => {
    setHealthConditions([]);
    setAllergies([]);
    setDietaryRestrictions([]);
    setAge(undefined);
    setGender('prefer_not_to_say');
    setMedications([]);
    setNotes('');
    setNewAllergy('');
    setNewMedication('');
    setError(null);
  };

  // Toggle health condition
  const toggleHealthCondition = (condition: string) => {
    setHealthConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  // Toggle dietary restriction
  const toggleDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction]
    );
  };

  // Add allergy
  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  // Remove allergy
  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy));
  };

  // Add medication
  const addMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  // Remove medication
  const removeMedication = (medication: string) => {
    setMedications(medications.filter((m) => m !== medication));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      await onSave({
        healthConditions,
        allergies,
        dietaryRestrictions,
        age: age && age > 0 ? age : undefined,
        gender,
        medications,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError('건강 프로필 저장 중 오류가 발생했습니다.');
      console.error('Error updating health profile:', err);
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">건강 프로필 설정</h2>
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

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  나이
                </label>
                <input
                  id="age"
                  type="number"
                  value={age || ''}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="나이"
                  disabled={submitting}
                  min={1}
                  max={120}
                  className="input-field dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  성별
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  disabled={submitting}
                  className="input-field dark:bg-gray-700 dark:text-white"
                >
                  <option value="prefer_not_to_say">선택 안함</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>

            {/* Health Conditions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                건강 상태
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HEALTH_CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={healthConditions.includes(condition)}
                      onChange={() => toggleHealthCondition(condition)}
                      disabled={submitting}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                알레르기
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  placeholder="알레르기 항목 추가"
                  disabled={submitting}
                  className="input-field flex-1 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  disabled={submitting || !newAllergy.trim()}
                  className="btn-ghost flex items-center gap-1"
                >
                  <Plus size={16} /> 추가
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      disabled={submitting}
                      className="hover:text-red-900 dark:hover:text-red-200"
                    >
                      <Minus size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                식이 제한
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <label
                    key={restriction}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={dietaryRestrictions.includes(restriction)}
                      onChange={() => toggleDietaryRestriction(restriction)}
                      disabled={submitting}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{restriction}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                복용 중인 약물
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                  placeholder="약물명 추가"
                  disabled={submitting}
                  className="input-field flex-1 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addMedication}
                  disabled={submitting || !newMedication.trim()}
                  className="btn-ghost flex items-center gap-1"
                >
                  <Plus size={16} /> 추가
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medications.map((medication) => (
                  <span
                    key={medication}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                  >
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeMedication(medication)}
                      disabled={submitting}
                      className="hover:text-blue-900 dark:hover:text-blue-200"
                    >
                      <Minus size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                추가 메모
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="건강과 관련된 추가 정보를 입력하세요"
                disabled={submitting}
                rows={3}
                className="input-field resize-none dark:bg-gray-700 dark:text-white"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notes.length}/1000</p>
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

export default HealthProfileModal;
