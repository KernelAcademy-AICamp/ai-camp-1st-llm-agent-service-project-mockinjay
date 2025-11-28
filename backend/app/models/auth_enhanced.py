"""
Enhanced Authentication Models

Additional Pydantic models for improved authentication features:
- Email/username validation
- Password reset
- Refresh tokens
- Account management
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re


class CheckEmailRequest(BaseModel):
    """Request to check email availability"""
    email: EmailStr = Field(..., description="Email to check")


class CheckEmailResponse(BaseModel):
    """Response for email availability check"""
    available: bool
    message: str
    suggestions: Optional[list[str]] = Field(None, description="Alternative email suggestions if taken")


class CheckUsernameRequest(BaseModel):
    """Request to check username availability"""
    username: str = Field(..., min_length=3, max_length=20, description="Username to check")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format"""
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v


class CheckUsernameResponse(BaseModel):
    """Response for username availability check"""
    available: bool
    message: str
    suggestions: Optional[list[str]] = Field(None, description="Alternative username suggestions if taken")


class ForgotPasswordRequest(BaseModel):
    """Request to initiate password reset"""
    email: EmailStr = Field(..., description="User's email address")


class ForgotPasswordResponse(BaseModel):
    """Response for password reset initiation"""
    success: bool
    message: str
    reset_token_sent: bool


class ResetPasswordRequest(BaseModel):
    """Request to reset password with token"""
    token: str = Field(..., min_length=1, description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError("Passwords do not match")
        return v


class ResetPasswordResponse(BaseModel):
    """Response for password reset"""
    success: bool
    message: str


class ChangePasswordRequest(BaseModel):
    """Request to change password (authenticated)"""
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError("Passwords do not match")
        return v


class ChangePasswordResponse(BaseModel):
    """Response for password change"""
    success: bool
    message: str


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str = Field(..., description="Refresh token")


class RefreshTokenResponse(BaseModel):
    """Response with new access token"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class LogoutRequest(BaseModel):
    """Request to logout"""
    refresh_token: Optional[str] = Field(None, description="Refresh token to invalidate")


class LogoutResponse(BaseModel):
    """Response for logout"""
    success: bool
    message: str


class DeleteAccountRequest(BaseModel):
    """Request to delete account"""
    password: str = Field(..., description="User password for confirmation")
    confirmation: str = Field(..., description="Must be 'DELETE' to confirm")

    @field_validator('confirmation')
    @classmethod
    def validate_confirmation(cls, v: str) -> str:
        """Validate deletion confirmation"""
        if v != "DELETE":
            raise ValueError("Confirmation must be 'DELETE'")
        return v


class DeleteAccountResponse(BaseModel):
    """Response for account deletion"""
    success: bool
    message: str
    data_export_url: Optional[str] = Field(None, description="URL to download user data")


class EmailVerificationRequest(BaseModel):
    """Request to verify email"""
    token: str = Field(..., description="Email verification token")


class EmailVerificationResponse(BaseModel):
    """Response for email verification"""
    success: bool
    message: str


class ResendVerificationRequest(BaseModel):
    """Request to resend verification email"""
    email: EmailStr = Field(..., description="Email address")


class ResendVerificationResponse(BaseModel):
    """Response for resend verification"""
    success: bool
    message: str


# ============================================
# OAuth Models
# ============================================

class OAuthLoginRequest(BaseModel):
    """Request for OAuth login"""
    provider: str = Field(..., description="OAuth provider (google, kakao, naver)")
    code: str = Field(..., description="OAuth authorization code")
    redirect_uri: str = Field(..., description="Redirect URI used in OAuth flow")


class OAuthLoginResponse(BaseModel):
    """Response for OAuth login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict
    is_new_user: bool


class OAuthConnectRequest(BaseModel):
    """Request to connect OAuth account to existing account"""
    provider: str = Field(..., description="OAuth provider")
    code: str = Field(..., description="OAuth authorization code")


class OAuthConnectResponse(BaseModel):
    """Response for OAuth account connection"""
    success: bool
    message: str
    provider: str
    connected_email: str


class OAuthDisconnectRequest(BaseModel):
    """Request to disconnect OAuth account"""
    provider: str = Field(..., description="OAuth provider to disconnect")
    password: str = Field(..., description="Password for confirmation")


class OAuthDisconnectResponse(BaseModel):
    """Response for OAuth disconnection"""
    success: bool
    message: str
