"""
MongoDB Atlas 연결 테스트
"""

import os
from pymongo import MongoClient


def test_mongodb_connection():
    """MongoDB Atlas 연결 테스트"""
    print("\n" + "="*80)
    print("MongoDB Atlas 연결 테스트")
    print("="*80)

    # MongoDB URI
    mongodb_uri = os.getenv("MONGODB_URI") or "mongodb+srv://mongoplomo11:mongorFggh100k!@careguidetest.q1dopif.mongodb.net/?appName=careguidetest"

    print(f"\n📡 연결 시도: {mongodb_uri[:30]}...")

    try:
        # MongoDB 클라이언트 생성
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)

        # 연결 테스트 (ping)
        client.admin.command('ping')

        print(f"\n✅ MongoDB 연결 성공!")

        # 데이터베이스 목록
        databases = client.list_database_names()
        print(f"\n📚 사용 가능한 데이터베이스: {databases}")

        # CareGuide DB 확인
        db = client["careguide"]
        collections = db.list_collection_names()
        print(f"\n📦 careguide DB의 컬렉션: {collections}")

        # Quiz 관련 컬렉션 확인
        quiz_collections = [c for c in collections if 'quiz' in c.lower()]
        if quiz_collections:
            print(f"\n🎯 Quiz 관련 컬렉션: {quiz_collections}")

            for coll_name in quiz_collections:
                count = db[coll_name].count_documents({})
                print(f"   - {coll_name}: {count}개 문서")
        else:
            print(f"\n⚠️ Quiz 관련 컬렉션이 없습니다. (첫 실행 시 자동 생성됨)")

        client.close()
        return True

    except Exception as e:
        print(f"\n❌ MongoDB 연결 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "🚀"*40)
    print("MongoDB Atlas 연결 테스트")
    print("🚀"*40)

    success = test_mongodb_connection()

    if success:
        print("\n🎉 테스트 성공! MongoDB Atlas 사용 가능합니다.")
        print("\n다음 단계:")
        print("   1. Upstage API 키 환경변수 설정")
        print("   2. 전체 Quiz Agent 통합 테스트 실행")
    else:
        print("\n⚠️ 테스트 실패. MongoDB URI를 확인하세요.")
