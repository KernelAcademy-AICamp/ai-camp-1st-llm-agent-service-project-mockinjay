from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, Optional

# Profile type literal for validation
ProfileType = Literal["general", "patient", "researcher"]

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    profile: ProfileType = "general"  # Default to "general"
    role: Literal["user", "admin"] = "user"  # Default: user

    @field_validator('profile')
    @classmethod
    def validate_profile(cls, v):
        """Validate profile type"""
        valid_profiles = ["general", "patient", "researcher"]
        if v not in valid_profiles:
            raise ValueError(f"Profile must be one of: {', '.join(valid_profiles)}")
        return v

class UserResponse(BaseModel):
    """
    User response model with Parlant integration
    Parlant 연동을 위한 사용자 응답 모델
    """
    userId: str  # MongoDB _id mapped to userId
    email: str
    name: str
    profile: ProfileType
    role: str  # "user" or "admin"
    nickname: Optional[str] = None  # User nickname (defaults to name if not set)
    profile_image: Optional[str] = None  # Profile image URL
    parlant_customer_id: Optional[str] = None  # Parlant customer ID for session management

class ProfileUpdateRequest(BaseModel):
    """Request model for updating user profile type"""
    profile: ProfileType

    @field_validator('profile')
    @classmethod
    def validate_profile(cls, v):
        """Validate profile type"""
        valid_profiles = ["general", "patient", "researcher"]
        if v not in valid_profiles:
            raise ValueError(f"Profile must be one of: {', '.join(valid_profiles)}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "profile": "patient"
            }
        }
