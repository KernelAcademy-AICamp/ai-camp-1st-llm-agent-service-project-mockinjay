"""
Hospital Data Manager - 병원/약국/투석 데이터 관리
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Optional, Tuple, Any
from enum import Enum
import re
import os
import hashlib
import json
from dotenv import load_dotenv
from pymongo import ASCENDING, TEXT, GEOSPHERE
import logging
import time
import asyncio
from bson import ObjectId


class SearchStatus(Enum):
    """Status indicators for search operations."""
    SUCCESS = "success"          # All search components succeeded
    PARTIAL = "partial"          # Some components failed, using fallback
    FAILED = "failed"            # Search completely failed

try:
    from app.db.vector_manager import OptimizedVectorDBManager
except ImportError:
    from vector_manager import OptimizedVectorDBManager

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HospitalManager:
    """병원/약국/투석 데이터를 관리하는 비동기 매니저"""

    # Standard projection for hospital documents - single source of truth
    # Used across all search methods to ensure consistent field selection
    HOSPITAL_PROJECTION = {
        "name": 1,
        "address": 1,
        "phone": 1,
        "region": 1,
        "type": 1,
        "dialysis_machines": 1,
        "has_dialysis_unit": 1,
        "night_dialysis": 1,
        "dialysis_days": 1,
        "lat": 1,
        "lng": 1,
        "naver_map_url": 1,
        "kakao_map_url": 1,
        "_id": 1
    }

    def __init__(
        self,
        uri: str = None,
        db_name: str = "careguide",
        max_pool_size: int = 100,
        min_pool_size: int = 10
    ):
        """
        Initialize Hospital Manager

        Args:
            uri: MongoDB connection URI
            db_name: Database name
            max_pool_size: Maximum connection pool size
            min_pool_size: Minimum connection pool size
        """
        self.uri = uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = db_name

        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.max_pool_size = max_pool_size
        self.min_pool_size = min_pool_size

        # Cache
        self._stats_cache = {}
        self._cache_timestamp = 0
        self._cache_ttl = 300  # 5 minutes

        # Hybrid search configuration
        self.enable_vector_search = True
        self.vector_namespace = "hospitals"
        self.vector_manager: Optional[OptimizedVectorDBManager] = None
        self._vector_ready = False
        self._vector_init_failed = False
        self.keyword_weight = 0.4
        self.semantic_weight = 0.6

        # Connection management
        self._connection_lock = asyncio.Lock()
        self._last_health_check = 0
        self._health_check_interval = 60  # Check every 60 seconds
        self._max_retries = 3
        self._retry_base_delay = 1.0  # Base delay for exponential backoff

        # Vector search metrics for monitoring
        self._vector_search_successes = 0
        self._vector_search_failures = 0

        # Query result cache for frequently used searches
        self._query_cache: Dict[str, Tuple[List[Dict], float]] = {}
        self._query_cache_ttl = 180  # 3 minutes (shorter than stats cache)
        self._query_cache_max_size = 500  # Max cached queries

    async def _ensure_connection(self):
        """Ensure MongoDB connection exists and is healthy with thread-safe locking."""
        async with self._connection_lock:
            # Quick check if we have a client
            if self.client is None or self.db is None:
                await self._connect_with_retry()
                return

            # Periodic health check (not on every call)
            now = time.time()
            if now - self._last_health_check > self._health_check_interval:
                try:
                    # Ping the database to verify connection is alive
                    await asyncio.wait_for(
                        self.db.command("ping"),
                        timeout=5.0
                    )
                    self._last_health_check = now
                except Exception as e:
                    logger.warning(f"Connection health check failed: {e}, reconnecting...")
                    await self._connect_with_retry()

    async def _connect_with_retry(self):
        """Connect to MongoDB with exponential backoff retry logic."""
        last_error = None

        for attempt in range(self._max_retries):
            try:
                # Close existing connection if any
                if self.client:
                    try:
                        self.client.close()
                    except Exception:
                        pass
                    self.client = None
                    self.db = None

                # Create new connection
                self.client = AsyncIOMotorClient(
                    self.uri,
                    maxPoolSize=self.max_pool_size,
                    minPoolSize=self.min_pool_size,
                    maxIdleTimeMS=30000,
                    waitQueueTimeoutMS=10000,
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=10000,
                    socketTimeoutMS=30000,
                    retryWrites=True,
                    retryReads=True
                )
                self.db = self.client[self.db_name]

                # Verify connection with ping
                await asyncio.wait_for(
                    self.db.command("ping"),
                    timeout=10.0
                )

                # Create indexes on successful connection
                await self.create_indexes()

                self._last_health_check = time.time()
                logger.info(f"✅ Hospital Manager connected: {self.db_name}")
                logger.info(f"   Pool size: {self.min_pool_size}-{self.max_pool_size}")
                return

            except Exception as e:
                last_error = e
                if attempt < self._max_retries - 1:
                    # Exponential backoff with jitter
                    delay = self._retry_base_delay * (2 ** attempt) + (asyncio.get_event_loop().time() % 0.5)
                    logger.warning(
                        f"MongoDB connection attempt {attempt + 1}/{self._max_retries} failed: {e}. "
                        f"Retrying in {delay:.1f}s..."
                    )
                    await asyncio.sleep(delay)

        # All retries failed
        logger.error(f"Failed to connect to MongoDB after {self._max_retries} attempts: {last_error}")
        raise ConnectionError(f"MongoDB connection failed after {self._max_retries} retries: {last_error}")

    async def _ensure_vector_manager(self) -> bool:
        """Initialize Pinecone vector manager if enabled."""
        if not self.enable_vector_search or self._vector_init_failed:
            return False

        if self.vector_manager is None:
            try:
                self.vector_manager = OptimizedVectorDBManager(use_cache=True)
            except Exception as e:
                logger.warning(f"Hospital vector manager init failed: {e}")
                self._vector_init_failed = True
                return False

        if not self._vector_ready:
            try:
                await self.vector_manager.create_index()
                self._vector_ready = True
            except Exception as e:
                logger.warning(f"Hospital vector index init failed: {e}")
                self._vector_init_failed = True
                self.vector_manager = None
                return False

        return True

    # ==================== Cache Methods ====================

    def _get_cache_key(self, method: str, **kwargs) -> str:
        """Generate cache key from method name and parameters."""
        # Sort kwargs for consistent key generation
        sorted_params = sorted(
            (k, v) for k, v in kwargs.items()
            if v is not None  # Exclude None values
        )
        param_str = json.dumps(sorted_params, ensure_ascii=False, default=str)
        key = f"{method}:{param_str}"
        return hashlib.md5(key.encode()).hexdigest()

    def _get_from_cache(self, cache_key: str) -> Optional[List[Dict]]:
        """Get results from cache if not expired."""
        if cache_key in self._query_cache:
            results, timestamp = self._query_cache[cache_key]
            if time.time() - timestamp < self._query_cache_ttl:
                logger.debug(f"Cache hit: {cache_key[:8]}...")
                return results
            else:
                # Expired, remove from cache
                del self._query_cache[cache_key]
        return None

    def _store_in_cache(self, cache_key: str, results: List[Dict]):
        """Store results in cache with LRU eviction."""
        # LRU eviction: remove oldest entries if cache is full
        if len(self._query_cache) >= self._query_cache_max_size:
            # Find and remove oldest entry
            oldest_key = min(
                self._query_cache.keys(),
                key=lambda k: self._query_cache[k][1]
            )
            del self._query_cache[oldest_key]
            logger.debug(f"Cache evicted: {oldest_key[:8]}...")

        self._query_cache[cache_key] = (results, time.time())

    def clear_cache(self):
        """Clear all cached query results."""
        self._query_cache.clear()
        logger.info("Query cache cleared")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        return {
            "size": len(self._query_cache),
            "max_size": self._query_cache_max_size,
            "ttl_seconds": self._query_cache_ttl,
            "usage_percent": len(self._query_cache) / self._query_cache_max_size * 100
        }

    async def connect(self):
        """Connect to MongoDB with optimized settings (public API for explicit connection)."""
        async with self._connection_lock:
            if not self.client:
                await self._connect_with_retry()

    async def close(self):
        """Close connection"""
        if self.client:
            self.client.close()
            logger.info("Hospital Manager connection closed")

    async def create_indexes(self):
        """Create optimized indexes for hospital data"""
        collection = self.db.hospitals

        indexes = [
            # Text search index for name and address
            ([("name", TEXT), ("address", TEXT)], {"name": "hospital_text_search"}),

            # Location-based search (2dsphere index for geospatial queries)
            ([("location", GEOSPHERE)], {"name": "hospital_geo_idx"}),

            # Common filter fields
            ([("region", ASCENDING)], {"name": "region_idx"}),
            ([("type", ASCENDING)], {"name": "type_idx"}),
            ([("has_dialysis_unit", ASCENDING)], {"name": "dialysis_idx"}),
            ([("night_dialysis", ASCENDING)], {"name": "night_dialysis_idx"}),

            # Compound indexes for common queries
            ([("region", ASCENDING), ("type", ASCENDING)], {"name": "region_type_idx"}),
            ([("region", ASCENDING), ("has_dialysis_unit", ASCENDING)], {"name": "region_dialysis_idx"}),
            ([("type", ASCENDING), ("has_dialysis_unit", ASCENDING)], {"name": "type_dialysis_idx"}),
        ]

        for index_spec, index_options in indexes:
            try:
                await collection.create_index(index_spec, **index_options)
                logger.info(f"✅ Created index {index_options['name']} on hospitals")
            except Exception as e:
                if "already exists" not in str(e).lower():
                    logger.warning(f"⚠️ Index creation failed for {index_options['name']}: {e}")

    # ==================== Search Methods ====================

    async def search_by_text(
        self,
        query: str,
        limit: int = 20,
        filters: Dict = None
    ) -> List[Dict]:
        """
        텍스트 검색 (병원/약국 이름, 주소)

        Args:
            query: 검색어
            limit: 결과 개수 제한
            filters: 추가 필터 (region, type, has_dialysis_unit 등)

        Returns:
            검색 결과 리스트
        """
        start_time = time.time()

        # Build query
        search_query = {"$text": {"$search": query}}

        if filters:
            search_query.update(filters)

        # Use class constant and add text score for ranking
        projection = {**self.HOSPITAL_PROJECTION, "score": {"$meta": "textScore"}}

        cursor = self.db.hospitals.find(
            search_query,
            projection
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)

        results = await cursor.to_list(length=limit)

        elapsed = time.time() - start_time
        logger.debug(f"Text search completed in {elapsed:.3f}s ({len(results)} results)")

        return results

    async def search_by_region(
        self,
        region: str,
        type: str = None,
        has_dialysis: bool = None,
        night_dialysis: bool = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        지역별 검색

        Args:
            region: 지역명 (예: "서울", "부산")
            type: 유형 (예: "병원/의원", "약국")
            has_dialysis: 투석 가능 여부
            night_dialysis: 야간 투석 가능 여부
            limit: 결과 개수 제한

        Returns:
            검색 결과 리스트
        """
        query = self._build_region_query(region) or {}

        if type:
            query["type"] = type

        if has_dialysis is not None:
            query["has_dialysis_unit"] = has_dialysis

        if night_dialysis is not None:
            query["night_dialysis"] = night_dialysis

        cursor = self.db.hospitals.find(query, self.HOSPITAL_PROJECTION).limit(limit)
        results = await cursor.to_list(length=limit)

        return results

    async def search_nearby(
        self,
        latitude: float,
        longitude: float,
        max_distance_km: float = 5.0,
        type: str = None,
        has_dialysis: bool = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        근처 병원/약국 검색 (좌표 기반)

        Args:
            latitude: 위도
            longitude: 경도
            max_distance_km: 최대 거리 (킬로미터)
            type: 유형 필터
            has_dialysis: 투석 가능 여부
            limit: 결과 개수 제한

        Returns:
            거리순으로 정렬된 검색 결과
        """
        # GeoJSON Point 형식으로 변환 필요
        # 먼저 location 필드가 있는지 확인하고 없으면 lat, lng로 검색

        # Simple distance calculation using aggregation
        pipeline = []

        # Match filters
        match_stage = {}
        if type:
            match_stage["type"] = type
        if has_dialysis is not None:
            match_stage["has_dialysis_unit"] = has_dialysis

        if match_stage:
            pipeline.append({"$match": match_stage})

        # Add distance calculation using Haversine formula
        # Haversine: accounts for Earth's curvature and latitude-dependent longitude distances
        # Formula: a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
        #          distance = 2R × arcsin(√a) where R = 6371 km
        EARTH_RADIUS_KM = 6371.0
        DEG_TO_RAD = 3.141592653589793 / 180.0  # math.pi / 180

        pipeline.extend([
            {
                "$addFields": {
                    # Convert coordinates to radians
                    "_lat1_rad": {"$multiply": [latitude, DEG_TO_RAD]},
                    "_lat2_rad": {"$multiply": ["$lat", DEG_TO_RAD]},
                    "_delta_lat_rad": {"$multiply": [{"$subtract": ["$lat", latitude]}, DEG_TO_RAD]},
                    "_delta_lng_rad": {"$multiply": [{"$subtract": ["$lng", longitude]}, DEG_TO_RAD]}
                }
            },
            {
                "$addFields": {
                    # Haversine formula: a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
                    "_haversine_a": {
                        "$add": [
                            # sin²(Δlat/2)
                            {"$pow": [{"$sin": {"$divide": ["$_delta_lat_rad", 2]}}, 2]},
                            # cos(lat1) × cos(lat2) × sin²(Δlng/2)
                            {"$multiply": [
                                {"$cos": "$_lat1_rad"},
                                {"$cos": "$_lat2_rad"},
                                {"$pow": [{"$sin": {"$divide": ["$_delta_lng_rad", 2]}}, 2]}
                            ]}
                        ]
                    }
                }
            },
            {
                "$addFields": {
                    # distance = 2R × arcsin(√a)
                    "distance_km": {
                        "$multiply": [
                            2 * EARTH_RADIUS_KM,
                            {"$asin": {"$sqrt": "$_haversine_a"}}
                        ]
                    }
                }
            },
            {
                # Remove temporary fields
                "$project": {
                    "_lat1_rad": 0,
                    "_lat2_rad": 0,
                    "_delta_lat_rad": 0,
                    "_delta_lng_rad": 0,
                    "_haversine_a": 0
                }
            },
            {
                "$match": {
                    "distance_km": {"$lte": max_distance_km}
                }
            },
            {
                "$sort": {"distance_km": 1}
            },
            {
                "$limit": limit
            },
            {
                "$project": {
                    "name": 1,
                    "address": 1,
                    "phone": 1,
                    "region": 1,
                    "type": 1,
                    "dialysis_machines": 1,
                    "has_dialysis_unit": 1,
                    "night_dialysis": 1,
                    "dialysis_days": 1,
                    "lat": 1,
                    "lng": 1,
                    "distance_km": 1,
                    "naver_map_url": 1,
                    "kakao_map_url": 1,
                    "_id": 1
                }
            }
        ])

        cursor = self.db.hospitals.aggregate(pipeline)
        results = await cursor.to_list(length=limit)

        return results

    async def get_by_id(self, hospital_id: str) -> Optional[Dict]:
        """
        ID로 병원 정보 조회

        Args:
            hospital_id: MongoDB ObjectId (문자열)

        Returns:
            병원 정보 또는 None
        """
        try:
            result = await self.db.hospitals.find_one({"_id": ObjectId(hospital_id)})
            return result
        except Exception as e:
            logger.error(f"Error getting hospital by ID: {e}")
            return None

    async def get_dialysis_centers(
        self,
        region: str = None,
        night_only: bool = False,
        min_machines: int = 0,
        limit: int = 50
    ) -> List[Dict]:
        """
        투석 가능 병원 검색

        Args:
            region: 지역 필터
            night_only: 야간 투석만
            min_machines: 최소 투석기 대수
            limit: 결과 개수 제한

        Returns:
            투석 가능 병원 리스트
        """
        query = {"has_dialysis_unit": True}

        region_filter = self._build_region_query(region)
        if region_filter:
            query.update(region_filter)

        if night_only:
            query["night_dialysis"] = True

        if min_machines > 0:
            query["dialysis_machines"] = {"$gte": min_machines}

        cursor = self.db.hospitals.find(query, self.HOSPITAL_PROJECTION).sort("dialysis_machines", -1).limit(limit)
        results = await cursor.to_list(length=limit)

        return results

    # ==================== Statistics ====================

    async def get_stats(self, use_cache: bool = True) -> Dict:
        """
        병원 데이터 통계 조회

        Args:
            use_cache: 캐시 사용 여부

        Returns:
            통계 정보
        """
        # Check cache
        if use_cache and self._cache_timestamp > 0:
            if time.time() - self._cache_timestamp < self._cache_ttl:
                return self._stats_cache

        # Aggregation pipeline for statistics
        pipeline = [
            {
                "$facet": {
                    "total": [{"$count": "count"}],
                    "by_region": [
                        {"$group": {"_id": "$region", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}}
                    ],
                    "by_type": [
                        {"$group": {"_id": "$type", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}}
                    ],
                    "dialysis_stats": [
                        {
                            "$group": {
                                "_id": None,
                                "total_dialysis": {
                                    "$sum": {"$cond": ["$has_dialysis_unit", 1, 0]}
                                },
                                "night_dialysis": {
                                    "$sum": {"$cond": ["$night_dialysis", 1, 0]}
                                },
                                "total_machines": {"$sum": "$dialysis_machines"}
                            }
                        }
                    ]
                }
            }
        ]

        cursor = self.db.hospitals.aggregate(pipeline)
        results = await cursor.to_list(length=1)

        if results:
            data = results[0]
            stats = {
                "total": data["total"][0]["count"] if data["total"] else 0,
                "by_region": {item["_id"]: item["count"] for item in data["by_region"]},
                "by_type": {item["_id"]: item["count"] for item in data["by_type"]},
                "dialysis": data["dialysis_stats"][0] if data["dialysis_stats"] else {}
            }

            # Update cache
            self._stats_cache = stats
            self._cache_timestamp = time.time()

            return stats

        return {}

    async def get_regions(self) -> List[str]:
        """
        모든 지역 목록 조회

        Returns:
            지역 리스트
        """
        regions = await self.db.hospitals.distinct("region")
        return sorted(regions)

    async def get_types(self) -> List[str]:
        """
        모든 유형 목록 조회

        Returns:
            유형 리스트
        """
        types = await self.db.hospitals.distinct("type")
        return sorted(types)

    # Common Korean region names for exact matching (optimized for index usage)
    KNOWN_REGIONS = {
        "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
        "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
        # District-level
        "강남", "강북", "강서", "강동", "서초", "송파", "마포", "용산",
        "영등포", "종로", "중구", "동대문", "성북", "노원", "관악"
    }

    def _build_region_query(self, region: Optional[str]) -> Dict:
        """Create a Mongo query that matches region/address substrings.

        Optimization strategy:
        1. For multi-word queries: split and match ALL keywords in region OR address
        2. For known regions: use exact match prefix (uses index efficiently)
        3. For unknown single-word regions: use anchored regex
        4. Fallback: case-insensitive regex (slower, but comprehensive)

        Examples:
        - "서울 강남구" → matches if region contains "서울" AND address contains "강남구"
        - "강남" → matches if region or address contains "강남"
        """
        if not region:
            return {}

        keyword = region.strip()
        if not keyword:
            return {}

        # Strategy 1: Handle multi-word queries (e.g., "서울 강남구")
        # Split by space and require ALL keywords to match in region OR address
        words = keyword.split()
        if len(words) > 1:
            # Build $and conditions: each word must appear in region OR address
            and_conditions = []
            for word in words:
                word = word.strip()
                if not word:
                    continue
                escaped = re.escape(word)
                and_conditions.append({
                    "$or": [
                        {"region": {"$regex": escaped}},
                        {"address": {"$regex": escaped}}
                    ]
                })

            if and_conditions:
                return {"$and": and_conditions}
            return {}

        # Strategy 2: Check if it's a known region for optimized matching
        if keyword in self.KNOWN_REGIONS:
            # Use $regex with ^ anchor for prefix matching (can use index)
            # This matches "서울특별시", "서울시", etc. when searching for "서울"
            escaped = re.escape(keyword)
            return {
                "$or": [
                    {"region": {"$regex": f"^{escaped}"}},  # No $options: "i" = uses index
                    {"address": {"$regex": f"^.*{escaped}"}}  # Address usually starts with region
                ]
            }

        # Strategy 3: For short keywords, try prefix-anchored search first
        if len(keyword) >= 2:
            escaped = re.escape(keyword)
            # Case-sensitive prefix match (uses index)
            # Falls back to in-memory filtering for case variations
            return {
                "$or": [
                    {"region": {"$regex": escaped}},  # Case-sensitive, can use index
                    {"address": {"$regex": escaped}}
                ]
            }

        # Strategy 4: Fallback to case-insensitive for very short or unusual queries
        escaped = re.escape(keyword)
        regex = {"$regex": escaped, "$options": "i"}
        return {
            "$or": [
                {"region": regex},
                {"address": regex}
            ]
        }

    def _doc_matches_region(self, doc: Dict, region: Optional[str]) -> bool:
        """Check if region keyword(s) appear in region/address fields.

        For multi-word queries (e.g., "서울 강남구"), ALL words must match.
        """
        if not region:
            return True

        keyword = region.strip()
        if not keyword:
            return True

        region_value = str(doc.get("region", "") or "").lower()
        address_value = str(doc.get("address", "") or "").lower()
        combined = region_value + " " + address_value

        # Handle multi-word queries: ALL words must be present
        words = keyword.lower().split()
        return all(word in combined for word in words)

    async def search_hospitals(
        self,
        query: Optional[str] = None,
        hospital_type: Optional[str] = None,
        region: Optional[str] = None,
        has_dialysis: Optional[bool] = None,
        night_dialysis: Optional[bool] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        max_distance_km: float = 10.0,
        limit: int = 5
    ) -> List[Dict]:
        """Hybrid hospital search combining keyword, semantic, and structured filters."""
        await self._ensure_connection()

        filters: Dict = {}
        region_filter = self._build_region_query(region)
        if region_filter:
            filters.update(region_filter)
        if hospital_type:
            filters["type"] = hospital_type
        if has_dialysis is not None:
            filters["has_dialysis_unit"] = has_dialysis
        if night_dialysis is not None:
            filters["night_dialysis"] = night_dialysis

        if query:
            keyword_task = asyncio.create_task(self.search_by_text(
                query=query,
                limit=limit,
                filters=filters or None
            ))

            semantic_task = asyncio.create_task(self._semantic_search_hospitals(
                query=query,
                limit=limit,
                hospital_type=hospital_type,
                region=region,
                has_dialysis=has_dialysis,
                night_dialysis=night_dialysis
            ))

            keyword_results, semantic_result_tuple = await asyncio.gather(
                keyword_task,
                semantic_task
            )

            # Unpack semantic search results and status
            semantic_results, semantic_status = semantic_result_tuple

            fallback_results = await self._base_filter_hospital_search(
                filters,
                max(limit * 2, limit)
            )

            merged = self._merge_hospital_results(
                keyword_results,
                semantic_results,
                fallback_results,
                limit
            )

            # Log with status information for monitoring
            if semantic_status == SearchStatus.FAILED:
                logger.warning(
                    "Hybrid search degraded (vector search failed): query=%s, "
                    "keyword_results=%d, fallback_results=%d, merged=%d",
                    query[:50] if query else None,
                    len(keyword_results),
                    len(fallback_results),
                    len(merged)
                )
            else:
                logger.debug(
                    "Hybrid hospital search complete: query=%s, filters=%s, "
                    "keyword=%d, semantic=%d, merged=%d, status=%s",
                    query[:50] if query else None,
                    filters,
                    len(keyword_results),
                    len(semantic_results),
                    len(merged),
                    semantic_status.value
                )

            return merged

        # Queryless path retains existing behavior (region/nearby searches)
        if latitude is not None and longitude is not None:
            nearby = await self.search_nearby(
                latitude=latitude,
                longitude=longitude,
                max_distance_km=max_distance_km,
                type=hospital_type,
                has_dialysis=has_dialysis,
                limit=limit * 2
            )

            if region:
                nearby = [h for h in nearby if self._doc_matches_region(h, region)]
            if night_dialysis is not None:
                nearby = [h for h in nearby if h.get("night_dialysis") == night_dialysis]

            return nearby[:limit]

        if region:
            return await self.search_by_region(
                region=region,
                type=hospital_type,
                has_dialysis=has_dialysis,
                night_dialysis=night_dialysis,
                limit=limit
            )

        fallback = await self._base_filter_hospital_search(filters, limit)
        return fallback[:limit]

    async def _base_filter_hospital_search(self, filters: Dict, limit: int) -> List[Dict]:
        """Structured fallback search when keyword/semantic results are insufficient."""
        query = filters.copy() if filters else {}

        cursor = (
            self.db.hospitals
            .find(query, self.HOSPITAL_PROJECTION)
            .sort([("has_dialysis_unit", -1), ("dialysis_machines", -1), ("name", ASCENDING)])
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    def get_vector_search_metrics(self) -> Dict[str, Any]:
        """Get vector search performance metrics for monitoring."""
        total = self._vector_search_successes + self._vector_search_failures
        failure_rate = (
            self._vector_search_failures / total if total > 0 else 0.0
        )
        return {
            "successes": self._vector_search_successes,
            "failures": self._vector_search_failures,
            "total": total,
            "failure_rate": failure_rate,
            "vector_ready": self._vector_ready,
            "vector_init_failed": self._vector_init_failed
        }

    def _extract_district_from_query(self, query: str) -> Optional[str]:
        """Extract district (구/군) from search query for Pinecone filtering.

        Examples:
            "강남구 투석 병원" -> "강남구"
            "서초구에서 야간 투석" -> "서초구"
            "투석 병원 찾아줘" -> None
        """
        if not query:
            return None

        # Pattern to match Korean district names (구/군)
        match = re.search(r'([가-힣]+[구군])', query)
        if match:
            return match.group(1)
        return None

    async def _semantic_search_hospitals(
        self,
        query: Optional[str],
        limit: int,
        hospital_type: Optional[str],
        region: Optional[str],
        has_dialysis: Optional[bool],
        night_dialysis: Optional[bool]
    ) -> Tuple[List[Dict], SearchStatus]:
        """Semantic hospital search leveraging Pinecone vectors.

        Returns:
            Tuple of (results, status) where status indicates search health.
        """
        if not query:
            return [], SearchStatus.SUCCESS

        vector_ready = await self._ensure_vector_manager()
        if not vector_ready or not self.vector_manager:
            logger.warning(
                "Vector manager not ready for semantic search",
                extra={
                    "query": query[:50] if query else None,
                    "vector_init_failed": self._vector_init_failed
                }
            )
            self._vector_search_failures += 1
            return [], SearchStatus.FAILED

        try:
            # Build Pinecone metadata filter
            pinecone_filter = {}
            if has_dialysis is not None:
                pinecone_filter["has_dialysis_unit"] = has_dialysis
            if night_dialysis is not None:
                pinecone_filter["night_dialysis"] = night_dialysis
            if hospital_type:
                pinecone_filter["type"] = hospital_type
            # Extract district (구/군) from query for precise location filtering
            district = self._extract_district_from_query(query)
            if district:
                pinecone_filter["district"] = district
            # Note: region filter is applied post-fetch since it requires substring matching

            matches = await self.vector_manager.semantic_search(
                query=query,
                top_k=max(limit * 3, limit),
                namespace=self.vector_namespace,
                filter=pinecone_filter if pinecone_filter else None
            )
            self._vector_search_successes += 1
        except Exception as e:
            self._vector_search_failures += 1
            metrics = self.get_vector_search_metrics()
            logger.error(
                f"Hospital semantic search failed: {e}",
                exc_info=True,
                extra={
                    "query": query[:50] if query else None,
                    "namespace": self.vector_namespace,
                    "failure_rate": f"{metrics['failure_rate']:.2%}"
                }
            )
            return [], SearchStatus.FAILED

        doc_ids = []
        scores = []
        for match in matches:
            metadata = match.get("metadata") or {}
            doc_id = metadata.get("doc_id") or metadata.get("_id") or metadata.get("hospital_id")
            if not doc_id:
                continue
            doc_ids.append(doc_id)
            scores.append((doc_id, match.get("score", 0.0)))

        docs_map = await self._get_hospitals_by_ids(doc_ids)

        semantic_results: List[Dict] = []
        seen = set()
        for doc_id, score in scores:
            if doc_id in seen:
                continue
            seen.add(doc_id)

            doc = docs_map.get(doc_id)
            if not doc:
                continue

            if not self._hospital_doc_matches_filters(
                doc,
                hospital_type,
                region,
                has_dialysis,
                night_dialysis
            ):
                continue

            doc_copy = dict(doc)
            doc_copy["semantic_score"] = max(score, 0.0)
            semantic_results.append(doc_copy)

            if len(semantic_results) >= limit:
                break

        # Check if we had matches but all were filtered out
        if not semantic_results and matches:
            return [], SearchStatus.PARTIAL

        return semantic_results, SearchStatus.SUCCESS

    async def _get_hospitals_by_ids(self, doc_ids: List[str]) -> Dict[str, Dict]:
        """Fetch hospital documents by Mongo _id."""
        if not doc_ids:
            return {}

        object_ids = []
        for doc_id in doc_ids:
            if not doc_id:
                continue
            try:
                object_ids.append(ObjectId(doc_id))
            except Exception:
                continue

        if not object_ids:
            return {}

        cursor = self.db.hospitals.find({"_id": {"$in": object_ids}})
        docs = await cursor.to_list(length=len(object_ids))

        return {str(doc["_id"]): doc for doc in docs}

    def _hospital_doc_matches_filters(
        self,
        doc: Dict,
        hospital_type: Optional[str],
        region: Optional[str],
        has_dialysis: Optional[bool],
        night_dialysis: Optional[bool]
    ) -> bool:
        """Apply region/type/dialysis filters to a hospital doc."""
        if region and not self._doc_matches_region(doc, region):
            return False
        if hospital_type and doc.get("type") != hospital_type:
            return False
        if has_dialysis is not None and doc.get("has_dialysis_unit") != has_dialysis:
            return False
        if night_dialysis is not None and doc.get("night_dialysis") != night_dialysis:
            return False
        return True

    def _merge_hospital_results(
        self,
        keyword_results: List[Dict],
        semantic_results: List[Dict],
        fallback_results: List[Dict],
        limit: int
    ) -> List[Dict]:
        """Combine keyword, semantic, and fallback hospital results."""
        combined: Dict[str, Dict] = {}

        def add_result(
            doc: Dict,
            keyword_score: float = 0.0,
            semantic_score: float = 0.0,
            fallback_order: Optional[int] = None
        ):
            doc_id = str(doc.get("_id") or "")
            if not doc_id:
                return

            entry = combined.get(doc_id)
            if not entry:
                entry = {
                    "doc": doc,
                    "keyword_score": 0.0,
                    "semantic_score": 0.0,
                    "fallback_order": None
                }
                combined[doc_id] = entry
            else:
                entry["doc"] = doc

            entry["keyword_score"] = max(entry["keyword_score"], keyword_score)
            entry["semantic_score"] = max(entry["semantic_score"], semantic_score)

            if fallback_order is not None:
                if entry["fallback_order"] is None:
                    entry["fallback_order"] = fallback_order
                else:
                    entry["fallback_order"] = min(entry["fallback_order"], fallback_order)

        # Normalize keyword scores (0-1 range)
        max_keyword_score = max(
            [doc.get("score", 0) for doc in keyword_results],
            default=0.0
        )

        for doc in keyword_results:
            normalized = (
                doc.get("score", 0) / max_keyword_score
                if max_keyword_score > 0 else 0.0
            )
            add_result(doc, keyword_score=normalized)

        # Normalize semantic scores (0-1 range) - FIX: was not normalized before
        max_semantic_score = max(
            [doc.get("semantic_score", 0) for doc in semantic_results],
            default=0.0
        )

        for doc in semantic_results:
            raw_score = doc.get("semantic_score", 0.0)
            normalized_semantic = (
                raw_score / max_semantic_score
                if max_semantic_score > 0 else 0.0
            )
            add_result(doc, semantic_score=normalized_semantic)

        # Add fallback results with order-based scoring
        fallback_counter = 0
        for doc in fallback_results:
            fallback_counter += 1
            add_result(doc, fallback_order=fallback_counter)

        # Calculate final hybrid scores
        merged_docs: List[Dict] = []
        for entry in combined.values():
            # Weighted combination of normalized scores
            final_score = (
                entry["keyword_score"] * self.keyword_weight +
                entry["semantic_score"] * self.semantic_weight
            )

            # For documents only found in fallback, use order-based scoring
            if final_score == 0 and entry["fallback_order"] is not None:
                # Score based on inverse order (earlier = higher score)
                final_score = max(1e-4, 1e-4 * (len(fallback_results) - entry["fallback_order"]))

            entry["doc"]["keyword_score"] = entry["keyword_score"]
            entry["doc"]["semantic_score"] = entry["semantic_score"]
            entry["doc"]["hybrid_score"] = final_score
            merged_docs.append(entry["doc"])

        merged_docs.sort(key=lambda doc: doc.get("hybrid_score", 0), reverse=True)

        return merged_docs[:limit]


# ==================== Test Functions ====================
async def test_hospital_manager():
    """Test Hospital Manager functionality"""
    import asyncio

    print("\n" + "="*80)
    print("HOSPITAL MANAGER TEST")
    print("="*80)

    manager = HospitalManager()
    await manager.connect()

    # Test 1: Get statistics
    print("\n[통계 조회]")
    stats = await manager.get_stats()
    print(f"총 병원/약국 수: {stats.get('total', 0):,}")
    print(f"투석 가능: {stats.get('dialysis', {}).get('total_dialysis', 0):,}")
    print(f"야간 투석: {stats.get('dialysis', {}).get('night_dialysis', 0):,}")

    # Test 2: Search by region
    print("\n[서울 강남구")
    seoul_dialysis = await manager.search_by_region(
        region="강남",
        has_dialysis=True,
        limit=5
    )
    for hospital in seoul_dialysis:
        print(f"  - {hospital['name']} ({hospital['dialysis_machines']}대)")

    # Test 3: Text search
    print("\n[텍스트 검색: '강남구 투석 가능 병원 또는 인공신장실']")
    results = await manager.search_by_text("강남구 투석 가능 병원 또는 인공신장실", limit=5)
    for hospital in results:
        print(f"  - {hospital['name']} - {hospital['address']}")

    # Test 4: Nearby search
    print("\n[근처 병원 검색 (위도: 37.5665, 경도: 126.9780)]")
    nearby = await manager.search_nearby(
        latitude=37.5665,
        longitude=126.9780,
        max_distance_km=2.0,
        limit=5
    )
    for hospital in nearby:
        print(f"  - {hospital['name']} ({hospital.get('distance_km', 0):.2f}km)")

    # Test 5: Get regions
    print("\n[지역 목록]")
    regions = await manager.get_regions()
    print(f"  총 {len(regions)}개 지역: {', '.join(regions[:10])}...")

    await manager.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_hospital_manager())
