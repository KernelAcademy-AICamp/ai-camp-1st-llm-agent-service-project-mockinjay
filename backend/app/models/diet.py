"""
Diet Care Domain Models

Pydantic models for Diet Care feature, used for:
- Request/response validation
- Data transfer objects (DTOs)
- Type safety across layers
"""
from pydantic import BaseModel, Field, validator, HttpUrl
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# ============================================
# Enums
# ============================================

class MealType(str, Enum):
    """Meal type enumeration"""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class CKDStage(str, Enum):
    """Chronic Kidney Disease stage"""
    STAGE_1 = "1"
    STAGE_2 = "2"
    STAGE_3 = "3"
    STAGE_4 = "4"
    STAGE_5 = "5"


class AnalysisPeriod(str, Enum):
    """Progress analysis period"""
    DAILY = "daily"
    WEEKLY = "weekly"


# ============================================
# Nutrition Models
# ============================================

class Nutrients(BaseModel):
    """Nutritional information"""
    sodium_mg: float = Field(..., ge=0, description="나트륨 (mg)")
    protein_g: float = Field(..., ge=0, description="단백질 (g)")
    potassium_mg: float = Field(..., ge=0, description="칼륨 (mg)")
    phosphorus_mg: float = Field(..., ge=0, description="인 (mg)")

    class Config:
        json_schema_extra = {
            "example": {
                "sodium_mg": 500,
                "protein_g": 20,
                "potassium_mg": 300,
                "phosphorus_mg": 150
            }
        }


class FoodItem(BaseModel):
    """Individual food item in a meal"""
    name: str = Field(..., min_length=1, max_length=100, description="음식 이름")
    portion_g: float = Field(..., gt=0, description="분량 (g)")
    sodium_mg: float = Field(..., ge=0)
    protein_g: float = Field(..., ge=0)
    potassium_mg: float = Field(..., ge=0)
    phosphorus_mg: float = Field(..., ge=0)

    @property
    def nutrients(self) -> Nutrients:
        """Get nutrients as Nutrients object"""
        return Nutrients(
            sodium_mg=self.sodium_mg,
            protein_g=self.protein_g,
            potassium_mg=self.potassium_mg,
            phosphorus_mg=self.phosphorus_mg
        )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "현미밥",
                "portion_g": 210,
                "sodium_mg": 2,
                "protein_g": 5.2,
                "potassium_mg": 157,
                "phosphorus_mg": 189
            }
        }


# ============================================
# Nutrition Analysis Models
# ============================================

class AnalyzeRequest(BaseModel):
    """Request to analyze food image"""
    image_url: HttpUrl = Field(..., description="음식 이미지 URL")
    user_id: str = Field(..., min_length=24, max_length=24, description="사용자 ID")

    class Config:
        json_schema_extra = {
            "example": {
                "image_url": "https://example.com/food.jpg",
                "user_id": "507f1f77bcf86cd799439011"
            }
        }


class AnalysisResult(BaseModel):
    """Result of nutrition analysis"""
    foods: List[FoodItem] = Field(..., min_items=1, description="감지된 음식 목록")
    total_nutrients: Nutrients = Field(..., description="총 영양소")

    @validator('total_nutrients', always=True)
    def validate_total_nutrients(cls, v, values):
        """Validate that total_nutrients matches sum of foods"""
        if 'foods' in values and values['foods']:
            calculated = Nutrients(
                sodium_mg=sum(f.sodium_mg for f in values['foods']),
                protein_g=sum(f.protein_g for f in values['foods']),
                potassium_mg=sum(f.potassium_mg for f in values['foods']),
                phosphorus_mg=sum(f.phosphorus_mg for f in values['foods'])
            )
            # Allow small floating point differences (within 1%)
            tolerance = 0.01
            for nutrient in ['sodium_mg', 'protein_g', 'potassium_mg', 'phosphorus_mg']:
                calc_val = getattr(calculated, nutrient)
                total_val = getattr(v, nutrient)
                if calc_val > 0 and abs(calc_val - total_val) / calc_val > tolerance:
                    # If discrepancy, use calculated value
                    setattr(v, nutrient, calc_val)
        return v


