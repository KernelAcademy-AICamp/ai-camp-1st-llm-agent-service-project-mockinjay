/**
 * MyPage Types
 * 마이페이지 관련 타입 정의
 *
 * Backend API와 일치하도록 설계된 타입 정의
 * Backend API: /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/api/mypage.py
 */

/**
 * User Profile Data
 * 사용자 프로필 정보
 *
 * Backend Response: UserProfileResponse
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profileImage?: string; // Backend primary field
  profileImageUrl?: string; // Alias for frontend compatibility (backend also returns this)
  profile: 'general' | 'patient' | 'researcher';
  role: string;
  createdAt: string; // ISO 8601 datetime string
}

/**
 * Health Profile Data
 * 건강 프로필 정보
 *
 * Backend Response: HealthProfileResponse
 */
export interface HealthProfile {
  userId: string;
  conditions: string[]; // Backend primary field
  healthConditions: string[]; // Alias for frontend compatibility (backend also returns this)
  allergies: string[];
  dietaryRestrictions: string[];
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  medications?: string[]; // Frontend extended field
  notes?: string; // Frontend extended field
  updatedAt?: string; // ISO 8601 datetime string
}

/**
 * User Preferences
 * 사용자 설정
 *
 * Backend Response: UserPreferencesResponse
 */
export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    community: boolean;
    trends: boolean; // Backend uses 'trends' instead of 'healthTips' or 'paperUpdates'
    healthTips?: boolean; // Frontend compatibility
    paperUpdates?: boolean; // Frontend compatibility
  };
  updatedAt?: string; // ISO 8601 datetime string
}

/**
 * Paper Data
 * 논문 메타데이터 (Backend의 paperData 구조)
 */
