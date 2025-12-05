"""
Scheduled Notification Domain Models

Pydantic models for notification scheduling and delivery:
- Scheduled notifications (future delivery)
- Recurring notifications
- Delivery tracking
- Multi-channel support (push, email, SMS)
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, time
from enum import Enum


# ============================================
# Enums
# ============================================

class NotificationType(str, Enum):
    """Types of notifications"""
    # Health-related
    MEDICATION_REMINDER = "medication_reminder"
    LAB_REMINDER = "lab_reminder"
    HEALTH_ALERT = "health_alert"
    VITAL_SIGN_REMINDER = "vital_sign_reminder"

    # Community-related (from existing system)
    COMMUNITY_REPLY = "community_reply"
    COMMUNITY_LIKE = "community_like"

    # Gamification-related (from existing system)
    QUIZ = "quiz"
    LEVEL_UP = "level_up"
    CHALLENGE = "challenge"
    SURVEY = "survey"

    # System-related
    UPDATE = "update"
    ANNOUNCEMENT = "announcement"


class RecurrencePattern(str, Enum):
    """Recurrence patterns for notifications"""
    ONCE = "once"  # One-time notification
    DAILY = "daily"  # Repeat daily
    WEEKLY = "weekly"  # Repeat weekly
    MONTHLY = "monthly"  # Repeat monthly
    CUSTOM = "custom"  # Custom schedule


class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DeliveryChannel(str, Enum):
    """Notification delivery channels"""
    PUSH = "push"  # In-app push notification
    EMAIL = "email"  # Email notification
    SMS = "sms"  # SMS notification


class DeliveryStatus(str, Enum):
    """Notification delivery status"""
    SCHEDULED = "scheduled"  # Scheduled for future delivery
    SENT = "sent"  # Successfully sent
    FAILED = "failed"  # Delivery failed
    CANCELLED = "cancelled"  # Cancelled by user or system


# ============================================
# Recurrence Configuration Models
# ============================================

class RecurrenceConfig(BaseModel):
    """Configuration for recurring notifications"""
    pattern: RecurrencePattern

    # For daily recurrence
    times: Optional[List[str]] = Field(
        None,
        description="Times of day in HH:MM format (for daily recurrence)"
    )

    # For weekly recurrence
    days_of_week: Optional[List[int]] = Field(
        None,
        ge=0,
        le=6,
        description="Days of week (0=Monday, 6=Sunday) for weekly recurrence"
    )

    # For monthly recurrence
    day_of_month: Optional[int] = Field(
        None,
        ge=1,
        le=31,
        description="Day of month for monthly recurrence"
    )

    # End date for recurrence
    end_date: Optional[datetime] = Field(
        None,
        description="When to stop recurring (None = indefinite)"
    )

    @field_validator('times')
    @classmethod
    def validate_times(cls, v):
        """Validate time format in times list"""
        if v is None:
            return v
        for time_str in v:
            try:
                # Validate HH:MM format
                hours, minutes = time_str.split(':')
                if not (0 <= int(hours) <= 23 and 0 <= int(minutes) <= 59):
                    raise ValueError(f"Invalid time: {time_str}")
            except (ValueError, AttributeError):
                raise ValueError(f"Times must be in HH:MM format, got: {time_str}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "pattern": "daily",
                "times": ["09:00", "21:00"],
                "days_of_week": None,
                "day_of_month": None,
                "end_date": None
            }
        }


# ============================================
# Scheduled Notification Models
# ============================================

class CreateScheduledNotificationRequest(BaseModel):
    """Request to schedule a notification"""
    user_id: str = Field(..., min_length=24, max_length=24)
    type: NotificationType
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    scheduled_time: datetime = Field(..., description="When to deliver the notification")
    recurrence: Optional[RecurrenceConfig] = Field(
        None,
        description="Recurrence configuration (None for one-time notification)"
    )
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM)
    channels: List[DeliveryChannel] = Field(
        default=[DeliveryChannel.PUSH],
        description="Delivery channels to use"
    )
    action_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to navigate to when notification is clicked"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata (e.g., medication_id, lab_test_id)"
    )

    @field_validator('scheduled_time')
    @classmethod
    def validate_scheduled_time(cls, v):
        """Ensure scheduled time is in the future"""
        if v <= datetime.utcnow():
            raise ValueError("Scheduled time must be in the future")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "type": "medication_reminder",
                "title": "Time to take Furosemide",
                "message": "Take 40mg Furosemide with water",
                "scheduled_time": "2025-11-28T09:00:00Z",
                "recurrence": {
                    "pattern": "daily",
                    "times": ["09:00", "21:00"]
                },
                "priority": "high",
                "channels": ["push", "email"],
                "action_url": "/medications",
                "metadata": {
                    "medication_id": "507f1f77bcf86cd799439100"
                }
            }
        }


class ScheduledNotification(BaseModel):
    """Scheduled notification entity"""
    id: str = Field(..., description="Notification ID")
    user_id: str
    type: NotificationType
    title: str
    message: str
    scheduled_time: datetime
    recurrence: Optional[RecurrenceConfig] = None
    priority: NotificationPriority
    channels: List[DeliveryChannel]
    action_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    status: DeliveryStatus
    sent_at: Optional[datetime] = None
    delivery_attempts: int = Field(default=0, ge=0)
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439102",
                "user_id": "507f1f77bcf86cd799439011",
                "type": "medication_reminder",
                "title": "Time to take Furosemide",
                "message": "Take 40mg Furosemide with water",
                "scheduled_time": "2025-11-28T09:00:00Z",
                "recurrence": {
                    "pattern": "daily",
                    "times": ["09:00", "21:00"]
                },
                "priority": "high",
                "channels": ["push", "email"],
                "action_url": "/medications",
                "status": "scheduled",
                "sent_at": None,
                "delivery_attempts": 0,
                "is_active": True,
                "created_at": "2025-11-27T10:00:00Z",
                "updated_at": "2025-11-27T10:00:00Z"
            }
        }


class ScheduledNotificationResponse(BaseModel):
    """Response after creating/retrieving scheduled notification"""
    success: bool = True
    notification: ScheduledNotification
    next_delivery: Optional[datetime] = Field(
        None,
        description="Next scheduled delivery time (for recurring notifications)"
    )
    recurrence_count: Optional[int] = Field(
        None,
        description="Number of scheduled occurrences"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "notification": {
                    "id": "507f1f77bcf86cd799439102",
                    "type": "medication_reminder",
                    "title": "Time to take Furosemide",
                    "scheduled_time": "2025-11-28T09:00:00Z",
                    "status": "scheduled"
                },
                "next_delivery": "2025-11-28T09:00:00Z",
                "recurrence_count": 2
            }
        }


class ScheduledNotificationListResponse(BaseModel):
    """Response with list of scheduled notifications"""
    success: bool = True
    notifications: List[ScheduledNotification]
    active_count: int = Field(..., ge=0, description="Number of active schedules")
    pagination: Dict[str, int]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "notifications": [],
                "active_count": 12,
                "pagination": {
                    "total": 15,
                    "page": 1,
                    "page_size": 20,
                    "total_pages": 1
                }
            }
        }


# ============================================
# Notification Delivery Models
# ============================================

class DeliveryAttempt(BaseModel):
    """Record of a delivery attempt"""
    attempt_number: int = Field(..., ge=1)
    channel: DeliveryChannel
    attempted_at: datetime
    status: Literal["success", "failed"]
    error_message: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "attempt_number": 1,
                "channel": "push",
                "attempted_at": "2025-11-28T09:00:05Z",
                "status": "success",
                "error_message": None
            }
        }


class NotificationDeliveryLog(BaseModel):
    """Log of notification delivery attempts"""
    notification_id: str
    user_id: str
    type: NotificationType
    scheduled_time: datetime
    delivery_attempts: List[DeliveryAttempt] = Field(default_factory=list)
    final_status: DeliveryStatus
    delivered_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "notification_id": "507f1f77bcf86cd799439102",
                "user_id": "507f1f77bcf86cd799439011",
                "type": "medication_reminder",
                "scheduled_time": "2025-11-28T09:00:00Z",
                "delivery_attempts": [
                    {
                        "attempt_number": 1,
                        "channel": "push",
                        "attempted_at": "2025-11-28T09:00:05Z",
                        "status": "success"
                    }
                ],
                "final_status": "sent",
                "delivered_at": "2025-11-28T09:00:05Z"
            }
        }


# ============================================
# Bulk Operations Models
# ============================================

class BulkScheduleRequest(BaseModel):
    """Request to schedule multiple notifications"""
    user_id: str = Field(..., min_length=24, max_length=24)
    notifications: List[CreateScheduledNotificationRequest] = Field(
        ...,
        min_items=1,
        max_items=100,
        description="List of notifications to schedule (max 100)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "notifications": [
                    {
                        "type": "medication_reminder",
                        "title": "Morning medication",
                        "message": "Take your morning medications",
                        "scheduled_time": "2025-11-28T09:00:00Z",
                        "priority": "high"
                    },
                    {
                        "type": "medication_reminder",
                        "title": "Evening medication",
                        "message": "Take your evening medications",
                        "scheduled_time": "2025-11-28T21:00:00Z",
                        "priority": "high"
                    }
                ]
            }
        }


class BulkScheduleResponse(BaseModel):
    """Response after bulk scheduling"""
    success: bool = True
    scheduled_count: int = Field(..., ge=0)
    failed_count: int = Field(..., ge=0)
    notification_ids: List[str] = Field(default_factory=list)
    errors: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Errors encountered during scheduling"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "scheduled_count": 2,
                "failed_count": 0,
                "notification_ids": [
                    "507f1f77bcf86cd799439102",
                    "507f1f77bcf86cd799439103"
                ],
                "errors": None
            }
        }


# ============================================
# User Notification Preferences (Extended)
# ============================================

class NotificationChannelPreferences(BaseModel):
    """Per-channel notification preferences"""
    push_enabled: bool = True
    email_enabled: bool = True
    sms_enabled: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "push_enabled": True,
                "email_enabled": True,
                "sms_enabled": False
            }
        }


class NotificationCategoryPreferences(BaseModel):
    """Per-category notification preferences"""
    # Health-related
    medication_reminders: bool = True
    lab_reminders: bool = True
    health_alerts: bool = True
    vital_sign_reminders: bool = True

    # Community-related
    community_replies: bool = True
    community_likes: bool = True

    # Gamification-related
    quiz_notifications: bool = True
    level_up_notifications: bool = True
    challenge_notifications: bool = True

    # System-related
    updates: bool = True
    announcements: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "medication_reminders": True,
                "lab_reminders": True,
                "health_alerts": True,
                "community_replies": True,
                "updates": True
            }
        }


class QuietHours(BaseModel):
    """Quiet hours configuration (no notifications during this time)"""
    enabled: bool = False
    start_time: str = Field(
        "22:00",
        description="Start time in HH:MM format"
    )
    end_time: str = Field(
        "08:00",
        description="End time in HH:MM format"
    )

    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_format(cls, v):
        """Validate time format"""
        try:
            hours, minutes = v.split(':')
            if not (0 <= int(hours) <= 23 and 0 <= int(minutes) <= 59):
                raise ValueError(f"Invalid time: {v}")
        except (ValueError, AttributeError):
            raise ValueError(f"Time must be in HH:MM format, got: {v}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "enabled": True,
                "start_time": "22:00",
                "end_time": "08:00"
            }
        }


class UserNotificationPreferences(BaseModel):
    """Comprehensive user notification preferences"""
    user_id: str
    channel_preferences: NotificationChannelPreferences = Field(
        default_factory=NotificationChannelPreferences
    )
    category_preferences: NotificationCategoryPreferences = Field(
        default_factory=NotificationCategoryPreferences
    )
    quiet_hours: QuietHours = Field(default_factory=QuietHours)
    timezone: str = Field(default="UTC", description="User's timezone (IANA format)")
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "channel_preferences": {
                    "push_enabled": True,
                    "email_enabled": True,
                    "sms_enabled": False
                },
                "category_preferences": {
                    "medication_reminders": True,
                    "lab_reminders": True,
                    "health_alerts": True
                },
                "quiet_hours": {
                    "enabled": True,
                    "start_time": "22:00",
                    "end_time": "08:00"
                },
                "timezone": "Asia/Seoul",
                "updated_at": "2025-11-28T12:00:00Z"
            }
        }


class UpdateNotificationPreferencesRequest(BaseModel):
    """Request to update notification preferences"""
    channel_preferences: Optional[NotificationChannelPreferences] = None
    category_preferences: Optional[NotificationCategoryPreferences] = None
    quiet_hours: Optional[QuietHours] = None
    timezone: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "category_preferences": {
                    "medication_reminders": True,
                    "lab_reminders": False
                },
                "quiet_hours": {
                    "enabled": True,
                    "start_time": "23:00",
                    "end_time": "07:00"
                }
            }
        }


class NotificationPreferencesResponse(BaseModel):
    """Response with user notification preferences"""
    success: bool = True
    preferences: UserNotificationPreferences

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "preferences": {
                    "user_id": "507f1f77bcf86cd799439011",
                    "channel_preferences": {
                        "push_enabled": True,
                        "email_enabled": True,
                        "sms_enabled": False
                    },
                    "timezone": "Asia/Seoul"
                }
            }
        }
