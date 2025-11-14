import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from typing import List, Dict
from database.mongodb_manager import MongoDBManager
from database.vector_manager import VectorDBManager
from pubmed_advanced import PubMedAdvancedSearch
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()


class HybridSearchEngine:
    """하이브리드 검색 엔진 - MongoDB + Pinecone + PubMed (Kidney Data)"""

    def __init__(self):
        self.mongo = MongoDBManager()
        self.vector_db = VectorDBManager()  # Uses kidney-medical-embeddings by default
        self.pubmed = PubMedAdvancedSearch(email=os.getenv("PUBMED_EMAIL"))

        self.initialized = False
    
    async def initialize(self):
        """초기화"""
        if not self.initialized:
            await self.mongo.connect()
            await self.vector_db.create_index()
            self.initialized = True
            print("✅ 하이브리드 검색 엔진 초기화 완료")
    
    async def close(self):
        """연결 종료"""
        await self.mongo.close()
    
    async def search_all_sources(
        self,
        query: str,
        max_per_source: int = 5,
        use_semantic: bool = True,
        use_pubmed: bool = True
    ) -> Dict:
        """통합 검색 - 4개 소스 + 하이브리드 방식
        
        Returns:
            {
                "qa_results": [...],
                "paper_results": [...],
                "medical_results": [...],
                "pubmed_results": [...],
                "search_method": "hybrid"  # 또는 "keyword"
            }
        """
        await self.initialize()
        
        tasks = []
        
        # 1. QA 검색 (키워드 + 의미)
        if use_semantic:
            tasks.append(self._hybrid_qa_search(query, max_per_source))
        else:
            tasks.append(self._keyword_qa_search(query, max_per_source))
        
        # 2. 논문 검색 (키워드 + 의미)
        if use_semantic:
            tasks.append(self._hybrid_paper_search(query, max_per_source))
        else:
            tasks.append(self._keyword_paper_search(query, max_per_source))
        
        # 3. 의료 데이터 검색
        if use_semantic:
            tasks.append(self._hybrid_medical_search(query, max_per_source))
        else:
            tasks.append(self._keyword_medical_search(query, max_per_source))

        # 4. PubMed 검색 (선택적)
        if use_pubmed:
            tasks.append(self.pubmed.search_papers(query, max_per_source))
        else:
            tasks.append(asyncio.create_task(self._dummy_task()))

        # 병렬 실행
        results = await asyncio.gather(*tasks)

        return {
            "qa_results": results[0],
            "paper_results": results[1],
            "medical_results": [],  # Medical search is commented out, return empty list
            "pubmed_results": results[2] if use_pubmed else [],  # Fixed: PubMed is at index 2, not 3
            "search_method": "hybrid" if use_semantic else "keyword"
        }
    
    async def _dummy_task(self):
        """더미 태스크"""
        return []
    
    # ==================== 하이브리드 검색 (키워드 + 시맨틱) ====================
    
    async def _hybrid_qa_search(self, query: str, limit: int) -> List[Dict]:
        """QA Kidney 하이브리드 검색"""

        # 1. 키워드 검색 (MongoDB - qa_kidney collection)
        keyword_results = await self.mongo.search_qa(query, limit=limit)

        # 2. 시맨틱 검색 (Pinecone - qa_kidney namespace)
        semantic_matches = await self.vector_db.semantic_search(
            query,
            top_k=limit,
            namespace="qa_kidney"
        )

        # 3. 결과 병합 (중복 제거 + 점수 조합)
        merged = self._merge_results(keyword_results, semantic_matches, limit)

        return merged
    
    async def _hybrid_paper_search(self, query: str, limit: int) -> List[Dict]:
        """논문 Kidney 하이브리드 검색"""

        # 1. 키워드 검색 (MongoDB - papers_kidney collection)
        keyword_results = await self.mongo.search_papers(query, limit=limit)

        # 2. 시맨틱 검색 (Pinecone - papers_kidney namespace)
        semantic_matches = await self.vector_db.semantic_search(
            query,
            top_k=limit,
            namespace="papers_kidney"
        )

        # 3. 병합
        merged = self._merge_results(keyword_results, semantic_matches, limit)

        return merged
    
    async def _hybrid_medical_search(self, query: str, limit: int) -> List[Dict]:
        """의료 Kidney 데이터 하이브리드 검색"""

        keyword_results = await self.mongo.search_medical(query, limit=limit)
        semantic_matches = await self.vector_db.semantic_search(
            query,
            top_k=limit,
            namespace="medical_kidney"
        )

        merged = self._merge_results(keyword_results, semantic_matches, limit)

        return merged
    
    # ==================== 키워드 검색 (폴백) ====================
    
    async def _keyword_qa_search(self, query: str, limit: int) -> List[Dict]:
        return await self.mongo.search_qa(query, limit=limit)
    
    async def _keyword_paper_search(self, query: str, limit: int) -> List[Dict]:
        return await self.mongo.search_papers(query, limit=limit)
    
    async def _keyword_medical_search(self, query: str, limit: int) -> List[Dict]:
        return await self.mongo.search_medical(query, limit=limit)
    
    # ==================== 결과 병합 로직 ====================
    
    def _merge_results(
        self, 
        keyword_results: List[Dict],
        semantic_matches: List[Dict],
        limit: int
    ) -> List[Dict]:
        """키워드 + 시맨틱 결과 병합
        
        전략:
        1. ID 기반 중복 제거
        2. 점수 조합 (keyword_score * 0.4 + semantic_score * 0.6)
        3. 상위 limit개 반환
        """
        
        # ID → 문서 매핑
        merged_dict = {}
        
        # 1. 키워드 결과 (MongoDB textScore 정규화)
        max_keyword_score = max([r.get("score", 0) for r in keyword_results], default=1.0)
        
        for r in keyword_results:
            doc_id = str(r.get("_id", ""))
            normalized_score = r.get("score", 0) / max_keyword_score if max_keyword_score > 0 else 0
            
            merged_dict[doc_id] = {
                "data": r,
                "keyword_score": normalized_score,
                "semantic_score": 0.0
            }
        
        # 2. 시맨틱 결과 (Pinecone 코사인 유사도)
        for match in semantic_matches:
            doc_id = match["id"]
            semantic_score = match["score"]  # 이미 0~1 범위
            
            if doc_id in merged_dict:
                # 기존 문서 - 점수 업데이트
                merged_dict[doc_id]["semantic_score"] = semantic_score
            else:
                # 새 문서 - 추가
                merged_dict[doc_id] = {
                    "data": match["metadata"],
                    "keyword_score": 0.0,
                    "semantic_score": semantic_score
                }
        
        # 3. 최종 점수 계산 (가중 평균)
        for doc_id, info in merged_dict.items():
            info["final_score"] = (
                info["keyword_score"] * 0.4 + 
                info["semantic_score"] * 0.6
            )
        
        # 4. 정렬 및 반환
        sorted_results = sorted(
            merged_dict.values(),
            key=lambda x: x["final_score"],
            reverse=True
        )
        
        return [r["data"] for r in sorted_results[:limit]]


