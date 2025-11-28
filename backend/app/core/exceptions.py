"""
Diet Care Custom Exceptions

This module defines a hierarchical exception structure for the Diet Care feature,
enabling precise error handling and user-friendly error messages.

Exception Hierarchy:
    DietCareException (base)
    ├── ValidationError (400)
    │   ├── InvalidImageURLError
    │   ├── InvalidMealDataError
    │   └── InvalidGoalRangeError
    ├── ResourceNotFoundError (404)
    │   ├── SessionNotFoundError
    │   ├── GoalNotFoundError
    │   └── MealNotFoundError
    ├── RateLimitExceededError (429)
    │   ├── AnalysisLimitExceededError
    │   └── MealLogLimitExceededError
    ├── ExternalServiceError (502)
    │   ├── OpenAIAPIError
    │   └── ImageProcessingError
    └── DatabaseError (500)
        ├── ConnectionError
        └── QueryError
"""
from typing import Optional, Dict, Any
from datetime import datetime


class DietCareException(Exception):
    """Base exception for all Diet Care related errors"""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.detail = detail or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to API response format"""
        return {
            "error_code": self.status_code,
            "message": self.message,
            "detail": self.detail,
            "error_type": self.error_code
        }


# ============================================
# Validation Errors (400 Bad Request)
# ============================================

class ValidationError(DietCareException):
    """Base class for validation errors"""

    def __init__(self, message: str, detail: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, detail=detail)


class InvalidImageURLError(ValidationError):
    """Raised when image URL is invalid or inaccessible"""

    def __init__(self, url: str, reason: Optional[str] = None):
        detail = {"url": url}
        if reason:
            detail["reason"] = reason
        super().__init__(
            message="이미지 URL이 유효하지 않습니다",
            detail=detail
        )


class InvalidMealDataError(ValidationError):
    """Raised when meal data is invalid"""

    def __init__(self, field: str, reason: str):
        super().__init__(
            message=f"식사 데이터가 유효하지 않습니다: {field}",
            detail={"field": field, "reason": reason}
        )


class InvalidGoalRangeError(ValidationError):
    """Raised when goal values are out of acceptable range"""

    def __init__(self, nutrient: str, value: float, min_val: float, max_val: float):
        super().__init__(
            message=f"{nutrient} 목표가 허용 범위를 벗어났습니다",
            detail={
                "nutrient": nutrient,
                "value": value,
                "min": min_val,
                "max": max_val
            }
        )


class InvalidMealTypeError(ValidationError):
    """Raised when meal type is not recognized"""

    def __init__(self, meal_type: str):
        super().__init__(
            message="식사 유형이 유효하지 않습니다",
            detail={
                "meal_type": meal_type,
                "allowed_types": ["breakfast", "lunch", "dinner", "snack"]
            }
        )


class InvalidCKDStageError(ValidationError):
    """Raised when CKD stage is invalid"""

    def __init__(self, stage: str):
        super().__init__(
            message="만성 콩팥병 단계가 유효하지 않습니다",
            detail={
                "stage": stage,
                "allowed_stages": ["1", "2", "3", "4", "5"]
            }
        )


# ============================================
# Resource Not Found Errors (404 Not Found)
# ============================================

class ResourceNotFoundError(DietCareException):
    """Base class for resource not found errors"""

    def __init__(self, message: str, detail: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, detail=detail)


class SessionNotFoundError(ResourceNotFoundError):
    """Raised when session does not exist or has expired"""

    def __init__(self, user_id: str):
        super().__init__(
            message="활성화된 세션을 찾을 수 없습니다",
            detail={"user_id": user_id}
        )


class GoalNotFoundError(ResourceNotFoundError):
    """Raised when user goals are not set"""

    def __init__(self, user_id: str):
        super().__init__(
            message="설정된 목표를 찾을 수 없습니다. 먼저 목표를 설정해주세요.",
            detail={"user_id": user_id}
        )


class MealNotFoundError(ResourceNotFoundError):
    """Raised when meal log does not exist"""

    def __init__(self, meal_id: str):
        super().__init__(
            message="식사 기록을 찾을 수 없습니다",
            detail={"meal_id": meal_id}
        )


class UserNotFoundError(ResourceNotFoundError):
    """Raised when user does not exist"""

    def __init__(self, user_id: str):
        super().__init__(
            message="사용자를 찾을 수 없습니다",
            detail={"user_id": user_id}
        )


# ============================================
# Rate Limit Errors (429 Too Many Requests)
# ============================================

class RateLimitExceededError(DietCareException):
    """Base class for rate limit errors"""

    def __init__(
        self,
        message: str,
        limit: int,
        reset_at: datetime,
        detail: Optional[Dict[str, Any]] = None
    ):
        detail = detail or {}
        detail.update({
            "limit": limit,
            "reset_at": reset_at.isoformat(),
            "remaining_time_seconds": int((reset_at - datetime.utcnow()).total_seconds())
        })
        super().__init__(message, status_code=429, detail=detail)


class AnalysisLimitExceededError(RateLimitExceededError):
    """Raised when analysis rate limit is exceeded"""

    def __init__(self, reset_at: datetime):
        super().__init__(
            message="시간당 분석 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
            limit=10,
            reset_at=reset_at
        )


class MealLogLimitExceededError(RateLimitExceededError):
    """Raised when meal logging rate limit is exceeded"""

    def __init__(self, reset_at: datetime):
        super().__init__(
            message="일일 식사 기록 한도를 초과했습니다",
            limit=50,
            reset_at=reset_at
        )


# ============================================
# External Service Errors (502 Bad Gateway)
# ============================================

class ExternalServiceError(DietCareException):
    """Base class for external service errors"""

    def __init__(self, message: str, detail: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=502, detail=detail)


class OpenAIAPIError(ExternalServiceError):
    """Raised when OpenAI API call fails"""

    def __init__(self, reason: str, status_code: Optional[int] = None):
        detail = {"reason": reason}
        if status_code:
            detail["api_status_code"] = status_code
        super().__init__(
            message="영양 분석 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
            detail=detail
        )


class ImageProcessingError(ExternalServiceError):
    """Raised when image processing fails"""

    def __init__(self, reason: str):
        super().__init__(
            message="이미지 처리 중 오류가 발생했습니다",
            detail={"reason": reason}
        )


# ============================================
# Database Errors (500 Internal Server Error)
# ============================================

class DatabaseError(DietCareException):
    """Base class for database errors"""

    def __init__(self, message: str, detail: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, detail=detail)


class DatabaseConnectionError(DatabaseError):
    """Raised when database connection fails"""

    def __init__(self, reason: str):
        super().__init__(
            message="데이터베이스 연결에 실패했습니다",
            detail={"reason": reason}
        )


class DatabaseQueryError(DatabaseError):
    """Raised when database query fails"""

    def __init__(self, operation: str, reason: str):
        super().__init__(
            message=f"데이터베이스 작업 중 오류가 발생했습니다: {operation}",
            detail={"operation": operation, "reason": reason}
        )


# ============================================
# Exception Handler for FastAPI
# ============================================

async def diet_care_exception_handler(request, exc: DietCareException):
    """
    FastAPI exception handler for DietCareException

    Usage in main.py:
        from app.core.exceptions import DietCareException, diet_care_exception_handler
        app.add_exception_handler(DietCareException, diet_care_exception_handler)
    """
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )
