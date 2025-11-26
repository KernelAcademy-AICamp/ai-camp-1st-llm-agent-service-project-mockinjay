import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from app.db.connection import users_collection
from bson import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, os.getenv("SECRET_KEY", "your-secret-key-here"), algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """토큰에서 현재 사용자 정보 추출"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY", "your-secret-key-here"), algorithms=["HS256"])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception

    return user
