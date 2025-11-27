# Intent Classification Prompt Design Document

## Executive Summary

This document describes the LLM-based intent classification system for CareGuide's RouterAgent, designed to replace simple keyword matching with sophisticated prompt engineering that ensures medical queries are never missed (False Negative Prevention).

**Problem**: "어떤 질환에 대해서 알려줘" was incorrectly classified as `CHIT_CHAT` instead of `MEDICAL_INFO`.

**Solution**: A multi-layered prompt engineering approach with Chain-of-Thought reasoning, explicit False Negative prevention rules, and comprehensive edge case handling.

---

## Design Principles

### 1. Safety-First Architecture
- **Medical queries are NEVER missed** (False Negative Prevention is paramount)
- Emergency symptoms trigger immediate 119 guidance
- High-risk categories (MEDICAL_INFO, HEALTH_RECORD) require strict validation
- When in doubt between CHIT_CHAT and MEDICAL_INFO → Always choose MEDICAL_INFO

### 2. Chain-of-Thought Reasoning
Every classification follows a 7-step process:
1. Emergency keyword check
2. Domain verification (medical vs non-medical)
3. Keyword analysis and extraction
4. Intent category mapping
5. False Negative verification ("Did I miss any medical intent?")
6. Confidence score assessment
7. Final decision with reasoning documentation

### 3. Multi-Intent Support
- Queries can have multiple intents (e.g., "CKD 증상과 먹을 음식" → MEDICAL_INFO + DIET_INFO)
- Primary intent is always listed first
- All relevant intents are included in the response

