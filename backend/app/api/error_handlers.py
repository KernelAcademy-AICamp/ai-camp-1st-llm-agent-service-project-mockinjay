"""
에러 핸들러 (UTI-005)
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


async def not_found_handler(request: Request, exc: StarletteHTTPException):
    """
    404 Not Found 에러 핸들러
    
    사용자 친화적인 메시지 반환
    """
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error_code": 404,
            "message": "페이지를 찾을 수 없습니다",
            "detail": str(exc.detail) if hasattr(exc, 'detail') else None
        }
    )


async def internal_server_error_handler(request: Request, exc: Exception):
    """
    500 Internal Server Error 에러 핸들러
    
    사용자 친화적인 메시지 반환
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": 500,
            "message": "서버 내부 오류가 발생했습니다",
            "detail": str(exc) if exc else None
        }
    )


async def bad_gateway_handler(request: Request, exc: Exception):
    """
    502 Bad Gateway 에러 핸들러
    
    사용자 친화적인 메시지 반환
    """
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={
            "error_code": 502,
            "message": "게이트웨이 오류가 발생했습니다",
            "detail": str(exc) if exc else None
        }
    )


async def validation_error_handler(request: Request, exc: RequestValidationError):
    """
    422 Validation Error 에러 핸들러
    
    입력 검증 오류에 대한 사용자 친화적인 메시지 반환
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_code": 422,
            "message": "입력 데이터가 올바르지 않습니다",
            "detail": exc.errors()
        }
    )
