"""
Streak Repository

Manages user logging streaks.
"""
from typing import Optional, Dict, Any
from pymongo.collection import Collection
from datetime import datetime
from bson import ObjectId

from app.db.base_repository import BaseRepository
from app.models.diet import UserStreak
from app.db.connection import db


class StreakRepository(BaseRepository[UserStreak]):
    """Repository for managing user streaks"""

    @property
    def collection(self) -> Collection:
        """Get user streaks collection"""
        return db["user_streaks"]

    def _to_entity(self, document: Dict[str, Any]) -> UserStreak:
        """Convert MongoDB document to UserStreak entity"""
        return UserStreak(
            id=str(document["_id"]),
            user_id=str(document["user_id"]),
            current_streak=document.get("current_streak", 0),
            longest_streak=document.get("longest_streak", 0),
            last_logged_date=document.get("last_logged_date"),
            total_days_logged=document.get("total_days_logged", 0)
        )

    def _to_document(self, entity: UserStreak) -> Dict[str, Any]:
        """Convert UserStreak entity to MongoDB document"""
        doc = {
            "user_id": ObjectId(entity.user_id),
            "current_streak": entity.current_streak,
            "longest_streak": entity.longest_streak,
            "last_logged_date": entity.last_logged_date,
            "total_days_logged": entity.total_days_logged
        }
        if entity.id:
            doc["_id"] = ObjectId(entity.id)
        return doc

    def get_by_user_id(self, user_id: str) -> Optional[UserStreak]:
        """
        Get streak data for user

        Args:
            user_id: User ID

        Returns:
            User streak if exists, None otherwise
        """
        return self.find_one({"user_id": ObjectId(user_id)})

    def get_or_create(self, user_id: str) -> UserStreak:
        """
        Get existing streak or create new one

        Args:
            user_id: User ID

        Returns:
            User streak
        """
        streak = self.get_by_user_id(user_id)
        if not streak:
            streak = UserStreak(
                user_id=user_id,
                current_streak=0,
                longest_streak=0,
                last_logged_date=None,
                total_days_logged=0
            )
            streak_id = self.create(streak)
            streak.id = streak_id
        return streak

    def update_streak(self, user_id: str, logged_date: str) -> UserStreak:
        """
        Update streak when meal is logged

        Args:
            user_id: User ID
            logged_date: Date of meal log (YYYY-MM-DD)

        Returns:
            Updated streak
        """
        streak = self.get_or_create(user_id)

        # Parse logged date
        log_date = datetime.strptime(logged_date, "%Y-%m-%d").date()

        # If no previous log, start streak at 1
        if not streak.last_logged_date:
            streak.current_streak = 1
            streak.longest_streak = 1
            streak.total_days_logged = 1
            streak.last_logged_date = logged_date
        else:
            # Parse last logged date
            last_date = datetime.strptime(streak.last_logged_date, "%Y-%m-%d").date()

            # If same day, don't update streak
            if log_date == last_date:
                return streak

            # Calculate day difference
            day_diff = (log_date - last_date).days

            if day_diff == 1:
                # Consecutive day - increment streak
                streak.current_streak += 1
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
                streak.total_days_logged += 1
                streak.last_logged_date = logged_date
            elif day_diff > 1:
                # Streak broken - reset to 1
                streak.current_streak = 1
                streak.total_days_logged += 1
                streak.last_logged_date = logged_date
            # If day_diff < 0, it's a backdated entry - don't update streak

        # Update in database
        if streak.id:
            self.collection.update_one(
                {"_id": ObjectId(streak.id)},
                {"$set": self._to_document(streak)}
            )

        return streak


# Singleton instance
streak_repository = StreakRepository()
