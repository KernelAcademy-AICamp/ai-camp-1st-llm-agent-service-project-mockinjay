/**
 * Enhanced MyPage Component with Modal Integration
 * CarePlus 마이페이지 - 모달 통합 버전
 */
import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  CreditCard,
  Bell,
  FileText,
  LogOut,
  Trophy,
  Target,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { useQuizStats } from '../hooks/useQuizStats';
import { QuizStatsSkeleton, ProfileCardSkeleton, MenuSectionSkeleton, HealthInfoSkeleton } from '../components/mypage/shared/Skeleton';
import { QuizStatsError } from '../components/mypage/shared/ErrorState';
import { QuizStatsEmpty, HealthProfileEmpty } from '../components/mypage/shared/EmptyState';

// Import modal components
import {
  ProfileEditModal,
  HealthProfileModal,
  SettingsModal,
  BookmarkedPapersModal,
  MyPostsModal,
} from '../components/mypage/MyPageModals';

const MyPageEnhanced: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { stats: quizStats, isLoading, error, refetch } = useQuizStats(user?.id);

  // Modal state management
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);

  // Form submission state
  const [, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Mock data for demonstration - replace with actual API calls
  const [bookmarkedPapers, setBookmarkedPapers] = useState([
    {
      id: '1',
      title: 'The effects of plant-based diets on cardiovascular health: A systematic review',
      authors: 'Kim, J., Lee, S., Park, H.',
      journal: 'Journal of Nutrition',
      year: '2024',
      bookmarkedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'Machine learning approaches for early detection of chronic kidney disease',
      authors: 'Chen, L., Wang, M., Zhang, Y.',
      journal: 'Nature Medicine',
      year: '2023',
      bookmarkedAt: '2024-01-10T14:30:00Z',
    },
  ]);

  const [myPosts, setMyPosts] = useState([
    {
      id: '1',
      title: '건강한 식단 유지하는 방법 공유합니다',
      content: '안녕하세요! 저는 최근 6개월 동안 식단 관리를 통해...',
      postType: 'BOARD' as const,
      likes: 24,
      commentCount: 8,
      createdAt: '2024-01-20T09:00:00Z',
    },
    {
      id: '2',
      title: '30일 걷기 챌린지 참여하실 분!',
      content: '매일 1만보 걷기 챌린지 함께 하실 분 모집합니다...',
      postType: 'CHALLENGE' as const,
      likes: 45,
      commentCount: 15,
      createdAt: '2024-01-18T11:00:00Z',
    },
  ]);

  // Announce stats update to screen readers
  useEffect(() => {
    if (quizStats) {
      const announcement = `퀴즈 통계가 업데이트되었습니다. 총 획득 점수 ${quizStats.totalScore}점, 완료한 퀴즈 ${quizStats.totalSessions}개`;
      const liveRegion = document.getElementById('quiz-stats-live-region-enhanced');
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
    }
  }, [quizStats]);

  // Handler functions with loading states
  const handleLogout = () => {
    logout();
    navigate(ROUTES.MAIN);
  };

  const handleProfileSave = async (_data: unknown) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // TODO: Implement API call to save profile
      // await updateUserProfile(user.id, data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSubmitSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHealthProfileSave = async (_data: unknown) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // TODO: Implement API call to save health profile
      // await updateHealthProfile(user.id, data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSubmitSuccess('건강 프로필이 성공적으로 업데이트되었습니다.');
      setTimeout(() => {
        setIsHealthModalOpen(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '건강 프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettingsSave = async (_settings: unknown) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // TODO: Implement API call to save settings
      // await updateUserSettings(user.id, settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSubmitSuccess('설정이 성공적으로 저장되었습니다.');
      setTimeout(() => {
        setIsSettingsModalOpen(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBookmark = async (paperId: string) => {
    try {
      setBookmarkedPapers((prev) => prev.filter((p) => p.id !== paperId));
      // TODO: Implement API call to remove bookmark
      // await removeBookmark(paperId);
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      // Re-add the paper if the API call fails
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      // TODO: Implement API call to delete post
      // await deletePost(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
      // Re-add the post if the API call fails
    }
  };

  // User initials for avatar
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.username?.substring(0, 2).toUpperCase() || 'U';

  // Quiz stats
  const totalQuizzesTaken = quizStats?.totalSessions || 0;
  const totalCorrect = quizStats?.correctAnswers || 0;
  const totalQuestions = quizStats?.totalQuestions || 0;
  const totalPoints = quizStats?.totalScore || 0;
  const accuracyRate = quizStats?.accuracyRate || 0;
  const currentStreak = quizStats?.currentStreak || 0;
  const bestStreak = quizStats?.bestStreak || 0;

  const hasQuizData = quizStats && totalQuizzesTaken > 0;

  // Show full page skeleton on initial load
  if (isLoading && !quizStats) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse mb-8"></div>
        <ProfileCardSkeleton />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <MenuSectionSkeleton items={5} />
            <MenuSectionSkeleton items={2} />
          </div>
          <div className="space-y-6">
            <QuizStatsSkeleton />
            <HealthInfoSkeleton />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Screen reader live region for dynamic content */}
      <div id="quiz-stats-live-region-enhanced" className="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">마이페이지</h1>

      {/* Success/Error Messages */}
      {submitSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {submitError}
        </div>
      )}

      {/* Profile Card */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8" aria-label="프로필 정보">
        <div className="p-8 flex items-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold mr-6" role="img" aria-label={`${user?.fullName || user?.username || '사용자'} 프로필 이미지`}>
            {userInitials}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.fullName || user?.username || '사용자'}
            </h2>
            <p className="text-gray-600">{user?.email || 'email@example.com'}</p>
            <div className="mt-2 flex space-x-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full" role="status">
                {totalQuizzesTaken}개 퀴즈 완료
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Settings */}
          <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" aria-label="계정 설정">
            <h3 className="p-4 border-b border-gray-100 font-bold text-gray-900">
              계정 설정
            </h3>
            <div className="divide-y divide-gray-100" role="list">
              <MenuItem
                icon={<User size={20} />}
                label="프로필 정보"
                onClick={() => setIsProfileModalOpen(true)}
              />
              <MenuItem
                icon={<Heart size={20} />}
                label="건강 프로필"
                onClick={() => setIsHealthModalOpen(true)}
              />
              <MenuItem
                icon={<Settings size={20} />}
                label="환경 설정"
                onClick={() => setIsSettingsModalOpen(true)}
              />
              <MenuItem icon={<CreditCard size={20} />} label="구독 및 결제" />
              <MenuItem icon={<Bell size={20} />} label="알림 설정" />
            </div>
          </nav>

          {/* Content & Activity */}
          <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" aria-label="콘텐츠 및 활동">
            <h3 className="p-4 border-b border-gray-100 font-bold text-gray-900">
              콘텐츠 및 활동
            </h3>
            <div className="divide-y divide-gray-100" role="list">
              <MenuItem
                icon={<FileText size={20} />}
                label="북마크한 논문"
                onClick={() => setIsBookmarksModalOpen(true)}
                badge={bookmarkedPapers.length}
              />
              <MenuItem
                icon={<FileText size={20} />}
                label="내 커뮤니티 게시글"
                onClick={() => setIsPostsModalOpen(true)}
                badge={myPosts.length}
              />
            </div>
          </nav>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Quiz Stats with Loading/Error/Empty States */}
          {isLoading ? (
            <QuizStatsSkeleton />
          ) : error ? (
            <QuizStatsError onRetry={refetch} />
          ) : !hasQuizData ? (
            <QuizStatsEmpty onStartQuiz={() => navigate('/quiz')} />
          ) : (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" aria-labelledby="quiz-stats-heading-enhanced">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-primary-600" size={24} aria-hidden="true" />
                <h3 id="quiz-stats-heading-enhanced" className="font-bold text-gray-900">퀴즈 통계</h3>
              </div>

              {/* Total Points Card */}
              <div
                className="rounded-xl p-4 mb-4"
                style={{ background: 'var(--gradient-primary)' }}
                role="region"
                aria-label="총 획득 점수"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white" aria-label={`${totalPoints}점`}>{totalPoints}</div>
                    <div className="text-sm text-white/90">총 획득 점수</div>
                  </div>
                  <Trophy className="text-white/80" size={32} aria-hidden="true" />
                </div>
              </div>

              {/* Detailed Stats */}
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <Trophy size={16} className="text-primary-500" aria-hidden="true" />
                    완료한 퀴즈
                  </dt>
                  <dd className="font-semibold text-gray-900">{totalQuizzesTaken}개</dd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <Target size={16} className="text-accent-purple" aria-hidden="true" />
                    맞춘 문제
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {totalCorrect}/{totalQuestions}
                  </dd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <Target size={16} className="text-primary-500" aria-hidden="true" />
                    정답률
                  </dt>
                  <dd className="font-semibold text-primary-600">
                    {accuracyRate.toFixed(1)}%
                  </dd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <TrendingUp size={16} className="text-orange-500" aria-hidden="true" />
                    현재 연속
                  </dt>
                  <dd className="font-semibold text-orange-600">
                    {currentStreak}회
                    <span role="img" aria-label="불꽃"> 🔥</span>
                  </dd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <TrendingUp size={16} className="text-amber-500" aria-hidden="true" />
                    최고 연속
                  </dt>
                  <dd className="font-semibold text-amber-600">{bestStreak}회</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Health Info Card with Empty State */}
          <HealthProfileEmpty onSetup={() => setIsHealthModalOpen(true)} />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
            aria-label="로그아웃"
          >
            <LogOut size={18} className="mr-2" aria-hidden="true" /> 로그아웃
          </button>
        </div>
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={{
          fullName: user?.fullName || '',
          email: user?.email || '',
          phone: '',
          birthDate: '',
        }}
        onSave={handleProfileSave}
      />

      <HealthProfileModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        onSave={handleHealthProfileSave}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSettingsSave}
      />

      <BookmarkedPapersModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        papers={bookmarkedPapers}
        onRemoveBookmark={handleRemoveBookmark}
      />

      <MyPostsModal
        isOpen={isPostsModalOpen}
        onClose={() => setIsPostsModalOpen(false)}
        posts={myPosts}
        onDeletePost={handleDeletePost}
      />
    </div>
  );
};

// MenuItem Component with optional badge
const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
}> = ({ icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 min-h-[44px]"
    role="listitem"
    aria-label={badge ? `${label}, ${badge}개` : label}
  >
    <div className="flex items-center">
      <div className="text-gray-500 mr-4 group-hover:text-primary-600 transition-colors" aria-hidden="true">
        {icon}
      </div>
      <span className="text-gray-700 font-medium group-hover:text-gray-900">
        {label}
      </span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="px-2.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full" aria-hidden="true">
        {badge}
      </span>
    )}
  </button>
);

export default MyPageEnhanced;