### 4. Structured Output
Enforces JSON output format for predictable parsing:
```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.95,
  "reasoning": "Step-by-step classification process...",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

---

## Intent Categories (9 Total)

### Critical Categories (High Risk - Never Miss)

#### 1. MEDICAL_INFO (의료 정보)
**Risk Level**: HIGH
**Agent**: medical_welfare

**Detection Criteria**:
- Disease names (질환, 질병, 병, disease, condition, disorder)
- Symptoms (증상, symptom)
- Treatments (치료, 투석, 이식, dialysis, transplant)
- Medical terminology (의학, 의료, medical, clinical)
- Drug/medication inquiries

**Critical Examples**:
- "어떤 질환에 대해서 알려줘" ← Contains "질환" (disease) → MEDICAL_INFO
- "투석 효과는?" ← Contains "투석" (dialysis) → MEDICAL_INFO
- "만성콩팥병 증상" ← Medical condition + symptoms → MEDICAL_INFO

**False Negative Prevention**:
> If a query contains ANY disease/symptom/treatment term, it MUST be classified as MEDICAL_INFO.
> NEVER classify medical questions as CHIT_CHAT.

#### 2. HEALTH_RECORD (건강 기록)
**Risk Level**: HIGH
**Agent**: medical_welfare

**Detection Criteria**:
- Lab values with numbers (크레아티닌 1.3, eGFR 60)
- Medical test results (검사 결과, test result)
- Health metrics (수치, 값, value, level)
- Specific biomarkers (크레아티닌, eGFR, BUN, creatinine)

**Examples**:
- "크레아티닌 1.3 의미는?"
- "eGFR 수치가 60인데 괜찮나요?"

### Specialized Categories

#### 3. DIET_INFO (식이 영양)
**Risk Level**: LOW
**Agent**: nutrition

**Detection Criteria**:
- Food and eating (음식, 먹다, 식단, food, eat, meal)
- Nutrients (영양, 단백질, 칼륨, sodium, potassium)
- Recipes (요리, 레시피, recipe)

#### 4. WELFARE_INFO (복지 정보)
**Risk Level**: LOW
**Agent**: medical_welfare

**Detection Criteria**:
- Financial support (지원금, 복지, subsidy)
- Insurance (보험, insurance)
- Government programs (제도, program)

#### 5. RESEARCH (연구 논문)
**Risk Level**: LOW
**Agent**: research_paper

**Detection Criteria**:
- Research and papers (연구, 논문, paper, study)
- Academic terms (학술, meta-analysis)
- Latest findings (최신, 최근, recent)

#### 6. LEARNING (학습 퀴즈)
**Risk Level**: LOW
**Agent**: None (handled by router)

**Detection Criteria**:
- Quiz requests (퀴즈, quiz, test)
- Learning intent (배우다, 학습, learn, study)

#### 7. POLICY (의료 정책)
**Risk Level**: LOW
**Agent**: research_paper

**Detection Criteria**:
- Guidelines (가이드라인, guideline, protocol)
- Policy (정책, policy)
- Clinical standards (KDIGO, K/DOQI)

### Control Categories

#### 8. CHIT_CHAT (일상 대화)
**Risk Level**: LOW
**Agent**: None (direct response)

**Detection Criteria**:
- Greetings (안녕, hello, hi)
- Casual topics (날씨, 심심, weather)
- Thank you/farewell (감사, thank you)

**CRITICAL RULE**:
> NEVER classify medical questions as CHIT_CHAT.
> When uncertain between CHIT_CHAT and MEDICAL_INFO → Choose MEDICAL_INFO.

#### 9. NON_MEDICAL (도메인 외 요청)
**Risk Level**: MEDIUM
**Agent**: None (rejection response)

**Detection Criteria**:
- Programming (코딩, coding, programming)
- Translation (번역, translate)
- Other subjects (수학, math, physics)

#### 10. ILLEGAL_REQUEST (불법/비윤리 요청)
**Risk Level**: CRITICAL
**Agent**: None (rejection response)

**Detection Criteria**:
- Money requests (돈, money)
- Harassment (욕, insult)
- Privacy violations (개인정보)

---

## Emergency Handling

### Emergency Keywords
```python
EMERGENCY_KEYWORDS = [
    "흉통", "가슴 통증",
    "호흡곤란", "숨쉬기 힘들",
    "의식저하", "정신 잃",
    "경련", "발작",
    "심한 두통",
    "구토", "토혈", "피를 토",
    "혈뇨", "피오줌",
    "심한 복통",
    "고열",
    # English equivalents
    "chest pain", "difficulty breathing", "seizure", "unconscious"
]
```

### Emergency Response Flow
1. Detect emergency keyword
2. Classify as MEDICAL_INFO
3. Set `is_emergency: true`
4. System provides immediate 119 guidance

Example:
```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 1.0,
  "reasoning": "EMERGENCY DETECTED: '흉통' (chest pain). Immediate medical attention required.",
  "is_emergency": true,
  "primary_intent": "MEDICAL_INFO"
}
```

---

## Classification Process (Chain-of-Thought)

### 7-Step Reasoning Framework

Every classification must document this process in the `reasoning` field:

```
1. Emergency Check: Does query contain emergency keywords?
2. Domain Check: Is this medical/health-related or off-topic?
3. Keyword Analysis: Identify key terms and medical concepts
4. Intent Mapping: Match to one or more intent categories
5. False Negative Verification: Did I miss any medical intent?
6. Confidence Assessment: How certain am I? (medical queries should be >0.8)
7. Final Decision: List all applicable intents
```

### Example: "어떤 질환에 대해서 알려줘"

```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.95,
  "reasoning": "1. No emergency keywords. 2. Domain: Medical (contains '질환'=disease). 3. Keywords: '질환' (disease/condition), '알려줘' (tell me). 4. This is a general inquiry about diseases/conditions → MEDICAL_INFO. 5. False Negative Check: Yes, this is definitely medical - contains '질환'. 6. High confidence 0.95. 7. Final: MEDICAL_INFO",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

### Example: Multi-Intent Query

Query: "CKD 증상과 먹을 음식 알려줘"

