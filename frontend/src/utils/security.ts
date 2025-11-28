// Security helpers for CSRF, XSS, token storage, etc. (CSRF, XSS, 토큰 보관 등 보안 도우미)

const CSRF_SESSION_KEY = 'app.security.csrfToken';
const TOKEN_STORAGE_KEY = 'app.security.token';
const CSRF_HEADER_KEY = 'X-CSRF-Token';
const STORAGE_PROBE_KEY = '__security_probe__';

const isBrowser = typeof window !== 'undefined';

// Resilient storage accessor (저장소 접근 시 예외를 예방)
const getStorage = (type: 'sessionStorage' | 'localStorage'): Storage | null => {
  if (!isBrowser) {
    return null;
  }

  try {
    const storage = window[type];
    storage.setItem(STORAGE_PROBE_KEY, STORAGE_PROBE_KEY);
    storage.removeItem(STORAGE_PROBE_KEY);
    return storage;
  } catch (error) {
    console.warn(`[security] ${type} unavailable`, error);
    return null;
  }
};

// Ensure Web Crypto is available (웹 크립토 사용 가능 여부 확인)
const ensureCrypto = (): Crypto => {
  const cryptoAPI = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!cryptoAPI || typeof cryptoAPI.getRandomValues !== 'function') {
    throw new Error('Web Crypto API is unavailable.');
  }
  return cryptoAPI;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

let csrfCache: string | null = null;

// Create a cryptographically safe CSRF token (암호학적으로 안전한 CSRF 토큰 생성)
export const generateCSRFToken = (): string => {
  const cryptoObj = ensureCrypto();
  const buffer = new Uint8Array(32);
  cryptoObj.getRandomValues(buffer);
  return bytesToHex(buffer);
};

// Fetch cached or persisted CSRF token (캐시/스토리지에 있는 CSRF 토큰 조회)
export const getCSRFToken = (): string => {
  if (csrfCache) {
    return csrfCache;
  }

  const storage = getStorage('sessionStorage');
  const stored = storage?.getItem(CSRF_SESSION_KEY);
  if (stored) {
    csrfCache = stored;
    return stored;
  }

  try {
    const token = generateCSRFToken();
    csrfCache = token;
    storage?.setItem(CSRF_SESSION_KEY, token);
    return token;
  } catch (error) {
    console.error('[security] Unable to generate CSRF token', error);
    csrfCache = Math.random().toString(16).slice(2); // fallback only if crypto fails
    return csrfCache;
  }
};

// Clear stored CSRF token (저장된 CSRF 토큰 초기화)
export const resetCSRFToken = (): void => {
  csrfCache = null;
  const storage = getStorage('sessionStorage');
  storage?.removeItem(CSRF_SESSION_KEY);
};

// Provide CSRF headers for API calls (API 호출용 CSRF 헤더 제공)
export const getCSRFHeaders = (): Record<string, string> => ({
  [CSRF_HEADER_KEY]: getCSRFToken(),
});

// Escape HTML to mitigate XSS (XSS 방지를 위한 HTML 이스케이프)
export const escapeHtml = (unsafe: string): string => {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return unsafe.replace(/[&<>"']/g, (char) => replacements[char] ?? char);
};

// Ensure URLs use safe schemes (안전한 프로토콜인지 확인)
export const isSafeUrl = (url: string): boolean => {
  if (!url) {
    return false;
  }

  try {
    const base = isBrowser ? window.location.origin : 'https://localhost';
    const parsed = new URL(url, base);
    const allowed = new Set(['http:', 'https:']);
    return allowed.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
};

// Recommend safe props for external links (외부 링크에 필요한 안전 속성)
export const getSafeExternalLinkProps = (): { target: '_blank'; rel: 'noopener noreferrer' } => ({
  target: '_blank',
  rel: 'noopener noreferrer',
});

export interface TokenStorageOptions {
  expiresIn?: number; // milliseconds (만료까지 남은 밀리초)
}

type TokenPayload = {
  token: string;
  expiresAt?: number;
};

let tokenCache: TokenPayload | null = null;

const isExpired = (payload: TokenPayload): boolean =>
  typeof payload.expiresAt === 'number' && payload.expiresAt <= Date.now();

const persistToken = (payload: TokenPayload | null): void => {
  const storage = getStorage('localStorage');
  if (!storage) {
    return;
  }

  try {
    if (!payload) {
      storage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      storage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (error) {
    console.warn('[security] Failed to persist token', error);
  }
};

const loadToken = (): TokenPayload | null => {
  const storage = getStorage('localStorage');
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as TokenPayload;
    return typeof parsed.token === 'string' ? parsed : null;
  } catch (error) {
    console.warn('[security] Corrupt token payload detected', error);
    storage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
};

const dropToken = (): void => {
  tokenCache = null;
  persistToken(null);
};

// Memory-first secure token storage (메모리 우선의 안전한 토큰 저장)
export const secureTokenStorage = {
  set: (token: string, options: TokenStorageOptions = {}): void => {
    const expiresAt =
      typeof options.expiresIn === 'number' && options.expiresIn > 0
        ? Date.now() + options.expiresIn
        : undefined;

    tokenCache = { token, expiresAt };
    persistToken(tokenCache);
  },
  get: (): string | null => {
    if (tokenCache && !isExpired(tokenCache)) {
      return tokenCache.token;
    }

    const persisted = loadToken();
    if (persisted && !isExpired(persisted)) {
      tokenCache = persisted;
      return persisted.token;
    }

    dropToken();
    return null;
  },
  clear: (): void => {
    dropToken();
  },
};

const rateLimitBuckets: Record<string, number[]> = {};

// Basic in-memory rate limiter (간단한 메모리 레이트 리미터)
export const checkRateLimit = (
  action: string,
  maxRequests = 5,
  windowMs = 60_000,
): boolean => {
  if (!action) {
    return false;
  }

  const now = Date.now();
  const timestamps = rateLimitBuckets[action] ?? [];
  const recent = timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= maxRequests) {
    rateLimitBuckets[action] = recent;
    return false;
  }

  recent.push(now);
  rateLimitBuckets[action] = recent;
  return true;
};

const PASSWORD_MIN_LENGTH = 8;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()[\]{}\-_=+|:;"',.<>\/?`~\\]/;

// Validate password strength (비밀번호 복잡도 검증)
export const validatePasswordStrength = (
  password: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number.');
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    errors.push('Password must include at least one special character.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
