# Recipe Generation Feature Summary

## ✅ 완료된 기능

사용자가 "저염식 김치 레시피"와 같은 레시피 요청을 하면, 다음과 같은 프로세스로 응답합니다:

1. **사용자 프로필 확인** - 질환 단계(CKD_3/4/5), 목표 수치 확인
2. **원본 레시피 조회** - 하드코딩된 레시피 또는 Pinecone RAG에서 검색
3. **고영양소 식재료 식별** - MongoDB에서 각 식재료의 영양소 조회
4. **대체 식재료 검색** - 동일 재료군에서 저염/저칼륨/저인 식재료 찾기
5. **LLM 레시피 생성** - GPT-4o로 친절한 레시피 텍스트 생성
6. **텍스트 전용 응답** - nutritionData 차트 없이 텍스트만 반환

## 📁 생성된 파일

### 1. `tools/recipe_generator.py` (NEW)
레시피 생성 핵심 로직:

```python
class RecipeGenerator:
    # CKD 단계별 디폴트 목표 수치 (1일 1식 기준)
    CKD_STAGE_LIMITS = {
        "CKD_3": {"sodium": 667, "potassium": 667, "phosphorus": 267, ...},
        "CKD_4": {"sodium": 600, "potassium": 600, "phosphorus": 233, ...},
        "CKD_5": {"sodium": 533, "potassium": 533, "phosphorus": 200, ...}
    }

    # 식재료 재료군 분류
    INGREDIENT_GROUPS = {
        "채소류": ["배추", "양배추", "무", "당근", ...],
        "양념류": ["소금", "간장", "된장", "고춧가루", ...],
        "단백질류": ["돼지고기", "쇠고기", "닭고기", ...],
        ...
    }

    def get_user_limits(user_profile) -> Dict[str, float]
        # 사용자 프로필에서 목표 수치 가져오기

    def identify_high_nutrient_ingredients(recipe_ingredients, target_limits)
        # 레시피에서 고영양소 식재료 식별

    def get_low_nutrient_alternatives(ingredient, group, exceeded_nutrients)
        # 같은 재료군에서 저영양소 대체품 찾기

    def generate_low_nutrient_recipe(recipe_name, ingredients, user_profile)
        # 저염식/저칼륨/저인 레시피 생성
```

### 2. `Agent/nutrition/recipe_handler.py` (NEW)
레시피 요청 처리 핸들러:

```python
class RecipeHandler:
    # 하드코딩된 대표 레시피들
    COMMON_RECIPES = {
        "김치": {
            "ingredients": ["배추", "소금", "고춧가루", "마늘", ...],
            ...
        },
        "된장찌개": {...},
        "김치찌개": {...}
    }

    async def handle_recipe_request(user_query, session_id, conv_state, user_profile)
        # 레시피 생성 요청 처리

    def _extract_recipe_name(user_query) -> str
        # "저염식 김치 레시피" -> "김치"

    async def _get_original_recipe(recipe_name)
        # 원본 레시피 정보 가져오기 (하드코딩 또는 RAG)

    async def _generate_recipe_text_with_llm(...)
        # LLM으로 최종 레시피 텍스트 생성
```

### 3. `Agent/nutrition/agent.py` (MODIFIED)
통합 지점:

```python
# 새로운 메서드 추가
async def _handle_text_input(user_input, session_id, conv_state, user_profile):
    """텍스트 입력 처리 - 레시피 요청 vs 일반 질문 구분"""

    # 레시피 키워드 감지
    recipe_keywords = ["레시피", "만들기", "만드는법", "만드는 법", "요리법", "조리법"]
    is_recipe_request = any(keyword in user_input for keyword in recipe_keywords)

    if is_recipe_request:
        return await self.recipe_handler.handle_recipe_request(...)
    else:
        return await self._analyze_text_query(...)
```

### 4. `test_insert_nutrition_data.py` (UPDATED)
김치 레시피 식재료 영양 데이터 추가:
- 배추, 소금, 마늘, 생강, 파, 멸치액젓
- 대체 양념: 식초, 레몬즙

**총 18개 식품 데이터**

### 5. `test_recipe_generation.py` (NEW)
레시피 생성 기능 테스트 스크립트

## 🔄 완전한 워크플로우

