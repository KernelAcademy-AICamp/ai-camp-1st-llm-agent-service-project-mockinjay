"""
Quiz Agent 간단 테스트 (Pinecone 없이)
MongoDB + Upstage API만 사용
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


async def test_mongodb_setup():
    """MongoDB 연결 확인"""
    print("\n" + "="*80)
    print("TEST 0: MongoDB 연결 확인")
    print("="*80)

    from pymongo import MongoClient

    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        print("❌ MONGODB_URI 환경 변수가 설정되지 않았습니다!")
        return False

    try:
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print(f"✅ MongoDB 연결 성공!")

        db = client["careguide"]
        collections = db.list_collection_names()
        print(f"📦 careguide DB 컬렉션: {collections}")

        client.close()
        return True

    except Exception as e:
        print(f"❌ MongoDB 연결 실패: {e}")
        return False


async def test_upstage_api():
    """Upstage API 연결 확인"""
    print("\n" + "="*80)
    print("TEST 1: Upstage API 연결 확인")
    print("="*80)

    api_key = os.getenv("UPSTAGE_API_KEY")
    if not api_key:
        print("❌ UPSTAGE_API_KEY 환경 변수가 설정되지 않았습니다!")
        return False

    print(f"✅ API Key: {api_key[:10]}...")

    import requests

    url = "https://api.upstage.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "solar-pro2",
        "messages": [
            {"role": "user", "content": "Hello"}
        ],
        "max_tokens": 50
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        print(f"✅ Upstage API 연결 성공!")
        return True

    except Exception as e:
        print(f"❌ Upstage API 연결 실패: {e}")
        return False


async def test_quiz_generation_direct():
    """Quiz 생성 직접 테스트 (Agent 없이)"""
    print("\n" + "="*80)
    print("TEST 2: 퀴즈 생성 직접 테스트")
    print("="*80)

    from pymongo import MongoClient
    from datetime import datetime
    import requests
    import json

    # MongoDB 연결
    mongodb_uri = os.getenv("MONGODB_URI")
    client = MongoClient(mongodb_uri)
    db = client["careguide"]

    sessions_collection = db["quiz_sessions"]
    questions_collection = db["quiz_questions"]

    # Upstage API로 퀴즈 생성
    api_key = os.getenv("UPSTAGE_API_KEY")

    system_prompt = """당신은 만성콩팥병 교육 전문가입니다.
O/X 퀴즈를 생성하고 JSON 배열로 반환하세요."""

    user_prompt = """다음 조건에 맞는 O/X 퀴즈를 3개 생성해주세요.

조건:
- 카테고리: 영양 관리 (nutrition)
- 난이도: 쉬움 (easy)

응답 형식 (JSON):
[
  {
    "question": "문제 텍스트",
    "answer": true 또는 false,
    "explanation": "해설 (2-3문장)"
  }
]

