"""
Diet Care Repository Module

This module consolidates all repositories for the Diet Care feature,
providing unified access to goals, meals, sessions, and streaks.

Collections:
- diet_goals: User dietary goals based on CKD stage
- meal_logs: Individual meal entries with nutrition data
- diet_sessions: Analysis sessions for rate limiting
- user_streaks: Logging streak tracking
- nutrition_analyses: AI analysis results (cached)

Index Strategy:
- Compound indexes for common query patterns
- Single field indexes for lookups
- TTL indexes for session expiration
"""
from typing import Optional, Dict, Any, List
from pymongo.collection import Collection
from pymongo import ASCENDING, DESCENDING, IndexModel
from datetime import datetime, timedelta, date
from bson import ObjectId
import logging

from app.db.base_repository import BaseRepository
from app.models.diet import (
    DietGoal, MealLog, DietSession, UserStreak,
    MealType, CKDStage, Nutrients, FoodItem
)
from app.models.diet_care import NutritionAnalysisResult
from app.db.connection import db
from app.core.exceptions import DatabaseQueryError

logger = logging.getLogger(__name__)


# ============================================
# Goals Repository
# ============================================

class DietGoalsRepository(BaseRepository[DietGoal]):
    """
    Repository for managing user dietary goals

    Key Features:
    - CKD stage-based default goals
    - Upsert pattern for goal management
    - Validation of goal ranges
    """

    @property
    def collection(self) -> Collection:
        """Get diet goals collection"""
        return db["diet_goals"]

    def _to_entity(self, document: Dict[str, Any]) -> DietGoal:
        """Convert MongoDB document to DietGoal entity"""
        return DietGoal(
            id=str(document["_id"]),
            user_id=str(document["user_id"]),
            sodium_mg=document["sodium_mg"],
            protein_g=document["protein_g"],
            potassium_mg=document["potassium_mg"],
            phosphorus_mg=document["phosphorus_mg"],
            ckd_stage=CKDStage(document["ckd_stage"]),
            updated_at=document["updated_at"]
        )

    def _to_document(self, entity: DietGoal) -> Dict[str, Any]:
        """Convert DietGoal entity to MongoDB document"""
        doc = {
            "user_id": ObjectId(entity.user_id),
            "sodium_mg": entity.sodium_mg,
            "protein_g": entity.protein_g,
            "potassium_mg": entity.potassium_mg,
            "phosphorus_mg": entity.phosphorus_mg,
            "ckd_stage": entity.ckd_stage.value,
            "updated_at": entity.updated_at
        }
        if entity.id:
            doc["_id"] = ObjectId(entity.id)
        return doc

    def get_user_goals(self, user_id: str) -> Optional[DietGoal]:
        """
        Get goals for specific user

        Args:
            user_id: User ID

        Returns:
            User's goals if exists, None otherwise
        """
        return self.find_one({"user_id": ObjectId(user_id)})

    def upsert_goals(self, user_id: str, goals: DietGoal) -> DietGoal:
        """
        Create or update goals for user

        Args:
            user_id: User ID
            goals: Goal entity

        Returns:
            Updated/created goal
        """
        # Set timestamps
        now = datetime.utcnow()
        goals.updated_at = now
        goals.user_id = user_id

        # Try to update existing goal
        existing = self.get_user_goals(user_id)

        if existing:
            # Update existing goal
            doc = self._to_document(goals)
            doc.pop("created_at", None)  # Don't update created_at

            self.collection.update_one(
                {"user_id": ObjectId(user_id)},
                {"$set": doc}
            )
            goals.id = existing.id
            logger.info(f"Updated goals for user {user_id}")
        else:
            # Create new goal
            doc = self._to_document(goals)
            doc["created_at"] = now
            result = self.collection.insert_one(doc)
            goals.id = str(result.inserted_id)
            logger.info(f"Created goals for user {user_id}")

        return goals

    def get_default_goals_by_stage(self, ckd_stage: CKDStage) -> Dict[str, float]:
        """
        Get default goal values based on CKD stage

        These are based on National Kidney Foundation guidelines
        and should be customized by healthcare providers.

        Args:
            ckd_stage: CKD stage (1-5)

        Returns:
            Dictionary with default nutrient goals
        """
        # Default recommendations by CKD stage
        # Reference: NKF KDOQI Clinical Practice Guidelines
        defaults = {
            CKDStage.STAGE_1: {
                "sodium_mg": 2300,
                "protein_g": 60,
                "potassium_mg": 3500,
                "phosphorus_mg": 1000
            },
            CKDStage.STAGE_2: {
                "sodium_mg": 2000,
                "protein_g": 55,
                "potassium_mg": 3000,
                "phosphorus_mg": 900
            },
            CKDStage.STAGE_3: {
                "sodium_mg": 2000,
                "protein_g": 50,
                "potassium_mg": 2000,
                "phosphorus_mg": 800
            },
            CKDStage.STAGE_4: {
                "sodium_mg": 1500,
                "protein_g": 40,
                "potassium_mg": 2000,
                "phosphorus_mg": 800
            },
            CKDStage.STAGE_5: {
                "sodium_mg": 1500,
                "protein_g": 40,
                "potassium_mg": 2000,
                "phosphorus_mg": 800
            }
        }
        return defaults.get(ckd_stage, defaults[CKDStage.STAGE_3])

    def get_users_by_stage(self, ckd_stage: CKDStage, limit: int = 100) -> List[DietGoal]:
        """
        Get users by CKD stage (for analytics/research)

        Args:
            ckd_stage: CKD stage
            limit: Maximum number of results

        Returns:
            List of goals
        """
        return self.find_many(
            filter={"ckd_stage": ckd_stage.value},
            limit=limit,
            sort=[("updated_at", DESCENDING)]
        )


