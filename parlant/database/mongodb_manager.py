from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDBManager:
    """MongoDB 비동기 관리자"""
    
    def __init__(self, uri: str = None, db_name: str = "careguide"):
        self.uri = uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = db_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
    
    async def connect(self):
        """MongoDB 연결"""
        if not self.client:
            self.client = AsyncIOMotorClient(self.uri)
            self.db = self.client[self.db_name]
            await self.create_indexes()
            print(f"✅ MongoDB 연결 성공: {self.db_name}")
    
    async def close(self):
        """연결 종료"""
        if self.client:
            self.client.close()
            print("MongoDB 연결 종료")
    
    async def create_indexes(self):
        """인덱스 생성 - Kidney collections"""
        try:
            # QA Kidney 텍스트 검색 인덱스
            await self.db.qa_kidney.create_index(
                [("question", "text"), ("answer", "text")],
                name="qa_kidney_text_search"
            )
        except Exception as e:
            print(f"⚠️ QA Kidney 인덱스 생성 경고: {e}")

        try:
            # 논문 Kidney 텍스트 검색 인덱스
            await self.db.papers_kidney.create_index(
                [("title", "text"), ("abstract", "text")],
                name="paper_kidney_text_search"
            )
        except Exception as e:
            print(f"⚠️ 논문 Kidney 인덱스 생성 경고: {e}")

        try:
            # 논문 Kidney DOI 유니크 인덱스 (sparse)
            await self.db.papers_kidney.create_index(
                "doi",
                unique=True,
                sparse=True,
                name="doi_kidney_unique"
            )
        except Exception as e:
            print(f"⚠️ DOI Kidney 인덱스 생성 경고: {e}")

        try:
            # 의료 Kidney 데이터 텍스트 검색 인덱스
            await self.db.medical_kidney.create_index(
                [("text", "text"), ("keyword", "text")],
                name="medical_kidney_text_search"
            )
        except Exception as e:
            print(f"⚠️ 의료 Kidney 데이터 인덱스 생성 경고: {e}")
    
    # ==================== QA 데이터 ====================
    
    async def insert_qa_batch(self, qa_list: List[Dict], upsert: bool = True):
        """QA 배치 삽입
        
        Args:
            qa_list: [{"question": "...", "answer": "..."}, ...]
            upsert: True이면 중복 시 업데이트
        """
        if not qa_list:
            return
        
        if upsert:
            # question 해시 기반 upsert
            from hashlib import md5
            operations = []
            
            for qa in qa_list:
                q_hash = md5(qa["question"].encode()).hexdigest()
                operations.append({
                    "update_one": {
                        "filter": {"question_hash": q_hash},
                        "update": {
                            "$set": {
                                "question": qa["question"],
                                "answer": qa["answer"],
                                "question_hash": q_hash
                            }
                        },
                        "upsert": True
                    }
                })
            
            if operations:
                result = await self.db.qa_kidney.bulk_write(operations)
                print(f"✅ QA Kidney 데이터 삽입: {result.upserted_count}개 신규, {result.modified_count}개 업데이트")
        else:
            result = await self.db.qa_kidney.insert_many(qa_list, ordered=False)
            print(f"✅ QA Kidney 데이터 삽입: {len(result.inserted_ids)}개")

    async def search_qa(self, query: str, limit: int = 10) -> List[Dict]:
        """QA Kidney 텍스트 검색"""
        cursor = self.db.qa_kidney.find(
            {"$text": {"$search": query}},
            {
                "score": {"$meta": "textScore"},
                "question": 1,
                "answer": 1,
                "source_dataset": 1,  # Include source information for proper citation
                "_id": 1
            }
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)

        results = []
        async for doc in cursor:
            results.append(doc)

        return results
    
    # ==================== 논문 데이터 ====================
    
    async def insert_papers_batch(self, papers: List[Dict]) -> Dict:
        """논문 배치 삽입 (DOI 필수)
        
        Returns:
            {
                "inserted": ["title1", "title2", ...],
                "skipped": [
                    {"title": "...", "reason": "..."},
                    ...
                ]
            }
        """
        inserted = []
        skipped = []
        
        for paper in papers:
            # DOI 검증
            doi = paper.get("metadata", {}).get("doi")
            if not doi or doi.strip() == "":
                skipped.append({
                    "title": paper.get("title", "Unknown"),
                    "reason": "Missing DOI"
                })
                continue
            
            # 중복 체크 및 삽입
            try:
                await self.db.papers_kidney.update_one(
                    {"doi": doi},
                    {"$set": paper},
                    upsert=True
                )
                inserted.append(paper.get("title", "Unknown"))
            except Exception as e:
                skipped.append({
                    "title": paper.get("title", "Unknown"),
                    "reason": str(e)
                })

        print(f"✅ 논문 Kidney 삽입: {len(inserted)}개 성공, {len(skipped)}개 스킵")

        return {
            "inserted": inserted,
            "skipped": skipped
        }

    async def search_papers(self, query: str, limit: int = 10) -> List[Dict]:
        """논문 Kidney 텍스트 검색 - Abstract 포함"""
        cursor = self.db.papers_kidney.find(
            {"$text": {"$search": query}},
            {
                "score": {"$meta": "textScore"},
                "title": 1,
                "abstract": 1,  # ✅ Abstract 추가
                "source": 1,
                "metadata": 1,
                "_id": 1
            }
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)
        
        results = []
        async for doc in cursor:
            results.append(doc)
        
        return results
    
    async def get_paper_by_doi(self, doi: str) -> Optional[Dict]:
        """DOI로 논문 Kidney 조회"""
        return await self.db.papers_kidney.find_one({"doi": doi})
    
    # ==================== 의료 데이터 ====================
    
    async def insert_medical_batch(self, medical_list: List[Dict], upsert: bool = True):
        """의료 데이터 배치 삽입"""
        if not medical_list:
            return
        
        if upsert:
            from hashlib import md5
            operations = []
            
            for med in medical_list:
                # patent_id 또는 text 해시 기반
                if "patent_id" in med:
                    filter_key = {"patent_id": med["patent_id"]}
                else:
                    text_hash = md5(med["text"].encode()).hexdigest()
                    filter_key = {"text_hash": text_hash}
                    med["text_hash"] = text_hash
                
                operations.append({
                    "update_one": {
                        "filter": filter_key,
                        "update": {"$set": med},
                        "upsert": True
                    }
                })
            
            if operations:
                result = await self.db.medical_kidney.bulk_write(operations)
                print(f"✅ 의료 Kidney 데이터 삽입: {result.upserted_count}개 신규, {result.modified_count}개 업데이트")
        else:
            result = await self.db.medical_kidney.insert_many(medical_list, ordered=False)
            print(f"✅ 의료 Kidney 데이터 삽입: {len(result.inserted_ids)}개")

    async def search_medical(self, query: str, limit: int = 10) -> List[Dict]:
        """의료 Kidney 데이터 텍스트 검색"""
        cursor = self.db.medical_kidney.find(
            {"$text": {"$search": query}},
            {
                "score": {"$meta": "textScore"},
                "text": 1,
                "keyword": 1,
                "patent_id": 1,
                "_id": 1
            }
        ).sort([("score", {"$meta": "textScore"})]).limit(limit)
        
        results = []
        async for doc in cursor:
            results.append(doc)
        
        return results
    
    # ==================== 통계 ====================
    
    async def get_stats(self) -> Dict:
        """데이터베이스 통계 - Kidney collections"""
        qa_count = await self.db.qa_kidney.count_documents({})
        paper_count = await self.db.papers_kidney.count_documents({})
        medical_count = await self.db.medical_kidney.count_documents({})

        return {
            "qa_kidney": qa_count,
            "papers_kidney": paper_count,
            "medical_kidney": medical_count,
            "total": qa_count + paper_count + medical_count
        }
    
    # ==================== 마이그레이션 ====================
    
    async def migrate_from_jsonl(self, jsonl_path: str, collection_name: str):
        """JSONL → MongoDB 마이그레이션"""
        import json
        
        data = []
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for line in f:
                data.append(json.loads(line))
        
        if collection_name == "qa_kidney":
            await self.insert_qa_batch(data)
        elif collection_name == "papers_kidney":
            await self.insert_papers_batch(data)
        elif collection_name == "medical_kidney":
            await self.insert_medical_batch(data)
        
        print(f"✅ {jsonl_path} → {collection_name} 마이그레이션 완료")


# ==================== 테스트 ====================

async def test_mongodb():
    """MongoDB 기능 테스트"""
    manager = MongoDBManager()
    await manager.connect()
    
    # 통계 확인
    stats = await manager.get_stats()
    print(f"\n📊 데이터베이스 통계 (Kidney collections):")
    print(f"  - QA Kidney: {stats['qa_kidney']:,}개")
    print(f"  - 논문 Kidney: {stats['papers_kidney']:,}개")
    print(f"  - 의료 Kidney: {stats['medical_kidney']:,}개")
    print(f"  - 총합: {stats['total']:,}개")
    
    # 논문 검색 테스트 (Abstract 포함)
    print(f"\n🔍 논문 검색 테스트:")
    papers = await manager.search_papers("kidney disease", limit=2)
    for p in papers:
        print(f"\n📄 {p.get('title', 'N/A')}")
        print(f"   Abstract: {p.get('abstract', 'N/A')[:200]}...")
        print(f"   DOI: {p.get('metadata', {}).get('doi', 'N/A')}")
        print(f"   Score: {p.get('score', 0):.2f}")
    
    await manager.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_mongodb())
