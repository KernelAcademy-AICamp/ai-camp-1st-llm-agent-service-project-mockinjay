"""
Enhanced Authentication API Router

Additional authentication endpoints:
- Email/username availability checks
- Password reset flow
- Account management
- Refresh token support (future)
"""

import logging
from datetime import datetime, timedelta
import secrets
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends
from app.db.connection import get_users_collection
from app.services.auth import hash_password, verify_password, get_current_user
from app.models.auth_enhanced import (
    CheckEmailRequest,
    CheckEmailResponse,
    CheckUsernameRequest,
    CheckUsernameResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountRequest,
    DeleteAccountResponse,
)
from app.utils.validators import PasswordValidator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth-enhanced"])


# ============================================
# Email/Username Validation Endpoints
# ============================================

@router.post("/check-email", response_model=CheckEmailResponse)
async def check_email_availability(request: CheckEmailRequest) -> CheckEmailResponse:
    """
    Check if email is available for registration.

    This endpoint allows the frontend to check email availability
    before the user submits the registration form.

    Args:
        request: Email to check

    Returns:
        CheckEmailResponse: Availability status and message
    """
    users_collection = get_users_collection()

    # Check if email exists
    existing_user = await users_collection.find_one({"email": request.email})

    if existing_user:
        return CheckEmailResponse(
            available=False,
            message="이 이메일은 이미 사용 중입니다",
            suggestions=None
        )

    return CheckEmailResponse(
        available=True,
        message="사용 가능한 이메일입니다",
        suggestions=None
    )


@router.post("/check-username", response_model=CheckUsernameResponse)
async def check_username_availability(request: CheckUsernameRequest) -> CheckUsernameResponse:
    """
    Check if username is available for registration.

    This endpoint allows the frontend to check username availability
    before the user submits the registration form.

    Args:
        request: Username to check

    Returns:
        CheckUsernameResponse: Availability status and message
    """
    users_collection = get_users_collection()

    # Check if username exists
    existing_user = await users_collection.find_one({"username": request.username})

    if existing_user:
        # Generate suggestions by appending numbers
        base_username = request.username
        suggestions = [
            f"{base_username}{i}" for i in range(1, 4)
        ]

        return CheckUsernameResponse(
            available=False,
            message="이 사용자명은 이미 사용 중입니다",
            suggestions=suggestions
        )

    return CheckUsernameResponse(
        available=True,
        message="사용 가능한 사용자명입니다",
        suggestions=None
    )


# ============================================
# Password Reset Flow
# ============================================

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(request: ForgotPasswordRequest) -> ForgotPasswordResponse:
    """
    Initiate password reset flow.

    Generates a password reset token and sends it to the user's email.

    NOTE: Email sending is not implemented in this version. In production,
    you would send an email with the reset link.

    Args:
        request: User's email address

    Returns:
        ForgotPasswordResponse: Success status
    """
    users_collection = get_users_collection()

    # Find user by email
    user = await users_collection.find_one({"email": request.email})

    # For security, always return success even if email doesn't exist
    # This prevents email enumeration attacks
    if not user:
        logger.info(f"Password reset requested for non-existent email: {request.email}")
        return ForgotPasswordResponse(
            success=True,
            message="비밀번호 재설정 링크가 이메일로 전송되었습니다 (이메일이 등록되어 있는 경우)",
            reset_token_sent=False
        )

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)

    # Save token to database
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": reset_token_expires
            }
        }
    )

    logger.info(f"Password reset token generated for user {user['_id']}")

    # TODO: Send email with reset link
    # reset_link = f"https://careguide.com/reset-password?token={reset_token}"
    # send_email(user["email"], "Password Reset", reset_link)

    return ForgotPasswordResponse(
        success=True,
        message="비밀번호 재설정 링크가 이메일로 전송되었습니다",
        reset_token_sent=True
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest) -> ResetPasswordResponse:
    """
    Reset password using reset token.

    Validates the reset token and sets a new password.

    Args:
        request: Reset token and new password

    Returns:
        ResetPasswordResponse: Success status
    """
    users_collection = get_users_collection()

    # Validate password
    password_valid, password_errors = PasswordValidator.validate(request.new_password)
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "비밀번호가 요구사항을 충족하지 않습니다",
                "errors": password_errors,
                "requirements": PasswordValidator.get_requirements_text()
            }
        )

    # Find user with valid reset token
    user = await users_collection.find_one({
        "reset_token": request.token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않거나 만료된 재설정 토큰입니다"
        )

    # Update password and clear reset token
    hashed_password = hash_password(request.new_password)

    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": hashed_password,
                "updated_at": datetime.utcnow()
            },
            "$unset": {
                "reset_token": "",
                "reset_token_expires": ""
            }
        }
    )

    logger.info(f"Password reset successful for user {user['_id']}")

    return ResetPasswordResponse(
        success=True,
        message="비밀번호가 성공적으로 재설정되었습니다"
    )


