import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PlaceholderPage from '../pages/PlaceholderPage';
import { ROUTES } from '../types/careguide-ia';

// Enhanced components
import AppLayout from '../components/layout/AppLayout';
import MainPageFull from '../pages/MainPageFull';
import ChatPageEnhanced from '../pages/ChatPageEnhanced';
import DietCarePageEnhanced from '../pages/DietCarePageEnhanced';
import CommunityPageEnhanced from '../pages/CommunityPageEnhanced';
import QuizPage from '../pages/QuizPage';
import QuizCompletionPage from '../pages/QuizCompletionPage';

// Existing pages
import TrendsPageEnhanced from '../pages/TrendsPageEnhanced';
import LoginPageFull from '../pages/LoginPageFull';
import SignupPageFull from '../pages/SignupPageFull';
import MyPageEnhanced from '../pages/MyPageEnhanced';
import { DashboardPage } from '../pages/DashboardPage';

// Detail/Subpages
import NewsDetailPage from '../pages/NewsDetailPage';
import BookmarkPage from '../pages/BookmarkPage';
import HealthRecordsPage from '../pages/HealthRecordsPage';
import KidneyDiseaseStagePage from '../pages/KidneyDiseaseStagePage';
import QuizListPage from '../pages/QuizListPage';
import SupportPage from '../pages/SupportPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to={ROUTES.MAIN} replace />} />
        <Route path={ROUTES.MAIN} element={<MainPageFull />} />

        {/* Chat Routes */}
        <Route path={ROUTES.CHAT} element={<ChatPageEnhanced />} />
        <Route path={ROUTES.CHAT_MEDICAL_WELFARE} element={<ChatPageEnhanced />} />
        <Route path={ROUTES.CHAT_NUTRITION} element={<ChatPageEnhanced />} />
        <Route path={ROUTES.CHAT_RESEARCH} element={<ChatPageEnhanced />} />

        {/* Diet Care Routes */}
        <Route path={ROUTES.DIET_CARE} element={<DietCarePageEnhanced />} />
        <Route path={ROUTES.NUTRI_COACH} element={<DietCarePageEnhanced />} />
        <Route path={ROUTES.DIET_LOG} element={<DietCarePageEnhanced />} />
        <Route path={ROUTES.DIET_TYPE_DETAIL} element={<DietCarePageEnhanced />} />

        {/* Community Routes */}
        <Route path={ROUTES.COMMUNITY} element={<CommunityPageEnhanced />} />
        <Route path={ROUTES.COMMUNITY_LIST} element={<CommunityPageEnhanced />} />
        <Route path={ROUTES.COMMUNITY_DETAIL} element={<CommunityPageEnhanced />} />

        {/* Trends Routes */}
        <Route path={ROUTES.TRENDS} element={<TrendsPageEnhanced />} />
        <Route path={ROUTES.TRENDS_LIST} element={<TrendsPageEnhanced />} />
        <Route path={ROUTES.TRENDS_DETAIL} element={<TrendsPageEnhanced />} />

        {/* Dashboard Route */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* News Detail Route */}
        <Route path="/news/detail/:id" element={<NewsDetailPage />} />

        {/* Quiz Routes */}
        <Route path="/quiz" element={<QuizListPage />} />
        <Route path="/quiz/list" element={<Navigate to="/quiz" replace />} />
        <Route path="/quiz/play" element={<QuizPage />} />
        <Route path="/quiz/play/:id" element={<QuizPage />} />
        <Route path="/quiz/level/:levelId" element={<QuizPage />} />
        <Route path="/quiz/daily" element={<QuizPage />} />
        <Route path="/quiz/completion" element={<QuizCompletionPage />} />

        {/* Utility Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPageFull />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPageFull />} />
        <Route path={ROUTES.CHANGE_PASSWORD} element={<PlaceholderPage title="비밀번호 변경" />} />
        <Route path={ROUTES.MY_PAGE} element={<MyPageEnhanced />} />

        {/* MyPage Subpages */}
        <Route path="/mypage/profile" element={<PlaceholderPage title="프로필 정보" />} />
        <Route path="/mypage/profile/kidney-disease-stage" element={<KidneyDiseaseStagePage />} />
        <Route path="/mypage/test-results" element={<HealthRecordsPage />} />
        <Route path="/mypage/bookmark" element={<BookmarkPage />} />

        <Route path={ROUTES.SUBSCRIBE} element={<PlaceholderPage title="구독" />} />
        <Route path={ROUTES.NOTIFICATION} element={<PlaceholderPage title="알림" />} />
        <Route path={ROUTES.SUPPORT} element={<SupportPage />} />
        <Route path={ROUTES.TERMS_CONDITIONS} element={<PlaceholderPage title="약관" />} />
        <Route path={ROUTES.PRIVACY_POLICY} element={<PlaceholderPage title="개인정보처리방침" />} />
        <Route path={ROUTES.COOKIE_CONSENT} element={<PlaceholderPage title="쿠키" />} />
        <Route path={ROUTES.ERROR} element={<PlaceholderPage title="에러" />} />

        {/* Fallback */}
        <Route path="*" element={<PlaceholderPage title="404 Not Found" />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
