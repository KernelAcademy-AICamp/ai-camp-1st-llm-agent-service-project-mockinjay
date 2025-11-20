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
# 퀴즈 문제 모델
# ============================================================================

class QuizQuestion(BaseModel):
    """Quiz question model for storing quiz questions"""
    id: Optional[str] = Field(None, description="Question ID (MongoDB ObjectId converted to string)")
    category: QuizCategory = Field(..., description="Question category (nutrition, treatment, lifestyle)")
    difficulty: DifficultyLevel = Field(..., description="Difficulty level (easy, medium, hard)")
    question: str = Field(..., min_length=1, description="Question text (O/X format)")
    answer: bool = Field(..., description="Correct answer (True=O, False=X)")
    explanation: str = Field(..., min_length=1, description="Explanation for the answer")

    # 통계 데이터
    totalAttempts: int = Field(default=0, description="Total number of attempts")
    correctAttempts: int = Field(default=0, description="Number of correct attempts")

    createdAt: datetime = Field(default_factory=datetime.utcnow, description="Question creation timestamp")
    isActive: bool = Field(default=True, description="Whether question is active")

    class Config:
        json_schema_extra = {
            "example": {
                "category": "nutrition",
                "difficulty": "easy",
                "question": "만성콩팥병 환자는 저염식이 필요하다.",
                "answer": True,
                "explanation": "만성콩팥병 환자는 신장 기능 보호를 위해 나트륨 섭취를 제한해야 합니다."
            }
        }


# ============================================================================
# 퀴즈 세션 모델
# ============================================================================

class QuizSession(BaseModel):
    """Quiz session model for tracking user quiz sessions"""
    id: Optional[str] = Field(None, description="Session ID (MongoDB ObjectId converted to string)")
    userId: str = Field(..., description="User ID")
    sessionType: SessionType = Field(..., description="Type of quiz session")

    # 세션 정보
    questionIds: List[str] = Field(..., description="List of question IDs in this session")
    currentQuestionIndex: int = Field(default=0, description="Current question index (0-based)")

    # 진행 상태
    answers: Dict[str, bool] = Field(default={}, description="User answers (questionId: userAnswer)")
    correctCount: int = Field(default=0, description="Number of correct answers")

    # 시간 정보
    startedAt: datetime = Field(default_factory=datetime.utcnow, description="Session start timestamp")
    completedAt: Optional[datetime] = Field(None, description="Session completion timestamp")
    isCompleted: bool = Field(default=False, description="Whether session is completed")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user123",
                "sessionType": "daily_quiz",
                "questionIds": ["q1", "q2", "q3"],
                "currentQuestionIndex": 0,
                "correctCount": 0
            }
        }


# ============================================================================
# 퀴즈 시도 기록 모델
# ============================================================================

class QuizAttempt(BaseModel):
    """Quiz attempt model for storing individual question attempts"""
    id: Optional[str] = Field(None, description="Attempt ID (MongoDB ObjectId converted to string)")
    userId: str = Field(..., description="User ID")
    sessionId: str = Field(..., description="Session ID")
    questionId: str = Field(..., description="Question ID")

    userAnswer: bool = Field(..., description="User's answer (True=O, False=X)")
    isCorrect: bool = Field(..., description="Whether answer was correct")

    attemptedAt: datetime = Field(default_factory=datetime.utcnow, description="Attempt timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user123",
                "sessionId": "session456",
                "questionId": "q1",
                "userAnswer": True,
                "isCorrect": True
            }
        }


# ============================================================================
# 사용자 퀴즈 통계 모델
# ============================================================================

class UserQuizStats(BaseModel):
    """User quiz statistics model"""
    id: Optional[str] = Field(None, description="Stats ID (MongoDB ObjectId converted to string)")
    userId: str = Field(..., description="User ID")

    # 전체 통계
    totalQuizzes: int = Field(default=0, description="Total number of quizzes taken")
    totalCorrect: int = Field(default=0, description="Total number of correct answers")
    totalPoints: int = Field(default=0, description="Total points earned")

    # 연속 참여
    currentStreak: int = Field(default=0, description="Current consecutive days streak")
    maxStreak: int = Field(default=0, description="Maximum consecutive days streak")
    lastQuizDate: Optional[datetime] = Field(None, description="Last quiz participation date")

    # 업데이트 시간
    updatedAt: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user123",
                "totalQuizzes": 15,
                "totalCorrect": 12,
                "totalPoints": 150,
                "currentStreak": 3,
                "maxStreak": 7
            }
        }


# ============================================================================
# API 요청/응답 모델
# ============================================================================

class QuizSessionStart(BaseModel):
    """Request model for starting a new quiz session"""
    sessionType: SessionType = Field(..., description="Type of quiz session to start")
    category: Optional[QuizCategory] = Field(None, description="Category filter (optional)")
    difficulty: Optional[DifficultyLevel] = Field(None, description="Difficulty filter (optional)")


class QuizAnswerSubmit(BaseModel):
    """Request model for submitting an answer"""
    sessionId: str = Field(..., description="Session ID")
    questionId: str = Field(..., description="Question ID")
    userAnswer: bool = Field(..., description="User's answer (True=O, False=X)")


class QuizSessionResponse(BaseModel):
    """Response model for quiz session"""
    sessionId: str = Field(..., description="Session ID")
    sessionType: SessionType = Field(..., description="Session type")
    currentQuestion: Optional[QuizQuestion] = Field(None, description="Current question")
    currentQuestionNumber: int = Field(..., description="Current question number (1-based)")
    totalQuestions: int = Field(..., description="Total number of questions")
    correctCount: int = Field(..., description="Number of correct answers so far")
    isCompleted: bool = Field(default=False, description="Whether session is completed")


class QuizAnswerResponse(BaseModel):
    """Response model for answer submission"""
    isCorrect: bool = Field(..., description="Whether answer was correct")
    correctAnswer: bool = Field(..., description="Correct answer (True=O, False=X)")
    explanation: str = Field(..., description="Explanation for the answer")
    userChoicePercentage: float = Field(..., description="Percentage of users who chose the same answer")
    pointsEarned: int = Field(default=0, description="Points earned for this answer")
    bonusPoints: int = Field(default=0, description="Bonus points (streak, etc.)")
