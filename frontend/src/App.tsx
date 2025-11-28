import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Drawer } from './components/Drawer';
import { LayoutProvider, useLayout } from './components/LayoutContext';
import { MainPage } from './pages/MainPage';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { DietCarePage } from './pages/DietCarePage';
import { NutriCoachPage } from './pages/NutriCoachPage';
import { DietLogPage } from './pages/DietLogPage';
import { QuizPage } from './pages/QuizPage';
import { QuizListPage } from './pages/QuizListPage';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityDetailPage } from './pages/CommunityDetailPage';
import { CommunityCreatePage } from './pages/CommunityCreatePage';
import { CommunityEditPage } from './pages/CommunityEditPage';
import { TrendsPage } from './pages/TrendsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { KidneyDiseaseStagePage } from './pages/KidneyDiseaseStagePage';
import { MyPage } from './pages/MyPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HealthRecordsPage } from './pages/HealthRecordsPage';
import { HealthRecordAddPage } from './pages/HealthRecordAddPage';
import { HealthRecordEditPage } from './pages/HealthRecordEditPage';
import { BookmarkPage } from './pages/BookmarkPage';
import { SupportPage } from './pages/SupportPage';
import { NotificationPage } from './pages/NotificationPage';
import { TermsAndConditionsPage } from './pages/TermsAndConditionsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { AuthProvider } from './contexts/AuthContext';

function AppContent() {
  const { isDrawerOpen, closeDrawer, openDrawer, isLoggedIn, login, logout } = useLayout();
  const location = useLocation();

  const noLayoutPages = ['/login', '/signup', '/home'];
  const isNoLayoutPage = noLayoutPages.includes(location.pathname);

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
  };

  if (isNoLayoutPage) {
    return (
      <Routes>
        <Route path="/home" element={<MainPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    );
  }

  return (
    <>
      <Header
        onMenuClick={openDrawer}
        isLoggedIn={isLoggedIn}
        userType={isLoggedIn ? '환우' : undefined}
      />
      <Sidebar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} />

      <main
        className="lg:pt-16 lg:pl-[280px] min-h-screen pb-[64px] lg:pb-0"
        style={{ background: '#F9FAFB' }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/diet-care" element={<DietCarePage />} />
          <Route path="/diet-care/nutri-coach" element={<NutriCoachPage />} />
          <Route path="/diet-care/diet-log" element={<DietLogPage />} />
          <Route path="/quiz/list" element={<QuizListPage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/detail/:id" element={<CommunityDetailPage />} />
          <Route path="/community/create" element={<CommunityCreatePage />} />
          <Route path="/community/edit/:id" element={<CommunityEditPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/news/detail/:id" element={<NewsDetailPage />} />
          <Route path="/mypage" element={isLoggedIn ? <MyPage /> : <Navigate to="/login" />} />
          <Route path="/mypage/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/mypage/profile/kidney-disease-stage" element={<KidneyDiseaseStagePage />} />
          <Route path="/mypage/test-results" element={<HealthRecordsPage />} />
          <Route path="/mypage/test-results/add" element={<HealthRecordAddPage />} />
          <Route path="/mypage/test-results/edit/:id" element={<HealthRecordEditPage />} />
          <Route path="/mypage/bookmark" element={<BookmarkPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/cookie-consent" element={<div className="p-6 max-w-4xl mx-auto"><h2 className="mb-4">쿠키 정책</h2><p>쿠키 정책 내용이 표시됩니다.</p></div>} />
        </Routes>
      </main>

      <MobileNav />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LayoutProvider>
        <AppContent />
      </LayoutProvider>
    </AuthProvider>
  );
}
