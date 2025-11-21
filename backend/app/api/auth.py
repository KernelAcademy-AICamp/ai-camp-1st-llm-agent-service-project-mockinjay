from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserResponse
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.db.connection import users_collection
from datetime import datetime
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    fullName: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "username": "testuser",
                "email": "test@example.com",
                "password": "password123",
                "fullName": "Test User"
            }
        }

@router.post("/register")
async def register(user_data: RegisterRequest):
    """회원가입 API"""
    # 아이디 중복 확인
    if users_collection.find_one({"username": user_data.username}):
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다")

    # 이메일 중복 확인
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다")

    # 사용자 생성
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "fullName": user_data.fullName,
        "role": "user",
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_doc)

    # 토큰 생성
    token = create_access_token({"user_id": str(result.inserted_id), "username": user_data.username})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(result.inserted_id),
            "username": user_data.username,
            "email": user_data.email,
            "fullName": user_data.fullName
        }
    }

@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    """로그인 API - OAuth2 form 형식"""
    # 사용자 찾기 (username 또는 email로 로그인 가능)
    user = users_collection.find_one({"$or": [{"username": username}, {"email": username}]})

    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 잘못되었습니다")

    # 토큰 생성
    token = create_access_token({"user_id": str(user["_id"]), "username": user["username"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "fullName": user.get("fullName")
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "fullName": current_user.get("fullName")
    }

# 기존 API와의 호환성을 위해 유지
@router.post("/signup")
async def signup(user: UserCreate):
    """레거시 회원가입 API"""
    # 이메일 중복 확인
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다")

    # 사용자 생성
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "username": user.email.split("@")[0],  # 이메일에서 username 생성
        "profile": user.profile,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_doc)

    return {"success": True, "message": "회원가입 성공"}

@router.post("/dev-login")
async def dev_login():
    """개발용 자동 로그인 API - 테스트 사용자 자동 생성 및 로그인"""
    # 테스트 사용자 정보
    test_username = "testuser"
    test_email = "test@example.com"
    test_password = "password123"

    # 기존 테스트 사용자 확인
    user = users_collection.find_one({"username": test_username})

    # 없으면 생성
    if not user:
        user_doc = {
            "username": test_username,
            "email": test_email,
            "password": hash_password(test_password),
            "fullName": "Test User",
            "role": "user",
            "created_at": datetime.utcnow()
        }
        result = users_collection.insert_one(user_doc)
        user = users_collection.find_one({"_id": result.inserted_id})

    # 토큰 생성
    token = create_access_token({"user_id": str(user["_id"]), "username": user["username"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "fullName": user.get("fullName")
        }
    }
