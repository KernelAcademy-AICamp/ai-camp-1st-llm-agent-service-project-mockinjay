"""
Analytics Domain Models

Pydantic models for analytics and insights features:
- Health trends aggregation
- Nutrition adherence scoring
- Community engagement metrics
- Predictive insights
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, date
from enum import Enum


# ============================================
# Enums
# ============================================

class TrendPeriod(str, Enum):
    """Time period for trend analysis"""
    SEVEN_DAYS = "7d"
    THIRTY_DAYS = "30d"
    NINETY_DAYS = "90d"
    ONE_YEAR = "1y"
    ALL_TIME = "all"


class TrendDirection(str, Enum):
    """Trend direction"""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    FLUCTUATING = "fluctuating"


class InsightType(str, Enum):
    """Type of health insight"""
    WARNING = "warning"
    RECOMMENDATION = "recommendation"
    ACHIEVEMENT = "achievement"
    INFO = "info"


class AdherenceStatus(str, Enum):
    """Adherence quality assessment"""
    EXCELLENT = "excellent"  # >95%
    GOOD = "good"  # 85-95%
    FAIR = "fair"  # 70-85%
    POOR = "poor"  # <70%


# ============================================
# Health Trends Models
# ============================================

class MetricTrend(BaseModel):
    """Trend analysis for a single metric"""
    metric_name: str = Field(..., description="Name of the metric (e.g., 'creatinine', 'gfr')")
    current_value: float = Field(..., description="Most recent value")
    average_value: float = Field(..., description="Average over the period")
    min_value: float = Field(..., description="Minimum value in period")
    max_value: float = Field(..., description="Maximum value in period")
    trend: TrendDirection = Field(..., description="Overall trend direction")
    change_percent: float = Field(..., description="Percentage change from period start")
    data_points: int = Field(..., ge=0, description="Number of data points")
    unit: str = Field(..., description="Measurement unit")

    class Config:
        json_schema_extra = {
            "example": {
                "metric_name": "creatinine",
                "current_value": 1.8,
                "average_value": 1.75,
                "min_value": 1.6,
                "max_value": 1.9,
                "trend": "increasing",
                "change_percent": 5.7,
                "data_points": 8,
                "unit": "mg/dL"
            }
        }


class HealthTrendsRequest(BaseModel):
    """Request for health trends analysis"""
    user_id: str = Field(..., min_length=24, max_length=24)
    metrics: List[str] = Field(
        default=["creatinine", "gfr", "blood_pressure"],
        description="Metrics to include in analysis"
    )
    period: TrendPeriod = Field(default=TrendPeriod.THIRTY_DAYS)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "metrics": ["creatinine", "gfr", "blood_pressure"],
                "period": "30d"
            }
        }


class HealthInsight(BaseModel):
    """Individual health insight"""
    type: InsightType
    message: str = Field(..., max_length=500)
    action: Optional[str] = Field(None, max_length=300, description="Recommended action")
    priority: Literal["low", "medium", "high"] = "medium"
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "type": "warning",
                "message": "GFR has decreased 4.5% in the past month",
                "action": "Schedule follow-up with nephrologist",
                "priority": "high",
                "metadata": {
                    "metric": "gfr",
                    "change": -4.5
                }
            }
        }


class HealthTrendsResponse(BaseModel):
    """Response with health trends analysis"""
    success: bool = True
    user_id: str
    period: str
    start_date: date
    end_date: date
    trends: Dict[str, MetricTrend] = Field(
        default_factory=dict,
        description="Trend analysis for each requested metric"
    )
    insights: List[HealthInsight] = Field(
        default_factory=list,
        description="Actionable insights derived from trends"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "user_id": "507f1f77bcf86cd799439011",
                "period": "30d",
                "start_date": "2025-10-29",
                "end_date": "2025-11-28",
                "trends": {
                    "creatinine": {
                        "current_value": 1.8,
                        "average_value": 1.75,
                        "trend": "increasing",
                        "change_percent": 5.7,
                        "data_points": 8,
                        "unit": "mg/dL"
                    }
                },
                "insights": [
                    {
                        "type": "warning",
                        "message": "GFR has decreased 4.5% in the past month",
                        "action": "Schedule follow-up with nephrologist",
                        "priority": "high"
                    }
                ]
            }
        }


# ============================================
# Nutrition Adherence Models
# ============================================

class NutrientAdherence(BaseModel):
    """Adherence metrics for a single nutrient"""
    nutrient_name: str = Field(..., description="Nutrient name (e.g., 'sodium')")
    adherence_percent: float = Field(..., ge=0, le=200, description="Adherence percentage")
    avg_intake: float = Field(..., ge=0, description="Average daily intake")
    goal: float = Field(..., ge=0, description="Target goal")
    status: AdherenceStatus = Field(..., description="Adherence quality")
    days_within_goal: int = Field(..., ge=0, description="Number of days within target")
    total_days: int = Field(..., ge=0, description="Total days tracked")
    unit: str = Field(..., description="Measurement unit")

    class Config:
        json_schema_extra = {
            "example": {
                "nutrient_name": "sodium",
                "adherence_percent": 92.0,
                "avg_intake": 1850,
                "goal": 2000,
                "status": "excellent",
                "days_within_goal": 26,
                "total_days": 30,
                "unit": "mg"
            }
        }


class LoggingStreak(BaseModel):
    """User's meal logging streak"""
    current_streak: int = Field(..., ge=0, description="Current consecutive days")
    longest_streak: int = Field(..., ge=0, description="Longest streak ever")
    total_days_logged: int = Field(..., ge=0, description="Total days with at least one log")
    last_logged_date: Optional[date] = None

    class Config:
        json_schema_extra = {
            "example": {
                "current_streak": 15,
                "longest_streak": 28,
                "total_days_logged": 180,
                "last_logged_date": "2025-11-28"
            }
        }