JSON 배열만 반환하세요."""

    url = "https://api.upstage.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "solar-pro2",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1000
    }

    try:
        # 1. API 호출
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()

        result = response.json()
        response_text = result['choices'][0]['message']['content']

        # JSON 추출
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()

        questions = json.loads(response_text)

        print(f"\n✅ {len(questions)}개 퀴즈 생성 성공!")

        # 2. MongoDB에 저장
        question_ids = []
        questions_metadata = []

        for q in questions:
            q_doc = {
                "category": "nutrition",
                "difficulty": "easy",
                "question": q["question"],
                "answer": q["answer"],
                "explanation": q["explanation"],
                "totalAttempts": 0,
                "correctAttempts": 0,
                "createdAt": datetime.utcnow()
            }
            result = questions_collection.insert_one(q_doc)
            q_id = str(result.inserted_id)
            question_ids.append(q_id)

            questions_metadata.append({
                "questionId": q_id,
                "category": "nutrition",
                "difficulty": "easy"
            })

            print(f"   문제 {len(question_ids)}: {q['question'][:50]}...")

        # 3. 세션 생성
        session_doc = {
            "userId": "test_user_simple",
            "sessionType": "daily_quiz",
            "questionIds": question_ids,
            "questionsMetadata": questions_metadata,
            "currentQuestionIndex": 0,
            "answers": [],
            "score": 0,
            "consecutiveCorrect": 0,
            "status": "in_progress",
            "startedAt": datetime.utcnow(),
            "completedAt": None
        }
        session_result = sessions_collection.insert_one(session_doc)
        session_id = str(session_result.inserted_id)

        print(f"\n✅ 세션 생성 성공! Session ID: {session_id}")

        client.close()
        return session_id, question_ids

    except Exception as e:
        print(f"\n❌ 퀴즈 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        client.close()
        return None, None


async def test_answer_submission_direct(session_id: str, question_id: str):
    """답안 제출 직접 테스트"""
    print("\n" + "="*80)
    print("TEST 3: 답안 제출 테스트")
    print("="*80)

    from pymongo import MongoClient
    from bson import ObjectId

    mongodb_uri = os.getenv("MONGODB_URI")
    client = MongoClient(mongodb_uri)
    db = client["careguide"]

    sessions_collection = db["quiz_sessions"]
    questions_collection = db["quiz_questions"]

    try:
        # 세션 조회
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            print(f"❌ 세션을 찾을 수 없습니다: {session_id}")
            return False

        # 문제 조회
        question = questions_collection.find_one({"_id": ObjectId(question_id)})
        if not question:
            print(f"❌ 문제를 찾을 수 없습니다: {question_id}")
            return False

        print(f"📝 문제: {question['question']}")
        print(f"🎯 정답: {question['answer']}")

        # 정답 제출 (True로 가정)
        user_answer = True
        is_correct = (user_answer == question["answer"])

        print(f"✅ 사용자 답변: {user_answer}")
        print(f"{'✔️ 정답!' if is_correct else '❌ 오답!'}")

        # 점수 계산
        current_consecutive = session.get("consecutiveCorrect", 0)
        points_earned = 0
        new_consecutive = 0

        if is_correct:
            points_earned = 10
            new_consecutive = current_consecutive + 1
            if new_consecutive >= 3:
                points_earned += 5
                print(f"🎉 연속 정답 보너스! +5점")
        else:
            new_consecutive = 0

        print(f"🏆 획득 점수: {points_earned}점")

        # 세션 업데이트
        current_score = session.get("score", 0) + points_earned

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {
                    "answers": {
                        "questionId": question_id,
                        "userAnswer": user_answer,
                        "isCorrect": is_correct,
                        "pointsEarned": points_earned
                    }
                },
                "$set": {
                    "score": current_score,
                    "currentQuestionIndex": session["currentQuestionIndex"] + 1,
                    "consecutiveCorrect": new_consecutive
                }
            }
        )

        print(f"📊 현재 점수: {current_score}점")
        print(f"🔥 연속 정답: {new_consecutive}개")

        client.close()
        return True

    except Exception as e:
        print(f"❌ 답안 제출 실패: {e}")
        import traceback
        traceback.print_exc()
        client.close()
        return False


async def main():
    """메인 테스트 실행"""
    print("\n" + "🚀"*40)
    print("Quiz Agent 간단 통합 테스트")
    print("🚀"*40)

    # 환경변수 확인
    upstage_key = os.getenv("UPSTAGE_API_KEY")
    mongodb_uri = os.getenv("MONGODB_URI")

    if not upstage_key or not mongodb_uri:
        print("\n❌ ERROR: 환경 변수가 설정되지 않았습니다!")
        print("   export UPSTAGE_API_KEY='your-key'")
        print("   export MONGODB_URI='your-mongodb-uri'")
        return

    results = []

    # TEST 0: MongoDB 연결
    result0 = await test_mongodb_setup()
    results.append(("MongoDB 연결", result0))

    if not result0:
        print("\n❌ MongoDB 연결 실패, 테스트 중단")
        return

    # TEST 1: Upstage API 연결
    result1 = await test_upstage_api()
    results.append(("Upstage API 연결", result1))

    if not result1:
        print("\n❌ Upstage API 연결 실패, 테스트 중단")
        return

    # TEST 2: 퀴즈 생성
    session_id, question_ids = await test_quiz_generation_direct()
    results.append(("퀴즈 생성", session_id is not None))

    if not session_id:
        print("\n❌ 퀴즈 생성 실패, 테스트 중단")
        return

    # TEST 3: 답안 제출 (3문제)
    for i in range(min(3, len(question_ids))):
        result3 = await test_answer_submission_direct(session_id, question_ids[i])
        if i == 0:  # 첫 번째만 결과에 추가
            results.append(("답안 제출", result3))

    # 결과 요약
    print("\n" + "="*80)
    print("테스트 결과 요약")
    print("="*80)

    for test_name, success in results:
        status = "✅ 성공" if success else "❌ 실패"
        print(f"   {test_name}: {status}")

    all_passed = all(result for _, result in results)

    if all_passed:
        print("\n🎉 모든 테스트 통과!")
        print(f"\n✅ 생성된 세션 ID: {session_id}")
        print(f"✅ 생성된 문제 수: {len(question_ids)}개")
        print("\n다음 단계:")
        print("   1. FastAPI 서버 실행하여 API 엔드포인트 테스트")
        print("   2. Pinecone 설정하여 RAG 기반 퀴즈 생성 활성화")
    else:
        print("\n⚠️ 일부 테스트 실패.")


if __name__ == "__main__":
    asyncio.run(main())