class AnalyzeResponse(BaseModel):
    """Response from nutrition analysis"""
    success: bool = True
    analysis: dict = Field(..., description="분석 결과")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "analysis": {
                    "foods": [
                        {
                            "name": "현미밥",
                            "portion_g": 210,
                            "sodium_mg": 2,
                            "protein_g": 5.2,
                            "potassium_mg": 157,
                            "phosphorus_mg": 189
                        }
                    ],
                    "total_nutrients": {
                        "sodium_mg": 2,
                        "protein_g": 5.2,
                        "potassium_mg": 157,
                        "phosphorus_mg": 189
                    },
                    "analysis_id": "507f1f77bcf86cd799439012",
                    "remaining_analyses": 9
                }
            }
        }


# ============================================
# Meal Log Models
# ============================================

class CreateMealRequest(BaseModel):
    """Request to create meal log"""
    user_id: str = Field(..., min_length=24, max_length=24)
    meal_type: MealType = Field(..., description="식사 유형")
    foods: List[FoodItem] = Field(..., min_items=1, description="음식 목록")
    total_nutrients: Nutrients = Field(..., description="총 영양소")
    logged_at: Optional[datetime] = Field(None, description="식사 시간 (기본값: 현재 시간)")

    @validator('logged_at', pre=True, always=True)
    def set_logged_at(cls, v):
        return v or datetime.utcnow()

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "meal_type": "breakfast",
                "foods": [
                    {
                        "name": "현미밥",
                        "portion_g": 210,
                        "sodium_mg": 2,
                        "protein_g": 5.2,
                        "potassium_mg": 157,
                        "phosphorus_mg": 189
                    }
                ],
                "total_nutrients": {
                    "sodium_mg": 2,
                    "protein_g": 5.2,
                    "potassium_mg": 157,
                    "phosphorus_mg": 189
                },
                "logged_at": "2025-11-27T09:30:00Z"
            }
        }


class MealLog(BaseModel):
    """Meal log entity"""
    id: str = Field(..., description="식사 기록 ID")
    user_id: str
    meal_type: MealType
    foods: List[FoodItem]
    total_nutrients: Nutrients
    logged_at: datetime
    created_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "user_id": "507f1f77bcf86cd799439011",
                "meal_type": "breakfast",
                "foods": [],
                "total_nutrients": {},
                "logged_at": "2025-11-27T09:30:00Z",
                "created_at": "2025-11-27T09:35:00Z"
            }
        }


class MealLogResponse(BaseModel):
    """Response after creating meal log"""
    success: bool = True
    meal: MealLog
    streak: dict = Field(..., description="연속 기록 정보")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "meal": {
                    "id": "507f1f77bcf86cd799439013",
                    "user_id": "507f1f77bcf86cd799439011",
                    "meal_type": "breakfast",
                    "foods": [],
                    "total_nutrients": {},
                    "logged_at": "2025-11-27T09:30:00Z",
                    "created_at": "2025-11-27T09:35:00Z"
                },
                "streak": {
                    "current": 5,
                    "longest": 12
                }
            }
        }


class MealListResponse(BaseModel):
    """Response with list of meals"""
    success: bool = True
    meals: List[MealLog]
    pagination: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "meals": [],
                "pagination": {
                    "page": 1,
                    "page_size": 20,
                    "total": 45,
                    "total_pages": 3
                }
            }
        }


# ============================================
# Goal Models
# ============================================

class DietGoal(BaseModel):
    """User's dietary goals"""
    id: Optional[str] = None
    user_id: str
    sodium_mg: float = Field(..., ge=0, le=10000)
    protein_g: float = Field(..., ge=0, le=500)
    potassium_mg: float = Field(..., ge=0, le=10000)
    phosphorus_mg: float = Field(..., ge=0, le=5000)
    ckd_stage: CKDStage
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439014",
                "user_id": "507f1f77bcf86cd799439011",
                "sodium_mg": 2000,
                "protein_g": 50,
                "potassium_mg": 2000,
                "phosphorus_mg": 800,
                "ckd_stage": "3",
                "updated_at": "2025-11-20T10:00:00Z"
            }
        }


