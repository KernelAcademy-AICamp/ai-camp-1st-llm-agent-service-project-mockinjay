"""
알림 서비스 비즈니스 로직
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.db.connection import get_notifications_collection, get_notification_settings_collection
from app.models.notification import NotificationCreate, NotificationResponse, NotificationSettings


async def create_notification(notification: NotificationCreate) -> str:
    """
    새 알림 생성

    Args:
        notification: 알림 생성 데이터

    Returns:
        str: 생성된 알림 ID
    """
    notification_doc = {
        "user_id": notification.user_id,
        "type": notification.type,
        "message": notification.message,
        "link": notification.link,
        "read_status": notification.read_status,
        "created_at": datetime.utcnow()
    }

    result = await get_notifications_collection().insert_one(notification_doc)
    return str(result.inserted_id)


async def get_user_notifications(user_id: str, page: int = 1, page_size: int = 20) -> List[Dict[str, Any]]:
    """
    사용자의 알림 목록 조회 (페이지네이션)

    Args:
        user_id: 사용자 ID
        page: 페이지 번호 (1부터 시작)
        page_size: 페이지당 항목 수

    Returns:
        List[Dict]: 알림 목록
    """
    skip = (page - 1) * page_size

    cursor = get_notifications_collection().find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(page_size)

    notifications = await cursor.to_list(length=page_size)

    result = []
    for notif in notifications:
        result.append({
            "id": str(notif["_id"]),
            "user_id": notif["user_id"],
            "type": notif["type"],
            "message": notif["message"],
            "link": notif.get("link"),
            "read_status": notif["read_status"],
            "created_at": notif["created_at"]
        })

    return result


async def get_unread_count(user_id: str) -> int:
    """
    사용자의 읽지 않은 알림 개수 조회

    Args:
        user_id: 사용자 ID

    Returns:
        int: 읽지 않은 알림 개수
    """
    count = await get_notifications_collection().count_documents({
        "user_id": user_id,
        "read_status": False
    })

    return count


async def mark_as_read(notification_id: str, user_id: str) -> bool:
    """
    알림을 읽음으로 표시

    Args:
        notification_id: 알림 ID
        user_id: 사용자 ID (권한 확인용)

    Returns:
        bool: 성공 여부
    """
    result = await get_notifications_collection().update_one(
        {
            "_id": ObjectId(notification_id),
            "user_id": user_id
        },
        {"$set": {"read_status": True}}
    )

    return result.modified_count > 0


async def delete_all_notifications(user_id: str) -> int:
    """
    사용자의 모든 알림 삭제

    Args:
        user_id: 사용자 ID

    Returns:
        int: 삭제된 알림 개수
    """
    result = await get_notifications_collection().delete_many({"user_id": user_id})
    return result.deleted_count


async def get_notification_settings(user_id: str) -> Dict[str, Any]:
    """
    사용자의 알림 설정 조회

    Args:
        user_id: 사용자 ID

    Returns:
        Dict: 알림 설정
    """
    settings = await get_notification_settings_collection().find_one({"user_id": user_id})

    if not settings:
        # 기본 설정 생성 (모두 ON)
        default_settings = {
            "user_id": user_id,
            "quiz_notification": True,
            "community_reply_notification": True,
            "community_like_notification": True,
            "survey_notification": True,
            "challenge_notification": True,
            "level_up_notification": True,
            "point_notification": True,
            "update_notification": True
        }
        await get_notification_settings_collection().insert_one(default_settings)
        settings = default_settings

    return {
        "user_id": settings["user_id"],
        "quiz_notification": settings.get("quiz_notification", True),
        "community_reply_notification": settings.get("community_reply_notification", True),
        "community_like_notification": settings.get("community_like_notification", True),
        "survey_notification": settings.get("survey_notification", True),
        "challenge_notification": settings.get("challenge_notification", True),
        "level_up_notification": settings.get("level_up_notification", True),
        "point_notification": settings.get("point_notification", True),
        "update_notification": settings.get("update_notification", True)
    }


async def update_notification_settings(user_id: str, settings_update: Dict[str, bool]) -> bool:
    """
    사용자의 알림 설정 업데이트

    Args:
        user_id: 사용자 ID
        settings_update: 업데이트할 설정 (필드명: 값)

    Returns:
        bool: 성공 여부
    """
    # 기존 설정이 없으면 생성
    existing = await get_notification_settings_collection().find_one({"user_id": user_id})

    if not existing:
        default_settings = {
            "user_id": user_id,
            "quiz_notification": True,
            "community_reply_notification": True,
            "community_like_notification": True,
            "survey_notification": True,
            "challenge_notification": True,
            "level_up_notification": True,
            "point_notification": True,
            "update_notification": True
        }
        await get_notification_settings_collection().insert_one(default_settings)

    # None이 아닌 값만 업데이트
    update_fields = {k: v for k, v in settings_update.items() if v is not None}

    if not update_fields:
        return False

    result = await get_notification_settings_collection().update_one(
        {"user_id": user_id},
        {"$set": update_fields}
    )

    return result.modified_count > 0 or result.matched_count > 0
