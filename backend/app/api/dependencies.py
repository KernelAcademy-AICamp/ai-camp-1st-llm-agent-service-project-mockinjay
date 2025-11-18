from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from app.db.connection import users_collection
from bson import ObjectId
import os

security = HTTPBearer()

async def get_current_user(credentials = Depends(security)) -> str:
    """
    JWT 토큰을 검증하고 사용자 ID를 반환합니다.
    
    Args:
        credentials: Bearer 토큰
        
    Returns:
        str: 사용자 ID (MongoDB _id)
        
    Raises:
        HTTPException: 토큰이 유효하지 않은 경우
    """
    token = credentials.credentials
    
    try:
        # JWT 토큰 디코딩
        payload = jwt.decode(
            token, 
            os.getenv("SECRET_KEY"), 
            algorithms=["HS256"]
        )
        user_id: str = payload.get("user_id")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 인증 토큰입니다"
            )
            
        return user_id
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 검증에 실패했습니다"
        )


async def require_admin(user_id: str = Depends(get_current_user)) -> str:
    """
    관리자 권한을 확인합니다.

    Args:
        user_id: JWT 토큰에서 추출한 사용자 ID

    Returns:
        str: 관리자 사용자 ID

    Raises:
        HTTPException: 관리자가 아닌 경우
    """
    user = users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    # role이 없는 기존 사용자는 일반 사용자로 간주
    if user.get("role", "user") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )

    return user_id
