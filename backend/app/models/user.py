from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    profile: str  # "general", "patient", "researcher"

class UserResponse(BaseModel):
    userId: str  # MongoDB _id와 매핑
    email: str
    name: str
    profile: str
