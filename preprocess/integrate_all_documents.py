#!/usr/bin/env python3
"""
의료 데이터셋 통합 및 LLM 기반 메타데이터 생성
"""
import json
import os
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime
from openai import OpenAI, BadRequestError, RateLimitError
from glob import glob

class MedicalDataProcessor:
    def __init__(self, upstage_api_key: str, minimax_api_key: str = None):
        self.upstage_api_key = upstage_api_key
        self.minimax_api_key = minimax_api_key
        self.upstage_base_url = "https://api.upstage.ai/v1/solar"
        self.minimax_base_url = "https://api.minimax.chat/v1"
        
    def generate_id(self, text: str) -> str:
        """텍스트 기반 고유 ID 생성"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()[:16]
        
    def call_llm(self, text: str, task: str) -> Dict[str, Any]:
        """Upstage Solar LLM 호출 (MiniMax fallback)"""
        if task == "summarize":
            prompt = f"""다음 의료 관련 텍스트를 분석하여 JSON 형식으로 응답해주세요:

텍스트:
{text}

응답 형식 (JSON만):
{{
    "summary": "핵심 내용을 2-3문장으로 요약",
    "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
    "category": "카테고리명 (예: 만성콩팥병, 투석, 영양관리, 진료지침 등)"
}}"""
        else:  # fill_missing
            prompt = f"""다음 의료 텍스트의 누락된 정보를 채워주세요:

텍스트:
{text}

