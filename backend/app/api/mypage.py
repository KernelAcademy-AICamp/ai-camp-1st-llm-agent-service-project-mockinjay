"""
MyPage API Router
Handles user profile, preferences, health profile, and user data endpoints
사용자 프로필, 설정, 건강 프로필 및 사용자 데이터 엔드포인트 처리
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

from app.services.auth import get_current_user
from app.db.connection import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mypage", tags=["mypage"])


# ============================================================================
# Pydantic Models (Request/Response)
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
# Helper Functions (헬퍼 함수)
# ============================================================================

def serialize_object_id(doc: dict) -> dict:
    """
    Convert MongoDB _id to string 'id' field
    MongoDB _id를 문자열 'id' 필드로 변환
    """
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def serialize_datetime(doc: dict, fields: List[str]) -> dict:
    """
    Convert datetime objects to ISO format strings
    datetime 객체를 ISO 형식 문자열로 변환
    """
    if doc:
        for field in fields:
            if field in doc and isinstance(doc[field], datetime):
                doc[field] = doc[field].isoformat()
    return doc


# ============================================================================
# User Profile Endpoints (프로필 관리)
# ============================================================================

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's profile information
    현재 사용자의 프로필 정보 조회

    Returns:
        UserProfileResponse: User profile data including id, username, email, fullName, bio, profileImage, etc.

    Raises:
        HTTPException: 404 if user not found (사용자를 찾을 수 없음)
    """
    try:
        user_id = str(current_user["_id"])

        # Return user profile data (with alias fields for Frontend compatibility)
        profile_image = current_user.get("profileImage")
        profile_data = {
            "id": user_id,
            "username": current_user.get("username", ""),
            "email": current_user.get("email", ""),
            "fullName": current_user.get("fullName"),
            "bio": current_user.get("bio"),
            "profileImage": profile_image,
            "profileImageUrl": profile_image,  # Alias for Frontend
            "profile": current_user.get("profile", "general"),
            "role": current_user.get("role", "user"),
            "createdAt": current_user.get("created_at", datetime.utcnow())
        }

        return profile_data

    except Exception as e:
        logger.error(f"Error fetching user profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 조회 중 오류가 발생했습니다"
        )


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile information
    현재 사용자의 프로필 정보 수정

    Args:
        profile_update: Profile fields to update (fullName, bio, profileImage)

    Returns:
        UserProfileResponse: Updated user profile

    Raises:
        HTTPException: 404 if user not found, 500 for internal errors
    """
    try:
        users_collection = db["users"]
        user_id = current_user["_id"]

        # Build update document (only include fields that are provided)
        update_doc = {}
        if profile_update.fullName is not None:
            update_doc["fullName"] = profile_update.fullName
        if profile_update.bio is not None:
            update_doc["bio"] = profile_update.bio
        if profile_update.profileImage is not None:
            update_doc["profileImage"] = profile_update.profileImage

        if not update_doc:
            # No fields to update
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="수정할 필드가 없습니다"
            )

        # Add updated timestamp
        update_doc["updated_at"] = datetime.utcnow()

        # Update user document
        result = await users_collection.update_one(
            {"_id": user_id},
            {"$set": update_doc}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )

        # Fetch updated user
        updated_user = await users_collection.find_one({"_id": user_id})
        profile_image = updated_user.get("profileImage")

        profile_data = {
            "id": str(updated_user["_id"]),
            "username": updated_user.get("username", ""),
            "email": updated_user.get("email", ""),
            "fullName": updated_user.get("fullName"),
            "bio": updated_user.get("bio"),
            "profileImage": profile_image,
            "profileImageUrl": profile_image,  # Alias for Frontend
            "profile": updated_user.get("profile", "general"),
            "role": updated_user.get("role", "user"),
            "createdAt": updated_user.get("created_at", datetime.utcnow())
        }

        logger.info(f"User profile updated: {str(user_id)}")
        return profile_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 수정 중 오류가 발생했습니다"
        )


# ============================================================================
# Health Profile Endpoints (건강 프로필 관리)
# ============================================================================

@router.get("/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's health profile
    현재 사용자의 건강 프로필 조회

    Returns:
        HealthProfileResponse: Health profile including conditions, allergies, dietary restrictions, age, gender

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        health_profiles_collection = db["health_profiles"]
        user_id = str(current_user["_id"])

        # Find health profile for this user
        health_profile = await health_profiles_collection.find_one({"userId": user_id})

        if not health_profile:
            # Return default empty health profile if not found
            return HealthProfileResponse(
                userId=user_id,
                conditions=[],
                healthConditions=[],  # Alias for Frontend
                allergies=[],
                dietaryRestrictions=[],
                age=None,
                gender=None,
                updatedAt=None
            )

        # Serialize and return
        health_profile = serialize_object_id(health_profile)
        health_profile = serialize_datetime(health_profile, ["updatedAt"])

        # Add healthConditions alias for Frontend compatibility
        conditions = health_profile.get("conditions", [])
        health_profile["healthConditions"] = conditions

        return HealthProfileResponse(**health_profile)

    except Exception as e:
        logger.error(f"Error fetching health profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="건강 프로필 조회 중 오류가 발생했습니다"
        )


@router.put("/health-profile", response_model=HealthProfileResponse)
async def update_health_profile(
    health_update: HealthProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's health profile (creates if not exists)
    현재 사용자의 건강 프로필 수정 (없으면 생성)

    Args:
        health_update: Health profile fields to update

    Returns:
        HealthProfileResponse: Updated health profile

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        health_profiles_collection = db["health_profiles"]
        user_id = str(current_user["_id"])

        # Build update document
        update_doc = {"userId": user_id, "updatedAt": datetime.utcnow()}

        if health_update.conditions is not None:
            update_doc["conditions"] = health_update.conditions
        if health_update.allergies is not None:
            update_doc["allergies"] = health_update.allergies
        if health_update.dietaryRestrictions is not None:
            update_doc["dietaryRestrictions"] = health_update.dietaryRestrictions
        if health_update.age is not None:
            update_doc["age"] = health_update.age
        if health_update.gender is not None:
            update_doc["gender"] = health_update.gender

        # Upsert (update if exists, create if not)
        await health_profiles_collection.update_one(
            {"userId": user_id},
            {"$set": update_doc},
            upsert=True
        )

        # Fetch updated profile
        updated_profile = await health_profiles_collection.find_one({"userId": user_id})
        updated_profile = serialize_object_id(updated_profile)
        updated_profile = serialize_datetime(updated_profile, ["updatedAt"])

        # Add healthConditions alias for Frontend compatibility
        conditions = updated_profile.get("conditions", [])
        updated_profile["healthConditions"] = conditions

        logger.info(f"Health profile updated for user: {user_id}")
        return HealthProfileResponse(**updated_profile)

    except Exception as e:
        logger.error(f"Error updating health profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="건강 프로필 수정 중 오류가 발생했습니다"
        )


# ============================================================================
# User Preferences Endpoints (사용자 설정 관리)
# ============================================================================

@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(current_user: dict = Depends(get_current_user)):
    """
    Get current user's preferences (theme, language, notifications)
    현재 사용자의 설정 조회 (테마, 언어, 알림)

    Returns:
        UserPreferencesResponse: User preferences

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        preferences_collection = db["user_preferences"]
        user_id = str(current_user["_id"])

        # Find preferences for this user
        preferences = await preferences_collection.find_one({"userId": user_id})

        if not preferences:
            # Return default preferences if not found
            return UserPreferencesResponse(
                userId=user_id,
                theme="light",
                language="ko",
                notifications={
                    "email": True,
                    "push": True,
                    "community": True,
                    "trends": True
                },
                updatedAt=None
            )

        # Serialize and return
        preferences = serialize_object_id(preferences)
        preferences = serialize_datetime(preferences, ["updatedAt"])

        return UserPreferencesResponse(**preferences)

    except Exception as e:
        logger.error(f"Error fetching user preferences: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 설정 조회 중 오류가 발생했습니다"
        )


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's preferences (creates if not exists)
    현재 사용자의 설정 수정 (없으면 생성)

    Args:
        preferences_update: Preference fields to update

    Returns:
        UserPreferencesResponse: Updated preferences

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        preferences_collection = db["user_preferences"]
        user_id = str(current_user["_id"])

        # Build update document
        update_doc = {"userId": user_id, "updatedAt": datetime.utcnow()}

        if preferences_update.theme is not None:
            update_doc["theme"] = preferences_update.theme
        if preferences_update.language is not None:
            update_doc["language"] = preferences_update.language
        if preferences_update.notifications is not None:
            update_doc["notifications"] = preferences_update.notifications

        # Upsert (update if exists, create if not)
        await preferences_collection.update_one(
            {"userId": user_id},
            {"$set": update_doc},
            upsert=True
        )

        # Fetch updated preferences
        updated_preferences = await preferences_collection.find_one({"userId": user_id})
        updated_preferences = serialize_object_id(updated_preferences)
        updated_preferences = serialize_datetime(updated_preferences, ["updatedAt"])

        logger.info(f"User preferences updated for user: {user_id}")
        return UserPreferencesResponse(**updated_preferences)

    except Exception as e:
        logger.error(f"Error updating user preferences: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 설정 수정 중 오류가 발생했습니다"
        )


