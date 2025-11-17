import asyncio
import time
import logging
from typing import List, Dict, Optional, Tuple
from functools import lru_cache
import hashlib
from dotenv import load_dotenv
import os

from app.db.mongodb_manager import MongoDBManager as OptimizedMongoDBManager
from app.db.vector_manager import OptimizedVectorDBManager
from app.services.pubmed_search import OptimizedPubMedSearch

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OptimizedHybridSearchEngine:
    """Optimized Hybrid Search Engine with parallel queries and caching"""

    def __init__(
        self,
        use_cache: bool = True,
        cache_ttl: int = 3600,
        use_query_embedding_cache: bool = True
    ):
        """
        Initialize optimized search engine

        Args:
            use_cache: Enable result caching
            cache_ttl: Cache time-to-live in seconds
            use_query_embedding_cache: Cache query embeddings
        """
        self.mongo = OptimizedMongoDBManager()
        self.vector_db = OptimizedVectorDBManager(
            use_cache=use_query_embedding_cache,
            batch_size=32
        )
        self.pubmed = OptimizedPubMedSearch(
            email=os.getenv("PUBMED_EMAIL"),
            api_key=os.getenv("NCBI_API_KEY")
        )

        self.initialized = False
        self.use_cache = use_cache
        self.cache_ttl = cache_ttl

        # Result cache (query -> results)
        self._result_cache: Dict[str, Tuple[Dict, float]] = {}

        # Query embedding cache (shared across all namespaces)
        self._query_embedding_cache: Dict[str, List[float]] = {}

    async def initialize(self):
        """Initialize connections"""
        if not self.initialized:
            await asyncio.gather(
                self.mongo.connect(),
                self.vector_db.create_index()
            )
            self.initialized = True
            logger.info("✅ Optimized hybrid search engine initialized")

    async def close(self):
        """Close connections"""
        await self.mongo.close()
        self.vector_db.close()
        self.pubmed.close()

    def _get_cache_key(self, query: str, params: Dict) -> str:
        """Generate cache key from query and parameters"""
        params_str = str(sorted(params.items()))
        return hashlib.md5(f"{query}:{params_str}".encode()).hexdigest()

    def _get_cached_result(self, cache_key: str) -> Optional[Dict]:
        """Get cached result if still valid"""
        if not self.use_cache:
            return None

        if cache_key in self._result_cache:
            result, timestamp = self._result_cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                logger.info(f"Cache hit for key: {cache_key}")
                return result
            else:
                # Expired
                del self._result_cache[cache_key]

        return None

    def _cache_result(self, cache_key: str, result: Dict):
        """Store result in cache"""
        if self.use_cache:
            self._result_cache[cache_key] = (result, time.time())
            # Limit cache size
            if len(self._result_cache) > 100:
                # Remove oldest entries
                sorted_items = sorted(
                    self._result_cache.items(),
                    key=lambda x: x[1][1]
                )
                for key, _ in sorted_items[:20]:
                    del self._result_cache[key]

    @lru_cache(maxsize=100)
    async def _get_query_embedding(self, query: str) -> List[float]:
        """Get query embedding with caching (shared across namespaces)"""
        if query not in self._query_embedding_cache:
            self._query_embedding_cache[query] = (
                self.vector_db.generate_embedding_single_cached(query)
            )
        return self._query_embedding_cache[query]

    async def search_all_sources(
        self,
        query: str,
        max_per_source: int = 5,
        use_semantic: bool = True,
        use_guidelines: bool = True,
        use_qa: bool = True,
        use_papers: bool = True,
        use_medical: bool = True,
        use_pubmed: bool = True,
        max_guidelines: Optional[int] = None,
        max_qa: Optional[int] = None,
        max_papers: Optional[int] = None,
        max_medical: Optional[int] = None,
        max_pubmed: Optional[int] = None
    ) -> Dict:
        """
        Optimized unified search across all sources with per-source limits

        Args:
            query: Search query
            max_per_source: Default maximum results per source (fallback)
            use_semantic: Use semantic search (hybrid)
            use_guidelines: Search guidelines database
            use_qa: Search QA database
            use_papers: Search papers database
            use_medical: Search medical data database
            use_pubmed: Search PubMed API
            max_guidelines: Maximum guidelines results (overrides max_per_source)
            max_qa: Maximum QA results (overrides max_per_source)
            max_papers: Maximum papers results (overrides max_per_source)
            max_medical: Maximum medical results (overrides max_per_source)
            max_pubmed: Maximum PubMed results (overrides max_per_source)

        Returns:
            Dictionary with search results from all sources
        """
        # Use per-source limits or fall back to max_per_source
        actual_max_guidelines = max_guidelines if max_guidelines is not None else max_per_source
        actual_max_qa = max_qa if max_qa is not None else max_per_source
        actual_max_papers = max_papers if max_papers is not None else max_per_source
        actual_max_medical = max_medical if max_medical is not None else max_per_source
        actual_max_pubmed = max_pubmed if max_pubmed is not None else max_per_source

        # Check cache (include per-source limits in cache key)
        cache_key = self._get_cache_key(query, {
            "use_semantic": use_semantic,
            "use_guidelines": use_guidelines,
            "use_qa": use_qa,
            "use_papers": use_papers,
            "use_medical": use_medical,
            "use_pubmed": use_pubmed,
            "max_guidelines": actual_max_guidelines,
            "max_qa": actual_max_qa,
            "max_papers": actual_max_papers,
            "max_medical": actual_max_medical,
            "max_pubmed": actual_max_pubmed
        })

        cached_result = self._get_cached_result(cache_key)
        if cached_result:
            return cached_result

        await self.initialize()

        start_time = time.time()

        # Log source selection with per-source limits
        enabled_sources = []
        if use_guidelines: enabled_sources.append(f"Guidelines({actual_max_guidelines})")
        if use_qa: enabled_sources.append(f"QA({actual_max_qa})")
        if use_papers: enabled_sources.append(f"Papers({actual_max_papers})")
        if use_medical: enabled_sources.append(f"Medical({actual_max_medical})")
        if use_pubmed: enabled_sources.append(f"PubMed({actual_max_pubmed})")
        logger.info(f"🔍 Searching sources: {', '.join(enabled_sources)}")

        # Pre-generate query embedding once (shared across all semantic searches)
        if use_semantic:
            query_embedding = await self._get_query_embedding(query)
        else:
            query_embedding = None

        # Create search tasks conditionally with per-source limits
        tasks = []

        # Guidelines search (conditional)
        if use_guidelines:
            if use_semantic:
                tasks.append(self._parallel_hybrid_search(
                    query, query_embedding, "guidelines_kidney", actual_max_guidelines
                ))
            else:
                tasks.append(self.mongo.search_guidelines(query, limit=actual_max_guidelines))
        else:
            tasks.append(self._dummy_task())  # Empty result

        # QA search (conditional)
        if use_qa:
            if use_semantic:
                tasks.append(self._parallel_hybrid_search(
                    query, query_embedding, "qa_kidney", actual_max_qa
                ))
            else:
                tasks.append(self.mongo.search_qa(query, limit=actual_max_qa))
        else:
            tasks.append(self._dummy_task())  # Empty result

        # Paper search (conditional)
        if use_papers:
            if use_semantic:
                tasks.append(self._parallel_hybrid_search(
                    query, query_embedding, "papers_kidney", actual_max_papers
                ))
            else:
                tasks.append(self.mongo.search_papers(query, limit=actual_max_papers))
        else:
            tasks.append(self._dummy_task())

        # Medical search (conditional)
        if use_medical:
            if use_semantic:
                tasks.append(self._parallel_hybrid_search(
                    query, query_embedding, "medical_kidney", actual_max_medical
                ))
            else:
                tasks.append(self.mongo.search_medical(query, limit=actual_max_medical))
        else:
            tasks.append(self._dummy_task())

        # PubMed search (conditional)
        if use_pubmed:
            tasks.append(self.pubmed.search_papers(query, max_results=actual_max_pubmed))
        else:
            tasks.append(self._dummy_task())

        # Execute all searches in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle any exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Search task {i} failed: {result}")
                processed_results.append([])
            else:
                processed_results.append(result)

        elapsed = time.time() - start_time

        final_result = {
            "guidelines_results": processed_results[0],
            "qa_results": processed_results[1],
            "paper_results": processed_results[2],
            "medical_results": processed_results[3],
            "pubmed_results": processed_results[4] if use_pubmed else [],
            "search_method": "hybrid_optimized" if use_semantic else "keyword",
            "search_time": elapsed
        }

        # Cache the result
        self._cache_result(cache_key, final_result)

        logger.info(f"Search completed in {elapsed:.2f}s")
        return final_result

    async def _parallel_hybrid_search(
        self,
        query: str,
        query_embedding: Optional[List[float]],
        namespace: str,
        limit: int
    ) -> List[Dict]:
        """
        Perform MongoDB and Pinecone searches in parallel for a namespace

        Args:
            query: Search query
            query_embedding: Pre-computed query embedding
            namespace: Search namespace
            limit: Maximum results

        Returns:
            Merged and ranked results
        """
        # Determine MongoDB collection
        if namespace == "qa_kidney":
            mongo_search = self.mongo.search_qa(query, limit=limit * 2)
        elif namespace == "papers_kidney":
            mongo_search = self.mongo.search_papers(query, limit=limit * 2)
        elif namespace == "medical_kidney":
            mongo_search = self.mongo.search_medical(query, limit=limit * 2)
        else:
            mongo_search = self._dummy_task()

        # Pinecone search (use pre-computed embedding)
        if query_embedding:
            pinecone_search = self._semantic_search_with_embedding(
                query_embedding, namespace, limit * 2
            )
        else:
            pinecone_search = self.vector_db.semantic_search(
                query, top_k=limit * 2, namespace=namespace
            )

        # Execute both searches in parallel
        keyword_results, semantic_matches = await asyncio.gather(
            mongo_search,
            pinecone_search
        )

        # Merge results with improved scoring
        merged = self._optimized_merge_results(
            keyword_results,
            semantic_matches,
            limit
        )

        return merged

    async def _semantic_search_with_embedding(
        self,
        query_embedding: List[float],
        namespace: str,
        top_k: int
    ) -> List[Dict]:
        """Semantic search using pre-computed embedding"""
        # Direct Pinecone query with the embedding
        results = self.vector_db.index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True
        )

        # Format results
        matches = []
        for match in results.matches:
            result = {
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata
            }
            if "chunk_text" in match.metadata:
                result["chunk_text"] = match.metadata.get("chunk_text", "")
                result["chunk_index"] = match.metadata.get("chunk_index", 0)
            matches.append(result)

        return matches

    def _optimized_merge_results(
        self,
        keyword_results: List[Dict],
        semantic_matches: List[Dict],
        limit: int
    ) -> List[Dict]:
        """
        Optimized result merging with improved scoring

        Strategy:
        1. Normalize scores to [0, 1] range
        2. Combine with adaptive weighting
        3. Boost documents found in both searches
        4. Return top results
        """
        merged_dict = {}

        # Process keyword results
        if keyword_results:
            max_keyword_score = max(
                [r.get("score", 0) for r in keyword_results],
                default=1.0
            )

            for r in keyword_results:
                doc_id = str(r.get("_id", ""))
                if not doc_id:
                    continue

                normalized_score = (
                    r.get("score", 0) / max_keyword_score
                    if max_keyword_score > 0 else 0
                )

                merged_dict[doc_id] = {
                    "data": r,
                    "keyword_score": normalized_score,
                    "semantic_score": 0.0,
                    "found_in_both": False
                }

        # Process semantic results
        for match in semantic_matches:
            # Handle both full doc IDs and chunk IDs
            doc_id = match["id"]
            # If it's a chunk ID, extract the base document ID
            if "_chunk_" in doc_id:
                base_doc_id = doc_id.split("_chunk_")[0]
            else:
                base_doc_id = doc_id

            semantic_score = match["score"]

            if base_doc_id in merged_dict:
                # Document found in both searches - boost score
                merged_dict[base_doc_id]["semantic_score"] = semantic_score
                merged_dict[base_doc_id]["found_in_both"] = True
            else:
                # New document from semantic search only
                merged_dict[base_doc_id] = {
                    "data": match["metadata"],
                    "keyword_score": 0.0,
                    "semantic_score": semantic_score,
                    "found_in_both": False
                }

                # Add chunk information if available
                if "chunk_text" in match:
                    merged_dict[base_doc_id]["data"]["chunk_text"] = match["chunk_text"]
                    merged_dict[base_doc_id]["data"]["chunk_index"] = match.get("chunk_index", 0)

        # Calculate final scores with adaptive weighting
        for doc_id, info in merged_dict.items():
            if info["found_in_both"]:
                # Boost documents found in both searches
                info["final_score"] = (
                    info["keyword_score"] * 0.3 +
                    info["semantic_score"] * 0.5 +
                    0.2  # Intersection bonus
                )
            else:
                # Standard weighted average
                info["final_score"] = (
                    info["keyword_score"] * 0.4 +
                    info["semantic_score"] * 0.6
                )

        # Sort by final score
        sorted_results = sorted(
            merged_dict.values(),
            key=lambda x: x["final_score"],
            reverse=True
        )

        return [r["data"] for r in sorted_results[:limit]]

    async def _dummy_task(self):
        """Dummy task for optional searches"""
        return []

    async def batch_search(
        self,
        queries: List[str],
        max_per_source: int = 5,
        use_semantic: bool = True
    ) -> Dict[str, Dict]:
        """
        Perform multiple searches in parallel

        Args:
            queries: List of search queries
            max_per_source: Max results per source
            use_semantic: Use semantic search

        Returns:
            Dictionary mapping query to results
        """
        tasks = []
        for query in queries:
            tasks.append(self.search_all_sources(
                query,
                max_per_source=max_per_source,
                use_semantic=use_semantic,
                use_pubmed=False  # Skip PubMed for batch to avoid rate limits
            ))

        results = await asyncio.gather(*tasks)

        return {query: result for query, result in zip(queries, results)}

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        stats = {
            "result_cache_size": len(self._result_cache),
            "query_embedding_cache_size": len(self._query_embedding_cache),
            "vector_db_cache": self.vector_db.get_cache_stats()
        }
        return stats

    def clear_caches(self):
        """Clear all caches"""
        self._result_cache.clear()
        self._query_embedding_cache.clear()
        self.vector_db.clear_cache()
        logger.info("All caches cleared")


