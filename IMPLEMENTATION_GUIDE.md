# Backend API Implementation Guide
**Step-by-Step Instructions for Critical Fixes**

---

## Overview

This guide provides exact code implementations for the 3 critical API fixes needed for frontend-backend compatibility.

**Estimated Total Time:** 2-3 days
**Prerequisites:** Python 3.8+, FastAPI, MongoDB, Backend server running

---

## Fix 1: Update Login Endpoint (30 minutes)

### Current Problem

Frontend sends JSON body, but backend expects form parameters:

```python
# Current (BROKEN)
@router.post("/login")
async def login(email: str, password: str):  # Expects form params
    ...
```

### Solution

**File:** `/backend/app/api/auth.py`

**Step 1:** Add Pydantic model for request

```python
# Add at top of file after imports
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    """Login request body"""
    email: EmailStr
    password: str
```

**Step 2:** Update login endpoint

```python
@router.post("/login")
async def login(request: LoginRequest):  # Changed parameter
    """
    User login with email and password

    Returns JWT token and user information
    """
    # Find user by email
    user = users_collection.find_one({"email": request.email})

    # Verify credentials
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="이메일 또는 비밀번호가 잘못되었습니다"
        )

    # Generate JWT token
    token = create_access_token({"user_id": str(user["_id"])})

    # Return response
    return {
        "success": True,
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "profile": user["profile"],
            "role": user.get("role", "user")
        }
    }
```

**Step 3:** Test with curl

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "name": "Test User",
    "profile": "general",
    "role": "user"
  }
}
```

---

## Fix 2: Implement Quiz API (1-2 days)

### Step 1: Create Quiz Models

**File:** `/backend/app/models/quiz.py` (NEW FILE)

```python
"""
Quiz data models for Pydantic validation
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, List
from datetime import datetime
from enum import Enum


class SessionType(str, Enum):
    """Quiz session types"""
    LEVEL_TEST = "level_test"
    LEARNING_MISSION = "learning_mission"
    DAILY_QUIZ = "daily_quiz"


class DifficultyLevel(str, Enum):
    """Question difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuizCategory(str, Enum):
    """Quiz categories"""
    NUTRITION = "nutrition"
    TREATMENT = "treatment"
    LIFESTYLE = "lifestyle"


# ==================== Request Models ====================

class StartSessionRequest(BaseModel):
    """Request to start a new quiz session"""
    userId: str = Field(..., description="User ID")
    sessionType: SessionType = Field(..., description="Session type")
    category: Optional[QuizCategory] = Field(None, description="Quiz category filter")
    difficulty: Optional[DifficultyLevel] = Field(None, description="Difficulty filter")


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer"""
    sessionId: str = Field(..., description="Quiz session ID")
    userId: str = Field(..., description="User ID")
    questionId: str = Field(..., description="Question ID")
    userAnswer: bool = Field(..., description="User's answer (true/false)")


class CompleteSessionRequest(BaseModel):
    """Request to complete a session"""
    sessionId: str = Field(..., description="Session ID to complete")


# ==================== Response Models ====================

class QuizQuestion(BaseModel):
    """Quiz question model"""
    id: str
    category: QuizCategory
    difficulty: DifficultyLevel
    question: str
    answer: bool
    explanation: str


class QuizSessionResponse(BaseModel):
    """Quiz session state response"""
    sessionId: str
    userId: str
    sessionType: SessionType
    totalQuestions: int
    currentQuestionNumber: int
    score: int
    status: Literal["in_progress", "completed"]
    currentQuestion: QuizQuestion


class QuizAnswerResponse(BaseModel):
    """Answer submission response"""
    isCorrect: bool
    correctAnswer: bool
    explanation: str
    pointsEarned: int
    currentScore: int
    nextQuestion: Optional[QuizQuestion]


class UserQuizStats(BaseModel):
    """User quiz statistics"""
    userId: str
    totalSessions: int
    totalQuestions: int
    correctAnswers: int
    totalScore: int
    accuracyRate: float
    currentStreak: int
    bestStreak: int
    level: str
```

---

### Step 2: Create Quiz Router

**File:** `/backend/app/api/quiz.py` (NEW FILE)

```python
"""
Quiz API Router
Handles quiz sessions, questions, and user statistics
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import random

