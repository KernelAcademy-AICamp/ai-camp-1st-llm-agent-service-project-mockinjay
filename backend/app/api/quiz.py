# Quiz API endpoints
import os
import json
from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId
from openai import OpenAI

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

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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


def generate_quiz_with_ai(
    category: str,
    difficulty: str,
    num_questions: int = 5
) -> List[Dict]:
    """
    OpenAI API로 퀴즈 생성

    Args:
        category (str): 퀴즈 카테고리 (nutrition/treatment/lifestyle)
        difficulty (str): 난이도 (easy/medium/hard)
        num_questions (int): 생성할 문제 수

    Returns:
        List[Dict]: 생성된 퀴즈 문제 리스트

    TODO:
        1. RAG로 관련 문서 검색 (일단 skip, 추후 구현)
        2. 프롬프트 작성
        3. OpenAI API 호출
        4. JSON 파싱
        5. 검증
    """
    # 카테고리별 한글 이름
    category_names = {
        "nutrition": "영양 관리",
        "treatment": "치료/관리",
        "lifestyle": "생활습관"
    }

    # 난이도별 설명
    difficulty_desc = {
        "easy": "쉬움 (기본 상식)",
        "medium": "보통 (일반 지식)",
        "hard": "어려움 (전문 지식)"
    }

    category_kr = category_names.get(category, category)
    difficulty_kr = difficulty_desc.get(difficulty, difficulty)

    # 프롬프트 템플릿
    prompt = f"""당신은 만성콩팥병 전문 의료 교육자입니다.
다음 조건에 맞는 O/X 퀴즈를 {num_questions}개 생성해주세요.

조건:
- 난이도: {difficulty_kr}
- 카테고리: {category_kr}
- 문제 형식: O/X (참/거짓)

출력 형식 (JSON만 출력, 다른 텍스트 없이):
{{
  "questions": [
    {{
      "question": "저칼륨 식단은 신장병 환자에게 도움이 된다.",
      "correctAnswer": true,
      "explanation": "정답: O. 저칼륨 식단은 신장 기능이 저하된 환자에게 필수입니다.",
      "tags": ["칼륨", "식단", "영양"]
    }}
  ]
}}

주의사항:
1. 의학적으로 정확해야 합니다.
2. 명확하게 O 또는 X로 답할 수 있어야 합니다.
3. 해설은 2-3문장으로 간결하게.
4. correctAnswer는 true(O) 또는 false(X)만 사용.
5. 반드시 JSON 형식만 출력하세요.
"""

    try:
        # OpenAI API 호출
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 만성콩팥병 전문 의료 교육자입니다. 정확하고 교육적인 퀴즈를 생성합니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        # 응답 파싱
        content = response.choices[0].message.content.strip()

        # JSON 추출 (코드 블록이 있을 경우 제거)
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        # JSON 파싱
        quiz_data = json.loads(content)
        questions = quiz_data.get("questions", [])

        if not questions:
            raise ValueError("생성된 퀴즈가 없습니다.")

        return questions

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI 응답 파싱 실패: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"퀴즈 생성 실패: {str(e)}"
        )


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
    """
    try:
        sessions_collection = db["quiz_sessions"]

        # 임시 userId (TODO: JWT에서 추출)
        userId = "temp_user_123"

        # 세션 타입별 설정
        all_questions = []

        if request.sessionType == SessionType.LEVEL_TEST:
            # 레벨 측정: 5문제, easy 2 + medium 2 + hard 1, 카테고리 섞음
            categories = ["nutrition", "treatment", "lifestyle"]

            # Easy 2문제
            easy_q = generate_quiz_with_ai(categories[0], "easy", 2)
            all_questions.extend(easy_q)

            # Medium 2문제
            medium_q = generate_quiz_with_ai(categories[1], "medium", 2)
            all_questions.extend(medium_q)

            # Hard 1문제
            hard_q = generate_quiz_with_ai(categories[2], "hard", 1)
            all_questions.extend(hard_q)

        elif request.sessionType == SessionType.LEARNING_MISSION:
            # 학습 미션: 5문제, 사용자 레벨 맞춤, 한 카테고리 집중
            category = request.category.value if request.category else "nutrition"
            difficulty = request.difficulty.value if request.difficulty else "medium"

            all_questions = generate_quiz_with_ai(category, difficulty, 5)

        elif request.sessionType == SessionType.DAILY_QUIZ:
            # 매일 퀴즈: 5문제, easy~medium, 카테고리 섞음
            categories = ["nutrition", "treatment", "lifestyle"]

            # Easy 3문제
            easy_q = generate_quiz_with_ai(categories[0], "easy", 3)
            all_questions.extend(easy_q)

            # Medium 2문제
            medium_q = generate_quiz_with_ai(categories[1], "medium", 2)
            all_questions.extend(medium_q)

        # 문제 데이터 구조 변환 (답과 해설 포함하여 세션에 저장)
        questions_for_session = []
        for q in all_questions:
            questions_for_session.append({
                "questionId": str(ObjectId()),  # 임시 ID 생성
                "question": q["question"],
                "correctAnswer": q["correctAnswer"],
                "explanation": q["explanation"],
                "userAnswer": None,
                "isCorrect": None,
                "timeSpent": None
            })

        # 세션 문서 생성
        session_doc = {
            "userId": userId,
            "sessionType": request.sessionType.value,
            "status": "in_progress",
            "currentQuestionIndex": 0,
            "questions": questions_for_session,
            "score": {
                "correct": 0,
                "total": len(questions_for_session),
                "percentage": 0
            },
            "pointsEarned": 0,
            "createdAt": datetime.utcnow(),
            "completedAt": None
        }

        # MongoDB에 세션 저장
        session_result = sessions_collection.insert_one(session_doc)
        session_id = str(session_result.inserted_id)

        # 첫 번째 문제 반환 (답과 해설 제외)
        first_question = questions_for_session[0]

        # QuizQuestion 모델로 변환 (답과 해설은 None으로 설정)
        first_question_response = QuizQuestion(
            id=first_question["questionId"],
            category=request.category if request.category else QuizCategory.NUTRITION,
            difficulty=request.difficulty if request.difficulty else DifficultyLevel.EASY,
            question=first_question["question"],
            answer=True,  # 더미값 (클라이언트에서 사용 안 함)
            explanation="",  # 숨김
            totalAttempts=0,
            correctAttempts=0,
            createdAt=datetime.utcnow(),
            isActive=True
        )

        # 응답 생성
        response = QuizSessionResponse(
            sessionId=session_id,
            sessionType=request.sessionType,
            currentQuestion=first_question_response,
            currentQuestionNumber=1,
            totalQuestions=len(questions_for_session),
            correctCount=0,
            isCompleted=False
        )

        return response

    except HTTPException:
        # OpenAI API 에러 등은 그대로 전파
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"세션 시작 실패: {str(e)}"
        )


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
