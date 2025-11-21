# Quiz 데이터 모델
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# ============================================================================
# Enum 정의
# ============================================================================

class DifficultyLevel(str, Enum):
    """Difficulty level enumeration"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuizCategory(str, Enum):
    """Quiz category enumeration"""
    NUTRITION = "nutrition"  # 영양 관리
    TREATMENT = "treatment"  # 치료/관리
    LIFESTYLE = "lifestyle"  # 생활습관


class SessionType(str, Enum):
    """Quiz session type enumeration"""
    LEVEL_TEST = "level_test"  # 레벨 측정 퀴즈
    LEARNING_MISSION = "learning_mission"  # 주간 학습 미션
    DAILY_QUIZ = "daily_quiz"  # 매일 상식 퀴즈


# ============================================================================
# API 요청 모델
# ============================================================================

class QuizSessionStart(BaseModel):
    """Request model for starting a new quiz session"""
    userId: str = Field(..., description="User ID")
    sessionType: SessionType = Field(..., description="Type of quiz session to start")
    category: Optional[QuizCategory] = Field(None, description="Category filter (required for learning_mission)")
    difficulty: Optional[DifficultyLevel] = Field(None, description="Difficulty filter (required for learning_mission)")


class QuizAnswerSubmit(BaseModel):
    """Request model for submitting an answer"""
    sessionId: str = Field(..., description="Session ID")
    userId: str = Field(..., description="User ID")
    questionId: str = Field(..., description="Question ID")
    userAnswer: bool = Field(..., description="User's answer (True=O, False=X)")


# ============================================================================
# API 응답 모델 (문서 스펙에 맞춤)
# ============================================================================

class QuizQuestion(BaseModel):
    """Quiz question model (for API responses)"""
    id: str = Field(..., description="Question ID")
    category: QuizCategory = Field(..., description="Question category")
    difficulty: DifficultyLevel = Field(..., description="Difficulty level")
    question: str = Field(..., description="Question text (O/X format)")
    answer: bool = Field(..., description="Answer (dummy value before submission)")
    explanation: str = Field(default="", description="Explanation (empty before submission for security)")


class QuizSessionResponse(BaseModel):
    """Response model for quiz session start"""
    sessionId: str = Field(..., description="Session ID")
    userId: str = Field(..., description="User ID")
    sessionType: SessionType = Field(..., description="Session type")
    totalQuestions: int = Field(..., description="Total number of questions")
    currentQuestionNumber: int = Field(..., description="Current question number (1-based)")
    score: int = Field(default=0, description="Current score")
    status: str = Field(..., description="Session status (in_progress, completed)")
    currentQuestion: QuizQuestion = Field(..., description="Current question")


class QuestionStats(BaseModel):
    """Question statistics"""
    totalAttempts: int = Field(..., description="Total number of attempts")
    correctAttempts: int = Field(..., description="Number of correct attempts")
    userChoicePercentage: float = Field(..., description="Percentage of users who chose the same answer as current user (True or False)")


class QuizAnswerResponse(BaseModel):
    """Response model for answer submission"""
    isCorrect: bool = Field(..., description="Whether answer was correct")
    correctAnswer: bool = Field(..., description="Correct answer")
    explanation: str = Field(..., description="Explanation for the answer")
    pointsEarned: int = Field(..., description="Points earned for this answer")
    currentScore: int = Field(..., description="Current total score")
    consecutiveCorrect: int = Field(..., description="Current consecutive correct count")
    questionStats: QuestionStats = Field(..., description="Question statistics")
    nextQuestion: Optional[QuizQuestion] = Field(None, description="Next question (None if last question)")


class CategoryPerformance(BaseModel):
    """Category performance summary"""
    category: str = Field(..., description="Category name")
    correct: int = Field(..., description="Number of correct answers")
    total: int = Field(..., description="Total number of questions")
    rate: float = Field(..., description="Accuracy rate (%)")


class QuizSessionCompleteResponse(BaseModel):
    """Response model for session completion"""
    sessionId: str = Field(..., description="Session ID")
    userId: str = Field(..., description="User ID")
    sessionType: SessionType = Field(..., description="Session type")
    totalQuestions: int = Field(..., description="Total number of questions")
    correctAnswers: int = Field(..., description="Number of correct answers")
    finalScore: int = Field(..., description="Final score")
    accuracyRate: float = Field(..., description="Accuracy rate (%)")
    completedAt: str = Field(..., description="Completion timestamp (ISO format)")
    streak: Optional[int] = Field(None, description="Current streak (daily_quiz only)")
    categoryPerformance: List[CategoryPerformance] = Field(..., description="Category-wise performance")


class UserQuizStatsResponse(BaseModel):
    """Response model for user quiz statistics"""
    userId: str = Field(..., description="User ID")
    totalSessions: int = Field(..., description="Total number of quiz sessions")
    totalQuestions: int = Field(..., description="Total number of questions attempted")
    correctAnswers: int = Field(..., description="Total number of correct answers")
    totalScore: int = Field(..., description="Total points earned")
    accuracyRate: float = Field(..., description="Overall accuracy rate (%)")
    currentStreak: int = Field(..., description="Current consecutive days streak")
    bestStreak: int = Field(..., description="Best consecutive days streak")
    level: str = Field(..., description="User level (beginner, intermediate, advanced)")
    lastSessionDate: Optional[str] = Field(None, description="Last session date (ISO format)")


class QuizHistorySession(BaseModel):
    """Single session in history"""
    sessionId: str = Field(..., description="Session ID")
    sessionType: SessionType = Field(..., description="Session type")
    totalQuestions: int = Field(..., description="Total number of questions")
    correctAnswers: int = Field(..., description="Number of correct answers")
    finalScore: int = Field(..., description="Final score")
    accuracyRate: float = Field(..., description="Accuracy rate (%)")
    completedAt: str = Field(..., description="Completion timestamp")
    categoryPerformance: List[CategoryPerformance] = Field(..., description="Category performance")


class QuizHistoryResponse(BaseModel):
    """Response model for quiz history"""
    sessions: List[QuizHistorySession] = Field(..., description="List of quiz sessions")
    total: int = Field(..., description="Total number of sessions")
    limit: int = Field(..., description="Limit per page")
    offset: int = Field(..., description="Offset")
    hasMore: bool = Field(..., description="Whether there are more sessions")
