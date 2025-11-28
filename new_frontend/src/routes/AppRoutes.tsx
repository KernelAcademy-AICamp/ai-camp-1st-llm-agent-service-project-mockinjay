import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { ProtectedRoute, PublicOnlyRoute } from '../components/auth/ProtectedRoute';

// Layout (always loaded)
import AppLayout from '../components/layout/AppLayout';

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">로딩 중...</p>
    </div>
  </div>
);

// ============================================================
// Code Splitting with React.lazy
// 코드 스플리팅: 각 페이지를 별도 청크로 분리하여 초기 로딩 시간 단축
// ============================================================

// Public pages (no auth required)
const SplashPage = lazy(() => import('../pages/SplashPage'));
const MainPageFull = lazy(() => import('../pages/MainPageFull'));
const LoginPageFull = lazy(() => import('../pages/LoginPageFull'));
const SignupPage = lazy(() => import('../pages/SignupPage'));

// Main feature pages
const ChatPageEnhanced = lazy(() => import('../pages/ChatPageEnhanced'));
const DietCarePageEnhanced = lazy(() => import('../pages/DietCarePageEnhanced'));
const CommunityPageEnhanced = lazy(() => import('../pages/CommunityPageEnhanced'));
const TrendsPageEnhanced = lazy(() => import('../pages/TrendsPageEnhanced'));

// Quiz pages
const QuizListPage = lazy(() => import('../pages/QuizListPage'));
const QuizPage = lazy(() => import('../pages/QuizPage'));
const QuizCompletionPage = lazy(() => import('../pages/QuizCompletionPage'));

// Dashboard - Removed, redirected to Trends page

// Detail/Utility pages
const MyPageEnhanced = lazy(() => import('../pages/MyPageEnhanced'));
const NewsDetailPage = lazy(() => import('../pages/NewsDetailPage'));
const BookmarkPage = lazy(() => import('../pages/BookmarkPage'));
const HealthRecordsPage = lazy(() => import('../pages/HealthRecordsPage'));
const KidneyDiseaseStagePage = lazy(() => import('../pages/KidneyDiseaseStagePage'));
const SupportPage = lazy(() => import('../pages/SupportPage'));
const PlaceholderPage = lazy(() => import('../pages/PlaceholderPage'));
const MobileAppLayouts = lazy(() => import('../pages/MobileAppLayouts'));

// Account pages (newly implemented)
const ProfileInfoPage = lazy(() => import('../pages/ProfileInfoPage'));
const ChangePasswordPage = lazy(() => import('../pages/ChangePasswordPage'));
const NotificationSettingsPage = lazy(() => import('../pages/NotificationSettingsPage'));
const NotificationPage = lazy(() => import('../pages/NotificationPage'));
const SubscribePage = lazy(() => import('../pages/SubscribePage'));

// Legal pages
const TermsConditionsPage = lazy(() => import('../pages/LegalPages').then(m => ({ default: m.TermsConditionsPage })));
const PrivacyPolicyPage = lazy(() => import('../pages/LegalPages').then(m => ({ default: m.PrivacyPolicyPage })));
const CookieConsentPage = lazy(() => import('../pages/LegalPages').then(m => ({ default: m.CookieConsentPage })));

