# Quiz API endpoints
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from app.models.quiz import (
    QuizSessionStart,
    QuizAnswerSubmit,
    QuizSessionResponse,
    QuizAnswerResponse,
    QuizQuestion,
    QuizSession,
    QuizAttempt,
    UserQuizStats,
    SessionType,
    QuizCategory,
    DifficultyLevel
)
from app.db.connection import db

router = APIRouter()


# ============================================================================
# Helper Functions
# ============================================================================

def serialize_quiz_document(doc: dict) -> dict:
    """
    Convert MongoDB document to JSON-serializable dictionary.

    Converts ObjectId to string and datetime objects to ISO format strings.

    Args:
        doc (dict): MongoDB document

    Returns:
        dict: Serialized document ready for JSON response
    """
    if doc:
        doc["id"] = str(doc.pop("_id"))
        # Convert datetime fields to ISO string format
        for field in ["createdAt", "updatedAt", "startedAt", "completedAt", "attemptedAt", "lastQuizDate"]:
            if field in doc and doc[field] and isinstance(doc[field], datetime):
                doc[field] = doc[field].isoformat()
    return doc


# ============================================================================
# Quiz Session Endpoints
# ============================================================================

@router.post("/session/start", status_code=201)
def start_quiz_session(request: QuizSessionStart):
    """
    Start a new quiz session.

    Creates a new quiz session with questions based on session type and filters.
    Generates questions using AI or retrieves from database.

    Args:
        request (QuizSessionStart): Session start request with type and filters

    Returns:
        QuizSessionResponse: Session info with first question

    TODO:
        - Implement question selection logic based on sessionType
        - Generate questions using OpenAI API if needed
        - Apply category and difficulty filters
        - Create QuizSession document in MongoDB
        - Return first question
    """
    # TODO: Implement session start logic
    pass


@router.post("/session/submit-answer", status_code=200)
def submit_quiz_answer(request: QuizAnswerSubmit):
    """
    Submit an answer to a quiz question.

    Validates the answer, calculates points, updates statistics,
    and returns feedback with correct answer explanation.

    Args:
        request (QuizAnswerSubmit): Answer submission with sessionId, questionId, and userAnswer

    Returns:
        QuizAnswerResponse: Answer feedback with correctness, explanation, and points

    TODO:
        - Validate sessionId and questionId
        - Check if question already answered in this session
        - Verify correct answer from database
        - Calculate points (base + bonus for streak)
        - Update question statistics (totalAttempts, correctAttempts)
        - Create QuizAttempt record
        - Update session progress
        - Calculate user choice percentage
        - Return detailed feedback
    """
    # TODO: Implement answer submission logic
    pass


@router.post("/session/complete", status_code=200)
def complete_quiz_session(sessionId: str):
    """
    Complete a quiz session.

    Finalizes the session, calculates total score,
    updates user statistics including streak tracking.

    Args:
        sessionId (str): Session ID to complete

    Returns:
        dict: Session summary with total score, correct count, and bonus info

    TODO:
        - Validate sessionId
        - Mark session as completed
        - Calculate total score and correct answers
        - Update UserQuizStats (totalQuizzes, totalCorrect, totalPoints)
        - Update streak (check if quiz done today, increment/reset accordingly)
        - Return session summary with statistics
    """
    # TODO: Implement session completion logic
    pass


# ============================================================================
# Statistics and History Endpoints
# ============================================================================

@router.get("/stats", status_code=200)
def get_user_quiz_stats(userId: str):
    """
    Get user's quiz statistics.

    Retrieves comprehensive quiz statistics for a user including
    total quizzes taken, accuracy rate, points, and streak information.

    Args:
        userId (str): User ID to get statistics for

    Returns:
        UserQuizStats: User's quiz statistics

    TODO:
        - Fetch UserQuizStats from MongoDB
        - Calculate accuracy rate (totalCorrect / totalQuizzes)
        - Include streak information
        - Return statistics or create new record if user has no stats yet
    """
    # TODO: Implement stats retrieval logic
    pass


@router.get("/history", status_code=200)
def get_quiz_history(
    userId: str,
    limit: int = 10,
    offset: int = 0
):
    """
    Get user's quiz history.

    Retrieves paginated list of completed quiz sessions with details
    including session type, score, and completion date.

    Args:
        userId (str): User ID to get history for
        limit (int): Number of sessions to return (default: 10, max: 50)
        offset (int): Number of sessions to skip for pagination (default: 0)

    Returns:
        dict: Contains sessions list and pagination info

    TODO:
        - Validate limit (max 50)
        - Fetch completed QuizSession documents for userId
        - Sort by completedAt descending (most recent first)
        - Apply pagination (skip/limit)
        - Include session details (type, questions, correct count, score)
        - Return paginated list with total count
    """
    # TODO: Implement history retrieval logic
    pass
