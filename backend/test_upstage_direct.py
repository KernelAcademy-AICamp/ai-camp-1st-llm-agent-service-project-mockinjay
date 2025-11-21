"""
Upstage Solar API 직접 HTTP 테스트
requests 라이브러리로 직접 호출
"""

import os
import requests
import json


def test_upstage_basic():
    """기본 텍스트 생성 테스트"""
    print("\n" + "="*80)
    print("TEST 1: Upstage Solar 기본 텍스트 생성")
    print("="*80)

    api_key = os.getenv("UPSTAGE_API_KEY")
    if not api_key:
        print("❌ ERROR: UPSTAGE_API_KEY 환경 변수가 설정되지 않았습니다!")
        return False

    print(f"✅ API Key: {api_key[:10]}...")

    url = "https://api.upstage.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "solar-pro2",
        "messages": [
            {"role": "system", "content": "당신은 의료 전문가입니다. 간단명료하게 답변하세요."},
            {"role": "user", "content": "만성콩팥병이란 무엇인가요?"}
        ],
        "temperature": 0.7,
        "max_tokens": 200
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()

        result = response.json()

        print(f"\n✅ 생성 성공!")
        print(f"📝 모델: {result.get('model', 'unknown')}")
        print(f"🔢 토큰 사용량: {result.get('usage', {}).get('total_tokens', 0)}")
        print(f"\n💬 응답:\n{result['choices'][0]['message']['content']}")

        return True

    except requests.exceptions.RequestException as e:
        print(f"\n❌ 생성 실패: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   응답 코드: {e.response.status_code}")
            print(f"   응답 내용: {e.response.text}")
        return False


def test_upstage_json_quiz():
    """JSON 퀴즈 생성 테스트"""
    print("\n" + "="*80)
    print("TEST 2: Upstage Solar JSON 퀴즈 생성 (O/X 3문제)")
    print("="*80)

    api_key = os.getenv("UPSTAGE_API_KEY")

    url = "https://api.upstage.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    system_prompt = """당신은 만성콩팥병 교육 전문가입니다.
O/X 퀴즈를 생성하고 JSON 배열로 반환하세요."""

    user_prompt = """다음 조건에 맞는 O/X 퀴즈를 3개 생성해주세요.

조건:
- 카테고리: 영양 관리
- 난이도: 쉬움 (기본 상식)

응답 형식 (JSON):
[
  {
    "question": "문제 텍스트",
    "answer": true 또는 false,
    "explanation": "해설 (2-3문장)"
  },
  ...
]

JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요."""

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
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()

        result = response.json()

        print(f"\n✅ 생성 성공!")
        print(f"📝 모델: {result.get('model', 'unknown')}")
        print(f"🔢 토큰 사용량: {result.get('usage', {}).get('total_tokens', 0)}")

        response_text = result['choices'][0]['message']['content']
        print(f"\n💬 원본 응답:\n{response_text[:500]}...")

        # JSON 파싱 시도
        # JSON 추출 (마크다운 코드 블록 제거)
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()

        questions = json.loads(response_text)

        print(f"\n✅ JSON 파싱 성공! {len(questions)}개 문제 생성됨")
        for i, q in enumerate(questions, 1):
            print(f"\n   문제 {i}:")
            print(f"      질문: {q.get('question')}")
            print(f"      정답: {q.get('answer')}")
            print(f"      해설: {q.get('explanation')[:50]}...")

        return True

    except json.JSONDecodeError as e:
        print(f"\n⚠️ JSON 파싱 실패: {e}")
        print(f"   응답 텍스트:\n{response_text}")
        return False

    except requests.exceptions.RequestException as e:
        print(f"\n❌ 생성 실패: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   응답 코드: {e.response.status_code}")
            print(f"   응답 내용: {e.response.text}")
        return False


def main():
    """메인 테스트 실행"""
    print("\n" + "🚀"*40)
    print("Upstage Solar API 직접 HTTP 테스트")
    print("🚀"*40)

    # API 키 확인
    api_key = os.getenv("UPSTAGE_API_KEY")
    if not api_key:
        print("\n❌ ERROR: UPSTAGE_API_KEY 환경 변수가 설정되지 않았습니다!")
        print("   export UPSTAGE_API_KEY='your-upstage-key'")
        return

    results = []

    # 1. 기본 생성 테스트
    result1 = test_upstage_basic()
    results.append(("기본 텍스트 생성", result1))

    # 2. JSON 퀴즈 생성 테스트
    result2 = test_upstage_json_quiz()
    results.append(("JSON 퀴즈 생성", result2))

    # 결과 요약
    print("\n" + "="*80)
    print("테스트 결과 요약")
    print("="*80)

    for test_name, success in results:
        status = "✅ 성공" if success else "❌ 실패"
        print(f"   {test_name}: {status}")

    all_passed = all(result for _, result in results)

    if all_passed:
        print("\n🎉 모든 테스트 통과! Upstage Solar API 사용 가능합니다.")
        print("\n다음 단계:")
        print("   1. MongoDB 실행 확인")
        print("   2. Vector DB (Pinecone) 설정 확인")
        print("   3. 전체 Quiz Agent 테스트")
    else:
        print("\n⚠️ 일부 테스트 실패. 위 로그를 확인하세요.")


if __name__ == "__main__":
    main()
