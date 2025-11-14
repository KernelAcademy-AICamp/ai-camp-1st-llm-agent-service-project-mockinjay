import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from typing import List, Dict
import os
from dotenv import load_dotenv
from database.mongodb_manager import MongoDBManager
import asyncio

load_dotenv()


class VectorDBManager:
    """Pinecone Vector DB 관리자 - Kidney Medical Embeddings"""

    def __init__(self, index_name: str = "kidney-medical-embeddings"):
        self.index_name = index_name
        self.dimension = 384  # all-MiniLM-L6-v2 차원
        
        # Pinecone 초기화
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY not found in .env")
        
        self.pc = Pinecone(api_key=api_key)
        self.index = None
        
        # Sentence Transformer 모델
        print("📥 Sentence Transformer 모델 로딩 중...")
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        print("✅ 모델 로딩 완료")
    
    async def create_index(self):
        """Pinecone 인덱스 생성 또는 연결"""
        
        # 인덱스 존재 확인
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            print(f"📦 Pinecone 인덱스 생성 중: {self.index_name}")
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            print("✅ 인덱스 생성 완료")
        else:
            print(f"✅ 기존 인덱스 연결: {self.index_name}")
        
        self.index = self.pc.Index(self.index_name)
    
    def generate_embedding(self, text: str) -> List[float]:
        """텍스트 → 임베딩 벡터"""
        return self.model.encode(text).tolist()
    
    async def upsert_embeddings(
        self,
        docs: List[Dict],
        namespace: str,
        id_field: str = "_id",
        text_fields: List[str] = None
    ):
        """MongoDB 문서 → Pinecone 임베딩
        
        Args:
            docs: MongoDB 문서 리스트
            namespace: Pinecone 네임스페이스 (qa, papers, medical)
            id_field: 문서 ID 필드
            text_fields: 임베딩할 텍스트 필드 리스트
        """
        if not docs:
            print("⚠️ 임베딩할 문서가 없습니다")
            return
        
        vectors = []
        
        for doc in docs:
            # ID 추출
            doc_id = str(doc.get(id_field, ""))
            if not doc_id:
                continue
            
            # 텍스트 결합
            if text_fields:
                text_parts = [str(doc.get(field, "")) for field in text_fields]
                combined_text = " ".join(filter(None, text_parts))
            else:
                # 기본: 모든 문자열 필드 결합
                combined_text = " ".join([
                    str(v) for v in doc.values() 
                    if isinstance(v, str) and v
                ])
            
            if not combined_text.strip():
                continue
            
            # 임베딩 생성
            embedding = self.generate_embedding(combined_text)
            
            # 메타데이터 평탄화 (Pinecone 제약)
            metadata = self.flatten_metadata(doc)
            
            vectors.append({
                "id": doc_id,
                "values": embedding,
                "metadata": metadata
            })
        
        # 배치 업로드 (100개씩)
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            self.index.upsert(vectors=batch, namespace=namespace)
        
        print(f"✅ {len(vectors)}개 벡터 업로드 완료 (namespace: {namespace})")
    
    def flatten_metadata(self, doc: Dict) -> Dict:
        """메타데이터 평탄화 - Abstract 포함"""
        
        # _id는 ObjectId이므로 문자열 변환
        doc_id = str(doc.get("_id", ""))
        
        flat = {
            "doc_id": doc_id,
            "title": doc.get("title", "")[:500],  # Pinecone 제한 고려
            "abstract": doc.get("abstract", "")[:1000],  # ✅ Abstract 추가 (1000자 제한)
            "source": doc.get("source", ""),
            "question": doc.get("question", "")[:500],
            "answer": doc.get("answer", "")[:1000],
            "text": doc.get("text", "")[:1000],
            "keyword": doc.get("keyword", "")[:200],
        }
        
        # metadata 하위 필드
        if "metadata" in doc and isinstance(doc["metadata"], dict):
            metadata = doc["metadata"]
            flat["doi"] = metadata.get("doi", "")
            flat["pmid"] = str(metadata.get("pmid", ""))
            flat["journal"] = metadata.get("journal", "")[:200]
            flat["publication_date"] = metadata.get("publication_date", "")
            
            # 배열 필드 → 문자열 변환
            if "keywords" in metadata:
                keywords = metadata["keywords"]
                if isinstance(keywords, list):
                    flat["keywords"] = ", ".join(keywords[:5])  # 최대 5개
            
            if "authors" in metadata:
                authors = metadata["authors"]
                if isinstance(authors, list):
                    flat["authors"] = ", ".join(authors[:3])  # 최대 3명
        
        # None 값 제거 (Pinecone 요구사항)
        return {k: v for k, v in flat.items() if v}
    
    async def semantic_search(
        self,
        query: str,
        top_k: int = 10,
        namespace: str = "papers"
    ) -> List[Dict]:
        """의미론적 검색
        
        Returns:
            [
                {
                    "id": "doc_id",
                    "score": 0.85,
                    "metadata": {...}
                },
                ...
            ]
        """
        # 쿼리 임베딩
        query_embedding = self.generate_embedding(query)
        
        # Pinecone 검색
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True
        )
        
        # 결과 포맷팅
        matches = []
        for match in results.matches:
            matches.append({
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata
            })
        
        return matches


