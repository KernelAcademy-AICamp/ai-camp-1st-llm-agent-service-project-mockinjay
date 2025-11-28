"""
Meal Repository

Manages meal logs.
"""
from typing import Optional, Dict, Any, List
from pymongo.collection import Collection
from datetime import datetime
from bson import ObjectId

from app.db.base_repository import BaseRepository
from app.models.diet import MealLog, MealType, FoodItem, Nutrients
from app.db.connection import db


class MealRepository(BaseRepository[MealLog]):
    """Repository for managing meal logs"""

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

    def get_meals_by_user(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        meal_type: Optional[MealType] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[MealLog]:
        """
        Get meals for user with filters

        Args:
            user_id: User ID
            start_date: Start date filter (inclusive)
            end_date: End date filter (inclusive)
            meal_type: Meal type filter
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of meal logs
        """
        # Build filter
        filter_dict: Dict[str, Any] = {"user_id": ObjectId(user_id)}

        # Date range filter
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_dict["logged_at"] = date_filter

        # Meal type filter
        if meal_type:
            filter_dict["meal_type"] = meal_type.value

        # Query with sorting by logged_at descending
        return self.find_many(
            filter=filter_dict,
            skip=skip,
            limit=limit,
            sort=[("logged_at", -1)]
        )

    def get_meals_count(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        meal_type: Optional[MealType] = None
    ) -> int:
        """
        Count meals for user with filters

        Args:
            user_id: User ID
            start_date: Start date filter
            end_date: End date filter
            meal_type: Meal type filter

        Returns:
            Count of matching meals
        """
        filter_dict: Dict[str, Any] = {"user_id": ObjectId(user_id)}

        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_dict["logged_at"] = date_filter

        if meal_type:
            filter_dict["meal_type"] = meal_type.value

        return self.count(filter_dict)

    def get_daily_totals(self, user_id: str, date: datetime) -> Dict[str, float]:
        """
        Calculate total nutrients consumed on a specific day

        Args:
            user_id: User ID
            date: Date to calculate totals for

        Returns:
            Dictionary with total nutrients
        """
        # Start and end of day
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Aggregation pipeline
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId(user_id),
                    "logged_at": {
                        "$gte": start_of_day,
                        "$lte": end_of_day
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "sodium_mg": {"$sum": "$total_nutrients.sodium_mg"},
                    "protein_g": {"$sum": "$total_nutrients.protein_g"},
                    "potassium_mg": {"$sum": "$total_nutrients.potassium_mg"},
                    "phosphorus_mg": {"$sum": "$total_nutrients.phosphorus_mg"}
                }
            }
        ]

        results = self.aggregate(pipeline)

        if results:
            return {
                "sodium_mg": results[0].get("sodium_mg", 0),
                "protein_g": results[0].get("protein_g", 0),
                "potassium_mg": results[0].get("potassium_mg", 0),
                "phosphorus_mg": results[0].get("phosphorus_mg", 0)
            }

        return {
            "sodium_mg": 0,
            "protein_g": 0,
            "potassium_mg": 0,
            "phosphorus_mg": 0
        }

    def get_weekly_totals(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, float]:
        """
        Calculate total nutrients consumed in a date range

        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date

        Returns:
            Dictionary with total nutrients
        """
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId(user_id),
                    "logged_at": {
                        "$gte": start_date,
                        "$lte": end_date
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "sodium_mg": {"$sum": "$total_nutrients.sodium_mg"},
                    "protein_g": {"$sum": "$total_nutrients.protein_g"},
                    "potassium_mg": {"$sum": "$total_nutrients.potassium_mg"},
                    "phosphorus_mg": {"$sum": "$total_nutrients.phosphorus_mg"}
                }
            }
        ]

        results = self.aggregate(pipeline)

        if results:
            return {
                "sodium_mg": results[0].get("sodium_mg", 0),
                "protein_g": results[0].get("protein_g", 0),
                "potassium_mg": results[0].get("potassium_mg", 0),
                "phosphorus_mg": results[0].get("phosphorus_mg", 0)
            }

        return {
            "sodium_mg": 0,
            "protein_g": 0,
            "potassium_mg": 0,
            "phosphorus_mg": 0
        }

    def get_meals_on_date(self, user_id: str, date: str) -> int:
        """
        Count meals logged on a specific date

        Args:
            user_id: User ID
            date: Date string (YYYY-MM-DD)

        Returns:
            Number of meals logged
        """
        # Parse date string
        target_date = datetime.strptime(date, "%Y-%m-%d")
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        return self.count({
            "user_id": ObjectId(user_id),
            "logged_at": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        })


# Singleton instance
meal_repository = MealRepository()
