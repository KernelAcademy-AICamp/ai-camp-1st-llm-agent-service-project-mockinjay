"""
MyPage API Router
Handles user profile, preferences, health profile, and user data endpoints
사용자 프로필, 설정, 건강 프로필 및 사용자 데이터 엔드포인트 처리
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
import logging
from datetime import datetime

from app.services.auth import get_current_user
from app.db.connection import db
from app.models.mypage import (
    UserProfileResponse,
    UserProfileUpdateRequest,
    HealthProfileResponse,
    HealthProfileUpdateRequest,
    UserPreferencesResponse,
    UserPreferencesUpdateRequest,
    BookmarkCreateRequest,
    UserLevelResponse,
    PointsDataResponse,
    PointsHistoryResponse,
)
from app.services.mypage import (
    ProfileService,
    HealthService,
    PreferencesService,
    BookmarkService,
    PointsService,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mypage", tags=["mypage"])

# Initialize services
profile_service = ProfileService()
health_service = HealthService()
preferences_service = PreferencesService()
bookmark_service = BookmarkService()
points_service = PointsService()


# ============================================================================
# User Profile Endpoints
# ============================================================================

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile information"""
    user_id = str(current_user["_id"])
    return await profile_service.get_profile(user_id, current_user)


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile information"""
    user_id = current_user["_id"]
    return await profile_service.update_profile(
        user_id,
        full_name=profile_update.fullName,
        bio=profile_update.bio,
        profile_image=profile_update.profileImage
    )


# ============================================================================
# Health Profile Endpoints
# ============================================================================

@router.get("/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's health profile"""
    user_id = str(current_user["_id"])
    return await health_service.get_health_profile(user_id)


@router.put("/health-profile", response_model=HealthProfileResponse)
async def update_health_profile(
    health_update: HealthProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's health profile"""
    user_id = str(current_user["_id"])
    return await health_service.update_health_profile(
        user_id,
        conditions=health_update.conditions,
        allergies=health_update.allergies,
        dietary_restrictions=health_update.dietaryRestrictions,
        age=health_update.age,
        gender=health_update.gender
    )


# ============================================================================
# User Preferences Endpoints
# ============================================================================

@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(current_user: dict = Depends(get_current_user)):
    """Get current user's preferences"""
    user_id = str(current_user["_id"])
    return await preferences_service.get_preferences(user_id)


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's preferences"""
    user_id = str(current_user["_id"])
    return await preferences_service.update_preferences(
        user_id,
        theme=preferences_update.theme,
        language=preferences_update.language,
        notifications=preferences_update.notifications
    )


# ============================================================================
# Bookmarks Endpoints
# ============================================================================

@router.get("/bookmarks")
async def get_user_bookmarks(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's bookmarked papers with pagination"""
    user_id = str(current_user["_id"])
    return await bookmark_service.get_bookmarks(user_id, limit, offset)


@router.post("/bookmarks", status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    bookmark_data: BookmarkCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a paper to user's bookmarks"""
    user_id = str(current_user["_id"])
    return await bookmark_service.add_bookmark(
        user_id,
        bookmark_data.paperId,
        bookmark_data.paperData
    )


@router.delete("/bookmarks/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    paper_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a paper from user's bookmarks"""
    user_id = str(current_user["_id"])
    await bookmark_service.remove_bookmark(user_id, paper_id)
    return None


# ============================================================================
# User Posts Endpoints
# ============================================================================

@router.get("/posts")
async def get_user_posts(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's community posts with pagination"""
    try:
        posts_collection = db["posts"]
        user_id = str(current_user["_id"])

        # Validate pagination
        limit = min(max(1, limit), 50)
        offset = max(0, offset)

        # Get total count
        total_count = await posts_collection.count_documents({
            "userId": user_id,
            "isDeleted": False
        })

        # Fetch posts
        cursor = posts_collection.find({
            "userId": user_id,
            "isDeleted": False
        }).sort("createdAt", -1).skip(offset).limit(limit)
        posts = await cursor.to_list(length=limit)

        # Serialize posts
        for post in posts:
            post["id"] = str(post.pop("_id"))
            for field in ["createdAt", "updatedAt", "lastActivityAt"]:
                if field in post and isinstance(post[field], datetime):
                    post[field] = post[field].isoformat()

        return {
            "posts": posts,
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
# Level & Points Endpoints
# ============================================================================

@router.get("/level", response_model=UserLevelResponse)
async def get_user_level(current_user: dict = Depends(get_current_user)):
    """Get current user's level and XP information"""
    user_id = str(current_user["_id"])
    return await points_service.get_level(user_id)


@router.get("/points", response_model=PointsDataResponse)
async def get_user_points(current_user: dict = Depends(get_current_user)):
    """Get current user's points summary"""
    user_id = str(current_user["_id"])
    return await points_service.get_points(user_id)


@router.get("/points/history", response_model=PointsHistoryResponse)
async def get_points_history(
    limit: int = 20,
    offset: int = 0,
    type_filter: Optional[str] = None,
    source_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's points transaction history"""
    user_id = str(current_user["_id"])
    return await points_service.get_history(
        user_id,
        limit,
        offset,
        type_filter,
        source_filter
    )


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
