"""
Setup MongoDB Indexes for Diet Care Feature

This script creates the necessary indexes for optimal performance
of the Diet Care API endpoints.

Usage:
    python scripts/setup_diet_care_indexes.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.connection import (
    diet_sessions_collection,
    diet_meals_collection,
    diet_goals_collection
)


def create_indexes():
    """Create all necessary indexes for Diet Care collections"""

    print("Creating indexes for Diet Care collections...")

    # ============================================
    # diet_sessions indexes
    # ============================================
    print("\n1. Creating indexes for diet_sessions collection...")

    # Unique index on session_id for fast lookups
    diet_sessions_collection.create_index("session_id", unique=True)
    print("   ✓ Created unique index on session_id")

    # Index on user_id for user-specific queries
    diet_sessions_collection.create_index("user_id")
    print("   ✓ Created index on user_id")

    # TTL index to automatically delete expired sessions
    diet_sessions_collection.create_index("expires_at", expireAfterSeconds=0)
    print("   ✓ Created TTL index on expires_at")

    # ============================================
    # diet_meals indexes
    # ============================================
    print("\n2. Creating indexes for diet_meals collection...")

    # Index on user_id for user-specific queries
    diet_meals_collection.create_index("user_id")
    print("   ✓ Created index on user_id")

    # Index on logged_at for date range queries
    diet_meals_collection.create_index("logged_at")
    print("   ✓ Created index on logged_at")

    # Compound index for efficient user + date queries
    diet_meals_collection.create_index([("user_id", 1), ("logged_at", -1)])
    print("   ✓ Created compound index on (user_id, logged_at)")

    # Index on meal_type for filtering
    diet_meals_collection.create_index("meal_type")
    print("   ✓ Created index on meal_type")

    # ============================================
    # diet_goals indexes
    # ============================================
    print("\n3. Creating indexes for diet_goals collection...")

    # Unique index on user_id (one goals document per user)
    diet_goals_collection.create_index("user_id", unique=True)
    print("   ✓ Created unique index on user_id")

    print("\n✅ All indexes created successfully!")

    # Print collection stats
    print("\n" + "="*50)
    print("Collection Statistics:")
    print("="*50)

    sessions_count = diet_sessions_collection.count_documents({})
    meals_count = diet_meals_collection.count_documents({})
    goals_count = diet_goals_collection.count_documents({})

    print(f"diet_sessions: {sessions_count} documents")
    print(f"diet_meals: {meals_count} documents")
    print(f"diet_goals: {goals_count} documents")

    # List indexes
    print("\n" + "="*50)
    print("Indexes Created:")
    print("="*50)

    print("\ndiet_sessions:")
    for index in diet_sessions_collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', {})}")

    print("\ndiet_meals:")
    for index in diet_meals_collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', {})}")

    print("\ndiet_goals:")
    for index in diet_goals_collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', {})}")


def drop_indexes():
    """Drop all indexes (use with caution!)"""
    print("⚠️  Dropping all indexes for Diet Care collections...")

    diet_sessions_collection.drop_indexes()
    print("   ✓ Dropped indexes for diet_sessions")

    diet_meals_collection.drop_indexes()
    print("   ✓ Dropped indexes for diet_meals")

    diet_goals_collection.drop_indexes()
    print("   ✓ Dropped indexes for diet_goals")

    print("\n✅ All indexes dropped!")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Manage Diet Care MongoDB indexes")
    parser.add_argument(
        "--drop",
        action="store_true",
        help="Drop all indexes instead of creating them"
    )

    args = parser.parse_args()

    try:
        if args.drop:
            confirm = input("Are you sure you want to drop all indexes? (yes/no): ")
            if confirm.lower() == "yes":
                drop_indexes()
            else:
                print("Operation cancelled.")
        else:
            create_indexes()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
