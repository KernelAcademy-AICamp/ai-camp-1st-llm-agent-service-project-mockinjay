from pydantic import BaseModel, EmailStr
from typing import Literal

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