응답 형식 (JSON만):
{{
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "category": "적절한 카테고리명"
}}"""

        try:
            # Upstage Solar 우선 시도
            client = OpenAI(
                api_key=self.upstage_api_key, 
                base_url=self.upstage_base_url
            )

            response = client.chat.completions.create(
                model="solar-pro2",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 의료 문서 분석 전문가입니다. 항상 유효한 JSON 형식으로만 응답하세요."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
            )

            content = response.choices[0].message.content
            
            # JSON 추출
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)
            
        except (BadRequestError, RateLimitError) as e:
            # print(f"  ⚠ Upstage 실패, MiniMax로 전환: {e}")
            
            try:
                # MiniMax fallback
                client = OpenAI(
                    base_url="https://api.minimax.io/v1", 
                    api_key=os.getenv("MINIMAX_API_KEY")
                )

                response = client.chat.completions.create(
                    model="MiniMax-M2",
                    messages=[
                        {
                            "role": "system",
                            "content": "당신은 의료 문서 분석 전문가입니다. 항상 유효한 JSON 형식으로만 응답하세요."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.0,
                    extra_body={"reasoning_split": True},
                )
                content = response.choices[0].message.content
                
                # JSON 추출
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                print(content)
                return json.loads(content)
                
            except Exception as e2:
                print(f"  ✗ MiniMax도 실패: {e2}")
                return self._get_fallback_result(text, task)
                
        except Exception as e:
            print(f"  ✗ LLM 호출 실패: {e}")
            return self._get_fallback_result(text, task)
    
    def _get_fallback_result(self, text: str, task: str) -> Dict[str, Any]:
        """LLM 실패 시 기본값 반환"""
        if task == "summarize":
            return {
                "summary": text[:200] + "...",
                "keywords": ["의료", "건강"],
                "category": "기타"
            }
        else:
            return {
                "keywords": ["의료"],
                "category": "기타"
            }
    
    def process_unified_corpus(self, file_path: str) -> List[Dict[str, Any]]:
        """unified_medical_corpus.json 처리"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        results = []
        source_file = Path(file_path).name
        
        # training_data 처리
        training_data = data.get('training_data', [])
        print(f"  → training_data: {len(training_data)}개 레코드 처리 중...")
        
        for idx, item in enumerate(training_data):
            text = item.get('text', '')
            if not text or len(text.strip()) < 10:
                continue
                
            keywords = item.get('keyword', [])
            category = item.get('category', '')
            
            # 누락된 필드 LLM으로 채우기
            if not keywords or not category:
                print(f"    → training_data[{idx}] 누락 정보 채우는 중...")
                llm_result = self.call_llm(text, "fill_missing")
                if not keywords:
                    keywords = llm_result.get('keywords', [])
                if not category:
                    category = llm_result.get('category', '기타')
            
            record_id = self.generate_id(f"train_{source_file}_{text[:50]}_{idx}")
            
            results.append({
                'id': record_id,
                'text': text,
                'keyword': keywords,
                'category': category,
                'source_dataset': 'unified_medical_corpus',
                'source_file': source_file,
                'raw_text': text
            })
        
        print(f"  → training_data: {len([r for r in results])}개 레코드 추출 완료")
        
        # validation_data 처리
        validation_data = data.get('validation_data', [])
        print(f"  → validation_data: {len(validation_data)}개 레코드 처리 중...")
        
        validation_count_before = len(results)
        
        for idx, item in enumerate(validation_data):
            text = item.get('text', '')
            if not text or len(text.strip()) < 10:
                continue
                
            keywords = item.get('keyword', [])
            category = item.get('category', '')
            
            if not keywords or not category:
                print(f"    → validation_data[{idx}] 누락 정보 채우는 중...")
                llm_result = self.call_llm(text, "fill_missing")
                if not keywords:
                    keywords = llm_result.get('keywords', [])
                if not category:
                    category = llm_result.get('category', '기타')
            
            record_id = self.generate_id(f"valid_{source_file}_{text[:50]}_{idx}")
            
            results.append({
                'id': record_id,
                'text': text,
                'keyword': keywords,
                'category': category,
                'source_dataset': 'unified_medical_corpus',
                'source_file': source_file,
                'raw_text': text
            })
        
        validation_count = len(results) - validation_count_before
        print(f"  → validation_data: {validation_count}개 레코드 추출 완료")
        
        return results
    
    def extract_text_from_json(self, data: Any, depth: int = 0) -> str:
        """JSON에서 재귀적으로 text 추출"""
        texts = []
        max_depth = 5
        
        if depth > max_depth:
            return ""
        
        if isinstance(data, dict):
            if 'text' in data and isinstance(data['text'], str):
                texts.append(data['text'])
            for value in data.values():
                texts.append(self.extract_text_from_json(value, depth + 1))
        elif isinstance(data, list):
            for item in data:
                texts.append(self.extract_text_from_json(item, depth + 1))
        
        return " ".join(filter(None, texts))
    
    def process_other_file(self, file_path: str) -> List[Dict[str, Any]]:
        """기타 JSON 파일 처리"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 파일 크기 확인 (500KB = 512000 bytes)
        file_size = os.path.getsize(file_path)
        size_threshold = 512000  # 500KB

        source_file = Path(file_path).name

        if file_size < size_threshold:
            # 500KB 이하: 전체 JSON 구조를 문자열로 변환하여 LLM 입력
            print(f"  → 파일 크기 {file_size} bytes (< 500KB): 전체 내용 포함")
            
            # JSON 전체를 문자열로 변환
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            
            # LLM으로 메타데이터 생성 (전체 JSON 문자열 사용)
            llm_result = self.call_llm(json_str, "summarize")

            record_id = self.generate_id(f"{source_file}_{json_str[:100]}")

            return [{
                'id': record_id,
                'text': llm_result.get('summary'),
                'keyword': llm_result.get('keywords', ['의료']),
                'category': llm_result.get('category', '기타'),
                'source_dataset': 'guidelines',
                'source_file': source_file,
                'raw_text': json_str,  # 전체 JSON 문자열 저장
                'full_json': data  # 원본 JSON 구조도 보존
            }]
        else:
            # 500KB 이상: text 필드 추출하여 전체 저장
            print(f"  → 파일 크기 {file_size} bytes (>= 500KB): text 추출")
            
            # text 필드 추출
            raw_text = self.extract_text_from_json(data)
            
            if not raw_text or len(raw_text.strip()) < 10:
                print(f"  → 텍스트 추출 실패 또는 길이 부족")
                return []
            
            print(f"  → LLM으로 요약 생성 중... (원본 길이: {len(raw_text)}자)")

            # LLM으로 요약 및 메타데이터 생성 (최대 5000자로 제한하여 LLM 입력)
            preview_text = raw_text[:5000] if len(raw_text) > 5000 else raw_text
            llm_result = self.call_llm(preview_text, "summarize")

            record_id = self.generate_id(f"{source_file}_{raw_text[:100]}")

            return [{
                'id': record_id,
                'text': llm_result.get('summary'),
                'keyword': llm_result.get('keywords', ['의료']),
                'category': llm_result.get('category', '기타'),
                'source_dataset': 'guidelines',
                'source_file': source_file,
                'raw_text': raw_text  # 전체 텍스트 저장 (제한 제거)
            }]
    
    def process_directory(self, output_file: str):
        """디렉토리 내 모든 JSON 파일 처리"""
        all_results = []

        json_file = '/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_medical_corpus.json'
        print(f"처리 중: {json_file}")
        results = self.process_unified_corpus(str(json_file))
        all_results.extend(results)


        json_files = glob('/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/guidelines/ocr_upstage/text/*.json')
        
        for json_file in json_files:
            try:
                print(f"처리 중: {json_file}")
                results = self.process_other_file(str(json_file))
            
                all_results.extend(results)
                print(f"  → {len(results)}개 레코드 추출")
            except Exception as e:
                print(f"  ✗ 오류: {e}")
        
        # 결과 저장
        output_data = {
            'metadata': {
                'total_count': len(all_results),
                'created_at': datetime.now().isoformat(),
            },
            'data': all_results
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n완료: {len(all_results)}개 레코드를 {output_file}에 저장")


def main():
    from dotenv import load_dotenv
    load_dotenv()
    

    # 환경변수에서 API 키 가져오기
    upstage_api_key = os.getenv('UPSTAGE_API_KEY')
    minimax_api_key = os.getenv('MINIMAX_API_KEY')  # Optional fallback
    
    
    # 파라미터 설정
    output_file = "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output/processed_medical_data.json"
    
    print(f"출력 파일: {output_file}")
    print(f"MiniMax fallback: {'활성화' if minimax_api_key else '비활성화'}")
    print("-" * 60)
    
    # 처리 실행
    processor = MedicalDataProcessor(upstage_api_key, minimax_api_key)
    processor.process_directory(output_file)


if __name__ == "__main__":
    main()