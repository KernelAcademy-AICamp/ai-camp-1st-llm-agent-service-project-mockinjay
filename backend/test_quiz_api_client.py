"""
Quiz API HTTP 클라이언트 테스트
서버가 실행 중일 때 API 엔드포인트를 테스트
"""

import requests
import json


BASE_URL = "http://localhost:8000/api/quiz"


def test_health_check():
    """Health check 테스트"""
    print("\n" + "="*80)
    print("TEST: Health Check")
    print("="*80)

    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ 서버 실행 중")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        else:
            print(f"❌ 서버 응답 오류: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.")
        return False
    except Exception as e:
        print(f"❌ 오류: {e}")
        return False


def test_start_quiz_session():
    """퀴즈 세션 시작 테스트"""
    print("\n" + "="*80)
    print("TEST 1: 퀴즈 세션 시작 (POST /api/quiz/session/start)")
    print("="*80)

    payload = {
        "userId": "test_api_user_001",
        "sessionType": "daily_quiz"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/session/start",
            json=payload,
            timeout=60
        )

        print(f"\n📡 Status Code: {response.status_code}")

        if response.status_code == 201:
            data = response.json()
            print(f"✅ 세션 생성 성공!")
            print(f"📊 Session ID: {data.get('sessionId')}")
            print(f"📝 Total Questions: {data.get('totalQuestions')}")
            print(f"🎯 Session Type: {data.get('sessionType')}")
            print(f"❓ First Question: {data.get('currentQuestion', {}).get('question')}")
            print(f"📚 Category: {data.get('currentQuestion', {}).get('category')}")
            print(f"⚙️ Difficulty: {data.get('currentQuestion', {}).get('difficulty')}")

            return data.get('sessionId'), data.get('currentQuestion', {}).get('id')
        else:
            print(f"❌ 실패: {response.status_code}")
            print(response.text)
            return None, None

    except Exception as e:
        print(f"❌ 오류: {e}")
        return None, None


def test_submit_answer(session_id: str, question_id: str):
    """답안 제출 테스트"""
    print("\n" + "="*80)
    print("TEST 2: 답안 제출 (POST /api/quiz/session/submit-answer)")
    print("="*80)

    payload = {
        "sessionId": session_id,
        "userId": "test_api_user_001",
        "questionId": question_id,
        "userAnswer": True
    }

    try:
        response = requests.post(
            f"{BASE_URL}/session/submit-answer",
            json=payload,
            timeout=30
        )

        print(f"\n📡 Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ 답안 제출 성공!")
            print(f"{'✔️ 정답!' if data.get('isCorrect') else '❌ 오답!'}")
            print(f"🎯 정답: {data.get('correctAnswer')}")
            print(f"💡 해설: {data.get('explanation')}")
            print(f"🏆 획득 점수: {data.get('pointsEarned')}점")
            print(f"📊 현재 점수: {data.get('currentScore')}점")
            print(f"🔥 연속 정답: {data.get('consecutiveCorrect')}개")

            next_q = data.get('nextQuestion')
            if next_q:
                print(f"\n➡️ 다음 문제:")
                print(f"   ID: {next_q.get('id')}")
                print(f"   Question: {next_q.get('question')}")
                return next_q.get('id')
            else:
                print(f"\n✅ 마지막 문제 완료!")
                return None

        else:
            print(f"❌ 실패: {response.status_code}")
            print(response.text)
            return None

    except Exception as e:
        print(f"❌ 오류: {e}")
        return None


def test_get_stats():
    """사용자 통계 조회 테스트"""
    print("\n" + "="*80)
    print("TEST 3: 사용자 통계 조회 (GET /api/quiz/stats)")
    print("="*80)

    try:
        response = requests.get(
            f"{BASE_URL}/stats",
            params={"userId": "test_api_user_001"},
            timeout=10
        )

        print(f"\n📡 Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ 통계 조회 성공!")
            print(f"👤 User ID: {data.get('userId')}")
            print(f"📊 Total Sessions: {data.get('totalSessions')}")
            print(f"❓ Total Questions: {data.get('totalQuestions')}")
            print(f"✔️ Correct Answers: {data.get('correctAnswers')}")
            print(f"🏆 Total Score: {data.get('totalScore')}")
            print(f"📈 Accuracy Rate: {data.get('accuracyRate')}%")
            print(f"🔥 Current Streak: {data.get('currentStreak')}")
            print(f"🏅 Best Streak: {data.get('bestStreak')}")
            print(f"⭐ Level: {data.get('level')}")
            return True
        else:
            print(f"❌ 실패: {response.status_code}")
            print(response.text)
            return False

    except Exception as e:
        print(f"❌ 오류: {e}")
        return False


def main():
    """메인 테스트 실행"""
    print("\n" + "🚀"*40)
    print("Quiz API HTTP 클라이언트 테스트")
    print("🚀"*40)

    print("\n⚠️ 주의: 이 테스트를 실행하기 전에 서버가 실행 중이어야 합니다.")
    print("   서버 실행 방법:")
    print("   1. Pinecone 의존성 문제 해결 후:")
    print("      cd backend && uvicorn app.main:app --reload")
    print("   2. 또는 독립 서버:")
    print("      python test_quiz_api_standalone.py")

    # Health check
    if not test_health_check():
        print("\n❌ 서버에 연결할 수 없습니다. 테스트 중단.")
        return

    results = []

    # TEST 1: 퀴즈 세션 시작
    session_id, question_id = test_start_quiz_session()
    results.append(("퀴즈 세션 시작", session_id is not None))

    if not session_id:
        print("\n❌ 세션 생성 실패, 테스트 중단")
        return

    # TEST 2: 답안 제출 (최대 5개)
    for i in range(5):
        if not question_id:
            break

        question_id = test_submit_answer(session_id, question_id)
        if i == 0:  # 첫 번째만 결과에 추가
            results.append(("답안 제출", question_id is not None or i == 4))

    # TEST 3: 통계 조회
    result3 = test_get_stats()
    results.append(("통계 조회", result3))

    # 결과 요약
    print("\n" + "="*80)
    print("테스트 결과 요약")
    print("="*80)

    for test_name, success in results:
        status = "✅ 성공" if success else "❌ 실패"
        print(f"   {test_name}: {status}")

    all_passed = all(result for _, result in results)

    if all_passed:
        print("\n🎉 모든 API 테스트 통과!")
    else:
        print("\n⚠️ 일부 테스트 실패.")


if __name__ == "__main__":
    main()
