# Community API endpoints (posts and comments)
from fastapi import APIRouter, HTTPException, Query, File, UploadFile, Request
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import shutil
from pathlib import Path
import os
import uuid
import logging

from app.models.community import Post, PostCreate, PostUpdate, PostType, Comment, CommentCreate, CommentUpdate
from app.db.connection import db
from app.services.auth import get_current_user

# Configure logger for this module (모듈 로거 설정)
logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# Test Authorization Configuration (Safe Testing Mode)
# 테스트 인증 설정 (안전한 테스트 모드)
# ============================================================================
# Control test authorization with environment variable
# 환경 변수로 테스트 인증 제어
# Set TEST_AUTH_ENABLED=true to enable test mode (ONLY for local testing)
# TEST_AUTH_ENABLED=true로 설정하면 테스트 모드 활성화 (로컬 테스트 전용)
# In production, this should NOT be set or should be empty
# 프로덕션에서는 이 변수를 설정하지 않거나 비워두어야 함
TEST_AUTH_ENABLED = os.getenv("TEST_AUTH_ENABLED", "").lower() == "true"

# Log warning if test mode is enabled (테스트 모드 활성화 시 경고 로그)
if TEST_AUTH_ENABLED:
    logger.warning("Authorization Testing Mode enabled - this should NOT be used in production (인증 테스트 모드 활성화됨 - 프로덕션에서 사용하지 마세요)")


def check_author_permission(user_id: str, author_id: str, operation: str = "modify"):
    """
    Check if user is authorized to modify/delete a resource.

    In test mode (TEST_AUTH_ENABLED=false), always allows any operation.
    In production mode (TEST_AUTH_ENABLED=true), checks user matches author.

    Args:
        user_id (str): Current user's ID
        author_id (str): Resource author's ID
        operation (str): Operation type for error message (modify, delete, etc.)

    Raises:
        HTTPException: 403 if authorization fails (only in TEST_AUTH_ENABLED=true mode)
    """
    if TEST_AUTH_ENABLED and user_id != author_id:
        raise HTTPException(
            status_code=403,
            detail=f"권한이 없습니다. {operation} 권한이 있는 사용자만 가능합니다."
        )


# ============================================================================
# Helper Functions
# ============================================================================

def get_user_id_from_request(request: Request, client_anonymous_id: str = None) -> tuple[str, bool, str | None]:
    """
    Get user ID and username from request, or use client-provided anonymous ID.

    Since /api/community/ is a public path, the auth middleware doesn't process tokens.
    This function manually parses the JWT token if present.

    Args:
        request: FastAPI request object
        client_anonymous_id: Optional client-provided anonymous ID for consistent identification

    Returns:
        tuple: (user_id, is_authenticated, username)
            - user_id: Authenticated user ID or anonymous ID
            - is_authenticated: True if user is logged in, False if anonymous
            - username: Username if authenticated, None otherwise
    """
    # Try to get authenticated user ID from request state (set by middleware)
    if hasattr(request.state, "user_id") and request.state.user_id:
        username = None
        if hasattr(request.state, "token_payload") and request.state.token_payload:
            username = request.state.token_payload.get("username")
        return str(request.state.user_id), True, username

    # Since /api/community/ is public, manually parse JWT token if present
    auth_header = request.headers.get("Authorization")
    if auth_header:
        try:
            scheme, token = auth_header.split()
            if scheme.lower() == "bearer":
                from jose import jwt
                from app.config import settings
                payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
                user_id = payload.get("user_id")
                username = payload.get("username")
                if user_id:
                    return str(user_id), True, username
        except Exception:
            # Token invalid or expired - continue as anonymous
            pass

    # Use client-provided anonymous ID for consistent identification
    # This allows the same anonymous user to maintain the same identity across requests
    if client_anonymous_id:
        return client_anonymous_id, False, None

    # Fallback: generate a temporary anonymous ID (not consistent across requests)
    anonymous_id = f"anon_{uuid.uuid4().hex[:16]}"
    return anonymous_id, False, None


def serialize_post(post: dict) -> dict:
    """
    Convert MongoDB document to JSON-serializable dictionary.

    Converts ObjectId to string and datetime objects to ISO format strings.

    Args:
        post (dict): MongoDB post document

    Returns:
        dict: Serialized post document ready for JSON response
    """
    if post:
        post["id"] = str(post.pop("_id"))
        # Convert datetime to ISO string format
        for field in ["createdAt", "updatedAt", "lastActivityAt"]:
            if field in post and isinstance(post[field], datetime):
                post[field] = post[field].isoformat()
    return post


# ============================================================================
# DEBUG Endpoint (for troubleshooting)
# ============================================================================

