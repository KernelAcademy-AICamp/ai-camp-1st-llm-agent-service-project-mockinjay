"""
Diet Care - Pydantic Models

This module contains all Pydantic models for the Diet Care feature,
including request/response schemas for nutrition analysis, meal logging,
goal management, and progress tracking.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, date
from enum import Enum


class MealType(str, Enum):
    """Meal type enumeration"""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class AnalysisStatus(str, Enum):
    """Analysis status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================
# Session Management Models
# ============================================

class CreateSessionRequest(BaseModel):
    """Request model for creating an analysis session"""
    user_id: Optional[str] = None  # Can be extracted from JWT


class CreateSessionResponse(BaseModel):
    """Response model for session creation"""
    session_id: str
    created_at: str
    expires_at: str


# ============================================
# Nutrition Analysis Models
# ============================================

class FoodItem(BaseModel):
    """Individual food item with nutrition details"""
    name: str = Field(..., description="Food name")
    amount: str = Field(..., description="Amount consumed (e.g., '100g', '1 cup')")
    calories: float = Field(..., ge=0, description="Calories in kcal")
    protein_g: float = Field(..., ge=0, description="Protein in grams")
    sodium_mg: float = Field(..., ge=0, description="Sodium in milligrams")
    potassium_mg: float = Field(..., ge=0, description="Potassium in milligrams")
    phosphorus_mg: float = Field(..., ge=0, description="Phosphorus in milligrams")
    carbs_g: Optional[float] = Field(default=0, ge=0, description="Carbohydrates in grams")
    fat_g: Optional[float] = Field(default=0, ge=0, description="Fat in grams")
    fiber_g: Optional[float] = Field(default=0, ge=0, description="Fiber in grams")


class UserProfile(BaseModel):
    """User health profile for personalized analysis"""
    age: Optional[int] = Field(default=None, ge=0, le=150)
    weight_kg: Optional[float] = Field(default=None, ge=0, le=500)
    height_cm: Optional[float] = Field(default=None, ge=0, le=300)
    ckd_stage: Optional[int] = Field(default=None, ge=1, le=5, description="Chronic Kidney Disease stage (1-5)")
    activity_level: Optional[Literal["sedentary", "light", "moderate", "active", "very_active"]] = None
    medical_conditions: Optional[List[str]] = Field(default_factory=list)
    allergies: Optional[List[str]] = Field(default_factory=list)


class NutriCoachRequest(BaseModel):
    """Request model for nutrition analysis endpoint"""
    session_id: str
    text: Optional[str] = Field(default=None, description="Text description of the meal")
    user_profile: Optional[UserProfile] = None

    # Note: image file will be handled via multipart/form-data separately


class NutritionAnalysisResult(BaseModel):
    """Structured nutrition analysis result from GPT-4 Vision"""
    foods: List[FoodItem] = Field(..., description="Identified food items")
    total_calories: float = Field(..., ge=0)
    total_protein_g: float = Field(..., ge=0)
    total_sodium_mg: float = Field(..., ge=0)
    total_potassium_mg: float = Field(..., ge=0)
    total_phosphorus_mg: float = Field(..., ge=0)
    total_carbs_g: float = Field(default=0, ge=0)
    total_fat_g: float = Field(default=0, ge=0)
    total_fiber_g: float = Field(default=0, ge=0)
    meal_type_suggestion: Optional[MealType] = None
    confidence_score: float = Field(default=0.8, ge=0, le=1, description="AI confidence in analysis")
    recommendations: List[str] = Field(default_factory=list, description="Personalized recommendations")
    warnings: List[str] = Field(default_factory=list, description="Health warnings for CKD patients")
    analysis_notes: Optional[str] = None


class NutriCoachResponse(BaseModel):
    """Response model for nutrition analysis"""
    session_id: str
    analysis: NutritionAnalysisResult
    analyzed_at: str
    image_url: Optional[str] = None


# ============================================
# Meal Logging Models
# ============================================

class CreateMealRequest(BaseModel):
    """Request model for logging a meal"""
    meal_type: MealType
    foods: List[FoodItem]
    logged_at: Optional[datetime] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None

    @field_validator('logged_at', mode='before')
    @classmethod
    def set_logged_at(cls, v):
        """Set default logged_at to current time if not provided"""
        return v or datetime.utcnow()


