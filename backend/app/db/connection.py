"""
Database Connection Utilities
Provides connection checking and health status for MongoDB
"""
from app.db.mongodb_manager import OptimizedMongoDBManager
import logging

logger = logging.getLogger(__name__)


async def check_connection():
    """
    Check MongoDB connection status

    Returns:
        dict: Connection status information including database name and collection count
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
