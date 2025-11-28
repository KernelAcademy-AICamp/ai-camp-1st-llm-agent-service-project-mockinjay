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

        # Health Profiles Collection Indexes
        await create_health_profiles_indexes(db)

        # User Preferences Collection Indexes
        await create_user_preferences_indexes(db)

        # Bookmarks Collection Indexes
        await create_bookmarks_indexes(db)

        # Posts Collection Indexes
        await create_posts_indexes(db)

        # User Levels Collection Indexes
        await create_user_levels_indexes(db)

        # User Badges Collection Indexes
        await create_user_badges_indexes(db)

        # User Points Collection Indexes
        await create_user_points_indexes(db)

        # Points History Collection Indexes
        await create_points_history_indexes(db)

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


async def create_health_profiles_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for health_profiles collection"""
    health_profiles_collection = db["health_profiles"]

    indexes = [
        # Unique index on userId for fast lookup and ensuring uniqueness
        IndexModel(
            [("userId", ASCENDING)],
            unique=True,
            name="idx_health_profiles_userId"
        ),
    ]

    await health_profiles_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for health_profiles collection")


async def create_user_preferences_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for user_preferences collection"""
    user_preferences_collection = db["user_preferences"]

    indexes = [
        # Unique index on userId for fast lookup and ensuring uniqueness
        IndexModel(
            [("userId", ASCENDING)],
            unique=True,
            name="idx_user_preferences_userId"
        ),
    ]

    await user_preferences_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for user_preferences collection")


async def create_bookmarks_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for bookmarks collection"""
    bookmarks_collection = db["bookmarks"]

    indexes = [
        # Compound index for user bookmarks sorted by creation date
        IndexModel(
            [("userId", ASCENDING), ("createdAt", DESCENDING)],
            name="idx_bookmarks_userId_createdAt"
        ),
        # Unique compound index to prevent duplicate bookmarks
        IndexModel(
            [("userId", ASCENDING), ("paperId", ASCENDING)],
            unique=True,
            name="idx_bookmarks_userId_paperId"
        ),
    ]

    await bookmarks_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for bookmarks collection")


async def create_posts_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for posts collection"""
    posts_collection = db["posts"]

    indexes = [
        # Compound index for user posts filtered by deletion status and sorted by date
        IndexModel(
            [("userId", ASCENDING), ("isDeleted", ASCENDING), ("createdAt", DESCENDING)],
            name="idx_posts_userId_isDeleted_createdAt"
        ),
        # Index on created_at for sorting posts by date
        IndexModel(
            [("createdAt", DESCENDING)],
            name="idx_posts_createdAt"
        ),
        # Index on category for filtering posts by category
        IndexModel(
            [("category", ASCENDING), ("createdAt", DESCENDING)],
            name="idx_posts_category_createdAt"
        ),
    ]

    await posts_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for posts collection")


async def create_user_levels_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for user_levels collection"""
    user_levels_collection = db["user_levels"]

    indexes = [
        # Unique index on userId for fast lookup and ensuring uniqueness
        IndexModel(
            [("userId", ASCENDING)],
            unique=True,
            name="idx_user_levels_userId"
        ),
    ]

    await user_levels_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for user_levels collection")


async def create_user_badges_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for user_badges collection"""
    user_badges_collection = db["user_badges"]

    indexes = [
        # Compound index for user badges sorted by earned date
        IndexModel(
            [("userId", ASCENDING), ("earnedAt", DESCENDING)],
            name="idx_user_badges_userId_earnedAt"
        ),
    ]

    await user_badges_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for user_badges collection")


async def create_user_points_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for user_points collection"""
    user_points_collection = db["user_points"]

    indexes = [
        # Unique index on userId for fast lookup and ensuring uniqueness
        IndexModel(
            [("userId", ASCENDING)],
            unique=True,
            name="idx_user_points_userId"
        ),
    ]

    await user_points_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for user_points collection")


async def create_points_history_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for points_history collection"""
    points_history_collection = db["points_history"]

    indexes = [
        # Compound index for user points history sorted by creation date
        IndexModel(
            [("userId", ASCENDING), ("createdAt", DESCENDING)],
            name="idx_points_history_userId_createdAt"
        ),
        # Compound index for filtering by type and sorting by date
        IndexModel(
            [("userId", ASCENDING), ("type", ASCENDING), ("createdAt", DESCENDING)],
            name="idx_points_history_userId_type_createdAt"
        ),
        # Compound index for filtering by source and sorting by date
        IndexModel(
            [("userId", ASCENDING), ("source", ASCENDING), ("createdAt", DESCENDING)],
            name="idx_points_history_userId_source_createdAt"
        ),
    ]

    await points_history_collection.create_indexes(indexes)
    logger.info(f"Created {len(indexes)} indexes for points_history collection")


async def drop_all_indexes(db: AsyncIOMotorDatabase):
    """
    Drop all custom indexes (useful for development/testing)

    WARNING: This will drop all indexes except _id index
    """
    collections = [
        "users",
        "notifications",
        "notification_settings",
        "health_profiles",
        "user_preferences",
        "bookmarks",
        "posts",
        "user_levels",
        "user_badges",
        "user_points",
        "points_history"
    ]

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
    collections = [
        "users",
        "notifications",
        "notification_settings",
        "health_profiles",
        "user_preferences",
        "bookmarks",
        "posts",
        "user_levels",
        "user_badges",
        "user_points",
        "points_history"
    ]
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
