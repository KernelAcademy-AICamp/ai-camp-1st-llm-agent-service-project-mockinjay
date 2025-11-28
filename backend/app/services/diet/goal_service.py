"""
Goal Service

Business logic for managing dietary goals.
"""
import logging
from typing import Optional
from datetime import datetime

from app.models.diet import DietGoal, UpdateGoalRequest, CKDStage
from app.repositories.goal_repository import goal_repository
from app.core.exceptions import InvalidGoalRangeError, GoalNotFoundError

logger = logging.getLogger(__name__)


class GoalService:
    """Service for managing dietary goals"""

    def __init__(self):
        self.goal_repo = goal_repository

    def get_user_goals(self, user_id: str) -> Optional[DietGoal]:
        """
        Get user's dietary goals

        Args:
            user_id: User ID

        Returns:
            DietGoal if exists, None otherwise
        """
        return self.goal_repo.get_by_user_id(user_id)

    def get_or_create_default_goals(self, user_id: str, ckd_stage: CKDStage = CKDStage.STAGE_3) -> DietGoal:
        """
        Get existing goals or create default goals

        Args:
            user_id: User ID
            ckd_stage: CKD stage for default goals

        Returns:
            DietGoal
        """
        # Try to get existing goals
        goals = self.get_user_goals(user_id)

        if goals:
            return goals

        # Create default goals
        defaults = self.goal_repo.get_default_goals_by_stage(ckd_stage)

        goal = DietGoal(
            user_id=user_id,
            sodium_mg=defaults["sodium_mg"],
            protein_g=defaults["protein_g"],
            potassium_mg=defaults["potassium_mg"],
            phosphorus_mg=defaults["phosphorus_mg"],
            ckd_stage=ckd_stage,
            updated_at=datetime.utcnow()
        )

        created_goal = self.goal_repo.upsert_goals(goal)
        logger.info(f"Created default goals for user {user_id}, stage {ckd_stage}")

        return created_goal

    def update_goals(self, request: UpdateGoalRequest) -> DietGoal:
        """
        Update user's dietary goals

        Args:
            request: UpdateGoalRequest with new goals

        Returns:
            Updated DietGoal

        Raises:
            InvalidGoalRangeError: If goal values are out of range
        """
        # Validate goal ranges
        self._validate_goal_ranges(request)

        # Create goal entity
        goal = DietGoal(
            user_id=request.user_id,
            sodium_mg=request.sodium_mg,
            protein_g=request.protein_g,
            potassium_mg=request.potassium_mg,
            phosphorus_mg=request.phosphorus_mg,
            ckd_stage=request.ckd_stage,
            updated_at=datetime.utcnow()
        )

        # Upsert (create or update)
        updated_goal = self.goal_repo.upsert_goals(goal)

        logger.info(f"Updated goals for user {request.user_id}")

        return updated_goal

    def _validate_goal_ranges(self, request: UpdateGoalRequest):
        """
        Validate that goal values are within acceptable ranges

        Args:
            request: UpdateGoalRequest to validate

        Raises:
            InvalidGoalRangeError: If any goal is out of range
        """
        # Define acceptable ranges (based on medical guidelines)
        ranges = {
            "sodium_mg": (500, 5000),      # 0.5-5g per day
            "protein_g": (20, 200),         # 20-200g per day
            "potassium_mg": (500, 5000),   # 0.5-5g per day
            "phosphorus_mg": (400, 2000)   # 400-2000mg per day
        }

        # Validate each nutrient
        for nutrient, (min_val, max_val) in ranges.items():
            value = getattr(request, nutrient)
            if value < min_val or value > max_val:
                raise InvalidGoalRangeError(
                    nutrient=nutrient,
                    value=value,
                    min_val=min_val,
                    max_val=max_val
                )

    def get_recommended_goals_by_stage(self, ckd_stage: CKDStage) -> dict:
        """
        Get recommended goal values based on CKD stage

        Args:
            ckd_stage: CKD stage

        Returns:
            Dictionary with recommended nutrient goals
        """
        return self.goal_repo.get_default_goals_by_stage(ckd_stage)


# Singleton instance
goal_service = GoalService()
