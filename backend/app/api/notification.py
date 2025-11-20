"""
알림 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.dependencies import get_current_user, require_admin
from app.models.notification import NotificationCreate, NotificationSettingsUpdate
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    user_id: str = Depends(get_current_user)
):
    """
    현재 사용자의 알림 목록 조회 (페이지네이션)
    
    Args:
        page: 페이지 번호 (1부터 시작)
        page_size: 페이지당 항목 수 (최대 100)
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 알림 목록과 페이지 정보
    """
    notifications = notification_service.get_user_notifications(user_id, page, page_size)
    
    return {
        "success": True,
        "data": notifications,
        "page": page,
        "page_size": page_size
    }


@router.get("/unread-count")
async def get_unread_count(user_id: str = Depends(get_current_user)):
    """
    현재 사용자의 읽지 않은 알림 개수 조회
    
    Args:
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 읽지 않은 알림 개수
    """
    count = notification_service.get_unread_count(user_id)
    
    return {
        "success": True,
        "unread_count": count
    }


@router.post("")
async def create_notification(
    notification: NotificationCreate,
    admin_id: str = Depends(require_admin)
):
    """
    새 알림 생성 (관리자 전용)
    
    Args:
        notification: 알림 생성 데이터
        admin_id: 관리자 ID
        
    Returns:
        dict: 생성된 알림 ID
    """
    notification_id = notification_service.create_notification(notification)
    
    return {
        "success": True,
        "notification_id": notification_id,
        "message": "알림이 생성되었습니다"
    }


@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    알림을 읽음으로 표시
    
    Args:
        notification_id: 알림 ID
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 성공 메시지
    """
    success = notification_service.mark_as_read(notification_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다")
    
    return {
        "success": True,
        "message": "알림이 읽음 처리되었습니다"
    }


@router.delete("")
async def delete_all_notifications(user_id: str = Depends(get_current_user)):
    """
    현재 사용자의 모든 알림 삭제
    
    Args:
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 삭제된 알림 개수
    """
    deleted_count = notification_service.delete_all_notifications(user_id)
    
    return {
        "success": True,
        "deleted_count": deleted_count,
        "message": "모든 알림이 삭제되었습니다"
    }


@router.get("/settings")
async def get_notification_settings(user_id: str = Depends(get_current_user)):
    """
    현재 사용자의 알림 설정 조회
    
    Args:
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 알림 설정
    """
    settings = notification_service.get_notification_settings(user_id)
    
    return {
        "success": True,
        "settings": settings
    }


@router.put("/settings")
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    현재 사용자의 알림 설정 업데이트
    
    Args:
        settings_update: 업데이트할 알림 설정
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 성공 메시지
    """
    # Pydantic 모델을 딕셔너리로 변환 (None 제외)
    update_dict = settings_update.model_dump(exclude_none=True)
    
    success = notification_service.update_notification_settings(user_id, update_dict)
    
    return {
        "success": True,
        "message": "알림 설정이 업데이트되었습니다"
    }
