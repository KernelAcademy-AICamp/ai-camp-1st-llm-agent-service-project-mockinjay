#!/usr/bin/env python3
"""
Diet Care Collections Initialization Script

This script initializes all MongoDB collections for the Diet Care feature with:
- Collection creation with validation schemas
- Index creation for query optimization
- Sample data insertion for testing
- Health checks

Usage:
    python scripts/init_diet_care_collections.py [--drop] [--sample-data]

Options:
    --drop: Drop existing collections before creating (WARNING: deletes data)
    --sample-data: Insert sample data for testing
    --skip-validation: Skip JSON schema validation
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import argparse
import logging

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from pymongo import ASCENDING, DESCENDING
from pymongo.errors import CollectionInvalid, OperationFailure
from bson import ObjectId

from app.db.connection import db, check_connection
from app.models.diet import CKDStage, MealType

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================
# JSON Schema Validators
# ============================================

DIET_GOALS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["user_id", "sodium_mg", "protein_g", "potassium_mg", "phosphorus_mg", "ckd_stage", "updated_at"],
        "properties": {
            "user_id": {
                "bsonType": "objectId",
                "description": "User ID reference"
            },
            "sodium_mg": {
                "bsonType": "double",
                "minimum": 0,
                "maximum": 10000,
                "description": "Daily sodium goal in mg"
            },
            "protein_g": {
                "bsonType": "double",
                "minimum": 0,
                "maximum": 500,
                "description": "Daily protein goal in grams"
            },
            "potassium_mg": {
                "bsonType": "double",
                "minimum": 0,
                "maximum": 10000,
                "description": "Daily potassium goal in mg"
            },
            "phosphorus_mg": {
                "bsonType": "double",
                "minimum": 0,
                "maximum": 5000,
                "description": "Daily phosphorus goal in mg"
            },
            "ckd_stage": {
                "enum": ["1", "2", "3", "4", "5"],
                "description": "Chronic Kidney Disease stage"
            },
            "created_at": {
                "bsonType": "date",
                "description": "Creation timestamp"
            },
            "updated_at": {
                "bsonType": "date",
                "description": "Last update timestamp"
            }
        }
    }
}

MEAL_LOGS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["user_id", "meal_type", "foods", "total_nutrients", "logged_at", "created_at"],
        "properties": {
            "user_id": {
                "bsonType": "objectId",
                "description": "User ID reference"
            },
            "meal_type": {
                "enum": ["breakfast", "lunch", "dinner", "snack"],
                "description": "Type of meal"
            },
            "foods": {
                "bsonType": "array",
                "minItems": 1,
                "description": "List of food items in the meal",
                "items": {
                    "bsonType": "object",
                    "required": ["name", "portion_g", "sodium_mg", "protein_g", "potassium_mg", "phosphorus_mg"],
                    "properties": {
                        "name": {"bsonType": "string"},
                        "portion_g": {"bsonType": "double", "minimum": 0},
                        "sodium_mg": {"bsonType": "double", "minimum": 0},
                        "protein_g": {"bsonType": "double", "minimum": 0},
                        "potassium_mg": {"bsonType": "double", "minimum": 0},
                        "phosphorus_mg": {"bsonType": "double", "minimum": 0}
                    }
                }
            },
            "total_nutrients": {
                "bsonType": "object",
                "required": ["sodium_mg", "protein_g", "potassium_mg", "phosphorus_mg"],
                "description": "Total nutrients for the meal"
            },
            "logged_at": {
                "bsonType": "date",
                "description": "When the meal was consumed"
            },
            "created_at": {
                "bsonType": "date",
                "description": "When the log was created"
            }
        }
    }
}

DIET_SESSIONS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["user_id", "created_at", "expires_at", "analysis_count"],
        "properties": {
            "user_id": {
                "bsonType": "objectId",
                "description": "User ID reference"
            },
            "created_at": {
                "bsonType": "date",
                "description": "Session creation time"
            },
            "expires_at": {
                "bsonType": "date",
                "description": "Session expiration time"
            },
            "analysis_count": {
                "bsonType": "int",
                "minimum": 0,
                "maximum": 10,
                "description": "Number of analyses performed"
            }
        }
    }
}

USER_STREAKS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["user_id", "current_streak", "longest_streak", "total_days_logged"],
        "properties": {
            "user_id": {
                "bsonType": "objectId",
                "description": "User ID reference"
            },
            "current_streak": {
                "bsonType": "int",
                "minimum": 0,
                "description": "Current consecutive days streak"
            },
            "longest_streak": {
                "bsonType": "int",
                "minimum": 0,
                "description": "Longest streak ever achieved"
            },
            "last_logged_date": {
                "bsonType": ["string", "null"],
                "description": "Last date a meal was logged (YYYY-MM-DD)"
            },
            "total_days_logged": {
                "bsonType": "int",
                "minimum": 0,
                "description": "Total number of days with at least one meal logged"
            }
        }
    }
}

NUTRITION_ANALYSES_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["user_id", "image_hash", "analysis", "created_at", "expires_at"],
        "properties": {
            "user_id": {
                "bsonType": "objectId",
                "description": "User ID reference"
            },
            "image_hash": {
                "bsonType": "string",
                "description": "Hash of the analyzed image"
            },
            "analysis": {
                "bsonType": "object",
                "description": "AI analysis result"
            },
            "created_at": {
                "bsonType": "date",
                "description": "Analysis creation time"
            },
            "expires_at": {
                "bsonType": "date",
                "description": "Cache expiration time"
            },
            "hit_count": {
                "bsonType": "int",
                "minimum": 0,
                "description": "Number of cache hits"
            }
        }
    }
}


# ============================================
# Collection Management
# ============================================

def create_collection_with_validation(name: str, schema: dict, skip_validation: bool = False):
    """
    Create collection with JSON schema validation

    Args:
        name: Collection name
        schema: JSON schema validator
        skip_validation: Skip validation for testing
    """
    try:
        if skip_validation:
            db.create_collection(name)
            logger.info(f"Created collection '{name}' without validation")
        else:
            db.create_collection(name, validator=schema)
            logger.info(f"Created collection '{name}' with validation schema")
    except CollectionInvalid:
        logger.warning(f"Collection '{name}' already exists")
    except Exception as e:
        logger.error(f"Failed to create collection '{name}': {e}")
        raise


def create_indexes():
    """Create indexes for all Diet Care collections"""

    logger.info("Creating indexes...")

    # Diet Goals indexes
    db["diet_goals"].create_index(
        [("user_id", ASCENDING)],
        unique=True,
        name="user_id_unique"
    )
    db["diet_goals"].create_index(
        [("ckd_stage", ASCENDING), ("updated_at", DESCENDING)],
        name="stage_updated_idx"
    )
    logger.info("✓ Created indexes for diet_goals")

    # Meal Logs indexes
    db["meal_logs"].create_index(
        [("user_id", ASCENDING), ("logged_at", DESCENDING)],
        name="user_logged_idx"
    )
    db["meal_logs"].create_index(
        [("user_id", ASCENDING), ("meal_type", ASCENDING), ("logged_at", DESCENDING)],
        name="user_type_logged_idx"
    )
    db["meal_logs"].create_index(
        [("logged_at", DESCENDING)],
        name="logged_at_idx"
    )
    logger.info("✓ Created indexes for meal_logs")

    # Diet Sessions indexes
    db["diet_sessions"].create_index(
        [("user_id", ASCENDING), ("expires_at", DESCENDING)],
        name="user_expires_idx"
    )
    db["diet_sessions"].create_index(
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        name="expires_ttl_idx"
    )
    logger.info("✓ Created indexes for diet_sessions (with TTL)")

    # User Streaks indexes
    db["user_streaks"].create_index(
        [("user_id", ASCENDING)],
        unique=True,
        name="user_id_unique"
    )
    db["user_streaks"].create_index(
        [("current_streak", DESCENDING)],
        name="current_streak_idx"
    )
    db["user_streaks"].create_index(
        [("longest_streak", DESCENDING)],
        name="longest_streak_idx"
    )
    logger.info("✓ Created indexes for user_streaks")

    # Nutrition Analyses indexes
    db["nutrition_analyses"].create_index(
        [("user_id", ASCENDING), ("image_hash", ASCENDING)],
        name="user_hash_idx"
    )
    db["nutrition_analyses"].create_index(
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        name="expires_ttl_idx"
    )
    logger.info("✓ Created indexes for nutrition_analyses (with TTL)")


def drop_collections():
    """Drop all Diet Care collections"""
    collections = [
        "diet_goals",
        "meal_logs",
        "diet_sessions",
        "user_streaks",
        "nutrition_analyses"
    ]

    for collection in collections:
        try:
            db[collection].drop()
            logger.info(f"Dropped collection '{collection}'")
        except Exception as e:
            logger.error(f"Failed to drop collection '{collection}': {e}")


# ============================================
# Sample Data
# ============================================

def insert_sample_data():
    """Insert sample data for testing"""

    logger.info("Inserting sample data...")

    # Create sample user (assuming users collection exists)
    sample_user = db["users"].find_one({"email": "test@example.com"})

    if not sample_user:
        sample_user_id = db["users"].insert_one({
            "email": "test@example.com",
            "name": "Test User",
            "profile": "patient",
            "role": "user",
            "created_at": datetime.utcnow()
        }).inserted_id
        logger.info(f"Created sample user: {sample_user_id}")
    else:
        sample_user_id = sample_user["_id"]
        logger.info(f"Using existing sample user: {sample_user_id}")

    # Sample goals
    sample_goal = {
        "user_id": sample_user_id,
        "sodium_mg": 2000.0,
        "protein_g": 50.0,
        "potassium_mg": 2000.0,
        "phosphorus_mg": 800.0,
        "ckd_stage": "3",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    try:
        db["diet_goals"].insert_one(sample_goal)
        logger.info("✓ Inserted sample goal")
    except Exception as e:
        logger.warning(f"Could not insert sample goal: {e}")

    # Sample meals
    today = datetime.utcnow()
    sample_meals = [
        {
            "user_id": sample_user_id,
            "meal_type": "breakfast",
            "foods": [
                {
                    "name": "현미밥",
                    "portion_g": 210.0,
                    "sodium_mg": 2.0,
                    "protein_g": 5.2,
                    "potassium_mg": 157.0,
                    "phosphorus_mg": 189.0
                },
                {
                    "name": "된장찌개",
                    "portion_g": 300.0,
                    "sodium_mg": 850.0,
                    "protein_g": 12.5,
                    "potassium_mg": 280.0,
                    "phosphorus_mg": 150.0
                }
            ],
            "total_nutrients": {
                "sodium_mg": 852.0,
                "protein_g": 17.7,
                "potassium_mg": 437.0,
                "phosphorus_mg": 339.0
            },
            "logged_at": today.replace(hour=8, minute=0),
            "created_at": today
        },
        {
            "user_id": sample_user_id,
            "meal_type": "lunch",
            "foods": [
                {
                    "name": "백미밥",
                    "portion_g": 210.0,
                    "sodium_mg": 2.0,
                    "protein_g": 4.5,
                    "potassium_mg": 80.0,
                    "phosphorus_mg": 100.0
                },
                {
                    "name": "삼겹살구이",
                    "portion_g": 150.0,
                    "sodium_mg": 450.0,
                    "protein_g": 22.5,
                    "potassium_mg": 300.0,
                    "phosphorus_mg": 200.0
                }
            ],
            "total_nutrients": {
                "sodium_mg": 452.0,
                "protein_g": 27.0,
                "potassium_mg": 380.0,
                "phosphorus_mg": 300.0
            },
            "logged_at": today.replace(hour=12, minute=30),
            "created_at": today
        }
    ]

    try:
        db["meal_logs"].insert_many(sample_meals)
        logger.info(f"✓ Inserted {len(sample_meals)} sample meals")
    except Exception as e:
        logger.warning(f"Could not insert sample meals: {e}")

    # Sample streak
    sample_streak = {
        "user_id": sample_user_id,
        "current_streak": 5,
        "longest_streak": 12,
        "last_logged_date": today.strftime("%Y-%m-%d"),
        "total_days_logged": 45
    }

    try:
        db["user_streaks"].insert_one(sample_streak)
        logger.info("✓ Inserted sample streak")
    except Exception as e:
        logger.warning(f"Could not insert sample streak: {e}")

    # Sample session
    sample_session = {
        "user_id": sample_user_id,
        "created_at": today,
        "expires_at": today + timedelta(hours=1),
        "analysis_count": 2
    }

    try:
        db["diet_sessions"].insert_one(sample_session)
        logger.info("✓ Inserted sample session")
    except Exception as e:
        logger.warning(f"Could not insert sample session: {e}")


def verify_collections():
    """Verify that all collections are created and accessible"""

    logger.info("Verifying collections...")

    required_collections = [
        "diet_goals",
        "meal_logs",
        "diet_sessions",
        "user_streaks",
        "nutrition_analyses"
    ]

    existing_collections = db.list_collection_names()

    for collection in required_collections:
        if collection in existing_collections:
            count = db[collection].count_documents({})
            logger.info(f"✓ {collection}: {count} documents")
        else:
            logger.error(f"✗ {collection}: NOT FOUND")
            return False

    return True


# ============================================
# Main Function
# ============================================

def main():
    """Main initialization function"""

    parser = argparse.ArgumentParser(
        description="Initialize Diet Care MongoDB collections"
    )
    parser.add_argument(
        "--drop",
        action="store_true",
        help="Drop existing collections before creating (WARNING: deletes data)"
    )
    parser.add_argument(
        "--sample-data",
        action="store_true",
        help="Insert sample data for testing"
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip JSON schema validation"
    )

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Diet Care Collections Initialization")
    logger.info("=" * 60)

    # Check database connection
    connection_status = check_connection()
    if connection_status["status"] != "success":
        logger.error(f"Database connection failed: {connection_status['message']}")
        return 1

    logger.info(f"✓ Connected to MongoDB: {db.name}")

    try:
        # Drop collections if requested
        if args.drop:
            logger.warning("Dropping existing collections...")
            response = input("Are you sure? This will delete all data! (yes/no): ")
            if response.lower() == "yes":
                drop_collections()
            else:
                logger.info("Skipping collection drop")

        # Create collections with validation
        logger.info("Creating collections...")
        create_collection_with_validation("diet_goals", DIET_GOALS_SCHEMA, args.skip_validation)
        create_collection_with_validation("meal_logs", MEAL_LOGS_SCHEMA, args.skip_validation)
        create_collection_with_validation("diet_sessions", DIET_SESSIONS_SCHEMA, args.skip_validation)
        create_collection_with_validation("user_streaks", USER_STREAKS_SCHEMA, args.skip_validation)
        create_collection_with_validation("nutrition_analyses", NUTRITION_ANALYSES_SCHEMA, args.skip_validation)

        # Create indexes
        create_indexes()

        # Insert sample data if requested
        if args.sample_data:
            insert_sample_data()

        # Verify collections
        if verify_collections():
            logger.info("=" * 60)
            logger.info("✓ Initialization completed successfully!")
            logger.info("=" * 60)
            return 0
        else:
            logger.error("Verification failed")
            return 1

    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
