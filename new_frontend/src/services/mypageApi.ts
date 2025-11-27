/**
 * MyPage API Service
 * 마이페이지 관련 API
 */

import api from './api';
import type {
  UserProfile,
  HealthProfile,
  UserPreferences,
  BookmarkedPaper,
  UserNotification,
  ProfileUpdateRequest,
  HealthProfileUpdateRequest,
  PreferencesUpdateRequest,
  UserLevelData,
  PointsData,
  PointsHistoryFilters,
  NotificationSettings,
  NotificationSettingsUpdateRequest,
} from '../types/mypage';

const MYPAGE_BASE = '/api/mypage';
const USER_BASE = '/api/user';

// ==================== Profile API ====================

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>(`${USER_BASE}/${userId}/profile`);
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: ProfileUpdateRequest
): Promise<UserProfile> => {
  const { data } = await api.patch<UserProfile>(`${USER_BASE}/${userId}/profile`, updates);
  return data;
};

// ==================== Health Profile API ====================

/**
 * Get health profile
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getHealthProfile = async (_userId: string): Promise<HealthProfile> => {
  const { data } = await api.get<HealthProfile>(`${MYPAGE_BASE}/health-profile`);
  return data;
};

/**
 * Update health profile
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const updateHealthProfile = async (
  _userId: string,
  updates: HealthProfileUpdateRequest
): Promise<HealthProfile> => {
  const { data } = await api.patch<HealthProfile>(`${MYPAGE_BASE}/health-profile`, updates);
  return data;
};

// ==================== Preferences API ====================

/**
 * Get user preferences
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getUserPreferences = async (_userId: string): Promise<UserPreferences> => {
  const { data } = await api.get<UserPreferences>(`${MYPAGE_BASE}/preferences`);
  return data;
};

/**
 * Update user preferences
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const updateUserPreferences = async (
  _userId: string,
  updates: PreferencesUpdateRequest
): Promise<UserPreferences> => {
  const { data } = await api.patch<UserPreferences>(`${MYPAGE_BASE}/preferences`, updates);
  return data;
};

// ==================== Level System API (MYP-001) ====================

/**
 * Get user level data
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getUserLevel = async (_userId: string): Promise<UserLevelData> => {
  const { data } = await api.get<UserLevelData>(`${MYPAGE_BASE}/level`);
  return data;
};

// ==================== Points System API (MYP-002) ====================

/**
 * Get user points data
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getUserPoints = async (_userId: string): Promise<PointsData> => {
  const { data } = await api.get<PointsData>(`${MYPAGE_BASE}/points`);
  return data;
};

/**
 * Get points history with filters
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getPointsHistory = async (
  _userId: string,
  filters?: PointsHistoryFilters,
  limit = 20,
  offset = 0
): Promise<PointsData> => {
  const params = {
    limit,
    offset,
    ...filters,
  };
  const { data } = await api.get<PointsData>(`${MYPAGE_BASE}/points/history`, { params });
  return data;
};

// ==================== Bookmarks API ====================

/**
 * Get bookmarked papers
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getBookmarkedPapers = async (
  _userId: string,
  limit = 20,
  offset = 0
): Promise<BookmarkedPaper[]> => {
  const { data } = await api.get<BookmarkedPaper[]>(`${MYPAGE_BASE}/bookmarks`, {
    params: { limit, offset },
  });
  return data;
};

/**
 * Add paper to bookmarks
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const addBookmark = async (
  _userId: string,
  paper: Omit<BookmarkedPaper, 'id' | 'userId' | 'bookmarkedAt'>
): Promise<BookmarkedPaper> => {
  const { data } = await api.post<BookmarkedPaper>(`${MYPAGE_BASE}/bookmarks`, paper);
  return data;
};

/**
 * Remove paper from bookmarks
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const removeBookmark = async (_userId: string, bookmarkId: string): Promise<void> => {
  await api.delete(`${MYPAGE_BASE}/bookmarks/${bookmarkId}`);
};

/**
 * Update bookmark notes/tags
 */
export const updateBookmark = async (
  bookmarkId: string,
  updates: { notes?: string; tags?: string[] }
): Promise<BookmarkedPaper> => {
  const { data } = await api.patch<BookmarkedPaper>(`${MYPAGE_BASE}/bookmarks/${bookmarkId}`, updates);
  return data;
};

// ==================== Notifications API ====================

/**
 * Get user notifications
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getNotifications = async (
  _userId: string,
  limit = 20,
  offset = 0,
  unreadOnly = false
): Promise<UserNotification[]> => {
  const { data } = await api.get<UserNotification[]>(`${MYPAGE_BASE}/notifications`, {
    params: { limit, offset, unreadOnly },
  });
  return data;
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await api.patch(`${MYPAGE_BASE}/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const markAllNotificationsRead = async (_userId: string): Promise<void> => {
  await api.patch(`${MYPAGE_BASE}/notifications/read-all`);
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`${MYPAGE_BASE}/notifications/${notificationId}`);
};

// ==================== Notification Settings API (MYP-005) ====================

/**
 * Get notification settings
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const getNotificationSettings = async (_userId: string): Promise<NotificationSettings> => {
  const { data } = await api.get<NotificationSettings>(`${MYPAGE_BASE}/notification-settings`);
  return data;
};

/**
 * Update notification settings
 * @param _userId - User ID (used for auth context, actual ID from JWT)
 */
export const updateNotificationSettings = async (
  _userId: string,
  updates: NotificationSettingsUpdateRequest
): Promise<NotificationSettings> => {
  const { data } = await api.patch<NotificationSettings>(
    `${MYPAGE_BASE}/notification-settings`,
    updates
  );
  return data;
};

// ==================== Utility Functions ====================

/**
 * Calculate level from points
 */
export const calculateLevelFromPoints = (points: number): number => {
  if (points >= 1000) return 5;
  if (points >= 600) return 4;
  if (points >= 300) return 3;
  if (points >= 100) return 2;
  return 1;
};

/**
 * Calculate points needed for next level
 */
export const getPointsToNextLevel = (currentPoints: number): number | null => {
  const thresholds = [100, 300, 600, 1000];
  for (const threshold of thresholds) {
    if (currentPoints < threshold) {
      return threshold - currentPoints;
    }
  }
  return null; // Max level reached
};

// Re-export types for convenience
export type {
  UserProfile,
  HealthProfile,
  UserPreferences,
  BookmarkedPaper,
  UserNotification,
  UserLevelData,
  PointsData,
  NotificationSettings,
};
