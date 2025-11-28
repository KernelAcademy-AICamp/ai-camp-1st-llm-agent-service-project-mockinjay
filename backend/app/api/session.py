"""
Session Control API Router
Handles session lifecycle, reset operations, and stream control
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional
import logging
import uuid

from app.models.chat import (
    SessionCreate, SessionResponse, SessionReset,
    SessionResetResponse, StreamControlResponse
)
from app.models.responses import SuccessResponse
from app.core.context_system import context_system

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/session", tags=["session"])

# Global dictionary to track active streams
# In production, this should be Redis for multi-instance support
active_streams: dict = {}


@router.post("/create", response_model=SuccessResponse, status_code=201)
async def create_session(request: SessionCreate):
    """
    Create a new session for a user

    Args:
        request: Session creation request with user_id and optional room_id

    Returns:
        Created session data with session_id, room_id, and expiration time

    Note:
        If room_id is not provided, a new room will be auto-created
    """
    try:
        # Create session using SessionManager
        session_id = context_system.session_manager.create_session(
            user_id=request.user_id,
            room_id=request.room_id
        )

        session = context_system.session_manager.get_session(session_id)

        if not session:
            raise HTTPException(status_code=500, detail="Failed to create session")

        # Calculate expiration time
        expires_at = session["created_at"] + context_system.session_manager.session_timeout

        logger.info(f"Created session {session_id} for user {request.user_id} in room {session['room_id']}")

        return SuccessResponse(
            message="Session created successfully",
            data={
                "session_id": session_id,
                "user_id": request.user_id,
                "room_id": session["room_id"],
                "created_at": session["created_at"].isoformat(),
                "expires_at": expires_at.isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Error creating session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.get("/{session_id}", response_model=SuccessResponse)
async def get_session(session_id: str):
    """
    Get session details

    Args:
        session_id: Session ID

    Returns:
        Session information including user_id, room_id, and active agent

    Raises:
        404: Session not found or expired
    """
    try:
        session = context_system.session_manager.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found or expired")

        expires_at = session["created_at"] + context_system.session_manager.session_timeout

        return SuccessResponse(
            message="Session retrieved successfully",
            data={
                "session_id": session_id,
                "user_id": session["user_id"],
                "room_id": session["room_id"],
                "created_at": session["created_at"].isoformat(),
                "last_activity": session["last_activity"].isoformat(),
                "expires_at": expires_at.isoformat(),
                "active_agent": session.get("active_agent"),
                "conversation_count": len(session.get("conversation_history", []))
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")


@router.post("/{session_id}/reset", response_model=SuccessResponse)
async def reset_session(session_id: str, request: SessionReset):
    """
    Reset a session or specific agent within a session

    Args:
        session_id: Session ID
        request: Reset request with optional agent_type

    Returns:
        Reset confirmation with number of conversations cleared

    Behavior:
        - If agent_type is provided: Clear only that agent's conversation history
        - If agent_type is None: Clear all conversation history in the session

    Note:
        This clears in-memory history. MongoDB history is preserved unless explicitly deleted.
    """
    try:
        session = context_system.session_manager.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found or expired")

        conversations_cleared = 0
        reset_scope = request.agent_type or "all"

        if request.agent_type:
            # Reset specific agent only
            original_count = len(session["conversation_history"])
            session["conversation_history"] = [
                conv for conv in session["conversation_history"]
                if conv.get("agent_type") != request.agent_type
            ]
            conversations_cleared = original_count - len(session["conversation_history"])

            # Clear active agent if it matches
            if session.get("active_agent") == request.agent_type:
                session["active_agent"] = None

            logger.info(f"Reset agent {request.agent_type} in session {session_id} ({conversations_cleared} conversations)")

        else:
            # Reset entire session
            conversations_cleared = len(session["conversation_history"])
            session["conversation_history"] = []
            session["active_agent"] = None

            logger.info(f"Reset session {session_id} ({conversations_cleared} conversations)")

        # Update last activity
        session["last_activity"] = datetime.utcnow()

        return SuccessResponse(
            message="Session reset successfully",
            data={
                "session_id": session_id,
                "reset_scope": reset_scope,
                "conversations_cleared": conversations_cleared
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to reset session: {str(e)}")


@router.post("/{session_id}/stop", response_model=SuccessResponse)
async def stop_stream(session_id: str):
    """
    Stop an active streaming operation for a session

    Args:
        session_id: Session ID

    Returns:
        Stream stop confirmation with partial response if available

    Note:
        This sets a cancellation flag. The actual stream must check this flag
        and gracefully terminate. Use this in conjunction with event_generator
        cancellation token pattern.
    """
    try:
        session = context_system.session_manager.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found or expired")

        # Check if there's an active stream for this session
        stream_info = active_streams.get(session_id)

        if not stream_info:
            return SuccessResponse(
                message="No active stream found for this session",
                data={
                    "session_id": session_id,
                    "room_id": session["room_id"],
                    "status": "not_found"
                }
            )

        # Set cancellation flag
        stream_info["cancel_requested"] = True
        stream_info["cancelled_at"] = datetime.utcnow()

        logger.info(f"Cancellation requested for stream in session {session_id}")

        return SuccessResponse(
            message="Stream stop requested",
            data={
                "session_id": session_id,
                "room_id": session["room_id"],
                "status": "stop_requested",
                "partial_response": stream_info.get("partial_response")
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping stream for session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to stop stream: {str(e)}")


@router.delete("/{session_id}/history", response_model=SuccessResponse)
async def clear_session_history(
    session_id: str,
    room_id: Optional[str] = Query(None, description="Optional room_id to clear specific room history")
):
    """
    Clear conversation history from MongoDB for a session

    Args:
        session_id: Session ID
        room_id: Optional room ID to clear specific room history

    Returns:
        Deletion confirmation with conversation count

    Warning:
        This permanently deletes conversation history from MongoDB.
        Use with caution!
    """
    try:
        session = context_system.session_manager.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found or expired")

        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        # Build delete query
        delete_query = {"session_id": session_id}
        if room_id:
            delete_query["room_id"] = room_id

        # Count conversations to be deleted
        conv_count = await db_manager.db.conversation_history.count_documents(delete_query)

        # Delete conversations
        result = await db_manager.db.conversation_history.delete_many(delete_query)

        # Update room message count if room_id specified
        if room_id:
            remaining_count = await db_manager.db.conversation_history.count_documents({
                "room_id": room_id
            })
            await db_manager.db.chat_rooms.update_one(
                {"room_id": room_id},
                {"$set": {"message_count": remaining_count}}
            )

        logger.info(f"Cleared {conv_count} conversations for session {session_id}" +
                   (f" in room {room_id}" if room_id else ""))

        return SuccessResponse(
            message="Session history cleared successfully",
            data={
                "session_id": session_id,
                "room_id": room_id,
                "conversations_deleted": conv_count
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing history for session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")


@router.delete("/{session_id}", response_model=SuccessResponse)
async def delete_session(session_id: str):
    """
    Delete a session

    Args:
        session_id: Session ID

    Returns:
        Deletion confirmation

    Note:
        This only removes the in-memory session. Conversation history in MongoDB
        is preserved. Use /history endpoint to clear MongoDB data.
    """
    try:
        success = context_system.session_manager.delete_session(session_id)

        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        # Remove from active_streams if present
        if session_id in active_streams:
            del active_streams[session_id]

        logger.info(f"Deleted session {session_id}")

        return SuccessResponse(
            message="Session deleted successfully",
            data={
                "session_id": session_id,
                "status": "deleted"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")


# Export active_streams for use in chat.py
__all__ = ["router", "active_streams"]