class NutritionAdherenceRequest(BaseModel):
    """Request for nutrition adherence analysis"""
    user_id: str = Field(..., min_length=24, max_length=24)
    period: TrendPeriod = Field(default=TrendPeriod.THIRTY_DAYS)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "period": "30d"
            }
        }


class NutritionAdherenceResponse(BaseModel):
    """Response with nutrition adherence analysis"""
    success: bool = True
    user_id: str
    period: str
    start_date: date
    end_date: date
    overall_adherence_score: float = Field(..., ge=0, le=100, description="Overall adherence score")
    breakdown: Dict[str, NutrientAdherence] = Field(
        default_factory=dict,
        description="Adherence breakdown by nutrient"
    )
    logging_streak: LoggingStreak
    insights: List[HealthInsight] = Field(
        default_factory=list,
        description="Nutrition-related insights"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "user_id": "507f1f77bcf86cd799439011",
                "period": "30d",
                "start_date": "2025-10-29",
                "end_date": "2025-11-28",
                "overall_adherence_score": 87.5,
                "breakdown": {
                    "sodium": {
                        "adherence_percent": 92.0,
                        "avg_intake": 1850,
                        "goal": 2000,
                        "status": "excellent",
                        "days_within_goal": 26,
                        "total_days": 30,
                        "unit": "mg"
                    }
                },
                "logging_streak": {
                    "current_streak": 15,
                    "longest_streak": 28,
                    "total_days_logged": 180
                },
                "insights": [
                    {
                        "type": "achievement",
                        "message": "Great job! You've maintained excellent sodium control for 26 out of 30 days",
                        "priority": "low"
                    }
                ]
            }
        }


# ============================================
# Community Engagement Models
# ============================================

class CommunityMetrics(BaseModel):
    """User's community engagement metrics"""
    posts_created: int = Field(..., ge=0, description="Total posts created")
    comments_made: int = Field(..., ge=0, description="Total comments")
    likes_received: int = Field(..., ge=0, description="Likes on user's posts")
    likes_given: int = Field(..., ge=0, description="Likes user gave")
    bookmarks_saved: int = Field(..., ge=0, description="Research papers bookmarked")
    engagement_score: float = Field(..., ge=0, le=100, description="Overall engagement score")
    rank: Optional[int] = Field(None, ge=1, description="Rank among all users")
    percentile: Optional[float] = Field(None, ge=0, le=100, description="Percentile ranking")

    class Config:
        json_schema_extra = {
            "example": {
                "posts_created": 24,
                "comments_made": 87,
                "likes_received": 142,
                "likes_given": 203,
                "bookmarks_saved": 15,
                "engagement_score": 78.5,
                "rank": 42,
                "percentile": 85.3
            }
        }


class CommunityEngagementRequest(BaseModel):
    """Request for community engagement metrics"""
    user_id: str = Field(..., min_length=24, max_length=24)
    period: TrendPeriod = Field(default=TrendPeriod.THIRTY_DAYS)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "period": "30d"
            }
        }


class CommunityEngagementResponse(BaseModel):
    """Response with community engagement metrics"""
    success: bool = True
    user_id: str
    period: str
    metrics: CommunityMetrics
    trending_topics: List[str] = Field(default_factory=list, description="Topics user engaged with")
    recommendations: List[str] = Field(default_factory=list, description="Recommended actions")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "user_id": "507f1f77bcf86cd799439011",
                "period": "30d",
                "metrics": {
                    "posts_created": 24,
                    "comments_made": 87,
                    "engagement_score": 78.5
                },
                "trending_topics": ["diet", "medication", "exercise"],
                "recommendations": [
                    "Try posting in the 'Exercise & CKD' forum",
                    "Check out the latest research on kidney-friendly recipes"
                ]
            }
        }