# Backward compatibility
class HybridSearchEngine(OptimizedHybridSearchEngine):
    """Backward compatible wrapper"""
    pass


# ==================== Test Functions ====================
async def test_optimization_performance():
    """Test the performance improvements"""
    print("\n" + "="*80)
    print("PERFORMANCE TEST: Optimized Hybrid Search")
    print("="*80)

    engine = OptimizedHybridSearchEngine(use_cache=True)

    # Test 1: Single query performance
    print("\n[TEST 1] Single query with all sources...")
    query = "chronic kidney disease treatment"

    start = time.time()
    results = await engine.search_all_sources(
        query,
        max_per_source=10,
        use_semantic=True,
        use_pubmed=False  # Skip PubMed for speed test
    )
    elapsed = time.time() - start

    total_results = sum([
        len(results['qa_results']),
        len(results['paper_results']),
        len(results['medical_results'])
    ])

    print(f"✅ Found {total_results} results in {elapsed:.2f}s")
    print(f"   - QA: {len(results['qa_results'])} results")
    print(f"   - Papers: {len(results['paper_results'])} results")
    print(f"   - Medical: {len(results['medical_results'])} results")

    # Test 2: Cached query performance
    print("\n[TEST 2] Same query with caching...")
    start = time.time()
    cached_results = await engine.search_all_sources(
        query,
        max_per_source=10,
        use_semantic=True,
        use_pubmed=False
    )
    cached_elapsed = time.time() - start

    print(f"✅ Cache hit: {cached_elapsed:.3f}s (speedup: {elapsed/cached_elapsed:.1f}x)")

    # Test 3: Multiple queries in parallel
    print("\n[TEST 3] Batch search (5 queries in parallel)...")
    queries = [
        "diabetes mellitus",
        "hypertension management",
        "kidney transplantation",
        "dialysis complications",
        "proteinuria treatment"
    ]

    start = time.time()
    batch_results = await engine.batch_search(queries, max_per_source=5)
    batch_elapsed = time.time() - start

    total_batch_results = sum(
        sum([
            len(r['qa_results']),
            len(r['paper_results']),
            len(r['medical_results'])
        ])
        for r in batch_results.values()
    )

    print(f"✅ Processed {len(queries)} queries in {batch_elapsed:.2f}s")
    print(f"   Total results: {total_batch_results}")
    print(f"   Average time per query: {batch_elapsed/len(queries):.2f}s")

    # Show cache statistics
    print("\n[CACHE STATISTICS]")
    cache_stats = engine.get_cache_stats()
    for key, value in cache_stats.items():
        if isinstance(value, dict):
            print(f"{key}:")
            for k, v in value.items():
                print(f"  {k}: {v}")
        else:
            print(f"{key}: {value}")

    print("\n" + "="*80)
    print("EXPECTED IMPROVEMENTS:")
    print("- Original: 15-20s per complex query")
    print("- Optimized: 2-5s per complex query (3-7x faster)")
    print("- Cached: <0.1s (100x faster)")
    print("- Parallel DB queries: ~50% reduction in latency")
    print("="*80)

    await engine.close()


