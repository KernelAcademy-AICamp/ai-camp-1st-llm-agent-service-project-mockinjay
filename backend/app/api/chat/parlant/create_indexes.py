#!/usr/bin/env python3
"""
MongoDB Index Creation and Optimization Script

This script creates all necessary indexes for optimal query performance.
Includes compound indexes, text indexes, and specialized indexes for
the healthcare chat system.

Run this script after initial data load for best performance.
"""

import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, TEXT, GEO2D
from typing import List, Dict, Tuple
import os
from dotenv import load_dotenv
import time

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class IndexManager:
    """Manages MongoDB index creation and optimization"""

    def __init__(self, uri: str = None, db_name: str = "careguide"):
        self.uri = uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = db_name
        self.client: AsyncIOMotorClient = None
        self.db = None

    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(self.uri)
        self.db = self.client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.db_name}")

    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    async def create_index(
        self,
        collection_name: str,
        index_spec: List[Tuple],
        index_options: Dict
    ) -> bool:
        """Create a single index with error handling"""
        try:
            collection = self.db[collection_name]
            index_name = index_options.get("name", "unnamed_index")

            # Check if index already exists
            existing_indexes = await collection.index_information()
            if index_name in existing_indexes:
                logger.info(f"  ✓ Index '{index_name}' already exists on {collection_name}")
                return True

            # Create index
            start_time = time.time()
            await collection.create_index(index_spec, **index_options)
            elapsed = time.time() - start_time

            logger.info(f"  ✅ Created index '{index_name}' on {collection_name} ({elapsed:.2f}s)")
            return True

        except Exception as e:
            logger.error(f"  ❌ Failed to create index '{index_name}' on {collection_name}: {e}")
            return False

    async def drop_index(self, collection_name: str, index_name: str) -> bool:
        """Drop an index"""
        try:
            collection = self.db[collection_name]
            await collection.drop_index(index_name)
            logger.info(f"  Dropped index '{index_name}' from {collection_name}")
            return True
        except Exception as e:
            logger.warning(f"  Could not drop index '{index_name}' from {collection_name}: {e}")
            return False

    async def create_qa_indexes(self):
        """Create indexes for QA collection"""
        logger.info("\n📝 Creating QA Kidney Indexes...")

        indexes = [
            # Compound text index for search
            (
                [("question", TEXT), ("answer", TEXT)],
                {
                    "name": "qa_text_compound",
                    "weights": {"question": 2, "answer": 1},
                    "default_language": "english"
                }
            ),
            # Source dataset index for filtering
            (
                [("source_dataset", ASCENDING)],
                {"name": "qa_source_idx"}
            ),
            # Question hash for deduplication
            (
                [("question_hash", ASCENDING)],
                {"name": "qa_hash_idx", "unique": True, "sparse": True}
            ),
            # Compound index for common queries
            (
                [("source_dataset", ASCENDING), ("_id", ASCENDING)],
                {"name": "qa_source_id_compound"}
            )
        ]

        success_count = 0
        for spec, options in indexes:
            if await self.create_index("qa_kidney", spec, options):
                success_count += 1

        logger.info(f"QA indexes: {success_count}/{len(indexes)} created successfully")

    async def create_paper_indexes(self):
        """Create indexes for papers collection"""
        logger.info("\n📄 Creating Papers Kidney Indexes...")

        indexes = [
            # Compound text index with weights
            (
                [("title", TEXT), ("abstract", TEXT)],
                {
                    "name": "papers_text_compound",
                    "weights": {"title": 3, "abstract": 1},
                    "default_language": "english"
                }
            ),
            # DOI unique index
            (
                [("doi", ASCENDING)],
                {"name": "doi_unique", "unique": True, "sparse": True}
            ),
            # Metadata indexes
            (
                [("metadata.journal", ASCENDING)],
                {"name": "journal_idx"}
            ),
            (
                [("metadata.publication_date", DESCENDING)],
                {"name": "pub_date_idx"}
            ),
            (
                [("metadata.pmid", ASCENDING)],
                {"name": "pmid_idx", "sparse": True}
            ),
            # Year index for temporal queries
            (
                [("metadata.year", DESCENDING)],
                {"name": "year_idx", "sparse": True}
            ),
            # Authors index for author search
            (
                [("metadata.authors", ASCENDING)],
                {"name": "authors_idx"}
            ),
            # Compound indexes for common query patterns
            (
                [("source", ASCENDING), ("metadata.publication_date", DESCENDING)],
                {"name": "source_date_compound"}
            ),
            (
                [("metadata.journal", ASCENDING), ("metadata.year", DESCENDING)],
                {"name": "journal_year_compound"}
            ),
            # Keywords index
            (
                [("metadata.keywords", ASCENDING)],
                {"name": "keywords_idx", "sparse": True}
            )
        ]

        success_count = 0
        for spec, options in indexes:
            if await self.create_index("papers_kidney", spec, options):
                success_count += 1

        logger.info(f"Papers indexes: {success_count}/{len(indexes)} created successfully")

    async def create_medical_indexes(self):
        """Create indexes for medical data collection"""
        logger.info("\n🏥 Creating Medical Kidney Indexes...")

        indexes = [
            # Text search index
            (
                [("text", TEXT), ("keyword", TEXT)],
                {
                    "name": "medical_text_compound",
                    "weights": {"keyword": 2, "text": 1},
                    "default_language": "english"
                }
            ),
            # Patent ID index
            (
                [("patent_id", ASCENDING)],
                {"name": "patent_idx", "unique": True, "sparse": True}
            ),
            # Category index
            (
                [("category", ASCENDING)],
                {"name": "category_idx"}
            ),
            # Source dataset index
            (
                [("source_dataset", ASCENDING)],
                {"name": "medical_source_idx"}
            ),
            # Text hash for deduplication
            (
                [("text_hash", ASCENDING)],
                {"name": "text_hash_idx", "sparse": True}
            ),
            # Compound index for category + source queries
            (
                [("category", ASCENDING), ("source_dataset", ASCENDING)],
                {"name": "category_source_compound"}
            )
        ]

        success_count = 0
        for spec, options in indexes:
            if await self.create_index("medical_kidney", spec, options):
                success_count += 1

        logger.info(f"Medical indexes: {success_count}/{len(indexes)} created successfully")

    async def create_guidelines_indexes(self):
        """Create indexes for guidelines collection"""
        logger.info("\n📘 Creating Guidelines Kidney Indexes...")

        indexes = [
            # Text search index
            (
                [("text", TEXT), ("keyword", TEXT)],
                {
                    "name": "guidelines_text_compound",
                    "weights": {"keyword": 2, "text": 1},
                    "default_language": "english"
                }
            ),
            # Category index
            (
                [("category", ASCENDING)],
                {"name": "guidelines_category_idx"}
            ),
            # Source indexes
            (
                [("source_dataset", ASCENDING)],
                {"name": "guidelines_source_idx"}
            ),
            (
                [("source_file", ASCENDING)],
                {"name": "guidelines_file_idx", "sparse": True}
            ),
            # Compound index for filtering
            (
                [("category", ASCENDING), ("source_dataset", ASCENDING)],
                {"name": "guidelines_compound"}
            )
        ]

        success_count = 0
        for spec, options in indexes:
            if await self.create_index("guidelines_kidney", spec, options):
                success_count += 1

        logger.info(f"Guidelines indexes: {success_count}/{len(indexes)} created successfully")

    async def analyze_index_usage(self):
        """Analyze index usage statistics"""
        logger.info("\n📊 Analyzing Index Usage...")

        collections = ["qa_kidney", "papers_kidney", "medical_kidney", "guidelines_kidney"]

        for coll_name in collections:
            collection = self.db[coll_name]

            # Get index information
            indexes = await collection.index_information()
            logger.info(f"\n{coll_name}:")
            logger.info(f"  Total indexes: {len(indexes)}")

            # Get collection stats
            try:
                stats = await self.db.command("collStats", coll_name, indexDetails=True)

                # Document count
                doc_count = stats.get("count", 0)
                logger.info(f"  Documents: {doc_count:,}")

                # Collection size
                size_mb = stats.get("size", 0) / (1024 * 1024)
                logger.info(f"  Data size: {size_mb:.2f} MB")

                # Index sizes
                index_sizes = stats.get("indexSizes", {})
                total_index_size = sum(index_sizes.values()) / (1024 * 1024)
                logger.info(f"  Total index size: {total_index_size:.2f} MB")

                # Individual index sizes
                for index_name, size_bytes in index_sizes.items():
                    size_mb = size_bytes / (1024 * 1024)
                    logger.info(f"    - {index_name}: {size_mb:.2f} MB")

            except Exception as e:
                logger.warning(f"  Could not get detailed stats: {e}")

    async def optimize_indexes(self):
        """Optimize indexes by rebuilding them"""
        logger.info("\n🔧 Optimizing Indexes...")

        collections = ["qa_kidney", "papers_kidney", "medical_kidney", "guidelines_kidney"]

        for coll_name in collections:
            try:
                logger.info(f"\nReindexing {coll_name}...")
                start_time = time.time()

                # Reindex collection
                await self.db.command("reIndex", coll_name)

                elapsed = time.time() - start_time
                logger.info(f"  ✅ Reindexed {coll_name} in {elapsed:.2f}s")

            except Exception as e:
                logger.error(f"  ❌ Failed to reindex {coll_name}: {e}")

    async def create_all_indexes(self):
        """Create all indexes"""
        logger.info("="*80)
        logger.info("MONGODB INDEX CREATION")
        logger.info("="*80)

        start_time = time.time()

        # Create indexes for each collection
        await self.create_qa_indexes()
        await self.create_paper_indexes()
        await self.create_medical_indexes()
        await self.create_guidelines_indexes()

        elapsed = time.time() - start_time

        logger.info("\n" + "="*80)
        logger.info(f"✅ INDEX CREATION COMPLETED in {elapsed:.2f}s")
        logger.info("="*80)

    async def drop_all_indexes(self):
        """Drop all non-system indexes (use with caution)"""
        logger.info("\n⚠️  Dropping all custom indexes...")

        collections = ["qa_kidney", "papers_kidney", "medical_kidney", "guidelines_kidney"]

        for coll_name in collections:
            collection = self.db[coll_name]
            indexes = await collection.index_information()

            for index_name in indexes.keys():
                if index_name != "_id_":  # Don't drop the default _id index
                    await self.drop_index(coll_name, index_name)

        logger.info("All custom indexes dropped")


