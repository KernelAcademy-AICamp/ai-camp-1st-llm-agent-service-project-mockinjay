import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, Clock, ChevronRight, CheckCircle, Zap, Target } from 'lucide-react';
import { MobileHeader } from '../components/layout/MobileHeader';

interface QuizItem {
  id: string;
  title: string;
  description: string;
  questions: number;
  points: number;
  completed: boolean;
  level: string;
  type: 'OX';
}

interface QuizCardProps {
  quiz: QuizItem;
  onClick: () => void;
  variant?: 'default' | 'featured';
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconColor?: string;
  valueColor?: string;
}

const quizList: QuizItem[] = [
  {
    id: 'ox-1',
    title: '신장병 기본 상식 O/X',
    description: '만성콩팥병의 정의와 주요 원인에 대해 알아봅니다.',
    questions: 10,
    points: 100,
    completed: true,
    level: '1레벨',
    type: 'OX'
  },
  {
    id: 'ox-2',
    title: '칼륨이 많은 과일 O/X',
    description: '어떤 과일에 칼륨이 많은지 퀴즈로 확인해보세요.',
    questions: 10,
    points: 100,
    completed: false,
    level: '2레벨',
    type: 'OX'
  },
  {
    id: 'ox-3',
    title: '투석 환자 식단 O/X',
    description: '투석 환자에게 올바른 식단인지 O/X로 풀어보세요.',
    questions: 10,
    points: 100,
    completed: false,
    level: '3레벨',
    type: 'OX'
  },
  {
    id: 'ox-4',
    title: '나트륨 섭취 줄이기 O/X',
    description: '일상 생활에서 나트륨을 줄이는 올바른 방법은?',
    questions: 10,
    points: 100,
    completed: false,
    level: '4레벨',
    type: 'OX'
  },
  {
    id: 'ox-5',
    title: '고인산혈증 예방 O/X',
    description: '인 섭취를 줄이기 위한 올바른 식습관 O/X',
    questions: 10,
    points: 100,
    completed: false,
    level: '5레벨',
    type: 'OX'
  }
];

// Reusable Stat Card Component
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconColor = 'text-primary', valueColor = 'text-gray-900' }) => (
  <div className="p-5 rounded-xl border border-gray-200 bg-white">
    <div className="flex items-center gap-2 mb-2">
      <span className={iconColor}>{icon}</span>
      <span className="text-sm text-gray-600 font-medium">{label}</span>
    </div>
    <div className={`text-2xl font-bold ${valueColor}`}>
      {value}
    </div>
  </div>
);

