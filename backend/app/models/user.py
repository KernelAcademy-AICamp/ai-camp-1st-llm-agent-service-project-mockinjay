from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    profile: str  # "general", "patient", "researcher"
    role: Literal["user", "admin"] = "user"  # 기본값: user

class UserResponse(BaseModel):
    userId: str  # MongoDB _id와 매핑
    email: str
    name: str
    profile: str
    role: str  # "user" or "admin"
    nickname: Optional[str] = None  # 사용자 닉네임 (없으면 name 사용)
    profile_image: Optional[str] = None  # 프로필 이미지 URL
