import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { AxiosError } from 'axios';
import { Navigate, useLocation } from 'react-router-dom';

import api from '../services/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/constants';
import { storage } from '../utils/storage';
import { resetCSRFToken, secureTokenStorage } from '../utils/security';
import type { UserProfile } from '../types/mypage';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUTH_REGISTER_ENDPOINT = '/api/auth/register';

interface AuthResponse {
  access_token?: string;
  token?: string;
  user?: UserProfile;
  expires_in?: number;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  nickname?: string;
  userType?: string;
  profileImage?: string;
  [key: string]: string | number | boolean | File | undefined;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuthHeader = () => {
  return useCallback((value: string | null) => {
    if (value) {
      api.defaults.headers.common.Authorization = `Bearer ${value}`;
    } else if ('Authorization' in api.defaults.headers.common) {
      delete api.defaults.headers.common.Authorization;
    }
  }, []);
};

const usePersistAuthState = (setAuthHeader: (value: string | null) => void) => {
  return useCallback(
    (nextToken: string, nextUser: UserProfile) => {
      secureTokenStorage.set(nextToken, { expiresIn: TOKEN_EXPIRY_MS });
      storage.set(STORAGE_KEYS.TOKEN, nextToken);
      storage.set(STORAGE_KEYS.USER, nextUser);
      setAuthHeader(nextToken);
    },
    [setAuthHeader],
  );
};

const useClearAuthArtifacts = (setAuthHeader: (value: string | null) => void) => {
  return useCallback(() => {
    secureTokenStorage.clear();
    storage.remove(STORAGE_KEYS.TOKEN);
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.SESSION_ID);
    resetCSRFToken();
    setAuthHeader(null);
  }, [setAuthHeader]);
};

const useRequestUserProfile = () => {
  return useCallback(async (): Promise<UserProfile | undefined> => {
    try {
      const response = await api.get<UserProfile>(API_ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error) {
      console.warn('[AuthContext] Failed to load user profile', error);
      return undefined;
    }
  }, []);
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const axiosError = error as AxiosError<{ detail?: string; message?: string; error?: string }>;
    return (
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      '요청 처리 중 오류가 발생했습니다.'
    );
  }

  return '요청 처리 중 오류가 발생했습니다.';
};

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setAuthHeader = useAuthHeader();
  const persistAuthState = usePersistAuthState(setAuthHeader);
  const clearAuthArtifacts = useClearAuthArtifacts(setAuthHeader);
  const requestUserProfile = useRequestUserProfile();

  const setAuthFromStorage = useCallback(async () => {
    const cachedToken = secureTokenStorage.get();
    const storedToken = cachedToken ?? storage.get<string>(STORAGE_KEYS.TOKEN);
    const storedUser = storage.get<UserProfile>(STORAGE_KEYS.USER);

    if (!storedToken) {
      if (storedUser) {
        storage.remove(STORAGE_KEYS.USER);
      }
      return;
    }

    if (!cachedToken) {
      secureTokenStorage.set(storedToken);
    }

    setAuthHeader(storedToken);
    setToken(storedToken);

    if (storedUser) {
      setUser(storedUser);
      return;
    }

    const fetchedUser = await requestUserProfile();
    if (fetchedUser) {
      setUser(fetchedUser);
      storage.set(STORAGE_KEYS.USER, fetchedUser);
    }
  }, [requestUserProfile, setAuthHeader]);

  useEffect(() => {
    let isSubscribed = true;

    (async () => {
      try {
        await setAuthFromStorage();
      } catch (restoreError) {
        console.warn('[AuthContext] Unable to restore auth state', restoreError);
        if (isSubscribed) {
          clearAuthArtifacts();
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [clearAuthArtifacts, setAuthFromStorage]);

  const handleAuthSuccess = useCallback(
    (nextToken: string, nextUser: UserProfile) => {
      persistAuthState(nextToken, nextUser);
      setToken(nextToken);
      setUser(nextUser);
    },
    [persistAuthState],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const { access_token, token: fallbackToken, user: responseUser } = response.data ?? {};
        const resolvedToken = access_token ?? fallbackToken;

        if (!resolvedToken) {
          throw new Error('토큰을 발급받지 못했습니다.');
        }

        let resolvedUser = responseUser;

        if (!resolvedUser) {
          resolvedUser = await requestUserProfile();
        }

        if (!resolvedUser) {
          throw new Error('사용자 정보를 확인할 수 없습니다.');
        }

        handleAuthSuccess(resolvedToken, resolvedUser);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess, requestUserProfile],
  );

  const signup = useCallback(
    async (data: SignupData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post<AuthResponse>(AUTH_REGISTER_ENDPOINT, data);
        const { access_token, token: fallbackToken, user: responseUser } = response.data ?? {};
        const resolvedToken = access_token ?? fallbackToken;

        if (resolvedToken && responseUser) {
          handleAuthSuccess(resolvedToken, responseUser);
          return;
        }

        if (resolvedToken) {
          const refreshedUser = responseUser ?? (await requestUserProfile());
          if (refreshedUser) {
            handleAuthSuccess(resolvedToken, refreshedUser);
            return;
          }
        }

        await login(data.username, data.password);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess, login, requestUserProfile],
  );

  const clearAuthState = useCallback(() => {
    setToken(null);
    setUser(null);
    clearAuthArtifacts();
  }, [clearAuthArtifacts]);

  const logout = useCallback(() => {
    setError(null);
    clearAuthState();
    setIsLoading(false);
  }, [clearAuthState]);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      try {
        const response = await api.patch<UserProfile>(API_ENDPOINTS.USER_PROFILE, data);
        const updatedUser = response.data ?? (user ? { ...user, ...data } : null);

        if (!updatedUser) {
          throw new Error('프로필 정보를 업데이트할 수 없습니다.');
        }

        setUser(updatedUser);
        storage.set(STORAGE_KEYS.USER, updatedUser);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      }
    },
    [token, user],
  );

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      error,
      login,
      signup,
      logout,
      updateProfile,
    }),
    [error, isLoading, login, logout, signup, token, updateProfile, user],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

interface ProtectedRouteProps {
  children: ReactElement;
  redirectPath?: string;
}

export function ProtectedRoute({ children, redirectPath = '/login' }: ProtectedRouteProps): ReactElement | null {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
}