# ==================== 테스트 ====================

async def test_hybrid_search():
    """하이브리드 검색 테스트 - Abstract 포함 출력"""
    
    engine = HybridSearchEngine()
    
    query = "chronic kidney disease treatment"
    
    print(f"\n{'='*80}")
    print(f"🔍 검색 쿼리: {query}")
    print(f"{'='*80}\n")
    
    results = await engine.search_all_sources(
        query,
        max_per_source=2,
        use_semantic=True,
        use_pubmed=True
    )
    
    # ==================== QA 결과 ====================
    print(f"\n{'─'*80}")
    print(f"📝 QA 결과 ({len(results['qa_results'])}개)")
    print(f"{'─'*80}")
    
    for i, qa in enumerate(results['qa_results'], 1):
        print(f"\n{i}. Q: {qa.get('question', 'N/A')}")
        answer = qa.get('answer', 'N/A')
        print(f"   A: {answer[:300]}{'...' if len(answer) > 300 else ''}")
        if 'score' in qa:
            print(f"   📊 Score: {qa['score']:.3f}")
    
    # ==================== 논문 결과 (로컬 MongoDB) ====================
    print(f"\n{'─'*80}")
    print(f"📄 논문 결과 - 로컬 DB ({len(results['paper_results'])}개)")
    print(f"{'─'*80}")
    
    for i, paper in enumerate(results['paper_results'], 1):
        print(f"\n{i}. 📄 Title: {paper.get('title', 'N/A')}")
        
        # ✅ Abstract 출력
        abstract = paper.get('abstract', 'N/A')
        if abstract and abstract != 'N/A':
            print(f"   📝 Abstract: {abstract[:400]}{'...' if len(abstract) > 400 else ''}")
        else:
            print(f"   📝 Abstract: (없음)")
        
        print(f"   🔗 DOI: {paper.get('metadata', {}).get('doi', 'N/A')}")
        print(f"   📚 Journal: {paper.get('metadata', {}).get('journal', 'N/A')}")
        print(f"   📅 Date: {paper.get('metadata', {}).get('publication_date', 'N/A')}")
        
        if 'score' in paper:
            print(f"   📊 Score: {paper['score']:.3f}")
    
    # ==================== 의료 데이터 결과 ====================
    print(f"\n{'─'*80}")
    print(f"🏥 의료 데이터 결과 ({len(results['medical_results'])}개)")
    print(f"{'─'*80}")
    
    for i, med in enumerate(results['medical_results'], 1):
        text = med.get('text', 'N/A')
        print(f"\n{i}. Text: {text[:300]}{'...' if len(text) > 300 else ''}")
        print(f"   🏷️ Keyword: {med.get('keyword', 'N/A')}")
        if 'score' in med:
            print(f"   📊 Score: {med['score']:.3f}")
    
    # ==================== PubMed 결과 ====================
    print(f"\n{'─'*80}")
    print(f"🌐 PubMed 실시간 검색 결과 ({len(results['pubmed_results'])}개)")
    print(f"{'─'*80}")
    
    for i, pub in enumerate(results['pubmed_results'], 1):
        print(f"\n{i}. 📄 Title: {pub.get('title', 'N/A')}")
        
        # ✅ Abstract 출력
        abstract = pub.get('abstract', 'N/A')
        if abstract and abstract != 'N/A':
            print(f"   📝 Abstract: {abstract[:400]}{'...' if len(abstract) > 400 else ''}")
        else:
            print(f"   📝 Abstract: (없음)")
        
        print(f"   🔗 DOI: {pub.get('doi', 'N/A')}")
        print(f"   👥 Authors: {', '.join(pub.get('authors', [])[:3])}")
        print(f"   📚 Journal: {pub.get('journal', 'N/A')}")
        print(f"   🏷️ MeSH: {', '.join(pub.get('mesh_terms', [])[:5])}")
    
    # ==================== 요약 ====================
    print(f"\n{'='*80}")
    print(f"📊 검색 요약")
    print(f"{'='*80}")
    print(f"  - 검색 방법: {results['search_method']}")
    print(f"  - QA: {len(results['qa_results'])}개")
    print(f"  - 논문 (로컬): {len(results['paper_results'])}개")
    print(f"  - 의료: {len(results['medical_results'])}개")
    print(f"  - PubMed: {len(results['pubmed_results'])}개")
    print(f"  - 총 결과: {sum([len(results['qa_results']), len(results['paper_results']), len(results['medical_results']), len(results['pubmed_results'])])}개")
    print(f"{'='*80}\n")
    
    await engine.close()


if __name__ == "__main__":
    asyncio.run(test_hybrid_search())
