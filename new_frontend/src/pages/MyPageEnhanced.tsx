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
import { getUserQuizStats } from '../services/quizApi';
import type { UserQuizStats } from '../services/quizApi';
import { ROUTES } from '../types/careguide-ia';

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
  const [quizStats, setQuizStats] = useState<UserQuizStats | null>(null);

  // Modal state management
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);

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

  // Load quiz stats
  useEffect(() => {
    const loadStats = async () => {
      if (user?.id) {
        try {
          const stats = await getUserQuizStats(user.id);
          setQuizStats(stats);
        } catch (error) {
          console.error('Failed to load quiz stats:', error);
        }
      }
    };
    loadStats();
  }, [user]);

  // Handler functions
  const handleLogout = () => {
    logout();
    navigate(ROUTES.MAIN);
  };

  const handleProfileSave = (data: any) => {
    console.log('Profile saved:', data);
    // TODO: Implement API call to save profile
    // await updateUserProfile(user.id, data);
  };

  const handleHealthProfileSave = (data: any) => {
    console.log('Health profile saved:', data);
    // TODO: Implement API call to save health profile
    // await updateHealthProfile(user.id, data);
  };

  const handleSettingsSave = (settings: any) => {
    console.log('Settings saved:', settings);
    // TODO: Implement API call to save settings
    // await updateUserSettings(user.id, settings);
  };

  const handleRemoveBookmark = (paperId: string) => {
    setBookmarkedPapers((prev) => prev.filter((p) => p.id !== paperId));
    // TODO: Implement API call to remove bookmark
    // await removeBookmark(paperId);
  };

  const handleDeletePost = (postId: string) => {
    setMyPosts((prev) => prev.filter((p) => p.id !== postId));
    // TODO: Implement API call to delete post
    // await deletePost(postId);
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Page</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8 flex items-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold mr-6">
            {userInitials}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.fullName || user?.username || '사용자'}
            </h2>
            <p className="text-gray-500">{user?.email || 'email@example.com'}</p>
            <div className="mt-2 flex space-x-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                {totalQuizzesTaken}개 퀴즈 완료
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
              Account Settings
            </div>
            <div className="divide-y divide-gray-100">
              <MenuItem
                icon={<User size={20} />}
                label="Profile Information"
                onClick={() => setIsProfileModalOpen(true)}
              />
              <MenuItem
                icon={<Heart size={20} />}
                label="Health Profile"
                onClick={() => setIsHealthModalOpen(true)}
              />
              <MenuItem
                icon={<Settings size={20} />}
                label="Preferences"
                onClick={() => setIsSettingsModalOpen(true)}
              />
              <MenuItem icon={<CreditCard size={20} />} label="Subscription & Billing" />
              <MenuItem icon={<Bell size={20} />} label="Notifications" />
            </div>
          </div>

          {/* Content & Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
              Content & Activity
            </div>
            <div className="divide-y divide-gray-100">
              <MenuItem
                icon={<FileText size={20} />}
                label="Bookmarked Papers"
                onClick={() => setIsBookmarksModalOpen(true)}
                badge={bookmarkedPapers.length}
              />
              <MenuItem
                icon={<FileText size={20} />}
                label="My Community Posts"
                onClick={() => setIsPostsModalOpen(true)}
                badge={myPosts.length}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Quiz Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-primary-600" size={24} />
              <h3 className="font-bold text-gray-900">퀴즈 통계</h3>
            </div>

            {/* Total Points Card */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{totalPoints}</div>
                  <div className="text-sm text-white/80">총 획득 점수</div>
                </div>
                <Trophy className="text-white/80" size={32} />
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 flex items-center gap-2">
                  <Trophy size={16} className="text-primary-500" />
                  완료한 퀴즈
                </span>
                <span className="font-semibold text-gray-900">{totalQuizzesTaken}개</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 flex items-center gap-2">
                  <Target size={16} className="text-accent-purple" />
                  맞춘 문제
                </span>
                <span className="font-semibold text-gray-900">
                  {totalCorrect}/{totalQuestions}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 flex items-center gap-2">
                  <Target size={16} className="text-primary-500" />
                  정답률
                </span>
                <span className="font-semibold text-primary-600">
                  {accuracyRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 flex items-center gap-2">
                  <TrendingUp size={16} className="text-orange-500" />
                  현재 연속
                </span>
                <span className="font-semibold text-orange-600">{currentStreak}회 🔥</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-500" />
                  최고 연속
                </span>
                <span className="font-semibold text-amber-600">{bestStreak}회</span>
              </div>
            </div>
          </div>

          {/* Health Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">건강 정보</h3>
            <div className="space-y-3 text-sm">
              <p className="text-gray-500 text-center py-4">
                건강 프로필을 설정하면
                <br />
                맞춤형 정보를 제공받을 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="w-full mt-4 text-primary-600 text-sm font-medium hover:underline"
            >
              건강 프로필 설정
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
          >
            <LogOut size={18} className="mr-2" /> 로그아웃
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
    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
  >
    <div className="flex items-center">
      <div className="text-gray-400 mr-4 group-hover:text-primary-600 transition-colors">
        {icon}
      </div>
      <span className="text-gray-700 font-medium group-hover:text-gray-900">
        {label}
      </span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="px-2.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
        {badge}
      </span>
    )}
  </button>
);

export default MyPageEnhanced;