# ============================================
# Password Change (Authenticated)
# ============================================

@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
) -> ChangePasswordResponse:
    """
    Change password for authenticated user.

    Requires current password for verification.

    Args:
        request: Current password and new password
        current_user: Current authenticated user from JWT

    Returns:
        ChangePasswordResponse: Success status
    """
    users_collection = get_users_collection()

    # Verify current password
    if not verify_password(request.current_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다"
        )

    # Validate new password
    password_valid, password_errors = PasswordValidator.validate(request.new_password)
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "비밀번호가 요구사항을 충족하지 않습니다",
                "errors": password_errors,
                "requirements": PasswordValidator.get_requirements_text()
            }
        )

    # Check that new password is different from current
    if verify_password(request.new_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="새 비밀번호는 현재 비밀번호와 달라야 합니다"
        )

    # Update password
    hashed_password = hash_password(request.new_password)

    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "password": hashed_password,
                "updated_at": datetime.utcnow()
            }
        }
    )

    logger.info(f"Password changed successfully for user {current_user['_id']}")

    return ChangePasswordResponse(
        success=True,
        message="비밀번호가 성공적으로 변경되었습니다"
    )


# ============================================
# Account Deletion
# ============================================

@router.delete("/account", response_model=DeleteAccountResponse)
async def delete_account(
    request: DeleteAccountRequest,
    current_user: dict = Depends(get_current_user)
) -> DeleteAccountResponse:
    """
    Delete user account.

    This is a destructive operation that permanently deletes the user
    and all associated data. Requires password confirmation.

    Args:
        request: Password and confirmation
        current_user: Current authenticated user from JWT

    Returns:
        DeleteAccountResponse: Success status and data export URL
    """
    users_collection = get_users_collection()

    # Verify password
    if not verify_password(request.password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 올바르지 않습니다"
        )

    user_id = str(current_user["_id"])

    # TODO: Export user data before deletion (GDPR compliance)
    # data_export_url = await export_user_data(user_id)

    # Delete user data from all collections
    try:
        # Delete from users collection
        await users_collection.delete_one({"_id": current_user["_id"]})

        # Delete user data from other collections
        from app.db.connection import db

        # Chat rooms and messages
        db["rooms"].delete_many({"user_id": user_id})
        db["conversations"].delete_many({"user_id": user_id})

        # Community posts and comments (mark as deleted but keep for moderation)
        db["posts"].update_many(
            {"userId": user_id},
            {"$set": {"isDeleted": True, "userId": "deleted_user"}}
        )
        db["comments"].update_many(
            {"userId": user_id},
            {"$set": {"isDeleted": True, "userId": "deleted_user"}}
        )

        # Diet/health data
        db["diet_sessions"].delete_many({"user_id": user_id})
        db["diet_meals"].delete_many({"user_id": user_id})
        db["diet_goals"].delete_many({"user_id": user_id})
        db["health_labs"].delete_many({"user_id": user_id})
        db["health_medications"].delete_many({"user_id": user_id})
        db["health_vitals"].delete_many({"user_id": user_id})
        db["health_symptoms"].delete_many({"user_id": user_id})

        # Bookmarks and preferences
        db["bookmarks"].delete_many({"user_id": user_id})
        db["user_preferences"].delete_many({"user_id": user_id})

        logger.info(f"Account deleted successfully for user {user_id}")

        return DeleteAccountResponse(
            success=True,
            message="계정이 성공적으로 삭제되었습니다",
            data_export_url=None  # TODO: Implement data export
        )

    except Exception as e:
        logger.error(f"Error deleting account for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="계정 삭제 중 오류가 발생했습니다"
        )


# ============================================
# Health Check
# ============================================

@router.get("/health")
async def health_check():
    """Health check endpoint for Enhanced Auth API"""
    return {
        "status": "healthy",
        "service": "auth_enhanced_api",
        "endpoints": {
            "check_email": "ready",
            "check_username": "ready",
            "forgot_password": "ready",
            "reset_password": "ready",
            "change_password": "ready",
            "delete_account": "ready"
        }
    }
