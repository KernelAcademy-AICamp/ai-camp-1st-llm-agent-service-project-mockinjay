"""
Gamification system models - Points and Level System
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class PointsResponse(BaseModel):
    """User points response model"""
    user_id: str
    points: int = Field(ge=0, description="Current points balance")
    level: int = Field(ge=1, le=5, description="User level (1-5)")
    level_name: str = Field(description="Level name (e.g., 'Beginner', 'Expert')")
    next_level_points: Optional[int] = Field(description="Points needed for next level")


class PointsTransactionRequest(BaseModel):
    """Request model for adding/deducting points"""
    points: int = Field(description="Points to add (positive) or deduct (negative)")
    reason: str = Field(description="Reason for the transaction")
    transaction_type: Literal[
        "quiz_completion",      # Quiz completed
        "daily_login",          # Daily login bonus
        "community_post",       # Community post created
        "community_comment",    # Community comment posted
        "community_like",       # Received a like
        "bookmark_paper",       # Bookmarked a paper
        "token_conversion",     # Converted points to tokens
        "manual_adjustment",    # Manual admin adjustment
        "other"                 # Other reasons
    ]


class PointsTransactionResponse(BaseModel):
    """Points transaction response"""
    user_id: str
    points_before: int
    points_after: int
    points_changed: int
    level_before: int
    level_after: int
    level_up: bool = Field(description="Whether user leveled up")
    reason: str
    transaction_type: str
    created_at: datetime


class PointsHistoryItem(BaseModel):
    """Single points transaction history item"""
    id: str
    user_id: str
    points_before: int
    points_after: int
    points_changed: int
    level_before: int
    level_after: int
    reason: str
    transaction_type: str
    created_at: datetime


class PointsHistoryResponse(BaseModel):
    """Points transaction history response"""
    transactions: list[PointsHistoryItem]
    total_count: int
    page: int
    page_size: int


class LevelResponse(BaseModel):
    """User level response model"""
    user_id: str
    level: int = Field(ge=1, le=5)
    level_name: str
    points: int
    min_points: int = Field(description="Minimum points for this level")
    max_points: Optional[int] = Field(description="Maximum points for this level (None for max level)")
    progress_percentage: float = Field(ge=0, le=100, description="Progress to next level")
