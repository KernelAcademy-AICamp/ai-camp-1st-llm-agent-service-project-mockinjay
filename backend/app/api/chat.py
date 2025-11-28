"""
Chat API Router - Proxy to Parlant Server
Routes all /api/chat requests to the Parlant agent server
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import httpx
import logging
import os
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Import context_system early to avoid undefined errors
from app.core.context_system import context_system
import json
import asyncio

# Parlant server configuration
# Parlant server configuration
PARLANT_HOST = os.getenv("PARLANT_HOST", "127.0.0.1")
RESEARCH_PORT = int(os.getenv("RESEARCH_PORT", "8800"))
WELFARE_PORT = int(os.getenv("WELFARE_PORT", "8801"))

RESEARCH_BASE_URL = f"http://{PARLANT_HOST}:{RESEARCH_PORT}"
WELFARE_BASE_URL = f"http://{PARLANT_HOST}:{WELFARE_PORT}"

# Default to Research for backward compatibility
PARLANT_BASE_URL = RESEARCH_BASE_URL

# HTTP client for proxying
client = httpx.AsyncClient(timeout=30.0)

# Import Agents to ensure registration
from Agent.router.agent import RouterAgent
from Agent.medical_welfare.agent import MedicalWelfareAgent
from Agent.research_paper.agent import ResearchPaperAgent
from Agent.nutrition.agent import NutritionAgent
from Agent.quiz.agent import QuizAgent
from Agent.trend_visualization.agent import TrendVisualizationAgent
from Agent.core.contracts import AgentRequest

# Initialize Router Agent
router_agent = RouterAgent()


async def close_parlant_server():
    """Close the HTTP client and shutdown agents on shutdown"""
    await client.aclose()
    
    # Shutdown agent servers if they were started
    try:
        await MedicalWelfareAgent.shutdown_server()
        await ResearchPaperAgent.shutdown_server()
        logger.info("Agent servers shut down")
    except Exception as e:
        logger.warning(f"Error shutting down agent servers: {e}")
        
    logger.info("Parlant proxy client closed")


@router.get("/info")
async def chat_info():
    """
    Get chat service information
    """
    return {
        "service": "Chat API (Router + Parlant Proxy)",
        "router_agent": "active",
        "servers": {
            "research": RESEARCH_BASE_URL,
            "welfare": WELFARE_BASE_URL
        },
        "status": "operational"
    }


@router.get("/rooms")
async def get_user_rooms(user_id: str):
    """
    Get list of chat rooms for a user

    DEPRECATED: Use /api/rooms endpoint instead for full room management

    Args:
        user_id: User ID

    Returns:
        List of chat rooms with last message info
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        # Ensure db_manager is connected
        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        rooms = await db_manager.get_user_rooms(user_id)

        return {
            "user_id": user_id,
            "rooms": rooms,
            "count": len(rooms)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user rooms: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms/{room_id}/history")
async def get_room_history(room_id: str, limit: int = 50):
    """
    Get conversation history for a specific room

    Args:
        room_id: Room ID
        limit: Maximum number of conversations

    Returns:
        List of conversations in the room
    """
    try:
        conversations = await context_system.context_engineer.db_manager.get_conversations_by_room(
            room_id, limit
        )

        formatted_conversations = []
        for conv in conversations:
            formatted_conversations.append({
                "timestamp": conv.get("timestamp").isoformat() if conv.get("timestamp") else None,
                "user_input": conv.get("user_input"),
                "agent_response": conv.get("agent_response"),
                "agent_type": conv.get("agent_type"),
                "session_id": conv.get("session_id"),
                "room_id": conv.get("room_id")
            })

        return {
            "room_id": room_id,
            "count": len(formatted_conversations),
            "conversations": formatted_conversations
        }

    except Exception as e:
        logger.error(f"Error fetching room history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{agent_type}")
async def get_agent_history(
    agent_type: str,
    user_id: str = None,
    session_id: str = None,
    limit: int = 50
):
    """
    Get conversation history for a specific agent type

    Args:
        agent_type: Agent type (e.g., 'nutrition', 'medical_welfare', 'research_paper')
        user_id: Optional user ID to filter by user
        session_id: Optional session ID to filter by session
        limit: Maximum number of conversations to return (default: 50)

    Returns:
        List of conversations for the specified agent
    """
    try:
        # Validate agent_type
        valid_agents = ["nutrition", "medical_welfare", "research_paper", "quiz", "trend_visualization"]
        if agent_type not in valid_agents:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid agent_type. Must be one of: {', '.join(valid_agents)}"
            )

        # Query based on provided filters
        if session_id and agent_type:
            # Get from MongoDB by session and agent
            conversations = await context_system.context_engineer.db_manager.get_conversations_by_session_and_agent(
                session_id, agent_type, limit
            )
        elif user_id and agent_type:
            # Get from MongoDB by user and agent
            conversations = await context_system.context_engineer.db_manager.get_conversations_by_agent(
                user_id, agent_type, limit
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Either user_id or session_id must be provided"
            )

        # Format response
        formatted_conversations = []
        for conv in conversations:
            formatted_conversations.append({
                "timestamp": conv.get("timestamp").isoformat() if conv.get("timestamp") else None,
                "user_input": conv.get("user_input"),
                "agent_response": conv.get("agent_response"),
                "agent_type": conv.get("agent_type"),
                "session_id": conv.get("session_id")
            })

        return {
            "agent_type": agent_type,
            "count": len(formatted_conversations),
            "conversations": formatted_conversations
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching agent history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_all_history(
    user_id: str = None,
    session_id: str = None,
    limit: int = 50
):
    """
    Get conversation history for all agents

    Args:
        user_id: Optional user ID to filter by user
        session_id: Optional session ID to filter by session (not used yet)
        limit: Maximum number of conversations to return (default: 50)

    Returns:
        List of all conversations
    """
    try:
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="user_id is required"
            )

        # Get all conversations for the user
        conversations = await context_system.context_engineer.db_manager.get_recent_conversations(
            user_id, limit
        )

        # Format response
        formatted_conversations = []
        for conv in conversations:
            formatted_conversations.append({
                "timestamp": conv.get("timestamp").isoformat() if conv.get("timestamp") else None,
                "user_input": conv.get("user_input"),
                "agent_response": conv.get("agent_response"),
                "agent_type": conv.get("agent_type"),
                "session_id": conv.get("session_id")
            })

        return {
            "count": len(formatted_conversations),
            "conversations": formatted_conversations
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Import active_streams from session API
# This will be populated by session.py
active_streams_tracker = {}

@router.post("/message")
async def chat_message(request: Request):
    """
    Main Chat Endpoint - Uses RouterAgent with streaming support
    """
    try:
        body = await request.json()
        query = body.get("query") or body.get("message")
        session_id = body.get("session_id", "default")
        user_id = body.get("user_id") # Optional
        room_id = body.get("room_id") # Optional - for multiple chat rooms

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # --- Context Engineering: Injection ---
        context = body.get("context", {})

        # Resolve user_id from session if not provided
        if not user_id and session_id:
            session = context_system.session_manager.get_session(session_id)
            if session:
                user_id = session.get("user_id")

        if user_id:
            try:
                # 1. Get Context
                user_context = await context_system.context_engineer.get_user_context(user_id)

                # 2. Inject Context
                if user_context.get("summary") or user_context.get("keywords"):
                    if "user_history" not in context:
                        context["user_history"] = user_context
                    logger.info(f"✅ Injected context for user {user_id}")
            except Exception as e:
                logger.warning(f"Context injection failed: {e}")

        # Handle explicit agent selection
        agent_type = body.get("agent_type")
        if agent_type and agent_type != "auto":
            context["target_agent"] = agent_type

        # Get user profile for Parlant customer tag
        # 사용자 프로필 추출 (Parlant 고객 태그용)
        profile = body.get("profile") or body.get("user_profile", "general")

        # Create AgentRequest
        agent_request = AgentRequest(
            query=query,
            session_id=session_id,
            user_id=user_id,
            context=context,
            profile=profile  # Pass profile for Parlant integration
        )

        async def event_generator():
            accumulated_response = ""
            final_agent_type = None

            # Register this stream as active
            stream_info = {
                "session_id": session_id,
                "room_id": room_id,
                "user_id": user_id,
                "started_at": datetime.utcnow(),
                "cancel_requested": False,
                "partial_response": ""
            }
            active_streams_tracker[session_id] = stream_info

            try:
                async for chunk in router_agent.process_stream(agent_request):
                    # Check for cancellation request
                    if active_streams_tracker.get(session_id, {}).get("cancel_requested"):
                        logger.info(f"Stream cancelled for session {session_id}")
                        yield f"data: {json.dumps({'status': 'cancelled', 'message': 'Stream stopped by user'})}\n\n"
                        break
                    content = ""
                    current_agent_type = None

                    if isinstance(chunk, dict):
                        if "content" in chunk:
                            content = chunk["content"]
                        elif "answer" in chunk:
                            content = chunk["answer"]

                        if "agent_type" in chunk:
                            current_agent_type = chunk["agent_type"]

                        yield f"data: {json.dumps(chunk)}\n\n"

                    elif hasattr(chunk, 'dict'):
                        resp_dict = chunk.dict()
                        content = resp_dict.get("answer", "")
                        current_agent_type = resp_dict.get("agent_type")
                        yield f"data: {json.dumps(resp_dict, default=str)}\n\n"
                    else:
                        content = str(chunk)
                        yield f"data: {json.dumps({'content': content})}\n\n"

                    if current_agent_type:
                        final_agent_type = current_agent_type

                    if isinstance(chunk, dict) and chunk.get("status") == "complete":
                        accumulated_response = content
                    elif isinstance(chunk, dict) and chunk.get("status") == "streaming":
                        accumulated_response += content
                    elif isinstance(chunk, dict) and chunk.get("status") == "new_message":
                        # Each new_message is a separate message, append with newline
                        if accumulated_response:
                            accumulated_response += "\n\n" + content
                        else:
                            accumulated_response = content
                    elif hasattr(chunk, 'dict'):
                        accumulated_response = content

                    # Update partial response for cancellation handling
                    if session_id in active_streams_tracker:
                        active_streams_tracker[session_id]["partial_response"] = accumulated_response

            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                # Remove from active streams
                if session_id in active_streams_tracker:
                    del active_streams_tracker[session_id]

            # Save to DB after stream completes
            try:
                if session_id and query and user_id and accumulated_response:
                    save_agent_type = final_agent_type or "research_paper"

                    await context_system.context_engineer.db_manager.save_conversation(
                        user_id, session_id, save_agent_type, query, accumulated_response, room_id
                    )
                    asyncio.create_task(context_system.context_engineer.analyze_and_update_context(user_id))
                    logger.info(f"✅ Saved streaming conversation for user {user_id} (Agent: {save_agent_type}, Room: {room_id})")
            except Exception as e:
                logger.warning(f"History saving failed in stream: {e}")

            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )

    except Exception as e:
        logger.error(f"Chat processing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(request: Request):
    """
    Streaming Chat Endpoint - Uses RouterAgent to handle complex intents with streaming
    """
    try:
        body = await request.json()
        query = body.get("query") or body.get("message")
        session_id = body.get("session_id", "default")
        user_id = body.get("user_id") # Optional
        room_id = body.get("room_id") # Optional - for multiple chat rooms

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # --- Context Engineering: Injection ---
        context = body.get("context", {})
        
        # Resolve user_id from session if not provided
        if not user_id and session_id:
            session = context_system.session_manager.get_session(session_id)
            if session:
                user_id = session.get("user_id")

        if user_id:
            try:
                # 1. Get Context
                user_context = await context_system.context_engineer.get_user_context(user_id)
                
                # 2. Inject Context
                if user_context.get("summary") or user_context.get("keywords"):
                    if "user_history" not in context:
                        context["user_history"] = user_context
                    logger.info(f"✅ Injected context for user {user_id}")
            except Exception as e:
                logger.warning(f"Context injection failed: {e}")

        # Handle explicit agent selection
        agent_type = body.get("agent_type")
        if agent_type and agent_type != "auto":
            context["target_agent"] = agent_type

        # Get user profile for Parlant customer tag
        # 사용자 프로필 추출 (Parlant 고객 태그용)
        profile = body.get("profile") or body.get("user_profile", "general")

        # Create AgentRequest
        agent_request = AgentRequest(
            query=query,
            session_id=session_id,
            user_id=user_id,
            context=context,
            profile=profile  # Pass profile for Parlant integration
        )

        async def event_generator():
            accumulated_response = ""
            final_agent_type = None

            try:
                async for chunk in router_agent.process_stream(agent_request):
                    # Determine content and agent_type from chunk
                    content = ""
                    current_agent_type = None

                    if isinstance(chunk, dict):
                        # Handle dict chunks (from Router or Streaming Agents)
                        if "content" in chunk:
                            content = chunk["content"]
                        elif "answer" in chunk:
                            content = chunk["answer"]

                        if "agent_type" in chunk:
                            current_agent_type = chunk["agent_type"]

                        sse_data = f"data: {json.dumps(chunk)}\n\n"
                        logger.info(f"📤 SSE sending: {content[:50] if content else 'no content'}...")
                        yield sse_data

                    elif hasattr(chunk, 'dict'): # AgentResponse (Pydantic)
                        # Handle full response (Non-streaming Agents)
                        resp_dict = chunk.dict()
                        content = resp_dict.get("answer", "")
                        current_agent_type = resp_dict.get("agent_type")
                        # Ensure consistent format with 'content' field for frontend compatibility
                        resp_dict["content"] = content  # Add content field for frontend
                        sse_data = f"data: {json.dumps(resp_dict, default=str)}\n\n"
                        logger.info(f"📤 SSE sending (pydantic): answer={content[:50] if content else 'empty'}, agent={current_agent_type}")
                        logger.debug(f"📤 SSE full data keys: {list(resp_dict.keys())}")
                        yield sse_data
                    else:
                        # Handle raw string or other types
                        content = str(chunk)
                        sse_data = f"data: {json.dumps({'content': content})}\n\n"
                        logger.info(f"📤 SSE sending (raw): {content[:50]}...")
                        yield sse_data

                    # Accumulate for history
                    # Note: For synthesized responses, the last chunk usually contains the full answer.
                    # For streaming, we might need to append. 
                    # RouterAgent sends "status": "complete" with full content for synthesis.
                    # Single agent streaming sends parts.
                    
                    if current_agent_type:
                        final_agent_type = current_agent_type
                    
                    if isinstance(chunk, dict) and chunk.get("status") == "complete":
                        # Final synthesized answer
                        accumulated_response = content
                    elif isinstance(chunk, dict) and chunk.get("status") == "streaming":
                        # Streaming parts
                        accumulated_response += content
                    elif isinstance(chunk, dict) and chunk.get("status") == "new_message":
                        # Each new_message is a separate message, append with newline
                        if accumulated_response:
                            accumulated_response += "\n\n" + content
                        else:
                            accumulated_response = content
                    elif hasattr(chunk, 'dict'):
                        # Full response object
                        accumulated_response = content

            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

            # Save to DB after stream completes
            try:
                if session_id and query and user_id and accumulated_response:
                    # Use final_agent_type or default to router/research_paper
                    save_agent_type = final_agent_type or "research_paper"

                    await context_system.context_engineer.db_manager.save_conversation(
                        user_id, session_id, save_agent_type, query, accumulated_response, room_id
                    )
                    # Trigger analysis (fire and forget)
                    asyncio.create_task(context_system.context_engineer.analyze_and_update_context(user_id))
                    logger.info(f"✅ Saved streaming conversation for user {user_id} (Agent: {save_agent_type}, Room: {room_id})")
            except Exception as e:
                logger.warning(f"History saving failed in stream: {e}")

            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )

    except Exception as e:
        logger.error(f"Chat stream error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))





@router.api_route("/welfare/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_welfare(path: str, request: Request):
    """Proxy to Medical Welfare Agent (Port 8801)"""
    return await _proxy_request(path, request, WELFARE_BASE_URL)


@router.api_route("/research/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_research(path: str, request: Request):
    """Proxy to Research Paper Agent (Port 8800)"""
    return await _proxy_request(path, request, RESEARCH_BASE_URL)


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_default(path: str, request: Request):
    """
    Default Proxy (Research Agent - Port 8800)
    Kept for backward compatibility
    """
    return await _proxy_request(path, request, RESEARCH_BASE_URL)


async def _proxy_request(path: str, request: Request, base_url: str):
    """Internal proxy handler"""
    try:
        # Build target URL
        url = f"{base_url}/{path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"

        # Prepare headers (exclude host and content-length)
        headers = {
            key: value
            for key, value in request.headers.items()
            if key.lower() not in ["host", "content-length"]
        }

        # Get request body
        body = await request.body()
        
        # --- Context Engineering: Injection (Only for POST) ---
        if request.method == "POST":
            try:
                # Try to parse body as JSON to inject context
                body_json = json.loads(body)
                session_id = body_json.get("session_id")
                query = body_json.get("query") or body_json.get("message")
                
                if session_id and query:
                    session = context_system.session_manager.get_session(session_id)
                    if session:
                        user_id = session.get("user_id")
                        if user_id:
                            # 1. Get Context
                            user_context = await context_system.context_engineer.get_user_context(user_id)
                            
                            # 2. Inject Context
                            if user_context.get("summary") or user_context.get("keywords"):
                                # Add to 'context' field which agents should respect
                                if "context" not in body_json:
                                    body_json["context"] = {}
                                
                                # Add user history context
                                body_json["context"]["user_history"] = user_context
                                
                                # Re-serialize body
                                body = json.dumps(body_json).encode("utf-8")
                                # Update content-length header
                                headers["content-length"] = str(len(body))
                                logger.info(f"✅ Injected context for user {user_id}")
            except Exception as e:
                logger.warning(f"Context injection failed: {e}")

        logger.info(f"Proxying {request.method} {url}")

        # Forward request to Parlant server
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )

        # Return response with proper content handling
        content_type = response.headers.get("content-type", "")

        if "application/json" in content_type:
            try:
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            except Exception as e:
                # JSON 파싱 실패, 텍스트 응답으로 폴백 (JSON parsing failed, fallback to text response)
                logger.warning(f"Failed to parse JSON response: {e}")
                pass

        # Return text response
        return JSONResponse(
            content={"response": response.text},
            status_code=response.status_code,
            headers=dict(response.headers)
        )

    except httpx.ConnectError:
        logger.error(f"Cannot connect to Parlant server at {base_url}")
        raise HTTPException(
            status_code=503,
            detail=f"Parlant server unavailable at {base_url}. Please ensure the Parlant server is running."
        )
    except httpx.TimeoutException:
        logger.error(f"Timeout connecting to Parlant server")
        raise HTTPException(
            status_code=504,
            detail="Parlant server timeout"
        )
    except Exception as e:
        logger.error(f"Proxy error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Proxy error: {str(e)}"
        )
