"""
Preferences Service
Business logic for user preferences management
사용자 설정 관리를 위한 비즈니스 로직
"""
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException, status
import logging

from app.db.connection import db
from app.services.mypage.utils import serialize_object_id, serialize_datetime

logger = logging.getLogger(__name__)


class PreferencesService:
    """User preferences management service (사용자 설정 관리 서비스)"""

    def __init__(self):
        # Lazy initialization - collection accessed when needed, not at import time
        self._preferences_collection = None

    @property
    def preferences_collection(self):
        """Lazy property to access user_preferences collection after database is initialized"""
        if self._preferences_collection is None:
            self._preferences_collection = db["user_preferences"]
        return self._preferences_collection

    async def get_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's preferences (theme, language, notifications)
        사용자의 설정 조회 (테마, 언어, 알림)

        Args:
            user_id: User ID (string)

        Returns:
            dict: User preferences (returns defaults if not found)

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Find preferences for this user
            preferences = await self.preferences_collection.find_one({"userId": user_id})

            if not preferences:
                # Return default preferences if not found
                return {
                    "userId": user_id,
                    "theme": "light",
                    "language": "ko",
                    "notifications": {
                        "email": True,
                        "push": True,
                        "community": True,
                        "trends": True
                    },
                    "updatedAt": None
                }

            # Serialize and return
            preferences = serialize_object_id(preferences)
            preferences = serialize_datetime(preferences, ["updatedAt"])

            return preferences

        except Exception as e:
            logger.error(f"Error fetching user preferences: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="사용자 설정 조회 중 오류가 발생했습니다"
            )

    async def update_preferences(
        self,
        user_id: str,
        theme: Optional[str] = None,
        language: Optional[str] = None,
        notifications: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """
        Update user's preferences (creates if not exists)
        사용자의 설정 수정 (없으면 생성)

        Args:
            user_id: User ID (string)
            theme: UI theme (optional)
            language: Language preference (optional)
            notifications: Notification settings (optional)

        Returns:
            dict: Updated preferences data

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Build update document
            update_doc = {"userId": user_id, "updatedAt": datetime.utcnow()}

            if theme is not None:
                update_doc["theme"] = theme
            if language is not None:
                update_doc["language"] = language
            if notifications is not None:
                update_doc["notifications"] = notifications

            # Upsert (update if exists, create if not)
            await self.preferences_collection.update_one(
                {"userId": user_id},
                {"$set": update_doc},
                upsert=True
            )

            # Fetch updated preferences
            updated_preferences = await self.preferences_collection.find_one({"userId": user_id})
            updated_preferences = serialize_object_id(updated_preferences)
            updated_preferences = serialize_datetime(updated_preferences, ["updatedAt"])

            logger.info(f"User preferences updated for user: {user_id}")
            return updated_preferences

        except Exception as e:
            logger.error(f"Error updating user preferences: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="사용자 설정 수정 중 오류가 발생했습니다"
            )
