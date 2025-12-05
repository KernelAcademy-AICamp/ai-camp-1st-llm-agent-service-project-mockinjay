"""
Goal Repository

Manages user dietary goals.
"""
from typing import Optional, Dict, Any
from pymongo.collection import Collection
from datetime import datetime
from bson import ObjectId

from app.db.base_repository import BaseRepository
from app.models.diet import DietGoal, CKDStage
from app.db.connection import db


class GoalRepository(BaseRepository[DietGoal]):
    """Repository for managing dietary goals"""

    @property
    def collection(self) -> Collection:
        """Get goals collection"""
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

    def get_by_user_id(self, user_id: str) -> Optional[DietGoal]:
        """
        Get goals for user

        Args:
            user_id: User ID

        Returns:
            User's goals if exists, None otherwise
        """
        return self.find_one({"user_id": ObjectId(user_id)})

    def upsert_goals(self, goal: DietGoal) -> DietGoal:
        """
        Create or update goals for user

        Args:
            goal: Goal entity

        Returns:
            Updated/created goal
        """
        # Set updated timestamp
        goal.updated_at = datetime.utcnow()

        # Try to update existing goal
        existing = self.get_by_user_id(goal.user_id)

        if existing:
            # Update existing goal
            self.collection.update_one(
                {"user_id": ObjectId(goal.user_id)},
                {"$set": self._to_document(goal)}
            )
            goal.id = existing.id
        else:
            # Create new goal
            goal_id = self.create(goal)
            goal.id = goal_id

        return goal

    def get_default_goals_by_stage(self, ckd_stage: CKDStage) -> Dict[str, float]:
        """
        Get default goal values based on CKD stage

        Args:
            ckd_stage: CKD stage

        Returns:
            Dictionary with default nutrient goals
        """
        # Default recommendations by CKD stage
        # These are general guidelines and should be customized per patient
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


# Singleton instance
goal_repository = GoalRepository()