```json
{
  "intents": ["MEDICAL_INFO", "DIET_INFO"],
  "confidence": 0.93,
  "reasoning": "1. No emergency keywords. 2. Domain: Medical + Nutrition. 3. Keywords: 'CKD' (chronic kidney disease), '증상' (symptoms), '먹을 음식' (food to eat). 4. Two distinct requests: symptoms=MEDICAL_INFO, food=DIET_INFO. 5. False Negative Check: Medical info present (symptoms). 6. High confidence 0.93 for both. 7. Final: Both MEDICAL_INFO and DIET_INFO",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

---

## False Negative Prevention Strategy

### The Core Problem
**Medical queries must NEVER be missed** because:
- Patient safety depends on accurate medical information routing
- Misclassification could lead to inadequate medical guidance
- "어떤 질환에 대해서 알려줘" being classified as CHIT_CHAT is unacceptable

### Prevention Mechanisms

#### 1. Explicit Medical Term List
If query contains ANY of these, it MUST include MEDICAL_INFO or HEALTH_RECORD:
- Disease names: 질환, 질병, 병, disease, condition, disorder
- Symptoms: 증상, symptom
- Treatments: 치료, 투석, 이식, treatment, dialysis, transplant
- Medical terms: 의학, 의료, medical, clinical
- Lab values: 크레아티닌, eGFR, 수치, lab value
- Health status: "괜찮나요?", "정상인가요?", "is it normal?"

#### 2. Ambiguity Resolution Rules
```
When uncertain between:
- CHIT_CHAT vs MEDICAL_INFO → Choose MEDICAL_INFO
- DIET_INFO vs MEDICAL_INFO → Include both
- Any category vs MEDICAL_INFO → Favor MEDICAL_INFO
```

#### 3. Confidence Threshold
- Medical queries (MEDICAL_INFO, HEALTH_RECORD) require confidence >= 0.8
- Generic medical questions default to MEDICAL_INFO if confidence < 0.8
- Vague questions with disease terms → MEDICAL_INFO

#### 4. Step 5 Verification
Every classification includes explicit "False Negative Check" in reasoning:
```
5. False Negative Verification: Did I miss any medical intent?
   - Check: Contains disease terms? YES → MEDICAL_INFO
   - Check: Contains symptom terms? NO
   - Check: Contains treatment terms? NO
   - Conclusion: Medical content detected, MEDICAL_INFO is correct
```

---

## Edge Case Handling

### Case 1: Vague Medical Questions
**Query**: "어떤 질환에 대해서 알려줘"

**Analysis**:
- Contains "질환" (disease/condition) → Medical term detected
- Vague and generic, but clearly medical domain
- NEVER classify as CHIT_CHAT

**Classification**: MEDICAL_INFO (confidence: 0.95)

### Case 2: Short Medical Queries
**Query**: "투석 효과는?"

**Analysis**:
- "투석" is a specific medical treatment (dialysis)
- Even though short, it's clearly medical
- High specificity → High confidence

**Classification**: MEDICAL_INFO (confidence: 0.98)

### Case 3: Multi-Intent Queries
**Query**: "CKD 증상과 먹을 음식 알려줘"

**Analysis**:
- "CKD 증상" → MEDICAL_INFO
- "먹을 음식" → DIET_INFO
- Both intents are valid and should be included

**Classification**: ["MEDICAL_INFO", "DIET_INFO"] (primary: MEDICAL_INFO)

### Case 4: Health Status Questions
**Query**: "크레아티닌 1.3인데 괜찮나요?"

**Analysis**:
- Contains lab value (크레아티닌 1.3)
- Asks about normalcy ("괜찮나요?")
- This is health record interpretation

**Classification**: HEALTH_RECORD (confidence: 0.96)

### Case 5: Greetings with Context
**Query**: "안녕하세요, CKD에 대해 알려줘"

**Analysis**:
- "안녕하세요" is greeting, but query continues
- Main intent is "CKD에 대해 알려줘" → MEDICAL_INFO
- Greeting is secondary

**Classification**: MEDICAL_INFO (not CHIT_CHAT)

---

## Confidence Scoring Guidelines

### High Confidence (0.9 - 1.0)
- Clear, specific medical terminology (e.g., "투석", "크레아티닌", "CKD")
- Explicit greetings (e.g., "안녕하세요")
- Obvious non-medical requests (e.g., "코딩 가르쳐줘")
- Emergency keywords present

### Medium Confidence (0.7 - 0.89)
- Implied medical context (e.g., "어떤 질환")
- Multi-intent queries
- Ambiguous but leaning toward one category

### Low Confidence (< 0.7)
- Highly ambiguous queries
- Unusual phrasing
- Potentially off-topic but uncertain

**Rule**: Medical queries (MEDICAL_INFO, HEALTH_RECORD) should always be >= 0.8 confidence. If lower, default to MEDICAL_INFO for safety.

---

## Output Format Specification

### Required JSON Structure

```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.95,
  "reasoning": "Step-by-step classification process...",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `intents` | List[str] | Array of detected intent categories (1 or more) |
