"""
qa_kidney 데이터를 O/X 퀴즈로 변환하여 DB에 저장하는 스크립트
난이도별 30개씩 총 90개 생성
"""
import asyncio
import json
import os
import random
from datetime import datetime
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# OpenAI 클라이언트
openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# MongoDB 연결
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')

# 카테고리 매핑 (qa_kidney 카테고리 -> 퀴즈 카테고리)
CATEGORY_MAPPING = {
    '콩팥병 궁금증': 'lifestyle',
    '투석': 'treatment',
    '신장질환': 'symptoms',
    '검진/진단': 'diagnosis',
    '치료': 'treatment',
    '약물': 'medication',
    '증상': 'symptoms',
    '예방': 'prevention',
    '정의': 'basics',
    '원인/병인': 'causes',
    '내과': 'medical',
    '가정의학과': 'lifestyle',
    'domain_17': 'nutrition',
}

# 난이도별 생성할 문제 수
QUESTIONS_PER_DIFFICULTY = 30


async def get_qa_samples(db, category_filter: List[str] = None, limit: int = 200) -> List[Dict]:
    """qa_kidney에서 샘플 Q&A 가져오기"""
    query = {}
    if category_filter:
        query['category'] = {'$in': category_filter}

    # 랜덤하게 샘플링
    pipeline = [
        {'$match': query},
        {'$sample': {'size': limit}},
        {'$project': {
            'question': 1,
            'answer': 1,
            'category': 1,
            'source_dataset': 1
        }}
    ]

    results = []
    async for doc in db.qa_kidney.aggregate(pipeline):
        if doc.get('question') and doc.get('answer'):
            results.append(doc)

    return results


async def generate_ox_questions_batch(qa_pairs: List[Dict], difficulty: str) -> List[Dict]:
    """OpenAI를 사용하여 Q&A를 O/X 퀴즈로 변환"""

    difficulty_instructions = {
        'easy': """쉬운 난이도 문제를 만들어주세요:
- 기본적인 사실 확인 문제
- 일반인도 직관적으로 이해할 수 있는 내용
- 명확한 정답이 있는 문제""",
        'medium': """중간 난이도 문제를 만들어주세요:
- 약간의 배경지식이 필요한 문제
- 세부 사항을 알아야 답할 수 있는 문제
- 흔한 오해를 다루는 문제""",
        'hard': """어려운 난이도 문제를 만들어주세요:
- 전문적인 지식이 필요한 문제
- 세밀한 구분이 필요한 문제
- 예외 사항이나 특수한 경우를 다루는 문제"""
    }

    # Q&A 쌍을 텍스트로 변환
    qa_text = "\n\n".join([
        f"Q: {qa['question']}\nA: {qa['answer'][:500]}"
        for qa in qa_pairs[:10]  # 한 번에 10개씩 처리
    ])

    prompt = f"""다음 만성콩팥병(CKD) 관련 Q&A를 바탕으로 O/X 퀴즈 문제를 만들어주세요.

{difficulty_instructions[difficulty]}

[Q&A 데이터]
{qa_text}

[요구사항]
1. 각 Q&A에서 1개의 O/X 문제를 생성
2. 문제는 한국어로 작성
3. "~이다", "~한다" 형태의 서술문으로 작성
4. 정답(answer)은 true 또는 false
5. 설명(explanation)은 2-3문장으로 간결하게

[출력 형식 - JSON 배열]
[
  {{
    "question": "만성콩팥병 환자는 칼륨이 많은 음식을 피해야 한다.",
    "answer": true,
    "explanation": "신장 기능이 저하되면 칼륨 배출이 어려워져 고칼륨혈증 위험이 있습니다. 바나나, 오렌지 등 칼륨이 많은 과일 섭취를 제한해야 합니다.",
    "category": "nutrition"
  }},
  ...
]

JSON 배열만 출력하세요."""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 의료 교육 퀴즈 전문가입니다. 만성콩팥병에 대한 정확한 O/X 퀴즈를 생성합니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()

        # JSON 파싱
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]

        questions = json.loads(content)

        # 난이도 추가
        for q in questions:
            q['difficulty'] = difficulty
            if 'category' not in q:
                q['category'] = 'general'

        return questions

    except Exception as e:
        print(f"Error generating questions: {e}")
        return []


