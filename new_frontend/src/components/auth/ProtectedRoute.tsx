import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../types/careguide-ia';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * 인증 없이 접근 가능한 경우 true로 설정
   * Set to true if accessible without authentication
   */
  allowUnauthenticated?: boolean;
  /**
   * 인증 후 리디렉션할 경로 (기본: 로그인)
   * Path to redirect after authentication (default: login)
   */
  redirectTo?: string;
  /**
   * 로딩 중 표시할 컴포넌트
   * Component to show while loading
   */
  fallback?: React.ReactNode;
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * Component that protects routes requiring authentication
 *
 * 인증되지 않은 사용자는 로그인 페이지로 리디렉션됩니다.
 * Unauthenticated users are redirected to the login page.
 *
 * @example
 * // 기본 사용 (Basic usage)
 * <ProtectedRoute>
 *   <MyProtectedPage />
 * </ProtectedRoute>
 *
 * @example
 * // 비인증 사용자 허용 (Allow unauthenticated)
 * <ProtectedRoute allowUnauthenticated>
 *   <PublicPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowUnauthenticated = false,
  redirectTo = ROUTES.LOGIN,
  fallback = null,
}) => {
  const { isAuthenticated, token } = useAuth();
  const location = useLocation();

  // 비인증 접근 허용된 경우 바로 렌더링
  // Render directly if unauthenticated access is allowed
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // 토큰이 localStorage에 있지만 아직 Context에 로드되지 않은 경우
  // 초기 렌더링 시 깜빡임 방지
  // If token exists in localStorage but not yet loaded to Context
  // Prevents flash during initial render
  const hasStoredToken = typeof window !== 'undefined' &&
    localStorage.getItem('careguide_token') !== null;

  // 토큰이 저장되어 있지만 Context가 아직 준비되지 않은 경우 로딩 표시
  // Show loading if token is stored but Context is not ready yet
  if (hasStoredToken && !isAuthenticated && !token) {
    return fallback ? <>{fallback}</> : (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리디렉션
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // 로그인 후 원래 페이지로 돌아갈 수 있도록 현재 경로 저장
    // Save current path to redirect back after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * 이미 인증된 사용자가 접근할 수 없는 라우트 (로그인, 회원가입 등)
 * Routes that authenticated users cannot access (login, signup, etc.)
 *
 * 인증된 사용자는 메인 페이지로 리디렉션됩니다.
 * Authenticated users are redirected to the main page.
 */
export const PublicOnlyRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
}> = ({
  children,
  redirectTo = ROUTES.MAIN,
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // 인증된 사용자는 메인 페이지로 리디렉션
  // Redirect authenticated users to main page
  if (isAuthenticated) {
    // state에서 원래 가려던 경로가 있으면 그곳으로
    // If there's a saved path in state, redirect there
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    return <Navigate to={from || redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
