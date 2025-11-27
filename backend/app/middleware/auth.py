"""
Authentication Middleware
Validates JWT tokens for protected routes
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Public paths that don't require authentication
PUBLIC_PATHS = {
    "/",
    "/health",
    "/db-check",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/signup",
    "/api/auth/dev-login",
}

# Path prefixes that are public
PUBLIC_PREFIXES = [
    "/uploads/",
    "/test/",
    "/api/chat/",           # 채팅 엔드포인트 (개발 중 공개)
    "/api/community/",      # 커뮤니티 엔드포인트 (개발 중 공개)
    "/api/quiz/",           # 퀴즈 엔드포인트 (개발 중 공개)
    "/api/session/",        # 세션 엔드포인트 (개발 중 공개)
    "/api/trends/",         # 트렌드 엔드포인트 (개발 중 공개)
    "/api/diet/",           # 영양 엔드포인트 (개발 중 공개)
]


def is_public_path(path: str) -> bool:
    """Check if the path is public and doesn't require authentication"""
    # Check exact matches
    if path in PUBLIC_PATHS:
        return True

    # Check prefixes
    for prefix in PUBLIC_PREFIXES:
        if path.startswith(prefix):
            return True

    return False


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate JWT tokens for protected routes"""

    async def dispatch(self, request: Request, call_next):
        # Always allow OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip authentication for public paths
        if is_public_path(request.url.path):
            return await call_next(request)

        # Get Authorization header
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            logger.warning(f"Missing Authorization header for path: {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": "인증 정보가 없습니다",
                    "error_code": "MISSING_AUTHORIZATION"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check Bearer token format
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authentication scheme")
        except ValueError:
            logger.warning(f"Invalid Authorization header format for path: {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": "잘못된 인증 형식입니다",
                    "error_code": "INVALID_AUTHORIZATION_FORMAT"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Validate JWT token
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
            user_id = payload.get("user_id")

            if not user_id:
                raise JWTError("Missing user_id in token")

            # Add user_id to request state for use in route handlers
            request.state.user_id = user_id
            request.state.token_payload = payload

        except JWTError as e:
            logger.warning(f"Invalid JWT token for path {request.url.path}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": "인증 토큰이 유효하지 않습니다",
                    "error_code": "INVALID_TOKEN"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            logger.error(f"Token validation error for path {request.url.path}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": "인증 처리 중 오류가 발생했습니다",
                    "error_code": "AUTHENTICATION_ERROR"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Continue to the next middleware or route handler
        return await call_next(request)