export interface PaperData {
  title: string;
  authors: string[];
  abstract: string;
  pub_date: string;
  journal?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Bookmarked Paper
 * 북마크한 논문
 *
 * Backend Response: BookmarkResponse
 * Note: Backend stores paper info in paperData, but frontend components also
 * access direct properties for convenience. Both patterns are supported.
 */
export interface BookmarkedPaper {
  id: string;
  userId: string;
  paperId: string; // PMID or unique identifier
  paperData?: PaperData; // Backend stores paper metadata as nested object
  createdAt: string; // ISO 8601 datetime string
  // Direct access properties (populated from paperData or set directly)
  title?: string;
  authors?: string[];
  abstract?: string;
  pubDate?: string;
  pub_date?: string; // Alternative field name
  journal?: string;
  url?: string;
  tags?: string[];
  notes?: string;
  bookmarkedAt?: string; // Alias for createdAt
}

/**
 * Bookmarks Response
 * 북마크 목록 응답 (with pagination)
 *
 * Backend Response: GET /api/mypage/bookmarks
 */
export interface BookmarksResponse {
  bookmarks: BookmarkedPaper[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Post Data
 * 게시글 정보
 *
 * Backend Response: Posts from MongoDB
 */
export interface Post {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  postType: 'BOARD' | 'CHALLENGE' | 'SURVEY';
  imageUrls?: string[];
  thumbnailUrl?: string;
  likes: number;
  commentCount: number;
  viewCount: number;
  // Aliases for frontend compatibility
  comments?: number; // Alias for commentCount
  views?: number; // Alias for viewCount
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  isPinned: boolean;
  isDeleted: boolean;
}

/**
 * Posts Response
 * 게시글 목록 응답 (with pagination)
 *
 * Backend Response: GET /api/mypage/posts
 */
export interface PostsResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * User Level Data
 * 사용자 레벨 정보
 *
 * Backend Response: UserLevelResponse
 */
export interface UserLevelData {
  userId: string;
  level: number; // 1-5
  currentXp: number;
  requiredXp: number;
  title: string; // e.g., '새싹', '초보', '중급', '고수', '전문가'
  nextLevelTitle?: string;
  badges: Badge[];
  updatedAt?: string; // ISO 8601 datetime string
}

/**
 * Badge
 * 배지 정보
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string; // ISO 8601 datetime string
}

/**
 * Points Data
 * 포인트 정보
 *
 * Backend Response: PointsDataResponse
 */
export interface PointsData {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  updatedAt?: string; // ISO 8601 datetime string
}

/**
 * Points History Item
 * 포인트 히스토리 항목
 *
 * Backend Response: PointsHistoryItemResponse
 */
export interface PointsHistoryItem {
  id: string;
  userId: string;
  amount: number; // Positive for earn, negative for spend
  type: 'earn' | 'spend' | 'expire';
  source: string; // e.g., 'quiz_completion', 'daily_login'
  description: string;
  createdAt: string; // ISO 8601 datetime string
}

/**
 * Points History Response
 * 포인트 히스토리 응답 (with pagination)
 *
 * Backend Response: PointsHistoryResponse
 */
export interface PointsHistoryResponse {
  history: PointsHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * User Notification
 * 사용자 알림
 */
export interface UserNotification {
  id: string;
  userId: string;
  type: 'comment' | 'like' | 'follow' | 'system' | 'paper_update';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Profile Update Request
 * 프로필 업데이트 요청
 *
 * Backend Request: UserProfileUpdateRequest
 */
export interface ProfileUpdateRequest {
  fullName?: string;
  bio?: string;
  profileImage?: string; // Backend uses 'profileImage'
}

/**
 * Health Profile Update Request
 * 건강 프로필 업데이트 요청
 *
 * Backend Request: HealthProfileUpdateRequest
 */
export interface HealthProfileUpdateRequest {
  conditions?: string[]; // Backend uses 'conditions'
  healthConditions?: string[]; // Alias for frontend compatibility
  allergies?: string[];
  dietaryRestrictions?: string[];
  age?: number; // 1-150
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  medications?: string[]; // Frontend extended field (may not be saved to backend)
  notes?: string; // Frontend extended field (may not be saved to backend)
}

/**
 * Preferences Update Request
 * 설정 업데이트 요청
 *
 * Backend Request: UserPreferencesUpdateRequest
 */
export interface PreferencesUpdateRequest {
  theme?: 'light' | 'dark' | 'system';
  language?: 'ko' | 'en';
  notifications?: {
    email?: boolean;
    push?: boolean;
    community?: boolean;
    trends?: boolean; // Backend uses 'trends'
    healthTips?: boolean; // Frontend compatibility
    paperUpdates?: boolean; // Frontend compatibility
  };
}

/**
 * Bookmark Create Request
 * 북마크 생성 요청
 *
 * Backend Request: BookmarkCreateRequest
 */
export interface BookmarkCreateRequest {
  paperId: string;
  paperData: PaperData; // Complete paper metadata
}

/**
 * Points History Filters
 * 포인트 히스토리 필터 (query parameters)
 */
export interface PointsHistoryFilters {
  limit?: number; // Default: 20, max: 50
  offset?: number; // Default: 0
  type_filter?: 'earn' | 'spend' | 'expire';
  source_filter?: string;
}

// ============================================================================
// Additional Types (Not directly from backend but useful for frontend)
// ============================================================================

/**
 * Notification Settings
 * 알림 설정 (Extended notification preferences)
 */
export interface NotificationSettings {
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  types: {
    comments: boolean;
    likes: boolean;
    follows: boolean;
    system: boolean;
    paperUpdates: boolean;
    healthTips: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  updatedAt?: string;
}

/**
 * Notification Settings Update Request
 * 알림 설정 업데이트 요청
 */
export interface NotificationSettingsUpdateRequest {
  email?: {
    enabled?: boolean;
    frequency?: 'instant' | 'daily' | 'weekly';
  };
  push?: {
    enabled?: boolean;
    sound?: boolean;
    vibration?: boolean;
  };
  types?: {
    comments?: boolean;
    likes?: boolean;
    follows?: boolean;
    system?: boolean;
    paperUpdates?: boolean;
    healthTips?: boolean;
  };
  quietHours?: {
    enabled?: boolean;
    startTime?: string;
    endTime?: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Available health conditions
 * 선택 가능한 건강 상태
 */
export const HEALTH_CONDITIONS = [
  '당뇨병',
  '고혈압',
  '신장질환',
  '심장질환',
  '갑상선질환',
  '천식',
  '관절염',
  '고지혈증',
  '골다공증',
  '암',
  '기타',
] as const;

/**
 * Available dietary restrictions
 * 선택 가능한 식이 제한
 */
export const DIETARY_RESTRICTIONS = [
  '채식주의',
  '비건',
  '저염식',
  '저당식',
  '저지방식',
  '글루텐프리',
  '유제품 제한',
  '기타',
] as const;

/**
 * Points earned by action type (from backend)
 * 행동별 포인트 획득량
 */
export const POINTS_BY_ACTION = {
  quiz_completion: 10,
  daily_login: 5,
  community_post: 15,
  community_comment: 5,
  community_like_received: 2,
  bookmark_paper: 3,
  diet_log: 10,
  health_check: 5,
} as const;

/**
 * Level configuration (from backend)
 * 레벨 시스템 설정
 */
export const LEVEL_CONFIG = [
  { level: 1, name: '새싹', min_xp: 0, max_xp: 100 },
  { level: 2, name: '초보', min_xp: 100, max_xp: 300 },
  { level: 3, name: '중급', min_xp: 300, max_xp: 600 },
  { level: 4, name: '고수', min_xp: 600, max_xp: 1000 },
  { level: 5, name: '전문가', min_xp: 1000, max_xp: null }, // Max level
] as const;
