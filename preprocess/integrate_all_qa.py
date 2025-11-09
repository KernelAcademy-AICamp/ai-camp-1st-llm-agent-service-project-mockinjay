"""
QA Dataset Builder - Minimal Version
OCR 텍스트에서 QA 추출 및 기존 데이터 통합
"""

import json
import os
from glob import glob
from pathlib import Path
import hashlib
import requests
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

from openai import OpenAI, BadRequestError, RateLimitError






class QABuilder:
    def __init__(self, output_dir: str = "./output"):
        self.upstage_api_key = os.getenv("UPSTAGE_API_KEY")  # 실제 키로 변경
        self.minimax_api_key = os.getenv("MINIMAX_API_KEY")  # 실제 키로 변경
        self.upstage_base_url = "https://api.upstage.ai/v1/solar"
        self.minimax_base_url = "https://api.minimax.io/v1"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_id(self, text: str) -> str:
        """고유 ID 생성"""
        return hashlib.md5(text.encode()).hexdigest()[:16]
    
    def extract_qa_with_llm(self, text: str, source_file: str) -> list:
        """Upstage LLM으로 텍스트에서 QA 추출"""
        prompt = f"""다음 의료 문서에서 질문-답변 쌍을 추출하세요.

텍스트:
{text}

JSON 형식으로만 답변:
{{
  "qa_pairs": [
    {{"question": "질문", "answer": "답변"}}
  ],
  "additional_info": [
    {{"type": "유형", "content": "내용"}}
  ]
}}
"""
        
        try:
            client = OpenAI(api_key=self.upstage_api_key, base_url=self.upstage_base_url)

            response = client.chat.completions.create(
                model="solar-pro2",
                messages=[
                    {"role": "system", "content": "의료 관련 텍스트 요약 전문가"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
            )

            content = response.choices[0].message.content
            
            # JSON 파싱
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            data = json.loads(content.strip())
            
            # QA 변환
            qa_list = []
            for qa in data.get('qa_pairs', []):
                qa_list.append({
                    'id': self.generate_id(qa['question'] + source_file),
                    'question': qa['question'],
                    'answer': qa['answer'],
                    'source_dataset': 'ocr_extracted',
                    'source_file': source_file,
                    'category': qa.get('category', 'general')
                })
            
            # 추가 정보 변환
            additional_list = []
            for info in data.get('additional_info', []):
                additional_list.append({
                    'id': self.generate_id(info['content'] + source_file),
                    'type': info['type'],
                    'content': info['content'],
                    'source_file': source_file
                })
            
            return qa_list, additional_list
        
        except (BadRequestError, RateLimitError) as e:
            client = OpenAI(api_key=self.minimax_api_key, base_url=self.minimax_base_url)

            response = client.chat.completions.create(
                model="MiniMax-M2",
                messages=[
                    {"role": "system", "content": "의료 QA 추출 전문가"},
                    {"role": "user", "content": prompt}
                ],
                extra_body={"reasoning_split": True},
                temperature=0.0,
            )
            print(response)
            content = response.choices[0].message.content
            # JSON 파싱
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            data = json.loads(content.strip())
            
            # QA 변환
            qa_list = []
            for qa in data.get('qa_pairs', []):
                qa_list.append({
                    'id': self.generate_id(qa['question'] + source_file),
                    'question': qa['question'],
                    'answer': qa['answer'],
                    'source_dataset': 'ocr_extracted',
                    'source_file': source_file,
                    'category': qa.get('category', 'general')
                })
            
            # 추가 정보 변환
            additional_list = []
            for info in data.get('additional_info', []):
                additional_list.append({
                    'id': self.generate_id(info['content'] + source_file),
                    'type': info['type'],
                    'content': info['content'],
                    'source_file': source_file
                })
                return qa_list, additional_list
        
            
        except Exception as e:
            print(f"  ✗ LLM 추출 실패 ({source_file}): {e}")
            return [], []
    
    def process_ocr_json(self, json_path: str) -> tuple:
        """OCR JSON 파일 처리"""
        source_file = Path(json_path).name
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            text = data.get('text', '')
            if not text:
                return [], []
            
            return self.extract_qa_with_llm(text, source_file)
            
        except Exception as e:
            print(f"  ✗ 파일 읽기 실패 ({source_file}): {e}")
            return [], []
    
    def process_structured_json(self, json_path: str) -> list:
        """구조화된 JSON 파일 처리"""
        source_file = Path(json_path).name
        qa_list = []
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 패턴 1: document.content.qa_list
            if 'document' in data:
                items = data['document']['content'].get('qa_list', [])
                source = data['document']['metadata'].get('source', 'structured')
                
                for item in items:
                    qa_list.append({
                        'id': self.generate_id(item['question'] + source_file),
                        'question': item['question'],
                        'answer': item['answer'],
                        'source_dataset': source,
                        'source_file': source_file,
                        'category': data['document']['metadata'].get('category', 'general')
                    })
            
            # 패턴 2: article.qa_list
            elif 'article' in data:
                items = data['article']['qa_list']
                
                for item in items:
                    qa_list.append({
                        'id': self.generate_id(item['question'] + source_file),
                        'question': item['question'],
                        'answer': item['answer'],
                        'source_dataset': 'health_magazine',
                        'source_file': source_file,
                        'category': 'health_education'
                    })
            
        except Exception as e:
            print(f"  ✗ 구조화 파일 처리 실패 ({source_file}): {e}")
        
        return qa_list
    
    def process_jsonl(self, jsonl_path: str) -> list:
        """JSONL 파일 처리"""
        source_file = Path(jsonl_path).name
        qa_list = []
        
        try:
            with open(jsonl_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    
                    data = json.loads(line)
                    qa_list.append({
                        'id': data.get('id', self.generate_id(data['question'] + source_file)),
                        'question': data['question'],
                        'answer': data['answer'],
                        'source_dataset': data.get('source_dataset', data.get('source', 'jsonl')),
                        'source_file': source_file,
                        'category': data.get('category', 'general')
                    })
        
        except Exception as e:
            print(f"  ✗ JSONL 처리 실패 ({source_file}): {e}")
        
        return qa_list
    
    def save(self, qa_list: list, additional_list: list):
        """결과 저장"""
        # QA 저장
        qa_path = self.output_dir / "qa_unified.jsonl"
        with open(qa_path, 'w', encoding='utf-8') as f:
            for qa in qa_list:
                f.write(json.dumps(qa, ensure_ascii=False) + '\n')
        print(f"\n✓ QA 저장: {qa_path} ({len(qa_list)}개)")
        
        # # 추가 정보 저장
        # if additional_list:
        #     info_path = self.output_dir / "additional_info.jsonl"
        #     with open(info_path, 'w', encoding='utf-8') as f:
        #         for info in additional_list:
        #             f.write(json.dumps(info, ensure_ascii=False) + '\n')
        #     print(f"✓ 추가 정보 저장: {info_path} ({len(additional_list)}개)")
        
        # 통계
        # self.print_stats(qa_list)
    
    # def print_stats(self, qa_list: list):
    #     """통계 출력"""
    #     print("\n=== 통계 ===")
    #     print(f"총 QA: {len(qa_list)}개")
        
    #     # Source dataset별
    #     sources = {}
    #     for qa in qa_list:
    #         src = qa['source_dataset']
    #         sources[src] = sources.get(src, 0) + 1
        
    #     print("\nSource dataset별:")
    #     for src, cnt in sorted(sources.items(), key=lambda x: -x[1]):
    #         print(f"  - {src}: {cnt}개")
        
    #     # Category별
    #     categories = {}
    #     for qa in qa_list:
    #         cat = qa.get('category', 'uncategorized')
    #         categories[cat] = categories.get(cat, 0) + 1
        
    #     print("\nCategory별:")
    #     for cat, cnt in sorted(categories.items(), key=lambda x: -x[1]):
    #         print(f"  - {cat}: {cnt}개")


def main():
    # 설정

    
    # 입력 경로
    json_files = glob("/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/guidelines/qa/*.json")
    jsonl_files = [
        '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/qa_dataset/qa_dataset_unified.jsonl',
        '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/qa_unified_ai_hub/qa_dataset_unified.jsonl'
    ]
    
    # 구조화된 파일과 OCR 파일 분리
    structured_files = [f for f in json_files if '대한신장학회_QA' in f or '건강보험웹진' in f]
    ocr_files = [f for f in json_files if f not in structured_files]
    
    # Builder 초기화
    builder = QABuilder(output_dir="/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output")
    
    all_qa = []
    all_additional = []
    
    # 1. 구조화된 JSON 처리
    print(f"\n[1/3] 구조화된 JSON 처리 ({len(structured_files)}개)")
    for file in tqdm(structured_files):
        qa_list = builder.process_structured_json(file)
        all_qa.extend(qa_list)
    
    # 2. OCR JSON 처리 (LLM 사용)
    print(f"\n[2/3] OCR JSON 처리 with LLM ({len(ocr_files)}개)")
    for file in tqdm(ocr_files):
        qa_list, additional_list = builder.process_ocr_json(file)
        all_qa.extend(qa_list)
        all_additional.extend(additional_list)
    
    # 3. JSONL 처리
    print(f"\n[3/3] JSONL 처리 ({len(jsonl_files)}개)")
    for file in jsonl_files:
        if Path(file).exists():
            qa_list = builder.process_jsonl(file)
            all_qa.extend(qa_list)
            print(f"  ✓ {Path(file).name}: {len(qa_list)}개")
    
    # 저장
    builder.save(all_qa, all_additional)
    
    print("\n✓ 완료!")


if __name__ == "__main__":
    main()