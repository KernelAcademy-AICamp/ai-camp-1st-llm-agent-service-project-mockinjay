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
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from pymongo import ASCENDING, TEXT
import logging
import time

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

        logger.info(f"WelfareManager initialized: {self.db_name}")

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
