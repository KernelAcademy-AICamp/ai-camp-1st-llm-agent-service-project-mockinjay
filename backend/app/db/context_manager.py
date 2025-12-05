from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Optional
import os
from datetime import datetime
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContextManager:
    """
    Context Manager for handling conversation history and user context persistence.
    """

    def __init__(self, uri: str = None, db_name: str = "careguide"):
        self.uri = uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = db_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None

    async def connect(self):
        """Connect to MongoDB"""
        if not self.client:
            self.client = AsyncIOMotorClient(self.uri)
            self.db = self.client[self.db_name]
            logger.info(f"✅ Context Manager connected: {self.db_name}")

    async def close(self):
        """Close connection"""
        if self.client:
            self.client.close()
            logger.info("Context Manager connection closed")

    async def save_conversation(self, user_id: str, session_id: str, agent_type: str, user_input: str, agent_response: str, room_id: str = None):
        """
        Save a single conversation turn to history.

        Args:
            user_id: 사용자 ID
            session_id: 세션 ID
            agent_type: 에이전트 타입
            user_input: 사용자 입력
            agent_response: 에이전트 응답
            room_id: 채팅방 ID (선택사항)
        """
        if self.db is None:
            await self.connect()

        document = {
            "user_id": user_id,
            "session_id": session_id,
            "room_id": room_id or session_id,  # room_id가 없으면 session_id 사용
            "agent_type": agent_type,
            "user_input": user_input,
            "agent_response": agent_response,
            "timestamp": datetime.utcnow()
        }

        await self.db.conversation_history.insert_one(document)

    async def get_recent_conversations(self, user_id: str, limit: int = 5) -> List[Dict]:
        """
        Get recent conversations for a user across all agents.
        """
        if self.db is None:
            await self.connect()

        cursor = self.db.conversation_history.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(limit)

        results = await cursor.to_list(length=limit)
        # Return in chronological order for context
        return sorted(results, key=lambda x: x["timestamp"])

    async def get_conversations_by_agent(self, user_id: str, agent_type: str, limit: int = 50) -> List[Dict]:
        """
        Get recent conversations for a specific agent type.

        Args:
            user_id: User ID
            agent_type: Agent type (e.g., 'nutrition', 'medical_welfare')
            limit: Maximum number of conversations to return

        Returns:
            List of conversation documents for the specified agent
        """
        if self.db is None:
            await self.connect()

        cursor = self.db.conversation_history.find(
            {"user_id": user_id, "agent_type": agent_type}
        ).sort("timestamp", -1).limit(limit)

        results = await cursor.to_list(length=limit)
        # Return in chronological order for context
        return sorted(results, key=lambda x: x["timestamp"])

    async def get_conversations_by_session_and_agent(self, session_id: str, agent_type: str, limit: int = 50) -> List[Dict]:
        """
        Get conversations for a specific session and agent type.

        Args:
            session_id: Session ID
            agent_type: Agent type (e.g., 'nutrition', 'medical_welfare')
            limit: Maximum number of conversations to return

        Returns:
            List of conversation documents for the specified session and agent
        """
        if self.db is None:
            await self.connect()

        cursor = self.db.conversation_history.find(
            {"session_id": session_id, "agent_type": agent_type}
        ).sort("timestamp", -1).limit(limit)

        results = await cursor.to_list(length=limit)
        # Return in chronological order for context
        return sorted(results, key=lambda x: x["timestamp"])

    async def save_user_context(self, user_id: str, summary: str, keywords: List[str]):
        """
        Save or update user context (summary and keywords).
        """
        if self.db is None:
            await self.connect()

        await self.db.user_context.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "summary": summary,
                    "keywords": keywords,
                    "last_updated": datetime.utcnow()
                }
            },
            upsert=True
        )

    async def get_user_context(self, user_id: str) -> Optional[Dict]:
        """
        Get user context.
        """
        if self.db is None:
            await self.connect()

        return await self.db.user_context.find_one({"user_id": user_id})

    async def get_conversations_by_room(self, room_id: str, limit: int = 50) -> List[Dict]:
        """
        Get conversations for a specific room.

        Args:
            room_id: 채팅방 ID
            limit: 최대 개수

        Returns:
            List[Dict]: 해당 채팅방의 대화 목록
        """
        if self.db is None:
            await self.connect()

        cursor = self.db.conversation_history.find(
            {"room_id": room_id}
        ).sort("timestamp", -1).limit(limit)

        results = await cursor.to_list(length=limit)
        # Return in chronological order for context
        return sorted(results, key=lambda x: x["timestamp"])

    async def get_user_rooms(self, user_id: str) -> List[Dict]:
        """
        Get list of chat rooms for a user.

        Args:
            user_id: 사용자 ID

        Returns:
            List[Dict]: 채팅방 목록 (room_id, 마지막 메시지 시간, 마지막 메시지 등)
        """
        if self.db is None:
            await self.connect()

        # Aggregate to get unique rooms with latest message
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"timestamp": -1}},
            {"$group": {
                "_id": "$room_id",
                "last_message_time": {"$first": "$timestamp"},
                "last_user_input": {"$first": "$user_input"},
                "last_agent_response": {"$first": "$agent_response"},
                "last_agent_type": {"$first": "$agent_type"},
                "message_count": {"$sum": 1}
            }},
            {"$sort": {"last_message_time": -1}}
        ]

        results = await self.db.conversation_history.aggregate(pipeline).to_list(length=None)

        return [{
            "room_id": r["_id"],
            "last_message_time": r["last_message_time"],
            "last_user_input": r["last_user_input"],
            "last_agent_response": r["last_agent_response"][:100] + "..." if len(r["last_agent_response"]) > 100 else r["last_agent_response"],
            "last_agent_type": r["last_agent_type"],
            "message_count": r["message_count"]
        } for r in results]
