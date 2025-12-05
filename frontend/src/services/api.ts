import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

import { env } from '../config/env';
import { storage } from '../utils/storage';
import { getCSRFToken, secureTokenStorage } from '../utils/security';

type FastAPIValidationDetail = {
  loc?: Array<string | number>;
  msg?: string;
  message?: string;
};

interface ApiErrorResponse {
  detail?: string | FastAPIValidationDetail | FastAPIValidationDetail[];
  message?: string;
  error?: string;
}

const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const CSRF_HEADER = 'X-CSRF-Token';
const TOKEN_STORAGE_KEY = 'careguide_token';
const USER_STORAGE_KEY = 'careguide_user';
const SESSION_STORAGE_KEY = 'careguide_session_id';
const PUBLIC_ENDPOINT_PATTERNS = ['/api/community', '/api/trends', '/api/session/create', '/api/terms'];
const PUBLIC_APP_PATHS = ['/', '/community', '/trends', '/quiz', '/login', '/signup'];

const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = secureTokenStorage.get() ?? storage.get<string>(TOKEN_STORAGE_KEY);
    const method = config.method?.toLowerCase();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (method && MUTATION_METHODS.has(method) && config.headers) {
      config.headers[CSRF_HEADER] = getCSRFToken();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;

    if (status) {
      const requestUrl = error.config?.url;
      const payload = error.response?.data;

      switch (status) {
        case 401:
          handleUnauthorized(requestUrl);
          break;
        case 403:
          toast.error(extractErrorMessage(payload) || '접근 권한이 없습니다.');
          break;
        case 404:
          toast.error(extractErrorMessage(payload) || '요청한 리소스를 찾을 수 없습니다.');
          break;
        case 422:
          toast.error(extractValidationErrors(payload) || '입력값을 다시 확인해주세요.');
          break;
        case 500:
          toast.error(extractErrorMessage(payload) || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          toast.error(extractErrorMessage(payload) || '요청 처리 중 오류가 발생했습니다.');
      }
    } else if (error.request) {
      toast.error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    } else {
      toast.error('요청을 준비하던 중 오류가 발생했습니다.');
    }

    if (env.isDevelopment) {
      console.error('[api] request failed', error);
    }

    return Promise.reject(error);
  }
);

function extractErrorMessage(payload?: ApiErrorResponse): string {
  if (!payload) {
    return '';
  }

  if (typeof payload.detail === 'string') {
    return payload.detail;
  }

  if (payload.message) {
    return payload.message;
  }

  if (payload.error) {
    return payload.error;
  }

  return '';
}

function extractValidationErrors(payload?: ApiErrorResponse): string {
  if (!payload) {
    return '';
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((detail) => formatValidationDetail(detail))
      .filter(Boolean)
      .join(', ');
  }

  if (payload.detail && typeof payload.detail === 'object') {
    return formatValidationDetail(payload.detail as FastAPIValidationDetail);
  }

  if (typeof payload.detail === 'string') {
    return payload.detail;
  }

  return payload.message || payload.error || '';
}

function formatValidationDetail(detail?: FastAPIValidationDetail): string {
  if (!detail) {
    return '';
  }

  const location = detail.loc
    ?.map((segment) => (typeof segment === 'string' || typeof segment === 'number' ? String(segment) : ''))
    .filter(Boolean)
    .join('.');

  const message = detail.msg || detail.message || '';

  if (location && message) {
    return `${location}: ${message}`;
  }

  return message || location || '';
}

function handleUnauthorized(requestUrl?: string): void {
  clearAuthState();

  const isPublicEndpoint = isPublicApiEndpoint(requestUrl);
  const isPublicRoute = isCurrentRoutePublic();

  if (isPublicEndpoint || isPublicRoute) {
    return;
  }

  toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');

  if (typeof window !== 'undefined') {
    window.location.replace('/login');
  }
}

function clearAuthState(): void {
  secureTokenStorage.clear();
  storage.remove(TOKEN_STORAGE_KEY);
  storage.remove(USER_STORAGE_KEY);
  storage.remove(SESSION_STORAGE_KEY);

  if (api.defaults.headers.common && 'Authorization' in api.defaults.headers.common) {
    delete api.defaults.headers.common.Authorization;
  }
}

function isPublicApiEndpoint(url?: string): boolean {
  if (!url) {
    return false;
  }

  return PUBLIC_ENDPOINT_PATTERNS.some((pattern) => url.includes(pattern));
}

function isCurrentRoutePublic(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const currentPath = window.location.pathname;
  return PUBLIC_APP_PATHS.some((path) => currentPath.startsWith(path));
}

export default api;
