"""
Recipe Generator - 저염식/저칼륨/저인 레시피 생성
사용자 프로필 기반으로 고영양소 식재료를 대체하여 안전한 레시피 생성
"""
import os
import logging
from typing import Dict, Any, List, Optional
from pymongo import MongoClient

logger = logging.getLogger(__name__)


class RecipeGenerator:
    """CKD 환자를 위한 레시피 생성기"""

    # 식재료 재료군 분류
    INGREDIENT_GROUPS = {
        "채소류": ["배추", "양배추", "무", "당근", "오이", "가지", "애호박", "시금치", "상추", "깻잎"],
        "양념류": ["소금", "간장", "된장", "고춧가루", "고추장", "마늘", "생강", "파", "양파", "설탕"],
        "단백질류": ["돼지고기", "쇠고기", "닭고기", "생선", "두부", "계란", "새우", "오징어"],
        "곡물류": ["쌀", "현미", "보리", "밀가루", "국수", "�떡"],
        "해조류": ["김", "미역", "다시마", "파래"],
        "유제품": ["우유", "치즈", "요구르트"],
        "과일류": ["사과", "배", "딸기", "포도", "수박", "참외"]
    }

    # CKD 단계별 디폴트 목표 수치 (1일 1식 기준 = 1/3 daily)
    CKD_STAGE_LIMITS = {
        "CKD_3": {
            "sodium": 667,      # 2000mg / 3
            "potassium": 667,   # 2000mg / 3
            "phosphorus": 267,  # 800mg / 3
            "protein": 20,      # 60g / 3
            "calcium": 333      # 1000mg / 3
        },
        "CKD_4": {
            "sodium": 600,
            "potassium": 600,
            "phosphorus": 233,
            "protein": 17,
            "calcium": 333
        },
        "CKD_5": {
            "sodium": 533,      # More strict
            "potassium": 533,
            "phosphorus": 200,
            "protein": 13,
            "calcium": 333
        },
        "default": {  # 디폴트 (CKD_3 기준)
            "sodium": 667,
            "potassium": 667,
            "phosphorus": 267,
            "protein": 20,
            "calcium": 333
        }
    }

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
            logger.info("✅ MongoDB connection initialized for recipe generator")
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            self.client = None
            self.db = None

    def get_user_limits(
        self,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """
        사용자 프로필에서 목표 수치 가져오기

        Args:
            user_profile: {
                "ckd_stage": "CKD_3" | "CKD_4" | "CKD_5",
                "custom_limits": {"sodium": 500, ...}  # 선택적
            }

        Returns:
            목표 영양소 수치 (1일 1식 기준)
        """
        if not user_profile:
            logger.info("No user profile - using default limits")
            return self.CKD_STAGE_LIMITS["default"]

        # 커스텀 목표 수치가 있으면 우선 사용
        if "custom_limits" in user_profile:
            logger.info("Using custom limits from user profile")
            return user_profile["custom_limits"]

        # CKD 단계별 목표 수치 사용
        ckd_stage = user_profile.get("ckd_stage", "default")
        limits = self.CKD_STAGE_LIMITS.get(ckd_stage, self.CKD_STAGE_LIMITS["default"])
        logger.info(f"Using {ckd_stage} limits: {limits}")
        return limits

    def find_ingredient_group(self, ingredient_name: str) -> Optional[str]:
        """
        식재료가 속한 재료군 찾기

        Args:
            ingredient_name: 식재료 이름

        Returns:
            재료군 이름 (예: "채소류", "양념류")
        """
        for group_name, ingredients in self.INGREDIENT_GROUPS.items():
            for ing in ingredients:
                if ing in ingredient_name or ingredient_name in ing:
                    return group_name
        return None

    def get_low_nutrient_alternatives(
        self,
        ingredient_name: str,
        ingredient_group: str,
        exceeded_nutrients: List[str]
    ) -> List[Dict[str, Any]]:
        """
        같은 재료군에서 낮은 영양소 대체 식재료 찾기

        Args:
            ingredient_name: 대체할 식재료
            ingredient_group: 재료군 (예: "채소류")
            exceeded_nutrients: 초과된 영양소 리스트

        Returns:
            대체 가능한 식재료 리스트
        """
        if self.db is None:
            return []

        try:
            # 같은 재료군의 식재료들 찾기
            group_ingredients = self.INGREDIENT_GROUPS.get(ingredient_group, [])

            # MongoDB 쿼리 조건 생성
            query = {}

            # 초과된 영양소가 낮은 식재료 찾기
            for nutrient in exceeded_nutrients:
                if nutrient == "sodium":
                    query["sodium"] = {"$lt": 200}
                elif nutrient == "potassium":
                    query["potassium"] = {"$lt": 300}
                elif nutrient == "phosphorus":
                    query["phosphorus"] = {"$lt": 150}
                elif nutrient == "protein":
                    query["protein"] = {"$lt": 10}

            # 같은 재료군 내에서 검색 (정규식으로 부분 매칭)
            group_regex = "|".join(group_ingredients)
            query["food_name"] = {"$regex": group_regex, "$options": "i"}

            # 원본 재료는 제외
            query["food_name"]["$not"] = {"$regex": ingredient_name, "$options": "i"}

            results = list(self.db.food_nutrients.find(query).limit(5))

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
                    "ingredient_group": ingredient_group
                })

            return alternatives

        except Exception as e:
            logger.error(f"Alternative search failed: {e}")
            return []

    def identify_high_nutrient_ingredients(
        self,
        recipe_ingredients: List[str],
        target_limits: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        레시피에서 고영양소 식재료 식별

        Args:
            recipe_ingredients: 레시피 식재료 리스트
            target_limits: 목표 영양소 수치

        Returns:
            고영양소 식재료 리스트 with exceeded_nutrients
        """
        if self.db is None:
            return []

        high_nutrient_ingredients = []

        for ingredient in recipe_ingredients:
            try:
                # MongoDB에서 영양소 조회
                result = self.db.food_nutrients.find_one(
                    {"food_name": {"$regex": ingredient, "$options": "i"}}
                )

                if result:
                    nutrients = {
                        "sodium": result.get("sodium", 0),
                        "potassium": result.get("potassium", 0),
                        "phosphorus": result.get("phosphorus", 0),
                        "protein": result.get("protein", 0),
                        "calcium": result.get("calcium", 0)
                    }

                    # 초과된 영양소 확인
                    exceeded = []
                    for nutrient, value in nutrients.items():
                        limit = target_limits.get(nutrient, float('inf'))
                        # 개별 식재료가 목표치의 30% 이상이면 "높음"으로 간주
                        if value > limit * 0.3:
                            exceeded.append(nutrient)

                    if exceeded:
                        ingredient_group = self.find_ingredient_group(ingredient)
                        high_nutrient_ingredients.append({
                            "food_name": ingredient,
                            "nutrients": nutrients,
                            "exceeded_nutrients": exceeded,
                            "ingredient_group": ingredient_group
                        })

            except Exception as e:
                logger.error(f"Failed to check ingredient {ingredient}: {e}")

        return high_nutrient_ingredients

    def generate_low_nutrient_recipe(
        self,
        original_recipe_name: str,
        original_ingredients: List[str],
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        저염식/저칼륨/저인 레시피 생성

        Args:
            original_recipe_name: 원본 레시피 이름 (예: "김치")
            original_ingredients: 원본 식재료 리스트
            user_profile: 사용자 프로필 (질환 단계, 목표 수치)

        Returns:
            {
                "recipe_name": "저염식 김치",
                "original_ingredients": [...],
                "substitutions": [
                    {
                        "original": "소금",
                        "replacement": "식초",
                        "reason": "나트륨 함량이 낮음",
                        "ingredient_group": "양념류"
                    }
                ],
                "modified_ingredients": [...],
                "user_limits": {...},
                "cooking_instructions": "LLM 생성 레시피"
            }
        """
        # 1. 사용자 목표 수치 가져오기
        target_limits = self.get_user_limits(user_profile)
        logger.info(f"Target limits for recipe: {target_limits}")

        # 2. 고영양소 식재료 식별
        high_nutrient_ingredients = self.identify_high_nutrient_ingredients(
            original_ingredients,
            target_limits
        )

        logger.info(f"High nutrient ingredients found: {len(high_nutrient_ingredients)}")

        # 3. 대체 식재료 찾기
        substitutions = []
        modified_ingredients = original_ingredients.copy()

        for high_ing in high_nutrient_ingredients:
            ingredient_name = high_ing["food_name"]
            ingredient_group = high_ing["ingredient_group"]
            exceeded_nutrients = high_ing["exceeded_nutrients"]

            if ingredient_group:
                # 같은 재료군에서 대체품 찾기
                alternatives = self.get_low_nutrient_alternatives(
                    ingredient_name,
                    ingredient_group,
                    exceeded_nutrients
                )

                if alternatives:
                    best_alternative = alternatives[0]
                    substitutions.append({
                        "original": ingredient_name,
                        "replacement": best_alternative["food_name"],
                        "reason": f"{', '.join(exceeded_nutrients)} 함량이 낮음",
                        "ingredient_group": ingredient_group,
                        "original_nutrients": high_ing["nutrients"],
                        "replacement_nutrients": best_alternative["nutrients"]
                    })

                    # 식재료 리스트 업데이트
                    if ingredient_name in modified_ingredients:
                        idx = modified_ingredients.index(ingredient_name)
                        modified_ingredients[idx] = best_alternative["food_name"]

        logger.info(f"Generated {len(substitutions)} substitutions")

        return {
            "recipe_name": f"저염식 {original_recipe_name}",
            "original_ingredients": original_ingredients,
            "substitutions": substitutions,
            "modified_ingredients": modified_ingredients,
            "user_limits": target_limits,
            "ckd_stage": user_profile.get("ckd_stage", "default") if user_profile else "default"
        }


# Singleton instance
_recipe_generator = None


def get_recipe_generator() -> RecipeGenerator:
    """Get singleton recipe generator instance"""
    global _recipe_generator
    if _recipe_generator is None:
        _recipe_generator = RecipeGenerator()
    return _recipe_generator
