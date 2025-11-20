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
    """
    try:
        sessions_collection = db["quiz_sessions"]
        attempts_collection = db["quiz_attempts"]
        questions_collection = db["quiz_questions"]

        # 1. 세션 찾기
        try:
            session = sessions_collection.find_one({"_id": ObjectId(request.sessionId)})
        except:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.get("status") == "completed":
            raise HTTPException(status_code=400, detail="Session already completed")

        # 2. 현재 문제 찾기
        current_index = session.get("currentQuestionIndex", 0)
        questions = session.get("questions", [])

        if current_index >= len(questions):
            raise HTTPException(status_code=400, detail="No more questions in this session")

        current_question = questions[current_index]

        # questionId 검증
        if current_question["questionId"] != request.questionId:
            raise HTTPException(
                status_code=400,
                detail=f"Question ID mismatch. Expected {current_question['questionId']}, got {request.questionId}"
            )

        # 이미 답변했는지 확인
        if current_question.get("userAnswer") is not None:
            raise HTTPException(status_code=400, detail="Question already answered")

        # 3. 정답 체크
        correct_answer = current_question["correctAnswer"]
        is_correct = (request.userAnswer == correct_answer)
        points_earned = 10 if is_correct else 0

        # 보너스 포인트 (연속 정답 등 - 간단히 구현)
        bonus_points = 0
        if is_correct and session.get("score", {}).get("correct", 0) >= 3:
            bonus_points = 5  # 3문제 이상 맞추면 보너스

        total_points = points_earned + bonus_points

        # 4. 세션 업데이트
        # 문제에 답안 기록
        questions[current_index]["userAnswer"] = request.userAnswer
        questions[current_index]["isCorrect"] = is_correct
        questions[current_index]["timeSpent"] = None  # 추후 프론트엔드에서 전달

        # 점수 업데이트
        new_correct = session.get("score", {}).get("correct", 0) + (1 if is_correct else 0)
        new_total = current_index + 1
        new_percentage = (new_correct / new_total * 100) if new_total > 0 else 0

        # 다음 문제 인덱스
        next_index = current_index + 1

        # MongoDB 업데이트
        sessions_collection.update_one(
            {"_id": ObjectId(request.sessionId)},
            {
                "$set": {
                    "questions": questions,
                    "currentQuestionIndex": next_index,
                    "score": {
                        "correct": new_correct,
                        "total": new_total,
                        "percentage": new_percentage
                    },
                    "pointsEarned": session.get("pointsEarned", 0) + total_points
                }
            }
        )

        # 5. quiz_attempts 컬렉션에 기록
        attempts_collection.insert_one({
            "userId": session["userId"],
            "sessionId": request.sessionId,
            "questionId": current_question["questionId"],
            "userAnswer": request.userAnswer,
            "isCorrect": is_correct,
            "timeSpent": None,
            "attemptedAt": datetime.utcnow()
        })

        # 6. quiz_questions 컬렉션의 통계 업데이트 (문제 텍스트로 찾기)
        question_text = current_question["question"]
        question_doc = questions_collection.find_one({"question": question_text})

        if question_doc:
            # 기존 문제 통계 업데이트
            new_total_attempts = question_doc.get("totalAttempts", 0) + 1
            new_correct_attempts = question_doc.get("correctAttempts", 0) + (1 if is_correct else 0)

            questions_collection.update_one(
                {"_id": question_doc["_id"]},
                {
                    "$set": {
                        "totalAttempts": new_total_attempts,
                        "correctAttempts": new_correct_attempts
                    }
                }
            )
        else:
            # 새 문제로 저장
            questions_collection.insert_one({
                "question": question_text,
                "answer": correct_answer,
                "explanation": current_question["explanation"],
                "category": "unknown",
                "difficulty": "unknown",
                "totalAttempts": 1,
                "correctAttempts": 1 if is_correct else 0,
                "createdAt": datetime.utcnow(),
                "isActive": True
            })

        # 7. 통계 조회 (O/X 선택 비율)
        # 모든 시도에서 이 문제에 대한 통계 계산
        all_attempts = list(attempts_collection.find({
            "questionId": current_question["questionId"]
        }))

        total_user_attempts = len(all_attempts)
        true_count = sum(1 for a in all_attempts if a.get("userAnswer") == True)
        false_count = sum(1 for a in all_attempts if a.get("userAnswer") == False)

        # 사용자가 선택한 답의 비율
        if request.userAnswer == True:
            user_choice_percentage = (true_count / total_user_attempts * 100) if total_user_attempts > 0 else 0
        else:
            user_choice_percentage = (false_count / total_user_attempts * 100) if total_user_attempts > 0 else 0

        # 8. 응답 생성
        response = QuizAnswerResponse(
            isCorrect=is_correct,
            correctAnswer=correct_answer,
            explanation=current_question["explanation"],
            userChoicePercentage=user_choice_percentage,
            pointsEarned=points_earned,
            bonusPoints=bonus_points
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"답안 제출 실패: {str(e)}"
        )


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
    """
    try:
        sessions_collection = db["quiz_sessions"]
        stats_collection = db["user_quiz_stats"]

        # 1. 세션 찾기
        try:
            session = sessions_collection.find_one({"_id": ObjectId(sessionId)})
        except:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.get("status") == "completed":
            raise HTTPException(status_code=400, detail="Session already completed")

        # 2. 모든 문제가 답변되었는지 확인
        questions = session.get("questions", [])
        all_answered = all(
            q.get("userAnswer") is not None
            for q in questions
        )

        if not all_answered:
            raise HTTPException(
                status_code=400,
                detail="All questions must be answered before completing the session"
            )

        # 3. 세션 상태 업데이트
        now = datetime.utcnow()
        sessions_collection.update_one(
            {"_id": ObjectId(sessionId)},
            {
                "$set": {
                    "status": "completed",
                    "completedAt": now
                }
            }
        )

        # 세션 정보 추출
        userId = session["userId"]
        sessionType = session["sessionType"]
        score = session.get("score", {})
        pointsEarned = session.get("pointsEarned", 0)
        totalQuestions = len(questions)
        correctCount = score.get("correct", 0)
        percentage = score.get("percentage", 0)

        # 4. 사용자 통계 조회 또는 생성
        user_stats = stats_collection.find_one({"userId": userId})

        if user_stats:
            # 기존 통계 업데이트
            new_total_sessions = user_stats.get("totalQuizzes", 0) + 1
            new_total_correct = user_stats.get("totalCorrect", 0) + correctCount
            new_total_points = user_stats.get("totalPoints", 0) + pointsEarned

            # 5. 연속 참여 확인 (daily_quiz인 경우)
            current_streak = user_stats.get("currentStreak", 0)
            max_streak = user_stats.get("maxStreak", 0)
            last_quiz_date = user_stats.get("lastQuizDate")

            if sessionType == "daily_quiz":
                # 마지막 퀴즈 날짜 확인
                if last_quiz_date:
                    days_diff = (now.date() - last_quiz_date.date()).days

                    if days_diff == 1:
                        # 연속 참여
                        current_streak += 1
                    elif days_diff == 0:
                        # 같은 날 (연속 유지)
                        pass
                    else:
                        # 연속 끊김
                        current_streak = 1
                else:
                    # 첫 퀴즈
                    current_streak = 1

                # 최대 연속 기록 업데이트
                max_streak = max(max_streak, current_streak)

            # 통계 업데이트
            stats_collection.update_one(
                {"userId": userId},
                {
                    "$set": {
                        "totalQuizzes": new_total_sessions,
                        "totalCorrect": new_total_correct,
                        "totalPoints": new_total_points,
                        "currentStreak": current_streak,
                        "maxStreak": max_streak,
                        "lastQuizDate": now,
                        "updatedAt": now
                    }
                }
            )

        else:
            # 새 사용자 통계 생성
            current_streak = 1 if sessionType == "daily_quiz" else 0
            max_streak = current_streak

            stats_collection.insert_one({
                "userId": userId,
                "totalQuizzes": 1,
                "totalCorrect": correctCount,
                "totalPoints": pointsEarned,
                "currentStreak": current_streak,
                "maxStreak": max_streak,
                "lastQuizDate": now,
                "updatedAt": now
            })

        # 6. 레벨 판정 (level_test인 경우)
        level = None
        if sessionType == "level_test":
            if percentage >= 80:
                level = "advanced"
            elif percentage >= 50:
                level = "intermediate"
            else:
                level = "beginner"

        # 7. 카테고리별 요약 생성
        category_summary = {}
        for q in questions:
            category = q.get("category", "unknown")
            if category not in category_summary:
                category_summary[category] = {
                    "total": 0,
                    "correct": 0
                }

            category_summary[category]["total"] += 1
            if q.get("isCorrect"):
                category_summary[category]["correct"] += 1

        # 카테고리별 정답률 계산
        for category, stats in category_summary.items():
            stats["percentage"] = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0

        # 8. 응답 반환
        response = {
            "sessionId": sessionId,
            "sessionType": sessionType,
            "status": "completed",
            "summary": {
                "totalQuestions": totalQuestions,
                "correctCount": correctCount,
                "incorrectCount": totalQuestions - correctCount,
                "percentage": round(percentage, 1),
                "pointsEarned": pointsEarned
            },
            "categorySummary": category_summary,
            "level": level,  # level_test인 경우만 값이 있음
            "streak": {
                "current": current_streak,
                "max": max_streak
            } if sessionType == "daily_quiz" else None,
            "completedAt": now.isoformat()
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"세션 완료 처리 실패: {str(e)}"
        )


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
        dict: User's quiz statistics
    """
    try:
        stats_collection = db["user_quiz_stats"]

        # 사용자 통계 조회
        user_stats = stats_collection.find_one({"userId": userId})

        if user_stats:
            # 정확도 계산
            total_quizzes = user_stats.get("totalQuizzes", 0)
            total_correct = user_stats.get("totalCorrect", 0)
            accuracy_rate = (total_correct / (total_quizzes * 5) * 100) if total_quizzes > 0 else 0
            # 5는 세션당 평균 문제 수

            # datetime을 ISO string으로 변환
            last_quiz_date = user_stats.get("lastQuizDate")
            if last_quiz_date and isinstance(last_quiz_date, datetime):
                last_quiz_date = last_quiz_date.isoformat()

            response = {
                "userId": userId,
                "totalQuizzes": total_quizzes,
                "totalCorrect": total_correct,
                "totalPoints": user_stats.get("totalPoints", 0),
                "accuracyRate": round(accuracy_rate, 1),
                "currentStreak": user_stats.get("currentStreak", 0),
                "maxStreak": user_stats.get("maxStreak", 0),
                "lastQuizDate": last_quiz_date,
                "updatedAt": user_stats.get("updatedAt").isoformat() if user_stats.get("updatedAt") else None
            }
        else:
            # 통계가 없으면 기본값 반환
            response = {
                "userId": userId,
                "totalQuizzes": 0,
                "totalCorrect": 0,
                "totalPoints": 0,
                "accuracyRate": 0,
                "currentStreak": 0,
                "maxStreak": 0,
                "lastQuizDate": None,
                "updatedAt": None
            }

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"통계 조회 실패: {str(e)}"
        )


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
    """
    try:
        sessions_collection = db["quiz_sessions"]

        # limit 검증 (최대 50)
        if limit > 50:
            limit = 50
        if limit < 1:
            limit = 10

        # offset 검증
        if offset < 0:
            offset = 0

        # 완료된 세션만 조회
        query = {
            "userId": userId,
            "status": "completed"
        }

        # 전체 개수 조회
        total_count = sessions_collection.count_documents(query)

        # 세션 조회 (최신순 정렬, 페이지네이션 적용)
        sessions = list(
            sessions_collection.find(query)
            .sort("completedAt", -1)  # 내림차순 (최신순)
            .skip(offset)
            .limit(limit)
        )

        # 세션 데이터 가공
        session_list = []
        for session in sessions:
            questions = session.get("questions", [])
            score = session.get("score", {})

            # datetime을 ISO string으로 변환
            created_at = session.get("createdAt")
            completed_at = session.get("completedAt")

            if created_at and isinstance(created_at, datetime):
                created_at = created_at.isoformat()
            if completed_at and isinstance(completed_at, datetime):
                completed_at = completed_at.isoformat()

            session_summary = {
                "sessionId": str(session["_id"]),
                "sessionType": session.get("sessionType"),
                "status": session.get("status"),
                "score": {
                    "correct": score.get("correct", 0),
                    "total": score.get("total", 0),
                    "percentage": round(score.get("percentage", 0), 1)
                },
                "pointsEarned": session.get("pointsEarned", 0),
                "questionCount": len(questions),
                "createdAt": created_at,
                "completedAt": completed_at
            }

            session_list.append(session_summary)

        # 페이지네이션 정보
        has_more = (offset + limit) < total_count

        response = {
            "sessions": session_list,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "hasMore": has_more
            }
        }

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"이력 조회 실패: {str(e)}"
        )
