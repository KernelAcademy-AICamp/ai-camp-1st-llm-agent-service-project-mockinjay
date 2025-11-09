#!/usr/bin/env python3
"""
Paper Dataset Integrator Script (Filtered Version)
다운로드된 논문 데이터셋들을 통합합니다.
- Kidney Disease Classification: 전체 데이터 사용
- PubMed Diabetes, Medical Papers NLP: renal/kidney 키워드 필터링
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
import pandas as pd
from datasets import load_dataset

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # logging.FileHandler('outputs/logsntegration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 논문 데이터셋 설정
PAPER_DATASETS = {
    'nr2n23/kidney-disease-article-classification': {
        'name': 'Kidney Disease Classification',
        'priority': 1,
        'filter_keywords': False  # 필터링 없이 전체 사용
    },
    'dmnanh/PudMedDiabetes_llama_transformed': {
        'name': 'PubMed Diabetes',
        'priority': 4,
        'filter_keywords': True  # renal/kidney 필터링
    },
    'ahmedabdelwahed/Medical_papers_title_and_abstract_NLP_dataset': {
        'name': 'Medical Papers NLP',
        'priority': 4,
        'filter_keywords': True  # renal/kidney 필터링
    }
}

# 필터링 키워드 (소문자로 통일)
FILTER_KEYWORDS = ['renal', 'kidney']

def create_output_directories():
    """출력 디렉토리 생성"""
    dirs = [
        '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/paper_dataset',
        '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/paper_dataset/preprocess',
        # 'outputs/paper_dataset/statistics',
        # 'outputs/paper_dataset/samples',
        # 'outputs/logs'
    ]

    for dir_path in dirs:
        os.makedirs(dir_path, exist_ok=True)

    logger.info("Paper dataset output directories created")

def check_keyword_filter(text):
    """텍스트에 필터링 키워드가 포함되어 있는지 확인"""
    if not text:
        return False
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in FILTER_KEYWORDS)

def load_kidney_classification():
    """Kidney Disease Classification 데이터 로드 (필터링 없음)"""
    try:
        dataset = load_dataset('nr2n23/kidney-disease-article-classification')
        papers = []

        for idx, item in enumerate(dataset['train']):
            papers.append({
                'title': item.get('ArticleTitle', ''),
                'abstract': item.get('Abstract', ''),
                'source': 'kidney_classification'
            })

        logger.info(f"✓ Loaded {len(papers)} kidney classification papers (no filtering)")
        return papers

    except Exception as e:
        logger.error(f"✗ Failed to load kidney classification: {str(e)}")
        return []

def load_diabetes_pubmed():
    """PubMed Diabetes 데이터 로드 (renal/kidney 필터링)"""
    try:
        dataset = load_dataset('dmnanh/PudMedDiabetes_llama_transformed')
        papers = []
        total_count = 0
        filtered_count = 0

        for idx, item in enumerate(dataset['train']):
            total_count += 1
            title = item.get('title', '')
            abstract = item.get('abstract', '')
            
            # title 또는 abstract에 필터링 키워드가 포함된 경우만 추가
            if check_keyword_filter(title) or check_keyword_filter(abstract):
                papers.append({
                    'title': title,
                    'abstract': abstract,
                    'source': 'pubmed_diabetes'
                })
                filtered_count += 1

        logger.info(f"✓ Loaded {filtered_count} PubMed Diabetes papers (filtered from {total_count} with renal/kidney)")
        logger.info(f"  Filter rate: {filtered_count/total_count*100:.2f}%")
        return papers

    except Exception as e:
        logger.error(f"✗ Failed to load PubMed Diabetes: {str(e)}")
        return []

def load_medical_papers():
    """Medical Papers NLP 데이터 로드 (renal/kidney 필터링)"""
    try:
        dataset = load_dataset('ahmedabdelwahed/Medical_papers_title_and_abstract_NLP_dataset')
        papers = []
        total_count = 0
        filtered_count = 0

        for idx, item in enumerate(dataset['train']):
            total_count += 1
            title = item.get('title', '')
            abstract = item.get('abstract', '')
            
            # title 또는 abstract에 필터링 키워드가 포함된 경우만 추가
            if check_keyword_filter(title) or check_keyword_filter(abstract):
                papers.append({
                    'title': title,
                    'abstract': abstract,
                    'source': 'medical_papers_nlp'
                })
                filtered_count += 1

        logger.info(f"✓ Loaded {filtered_count} Medical Papers (filtered from {total_count} with renal/kidney)")
        logger.info(f"  Filter rate: {filtered_count/total_count*100:.2f}%")
        return papers

    except Exception as e:
        logger.error(f"✗ Failed to load Medical Papers: {str(e)}")
        return []

def clean_paper_data(paper_list):
    """논문 데이터 정제 - [Not Available] title과 [Figure: see text] abstract 제거"""
    cleaned_papers = []
    removed_not_available = 0
    removed_figure_see_text = 0

    for item in paper_list:
        title = item.get('title', '')
        abstract = item.get('abstract', '')
        source = item.get('source', '')

        # title이 [Not Available]인 경우 해당 논문 제거
        if title == '[Not Available]' or title == '[Not Available].':
            removed_not_available += 1
            continue

        # abstract에 [Figure: see text]가 있으면 해당 논문 제거
        if abstract and '[Figure: see text]' in abstract:
            removed_figure_see_text += 1
            continue

        cleaned_papers.append({
            'title': title,
            'abstract': abstract,
            'source': source
        })

    logger.info(f"Cleaned data: removed {removed_not_available} papers with [Not Available] title, {removed_figure_see_text} papers with [Figure: see text] in abstract")
    return cleaned_papers, removed_not_available, removed_figure_see_text

def check_none_values(paper_list):
    """None 값 체크"""
    none_title = 0
    none_abstract = 0
    none_both = 0
    empty_title = 0
    empty_abstract = 0

    for item in paper_list:
        title = item.get('title')
        abstract = item.get('abstract')

        # None 체크
        if title is None:
            none_title += 1
        if abstract is None:
            none_abstract += 1
        if title is None and abstract is None:
            none_both += 1

        # 빈 문자열 체크
        if title == '':
            empty_title += 1
        if abstract == '':
            empty_abstract += 1

    result = {
        'total_papers': len(paper_list),
        'none_title': none_title,
        'none_abstract': none_abstract,
        'none_both': none_both,
        'empty_title': empty_title,
        'empty_abstract': empty_abstract,
        'valid_papers': len(paper_list) - none_both
    }

    logger.info(f"None value check: {result}")
    return result

def find_duplicates_by_title(paper_list):
    """중복 title 찾기 및 출력"""
    title_groups = {}

    for idx, item in enumerate(paper_list):
        title = item.get('title', '')
        if title:  # 빈 문자열이 아닌 경우만
            if title not in title_groups:
                title_groups[title] = []
            title_groups[title].append(idx)

    # 중복된 것만 필터링
    duplicates = {title: indices for title, indices in title_groups.items() if len(indices) > 1}

    logger.info(f"Found {len(duplicates)} duplicate titles")
    return duplicates

def find_duplicates_by_abstract(paper_list):
    """중복 abstract 찾기 및 출력"""
    abstract_groups = {}

    for idx, item in enumerate(paper_list):
        abstract = item.get('abstract', '')
        if abstract:  # 빈 문자열이 아닌 경우만
            if abstract not in abstract_groups:
                abstract_groups[abstract] = []
            abstract_groups[abstract].append(idx)

    # 중복된 것만 필터링
    duplicates = {abstract: indices for abstract, indices in abstract_groups.items() if len(indices) > 1}

    logger.info(f"Found {len(duplicates)} duplicate abstracts")
    return duplicates

def remove_duplicates_by_title(paper_list):
    """중복 제거 (title 기반)"""
    unique_items = {}
    duplicates_count = 0

    for item in paper_list:
        key = item.get('title', '')
        if key and key not in unique_items:
            unique_items[key] = item
        else:
            duplicates_count += 1

    logger.info(f"Removed {duplicates_count} duplicate papers (by title)")
    return list(unique_items.values())

def remove_duplicates_by_abstract(paper_list):
    """중복 제거 (abstract 기반)"""
    unique_items = {}
    duplicates_count = 0

    for item in paper_list:
        key = item.get('abstract', '')
        if key and key not in unique_items:
            unique_items[key] = item
        else:
            duplicates_count += 1

    logger.info(f"Removed {duplicates_count} duplicate papers (by abstract)")
    return list(unique_items.values())

def save_paper_data(papers, output_path):
    """논문 데이터 저장"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for paper in papers:
            f.write(json.dumps(paper, ensure_ascii=False) + '\n')

    logger.info(f"Saved {len(papers)} papers to {output_path}")

