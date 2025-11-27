from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Optional, Set
import os
from dotenv import load_dotenv
from pymongo import UpdateOne, ASCENDING, TEXT
import asyncio
import logging
from functools import lru_cache
import time

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OptimizedMongoDBManager:
    """Optimized MongoDB Manager with connection pooling, optimized projections, and better indexing"""

    def __init__(
        self,
        uri: str = None,
        db_name: str = "careguide",
        max_pool_size: int = 100,
        min_pool_size: int = 10
    ):
        """
        Initialize optimized MongoDB manager

        Args:
            uri: MongoDB connection URI
            db_name: Database name
            max_pool_size: Maximum connection pool size
            min_pool_size: Minimum connection pool size
        """
        self.uri = uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = db_name

        # Connection pooling configuration
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.max_pool_size = max_pool_size
        self.min_pool_size = min_pool_size

        # Cache for frequently accessed data
        self._collection_stats_cache = {}
        self._cache_timestamp = 0
        self._cache_ttl = 300  # 5 minutes

    async def connect(self):
        """Connect to MongoDB with optimized settings"""
        if not self.client:
            # Configure connection pool
            self.client = AsyncIOMotorClient(
                self.uri,
                maxPoolSize=self.max_pool_size,
                minPoolSize=self.min_pool_size,
                maxIdleTimeMS=30000,  # 30 seconds
                waitQueueTimeoutMS=5000,  # 5 seconds
                serverSelectionTimeoutMS=5000,  # 5 seconds
                connectTimeoutMS=2000,  # 2 seconds
                socketTimeoutMS=10000  # 10 seconds
            )
            self.db = self.client[self.db_name]

            # Create optimized indexes
            await self.create_optimized_indexes()

            logger.info(f"✅ Optimized MongoDB connected: {self.db_name}")
            logger.info(f"   Pool size: {self.min_pool_size}-{self.max_pool_size}")

    async def close(self):
        """Close connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

    async def create_optimized_indexes(self):
        """Create optimized indexes for better performance"""

        # QA Kidney indexes
        qa_indexes = [
            # Compound text index for better text search
            ([("question", TEXT), ("answer", TEXT)], {"name": "qa_text_compound"}),
            # Single field indexes for filtering
            ([("source_dataset", ASCENDING)], {"name": "qa_source_idx"}),
            ([("question_hash", ASCENDING)], {"name": "qa_hash_idx", "unique": True, "sparse": True})
        ]
        await self._create_indexes_safe("qa_kidney", qa_indexes)

        # Papers Kidney indexes
        papers_indexes = [
            # Compound text index
            ([("title", TEXT), ("abstract", TEXT)], {"name": "papers_text_compound"}),
            # DOI unique index
            ([("doi", ASCENDING)], {"name": "doi_unique", "unique": True, "sparse": True}),
            # Metadata indexes for filtering
            ([("metadata.journal", ASCENDING)], {"name": "journal_idx"}),
            ([("metadata.publication_date", ASCENDING)], {"name": "pub_date_idx"}),
            ([("metadata.pmid", ASCENDING)], {"name": "pmid_idx", "sparse": True}),
            # Compound index for common queries
            ([("source", ASCENDING), ("metadata.publication_date", ASCENDING)], {"name": "source_date_idx"})
        ]
        await self._create_indexes_safe("papers_kidney", papers_indexes)

        # Medical Kidney indexes
        medical_indexes = [
            # Text search
            ([("text", TEXT), ("keyword", TEXT)], {"name": "medical_text_compound"}),
            # Field indexes
            ([("patent_id", ASCENDING)], {"name": "patent_idx", "sparse": True}),
            ([("category", ASCENDING)], {"name": "category_idx"}),
            ([("source_dataset", ASCENDING)], {"name": "medical_source_idx"})
        ]
        await self._create_indexes_safe("medical_kidney", medical_indexes)

        # Guidelines indexes
        guidelines_indexes = [
            # Text search
            ([("text", TEXT), ("keyword", TEXT)], {"name": "guidelines_text_compound"}),
            # Field indexes
            ([("category", ASCENDING)], {"name": "guidelines_category_idx"}),
            ([("source_dataset", ASCENDING)], {"name": "guidelines_source_idx"})
        ]
        await self._create_indexes_safe("guidelines_kidney", guidelines_indexes)

    async def _create_indexes_safe(self, collection_name: str, indexes: List):
        """Safely create indexes with error handling"""
        collection = self.db[collection_name]

        for index_spec, index_options in indexes:
            try:
                await collection.create_index(index_spec, **index_options)
                logger.info(f"✅ Created index {index_options['name']} on {collection_name}")
            except Exception as e:
                if "already exists" not in str(e).lower():
                    logger.warning(f"⚠️ Index creation failed for {collection_name}.{index_options['name']}: {e}")

    # ==================== Optimized Search Methods ====================

    async def search_qa(self, query: str, limit: int = 10) -> List[Dict]:
        """Optimized QA search with minimal projection"""
        start_time = time.time()

        # Use minimal projection - only necessary fields
        projection = {
            "score": {"$meta": "textScore"},
            "question": 1,
            "answer": 1,
            "source_dataset": 1,
            "_id": 1
        }

        # Use cursor.to_list() for better performance
        cursor = self.db.qa_kidney.find(
            {"$text": {"$search": query}},
            projection
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)

        results = await cursor.to_list(length=limit)

        elapsed = time.time() - start_time
        logger.debug(f"QA search completed in {elapsed:.3f}s ({len(results)} results)")

        return results

    async def search_papers(self, query: str, limit: int = 10) -> List[Dict]:
        """Optimized paper search with selective projection"""
        start_time = time.time()

        # Only include necessary fields
        projection = {
            "score": {"$meta": "textScore"},
            "title": 1,
            "abstract": {"$substr": ["$abstract", 0, 1000]},  # Limit abstract length
            "source": 1,
            "metadata.doi": 1,
            "metadata.journal": 1,
            "metadata.publication_date": 1,
            "metadata.pmid": 1,
            "metadata.authors": {"$slice": 3},  # Only first 3 authors
            "_id": 1
        }

        # Optimized query with hint for index usage
        cursor = self.db.papers_kidney.find(
            {"$text": {"$search": query}},
            projection
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)

        results = await cursor.to_list(length=limit)

        elapsed = time.time() - start_time
        logger.debug(f"Paper search completed in {elapsed:.3f}s ({len(results)} results)")

        return results

    async def search_medical(self, query: str, limit: int = 10) -> List[Dict]:
        """Optimized medical data search"""
        start_time = time.time()

        projection = {
            "score": {"$meta": "textScore"},
            "text": 1,  # Get full text, truncate in Python to handle UTF-8 properly
            "keyword": 1,
            "patent_id": 1,
            "category": 1,
            "_id": 1
        }

        cursor = self.db.medical_kidney.find(
            {"$text": {"$search": query}},
            projection
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)

        results = await cursor.to_list(length=limit)

        # Truncate text in Python to handle multi-byte UTF-8 characters properly
        for result in results:
            if "text" in result and len(result["text"]) > 1000:
                result["text"] = result["text"][:1000] + "..."

        elapsed = time.time() - start_time
        logger.debug(f"Medical search completed in {elapsed:.3f}s ({len(results)} results)")

        return results

    async def search_guidelines(self, query: str, limit: int = 10) -> List[Dict]:
        """Optimized guidelines search"""
        start_time = time.time()

        projection = {
            "score": {"$meta": "textScore"},
            "text": 1,  # Get full text, truncate in Python to handle UTF-8 properly
            "keyword": 1,
            "category": 1,
            "source_dataset": 1,
            "_id": 1
        }

        cursor = self.db.guidelines_kidney.find(
            {"$text": {"$search": query}},
            projection
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)

        results = await cursor.to_list(length=limit)

        # Truncate text in Python to handle multi-byte UTF-8 characters properly
        for result in results:
            if "text" in result and len(result["text"]) > 1000:
                result["text"] = result["text"][:1000] + "..."

        elapsed = time.time() - start_time
        logger.debug(f"Guidelines search completed in {elapsed:.3f}s ({len(results)} results)")

        return results

    # ==================== Parallel Search Methods ====================

    async def parallel_search_all(
        self,
        query: str,
        limit_per_collection: int = 10
    ) -> Dict[str, List[Dict]]:
        """Search all collections in parallel"""
        start_time = time.time()

        # Execute all searches in parallel
        tasks = [
            self.search_qa(query, limit_per_collection),
            self.search_papers(query, limit_per_collection),
            self.search_medical(query, limit_per_collection),
            self.search_guidelines(query, limit_per_collection)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        output = {}
        collection_names = ["qa", "papers", "medical", "guidelines"]

        for name, result in zip(collection_names, results):
            if isinstance(result, Exception):
                logger.error(f"Error searching {name}: {result}")
                output[name] = []
            else:
                output[name] = result

        elapsed = time.time() - start_time
        total_results = sum(len(r) for r in output.values())

        logger.info(f"Parallel search completed in {elapsed:.2f}s ({total_results} total results)")

        return output

    # ==================== Batch Operations with Better Performance ====================

    async def insert_papers_batch_optimized(
        self,
        papers: List[Dict],
        batch_size: int = 500
    ) -> Dict:
        """Optimized batch paper insertion"""
        inserted = []
        skipped = []

        # Process in batches for better memory usage
        for i in range(0, len(papers), batch_size):
            batch = papers[i:i + batch_size]
            operations = []

            for paper in batch:
                doi = paper.get("metadata", {}).get("doi")
                if not doi or doi.strip() == "":
                    skipped.append({
                        "title": paper.get("title", "Unknown"),
                        "reason": "Missing DOI"
                    })
                    continue

                # Use upsert for efficiency
                operations.append(
                    UpdateOne(
                        {"doi": doi},
                        {"$set": paper},
                        upsert=True
                    )
                )

            if operations:
                try:
                    result = await self.db.papers_kidney.bulk_write(
                        operations,
                        ordered=False  # Continue on error
                    )
                    inserted.extend([op._doc["$set"].get("title", "Unknown") for op in operations])
                except Exception as e:
                    logger.error(f"Batch insertion error: {e}")

        logger.info(f"✅ Papers inserted: {len(inserted)} success, {len(skipped)} skipped")

        return {
            "inserted": inserted,
            "skipped": skipped
        }

    # ==================== Aggregation Pipeline for Complex Queries ====================

    async def advanced_search_papers(
        self,
        query: str,
        filters: Dict = None,
        limit: int = 10
    ) -> List[Dict]:
        """Advanced paper search using aggregation pipeline"""
        pipeline = []

        # Text search stage
        if query:
            pipeline.append({
                "$match": {
                    "$text": {"$search": query}
                }
            })
            pipeline.append({
                "$addFields": {
                    "score": {"$meta": "textScore"}
                }
            })

        # Apply additional filters
        if filters:
            match_stage = {}

            if "journal" in filters:
                match_stage["metadata.journal"] = filters["journal"]

            if "year_min" in filters:
                match_stage["metadata.publication_date"] = {
                    "$gte": f"{filters['year_min']}-01-01"
                }

            if "year_max" in filters:
                match_stage["metadata.publication_date"] = {
                    "$lte": f"{filters['year_max']}-12-31"
                }

            if match_stage:
                pipeline.append({"$match": match_stage})

        # Project only necessary fields
        pipeline.append({
            "$project": {
                "title": 1,
                "abstract": {"$substr": ["$abstract", 0, 500]},
                "metadata": {
                    "doi": 1,
                    "journal": 1,
                    "publication_date": 1,
                    "authors": {"$slice": ["$metadata.authors", 3]}
                },
                "score": 1
            }
        })

        # Sort by score or date
        if query:
            pipeline.append({"$sort": {"score": -1}})
        else:
            pipeline.append({"$sort": {"metadata.publication_date": -1}})

        # Limit results
        pipeline.append({"$limit": limit})

        # Execute pipeline
        cursor = self.db.papers_kidney.aggregate(pipeline)
        results = await cursor.to_list(length=limit)

        return results

    # ==================== Statistics with Caching ====================

    async def get_stats(self, use_cache: bool = True) -> Dict:
        """Get database statistics with caching"""

        # Check cache
        if use_cache and self._cache_timestamp > 0:
            if time.time() - self._cache_timestamp < self._cache_ttl:
                return self._collection_stats_cache

        # Get fresh stats
        tasks = [
            self.db.qa_kidney.estimated_document_count(),
            self.db.papers_kidney.estimated_document_count(),
            self.db.medical_kidney.estimated_document_count(),
            self.db.guidelines_kidney.estimated_document_count()
        ]

        counts = await asyncio.gather(*tasks)

        stats = {
            "qa_kidney": counts[0],
            "papers_kidney": counts[1],
            "medical_kidney": counts[2],
            "guidelines_kidney": counts[3],
            "total": sum(counts)
        }

        # Update cache
        self._collection_stats_cache = stats
        self._cache_timestamp = time.time()

        return stats

    # ==================== Index Statistics ====================

    async def get_index_stats(self) -> Dict:
        """Get index usage statistics"""
        collections = ["qa_kidney", "papers_kidney", "medical_kidney", "guidelines_kidney"]
        stats = {}

        for coll_name in collections:
            collection = self.db[coll_name]
            indexes = await collection.index_information()

            # Get index sizes (requires admin privileges)
            try:
                coll_stats = await self.db.command("collStats", coll_name, indexDetails=True)
                index_sizes = coll_stats.get("indexSizes", {})
            except Exception as e:
                # 관리자 권한 필요, 인덱스 크기 정보 건너뛰기 (Admin privileges required, skip index sizes)
                logger.warning(f"Failed to get index sizes for {coll_name}: {e}")
                index_sizes = {}

            stats[coll_name] = {
                "count": len(indexes),
                "indexes": list(indexes.keys()),
                "sizes": index_sizes
            }

        return stats


# Backward compatibility
class MongoDBManager(OptimizedMongoDBManager):
    """Backward compatible wrapper"""
    pass


# ==================== Test Functions ====================
async def test_projection_optimization():
    """Test projection optimization impact"""
    import time

    print("\n" + "="*80)
    print("PROJECTION OPTIMIZATION TEST")
    print("="*80)

    manager = OptimizedMongoDBManager()
    await manager.connect()

    query = "chronic kidney disease"

    # Test 1: Full document retrieval (baseline)
    print("\n[WITHOUT PROJECTION OPTIMIZATION]")
    start = time.time()

    # Simulate unoptimized query
    cursor = manager.db.papers_kidney.find(
        {"$text": {"$search": query}},
        {}  # No projection - returns all fields
    ).limit(50)

    full_results = await cursor.to_list(length=50)
    time_full = time.time() - start

    # Calculate data size
    import sys
    full_size = sum(sys.getsizeof(str(doc)) for doc in full_results)

    print(f"Time: {time_full:.3f}s")
    print(f"Data transferred: {full_size / 1024:.1f} KB")

    # Test 2: Optimized projection
    print("\n[WITH PROJECTION OPTIMIZATION]")
    start = time.time()
    optimized_results = await manager.search_papers(query, limit=50)
    time_optimized = time.time() - start

    optimized_size = sum(sys.getsizeof(str(doc)) for doc in optimized_results)

    print(f"Time: {time_optimized:.3f}s")
    print(f"Data transferred: {optimized_size / 1024:.1f} KB")

    # Show improvement
    print(f"\n🚀 Performance Improvement:")
    print(f"   Time: {time_full/time_optimized:.2f}x faster")
    print(f"   Data: {full_size/optimized_size:.2f}x less data transferred")

    await manager.close()


async def test_parallel_search():
    """Test parallel search performance"""
    import time

    print("\n" + "="*80)
    print("PARALLEL SEARCH TEST")
    print("="*80)

    manager = OptimizedMongoDBManager()
    await manager.connect()

    query = "diabetes treatment"

    # Test 1: Sequential search
    print("\n[SEQUENTIAL SEARCH]")
    start = time.time()

    qa_results = await manager.search_qa(query)
    paper_results = await manager.search_papers(query)
    medical_results = await manager.search_medical(query)
    guidelines_results = await manager.search_guidelines(query)

    time_sequential = time.time() - start
    total_sequential = len(qa_results) + len(paper_results) + len(medical_results) + len(guidelines_results)

    print(f"Time: {time_sequential:.3f}s")
    print(f"Total results: {total_sequential}")

    # Test 2: Parallel search
    print("\n[PARALLEL SEARCH]")
    start = time.time()

    parallel_results = await manager.parallel_search_all(query)

    time_parallel = time.time() - start
    total_parallel = sum(len(r) for r in parallel_results.values())

    print(f"Time: {time_parallel:.3f}s")
    print(f"Total results: {total_parallel}")

    # Show improvement
    speedup = time_sequential / time_parallel
    print(f"\n🚀 Speedup: {speedup:.2f}x faster with parallel search")

    await manager.close()


async def test_index_performance():
    """Test index usage and performance"""
    print("\n" + "="*80)
    print("INDEX PERFORMANCE TEST")
    print("="*80)

    manager = OptimizedMongoDBManager()
    await manager.connect()

    # Get index statistics
    index_stats = await manager.get_index_stats()

    print("\n[INDEX STATISTICS]")
    for collection, stats in index_stats.items():
        print(f"\n{collection}:")
        print(f"  Total indexes: {stats['count']}")
        print(f"  Index names: {', '.join(stats['indexes'][:5])}")
        if stats['sizes']:
            total_size = sum(stats['sizes'].values())
            print(f"  Total index size: {total_size / (1024*1024):.1f} MB")

    # Test query performance with different indexes
    queries = [
        "chronic kidney disease",
        "diabetes",
        "hypertension"
    ]

    print("\n[QUERY PERFORMANCE]")
    for query in queries:
        start = time.time()
        results = await manager.search_papers(query, limit=20)
        elapsed = time.time() - start
        print(f"Query '{query}': {elapsed:.3f}s ({len(results)} results)")

    await manager.close()


async def main():
    """Run all optimization tests"""
    await test_projection_optimization()
    await test_parallel_search()
    await test_index_performance()


if __name__ == "__main__":
    asyncio.run(main())