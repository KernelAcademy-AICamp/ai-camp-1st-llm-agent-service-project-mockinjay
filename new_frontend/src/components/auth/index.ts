/**
 * Auth Components Export
 * Centralized export for all authentication-related components
 */

export { TermsAgreement } from './TermsAgreement';
export { TermsCheckbox, CustomCheckbox } from './TermsCheckbox';
export { DiseaseStageSelector } from './DiseaseStageSelector';
export { default as ProtectedRoute } from './ProtectedRoute';

export type {
  TermData,
  TermsData,
  TermsAgreements,
  TermsCheckboxProps,
  TermItemProps,
  TermsAgreementProps,
  AccountInfo,
  PersonalInfo,
  PasswordStrength,
  SignupFormData,
} from './types';