# ============================================
# Predictive Insights Models
# ============================================

class RiskFactor(BaseModel):
    """Individual risk factor"""
    factor_name: str = Field(..., max_length=200)
    severity: Literal["low", "medium", "high", "critical"]
    description: str = Field(..., max_length=500)
    recommendation: Optional[str] = Field(None, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "factor_name": "Declining GFR",
                "severity": "medium",
                "description": "GFR has decreased 4.5% over the past month",
                "recommendation": "Schedule follow-up with nephrologist within 2 weeks"
            }
        }


class ProgressionRiskAssessment(BaseModel):
    """CKD progression risk assessment"""
    risk_level: Literal["low", "moderate", "high", "very_high"]
    risk_score: float = Field(..., ge=0, le=100, description="Calculated risk score")
    risk_factors: List[RiskFactor] = Field(
        default_factory=list,
        description="Identified risk factors"
    )
    protective_factors: List[str] = Field(
        default_factory=list,
        description="Positive factors"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Action items"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "risk_level": "moderate",
                "risk_score": 45.0,
                "risk_factors": [
                    {
                        "factor_name": "Declining GFR",
                        "severity": "medium",
                        "description": "GFR has decreased 4.5% over the past month"
                    }
                ],
                "protective_factors": [
                    "Excellent medication adherence (95%)",
                    "Well-controlled blood pressure"
                ],
                "recommendations": [
                    "Continue current medication regimen",
                    "Schedule follow-up with nephrologist within 2 weeks",
                    "Increase monitoring of GFR to bi-weekly"
                ]
            }
        }


class PredictiveInsightsRequest(BaseModel):
    """Request for predictive insights"""
    user_id: str = Field(..., min_length=24, max_length=24)
    lookback_period: TrendPeriod = Field(
        default=TrendPeriod.NINETY_DAYS,
        description="Historical data period for prediction"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "lookback_period": "90d"
            }
        }


class PredictiveInsightsResponse(BaseModel):
    """Response with predictive insights"""
    success: bool = True
    user_id: str
    generated_at: datetime
    progression_risk: ProgressionRiskAssessment
    next_review_date: date = Field(..., description="Recommended date for next assessment")
    disclaimer: str = Field(
        default="This assessment is for informational purposes only and does not replace medical advice. "
                "Always consult with your healthcare provider.",
        description="Medical disclaimer"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "user_id": "507f1f77bcf86cd799439011",
                "generated_at": "2025-11-28T12:00:00Z",
                "progression_risk": {
                    "risk_level": "moderate",
                    "risk_score": 45.0,
                    "risk_factors": [],
                    "protective_factors": [],
                    "recommendations": []
                },
                "next_review_date": "2025-12-28",
                "disclaimer": "This assessment is for informational purposes only..."
            }
        }


# ============================================
# Analytics Dashboard Models
# ============================================

class AnalyticsDashboard(BaseModel):
    """Comprehensive analytics dashboard data"""
    user_id: str
    generated_at: datetime
    health_trends_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Summary of key health trends"
    )
    nutrition_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Nutrition adherence summary"
    )
    community_summary: Optional[CommunityMetrics] = None
    recent_insights: List[HealthInsight] = Field(
        default_factory=list,
        max_items=10,
        description="Most recent/important insights"
    )
    upcoming_reminders: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Upcoming medication/lab reminders"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "generated_at": "2025-11-28T12:00:00Z",
                "health_trends_summary": {
                    "creatinine": {"trend": "increasing", "change": 5.7},
                    "gfr": {"trend": "decreasing", "change": -4.5}
                },
                "nutrition_summary": {
                    "overall_adherence": 87.5,
                    "current_streak": 15
                },
                "community_summary": {
                    "posts_created": 24,
                    "engagement_score": 78.5
                },
                "recent_insights": [],
                "upcoming_reminders": [
                    {
                        "type": "medication",
                        "title": "Take Furosemide",
                        "scheduled_time": "2025-11-28T21:00:00Z"
                    }
                ]
            }
        }


class AnalyticsDashboardRequest(BaseModel):
    """Request for analytics dashboard"""
    user_id: str = Field(..., min_length=24, max_length=24)
    include_community: bool = Field(default=True, description="Include community metrics")
    include_predictions: bool = Field(default=False, description="Include predictive insights")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "include_community": True,
                "include_predictions": False
            }
        }


class AnalyticsDashboardResponse(BaseModel):
    """Response with analytics dashboard data"""
    success: bool = True
    dashboard: AnalyticsDashboard

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "dashboard": {
                    "user_id": "507f1f77bcf86cd799439011",
                    "generated_at": "2025-11-28T12:00:00Z",
                    "health_trends_summary": {},
                    "nutrition_summary": {},
                    "recent_insights": []
                }
            }
        }
