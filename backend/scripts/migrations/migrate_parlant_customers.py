"""
Parlant Customer Migration Script
기존 사용자들에게 Parlant 고객 ID 생성 및 할당

This script creates Parlant customers for existing users who don't have one.
이 스크립트는 Parlant 고객이 없는 기존 사용자들에게 Parlant 고객을 생성합니다.

Usage:
    cd backend
    python -m scripts.migrations.migrate_parlant_customers

Or with environment variables:
    MONGODB_URI=mongodb://localhost:27017 \
    PARLANT_HOST=127.0.0.1 \
    RESEARCH_PORT=8800 \
    python -m scripts.migrations.migrate_parlant_customers
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend path for imports
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from motor.motor_asyncio import AsyncIOMotorClient
import httpx
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "careguide")
PARLANT_HOST = os.getenv("PARLANT_HOST", "127.0.0.1")
RESEARCH_PORT = int(os.getenv("RESEARCH_PORT", "8800"))
PARLANT_URL = f"http://{PARLANT_HOST}:{RESEARCH_PORT}"


async def check_parlant_server() -> bool:
    """Check if Parlant server is running"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PARLANT_URL}/api/agents", timeout=5.0)
            return response.status_code in [200, 401, 403, 404]
    except Exception as e:
        logger.error(f"Cannot connect to Parlant server at {PARLANT_URL}: {e}")
        return False


async def migrate_users():
    """
    Migrate existing users by creating Parlant customers for them.
    기존 사용자들에게 Parlant 고객을 생성하여 마이그레이션합니다.
    """
    logger.info("=" * 60)
    logger.info("Parlant Customer Migration Script")
    logger.info("=" * 60)
    logger.info(f"MongoDB URI: {MONGODB_URI}")
    logger.info(f"Database: {DATABASE_NAME}")
    logger.info(f"Parlant URL: {PARLANT_URL}")
    logger.info("")

    # Check Parlant server
    logger.info("Checking Parlant server...")
    if not await check_parlant_server():
        logger.error("❌ Parlant server is not running. Please start it first.")
        logger.info("   Run: python backend/Agent/research_paper/server/healthcare_v2_en.py")
        return

    logger.info("✅ Parlant server is running")

    # Connect to MongoDB
    logger.info("Connecting to MongoDB...")
    try:
        mongo_client = AsyncIOMotorClient(MONGODB_URI)
        db = mongo_client[DATABASE_NAME]
        users = db["users"]
        logger.info("✅ Connected to MongoDB")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        return

    # Initialize Parlant client
    logger.info("Initializing Parlant client...")
    try:
        from parlant.client.client import AsyncParlantClient

        httpx_client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))
        parlant = AsyncParlantClient(
            base_url=PARLANT_URL,
            httpx_client=httpx_client
        )
        logger.info("✅ Parlant client initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Parlant client: {e}")
        return

    # Pre-create profile tags
    logger.info("Pre-creating profile tags...")
    profile_tags = {}
    for profile in ["general", "patient", "researcher"]:
        tag_name = f"profile:{profile}"
        try:
            tag = await parlant.tags.create(name=tag_name)
            profile_tags[profile] = tag.id
            logger.info(f"  ✅ Created tag: {tag_name} (ID: {tag.id})")
        except Exception:
            # Tag exists, find it
            tags = await parlant.tags.list()
            for t in tags:
                if t.name == tag_name:
                    profile_tags[profile] = t.id
                    logger.info(f"  ✅ Found existing tag: {tag_name} (ID: {t.id})")
                    break

    logger.info("")

    # Count users to migrate
    total_users = await users.count_documents({})
    users_without_customer = await users.count_documents({
        "$or": [
            {"parlant_customer_id": {"$exists": False}},
            {"parlant_customer_id": None}
        ]
    })

    logger.info(f"Total users: {total_users}")
    logger.info(f"Users without Parlant customer: {users_without_customer}")
    logger.info("")

    if users_without_customer == 0:
        logger.info("✅ All users already have Parlant customers. Nothing to migrate.")
        return

    # Confirm migration
    logger.info(f"Will create {users_without_customer} Parlant customers.")
    logger.info("")

    # Migrate users
    migrated = 0
    failed = 0

    cursor = users.find({
        "$or": [
            {"parlant_customer_id": {"$exists": False}},
            {"parlant_customer_id": None}
        ]
    })

    async for user in cursor:
        user_id = str(user["_id"])
        email = user.get("email", "unknown")
        profile = user.get("profile", "general")

        try:
            # Get tag ID for profile
            tag_id = profile_tags.get(profile)
            tags = [tag_id] if tag_id else []

            # Create customer
            customer_name = f"user_{user_id}"
            customer = await parlant.customers.create(
                name=customer_name,
                tags=tags
            )

            # Update user document
            await users.update_one(
                {"_id": user["_id"]},
                {"$set": {"parlant_customer_id": customer.id}}
            )

            migrated += 1
            logger.info(f"  ✅ [{migrated}/{users_without_customer}] {email}: {customer.id} (profile: {profile})")

        except Exception as e:
            failed += 1
            logger.error(f"  ❌ Failed for {email}: {e}")

    logger.info("")
    logger.info("=" * 60)
    logger.info("Migration Complete")
    logger.info("=" * 60)
    logger.info(f"  Migrated: {migrated}")
    logger.info(f"  Failed: {failed}")
    logger.info(f"  Total: {migrated + failed}")

    # Close connections
    await httpx_client.aclose()
    mongo_client.close()


if __name__ == "__main__":
    asyncio.run(migrate_users())
