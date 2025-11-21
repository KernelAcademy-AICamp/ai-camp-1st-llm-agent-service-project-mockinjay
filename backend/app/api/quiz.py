"""
Quiz API endpoints (Agent-based)
퀴즈 에이전트를 통한 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException
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
    QuizAnswerResponse,
    QuizSessionCompleteResponse,
    UserQuizStatsResponse,
    QuizHistoryResponse
)

router = APIRouter()

# Agent Manager 초기화
agent_manager = AgentManager()


@router.post("/session/start", status_code=201, response_model=QuizSessionResponse)
async def start_quiz_session(request: QuizSessionStart):
    """
    퀴즈 세션 시작

    Agent를 통해 RAG 기반 퀴즈 생성

    WARNING: This endpoint currently accepts userId from client (demo/testing only).
    TODO: Replace with server-side user authentication via Depends(get_current_user)
          before production deployment. Remove userId from request model and obtain
          from authenticated session.

    Args:
        request: 세션 시작 요청 (userId, sessionType, category, difficulty)

    Returns:
        QuizSessionResponse: 세션 정보 및 첫 번째 문제

    Raises:
        HTTPException: Agent 처리 실패
    """
    # 사용자 세션 생성 (Agent Manager)
    # TODO: Replace request.userId with authenticated user ID from token
    session_id = agent_manager.create_user_session(request.userId)

    # Quiz Agent 호출
    context = {
        "action": "generate_quiz",
        "userId": request.userId,
        "sessionType": request.sessionType.value,
        "category": request.category.value if request.category else None,
        "difficulty": request.difficulty.value if request.difficulty else None
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

    return QuizSessionResponse(**agent_result)


@router.post("/session/submit-answer", status_code=200, response_model=QuizAnswerResponse)
async def submit_quiz_answer(request: QuizAnswerSubmit):
    """
    퀴즈 답안 제출

    Agent를 통해 답안 검증 및 피드백 생성

    WARNING: This endpoint currently accepts userId from client (demo/testing only).
    TODO: Replace with server-side user authentication via Depends(get_current_user).

    Args:
        request: 답안 제출 요청 (sessionId, userId, questionId, userAnswer)

    Returns:
        QuizAnswerResponse: 정답 여부 및 피드백

    Raises:
        HTTPException: 세션/문제 없음, Agent 처리 실패
    """
    # TODO: Replace request.userId with authenticated user ID
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
        status_code = 404 if "찾을 수 없습니다" in error_msg else 400
        raise HTTPException(status_code=status_code, detail=error_msg)

    agent_result = result.get("result", {})

    return QuizAnswerResponse(**agent_result)


@router.post("/session/complete", status_code=200, response_model=QuizSessionCompleteResponse)
async def complete_quiz_session(sessionId: str):
    """
    퀴즈 세션 완료

    Agent를 통해 통계 업데이트 및 세션 완료 처리

    Args:
        sessionId: 세션 ID

    Returns:
        QuizSessionCompleteResponse: 세션 완료 정보

    Raises:
        HTTPException: 세션 없음, 미완료 문제 존재
    """
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
        status_code = 404 if "찾을 수 없습니다" in error_msg else 400
        raise HTTPException(status_code=status_code, detail=error_msg)

    agent_result = result.get("result", {})

    return QuizSessionCompleteResponse(**agent_result)


@router.get("/stats", status_code=200, response_model=UserQuizStatsResponse)
async def get_user_quiz_stats(userId: str):
    """
    사용자 퀴즈 통계 조회

    Agent를 통해 누적 통계 반환

    WARNING: This endpoint currently accepts userId from client (demo/testing only).
    TODO: Replace with server-side user authentication via Depends(get_current_user).

    Args:
        userId: 사용자 ID

    Returns:
        UserQuizStatsResponse: 사용자 통계
    """
    # TODO: Replace userId with authenticated user ID
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

    agent_result = result.get("result", {})

    return UserQuizStatsResponse(**agent_result)


@router.get("/history", status_code=200, response_model=QuizHistoryResponse)
async def get_quiz_history(userId: str, limit: int = 10, offset: int = 0):
    """
    퀴즈 이력 조회

    Agent를 통해 완료된 세션 목록 반환 (페이지네이션)

    WARNING: This endpoint currently accepts userId from client (demo/testing only).
    TODO: Replace with server-side user authentication via Depends(get_current_user).

    Args:
        userId: 사용자 ID
        limit: 조회 개수 (최대 50)
        offset: 오프셋

    Returns:
        QuizHistoryResponse: 세션 이력 목록

    Raises:
        HTTPException: limit 초과
    """
    if limit > 50:
        raise HTTPException(status_code=400, detail="limit은 최대 50까지 가능합니다")

    # TODO: Replace userId with authenticated user ID
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

    agent_result = result.get("result", {})

    return QuizHistoryResponse(**agent_result)
