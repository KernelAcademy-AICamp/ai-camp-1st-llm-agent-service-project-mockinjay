import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { toast } from 'sonner';
import { storage } from '../utils/storage';
import { getCSRFToken, secureTokenStorage } from '../utils/security';

const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // XSS 보호를 위한 쿠키 설정 (백엔드에서 httpOnly 쿠키 지원 시)
  // Cookie settings for XSS protection (when backend supports httpOnly cookies)
  withCredentials: true,
});

// Request interceptor - Add authorization token and CSRF protection
api.interceptors.request.use(
  (config) => {
    // Get token from secure storage (memory-first, then localStorage)
    const token = secureTokenStorage.get() || storage.get<string>('careguide_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CSRF 토큰 추가 (상태 변경 요청에만)
    // Add CSRF token (only for state-changing requests)
    const mutationMethods = ['post', 'put', 'patch', 'delete'];
    if (config.method && mutationMethods.includes(config.method.toLowerCase())) {
      config.headers['X-CSRF-Token'] = getCSRFToken();
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error: AxiosError<any>) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          // Unauthorized - check if this is a public endpoint
          const requestUrl = error.config?.url || '';
          const publicEndpoints = ['/api/community/', '/api/quiz/', '/api/trends/'];
          const isPublicEndpoint = publicEndpoints.some(ep => requestUrl.includes(ep));

          // For public endpoints, don't redirect to login, just clear invalid tokens
          if (isPublicEndpoint) {
            storage.remove('careguide_token');
            storage.remove('careguide_user');
            delete api.defaults.headers.common['Authorization'];
            // Don't show error toast for public endpoints
          } else {
            // For protected endpoints, handle unauthorized and redirect
            handleUnauthorized();
            toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
          }
          break;

        case 403:
          // Forbidden
          toast.error('접근 권한이 없습니다.');
          break;

        case 404:
          // Not found
          toast.error('요청한 리소스를 찾을 수 없습니다.');
          break;

        case 422:
          // Validation error
          if (data?.detail) {
            if (Array.isArray(data.detail)) {
              // FastAPI validation errors
              const messages = data.detail.map((err: any) => err.msg).join(', ');
              toast.error(`입력 오류: ${messages}`);
            } else if (typeof data.detail === 'object' && data.detail.message) {
              // Custom validation error format
              toast.error(data.detail.message);
            } else {
              toast.error(data.detail);
            }
          } else {
            toast.error('입력값을 확인해주세요.');
          }
          break;

        case 500:
          // Internal server error
          if (env.isDevelopment && data?.detail) {
            toast.error(`서버 오류: ${data.detail}`);
          } else {
            toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          }
          break;

        default:
          // Other errors
          const message = data?.detail || data?.message || '요청 처리 중 오류가 발생했습니다.';
          toast.error(message);
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    } else {
      // Something else happened
      toast.error('요청 처리 중 오류가 발생했습니다.');
    }

    return Promise.reject(error);
  }
);

/**
 * Handle unauthorized access - clear auth data and redirect
 */
function handleUnauthorized() {
  // Public paths that don't require authentication
  const publicPaths = [
    '/community',
    '/quiz',
    '/login',
    '/signup',
    '/main',
    '/',
  ];

  // Check if current path is public
  const currentPath = window.location.pathname;
  const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));

  // Clear auth data
  storage.remove('careguide_token');
  storage.remove('careguide_user');
  delete api.defaults.headers.common['Authorization'];

  // Only redirect to login if NOT on a public path
  if (!isPublicPath && currentPath !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * Chat History API functions
 */
export interface ChatMessage {
  timestamp: string;
  user_input: string;
  agent_response: string;
  agent_type: string;
  session_id: string;
}

export interface ChatHistoryResponse {
  count: number;
  conversations: ChatMessage[];
}

/**
 * Get chat history for a user
 * @param userId - User ID
 * @param sessionId - Optional session ID to filter by session
 * @param limit - Maximum number of conversations (default: 50)
 */
export async function getChatHistory(
  userId: string,
  sessionId?: string,
  limit: number = 50
): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
  if (sessionId) {
    params.append('session_id', sessionId);
  }
  const response = await api.get(`/api/chat/history?${params.toString()}`);
  return response.data;
}

/**
 * Get chat history by session ID
 * @param sessionId - Session ID
 * @param limit - Maximum number of conversations (default: 50)
 */
export async function getChatHistoryBySession(
  sessionId: string,
  limit: number = 50
): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({
    session_id: sessionId,
    limit: String(limit)
  });
  const response = await api.get(`/api/chat/history?${params.toString()}`);
  return response.data;
}

/**
 * Chat Room API functions
 * 채팅 방 API 함수들
 *
 * Backend endpoints: /api/rooms
 * 백엔드 엔드포인트: /api/rooms
 */

