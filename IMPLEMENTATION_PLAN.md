# CareGuide 챗봇 개선 구현 계획서

## 📋 프로젝트 개요

**목표**: `parlant/basic.py`의 치명적/주요 문제 해결 및 PubMed API 통합

**핵심 기능**:
1. 4개 데이터 소스 통합 검색 (QA, 논문, 의료 데이터, PubMed API)
2. 검색 결과 LLM 정제
3. 프로필별 맞춤 응답 (researcher, patient, general)
4. Journey 활성화

---

## 📊 데이터 소스 (4개)

### 1. qa_enhanced.jsonl (2,224,451 lines)
```json
{
  "id": "d6182052db4c333b",
  "question": "복막투석을 시작하는 환자입니다...",
  "answer": "비행기 내에서 투석하기가...",
  "source_dataset": "대한신장학회",
  "category": "콩팥병 궁금증"
}
```

### 2. paper_dataset_enriched_s2_checkpoint_4850.jsonl (4,850 lines)
```json
{
  "title": "Efficacy of interpersonal psychotherapy for...",
  "abstract": "Evidence for the efficacy of treatments...",
  "metadata": {
    "keywords": ["Interpersonal psychotherapy", "PTSD"],
    "journal": "Journal of affective disorders",
    "authors": ["Salman Althobaiti", ...],
    "doi": "10.1016/j.jad.2019.12.021"
  }
}
```

### 3. medical_data_enhanced.jsonl (42,317 lines)
```json
{
  "id": "dccb4325f42bcafc",
  "text": "본 발명에 의한 안마장치는...",
  "keyword": ["척추부", "근육", "받침대"],
  "category": "재활의학/물리치료학"
}
```

### 4. PubMed API
- E-utilities API 사용
- 실시간 논문 검색

---

## 🔄 search_medical_qa Tool 동작 흐름

```
사용자 질문 입력
    ↓
[1단계] 프로필 추출
    ├─ customer.tags에서 "profile:researcher" 등 추출
    └─ 프로필별 최대 결과 수: researcher(10), patient(5), general(3)
    ↓
[2단계] 4개 소스 병렬 검색
    ├─ qa_enhanced.jsonl: 키워드 매칭 (question, answer 필드)
    ├─ paper_dataset.jsonl: 키워드 매칭 (title, abstract 필드)
    ├─ medical_data.jsonl: 키워드 매칭 (text, keyword 필드)
    └─ PubMed API: 검색 API 호출
    ↓
[3단계] 원본 결과 수집
    └─ 각 소스별 상위 N개 (N = 프로필별 max_results)
    ↓
[4단계] LLM 정제용 프롬프트 생성
    ├─ 검색 결과 요약
    ├─ 프로필별 언어 수준 지정
    │   ├─ researcher: "학술적이고 전문적인 용어"
    │   ├─ patient: "실용적이고 이해하기 쉽게"
    │   └─ general: "매우 쉽고 간단한 언어"
    └─ 출처 명시 요구
    ↓
[5단계] ToolResult 반환
    ├─ raw_results: 원본 검색 결과
    ├─ refinement_prompt: LLM이 사용할 정제 프롬프트
    └─ metadata: 각 소스별 결과 개수
    ↓
[6단계] Parlant Agent 처리
    └─ refinement_prompt를 사용하여 최종 답변 생성
```

---

## 💻 코드 구조

### 설정 상수
```python
PROFILE_LIMITS = {
    "researcher": {"max_results": 10, "detail_level": "high"},
    "patient": {"max_results": 5, "detail_level": "medium"},
    "general": {"max_results": 3, "detail_level": "low"}
}

DATA_PATHS = {
    "qa": "data/preprocess/unified_output/qa_enhanced.jsonl",
    "papers": "data/preprocess/unified_output/paper_dataset_enriched_s2_checkpoint_4850.jsonl",
    "medical": "data/preprocess/unified_output/medical_data_enhanced.jsonl"
}
```

### 데이터 로더
```python
QA_DATA = []       # 샘플링: 10,000개
PAPER_DATA = []    # 전체: 4,850개
MEDICAL_DATA = []  # 샘플링: 10,000개

def load_all_data():
    """3개 데이터셋 로드 (메모리 최적화)"""
```

### 핵심 함수
1. `get_profile(context)` - 프로필 추출
2. `simple_search(query, data, field, top_k)` - 키워드 검색
3. `search_pubmed_simple(query, max_results)` - PubMed API 호출
4. `llm_refine_results(query, raw_results, profile)` - LLM 정제 프롬프트 생성
5. `gather_all_sources(query, max_per_source)` - 4개 소스 병렬 검색

### Tools
1. `search_medical_qa` - **[핵심]** 4개 소스 통합 검색
2. `get_kidney_stage_info` - CKD 단계 정보 (프로필 추가)
3. `get_symptom_info` - 증상 정보 (프로필 추가)
4. `check_emergency_keywords` - 응급 키워드 감지 (유지)

---

## 🎯 프로필별 설정