| `confidence` | float | Confidence score 0.0-1.0 |
| `reasoning` | str | Chain-of-Thought explanation documenting the 7-step process |
| `is_emergency` | bool | True if emergency keywords detected |
| `primary_intent` | str | The most relevant intent (first in list) |

### Validation Rules

1. `intents` must be non-empty
2. All values in `intents` must be valid category names
3. `confidence` must be between 0.0 and 1.0
4. `reasoning` must document the 7-step process
5. `primary_intent` must be `intents[0]`
6. `is_emergency` is true only if emergency keywords detected

---

## Integration with RouterAgent

### Current Implementation

File: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/Agent/router/agent.py`

The RouterAgent currently uses a simple prompt in the `_classify_intent()` method. This needs to be replaced with the sophisticated prompt from `prompts.py`.

### Recommended Changes

```python
# In agent.py
from Agent.router.prompts import (
    format_classification_prompt,
    is_emergency_query,
    IntentCategory
)

async def _classify_intent(self, query: str) -> List[str]:
    """Enhanced intent classification using sophisticated prompts"""

    # Quick emergency check
    if is_emergency_query(query):
        return [IntentCategory.MEDICAL_INFO]

    # Use formatted prompt from prompts.py
    messages = format_classification_prompt(query)

    try:
        content = await self._chat_completion(
            messages=messages,
            temperature=0.0,
            max_tokens=512
        )

        # Parse JSON response
        result = json.loads(content)

        # Validate and extract intents
        if result.get("intents") and isinstance(result["intents"], list):
            intents = result["intents"]

            # Log reasoning for debugging
            logger.info(f"Classification reasoning: {result.get('reasoning', 'N/A')}")

            # Check emergency flag
            if result.get("is_emergency"):
                logger.warning(f"EMERGENCY DETECTED in query: {query}")

            return intents
        else:
            logger.warning("Invalid classification response, using fallback")
            return self._rule_based_intent(query)

    except Exception as e:
        logger.error(f"Classification failed: {e}")
        return self._rule_based_intent(query)
```

---

## Test Cases and Validation

### Critical Test Cases

File: `prompts.py` contains 15 test cases covering:

1. **Vague Medical Questions** (the original problem)
   - "어떤 질환에 대해서 알려줘" → MEDICAL_INFO ✓

2. **Short Medical Queries**
   - "투석 효과는?" → MEDICAL_INFO ✓

3. **Diet Information**
   - "저염식 알려줘" → DIET_INFO ✓

4. **Greetings**
   - "안녕하세요" → CHIT_CHAT ✓

5. **Non-Medical Requests**
   - "코딩 가르쳐줘" → NON_MEDICAL ✓

6. **Health Records**
   - "크레아티닌 1.3 의미는?" → HEALTH_RECORD ✓

7. **Welfare Information**
   - "지원금 알려줘" → WELFARE_INFO ✓

8. **Multi-Intent**
   - "CKD 증상과 먹을 음식 알려줘" → ["MEDICAL_INFO", "DIET_INFO"] ✓

9. **Emergency Situations**
   - "흉통이 심해요" → MEDICAL_INFO (is_emergency: true) ✓

### Validation Script

```python
# test_intent_classification.py
from Agent.router.prompts import INTENT_CLASSIFICATION_TEST_CASES
from Agent.router.agent import RouterAgent

