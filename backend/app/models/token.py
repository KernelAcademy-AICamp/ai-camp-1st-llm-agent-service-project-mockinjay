"""
Token system models - AI usage tokens
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TokenBalanceResponse(BaseModel):
    """Token balance response model"""
    user_id: str
    tokens: int = Field(ge=0, description="Current token balance")
    tokens_used_today: int = Field(ge=0, description="Tokens used today")
    daily_limit: int = Field(description="Daily token usage limit")
    remaining_today: int = Field(ge=0, description="Remaining tokens for today")
    last_reset_at: Optional[datetime] = Field(description="Last daily reset timestamp")


class TokenConversionRequest(BaseModel):
    """Request model for converting points to tokens"""
    points: int = Field(gt=0, description="Points to convert (must be positive)")

    class Config:
        json_schema_extra = {
            "example": {
                "points": 100
            }
        }


class TokenConversionResponse(BaseModel):
    """Token conversion response"""
    user_id: str
    points_before: int
    points_after: int
    points_used: int
    tokens_before: int
    tokens_after: int
    tokens_gained: int
    conversion_rate: int = Field(description="Points per token")
    created_at: datetime


class TokenUsageRequest(BaseModel):
    """Request model for recording token usage"""
    tokens_used: int = Field(gt=0, description="Number of tokens used")
    usage_type: str = Field(description="Type of usage (e.g., 'chat', 'summary', 'translation')")
    session_id: Optional[str] = Field(None, description="Associated session ID")


class TokenUsageResponse(BaseModel):
    """Token usage response"""
    user_id: str
    tokens_before: int
    tokens_after: int
    tokens_used: int
    usage_type: str
    created_at: datetime
    remaining_daily: int = Field(description="Remaining tokens for today")
