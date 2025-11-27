"""
Session Repository

Manages diet analysis sessions for rate limiting.
"""
from typing import Optional, Dict, Any
from pymongo.collection import Collection
from datetime import datetime, timedelta
from bson import ObjectId

from app.db.base_repository import BaseRepository
from app.models.diet import DietSession
from app.db.connection import db


class SessionRepository(BaseRepository[DietSession]):
    """Repository for managing diet analysis sessions"""

    @property
    def collection(self) -> Collection:
        """Get sessions collection"""
        return db["diet_sessions"]

    def _to_entity(self, document: Dict[str, Any]) -> DietSession:
        """Convert MongoDB document to DietSession entity"""
        return DietSession(
            id=str(document["_id"]),
            user_id=str(document["user_id"]),
            created_at=document["created_at"],
            expires_at=document["expires_at"],
            analysis_count=document.get("analysis_count", 0)
        )

    def _to_document(self, entity: DietSession) -> Dict[str, Any]:
        """Convert DietSession entity to MongoDB document"""
        doc = {
            "user_id": ObjectId(entity.user_id),
            "created_at": entity.created_at,
            "expires_at": entity.expires_at,
            "analysis_count": entity.analysis_count
        }
        if entity.id:
            doc["_id"] = ObjectId(entity.id)
        return doc

    def get_current_session(self, user_id: str) -> Optional[DietSession]:
        """
        Get current active session for user

        Args:
            user_id: User ID

        Returns:
            Active session if exists, None otherwise
        """
        session = self.find_one({
            "user_id": ObjectId(user_id),
            "expires_at": {"$gt": datetime.utcnow()}
        })
        return session

    def create_new_session(self, user_id: str) -> DietSession:
        """
        Create a new analysis session

        Args:
            user_id: User ID

        Returns:
            Newly created session
        """
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=1)

        session = DietSession(
            user_id=user_id,
            created_at=now,
            expires_at=expires_at,
            analysis_count=0
        )

        session_id = self.create(session)
        session.id = session_id
        return session

    def increment_analysis_count(self, session_id: str) -> bool:
        """
        Increment analysis count for session

        Args:
            session_id: Session ID

        Returns:
            True if incremented successfully
        """
        result = self.collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$inc": {"analysis_count": 1}}
        )
        return result.modified_count > 0

    def get_or_create_session(self, user_id: str) -> DietSession:
        """
        Get existing session or create new one

        Args:
            user_id: User ID

        Returns:
            Active session
        """
        session = self.get_current_session(user_id)
        if session and session.can_analyze:
            return session
        return self.create_new_session(user_id)

    def cleanup_expired_sessions(self) -> int:
        """
        Delete expired sessions

        Returns:
            Number of deleted sessions
        """
        return self.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })


# Singleton instance
session_repository = SessionRepository()
