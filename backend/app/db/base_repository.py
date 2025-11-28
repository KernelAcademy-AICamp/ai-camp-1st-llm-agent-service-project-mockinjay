"""
Base Repository Pattern

This module provides an abstract base repository for MongoDB operations,
promoting clean architecture and testability.

Key Features:
- Generic CRUD operations
- Consistent error handling
- Easy mocking for unit tests
- Type hints for better IDE support
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, Generic, TypeVar
from pymongo.collection import Collection
from pymongo.errors import PyMongoError, DuplicateKeyError
from bson import ObjectId
from datetime import datetime
import logging

from app.core.exceptions import (
    DatabaseConnectionError,
    DatabaseQueryError,
    ResourceNotFoundError
)

logger = logging.getLogger(__name__)

# Generic type for repository entities
T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository for MongoDB operations

    Subclasses must implement:
    - collection: Property returning the MongoDB collection
    - _to_entity: Method to convert MongoDB document to domain entity
    - _to_document: Method to convert domain entity to MongoDB document
    """

    @property
    @abstractmethod
    def collection(self) -> Collection:
        """Return the MongoDB collection for this repository"""
        pass

    @abstractmethod
    def _to_entity(self, document: Dict[str, Any]) -> T:
        """
        Convert MongoDB document to domain entity

        Args:
            document: MongoDB document

        Returns:
            Domain entity of type T
        """
        pass

    @abstractmethod
    def _to_document(self, entity: T) -> Dict[str, Any]:
        """
        Convert domain entity to MongoDB document

        Args:
            entity: Domain entity

        Returns:
            MongoDB document (dict)
        """
        pass

    # ============================================
    # CRUD Operations
    # ============================================

    def create(self, entity: T) -> str:
        """
        Create a new document

        Args:
            entity: Entity to create

        Returns:
            ID of created document (as string)

        Raises:
            DatabaseQueryError: If creation fails
        """
        try:
            document = self._to_document(entity)
            result = self.collection.insert_one(document)
            logger.info(f"Created document in {self.collection.name}: {result.inserted_id}")
            return str(result.inserted_id)
        except DuplicateKeyError as e:
            logger.error(f"Duplicate key error: {e}")
            raise DatabaseQueryError(
                operation="create",
                reason=f"문서가 이미 존재합니다: {str(e)}"
            )
        except PyMongoError as e:
            logger.error(f"Database error during create: {e}")
            raise DatabaseQueryError(
                operation="create",
                reason=str(e)
            )

    def find_by_id(self, id: str) -> Optional[T]:
        """
        Find document by ID

        Args:
            id: Document ID (as string)

        Returns:
            Entity if found, None otherwise

        Raises:
            DatabaseQueryError: If query fails
        """
        try:
            document = self.collection.find_one({"_id": ObjectId(id)})
            if document:
                return self._to_entity(document)
            return None
        except PyMongoError as e:
            logger.error(f"Database error during find_by_id: {e}")
            raise DatabaseQueryError(
                operation="find_by_id",
                reason=str(e)
            )

    def find_one(self, filter: Dict[str, Any]) -> Optional[T]:
        """
        Find one document matching filter

        Args:
            filter: MongoDB query filter

        Returns:
            Entity if found, None otherwise

        Raises:
            DatabaseQueryError: If query fails
        """
        try:
            document = self.collection.find_one(filter)
            if document:
                return self._to_entity(document)
            return None
        except PyMongoError as e:
            logger.error(f"Database error during find_one: {e}")
            raise DatabaseQueryError(
                operation="find_one",
                reason=str(e)
            )

    def find_many(
        self,
        filter: Dict[str, Any],
        skip: int = 0,
        limit: int = 100,
        sort: Optional[List[tuple]] = None
    ) -> List[T]:
        """
        Find multiple documents matching filter

        Args:
            filter: MongoDB query filter
            skip: Number of documents to skip (pagination)
            limit: Maximum number of documents to return
            sort: Sort specification (e.g., [("created_at", -1)])

        Returns:
            List of entities

        Raises:
            DatabaseQueryError: If query fails
        """
        try:
            cursor = self.collection.find(filter).skip(skip).limit(limit)
            if sort:
                cursor = cursor.sort(sort)

            return [self._to_entity(doc) for doc in cursor]
        except PyMongoError as e:
            logger.error(f"Database error during find_many: {e}")
            raise DatabaseQueryError(
                operation="find_many",
                reason=str(e)
            )

    def count(self, filter: Dict[str, Any]) -> int:
        """
        Count documents matching filter

        Args:
            filter: MongoDB query filter

        Returns:
            Document count

        Raises:
            DatabaseQueryError: If query fails
        """
        try:
            return self.collection.count_documents(filter)
        except PyMongoError as e:
            logger.error(f"Database error during count: {e}")
            raise DatabaseQueryError(
                operation="count",
                reason=str(e)
            )

    def update(self, id: str, updates: Dict[str, Any]) -> bool:
        """
        Update document by ID

        Args:
            id: Document ID (as string)
            updates: Fields to update (uses $set operator)

        Returns:
            True if document was updated, False if not found

        Raises:
            DatabaseQueryError: If update fails
        """
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": updates}
            )
            if result.matched_count > 0:
                logger.info(f"Updated document in {self.collection.name}: {id}")
                return True
            return False
        except PyMongoError as e:
            logger.error(f"Database error during update: {e}")
            raise DatabaseQueryError(
                operation="update",
                reason=str(e)
            )

    def update_many(self, filter: Dict[str, Any], updates: Dict[str, Any]) -> int:
        """
        Update multiple documents

        Args:
            filter: MongoDB query filter
            updates: Fields to update (uses $set operator)

        Returns:
            Number of documents updated

        Raises:
            DatabaseQueryError: If update fails
        """
        try:
            result = self.collection.update_many(
                filter,
                {"$set": updates}
            )
            logger.info(f"Updated {result.modified_count} documents in {self.collection.name}")
            return result.modified_count
        except PyMongoError as e:
            logger.error(f"Database error during update_many: {e}")
            raise DatabaseQueryError(
                operation="update_many",
                reason=str(e)
            )

    def delete(self, id: str) -> bool:
        """
        Delete document by ID

        Args:
            id: Document ID (as string)

        Returns:
            True if document was deleted, False if not found

        Raises:
            DatabaseQueryError: If delete fails
        """
        try:
            result = self.collection.delete_one({"_id": ObjectId(id)})
            if result.deleted_count > 0:
                logger.info(f"Deleted document from {self.collection.name}: {id}")
                return True
            return False
        except PyMongoError as e:
            logger.error(f"Database error during delete: {e}")
            raise DatabaseQueryError(
                operation="delete",
                reason=str(e)
            )

    def delete_many(self, filter: Dict[str, Any]) -> int:
        """
        Delete multiple documents

        Args:
            filter: MongoDB query filter

        Returns:
            Number of documents deleted

        Raises:
            DatabaseQueryError: If delete fails
        """
        try:
            result = self.collection.delete_many(filter)
            logger.info(f"Deleted {result.deleted_count} documents from {self.collection.name}")
            return result.deleted_count
        except PyMongoError as e:
            logger.error(f"Database error during delete_many: {e}")
            raise DatabaseQueryError(
                operation="delete_many",
                reason=str(e)
            )

    def exists(self, filter: Dict[str, Any]) -> bool:
        """
        Check if document exists

        Args:
            filter: MongoDB query filter

        Returns:
            True if document exists, False otherwise

        Raises:
            DatabaseQueryError: If query fails
        """
        try:
            return self.collection.count_documents(filter, limit=1) > 0
        except PyMongoError as e:
            logger.error(f"Database error during exists: {e}")
            raise DatabaseQueryError(
                operation="exists",
                reason=str(e)
            )

    # ============================================
    # Helper Methods
    # ============================================

    def _convert_id(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert ObjectId to string in document

        Args:
            document: MongoDB document

        Returns:
            Document with _id as string
        """
        if document and "_id" in document:
            document["id"] = str(document["_id"])
            del document["_id"]
        return document

    def _ensure_object_id(self, id: Any) -> ObjectId:
        """
        Convert string ID to ObjectId

        Args:
            id: ID as string or ObjectId

        Returns:
            ObjectId
        """
        if isinstance(id, str):
            return ObjectId(id)
        return id

    def aggregate(self, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute aggregation pipeline

        Args:
            pipeline: MongoDB aggregation pipeline

        Returns:
            List of aggregation results

        Raises:
            DatabaseQueryError: If aggregation fails
        """
        try:
            return list(self.collection.aggregate(pipeline))
        except PyMongoError as e:
            logger.error(f"Database error during aggregate: {e}")
            raise DatabaseQueryError(
                operation="aggregate",
                reason=str(e)
            )
