from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class NotificationCreate(BaseModel):
    """알림 생성 모델"""
    user_id: str
    type: Literal[
        "update",           # 업데이트 공지
        "community_reply",  # 커뮤니티 댓글
        "community_like",   # 커뮤니티 좋아요
        "survey",           # 설문 조사 마감 임박
        "challenge",        # 챌린지 참여 독려
        "quiz",             # 퀴즈 알림
        "level_up"          # 레벨업 축하
    ]
    message: str
    link: Optional[str] = None  # 관련 페이지 링크
    read_status: bool = False

class NotificationResponse(BaseModel):
    """알림 응답 모델"""
    id: str
    user_id: str
    type: str
    message: str
    link: Optional[str] = None
    read_status: bool
    created_at: datetime

class NotificationSettings(BaseModel):
    """알림 설정 모델"""
    user_id: str
    quiz_notification: bool = True           # 퀴즈 알림
    community_reply_notification: bool = True # 커뮤니티 답변 알림
    community_like_notification: bool = True  # 좋아요 알림
    survey_notification: bool = True          # 설문 조사 알림
    challenge_notification: bool = True       # 챌린지 독려 알림
    level_up_notification: bool = True        # 레벨업 알림
    point_notification: bool = True           # 포인트 소진 알림
    update_notification: bool = True          # 업데이트 공지

class NotificationSettingsUpdate(BaseModel):
    """알림 설정 업데이트 모델"""
    quiz_notification: Optional[bool] = None
    community_reply_notification: Optional[bool] = None
    community_like_notification: Optional[bool] = None
    survey_notification: Optional[bool] = None
    challenge_notification: Optional[bool] = None
    level_up_notification: Optional[bool] = None
    point_notification: Optional[bool] = None
    update_notification: Optional[bool] = None
