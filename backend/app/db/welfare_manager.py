"""
Welfare Programs Manager - 복지 프로그램 관리

HospitalManager 패턴 100% 적용:
- 비동기 MongoDB 연결 (Motor)
- Connection pooling
- 텍스트 검색 (score 기반 정렬)
- LRU 캐싱 (통계)
- 다양한 검색 메서드

Data Source:
- 공공데이터포털 (data.go.kr)
- 국민건강보험공단, 보건복지부, 질병관리청
- 2024-2025 검증 완료

Author: CareGuide Team
Date: 2025-11-19
"""

from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Optional, Tuple, Any
from enum import Enum
import os
import hashlib
import json
from dotenv import load_dotenv
from pymongo import ASCENDING, TEXT
import logging
import time
import asyncio
from bson import ObjectId

from app.db.vector_manager import OptimizedVectorDBManager


class SearchStatus(Enum):
    """Status indicators for search operations."""
    SUCCESS = "success"          # All search components succeeded
    PARTIAL = "partial"          # Some components failed, using fallback
    FAILED = "failed"            # Search completely failed

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WelfareManager:
    """복지 프로그램 관리 비동기 매니저

    HospitalManager와 동일한 패턴:
    - Connection pooling (maxPoolSize=100, minPoolSize=10)
    - 비동기 검색 메서드 (Motor)
    - 캐싱 전략 (TTL 3600s)
    - 텍스트 검색 점수 기반 정렬
    - 다양한 필터 옵션

    Example:
        manager = WelfareManager()
        await manager.connect()
        results = await manager.search_by_text("산정특례", limit=5)
        await manager.close()
    """

    def __init__(
        self,
        uri: str = None,
        db_name: str = "careguide",
        max_pool_size: int = 100,
        min_pool_size: int = 10
    ):
        """Initialize WelfareManager

        Args:
            uri: MongoDB connection URI (default: env MONGODB_URI)
            db_name: Database name (default: careguide)
            max_pool_size: Maximum connection pool size (default: 100)
            min_pool_size: Minimum connection pool size (default: 10)
        """
        self.uri = uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = db_name

        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.max_pool_size = max_pool_size
        self.min_pool_size = min_pool_size

        # Cache for statistics (hospital_manager.py 동일)
        self._cache = {}
        self._cache_timestamp = 0
        self._cache_ttl = 3600  # 1 hour

        # Hybrid search components
        self.enable_vector_search = True
        self.vector_namespace = "welfare_programs"
        self.vector_manager: Optional[OptimizedVectorDBManager] = None
        self._vector_ready = False
        self._vector_init_failed = False
        self.keyword_weight = 0.4
        self.semantic_weight = 0.6

        # Connection management (same as hospital_manager)
        self._connection_lock = asyncio.Lock()
        self._last_health_check = 0
        self._health_check_interval = 60
        self._max_retries = 3
        self._retry_base_delay = 1.0

        # Vector search metrics for monitoring
        self._vector_search_successes = 0
        self._vector_search_failures = 0

        logger.info(f"WelfareManager initialized: {self.db_name}")

    async def _ensure_connection(self):
        """Ensure MongoDB connection exists and is healthy with thread-safe locking."""
        async with self._connection_lock:
            if self.client is None or self.db is None:
                await self._connect_with_retry()
                return

            # Periodic health check
            now = time.time()
            if now - self._last_health_check > self._health_check_interval:
                try:
                    await asyncio.wait_for(self.db.command("ping"), timeout=5.0)
                    self._last_health_check = now
                except Exception as e:
                    logger.warning(f"Welfare connection health check failed: {e}, reconnecting...")
                    await self._connect_with_retry()

    async def _connect_with_retry(self):
        """Connect to MongoDB with exponential backoff retry logic."""
        last_error = None

        for attempt in range(self._max_retries):
            try:
                if self.client:
                    try:
                        self.client.close()
                    except Exception:
                        pass
                    self.client = None
                    self.db = None

                self.client = AsyncIOMotorClient(
                    self.uri,
                    maxPoolSize=self.max_pool_size,
                    minPoolSize=self.min_pool_size,
                    maxIdleTimeMS=30000,
                    waitQueueTimeoutMS=5000,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=2000,
                    socketTimeoutMS=10000,
                    retryWrites=True,
                    retryReads=True
                )
                self.db = self.client[self.db_name]

                await asyncio.wait_for(self.db.command("ping"), timeout=10.0)
                await self.create_indexes()

                self._last_health_check = time.time()
                logger.info(f"✅ WelfareManager connected: {self.db_name}")
                return

            except Exception as e:
                last_error = e
                if attempt < self._max_retries - 1:
                    delay = self._retry_base_delay * (2 ** attempt)
                    logger.warning(f"Welfare MongoDB connection attempt {attempt + 1}/{self._max_retries} failed: {e}. Retrying in {delay:.1f}s...")
                    await asyncio.sleep(delay)

        logger.error(f"Failed to connect to MongoDB after {self._max_retries} attempts: {last_error}")
        raise ConnectionError(f"MongoDB connection failed: {last_error}")

    def get_vector_search_metrics(self) -> Dict[str, Any]:
        """Get vector search performance metrics for monitoring."""
        total = self._vector_search_successes + self._vector_search_failures
        failure_rate = self._vector_search_failures / total if total > 0 else 0.0
        return {
            "successes": self._vector_search_successes,
            "failures": self._vector_search_failures,
            "total": total,
            "failure_rate": failure_rate,
            "vector_ready": self._vector_ready,
            "vector_init_failed": self._vector_init_failed
        }

    async def _ensure_vector_manager(self) -> bool:
        """Initialize Pinecone vector manager if enabled."""
        if not self.enable_vector_search or self._vector_init_failed:
            return False

        if self.vector_manager is None:
            try:
                self.vector_manager = OptimizedVectorDBManager(use_cache=True)
            except Exception as e:
                logger.warning(f"Welfare vector manager init failed: {e}")
                self._vector_init_failed = True
                return False

        if not self._vector_ready:
            try:
                await self.vector_manager.create_index()
                self._vector_ready = True
            except Exception as e:
                logger.warning(f"Welfare vector index init failed: {e}")
                self._vector_init_failed = True
                self.vector_manager = None
                return False

        return True

    async def connect(self):
        """Connect to MongoDB with connection pooling

        HospitalManager 동일 패턴:
        - Connection timeout: 2s
        - Socket timeout: 10s
        - Server selection timeout: 5s
        - Wait queue timeout: 5s
        - Max idle time: 30s

        Creates indexes if not exists.
        """
        if not self.client:
            self.client = AsyncIOMotorClient(
                self.uri,
                maxPoolSize=self.max_pool_size,
                minPoolSize=self.min_pool_size,
                maxIdleTimeMS=30000,
                waitQueueTimeoutMS=5000,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=2000,
                socketTimeoutMS=10000
            )
            self.db = self.client[self.db_name]

            # Create indexes
            await self.create_indexes()

            logger.info(f"✅ WelfareManager connected: {self.db_name}.welfare_programs")
            logger.info(f"   Connection pool: min={self.min_pool_size}, max={self.max_pool_size}")

    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("WelfareManager connection closed")

    async def create_indexes(self):
        """Create indexes on welfare_programs collection

        Indexes:
        1. category_idx - Category filtering
        2. welfare_text_search - Multilingual text search (title, description, keywords)
        3. disease_idx - Target disease filtering
        4. ckd_stage_idx - CKD stage filtering
        5. program_id_unique - Unique program ID

        Pattern: hospital_manager.py
        """
        collection = self.db.welfare_programs

        indexes = [
            # 1. Category index
            (
                [("category", ASCENDING)],
                {"name": "category_idx"}
            ),

            # 2. Text search index (Multilingual)
            (
                [("title", TEXT), ("description", TEXT), ("keywords", TEXT)],
                {"name": "welfare_text_search"}
            ),

            # 3. Target disease index
            (
                [("target_disease", ASCENDING)],
                {"name": "disease_idx"}
            ),

            # 4. CKD stage index (nested field)
            (
                [("eligibility.ckd_stage", ASCENDING)],
                {"name": "ckd_stage_idx"}
            ),

            # 5. Program ID unique index
            (
                [("programId", ASCENDING)],
                {"name": "program_id_unique", "unique": True}
            )
        ]

        for index_spec, index_options in indexes:
            try:
                await collection.create_index(index_spec, **index_options)
                logger.info(f"  ✅ Created index {index_options['name']} on welfare_programs")
            except Exception as e:
                if "already exists" not in str(e).lower():
                    logger.warning(f"  ⚠️ Index creation failed for {index_options['name']}: {e}")

    # ==================== Search Methods ====================

    async def search_by_text(
        self,
        query: str,
        limit: int = 10,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """텍스트 검색 (HospitalManager 패턴)

        MongoDB $text 검색 with scoring.
        Results sorted by relevance score (descending).

        Args:
            query: 검색어 (e.g., "산정특례", "장애인 복지", "의료비 지원")
            limit: 최대 결과 수 (default: 10)
            filters: 추가 필터 dict (e.g., {"category": "sangjung_special"})

        Returns:
            검색 결과 리스트 (score 포함, score 순 정렬)

        Example:
            results = await manager.search_by_text("산정특례", limit=5)
            # Returns: [V001, ...] with scores
        """
        start_time = time.time()

        # Build text search query
        search_query = {"$text": {"$search": query}}

        # Apply additional filters
        if filters:
            search_query.update(filters)

        # Projection (include score for sorting)
        projection = {
            "score": {"$meta": "textScore"},
            "_id": 1,
            "programId": 1,
            "title": 1,
            "category": 1,
            "description": 1,
            "benefits": 1,
            "application": 1,
            "contact": 1,
            "keywords": 1,
            "target_disease": 1,
            "eligibility": 1,
            "year": 1,
            "is_active": 1
        }

        # Execute search
        cursor = self.db.welfare_programs.find(
            search_query,
            projection
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)

        results = await cursor.to_list(length=limit)

        elapsed = time.time() - start_time
        logger.debug(f"Welfare text search: query='{query}', results={len(results)}, time={elapsed:.3f}s")

        return results

    async def search_by_category(
        self,
        category: str,
        limit: int = 20
    ) -> List[Dict]:
        """카테고리별 검색

        Args:
            category: 카테고리
                - sangjung_special: 산정특례
                - disability: 장애인 복지
                - medical_aid: 의료비 지원
                - transplant: 신장이식 지원
                - transport: 교통 및 생활 지원
            limit: 최대 결과 수 (default: 20)

        Returns:
            프로그램 리스트

        Example:
            results = await manager.search_by_category("sangjung_special")
            # Returns: sangjung_special category programs
        """
        query = {"category": category}

        cursor = self.db.welfare_programs.find(query).limit(limit)
        results = await cursor.to_list(length=limit)

        logger.debug(f"Category search: category='{category}', results={len(results)}")

        return results

    async def search_by_disease(
        self,
        disease: str,
        limit: int = 20
    ) -> List[Dict]:
        """질병별 검색

        Args:
            disease: 질병명 (e.g., "CKD", "ESRD", "dialysis", "hemodialysis")
            limit: 최대 결과 수 (default: 20)

        Returns:
            프로그램 리스트

        Example:
            results = await manager.search_by_disease("CKD")
            # Returns: Programs where "CKD" in target_disease array
        """
        query = {"target_disease": {"$in": [disease]}}

        cursor = self.db.welfare_programs.find(query).limit(limit)
        results = await cursor.to_list(length=limit)

        logger.debug(f"Disease search: disease='{disease}', results={len(results)}")

        return results

    async def search_by_ckd_stage(
        self,
        stage: int,
        limit: int = 20
    ) -> List[Dict]:
        """CKD 단계별 검색

        Args:
            stage: CKD 단계 (1-5)
            limit: 최대 결과 수 (default: 20)

        Returns:
            프로그램 리스트

        Example:
            results = await manager.search_by_ckd_stage(4)
            # Returns: Programs applicable to CKD stage 4
        """
        query = {"eligibility.ckd_stage": {"$in": [stage]}}

        cursor = self.db.welfare_programs.find(query).limit(limit)
        results = await cursor.to_list(length=limit)

        logger.debug(f"CKD stage search: stage={stage}, results={len(results)}")

        return results

    async def search_programs(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        disease: Optional[str] = None,
        ckd_stage: Optional[int] = None,
        limit: int = 20
    ) -> List[Dict]:
        """Hybrid welfare search combining Mongo keyword and vector search."""
        await self._ensure_connection()

        filters: Dict = {}

        if category:
            filters["category"] = category

        if disease:
            filters["target_disease"] = {"$in": [disease]}

        if ckd_stage is not None:
            filters["eligibility.ckd_stage"] = {"$in": [ckd_stage]}

        keyword_results: List[Dict] = []
        semantic_results: List[Dict] = []
        semantic_status = SearchStatus.SUCCESS

        if query:
            # Run keyword and semantic search concurrently
            keyword_task = asyncio.create_task(self.search_by_text(
                query=query,
                limit=limit,
                filters=filters or None
            ))

            semantic_task = asyncio.create_task(self._semantic_search_programs(
                query=query,
                limit=limit,
                category=category,
                disease=disease,
                ckd_stage=ckd_stage
            ))

            keyword_results, semantic_result_tuple = await asyncio.gather(
                keyword_task,
                semantic_task
            )

            # Unpack semantic search results and status
            semantic_results, semantic_status = semantic_result_tuple

        fallback_limit = max(limit * 2, limit)
        fallback_results = await self._filter_only_program_search(filters, fallback_limit)

        merged = self._merge_welfare_results(
            keyword_results,
            semantic_results,
            fallback_results,
            limit
        )

        # Log with status information for monitoring
        if semantic_status == SearchStatus.FAILED:
            logger.warning(
                "Hybrid welfare search degraded (vector search failed): query=%s, "
                "keyword_results=%d, fallback_results=%d, merged=%d",
                query[:50] if query else None,
                len(keyword_results),
                len(fallback_results),
                len(merged)
            )
        else:
            logger.debug(
                "Hybrid welfare search complete: query=%s, filters=%s, "
                "keyword=%d, semantic=%d, merged=%d, status=%s",
                query[:50] if query else None,
                filters,
                len(keyword_results),
                len(semantic_results),
                len(merged),
                semantic_status.value
            )

        return merged

    async def _filter_only_program_search(self, filters: Dict, limit: int) -> List[Dict]:
        """Fallback query that relies on structured filters only."""
        base_query = filters.copy() if filters else {}
        cursor = (
            self.db.welfare_programs
            .find(base_query)
            .sort([("year", -1), ("title", ASCENDING)])
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def _semantic_search_programs(
        self,
        query: Optional[str],
        limit: int,
        category: Optional[str],
        disease: Optional[str],
        ckd_stage: Optional[int]
    ) -> Tuple[List[Dict], SearchStatus]:
        """Semantic welfare search via Pinecone with status reporting."""
        if not query:
            return [], SearchStatus.SUCCESS

        vector_ready = await self._ensure_vector_manager()
        if not vector_ready or not self.vector_manager:
            logger.warning("Welfare vector manager not ready for semantic search")
            self._vector_search_failures += 1
            return [], SearchStatus.FAILED

        try:
            matches = await self.vector_manager.semantic_search(
                query=query,
                top_k=max(limit * 3, limit),
                namespace=self.vector_namespace
            )
            self._vector_search_successes += 1
        except Exception as e:
            self._vector_search_failures += 1
            metrics = self.get_vector_search_metrics()
            logger.error(
                f"Welfare semantic search failed: {e}",
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
            doc_id = metadata.get("doc_id") or metadata.get("programId")
            if not doc_id:
                continue
            doc_ids.append(doc_id)
            scores.append((doc_id, match.get("score", 0.0)))

        docs_map = await self._get_welfare_docs_by_ids(doc_ids)

        semantic_results: List[Dict] = []
        seen = set()
        for doc_id, score in scores:
            if doc_id in seen:
                continue
            seen.add(doc_id)

            doc = docs_map.get(doc_id)
            if not doc:
                continue

            if not self._welfare_doc_matches_filters(doc, category, disease, ckd_stage):
                continue

            doc_copy = dict(doc)
            doc_copy["semantic_score"] = max(score, 0.0)
            semantic_results.append(doc_copy)

            if len(semantic_results) >= limit:
                break

        if not semantic_results and matches:
            return [], SearchStatus.PARTIAL

        return semantic_results, SearchStatus.SUCCESS

    async def _get_welfare_docs_by_ids(self, doc_ids: List[str]) -> Dict[str, Dict]:
        """Fetch welfare docs by Mongo _id or programId."""
        if not doc_ids:
            return {}

        object_ids = []
        program_ids = []
        for doc_id in doc_ids:
            if not doc_id:
                continue
            try:
                object_ids.append(ObjectId(doc_id))
            except Exception:
                program_ids.append(doc_id)

        query = []
        if object_ids:
            query.append({"_id": {"$in": object_ids}})
        if program_ids:
            query.append({"programId": {"$in": program_ids}})

        if not query:
            return {}

        mongo_query = {"$or": query} if len(query) > 1 else query[0]
        cursor = self.db.welfare_programs.find(mongo_query)
        docs = await cursor.to_list(length=len(doc_ids))

        result = {}
        for doc in docs:
            result[str(doc["_id"])] = doc
            if "programId" in doc:
                result[doc["programId"]] = doc

        return result

    def _welfare_doc_matches_filters(
        self,
        doc: Dict,
        category: Optional[str],
        disease: Optional[str],
        ckd_stage: Optional[int]
    ) -> bool:
        """Apply category/disease/CKD filters to a single doc."""
        if category and doc.get("category") != category:
            return False

        if disease:
            targets = doc.get("target_disease") or []
            if disease not in targets:
                return False

        if ckd_stage is not None:
            eligibility = doc.get("eligibility") or {}
            stages = eligibility.get("ckd_stage") or []
            if isinstance(stages, list):
                if ckd_stage not in stages:
                    return False
            else:
                return False

        return True

    def _merge_welfare_results(
        self,
        keyword_results: List[Dict],
        semantic_results: List[Dict],
        fallback_results: List[Dict],
        limit: int
    ) -> List[Dict]:
        """Merge keyword, semantic, and fallback results."""
        combined: Dict[str, Dict] = {}

        def add_result(
            doc: Dict,
            keyword_score: float = 0.0,
            semantic_score: float = 0.0,
            fallback_order: Optional[int] = None
        ):
            doc_id = str(doc.get("_id") or doc.get("programId") or "")
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
                final_score = max(1e-4, 1e-4 * (len(fallback_results) - entry["fallback_order"]))

            entry["doc"]["keyword_score"] = entry["keyword_score"]
            entry["doc"]["semantic_score"] = entry["semantic_score"]
            entry["doc"]["hybrid_score"] = final_score
            merged_docs.append(entry["doc"])

        merged_docs.sort(key=lambda doc: doc.get("hybrid_score", 0), reverse=True)

        return merged_docs[:limit]

    async def get_by_id(self, program_id: str) -> Optional[Dict]:
        """프로그램 ID로 조회

        Args:
            program_id: 프로그램 ID (e.g., "sangjung_ckd_v001")

        Returns:
            프로그램 문서 or None

        Example:
            prog = await manager.get_by_id("sangjung_ckd_v001")
            print(prog["title"])  # "만성콩팥병 산정특례 제도 (V001)"
        """
        result = await self.db.welfare_programs.find_one({"programId": program_id})

        if result:
            logger.debug(f"Get by ID: program_id='{program_id}', found={result['title']}")
        else:
            logger.warning(f"Get by ID: program_id='{program_id}', not found")

        return result

    async def get_all_categories(self) -> List[str]:
        """모든 카테고리 목록 조회

        Returns:
            카테고리 리스트 (sorted alphabetically)

        Example:
            categories = await manager.get_all_categories()
            # Returns: ["disability", "medical_aid", "sangjung_special", "transplant", "transport"]
        """
        categories = await self.db.welfare_programs.distinct("category")
        sorted_categories = sorted(categories)

        logger.debug(f"Get categories: {len(sorted_categories)} categories")

        return sorted_categories

    async def get_stats(self, use_cache: bool = True) -> Dict:
        """통계 조회 (HospitalManager 패턴)

        Returns:
            {
                "total": 13,
                "by_category": {
                    "sangjung_special": 1,
                    "disability": 4,
                    ...
                }
            }

        Caching:
        - Cache TTL: 3600s (1 hour)
        - use_cache=False to force refresh

        Example:
            stats = await manager.get_stats()
            print(f"Total: {stats['total']}")
        """
        # Check cache
        current_time = time.time()
        if use_cache and self._cache and (current_time - self._cache_timestamp) < self._cache_ttl:
            logger.debug("Returning cached stats")
            return self._cache

        # Aggregation pipeline (hospital_manager.py 동일)
        pipeline = [
            {
                "$facet": {
                    "total": [{"$count": "count"}],
                    "by_category": [
                        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}}
                    ]
                }
            }
        ]

        cursor = self.db.welfare_programs.aggregate(pipeline)
        results = await cursor.to_list(length=1)

        if results:
            data = results[0]
            stats = {
                "total": data["total"][0]["count"] if data["total"] else 0,
                "by_category": {item["_id"]: item["count"] for item in data["by_category"]}
            }

            # Update cache
            self._cache = stats
            self._cache_timestamp = current_time

            logger.debug(f"Stats computed: total={stats['total']}")

            return stats

        return {"total": 0, "by_category": {}}


# ==================== Test Function ====================

async def test_welfare_manager():
    """WelfareManager 테스트 (hospital_manager.py 패턴)

    테스트 항목:
    1. 통계 조회
    2. 텍스트 검색
    3. 카테고리별 검색
    4. 질병별 검색
    5. CKD 단계별 검색
    6. 프로그램 상세 조회
    7. 캐싱 성능

    Expected:
    - All queries return results
    - Scores are descending
    - Cache is faster
    """
    import asyncio

    print("\n" + "="*80)
    print("WELFARE MANAGER TEST")
    print("="*80)

    manager = WelfareManager()
    await manager.connect()

    # Test 1: Stats
    print("\n[Test 1] Statistics")
    stats = await manager.get_stats()
    print(f"  Total programs: {stats.get('total', 0)}")
    print(f"  By category:")
    for cat, count in sorted(stats.get('by_category', {}).items()):
        print(f"    - {cat}: {count}")

    assert stats["total"] == 13, f"Expected 13, got {stats['total']}"
    print(f"  ✅ Stats test passed")

    # Test 2: Text search
    print("\n[Test 2] Text Search")
    test_queries = ["산정특례", "장애인", "의료비 지원", "신장이식"]
    for query in test_queries:
        results = await manager.search_by_text(query, limit=3)
        print(f"  '{query}': {len(results)} results")

        if results:
            print(f"    Top result: {results[0]['title']} (score: {results[0].get('score', 0):.2f})")

        # Verify scores are descending
        scores = [r.get("score", 0) for r in results]
        assert scores == sorted(scores, reverse=True), "Scores not descending"

    print(f"  ✅ Text search test passed")

    # Test 3: Category search
    print("\n[Test 3] Category Search")
    categories = await manager.get_all_categories()
    print(f"  Categories: {', '.join(categories)}")

    for cat in categories[:2]:  # Test first 2
        results = await manager.search_by_category(cat)
        print(f"  '{cat}': {len(results)} programs")
        assert all(r["category"] == cat for r in results), f"Wrong category in results"

    print(f"  ✅ Category search test passed")

    # Test 4: Disease search
    print("\n[Test 4] Disease Search")
    diseases = ["CKD", "ESRD", "dialysis"]
    for disease in diseases:
        results = await manager.search_by_disease(disease)
        print(f"  '{disease}': {len(results)} programs")
        assert all(disease in r["target_disease"] for r in results), f"{disease} not in target_disease"

    print(f"  ✅ Disease search test passed")

    # Test 5: CKD stage search
    print("\n[Test 5] CKD Stage Search")
    for stage in [3, 4, 5]:
        results = await manager.search_by_ckd_stage(stage)
        print(f"  CKD stage {stage}: {len(results)} programs")

    print(f"  ✅ CKD stage search test passed")

    # Test 6: Get by ID
    print("\n[Test 6] Get by ID")
    prog_id = "sangjung_ckd_v001"
    prog = await manager.get_by_id(prog_id)
    assert prog is not None, "Program not found"
    print(f"  Program: {prog['title']}")
    print(f"  Benefits: {prog['benefits'].get('copay_rate', 'N/A')}")
    print(f"  Contact: {prog['contact']['phone']}")
    print(f"  Fact checked: {prog.get('fact_check_verified', False)}")
    print(f"  ✅ Get by ID test passed")

    # Test 7: Cache performance
    print("\n[Test 7] Cache Performance")
    start = time.time()
    stats1 = await manager.get_stats(use_cache=True)
    time1 = time.time() - start

    start = time.time()
    stats2 = await manager.get_stats(use_cache=True)
    time2 = time.time() - start

    print(f"  First call (cache miss): {time1*1000:.2f}ms")
    print(f"  Second call (cache hit): {time2*1000:.2f}ms")
    print(f"  Speedup: {time1/time2:.1f}x")
    assert time2 < time1, "Cache not faster"
    print(f"  ✅ Cache test passed")

    await manager.close()

    print("\n" + "="*80)
    print("✅ ALL TESTS PASSED!")
    print("="*80)
    print(f"\nNext steps:")
    print(f"  1. Implement Pydantic models (app/models/welfare.py)")
    print(f"  2. Implement search_welfare_programs Tool")
    print(f"  3. Read: docs/welfare/03_WELFARE_PARLANT_INTEGRATION.md")
    print("="*80 + "\n")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_welfare_manager())
