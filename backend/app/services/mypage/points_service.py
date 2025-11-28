"""
Points Service
Business logic for user points and level management
사용자 포인트 및 레벨 관리를 위한 비즈니스 로직
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import HTTPException, status
import logging

from app.db.connection import db

logger = logging.getLogger(__name__)


# Level system configuration (레벨 시스템 설정)
LEVEL_CONFIG = [
    {"level": 1, "name": "새싹", "min_xp": 0, "max_xp": 100},
    {"level": 2, "name": "초보", "min_xp": 100, "max_xp": 300},
    {"level": 3, "name": "중급", "min_xp": 300, "max_xp": 600},
    {"level": 4, "name": "고수", "min_xp": 600, "max_xp": 1000},
    {"level": 5, "name": "전문가", "min_xp": 1000, "max_xp": None},  # Max level
]


# Points earned by action type (행동별 포인트 획득량)
POINTS_BY_ACTION = {
    "quiz_completion": 10,
    "daily_login": 5,
    "community_post": 15,
    "community_comment": 5,
    "community_like_received": 2,
    "bookmark_paper": 3,
    "diet_log": 10,
    "health_check": 5,
}


def calculate_level_from_xp(xp: int) -> dict:
    """
    Calculate user level from XP points
    XP 포인트로부터 사용자 레벨 계산

    Args:
        xp: Current XP points

    Returns:
        dict: Level information including level, title, min/max XP, next level
    """
    for i, config in enumerate(LEVEL_CONFIG):
        if config["max_xp"] is None or xp < config["max_xp"]:
            next_level = LEVEL_CONFIG[i + 1] if i + 1 < len(LEVEL_CONFIG) else None
            return {
                "level": config["level"],
                "title": config["name"],
                "min_xp": config["min_xp"],
                "max_xp": config["max_xp"],
                "next_level_title": next_level["name"] if next_level else None,
                "required_xp": config["max_xp"] if config["max_xp"] else config["min_xp"]
            }
    # Default to max level
    return {
        "level": 5,
        "title": "전문가",
        "min_xp": 1000,
        "max_xp": None,
        "next_level_title": None,
        "required_xp": 1000
    }


class PointsService:
    """Points and level management service (포인트 및 레벨 관리 서비스)"""

    def __init__(self):
        # Lazy initialization - collections accessed when needed, not at import time
        self._user_levels_collection = None
        self._badges_collection = None
        self._user_points_collection = None
        self._points_history_collection = None

    @property
    def user_levels_collection(self):
        """Lazy property to access user_levels collection after database is initialized"""
        if self._user_levels_collection is None:
            self._user_levels_collection = db["user_levels"]
        return self._user_levels_collection

    @property
    def badges_collection(self):
        """Lazy property to access user_badges collection after database is initialized"""
        if self._badges_collection is None:
            self._badges_collection = db["user_badges"]
        return self._badges_collection

    @property
    def user_points_collection(self):
        """Lazy property to access user_points collection after database is initialized"""
        if self._user_points_collection is None:
            self._user_points_collection = db["user_points"]
        return self._user_points_collection

    @property
    def points_history_collection(self):
        """Lazy property to access points_history collection after database is initialized"""
        if self._points_history_collection is None:
            self._points_history_collection = db["points_history"]
        return self._points_history_collection

    async def get_level(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's level and XP information
        사용자의 레벨 및 경험치 정보 조회

        Args:
            user_id: User ID (string)

        Returns:
            dict: Level data including XP, title, badges

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Find or create user level data
            user_level = await self.user_levels_collection.find_one({"userId": user_id})

            if not user_level:
                # Create default level data for new users
                default_level = {
                    "userId": user_id,
                    "currentXp": 0,
                    "totalXp": 0,
                    "level": 1,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                await self.user_levels_collection.insert_one(default_level)
                user_level = default_level

            # Calculate level info from XP
            current_xp = user_level.get("currentXp", 0)
            level_info = calculate_level_from_xp(current_xp)

            # Fetch user badges
            badges_cursor = self.badges_collection.find({"userId": user_id}).sort("earnedAt", -1)
            badges = await badges_cursor.to_list(length=50)

            serialized_badges = []
            for badge in badges:
                serialized_badges.append({
                    "id": badge.get("badgeId", str(badge.get("_id", ""))),
                    "name": badge.get("name", ""),
                    "description": badge.get("description", ""),
                    "icon": badge.get("icon", "award"),
                    "earnedAt": badge.get("earnedAt", datetime.utcnow()).isoformat() if isinstance(badge.get("earnedAt"), datetime) else badge.get("earnedAt", "")
                })

            return {
                "userId": user_id,
                "level": level_info["level"],
                "currentXp": current_xp,
                "requiredXp": level_info["required_xp"],
                "title": level_info["title"],
                "nextLevelTitle": level_info["next_level_title"],
                "badges": serialized_badges,
                "updatedAt": user_level.get("updatedAt")
            }

        except Exception as e:
            logger.error(f"Error fetching user level: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="레벨 정보 조회 중 오류가 발생했습니다"
            )

    async def get_points(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's points summary
        사용자의 포인트 요약 조회

        Args:
            user_id: User ID (string)

        Returns:
            dict: Points summary including total, available, used

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Find or create user points data
            user_points = await self.user_points_collection.find_one({"userId": user_id})

            if not user_points:
                # Create default points data for new users
                default_points = {
                    "userId": user_id,
                    "totalPoints": 0,
                    "availablePoints": 0,
                    "usedPoints": 0,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                await self.user_points_collection.insert_one(default_points)
                user_points = default_points

            return {
                "userId": user_id,
                "totalPoints": user_points.get("totalPoints", 0),
                "availablePoints": user_points.get("availablePoints", 0),
                "usedPoints": user_points.get("usedPoints", 0),
                "updatedAt": user_points.get("updatedAt")
            }

        except Exception as e:
            logger.error(f"Error fetching user points: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="포인트 정보 조회 중 오류가 발생했습니다"
            )

    async def get_history(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        type_filter: Optional[str] = None,
        source_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get user's points transaction history
        사용자의 포인트 거래 내역 조회

        Args:
            user_id: User ID (string)
            limit: Number of items to return (1-50)
            offset: Number of items to skip
            type_filter: Filter by type (earn/spend/expire)
            source_filter: Filter by source

        Returns:
            dict: History items with pagination

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Validate pagination parameters
            limit = min(max(1, limit), 50)
            offset = max(0, offset)

            # Build query
            query = {"userId": user_id}
            if type_filter and type_filter in ["earn", "spend", "expire"]:
                query["type"] = type_filter
            if source_filter:
                query["source"] = source_filter

            # Get total count
            total_count = await self.points_history_collection.count_documents(query)

            # Fetch history with pagination
            cursor = self.points_history_collection.find(query).sort("createdAt", -1).skip(offset).limit(limit)
            history_items = await cursor.to_list(length=limit)

            # Serialize history items
            serialized_history = []
            for item in history_items:
                serialized_history.append({
                    "id": str(item.get("_id", "")),
                    "userId": item.get("userId", user_id),
                    "amount": item.get("amount", 0),
                    "type": item.get("type", "earn"),
                    "source": item.get("source", "unknown"),
                    "description": item.get("description", ""),
                    "createdAt": item.get("createdAt", datetime.utcnow())
                })

            return {
                "history": serialized_history,
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "hasMore": (offset + limit) < total_count
            }

        except Exception as e:
            logger.error(f"Error fetching points history: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="포인트 내역 조회 중 오류가 발생했습니다"
            )

    async def add_points(
        self,
        user_id: str,
        amount: int,
        source: str,
        description: str
    ) -> Dict[str, Any]:
        """
        Add points to a user and record the transaction
        사용자에게 포인트 추가 및 거래 기록

        This is an internal function for use by other modules.

        Args:
            user_id: User ID (string)
            amount: Points to add (positive) or deduct (negative)
            source: Source of points (e.g., 'quiz_completion')
            description: Human-readable description

        Returns:
            dict: Updated points data

        Raises:
            Exception: For any errors during processing
        """
        # Determine transaction type
        tx_type = "earn" if amount > 0 else "spend" if amount < 0 else "expire"

        # Update user points
        user_points = await self.user_points_collection.find_one({"userId": user_id})
        if not user_points:
            user_points = {
                "userId": user_id,
                "totalPoints": 0,
                "availablePoints": 0,
                "usedPoints": 0,
                "createdAt": datetime.utcnow()
            }

        if amount > 0:
            user_points["totalPoints"] = user_points.get("totalPoints", 0) + amount
            user_points["availablePoints"] = user_points.get("availablePoints", 0) + amount
        else:
            user_points["availablePoints"] = max(0, user_points.get("availablePoints", 0) + amount)
            user_points["usedPoints"] = user_points.get("usedPoints", 0) + abs(amount)

        user_points["updatedAt"] = datetime.utcnow()

        await self.user_points_collection.update_one(
            {"userId": user_id},
            {"$set": user_points},
            upsert=True
        )

        # Record transaction history
        history_item = {
            "userId": user_id,
            "amount": amount,
            "type": tx_type,
            "source": source,
            "description": description,
            "createdAt": datetime.utcnow()
        }
        await self.points_history_collection.insert_one(history_item)

        # Update XP for leveling (1 point = 1 XP for earn transactions)
        if amount > 0:
            user_level = await self.user_levels_collection.find_one({"userId": user_id})
            if not user_level:
                user_level = {
                    "userId": user_id,
                    "currentXp": 0,
                    "level": 1,
                    "createdAt": datetime.utcnow()
                }

            user_level["currentXp"] = user_level.get("currentXp", 0) + amount
            level_info = calculate_level_from_xp(user_level["currentXp"])
            user_level["level"] = level_info["level"]
            user_level["updatedAt"] = datetime.utcnow()

            await self.user_levels_collection.update_one(
                {"userId": user_id},
                {"$set": user_level},
                upsert=True
            )

        logger.info(f"Points updated for user {user_id}: {amount} ({source})")
        return user_points