class UpdateGoalRequest(BaseModel):
    """Request to update dietary goals"""
    user_id: str = Field(..., min_length=24, max_length=24)
    sodium_mg: float = Field(..., ge=0, le=10000)
    protein_g: float = Field(..., ge=0, le=500)
    potassium_mg: float = Field(..., ge=0, le=10000)
    phosphorus_mg: float = Field(..., ge=0, le=5000)
    ckd_stage: CKDStage

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "sodium_mg": 2000,
                "protein_g": 50,
                "potassium_mg": 2000,
                "phosphorus_mg": 800,
                "ckd_stage": "3"
            }
        }


class GoalResponse(BaseModel):
    """Response with dietary goals"""
    success: bool = True
    goals: DietGoal

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "goals": {
                    "id": "507f1f77bcf86cd799439014",
                    "user_id": "507f1f77bcf86cd799439011",
                    "sodium_mg": 2000,
                    "protein_g": 50,
                    "potassium_mg": 2000,
                    "phosphorus_mg": 800,
                    "ckd_stage": "3",
                    "updated_at": "2025-11-20T10:00:00Z"
                }
            }
        }


# ============================================
# Progress Models
# ============================================

class NutrientAdherence(BaseModel):
    """Adherence percentage for each nutrient"""
    sodium_mg: float = Field(..., ge=0, le=200, description="나트륨 준수율 (%)")
    protein_g: float = Field(..., ge=0, le=200, description="단백질 준수율 (%)")
    potassium_mg: float = Field(..., ge=0, le=200, description="칼륨 준수율 (%)")
    phosphorus_mg: float = Field(..., ge=0, le=200, description="인 준수율 (%)")


class DailyProgress(BaseModel):
    """Daily progress against goals"""
    date: str = Field(..., description="날짜 (YYYY-MM-DD)")
    period: AnalysisPeriod = AnalysisPeriod.DAILY
    consumed: Nutrients = Field(..., description="섭취한 영양소")
    goals: Nutrients = Field(..., description="목표 영양소")
    adherence: NutrientAdherence = Field(..., description="준수율 (%)")
    violations: List[str] = Field(default_factory=list, description="위반 항목")


class ProgressResponse(BaseModel):
    """Response with progress data"""
    success: bool = True
    progress: DailyProgress

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "progress": {
                    "date": "2025-11-27",
                    "period": "daily",
                    "consumed": {
                        "sodium_mg": 1850,
                        "protein_g": 45,
                        "potassium_mg": 1750,
                        "phosphorus_mg": 720
                    },
                    "goals": {
                        "sodium_mg": 2000,
                        "protein_g": 50,
                        "potassium_mg": 2000,
                        "phosphorus_mg": 800
                    },
                    "adherence": {
                        "sodium_mg": 92.5,
                        "protein_g": 90.0,
                        "potassium_mg": 87.5,
                        "phosphorus_mg": 90.0
                    },
                    "violations": []
                }
            }
        }


# ============================================
# Streak Models
# ============================================

class UserStreak(BaseModel):
    """User's logging streak"""
    id: Optional[str] = None
    user_id: str
    current_streak: int = Field(default=0, ge=0)
    longest_streak: int = Field(default=0, ge=0)
    last_logged_date: Optional[str] = Field(None, description="마지막 기록 날짜 (YYYY-MM-DD)")
    total_days_logged: int = Field(default=0, ge=0)


class StreakResponse(BaseModel):
    """Response with streak data"""
    success: bool = True
    streak: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "streak": {
                    "current_streak": 5,
                    "longest_streak": 12,
                    "last_logged_date": "2025-11-27",
                    "total_days_logged": 45
                }
            }
        }


# ============================================
# Session Models
# ============================================

class DietSession(BaseModel):
    """Analysis session for rate limiting"""
    id: Optional[str] = None
    user_id: str
    created_at: datetime
    expires_at: datetime
    analysis_count: int = Field(default=0, ge=0, le=10)

    @property
    def is_expired(self) -> bool:
        """Check if session has expired"""
        return datetime.utcnow() >= self.expires_at

    @property
    def can_analyze(self) -> bool:
        """Check if more analyses are allowed"""
        return not self.is_expired and self.analysis_count < 10

    @property
    def remaining_analyses(self) -> int:
        """Get remaining analysis count"""
        if self.is_expired:
            return 0
        return max(0, 10 - self.analysis_count)
