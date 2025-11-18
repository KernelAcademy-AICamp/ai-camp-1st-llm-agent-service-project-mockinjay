"""
Database Connection Utilities
Provides connection checking and health status for MongoDB
"""
from app.db.mongodb_manager import OptimizedMongoDBManager
import logging

logger = logging.getLogger(__name__)


async def check_connection():
    """
    Check MongoDB connectivity and report basic database status.
    
    Returns:
        dict: Status information with the following keys:
            - status (str): "connected" when the check succeeds, "disconnected" when it fails.
            - database (str): Name of the checked database (present on success).
            - collections (int): Number of collections in the database (present on success).
            - collection_names (list[str]): Names of the collections (present on success).
            - message (str): Human-readable result message.
            - error (str): String representation of the error (present on failure).
    """
    try:
        manager = OptimizedMongoDBManager()
        await manager.connect()

        # Get collection names as a connection test
        collections = await manager.db.list_collection_names()

        await manager.close()

        return {
            "status": "connected",
            "database": "careguide",
            "collections": len(collections),
            "collection_names": collections,
            "message": "MongoDB connection successful"
        }
    except Exception as e:
        logger.error(f"MongoDB connection check failed: {e}", exc_info=True)
        return {
            "status": "disconnected",
            "error": str(e),
            "message": "MongoDB connection failed"
        }