async def generate_all_questions(db) -> List[Dict]:
    """모든 난이도별 문제 생성"""
    all_questions = []

    for difficulty in ['easy', 'medium', 'hard']:
        print(f"\n=== {difficulty.upper()} 난이도 문제 생성 중... ===")

        questions_needed = QUESTIONS_PER_DIFFICULTY
        questions_generated = []

        while len(questions_generated) < questions_needed:
            # Q&A 샘플 가져오기
            qa_samples = await get_qa_samples(db, limit=50)

            # 10개씩 배치로 처리
            for i in range(0, len(qa_samples), 10):
                if len(questions_generated) >= questions_needed:
                    break

                batch = qa_samples[i:i+10]
                new_questions = await generate_ox_questions_batch(batch, difficulty)

                for q in new_questions:
                    if len(questions_generated) < questions_needed:
                        questions_generated.append(q)
                        print(f"  [{len(questions_generated)}/{questions_needed}] {q['question'][:50]}...")

                # Rate limiting
                await asyncio.sleep(0.5)

        all_questions.extend(questions_generated)
        print(f"✓ {difficulty} 완료: {len(questions_generated)}개")

    return all_questions


async def save_questions_to_db(db, questions: List[Dict]):
    """생성된 문제를 quiz_pool에 저장"""
    quiz_pool = db.quiz_pool

    # 기존 문제 수 확인
    existing_count = await quiz_pool.count_documents({})
    print(f"\n기존 quiz_pool 문제 수: {existing_count}")

    # 새 문제 저장
    saved_count = 0
    for q in questions:
        # 중복 확인 (같은 질문이 있는지)
        existing = await quiz_pool.find_one({'question': q['question']})
        if existing:
            print(f"  중복 스킵: {q['question'][:30]}...")
            continue

        doc = {
            'question': q['question'],
            'answer': q['answer'],
            'explanation': q.get('explanation', ''),
            'category': q.get('category', 'general'),
            'difficulty': q['difficulty'],
            'totalAttempts': 0,
            'correctAttempts': 0,
            'createdAt': datetime.utcnow(),
            'source': 'qa_kidney_generated'
        }

        await quiz_pool.insert_one(doc)
        saved_count += 1

    print(f"\n✓ 저장 완료: {saved_count}개 문제")

    # 최종 통계
    final_count = await quiz_pool.count_documents({})
    print(f"최종 quiz_pool 문제 수: {final_count}")

    # 난이도별 통계
    for diff in ['easy', 'medium', 'hard']:
        count = await quiz_pool.count_documents({'difficulty': diff})
        print(f"  - {diff}: {count}개")


async def main():
    print("=" * 60)
    print("qa_kidney → O/X 퀴즈 변환 스크립트")
    print("=" * 60)

    # MongoDB 연결
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client['careguide']

    # 1. 문제 생성
    questions = await generate_all_questions(db)
    print(f"\n총 생성된 문제: {len(questions)}개")

    # 2. DB에 저장
    await save_questions_to_db(db, questions)

    # 3. 샘플 출력
    print("\n=== 생성된 문제 샘플 ===")
    for diff in ['easy', 'medium', 'hard']:
        sample = [q for q in questions if q['difficulty'] == diff][:2]
        print(f"\n[{diff.upper()}]")
        for q in sample:
            print(f"Q: {q['question']}")
            print(f"A: {'O' if q['answer'] else 'X'}")
            print(f"설명: {q.get('explanation', 'N/A')[:100]}")
            print()

    client.close()
    print("\n완료!")


if __name__ == '__main__':
    asyncio.run(main())
