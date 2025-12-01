"""
Agent API Router
Handles chat requests through Agent Manager with intent classification and fallback policies
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import sys
import os

# Add Agent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

from Agent.agent_manager import AgentManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["agent"])

# Initialize Agent Manager
agent_manager = AgentManager()

# Agent type mapping
AGENT_TYPE_MAP = {
    "medical": "medical_welfare",
    "nutrition": "nutrition",
    "research": "research_paper",
    "trend": "trend_visualization"
}

class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    agent_type: str  # 'medical', 'nutrition', 'research', 'trend'
    session_id: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    """Chat response model"""
    success: bool
    message: Optional[str] = None
    agent_type: Optional[str] = None
    session_id: str
    context_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    fallback_type: Optional[str] = None


def get_fallback_message(error_type: str, error_details: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Get fallback message based on error type

    Args:
        error_type: Type of error
        error_details: Additional error details

    Returns:
        Fallback message and type
    """
    fallback_messages = {
        "intent_classification_failed": {
            "message": "죄송해요, 질문을 이해하지 못했어요. 다른 방식으로 질문해 주시겠어요?",
            "type": "INTENT_CLASSIFICATION_FAILED"
        },
        "non_medical_domain": {
            "message": "저는 만성신장병 관련 정보만 도와드릴 수 있어요. 콩팥 건강이나 식이 영양 관리, 복지에 대해 물어봐 주세요!",
            "type": "NON_MEDICAL_DOMAIN"
        },
        "response_generation_failed": {
            "message": "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
            "type": "RESPONSE_GENERATION_FAILED"
        },
        "context_limit_exceeded": {
            "message": "대화가 너무 길어졌어요. 새로운 세션을 시작해 주세요.",
            "type": "CONTEXT_LIMIT_EXCEEDED"
        },
        "invalid_session": {
            "message": "세션이 만료되었어요. 새로고침 후 다시 시도해 주세요.",
            "type": "INVALID_SESSION"
        },
        "unknown_agent": {
            "message": "요청하신 기능을 찾을 수 없어요. 다시 시도해 주세요.",
            "type": "UNKNOWN_AGENT"
        }
    }

    return fallback_messages.get(error_type, fallback_messages["response_generation_failed"])


@router.post("/chat", response_model=ChatResponse)
async def agent_chat(request: ChatRequest):
    """
    Process chat request through Agent Manager

    Handles:
    - Agent routing based on selected tab
    - Session management
    - Context tracking (disease name, keywords)
    - Fallback policies
    """
    try:
        # Map frontend agent type to backend agent type
        backend_agent_type = AGENT_TYPE_MAP.get(request.agent_type)

        if not backend_agent_type:
            fallback = get_fallback_message("unknown_agent")
            return ChatResponse(
                success=False,
                message=fallback["message"],
                session_id=request.session_id,
                fallback_type=fallback["type"],
                error=f"Unknown agent type: {request.agent_type}"
            )

        # Initialize context if not provided
        if not request.context:
            request.context = {}

        # Add agent type to context to maintain consistency
        request.context["selected_agent"] = backend_agent_type

        logger.info(
            f"Processing chat request - Session: {request.session_id}, "
            f"Agent: {backend_agent_type}, Message: {request.message[:50]}..."
        )

        # Route request through Agent Manager
        result = await agent_manager.route_request(
            agent_type=backend_agent_type,
            user_input=request.message,
            session_id=request.session_id,
            context=request.context
        )

        # Handle successful response
        if result.get("success"):
            response_data = result.get("result", {})
            context_info = result.get("context_info", {})

            return ChatResponse(
                success=True,
                message=response_data.get("response", "응답을 생성할 수 없습니다."),
                agent_type=request.agent_type,
                session_id=request.session_id,
                context_info=context_info
            )

        # Handle various error cases with fallback messages
        error = result.get("error", "")

        # Context limit exceeded
        if "Context limit exceeded" in error or "context limit" in error.lower():
            fallback = get_fallback_message("context_limit_exceeded")
            return ChatResponse(
                success=False,
                message=fallback["message"],
                session_id=request.session_id,
                fallback_type=fallback["type"],
                context_info=result.get("limit_info")
            )

        # Invalid session
        if "Invalid or expired session" in error:
            fallback = get_fallback_message("invalid_session")
            return ChatResponse(
                success=False,
                message=fallback["message"],
                session_id=request.session_id,
                fallback_type=fallback["type"],
                error=error
            )

        # Unknown agent
        if "Unknown agent type" in error:
            fallback = get_fallback_message("unknown_agent")
            return ChatResponse(
                success=False,
                message=fallback["message"],
                session_id=request.session_id,
                fallback_type=fallback["type"],
                error=error
            )

        # Default: Response generation failed
        fallback = get_fallback_message("response_generation_failed")
        return ChatResponse(
            success=False,
            message=fallback["message"],
            session_id=request.session_id,
            fallback_type=fallback["type"],
            error=error
        )

    except Exception as e:
        logger.error(f"Error in agent_chat: {str(e)}", exc_info=True)

        # Return fallback for unexpected errors
        fallback = get_fallback_message("response_generation_failed")
        return ChatResponse(
            success=False,
            message=fallback["message"],
            session_id=request.session_id,
            fallback_type=fallback["type"],
            error=str(e)
        )


@router.get("/session/{session_id}/context")
async def get_session_context(session_id: str):
    """
    Get session context including disease name and keywords
    """
    try:
        session = agent_manager.session_manager.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        usage_info = agent_manager.context_tracker.get_usage_info(session_id)

        return {
            "session_id": session_id,
            "created_at": session.get("created_at"),
            "last_activity": session.get("last_activity"),
            "current_agent": session.get("current_agent"),
            "context": session.get("context", {}),
            "usage_info": usage_info,
            "history_length": len(session.get("history", []))
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session context: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents")
async def list_agents():
    """
    List available agents and their mappings
    """
    return {
        "agents": AGENT_TYPE_MAP,
        "descriptions": {
            "medical": "의료 복지 정보 제공",
            "nutrition": "식이 영양 관리",
            "research": "연구 논문 검색",
            "trend": "트렌드 시각화"
        }
    }
