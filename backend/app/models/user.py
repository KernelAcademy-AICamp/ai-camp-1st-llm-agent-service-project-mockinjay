from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    profile: str  # "general", "patient", "researcher"
    role: Literal["user", "admin"] = "user"  # 기본값: user
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    diagnosis: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile: Optional[str] = None  # "general", "patient", "researcher"
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    diagnosis: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    userId: str  # MongoDB _id와 매핑
    email: str
    name: str
    profile: str
    role: str  # "user" or "admin"
    nickname: Optional[str] = None  # 사용자 닉네임 (없으면 name 사용)
    profile_image: Optional[str] = None  # 프로필 이미지 URL
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    diagnosis: Optional[str] = None
