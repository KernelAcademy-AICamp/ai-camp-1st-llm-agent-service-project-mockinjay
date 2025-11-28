import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../types/careguide-ia';
import { Send, Stethoscope, Utensils, FileText, ArrowRight, Sparkles, TrendingUp, Users, BookOpen } from 'lucide-react';
import { Logo } from '../components/common/Logo';

interface CategoryItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  desc: string;
  route: string;
  color: string;
  bg: string;
  border: string;
}

interface CategoryCardProps {
  category: CategoryItem;
  onClick: () => void;
  index: number;
  language: 'ko' | 'en';
}

// Extracted CategoryCard component for better performance
const CategoryCard: React.FC<CategoryCardProps> = React.memo(({ category, onClick, index, language }) => {
  const IconComponent = category.icon;

  return (
    <button
      onClick={onClick}
      className={`group relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 text-left overflow-hidden ${category.border} focus:outline-none focus:ring-2 focus:ring-primary/30 touch-target`}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-label={`${category.label} - ${category.desc}`}
    >
      <div className={`absolute top-0 right-0 p-20 ${category.bg} rounded-bl-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 transform translate-x-1/2 -translate-y-1/2`} aria-hidden="true" />

      <div className="relative z-10 space-y-4">
        <div className={`w-12 h-12 rounded-xl ${category.bg} ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`} aria-hidden="true">
          <IconComponent size={24} />
        </div>

        <div>
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
            {category.label}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {category.desc}
          </p>
        </div>

        <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-primary transition-colors">
          {language === 'ko' ? '바로가기' : 'Explore'}
          <ArrowRight size={16} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
});

CategoryCard.displayName = 'CategoryCard';

// Quick Action Button Component
interface QuickActionProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = React.memo(({ icon: IconComponent, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700 hover:text-gray-900 active:scale-95 touch-target ${color}`}
  >
    <IconComponent size={16} />
    <span>{label}</span>
  </button>
));

QuickAction.displayName = 'QuickAction';

// Suggested Questions Component
interface SuggestedQuestionProps {
  question: string;
  onClick: () => void;
}

const SuggestedQuestion: React.FC<SuggestedQuestionProps> = React.memo(({ question, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border border-primary/10 rounded-xl text-sm text-gray-700 transition-all hover:shadow-sm active:scale-[0.98] touch-target"
  >
    <Sparkles size={14} className="text-primary opacity-60 group-hover:opacity-100" />
    <span className="text-left">{question}</span>
  </button>
));

SuggestedQuestion.displayName = 'SuggestedQuestion';

const MainPageFull: React.FC = () => {
  const { language } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Memoized translations
  const t = useMemo(() => ({
    mainTitle: language === 'ko'
      ? (isAuthenticated && user?.fullName ? `${user.fullName}님, 무엇을 도와드릴까요?` : '무엇을 도와드릴까요?')
      : (isAuthenticated && user?.fullName ? `Hi ${user.fullName}, how can we help?` : 'How can we help you today?'),
    mainDescription: language === 'ko'
      ? 'CarePlus는 당신의 건강한 삶을 위한 맞춤형 AI 파트너입니다. 의료 복지부터 식단 관리까지, 필요한 정보를 쉽고 빠르게 찾아보세요.'
      : 'CarePlus is your personalized AI partner for a healthy life. Find everything from medical welfare to diet management easily and quickly.',
    searchPlaceholder: language === 'ko' ? '궁금한 점을 자유롭게 물어보세요...' : 'Ask anything about your health...',
    explore: language === 'ko' ? '바로가기' : 'Explore',
    quickActions: language === 'ko' ? '빠른 액션' : 'Quick Actions',
    suggestedQuestions: language === 'ko' ? '자주 묻는 질문' : 'Suggested Questions',
  }), [language, isAuthenticated, user?.fullName]);

  // Suggested questions
  const suggestedQuestions = useMemo(() => [
    language === 'ko' ? '만성신장병 환자 식단 관리 방법' : 'Diet management for CKD patients',
    language === 'ko' ? '신장병 단계별 증상과 관리' : 'CKD stages and management',
    language === 'ko' ? '의료비 지원 제도 안내' : 'Medical cost support programs',
  ], [language]);

  // Quick actions
  const quickActions = useMemo(() => [
    {
      icon: TrendingUp,
      label: language === 'ko' ? '트렌드' : 'Trends',
      onClick: () => navigate(ROUTES.TRENDS),
      color: 'hover:border-purple-300',
    },
    {
      icon: Users,
      label: language === 'ko' ? '커뮤니티' : 'Community',
      onClick: () => navigate(ROUTES.COMMUNITY),
      color: 'hover:border-blue-300',
    },
    {
      icon: BookOpen,
      label: language === 'ko' ? '퀴즈' : 'Quiz',
      onClick: () => navigate(ROUTES.QUIZ),
      color: 'hover:border-green-300',
    },
  ], [language, navigate]);

  // Memoized categories
  const categories: CategoryItem[] = useMemo(() => [
    {
      id: 'medical',
      icon: Stethoscope,
      label: language === 'ko' ? '의료복지' : 'Medical Welfare',
      desc: language === 'ko' ? '의료비 지원 및 복지 혜택' : 'Medical support & benefits',
      route: ROUTES.CHAT_MEDICAL_WELFARE,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'group-hover:border-blue-200'
    },
    {
      id: 'nutrition',
      icon: Utensils,
      label: language === 'ko' ? '식이영양' : 'Diet & Nutrition',
      desc: language === 'ko' ? '맞춤형 식단 가이드' : 'Personalized diet guide',
      route: ROUTES.CHAT_NUTRITION,
      color: 'text-green-500',
      bg: 'bg-green-50',
      border: 'group-hover:border-green-200'
    },
    {
      id: 'research',
      icon: FileText,
      label: language === 'ko' ? '연구논문' : 'Research Papers',
      desc: language === 'ko' ? '최신 신장병 연구 자료' : 'Latest kidney research',
      route: ROUTES.CHAT_RESEARCH,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      border: 'group-hover:border-purple-200'
    }
  ], [language]);

  const handleCategoryClick = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      navigate(ROUTES.CHAT, { state: { initialMessage: message } });
    }
  }, [message, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-surface-alt safe-area-top safe-area-bottom">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className={`w-full max-w-4xl flex flex-col items-center space-y-8 sm:space-y-12 transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* Header Section */}
        <header className="text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
            <Logo size="lg" />
          </div>

          <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 px-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              {t.mainTitle}
            </h1>
            <p className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl mx-auto">
              {t.mainDescription}
            </p>
          </div>
        </header>

        {/* Search Section */}
        <div className="w-full max-w-2xl relative group z-10 px-2">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" aria-hidden="true" />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl" role="search">
            <label htmlFor="main-search" className="sr-only">
              {t.searchPlaceholder}
            </label>
            <input
              id="main-search"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 pr-14 sm:pr-16 rounded-2xl bg-transparent border-2 border-transparent focus:border-primary/20 outline-none text-base sm:text-lg text-gray-800 placeholder-gray-400 transition-all"
              aria-describedby="search-hint"
            />
            <span id="search-hint" className="sr-only">
              {language === 'ko' ? '건강 관련 질문을 입력하고 엔터를 누르세요' : 'Type your health question and press enter'}
            </span>
            <button
              type="submit"
              disabled={!message.trim()}
              className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-xl transition-all duration-300 touch-target ${
                message.trim()
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              aria-label={language === 'ko' ? '검색' : 'Search'}
            >
              <Send size={20} className={message.trim() ? 'ml-0.5' : ''} aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* Main Categories Grid */}
        <nav className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl px-2 sm:px-4" aria-label={language === 'ko' ? '빠른 메뉴' : 'Quick menu'}>
          {categories.map((cat, idx) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onClick={() => handleCategoryClick(cat.route)}
              index={idx}
              language={language}
            />
          ))}
        </nav>

        {/* Suggested Questions */}
        <section className="w-full max-w-3xl px-2 sm:px-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-500 text-center">
            {t.suggestedQuestions}
          </h3>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {suggestedQuestions.map((question, idx) => (
              <SuggestedQuestion
                key={idx}
                question={question}
                onClick={() => {
                  setMessage(question);
                  navigate(ROUTES.CHAT, { state: { initialMessage: question } });
                }}
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="w-full max-w-2xl px-2 sm:px-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-500 text-center">
            {t.quickActions}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickActions.map((action, idx) => (
              <QuickAction
                key={idx}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                color={action.color}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 sm:pt-8 pb-4">
          <p className="text-sm text-gray-400">
            © 2025 CarePlus. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MainPageFull;