# ============================================================================
# Bookmarks Endpoints (북마크 관리)
# ============================================================================

@router.get("/bookmarks")
async def get_user_bookmarks(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's bookmarked papers with pagination
    현재 사용자의 북마크된 논문 조회 (페이지네이션 지원)

    Args:
        limit: Number of bookmarks to return (default: 20, max: 50)
        offset: Number of bookmarks to skip (default: 0)

    Returns:
        dict: Contains bookmarks list, total count, limit, and offset

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        bookmarks_collection = db["bookmarks"]
        user_id = str(current_user["_id"])

        # Validate pagination parameters
        limit = min(max(1, limit), 50)  # Clamp between 1 and 50
        offset = max(0, offset)

        # Get total count
        total_count = await bookmarks_collection.count_documents({"userId": user_id})

        # Fetch bookmarks with pagination
        cursor = bookmarks_collection.find({"userId": user_id}).sort("createdAt", -1).skip(offset).limit(limit)
        bookmarks = await cursor.to_list(length=limit)

        # Serialize bookmarks
        serialized_bookmarks = []
        for bookmark in bookmarks:
            bookmark = serialize_object_id(bookmark)
            bookmark = serialize_datetime(bookmark, ["createdAt"])
            serialized_bookmarks.append(bookmark)

        return {
            "bookmarks": serialized_bookmarks,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "hasMore": (offset + limit) < total_count
        }

    except Exception as e:
        logger.error(f"Error fetching user bookmarks: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="북마크 조회 중 오류가 발생했습니다"
        )


@router.post("/bookmarks", status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    bookmark_data: BookmarkCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Add a paper to user's bookmarks
    논문을 사용자의 북마크에 추가

    Args:
        bookmark_data: Paper ID and metadata to bookmark

    Returns:
        dict: Created bookmark with id

    Raises:
        HTTPException: 400 if already bookmarked, 500 for internal errors
    """
    try:
        bookmarks_collection = db["bookmarks"]
        user_id = str(current_user["_id"])

        # Check if already bookmarked
        existing = await bookmarks_collection.find_one({
            "userId": user_id,
            "paperId": bookmark_data.paperId
        })

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 북마크된 논문입니다"
            )

        # Create bookmark document
        bookmark_doc = {
            "userId": user_id,
            "paperId": bookmark_data.paperId,
            "paperData": bookmark_data.paperData,
            "createdAt": datetime.utcnow()
        }

        # Insert to database
        result = await bookmarks_collection.insert_one(bookmark_doc)

        # Fetch and return created bookmark
        created_bookmark = await bookmarks_collection.find_one({"_id": result.inserted_id})
        created_bookmark = serialize_object_id(created_bookmark)
        created_bookmark = serialize_datetime(created_bookmark, ["createdAt"])

        logger.info(f"Bookmark created for user {user_id}: paper {bookmark_data.paperId}")
        return created_bookmark

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating bookmark: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="북마크 추가 중 오류가 발생했습니다"
        )


@router.delete("/bookmarks/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    paper_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove a paper from user's bookmarks
    사용자의 북마크에서 논문 제거

    Args:
        paper_id: Paper ID (PMID or unique identifier) to remove from bookmarks

    Returns:
        None (204 No Content)

    Raises:
        HTTPException: 404 if bookmark not found, 500 for internal errors
    """
    try:
        bookmarks_collection = db["bookmarks"]
        user_id = str(current_user["_id"])

        # Delete bookmark
        result = await bookmarks_collection.delete_one({
            "userId": user_id,
            "paperId": paper_id
        })

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="북마크를 찾을 수 없습니다"
            )

        logger.info(f"Bookmark deleted for user {user_id}: paper {paper_id}")
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bookmark: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="북마크 삭제 중 오류가 발생했습니다"
        )


