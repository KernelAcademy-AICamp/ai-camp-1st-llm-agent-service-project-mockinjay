from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserResponse, ProfileUpdateRequest, ProfileType
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.parlant_service import create_parlant_customer, update_parlant_customer_profile
from app.db.connection import get_users_collection
from app.utils.validators import PasswordValidator, UsernameValidator
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    fullName: str | None = None
    profile: ProfileType = "general"  # Default: general

    @field_validator('profile')
    @classmethod
    def validate_profile(cls, v):
        """Validate profile type"""
        valid_profiles = ["general", "patient", "researcher"]
        if v not in valid_profiles:
            raise ValueError(f"Profile must be one of: {', '.join(valid_profiles)}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "username": "testuser",
                "email": "test@example.com",
                "password": "password123",
                "fullName": "Test User",
                "profile": "general"
            }
        }

@router.post("/register")
async def register(user_data: RegisterRequest):
    """회원가입 API"""
    users_collection = get_users_collection()

    # 사용자명 검증
    username_valid, username_error = UsernameValidator.validate(user_data.username)
    if not username_valid:
        raise HTTPException(status_code=400, detail=username_error)

    # 비밀번호 검증
    password_valid, password_errors = PasswordValidator.validate(user_data.password)
    if not password_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "비밀번호가 요구사항을 충족하지 않습니다",
                "errors": password_errors,
                "requirements": PasswordValidator.get_requirements_text()
            }
        )

    # 아이디 중복 확인
    if await users_collection.find_one({"username": user_data.username}):
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다")

    # 이메일 중복 확인
    if await users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다")

    # 사용자 생성
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "fullName": user_data.fullName,
        "profile": user_data.profile,  # Store profile type
        "role": "user",
        "created_at": datetime.utcnow()
    }
    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create Parlant customer for the new user
    # 새 사용자를 위한 Parlant 고객 생성
    parlant_customer_id = None
    try:
        parlant_customer_id = await create_parlant_customer(user_id, user_data.profile)
        if parlant_customer_id:
            # Save parlant_customer_id to user document
            # 사용자 문서에 parlant_customer_id 저장
            await users_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"parlant_customer_id": parlant_customer_id}}
            )
            logger.info(f"✅ Created Parlant customer for user {user_id}: {parlant_customer_id}")
    except Exception as e:
        # Log error but don't fail registration
        # 오류 로그 기록하지만 회원가입은 실패하지 않음
        logger.warning(f"Failed to create Parlant customer for user {user_id}: {e}")

    # 토큰 생성
    token = create_access_token({"user_id": user_id, "username": user_data.username})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "fullName": user_data.fullName,
            "profile": user_data.profile,  # Include profile in response
            "parlant_customer_id": parlant_customer_id  # Include Parlant customer ID
        }
    }

@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    """로그인 API - OAuth2 form 형식"""
    users_collection = get_users_collection()

    # 사용자 찾기 (username 또는 email로 로그인 가능)
    user = await users_collection.find_one({"$or": [{"username": username}, {"email": username}]})

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
            "fullName": user.get("fullName"),
            "profile": user.get("profile", "general"),  # Include profile, default to "general" if not set
            "parlant_customer_id": user.get("parlant_customer_id")  # Include Parlant customer ID
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "fullName": current_user.get("fullName"),
        "profile": current_user.get("profile", "general"),  # Include profile, default to "general" if not set
        "role": current_user.get("role", "user"),
        "parlant_customer_id": current_user.get("parlant_customer_id")  # Include Parlant customer ID
    }