// ============================================================
// Route Configuration
// ============================================================

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Root - Splash page */}
          <Route path="/" element={<SplashPage />} />
          <Route path="/splash" element={<SplashPage />} />

          {/* ========================================== */}
          {/* Public Routes (인증 불필요) */}
          {/* ========================================== */}

          {/* Main landing page */}
          <Route path={ROUTES.MAIN} element={<MainPageFull />} />
          <Route path="/home" element={<Navigate to={ROUTES.MAIN} replace />} />

          {/* Auth routes - redirect if already logged in */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicOnlyRoute>
                <LoginPageFull />
              </PublicOnlyRoute>
            }
          />
          <Route
            path={ROUTES.SIGNUP}
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />

          {/* Community - Public (anonymous posting allowed) */}
          <Route path={ROUTES.COMMUNITY} element={<CommunityPageEnhanced />} />
          <Route path={ROUTES.COMMUNITY_LIST} element={<CommunityPageEnhanced />} />
          <Route path={ROUTES.COMMUNITY_DETAIL} element={<CommunityPageEnhanced />} />

          {/* Quiz - Public (anonymous playing allowed) */}
          <Route path="/quiz" element={<QuizListPage />} />
          <Route path="/quiz/list" element={<Navigate to="/quiz" replace />} />
          <Route path="/quiz/play" element={<QuizPage />} />
          <Route path="/quiz/play/:id" element={<QuizPage />} />
          <Route path="/quiz/level/:levelId" element={<QuizPage />} />
          <Route path="/quiz/daily" element={<QuizPage />} />
          <Route path="/quiz/completion" element={<QuizCompletionPage />} />

          {/* Trends - Public */}
          <Route path={ROUTES.TRENDS} element={<TrendsPageEnhanced />} />
          <Route path={ROUTES.TRENDS_LIST} element={<TrendsPageEnhanced />} />
          <Route path={ROUTES.TRENDS_DETAIL} element={<TrendsPageEnhanced />} />

          {/* Dashboard - Redirect to Trends page */}
          <Route path="/dashboard" element={<Navigate to={ROUTES.TRENDS} replace />} />

          {/* News Detail - Public */}
          <Route path="/news/detail/:id" element={<NewsDetailPage />} />

          {/* Support - Public */}
          <Route path={ROUTES.SUPPORT} element={<SupportPage />} />

          {/* Legal pages - Public */}
          <Route path={ROUTES.TERMS_CONDITIONS} element={<TermsConditionsPage />} />
          <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
          <Route path={ROUTES.COOKIE_CONSENT} element={<CookieConsentPage />} />

          {/* Mobile Layouts Prototype */}
          <Route path="/mobile-layouts" element={<MobileAppLayouts />} />

          {/* ========================================== */}
          {/* Protected Routes (인증 필요) */}
          {/* ========================================== */}

          {/* Chat Routes - Protected */}
          <Route
            path={ROUTES.CHAT}
            element={
              <ProtectedRoute>
                <ChatPageEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CHAT_MEDICAL_WELFARE}
            element={
              <ProtectedRoute>
                <ChatPageEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CHAT_NUTRITION}
            element={
              <ProtectedRoute>
                <ChatPageEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CHAT_RESEARCH}
            element={
              <ProtectedRoute>
                <ChatPageEnhanced />
              </ProtectedRoute>
            }
          />

          {/* Diet Care Routes - Protected */}
          <Route
            path={ROUTES.DIET_CARE}
            element={
              <ProtectedRoute>
                <DietCarePageEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.NUTRI_COACH}
            element={
              <ProtectedRoute>
                <DietCarePageEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DIET_LOG}
            element={
              <ProtectedRoute>
                <DietCarePageEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DIET_TYPE_DETAIL}
            element={
              <ProtectedRoute>
                <DietCarePageEnhanced />
              </ProtectedRoute>
            }
          />

          {/* MyPage Routes - Protected */}
          <Route
            path={ROUTES.MY_PAGE}
            element={
              <ProtectedRoute>
                <MyPageEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mypage/profile"
            element={
              <ProtectedRoute>
                <ProfileInfoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mypage/profile/kidney-disease-stage"
            element={
              <ProtectedRoute>
                <KidneyDiseaseStagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mypage/test-results"
            element={
              <ProtectedRoute>
                <HealthRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mypage/bookmark"
            element={
              <ProtectedRoute>
                <BookmarkPage />
              </ProtectedRoute>
            }
          />

          {/* Account Management - Protected */}
          <Route
            path={ROUTES.CHANGE_PASSWORD}
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SUBSCRIBE}
            element={
              <ProtectedRoute>
                <SubscribePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.NOTIFICATION}
            element={
              <ProtectedRoute>
                <NotificationSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Notifications List - Protected */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />

          {/* Error page */}
          <Route path={ROUTES.ERROR} element={<PlaceholderPage title="에러" />} />

          {/* 404 Fallback */}
          <Route path="*" element={<PlaceholderPage title="404 Not Found" />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
