"""
Standard API Response Models
"""
from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict
from datetime import datetime


class ErrorDetail(BaseModel):
    """Error detail information"""
    field: Optional[str] = None
    message: str
    code: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response format"""
    success: bool = False
    error: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Machine-readable error code")
    details: Optional[List[ErrorDetail]] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    path: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Validation failed",
                "error_code": "VALIDATION_ERROR",
                "details": [
                    {
                        "field": "email",
                        "message": "Invalid email format",
                        "code": "INVALID_FORMAT"
                    }
                ],
                "timestamp": "2025-01-15T10:30:00",
                "path": "/api/auth/register"
            }
        }


class SuccessResponse(BaseModel):
    """Standard success response format"""
    success: bool = True
    message: str
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {"id": "123", "status": "active"},
                "timestamp": "2025-01-15T10:30:00"
            }
        }


class PaginatedResponse(BaseModel):
    """Paginated response format"""
    success: bool = True
    data: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": [{"id": "1", "name": "Item 1"}],
                "total": 100,
                "page": 1,
                "page_size": 10,
                "total_pages": 10
            }
        }
