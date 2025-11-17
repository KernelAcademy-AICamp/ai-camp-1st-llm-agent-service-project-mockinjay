"""
Redis-based Cache Manager for Healthcare Chat System

This module provides a comprehensive caching solution with:
- Query result caching
- Embedding caching
- PubMed response caching
- LLM response caching
- Automatic cache warming
- TTL management
- Cache statistics
"""

import redis.asyncio as redis
import json
import hashlib
import pickle
import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Union, Tuple
from functools import wraps
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CacheManager:
    """Centralized cache manager using Redis for all caching needs"""

    def __init__(
        self,
        redis_url: str = None,
        default_ttl: int = 3600,
        embedding_ttl: int = 86400,
        pubmed_ttl: int = 21600,
        llm_ttl: int = 7200
    ):
        """
        Initialize Redis cache manager

        Args:
            redis_url: Redis connection URL
            default_ttl: Default TTL in seconds (1 hour)
            embedding_ttl: TTL for embeddings (24 hours)
            pubmed_ttl: TTL for PubMed results (6 hours)
            llm_ttl: TTL for LLM responses (2 hours)
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.client: Optional[redis.Redis] = None

        # TTL configurations
        self.ttls = {
            "default": default_ttl,
            "embedding": embedding_ttl,
            "pubmed": pubmed_ttl,
            "llm": llm_ttl,
            "query": default_ttl,
            "search": default_ttl
        }

        # Statistics
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "errors": 0
        }

    async def connect(self):
        """Connect to Redis"""
        if not self.client:
            try:
                # Python 3.13 호환: socket_keepalive_options 제거
                self.client = await redis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=False  # We'll handle encoding/decoding
                )
                # Test connection
                await self.client.ping()
                logger.info(f"✅ Redis connected: {self.redis_url}")
            except Exception as e:
                logger.error(f"❌ Redis connection failed: {e}")
                self.client = None
                raise

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.client:
            await self.client.close()
            logger.info("Redis disconnected")

    def _get_cache_key(self, namespace: str, key: str) -> str:
        """Generate namespaced cache key"""
        # Create hash for long keys
        if len(key) > 200:
            key = hashlib.md5(key.encode()).hexdigest()
        return f"{namespace}:{key}"

    async def get(self, namespace: str, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.client:
            return None

        try:
            cache_key = self._get_cache_key(namespace, key)
            value = await self.client.get(cache_key)

            if value:
                self.stats["hits"] += 1
                # Deserialize based on namespace
                if namespace in ["embedding", "search", "query"]:
                    return pickle.loads(value)
                else:
                    return json.loads(value)
            else:
                self.stats["misses"] += 1
                return None

        except Exception as e:
            self.stats["errors"] += 1
            logger.warning(f"Cache get error: {e}")
            return None

    async def set(
        self,
        namespace: str,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache"""
        if not self.client:
            return False

        try:
            cache_key = self._get_cache_key(namespace, key)

            # Serialize based on namespace
            if namespace in ["embedding", "search", "query"]:
                serialized = pickle.dumps(value)
            else:
                serialized = json.dumps(value, ensure_ascii=False).encode()

            # Use namespace-specific TTL if not provided
            if ttl is None:
                ttl = self.ttls.get(namespace, self.ttls["default"])

            await self.client.setex(cache_key, ttl, serialized)
            self.stats["sets"] += 1
            return True

        except Exception as e:
            self.stats["errors"] += 1
            logger.warning(f"Cache set error: {e}")
            return False

    async def delete(self, namespace: str, key: str) -> bool:
        """Delete value from cache"""
        if not self.client:
            return False

        try:
            cache_key = self._get_cache_key(namespace, key)
            result = await self.client.delete(cache_key)
            return result > 0

        except Exception as e:
            logger.warning(f"Cache delete error: {e}")
            return False

    async def clear_namespace(self, namespace: str) -> int:
        """Clear all keys in a namespace"""
        if not self.client:
            return 0

        try:
            pattern = f"{namespace}:*"
            cursor = 0
            deleted = 0

            while True:
                cursor, keys = await self.client.scan(
                    cursor,
                    match=pattern,
                    count=100
                )
                if keys:
                    deleted += await self.client.delete(*keys)
                if cursor == 0:
                    break

            logger.info(f"Cleared {deleted} keys from namespace: {namespace}")
            return deleted

        except Exception as e:
            logger.error(f"Clear namespace error: {e}")
            return 0

    async def get_stats(self) -> Dict:
        """Get cache statistics"""
        stats = self.stats.copy()

        if self.client:
            try:
                info = await self.client.info("stats")
                stats.update({
                    "total_connections": info.get("total_connections_received", 0),
                    "connected_clients": info.get("connected_clients", 0),
                    "used_memory": info.get("used_memory_human", "N/A"),
                    "hit_rate": f"{(stats['hits'] / (stats['hits'] + stats['misses']) * 100):.2f}%"
                                if (stats['hits'] + stats['misses']) > 0 else "0%"
                })
            except:
                pass

        return stats

    # ==================== Specialized Cache Methods ====================

    async def cache_embedding(self, text: str, embedding: List[float]) -> bool:
        """Cache text embedding"""
        key = hashlib.md5(text.encode()).hexdigest()
        return await self.set("embedding", key, embedding)

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """Get cached embedding"""
        key = hashlib.md5(text.encode()).hexdigest()
        return await self.get("embedding", key)

    async def cache_search_results(
        self,
        query: str,
        source: str,
        results: List[Dict],
        ttl: Optional[int] = None
    ) -> bool:
        """Cache search results"""
        key = f"{source}:{hashlib.md5(query.encode()).hexdigest()}"
        return await self.set("search", key, results, ttl)

    async def get_search_results(
        self,
        query: str,
        source: str
    ) -> Optional[List[Dict]]:
        """Get cached search results"""
        key = f"{source}:{hashlib.md5(query.encode()).hexdigest()}"
        return await self.get("search", key)

    async def cache_pubmed_results(
        self,
        query: str,
        results: List[Dict]
    ) -> bool:
        """Cache PubMed search results"""
        return await self.cache_search_results(query, "pubmed", results)

    async def get_pubmed_results(self, query: str) -> Optional[List[Dict]]:
        """Get cached PubMed results"""
        return await self.get_search_results(query, "pubmed")

    async def cache_llm_response(
        self,
        query: str,
        context: str,
        response: str
    ) -> bool:
        """Cache LLM response"""
        # Create unique key from query and context
        key = hashlib.md5(f"{query}:{context[:500]}".encode()).hexdigest()
        data = {
            "query": query,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        return await self.set("llm", key, data)

    async def get_llm_response(
        self,
        query: str,
        context: str
    ) -> Optional[Dict]:
        """Get cached LLM response"""
        key = hashlib.md5(f"{query}:{context[:500]}".encode()).hexdigest()
        return await self.get("llm", key)

    # ==================== Cache Warming ====================

    async def warm_cache(self, common_queries: List[str] = None):
        """Warm cache with common queries"""
        if not common_queries:
            common_queries = [
                "chronic kidney disease",
                "diabetes treatment",
                "hypertension management",
                "kidney transplantation",
                "dialysis",
                "proteinuria",
                "CKD stage 3",
                "kidney function test",
                "renal failure",
                "nephrology guidelines"
            ]

        logger.info(f"Warming cache with {len(common_queries)} queries...")

        # This would typically trigger actual searches
        # Here we just demonstrate the pattern
        for query in common_queries:
            # In production, this would call actual search functions
            # and cache the results
            pass

        logger.info("Cache warming completed")

    # ==================== Decorators ====================

    def cache_result(
        self,
        namespace: str,
        ttl: Optional[int] = None,
        key_func: Optional[callable] = None
    ):
        """Decorator to cache function results"""

        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    # Default: use function name and arguments
                    key_parts = [func.__name__]
                    key_parts.extend(str(arg) for arg in args)
                    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                    cache_key = ":".join(key_parts)

                # Try to get from cache
                cached = await self.get(namespace, cache_key)
                if cached is not None:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return cached

                # Execute function
                result = await func(*args, **kwargs)

                # Cache result
                await self.set(namespace, cache_key, result, ttl)

                return result

            return wrapper
        return decorator


# ==================== Global Cache Instance ====================

_cache_instance: Optional[CacheManager] = None


async def get_cache() -> CacheManager:
    """Get or create global cache instance"""
    global _cache_instance

    if _cache_instance is None:
        _cache_instance = CacheManager()
        await _cache_instance.connect()

    return _cache_instance


# ==================== Test Functions ====================

async def test_cache_performance():
    """Test cache performance"""
    print("\n" + "="*80)
    print("CACHE PERFORMANCE TEST")
    print("="*80)

    cache = CacheManager()
    await cache.connect()

    # Test 1: Basic set/get
    print("\n[TEST 1] Basic operations...")
    test_data = {"key": "value", "list": [1, 2, 3], "nested": {"a": 1}}

    start = time.time()
    for i in range(100):
        await cache.set("test", f"key_{i}", test_data)
    set_time = time.time() - start

    start = time.time()
    for i in range(100):
        _ = await cache.get("test", f"key_{i}")
    get_time = time.time() - start

    print(f"Set 100 items: {set_time:.3f}s ({100/set_time:.0f} ops/sec)")
    print(f"Get 100 items: {get_time:.3f}s ({100/get_time:.0f} ops/sec)")

    # Test 2: Embedding cache
    print("\n[TEST 2] Embedding cache...")
    embedding = [0.1] * 384  # Typical embedding size

    start = time.time()
    for i in range(50):
        await cache.cache_embedding(f"text_{i}", embedding)
    embed_set_time = time.time() - start

    start = time.time()
    for i in range(50):
        _ = await cache.get_embedding(f"text_{i}")
    embed_get_time = time.time() - start

    print(f"Cache 50 embeddings: {embed_set_time:.3f}s")
    print(f"Retrieve 50 embeddings: {embed_get_time:.3f}s")

    # Test 3: Search results cache
    print("\n[TEST 3] Search results cache...")
    search_results = [
        {"title": f"Result {i}", "score": 0.9 - i*0.1}
        for i in range(10)
    ]

    await cache.cache_search_results("test query", "mongodb", search_results)
    cached_results = await cache.get_search_results("test query", "mongodb")

    print(f"Cached {len(search_results)} results")
    print(f"Retrieved {len(cached_results) if cached_results else 0} results")

    # Show statistics
    print("\n[CACHE STATISTICS]")
    stats = await cache.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Cleanup
    await cache.clear_namespace("test")
    await cache.disconnect()


async def test_cache_decorator():
    """Test cache decorator"""
    print("\n" + "="*80)
    print("CACHE DECORATOR TEST")
    print("="*80)

    cache = CacheManager()
    await cache.connect()

    # Create a test function with caching
    @cache.cache_result("test_func", ttl=60)
    async def expensive_operation(x: int, y: int) -> int:
        """Simulate expensive operation"""
        await asyncio.sleep(0.1)  # Simulate work
        return x + y

    # First call (cache miss)
    start = time.time()
    result1 = await expensive_operation(5, 10)
    time1 = time.time() - start
    print(f"First call: {result1} (took {time1:.3f}s)")

    # Second call (cache hit)
    start = time.time()
    result2 = await expensive_operation(5, 10)
    time2 = time.time() - start
    print(f"Second call: {result2} (took {time2:.3f}s)")

    speedup = time1 / time2
    print(f"🚀 Speedup: {speedup:.0f}x faster with cache")

    await cache.disconnect()


async def test_cache_warming():
    """Test cache warming"""
    print("\n" + "="*80)
    print("CACHE WARMING TEST")
    print("="*80)

    cache = CacheManager()
    await cache.connect()

    # Warm cache with common queries
    await cache.warm_cache()

    # Show cache contents
    stats = await cache.get_stats()
    print(f"Cache stats after warming:")
    print(f"  Sets: {stats['sets']}")
    print(f"  Hit rate: {stats['hit_rate']}")

    await cache.disconnect()


async def main():
    """Run all cache tests"""
    await test_cache_performance()
    await test_cache_decorator()
    await test_cache_warming()


if __name__ == "__main__":
    asyncio.run(main())