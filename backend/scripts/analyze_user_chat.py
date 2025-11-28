"""
회원/비회원 채팅 기록 분석 스크립트
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')


async def analyze_chat_data():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client['careguide']

    print("=" * 70)
    print("회원/비회원 채팅 기록 분석")
    print("=" * 70)

    # 1. 컬렉션 확인
    collections = await db.list_collection_names()
    chat_related = [c for c in collections if 'chat' in c.lower() or 'conversation' in c.lower() or 'session' in c.lower()]
    print(f"\n[채팅 관련 컬렉션]")
    for c in chat_related:
        count = await db[c].count_documents({})
        print(f"  - {c}: {count}개")

    # 2. users 컬렉션 확인
    print(f"\n[사용자 데이터]")
    users_count = await db.users.count_documents({})
    anonymous_count = await db.anonymous_users.count_documents({})
    print(f"  - 등록 회원: {users_count}명")
    print(f"  - 익명 사용자: {anonymous_count}명")

    # 3. 사용자 샘플 구조 확인
    print(f"\n[users 컬렉션 구조]")
    user_sample = await db.users.find_one()
    if user_sample:
        for k, v in user_sample.items():
            val_str = str(v)[:80] if len(str(v)) > 80 else str(v)
            print(f"  - {k}: {val_str}")

    print(f"\n[anonymous_users 컬렉션 구조]")
    anon_sample = await db.anonymous_users.find_one()
    if anon_sample:
        for k, v in anon_sample.items():
            val_str = str(v)[:80] if len(str(v)) > 80 else str(v)
            print(f"  - {k}: {val_str}")

    # 4. 퀴즈 세션 분석
    print(f"\n[퀴즈 세션 분석]")
    quiz_sessions = await db.quiz_sessions.count_documents({})
    quiz_attempts = await db.quiz_attempts.count_documents({})
    user_quiz_history = await db.user_quiz_history.count_documents({})
    print(f"  - 퀴즈 세션: {quiz_sessions}개")
    print(f"  - 퀴즈 시도: {quiz_attempts}개")
    print(f"  - 사용자 퀴즈 이력: {user_quiz_history}개")

    # 5. 퀴즈 사용자별 통계
    print(f"\n[퀴즈 사용자별 통계]")
    pipeline = [
        {'$group': {'_id': '$userId', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 10}
    ]
    async for doc in db.user_quiz_history.aggregate(pipeline):
        print(f"  - {doc['_id']}: {doc['count']}회 시도")

    # 6. 난이도별 퀴즈 통계
    print(f"\n[퀴즈 난이도별 분포]")
    for diff in ['easy', 'medium', 'hard']:
        count = await db.quiz_pool.count_documents({'difficulty': diff})
        print(f"  - {diff}: {count}개")

    # 7. conversation_history 분석 (있는 경우)
    conv_count = await db.conversation_history.count_documents({})
    if conv_count > 0:
        print(f"\n[대화 이력 분석]")
        print(f"  - 총 대화: {conv_count}개")

        conv_sample = await db.conversation_history.find_one()
        if conv_sample:
            print(f"  - 구조: {list(conv_sample.keys())}")

    # 8. 제안: 분석용 스키마
    print("\n" + "=" * 70)
    print("제안: 회원/비회원 분석을 위한 데이터 구조")
    print("=" * 70)
    print("""
[권장 스키마]

1. chat_sessions (채팅 세션)
   - _id: ObjectId
   - sessionId: string (고유 세션 ID)
   - userId: string (회원 ID 또는 null)
   - anonymousId: string (비회원 임시 ID)
   - isRegistered: boolean (회원 여부)
   - startedAt: datetime
   - endedAt: datetime
   - messageCount: int
   - agentTypes: [string] (사용한 에이전트 목록)

2. chat_messages (채팅 메시지)
   - _id: ObjectId
   - sessionId: string
   - role: "user" | "assistant"
   - content: string
   - timestamp: datetime
   - agentType: string
   - metadata: {
       intent: string,
       tokens: int,
       responseTime: int (ms)
   }

3. user_analytics (사용자 분석)
   - _id: ObjectId
   - userId: string
   - isRegistered: boolean
   - totalSessions: int
   - totalMessages: int
   - lastActiveAt: datetime
   - preferredAgents: [string]
   - quizStats: {
       totalAttempts: int,
       correctAnswers: int,
       avgScore: float
   }
""")

    client.close()


if __name__ == '__main__':
    asyncio.run(analyze_chat_data())
