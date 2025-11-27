"""
Database Indexes Management
Creates and manages MongoDB indexes for optimal query performance
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
import logging

logger = logging.getLogger(__name__)


async def create_indexes(db: AsyncIOMotorDatabase):
    """
    Create all database indexes

    Args:
        db: Motor database instance
    """
    try:
        # Users Collection Indexes
        await create_users_indexes(db)

        # Notifications Collection Indexes
        await create_notifications_indexes(db)

        # Notification Settings Collection Indexes
        await create_notification_settings_indexes(db)

        logger.info("All database indexes created successfully")

    except Exception as e:
        logger.error(f"Error creating database indexes: {str(e)}")
        raise


async def create_users_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for users collection"""
    users_collection = db["users"]

    indexes = [
        # Unique index on email for fast lookup and ensuring uniqueness
        IndexModel(
            [("email", ASCENDING)],
            unique=True,
            name="idx_users_email"
        ),
        # Unique index on username for fast lookup and ensuring uniqueness
        IndexModel(
            [("username", ASCENDING)],
            unique=True,
            name="idx_users_username"
        ),
        # Index on role for filtering by user role
        IndexModel(
            [("role", ASCENDING)],
            name="idx_users_role"
        ),
        # Index on created_at for sorting and filtering by creation date
        IndexModel(
            [("created_at", DESCENDING)],
            name="idx_users_created_at"
        ),
        # Compound index for profile and role queries
        IndexModel(
            [("profile", ASCENDING), ("role", ASCENDING)],
            name="idx_users_profile_role"
        ),
    ]

    await users_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for users collection")


async def create_notifications_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for notifications collection"""
    notifications_collection = db["notifications"]

    indexes = [
        # Compound index on user_id and created_at for user notifications queries
        # Most common query: get notifications for a user sorted by date
        IndexModel(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_notifications_user_created"
        ),
        # Compound index for filtering read/unread notifications by user
        IndexModel(
            [("user_id", ASCENDING), ("is_read", ASCENDING), ("created_at", DESCENDING)],
            name="idx_notifications_user_read_created"
        ),
        # Index on type for filtering by notification type
        IndexModel(
            [("type", ASCENDING)],
            name="idx_notifications_type"
        ),
        # Index on created_at for cleanup/archival operations
        IndexModel(
            [("created_at", DESCENDING)],
            name="idx_notifications_created_at"
        ),
        # Compound index for category-based queries
        IndexModel(
            [("user_id", ASCENDING), ("category", ASCENDING), ("created_at", DESCENDING)],
            name="idx_notifications_user_category_created"
        ),
    ]

    await notifications_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for notifications collection")


async def create_notification_settings_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for notification_settings collection"""
    notification_settings_collection = db["notification_settings"]

    indexes = [
        # Unique index on user_id for fast lookup of user settings
        IndexModel(
            [("user_id", ASCENDING)],
            unique=True,
            name="idx_notification_settings_user"
        ),
        # Index on updated_at for tracking recent changes
        IndexModel(
            [("updated_at", DESCENDING)],
            name="idx_notification_settings_updated"
        ),
    ]

    await notification_settings_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for notification_settings collection")


async def create_community_posts_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for community posts collection (if exists)"""
    posts_collection = db["posts"]

    indexes = [
        # Index on created_at for sorting posts by date
        IndexModel(
            [("created_at", DESCENDING)],
            name="idx_posts_created_at"
        ),
        # Index on category for filtering posts by category
        IndexModel(
            [("category", ASCENDING), ("created_at", DESCENDING)],
            name="idx_posts_category_created"
        ),
        # Index on author for user's posts
        IndexModel(
            [("author_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_posts_author_created"
        ),
        # Index on status (if posts have draft/published status)
        IndexModel(
            [("status", ASCENDING), ("created_at", DESCENDING)],
            name="idx_posts_status_created"
        ),
        # Text index for search functionality (if needed)
        IndexModel(
            [("title", "text"), ("content", "text")],
            name="idx_posts_text_search"
        ),
    ]

    await posts_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for posts collection")


async def drop_all_indexes(db: AsyncIOMotorDatabase):
    """
    Drop all custom indexes (useful for development/testing)

    WARNING: This will drop all indexes except _id index
    """
    collections = ["users", "notifications", "notification_settings", "posts"]

    for collection_name in collections:
        try:
            collection = db[collection_name]
            # Get all indexes
            indexes = await collection.index_information()

            # Drop all indexes except _id
            for index_name in indexes:
                if index_name != "_id_":
                    await collection.drop_index(index_name)
                    logger.info(f"Dropped index {index_name} from {collection_name}")

        except Exception as e:
            logger.warning(f"Error dropping indexes from {collection_name}: {str(e)}")


async def list_all_indexes(db: AsyncIOMotorDatabase):
    """
    List all indexes in the database

    Returns:
        dict: Dictionary of collection names and their indexes
    """
    collections = ["users", "notifications", "notification_settings", "posts"]
    all_indexes = {}

    for collection_name in collections:
        try:
            collection = db[collection_name]
            indexes = await collection.index_information()
            all_indexes[collection_name] = indexes
            logger.info(f"Indexes in {collection_name}: {list(indexes.keys())}")
        except Exception as e:
            logger.warning(f"Error listing indexes for {collection_name}: {str(e)}")

    return all_indexes
