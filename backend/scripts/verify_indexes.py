"""
Script to verify MongoDB indexes are created correctly
Run this script to check all indexes in the database
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.db.connection import Database
from app.db.indexes import list_all_indexes


async def verify_indexes():
    """Verify all indexes are created correctly"""
    try:
        # Connect to database
        print("Connecting to MongoDB...")
        await Database.connect()
        print("Connected successfully!\n")

        # List all indexes
        print("Listing all indexes in database collections:")
        print("=" * 80)

        all_indexes = await list_all_indexes(Database.db)

        # Print indexes in a formatted way
        for collection_name, indexes in all_indexes.items():
            print(f"\n{collection_name.upper()}:")
            print("-" * 80)
            for index_name, index_info in indexes.items():
                print(f"  Index: {index_name}")
                print(f"    Keys: {index_info.get('key', [])}")
                if index_info.get('unique'):
                    print(f"    Unique: True")
                print()

        print("=" * 80)
        print("\nVerification complete!")

    except Exception as e:
        print(f"Error verifying indexes: {str(e)}")
        raise
    finally:
        # Disconnect
        await Database.disconnect()
        print("Disconnected from MongoDB")


if __name__ == "__main__":
    asyncio.run(verify_indexes())
