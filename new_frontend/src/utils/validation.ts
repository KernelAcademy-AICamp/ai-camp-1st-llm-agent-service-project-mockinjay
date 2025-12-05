/**
 * Enhanced Validation Utilities
 * Provides real-time validation with debouncing for signup forms
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { checkEmailDuplicate, checkNicknameDuplicate } from '../services/api';

/**
 * Password strength validation
 */
export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: { met: boolean; text: string }[];
}

export const getPasswordStrength = (password: string): PasswordStrength => {
  const requirements = [
    { met: password.length >= 6, text: '6자 이상' },
    { met: password.length >= 8, text: '8자 이상 (권장)' },
    { met: /[A-Z]/.test(password), text: '대문자 포함' },
    { met: /[0-9]/.test(password), text: '숫자 포함' },
    { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: '특수문자 포함' },
  ];

  const score = requirements.filter(r => r.met).length;

  if (score <= 1) return { score, label: '매우 약함', color: 'bg-red-500', requirements };
  if (score === 2) return { score, label: '약함', color: 'bg-orange-500', requirements };
  if (score === 3) return { score, label: '보통', color: 'bg-yellow-500', requirements };
  if (score === 4) return { score, label: '강함', color: 'bg-green-500', requirements };
  return { score, label: '매우 강함', color: 'bg-emerald-500', requirements };
};

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Birth year validation (1900-current year)
 */
export const isValidBirthYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
};

/**
 * Birth date validation
 */
export const isValidBirthDate = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = new Date(dateString);
  const today = new Date();

  // Check if date is valid
  if (isNaN(date.getTime())) return false;

  // Check if date is not in the future
  if (date > today) return false;

  // Check if date is reasonable (not before 1900)
  const year = date.getFullYear();
  return year >= 1900 && year <= today.getFullYear();
};

/**
 * Debounce hook for async validation
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Email duplicate check with debouncing
 */
export interface EmailValidationResult {
  isChecking: boolean;
  error: string | null;
  isAvailable: boolean;
  isChecked: boolean;
}

export const useEmailValidation = (email: string, debounceMs: number = 500) => {
  const [state, setState] = useState<EmailValidationResult>({
    isChecking: false,
    error: null,
    isAvailable: false,
    isChecked: false,
  });

  const debouncedEmail = useDebounce(email, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const validateEmail = async () => {
      // Reset state if email is empty or invalid
      if (!debouncedEmail || !isValidEmail(debouncedEmail)) {
        setState({
          isChecking: false,
          error: debouncedEmail && !isValidEmail(debouncedEmail)
            ? '올바른 이메일 형식이 아닙니다.'
            : null,
          isAvailable: false,
          isChecked: false,
        });
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState(prev => ({ ...prev, isChecking: true, error: null }));

      try {
        const result = await checkEmailDuplicate(debouncedEmail);

        setState({
          isChecking: false,
          error: result.available ? null : result.message,
          isAvailable: result.available,
          isChecked: true,
        });
      } catch (error) {
        // Only set error if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setState({
            isChecking: false,
            error: '이메일 확인 중 오류가 발생했습니다.',
            isAvailable: false,
            isChecked: false,
          });
        }
      }
    };

    validateEmail();

    return () => {
      // Cleanup: abort ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedEmail]);

  const manualCheck = useCallback(async () => {
    if (!email || !isValidEmail(email)) {
      setState({
        isChecking: false,
        error: email ? '올바른 이메일 형식이 아닙니다.' : '이메일을 입력해주세요.',
        isAvailable: false,
        isChecked: false,
      });
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const result = await checkEmailDuplicate(email);

      setState({
        isChecking: false,
        error: result.available ? null : result.message,
        isAvailable: result.available,
        isChecked: result.available,
      });
    } catch (error) {
      setState({
        isChecking: false,
        error: '이메일 확인 중 오류가 발생했습니다.',
        isAvailable: false,
        isChecked: false,
      });
    }
  }, [email]);

  return { ...state, manualCheck };
};

/**
 * Nickname duplicate check with debouncing
 */
export interface NicknameValidationResult {
  isChecking: boolean;
  error: string | null;
  isAvailable: boolean;
  isChecked: boolean;
}

export const useNicknameValidation = (nickname: string, debounceMs: number = 500) => {
  const [state, setState] = useState<NicknameValidationResult>({
    isChecking: false,
    error: null,
    isAvailable: false,
    isChecked: false,
  });

  const debouncedNickname = useDebounce(nickname, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const validateNickname = async () => {
      // Reset state if nickname is empty or too short
      if (!debouncedNickname || debouncedNickname.length < 2) {
        setState({
          isChecking: false,
          error: debouncedNickname && debouncedNickname.length < 2
            ? '닉네임은 2자 이상이어야 합니다.'
            : null,
          isAvailable: false,
          isChecked: false,
        });
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState(prev => ({ ...prev, isChecking: true, error: null }));

      try {
        const result = await checkNicknameDuplicate(debouncedNickname);

        setState({
          isChecking: false,
          error: result.available ? null : result.message,
          isAvailable: result.available,
          isChecked: true,
        });
      } catch (error) {
        // Only set error if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setState({
            isChecking: false,
            error: '닉네임 확인 중 오류가 발생했습니다.',
            isAvailable: false,
            isChecked: false,
          });
        }
      }
    };

    validateNickname();

    return () => {
      // Cleanup: abort ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedNickname]);

  const manualCheck = useCallback(async () => {
    if (!nickname) {
      setState({
        isChecking: false,
        error: '닉네임을 입력해주세요.',
        isAvailable: false,
        isChecked: false,
      });
      return;
    }

    if (nickname.length < 2) {
      setState({
        isChecking: false,
        error: '닉네임은 2자 이상이어야 합니다.',
        isAvailable: false,
        isChecked: false,
      });
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const result = await checkNicknameDuplicate(nickname);

      setState({
        isChecking: false,
        error: result.available ? null : result.message,
        isAvailable: result.available,
        isChecked: result.available,
      });
    } catch (error) {
      setState({
        isChecking: false,
        error: '닉네임 확인 중 오류가 발생했습니다.',
        isAvailable: false,
        isChecked: false,
      });
    }
  }, [nickname]);

  return { ...state, manualCheck };
};
