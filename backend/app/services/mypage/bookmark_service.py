"""
Bookmark Service
Business logic for user bookmarks management
사용자 북마크 관리를 위한 비즈니스 로직
"""
from typing import Dict, Any, List
from datetime import datetime
from fastapi import HTTPException, status
import logging

from app.db.connection import db
from app.services.mypage.utils import serialize_object_id, serialize_datetime

logger = logging.getLogger(__name__)


class BookmarkService:
    """Bookmark management service (북마크 관리 서비스)"""

    def __init__(self):
        # Lazy initialization - collection accessed when needed, not at import time
        self._bookmarks_collection = None

    @property
    def bookmarks_collection(self):
        """Lazy property to access bookmarks collection after database is initialized"""
        if self._bookmarks_collection is None:
            self._bookmarks_collection = db["bookmarks"]
        return self._bookmarks_collection

    async def get_bookmarks(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get user's bookmarked papers with pagination
        사용자의 북마크된 논문 조회 (페이지네이션 지원)

        Args:
            user_id: User ID (string)
            limit: Number of bookmarks to return (1-50)
            offset: Number of bookmarks to skip

        Returns:
            dict: Contains bookmarks list, total count, limit, offset, hasMore

        Raises:
            HTTPException: 500 for internal errors
        """
        try:
            # Validate pagination parameters
            limit = min(max(1, limit), 50)  # Clamp between 1 and 50
            offset = max(0, offset)

            # Get total count
            total_count = await self.bookmarks_collection.count_documents({"userId": user_id})

            # Fetch bookmarks with pagination
            cursor = self.bookmarks_collection.find({"userId": user_id}).sort("createdAt", -1).skip(offset).limit(limit)
            bookmarks = await cursor.to_list(length=limit)

            # Serialize bookmarks
            serialized_bookmarks = []
            for bookmark in bookmarks:
                bookmark = serialize_object_id(bookmark)
                bookmark = serialize_datetime(bookmark, ["createdAt"])
                serialized_bookmarks.append(bookmark)

            return {
                "bookmarks": serialized_bookmarks,
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "hasMore": (offset + limit) < total_count
            }

        except Exception as e:
            logger.error(f"Error fetching user bookmarks: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="북마크 조회 중 오류가 발생했습니다"
            )

    async def add_bookmark(
        self,
        user_id: str,
        paper_id: str,
        paper_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add a paper to user's bookmarks
        논문을 사용자의 북마크에 추가

        Args:
            user_id: User ID (string)
            paper_id: Paper ID (PMID or unique identifier)
            paper_data: Paper metadata to store

        Returns:
            dict: Created bookmark with id

        Raises:
            HTTPException: 400 if already bookmarked, 500 for internal errors
        """
        try:
            # Check if already bookmarked
            existing = await self.bookmarks_collection.find_one({
                "userId": user_id,
                "paperId": paper_id
            })

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 북마크된 논문입니다"
                )

            # Create bookmark document
            bookmark_doc = {
                "userId": user_id,
                "paperId": paper_id,
                "paperData": paper_data,
                "createdAt": datetime.utcnow()
            }

            # Insert to database
            result = await self.bookmarks_collection.insert_one(bookmark_doc)

            # Fetch and return created bookmark
            created_bookmark = await self.bookmarks_collection.find_one({"_id": result.inserted_id})
            created_bookmark = serialize_object_id(created_bookmark)
            created_bookmark = serialize_datetime(created_bookmark, ["createdAt"])

            logger.info(f"Bookmark created for user {user_id}: paper {paper_id}")
            return created_bookmark

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating bookmark: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="북마크 추가 중 오류가 발생했습니다"
            )

    async def remove_bookmark(
        self,
        user_id: str,
        paper_id: str
    ) -> None:
        """
        Remove a paper from user's bookmarks
        사용자의 북마크에서 논문 제거

        Args:
            user_id: User ID (string)
            paper_id: Paper ID (PMID or unique identifier)

        Returns:
            None

        Raises:
            HTTPException: 404 if bookmark not found, 500 for internal errors
        """
        try:
            # Delete bookmark
            result = await self.bookmarks_collection.delete_one({
                "userId": user_id,
                "paperId": paper_id
            })

            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="북마크를 찾을 수 없습니다"
                )

            logger.info(f"Bookmark deleted for user {user_id}: paper {paper_id}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting bookmark: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="북마크 삭제 중 오류가 발생했습니다"
            )
