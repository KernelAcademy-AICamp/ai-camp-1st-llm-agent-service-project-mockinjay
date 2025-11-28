"""
Health Service
Business logic for user health profile management
사용자 건강 프로필 관리를 위한 비즈니스 로직
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import HTTPException, status
import logging

from app.db.connection import db
from app.services.mypage.utils import serialize_object_id, serialize_datetime

logger = logging.getLogger(__name__)


class HealthService:
    """Health profile management service (건강 프로필 관리 서비스)"""

    def __init__(self):
        # Lazy initialization - collection accessed when needed, not at import time
        self._health_profiles_collection = None

    @property
    def health_profiles_collection(self):
        """Lazy property to access health_profiles collection after database is initialized"""
        if self._health_profiles_collection is None:
            self._health_profiles_collection = db["health_profiles"]
        return self._health_profiles_collection

    async def get_health_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's health profile
        사용자의 건강 프로필 조회

        Args:
            user_id: User ID (string)

        Returns:
            dict: Health profile data (returns default if not found)

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Find health profile for this user
            health_profile = await self.health_profiles_collection.find_one({"userId": user_id})

            if not health_profile:
                # Return default empty health profile if not found
                return {
                    "userId": user_id,
                    "conditions": [],
                    "healthConditions": [],  # Alias for Frontend
                    "allergies": [],
                    "dietaryRestrictions": [],
                    "age": None,
                    "gender": None,
                    "updatedAt": None
                }

            # Serialize and return
            health_profile = serialize_object_id(health_profile)
            health_profile = serialize_datetime(health_profile, ["updatedAt"])

            # Add healthConditions alias for Frontend compatibility
            conditions = health_profile.get("conditions", [])
            health_profile["healthConditions"] = conditions

            return health_profile

        except Exception as e:
            logger.error(f"Error fetching health profile: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="건강 프로필 조회 중 오류가 발생했습니다"
            )

    async def update_health_profile(
        self,
        user_id: str,
        conditions: Optional[List[str]] = None,
        allergies: Optional[List[str]] = None,
        dietary_restrictions: Optional[List[str]] = None,
        age: Optional[int] = None,
        gender: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update user's health profile (creates if not exists)
        사용자의 건강 프로필 수정 (없으면 생성)

        Args:
            user_id: User ID (string)
            conditions: Health conditions (optional)
            allergies: Allergies (optional)
            dietary_restrictions: Dietary restrictions (optional)
            age: Age (optional)
            gender: Gender (optional)

        Returns:
            dict: Updated health profile data

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Build update document
            update_doc = {"userId": user_id, "updatedAt": datetime.utcnow()}

            if conditions is not None:
                update_doc["conditions"] = conditions
            if allergies is not None:
                update_doc["allergies"] = allergies
            if dietary_restrictions is not None:
                update_doc["dietaryRestrictions"] = dietary_restrictions
            if age is not None:
                update_doc["age"] = age
            if gender is not None:
                update_doc["gender"] = gender

            # Upsert (update if exists, create if not)
            await self.health_profiles_collection.update_one(
                {"userId": user_id},
                {"$set": update_doc},
                upsert=True
            )

            # Fetch updated profile
            updated_profile = await self.health_profiles_collection.find_one({"userId": user_id})
            updated_profile = serialize_object_id(updated_profile)
            updated_profile = serialize_datetime(updated_profile, ["updatedAt"])

            # Add healthConditions alias for Frontend compatibility
            conditions = updated_profile.get("conditions", [])
            updated_profile["healthConditions"] = conditions

            logger.info(f"Health profile updated for user: {user_id}")
            return updated_profile

        except Exception as e:
            logger.error(f"Error updating health profile: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="건강 프로필 수정 중 오류가 발생했습니다"
            )
