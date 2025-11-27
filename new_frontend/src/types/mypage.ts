/**
 * MyPage Types
 * 마이페이지 관련 타입 정의
 */

/**
 * User Profile Data
 * 사용자 프로필 정보
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profileImageUrl?: string;
  profile?: 'general' | 'patient' | 'researcher';
  role?: string;
}

/**
 * Health Profile Data
 * 건강 프로필 정보
 */
export interface HealthProfile {
  userId: string;
  healthConditions: string[]; // e.g., ['당뇨', '고혈압', '신장질환']
  allergies: string[]; // e.g., ['땅콩', '새우']
  dietaryRestrictions: string[]; // e.g., ['채식주의', '저염식']
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  medications?: string[]; // Current medications
  notes?: string; // Additional health notes
  updatedAt?: string;
}

/**
 * User Preferences
 * 사용자 설정
 */
export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    community: boolean;
    healthTips: boolean;
    paperUpdates: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
  };
  updatedAt?: string;
}

/**
 * Bookmarked Paper
 * 북마크한 논문
 */
export interface BookmarkedPaper {
  id: string;
  userId: string;
  paperId: string; // PMID
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  abstract: string;
  url: string;
  tags?: string[];
  notes?: string;
  bookmarkedAt: string;
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

/**
 * API Request Types
 */
export interface ProfileUpdateRequest {
  fullName?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface HealthProfileUpdateRequest {
  healthConditions?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  medications?: string[];
  notes?: string;
}

export interface PreferencesUpdateRequest {
  theme?: 'light' | 'dark' | 'system';
  language?: 'ko' | 'en';
  notifications?: {
    email?: boolean;
    push?: boolean;
    community?: boolean;
    healthTips?: boolean;
    paperUpdates?: boolean;
  };
  privacy?: {
    showProfile?: boolean;
    showActivity?: boolean;
  };
}

/**
 * User Level Data
 * 사용자 레벨 정보
 */
export interface UserLevelData {
  userId: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  title: string;
  nextLevelTitle?: string;
  badges: Badge[];
  updatedAt?: string;
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
  earnedAt: string;
}

/**
 * Points Data
 * 포인트 정보
 */
export interface PointsData {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  history: PointsHistoryItem[];
  updatedAt?: string;
}

/**
 * Points History Item
 * 포인트 히스토리 항목
 */
export interface PointsHistoryItem {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'expire';
  source: string;
  description: string;
  createdAt: string;
}

/**
 * Points History Filters
 * 포인트 히스토리 필터
 */
export interface PointsHistoryFilters {
  type?: 'earn' | 'spend' | 'expire' | 'all';
  startDate?: string;
  endDate?: string;
  source?: string;
}

/**
 * Notification Settings
 * 알림 설정
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
