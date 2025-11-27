"""
Diet Care Services

This package contains all business logic for the Diet Care feature,
including nutrition analysis, meal logging, goal management, and progress tracking.

Service Layer Architecture:
- NutritionAnalyzerService: AI-powered food image analysis
- MealService: Meal logging and retrieval
- GoalService: Dietary goal management
- ProgressCalculatorService: Progress tracking and statistics

Usage:
    from app.services.diet import (
        nutrition_analyzer_service,
        meal_service,
        goal_service,
        progress_calculator_service
    )
"""
from app.services.diet.nutrition_analyzer import (
    NutritionAnalyzerService,
    nutrition_analyzer_service
)
from app.services.diet.meal_service import (
    MealService,
    meal_service
)
from app.services.diet.goal_service import (
    GoalService,
    goal_service
)
from app.services.diet.progress_calculator import (
    ProgressCalculatorService,
    progress_calculator_service
)

__all__ = [
    # Classes
    "NutritionAnalyzerService",
    "MealService",
    "GoalService",
    "ProgressCalculatorService",
    # Singleton instances
    "nutrition_analyzer_service",
    "meal_service",
    "goal_service",
    "progress_calculator_service",
]
