import api from './api';

// Types
export type SessionType = 'level_test' | 'learning_mission' | 'daily_quiz';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuizCategory = 'nutrition' | 'treatment' | 'lifestyle';

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  difficulty: DifficultyLevel;
  question: string;
  answer: boolean;
  explanation: string;
}

export interface QuizSessionResponse {
  sessionId: string;
  userId: string;
  sessionType: SessionType;
  totalQuestions: number;
  currentQuestionNumber: number;
  score: number;
  status: 'in_progress' | 'completed';
  currentQuestion: QuizQuestion;
}

export interface QuizAnswerResponse {
  isCorrect: boolean;
  correctAnswer: boolean;
  explanation: string;
  pointsEarned: number;
  currentScore: number;
  nextQuestion: QuizQuestion | null;
}

export interface UserQuizStats {
  userId: string;
  totalSessions: number;
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  accuracyRate: number;
  currentStreak: number;
  bestStreak: number;
  level: string;
}

// API Functions
export async function startQuizSession(userId: string, sessionType: SessionType, category?: QuizCategory, difficulty?: DifficultyLevel) {
  const response = await api.post<QuizSessionResponse>('/api/quiz/session/start', {
    userId, sessionType, category, difficulty
  });
  return response.data;
}

export async function submitQuizAnswer(sessionId: string, userId: string, questionId: string, userAnswer: boolean) {
  const response = await api.post<QuizAnswerResponse>('/api/quiz/session/submit-answer', {
    sessionId, userId, questionId, userAnswer
  });
  return response.data;
}

export async function completeQuizSession(sessionId: string) {
  const response = await api.post('/api/quiz/session/complete', null, { params: { sessionId } });
  return response.data;
}

export async function getUserQuizStats(userId: string) {
  const response = await api.get<UserQuizStats>('/api/quiz/stats', { params: { userId } });
  return response.data;
}

export async function getQuizHistory(userId: string, limit = 10, offset = 0) {
  const response = await api.get('/api/quiz/history', { params: { userId, limit, offset } });
  return response.data;
}
