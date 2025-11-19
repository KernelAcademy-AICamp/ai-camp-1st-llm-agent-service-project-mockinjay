"""
Welfare Programs Data Loading Script

실제 정부 공공데이터 기반 복지 프로그램을 MongoDB에 로드합니다.
- 공공데이터포털 (data.go.kr)
- 국민건강보험공단, 보건복지부, 질병관리청 공식 정보
- 2024-2025년 최신 프로그램 (Fact Check 완료)

Usage:
    cd data/welfare
    python load_welfare_data.py

Data Source:
    processed/welfare_programs_2025_verified.json (검증 완료)
"""

from pymongo import MongoClient, ASCENDING, TEXT
from datetime import datetime
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
load_dotenv(project_root / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATA_FILE = Path(__file__).parent / "welfare_programs_2025_verified.json"


def load_welfare_data():
    """Load welfare programs from JSON file to MongoDB"""
    print("\n" + "="*80)
    print("WELFARE PROGRAMS DATA LOADING")
    print("공공데이터 기반 복지 프로그램 로딩 (2024-2025 검증 완료)")
    print("="*80)

    # 1. Load JSON data
    print(f"\n[1] Loading JSON data from file...")
    print(f"    File: {DATA_FILE}")

    if not DATA_FILE.exists():
        print(f"    ❌ File not found: {DATA_FILE}")
        print(f"    Please ensure welfare_programs_2025_verified.json exists in processed/")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    metadata = data.get("metadata", {})
    programs_raw = data.get("programs", [])

    print(f"    ✅ Loaded {len(programs_raw)} programs from JSON")
    print(f"    Version: {metadata.get('version')}")
    print(f"    Data sources: {len(metadata.get('data_sources', []))}")
    print(f"    Fact check verified: {metadata.get('validation_status')}")

    # 2. Add timestamps to each program
    print(f"\n[2] Preparing programs for MongoDB...")
    welfare_programs = []
    for prog in programs_raw:
        prog_with_timestamp = prog.copy()
        prog_with_timestamp["created_at"] = datetime.utcnow()
        prog_with_timestamp["updated_at"] = datetime.utcnow()
        welfare_programs.append(prog_with_timestamp)

    print(f"    ✅ Prepared {len(welfare_programs)} programs with timestamps")

    # 3. Connect to MongoDB
    print(f"\n[3] Connecting to MongoDB...")
    print(f"    URI: {MONGODB_URI}")

    try:
        client = MongoClient(MONGODB_URI)
        db = client["careguide"]
        collection = db["welfare_programs"]
        print(f"    ✅ Connected to {db.name}.{collection.name}")
    except Exception as e:
        print(f"    ❌ Connection failed: {e}")
        return

    # 4. Clear existing data
    print(f"\n[4] Clearing existing data...")
    deleted = collection.delete_many({})
    print(f"    ✅ Deleted {deleted.deleted_count} existing documents")

    # 5. Insert new data
    print(f"\n[5] Inserting {len(welfare_programs)} welfare programs...")
    try:
        result = collection.insert_many(welfare_programs)
        print(f"    ✅ Inserted {len(result.inserted_ids)} programs")
    except Exception as e:
        print(f"    ❌ Insert failed: {e}")
        client.close()
        return

    # 6. Create indexes
    print(f"\n[6] Creating indexes...")

    # Category index
    try:
        collection.create_index([("category", ASCENDING)], name="category_idx")
        print(f"    ✅ Created category_idx")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"    ⚠️ category_idx: {e}")

    # Text search index (None for multilingual support)
    try:
        collection.create_index(
            [("title", TEXT), ("description", TEXT), ("keywords", TEXT)],
            name="welfare_text_search"
        )
        print(f"    ✅ Created welfare_text_search (Multilingual)")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"    ⚠️ welfare_text_search: {e}")

    # Target disease index
    try:
        collection.create_index([("target_disease", ASCENDING)], name="disease_idx")
        print(f"    ✅ Created disease_idx")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"    ⚠️ disease_idx: {e}")

    # CKD stage index (nested field)
    try:
        collection.create_index([("eligibility.ckd_stage", ASCENDING)], name="ckd_stage_idx")
        print(f"    ✅ Created ckd_stage_idx")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"    ⚠️ ckd_stage_idx: {e}")

    # Program ID unique index
    try:
        collection.create_index([("programId", ASCENDING)], name="program_id_unique", unique=True)
        print(f"    ✅ Created program_id_unique (unique)")
    except Exception as e:
        if "already exists" not in str(e):
            print(f"    ⚠️ program_id_unique: {e}")

    # 7. Verify
    print(f"\n[7] Verification...")
    total = collection.count_documents({})
    print(f"    Total programs: {total}")

    by_category = {}
    for prog in collection.find():
        cat = prog["category"]
        by_category[cat] = by_category.get(cat, 0) + 1

    print(f"    By category:")
    for cat, count in sorted(by_category.items()):
        print(f"      - {cat}: {count}")

    # 8. Test text search
    print(f"\n[8] Testing text search...")
    test_queries = ["산정특례", "장애인", "의료비 지원", "신장이식"]
    for query in test_queries:
        results = list(collection.find(
            {"$text": {"$search": query}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(3))

        count = len(results)
        if results:
            top_title = results[0].get('title', 'N/A')
            top_score = results[0].get('score', 0)
            print(f"    '{query}': {count} results (Top: {top_title}, score: {top_score:.2f})")
        else:
            print(f"    '{query}': {count} results")

    # 9. Display sample program
    print(f"\n[9] Sample program (산정특례 V001)...")
    sample = collection.find_one({"programId": "sangjung_ckd_v001"})
    if sample:
        print(f"    Program: {sample['title']}")
        print(f"    Category: {sample['category']}")
        print(f"    본인부담률: {sample['benefits'].get('copay_rate', 'N/A')}")
        print(f"    Contact: {sample['contact']['phone']}")
        print(f"    Fact checked: {sample.get('fact_check_verified', False)}")

    # Close
    client.close()

    print("\n" + "="*80)
    print("✅ WELFARE DATA LOADING COMPLETED!")
    print("="*80)
    print(f"\nData Statistics:")
    print(f"  - Total programs: {total}")
    print(f"  - Data source: {DATA_FILE.name}")
    print(f"  - Fact check: ✅ Verified 2024-2025")
    print(f"\nNext steps:")
    print(f"  1. Verify data: mongosh careguide --eval \"db.welfare_programs.count()\"")
    print(f"  2. Test WelfareManager: python backend/app/db/welfare_manager.py")
    print(f"  3. Read: docs/welfare/02_WELFARE_BACKEND_IMPLEMENTATION.md")
    print("="*80 + "\n")


if __name__ == "__main__":
    load_welfare_data()