# ============================================
# Meal Log Repository
# ============================================

class MealLogRepository(BaseRepository[MealLog]):
    """
    Repository for managing meal logs

    Key Features:
    - Date range queries with efficient indexing
    - Aggregation for daily/weekly summaries
    - Nutrition calculations
    """

    @property
    def collection(self) -> Collection:
        """Get meal logs collection"""
        return db["meal_logs"]

    def _to_entity(self, document: Dict[str, Any]) -> MealLog:
        """Convert MongoDB document to MealLog entity"""
        return MealLog(
            id=str(document["_id"]),
            user_id=str(document["user_id"]),
            meal_type=MealType(document["meal_type"]),
            foods=[FoodItem(**food) for food in document["foods"]],
            total_nutrients=Nutrients(**document["total_nutrients"]),
            logged_at=document["logged_at"],
            created_at=document["created_at"]
        )

    def _to_document(self, entity: MealLog) -> Dict[str, Any]:
        """Convert MealLog entity to MongoDB document"""
        doc = {
            "user_id": ObjectId(entity.user_id),
            "meal_type": entity.meal_type.value,
            "foods": [food.model_dump() for food in entity.foods],
            "total_nutrients": entity.total_nutrients.model_dump(),
            "logged_at": entity.logged_at,
            "created_at": entity.created_at
        }
        if entity.id:
            doc["_id"] = ObjectId(entity.id)
        return doc

    def log_meal(self, user_id: str, meal: MealLog) -> MealLog:
        """
        Create a new meal log

        Args:
            user_id: User ID
            meal: Meal entity

        Returns:
            Created meal with ID
        """
        meal.user_id = user_id
        meal.created_at = datetime.utcnow()

        meal_id = self.create(meal)
        meal.id = meal_id

        logger.info(f"Logged meal {meal_id} for user {user_id}, type: {meal.meal_type}")
        return meal

    def get_meals_by_date(self, user_id: str, target_date: date) -> List[MealLog]:
        """
        Get all meals logged on a specific date

        Args:
            user_id: User ID
            target_date: Target date

        Returns:
            List of meals
        """
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())

        return self.find_many(
            filter={
                "user_id": ObjectId(user_id),
                "logged_at": {
                    "$gte": start_of_day,
                    "$lte": end_of_day
                }
            },
            sort=[("logged_at", ASCENDING)]
        )

    def get_meals_by_date_range(
        self,
        user_id: str,
        start_date: date,
        end_date: date,
        meal_type: Optional[MealType] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[MealLog]:
        """
        Get meals within a date range

        Args:
            user_id: User ID
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            meal_type: Optional meal type filter
            skip: Number of records to skip
            limit: Maximum number of records

        Returns:
            List of meals
        """
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        filter_dict: Dict[str, Any] = {
            "user_id": ObjectId(user_id),
            "logged_at": {
                "$gte": start_dt,
                "$lte": end_dt
            }
        }

        if meal_type:
            filter_dict["meal_type"] = meal_type.value

        return self.find_many(
            filter=filter_dict,
            skip=skip,
            limit=limit,
            sort=[("logged_at", DESCENDING)]
        )

    def get_nutrition_summary(
        self,
        user_id: str,
        start: date,
        end: date
    ) -> Dict[str, float]:
        """
        Calculate nutrition summary for date range

        Args:
            user_id: User ID
            start: Start date
            end: End date

        Returns:
            Dictionary with total nutrients
        """
        start_dt = datetime.combine(start, datetime.min.time())
        end_dt = datetime.combine(end, datetime.max.time())

        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId(user_id),
                    "logged_at": {
                        "$gte": start_dt,
                        "$lte": end_dt
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_sodium_mg": {"$sum": "$total_nutrients.sodium_mg"},
                    "total_protein_g": {"$sum": "$total_nutrients.protein_g"},
                    "total_potassium_mg": {"$sum": "$total_nutrients.potassium_mg"},
                    "total_phosphorus_mg": {"$sum": "$total_nutrients.phosphorus_mg"},
                    "meal_count": {"$sum": 1}
                }
            }
        ]

        results = self.aggregate(pipeline)

        if results:
            return {
                "sodium_mg": results[0].get("total_sodium_mg", 0),
                "protein_g": results[0].get("total_protein_g", 0),
                "potassium_mg": results[0].get("total_potassium_mg", 0),
                "phosphorus_mg": results[0].get("total_phosphorus_mg", 0),
                "meal_count": results[0].get("meal_count", 0)
            }

        return {
            "sodium_mg": 0,
            "protein_g": 0,
            "potassium_mg": 0,
            "phosphorus_mg": 0,
            "meal_count": 0
        }

    def get_daily_totals(self, user_id: str, target_date: date) -> Dict[str, float]:
        """
        Calculate total nutrients consumed on a specific day

        Args:
            user_id: User ID
            target_date: Target date

        Returns:
            Dictionary with total nutrients
        """
        return self.get_nutrition_summary(user_id, target_date, target_date)

    def get_meal_count_by_date(self, user_id: str, target_date: date) -> int:
        """
        Count meals logged on a specific date

        Args:
            user_id: User ID
            target_date: Target date

        Returns:
            Number of meals logged
        """
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())

        return self.count({
            "user_id": ObjectId(user_id),
            "logged_at": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        })

    def get_adherence_days(
        self,
        user_id: str,
        start_date: date,
        end_date: date
    ) -> List[str]:
        """
        Get list of dates where user logged at least one meal

        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date

        Returns:
            List of date strings (YYYY-MM-DD)
        """
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId(user_id),
                    "logged_at": {
                        "$gte": start_dt,
                        "$lte": end_dt
                    }
                }
            },
            {
                "$project": {
                    "date": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$logged_at"
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": "$date"
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]

        results = self.aggregate(pipeline)
        return [r["_id"] for r in results]


# ============================================
# Session Repository
# ============================================

class DietSessionRepository(BaseRepository[DietSession]):
    """
    Repository for managing analysis sessions

    Key Features:
    - Rate limiting (10 analyses per hour)
    - Automatic expiration
    - Session lifecycle management
    """

    @property
    def collection(self) -> Collection:
        """Get diet sessions collection"""
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
            Active session if exists and not expired, None otherwise
        """
        session = self.find_one({
            "user_id": ObjectId(user_id),
            "expires_at": {"$gt": datetime.utcnow()}
        })
        return session

    def create_session(self, user_id: str, duration_hours: int = 1) -> DietSession:
        """
        Create a new analysis session

        Args:
            user_id: User ID
            duration_hours: Session duration in hours

        Returns:
            Newly created session
        """
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=duration_hours)

        session = DietSession(
            user_id=user_id,
            created_at=now,
            expires_at=expires_at,
            analysis_count=0
        )

        session_id = self.create(session)
        session.id = session_id

        logger.info(f"Created session {session_id} for user {user_id}")
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

        # Create new session (old one expired or doesn't exist)
        return self.create_session(user_id)

    def cleanup_expired_sessions(self, batch_size: int = 1000) -> int:
        """
        Delete expired sessions (maintenance operation)

        Args:
            batch_size: Maximum number of sessions to delete

        Returns:
            Number of deleted sessions
        """
        deleted = self.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })

        if deleted > 0:
            logger.info(f"Cleaned up {deleted} expired sessions")

        return deleted


# ============================================
# Streak Repository
# ============================================

class UserStreakRepository(BaseRepository[UserStreak]):
    """
    Repository for managing user logging streaks

    Key Features:
    - Consecutive day tracking
    - Automatic streak calculation
    - Longest streak tracking
    """

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

    def get_user_streak(self, user_id: str) -> Optional[UserStreak]:
        """
        Get streak data for user

        Args:
            user_id: User ID

        Returns:
            User streak if exists, None otherwise
        """
        return self.find_one({"user_id": ObjectId(user_id)})

    def get_or_create_streak(self, user_id: str) -> UserStreak:
        """
        Get existing streak or create new one

        Args:
            user_id: User ID

        Returns:
            User streak
        """
        streak = self.get_user_streak(user_id)

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
            logger.info(f"Created streak record for user {user_id}")

        return streak

    def update_streak(self, user_id: str, logged_date: str) -> UserStreak:
        """
        Update streak when meal is logged

        Business Logic:
        - Same day: No change
        - Consecutive day: Increment streak
        - Missed day(s): Reset streak to 1
        - Backdated entry: No change to streak

        Args:
            user_id: User ID
            logged_date: Date of meal log (YYYY-MM-DD format)

        Returns:
            Updated streak
        """
        streak = self.get_or_create_streak(user_id)

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
                logger.info(f"User {user_id} streak extended to {streak.current_streak} days")
            elif day_diff > 1:
                # Streak broken - reset to 1
                logger.info(f"User {user_id} streak broken after {streak.current_streak} days")
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


# ============================================
# Nutrition Analysis Cache Repository
# ============================================

class NutritionAnalysisRepository(BaseRepository):
    """
    Repository for caching AI nutrition analysis results

    This reduces OpenAI API costs by caching similar analyses.
    Uses image hash for deduplication.
    """

    @property
    def collection(self) -> Collection:
        """Get nutrition analyses collection"""
        return db["nutrition_analyses"]

    def _to_entity(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Convert document to dict (no specific entity)"""
        document["id"] = str(document.pop("_id"))
        document["user_id"] = str(document["user_id"])
        return document

    def _to_document(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Convert entity to document"""
        doc = entity.copy()
        if "id" in doc:
            doc["_id"] = ObjectId(doc.pop("id"))
        if "user_id" in doc:
            doc["user_id"] = ObjectId(doc["user_id"])
        return doc

    def cache_analysis(
        self,
        user_id: str,
        image_hash: str,
        analysis_result: NutritionAnalysisResult,
        ttl_days: int = 30
    ) -> str:
        """
        Cache an analysis result

        Args:
            user_id: User ID
            image_hash: Hash of the analyzed image
            analysis_result: Analysis result to cache
            ttl_days: Time to live in days

        Returns:
            Analysis cache ID
        """
        now = datetime.utcnow()
        expires_at = now + timedelta(days=ttl_days)

        doc = {
            "user_id": ObjectId(user_id),
            "image_hash": image_hash,
            "analysis": analysis_result.model_dump(),
            "created_at": now,
            "expires_at": expires_at,
            "hit_count": 0
        }

        result = self.collection.insert_one(doc)
        logger.info(f"Cached analysis {result.inserted_id} for user {user_id}")
        return str(result.inserted_id)

    def find_cached_analysis(
        self,
        user_id: str,
        image_hash: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find cached analysis by image hash

        Args:
            user_id: User ID
            image_hash: Hash of the image

        Returns:
            Cached analysis if found and not expired
        """
        analysis = self.collection.find_one({
            "user_id": ObjectId(user_id),
            "image_hash": image_hash,
            "expires_at": {"$gt": datetime.utcnow()}
        })

        if analysis:
            # Increment hit count
            self.collection.update_one(
                {"_id": analysis["_id"]},
                {"$inc": {"hit_count": 1}}
            )
            logger.info(f"Cache hit for analysis {analysis['_id']}")
            return self._to_entity(analysis)

        return None

    def cleanup_expired_analyses(self) -> int:
        """
        Delete expired analysis cache entries

        Returns:
            Number of deleted entries
        """
        deleted = self.collection.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        }).deleted_count

        if deleted > 0:
            logger.info(f"Cleaned up {deleted} expired analyses")

        return deleted


