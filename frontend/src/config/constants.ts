/**
 * Centralized constants for shared application configuration.
 */

export const STORAGE_KEYS = {
  // Authentication
  TOKEN: 'careguide_token',
  TOKEN_EXPIRY: 'careguide_token_expiry',
  USER: 'careguide_user',
  USER_ID: 'careguide_user_id',
  SESSION_ID: 'careguide_session_id',
  ANONYMOUS_ID: 'careguide_anonymous_id',
  CSRF_TOKEN: 'careguide_csrf_token',

  // Chat
  CHAT_MESSAGES: 'careguide_chat_messages',
  CHAT_HISTORIES: 'careguide_chat_histories',
  LAST_ACTIVE: 'careguide_last_active',

  // Quiz
  ANONYMOUS_QUIZ_ID: 'careguide_anonymous_quiz_id',
  QUIZ_PROMPT_SHOWN: 'careguide_quiz_prompt_shown',
  QUIZ_PROMPT_DISMISSED: 'careguide_quiz_prompt_dismissed',
  QUIZ_PROMPT_SHOWN_DATE: 'careguide_quiz_prompt_shown_date',
  USER_MESSAGE_COUNT: 'careguide_user_message_count',

  // Bookmarks
  BOOKMARKS: 'careguide_bookmarks',

  // App Settings
  THEME: 'careguide_theme',
  LANGUAGE: 'careguide_language',
  PREFERENCES: 'careguide_preferences',

  // Feature Flags
  FEATURE_FLAGS: 'careguide_feature_flags',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export const TIMEOUTS = {
  API_TIMEOUT: 15_000,
  SESSION_TIMEOUT: 60 * 60 * 1000,
  IDLE_TIMEOUT: 5 * 60 * 1000,
} as const;

export const API_ENDPOINTS = {
  // Diet Care
  NUTRITION_ANALYZE: '/api/diet-care/nutri-coach',

  // Session
  SESSION_CREATE: '/api/session/create',

  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',

  // User
  USER_PROFILE: '/api/user/profile',

  // Community
  COMMUNITY_POSTS: '/api/community/posts',
  COMMUNITY_CREATE_POST: '/api/community/posts',

  // Quiz
  QUIZ_START: '/api/quiz/start',
  QUIZ_SUBMIT: '/api/quiz/submit',

  // Trends
  TRENDS_DATA: '/api/trends',

  // Chat
  CHAT_MESSAGES: '/api/chat/messages',
} as const;

export const APP_DEFAULTS = {
  LANGUAGE: 'ko' as const,
  THEME: 'light' as const,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'] as const,
} as const;