from app.models.quiz import (
    StartSessionRequest,
    SubmitAnswerRequest,
    CompleteSessionRequest,
    QuizSessionResponse,
    QuizAnswerResponse,
    UserQuizStats,
    QuizQuestion,
    SessionType,
    QuizCategory,
    DifficultyLevel
)
from app.db.connection import db

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


# ==================== Helper Functions ====================

def serialize_question(question: dict) -> dict:
    """Convert MongoDB question to JSON-serializable dict"""
    if question:
        question["id"] = str(question.pop("_id"))
    return question


def serialize_session(session: dict) -> dict:
    """Convert MongoDB session to JSON-serializable dict"""
    if session:
        session["sessionId"] = str(session.pop("_id"))
        if "currentQuestion" in session and session["currentQuestion"]:
            session["currentQuestion"]["id"] = str(session["currentQuestion"]["_id"])
    return session


def calculate_user_stats(user_id: str) -> dict:
    """Calculate user quiz statistics"""
    sessions_collection = db["quiz_sessions"]

    # Get all completed sessions for user
    sessions = list(sessions_collection.find({
        "userId": user_id,
        "status": "completed"
    }))

    if not sessions:
        return {
            "userId": user_id,
            "totalSessions": 0,
            "totalQuestions": 0,
            "correctAnswers": 0,
            "totalScore": 0,
            "accuracyRate": 0.0,
            "currentStreak": 0,
            "bestStreak": 0,
            "level": "Beginner"
        }

    total_sessions = len(sessions)
    total_questions = sum(s.get("totalQuestions", 0) for s in sessions)
    correct_answers = sum(s.get("correctAnswers", 0) for s in sessions)
    total_score = sum(s.get("score", 0) for s in sessions)

    accuracy_rate = (correct_answers / total_questions * 100) if total_questions > 0 else 0.0

    # Calculate streaks (simplified - consecutive correct answers)
    current_streak = 0
    best_streak = 0
    temp_streak = 0

    for session in sorted(sessions, key=lambda x: x.get("completedAt", datetime.min)):
        if session.get("correctAnswers", 0) == session.get("totalQuestions", 0):
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0

    current_streak = temp_streak

    # Determine level based on total score
    if total_score < 100:
        level = "Beginner"
    elif total_score < 500:
        level = "Intermediate"
    elif total_score < 1000:
        level = "Advanced"
    else:
        level = "Expert"

    return {
        "userId": user_id,
        "totalSessions": total_sessions,
        "totalQuestions": total_questions,
        "correctAnswers": correct_answers,
        "totalScore": total_score,
        "accuracyRate": round(accuracy_rate, 2),
        "currentStreak": current_streak,
        "bestStreak": best_streak,
        "level": level
    }


def get_random_question(
    category: Optional[QuizCategory] = None,
    difficulty: Optional[DifficultyLevel] = None,
    exclude_ids: List[str] = []
) -> dict:
    """Get a random question from the database"""
    questions_collection = db["quiz_questions"]

    # Build query filter
    query = {"_id": {"$nin": [ObjectId(id) for id in exclude_ids]}}

    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty

    # Get all matching questions
    questions = list(questions_collection.find(query))

    if not questions:
        # Fallback: return any question if filters too restrictive
        questions = list(questions_collection.find({
            "_id": {"$nin": [ObjectId(id) for id in exclude_ids]}
        }))

    if not questions:
        return None

    # Return random question
    return random.choice(questions)


# ==================== API Endpoints ====================

