"""
Global Error Handlers with Standardized Response Format
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import settings
from datetime import datetime
import logging
import traceback

logger = logging.getLogger(__name__)


async def not_found_handler(request: Request, exc: StarletteHTTPException):
    """
    404 Not Found Error Handler

    Returns user-friendly message for not found errors
    """
    logger.warning(f"404 Not Found: {request.url.path}")

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "success": False,
            "error": "페이지를 찾을 수 없습니다",
            "error_code": "NOT_FOUND",
            "detail": str(exc.detail) if hasattr(exc, 'detail') else None,
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


async def internal_server_error_handler(request: Request, exc: Exception):
    """
    500 Internal Server Error Handler

    Logs full error details but returns safe message to user
    """
    # Log full error with traceback
    logger.error(f"500 Internal Server Error at {request.url.path}")
    logger.error(f"Error: {str(exc)}")
    logger.error(traceback.format_exc())

    # Return safe error message
    # In production, hide internal details
    error_detail = None
    if settings.is_development:
        error_detail = str(exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "서버 내부 오류가 발생했습니다",
            "error_code": "INTERNAL_SERVER_ERROR",
            "detail": error_detail,
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


async def bad_gateway_handler(request: Request, exc: Exception):
    """
    502 Bad Gateway Error Handler

    Returns user-friendly message for gateway errors
    """
    logger.error(f"502 Bad Gateway at {request.url.path}: {str(exc)}")

    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={
            "success": False,
            "error": "게이트웨이 오류가 발생했습니다",
            "error_code": "BAD_GATEWAY",
            "detail": str(exc) if settings.is_development else None,
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


async def validation_error_handler(request: Request, exc: RequestValidationError):
    """
    422 Validation Error Handler

    Returns detailed validation errors in user-friendly format
    """
    logger.warning(f"422 Validation Error at {request.url.path}")
    logger.warning(f"Errors: {exc.errors()}")

    # Format validation errors
    details = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []))
        details.append({
            "field": field,
            "message": error.get("msg", "Validation error"),
            "type": error.get("type", "unknown")
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "입력 데이터가 올바르지 않습니다",
            "error_code": "VALIDATION_ERROR",
            "details": details,
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Generic HTTP Exception Handler

    Handles all other HTTP exceptions with standardized format
    """
    logger.warning(f"{exc.status_code} HTTP Error at {request.url.path}: {exc.detail}")

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": str(exc.detail),
            "error_code": f"HTTP_{exc.status_code}",
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        }
    )
