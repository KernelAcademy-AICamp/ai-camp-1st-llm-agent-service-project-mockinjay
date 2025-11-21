"""
Header 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends
from typing import Optional
from app.api.dependencies import get_current_user
from app.db.connection import users_collection
from app.services import notification_service
from bson import ObjectId

router = APIRouter(prefix="/api/header", tags=["header"])


@router.get("/info")
async def get_header_info(user_id: Optional[str] = Depends(get_current_user)):
    """
    Header 정보 조회
    
    로그인 상태에 따라 다른 정보 반환:
    - 로그인: 사용자 정보 + 읽지 않은 알림 개수
    - 비로그인: 로그인 상태만 반환
    
    Args:
        user_id: JWT 토큰에서 추출한 사용자 ID (선택)
        
    Returns:
        dict: Header 정보
    """
    try:
        # 사용자 정보 조회
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            # 로그인하지 않은 경우
            return {
                "success": True,
                "logged_in": False,
                "user": None,
                "unread_notifications": 0
            }
        
        # 읽지 않은 알림 개수 조회
        unread_count = notification_service.get_unread_count(user_id)
        
        # 로그인한 경우
        return {
            "success": True,
            "logged_in": True,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "nickname": user.get("nickname", user["name"]),  # nickname이 없으면 name 사용
                "profile_image": user.get("profile_image"),
                "profile": user["profile"],
                "role": user.get("role", "user")
            },
            "unread_notifications": unread_count
        }
    except Exception:
        # 토큰이 없거나 유효하지 않은 경우
        return {
            "success": True,
            "logged_in": False,
            "user": None,
            "unread_notifications": 0
        }
