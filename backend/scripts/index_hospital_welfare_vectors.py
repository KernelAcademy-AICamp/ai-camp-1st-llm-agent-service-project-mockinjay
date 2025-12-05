"""
Hospital & Welfare Vector Indexing Script

Indexes hospital and welfare program data to Pinecone for semantic search.
This enables hybrid search (keyword + semantic) in hospital_manager.py and welfare_manager.py.

Usage:
    python scripts/index_hospital_welfare_vectors.py --hospitals
    python scripts/index_hospital_welfare_vectors.py --welfare
    python scripts/index_hospital_welfare_vectors.py --all

Author: CareGuide Team
Date: 2024-12-04
"""

import asyncio
import argparse
import sys
import time
import logging
import re
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.db.vector_manager import OptimizedVectorDBManager
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HospitalWelfareIndexer:
    """Indexes hospital and welfare data to Pinecone for semantic search."""

    # Hospital fields to embed - focus on searchable text
    HOSPITAL_TEXT_FIELDS = ["name", "address", "region", "type"]
    HOSPITAL_NAMESPACE = "hospitals"

    # Welfare fields to embed - rich text content
    WELFARE_TEXT_FIELDS = ["title", "description", "category"]
    WELFARE_NAMESPACE = "welfare_programs"

    def __init__(self):
        self.uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = "careguide"
        self.client = None
        self.db = None
        self.vector_manager = None

    async def connect(self):
        """Connect to MongoDB and initialize vector manager."""
        logger.info("Connecting to MongoDB...")
        self.client = AsyncIOMotorClient(self.uri)
        self.db = self.client[self.db_name]

        # Verify connection
        await self.db.command("ping")
        logger.info(f"✅ Connected to MongoDB: {self.db_name}")

        # Initialize vector manager
        logger.info("Initializing Vector Manager...")
        self.vector_manager = OptimizedVectorDBManager(
            use_cache=True,
            use_chunking=False,  # Hospital/welfare data is short, no need to chunk
            batch_size=64
        )
        await self.vector_manager.create_index()
        logger.info("✅ Vector Manager ready")

    async def close(self):
        """Close connections."""
        if self.client:
            self.client.close()
        if self.vector_manager:
            self.vector_manager.close()
        logger.info("Connections closed")

    def _extract_district(self, address: str) -> str:
        """Extract district (구/군) from address for Pinecone filtering.

        Examples:
            "서울특별시 강남구 언주로 123" → "강남구"
            "경기도 용인시 처인구 백옥대로" → "처인구"
            "전라남도 순천시 봉화3길 14" → "순천시"
        """
        if not address:
            return ""

        # Try to extract 구/군 first
        match = re.search(r'([가-힣]+[구군])\s', address)
        if match:
            return match.group(1)

        # Fallback to 시 (for cities without 구/군)
        match = re.search(r'([가-힣]+시)\s', address)
        if match:
            return match.group(1)

        return ""

    def _safe_float(self, value, default: float = 0.0) -> float:
        """Convert value to float, handling NaN and None."""
        import math
        if value is None:
            return default
        try:
            f = float(value)
            if math.isnan(f) or math.isinf(f):
                return default
            return f
        except (ValueError, TypeError):
            return default

    def _prepare_hospital_metadata(self, doc: dict) -> dict:
        """Prepare hospital metadata for Pinecone storage."""
        address = doc.get("address", "") or ""
        district = self._extract_district(address)

        return {
            "doc_id": str(doc.get("_id", "")),
            "name": (doc.get("name") or "")[:500],
            "address": address[:500],
            "region": (doc.get("region") or "")[:100],
            "district": district,  # 구/군/시 for filtering
            "type": (doc.get("type") or "")[:100],
            "phone": (doc.get("phone") or "")[:50],
            "has_dialysis_unit": bool(doc.get("has_dialysis_unit", False)),
            "night_dialysis": bool(doc.get("night_dialysis", False)),
            "dialysis_machines": int(doc.get("dialysis_machines") or 0),
            "lat": self._safe_float(doc.get("lat")),
            "lng": self._safe_float(doc.get("lng")),
        }

    def _prepare_welfare_metadata(self, doc: dict) -> dict:
        """Prepare welfare metadata for Pinecone storage."""
        keywords = doc.get("keywords", [])
        if isinstance(keywords, list):
            keywords_str = ", ".join(keywords[:10])
        else:
            keywords_str = str(keywords)[:200]

        return {
            "doc_id": str(doc.get("_id", "")),
            "program_id": doc.get("programId", "")[:100],
            "title": doc.get("title", "")[:500],
            "category": doc.get("category", "")[:100],
            "keywords": keywords_str,
            "is_active": doc.get("is_active", True),
            "year": doc.get("year", 2024),
        }

    async def index_hospitals(self, batch_size: int = 1000, limit: int = None):
        """Index hospital data to Pinecone.

        Args:
            batch_size: Number of documents to process per batch
            limit: Optional limit on total documents (for testing)
        """
        logger.info("=" * 60)
        logger.info("INDEXING HOSPITALS TO PINECONE")
        logger.info("=" * 60)

        collection = self.db.hospitals
        total_count = await collection.count_documents({})

        if limit:
            total_count = min(total_count, limit)

        logger.info(f"Total hospitals to index: {total_count:,}")

        start_time = time.time()
        indexed_count = 0

        # Process in batches
        cursor = collection.find({}).limit(limit) if limit else collection.find({})

        batch = []
        async for doc in cursor:
            # Combine text fields for embedding
            text_parts = []
            for field in self.HOSPITAL_TEXT_FIELDS:
                value = doc.get(field, "")
                if value:
                    text_parts.append(str(value))

            # Add dialysis info to text for better semantic matching
            if doc.get("has_dialysis_unit"):
                text_parts.append("투석 가능")
                text_parts.append("인공신장실")
                if doc.get("night_dialysis"):
                    text_parts.append("야간 투석")
                machines = doc.get("dialysis_machines", 0)
                if machines:
                    text_parts.append(f"투석기 {machines}대")

            combined_text = " ".join(text_parts)

            if not combined_text.strip():
                continue

            batch.append({
                "_id": str(doc["_id"]),
                "text": combined_text,
                "metadata": self._prepare_hospital_metadata(doc)
            })

            if len(batch) >= batch_size:
                await self._upsert_batch(batch, self.HOSPITAL_NAMESPACE)
                indexed_count += len(batch)
                logger.info(f"Progress: {indexed_count:,}/{total_count:,} ({indexed_count/total_count*100:.1f}%)")
                batch = []

        # Process remaining batch
        if batch:
            await self._upsert_batch(batch, self.HOSPITAL_NAMESPACE)
            indexed_count += len(batch)

        elapsed = time.time() - start_time
        logger.info(f"✅ Indexed {indexed_count:,} hospitals in {elapsed:.1f}s ({indexed_count/elapsed:.1f} docs/sec)")

        return indexed_count

    async def index_welfare(self, batch_size: int = 100, limit: int = None):
        """Index welfare program data to Pinecone.

        Args:
            batch_size: Number of documents to process per batch
            limit: Optional limit on total documents (for testing)
        """
        logger.info("=" * 60)
        logger.info("INDEXING WELFARE PROGRAMS TO PINECONE")
        logger.info("=" * 60)

        collection = self.db.welfare_programs
        total_count = await collection.count_documents({})

        if limit:
            total_count = min(total_count, limit)

        logger.info(f"Total welfare programs to index: {total_count:,}")

        start_time = time.time()
        indexed_count = 0

        cursor = collection.find({}).limit(limit) if limit else collection.find({})

        batch = []
        async for doc in cursor:
            # Combine text fields for embedding
            text_parts = []
            for field in self.WELFARE_TEXT_FIELDS:
                value = doc.get(field, "")
                if value:
                    text_parts.append(str(value))

            # Add keywords for better matching
            keywords = doc.get("keywords", [])
            if isinstance(keywords, list):
                text_parts.extend(keywords[:10])

            # Add target disease info
            target_disease = doc.get("target_disease", [])
            if isinstance(target_disease, list):
                text_parts.extend(target_disease[:5])

            combined_text = " ".join(text_parts)

            if not combined_text.strip():
                continue

            batch.append({
                "_id": str(doc["_id"]),
                "text": combined_text,
                "metadata": self._prepare_welfare_metadata(doc)
            })

            if len(batch) >= batch_size:
                await self._upsert_batch(batch, self.WELFARE_NAMESPACE)
                indexed_count += len(batch)
                logger.info(f"Progress: {indexed_count:,}/{total_count:,}")
                batch = []

        # Process remaining batch
        if batch:
            await self._upsert_batch(batch, self.WELFARE_NAMESPACE)
            indexed_count += len(batch)

        elapsed = time.time() - start_time
        logger.info(f"✅ Indexed {indexed_count:,} welfare programs in {elapsed:.1f}s")

        return indexed_count

    async def _upsert_batch(self, batch: list, namespace: str):
        """Upload a batch of documents to Pinecone.

        Args:
            batch: List of documents with _id, text, and metadata
            namespace: Pinecone namespace
        """
        texts = [doc["text"] for doc in batch]

        # Generate embeddings in batch
        embeddings = self.vector_manager.generate_embeddings_batch(texts)

        # Prepare vectors for Pinecone
        vectors = []
        for doc, embedding in zip(batch, embeddings):
            vectors.append({
                "id": doc["_id"],
                "values": embedding,
                "metadata": doc["metadata"]
            })

        # Upload to Pinecone
        self.vector_manager.index.upsert(vectors=vectors, namespace=namespace)

    async def verify_indexes(self):
        """Verify that data has been indexed correctly."""
        logger.info("\n" + "=" * 60)
        logger.info("VERIFYING INDEXES")
        logger.info("=" * 60)

        # Check hospital namespace
        try:
            stats = self.vector_manager.index.describe_index_stats()
            namespaces = stats.get("namespaces", {})

            hospital_count = namespaces.get(self.HOSPITAL_NAMESPACE, {}).get("vector_count", 0)
            welfare_count = namespaces.get(self.WELFARE_NAMESPACE, {}).get("vector_count", 0)

            logger.info(f"Hospital vectors: {hospital_count:,}")
            logger.info(f"Welfare vectors: {welfare_count:,}")

            # Test search
            if hospital_count > 0:
                logger.info("\nTest hospital search: '강남구 투석'")
                results = await self.vector_manager.semantic_search(
                    "강남구 투석 가능 병원",
                    top_k=3,
                    namespace=self.HOSPITAL_NAMESPACE
                )
                for r in results:
                    logger.info(f"  - {r['metadata'].get('name', 'N/A')} (score: {r['score']:.3f})")

            if welfare_count > 0:
                logger.info("\nTest welfare search: '산정특례'")
                results = await self.vector_manager.semantic_search(
                    "산정특례 의료비 지원",
                    top_k=3,
                    namespace=self.WELFARE_NAMESPACE
                )
                for r in results:
                    logger.info(f"  - {r['metadata'].get('title', 'N/A')} (score: {r['score']:.3f})")

            return {"hospitals": hospital_count, "welfare": welfare_count}

        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return None


async def main():
    parser = argparse.ArgumentParser(description="Index hospital and welfare data to Pinecone")
    parser.add_argument("--hospitals", action="store_true", help="Index hospital data")
    parser.add_argument("--welfare", action="store_true", help="Index welfare data")
    parser.add_argument("--all", action="store_true", help="Index all data")
    parser.add_argument("--verify", action="store_true", help="Verify indexes only")
    parser.add_argument("--limit", type=int, default=None, help="Limit documents for testing")
    parser.add_argument("--batch-size", type=int, default=500, help="Batch size for processing")

    args = parser.parse_args()

    # Default to --all if no specific option given
    if not any([args.hospitals, args.welfare, args.all, args.verify]):
        args.all = True

    indexer = HospitalWelfareIndexer()

    try:
        await indexer.connect()

        if args.verify:
            await indexer.verify_indexes()
            return

        if args.hospitals or args.all:
            await indexer.index_hospitals(batch_size=args.batch_size, limit=args.limit)

        if args.welfare or args.all:
            await indexer.index_welfare(batch_size=args.batch_size, limit=args.limit)

        # Always verify after indexing
        await indexer.verify_indexes()

    finally:
        await indexer.close()


if __name__ == "__main__":
    asyncio.run(main())
