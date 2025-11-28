import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import api from '../services/api';
import { storage } from '../utils/storage';
import { secureTokenStorage, resetCSRFToken } from '../utils/security';

interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  profile?: 'general' | 'patient' | 'researcher';
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: 'general' | 'patient' | 'researcher') => Promise<void>;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  profile: 'general' | 'patient' | 'researcher';
  // 추가 필드 (Additional fields)
  nickname?: string;
  gender?: '남성' | '여성' | '기타';
  birthDate?: string;
  height?: number;
  weight?: number;
  diseaseInfo?: string; // CKD 단계 (CKD1, CKD2, ..., None)
  // 약관 동의 (Terms and agreements)
  agreements?: {
    service: boolean;
    privacyRequired: boolean;
    privacyOptional: boolean;
    marketing: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * 컴포넌트 마운트 시 로컬 스토리지에서 인증 정보를 로드합니다.
   * Loads authentication information from local storage on component mount.
   *
   * 저장된 토큰이 있으면 자동으로 로그인 상태를 복원합니다.
   * Automatically restores login state if saved token exists.
   */
  useEffect(() => {
    // 스토리지에서 토큰 로드 (Load token from storage)
    const savedToken = storage.get<string>('careguide_token');
    const savedUser = storage.get<User>('careguide_user');

    console.log('AuthContext initialization');
    console.log('Saved token:', savedToken);
    console.log('Saved user:', savedUser);

    if (savedToken && savedUser) {
      // 인증 상태 복원 (Restore authentication state)
      setToken(savedToken);
      setUser(savedUser);

      // axios 기본 헤더 설정 (Set axios default header)
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

      console.log('AuthContext state set successfully');
    } else {
      console.log('No saved credentials found');
    }
  }, []);

  /**
   * 사용자 로그인을 처리합니다.
   * Handles user login authentication.
   *
   * 사용자 인증 정보를 서버로 전송하고 JWT 토큰을 받아 저장합니다.
   * Sends user credentials to server and stores received JWT token.
   *
   * @param username - 사용자명 또는 이메일 (Username or email)
   * @param password - 비밀번호 (Password)
   * @throws Error - 로그인 실패 시 에러 메시지 (Error message on login failure)
   */
  const login = async (username: string, password: string) => {
    try {
      // FormData 형식으로 로그인 요청 (OAuth2 표준)
      // Login request in FormData format (OAuth2 standard)
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Login response:', response.data);

      const { access_token, user: userData } = response.data;

      console.log('Extracted token:', access_token);
      console.log('Extracted user:', userData);

      // 상태 및 로컬 스토리지에 인증 정보 저장
      // Save auth info to state and local storage
      setToken(access_token);
      setUser(userData);

      // 보안 토큰 저장소 사용 (메모리 + localStorage 이중 저장)
      // Use secure token storage (memory + localStorage dual storage)
      secureTokenStorage.set(access_token, {
        // 24시간 후 만료 (백엔드 토큰 만료와 동기화 권장)
        // Expires in 24 hours (sync with backend token expiry recommended)
        expiresIn: 24 * 60 * 60 * 1000,
      });
      storage.set('careguide_user', userData);

      // axios 기본 헤더에 토큰 설정 (모든 API 요청에 자동 포함)
      // Set token in axios default header (automatically included in all API requests)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      console.log('Login successful - State updated');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || '로그인에 실패했습니다');
    }
  };

  /**
   * 사용자 회원가입을 처리합니다.
   * Handles user signup registration.
   *
   * 새 사용자 계정을 생성하고 자동으로 로그인합니다.
   * Creates a new user account and automatically logs in.
   *
   * @param data - 회원가입 정보 (이메일, 비밀번호, 프로필 등)
   *               Signup information (email, password, profile, etc.)
   * @throws Error - 회원가입 실패 시 에러 메시지 (Error message on signup failure)
   */
  const signup = async (data: SignupData) => {
    try {
      // 회원가입 API 호출 (Call signup API)
      // 모든 확장 필드를 포함한 요청 페이로드 구성
      // Construct request payload including all extended fields
      const signupPayload = {
        email: data.email,
        password: data.password,
        name: data.fullName || data.username,
        profile: data.profile,
        role: 'user',
        // 추가 사용자 정보 (Additional user information)
        ...(data.nickname && { nickname: data.nickname }),
        ...(data.gender && { gender: data.gender }),
        ...(data.birthDate && { birthDate: data.birthDate }),
        ...(data.height && { height: data.height }),
        ...(data.weight && { weight: data.weight }),
        ...(data.diseaseInfo && { diseaseInfo: data.diseaseInfo }),
        // 약관 동의 정보 (Terms and agreements)
        ...(data.agreements && { agreements: data.agreements }),
      };

      const response = await api.post('/api/auth/signup', signupPayload);

      // 회원가입 후 자동 로그인 (토큰이 반환된 경우)
      // Auto-login after signup (if token is returned)
      if (response.data.access_token) {
        const { access_token, user: userData } = response.data;
        setToken(access_token);
        setUser(userData);
        storage.set('careguide_token', access_token);
        storage.set('careguide_user', userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      } else {
        // 토큰이 없으면 수동으로 로그인 필요
        // If no token, need to login manually
        await login(data.email, data.password);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.response?.data?.detail || '회원가입에 실패했습니다');
    }
  };

  /**
   * 사용자 로그아웃을 처리합니다.
   * Handles user logout.
   *
   * 인증 정보와 모든 로컬 데이터를 삭제합니다. (개인정보 보호)
   * Clears authentication info and all local data (privacy compliance).
   */
  const logout = () => {
    // 인증 상태 초기화 (Clear authentication state)
    setUser(null);
    setToken(null);

    // 보안 토큰 저장소 클리어 (메모리 + localStorage)
    // Clear secure token storage (memory + localStorage)
    secureTokenStorage.clear();

    // CSRF 토큰 리셋 (새 세션 시작을 위해)
    // Reset CSRF token (for new session)
    resetCSRFToken();

    // 인증 데이터 삭제 (Clear auth data)
    storage.remove('careguide_token');
    storage.remove('careguide_user');

    // 채팅 관련 데이터 삭제 (GDPR/개인정보 보호 준수)
    // Clear all chat-related data (GDPR/privacy compliance)
    storage.remove('careguide_session_id');
    storage.remove('careguide_chat_messages');
    storage.remove('careguide_last_active');

    // 안전을 위해 모든 careguide_ 접두사 데이터 삭제
    // Clear any other careguide_ prefixed data for safety
    clearAllCareGuideData();

    // 세션 스토리지 완전히 삭제
    // Clear sessionStorage completely
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Could not clear sessionStorage:', error);
    }

    // axios 헤더에서 Authorization 토큰 제거
    // Remove Authorization token from axios headers
    delete api.defaults.headers.common['Authorization'];

    console.log('Logout complete - all local data cleared');
  };

  /**
   * careguide_ 접두사를 가진 모든 localStorage 항목을 삭제합니다.
   * Clears all localStorage items with careguide_ prefix.
   *
   * 로그아웃 후 민감한 데이터가 남지 않도록 보장합니다.
   * Ensures no sensitive data remains after logout.
   */
  const clearAllCareGuideData = () => {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('careguide_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} careguide_ items from localStorage`);
      }
    } catch (error) {
      console.warn('Could not clear careguide data from localStorage:', error);
    }
  };

  /**
   * 사용자 프로필 타입을 업데이트합니다.
   * Updates user profile type.
   *
   * 프로필 타입에 따라 AI 응답이 맞춤화됩니다.
   * AI responses are customized based on profile type.
   *
   * 백엔드 API를 호출하여 프로필을 영구 저장하고, Parlant 세션을 초기화합니다.
   * Calls backend API to persist profile and resets Parlant session.
   *
   * @param profile - 프로필 타입 (일반, 환자, 연구자)
   *                  Profile type (general, patient, researcher)
   */
  const updateProfile = async (profile: 'general' | 'patient' | 'researcher') => {
    if (user) {
      try {
        // 백엔드 API 호출하여 프로필 영구 저장
        // Call backend API to persist profile change
        await api.patch('/api/auth/profile', { profile });

        // 로컬 상태 업데이트 (Update local state)
        const updatedUser = { ...user, profile };
        setUser(updatedUser);
        storage.set('careguide_user', updatedUser);

        // 세션 초기화하여 새 Parlant 고객 태그로 세션 생성 유도
        // Clear session to force new Parlant session with updated profile tag
        storage.remove('careguide_session_id');

        console.log(`Profile updated to: ${profile}`);
      } catch (error) {
        console.error('Failed to update profile on server:', error);
        // 서버 업데이트 실패해도 로컬 상태는 업데이트 (UX 개선)
        // Update local state even if server update fails (better UX)
        const updatedUser = { ...user, profile };
        setUser(updatedUser);
        storage.set('careguide_user', updatedUser);
      }
    }
  };

  /**
   * 사용자 인증 상태를 계산합니다.
   * Computes user authentication status.
   *
   * 토큰과 사용자 정보가 모두 있을 때만 인증된 것으로 간주합니다.
   * Only considers authenticated when both token and user info exist.
   */
  const isAuthenticated = useMemo(() => {
    const result = !!token && !!user;
    console.log('isAuthenticated computed:', result, '| token:', !!token, '| user:', !!user);
    return result;
  }, [token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
