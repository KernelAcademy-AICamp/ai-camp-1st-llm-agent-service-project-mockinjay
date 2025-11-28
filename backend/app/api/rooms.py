"""
Rooms API Router
Handles chat room CRUD operations and room-specific history
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging
import uuid
from datetime import datetime

from app.models.chat import (
    RoomCreate, RoomUpdate, RoomResponse, RoomListResponse,
    RoomHistoryResponse, ConversationItem, LastMessage
)
from app.models.responses import SuccessResponse, ErrorResponse
from app.core.context_system import context_system

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.post("", response_model=SuccessResponse, status_code=201)
async def create_room(request: RoomCreate):
    """
    Create a new chat room for a user

    Args:
        request: Room creation request with user_id, optional room_name and metadata

    Returns:
        Success response with created room data

    Raises:
        400: Invalid request data
        500: Database error
    """
    try:
        # Generate unique room ID
        room_id = f"room_{str(uuid.uuid4())}"

        # Default room name if not provided
        room_name = request.room_name or f"Chat {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"

        # Prepare room document
        room_doc = {
            "room_id": room_id,
            "user_id": request.user_id,
            "room_name": room_name,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "message_count": 0,
            "metadata": request.metadata,
            "is_deleted": False
        }

        # Insert into MongoDB
        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        # Check room count limit (max 50 rooms per user)
        existing_rooms = await db_manager.db.chat_rooms.count_documents({
            "user_id": request.user_id,
            "is_deleted": False
        })

        if existing_rooms >= 50:
            raise HTTPException(
                status_code=400,
                detail="Maximum room limit (50) reached. Please delete old rooms."
            )

        await db_manager.db.chat_rooms.insert_one(room_doc)

        # Register room in SessionManager (for in-memory tracking)
        if request.user_id not in context_system.session_manager.user_rooms:
            context_system.session_manager.user_rooms[request.user_id] = []
        context_system.session_manager.user_rooms[request.user_id].append(room_id)

        logger.info(f"Created room {room_id} for user {request.user_id}")

        return SuccessResponse(
            message="Room created successfully",
            data={
                "room_id": room_id,
                "user_id": request.user_id,
                "room_name": room_name,
                "created_at": room_doc["created_at"].isoformat(),
                "last_activity": room_doc["last_activity"].isoformat(),
                "message_count": 0,
                "metadata": request.metadata
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating room: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create room: {str(e)}")


@router.get("", response_model=SuccessResponse)
async def list_user_rooms(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, ge=1, le=100, description="Number of rooms to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    sort_by: str = Query("last_activity", description="Sort field: last_activity, created_at, room_name")
):
    """
    List all chat rooms for a user with pagination

    Args:
        user_id: User ID
        limit: Maximum number of rooms to return (1-100)
        offset: Pagination offset
        sort_by: Sort field (last_activity, created_at, room_name)

    Returns:
        List of rooms with last message info and pagination metadata
    """
    try:
        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        # Validate sort field
        sort_field_map = {
            "last_activity": "last_activity",
            "created_at": "created_at",
            "room_name": "room_name"
        }

        if sort_by not in sort_field_map:
            sort_by = "last_activity"

        # Count total rooms
        total = await db_manager.db.chat_rooms.count_documents({
            "user_id": user_id,
            "is_deleted": False
        })

        # Fetch rooms with pagination
        cursor = db_manager.db.chat_rooms.find({
            "user_id": user_id,
            "is_deleted": False
        }).sort(sort_field_map[sort_by], -1).skip(offset).limit(limit)

        rooms = await cursor.to_list(length=limit)

        # Enrich rooms with last message data
        enriched_rooms = []
        for room in rooms:
            # Get last message for this room
            last_conv = await db_manager.db.conversation_history.find_one(
                {"room_id": room["room_id"]},
                sort=[("timestamp", -1)]
            )

            last_message = None
            if last_conv:
                last_message = LastMessage(
                    user_input=last_conv["user_input"],
                    agent_response=last_conv["agent_response"][:100] + "..." if len(last_conv["agent_response"]) > 100 else last_conv["agent_response"],
                    agent_type=last_conv["agent_type"],
                    timestamp=last_conv["timestamp"]
                )

            enriched_rooms.append(RoomResponse(
                room_id=room["room_id"],
                user_id=room["user_id"],
                room_name=room.get("room_name"),
                created_at=room["created_at"],
                last_activity=room["last_activity"],
                message_count=room.get("message_count", 0),
                metadata=room.get("metadata", {}),
                last_message=last_message
            ))

        page = (offset // limit) + 1

        logger.info(f"Listed {len(enriched_rooms)} rooms for user {user_id} (page {page})")

        return SuccessResponse(
            message="Rooms retrieved successfully",
            data={
                "rooms": [room.model_dump() for room in enriched_rooms],
                "total": total,
                "page": page,
                "page_size": limit
            }
        )

    except Exception as e:
        logger.error(f"Error listing rooms: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list rooms: {str(e)}")


@router.get("/{room_id}", response_model=SuccessResponse)
async def get_room(room_id: str):
    """
    Get details for a specific room

    Args:
        room_id: Room ID

    Returns:
        Room details including metadata and statistics

    Raises:
        404: Room not found
    """
    try:
        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        room = await db_manager.db.chat_rooms.find_one({
            "room_id": room_id,
            "is_deleted": False
        })

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        # Get actual message count from conversation_history
        message_count = await db_manager.db.conversation_history.count_documents({
            "room_id": room_id
        })

        # Update message count if different
        if message_count != room.get("message_count", 0):
            await db_manager.db.chat_rooms.update_one(
                {"room_id": room_id},
                {"$set": {"message_count": message_count}}
            )
            room["message_count"] = message_count

        room_response = RoomResponse(
            room_id=room["room_id"],
            user_id=room["user_id"],
            room_name=room.get("room_name"),
            created_at=room["created_at"],
            last_activity=room["last_activity"],
            message_count=room.get("message_count", 0),
            metadata=room.get("metadata", {})
        )

        return SuccessResponse(
            message="Room retrieved successfully",
            data=room_response.model_dump()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting room {room_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get room: {str(e)}")


@router.patch("/{room_id}", response_model=SuccessResponse)
async def update_room(room_id: str, request: RoomUpdate, user_id: str = Query(..., description="User ID for ownership verification")):
    """
    Update room name and/or metadata

    Args:
        room_id: Room ID
        request: Update request with optional room_name and metadata
        user_id: User ID for ownership verification

    Returns:
        Updated room data

    Raises:
        403: User doesn't own this room
        404: Room not found
    """
    try:
        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        # Verify room exists and user owns it
        room = await db_manager.db.chat_rooms.find_one({
            "room_id": room_id,
            "is_deleted": False
        })

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        if room["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied: You don't own this room")

        # Prepare update document
        update_doc = {"updated_at": datetime.utcnow()}

        if request.room_name is not None:
            update_doc["room_name"] = request.room_name

        if request.metadata is not None:
            update_doc["metadata"] = request.metadata

        # Update room
        await db_manager.db.chat_rooms.update_one(
            {"room_id": room_id},
            {"$set": update_doc}
        )

        logger.info(f"Updated room {room_id}")

        return SuccessResponse(
            message="Room updated successfully",
            data={
                "room_id": room_id,
                "room_name": request.room_name or room.get("room_name"),
                "updated_at": update_doc["updated_at"].isoformat()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating room {room_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update room: {str(e)}")


@router.delete("/{room_id}", response_model=SuccessResponse)
async def delete_room(room_id: str, user_id: str = Query(..., description="User ID for ownership verification")):
    """
    Delete a room and all associated conversations

    Args:
        room_id: Room ID
        user_id: User ID for ownership verification

    Returns:
        Deletion confirmation with conversation count

    Raises:
        403: User doesn't own this room
        404: Room not found
    """
    try:
        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        # Verify room exists and user owns it
        room = await db_manager.db.chat_rooms.find_one({
            "room_id": room_id,
            "is_deleted": False
        })

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        if room["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied: You don't own this room")

        # Soft delete room (mark as deleted instead of removing)
        await db_manager.db.chat_rooms.update_one(
            {"room_id": room_id},
            {"$set": {"is_deleted": True, "deleted_at": datetime.utcnow()}}
        )

        # Count conversations to be deleted
        conv_count = await db_manager.db.conversation_history.count_documents({
            "room_id": room_id
        })

        # Delete associated conversations
        await db_manager.db.conversation_history.delete_many({
            "room_id": room_id
        })

        # Remove from SessionManager
        if user_id in context_system.session_manager.user_rooms:
            if room_id in context_system.session_manager.user_rooms[user_id]:
                context_system.session_manager.user_rooms[user_id].remove(room_id)

        logger.info(f"Deleted room {room_id} and {conv_count} conversations")

        return SuccessResponse(
            message="Room and associated conversations deleted successfully",
            data={
                "room_id": room_id,
                "conversations_deleted": conv_count
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting room {room_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete room: {str(e)}")


@router.get("/{room_id}/history", response_model=SuccessResponse)
async def get_room_history(
    room_id: str,
    limit: int = Query(50, ge=1, le=200, description="Number of conversations to return"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Get conversation history for a specific room

    Args:
        room_id: Room ID
        limit: Maximum number of conversations (1-200)
        offset: Pagination offset

    Returns:
        List of conversations with pagination metadata

    Raises:
        404: Room not found
    """
    try:
        db_manager = context_system.context_engineer.db_manager
        await db_manager.connect()

        # Verify room exists
        room = await db_manager.db.chat_rooms.find_one({
            "room_id": room_id,
            "is_deleted": False
        })

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        # Count total conversations
        total = await db_manager.db.conversation_history.count_documents({
            "room_id": room_id
        })

        # Fetch conversations with pagination (newest first)
        cursor = db_manager.db.conversation_history.find({
            "room_id": room_id
        }).sort("timestamp", -1).skip(offset).limit(limit)

        conversations = await cursor.to_list(length=limit)

        # Reverse to chronological order
        conversations.reverse()

        conversation_items = [
            ConversationItem(
                timestamp=conv["timestamp"],
                user_input=conv["user_input"],
                agent_response=conv["agent_response"],
                agent_type=conv["agent_type"],
                session_id=conv["session_id"]
            )
            for conv in conversations
        ]

        page = (offset // limit) + 1

        logger.info(f"Retrieved {len(conversation_items)} conversations for room {room_id}")

        return SuccessResponse(
            message="Room history retrieved successfully",
            data={
                "room_id": room_id,
                "conversations": [item.model_dump() for item in conversation_items],
                "total": total,
                "page": page,
                "page_size": limit
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting room history for {room_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get room history: {str(e)}")
