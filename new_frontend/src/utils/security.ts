/**
 * Security Utilities for CareGuide Frontend
 * CareGuide 프론트엔드 보안 유틸리티
 *
 * CSRF 보호, XSS 방지, 토큰 관리 등의 보안 기능을 제공합니다.
 * Provides security features like CSRF protection, XSS prevention, token management.
 */

import { STORAGE_KEYS } from '../config/constants';
import { storage } from './storage';

// ============================================================
// CSRF Protection
// CSRF 보호
// ============================================================

/**
 * CSRF 토큰을 생성합니다.
 * Generates a CSRF token.
 *
 * 암호학적으로 안전한 랜덤 토큰을 생성합니다.
 * Generates a cryptographically secure random token.
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF 토큰을 가져오거나 새로 생성합니다.
 * Gets or generates a CSRF token.
 *
 * 세션 스토리지에서 기존 토큰을 가져오거나 새 토큰을 생성합니다.
 * Gets existing token from session storage or generates a new one.
 */
export function getCSRFToken(): string {
  const CSRF_KEY = 'careguide_csrf_token';

  try {
    let token = sessionStorage.getItem(CSRF_KEY);

    if (!token) {
      token = generateCSRFToken();
      sessionStorage.setItem(CSRF_KEY, token);
    }

    return token;
  } catch (error) {
    // sessionStorage 사용 불가 시 매번 새 토큰 생성
    // Generate new token each time if sessionStorage unavailable
    console.warn('sessionStorage unavailable, generating ephemeral CSRF token');
    return generateCSRFToken();
  }
}

/**
 * CSRF 토큰을 초기화합니다.
 * Resets the CSRF token.
 *
 * 로그아웃이나 세션 종료 시 호출됩니다.
 * Called on logout or session end.
 */
export function resetCSRFToken(): void {
  try {
    sessionStorage.removeItem('careguide_csrf_token');
  } catch (error) {
    console.warn('Could not reset CSRF token:', error);
  }
}

/**
 * API 요청에 CSRF 헤더를 추가하는 설정을 반환합니다.
 * Returns config to add CSRF header to API requests.
 */
export function getCSRFHeaders(): Record<string, string> {
  return {
    'X-CSRF-Token': getCSRFToken(),
  };
}

// ============================================================
// XSS Prevention
// XSS 방지
// ============================================================

/**
 * HTML 이스케이프를 수행합니다.
 * Performs HTML escaping.
 *
 * 사용자 입력을 안전하게 표시할 때 사용합니다.
 * Used to safely display user input.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * URL이 안전한지 검증합니다.
 * Validates if a URL is safe.
 *
 * javascript:, data:, vbscript: 등의 위험한 프로토콜을 차단합니다.
 * Blocks dangerous protocols like javascript:, data:, vbscript:.
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url, window.location.origin);
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    return !dangerousProtocols.includes(parsed.protocol.toLowerCase());
  } catch {
    // 상대 경로는 허용
    // Allow relative paths
    return !url.toLowerCase().startsWith('javascript:') &&
           !url.toLowerCase().startsWith('data:') &&
           !url.toLowerCase().startsWith('vbscript:');
  }
}

/**
 * 안전한 외부 링크를 생성합니다.
 * Creates a safe external link.
 *
 * target="_blank"에 보안 속성을 추가합니다.
 * Adds security attributes to target="_blank".
 */
export function getSafeExternalLinkProps(): Record<string, string> {
  return {
    target: '_blank',
    rel: 'noopener noreferrer nofollow',
  };
}

// ============================================================
// Token Security
// 토큰 보안
// ============================================================

/**
 * 토큰 저장 옵션
 * Token storage options
 */
export interface TokenStorageOptions {
  /**
   * 메모리에만 저장 (더 안전하지만 새로고침 시 사라짐)
   * Store in memory only (more secure but lost on refresh)
   */
  memoryOnly?: boolean;
  /**
   * 토큰 만료 시간 (밀리초)
   * Token expiration time (milliseconds)
   */
  expiresIn?: number;
}

