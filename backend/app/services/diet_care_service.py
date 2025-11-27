"""
Diet Care Service Layer

This module contains business logic for the Diet Care feature, including:
- Nutrition calculations and goal tracking
- Progress analysis and compliance scoring
- CKD stage-specific recommendations
- Streak management

Architecture:
    Service Layer (this) -> Repository Layer -> Database

Design Principles:
- Single Responsibility: Each service method has one clear purpose
- Separation of Concerns: Business logic is isolated from data access
- Testability: All methods can be unit tested with mocked repositories
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date, timedelta
from enum import Enum
import logging

from app.models.diet import (
    DietGoal, MealLog, UserStreak,
    CKDStage, MealType, Nutrients,
    CreateMealRequest, UpdateGoalRequest,
    DailyProgress, NutrientAdherence
)
from app.repositories.diet_care_repository import (
    diet_goals_repository,
    meal_log_repository,
    diet_session_repository,
    user_streak_repository
)
from app.core.exceptions import (
    InvalidGoalRangeError,
    GoalNotFoundError,
    InvalidMealDataError,
    AnalysisLimitExceededError
)

logger = logging.getLogger(__name__)


class ComplianceLevel(str, Enum):
    """Compliance level for nutrient adherence"""
    EXCELLENT = "excellent"  # 90-110% of goal
    GOOD = "good"            # 80-120% of goal
    MODERATE = "moderate"    # 70-130% of goal
    POOR = "poor"            # <70% or >130% of goal


class DietCareService:
    """
    Main service for Diet Care feature

    Responsibilities:
    - Goal management with validation
    - Meal logging with nutrition tracking
    - Progress calculation and compliance scoring
    - CKD stage-specific recommendations
    """

    def __init__(self):
        self.goals_repo = diet_goals_repository
        self.meals_repo = meal_log_repository
        self.session_repo = diet_session_repository
        self.streak_repo = user_streak_repository

    # ============================================
    # Goal Management
    # ============================================

    def get_user_goals(self, user_id: str) -> Optional[DietGoal]:
        """
        Get user's dietary goals

        Args:
            user_id: User ID

        Returns:
            DietGoal if exists, None otherwise
        """
        return self.goals_repo.get_user_goals(user_id)

    def get_or_create_default_goals(
        self,
        user_id: str,
        ckd_stage: CKDStage = CKDStage.STAGE_3
    ) -> DietGoal:
        """
        Get existing goals or create default goals based on CKD stage

        Args:
            user_id: User ID
            ckd_stage: CKD stage for default goals (default: Stage 3)

        Returns:
            DietGoal
        """
        # Try to get existing goals
        goals = self.get_user_goals(user_id)

        if goals:
            logger.info(f"Retrieved existing goals for user {user_id}")
            return goals

        # Create default goals
        defaults = self.goals_repo.get_default_goals_by_stage(ckd_stage)

        goal = DietGoal(
            user_id=user_id,
            sodium_mg=defaults["sodium_mg"],
            protein_g=defaults["protein_g"],
            potassium_mg=defaults["potassium_mg"],
            phosphorus_mg=defaults["phosphorus_mg"],
            ckd_stage=ckd_stage,
            updated_at=datetime.utcnow()
        )

        created_goal = self.goals_repo.upsert_goals(user_id, goal)
        logger.info(f"Created default goals for user {user_id}, stage {ckd_stage}")

        return created_goal

    def update_goals(self, user_id: str, request: UpdateGoalRequest) -> DietGoal:
        """
        Update user's dietary goals with validation

        Args:
            user_id: User ID
            request: UpdateGoalRequest with new goals

        Returns:
            Updated DietGoal

        Raises:
            InvalidGoalRangeError: If goal values are out of acceptable range
        """
        # Validate goal ranges
        self._validate_goal_ranges(request)

        # Create goal entity
        goal = DietGoal(
            user_id=user_id,
            sodium_mg=request.sodium_mg,
            protein_g=request.protein_g,
            potassium_mg=request.potassium_mg,
            phosphorus_mg=request.phosphorus_mg,
            ckd_stage=request.ckd_stage,
            updated_at=datetime.utcnow()
        )

        # Upsert (create or update)
        updated_goal = self.goals_repo.upsert_goals(user_id, goal)

        logger.info(f"Updated goals for user {user_id}, stage {request.ckd_stage}")

        return updated_goal

    def get_recommended_goals(self, ckd_stage: CKDStage) -> Dict[str, float]:
        """
        Get recommended goal values based on CKD stage

        Args:
            ckd_stage: CKD stage (1-5)

        Returns:
            Dictionary with recommended nutrient goals
        """
        return self.goals_repo.get_default_goals_by_stage(ckd_stage)

    def _validate_goal_ranges(self, request: UpdateGoalRequest):
        """
        Validate that goal values are within medically acceptable ranges

        Args:
            request: UpdateGoalRequest to validate

        Raises:
            InvalidGoalRangeError: If any goal is out of range
        """
        # Define acceptable ranges (based on medical guidelines)
        # These are safety bounds to prevent obviously incorrect values
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

    # ============================================
    # Meal Logging
    # ============================================

    def log_meal(self, user_id: str, request: CreateMealRequest) -> Tuple[MealLog, Dict]:
        """
        Create a new meal log and update streak

        Args:
            user_id: User ID
            request: CreateMealRequest with meal data

        Returns:
            Tuple of (MealLog, streak_dict)

        Raises:
            InvalidMealDataError: If meal data is invalid
        """
        # Validate foods list
        if not request.foods:
            raise InvalidMealDataError("foods", "At least one food item is required")

        # Validate nutrients match foods total
        self._validate_meal_nutrients(request)

        # Create meal log entity
        meal = MealLog(
            id=None,  # Will be set after creation
            user_id=user_id,
            meal_type=request.meal_type,
            foods=request.foods,
            total_nutrients=request.total_nutrients,
            logged_at=request.logged_at,
            created_at=datetime.utcnow()
        )

        # Save to database
        saved_meal = self.meals_repo.log_meal(user_id, meal)

        # Update streak
        logged_date = request.logged_at.strftime("%Y-%m-%d")
        streak = self.streak_repo.update_streak(user_id, logged_date)

        streak_dict = {
            "current": streak.current_streak,
            "longest": streak.longest_streak,
            "last_logged_date": streak.last_logged_date,
            "total_days_logged": streak.total_days_logged
        }

        logger.info(f"Logged {request.meal_type} meal for user {user_id}")

        return saved_meal, streak_dict

    def get_meals(
        self,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        meal_type: Optional[MealType] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[MealLog]:
        """
        Get meal logs with filtering

        Args:
            user_id: User ID
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
            meal_type: Meal type filter (optional)
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return

        Returns:
            List of meal logs
        """
        # Default to last 7 days if no dates provided
        if not start_date:
            start_date = date.today() - timedelta(days=7)
        if not end_date:
            end_date = date.today()

        return self.meals_repo.get_meals_by_date_range(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            meal_type=meal_type,
            skip=skip,
            limit=limit
        )

    def get_meal_by_id(self, meal_id: str) -> Optional[MealLog]:
        """
        Get meal by ID

        Args:
            meal_id: Meal ID

        Returns:
            MealLog if found, None otherwise
        """
        return self.meals_repo.find_by_id(meal_id)

    def delete_meal(self, meal_id: str, user_id: str) -> bool:
        """
        Delete meal log (with authorization check)

        Args:
            meal_id: Meal ID
            user_id: User ID (for authorization)

        Returns:
            True if deleted, False otherwise
        """
        # Get meal to verify ownership
        meal = self.get_meal_by_id(meal_id)

        if not meal or meal.user_id != user_id:
            return False

        # Delete
        deleted = self.meals_repo.delete(meal_id)

        if deleted:
            logger.info(f"Deleted meal {meal_id} for user {user_id}")

        return deleted

    def _validate_meal_nutrients(self, request: CreateMealRequest):
        """
        Validate that total_nutrients matches sum of foods

        Args:
            request: CreateMealRequest to validate

        Raises:
            InvalidMealDataError: If nutrients don't match
        """
        # Calculate expected totals
        expected = Nutrients(
            sodium_mg=sum(f.sodium_mg for f in request.foods),
            protein_g=sum(f.protein_g for f in request.foods),
            potassium_mg=sum(f.potassium_mg for f in request.foods),
            phosphorus_mg=sum(f.phosphorus_mg for f in request.foods)
        )

        # Allow 1% tolerance for floating point differences
        tolerance = 0.01

        for nutrient in ['sodium_mg', 'protein_g', 'potassium_mg', 'phosphorus_mg']:
            expected_val = getattr(expected, nutrient)
            actual_val = getattr(request.total_nutrients, nutrient)

            if expected_val > 0:
                diff_percent = abs(expected_val - actual_val) / expected_val
                if diff_percent > tolerance:
                    raise InvalidMealDataError(
                        "total_nutrients",
                        f"{nutrient} mismatch: expected {expected_val}, got {actual_val}"
                    )

    # ============================================
    # Progress Tracking
    # ============================================

    def get_daily_progress(self, user_id: str, target_date: date) -> DailyProgress:
        """
        Calculate daily progress against goals

        Args:
            user_id: User ID
            target_date: Date to analyze

        Returns:
            DailyProgress with consumed vs goals

        Raises:
            GoalNotFoundError: If user has no goals set
        """
        # Get user's goals
        goals = self.get_user_goals(user_id)
        if not goals:
            raise GoalNotFoundError(user_id)

        # Get daily totals
        totals = self.meals_repo.get_daily_totals(user_id, target_date)

        # Create Nutrients objects
        consumed = Nutrients(
            sodium_mg=totals["sodium_mg"],
            protein_g=totals["protein_g"],
            potassium_mg=totals["potassium_mg"],
            phosphorus_mg=totals["phosphorus_mg"]
        )

        goal_nutrients = Nutrients(
            sodium_mg=goals.sodium_mg,
            protein_g=goals.protein_g,
            potassium_mg=goals.potassium_mg,
            phosphorus_mg=goals.phosphorus_mg
        )

        # Calculate adherence
        adherence = self._calculate_adherence(consumed, goal_nutrients)

        # Identify violations
        violations = self._identify_violations(consumed, goal_nutrients)

        return DailyProgress(
            date=target_date.strftime("%Y-%m-%d"),
            consumed=consumed,
            goals=goal_nutrients,
            adherence=adherence,
            violations=violations
        )

    def get_weekly_summary(
        self,
        user_id: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, any]:
        """
        Calculate weekly nutrition summary

        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date

        Returns:
            Dictionary with weekly statistics
        """
        # Get goals
        goals = self.get_user_goals(user_id)
        if not goals:
            raise GoalNotFoundError(user_id)

        # Get weekly totals
        summary = self.meals_repo.get_nutrition_summary(
            user_id=user_id,
            start=start_date,
            end=end_date
        )

        # Calculate number of days
        num_days = (end_date - start_date).days + 1

        # Calculate daily averages
        avg_sodium = summary["sodium_mg"] / num_days if num_days > 0 else 0
        avg_protein = summary["protein_g"] / num_days if num_days > 0 else 0
        avg_potassium = summary["potassium_mg"] / num_days if num_days > 0 else 0
        avg_phosphorus = summary["phosphorus_mg"] / num_days if num_days > 0 else 0

        # Calculate adherence for averages
        avg_consumed = Nutrients(
            sodium_mg=avg_sodium,
            protein_g=avg_protein,
            potassium_mg=avg_potassium,
            phosphorus_mg=avg_phosphorus
        )

        goal_nutrients = Nutrients(
            sodium_mg=goals.sodium_mg,
            protein_g=goals.protein_g,
            potassium_mg=goals.potassium_mg,
            phosphorus_mg=goals.phosphorus_mg
        )

        adherence = self._calculate_adherence(avg_consumed, goal_nutrients)

        # Get adherence days
        adherence_days = self.meals_repo.get_adherence_days(user_id, start_date, end_date)

        return {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "total_days": num_days,
            "days_logged": len(adherence_days),
            "total_meals": summary["meal_count"],
            "averages": {
                "sodium_mg": round(avg_sodium, 2),
                "protein_g": round(avg_protein, 2),
                "potassium_mg": round(avg_potassium, 2),
                "phosphorus_mg": round(avg_phosphorus, 2)
            },
            "goals": {
                "sodium_mg": goals.sodium_mg,
                "protein_g": goals.protein_g,
                "potassium_mg": goals.potassium_mg,
                "phosphorus_mg": goals.phosphorus_mg
            },
            "adherence": adherence.model_dump(),
            "compliance_rate": round(len(adherence_days) / num_days * 100, 1) if num_days > 0 else 0
        }

    def _calculate_adherence(
        self,
        consumed: Nutrients,
        goals: Nutrients
    ) -> NutrientAdherence:
        """
        Calculate adherence percentage for each nutrient

        For CKD patients:
        - Lower is better for sodium, potassium, phosphorus (limits)
        - Higher is better for protein (minimum requirement)

        Args:
            consumed: Consumed nutrients
            goals: Goal nutrients

        Returns:
            NutrientAdherence with percentages
        """
        def calc_percentage(consumed_val: float, goal_val: float) -> float:
            """Calculate percentage, handling zero goal"""
            if goal_val == 0:
                return 0.0
            return round((consumed_val / goal_val) * 100, 1)

        return NutrientAdherence(
            sodium_mg=calc_percentage(consumed.sodium_mg, goals.sodium_mg),
            protein_g=calc_percentage(consumed.protein_g, goals.protein_g),
            potassium_mg=calc_percentage(consumed.potassium_mg, goals.potassium_mg),
            phosphorus_mg=calc_percentage(consumed.phosphorus_mg, goals.phosphorus_mg)
        )

    def _identify_violations(
        self,
        consumed: Nutrients,
        goals: Nutrients
    ) -> List[str]:
        """
        Identify nutrient violations (exceeded limits)

        Args:
            consumed: Consumed nutrients
            goals: Goal nutrients

        Returns:
            List of violation messages
        """
        violations = []

        # For CKD patients, exceeding these limits is concerning
        limit_nutrients = [
            ("sodium_mg", "나트륨", "mg"),
            ("potassium_mg", "칼륨", "mg"),
            ("phosphorus_mg", "인", "mg")
        ]

        for field, name_kr, unit in limit_nutrients:
            consumed_val = getattr(consumed, field)
            goal_val = getattr(goals, field)

            if consumed_val > goal_val * 1.1:  # 10% over limit
                violations.append(
                    f"{name_kr} 섭취량이 목표치를 초과했습니다 "
                    f"({consumed_val:.0f}{unit} / {goal_val:.0f}{unit})"
                )

        # For protein, being too low is concerning
        if consumed.protein_g < goals.protein_g * 0.8:  # 20% under minimum
            violations.append(
                f"단백질 섭취량이 목표치보다 부족합니다 "
                f"({consumed.protein_g:.1f}g / {goals.protein_g:.1f}g)"
            )

        return violations

    def calculate_compliance_score(
        self,
        consumed: Nutrients,
        goals: Nutrients
    ) -> float:
        """
        Calculate overall compliance score (0-100)

        Scoring logic:
        - 100: All nutrients within 90-110% of goal
        - 80-99: Most nutrients compliant, minor deviations
        - 60-79: Some nutrients significantly over/under
        - <60: Multiple significant violations

        Args:
            consumed: Consumed nutrients
            goals: Goal nutrients

        Returns:
            Compliance score (0-100)
        """
        scores = []

        # Calculate individual nutrient scores
        for nutrient in ['sodium_mg', 'protein_g', 'potassium_mg', 'phosphorus_mg']:
            consumed_val = getattr(consumed, nutrient)
            goal_val = getattr(goals, nutrient)

            if goal_val == 0:
                continue

            ratio = consumed_val / goal_val

            # Perfect: 90-110% of goal
            if 0.9 <= ratio <= 1.1:
                scores.append(100)
            # Good: 80-120% of goal
            elif 0.8 <= ratio <= 1.2:
                scores.append(80)
            # Moderate: 70-130% of goal
            elif 0.7 <= ratio <= 1.3:
                scores.append(60)
            # Poor: Outside 70-130%
            else:
                scores.append(30)

        # Average score
        return round(sum(scores) / len(scores), 1) if scores else 0.0

    # ============================================
    # Streak Management
    # ============================================

    def get_user_streak(self, user_id: str) -> Dict[str, any]:
        """
        Get user's logging streak

        Args:
            user_id: User ID

        Returns:
            Dictionary with streak information
        """
        streak = self.streak_repo.get_or_create_streak(user_id)

        return {
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak,
            "last_logged_date": streak.last_logged_date,
            "total_days_logged": streak.total_days_logged
        }

    # ============================================
    # Session Management (for analysis rate limiting)
    # ============================================

    def get_or_create_session(self, user_id: str) -> Dict[str, any]:
        """
        Get or create analysis session for rate limiting

        Args:
            user_id: User ID

        Returns:
            Dictionary with session info

        Raises:
            AnalysisLimitExceededError: If rate limit exceeded
        """
        session = self.session_repo.get_or_create_session(user_id)

        if not session.can_analyze:
            raise AnalysisLimitExceededError(reset_at=session.expires_at)

        return {
            "session_id": session.id,
            "remaining_analyses": session.remaining_analyses,
            "expires_at": session.expires_at.isoformat(),
            "analysis_count": session.analysis_count
        }

    def increment_analysis_count(self, session_id: str) -> bool:
        """
        Increment analysis count for session

        Args:
            session_id: Session ID

        Returns:
            True if incremented successfully
        """
        return self.session_repo.increment_analysis_count(session_id)

    # ============================================
    # CKD Stage-Specific Recommendations
    # ============================================

    def get_stage_recommendations(self, ckd_stage: CKDStage) -> Dict[str, any]:
        """
        Get nutrition recommendations based on CKD stage

        Args:
            ckd_stage: CKD stage

        Returns:
            Dictionary with recommendations
        """
        goals = self.get_recommended_goals(ckd_stage)

        # Stage-specific advice
        advice = {
            CKDStage.STAGE_1: {
                "focus": "예방 및 건강한 식습관 유지",
                "key_points": [
                    "균형잡힌 식단 유지",
                    "적정 단백질 섭취",
                    "나트륨 섭취 제한 (하루 2,300mg 이하)",
                    "정기적인 혈압 관리"
                ]
            },
            CKDStage.STAGE_2: {
                "focus": "신장 기능 보호",
                "key_points": [
                    "나트륨 섭취 더욱 제한 (하루 2,000mg 이하)",
                    "단백질 섭취량 조절",
                    "칼륨 섭취 모니터링 시작",
                    "정기적인 검사 필요"
                ]
            },
            CKDStage.STAGE_3: {
                "focus": "영양소 관리 강화",
                "key_points": [
                    "저나트륨 식단 필수 (하루 2,000mg 이하)",
                    "단백질 섭취 조절 (하루 50g 전후)",
                    "칼륨, 인 섭취 제한 필요",
                    "영양사 상담 권장"
                ]
            },
            CKDStage.STAGE_4: {
                "focus": "엄격한 영양 관리",
                "key_points": [
                    "매우 낮은 나트륨 섭취 (하루 1,500mg 이하)",
                    "단백질 섭취 제한 (하루 40g 전후)",
                    "칼륨, 인 엄격히 제한",
                    "전문의 및 영양사 정기 상담 필수"
                ]
            },
            CKDStage.STAGE_5: {
                "focus": "투석 또는 이식 준비",
                "key_points": [
                    "개별화된 식단 계획 필수",
                    "전해질 균형 세밀한 관리",
                    "수분 섭취량 조절",
                    "의료진과 긴밀한 협력 필요"
                ]
            }
        }

        return {
            "stage": ckd_stage.value,
            "goals": goals,
            "advice": advice.get(ckd_stage, advice[CKDStage.STAGE_3])
        }


# ============================================
# Service Singleton Instance
# ============================================

diet_care_service = DietCareService()
