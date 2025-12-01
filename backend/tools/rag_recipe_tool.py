#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG 레시피 검색 도구 - FAISS 벡터스토어에서 대체 레시피 및 가이드라인 검색
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
VECTORSTORE_PATH = PROJECT_ROOT / "backend" / "rag" / "vectorstore" / "nutrition_rag"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class RAGRecipeTool:
    """FAISS 기반 RAG 레시피 검색 도구"""

    def __init__(self):
        self.vectorstore = None
        self._load_vectorstore()

    def _load_vectorstore(self):
        """벡터스토어 로드"""
        if not VECTORSTORE_PATH.exists():
            print(f"[경고] 벡터스토어가 없습니다: {VECTORSTORE_PATH}")
            print("먼저 rag_loader.py를 실행해주세요.")
            return

        try:
            from langchain_openai import OpenAIEmbeddings
            from langchain_community.vectorstores import FAISS

            embeddings = OpenAIEmbeddings(
                openai_api_key=OPENAI_API_KEY,
                model="text-embedding-3-small"
            )

            self.vectorstore = FAISS.load_local(
                str(VECTORSTORE_PATH),
                embeddings,
                allow_dangerous_deserialization=True
            )

            print(f"[RAG] 벡터스토어 로드 완료: {VECTORSTORE_PATH}")

        except Exception as e:
            print(f"[오류] 벡터스토어 로드 실패: {e}")

    def search_recipes(
        self,
        query: str,
        k: int = 3,
        filter_metadata: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        레시피 및 가이드라인 검색

        Args:
            query: 검색 쿼리
            k: 결과 수
            filter_metadata: 메타데이터 필터

        Returns:
            검색 결과 목록
        """
        if not self.vectorstore:
            return []

        try:
            if filter_metadata:
                results = self.vectorstore.similarity_search(
                    query, k=k, filter=filter_metadata
                )
            else:
                results = self.vectorstore.similarity_search(query, k=k)

            return [
                {
                    'content': doc.page_content,
                    'metadata': doc.metadata,
                    'source': doc.metadata.get('source_file', 'unknown')
                }
                for doc in results
            ]

        except Exception as e:
            print(f"[오류] 검색 실패: {e}")
            return []

    def search_with_score(
        self,
        query: str,
        k: int = 3
    ) -> List[Dict[str, Any]]:
        """점수와 함께 검색"""
        if not self.vectorstore:
            return []

        try:
            results = self.vectorstore.similarity_search_with_score(query, k=k)

            return [
                {
                    'content': doc.page_content,
                    'metadata': doc.metadata,
                    'source': doc.metadata.get('source_file', 'unknown'),
                    'score': float(score)
                }
                for doc, score in results
            ]

        except Exception as e:
            print(f"[오류] 검색 실패: {e}")
            return []

    def get_low_potassium_recipes(self, food_type: str = "") -> List[Dict[str, Any]]:
        """저칼륨 레시피 검색"""
        query = f"저칼륨 {food_type} 레시피 조리법".strip()
        return self.search_recipes(query, k=5)

    def get_low_phosphorus_recipes(self, food_type: str = "") -> List[Dict[str, Any]]:
        """저인 레시피 검색"""
        query = f"인 제한 {food_type} 레시피 조리법".strip()
        return self.search_recipes(query, k=5)

    def get_low_sodium_recipes(self, food_type: str = "") -> List[Dict[str, Any]]:
        """저나트륨 레시피 검색"""
        query = f"저염 나트륨 줄이기 {food_type} 레시피".strip()
        return self.search_recipes(query, k=5)

    def get_ckd_guidelines(self, stage: int = 3) -> List[Dict[str, Any]]:
        """CKD 단계별 식이 가이드라인 검색"""
        query = f"만성 신부전 {stage}단계 식이요법 가이드라인 권장"
        return self.search_recipes(query, k=5)

    def get_dialysis_guidelines(self) -> List[Dict[str, Any]]:
        """투석 환자 식이 가이드라인 검색"""
        query = "혈액투석 복막투석 환자 식단 영양 관리 가이드"
        return self.search_recipes(query, k=5)

    def get_alternative_foods(
        self,
        high_risk_food: str,
        nutrient: str = "칼륨"
    ) -> List[Dict[str, Any]]:
        """
        고위험 식품의 대체 식품 검색

        Args:
            high_risk_food: 고위험 식품명 (예: 바나나)
            nutrient: 제한 영양소 (칼륨/인/나트륨)

        Returns:
            대체 식품 정보
        """
        query = f"{high_risk_food} 대신 {nutrient} 낮은 대체 식품 추천"
        return self.search_recipes(query, k=3)

    def format_results_for_chat(self, results: List[Dict[str, Any]]) -> str:
        """검색 결과를 채팅용 텍스트로 포맷"""
        if not results:
            return "관련 정보를 찾을 수 없습니다."

        output = []
        for i, r in enumerate(results, 1):
            content = r['content'][:500] + "..." if len(r['content']) > 500 else r['content']
            source = r.get('source', 'unknown')
            output.append(f"[{i}] ({source})\n{content}")

        return "\n\n".join(output)


# LangChain Tool 래퍼
def create_rag_recipe_tool():
    """LangChain Tool로 래핑"""
    from langchain.tools import Tool

    rag = RAGRecipeTool()

    def search_ckd_recipes(query: str) -> str:
        """CKD 환자를 위한 레시피 및 가이드라인 검색"""
        results = rag.search_recipes(query)
        return rag.format_results_for_chat(results)

    return Tool(
        name="rag_recipe_search",
        description="CKD 환자를 위한 저칼륨/저인/저나트륨 레시피, 대체 식품, 식이 가이드라인을 검색합니다. 입력: 검색 쿼리",
        func=search_ckd_recipes
    )


if __name__ == "__main__":
    # 테스트
    tool = RAGRecipeTool()

    print("=== RAG 레시피 검색 테스트 ===")

    # 저칼륨 레시피 검색
    results = tool.get_low_potassium_recipes("반찬")
    print(f"\n저칼륨 반찬 레시피: {len(results)}건")
    for r in results:
        print(f"  - {r['source']}: {r['content'][:100]}...")

    # 대체 식품 검색
    results = tool.get_alternative_foods("바나나", "칼륨")
    print(f"\n바나나 대체 식품: {len(results)}건")

    # 가이드라인 검색
    results = tool.get_ckd_guidelines(3)
    print(f"\nCKD 3단계 가이드라인: {len(results)}건")