# ============================================
# Repository Singleton Instances
# ============================================

diet_goals_repository = DietGoalsRepository()
meal_log_repository = MealLogRepository()
diet_session_repository = DietSessionRepository()
user_streak_repository = UserStreakRepository()
nutrition_analysis_repository = NutritionAnalysisRepository()


# ============================================
# Index Creation
# ============================================

def create_diet_care_indexes():
    """
    Create all necessary indexes for Diet Care collections

    This should be called during application startup or via migration script.
    """
    try:
        # Goals indexes
        db["diet_goals"].create_index(
            [("user_id", ASCENDING)],
            unique=True,
            name="user_id_unique"
        )
        db["diet_goals"].create_index(
            [("ckd_stage", ASCENDING), ("updated_at", DESCENDING)],
            name="stage_updated_idx"
        )

        # Meal logs indexes
        db["meal_logs"].create_index(
            [("user_id", ASCENDING), ("logged_at", DESCENDING)],
            name="user_logged_idx"
        )
        db["meal_logs"].create_index(
            [("user_id", ASCENDING), ("meal_type", ASCENDING), ("logged_at", DESCENDING)],
            name="user_type_logged_idx"
        )

        # Sessions indexes
        db["diet_sessions"].create_index(
            [("user_id", ASCENDING), ("expires_at", DESCENDING)],
            name="user_expires_idx"
        )
        # TTL index for automatic cleanup
        db["diet_sessions"].create_index(
            [("expires_at", ASCENDING)],
            expireAfterSeconds=0,
            name="expires_ttl_idx"
        )

        # Streaks indexes
        db["user_streaks"].create_index(
            [("user_id", ASCENDING)],
            unique=True,
            name="user_id_unique"
        )
        db["user_streaks"].create_index(
            [("current_streak", DESCENDING)],
            name="current_streak_idx"
        )

        # Analysis cache indexes
        db["nutrition_analyses"].create_index(
            [("user_id", ASCENDING), ("image_hash", ASCENDING)],
            name="user_hash_idx"
        )
        # TTL index for automatic cleanup
        db["nutrition_analyses"].create_index(
            [("expires_at", ASCENDING)],
            expireAfterSeconds=0,
            name="expires_ttl_idx"
        )

        logger.info("Successfully created all Diet Care indexes")
        return True

    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")
        raise DatabaseQueryError(operation="create_indexes", reason=str(e))
