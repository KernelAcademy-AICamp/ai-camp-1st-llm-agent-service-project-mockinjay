# Parlant SingleToolBatchSchema 검증 오류 해결 방안

## 문제 요약

**핵심 원인**: GPT-4o가 Parlant의 `SingleToolBatchSchema`에서 요구하는 `argument_evaluations` 필드 중 일부를 누락하여 Pydantic 검증 실패

**누락된 필드**:

1. `acceptable_source_for_this_argument_according_to_its_tool_definition`
2. `evaluate_was_it_already_provided_and_should_it_be_provided_again`
3. `evaluate_is_it_potentially_problematic_to_guess_what_the_value_is_if_it_isnt_provided`

## 적용된 해결 방안

### 1. Agent Description에 JSON Schema 검증 가이드라인 추가

**파일**:

- `backend/Agent/medical_welfare/server/medical_welfare_server.py`
- `backend/Agent/research_paper/server/research_paper_server.py`

**내용**:

```python
**CRITICAL - JSON Schema Validation**:
When generating tool calls, you MUST include ALL required fields in argument_evaluations for EVERY parameter.
For every argument_evaluations entry, you must output ALL required schema fields exactly as named, including:
- acceptable_source_for_this_argument_according_to_its_tool_definition
- evaluate_was_it_already_provided_and_should_it_be_provided_again
- evaluate_is_it_potentially_problematic_to_guess_what_the_value_is_if_it_isnt_provided
- evaluate_is_it_provided_by_an_acceptable_source
- parameter_name
- is_optional
- valid_invalid_or_missing
- value_as_string

**NEVER omit or rename these fields, even for optional or missing arguments.**
```

### 2. 별도의 JSON Schema Validation Guideline 추가

**Medical Welfare Agent**: Guideline 5 추가
**Research Paper Agent**: Guideline 1 추가

**주요 내용**:

- 모든 tool call 시 8개 필수 필드 강제
- Optional 파라미터 처리 방법 명시
- `ckd_stage` 구체적 예시 제공
- 필드 누락/이름 변경 금지 규칙

### 3. Optional 파라미터 명확화

**`search_welfare_programs` 함수**:

- `query`: **REQUIRED**
- `category`: Optional
- `disease`: Optional
- `ckd_stage`: **Optional** (1-5), 미제공시 모든 단계 검색

**Docstring 업데이트**:

```python
Args:
    context: ToolContext
    query: 검색 쿼리 (예: "투석 지원", "의료비 지원") - **REQUIRED**
    category: (Optional) 카테고리 필터
    disease: (Optional) 질병 필터
    ckd_stage: (Optional) CKD 단계 (1-5), 제공되지 않으면 모든 단계 검색
```

## 구체적인 예시: ckd_stage 처리

### Optional 파라미터가 제공되지 않은 경우

```json
{
  "parameter_name": "ckd_stage",
  "acceptable_source_for_this_argument_according_to_its_tool_definition": "User should explicitly mention their CKD stage (1-5) or it can be omitted for general search",
  "evaluate_is_it_provided_by_an_acceptable_source": "User did not mention their CKD stage in the query",
  "evaluate_was_it_already_provided_and_should_it_be_provided_again": "Not provided yet, and it's optional so we can search without it",
  "evaluate_is_it_potentially_problematic_to_guess_what_the_value_is_if_it_isnt_provided": "Not problematic - this is an optional filter that broadens search results when omitted",
  "is_optional": true,
  "valid_invalid_or_missing": "missing",
  "value_as_string": null
}
```

## 기대 효과

1. **필드 누락 방지**: LLM이 모든 필수 필드를 포함하도록 명시적 지시
2. **Optional 파라미터 안정성**: `ckd_stage` 등 optional 파라미터도 완전한 스키마 준수
3. **검증 오류 해결**: Pydantic ValidationError 발생 방지
4. **안정적인 Tool Call**: Parlant SingleToolBatchSchema 완벽 호환

## 테스트 방법

### 1. 서버 재시작

```bash
# Unified Server 재시작
cd backend/Agent/parlant_common
python run_unified_server.py
```

### 2. 테스트 쿼리

```python
# Medical Welfare Agent 테스트
query = "투석 지원 프로그램 찾아줘"  # ckd_stage 미제공
query = "3기 환자를 위한 의료비 지원"  # ckd_stage 제공

# Research Paper Agent 테스트
query = "CKD 증상 알려줘"
```

### 3. 로그 확인

- `argument_evaluations` 내 8개 필드 모두 존재 확인
- ValidationError 미발생 확인

## 변경된 파일 목록

1. ✅ `backend/Agent/medical_welfare/server/medical_welfare_server.py`

   - Agent description에 JSON Schema validation 추가
   - Guideline 5 추가 (JSON Schema 검증)
   - `search_welfare_programs` docstring 업데이트

2. ✅ `backend/Agent/research_paper/server/research_paper_server.py`
   - Agent description에 JSON Schema validation 추가
   - Guideline 1 추가 (JSON Schema 검증)

## 추가 고려사항

### 만약 문제가 지속될 경우

1. **Parlant SDK 버전 확인**

   ```bash
   pip show parlant
   ```

2. **LLM 모델 변경 고려**

   - GPT-4o → GPT-4-turbo
   - JSON mode 강제 활성화

3. **Parlant 스키마 직접 수정** (최후 수단)
   - Parlant SDK fork
   - SingleToolBatchSchema 검증 로직 수정
   - 단, 업스트림 동기화 문제 발생 가능

## 결론

**핵심 해결책**: LLM 프롬프트 개선을 통한 필드 누락 방지

이 방법은 Parlant SDK를 수정하지 않고도 검증 오류를 해결할 수 있는 **가장 안전하고 효과적인 방법**입니다.
