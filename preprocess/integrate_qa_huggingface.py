#!/usr/bin/env python3
"""
QA Dataset Integrator Script
다운로드된 QA 데이터셋들을 통합합니다.
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
import anthropic
from dotenv import load_dotenv
import pandas as pd
from datasets import load_dataset

# .env 파일에서 환경변수 로드
load_dotenv()

# Anthropic 클라이언트 초기화
api_key = os.getenv('ANTHROPIC_API_KEY')
base_url = os.getenv('ANTHROPIC_BASE_URL')

client = anthropic.Anthropic(
    api_key=api_key,
    base_url=base_url
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # logging.FileHandler('outputs/logs/qa_integration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def curate_category_with_ai(question: str, answer: str, max_retries: int = 3) -> str:
    """
    AI를 사용하여 category가 없는 QA 항목에 대한 카테고리를 생성합니다.

    Args:
        question: 질문 텍스트
        answer: 답변 텍스트
        max_retries: 최대 재시도 횟수

    Returns:
        생성된 카테고리 문자열
    """
    try:
        for attempt in range(max_retries):
            try:
                message = client.messages.create(
                    model="MiniMax-M2",
                    max_tokens=1024,
                    system="당신은 의료 QA 데이터셋 분류 전문가입니다. 주어진 질문과 답변을 분석하여 적절한 카테고리를 한 단어 또는 3 단어 까지로 제시해주세요. 예시 카테고리: 투석, 신장질환, 약물, 증상, 식이요법, 검사, 합병증. 이때 한글로 응답해주세요.",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"다음 QA 쌍을 분석하여 카테고리를 제시해주세요.\n\n질문: {question}\n\n답변: {answer}"
                                }
                            ]
                        }
                    ]
                )

                # 응답에서 카테고리 추출
                category = message.content[1].text
                logger.info(f"✓ AI-generated category: {category}")
                if type(category) == str and category.strip():
                    return category
                
                else:
                    return ''

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"Category curation attempt {attempt + 1} failed: {str(e)}, retrying...")
                    continue
                else:
                    raise

    except Exception as e:
        logger.error(f"✗ Failed to curate category: {str(e)}")
        return "기타"  # 실패시 기본값


def create_output_directories():
    """출력 디렉토리 생성"""
    dirs = [
        '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/qa_dataset/qa_dataset',
    ]

    for dir_path in dirs:
        os.makedirs(dir_path, exist_ok=True)

    logger.info("QA output directories created")

def load_dialysis_qa():
    """투석환자 QA 데이터 로드"""
    try:
        with open('/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/dialysis_qa_dataset.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        qa_pairs = []
        for pair in data.get('dataset', {}).get('qa_pairs', []):
            qa_pairs.append({
                'id': f"dialysis_{pair['id']}",
                'source': 'dialysis_local',
                'question': pair.get('question', ''),
                'answer': pair.get('answer', ''),
                # 'context': '',
                'category': pair.get('category', ''),
                # 'language': 'ko'
            })

        logger.info(f"✓ Loaded {len(qa_pairs)} dialysis QA pairs")
        return qa_pairs

    except Exception as e:
        logger.error(f"✗ Failed to load dialysis QA: {str(e)}")
        return []

def load_kidney_2410():
    """Kidney 2410 데이터 로드"""
    try:
        dataset = load_dataset('ssunny/kidney_2410')
        qa_pairs = []

        for idx, item in enumerate(dataset['train']):
            qa_pairs.append({
                'id': f"kidney_2410_{idx}",
                'source': 'kidney_2410',
                'question': item.get('QUESTION', ''),
                'answer': item.get('ANSWER', ''),
                # 'context': '',
                'category': item.get('QUESTION_TYPE', ''),
                # 'language': 'en'
            })

        logger.info(f"✓ Loaded {len(qa_pairs)} kidney_2410 QA pairs")
        return qa_pairs

    except Exception as e:
        logger.error(f"✗ Failed to load kidney_2410: {str(e)}")
        return []

def load_modi_kidney_2410():
    """Modi Kidney 2410 데이터 로드 (정제 버전)"""
    try:
        dataset = load_dataset('ssunny/modi_kidney_2410')
        qa_pairs = []

        for idx, item in enumerate(dataset['train']):
            qa_pairs.append({
                'id': f"modi_kidney_2410_{idx}",
                'source': 'modi_kidney_2410',
                'question': item.get('instruction', ''),
                'answer': item.get('output', ''),
                'category': curate_category_with_ai(
                    question=item.get('instruction', ''),
                    answer=item.get('output', '')
                ),
                # 'context': item.get('input', ''),
                # 'language': 'en'
            })

        logger.info(f"✓ Loaded {len(qa_pairs)} modi_kidney_2410 QA pairs")
        return qa_pairs

    except Exception as e:
        logger.error(f"✗ Failed to load modi_kidney_2410: {str(e)}")
        return []

def remove_duplicates(qa_list):
    """중복 제거"""
    unique_items = {}
    duplicates_count = 0

    for item in qa_list:
        # ID 기반으로만 중복 제거 (source별로는 다른 항목으로 간주)
        key = item['id']
        if key not in unique_items:
            unique_items[key] = item
        else:
            duplicates_count += 1

    logger.info(f"Removed {duplicates_count} duplicate items")
    return list(unique_items.values())

def save_qa_data(qa_pairs, output_path):
    """QA 데이터 저장 (JSONL 형식)"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in qa_pairs:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')

    logger.info(f"Saved {len(qa_pairs)} QA pairs to {output_path}")


def main():
    """메인 함수"""
    logger.info("=" * 60)
    logger.info("QA Dataset Integration Started")
    logger.info("=" * 60)

    # 출력 디렉토리 생성
    create_output_directories()

    # 모든 QA 데이터 로드
    all_qa_pairs = []

    # 1. 투석환자 QA 로드
    dialysis_qa = load_dialysis_qa()
    all_qa_pairs.extend(dialysis_qa)

    # 2. Kidney 2410 로드
    kidney_2410 = load_kidney_2410()
    all_qa_pairs.extend(kidney_2410)

    # 3. Modi Kidney 2410 로드
    modi_kidney_2410 = load_modi_kidney_2410()
    all_qa_pairs.extend(modi_kidney_2410)

    # # 4. PubMedQA 로드
    # pubmedqa = load_pubmedqa()
    # all_qa_pairs.extend(pubmedqa)

    # 중복 제거
    unique_qa_pairs = remove_duplicates(all_qa_pairs)

    # 통합 데이터 저장 (JSONL)
    save_qa_data(unique_qa_pairs, '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/qa_dataset/qa_dataset_unified.jsonl')

    # CSV로도 저장s
    df = pd.DataFrame(unique_qa_pairs)
    df.to_csv('/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/qa_dataset/qa_dataset_unified.csv', index=False, encoding='utf-8')
    logger.info(f"Saved unified QA dataset to CSV")

    # # Source별로 저장
    # sources = set(qa.get('source') for qa in unique_qa_pairs)
    # for source in sources:
    #     source_data = [qa for qa in unique_qa_pairs if qa.get('source') == source]
    #     save_qa_data(source_data, f'outputs/qa_dataset/by_source/{source}.jsonl')



if __name__ == '__main__':
    main()