# ============================================================================
# User Posts Endpoints (사용자 게시글 조회)
# ============================================================================

@router.get("/posts")
async def get_user_posts(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's community posts with pagination
    현재 사용자의 커뮤니티 게시글 조회 (페이지네이션 지원)

    Args:
        limit: Number of posts to return (default: 20, max: 50)
        offset: Number of posts to skip (default: 0)

    Returns:
        dict: Contains posts list, total count, limit, and offset

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        posts_collection = db["posts"]
        user_id = str(current_user["_id"])

        # Validate pagination parameters
        limit = min(max(1, limit), 50)  # Clamp between 1 and 50
        offset = max(0, offset)

        # Get total count of user's non-deleted posts
        total_count = await posts_collection.count_documents({
            "userId": user_id,
            "isDeleted": False
        })

        # Fetch posts with pagination
        cursor = posts_collection.find({
            "userId": user_id,
            "isDeleted": False
        }).sort("createdAt", -1).skip(offset).limit(limit)
        posts = await cursor.to_list(length=limit)

        # Serialize posts
        serialized_posts = []
        for post in posts:
            post["id"] = str(post.pop("_id"))
            # Convert datetime to ISO string
            for field in ["createdAt", "updatedAt", "lastActivityAt"]:
                if field in post and isinstance(post[field], datetime):
                    post[field] = post[field].isoformat()
            serialized_posts.append(post)

        return {
            "posts": serialized_posts,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "hasMore": (offset + limit) < total_count
        }

    except Exception as e:
        logger.error(f"Error fetching user posts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="게시글 조회 중 오류가 발생했습니다"
        )


# ============================================================================
# Health Check Endpoint
# ============================================================================

# ============================================================================
# Level & Points Endpoints (레벨 & 포인트 시스템)
# ============================================================================

# Level system configuration (레벨 시스템 설정)
LEVEL_CONFIG = [
    {"level": 1, "name": "새싹", "min_xp": 0, "max_xp": 100},
    {"level": 2, "name": "초보", "min_xp": 100, "max_xp": 300},
    {"level": 3, "name": "중급", "min_xp": 300, "max_xp": 600},
    {"level": 4, "name": "고수", "min_xp": 600, "max_xp": 1000},
    {"level": 5, "name": "전문가", "min_xp": 1000, "max_xp": None},  # Max level
]

# Points earned by action type (행동별 포인트 획득량)
POINTS_BY_ACTION = {
    "quiz_completion": 10,
    "daily_login": 5,
    "community_post": 15,
    "community_comment": 5,
    "community_like_received": 2,
    "bookmark_paper": 3,
    "diet_log": 10,
    "health_check": 5,
}


def calculate_level_from_xp(xp: int) -> dict:
    """
    Calculate user level from XP points
    XP 포인트로부터 사용자 레벨 계산
    """
    for i, config in enumerate(LEVEL_CONFIG):
        if config["max_xp"] is None or xp < config["max_xp"]:
            next_level = LEVEL_CONFIG[i + 1] if i + 1 < len(LEVEL_CONFIG) else None
            return {
                "level": config["level"],
                "title": config["name"],
                "min_xp": config["min_xp"],
                "max_xp": config["max_xp"],
                "next_level_title": next_level["name"] if next_level else None,
                "required_xp": config["max_xp"] if config["max_xp"] else config["min_xp"]
            }
    # Default to max level
    return {
        "level": 5,
        "title": "전문가",
        "min_xp": 1000,
        "max_xp": None,
        "next_level_title": None,
        "required_xp": 1000
    }


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


@router.get("/level", response_model=UserLevelResponse)
async def get_user_level(current_user: dict = Depends(get_current_user)):
    """
    Get current user's level and XP information
    현재 사용자의 레벨 및 경험치 정보 조회

    Returns:
        UserLevelResponse: Level data including XP, title, badges

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        user_levels_collection = db["user_levels"]
        badges_collection = db["user_badges"]
        user_id = str(current_user["_id"])

        # Find or create user level data
        user_level = await user_levels_collection.find_one({"userId": user_id})

        if not user_level:
            # Create default level data for new users
            default_level = {
                "userId": user_id,
                "currentXp": 0,
                "totalXp": 0,
                "level": 1,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            await user_levels_collection.insert_one(default_level)
            user_level = default_level

        # Calculate level info from XP
        current_xp = user_level.get("currentXp", 0)
        level_info = calculate_level_from_xp(current_xp)

        # Fetch user badges
        badges_cursor = badges_collection.find({"userId": user_id}).sort("earnedAt", -1)
        badges = await badges_cursor.to_list(length=50)

        serialized_badges = []
        for badge in badges:
            serialized_badges.append({
                "id": badge.get("badgeId", str(badge.get("_id", ""))),
                "name": badge.get("name", ""),
                "description": badge.get("description", ""),
                "icon": badge.get("icon", "award"),
                "earnedAt": badge.get("earnedAt", datetime.utcnow()).isoformat() if isinstance(badge.get("earnedAt"), datetime) else badge.get("earnedAt", "")
            })

        return UserLevelResponse(
            userId=user_id,
            level=level_info["level"],
            currentXp=current_xp,
            requiredXp=level_info["required_xp"],
            title=level_info["title"],
            nextLevelTitle=level_info["next_level_title"],
            badges=serialized_badges,
            updatedAt=user_level.get("updatedAt")
        )

    except Exception as e:
        logger.error(f"Error fetching user level: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="레벨 정보 조회 중 오류가 발생했습니다"
        )


@router.get("/points", response_model=PointsDataResponse)
async def get_user_points(current_user: dict = Depends(get_current_user)):
    """
    Get current user's points summary
    현재 사용자의 포인트 요약 조회

    Returns:
        PointsDataResponse: Points summary including total, available, used

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        user_points_collection = db["user_points"]
        user_id = str(current_user["_id"])

        # Find or create user points data
        user_points = await user_points_collection.find_one({"userId": user_id})

        if not user_points:
            # Create default points data for new users
            default_points = {
                "userId": user_id,
                "totalPoints": 0,
                "availablePoints": 0,
                "usedPoints": 0,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            await user_points_collection.insert_one(default_points)
            user_points = default_points

        return PointsDataResponse(
            userId=user_id,
            totalPoints=user_points.get("totalPoints", 0),
            availablePoints=user_points.get("availablePoints", 0),
            usedPoints=user_points.get("usedPoints", 0),
            updatedAt=user_points.get("updatedAt")
        )

    except Exception as e:
        logger.error(f"Error fetching user points: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="포인트 정보 조회 중 오류가 발생했습니다"
        )


@router.get("/points/history", response_model=PointsHistoryResponse)
async def get_points_history(
    limit: int = 20,
    offset: int = 0,
    type_filter: Optional[str] = None,
    source_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's points transaction history
    현재 사용자의 포인트 거래 내역 조회

    Args:
        limit: Number of items to return (default: 20, max: 50)
        offset: Number of items to skip (default: 0)
        type_filter: Filter by type: earn/spend/expire (optional)
        source_filter: Filter by source (optional)

    Returns:
        PointsHistoryResponse: History items with pagination

    Raises:
        HTTPException: 500 for internal errors
    """
    try:
        points_history_collection = db["points_history"]
        user_id = str(current_user["_id"])

        # Validate pagination parameters
        limit = min(max(1, limit), 50)
        offset = max(0, offset)

        # Build query
        query = {"userId": user_id}
        if type_filter and type_filter in ["earn", "spend", "expire"]:
            query["type"] = type_filter
        if source_filter:
            query["source"] = source_filter

        # Get total count
        total_count = await points_history_collection.count_documents(query)

        # Fetch history with pagination
        cursor = points_history_collection.find(query).sort("createdAt", -1).skip(offset).limit(limit)
        history_items = await cursor.to_list(length=limit)

        # Serialize history items
        serialized_history = []
        for item in history_items:
            serialized_history.append(PointsHistoryItemResponse(
                id=str(item.get("_id", "")),
                userId=item.get("userId", user_id),
                amount=item.get("amount", 0),
                type=item.get("type", "earn"),
                source=item.get("source", "unknown"),
                description=item.get("description", ""),
                createdAt=item.get("createdAt", datetime.utcnow())
            ))

        return PointsHistoryResponse(
            history=serialized_history,
            total=total_count,
            limit=limit,
            offset=offset,
            hasMore=(offset + limit) < total_count
        )

    except Exception as e:
        logger.error(f"Error fetching points history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="포인트 내역 조회 중 오류가 발생했습니다"
        )


# ============================================================================
# Internal Points Service Functions (내부 포인트 서비스 함수)
# ============================================================================

async def add_points_to_user(
    user_id: str,
    amount: int,
    source: str,
    description: str
) -> dict:
    """
    Add points to a user and record the transaction
    사용자에게 포인트 추가 및 거래 기록

    This is an internal function for use by other modules.

    Args:
        user_id: User ID
        amount: Points to add (positive) or deduct (negative)
        source: Source of points (e.g., 'quiz_completion')
        description: Human-readable description

    Returns:
        dict: Updated points data
    """
    user_points_collection = db["user_points"]
    points_history_collection = db["points_history"]
    user_levels_collection = db["user_levels"]

    # Determine transaction type
    tx_type = "earn" if amount > 0 else "spend" if amount < 0 else "expire"

    # Update user points
    user_points = await user_points_collection.find_one({"userId": user_id})
    if not user_points:
        user_points = {
            "userId": user_id,
            "totalPoints": 0,
            "availablePoints": 0,
            "usedPoints": 0,
            "createdAt": datetime.utcnow()
        }

    if amount > 0:
        user_points["totalPoints"] = user_points.get("totalPoints", 0) + amount
        user_points["availablePoints"] = user_points.get("availablePoints", 0) + amount
    else:
        user_points["availablePoints"] = max(0, user_points.get("availablePoints", 0) + amount)
        user_points["usedPoints"] = user_points.get("usedPoints", 0) + abs(amount)

    user_points["updatedAt"] = datetime.utcnow()

    await user_points_collection.update_one(
        {"userId": user_id},
        {"$set": user_points},
        upsert=True
    )

    # Record transaction history
    history_item = {
        "userId": user_id,
        "amount": amount,
        "type": tx_type,
        "source": source,
        "description": description,
        "createdAt": datetime.utcnow()
    }
    await points_history_collection.insert_one(history_item)

    # Update XP for leveling (1 point = 1 XP for earn transactions)
    if amount > 0:
        user_level = await user_levels_collection.find_one({"userId": user_id})
        if not user_level:
            user_level = {
                "userId": user_id,
                "currentXp": 0,
                "level": 1,
                "createdAt": datetime.utcnow()
            }

        user_level["currentXp"] = user_level.get("currentXp", 0) + amount
        level_info = calculate_level_from_xp(user_level["currentXp"])
        user_level["level"] = level_info["level"]
        user_level["updatedAt"] = datetime.utcnow()

        await user_levels_collection.update_one(
            {"userId": user_id},
            {"$set": user_level},
            upsert=True
        )

    logger.info(f"Points updated for user {user_id}: {amount} ({source})")
    return user_points


# ============================================================================
# Health Check Endpoint
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint for MyPage API"""
    return {
        "status": "healthy",
        "service": "mypage_api",
        "endpoints": {
            "profile": "ready",
            "health_profile": "ready",
            "preferences": "ready",
            "bookmarks": "ready",
            "posts": "ready",
            "level": "ready",
            "points": "ready",
            "points_history": "ready"
        }
    }