# ==================== MongoDB → Pinecone 임베딩 파이프라인 ====================

async def embed_all_data():
    """모든 MongoDB 데이터를 Pinecone에 임베딩"""
    
    mongo = MongoDBManager()
    await mongo.connect()
    
    vector_db = VectorDBManager()
    await vector_db.create_index()
    
    # 1. QA 데이터 임베딩
    print("\n📝 QA 데이터 임베딩 중...")
    qa_cursor = mongo.db.qa_data.find({})
    qa_docs = await qa_cursor.to_list(length=1000)
    
    if qa_docs:
        await vector_db.upsert_embeddings(
            docs=qa_docs,
            namespace="qa",
            text_fields=["question", "answer"]
        )
    
    # 2. 논문 데이터 임베딩 (Abstract 포함)
    print("\n📄 논문 데이터 임베딩 중...")
    paper_cursor = mongo.db.papers.find({})
    paper_docs = await paper_cursor.to_list(length=1000)
    
    if paper_docs:
        await vector_db.upsert_embeddings(
            docs=paper_docs,
            namespace="papers",
            text_fields=["title", "abstract"]  # ✅ Abstract 포함
        )
    
    # 3. 의료 데이터 임베딩
    print("\n🏥 의료 데이터 임베딩 중...")
    medical_cursor = mongo.db.medical_data.find({})
    medical_docs = await medical_cursor.to_list(length=1000)
    
    if medical_docs:
        await vector_db.upsert_embeddings(
            docs=medical_docs,
            namespace="medical",
            text_fields=["text", "keyword"]
        )
    
    await mongo.close()
    print("\n✅ 모든 데이터 임베딩 완료!")


# ==================== 테스트 ====================

async def test_semantic_search():
    """의미론적 검색 테스트"""
    
    vector_db = VectorDBManager()
    await vector_db.create_index()
    
    query = "chronic kidney disease treatment"
    
    print(f"\n🔍 의미론적 검색: '{query}'")
    
    # 논문 검색
    print("\n--- 논문 결과 ---")
    paper_results = await vector_db.semantic_search(query, top_k=3, namespace="papers")
    
    for i, result in enumerate(paper_results, 1):
        print(f"\n{i}. Score: {result['score']:.3f}")
        print(f"   Title: {result['metadata'].get('title', 'N/A')}")
        print(f"   Abstract: {result['metadata'].get('abstract', 'N/A')[:200]}...")  # ✅ Abstract 출력
        print(f"   DOI: {result['metadata'].get('doi', 'N/A')}")


if __name__ == "__main__":
    import asyncio
    
    # 전체 임베딩 실행
    asyncio.run(embed_all_data())
    
    # 테스트
    # asyncio.run(test_semantic_search())
