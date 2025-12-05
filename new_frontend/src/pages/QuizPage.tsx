import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Trophy, Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { AxiosError } from 'axios';

// 비회원용 익명 ID 생성/관리
const getAnonymousUserId = (): string => {
  const STORAGE_KEY = 'careguide_anonymous_quiz_id';
  try {
    let anonymousId = localStorage.getItem(STORAGE_KEY);

    if (!anonymousId) {
      // 새 익명 ID 생성: anon_timestamp_random
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(STORAGE_KEY, anonymousId);
    }

    return anonymousId;
  } catch (e) {
    console.warn('Could not access localStorage for anonymous ID:', e);
    // Fallback to session-only ID
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
};

interface QuizQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  answer: boolean; // O/X format: true = O, false = X
  explanation: string;
}

interface QuizSession {
  sessionId: string;
  userId: string;
  sessionType: string;
  currentQuestion: QuizQuestion;
  currentQuestionNumber: number;
  totalQuestions: number;
  score: number;
  maxScore: number;           // 최대 점수 (쉬움:15, 보통:25, 어려움:35)
  pointsPerCorrect: number;   // 정답당 점수 (쉬움:3, 보통:5, 어려움:7)
  status: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Fallback values if backend doesn't provide them
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

// Number of questions per quiz (fixed for all difficulties)
const TOTAL_QUESTIONS = 5;

const QuizPage: React.FC = () => {
  const { language } = useApp();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  // 사용자 ID: 로그인 시 실제 ID, 비로그인 시 익명 ID
  const currentUserId = useMemo(() => {
    if (isAuthenticated && user?.id) {
      return user.id;
    }
    return getAnonymousUserId();
  }, [isAuthenticated, user]);

  // 퀴즈 완료 시 2초 후 자동으로 완료 페이지로 이동
  useEffect(() => {
    if (isQuizComplete && showResult) {
      const timer = setTimeout(() => {
        navigate('/quiz/completion', {
          state: {
            score: quizSession?.score || 0,
            maxScore: quizSession?.maxScore || DEFAULT_MAX_SCORES[selectedDifficulty || 'easy'],
            pointsPerCorrect: quizSession?.pointsPerCorrect || DEFAULT_POINTS_PER_CORRECT[selectedDifficulty || 'easy'],
            totalQuestions: TOTAL_QUESTIONS,
            difficulty: quizSession?.difficulty || selectedDifficulty,
          },
        });
      }, 2000);

      return () => clearTimeout(timer); // 타이머 정리 (Cleanup timer)
    }
  }, [isQuizComplete, showResult, quizSession, selectedDifficulty, navigate]);

  const startQuiz = async (difficulty: 'easy' | 'medium' | 'hard') => {
    setLoading(true);
    setError(null);
    setSelectedDifficulty(difficulty);
    setIsQuizComplete(false);
    try {
      const response = await api.post('/api/quiz/session/start', {
        userId: currentUserId,
        sessionType: 'learning_mission',
        category: 'nutrition',
        difficulty,
      });

      setQuizSession({
        ...response.data,
        difficulty: response.data.difficulty || difficulty,
        totalQuestions: response.data.totalQuestions || TOTAL_QUESTIONS,
        maxScore: response.data.maxScore || DEFAULT_MAX_SCORES[difficulty],
        pointsPerCorrect: response.data.pointsPerCorrect || DEFAULT_POINTS_PER_CORRECT[difficulty],
      });
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (err) {
      console.error('Error starting quiz:', err);

      const axiosError = err as AxiosError<{ detail?: string }>;
      let errorMessage = language === 'ko'
        ? '퀴즈를 시작할 수 없습니다.'
        : 'Cannot start quiz.';

      if (axiosError.response) {
        const status = axiosError.response.status;
        const detail = axiosError.response.data?.detail;

        switch (status) {
          case 404:
            errorMessage = language === 'ko'
              ? '퀴즈 서비스를 찾을 수 없습니다. 나중에 다시 시도해주세요.'
              : 'Quiz service not found. Please try again later.';
            break;
          case 500:
            errorMessage = language === 'ko'
              ? detail || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
              : detail || 'Server error occurred. Please try again later.';
            break;
          default:
            errorMessage = language === 'ko'
              ? detail || '퀴즈 생성 중 오류가 발생했습니다.'
              : detail || 'An error occurred while generating quiz.';
        }
      } else if (axiosError.request) {
        errorMessage = language === 'ko'
          ? '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.'
          : 'Cannot connect to server. Please check your network.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !quizSession) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/quiz/session/submit-answer', {
        sessionId: quizSession.sessionId,
        userId: quizSession.userId,
        questionId: quizSession.currentQuestion.id,
        userAnswer: selectedAnswer,
      });

      setIsCorrect(response.data.isCorrect);
      setCorrectAnswer(response.data.correctAnswer);
      setExplanation(response.data.explanation || '');
      setShowResult(true);

      // Check if quiz is complete (either by flag or no next question)
      const quizComplete = response.data.isQuizComplete || !response.data.nextQuestion;

      if (quizComplete) {
        setIsQuizComplete(true);
        // Update final score
        setQuizSession({
          ...quizSession,
          score: response.data.currentScore,
        });
      } else {
        // Update score and next question
        setQuizSession({
          ...quizSession,
          score: response.data.currentScore,
          currentQuestion: response.data.nextQuestion,
          currentQuestionNumber: quizSession.currentQuestionNumber + 1,
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);

      const axiosError = err as AxiosError<{ detail?: string }>;
      let errorMessage = language === 'ko' ? '답안 제출 실패' : 'Failed to submit answer';

      if (axiosError.response?.data?.detail) {
        errorMessage = axiosError.response.data.detail;
      } else if (axiosError.request) {
        errorMessage = language === 'ko'
          ? '서버에 연결할 수 없습니다.'
          : 'Cannot connect to server.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    setError(null);
  };

  const goToCompletion = () => {
    navigate('/quiz/completion', {
      state: {
        score: quizSession?.score || 0,
        maxScore: quizSession?.maxScore || DEFAULT_MAX_SCORES[selectedDifficulty || 'easy'],
        pointsPerCorrect: quizSession?.pointsPerCorrect || DEFAULT_POINTS_PER_CORRECT[selectedDifficulty || 'easy'],
        totalQuestions: TOTAL_QUESTIONS,
        difficulty: quizSession?.difficulty || selectedDifficulty,
      },
    });
  };

  const retryQuiz = () => {
    setError(null);
    setQuizSession(null);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsQuizComplete(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-3">
          <Brain className="text-green-600" />
          {language === 'ko' ? '학습 퀴즈' : 'Learning Quiz'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ko'
            ? '만성콩팥병에 대한 지식을 테스트하고 학습하세요'
            : 'Test and enhance your CKD knowledge'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                {language === 'ko' ? '오류 발생' : 'Error Occurred'}
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              <button
                onClick={retryQuiz}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {language === 'ko' ? '다시 시도' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {!quizSession && !error && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <Brain size={64} className="mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'ko' ? '퀴즈를 시작하세요' : 'Start a Quiz'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'ko' ? '난이도를 선택해주세요' : 'Choose your difficulty level'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => startQuiz('easy')}
              disabled={loading}
              className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <Target className="mx-auto text-green-600 mb-2" size={32} />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {language === 'ko' ? '쉬움' : 'Easy'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {language === 'ko' ? '기본 지식' : 'Basic knowledge'}
              </p>
            </button>

            <button
              onClick={() => startQuiz('medium')}
              disabled={loading}
              className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <Trophy className="mx-auto text-yellow-600 mb-2" size={32} />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {language === 'ko' ? '보통' : 'Medium'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {language === 'ko' ? '중급 지식' : 'Intermediate'}
              </p>
            </button>

            <button
              onClick={() => startQuiz('hard')}
              disabled={loading}
              className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Brain className="mx-auto text-red-600 mb-2" size={32} />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {language === 'ko' ? '어려움' : 'Hard'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {language === 'ko' ? '고급 지식' : 'Advanced'}
              </p>
            </button>
          </div>

          {loading && (
            <div className="mt-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {language === 'ko' ? '퀴즈 생성 중...' : 'Generating quiz...'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quiz Screen */}
      {quizSession && !showResult && (
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ko' ? '문제' : 'Question'} {quizSession.currentQuestionNumber}/{TOTAL_QUESTIONS}
              </span>
              <span className="text-sm font-medium text-green-600">
                {language === 'ko' ? '점수' : 'Score'}: {quizSession.score}/{quizSession.maxScore}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(quizSession.currentQuestionNumber / TOTAL_QUESTIONS) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {language === 'ko' ? `정답당 ${quizSession.pointsPerCorrect}점` : `${quizSession.pointsPerCorrect} pts per correct`}
            </div>
          </div>

          {/* Question */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Category & Difficulty Badge */}
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {quizSession.currentQuestion.category}
              </span>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                quizSession.currentQuestion.difficulty === 'easy'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : quizSession.currentQuestion.difficulty === 'medium'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {quizSession.currentQuestion.difficulty}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              {quizSession.currentQuestion.question}
            </h2>

            {/* O/X Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedAnswer(true)}
                className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  selectedAnswer === true
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                }`}
              >
                <span className="text-5xl font-bold text-green-600 mb-2">O</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '맞아요' : 'True'}
                </span>
              </button>

              <button
                onClick={() => setSelectedAnswer(false)}
                className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  selectedAnswer === false
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600'
                }`}
              >
                <span className="text-5xl font-bold text-red-600 mb-2">X</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '아니에요' : 'False'}
                </span>
              </button>
            </div>

            <button
              onClick={submitAnswer}
              disabled={selectedAnswer === null || loading}
              className="mt-6 w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading
                ? (language === 'ko' ? '확인 중...' : 'Checking...')
                : (language === 'ko' ? '답안 제출' : 'Submit Answer')}
            </button>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {quizSession && showResult && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            {isCorrect ? (
              <>
                <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
                <h2 className="text-3xl font-bold text-green-600 mb-2">
                  {language === 'ko' ? '정답입니다!' : 'Correct!'}
                </h2>
              </>
            ) : (
              <>
                <XCircle className="mx-auto text-red-600 mb-4" size={64} />
                <h2 className="text-3xl font-bold text-red-600 mb-2">
                  {language === 'ko' ? '틀렸습니다' : 'Incorrect'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '정답' : 'Correct answer'}: <strong className={correctAnswer ? 'text-green-600' : 'text-red-600'}>{correctAnswer ? 'O' : 'X'}</strong>
                </p>
              </>
            )}
          </div>

          {explanation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {language === 'ko' ? '설명' : 'Explanation'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{explanation}</p>
            </div>
          )}

          {isQuizComplete ? (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {language === 'ko' ? '잠시 후 결과 페이지로 이동합니다...' : 'Redirecting to results...'}
              </p>
              <button
                onClick={goToCompletion}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {language === 'ko' ? '결과 보기' : 'View Results'}
              </button>
            </div>
          ) : (
            <button
              onClick={nextQuestion}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {language === 'ko' ? '다음 문제' : 'Next Question'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
