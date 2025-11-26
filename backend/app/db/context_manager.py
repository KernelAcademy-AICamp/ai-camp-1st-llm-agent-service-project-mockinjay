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

    async def save_conversation(self, user_id: str, session_id: str, agent_type: str, user_input: str, agent_response: str):
        """
        Save a single conversation turn to history.
        """
        if self.db is None:
            await self.connect()

        document = {
            "user_id": user_id,
            "session_id": session_id,
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