class MealResponse(BaseModel):
    """Response model for a meal entry"""
    id: str
    user_id: str
    meal_type: MealType
    foods: List[FoodItem]
    total_calories: float
    total_protein_g: float
    total_sodium_mg: float
    total_potassium_mg: float
    total_phosphorus_mg: float
    logged_at: str
    notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: str


class MealListResponse(BaseModel):
    """Response model for listing meals"""
    meals: List[MealResponse]
    total_count: int
    date_range: Dict[str, str]


# ============================================
# Goal Management Models
# ============================================

class NutritionGoals(BaseModel):
    """User's nutrition goals (daily targets)"""
    calories_kcal: Optional[float] = Field(default=2000, ge=0, description="Daily calorie target")
    protein_g: Optional[float] = Field(default=50, ge=0, description="Daily protein target (g)")
    sodium_mg: Optional[float] = Field(default=2000, ge=0, description="Daily sodium limit (mg)")
    potassium_mg: Optional[float] = Field(default=2000, ge=0, description="Daily potassium limit (mg)")
    phosphorus_mg: Optional[float] = Field(default=1000, ge=0, description="Daily phosphorus limit (mg)")
    fluid_ml: Optional[float] = Field(default=2000, ge=0, description="Daily fluid limit (ml)")


class GoalsResponse(BaseModel):
    """Response model for nutrition goals"""
    user_id: str
    goals: NutritionGoals
    last_updated: str


class UpdateGoalsRequest(BaseModel):
    """Request model for updating nutrition goals"""
    calories_kcal: Optional[float] = Field(default=None, ge=0)
    protein_g: Optional[float] = Field(default=None, ge=0)
    sodium_mg: Optional[float] = Field(default=None, ge=0)
    potassium_mg: Optional[float] = Field(default=None, ge=0)
    phosphorus_mg: Optional[float] = Field(default=None, ge=0)
    fluid_ml: Optional[float] = Field(default=None, ge=0)


# ============================================
# Progress & Statistics Models
# ============================================

class NutrientProgress(BaseModel):
    """Progress for a single nutrient"""
    current: float
    target: float
    percentage: float
    status: Literal["under", "optimal", "over"]


class DailyProgressResponse(BaseModel):
    """Response model for daily progress"""
    date: str
    calories: NutrientProgress
    protein: NutrientProgress
    sodium: NutrientProgress
    potassium: NutrientProgress
    phosphorus: NutrientProgress
    meals_logged: int
    total_meals: int = 3  # breakfast, lunch, dinner


class DailySummary(BaseModel):
    """Summary for a single day"""
    date: str
    total_calories: float
    total_protein_g: float
    total_sodium_mg: float
    total_potassium_mg: float
    total_phosphorus_mg: float
    meals_count: int
    compliance_score: float = Field(ge=0, le=100, description="0-100 score for goal adherence")


class WeeklyProgressResponse(BaseModel):
    """Response model for weekly progress"""
    week_start: str
    week_end: str
    daily_summaries: List[DailySummary]
    average_compliance: float
    streak_days: int
    total_meals_logged: int


class StreakResponse(BaseModel):
    """Response model for logging streak"""
    current_streak: int = Field(description="Current consecutive days with at least 1 meal logged")
    longest_streak: int = Field(description="Longest streak ever achieved")
    last_log_date: Optional[str] = None


# ============================================
# Database Models (for MongoDB)
# ============================================

class MealDocument(BaseModel):
    """MongoDB document schema for meals"""
    user_id: str
    meal_type: MealType
    foods: List[Dict[str, Any]]  # Store as dict for MongoDB
    total_calories: float
    total_protein_g: float
    total_sodium_mg: float
    total_potassium_mg: float
    total_phosphorus_mg: float
    logged_at: datetime
    notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class GoalsDocument(BaseModel):
    """MongoDB document schema for nutrition goals"""
    user_id: str
    goals: Dict[str, Any]  # Store NutritionGoals as dict
    created_at: datetime
    updated_at: datetime


class SessionDocument(BaseModel):
    """MongoDB document schema for analysis sessions"""
    session_id: str
    user_id: str
    status: AnalysisStatus
    created_at: datetime
    expires_at: datetime
    analysis_result: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
