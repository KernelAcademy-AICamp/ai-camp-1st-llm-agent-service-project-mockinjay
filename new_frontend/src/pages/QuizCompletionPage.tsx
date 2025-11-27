import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Trophy, Award, Target, RotateCcw, Home } from 'lucide-react';

interface LocationState {
  score: number;
  maxScore: number;
  pointsPerCorrect: number;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Default values
const DEFAULT_MAX_SCORES: Record<string, number> = {
  easy: 15,
  medium: 25,
  hard: 35,
};

const DEFAULT_POINTS_PER_CORRECT: Record<string, number> = {
  easy: 3,
  medium: 5,
  hard: 7,
};

const QuizCompletionPage: React.FC = () => {
  const { language } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // Default values if state is missing
  const score = state?.score || 0;
  const difficulty = state?.difficulty || 'easy';
  const maxScore = state?.maxScore || DEFAULT_MAX_SCORES[difficulty];
  const pointsPerCorrect = state?.pointsPerCorrect || DEFAULT_POINTS_PER_CORRECT[difficulty];
  const totalQuestions = state?.totalQuestions || 5;

  // Calculate correct answers count
  const correctAnswers = Math.floor(score / pointsPerCorrect);
  const incorrectAnswers = totalQuestions - correctAnswers;

  // Calculate percentage based on maxScore
  const percentage = Math.round((score / maxScore) * 100);

  // Determine performance level and color
  const getPerformanceLevel = () => {
    if (percentage >= 90) {
      return {
        text: language === 'ko' ? '완벽해요!' : 'Perfect!',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: Trophy,
      };
    } else if (percentage >= 70) {
      return {
        text: language === 'ko' ? '잘했어요!' : 'Great Job!',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: Award,
      };
    } else if (percentage >= 50) {
      return {
        text: language === 'ko' ? '좋아요!' : 'Good!',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: Target,
      };
    } else {
      return {
        text: language === 'ko' ? '다시 도전해보세요!' : 'Try Again!',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        icon: Target,
      };
    }
  };

  const performance = getPerformanceLevel();
  const PerformanceIcon = performance.icon;

  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'easy':
        return language === 'ko' ? '쉬움' : 'Easy';
      case 'medium':
        return language === 'ko' ? '보통' : 'Medium';
      case 'hard':
        return language === 'ko' ? '어려움' : 'Hard';
      default:
        return '';
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'hard':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const handleRetry = () => {
    navigate('/quiz', { replace: true });
  };

  const handleGoHome = () => {
    navigate('/main', { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-3">
          <Trophy className="text-green-600" />
          {language === 'ko' ? '퀴즈 완료' : 'Quiz Completed'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ko'
            ? '수고하셨습니다! 결과를 확인해보세요.'
            : 'Well done! Check your results below.'}
        </p>
      </div>

      {/* Main Results Card */}
      <div className={`${performance.bgColor} border ${performance.borderColor} p-8 rounded-lg shadow-lg mb-6`}>
        <div className="text-center">
          <PerformanceIcon className={`mx-auto ${performance.color} mb-4`} size={80} />
          <h2 className={`text-4xl font-bold ${performance.color} mb-4`}>
            {performance.text}
          </h2>

          {/* Difficulty Badge */}
          <div className="mb-6">
            <span className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getDifficultyColor()}`}>
              {getDifficultyLabel()}
            </span>
          </div>

          {/* Score Display */}
          <div className="mb-6">
            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
              {score}/{maxScore}
            </div>
            <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              {percentage}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {language === 'ko' ? `${totalQuestions}문제 완료` : `${totalQuestions} questions completed`}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  percentage >= 90
                    ? 'bg-green-600'
                    : percentage >= 70
                    ? 'bg-blue-600'
                    : percentage >= 50
                    ? 'bg-yellow-600'
                    : 'bg-orange-600'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-green-600 mb-1">{correctAnswers}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ko' ? '정답' : 'Correct'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-red-600 mb-1">{incorrectAnswers}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ko' ? '오답' : 'Incorrect'}
              </div>
            </div>
          </div>

          {/* Points Info */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {language === 'ko'
              ? `정답당 ${pointsPerCorrect}점 × ${correctAnswers}개 = ${score}점`
              : `${pointsPerCorrect} pts × ${correctAnswers} correct = ${score} pts`
            }
          </div>
        </div>
      </div>

      {/* Encouragement Message */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {language === 'ko' ? '학습 팁' : 'Learning Tip'}
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {percentage >= 90
            ? language === 'ko'
              ? '완벽한 점수입니다! 다음 난이도에 도전해보세요.'
              : 'Perfect score! Try challenging yourself with the next difficulty level.'
            : percentage >= 70
            ? language === 'ko'
              ? '훌륭한 성적입니다! 조금만 더 복습하면 완벽할 거예요.'
              : 'Great job! A bit more review and you\'ll be perfect.'
            : percentage >= 50
            ? language === 'ko'
              ? '잘하고 있어요! 틀린 문제를 다시 한번 확인해보세요.'
              : 'You\'re doing well! Review the questions you missed.'
            : language === 'ko'
            ? '포기하지 마세요! 학습 자료를 다시 한번 확인하고 재도전해보세요.'
            : 'Don\'t give up! Review the learning materials and try again.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleRetry}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <RotateCcw size={20} />
          {language === 'ko' ? '다시 풀기' : 'Try Again'}
        </button>
        <button
          onClick={handleGoHome}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          <Home size={20} />
          {language === 'ko' ? '홈으로' : 'Go Home'}
        </button>
      </div>
    </div>
  );
};

export default QuizCompletionPage;
