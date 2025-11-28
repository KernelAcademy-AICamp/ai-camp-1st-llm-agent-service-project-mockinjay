/**
 * ChangePasswordPage - Password change page
 * 비밀번호 변경 페이지
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ChangePasswordPage: React.FC = () => {
  useAuth(); // Ensure user is authenticated
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [validations, setValidations] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false,
  });

  const validatePassword = (password: string, confirmPassword: string) => {
    setValidations({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0,
    });
  };

  const handleNewPasswordChange = (value: string) => {
    setFormData({ ...formData, newPassword: value });
    validatePassword(value, formData.confirmPassword);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData({ ...formData, confirmPassword: value });
    validatePassword(formData.newPassword, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    // Validate all requirements
    if (!validations.minLength || !validations.hasNumber || !validations.hasSpecial || !validations.passwordsMatch) {
      setError('모든 비밀번호 요구사항을 충족해주세요.');
      setIsSaving(false);
      return;
    }

    try {
      await api.put('/api/auth/change-password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${valid ? 'text-green-600' : 'text-gray-500'}`}>
      <CheckCircle size={16} className={valid ? 'text-green-600' : 'text-gray-300'} />
      {text}
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">비밀번호 변경</h1>
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
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lock className="inline-block mr-2" size={16} />
            현재 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
              placeholder="현재 비밀번호를 입력하세요"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            새 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
              placeholder="새 비밀번호를 입력하세요"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            새 비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
              placeholder="새 비밀번호를 다시 입력하세요"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-2">비밀번호 요구사항</p>
          <ValidationItem valid={validations.minLength} text="최소 8자 이상" />
          <ValidationItem valid={validations.hasNumber} text="숫자 포함" />
          <ValidationItem valid={validations.hasSpecial} text="특수문자 포함" />
          <ValidationItem valid={validations.passwordsMatch} text="비밀번호 일치" />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving || !validations.minLength || !validations.hasNumber || !validations.hasSpecial || !validations.passwordsMatch}
          className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              변경 중...
            </>
          ) : (
            <>
              <Save size={20} />
              비밀번호 변경
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
