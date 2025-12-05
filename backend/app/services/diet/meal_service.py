"""
Meal Service

Business logic for meal logging and retrieval.
"""
import logging
from typing import Optional, List, Tuple
from datetime import datetime

from app.models.diet import CreateMealRequest, MealLog, MealType
from app.repositories.meal_repository import meal_repository
from app.repositories.streak_repository import streak_repository
from app.core.exceptions import InvalidMealDataError, MealNotFoundError

logger = logging.getLogger(__name__)


class MealService:
    """Service for managing meal logs"""

    def __init__(self):
        self.meal_repo = meal_repository
        self.streak_repo = streak_repository

    def create_meal_log(self, request: CreateMealRequest) -> Tuple[MealLog, dict]:
        """
        Create a new meal log

        Args:
            request: CreateMealRequest with meal data

        Returns:
            Tuple of (MealLog, streak_dict)

        Raises:
            InvalidMealDataError: If meal data is invalid
        """
        # Validate foods list
        if not request.foods:
            raise InvalidMealDataError("foods", "At least one food item is required")

        # Create meal log entity
        meal = MealLog(
            id=None,  # Will be set after creation
            user_id=request.user_id,
            meal_type=request.meal_type,
            foods=request.foods,
            total_nutrients=request.total_nutrients,
            logged_at=request.logged_at,
            created_at=datetime.utcnow()
        )

        # Save to database
        meal_id = self.meal_repo.create(meal)
        meal.id = meal_id

        logger.info(f"Created meal log {meal_id} for user {request.user_id}")

        # Update streak
        logged_date = request.logged_at.strftime("%Y-%m-%d")
        streak = self.streak_repo.update_streak(request.user_id, logged_date)

        streak_dict = {
            "current": streak.current_streak,
            "longest": streak.longest_streak
        }

        return meal, streak_dict

    def get_meals(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        meal_type: Optional[MealType] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[MealLog], dict]:
        """
        Get meal logs with pagination

        Args:
            user_id: User ID
            start_date: Start date filter
            end_date: End date filter
            meal_type: Meal type filter
            page: Page number (1-indexed)
            page_size: Items per page

        Returns:
            Tuple of (meals_list, pagination_dict)
        """
        # Validate page parameters
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        # Calculate skip
        skip = (page - 1) * page_size

        # Get meals
        meals = self.meal_repo.get_meals_by_user(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            meal_type=meal_type,
            skip=skip,
            limit=page_size
        )

        # Get total count
        total = self.meal_repo.get_meals_count(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            meal_type=meal_type
        )

        # Calculate total pages
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0

        pagination = {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages
        }

        return meals, pagination

    def get_meal_by_id(self, meal_id: str) -> MealLog:
        """
        Get meal by ID

        Args:
            meal_id: Meal ID

        Returns:
            MealLog

        Raises:
            MealNotFoundError: If meal not found
        """
        meal = self.meal_repo.find_by_id(meal_id)
        if not meal:
            raise MealNotFoundError(meal_id)
        return meal

    def delete_meal(self, meal_id: str, user_id: str) -> bool:
        """
        Delete meal log

        Args:
            meal_id: Meal ID
            user_id: User ID (for authorization check)

        Returns:
            True if deleted

        Raises:
            MealNotFoundError: If meal not found
        """
        # Get meal to verify ownership
        meal = self.get_meal_by_id(meal_id)

        # Check ownership
        if meal.user_id != user_id:
            raise MealNotFoundError(meal_id)  # Don't reveal existence to unauthorized user

        # Delete
        deleted = self.meal_repo.delete(meal_id)

        if deleted:
            logger.info(f"Deleted meal log {meal_id}")
            # Note: We don't recalculate streak on deletion to avoid complexity
            # User's streak will be recalculated on next meal log

        return deleted

    def get_daily_summary(self, user_id: str, date: datetime) -> dict:
        """
        Get summary of meals for a specific day

        Args:
            user_id: User ID
            date: Date to summarize

        Returns:
            Dictionary with daily summary
        """
        # Get daily totals from repository
        totals = self.meal_repo.get_daily_totals(user_id, date)

        # Get meal count for the day
        date_str = date.strftime("%Y-%m-%d")
        meal_count = self.meal_repo.get_meals_on_date(user_id, date_str)

        return {
            "date": date_str,
            "meal_count": meal_count,
            "total_nutrients": totals
        }


# Singleton instance
meal_service = MealService()