| 프로필 | 최대 결과 수 | 언어 수준 | 설명 스타일 |
|--------|-------------|-----------|------------|
| **researcher** | 10 | high | 학술적, 전문 용어, 생물학적 메커니즘 |
| **patient** | 5 | medium | 실용적, 일상생활 적용, 자가관리 |
| **general** | 3 | low | 쉽고 간단, 전문 용어 최소화 |

---

## 📝 주요 수정 사항

### 1. 데이터 로딩 (앱 시작 시)
```python
async def main():
    load_all_data()  # ← 추가
    # ...
```

### 2. search_medical_qa Tool (완전 재작성)
- **Before**: 하드코딩된 mock 데이터
- **After**: 4개 소스 실제 검색 + LLM 정제

### 3. 프로필 추출 적용
- `get_kidney_stage_info`: profile 정보 추가
- `get_symptom_info`: profile 정보 추가

### 4. Guidelines 수정
- search_medical_qa Tool 사용 명시
- refinement_prompt 활용 안내

### 5. Journey 수정
- Step 2, 3에 search_medical_qa Tool 포함
- refinement_prompt 사용 가이드 추가

### 6. Session 생성 시 Journey 활성화
```python
session = await server.create_session(
    customer_id=customer.id,
    agent_id=agent.id,
    journey_id=journey.id  # ← 추가
)
```

### 7. 입력 검증 강화
```python
async def select_profile() -> str:
    while True:
        choice = input("선택 (1/2/3): ").strip()
        if choice in mapping:
            return mapping[choice]
        print("❌ 잘못된 입력입니다...")
```

---

## ✅ 완료 기준

- [ ] 3개 데이터셋 로드 완료 (QA, Papers, Medical)
- [ ] PubMed API 검색 작동
- [ ] search_medical_qa가 4개 소스 결과 반환
- [ ] LLM refinement_prompt 생성
- [ ] 프로필별 결과 수 제한 작동
- [ ] 모든 Tool에서 profile 정보 반환
- [ ] Journey 활성화 확인
- [ ] 잘못된 프로필 선택 시 재입력

---

## 🚀 구현 단계

### Phase 1: 데이터 로더 및 헬퍼 함수
1. `load_all_data()` 구현
2. `get_profile()` 구현
3. `simple_search()` 구현
4. `search_pubmed_simple()` 구현
5. `llm_refine_results()` 구현
6. `gather_all_sources()` 구현

### Phase 2: Tools 수정
1. `search_medical_qa` 재작성
2. `get_kidney_stage_info` 프로필 추가
3. `get_symptom_info` 프로필 추가

### Phase 3: Guidelines & Journey
1. `add_profile_guidelines()` 수정
2. `create_medical_info_journey()` 수정

### Phase 4: main() 수정
1. `load_all_data()` 호출 추가
2. Session에 journey_id 연결
3. `select_profile()` 입력 검증 강화

---

## 📌 제외된 항목

- ❌ 대화 루프 구현 (사용자 요청)
- ❌ 응급 키워드 통합 (기존 구조 유지)
- ❌ 로깅 시스템 (최소 구현)
- ❌ 별도 파일 분리 (basic.py에 통합)

---

## ⏱️ 예상 소요 시간

- **Phase 1** (데이터 로더): 1시간
- **Phase 2** (Tools): 1.5시간
- **Phase 3** (Guidelines/Journey): 0.5시간
- **Phase 4** (main 수정): 0.5시간
- **테스트 및 디버깅**: 1시간
- **총계**: 4-5시간

---

## 📖 참고 자료

### PubMed E-utilities API
- **Docs**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **esearch**: ID 검색
- **esummary**: 요약 정보

### Parlant SDK
- **ToolContext**: `get_customer()`, `get_tag()`
- **ToolResult**: `data` 반환
- **Journey**: Step별 tools 지정
- **Guidelines**: Tag 기반 조건부 실행

---

## 🔍 예상 시나리오

**사용자 질문**: "GFR 45는 어떤 단계인가요?"

**처리 과정**:
1. search_medical_qa 호출
2. 4개 소스 검색:
   - QA: "GFR", "45", "단계" 키워드 매칭
   - Papers: 관련 논문 검색
   - Medical: 의료 데이터 검색
   - PubMed: "GFR kidney stage" 검색
3. 원본 결과 수집 (총 10-20개)
4. LLM refinement_prompt 생성:
   ```
   사용자 질문: "GFR 45는 어떤 단계인가요?"

   QA 데이터: GFR 45는 CKD 3단계에 해당합니다...
   논문 데이터: Chronic kidney disease staging...
   의료 데이터: 신장 기능 평가...
   PubMed: GFR-based classification...

   프로필: patient
   요구사항: 실용적이고 이해하기 쉽게...
   ```
5. Parlant Agent가 refinement_prompt 처리
6. 최종 답변 생성:
   ```
   GFR 45는 CKD 3단계(중등도 신장 기능 저하)에 해당합니다.

   [QA 데이터에 따르면] 이 단계에서는...
   [PubMed 논문에서는] 식이 제한과 정기 검진이...

   ⚠️ 이 정보는 참고용이며 의학적 조언을 대체할 수 없습니다.
   ```

---

**작성일**: 2025-01-09
**버전**: 1.0
