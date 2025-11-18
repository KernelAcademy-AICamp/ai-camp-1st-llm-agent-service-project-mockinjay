from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserResponse
from app.services.auth import hash_password, verify_password, create_access_token
from app.db.connection import users_collection
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup")
async def signup(user: UserCreate):
    # 이메일 중복 확인
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다")
    
    # 사용자 생성
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "profile": user.profile,
        "role": user.role,  # "user" or "admin"
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_doc)
    
    return {"success": True, "message": "회원가입 성공"}

@router.post("/login")
async def login(email: str, password: str):
    # 사용자 찾기
    user = users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 잘못되었습니다")
    
    # 토큰 생성
    token = create_access_token({"user_id": str(user["_id"])})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "profile": user["profile"],
            "role": user.get("role", "user")  # 기존 사용자를 위한 기본값
        }
    }
