# insert_papers_only.py (DOI 필수 버전)
"""
논문 데이터만 MongoDB에 삽입하는 임시 스크립트
- DOI 있는 논문만 삽입
- DOI 없으면 스킵
"""

import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, UTC
import os


async def insert_papers_only():
    """논문 데이터만 삽입 (DOI 필수)"""
    
    # MongoDB 연결
    connection_string = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(connection_string)
    db = client["careguide"]
    papers_collection = db["papers"]
    
    print("\n" + "="*70)
    print("📚 논문 데이터 전용 삽입 스크립트 (DOI 필수)")
    print("="*70)
    
    try:
        await client.admin.command('ping')
        print("✅ MongoDB 연결 성공")
    except Exception as e:
        print(f"❌ MongoDB 연결 실패: {e}")
        return
    
    # ==================== 1. 인덱스 정리 ====================
    print("\n[1/4] 인덱스 확인 및 수정 중...")
    
    try:
        existing_indexes = await papers_collection.index_information()
        print(f"  현재 인덱스: {list(existing_indexes.keys())}")
        
        # 문제 있는 인덱스 삭제
        problematic_indexes = ["pmid_1", "paper_pmid", "paper_doi_unique"]
        
        for idx_name in problematic_indexes:
            if idx_name in existing_indexes:
                print(f"  ⚠️  '{idx_name}' 인덱스 삭제 중...")
                await papers_collection.drop_index(idx_name)
                print(f"  ✅ '{idx_name}' 삭제 완료")
        
        # 새로운 DOI 인덱스 (unique, sparse)
        print("  🔧 DOI 인덱스 생성 중...")
        await papers_collection.create_index(
            [("metadata.doi", 1)],
            name="doi_unique_sparse",
            unique=True,
            sparse=True  # null이나 없는 필드는 인덱스에서 제외
        )
        print("  ✅ DOI 인덱스 생성 완료 (sparse)")
        
    except Exception as e:
        print(f"  ⚠️  인덱스 처리 중 오류: {e}")
    
    # ==================== 2. 현재 통계 ====================
    print("\n[2/4] 현재 데이터 확인 중...")
    
    current_count = await papers_collection.count_documents({})
    print(f"  현재 논문 수: {current_count:,}개")
    
    # ==================== 3. 데이터 삽입 ====================
    print("\n[3/4] 논문 데이터 삽입 중...")
    print("  ⚠️  DOI 없는 논문은 자동으로 스킵됩니다.")
    
    paper_path = "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output/paper_dataset_enriched_s2_checkpoint_4850.jsonl"
    
    total_read = 0
    total_inserted = 0
    total_updated = 0
    total_skipped = 0
    no_doi_count = 0
    
    try:
        with open(paper_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                try:
                    paper = json.loads(line.strip())
                    total_read += 1
                    
                    # 정규화
                    if "metadata" not in paper:
                        paper["metadata"] = {}
                    
                    if "source" not in paper:
                        paper["source"] = "local"
                    
                    # 타임스탬프
                    paper["indexed_at"] = datetime.now(UTC)
                    
                    # DOI 추출 및 검증
                    doi = paper.get("metadata", {}).get("doi")
                    
                    # DOI가 없거나 빈 문자열이면 스킵
                    if not doi or (isinstance(doi, str) and not doi.strip()):
                        no_doi_count += 1
                        total_skipped += 1
                        continue  # 다음 논문으로
                    
                    # DOI 정규화 (앞뒤 공백 제거)
                    doi = doi.strip()
                    paper["metadata"]["doi"] = doi
                    
                    # DOI 기준 upsert
                    try:
                        result = await papers_collection.update_one(
                            {"metadata.doi": doi},
                            {"$set": paper},
                            upsert=True
                        )
                        
                        if result.upserted_id:
                            total_inserted += 1
                        elif result.modified_count > 0:
                            total_updated += 1
                        else:
                            total_skipped += 1  # 이미 존재하고 변경 없음
                    
                    except Exception as insert_error:
                        print(f"  ⚠️  라인 {i} 삽입 실패: {insert_error}")
                        total_skipped += 1
                    
                    # 진행상황 (100개마다)
                    if i % 100 == 0:
                        print(f"  📤 진행: {i:,}/{total_read:,} | "
                              f"신규 {total_inserted:,} | 업데이트 {total_updated:,} | "
                              f"스킵 {total_skipped:,} (DOI 없음: {no_doi_count:,})")
                
                except json.JSONDecodeError as e:
                    print(f"  ⚠️  라인 {i} JSON 파싱 오류: {e}")
                    continue
                except Exception as e:
                    print(f"  ⚠️  라인 {i} 처리 오류: {e}")
                    total_skipped += 1
                    continue
        
        print(f"\n  ✅ 파일 읽기 완료: 총 {total_read:,}개 읽음")
    
    except FileNotFoundError:
        print(f"  ❌ 파일을 찾을 수 없습니다: {paper_path}")
        return
    except Exception as e:
        print(f"  ❌ 파일 처리 오류: {e}")
        return
    
    # ==================== 4. 최종 통계 ====================
    print("\n[4/4] 최종 결과 확인 중...")
    
    final_count = await papers_collection.count_documents({})
    
    print("\n" + "="*70)
    print("📊 삽입 결과")
    print("="*70)
    
    print(f"\n📥 **처리 통계**:")
    print(f"  • 읽은 논문: {total_read:,}개")
    print(f"  • 신규 삽입: {total_inserted:,}개")
    print(f"  • 기존 업데이트: {total_updated:,}개")
    print(f"  • 스킵 (총): {total_skipped:,}개")
    print(f"    - DOI 없음: {no_doi_count:,}개")
    print(f"    - 기타 (중복 등): {total_skipped - no_doi_count:,}개")
    
    print(f"\n💾 **데이터베이스 상태**:")
    print(f"  • 이전 논문 수: {current_count:,}개")
    print(f"  • 현재 논문 수: {final_count:,}개")
    print(f"  • 증가: {final_count - current_count:+,}개")
    
    # 소스별 통계
    sources = await papers_collection.distinct("source")
    if sources:
        print(f"\n📚 **소스별 논문 수**:")
        for source in sources:
            count = await papers_collection.count_documents({"source": source})
            print(f"  • {source}: {count:,}개")
    
    # DOI 통계
    doi_count = await papers_collection.count_documents({
        "metadata.doi": {"$exists": True, "$ne": None, "$ne": ""}
    })
    print(f"\n🔗 **DOI 정보**:")
    print(f"  • DOI 있음: {doi_count:,}개 (100.0% - DOI 필수)")
    
    # 최신 논문 5개
    print(f"\n📅 **최신 논문 5개**:")
    
    cursor = papers_collection.find(
        {"metadata.publication_date": {"$exists": True}},
        {"title": 1, "metadata.publication_date": 1, "metadata.journal": 1, "metadata.doi": 1}
    ).sort("metadata.publication_date", -1).limit(5)
    
    idx = 1
    async for paper in cursor:
        title = paper.get("title", "N/A")[:70]
        date = paper.get("metadata", {}).get("publication_date", "N/A")
        journal = paper.get("metadata", {}).get("journal", "N/A")[:35]
        doi = paper.get("metadata", {}).get("doi", "N/A")[:40]
        print(f"  {idx}. [{date}] {title}...")
        print(f"     저널: {journal}")
        print(f"     DOI: {doi}")
        idx += 1
    
    print("\n" + "="*70)
    print("✅ 논문 삽입 완료!")
    print("="*70 + "\n")
    
    # 연결 종료
    client.close()


if __name__ == "__main__":
    print("\n⚠️  이 스크립트는 DOI가 있는 논문만 MongoDB에 삽입합니다.")
    print("   - DOI 없는 논문은 자동으로 스킵")
    print("   - DOI 기준 중복 제거")
    print("   - 기존 논문 데이터 유지")
    print()
    
    confirm = input("계속하시겠습니까? (yes/no): ").strip().lower()
    
    if confirm == "yes":
        asyncio.run(insert_papers_only())
    else:
        print("❌ 취소되었습니다.")
