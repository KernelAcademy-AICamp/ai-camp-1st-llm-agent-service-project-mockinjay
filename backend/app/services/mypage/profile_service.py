"""
Profile Service
Business logic for user profile management
사용자 프로필 관리를 위한 비즈니스 로직
"""
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException, status
import logging

from app.db.connection import db

logger = logging.getLogger(__name__)


class ProfileService:
    """User profile management service (사용자 프로필 관리 서비스)"""

    def __init__(self):
        # Lazy initialization - collection accessed when needed, not at import time
        self._users_collection = None

    @property
    def users_collection(self):
        """Lazy property to access users collection after database is initialized"""
        if self._users_collection is None:
            self._users_collection = db["users"]
        return self._users_collection

    async def get_profile(self, user_id: str, current_user: dict) -> Dict[str, Any]:
        """
        Get user profile information
        사용자 프로필 정보 조회

        Args:
            user_id: User ID (from current_user)
            current_user: Current user document from database

        Returns:
            dict: Profile data with all fields

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            profile_image = current_user.get("profileImage")
            profile_data = {
                "id": user_id,
                "username": current_user.get("username", ""),
                "email": current_user.get("email", ""),
                "fullName": current_user.get("fullName"),
                "bio": current_user.get("bio"),
                "profileImage": profile_image,
                "profileImageUrl": profile_image,  # Alias for Frontend
                "profile": current_user.get("profile", "general"),
                "role": current_user.get("role", "user"),
                "createdAt": current_user.get("created_at", datetime.utcnow())
            }

            return profile_data

        except Exception as e:
            logger.error(f"Error fetching user profile: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="프로필 조회 중 오류가 발생했습니다"
            )

    async def update_profile(
        self,
        user_id: str,
        full_name: Optional[str] = None,
        bio: Optional[str] = None,
        profile_image: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update user profile information
        사용자 프로필 정보 수정

        Args:
            user_id: User ID (ObjectId)
            full_name: Updated full name (optional)
            bio: Updated bio (optional)
            profile_image: Updated profile image URL (optional)

        Returns:
            dict: Updated profile data

        Raises:
            HTTPException: 400 for no fields, 404 if user not found, 500 for errors
        """
        try:
            # Build update document (only include fields that are provided)
            update_doc = {}
            if full_name is not None:
                update_doc["fullName"] = full_name
            if bio is not None:
                update_doc["bio"] = bio
            if profile_image is not None:
                update_doc["profileImage"] = profile_image

            if not update_doc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="수정할 필드가 없습니다"
                )

            # Add updated timestamp
            update_doc["updated_at"] = datetime.utcnow()

            # Update user document
            from bson import ObjectId
            object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id

            result = await self.users_collection.update_one(
                {"_id": object_id},
                {"$set": update_doc}
            )

            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="사용자를 찾을 수 없습니다"
                )

            # Fetch updated user
            updated_user = await self.users_collection.find_one({"_id": object_id})
            profile_image_url = updated_user.get("profileImage")

            profile_data = {
                "id": str(updated_user["_id"]),
                "username": updated_user.get("username", ""),
                "email": updated_user.get("email", ""),
                "fullName": updated_user.get("fullName"),
                "bio": updated_user.get("bio"),
                "profileImage": profile_image_url,
                "profileImageUrl": profile_image_url,  # Alias for Frontend
                "profile": updated_user.get("profile", "general"),
                "role": updated_user.get("role", "user"),
                "createdAt": updated_user.get("created_at", datetime.utcnow())
            }

            logger.info(f"User profile updated: {user_id}")
            return profile_data

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating user profile: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="프로필 수정 중 오류가 발생했습니다"
            )