export interface ChatRoomData {
  id: string;
  room_id?: string; // Backend uses room_id
  title: string;
  room_name?: string; // Backend uses room_name
  agent_type: string;
  message_count: number;
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  updated_at: string;
  last_activity?: string; // Backend uses last_activity
  is_pinned?: boolean;
  is_archived?: boolean;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Backend API Response types
 * 백엔드 API 응답 타입
 */
interface BackendRoomResponse {
  room_id: string;
  user_id: string;
  room_name: string;
  created_at: string;
  last_activity: string;
  message_count: number;
  metadata?: Record<string, unknown>;
  last_message?: {
    user_input: string;
    agent_response: string;
    agent_type: string;
    timestamp: string;
  };
}

interface BackendRoomsListResponse {
  message: string;
  data: {
    rooms: BackendRoomResponse[];
    total: number;
    page: number;
    page_size: number;
  };
}

interface BackendRoomCreateResponse {
  message: string;
  data: BackendRoomResponse;
}

/**
 * Convert backend room response to frontend ChatRoomData format
 * 백엔드 방 응답을 프론트엔드 ChatRoomData 형식으로 변환
 */
function mapBackendRoomToFrontend(backendRoom: BackendRoomResponse): ChatRoomData {
  return {
    id: backendRoom.room_id,
    room_id: backendRoom.room_id,
    title: backendRoom.room_name || 'AI 대화',
    room_name: backendRoom.room_name,
    agent_type: 'auto', // Default, backend doesn't store agent_type per room
    message_count: backendRoom.message_count || 0,
    last_message: backendRoom.last_message?.agent_response?.substring(0, 100),
    last_message_time: backendRoom.last_message?.timestamp,
    created_at: backendRoom.created_at,
    updated_at: backendRoom.last_activity,
    last_activity: backendRoom.last_activity,
    user_id: backendRoom.user_id,
    metadata: backendRoom.metadata,
  };
}

/**
 * Create a new chat room
 * 새 채팅 방 생성
 *
 * @param userId - User ID (required)
 * @param roomName - Room name (optional)
 * @param metadata - Additional metadata (optional)
 * @returns Promise with room data
 */
export async function createChatRoom(
  userId: string,
  roomName?: string,
  metadata?: Record<string, unknown>
): Promise<ChatRoomData> {
  try {
    const response = await api.post<BackendRoomCreateResponse>('/api/rooms', {
      user_id: userId,
      room_name: roomName,
      metadata,
    });
    return mapBackendRoomToFrontend(response.data.data as unknown as BackendRoomResponse);
  } catch (error) {
    console.error('Failed to create chat room:', error);
    // Fallback to client-side generation for offline support
    const now = new Date().toISOString();
    return {
      id: `room_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      title: roomName || 'AI 대화',
      agent_type: 'auto',
      message_count: 0,
      created_at: now,
      updated_at: now,
      user_id: userId,
    };
  }
}

/**
 * Get all chat rooms for a user
 * 사용자의 모든 채팅 방 가져오기
 *
 * @param userId - User ID
 * @param limit - Number of rooms to return (default: 50)
 * @param offset - Pagination offset (default: 0)
 * @returns Promise with array of rooms
 */
export async function getChatRooms(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatRoomData[]> {
  try {
    const params = new URLSearchParams({
      user_id: userId,
      limit: String(limit),
      offset: String(offset),
    });
    const response = await api.get<BackendRoomsListResponse>(`/api/rooms?${params.toString()}`);
    return (response.data.data.rooms || []).map(mapBackendRoomToFrontend);
  } catch (error) {
    console.error('Failed to fetch chat rooms:', error);
    // Return empty array on error (offline fallback)
    return [];
  }
}

/**
 * Get a single chat room by ID
 * ID로 채팅 방 가져오기
 *
 * @param roomId - Room ID
 * @returns Promise with room data
 */
export async function getChatRoom(roomId: string): Promise<ChatRoomData | null> {
  try {
    const response = await api.get<{ message: string; data: BackendRoomResponse }>(`/api/rooms/${roomId}`);
    return mapBackendRoomToFrontend(response.data.data);
  } catch (error) {
    console.error('Failed to fetch chat room:', error);
    return null;
  }
}

/**
 * Update a chat room
 * 채팅 방 업데이트
 *
 * @param roomId - Room ID
 * @param userId - User ID for ownership verification
 * @param updates - Partial room data to update
 * @returns Promise with updated room data
 */
export async function updateChatRoom(
  roomId: string,
  userId: string,
  updates: { room_name?: string; metadata?: Record<string, unknown> }
): Promise<ChatRoomData | null> {
  try {
    const params = new URLSearchParams({ user_id: userId });
    const response = await api.patch<{ message: string; data: { room_id: string; room_name: string; updated_at: string } }>(
      `/api/rooms/${roomId}?${params.toString()}`,
      updates
    );
    // Return partial update response mapped to ChatRoomData
    return {
      id: response.data.data.room_id,
      room_id: response.data.data.room_id,
      title: response.data.data.room_name,
      room_name: response.data.data.room_name,
      agent_type: 'auto',
      message_count: 0,
      created_at: '',
      updated_at: response.data.data.updated_at,
      user_id: userId,
    };
  } catch (error) {
    console.error('Failed to update chat room:', error);
    return null;
  }
}

/**
 * Delete a chat room
 * 채팅 방 삭제
 *
 * @param roomId - Room ID
 * @param userId - User ID for ownership verification
 * @returns Promise<boolean> - Success status
 */
export async function deleteChatRoom(roomId: string, userId: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ user_id: userId });
    await api.delete(`/api/rooms/${roomId}?${params.toString()}`);
    return true;
  } catch (error) {
    console.error('Failed to delete chat room:', error);
    return false;
  }
}

/**
 * Get room conversation history
 * 방 대화 히스토리 가져오기
 *
 * @param roomId - Room ID
 * @param limit - Number of conversations to return (default: 50)
 * @param offset - Pagination offset (default: 0)
 * @returns Promise with conversation history
 */
export async function getRoomHistory(
  roomId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatHistoryResponse> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await api.get<{
      message: string;
      data: {
        room_id: string;
        conversations: ChatMessage[];
        total: number;
        page: number;
        page_size: number;
      };
    }>(`/api/rooms/${roomId}/history?${params.toString()}`);

    return {
      count: response.data.data.total,
      conversations: response.data.data.conversations,
    };
  } catch (error) {
    console.error('Failed to fetch room history:', error);
    return { count: 0, conversations: [] };
  }
}

/**
 * Terms API Types and Functions
 * 약관 API 타입 및 함수들
 */

export interface TermData {
  title: string;
  required: boolean;
  content: string;
}

export interface TermsData {
  service_terms: TermData;
  privacy_required: TermData;
  privacy_optional: TermData;
  marketing: TermData;
}

export interface TermsResponse {
  status: string;
  terms: TermsData;
}

/**
 * Get all terms and conditions
 * 모든 약관 데이터 가져오기
 *
 * @returns Promise with terms data
 */
export async function getTerms(): Promise<TermsData | null> {
  try {
    const response = await api.get<TermsResponse>('/api/terms/all', {
      timeout: 3000, // 3초 타임아웃
    });
    if (response.data.status === 'success') {
      return response.data.terms;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch terms:', error);
    return null;
  }
}

/**
 * Check if email is already registered
 * 이메일 중복 확인
 *
 * @param email - Email to check
 * @returns Promise with availability status
 */
export async function checkEmailDuplicate(email: string): Promise<{ available: boolean; message: string }> {
  try {
    const response = await api.get<{ available: boolean; message: string }>(
      `/api/auth/check-email?email=${encodeURIComponent(email)}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Email check failed:', error);
    return {
      available: false,
      message: error.response?.data?.message || error.response?.data?.detail || '이메일 확인에 실패했습니다.'
    };
  }
}

/**
 * Check if nickname/username is already registered
 * 닉네임 중복 확인
 *
 * @param nickname - Nickname/username to check
 * @returns Promise with availability status
 */
export async function checkNicknameDuplicate(nickname: string): Promise<{ available: boolean; message: string }> {
  try {
    const response = await api.get<{ available: boolean; message: string }>(
      `/api/auth/check-username?username=${encodeURIComponent(nickname)}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Nickname check failed:', error);
    return {
      available: false,
      message: error.response?.data?.message || error.response?.data?.detail || '닉네임 확인에 실패했습니다.'
    };
  }
}

// ============================================================================
// MyPage API Functions
// 마이페이지 API 함수들
// ============================================================================

/**
 * User Profile Types
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profileImage?: string;
  profile: string;
  role: string;
  createdAt: string;
}

export interface UserProfileUpdateData {
  fullName?: string;
  bio?: string;
  profileImage?: string;
}

/**
 * Health Profile Types
 */
export interface HealthProfile {
  userId: string;
  conditions: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  age?: number;
  gender?: string;
  updatedAt?: string;
}

export interface HealthProfileUpdateData {
  conditions?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  age?: number;
  gender?: string;
}

/**
 * User Preferences Types
 */
export interface UserPreferences {
  userId: string;
  theme: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    community: boolean;
    trends: boolean;
  };
  updatedAt?: string;
}

export interface UserPreferencesUpdateData {
  theme?: string;
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    community?: boolean;
    trends?: boolean;
  };
}

/**
 * Bookmark Types
 */
export interface BookmarkedPaper {
  id: string;
  userId: string;
  paperId: string;
  paperData: {
    title: string;
    authors: string;
    journal?: string;
    year?: string;
    abstract?: string;
  };
  createdAt: string;
}

/**
 * User Post Types (for MyPage)
 */
export interface UserPost {
  id: string;
  title: string;
  content: string;
  postType: 'BOARD' | 'CHALLENGE' | 'SURVEY';
  likes: number;
  commentCount: number;
  createdAt: string;
}

/**
 * Get current user's profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await api.get<UserProfile>('/api/mypage/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: UserProfileUpdateData): Promise<UserProfile | null> {
  try {
    const response = await api.put<UserProfile>('/api/mypage/profile', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}

/**
 * Get user's health profile
 */
export async function getHealthProfile(): Promise<HealthProfile | null> {
  try {
    const response = await api.get<HealthProfile>('/api/mypage/health-profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch health profile:', error);
    return null;
  }
}

/**
 * Update user's health profile
 */
export async function updateHealthProfile(data: HealthProfileUpdateData): Promise<HealthProfile | null> {
  try {
    const response = await api.put<HealthProfile>('/api/mypage/health-profile', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update health profile:', error);
    throw error;
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    const response = await api.get<UserPreferences>('/api/mypage/preferences');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return null;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(data: UserPreferencesUpdateData): Promise<UserPreferences | null> {
  try {
    const response = await api.put<UserPreferences>('/api/mypage/preferences', data);
    return response.data;
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw error;
  }
}

/**
 * Get user's bookmarked papers
 */
export async function getUserBookmarks(limit: number = 20, offset: number = 0): Promise<{
  bookmarks: BookmarkedPaper[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await api.get(`/api/mypage/bookmarks?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    return { bookmarks: [], total: 0, hasMore: false };
  }
}

/**
 * Remove a bookmarked paper
 */
export async function removeBookmark(paperId: string): Promise<boolean> {
  try {
    await api.delete(`/api/mypage/bookmarks/${paperId}`);
    return true;
  } catch (error) {
    console.error('Failed to remove bookmark:', error);
    return false;
  }
}

/**
 * Get user's community posts
 */
export async function getUserPosts(limit: number = 20, offset: number = 0): Promise<{
  posts: UserPost[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await api.get(`/api/mypage/posts?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user posts:', error);
    return { posts: [], total: 0, hasMore: false };
  }
}

/**
 * Delete a user's post
 */
export async function deleteUserPost(postId: string): Promise<boolean> {
  try {
    await api.delete(`/api/community/posts/${postId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete post:', error);
    return false;
  }
}

// ============================================================================
// Diet Care API Functions
// 식단 관리 API 함수들
// ============================================================================

/**
 * Meal Food Item Type
 */
export interface MealFoodItem {
  name: string;
  amount: string;
  calories: number;
  protein_g: number;
  sodium_mg: number;
  potassium_mg: number;
  phosphorus_mg: number;
}

/**
 * Meal Record Type
 */
export interface MealRecord {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: MealFoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_sodium_mg: number;
  total_potassium_mg: number;
  total_phosphorus_mg: number;
  logged_at: string;
  notes?: string;
  image_url?: string;
  created_at: string;
}

/**
 * Meal List Response
 */
export interface MealListResponse {
  meals: MealRecord[];
  total_count: number;
  date_range: {
    start: string;
    end: string;
  };
}

/**
 * Get meal history for a date range
 * @param startDate - ISO date string (default: 7 days ago)
 * @param endDate - ISO date string (default: today)
 */
export async function getMealHistory(
  startDate?: string,
  endDate?: string
): Promise<MealListResponse> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = params.toString()
      ? `/api/diet-care/meals?${params.toString()}`
      : '/api/diet-care/meals';

    const response = await api.get<MealListResponse>(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch meal history:', error);
    return {
      meals: [],
      total_count: 0,
      date_range: { start: '', end: '' }
    };
  }
}

/**
 * Create a meal request type
 */
export interface CreateMealRequest {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: MealFoodItem[];
  logged_at?: string;
  notes?: string;
  image_url?: string;
}

/**
 * Log a new meal entry
 */
export async function createMeal(meal: CreateMealRequest): Promise<MealRecord | null> {
  try {
    const response = await api.post<MealRecord>('/api/diet-care/meals', meal);
    return response.data;
  } catch (error) {
    console.error('Failed to create meal:', error);
    throw error;
  }
}

/**
 * Delete a meal entry
 */
export async function deleteMeal(mealId: string): Promise<boolean> {
  try {
    await api.delete(`/api/diet-care/meals/${mealId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete meal:', error);
    return false;
  }
}

export default api;
