"""
Chat and Room Models
Pydantic models for chat room management and session control
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class RoomCreate(BaseModel):
    """Request model for creating a new chat room"""
    user_id: str = Field(..., description="User ID who owns the room")
    room_name: Optional[str] = Field(None, description="Optional room name", max_length=100)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional metadata")

    @field_validator('metadata')
    @classmethod
    def validate_metadata_size(cls, v):
        """Limit metadata size to prevent abuse"""
        import json
        if len(json.dumps(v)) > 10240:  # 10KB limit
            raise ValueError("Metadata size exceeds 10KB limit")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "room_name": "Kidney Disease Discussion",
                "metadata": {
                    "initial_agent": "research_paper",
                    "tags": ["kidney", "research"]
                }
            }
        }


class RoomCreateWithSession(BaseModel):
    """
    Request model for creating a new chat room with Parlant session.
    새로운 채팅 방을 Parlant 세션과 함께 생성하는 요청 모델.
    """
    user_id: str = Field(..., description="User ID who owns the room")
    room_name: Optional[str] = Field(None, description="Optional room name", max_length=100)
    profile: str = Field(default="general", description="User profile for Parlant customer tags")
    agent_type: Optional[str] = Field(None, description="Target agent type (medical_welfare, research_paper)")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional metadata")

    @field_validator('metadata')
    @classmethod
    def validate_metadata_size(cls, v):
        """Limit metadata size to prevent abuse"""
        import json
        if len(json.dumps(v)) > 10240:  # 10KB limit
            raise ValueError("Metadata size exceeds 10KB limit")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "room_name": "Kidney Disease Discussion",
                "profile": "patient",
                "agent_type": "medical_welfare",
                "metadata": {
                    "tags": ["kidney", "research"]
                }
            }
        }


class RoomUpdate(BaseModel):
    """Request model for updating a room"""
    room_name: Optional[str] = Field(None, description="New room name", max_length=100)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Updated metadata")

    @field_validator('metadata')
    @classmethod
    def validate_metadata_size(cls, v):
        if v is not None:
            import json
            if len(json.dumps(v)) > 10240:
                raise ValueError("Metadata size exceeds 10KB limit")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "room_name": "Updated Room Name",
                "metadata": {
                    "tags": ["kidney", "treatment", "research"]
                }
            }
        }


class LastMessage(BaseModel):
    """Last message in a room"""
    user_input: str
    agent_response: str
    agent_type: str
    timestamp: datetime


class RoomResponse(BaseModel):
    """Response model for room data"""
    room_id: str
    user_id: str
    room_name: Optional[str]
    created_at: datetime
    last_activity: datetime
    message_count: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    last_message: Optional[LastMessage] = None

    class Config:
        json_schema_extra = {
            "example": {
                "room_id": "room_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "user_id": "user_123",
                "room_name": "Kidney Disease Discussion",
                "created_at": "2025-01-26T10:30:00Z",
                "last_activity": "2025-01-26T15:45:00Z",
                "message_count": 12,
                "metadata": {
                    "initial_agent": "research_paper",
                    "tags": ["kidney", "research"]
                },
                "last_message": {
                    "user_input": "What are the latest treatments?",
                    "agent_response": "Based on recent research...",
                    "agent_type": "research_paper",
                    "timestamp": "2025-01-26T15:45:00Z"
                }
            }
        }


class RoomResponseWithSession(BaseModel):
    """
    Response model for room creation with Parlant session info.
    Parlant 세션 정보를 포함한 방 생성 응답 모델.
    """
    room_id: str
    user_id: str
    room_name: Optional[str]
    created_at: datetime
    last_activity: datetime
    message_count: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    parlant_session_id: Optional[str] = Field(None, description="Parlant session ID for this room")
    parlant_customer_id: Optional[str] = Field(None, description="Parlant customer ID for this user")

    class Config:
        json_schema_extra = {
            "example": {
                "room_id": "room_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "user_id": "user_123",
                "room_name": "Kidney Disease Discussion",
                "created_at": "2025-01-26T10:30:00Z",
                "last_activity": "2025-01-26T10:30:00Z",
                "message_count": 0,
                "metadata": {},
                "parlant_session_id": "ses_xyz789",
                "parlant_customer_id": "cus_abc123"
            }
        }


class RoomListResponse(BaseModel):
    """Response model for room list"""
    rooms: List[RoomResponse]
    total: int
    page: int = 1
    page_size: int = 50


class RoomHistoryResponse(BaseModel):
    """Response model for room conversation history"""
    room_id: str
    conversations: List['ConversationItem']
    total: int
    page: int = 1
    page_size: int = 50


class ConversationItem(BaseModel):
    """Single conversation item"""
    timestamp: datetime
    user_input: str
    agent_response: str
    agent_type: str
    session_id: str


class SessionCreate(BaseModel):
    """Request model for creating a session"""
    user_id: str = Field(..., description="User ID")
    room_id: Optional[str] = Field(None, description="Optional room ID to associate with session")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "room_id": "room_abc"
            }
        }


class SessionResponse(BaseModel):
    """Response model for session data"""
    session_id: str
    user_id: str
    room_id: str
    created_at: datetime
    expires_at: datetime


class SessionReset(BaseModel):
    """Request model for resetting a session"""
    agent_type: Optional[str] = Field(
        None,
        description="Optional agent type to reset. If None, resets entire session"
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {"agent_type": "nutrition"},
                {"agent_type": None}
            ]
        }


class SessionResetResponse(BaseModel):
    """Response model for session reset"""
    session_id: str
    reset_scope: str  # "all" or specific agent_type
    conversations_cleared: int


class StreamControlResponse(BaseModel):
    """Response model for stream control operations"""
    session_id: str
    room_id: str
    status: str  # "stop_requested", "not_found"
    partial_response: Optional[str] = None