// Reusable Quiz Card Component
const QuizCard: React.FC<QuizCardProps> = ({ quiz, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-primary transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary/20"
    aria-label={`${quiz.title}, ${quiz.level}, ${quiz.questions}개 문제, ${quiz.points}포인트${quiz.completed ? ', 완료됨' : ''}`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-bold text-gray-900">
            {quiz.title}
          </h3>
          {quiz.completed && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-light text-primary text-xs font-medium">
              <CheckCircle size={12} strokeWidth={2} aria-hidden="true" />
              <span>완료</span>
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {quiz.description}
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded-md bg-primary-light text-primary font-medium">
            {quiz.level}
          </span>
          <span className="text-gray-500">
            문제 {quiz.questions}개
          </span>
          <span className="flex items-center gap-1 text-secondary font-medium">
            <Star size={12} strokeWidth={2} aria-hidden="true" />
            {quiz.points}P
          </span>
        </div>
      </div>
      <ChevronRight
        size={24}
        className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  </button>
);

export default function QuizListPage() {
  const navigate = useNavigate();

  // Memoized calculations
  const { totalPoints, completedCount, progressPercent, currentLevel } = useMemo(() => {
    const total = quizList.reduce((sum, quiz) => sum + (quiz.completed ? quiz.points : 0), 0);
    const completed = quizList.filter(q => q.completed).length;
    const progress = Math.round((completed / quizList.length) * 100);
    const level = completed > 0 ? completed : 1;
    return { totalPoints: total, completedCount: completed, progressPercent: progress, currentLevel: level };
  }, []);

  // Event handlers with useCallback
  const handleLevelQuizStart = useCallback((quizId: string, quizTitle: string, quizLevel: string) => {
    navigate('/quiz/play', {
      state: {
        mode: 'level',
        quizTitle,
        quizLevel,
        levelId: quizId,
      }
    });
  }, [navigate]);

  const handleDailyQuizStart = useCallback(() => {
    navigate('/quiz/play', {
      state: { mode: 'daily' }
    });
  }, [navigate]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader
          title="퀴즈미션"
          showMenu={true}
          showProfile={true}
        />
      </div>

      <main className="flex-1 overflow-y-auto p-5 lg:p-10 pb-24 lg:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Daily Quiz Section */}
          <section
            className="mb-8 p-6 rounded-xl border-2 border-primary bg-gradient-to-r from-primary-light to-green-50"
            aria-labelledby="daily-quiz-title"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={24} className="text-primary" strokeWidth={2} aria-hidden="true" />
                  <h2 id="daily-quiz-title" className="text-lg font-bold text-gray-900">오늘의 퀴즈</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  매일 새로운 문제로 신장병 지식을 쌓아보세요!<br />
                  난이도를 선택해서 5문제를 풀어보세요.
                </p>
                <button
                  onClick={handleDailyQuizStart}
                  className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 bg-gradient-to-r from-primary to-secondary touch-target"
                  aria-label="오늘의 퀴즈 시작하기"
                >
                  <span className="flex items-center gap-2">
                    <Target size={18} aria-hidden="true" />
                    시작하기
                  </span>
                </button>
              </div>
              <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-full bg-white/50" aria-hidden="true">
                <Trophy size={48} className="text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </section>

          {/* Progress Bar */}
          <section className="mb-6" aria-labelledby="progress-title">
            <div className="flex items-center justify-between mb-2">
              <h2 id="progress-title" className="text-sm font-medium text-gray-600">학습 진행도</h2>
              <span className="text-sm font-bold text-primary">
                {completedCount}/{quizList.length} 완료 ({progressPercent}%)
              </span>
            </div>
            <div
              className="w-full bg-gray-200 rounded-full h-3"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`학습 진행도 ${progressPercent}%`}
            >
              <div
                className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-secondary"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>

          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" aria-label="퀴즈 통계">
            <StatCard
              icon={<Trophy size={20} strokeWidth={2} />}
              label="완료한 퀴즈"
              value={<>{completedCount}<span className="text-base font-normal text-gray-400">/{quizList.length}</span></>}
              iconColor="text-primary"
            />
            <StatCard
              icon={<Star size={20} strokeWidth={2} />}
              label="지식 레벨"
              value={`레벨 ${currentLevel}`}
              iconColor="text-amber-500"
            />
            <StatCard
              icon={<Clock size={20} strokeWidth={2} />}
              label="획득 포인트"
              value={`${totalPoints}P`}
              iconColor="text-secondary"
              valueColor="text-secondary"
            />
          </section>

          {/* Level Test Section */}
          <section aria-labelledby="level-test-title" className="mb-8">
            <h2 id="level-test-title" className="text-lg font-bold text-gray-900 mb-4">레벨 테스트</h2>
            <div className="grid gap-4">
              <QuizCard
                quiz={quizList[0]}
                onClick={() => handleLevelQuizStart(quizList[0].id, quizList[0].title, quizList[0].level)}
              />
            </div>
          </section>

          {/* Level Quiz Section */}
          <section aria-labelledby="level-quiz-title">
            <h2 id="level-quiz-title" className="text-lg font-bold text-gray-900 mb-4">레벨별 퀴즈</h2>
            <div className="grid gap-4">
              {quizList.slice(1).map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={() => handleLevelQuizStart(quiz.id, quiz.title, quiz.level)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
