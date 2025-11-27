#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
영양소 조회 도구 - MongoDB에서 식품 영양 정보 검색
"""

import os
from typing import Optional, List, Dict, Any
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "careguide"


class NutrientLookupTool:
    """MongoDB 기반 영양소 조회 도구"""

    def __init__(self):
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client[DB_NAME]
        self.food_collection = self.db['food_nutrients']
        self.users_collection = self.db['users']

    def search_food(self, food_name: str, limit: int = 5) -> List[Dict[str, Any]]:
        """식품명으로 영양 정보 검색"""
        # 텍스트 검색
        results = list(self.food_collection.find(
            {"$text": {"$search": food_name}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(limit))

        # 텍스트 검색 결과 없으면 regex 검색
        if not results:
            results = list(self.food_collection.find(
                {"food_name": {"$regex": food_name, "$options": "i"}}
            ).limit(limit))

        # ObjectId 직렬화
        for r in results:
            r['_id'] = str(r['_id'])

        return results

    def get_food_nutrients(self, food_name: str) -> Optional[Dict[str, Any]]:
        """정확한 식품명으로 영양 정보 조회"""
        result = self.food_collection.find_one(
            {"food_name": {"$regex": f"^{food_name}$", "$options": "i"}}
        )

        if result:
            result['_id'] = str(result['_id'])

        return result

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """사용자 프로필 조회"""
        result = self.users_collection.find_one({"user_id": user_id})

        if result:
            result['_id'] = str(result['_id'])

        return result

    def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """사용자 프로필 업데이트"""
        from datetime import datetime

        profile_data['last_updated'] = datetime.now()

        result = self.users_collection.update_one(
            {"user_id": user_id},
            {"$set": profile_data},
            upsert=True
        )

        return result.modified_count > 0 or result.upserted_id is not None

    def analyze_meal_nutrients(
        self,
        foods: List[str],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        식사 영양소 분석 및 CKD 목표치 대비 평가

        Args:
            foods: 식품명 목록
            user_id: 사용자 ID (목표치 조회용)

        Returns:
            분석 결과 딕셔너리
        """
        # 영양소 합계
        total = {
            'sodium_mg': 0,
            'potassium_mg': 0,
            'phosphorus_mg': 0,
            'protein_g': 0,
            'calories': 0
        }

        found_foods = []
        not_found = []

        for food in foods:
            nutrient = self.get_food_nutrients(food)
            if nutrient:
                found_foods.append({
                    'name': nutrient.get('food_name'),
                    'sodium_mg': nutrient.get('sodium_mg', 0),
                    'potassium_mg': nutrient.get('potassium_mg', 0),
                    'phosphorus_mg': nutrient.get('phosphorus_mg', 0),
                    'protein_g': nutrient.get('protein_g', 0),
                    'calories': nutrient.get('calories', 0)
                })

                for key in total:
                    total[key] += nutrient.get(key, 0) or 0
            else:
                # 유사 검색 시도
                similar = self.search_food(food, limit=1)
                if similar:
                    nutrient = similar[0]
                    found_foods.append({
                        'name': nutrient.get('food_name'),
                        'matched_query': food,
                        'sodium_mg': nutrient.get('sodium_mg', 0),
                        'potassium_mg': nutrient.get('potassium_mg', 0),
                        'phosphorus_mg': nutrient.get('phosphorus_mg', 0),
                        'protein_g': nutrient.get('protein_g', 0),
                        'calories': nutrient.get('calories', 0)
                    })

                    for key in total:
                        total[key] += nutrient.get(key, 0) or 0
                else:
                    not_found.append(food)

        # 사용자 목표치 조회
        targets = None
        if user_id:
            profile = self.get_user_profile(user_id)
            if profile:
                targets = {
                    'sodium_mg': profile.get('target_sodium_mg', 2000),
                    'potassium_mg': profile.get('target_potassium_mg', 2500),
                    'phosphorus_mg': profile.get('target_phosphorus_mg', 1000),
                    'protein_g': profile.get('target_protein_g', 50)
                }

        # 기본 목표치 (CKD 3단계 기준)
        if not targets:
            targets = {
                'sodium_mg': 2000,
                'potassium_mg': 2500,
                'phosphorus_mg': 1000,
                'protein_g': 50
            }

        # 목표치 대비 퍼센트 계산
        percentages = {}
        warnings = []

        for nutrient, target in targets.items():
            if nutrient in total and target > 0:
                pct = (total[nutrient] / target) * 100
                percentages[nutrient] = round(pct, 1)

                # 경고 생성
                if pct > 80:
                    nutrient_name = {
                        'sodium_mg': '나트륨',
                        'potassium_mg': '칼륨',
                        'phosphorus_mg': '인',
                        'protein_g': '단백질'
                    }.get(nutrient, nutrient)

                    if pct > 100:
                        warnings.append(f"{nutrient_name} 초과 ({pct:.0f}%)")
                    else:
                        warnings.append(f"{nutrient_name} 주의 ({pct:.0f}%)")

        return {
            'foods': found_foods,
            'not_found': not_found,
            'total': total,
            'targets': targets,
            'percentages': percentages,
            'warnings': warnings,
            'is_safe': len(warnings) == 0
        }

    def get_safe_alternatives(
        self,
        food_name: str,
        nutrient_to_reduce: str = 'potassium_mg',
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        특정 영양소가 낮은 대체 식품 추천

        Args:
            food_name: 원본 식품명
            nutrient_to_reduce: 줄일 영양소 (potassium_mg, phosphorus_mg, sodium_mg)
            limit: 결과 수

        Returns:
            대체 식품 목록
        """
        # 원본 식품 카테고리 확인
        original = self.get_food_nutrients(food_name)
        category = original.get('category') if original else None

        # 같은 카테고리에서 해당 영양소가 낮은 식품 검색
        query = {}
        if category:
            query['category'] = category

        results = list(self.food_collection.find(query).sort(
            nutrient_to_reduce, 1
        ).limit(limit))

        for r in results:
            r['_id'] = str(r['_id'])

        return results


# LangChain Tool 래퍼
def create_nutrient_lookup_tool():
    """LangChain Tool로 래핑"""
    from langchain.tools import Tool

    lookup = NutrientLookupTool()

    def search_nutrients(query: str) -> str:
        """식품 영양 정보 검색"""
        results = lookup.search_food(query)
        if not results:
            return f"'{query}'에 대한 영양 정보를 찾을 수 없습니다."

        output = []
        for r in results:
            output.append(
                f"- {r.get('food_name')}: "
                f"나트륨 {r.get('sodium_mg', 0)}mg, "
                f"칼륨 {r.get('potassium_mg', 0)}mg, "
                f"인 {r.get('phosphorus_mg', 0)}mg, "
                f"단백질 {r.get('protein_g', 0)}g"
            )

        return "\n".join(output)

    return Tool(
        name="nutrient_lookup",
        description="식품의 영양 정보(나트륨, 칼륨, 인, 단백질)를 MongoDB에서 검색합니다. 입력: 식품명",
        func=search_nutrients
    )


if __name__ == "__main__":
    # 테스트
    tool = NutrientLookupTool()

    print("=== 영양소 조회 테스트 ===")

    # 검색 테스트
    results = tool.search_food("바나나")
    print(f"\n바나나 검색: {len(results)}건")
    for r in results:
        print(f"  - {r.get('food_name')}")

    # 분석 테스트
    analysis = tool.analyze_meal_nutrients(["밥", "김치", "된장국"])
    print(f"\n식사 분석:")
    print(f"  총 나트륨: {analysis['total']['sodium_mg']}mg")
    print(f"  총 칼륨: {analysis['total']['potassium_mg']}mg")
    print(f"  경고: {analysis['warnings']}")