@router.patch("/profile")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile type
    사용자 프로필 타입 업데이트

    Updates the current logged-in user's profile type (general, patient, researcher).
    This affects how the chat agents interact with the user.
    Also updates Parlant customer tags if customer exists.

    현재 로그인한 사용자의 프로필 타입을 업데이트합니다.
    이는 채팅 에이전트가 사용자와 상호작용하는 방식에 영향을 줍니다.
    고객이 존재하면 Parlant 고객 태그도 업데이트합니다.
    """
    users_collection = get_users_collection()

    # Update user profile in database
    result = await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile": profile_data.profile}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    # Update Parlant customer tags if customer exists
    # Parlant 고객 태그 업데이트 (고객이 존재하는 경우)
    parlant_customer_id = current_user.get("parlant_customer_id")
    if parlant_customer_id:
        try:
            await update_parlant_customer_profile(parlant_customer_id, profile_data.profile)
            logger.info(f"✅ Updated Parlant customer tags for user {current_user['_id']}")
        except Exception as e:
            # Log error but don't fail the profile update
            # 오류 로그 기록하지만 프로필 업데이트는 실패하지 않음
            logger.warning(f"Failed to update Parlant customer tags: {e}")

    return {
        "success": True,
        "message": "프로필이 성공적으로 업데이트되었습니다",
        "profile": profile_data.profile
    }

# 기존 API와의 호환성을 위해 유지
@router.post("/signup")
async def signup(user: UserCreate):
    """레거시 회원가입 API"""
    users_collection = get_users_collection()

    # 비밀번호 검증
    password_valid, password_errors = PasswordValidator.validate(user.password)
    if not password_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "비밀번호가 요구사항을 충족하지 않습니다",
                "errors": password_errors,
                "requirements": PasswordValidator.get_requirements_text()
            }
        )

    # 이메일 중복 확인
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다")

    # 사용자 생성
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "username": user.email.split("@")[0],  # 이메일에서 username 생성
        "profile": user.profile,
        "role": user.role,
        "gender": getattr(user, 'gender', None),
        "birth_date": getattr(user, 'birth_date', None),
        "height": getattr(user, 'height', None),
        "weight": getattr(user, 'weight', None),
        "diagnosis": getattr(user, 'diagnosis', None),
        "created_at": datetime.utcnow()
    }
    result = await users_collection.insert_one(user_doc)

    return {"success": True, "message": "회원가입 성공"}

@router.get("/check-email")
async def check_email_availability(email: str):
    """
    Check if email is available for registration
    이메일 사용 가능 여부 확인

    Args:
        email (str): Email to check

    Returns:
        dict: {available: bool, message: str}
    """
    users_collection = get_users_collection()

    # Check if email already exists
    existing_user = await users_collection.find_one({"email": email})

    if existing_user:
        return {
            "available": False,
            "message": "이미 사용 중인 이메일입니다."
        }

    return {
        "available": True,
        "message": "사용 가능한 이메일입니다."
    }


@router.get("/check-username")
async def check_username_availability(username: str):
    """
    Check if username (nickname) is available for registration
    사용자명(닉네임) 사용 가능 여부 확인

    Args:
        username (str): Username/nickname to check

    Returns:
        dict: {available: bool, message: str}
    """
    users_collection = get_users_collection()

    # Validate username format first
    username_valid, username_error = UsernameValidator.validate(username)
    if not username_valid:
        return {
            "available": False,
            "message": username_error
        }

    # Check if username already exists
    existing_user = await users_collection.find_one({"username": username})

    if existing_user:
        return {
            "available": False,
            "message": "이미 사용 중인 닉네임입니다."
        }

    return {
        "available": True,
        "message": "사용 가능한 닉네임입니다."
    }


@router.post("/dev-login")
async def dev_login():
    """개발용 자동 로그인 API - 테스트 사용자 자동 생성 및 로그인"""
    users_collection = get_users_collection()

    # 테스트 사용자 정보
    test_username = "testuser"
    test_email = "test@example.com"
    test_password = "password123"

    # 기존 테스트 사용자 확인
    user = await users_collection.find_one({"username": test_username})

    # 없으면 생성
    if not user:
        user_doc = {
            "username": test_username,
            "email": test_email,
            "password": hash_password(test_password),
            "fullName": "Test User",
            "profile": "general",  # Default profile for test user
            "role": "user",
            "created_at": datetime.utcnow()
        }
        result = await users_collection.insert_one(user_doc)
        user = await users_collection.find_one({"_id": result.inserted_id})

    # 토큰 생성
    token = create_access_token({"user_id": str(user["_id"]), "username": user["username"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "fullName": user.get("fullName"),
            "profile": user.get("profile", "general")  # Include profile in response
        }
    }