@router.post("/session/start", response_model=QuizSessionResponse)
async def start_quiz_session(request: StartSessionRequest):
    """
    Start a new quiz session

    Creates a new quiz session and returns the first question
    """
    sessions_collection = db["quiz_sessions"]

    # Determine number of questions based on session type
    question_count = {
        SessionType.LEVEL_TEST: 10,
        SessionType.LEARNING_MISSION: 5,
        SessionType.DAILY_QUIZ: 3
    }.get(request.sessionType, 5)

    # Get first question
    first_question = get_random_question(request.category, request.difficulty)

    if not first_question:
        raise HTTPException(
            status_code=404,
            detail="No questions available with the specified criteria"
        )

    # Create session document
    session_doc = {
        "userId": request.userId,
        "sessionType": request.sessionType,
        "totalQuestions": question_count,
        "currentQuestionNumber": 1,
        "score": 0,
        "correctAnswers": 0,
        "status": "in_progress",
        "category": request.category,
        "difficulty": request.difficulty,
        "askedQuestionIds": [str(first_question["_id"])],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    # Insert session
    result = sessions_collection.insert_one(session_doc)
    session_id = str(result.inserted_id)

    # Return response
    return QuizSessionResponse(
        sessionId=session_id,
        userId=request.userId,
        sessionType=request.sessionType,
        totalQuestions=question_count,
        currentQuestionNumber=1,
        score=0,
        status="in_progress",
        currentQuestion=QuizQuestion(
            id=str(first_question["_id"]),
            category=first_question["category"],
            difficulty=first_question["difficulty"],
            question=first_question["question"],
            answer=first_question["answer"],
            explanation=first_question["explanation"]
        )
    )


@router.post("/session/submit-answer", response_model=QuizAnswerResponse)
async def submit_quiz_answer(request: SubmitAnswerRequest):
    """
    Submit an answer to a quiz question

    Validates the answer and returns the next question or session completion
    """
    sessions_collection = db["quiz_sessions"]
    questions_collection = db["quiz_questions"]

    # Get session
    try:
        session = sessions_collection.find_one({
            "_id": ObjectId(request.sessionId),
            "userId": request.userId,
            "status": "in_progress"
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already completed")

    # Get question
    try:
        question = questions_collection.find_one({"_id": ObjectId(request.questionId)})
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check answer
    is_correct = (request.userAnswer == question["answer"])
    correct_answer = question["answer"]
    explanation = question["explanation"]

    # Calculate points (10 points per question, more for harder questions)
    points_map = {
        DifficultyLevel.EASY: 10,
        DifficultyLevel.MEDIUM: 15,
        DifficultyLevel.HARD: 20
    }
    points_earned = points_map.get(question["difficulty"], 10) if is_correct else 0

    # Update session
    current_score = session.get("score", 0) + points_earned
    correct_answers = session.get("correctAnswers", 0) + (1 if is_correct else 0)
    current_question_number = session.get("currentQuestionNumber", 1) + 1

    # Check if session complete
    if current_question_number > session["totalQuestions"]:
        # Mark session as complete
        sessions_collection.update_one(
            {"_id": ObjectId(request.sessionId)},
            {
                "$set": {
                    "score": current_score,
                    "correctAnswers": correct_answers,
                    "status": "completed",
                    "completedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )

        return QuizAnswerResponse(
            isCorrect=is_correct,
            correctAnswer=correct_answer,
            explanation=explanation,
            pointsEarned=points_earned,
            currentScore=current_score,
            nextQuestion=None  # No more questions
        )

    # Get next question
    asked_ids = session.get("askedQuestionIds", [])
    next_question = get_random_question(
        session.get("category"),
        session.get("difficulty"),
        exclude_ids=asked_ids
    )

    if not next_question:
        # No more questions available - complete session
        sessions_collection.update_one(
            {"_id": ObjectId(request.sessionId)},
            {
                "$set": {
                    "score": current_score,
                    "correctAnswers": correct_answers,
                    "status": "completed",
                    "completedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )

        return QuizAnswerResponse(
            isCorrect=is_correct,
            correctAnswer=correct_answer,
            explanation=explanation,
            pointsEarned=points_earned,
            currentScore=current_score,
            nextQuestion=None
        )

    # Update session with next question
    asked_ids.append(str(next_question["_id"]))
    sessions_collection.update_one(
        {"_id": ObjectId(request.sessionId)},
        {
            "$set": {
                "score": current_score,
                "correctAnswers": correct_answers,
                "currentQuestionNumber": current_question_number,
                "askedQuestionIds": asked_ids,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    return QuizAnswerResponse(
        isCorrect=is_correct,
        correctAnswer=correct_answer,
        explanation=explanation,
        pointsEarned=points_earned,
        currentScore=current_score,
        nextQuestion=QuizQuestion(
            id=str(next_question["_id"]),
            category=next_question["category"],
            difficulty=next_question["difficulty"],
            question=next_question["question"],
            answer=next_question["answer"],
            explanation=next_question["explanation"]
        )
    )


@router.post("/session/complete")
async def complete_quiz_session(sessionId: str = Query(...)):
    """
    Manually complete a quiz session

    Marks the session as completed even if not all questions answered
    """
    sessions_collection = db["quiz_sessions"]

    try:
        result = sessions_collection.update_one(
            {"_id": ObjectId(sessionId), "status": "in_progress"},
            {
                "$set": {
                    "status": "completed",
                    "completedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found or already completed")

    return {"success": True, "message": "Session completed"}


@router.get("/stats", response_model=UserQuizStats)
async def get_user_quiz_stats(userId: str = Query(...)):
    """
    Get quiz statistics for a user

    Returns comprehensive stats including accuracy, streaks, and level
    """
    stats = calculate_user_stats(userId)
    return UserQuizStats(**stats)


@router.get("/history")
async def get_quiz_history(
    userId: str = Query(...),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """
    Get quiz session history for a user

    Returns paginated list of completed quiz sessions
    """
    sessions_collection = db["quiz_sessions"]

    # Get sessions for user
    sessions = list(sessions_collection.find(
        {"userId": userId}
    ).sort("createdAt", -1).skip(offset).limit(limit))

    # Serialize sessions
    serialized = []
    for session in sessions:
        session_data = {
            "sessionId": str(session["_id"]),
            "sessionType": session["sessionType"],
            "totalQuestions": session["totalQuestions"],
            "correctAnswers": session.get("correctAnswers", 0),
            "score": session.get("score", 0),
            "status": session["status"],
            "createdAt": session["createdAt"].isoformat() if isinstance(session["createdAt"], datetime) else session["createdAt"],
            "completedAt": session.get("completedAt").isoformat() if session.get("completedAt") and isinstance(session.get("completedAt"), datetime) else None
        }
        serialized.append(session_data)

    return {
        "sessions": serialized,
        "total": sessions_collection.count_documents({"userId": userId}),
        "limit": limit,
        "offset": offset
    }


# ==================== Health Check ====================

@router.get("/health")
async def quiz_health_check():
    """Health check endpoint"""
    questions_collection = db["quiz_questions"]
    question_count = questions_collection.count_documents({})

    return {
        "status": "healthy",
        "service": "quiz_api",
        "questions_available": question_count
    }
```

---

### Step 3: Register Quiz Router

**File:** `/backend/app/main.py`

Add these lines:

```python
# At top with other imports
from app.api import quiz

# With other router includes
app.include_router(quiz.router)
```

---

### Step 4: Seed Quiz Questions (Optional but Recommended)

**File:** `/backend/scripts/seed_quiz_questions.py` (NEW FILE)

```python
"""
Seed quiz questions for testing
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "careguide")

client = MongoClient(MONGODB_URL)
db = client[MONGODB_DB_NAME]

# Sample quiz questions
sample_questions = [
    {
        "category": "nutrition",
        "difficulty": "easy",
        "question": "당뇨병 환자는 설탕 섭취를 제한해야 한다.",
        "answer": True,
        "explanation": "당뇨병 환자는 혈당 조절을 위해 설탕과 단순 탄수화물 섭취를 제한해야 합니다."
    },
    {
        "category": "nutrition",
        "difficulty": "medium",
        "question": "과일은 당분이 많아서 당뇨병 환자는 전혀 먹으면 안 된다.",
        "answer": False,
        "explanation": "과일은 적당량 섭취 시 건강에 도움이 됩니다. 다만 과식은 피해야 합니다."
    },
    {
        "category": "treatment",
        "difficulty": "easy",
        "question": "인슐린 주사는 의사의 처방 없이 사용해도 된다.",
        "answer": False,
        "explanation": "인슐린은 반드시 의사의 처방과 지시에 따라 사용해야 합니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "easy",
        "question": "규칙적인 운동은 혈당 조절에 도움이 된다.",
        "answer": True,
        "explanation": "규칙적인 운동은 인슐린 감수성을 높이고 혈당 조절에 도움을 줍니다."
    },
    {
        "category": "nutrition",
        "difficulty": "hard",
        "question": "당뇨병 환자는 탄수화물을 완전히 배제한 식단을 유지해야 한다.",
        "answer": False,
        "explanation": "탄수화물은 중요한 에너지원입니다. 적절한 양과 종류를 선택하는 것이 중요합니다."
    }
]

# Insert questions
result = db["quiz_questions"].insert_many(sample_questions)
print(f"Inserted {len(result.inserted_ids)} quiz questions")

client.close()
```

Run with:
```bash
python backend/scripts/seed_quiz_questions.py
```

---

### Step 5: Test Quiz API

```bash
# 1. Start session
curl -X POST http://localhost:8000/api/quiz/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "sessionType": "daily_quiz",
    "category": "nutrition"
  }'

# 2. Submit answer (use sessionId and questionId from response)
curl -X POST http://localhost:8000/api/quiz/session/submit-answer \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID_HERE",
    "userId": "test_user_123",
    "questionId": "QUESTION_ID_HERE",
    "userAnswer": true
  }'

# 3. Get stats
curl "http://localhost:8000/api/quiz/stats?userId=test_user_123"

# 4. Get history
curl "http://localhost:8000/api/quiz/history?userId=test_user_123&limit=10"
```

---

## Fix 3: Implement Chat Room Management (1-2 days)

### Step 1: Create Chat Room Models

**File:** `/backend/app/models/chat.py` (NEW FILE)

```python
"""
Chat room data models
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChatRoomCreate(BaseModel):
    """Request to create a new chat room"""
    title: str = Field(..., min_length=1, max_length=100)
    agent_type: str = Field(default="auto", description="Agent type: auto, medical_welfare, nutrition, research_paper")
    user_id: Optional[str] = Field(None, description="User ID (from auth)")


class ChatRoomUpdate(BaseModel):
    """Request to update a chat room"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None


class ChatRoomResponse(BaseModel):
    """Chat room response"""
    id: str
    title: str
    agent_type: str
    message_count: int
    last_message: Optional[str] = None
    last_message_time: Optional[str] = None
    created_at: str
    updated_at: str
    is_pinned: bool = False
    is_archived: bool = False
```

---

### Step 2: Add Room Management to Chat Router

**File:** `/backend/app/api/chat.py`

Add these imports at the top:

```python
from datetime import datetime
from bson import ObjectId
from app.db.connection import db
from app.models.chat import ChatRoomCreate, ChatRoomUpdate, ChatRoomResponse
```

Add helper function:

```python
def serialize_room(room: dict) -> dict:
    """Convert MongoDB room document to JSON-serializable dict"""
    if room:
        room["id"] = str(room.pop("_id"))
        for field in ["created_at", "updated_at", "last_message_time"]:
            if field in room and isinstance(room[field], datetime):
                room[field] = room[field].isoformat()
    return room
```

Add endpoints BEFORE the catch-all proxy route:

```python
# ==================== Chat Room Management ====================

@router.post("/rooms", response_model=ChatRoomResponse)
async def create_chat_room(request: ChatRoomCreate):
    """
    Create a new chat room

    Creates a persistent chat room for organizing conversations
    """
    rooms_collection = db["chat_rooms"]

    now = datetime.utcnow()

    room_doc = {
        "title": request.title,
        "agent_type": request.agent_type,
        "user_id": request.user_id or "anonymous",
        "message_count": 0,
        "last_message": None,
        "last_message_time": None,
        "created_at": now,
        "updated_at": now,
        "is_pinned": False,
        "is_archived": False
    }

    result = rooms_collection.insert_one(room_doc)

    # Fetch created room
    created_room = rooms_collection.find_one({"_id": result.inserted_id})

    return ChatRoomResponse(**serialize_room(created_room))


@router.get("/rooms")
async def get_chat_rooms(
    user_id: Optional[str] = None,
    include_archived: bool = False
):
    """
    Get all chat rooms for a user

    Returns list of rooms, optionally including archived rooms
    """
    rooms_collection = db["chat_rooms"]

    # Build query
    query = {}
    if user_id:
        query["user_id"] = user_id
    if not include_archived:
        query["is_archived"] = False

    # Fetch rooms (pinned first, then by last activity)
    rooms = list(rooms_collection.find(query).sort([
        ("is_pinned", -1),
        ("updated_at", -1)
    ]))

    return {
        "rooms": [serialize_room(room) for room in rooms],
        "total": len(rooms)
    }


@router.get("/rooms/{room_id}", response_model=ChatRoomResponse)
async def get_chat_room(room_id: str):
    """
    Get a specific chat room by ID
    """
    rooms_collection = db["chat_rooms"]

    try:
        room = rooms_collection.find_one({"_id": ObjectId(room_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid room ID")

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    return ChatRoomResponse(**serialize_room(room))


@router.patch("/rooms/{room_id}", response_model=ChatRoomResponse)
async def update_chat_room(room_id: str, request: ChatRoomUpdate):
    """
    Update a chat room

    Can update title, pinned status, or archived status
    """
    rooms_collection = db["chat_rooms"]

    # Build update document
    update_doc = {"updated_at": datetime.utcnow()}

    if request.title is not None:
        update_doc["title"] = request.title
    if request.is_pinned is not None:
        update_doc["is_pinned"] = request.is_pinned
    if request.is_archived is not None:
        update_doc["is_archived"] = request.is_archived

    # Update room
    try:
        result = rooms_collection.update_one(
            {"_id": ObjectId(room_id)},
            {"$set": update_doc}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid room ID")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")

    # Fetch updated room
    updated_room = rooms_collection.find_one({"_id": ObjectId(room_id)})

    return ChatRoomResponse(**serialize_room(updated_room))


@router.delete("/rooms/{room_id}", status_code=204)
async def delete_chat_room(room_id: str):
    """
    Delete a chat room (hard delete)

    Permanently removes the room and all associated messages
    """
    rooms_collection = db["chat_rooms"]

    try:
        result = rooms_collection.delete_one({"_id": ObjectId(room_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid room ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")

    # TODO: Also delete associated messages if stored separately

    return None
```

---

### Step 3: Test Chat Room API

```bash
# 1. Create room
ROOM_RESPONSE=$(curl -X POST http://localhost:8000/api/chat/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Diabetes Discussion",
    "agent_type": "nutrition",
    "user_id": "test_user_123"
  }')

echo $ROOM_RESPONSE

# Extract room ID from response (using jq)
ROOM_ID=$(echo $ROOM_RESPONSE | jq -r '.id')

# 2. Get all rooms
curl "http://localhost:8000/api/chat/rooms?user_id=test_user_123"

# 3. Update room (pin it)
curl -X PATCH http://localhost:8000/api/chat/rooms/$ROOM_ID \
  -H "Content-Type: application/json" \
  -d '{"is_pinned": true}'

# 4. Get specific room
curl "http://localhost:8000/api/chat/rooms/$ROOM_ID"

# 5. Delete room
curl -X DELETE "http://localhost:8000/api/chat/rooms/$ROOM_ID"
```

---

## Post-Implementation Checklist

### Backend

- [ ] All endpoints return correct HTTP status codes
- [ ] Error handling works (400, 401, 404, 500)
- [ ] MongoDB indexes created for performance
- [ ] API documentation updated (http://localhost:8000/docs)
- [ ] Integration tests written
- [ ] Logged all errors properly

### Frontend Integration

- [ ] Remove mock implementations from `api.ts`
- [ ] Test quiz flow end-to-end
- [ ] Test chat room CRUD operations
- [ ] Test login with new format
- [ ] Verify error messages display correctly
- [ ] Check loading states work properly

### Database

- [ ] MongoDB collections created:
  - [ ] `quiz_questions`
  - [ ] `quiz_sessions`
  - [ ] `chat_rooms`
- [ ] Indexes added for performance:
  ```javascript
  // In MongoDB shell
  db.quiz_sessions.createIndex({ "userId": 1, "createdAt": -1 })
  db.quiz_questions.createIndex({ "category": 1, "difficulty": 1 })
  db.chat_rooms.createIndex({ "user_id": 1, "updated_at": -1 })
  ```

### Deployment

- [ ] Environment variables set correctly
- [ ] CORS configured for frontend domain
- [ ] Health check endpoints responding
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place

---

## Troubleshooting

### Issue: "Invalid session ID" error in Quiz API

**Cause:** Frontend sending string ID, backend expecting ObjectId

**Fix:** Wrap in try-catch as shown in code above

---

### Issue: Chat room not persisting

**Cause:** MongoDB not running or connection failed

**Fix:**
```bash
# Check MongoDB status
systemctl status mongod  # Linux
brew services list | grep mongodb  # Mac

# Restart if needed
systemctl restart mongod  # Linux
brew services restart mongodb-community  # Mac
```

---

### Issue: Login still not working

**Cause:** Frontend cache or old token

**Fix:**
```javascript
// Clear localStorage in browser console
localStorage.clear();
```

---

## Next Steps After Implementation

1. **Update Frontend**
   - Remove mock data from `api.ts`
   - Enable quiz and chat room features
   - Update environment variables

2. **Write Tests**
   - Unit tests for each endpoint
   - Integration tests for flows
   - E2E tests with frontend

3. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - User guides
   - Developer setup instructions

4. **Deploy**
   - Staging environment first
   - User acceptance testing
   - Production deployment
   - Monitor logs and errors

---

**Questions?** Refer to:
- Full analysis: `BACKEND_INTEGRATION_ANALYSIS.md`
- Quick reference: `API_COMPATIBILITY_SUMMARY.md`

**Last Updated:** 2025-11-27