async def main():
    """Main function to run index creation"""
    manager = IndexManager()

    try:
        await manager.connect()

        # Parse command line arguments
        import sys

        if len(sys.argv) > 1:
            command = sys.argv[1].lower()

            if command == "create":
                await manager.create_all_indexes()
            elif command == "analyze":
                await manager.analyze_index_usage()
            elif command == "optimize":
                await manager.optimize_indexes()
            elif command == "drop":
                response = input("⚠️  Are you sure you want to drop all indexes? (yes/no): ")
                if response.lower() == "yes":
                    await manager.drop_all_indexes()
                else:
                    logger.info("Operation cancelled")
            elif command == "rebuild":
                logger.info("Rebuilding all indexes...")
                await manager.drop_all_indexes()
                await manager.create_all_indexes()
            else:
                print_usage()
        else:
            # Default: create indexes and analyze
            await manager.create_all_indexes()
            await manager.analyze_index_usage()

    finally:
        await manager.disconnect()


def print_usage():
    """Print usage information"""
    print("""
Usage: python create_indexes.py [command]

Commands:
  create   - Create all indexes (default)
  analyze  - Analyze index usage and statistics
  optimize - Optimize indexes by rebuilding
  drop     - Drop all custom indexes (use with caution!)
  rebuild  - Drop and recreate all indexes

Examples:
  python create_indexes.py                # Create indexes and analyze
  python create_indexes.py create         # Create all indexes
  python create_indexes.py analyze        # Show index statistics
  python create_indexes.py optimize       # Rebuild indexes for optimization
  python create_indexes.py rebuild        # Full index rebuild
""")


if __name__ == "__main__":
    asyncio.run(main())