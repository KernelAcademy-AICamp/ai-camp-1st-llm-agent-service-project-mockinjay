/**
 * QuizResultsPage Component
 * 퀴즈 완료 후 결과 페이지
 */
import React from 'react';
import { Trophy, Target, TrendingUp, Award, ChevronRight, BarChart3 } from 'lucide-react';

interface CategoryPerformance {
  category: string;
  correct: number;
  total: number;
  rate: number;
}

export interface QuizResults {
  sessionId: string;
  userId: string;
  sessionType: string;
  totalQuestions: number;
  correctAnswers: number;
  finalScore: number;
  accuracyRate: number;
  completedAt: string;
  streak?: number;
  categoryPerformance: CategoryPerformance[];
}

interface QuizResultsPageProps {
  results: QuizResults;
  onRetry?: () => void;
  onClose?: () => void;
}

const QuizResultsPage: React.FC<QuizResultsPageProps> = ({ results, onRetry, onClose }) => {
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      nutrition: '영양',
      treatment: '치료',
      lifestyle: '생활습관',
    };
    return labels[category] || category;
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (rate >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (rate >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGrade = (rate: number) => {
    if (rate >= 90) return 'A+';
    if (rate >= 80) return 'A';
    if (rate >= 70) return 'B+';
    if (rate >= 60) return 'B';
    if (rate >= 50) return 'C';
    return 'D';
  };

  const getMessage = (rate: number) => {
    if (rate >= 90) return '완벽합니다! 훌륭한 신장병 지식을 가지고 계시네요! 🎉';
    if (rate >= 80) return '매우 잘하셨어요! 조금만 더 노력하면 만점이에요! 👏';
    if (rate >= 70) return '잘하셨어요! 몇 가지 더 공부하면 전문가가 될 수 있어요! 💪';
    if (rate >= 60) return '괜찮아요! 부족한 부분을 보완하면 더 좋아질 거예요! 📚';
    if (rate >= 50) return '절반 성공! 좀 더 학습이 필요합니다. 화이팅! 💡';
    return '다시 도전해보세요! 꾸준히 학습하면 실력이 늘어요! 🌱';
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-purple/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
          {/* Header Section */}
          <div className="p-8 text-center" style={{ background: 'var(--gradient-primary)' }}>
            <div className="mb-4">
              <Trophy className="w-20 h-20 mx-auto mb-4 animate-bounce text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-white">퀴즈 완료!</h1>
            <p className="text-white/90">
              {getMessage(results.accuracyRate)}
            </p>
          </div>

          {/* Main Results Section */}
          <div className="p-8">
            {/* Score Overview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl p-6 border-2 border-primary-200 dark:border-primary-700">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="text-primary-600 dark:text-primary-400" size={24} />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">정확도</span>
                </div>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {results.accuracyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                  등급: {getGrade(results.accuracyRate)}
                </div>
              </div>

              <div className="rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700" style={{ background: 'var(--gradient-primary)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Award className="text-white" size={24} />
                  <span className="text-sm font-medium text-white">획득 점수</span>
                </div>
                <div className="text-4xl font-bold text-white">
                  {results.finalScore}점
                </div>
                <div className="text-sm text-white/90 mt-1">
                  {results.correctAnswers}/{results.totalQuestions} 정답
                </div>
              </div>
            </div>

            {/* Streak (if available) */}
            {results.streak !== undefined && results.streak > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-4 mb-6 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                  <div>
                    <div className="font-semibold text-orange-700 dark:text-orange-300">
                      🔥 {results.streak}일 연속 달성!
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      꾸준히 학습하고 계시네요!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Performance */}
            {results.categoryPerformance && results.categoryPerformance.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="text-gray-700 dark:text-gray-300" size={20} />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    카테고리별 성적
                  </h2>
                </div>
                <div className="space-y-3">
                  {results.categoryPerformance.map((cat, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {getCategoryLabel(cat.category)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPerformanceColor(cat.rate)}`}>
                          {cat.rate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              cat.rate >= 80
                                ? 'bg-emerald-500'
                                : cat.rate >= 60
                                ? 'bg-blue-500'
                                : cat.rate >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${cat.rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                          {cat.correct}/{cat.total} 정답
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn-primary-action flex-1 flex items-center justify-center gap-2"
                >
                  <ChevronRight size={20} />
                  다시 도전하기
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="btn-ghost flex-1"
                >
                  닫기
                </button>
              )}
            </div>

            {/* Timestamp */}
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              완료 시간: {new Date(results.completedAt).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsPage;