async def test_search_quality():
    """Test search result quality"""
    print("\n" + "="*80)
    print("SEARCH QUALITY TEST")
    print("="*80)

    engine = OptimizedHybridSearchEngine()

    query = "chronic kidney disease stage 3 treatment guidelines"

    print(f"\n🔍 Testing query: '{query}'")

    results = await engine.search_all_sources(
        query,
        max_per_source=3,
        use_semantic=True,
        use_pubmed=False
    )

    # Display top results from each source
    print("\n📝 TOP QA RESULTS:")
    for i, qa in enumerate(results['qa_results'][:2], 1):
        print(f"{i}. Q: {qa.get('question', 'N/A')[:100]}...")

    print("\n📄 TOP PAPER RESULTS:")
    for i, paper in enumerate(results['paper_results'][:2], 1):
        print(f"{i}. {paper.get('title', 'N/A')[:100]}...")

    print("\n🏥 TOP MEDICAL RESULTS:")
    for i, med in enumerate(results['medical_results'][:2], 1):
        text = med.get('text', 'N/A')
        print(f"{i}. {text[:100]}...")

    print(f"\n⏱️ Search time: {results['search_time']:.2f}s")

    await engine.close()


async def main():
    """Run all tests"""
    await test_optimization_performance()
    await test_search_quality()


if __name__ == "__main__":
    asyncio.run(main())