"""
Upstage Solar API 연결 테스트
간단한 텍스트 생성 및 퀴즈 JSON 생성 테스트
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from Agent.api.openai_client import OpenAIClient


async def test_basic_generation():
    """기본 텍스트 생성 테스트"""
    print("\n" + "="*80)
    print("TEST 1: 기본 텍스트 생성 (Upstage Solar)")
    print("="*80)

    client = OpenAIClient()  # 자동으로 UPSTAGE_API_KEY 감지

    try:
        result = await client.generate(
            prompt="만성콩팥병이란 무엇인가요?",
            system_prompt="당신은 의료 전문가입니다. 간단명료하게 답변하세요.",
            temperature=0.7,
            max_tokens=200
        )

        print(f"\n✅ 생성 성공!")
        print(f"📝 모델: {result.get('model')}")
        print(f"🔢 토큰 사용량: {result.get('tokens_used')}")
        print(f"\n💬 응답:\n{result.get('text')}")

        return True

    except Exception as e:
        print(f"\n❌ 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_json_quiz_generation():
    """JSON 형식 퀴즈 생성 테스트"""
    print("\n" + "="*80)
    print("TEST 2: JSON 퀴즈 생성 (O/X 문제 3개)")
    print("="*80)

    client = OpenAIClient()

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

    try:
        result = await client.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=1000
        )

        print(f"\n✅ 생성 성공!")
        print(f"📝 모델: {result.get('model')}")
        print(f"🔢 토큰 사용량: {result.get('tokens_used')}")
        print(f"\n💬 응답:\n{result.get('text')}")

        # JSON 파싱 시도
        import json
        response_text = result.get('text', '')

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
            print(f"      해설: {q.get('explanation')}")

        return True

    except json.JSONDecodeError as e:
        print(f"\n⚠️ JSON 파싱 실패: {e}")
        print(f"   응답 텍스트:\n{result.get('text')}")
        return False

    except Exception as e:
        print(f"\n❌ 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_embedding():
    """Embedding 생성 테스트"""
    print("\n" + "="*80)
    print("TEST 3: Embedding 생성 (Upstage embedding-query)")
    print("="*80)

    client = OpenAIClient()

    try:
        embedding = await client.create_embedding("만성콩팥병 영양 관리")

        print(f"\n✅ Embedding 생성 성공!")
        print(f"📏 차원 수: {len(embedding)}")
        print(f"🔢 처음 5개 값: {embedding[:5]}")

        return True

    except Exception as e:
        print(f"\n❌ Embedding 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """메인 테스트 실행"""
    print("\n" + "🚀"*40)
    print("Upstage Solar API 연결 테스트")
    print("🚀"*40)

    # API 키 확인
    upstage_key = os.getenv("UPSTAGE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if upstage_key:
        print(f"✅ UPSTAGE_API_KEY: {upstage_key[:10]}...")
    elif openai_key:
        print(f"✅ OPENAI_API_KEY: {openai_key[:10]}...")
    else:
        print("\n❌ ERROR: API 키가 설정되지 않았습니다!")
        print("   export UPSTAGE_API_KEY='your-upstage-key'")
        print("   또는")
        print("   export OPENAI_API_KEY='your-openai-key'")
        return

    results = []

    # 1. 기본 생성 테스트
    result1 = await test_basic_generation()
    results.append(("기본 텍스트 생성", result1))

    # 2. JSON 퀴즈 생성 테스트
    result2 = await test_json_quiz_generation()
    results.append(("JSON 퀴즈 생성", result2))

    # 3. Embedding 테스트
    result3 = await test_embedding()
    results.append(("Embedding 생성", result3))

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
    else:
        print("\n⚠️ 일부 테스트 실패. 위 로그를 확인하세요.")


if __name__ == "__main__":
    asyncio.run(main())
