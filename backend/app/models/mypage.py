"""
MyPage Pydantic Models
Request/Response models for MyPage API endpoints
마이페이지 API 엔드포인트를 위한 요청/응답 모델
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============================================================================
# User Profile Models
# ============================================================================

class UserProfileResponse(BaseModel):
    """User profile response model (사용자 프로필 응답 모델)"""
    id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username (아이디)")
    email: str = Field(..., description="Email address (이메일)")
    fullName: Optional[str] = Field(None, description="Full name (이름)")
    bio: Optional[str] = Field(None, description="User bio/description (소개)")
    profileImage: Optional[str] = Field(None, description="Profile image URL (프로필 이미지 URL)")
    profileImageUrl: Optional[str] = Field(None, description="Alias for profileImage (Frontend compatibility)")
    profile: str = Field(..., description="Profile type: general/patient/researcher")
    role: str = Field(..., description="User role: user/admin")
    createdAt: datetime = Field(..., description="Account creation date (가입일)")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "username": "testuser",
                "email": "test@example.com",
                "fullName": "홍길동",
                "bio": "건강한 삶을 추구합니다",
                "profileImage": "/uploads/profile_123.jpg",
                "profile": "patient",
                "role": "user",
                "createdAt": "2024-01-15T10:30:00Z"
            }
        }


class UserProfileUpdateRequest(BaseModel):
    """User profile update request model (사용자 프로필 수정 요청 모델)"""
    fullName: Optional[str] = Field(None, min_length=1, max_length=100, description="Full name")
    bio: Optional[str] = Field(None, max_length=500, description="User bio/description")
    profileImage: Optional[str] = Field(None, description="Profile image URL")

    class Config:
        json_schema_extra = {
            "example": {
                "fullName": "홍길동",
                "bio": "건강한 삶을 추구하는 환자입니다",
                "profileImage": "/uploads/profile_123.jpg"
            }
        }


# ============================================================================
# Health Profile Models
# ============================================================================

class HealthProfileResponse(BaseModel):
    """Health profile response model (건강 프로필 응답 모델)"""
    userId: str = Field(..., description="User ID")
    conditions: List[str] = Field(default=[], description="Health conditions (질환)")
    healthConditions: List[str] = Field(default=[], description="Alias for conditions (Frontend compatibility)")
    allergies: List[str] = Field(default=[], description="Allergies (알레르기)")
    dietaryRestrictions: List[str] = Field(default=[], description="Dietary restrictions (식이 제한)")
    age: Optional[int] = Field(None, description="Age (나이)")
    gender: Optional[str] = Field(None, description="Gender (성별): male/female/other")
    updatedAt: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "conditions": ["고혈압", "당뇨"],
                "allergies": ["땅콩", "새우"],
                "dietaryRestrictions": ["저염식", "저당식"],
                "age": 45,
                "gender": "male",
                "updatedAt": "2024-01-20T14:30:00Z"
            }
        }


class HealthProfileUpdateRequest(BaseModel):
    """Health profile update request model (건강 프로필 수정 요청 모델)"""
    conditions: Optional[List[str]] = Field(None, description="Health conditions")
    allergies: Optional[List[str]] = Field(None, description="Allergies")
    dietaryRestrictions: Optional[List[str]] = Field(None, description="Dietary restrictions")
    age: Optional[int] = Field(None, ge=1, le=150, description="Age (1-150)")
    gender: Optional[str] = Field(None, description="Gender: male/female/other")

    class Config:
        json_schema_extra = {
            "example": {
                "conditions": ["고혈압", "당뇨"],
                "allergies": ["땅콩"],
                "dietaryRestrictions": ["저염식"],
                "age": 45,
                "gender": "male"
            }
        }


# ============================================================================
# User Preferences Models
# ============================================================================

class UserPreferencesResponse(BaseModel):
    """User preferences response model (사용자 설정 응답 모델)"""
    userId: str = Field(..., description="User ID")
    theme: str = Field(default="light", description="UI theme: light/dark")
    language: str = Field(default="ko", description="Language: ko/en")
    notifications: Dict[str, bool] = Field(
        default={
            "email": True,
            "push": True,
            "community": True,
            "trends": True
        },
        description="Notification settings"
    )
    updatedAt: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "theme": "light",
                "language": "ko",
                "notifications": {
                    "email": True,
                    "push": True,
                    "community": True,
                    "trends": True
                },
                "updatedAt": "2024-01-20T14:30:00Z"
            }
        }


class UserPreferencesUpdateRequest(BaseModel):
    """User preferences update request model (사용자 설정 수정 요청 모델)"""
    theme: Optional[str] = Field(None, description="UI theme: light/dark")
    language: Optional[str] = Field(None, description="Language: ko/en")
    notifications: Optional[Dict[str, bool]] = Field(None, description="Notification settings")

    class Config:
        json_schema_extra = {
            "example": {
                "theme": "dark",
                "language": "en",
                "notifications": {
                    "email": True,
                    "push": False,
                    "community": True,
                    "trends": False
                }
            }
        }


# ============================================================================
# Bookmark Models
# ============================================================================

class BookmarkResponse(BaseModel):
    """Bookmark response model (북마크 응답 모델)"""
    id: str = Field(..., description="Bookmark ID")
    userId: str = Field(..., description="User ID")
    paperId: str = Field(..., description="Paper PMID or unique identifier")
    paperData: Dict[str, Any] = Field(..., description="Paper metadata (title, authors, abstract, etc.)")
    createdAt: datetime = Field(..., description="Bookmark creation timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "userId": "507f1f77bcf86cd799439012",
                "paperId": "12345678",
                "paperData": {
                    "title": "Research on Hypertension Treatment",
                    "authors": ["Kim, J.", "Lee, S."],
                    "abstract": "This study investigates...",
                    "pub_date": "2024-01-15"
                },
                "createdAt": "2024-01-20T10:00:00Z"
            }
        }


class BookmarkCreateRequest(BaseModel):
    """Bookmark creation request model (북마크 생성 요청 모델)"""
    paperId: str = Field(..., description="Paper PMID or unique identifier")
    paperData: Dict[str, Any] = Field(..., description="Paper metadata to store")

    class Config:
        json_schema_extra = {
            "example": {
                "paperId": "12345678",
                "paperData": {
                    "title": "Research on Hypertension Treatment",
                    "authors": ["Kim, J.", "Lee, S."],
                    "abstract": "This study investigates...",
                    "pub_date": "2024-01-15",
                    "journal": "Medical Journal"
                }
            }
        }


# ============================================================================
# Points & Level Models
# ============================================================================

class UserLevelResponse(BaseModel):
    """User level response model (사용자 레벨 응답 모델)"""
    userId: str = Field(..., description="User ID")
    level: int = Field(..., ge=1, le=5, description="Current level (1-5)")
    currentXp: int = Field(..., ge=0, description="Current XP points")
    requiredXp: int = Field(..., description="XP required for current/next level")
    title: str = Field(..., description="Level title (e.g., '새싹', '전문가')")
    nextLevelTitle: Optional[str] = Field(None, description="Next level title")
    badges: List[Dict[str, Any]] = Field(default=[], description="Earned badges")
    updatedAt: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "level": 2,
                "currentXp": 150,
                "requiredXp": 300,
                "title": "초보",
                "nextLevelTitle": "중급",
                "badges": [
                    {"id": "first_quiz", "name": "첫 퀴즈 완료", "description": "첫 퀴즈를 완료했습니다", "icon": "trophy", "earnedAt": "2024-01-15T10:00:00Z"}
                ],
                "updatedAt": "2024-01-20T14:30:00Z"
            }
        }


class PointsDataResponse(BaseModel):
    """Points data response model (포인트 데이터 응답 모델)"""
    userId: str = Field(..., description="User ID")
    totalPoints: int = Field(..., ge=0, description="Total earned points")
    availablePoints: int = Field(..., ge=0, description="Available (spendable) points")
    usedPoints: int = Field(..., ge=0, description="Used/spent points")
    updatedAt: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "totalPoints": 250,
                "availablePoints": 200,
                "usedPoints": 50,
                "updatedAt": "2024-01-20T14:30:00Z"
            }
        }


class PointsHistoryItemResponse(BaseModel):
    """Points history item response model (포인트 히스토리 항목 응답 모델)"""
    id: str = Field(..., description="Transaction ID")
    userId: str = Field(..., description="User ID")
    amount: int = Field(..., description="Points amount (positive=earn, negative=spend)")
    type: str = Field(..., description="Transaction type: earn/spend/expire")
    source: str = Field(..., description="Source of points (e.g., quiz_completion)")
    description: str = Field(..., description="Human-readable description")
    createdAt: datetime = Field(..., description="Transaction timestamp")


class PointsHistoryResponse(BaseModel):
    """Points history response model (포인트 히스토리 응답 모델)"""
    history: List[PointsHistoryItemResponse] = Field(..., description="History items")
    total: int = Field(..., description="Total count of transactions")
    limit: int = Field(..., description="Page size")
    offset: int = Field(..., description="Page offset")
    hasMore: bool = Field(..., description="Whether more items exist")
