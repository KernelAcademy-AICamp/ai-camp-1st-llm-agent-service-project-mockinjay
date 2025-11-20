"""
Hospital Data Manager - 병원/약국/투석 데이터 관리
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Optional, Tuple
import os
from dotenv import load_dotenv
from pymongo import ASCENDING, TEXT, GEOSPHERE
import logging
import time

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HospitalManager:
    """병원/약국/투석 데이터를 관리하는 비동기 매니저"""

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

    async def connect(self):
        """Connect to MongoDB with optimized settings"""
        if not self.client:
            self.client = AsyncIOMotorClient(
                self.uri,
                maxPoolSize=self.max_pool_size,
                minPoolSize=self.min_pool_size,
                maxIdleTimeMS=30000,
                waitQueueTimeoutMS=10000,  # 10 seconds
                serverSelectionTimeoutMS=30000,  # 30 seconds (increased for network latency)
                connectTimeoutMS=10000,  # 10 seconds (increased from 2s)
                socketTimeoutMS=30000  # 30 seconds (increased from 10s)
            )
            self.db = self.client[self.db_name]

            # Create indexes
            await self.create_indexes()

            logger.info(f"✅ Hospital Manager connected: {self.db_name}")
            logger.info(f"   Pool size: {self.min_pool_size}-{self.max_pool_size}")

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

        # Projection - 필요한 필드만 선택
        projection = {
            "score": {"$meta": "textScore"},
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
        query = {"region": region}

        if type:
            query["type"] = type

        if has_dialysis is not None:
            query["has_dialysis_unit"] = has_dialysis

        if night_dialysis is not None:
            query["night_dialysis"] = night_dialysis

        projection = {
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
            "_id": 1
        }

        cursor = self.db.hospitals.find(query, projection).limit(limit)
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

        # Add distance calculation
        pipeline.extend([
            {
                "$addFields": {
                    "distance_km": {
                        "$divide": [
                            {
                                "$sqrt": {
                                    "$add": [
                                        {
                                            "$pow": [
                                                {"$subtract": ["$lat", latitude]},
                                                2
                                            ]
                                        },
                                        {
                                            "$pow": [
                                                {"$subtract": ["$lng", longitude]},
                                                2
                                            ]
                                        }
                                    ]
                                }
                            },
                            0.009  # Approximate conversion to km (1 degree ≈ 111km, so 0.009 ≈ 1km)
                        ]
                    }
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
        from bson import ObjectId

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

        if region:
            query["region"] = region

        if night_only:
            query["night_dialysis"] = True

        if min_machines > 0:
            query["dialysis_machines"] = {"$gte": min_machines}

        projection = {
            "name": 1,
            "address": 1,
            "phone": 1,
            "region": 1,
            "type": 1,
            "dialysis_machines": 1,
            "night_dialysis": 1,
            "dialysis_days": 1,
            "lat": 1,
            "lng": 1,
            "naver_map_url": 1,
            "kakao_map_url": 1,
            "_id": 1
        }

        cursor = self.db.hospitals.find(query, projection).sort("dialysis_machines", -1).limit(limit)
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
    print("\n[서울 지역 투석 병원 검색]")
    seoul_dialysis = await manager.search_by_region(
        region="서울",
        has_dialysis=True,
        limit=5
    )
    for hospital in seoul_dialysis:
        print(f"  - {hospital['name']} ({hospital['dialysis_machines']}대)")

    # Test 3: Text search
    print("\n[텍스트 검색: '신촌']")
    results = await manager.search_by_text("신촌", limit=5)
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
