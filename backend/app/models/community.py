# Post, Comment 데이터 모델
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Enum 정의
# ============================================================================

class PostType(str, Enum):
    """Post type enumeration"""
    BOARD = "BOARD"  # General board post
    CHALLENGE = "CHALLENGE"  # Challenge/challenge type post
    SURVEY = "SURVEY"  # Survey/poll type post


# ============================================================================
# Post 모델
# ============================================================================

class Post(BaseModel):
    """Post model for storing community posts"""
    id: Optional[str] = Field(None, description="Post ID (MongoDB ObjectId converted to string)")
    userId: str = Field(..., description="Author User ID")
    authorName: str = Field(..., description="Author name (for display)")
    title: str = Field(..., min_length=1, max_length=200, description="Post title")
    content: str = Field(..., min_length=1, description="Post content/body")
    postType: PostType = Field(..., description="Type of post (BOARD, CHALLENGE, SURVEY)")

    imageUrls: List[str] = Field(default=[], description="List of attached image URLs")
    thumbnailUrl: Optional[str] = Field(None, description="Thumbnail image URL (for list display)")

    likes: int = Field(default=0, description="Number of likes")
    commentCount: int = Field(default=0, description="Number of comments")
    viewCount: int = Field(default=0, description="Post view count (incremented on detail page view)")

    createdAt: datetime = Field(default_factory=datetime.utcnow, description="Post creation timestamp")
    updatedAt: datetime = Field(default_factory=datetime.utcnow, description="Post last modification timestamp")
    lastActivityAt: datetime = Field(default_factory=datetime.utcnow, description="Last activity timestamp (like comment added)")

    isPinned: bool = Field(default=False, description="Whether post is pinned to top")
    isDeleted: bool = Field(default=False, description="Soft delete flag (not physically deleted)")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user123",
                "authorName": "Hong Gildong",
                "title": "Started low-sodium diet!",
                "content": "Starting low-sodium diet today. Anyone want to join?",
                "postType": "BOARD",
                "imageUrls": ["/uploads/image1.jpg"],
                "likes": 5,
                "commentCount": 3
            }
        }


# ============================================================================
# Comment 모델
# ============================================================================

class Comment(BaseModel):
    """Comment model for storing comments on posts"""
    id: Optional[str] = Field(None, description="Comment ID (MongoDB ObjectId converted to string)")
    postId: str = Field(..., description="Associated Post ID")
    userId: str = Field(..., description="Author User ID")
    authorName: str = Field(..., description="Author name (for display)")
    content: str = Field(..., min_length=1, max_length=500, description="Comment content")

    createdAt: datetime = Field(default_factory=datetime.utcnow, description="Comment creation timestamp")
    updatedAt: datetime = Field(default_factory=datetime.utcnow, description="Comment last modification timestamp")
    isDeleted: bool = Field(default=False, description="Soft delete flag")

    class Config:
        json_schema_extra = {
            "example": {
                "postId": "post123",
                "userId": "user456",
                "authorName": "Kim Chulsu",
                "content": "I want to join too!"
            }
        }


# ============================================================================
# API 요청용 모델 (선택적 필드만)
# ============================================================================

class PostCreate(BaseModel):
    """Request model for creating a new post"""
    title: str = Field(..., min_length=1, max_length=200, description="Post title")
    content: str = Field(..., min_length=1, description="Post content")
    postType: PostType = Field(..., description="Type of post")
    imageUrls: List[str] = Field(default=[], description="List of image URLs to attach (max 5)")
    isAnonymous: bool = Field(default=False, description="Whether to post anonymously")
    anonymousId: Optional[str] = Field(None, description="Client-side anonymous ID for consistent identification")


class PostUpdate(BaseModel):
    """Request model for updating an existing post"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Updated post title")
    content: Optional[str] = Field(None, min_length=1, description="Updated post content")
    imageUrls: Optional[List[str]] = Field(None, description="Updated list of image URLs")


class CommentCreate(BaseModel):
    """Request model for creating a new comment"""
    postId: str = Field(..., description="ID of the post to comment on")
    content: str = Field(..., min_length=1, max_length=500, description="Comment content")
    isAnonymous: Optional[bool] = Field(False, description="Whether to post comment anonymously (for logged-in users)")
    anonymousId: Optional[str] = Field(None, description="Client-side anonymous ID for consistent anonymous numbering")


class CommentUpdate(BaseModel):
    """Request model for updating an existing comment"""
    content: str = Field(..., min_length=1, max_length=500, description="Updated comment content")
