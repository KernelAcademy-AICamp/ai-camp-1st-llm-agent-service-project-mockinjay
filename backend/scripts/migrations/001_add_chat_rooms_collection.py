"""
Migration: Add chat_rooms collection and indexes
Creates the chat_rooms collection with proper indexes for room management
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def upgrade():
    """
    Create chat_rooms collection with indexes
    """
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "careguide")

    client = AsyncIOMotorClient(uri)
    db = client[db_name]

    logger.info(f"Connected to MongoDB: {db_name}")

    # Create chat_rooms collection (if not exists)
    collections = await db.list_collection_names()
    if "chat_rooms" not in collections:
        await db.create_collection("chat_rooms")
        logger.info("✅ Created chat_rooms collection")
    else:
        logger.info("chat_rooms collection already exists")

    # Create indexes for chat_rooms
    indexes = [
        # Compound index for user room queries
        {
            "keys": [("user_id", 1), ("last_activity", -1)],
            "name": "user_last_activity_idx",
            "background": True
        },
        # Compound index for user + deleted filter
        {
            "keys": [("user_id", 1), ("is_deleted", 1)],
            "name": "user_deleted_idx",
            "background": True
        },
        # Unique index on room_id
        {
            "keys": [("room_id", 1)],
            "name": "room_id_unique_idx",
            "unique": True
        }
    ]

    for index_spec in indexes:
        try:
            keys = index_spec.pop("keys")
            await db.chat_rooms.create_index(keys, **index_spec)
            logger.info(f"✅ Created index: {index_spec['name']}")
        except Exception as e:
            if "already exists" in str(e).lower():
                logger.info(f"Index {index_spec['name']} already exists")
            else:
                logger.error(f"Failed to create index {index_spec['name']}: {e}")

    # Enhance conversation_history indexes
    logger.info("\nUpdating conversation_history indexes...")

    conv_indexes = [
        # Index for room-based queries
        {
            "keys": [("room_id", 1), ("timestamp", -1)],
            "name": "room_timestamp_idx",
            "background": True
        },
        # Compound index for user + agent queries
        {
            "keys": [("user_id", 1), ("agent_type", 1), ("timestamp", -1)],
            "name": "user_agent_timestamp_idx",
            "background": True
        }
    ]

    for index_spec in conv_indexes:
        try:
            keys = index_spec.pop("keys")
            await db.conversation_history.create_index(keys, **index_spec)
            logger.info(f"✅ Created index: {index_spec['name']}")
        except Exception as e:
            if "already exists" in str(e).lower():
                logger.info(f"Index {index_spec['name']} already exists")
            else:
                logger.error(f"Failed to create index {index_spec['name']}: {e}")

    # Create active_streams collection (for tracking active streams)
    if "active_streams" not in collections:
        await db.create_collection("active_streams")
        logger.info("\n✅ Created active_streams collection")

        # Create TTL index (auto-delete after 5 minutes of inactivity)
        await db.active_streams.create_index(
            [("last_heartbeat", 1)],
            name="ttl_heartbeat_idx",
            expireAfterSeconds=300,
            background=True
        )
        logger.info("✅ Created TTL index on active_streams (5 min expiry)")

        # Create session_id index
        await db.active_streams.create_index(
            [("session_id", 1)],
            name="session_idx",
            background=True
        )
        logger.info("✅ Created session_id index on active_streams")

    client.close()
    logger.info("\n✅ Migration completed successfully!")


async def downgrade():
    """
    Remove chat_rooms collection and indexes (rollback)
    """
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "careguide")

    client = AsyncIOMotorClient(uri)
    db = client[db_name]

    logger.info(f"Rolling back migration for: {db_name}")

    # Drop indexes from chat_rooms
    try:
        await db.chat_rooms.drop_index("user_last_activity_idx")
        await db.chat_rooms.drop_index("user_deleted_idx")
        await db.chat_rooms.drop_index("room_id_unique_idx")
        logger.info("✅ Dropped chat_rooms indexes")
    except Exception as e:
        logger.warning(f"Failed to drop chat_rooms indexes: {e}")

    # Drop indexes from conversation_history
    try:
        await db.conversation_history.drop_index("room_timestamp_idx")
        await db.conversation_history.drop_index("user_agent_timestamp_idx")
        logger.info("✅ Dropped conversation_history indexes")
    except Exception as e:
        logger.warning(f"Failed to drop conversation_history indexes: {e}")

    # Drop active_streams collection
    try:
        await db.active_streams.drop()
        logger.info("✅ Dropped active_streams collection")
    except Exception as e:
        logger.warning(f"Failed to drop active_streams collection: {e}")

    # Note: We don't drop chat_rooms collection to preserve data
    # Only drop if explicitly needed:
    # await db.chat_rooms.drop()

    client.close()
    logger.info("✅ Rollback completed!")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Chat Rooms Migration")
    parser.add_argument(
        "action",
        choices=["upgrade", "downgrade"],
        help="Migration action: upgrade or downgrade"
    )

    args = parser.parse_args()

    if args.action == "upgrade":
        asyncio.run(upgrade())
    else:
        asyncio.run(downgrade())
