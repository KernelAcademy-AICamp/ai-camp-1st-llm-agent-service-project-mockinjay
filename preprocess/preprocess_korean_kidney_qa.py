"""
대한신장학회 FAQ 크롤러
toggleArea 클래스의 실제 구조를 기반으로 추출합니다.

사용법:
    python preprocess_korean_kidney_qa.py
"""

import requests
from bs4 import BeautifulSoup
import json
import re


def extract_faq_from_ksn():
    """대한신장학회 FAQ 추출"""
    
    url = "https://ksn.or.kr/bbs/?code=g_faq"
    
    print("📥 페이지 다운로드 중...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        print("✅ 다운로드 완료\n")
        
        # toggleArea 찾기
        toggle_areas = soup.find_all('div', class_='toggleArea')
        
        if not toggle_areas:
            print("❌ toggleArea를 찾을 수 없습니다.")
            return []
        
        print(f"📊 {len(toggle_areas)}개의 toggleArea 발견\n")
        
        qa_pairs = []
        
        # 각 toggleArea 내의 dl.faq 처리
        for toggle_area in toggle_areas:
            faq_items = toggle_area.find_all('dl', class_='faq')
            
            for idx, faq in enumerate(faq_items, start=1):
                if idx == 71:
                    
                    continue
                try:
                    # dt에서 카테고리와 제목 추출
                    dt = faq.find('dt')
                    if not dt:
                        continue
                    
                    # 카테고리 (span.category)
                    category_elem = dt.find('span', class_='category')
                    category = category_elem.get_text(strip=True) if category_elem else "일반"
                    
                    # 제목 (a.trigger 내의 텍스트에서 카테고리 제외)
                    title_elem = dt.find('a', class_='trigger')
                    if title_elem:
                        # 카테고리 span 제거 후 텍스트 추출
                        title_text = title_elem.get_text(strip=True)
                        # 카테고리 텍스트가 포함되어 있으면 제거
                        if category in title_text:
                            title_text = title_text.replace(category, '').strip()
                    else:
                        title_text = ""
                    
                    # dd.toggleCon에서 Q&A 추출
                    dd = faq.find('dd', class_='toggleCon')
                    if not dd:
                        continue
                    
                    # ul.qna의 li 요소들 (첫 번째는 질문, 두 번째는 답변)
                    qna_ul = dd.find('ul', class_='qna')
                    if not qna_ul:
                        continue
                    
                    li_items = qna_ul.find_all('li', recursive=False)
                    
                    if len(li_items) >= 2:
                        question = li_items[0].get_text(strip=True)
                        answer = li_items[1].get_text(separator=' ', strip=True)
                        
                        # <br> 태그를 공백으로 변환
                        answer = re.sub(r'\s+', ' ', answer)
                        
                        qa_pairs.append({
                            "id": len(qa_pairs) + 1,
                            "question": question,
                            "answer": answer,
                            "category": category,
                            "subcategory": title_text  # 제목을 서브카테고리로 사용
                        })
                        
                        print(f"[{len(qa_pairs)}] {category} - {title_text[:30]}...")
                    
                except Exception as e:
                    print(f"⚠️  항목 처리 중 오류: {e}")
                    continue
        
        return qa_pairs
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return []


def create_dataset(qa_pairs):
    """JSON 데이터셋 생성"""
    
    # 카테고리 정의 (웹사이트의 subMenu 순서대로)
    categories = [
        "만성신장질환",
        "복막투석", 
        "혈액투석",
        "합병증 예방과 관리",
        "투석환자의 생활"
    ]
    
    dataset = {
        "dataset": {
            "metadata": {
                "title": "투석환자 생활 가이드 Q&A 데이터셋",
                "description": "만성신부전 및 투석환자를 위한 생활 관련 질의응답 모음",
                "version": "1.0",
                "source": "대한신장학회 (https://ksn.or.kr/bbs/?code=g_faq)",
                "categories": categories
            },
            "qa_pairs": qa_pairs
        }
    }
    
    return dataset


def save_to_json(data, filename="../data/preprocess/dialysis_qa_dataset.json"):
    """JSON 파일로 저장"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 저장 완료: {filename}")


def print_statistics(qa_pairs):
    """통계 출력"""
    print("\n" + "="*60)
    print("📈 추출 결과 통계")
    print("="*60)
    
    # 카테고리별 개수
    category_count = {}
    for item in qa_pairs:
        cat = item['category']
        category_count[cat] = category_count.get(cat, 0) + 1
    
    print(f"\n총 항목 수: {len(qa_pairs)}개\n")
    print("카테고리별 분포:")
    for cat, count in sorted(category_count.items()):
        print(f"  - {cat}: {count}개")
    
    # 샘플 출력
    print("\n" + "="*60)
    print("📋 샘플 데이터 (처음 3개)")
    print("="*60)
    
    for i, item in enumerate(qa_pairs[:3], 1):
        print(f"\n[{i}] 카테고리: {item['category']}")
        print(f"    서브카테고리: {item['subcategory']}")
        print(f"    질문: {item['question'][:60]}...")
        print(f"    답변: {item['answer'][:80]}...")


def main():
    """메인 실행"""
    print("="*60)
    print("대한신장학회 FAQ 크롤러")
    print("="*60)
    print()
    
    # FAQ 추출
    qa_pairs = extract_faq_from_ksn()
    
    if not qa_pairs:
        print("\n❌ FAQ 항목을 추출하지 못했습니다.")
        return
    
    # 데이터셋 생성
    dataset = create_dataset(qa_pairs)
    
    # JSON 저장
    save_to_json(dataset)
    
    # 통계 출력
    print_statistics(qa_pairs)


if __name__ == "__main__":
    main()