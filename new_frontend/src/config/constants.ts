/**
 * 중앙화된 스토리지 키 상수 (Centralized Storage Key Constants)
 *
 * 이 파일은 localStorage에서 사용되는 모든 키를 중앙에서 관리합니다.
 * This file centralizes all localStorage keys used throughout the application.
 */

export const STORAGE_KEYS = {
  // 인증 관련 (Authentication)
  TOKEN: 'careguide_token',
  USER: 'careguide_user',
  USER_ID: 'careguide_user_id',
  SESSION_ID: 'careguide_session_id',
  ANONYMOUS_ID: 'careguide_anonymous_id',

  // 채팅 관련 (Chat)
  CHAT_MESSAGES: 'careguide_chat_messages',
  CHAT_HISTORIES: 'careguide_chat_histories',
  LAST_ACTIVE: 'careguide_last_active',

  // 퀴즈 관련 (Quiz)
  ANONYMOUS_QUIZ_ID: 'careguide_anonymous_quiz_id',
  QUIZ_PROMPT_SHOWN: 'careguide_quiz_prompt_shown',
  QUIZ_PROMPT_DISMISSED: 'careguide_quiz_prompt_dismissed',
  QUIZ_PROMPT_SHOWN_DATE: 'careguide_quiz_prompt_shown_date',
  USER_MESSAGE_COUNT: 'careguide_user_message_count',

  // 북마크 관련 (Bookmarks)
  BOOKMARKS: 'careguide_bookmarks',

  // 앱 설정 (App Settings)
  THEME: 'careguide_theme',
  LANGUAGE: 'careguide_language',
  PREFERENCES: 'careguide_preferences',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * 세션 타임아웃 상수 (Session Timeout Constants)
 */
export const TIMEOUTS = {
  SESSION_TIMEOUT: 60 * 60 * 1000,  // 1시간 (1 hour)
  IDLE_TIMEOUT: 5 * 60 * 1000,      // 5분 (5 minutes)
} as const;

/**
 * API 엔드포인트 (API Endpoints)
 */
export const API_ENDPOINTS = {
  // Diet Care
  NUTRITION_ANALYZE: '/api/diet-care/nutri-coach',

  // Session
  SESSION_CREATE: '/api/session/create',

  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',

  // Community
  COMMUNITY_POSTS: '/api/community/posts',
  COMMUNITY_CREATE_POST: '/api/community/posts',

  // Quiz
  QUIZ_START: '/api/quiz/start',
  QUIZ_SUBMIT: '/api/quiz/submit',

  // Trends
  TRENDS_DATA: '/api/trends',
} as const;

/**
 * 앱 설정 기본값 (App Configuration Defaults)
 */
export const APP_DEFAULTS = {
  LANGUAGE: 'ko' as const,
  THEME: 'light' as const,
} as const;

/**
 * 페이지네이션 상수 (Pagination Constants)
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * 파일 업로드 제한 (File Upload Limits)
 */
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'] as const,
} as const;
