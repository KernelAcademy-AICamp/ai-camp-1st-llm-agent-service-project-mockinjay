"""
Quiz API endpoints (Agent-based)
퀴즈 에이전트를 통한 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import sys
from pathlib import Path

# Add Agent path
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from Agent.agent_manager import AgentManager
from app.models.quiz import (
    QuizSessionStart,
    QuizAnswerSubmit,
    QuizSessionResponse,
    QuizAnswerResponse
)

router = APIRouter()

# Agent Manager 초기화
agent_manager = AgentManager()


@router.post("/session/start", status_code=201)
async def start_quiz_session(request: QuizSessionStart):
    """
    퀴즈 세션 시작

    Agent를 통해 RAG 기반 퀴즈 생성

    Args:
        request: 세션 시작 요청 (userId, sessionType, category, difficulty)

    Returns:
        QuizSessionResponse: 세션 정보 및 첫 번째 문제

    Raises:
        HTTPException: Agent 처리 실패
    """
    # 사용자 세션 생성 (Agent Manager)
    session_id = agent_manager.create_user_session(request.userId)

    # Quiz Agent 호출
    context = {
        "action": "generate_quiz",
        "userId": request.userId,
        "sessionType": request.sessionType,
        "category": request.category,
        "difficulty": request.difficulty
    }

    result = await agent_manager.route_request(
        agent_type="quiz",
        user_input=f"Generate {request.sessionType} quiz",
        session_id=session_id,
        context=context
    )

    if not result.get("success"):
        error_msg = result.get("error", "Unknown error")
        raise HTTPException(status_code=500, detail=f"퀴즈 생성 실패: {error_msg}")

    agent_result = result.get("result", {})

    return QuizSessionResponse(
        sessionId=agent_result["sessionId"],
        userId=agent_result["userId"],
        sessionType=agent_result["sessionType"],
        totalQuestions=agent_result["totalQuestions"],
        currentQuestionNumber=agent_result["currentQuestionNumber"],
        score=agent_result["score"],
        status=agent_result["status"],
        currentQuestion=agent_result["currentQuestion"]
    )


@router.post("/session/submit-answer", status_code=200)
async def submit_quiz_answer(request: QuizAnswerSubmit):
    """
    퀴즈 답안 제출

    Agent를 통해 답안 검증 및 피드백 생성

    Args:
        request: 답안 제출 요청 (sessionId, userId, questionId, userAnswer)

    Returns:
        QuizAnswerResponse: 정답 여부 및 피드백

    Raises:
        HTTPException: 세션/문제 없음, Agent 처리 실패
    """
    # 임시 세션 생성 (실제로는 기존 세션 재사용 필요)
    session_id = agent_manager.create_user_session(request.userId)

    context = {
        "action": "submit_answer",
        "sessionId": request.sessionId,
        "userId": request.userId,
        "questionId": request.questionId,
        "userAnswer": request.userAnswer
    }

    result = await agent_manager.route_request(
        agent_type="quiz",
        user_input=f"Submit answer for question {request.questionId}",
        session_id=session_id,
        context=context
    )

    if not result.get("success"):
        error_msg = result.get("error", "Unknown error")
        raise HTTPException(status_code=404 if "찾을 수 없습니다" in error_msg else 400, detail=error_msg)

    agent_result = result.get("result", {})

    return QuizAnswerResponse(
        isCorrect=agent_result["isCorrect"],
        correctAnswer=agent_result["correctAnswer"],
        explanation=agent_result["explanation"],
        pointsEarned=agent_result["pointsEarned"],
        currentScore=agent_result["currentScore"],
        consecutiveCorrect=agent_result["consecutiveCorrect"],
        questionStats=agent_result["questionStats"],
        nextQuestion=agent_result.get("nextQuestion")
    )


@router.post("/session/complete", status_code=200)
async def complete_quiz_session(sessionId: str):
    """
    퀴즈 세션 완료

    Agent를 통해 통계 업데이트 및 세션 완료 처리

    Args:
        sessionId: 세션 ID

    Returns:
        dict: 세션 완료 정보 (총점, 정답률, 스트릭 등)

    Raises:
        HTTPException: 세션 없음, 미완료 문제 존재
    """
    # 임시 세션 생성
    temp_session_id = agent_manager.create_user_session("temp_user")

    context = {
        "action": "complete_session",
        "sessionId": sessionId
    }

    result = await agent_manager.route_request(
        agent_type="quiz",
        user_input=f"Complete session {sessionId}",
        session_id=temp_session_id,
        context=context
    )

    if not result.get("success"):
        error_msg = result.get("error", "Unknown error")
        raise HTTPException(
            status_code=404 if "찾을 수 없습니다" in error_msg else 400,
            detail=error_msg
        )

    return result.get("result", {})


@router.get("/stats", status_code=200)
async def get_user_quiz_stats(userId: str):
    """
    사용자 퀴즈 통계 조회

    Agent를 통해 누적 통계 반환

    Args:
        userId: 사용자 ID

    Returns:
        dict: 사용자 통계 (총 세션 수, 정답률, 레벨 등)
    """
    session_id = agent_manager.create_user_session(userId)

    context = {
        "action": "get_stats",
        "userId": userId
    }

    result = await agent_manager.route_request(
        agent_type="quiz",
        user_input=f"Get stats for user {userId}",
        session_id=session_id,
        context=context
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

    return result.get("result", {})


@router.get("/history", status_code=200)
async def get_quiz_history(userId: str, limit: int = 10, offset: int = 0):
    """
    퀴즈 이력 조회

    Agent를 통해 완료된 세션 목록 반환 (페이지네이션)

    Args:
        userId: 사용자 ID
        limit: 조회 개수 (최대 50)
        offset: 오프셋

    Returns:
        dict: 세션 이력 목록

    Raises:
        HTTPException: limit 초과
    """
    if limit > 50:
        raise HTTPException(status_code=400, detail="limit은 최대 50까지 가능합니다")

    session_id = agent_manager.create_user_session(userId)

    context = {
        "action": "get_history",
        "userId": userId,
        "limit": limit,
        "offset": offset
    }

    result = await agent_manager.route_request(
        agent_type="quiz",
        user_input=f"Get history for user {userId}",
        session_id=session_id,
        context=context
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

    return result.get("result", {})