@router.get("/debug")
async def debug_posts():
    """
    Debug endpoint to check raw MongoDB data.
    """
    collection = db["posts"]

    # Get all posts count
    total_count = await collection.count_documents({})
    deleted_count = await collection.count_documents({"isDeleted": True})
    active_count = await collection.count_documents({"isDeleted": False})

    # Get sample posts (raw data)
    sample_cursor = collection.find({}).limit(5)
    sample_posts = await sample_cursor.to_list(length=5)

    # Convert ObjectId to string for JSON serialization
    for post in sample_posts:
        post["_id"] = str(post["_id"])
        for field in ["createdAt", "updatedAt", "lastActivityAt"]:
            if field in post and hasattr(post[field], 'isoformat'):
                post[field] = post[field].isoformat()

    return {
        "database": db.name,
        "collection": "posts",
        "total_count": total_count,
        "deleted_count": deleted_count,
        "active_count": active_count,
        "sample_posts": sample_posts
    }


# ============================================================================
# POST Endpoints
# ============================================================================

@router.get("/posts")
async def get_posts(
    limit: int = Query(20, ge=1, le=50, description="Number of posts to fetch"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination (last post ID)"),
    postType: Optional[PostType] = Query(None, description="Filter by post type"),
    sortBy: str = Query("lastActivityAt", description="Sort field: createdAt, likes, lastActivityAt")
):
    """
    Get all posts with infinite scroll pagination.

    Fetches posts with cursor-based pagination for efficient infinite scrolling.
    Can filter by post type and sort by different fields.
    Includes all posts (featured posts are also shown in the list).

    Args:
        limit (int): Number of posts to fetch (1-50, default: 20)
        cursor (Optional[str]): Last post ID from previous request for pagination
        postType (Optional[PostType]): Filter by BOARD, CHALLENGE, or SURVEY
        sortBy (str): Sort field (createdAt, likes, or lastActivityAt)

    Returns:
        dict: Contains posts list, nextCursor for pagination, and hasMore flag

    Raises:
        HTTPException: 400 if cursor is invalid format
    """
    collection = db["posts"]

    # Build query filter - only exclude deleted posts (show all posts including featured)
    query = {"isDeleted": False}

    # Add post type filter if specified
    if postType:
        query["postType"] = postType

    # Cursor-based pagination - fetch posts before the cursor
    if cursor:
        try:
            query["_id"] = {"$lt": ObjectId(cursor)}
        except Exception as e:
            # 잘못된 커서 형식 (Invalid cursor format)
            logger.warning(f"Invalid cursor format: {e}")
            raise HTTPException(status_code=400, detail="Invalid cursor")

    # Validate sort field
    sort_field = sortBy if sortBy in ["createdAt", "likes", "lastActivityAt"] else "lastActivityAt"

    # Fetch posts from database (비동기 커서를 리스트로 변환)
    cursor_obj = collection.find(query).sort(sort_field, -1).limit(limit)
    posts = await cursor_obj.to_list(length=limit)

    # Serialize posts for JSON response
    serialized_posts = [serialize_post(post) for post in posts]

    # Generate next cursor for pagination
    next_cursor = serialized_posts[-1]["id"] if serialized_posts else None

    return {
        "posts": serialized_posts,
        "nextCursor": next_cursor,
        "hasMore": len(serialized_posts) == limit
    }


@router.get("/posts/featured")
async def get_featured_posts():
    """
    Get top 3 featured posts (COM-015).

    Returns featured posts with priority order:
    1. Pinned posts (isPinned=true, sorted by createdAt DESC)
    2. Popular posts with likes >= 10 OR viewCount >= 10 (sorted by popularity score)

    Returns:
        dict: Contains:
            - featuredPosts: List of up to 3 featured posts

    Example:
        GET /api/community/posts/featured
        Returns: {
            "featuredPosts": [post1, post2, post3]
        }
    """
    collection = db["posts"]

    # Fetch pinned posts first (most recent first)
    pinned_cursor = collection.find(
        {"isPinned": True, "isDeleted": False}
    ).sort("createdAt", -1).limit(3)
    pinned_posts = await pinned_cursor.to_list(length=3)

    # If less than 3 pinned posts, fill with popular posts
    if len(pinned_posts) < 3:
        remaining = 3 - len(pinned_posts)
        pinned_ids = [post["_id"] for post in pinned_posts]

        # Fetch popular posts using aggregation pipeline
        # Only include posts with likes >= 10 OR viewCount >= 10
        popular_cursor = collection.aggregate([
            {
                "$match": {
                    "isDeleted": False,
                    "_id": {"$nin": pinned_ids},
                    "$or": [
                        {"likes": {"$gte": 10}},
                        {"viewCount": {"$gte": 10}}
                    ]
                }
            },
            {
                "$addFields": {
                    "popularity": {
                        "$add": [
                            {"$ifNull": ["$viewCount", 0]},
                            {"$ifNull": ["$likes", 0]},
                            {"$ifNull": ["$commentCount", 0]}
                        ]
                    }
                }
            },
            {"$sort": {"popularity": -1}},
            {"$limit": remaining}
        ])
        popular_posts = await popular_cursor.to_list(length=remaining)

        pinned_posts.extend(popular_posts)

    return {
        "featuredPosts": [serialize_post(post) for post in pinned_posts]
    }


@router.get("/posts/{postId}")
async def get_post(request: Request, postId: str):
    """
    Get a single post by ID with detail view (COM-007).

    Retrieves a specific post document from the database and increments viewCount.
    Excludes deleted posts. Also fetches all associated comments.
    Supports both authenticated and non-authenticated users.

    Args:
        request (Request): FastAPI request object (to get user authentication status)
        postId (str): MongoDB ObjectId of the post

    Returns:
        dict: Contains:
            - post: Post document with viewCount incremented
            - comments: List of comments associated with the post
            - If authenticated: post includes likedByMe field
            - If non-authenticated: likedByMe is false

    Raises:
        HTTPException: 400 if postId format is invalid
        HTTPException: 404 if post not found or is deleted
    """
    posts_collection = db["posts"]
    comments_collection = db["comments"]

    # Fetch post by ID
    try:
        post = await posts_collection.find_one({"_id": ObjectId(postId), "isDeleted": False})
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment viewCount atomically (thread-safe)
    await posts_collection.update_one(
        {"_id": ObjectId(postId)},
        {"$inc": {"viewCount": 1}}
    )

    # Update the post object with incremented viewCount
    post["viewCount"] = post.get("viewCount", 0) + 1

    # Fetch all non-deleted comments for this post, sorted by creation date
    comments_cursor = comments_collection.find(
        {"postId": postId, "isDeleted": False}
    ).sort("createdAt", -1)
    comments = await comments_cursor.to_list(length=None)

    # Serialize post and comments for JSON response
    serialized_post = serialize_post(post)
    serialized_comments = [serialize_comment(comment) for comment in comments]

    # Get current user ID and check if they liked the post
    current_user_id, is_authenticated, _ = get_user_id_from_request(request)
    likes_collection = db["likes"]
    user_liked = (await likes_collection.find_one({
        "postId": postId,
        "userId": current_user_id
    })) is not None

    # Transform post to match PostDetail interface
    # Map userId and authorName to author object
    post_detail = {
        **serialized_post,
        "userId": serialized_post.get("userId", ""),  # Explicitly include userId
        "author": {
            "id": serialized_post.get("userId", ""),
            "name": serialized_post.get("authorName", ""),
            "profileImage": None  # TODO: Add profile image field when user profiles are implemented
        },
        "authorId": serialized_post.get("userId", ""),
        "likedByMe": user_liked,
        "viewCount": serialized_post.get("viewCount", 0)
    }

    # Return post detail with comments
    return {
        "post": post_detail,
        "comments": serialized_comments
    }


async def get_anonymous_number_for_post(post_id: str, user_id: str, is_author: bool = False) -> tuple[int, bool]:
    """
    게시글 내에서 사용자별 익명 번호를 계산하거나 생성합니다.
    Calculates or creates an anonymous number for a user within a specific post.

    이 함수는 게시글에서 각 사용자에게 고유한 익명 번호를 할당합니다.
    This function assigns a unique anonymous number to each user within a post.
    같은 사용자는 같은 게시글에서 항상 같은 번호를 받습니다.
    The same user always gets the same number within the same post.
    다른 게시글에서는 독립적인 번호 체계를 가집니다.
    Different posts have independent numbering systems.

    에브리타임/블라인드 스타일 규칙:
    Everytime/Blind style rules:
    - 글쓴이는 항상 "익명(글쓴이)" 표시 (번호 없음, 카운터에 포함 안 됨)
      Author is always displayed as "익명(글쓴이)" (no number, not counted)
    - 댓글 작성자는 "익명1", "익명2" 순서대로 (1부터 시작)
      Commenters get "익명1", "익명2" in order (starting from 1)
    - 같은 사용자가 같은 게시글에 댓글 여러 개 → 같은 번호
      Same user posting multiple comments on same post → same number

    Args:
        post_id (str): 게시글 ID (Post ID)
        user_id (str): 사용자 ID (클라이언트가 제공한 익명 ID일 수도 있음)
                       User ID (can be anonymous ID from client)
        is_author (bool): 이 사용자가 게시글 작성자인지 여부
                          Whether this user is the post author

    Returns:
        tuple[int, bool]: (익명 번호, 게시글 작성자 여부)
                          (anonymous number, is post author)
            - anonymous_number: 작성자는 0, 댓글러는 1, 2, 3...
                                0 for author, 1, 2, 3... for commenters
            - is_post_author: 이 사용자가 게시글 작성자인 경우 True
                              True if this user is the post author
    """
    anon_collection = db["post_anonymous_users"]

    # Check if user already has an anonymous number for this post
    existing = await anon_collection.find_one({"postId": post_id, "userId": user_id})
    if existing:
        return existing["anonymousNumber"], existing.get("isAuthor", False)

    # If this is the post author, they get special treatment (no number)
    if is_author:
        await anon_collection.insert_one({
            "postId": post_id,
            "userId": user_id,
            "anonymousNumber": 0,  # Author gets 0 (displayed as "익명(글쓴이)")
            "isAuthor": True,
            "createdAt": datetime.utcnow()
        })
        return 0, True

    # Get the next anonymous number for commenters (starts from 1)
    from pymongo import ReturnDocument
    counter = await db["counters"].find_one_and_update(
        {"_id": f"anonymous_number_{post_id}"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    new_number = counter.get("value", 1)

    # Save the mapping for commenter
    await anon_collection.insert_one({
        "postId": post_id,
        "userId": user_id,
        "anonymousNumber": new_number,
        "isAuthor": False,
        "createdAt": datetime.utcnow()
    })

    return new_number, False


def format_anonymous_name(anon_number: int, is_author: bool) -> str:
    """
    익명 표시 이름을 에브리타임/블라인드 패턴에 따라 포맷팅합니다.
    Formats anonymous display name based on Everytime/Blind pattern.

    규칙 (Rules):
    - 게시글 작성자: "익명(글쓴이)" - 번호와 관계없이 항상
      Post author: "익명(글쓴이)" - always, regardless of number
    - 댓글 작성자: "익명1", "익명2" 등
      Commenters: "익명1", "익명2", etc.

    Args:
        anon_number (int): 익명 번호 (0은 작성자, 1부터는 댓글러)
                           Anonymous number (0 for author, 1+ for commenters)
        is_author (bool): 게시글 작성자 여부
                          Whether this is the post author

    Returns:
        str: 포맷된 익명 이름 (Formatted anonymous name)
    """
    if is_author:
        return "익명(글쓴이)"
    return f"익명{anon_number}"


@router.post("/posts", status_code=201)
async def create_post(request: Request, post_data: PostCreate):
    """
    Create a new post.

    Creates a new community post with provided title, content, and type.
    Automatically sets timestamps and initializes counters.
    Supports both authenticated and unauthenticated (anonymous) users.

    Anonymous Posting Rules:
    1. Non-logged-in users: Always post as anonymous (익명1, 익명2, etc.)
    2. Logged-in users: Can choose to post as anonymous or with their real name via isAnonymous flag

    Args:
        request (Request): FastAPI request object (to get user authentication status)
        post_data (PostCreate): Post creation data including title, content, type, isAnonymous

    Returns:
        dict: Created post document with generated ID
    """
    collection = db["posts"]

    # TODO: 3개 이상 이미지 업로드 시 프론트엔드에서 404 에러 발생 중 - 임시로 최대 2개로 제한
    image_urls = post_data.imageUrls[:2] if post_data.imageUrls else []

    # Get current UTC timestamp
    now = datetime.utcnow()

    # Get user ID, authentication status, and username
    # Pass client-provided anonymousId for consistent anonymous identification
    user_id, is_authenticated, username = get_user_id_from_request(request, post_data.anonymousId)

    # Determine if post should be anonymous
    # Rule: Non-logged-in users OR logged-in users who choose anonymous
    is_anonymous = (not is_authenticated) or post_data.isAnonymous

    # Determine author name (에브리타임/블라인드 스타일)
    if is_anonymous:
        # Anonymous post - author is always "익명(글쓴이)" (에브리타임 style)
        author_name = "익명(글쓴이)"
    else:
        # Logged in user with real name from JWT token
        author_name = username or "사용자"

    post_doc = {
        "userId": user_id,
        "authorName": author_name,
        "isAnonymous": is_anonymous,
        "isAuthenticated": is_authenticated,  # Track if author was logged in
        "title": post_data.title,
        "content": post_data.content,
        "postType": post_data.postType,
        "imageUrls": image_urls,
        "thumbnailUrl": image_urls[0] if image_urls else None,
        "likes": 0,
        "commentCount": 0,
        "viewCount": 0,
        "createdAt": now,
        "updatedAt": now,
        "lastActivityAt": now,
        "isPinned": False,
        "isDeleted": False
    }

    # Insert document to MongoDB
    result = await collection.insert_one(post_doc)
    post_id = str(result.inserted_id)

    # If anonymous, save the anonymous mapping for the post author
    # 에브리타임 스타일: 글쓴이는 "익명(글쓴이)"로 표시, 번호는 0 (카운터에 포함 안 됨)
    if is_anonymous:
        anon_collection = db["post_anonymous_users"]
        await anon_collection.insert_one({
            "postId": post_id,
            "userId": user_id,
            "anonymousNumber": 0,  # Author gets 0 (displayed as "익명(글쓴이)", not counted)
            "isAuthor": True,  # Mark as post author for special display
            "createdAt": now
        })
        # Initialize the counter for this post at 0 (first commenter gets 익명1)
        await db["counters"].update_one(
            {"_id": f"anonymous_number_{post_id}"},
            {"$set": {"value": 0}},
            upsert=True
        )

    # Fetch and return created post
    created_post = await collection.find_one({"_id": result.inserted_id})

    return serialize_post(created_post)


@router.put("/posts/{postId}")
async def update_post(request: Request, postId: str, post_data: PostUpdate):
    """
    Update an existing post.

    Updates post fields (title, content, images) and refreshes the updatedAt timestamp.
    Only updates fields that are provided in the request.

    Requires:
        Authentication required - only post author can update
        인증 필수 - 게시글 작성자만 수정 가능

    Args:
        request (Request): FastAPI request object (JWT 토큰 추출용)
        postId (str): MongoDB ObjectId of the post to update
        post_data (PostUpdate): Update data with optional fields

    Returns:
        dict: Updated post document

    Raises:
        HTTPException: 400 if postId format is invalid
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not authorized (not the post author)
        HTTPException: 404 if post not found
    """
    collection = db["posts"]

    # Fetch post to check author (게시글 조회하여 작성자 확인)
    try:
        post = await collection.find_one({"_id": ObjectId(postId), "isDeleted": False})
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Get current user from JWT token (JWT 토큰에서 현재 사용자 추출)
    current_user_id, is_authenticated, _ = get_user_id_from_request(request)
    if not is_authenticated:
        raise HTTPException(status_code=401, detail="Authentication required (인증이 필요합니다)")

    # Check authorization - only post author can update (권한 확인 - 게시글 작성자만 수정 가능)
    check_author_permission(current_user_id, post["userId"], "update")

    # Build update document with only provided fields
    now = datetime.utcnow()
    update_doc = {
        "updatedAt": now.isoformat() + "Z",
        "lastActivityAt": now.isoformat() + "Z"
    }

    if post_data.title:
        update_doc["title"] = post_data.title
    if post_data.content:
        update_doc["content"] = post_data.content
    if post_data.imageUrls is not None:
        update_doc["imageUrls"] = post_data.imageUrls
        update_doc["thumbnailUrl"] = post_data.imageUrls[0] if post_data.imageUrls else None

    # Update document in MongoDB
    try:
        result = await collection.update_one(
            {"_id": ObjectId(postId), "isDeleted": False},
            {"$set": update_doc}
        )
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format during update: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")

    # Fetch and return updated post
    updated_post = await collection.find_one({"_id": ObjectId(postId)})

    return serialize_post(updated_post)


@router.delete("/posts/{postId}", status_code=204)
async def delete_post(request: Request, postId: str, anonymousId: str = None):
    """
    Delete a post (hard delete).

    Permanently removes the post and all associated comments and likes from the database.
    Only the post author can delete the post.

    Args:
        request (Request): FastAPI request object
        postId (str): MongoDB ObjectId of the post to delete
        anonymousId (str): Optional client-provided anonymous ID for identification

    Returns:
        None

    Raises:
        HTTPException: 400 if postId format is invalid
        HTTPException: 403 if not authorized (only post author can delete)
        HTTPException: 404 if post not found
    """
    posts_collection = db["posts"]
    comments_collection = db["comments"]
    likes_collection = db["likes"]

    # Fetch post to check author
    try:
        post = await posts_collection.find_one({"_id": ObjectId(postId)})
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Get current user ID from request
    current_user_id, _, _ = get_user_id_from_request(request, anonymousId)

    # Check authorization - only post author can delete
    if current_user_id != post["userId"]:
        raise HTTPException(
            status_code=403,
            detail="권한이 없습니다. 게시글 작성자만 삭제할 수 있습니다."
        )

    # Hard delete - permanently remove from database
    try:
        # Delete all comments associated with this post
        await comments_collection.delete_many({"postId": postId})

        # Delete all likes associated with this post
        await likes_collection.delete_many({"postId": postId})

        # Delete all anonymous mappings for this post
        anon_collection = db["post_anonymous_users"]
        await anon_collection.delete_many({"postId": postId})

        # Delete the counter for this post
        await db["counters"].delete_one({"_id": f"anonymous_number_{postId}"})

        # Delete the post itself
        result = await posts_collection.delete_one({"_id": ObjectId(postId)})
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format during deletion: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")

    return None


# ============================================================================
# COMMENTS API
# ============================================================================

def serialize_comment(comment: dict) -> dict:
    """
    Convert MongoDB comment document to JSON-serializable dictionary.

    Converts ObjectId to string and datetime objects to ISO format strings.
    Adds author object for frontend compatibility.

    Args:
        comment (dict): MongoDB comment document

    Returns:
        dict: Serialized comment document ready for JSON response with author info
    """
    if comment:
        comment["id"] = str(comment.pop("_id"))
        # Convert datetime to ISO string format
        for field in ["createdAt", "updatedAt"]:
            if field in comment and isinstance(comment[field], datetime):
                comment[field] = comment[field].isoformat()

        # Add author object for frontend (extract from userId and authorName)
        comment["author"] = {
            "id": comment.get("userId", ""),
            "name": comment.get("authorName", ""),
            "profileImage": None  # TODO: Add profile image when user profiles are implemented
        }

        # Add authorId field for isAuthor comparison
        comment["authorId"] = comment.get("userId", "")
    return comment


@router.post("/comments", status_code=201)
async def create_comment(request: Request, comment_data: CommentCreate):
    """
    Create a new comment on a post.

    Creates a comment linked to an existing post.
    Automatically increments the post's commentCount and updates lastActivityAt.
    Supports both authenticated and unauthenticated (anonymous) users.

    Comment Anonymity Rules:
    1. If post is anonymous: All commenters get anonymous names (익명1, 익명2, etc.) within that post
    2. If post is NOT anonymous: Commenters use their real names (if logged in) or anonymous names (if not logged in)

    Args:
        request (Request): FastAPI request object (to get user authentication status)
        comment_data (CommentCreate): Comment data including postId and content

    Returns:
        dict: Created comment document with generated ID

    Raises:
        HTTPException: 400 if postId format is invalid
        HTTPException: 404 if post not found or is deleted
    """
    comments_collection = db["comments"]
    posts_collection = db["posts"]

    # Verify that the post exists and is not deleted
    try:
        post = await posts_collection.find_one({"_id": ObjectId(comment_data.postId), "isDeleted": False})
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Get current UTC timestamp
    now = datetime.utcnow()

    # Get user ID, authentication status, and username
    # Pass client-provided anonymousId for consistent anonymous identification
    user_id, is_authenticated, username = get_user_id_from_request(request, comment_data.anonymousId)

    # Check if this post is anonymous
    post_is_anonymous = post.get("isAnonymous", False)
    post_author_id = post.get("userId", "")

    # Check if commenter is the post author
    is_post_author = (user_id == post_author_id)

    # Determine author name based on post's anonymous setting and user's choice
    # 에브리타임/블라인드 스타일: 글쓴이는 "익명(글쓴이)", 댓글러는 "익명1", "익명2"...
    if post_is_anonymous:
        # If post is anonymous, all commenters get anonymous names within this post
        anon_number, is_author_in_db = await get_anonymous_number_for_post(
            comment_data.postId, user_id, is_author=is_post_author
        )
        # Use format_anonymous_name for consistent naming
        author_name = format_anonymous_name(anon_number, is_post_author or is_author_in_db)
        is_comment_anonymous = True
    elif is_authenticated and comment_data.isAnonymous:
        # Logged in user chose to post anonymously
        anon_number, is_author_in_db = await get_anonymous_number_for_post(
            comment_data.postId, user_id, is_author=is_post_author
        )
        author_name = format_anonymous_name(anon_number, is_post_author or is_author_in_db)
        is_comment_anonymous = True
    elif is_authenticated:
        # Logged in user posting with their real name from JWT token
        author_name = username or "사용자"
        is_comment_anonymous = False
    else:
        # Non-logged-in user gets anonymous name within this post
        anon_number, is_author_in_db = await get_anonymous_number_for_post(
            comment_data.postId, user_id, is_author=is_post_author
        )
        author_name = format_anonymous_name(anon_number, is_post_author or is_author_in_db)
        is_comment_anonymous = True

    comment_doc = {
        "postId": comment_data.postId,
        "userId": user_id,
        "authorName": author_name,
        "isAnonymous": is_comment_anonymous,
        "isAuthenticated": is_authenticated,  # Track if commenter was logged in
        "content": comment_data.content,
        "createdAt": now,
        "updatedAt": now,
        "isDeleted": False
    }

    # Insert comment to database
    result = await comments_collection.insert_one(comment_doc)

    # Update post: increment commentCount and update lastActivityAt timestamp
    await posts_collection.update_one(
        {"_id": ObjectId(comment_data.postId)},
        {
            "$inc": {"commentCount": 1},
            "$set": {"lastActivityAt": now}
        }
    )

    # Fetch and return created comment
    created_comment = await comments_collection.find_one({"_id": result.inserted_id})

    return serialize_comment(created_comment)


@router.put("/comments/{commentId}")
async def update_comment(request: Request, commentId: str, comment_data: CommentUpdate):
    """
    Update an existing comment.

    Updates the comment content and refreshes the updatedAt timestamp.

    Requires:
        Authentication required - only comment author can update
        인증 필수 - 댓글 작성자만 수정 가능

    Args:
        request (Request): FastAPI request object (JWT 토큰 추출용)
        commentId (str): MongoDB ObjectId of the comment to update
        comment_data (CommentUpdate): Update data with new content

    Returns:
        dict: Updated comment document

    Raises:
        HTTPException: 400 if commentId format is invalid
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not authorized (not the comment author)
        HTTPException: 404 if comment not found
    """
    collection = db["comments"]

    # Fetch comment to check author (댓글 조회하여 작성자 확인)
    try:
        comment = await collection.find_one({"_id": ObjectId(commentId), "isDeleted": False})
    except Exception as e:
        # 잘못된 댓글 ID 형식 (Invalid comment ID format)
        logger.warning(f"Invalid comment ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid comment ID")

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Get current user from JWT token (JWT 토큰에서 현재 사용자 추출)
    current_user_id, is_authenticated, _ = get_user_id_from_request(request)
    if not is_authenticated:
        raise HTTPException(status_code=401, detail="Authentication required (인증이 필요합니다)")

    # Check authorization - only comment author can update (권한 확인 - 댓글 작성자만 수정 가능)
    check_author_permission(current_user_id, comment["userId"], "update")

    # Update comment in database
    try:
        result = await collection.update_one(
            {"_id": ObjectId(commentId), "isDeleted": False},
            {"$set": {"content": comment_data.content, "updatedAt": datetime.utcnow()}}
        )
    except Exception as e:
        # 잘못된 댓글 ID 형식 (Invalid comment ID format)
        logger.warning(f"Invalid comment ID format during update: {e}")
        raise HTTPException(status_code=400, detail="Invalid comment ID")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Fetch and return updated comment
    updated_comment = await collection.find_one({"_id": ObjectId(commentId)})

    return serialize_comment(updated_comment)


@router.delete("/comments/{commentId}", status_code=204)
async def delete_comment(request: Request, commentId: str, anonymousId: str = None):
    """
    Delete a comment (hard delete).

    Permanently removes the comment from the database and decrements the associated post's commentCount.
    Only the comment author OR the post author can delete the comment.

    Args:
        request (Request): FastAPI request object
        commentId (str): MongoDB ObjectId of the comment to delete
        anonymousId (str): Optional client-provided anonymous ID for identification

    Returns:
        None

    Raises:
        HTTPException: 400 if commentId format is invalid
        HTTPException: 403 if not authorized (only comment author or post author can delete)
        HTTPException: 404 if comment not found
    """
    comments_collection = db["comments"]
    posts_collection = db["posts"]

    # Find comment to get postId and check author
    try:
        comment = await comments_collection.find_one({"_id": ObjectId(commentId)})
    except Exception as e:
        # 잘못된 댓글 ID 형식 (Invalid comment ID format)
        logger.warning(f"Invalid comment ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid comment ID")

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Get current user ID from request
    current_user_id, _, _ = get_user_id_from_request(request, anonymousId)

    # Get the post to check if current user is the post author
    post = await posts_collection.find_one({"_id": ObjectId(comment["postId"])})
    post_author_id = post["userId"] if post else None

    # Check authorization - comment author OR post author can delete
    is_comment_author = (current_user_id == comment["userId"])
    is_post_author = (current_user_id == post_author_id)

    if not is_comment_author and not is_post_author:
        raise HTTPException(
            status_code=403,
            detail="권한이 없습니다. 댓글 작성자 또는 게시글 작성자만 삭제할 수 있습니다."
        )

    # Hard delete comment - permanently remove from database
    result = await comments_collection.delete_one({"_id": ObjectId(commentId)})

    if result.deleted_count > 0:
        # Decrement the associated post's commentCount
        await posts_collection.update_one(
            {"_id": ObjectId(comment["postId"])},
            {"$inc": {"commentCount": -1}}
        )

    return None


# ============================================================================
# LIKES API
# ============================================================================

@router.post("/posts/{postId}/like", status_code=200)
async def like_post(request: Request, postId: str):
    """
    Like a post (one like per user).

    Adds user to likes collection and increments post's likes count.
    Each user can only like a post once.
    Supports both authenticated and anonymous users.

    Args:
        request (Request): FastAPI request object (to get user authentication status)
        postId (str): MongoDB ObjectId of the post to like

    Returns:
        dict: Success message and current like status

    Raises:
        HTTPException: 400 if postId format is invalid or already liked
        HTTPException: 404 if post not found or is deleted
    """
    posts_collection = db["posts"]
    likes_collection = db["likes"]

    # Get current user ID (authenticated or anonymous)
    current_user_id, is_authenticated, _ = get_user_id_from_request(request)

    # Verify post exists
    try:
        post = await posts_collection.find_one({"_id": ObjectId(postId), "isDeleted": False})
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if user already liked this post
    existing_like = await likes_collection.find_one({
        "postId": postId,
        "userId": current_user_id
    })

    if existing_like:
        raise HTTPException(status_code=400, detail="이미 좋아요를 누른 게시글입니다")

    # Add like record
    await likes_collection.insert_one({
        "postId": postId,
        "userId": current_user_id,
        "isAuthenticated": is_authenticated,
        "createdAt": datetime.utcnow()
    })

    # Increment like count for the post
    await posts_collection.update_one(
        {"_id": ObjectId(postId)},
        {"$inc": {"likes": 1}}
    )

    return {"message": "Post liked successfully", "liked": True}


@router.delete("/posts/{postId}/like", status_code=200)
async def unlike_post(request: Request, postId: str):
    """
    Unlike a post.

    Removes user from likes collection and decrements post's likes count.
    Supports both authenticated and anonymous users.

    Args:
        request (Request): FastAPI request object (to get user authentication status)
        postId (str): MongoDB ObjectId of the post to unlike

    Returns:
        dict: Success message and current like status

    Raises:
        HTTPException: 400 if postId format is invalid or not liked
        HTTPException: 404 if post not found or is deleted
    """
    posts_collection = db["posts"]
    likes_collection = db["likes"]

    # Get current user ID (authenticated or anonymous)
    current_user_id, is_authenticated, _ = get_user_id_from_request(request)

    # Verify post exists
    try:
        post = await posts_collection.find_one({"_id": ObjectId(postId), "isDeleted": False})
    except Exception as e:
        # 잘못된 게시글 ID 형식 (Invalid post ID format)
        logger.warning(f"Invalid post ID format: {e}")
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if user has liked this post
    existing_like = await likes_collection.find_one({
        "postId": postId,
        "userId": current_user_id
    })

    if not existing_like:
        raise HTTPException(status_code=400, detail="좋아요를 누르지 않은 게시글입니다")

    # Remove like record
    await likes_collection.delete_one({
        "postId": postId,
        "userId": current_user_id
    })

    # Decrement like count for the post (ensure it doesn't go below 0)
    await posts_collection.update_one(
        {"_id": ObjectId(postId), "likes": {"$gt": 0}},
        {"$inc": {"likes": -1}}
    )

    return {"message": "Post unliked successfully", "liked": False}


# ============================================================================
# IMAGE UPLOAD API
# ============================================================================

@router.post("/uploads", status_code=201)
def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file.

    Saves the uploaded file to the uploads/ directory with a timestamped filename.
    Validates file type before saving.

    Args:
        file (UploadFile): Image file to upload

    Returns:
        dict: Contains the image URL and filename

    Raises:
        HTTPException: 400 if file type is not allowed
        HTTPException: 500 if file save operation fails

    Allowed file types:
        - .jpg, .jpeg, .png, .gif, .webp

    Example:
        POST /api/community/uploads
        Returns: {"url": "/uploads/20231215_143022_image.jpg", "filename": "20231215_143022_image.jpg"}
    """
    # Define allowed image file extensions
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_extension = Path(file.filename).suffix.lower()

    # Validate file type
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # Generate unique filename using timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{file.filename}"
    file_path = Path("uploads") / unique_filename

    # Save file to disk
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return image URL and filename
    return {
        "url": f"/uploads/{unique_filename}",
        "filename": unique_filename
    }
