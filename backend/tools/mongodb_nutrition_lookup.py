"""
MongoDB Nutrition Lookup Tool
MongoDB에서 음식/식재료 영양소 정보 조회
"""

import os
import logging
from typing import Dict, Any, Optional, List
from pymongo import MongoClient

logger = logging.getLogger(__name__)


class MongoDBNutritionLookup:
    """MongoDB 영양소 데이터 조회 도구"""

    def __init__(self):
        self.client = None
        self.db = None
        self._init_connection()

    def _init_connection(self):
        """MongoDB 연결 초기화"""
        try:
            mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            self.client = MongoClient(mongo_uri)
            self.db = self.client['careguide']
            logger.info("✅ MongoDB connection initialized for nutrition lookup")
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            self.client = None
            self.db = None

    def lookup_food_nutrients(self, food_name: str) -> Optional[Dict[str, Any]]:
        """
        음식명으로 영양소 정보 조회

        Args:
            food_name: 음식명 (예: "김치찌개", "닭가슴살")

        Returns:
            {
                "food_name": "음식명",
                "nutrients": {
                    "sodium": 나트륨(mg),
                    "potassium": 칼륨(mg),
                    "phosphorus": 인(mg),
                    "protein": 단백질(g),
                    "calcium": 칼슘(mg)
                },
                "serving_size": "1인분 기준량 (g)"
            }
        """
        if self.db is None:
            logger.warning("MongoDB not available")
            return None

        try:
            # food_nutrients 컬렉션에서 검색
            result = self.db.food_nutrients.find_one(
                {"food_name": {"$regex": food_name, "$options": "i"}}
            )

            if result:
                return {
                    "food_name": result.get("food_name"),
                    "nutrients": {
                        "sodium": result.get("sodium", 0),
                        "potassium": result.get("potassium", 0),
                        "phosphorus": result.get("phosphorus", 0),
                        "protein": result.get("protein", 0),
                        "calcium": result.get("calcium", 0)
                    },
                    "serving_size": result.get("serving_size", "100g")
                }
            else:
                logger.info(f"No nutrition data found for: {food_name}")
                return None

        except Exception as e:
            logger.error(f"MongoDB lookup failed: {e}")
            return None

    def check_daily_limits(
        self,
        nutrients: Dict[str, float],
        meal_fraction: float = 1/3
    ) -> Dict[str, Any]:
        """
        1일 1식 제한량 초과 여부 확인

        Args:
            nutrients: 영양소 딕셔너리 {sodium, potassium, phosphorus, protein, calcium}
            meal_fraction: 하루 중 몇 끼 기준인지 (1/3 = 1끼, 1/2 = 반나절)

        Returns:
            {
                "is_safe": True/False,
                "exceeded_nutrients": ["sodium", "potassium", ...],
                "nutrient_status": {
                    "sodium": {"value": 700, "limit": 667, "status": "warning", "percentage": 105},
                    ...
                }
            }
        """
        # 신장병 환자 1일 권장량 (CKD 3-5단계 기준)
        DAILY_LIMITS = {
            "sodium": 2000,      # mg
            "potassium": 2000,   # mg
            "phosphorus": 800,   # mg
            "protein": 50,       # g
            "calcium": 1000      # mg
        }

        # 1끼 기준 제한량
        meal_limits = {k: v * meal_fraction for k, v in DAILY_LIMITS.items()}

        exceeded = []
        nutrient_status = {}

        for nutrient, value in nutrients.items():
            if nutrient not in DAILY_LIMITS:
                continue

            limit = meal_limits[nutrient]
            percentage = (value / limit) * 100

            # 상태 판정
            if percentage < 70:
                status = "safe"
            elif percentage < 100:
                status = "warning"
            else:
                status = "danger"
                exceeded.append(nutrient)

            nutrient_status[nutrient] = {
                "value": value,
                "limit": limit,
                "status": status,
                "percentage": round(percentage, 1)
            }

        return {
            "is_safe": len(exceeded) == 0,
            "exceeded_nutrients": exceeded,
            "nutrient_status": nutrient_status
        }

    def search_alternative_ingredients(
        self,
        exceeded_nutrients: List[str],
        exclude_foods: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        초과된 영양소를 기준으로 대체 가능한 저영양소 식재료 검색

        Args:
            exceeded_nutrients: 초과된 영양소 리스트 ["sodium", "potassium"]
            exclude_foods: 제외할 음식 리스트

        Returns:
            List of alternative ingredients sorted by safety
        """
        if self.db is None:
            return []

        try:
            # 쿼리 조건 생성: 초과된 영양소가 낮은 식재료 찾기
            query = {}

            # 예: sodium이 초과되면 sodium < 200mg인 식재료 찾기
            for nutrient in exceeded_nutrients:
                if nutrient == "sodium":
                    query["sodium"] = {"$lt": 200}
                elif nutrient == "potassium":
                    query["potassium"] = {"$lt": 300}
                elif nutrient == "phosphorus":
                    query["phosphorus"] = {"$lt": 150}

            # 제외할 음식
            if exclude_foods:
                query["food_name"] = {"$nin": exclude_foods}

            # 검색
            results = list(self.db.food_nutrients.find(query).limit(10))

            alternatives = []
            for result in results:
                alternatives.append({
                    "food_name": result.get("food_name"),
                    "nutrients": {
                        "sodium": result.get("sodium", 0),
                        "potassium": result.get("potassium", 0),
                        "phosphorus": result.get("phosphorus", 0),
                        "protein": result.get("protein", 0),
                        "calcium": result.get("calcium", 0)
                    },
                    "serving_size": result.get("serving_size", "100g")
                })

            return alternatives

        except Exception as e:
            logger.error(f"Alternative ingredient search failed: {e}")
            return []


# Singleton instance
_nutrition_lookup = None


def get_nutrition_lookup() -> MongoDBNutritionLookup:
    """Get singleton nutrition lookup instance"""
    global _nutrition_lookup
    if _nutrition_lookup is None:
        _nutrition_lookup = MongoDBNutritionLookup()
    return _nutrition_lookup
