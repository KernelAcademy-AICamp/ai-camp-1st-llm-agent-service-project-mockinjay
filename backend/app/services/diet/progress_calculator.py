"""
Progress Calculator Service

This module calculates nutrition progress, statistics, and compliance metrics
for Diet Care users. It provides daily/weekly progress tracking, trend analysis,
and personalized recommendations based on goal adherence.

Key Features:
- Daily progress calculation with goal comparison
- Weekly trend analysis and aggregation
- Compliance scoring and streak tracking
- Violation detection for critical nutrients
- Adaptive recommendations based on consumption patterns

Usage:
    calculator = ProgressCalculatorService()
    progress = await calculator.calculate_daily_progress(
        user_id="user123",
        date=datetime.now()
    )
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.diet_care import (
    DailyProgressResponse,
    WeeklyProgressResponse,
    DailySummary,
    NutrientProgress,
    NutritionGoals
)
from app.models.diet import (
    MealLog,
    DietGoal,
    Nutrients
)
from app.repositories.meal_repository import meal_repository
from app.repositories.goal_repository import goal_repository
from app.services.diet.goal_service import goal_service
from app.core.exceptions import GoalNotFoundError

logger = logging.getLogger(__name__)


class ProgressCalculatorService:
    """
    Service for calculating nutrition progress and statistics.

    Provides comprehensive progress tracking, trend analysis, and
    personalized recommendations for dietary goal adherence.
    """

    # Compliance scoring weights
    NUTRIENT_WEIGHTS = {
        "sodium_mg": 0.3,      # Critical for CKD
        "potassium_mg": 0.3,   # Critical for CKD
        "phosphorus_mg": 0.25, # Important for CKD
        "protein_g": 0.15      # Important but less critical
    }

    # Violation thresholds (% over goal)
    VIOLATION_THRESHOLD = 1.2  # 120% of goal

    def __init__(self):
        """Initialize progress calculator with repository dependencies."""
        self.meal_repo = meal_repository
        self.goal_repo = goal_repository
        self.goal_service = goal_service
        logger.info("ProgressCalculatorService initialized")

    async def calculate_daily_progress(
        self,
        user_id: str,
        date: datetime
    ) -> DailyProgressResponse:
        """
        Calculate daily nutrition progress against goals.

        Args:
            user_id: User ID
            date: Date to calculate progress for

        Returns:
            DailyProgressResponse with progress for each nutrient

        Raises:
            GoalNotFoundError: If user has no goals set

        Example:
            >>> progress = await calculator.calculate_daily_progress(
            ...     user_id="user123",
            ...     date=datetime.now()
            ... )
            >>> print(f"Sodium: {progress.sodium.percentage:.1f}%")
        """
        # Get user's goals
        goals = self.goal_service.get_user_goals(user_id)
        if not goals:
            raise GoalNotFoundError(user_id)

        # Get daily totals
        date_obj = date if isinstance(date, datetime) else datetime.fromisoformat(date)
        totals = self.meal_repo.get_daily_totals(user_id, date_obj)

        # Count meals logged
        date_str = date_obj.strftime("%Y-%m-%d")
        meals_logged = self.meal_repo.get_meals_on_date(user_id, date_str)

        # Calculate progress for each nutrient
        calories_progress = self._calculate_nutrient_progress(
            current=0,  # Not tracked in current schema
            target=2000,  # Default value
            nutrient_name="calories"
        )

        protein_progress = self._calculate_nutrient_progress(
            current=totals["protein_g"],
            target=goals.protein_g,
            nutrient_name="protein"
        )

        sodium_progress = self._calculate_nutrient_progress(
            current=totals["sodium_mg"],
            target=goals.sodium_mg,
            nutrient_name="sodium",
            is_limit=True
        )

        potassium_progress = self._calculate_nutrient_progress(
            current=totals["potassium_mg"],
            target=goals.potassium_mg,
            nutrient_name="potassium",
            is_limit=True
        )

        phosphorus_progress = self._calculate_nutrient_progress(
            current=totals["phosphorus_mg"],
            target=goals.phosphorus_mg,
            nutrient_name="phosphorus",
            is_limit=True
        )

        logger.info(
            f"Calculated daily progress for user {user_id} on {date_str}: "
            f"{meals_logged} meals logged"
        )

        return DailyProgressResponse(
            date=date_str,
            calories=calories_progress,
            protein=protein_progress,
            sodium=sodium_progress,
            potassium=potassium_progress,
            phosphorus=phosphorus_progress,
            meals_logged=meals_logged,
            total_meals=3  # breakfast, lunch, dinner
        )

    def calculate_daily_progress_sync(
        self,
        user_id: str,
        date: datetime
    ) -> DailyProgressResponse:
        """
        Synchronous version of calculate_daily_progress.

        Args:
            user_id: User ID
            date: Date to calculate progress for

        Returns:
            DailyProgressResponse
        """
        goals = self.goal_service.get_user_goals(user_id)
        if not goals:
            raise GoalNotFoundError(user_id)

        date_obj = date if isinstance(date, datetime) else datetime.fromisoformat(date)
        totals = self.meal_repo.get_daily_totals(user_id, date_obj)
        date_str = date_obj.strftime("%Y-%m-%d")
        meals_logged = self.meal_repo.get_meals_on_date(user_id, date_str)

        return DailyProgressResponse(
            date=date_str,
            calories=self._calculate_nutrient_progress(0, 2000, "calories"),
            protein=self._calculate_nutrient_progress(
                totals["protein_g"], goals.protein_g, "protein"
            ),
            sodium=self._calculate_nutrient_progress(
                totals["sodium_mg"], goals.sodium_mg, "sodium", True
            ),
            potassium=self._calculate_nutrient_progress(
                totals["potassium_mg"], goals.potassium_mg, "potassium", True
            ),
            phosphorus=self._calculate_nutrient_progress(
                totals["phosphorus_mg"], goals.phosphorus_mg, "phosphorus", True
            ),
            meals_logged=meals_logged,
            total_meals=3
        )

    async def calculate_weekly_progress(
        self,
        user_id: str,
        week_start: datetime
    ) -> WeeklyProgressResponse:
        """
        Calculate weekly nutrition progress and trends.

        Args:
            user_id: User ID
            week_start: Start date of the week (Monday)

        Returns:
            WeeklyProgressResponse with daily summaries and averages

        Example:
            >>> weekly = await calculator.calculate_weekly_progress(
            ...     user_id="user123",
            ...     week_start=datetime(2025, 11, 20)
            ... )
            >>> print(f"Average compliance: {weekly.average_compliance:.1f}%")
        """
        # Calculate week end date
        week_end = week_start + timedelta(days=6)

        # Get user's goals
        goals = self.goal_service.get_user_goals(user_id)
        if not goals:
            raise GoalNotFoundError(user_id)

        # Generate daily summaries
        daily_summaries = []
        total_meals = 0
        total_compliance = 0.0
        days_with_meals = 0

        for day_offset in range(7):
            current_date = week_start + timedelta(days=day_offset)
            date_str = current_date.strftime("%Y-%m-%d")

            # Get daily totals
            totals = self.meal_repo.get_daily_totals(user_id, current_date)
            meals_count = self.meal_repo.get_meals_on_date(user_id, date_str)

            # Calculate compliance score
            compliance_score = self._calculate_compliance_score(totals, goals)

            # Create daily summary
            summary = DailySummary(
                date=date_str,
                total_calories=0,  # Not tracked
                total_protein_g=totals["protein_g"],
                total_sodium_mg=totals["sodium_mg"],
                total_potassium_mg=totals["potassium_mg"],
                total_phosphorus_mg=totals["phosphorus_mg"],
                meals_count=meals_count,
                compliance_score=compliance_score
            )

            daily_summaries.append(summary)
            total_meals += meals_count

            if meals_count > 0:
                total_compliance += compliance_score
                days_with_meals += 1

        # Calculate average compliance
        average_compliance = (
            total_compliance / days_with_meals if days_with_meals > 0 else 0.0
        )

        # Calculate streak
        streak_days = self._calculate_streak(user_id, week_end)

        logger.info(
            f"Calculated weekly progress for user {user_id}: "
            f"{total_meals} meals, {average_compliance:.1f}% avg compliance"
        )

        return WeeklyProgressResponse(
            week_start=week_start.strftime("%Y-%m-%d"),
            week_end=week_end.strftime("%Y-%m-%d"),
            daily_summaries=daily_summaries,
            average_compliance=round(average_compliance, 2),
            streak_days=streak_days,
            total_meals_logged=total_meals
        )

    def generate_recommendations(
        self,
        daily_progress: DailyProgressResponse,
        user_goals: DietGoal
    ) -> List[str]:
        """
        Generate personalized recommendations based on progress.

        Args:
            daily_progress: Daily progress data
            user_goals: User's dietary goals

        Returns:
            List of recommendation strings

        Example:
            >>> recs = calculator.generate_recommendations(progress, goals)
            >>> for rec in recs:
            ...     print(f"- {rec}")
        """
        recommendations = []

        # Sodium recommendations
        if daily_progress.sodium.status == "over":
            if daily_progress.sodium.percentage > 150:
                recommendations.append(
                    "나트륨 섭취가 매우 높습니다. 즉시 저염 식단으로 전환하세요."
                )
            else:
                recommendations.append(
                    "나트륨 섭취를 줄이세요. 국물을 적게 먹고 양념을 줄이세요."
                )
        elif daily_progress.sodium.status == "optimal":
            recommendations.append("나트륨 섭취가 적절합니다. 계속 유지하세요!")

        # Potassium recommendations
        if daily_progress.potassium.status == "over":
            recommendations.append(
                "칼륨 섭취가 높습니다. 채소는 데쳐서 먹고 과일을 제한하세요."
            )

        # Phosphorus recommendations
        if daily_progress.phosphorus.status == "over":
            recommendations.append(
                "인 섭취가 높습니다. 유제품과 가공식품을 줄이세요."
            )

        # Protein recommendations
        if daily_progress.protein.status == "under":
            recommendations.append(
                "단백질이 부족합니다. 양질의 단백질(생선, 계란)을 추가하세요."
            )
        elif daily_progress.protein.status == "over":
            recommendations.append(
                "단백질 섭취가 많습니다. 적정량을 여러 끼에 나눠 드세요."
            )

        # Meal frequency recommendation
        if daily_progress.meals_logged < 2:
            recommendations.append(
                "규칙적인 식사가 중요합니다. 하루 3끼를 챙겨 드세요."
            )

        # If no specific issues
        if not recommendations:
            recommendations.append(
                "모든 영양소가 균형잡혀 있습니다. 훌륭합니다!"
            )

        return recommendations

    def _calculate_nutrient_progress(
        self,
        current: float,
        target: float,
        nutrient_name: str,
        is_limit: bool = False
    ) -> NutrientProgress:
        """
        Calculate progress for a single nutrient.

        Args:
            current: Current consumption
            target: Target value (goal or limit)
            nutrient_name: Name of the nutrient
            is_limit: True if target is a limit (not to exceed), False if it's a goal

        Returns:
            NutrientProgress with status and percentage
        """
        # Calculate percentage
        if target > 0:
            percentage = (current / target) * 100
        else:
            percentage = 0.0

        # Determine status
        if is_limit:
            # For limits (sodium, potassium, phosphorus)
            if percentage <= 80:
                status = "under"  # Good - under limit
            elif percentage <= 100:
                status = "optimal"  # Optimal - at or near limit
            else:
                status = "over"  # Bad - over limit
        else:
            # For goals (protein, calories)
            if percentage < 80:
                status = "under"  # Under goal
            elif percentage <= 120:
                status = "optimal"  # Optimal range
            else:
                status = "over"  # Over goal

        return NutrientProgress(
            current=round(current, 2),
            target=round(target, 2),
            percentage=round(percentage, 2),
            status=status
        )

    def _calculate_compliance_score(
        self,
        totals: Dict[str, float],
        goals: DietGoal
    ) -> float:
        """
        Calculate overall compliance score (0-100).

        Uses weighted average of nutrient adherence with penalties
        for violations.

        Args:
            totals: Daily nutrient totals
            goals: User's dietary goals

        Returns:
            Compliance score (0-100)
        """
        scores = {}

        # Calculate individual nutrient scores
        for nutrient, weight in self.NUTRIENT_WEIGHTS.items():
            current = totals.get(nutrient, 0)
            target = getattr(goals, nutrient)

            if target <= 0:
                scores[nutrient] = 100.0
                continue

            # Calculate ratio
            ratio = current / target

            # Score based on how close to target
            if ratio <= 1.0:
                # Under or at target - good for limits
                score = 100.0
            elif ratio <= 1.2:
                # Slightly over (100-120%) - acceptable
                score = 100.0 - ((ratio - 1.0) * 100)
            else:
                # Significantly over (>120%) - penalize
                score = max(0.0, 80.0 - ((ratio - 1.2) * 50))

            scores[nutrient] = score

        # Calculate weighted average
        total_score = sum(
            scores[nutrient] * weight
            for nutrient, weight in self.NUTRIENT_WEIGHTS.items()
        )

        return round(total_score, 2)

    def _calculate_streak(self, user_id: str, end_date: datetime) -> int:
        """
        Calculate current logging streak.

        Args:
            user_id: User ID
            end_date: Date to calculate streak up to

        Returns:
            Number of consecutive days with at least 1 meal logged
        """
        streak = 0
        current_date = end_date

        # Go backwards from end_date
        for _ in range(365):  # Max 1 year
            date_str = current_date.strftime("%Y-%m-%d")
            meals_count = self.meal_repo.get_meals_on_date(user_id, date_str)

            if meals_count > 0:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break

        return streak

    def get_nutrient_trends(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get nutrient consumption trends over a date range.

        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date

        Returns:
            Dictionary with trend data for each nutrient

        Example:
            >>> trends = calculator.get_nutrient_trends(
            ...     user_id="user123",
            ...     start_date=datetime(2025, 11, 1),
            ...     end_date=datetime(2025, 11, 30)
            ... )
            >>> sodium_trend = trends["sodium_mg"]
        """
        trends = {
            "sodium_mg": [],
            "protein_g": [],
            "potassium_mg": [],
            "phosphorus_mg": []
        }

        # Iterate through date range
        current_date = start_date
        while current_date <= end_date:
            # Get daily totals
            totals = self.meal_repo.get_daily_totals(user_id, current_date)
            date_str = current_date.strftime("%Y-%m-%d")

            # Add to trends
            for nutrient in trends.keys():
                trends[nutrient].append({
                    "date": date_str,
                    "value": totals.get(nutrient, 0)
                })

            current_date += timedelta(days=1)

        return trends

    def identify_violations(
        self,
        totals: Dict[str, float],
        goals: DietGoal
    ) -> List[str]:
        """
        Identify nutrient violations (>120% of goal).

        Args:
            totals: Daily nutrient totals
            goals: User's dietary goals

        Returns:
            List of violation messages
        """
        violations = []

        # Check each nutrient
        nutrients_to_check = {
            "sodium_mg": "나트륨",
            "potassium_mg": "칼륨",
            "phosphorus_mg": "인",
            "protein_g": "단백질"
        }

        for nutrient, korean_name in nutrients_to_check.items():
            current = totals.get(nutrient, 0)
            target = getattr(goals, nutrient)

            if target > 0 and current > target * self.VIOLATION_THRESHOLD:
                percentage = (current / target) * 100
                violations.append(
                    f"{korean_name} 초과: {current:.0f} (목표 {target:.0f}, {percentage:.0f}%)"
                )

        return violations


# Singleton instance
progress_calculator_service = ProgressCalculatorService()


# Test stub
"""
Unit tests for ProgressCalculatorService:

1. test_calculate_daily_progress():
   - Test with various meal combinations
   - Verify progress calculations are accurate
   - Check status determination (under/optimal/over)

2. test_calculate_weekly_progress():
   - Test with 7 days of data
   - Verify average compliance calculation
   - Check streak counting

3. test_compliance_score():
   - Test edge cases (0 consumption, exactly at goal, way over)
   - Verify weighted scoring
   - Check penalty application for violations

4. test_generate_recommendations():
   - Test with different progress scenarios
   - Verify recommendations are appropriate
   - Check priority ordering

5. test_nutrient_trends():
   - Test with date range
   - Verify trend data structure
   - Check edge cases (no data days)

6. test_violations():
   - Test threshold detection
   - Verify violation messages
   - Check multiple violations
"""