async def run_tests():
    router = RouterAgent()

    passed = 0
    failed = 0

    for test in INTENT_CLASSIFICATION_TEST_CASES:
        query = test["query"]
        expected = test["expected_intents"]

        result = await router._classify_intent(query)

        if set(result) == set(expected):
            passed += 1
            print(f"✓ PASS: {query}")
        else:
            failed += 1
            print(f"✗ FAIL: {query}")
            print(f"  Expected: {expected}")
            print(f"  Got: {result}")

    print(f"\nResults: {passed} passed, {failed} failed")

# Run tests
import asyncio
asyncio.run(run_tests())
```

---

## Monitoring and Metrics

### Key Performance Indicators

1. **False Negative Rate** (Target: < 0.1%)
   - Medical queries incorrectly classified as non-medical
   - Most critical metric for patient safety

2. **Classification Accuracy** (Target: > 95%)
   - Correct intent assigned for single-intent queries

3. **Multi-Intent Recall** (Target: > 90%)
   - Both intents detected in multi-intent queries

4. **Confidence Score Distribution**
   - Medical queries should cluster around 0.8-1.0
   - Low confidence queries need manual review

### Logging Strategy

```python
logger.info(f"Query: {query}")
logger.info(f"Intents: {result['intents']}")
logger.info(f"Confidence: {result['confidence']}")
logger.info(f"Reasoning: {result['reasoning']}")
if result['is_emergency']:
    logger.warning(f"EMERGENCY: {query}")
```

### A/B Testing

Compare old vs new classification:
1. Run both systems in parallel (shadow mode)
2. Log discrepancies
3. Manual review of differences
4. Measure False Negative rate reduction

---

## Future Improvements

### 1. Few-Shot Learning Enhancement
Add domain-specific examples to prompt:
```python
examples = [
    {"query": "어떤 질환에 대해서 알려줘", "classification": "MEDICAL_INFO"},
    {"query": "투석 효과는?", "classification": "MEDICAL_INFO"},
    # ... more examples
]
```

### 2. Active Learning
- Collect low-confidence queries for manual labeling
- Periodically update prompt with new edge cases

### 3. Semantic Search for Intent
- Use embeddings to find similar queries
- Classify based on nearest neighbors in intent space

### 4. Multi-Model Ensemble
- Run classification with multiple models (GPT-4, Claude, Gemini)
- Vote on final classification
- Increased reliability for critical medical queries

### 5. User Feedback Loop
- Allow users to report misclassifications
- Track common failure patterns
- Continuous prompt refinement

---

## Appendix: Prompt Engineering Techniques Used

### 1. Role-Playing
```
"You are an expert medical intent classifier for CareGuide..."
```
Establishes expertise and domain context.

### 2. Chain-of-Thought (CoT)
```
"For each query, follow this process and document it in 'reasoning':
1. Emergency Check
2. Domain Check
..."
```
Forces step-by-step reasoning, improving accuracy.

### 3. Structured Output Specification
```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.95,
  ...
}
```
Enforces predictable, parsable output.

### 4. Few-Shot Examples
Provides 9 detailed examples with reasoning in system prompt.

### 5. Meta-Prompting
```
"**IMPORTANT**: When in doubt between CHIT_CHAT and MEDICAL_INFO, ALWAYS choose MEDICAL_INFO."
```
Self-referential instructions that guide model behavior.

### 6. Safety Constraints
```
"**The system MUST NEVER miss medical queries**"
```
Explicit safety rules to prevent critical failures.

### 7. Contextual Guardrails
```
"Medical queries should have confidence >= 0.8"
```
Threshold-based constraints for quality control.

---

## Summary

This intent classification system represents a sophisticated application of prompt engineering principles:

1. **Safety-First Design**: Medical queries are never missed (False Negative Prevention)
2. **Structured Reasoning**: Chain-of-Thought ensures transparency and accuracy
3. **Edge Case Handling**: Explicit rules for ambiguous queries
4. **Multi-Intent Support**: Handles complex queries with multiple intents
5. **Emergency Detection**: Immediate routing for critical symptoms

The system transforms a simple keyword matcher into an intelligent classifier that understands context, handles ambiguity, and prioritizes patient safety.

**Key Achievement**: "어떤 질환에 대해서 알려줘" will now correctly classify as MEDICAL_INFO with 95% confidence, never as CHIT_CHAT.