// 메모리 토큰 저장소 (XSS 공격 방지용)
// In-memory token storage (for XSS attack prevention)
let memoryToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * 보안 토큰 저장소 클래스
 * Secure token storage class
 *
 * localStorage 대신 메모리 저장을 지원하여 XSS 공격에 더 안전합니다.
 * Supports memory storage instead of localStorage for better XSS protection.
 */
export const secureTokenStorage = {
  /**
   * 토큰을 저장합니다.
   * Stores a token.
   */
  set(token: string, options: TokenStorageOptions = {}): void {
    const { memoryOnly = false, expiresIn } = options;

    memoryToken = token;

    if (expiresIn) {
      tokenExpiry = Date.now() + expiresIn;
    }

    // localStorage 저장 (옵션)
    // localStorage storage (optional)
    if (!memoryOnly) {
      storage.set(STORAGE_KEYS.TOKEN, token);
      if (expiresIn) {
        storage.set(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry);
      }
    }
  },

  /**
   * 토큰을 가져옵니다.
   * Gets the token.
   */
  get(): string | null {
    // 메모리 토큰 우선
    // Memory token first
    if (memoryToken) {
      // 만료 확인
      // Check expiration
      if (tokenExpiry && Date.now() > tokenExpiry) {
        this.clear();
        return null;
      }
      return memoryToken;
    }

    // localStorage 폴백
    // localStorage fallback
    const storedToken = storage.get<string>(STORAGE_KEYS.TOKEN);
    const storedExpiry = storage.get<number>(STORAGE_KEYS.TOKEN_EXPIRY);

    if (storedToken) {
      if (storedExpiry && Date.now() > storedExpiry) {
        this.clear();
        return null;
      }
      // 메모리에 복원
      // Restore to memory
      memoryToken = storedToken;
      tokenExpiry = storedExpiry ?? null;
      return storedToken;
    }

    return null;
  },

  /**
   * 토큰을 삭제합니다.
   * Clears the token.
   */
  clear(): void {
    memoryToken = null;
    tokenExpiry = null;
    storage.remove(STORAGE_KEYS.TOKEN);
    storage.remove(STORAGE_KEYS.TOKEN_EXPIRY);
  },

  /**
   * 토큰이 존재하는지 확인합니다.
   * Checks if token exists.
   */
  has(): boolean {
    return this.get() !== null;
  },
};

// ============================================================
// Input Validation
// 입력 검증
// ============================================================

/**
 * 이메일 형식을 검증합니다.
 * Validates email format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 비밀번호 강도를 검증합니다.
 * Validates password strength.
 *
 * 최소 8자, 대문자, 소문자, 숫자, 특수문자 포함 권장
 * Recommended: min 8 chars, uppercase, lowercase, number, special char
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('대문자를 포함해주세요.');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('소문자를 포함해주세요.');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('숫자를 포함해주세요.');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('특수문자를 포함해주세요.');
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}

/**
 * 사용자 입력을 정제합니다.
 * Sanitizes user input.
 *
 * 앞뒤 공백 제거 및 연속 공백 정리
 * Trims whitespace and normalizes consecutive spaces
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ');
}

// ============================================================
// Rate Limiting (Client-side)
// 클라이언트 측 속도 제한
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * 클라이언트 측 속도 제한을 확인합니다.
 * Checks client-side rate limiting.
 *
 * API 호출 전에 호출하여 서버 부하를 줄입니다.
 * Call before API calls to reduce server load.
 *
 * @param key - 속도 제한 키 (예: 'login', 'signup')
 * @param maxRequests - 허용되는 최대 요청 수
 * @param windowMs - 시간 창 (밀리초)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remainingRequests: number; resetIn: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    // 새 창 시작
    // Start new window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetIn: windowMs,
    };
  }

  if (limit.count >= maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetIn: limit.resetTime - now,
    };
  }

  limit.count += 1;
  return {
    allowed: true,
    remainingRequests: maxRequests - limit.count,
    resetIn: limit.resetTime - now,
  };
}

/**
 * 속도 제한을 초기화합니다.
 * Resets rate limit for a key.
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
