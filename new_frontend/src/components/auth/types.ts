/**
 * Auth Component Types
 * Used for Terms Agreement and Signup flow
 */

export interface TermData {
  title: string;
  required: boolean;
  content: string;
}

export interface TermsData {
  service_terms: TermData;
  privacy_required: TermData;
  privacy_optional: TermData;
  marketing: TermData;
}

export interface TermsAgreements {
  all: boolean;
  service: boolean;
  privacyRequired: boolean;
  privacyOptional: boolean;
  marketing: boolean;
}

export interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface TermItemProps {
  title: string;
  content: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  expanded: boolean;
  onToggle: () => void;
  required?: boolean;
}

export interface TermsAgreementProps {
  termsData: TermsData;
  agreements: TermsAgreements;
  onAgreementChange: (key: keyof TermsAgreements, checked: boolean) => void;
  onAllAgreementChange: (checked: boolean) => void;
  canProceed: boolean;
  onNext: () => void;
}

export interface AccountInfo {
  email: string;
  password: string;
  passwordConfirm: string;
  emailChecked: boolean;
}

export interface PersonalInfo {
  nickname: string;
  gender: '' | '남성' | '여성' | '기타';
  userType: 'general' | 'patient' | 'researcher';
  birthDate: string;
  height: string;
  weight: string;
  nicknameChecked: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: { met: boolean; text: string }[];
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  profile: 'general' | 'patient' | 'researcher';
  nickname: string;
  gender?: '남성' | '여성' | '기타';
  birthDate?: string;
  height?: number;
  weight?: number;
  diseaseInfo?: string;
  agreements: {
    service: boolean;
    privacyRequired: boolean;
    privacyOptional: boolean;
    marketing: boolean;
  };
}