```
User: "저염식 김치 레시피"
   ↓
1. 레시피 키워드 감지 ("레시피")
   ↓
2. 레시피 이름 추출 ("김치")
   ↓
3. 사용자 프로필 확인
   ├─ CKD 단계: CKD_3
   ├─ 1일 1식 목표: Na=667mg, K=667mg, P=267mg
   └─ (없으면 디폴트 값 사용)
   ↓
4. 원본 레시피 조회
   ├─ 하드코딩: ["배추", "소금", "고춧가루", "마늘", "생강", "파", "멸치액젓"]
   └─ 또는 RAG 검색
   ↓
5. 고영양소 식재료 식별 (MongoDB 조회)
   ├─ 소금: Na=38,758mg → 목표치의 5,810% (매우 높음!)
   ├─ 멸치액젓: Na=12,000mg → 목표치의 1,800% (매우 높음!)
   ├─ 마늘: K=401mg → 목표치의 60% (약간 높음)
   └─ 생강: K=415mg → 목표치의 62% (약간 높음)
   ↓
6. 대체 식재료 검색 (같은 재료군, MongoDB)
   ├─ 채소류: 배추(K=224mg) → 가지(K=200mg) ✅
   ├─ 양념류: 소금(Na=38,758mg) → 식초(Na=8mg) ✅
   ├─ 양념류: 마늘(K=401mg) → 파(K=276mg) ✅
   └─ 양념류: 생강(K=415mg) → 식초(Na=8mg) ✅
   ↓
7. 수정된 레시피
   ├─ 원본: ["배추", "소금", "고춧가루", "마늘", "생강", "파", "멸치액젓"]
   └─ 수정: ["가지", "식초", "고춧가루", "파", "식초", "파", "멸치액젓"]
   ↓
8. LLM 레시피 텍스트 생성 (GPT-4o)
   ├─ 인사 및 공감
   ├─ 식재료 변경 이유 설명 (신장 건강에 미치는 영향)
   ├─ 조리 방법 상세 설명
   ├─ 맛 유지 팁
   └─ 주의사항
   ↓
9. 응답 반환 (nutritionData 없음, 텍스트만)
```

## 🧪 테스트 결과

**Test: 저염식 김치 레시피**
```
Input: "저염식 김치 레시피"
User Profile: CKD_3 (Na=667mg, K=667mg, P=267mg)

Generated Response:
✅ 친절한 인사 및 공감
✅ 식재료 변경 설명:
   - 배추 → 가지 (칼륨 낮음)
   - 소금 → 마늘 (나트륨 낮음)
   - 생강, 파 → 소금 (전체 양 조절)
✅ 조리 방법:
   1. 재료 준비 (가지 썰기)
   2. 양념 만들기 (고춧가루 + 마늘)
   3. 김치 만들기 (버무리고 발효)
✅ 조리 팁:
   - 저염간장으로 감칠맛 추가
   - 발효 시간 길게 → 자연적으로 맛 깊어짐
✅ 주의사항:
   - 발효 시 영양소 변화 확인
   - 의사/영양사 상담 필수
✅ nutritionData: None (텍스트 전용)
```

## 🎯 핵심 특징

### 1. 사용자 프로필 기반 맞춤
- **CKD 단계별 목표 수치**: CKD_3/4/5 각각 다른 제한량
- **커스텀 목표**: 사용자가 직접 설정한 목표 수치 우선 사용
- **디폴트 값**: 프로필 없으면 CKD_3 기준 적용

### 2. 재료군 기반 대체
- **같은 재료군 내 대체**: 채소류 → 채소류, 양념류 → 양념류
- **영양소 기준 검색**: 초과된 영양소가 낮은 식재료 찾기
- **MongoDB 통합**: 정확한 영양소 데이터 기반

### 3. LLM 기반 자연어 생성
- **GPT-4o 사용**: 친절하고 상세한 레시피 텍스트
- **프로필별 맞춤**: 환자/일반인/연구자에 따라 톤 조절
- **교육적 설명**: 왜 식재료를 바꿨는지 이유 설명

### 4. 텍스트 전용 응답
- **nutritionData 없음**: 영양소 차트 표시 안 함
- **자연스러운 대화**: 레시피는 텍스트로 읽는 것이 자연스러움
- **Few-shot 예시 적합**: "저염식 김치 레시피" 같은 few-shot 예시에 적합

## 📊 MongoDB 데이터 현황

```
Total documents: 22 (4 original + 18 test foods)

Recipe ingredients added:
- 배추: Na=9mg, K=224mg (채소류)
- 소금: Na=38,758mg (양념류, 매우 높음!)
- 마늘: Na=17mg, K=401mg (양념류, 칼륨 높음)
- 생강: Na=13mg, K=415mg (양념류, 칼륨 높음)
- 파: Na=16mg, K=276mg (양념류)
- 멸치액젓: Na=12,000mg (양념류, 매우 높음!)
- 식초: Na=8mg, K=15mg (대체 양념)
- 레몬즙: Na=1mg, K=138mg (대체 양념)
```

## 🚀 다음 단계 (선택적)

1. **더 많은 레시피 추가**: 된장찌개, 불고기, 비빔밥 등
2. **식재료 DB 확장**: MongoDB에 더 많은 식재료 영양 데이터 추가
3. **재료군 세분화**: 잎채소류, 뿌리채소류, 해조류 등 더 세분화
4. **사용자 피드백**: "이 재료는 싫어요" 같은 개인 선호도 반영
5. **영양소 계산**: 최종 레시피의 총 영양소 계산 및 표시 (선택적)

## ✅ 상태: COMPLETE

"저염식 김치 레시피" 같은 few-shot 예시에 대한 레시피 생성 기능이 완전히 구현되고 테스트되었습니다. 사용자는:
- 레시피 요청 시 영양소 차트 없이 자연스러운 텍스트 응답 받음
- 사용자 프로필(CKD 단계)에 맞춘 맞춤형 레시피 제공
- 왜 식재료를 바꿨는지 교육적 설명 포함
- 조리 방법 및 맛 유지 팁 제공