def main():
    """메인 함수"""
    logger.info("=" * 60)
    logger.info("Paper Dataset Integration Started (Filtered Version)")
    logger.info("=" * 60)
    logger.info(f"Filter keywords: {', '.join(FILTER_KEYWORDS)}")

    # 출력 디렉토리 생성
    create_output_directories()

    # 모든 논문 데이터 로드
    all_papers = []

    # 1. Kidney Disease Classification 로드 (필터링 없음)
    kidney_papers = load_kidney_classification()
    all_papers.extend(kidney_papers)
    logger.info(f"  Source: kidney_classification, Count: {len(kidney_papers)}")

    # 2. PubMed Diabetes 로드 (renal/kidney 필터링)
    diabetes_papers = load_diabetes_pubmed()
    all_papers.extend(diabetes_papers)
    logger.info(f"  Source: pubmed_diabetes, Count: {len(diabetes_papers)}")

    # 3. Medical Papers 로드 (renal/kidney 필터링)
    medical_papers = load_medical_papers()
    all_papers.extend(medical_papers)
    logger.info(f"  Source: medical_papers_nlp, Count: {len(medical_papers)}")

    logger.info(f"\nTotal papers loaded: {len(all_papers)}")

    # 1. 데이터 정제
    logger.info("\n" + "="*60)
    logger.info("Cleaning paper data")
    logger.info("="*60)
    original_count = len(all_papers)
    all_papers, removed_na, removed_fig = clean_paper_data(all_papers)

    print(f"\n[Data Cleaning]")
    print(f"  Original papers: {original_count}")
    print(f"  Removed [Not Available] titles: {removed_na}")
    print(f"  Removed [Figure: see text] abstracts: {removed_fig}")
    print(f"  After cleaning: {len(all_papers)}")
    print(f"  Total removed: {original_count - len(all_papers)} papers")

    # 2. None 값 체크
    logger.info("\n" + "="*60)
    logger.info("Checking for None values")
    logger.info("="*60)
    none_check = check_none_values(all_papers)

    print("\n[None Value Check]")
    print(f"  Total papers: {none_check['total_papers']}")
    print(f"  None title: {none_check['none_title']}")
    print(f"  None abstract: {none_check['none_abstract']}")
    print(f"  None both: {none_check['none_both']}")
    print(f"  Empty title: {none_check['empty_title']}")
    print(f"  Empty abstract: {none_check['empty_abstract']}")
    print(f"  Valid papers: {none_check['valid_papers']}")

    # # None 체크 결과 저장 (preprocess)
    # with open('outputs/paper_dataset/preprocess/none_value_check.json', 'w', encoding='utf-8') as f:
    #     json.dump(none_check, f, ensure_ascii=False, indent=2)

    # 3. Title 중복 찾기
    logger.info("\n" + "="*60)
    logger.info("Finding duplicate titles")
    logger.info("="*60)
    title_duplicates = find_duplicates_by_title(all_papers)

    print(f"\n[Title Duplicates]")
    print(f"  Found {len(title_duplicates)} duplicate titles")
    print(f"  Total duplicate entries: {sum(len(indices) for indices in title_duplicates.values())}")

    # 처음 5개 중복 title 출력
    print("\n  Sample duplicate titles (first 5):")
    for i, (title, indices) in enumerate(list(title_duplicates.items())[:5]):
        print(f"    {i+1}. Title: {title[:80]}...")
        print(f"       Appears {len(indices)} times at indices: {indices[:10]}")

    # Title 중복 정보 저장
    title_dup_summary = {
        'duplicate_count': len(title_duplicates),
        'total_duplicate_entries': sum(len(indices) for indices in title_duplicates.values()),
        'sample_duplicates': [
            {
                'title': title[:200],
                'count': len(indices),
                'indices': indices[:20]
            }
            for title, indices in list(title_duplicates.items())[:50]
        ]
    }

    # with open('outputs/paper_dataset/preprocess/title_duplicates.json', 'w', encoding='utf-8') as f:
    #     json.dump(title_dup_summary, f, ensure_ascii=False, indent=2)

    # 4. Abstract 중복 찾기
    logger.info("\n" + "="*60)
    logger.info("Finding duplicate abstracts")
    logger.info("="*60)
    abstract_duplicates = find_duplicates_by_abstract(all_papers)

    print(f"\n[Abstract Duplicates]")
    print(f"  Found {len(abstract_duplicates)} duplicate abstracts")
    print(f"  Total duplicate entries: {sum(len(indices) for indices in abstract_duplicates.values())}")

    # 처음 5개 중복 abstract 출력
    print("\n  Sample duplicate abstracts (first 5):")
    for i, (abstract, indices) in enumerate(list(abstract_duplicates.items())[:5]):
        print(f"    {i+1}. Abstract: {abstract[:80]}...")
        print(f"       Appears {len(indices)} times at indices: {indices[:10]}")

    # Abstract 중복 정보 저장
    abstract_dup_summary = {
        'duplicate_count': len(abstract_duplicates),
        'total_duplicate_entries': sum(len(indices) for indices in abstract_duplicates.values()),
        'sample_duplicates': [
            {
                'abstract': abstract[:200],
                'count': len(indices),
                'indices': indices[:20]
            }
            for abstract, indices in list(abstract_duplicates.items())[:50]
        ]
    }

    # with open('outputs/paper_dataset/preprocess/abstract_duplicates.json', 'w', encoding='utf-8') as f:
    #     json.dump(abstract_dup_summary, f, ensure_ascii=False, indent=2)

    # 5. Title 기준 중복 제거
    logger.info("\n" + "="*60)
    logger.info("Removing duplicates by TITLE")
    logger.info("="*60)
    unique_by_title = remove_duplicates_by_title(all_papers)

    print(f"\n[After Title Deduplication]")
    print(f"  Before: {len(all_papers)} papers")
    print(f"  After: {len(unique_by_title)} papers")
    print(f"  Removed: {len(all_papers) - len(unique_by_title)} duplicate titles")

    save_paper_data(unique_by_title, '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output/paper_dataset_.jsonl')
                


if __name__ == '__main__':
    main()