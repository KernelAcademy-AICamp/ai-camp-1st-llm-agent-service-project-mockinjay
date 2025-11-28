# Router Agent - Intent Classification System

**Advanced prompt engineering for CareGuide's intent classification with False Negative prevention**

## Overview

This module implements a sophisticated LLM-based intent classification system for the CareGuide RouterAgent. It replaces simple keyword matching with advanced prompt engineering techniques to ensure medical queries are never missed.

## Problem Statement

**Original Issue**: "어떤 질환에 대해서 알려줘" (Tell me about some disease) was incorrectly classified as `CHIT_CHAT` instead of `MEDICAL_INFO`.

**Root Cause**: Keyword-based classification in the frontend was too simplistic and missed generic medical queries.

## Solution

A multi-layered prompt engineering approach with:

1. **Chain-of-Thought Reasoning**: 7-step classification process
2. **False Negative Prevention**: Explicit rules to never miss medical queries
3. **Emergency Detection**: Immediate routing for critical symptoms
4. **Multi-Intent Support**: Handles complex queries with multiple intents
5. **Structured Output**: JSON format for predictable parsing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Query                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Emergency Keyword Check                          │
│  (Quick pre-filter for emergency symptoms)                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         LLM-Based Intent Classification                     │
│  • Chain-of-Thought reasoning (7 steps)                    │
│  • False Negative prevention rules                         │
│  • Multi-intent detection                                  │
│  • Confidence scoring                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Structured JSON Output                           │
│  {                                                          │
│    "intents": ["MEDICAL_INFO"],                            │
│    "confidence": 0.95,                                     │
│    "reasoning": "...",                                     │
│    "is_emergency": false,                                 │
│    "primary_intent": "MEDICAL_INFO"                       │
│  }                                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         Agent Mapping & Routing                             │
│  MEDICAL_INFO → research_paper                             │
│  DIET_INFO → nutrition                                     │
│  WELFARE_INFO → medical_welfare                            │
│  ...                                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           Execute Agent(s)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Files

### Core Files

| File | Description |
|------|-------------|
| `prompts.py` | Sophisticated prompts for intent classification |
| `agent.py` | RouterAgent implementation |
| `test_intent_classification.py` | Test suite for validation |

### Documentation

| File | Description |
|------|-------------|
| `INTENT_CLASSIFICATION_DESIGN.md` | Comprehensive design document |
| `README.md` | This file |

## Usage

### Basic Usage

```python
from Agent.router.prompts import format_classification_prompt
from openai import AsyncOpenAI

client = AsyncOpenAI()

# Format the prompt
messages = format_classification_prompt("어떤 질환에 대해서 알려줘")

# Call LLM
response = await client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    temperature=0.0,
    max_tokens=512
)

# Parse result
result = json.loads(response.choices[0].message.content)
print(result["intents"])  # ["MEDICAL_INFO"]
print(result["confidence"])  # 0.95
```

### Integration with RouterAgent

The RouterAgent automatically uses the sophisticated prompts:

```python
from Agent.router.agent import RouterAgent
from Agent.core.contracts import AgentRequest

router = RouterAgent()

request = AgentRequest(
    query="어떤 질환에 대해서 알려줘",
    context={}
)

response = await router.process(request)
print(response.answer)
```

### Emergency Detection

Quick pre-filter for emergency keywords:

```python
from Agent.router.prompts import is_emergency_query

if is_emergency_query("흉통이 심해요"):
    # Immediate emergency routing
    print("Emergency detected!")
```

### Intent Metadata

Get metadata about intent categories:

```python
from Agent.router.prompts import get_intent_metadata

metadata = get_intent_metadata()
medical_info = metadata["MEDICAL_INFO"]

print(medical_info["name"])  # "의료 정보"
print(medical_info["risk_level"])  # "high"
print(medical_info["requires_strict_validation"])  # True
```

## Intent Categories

### 9 Categories (Aligned with Frontend)

1. **MEDICAL_INFO** (의료 정보) - High Risk
   - Diseases, symptoms, treatments, medications
   - Examples: "어떤 질환에 대해서 알려줘", "투석 효과는?"

2. **DIET_INFO** (식이 영양) - Low Risk
   - Food, nutrition, diet, recipes
   - Examples: "저염식 알려줘", "콩팥에 좋은 음식"

3. **HEALTH_RECORD** (건강 기록) - High Risk
   - Lab results, test values, health metrics
   - Examples: "크레아티닌 1.3 의미는?", "eGFR 60인데 괜찮나요?"

4. **WELFARE_INFO** (복지 정보) - Low Risk
   - Financial support, insurance, government programs
   - Examples: "지원금 알려줘", "투석 환자 지원금"

5. **RESEARCH** (연구 논문) - Low Risk
   - Academic research, papers, latest studies
   - Examples: "최신 CKD 치료법 연구", "PubMed 검색해줘"

6. **LEARNING** (학습 퀴즈) - Low Risk
   - Educational quizzes, knowledge tests
   - Examples: "콩팥 퀴즈 내봐", "CKD 배우고 싶어요"

7. **POLICY** (의료 정책) - Low Risk
   - Medical policies, guidelines, protocols
   - Examples: "KDIGO 가이드라인", "진료 지침"

8. **CHIT_CHAT** (일상 대화) - Low Risk
   - Greetings, casual conversation
   - Examples: "안녕하세요", "고마워"

9. **NON_MEDICAL** (도메인 외 요청) - Medium Risk
   - Non-medical requests (coding, translation, etc.)
   - Examples: "코딩 가르쳐줘", "번역해줘"

10. **ILLEGAL_REQUEST** (불법/비윤리 요청) - Critical Risk
    - Illegal or unethical requests
    - Examples: "돈 보내줘", "욕해줘"

## Classification Process

### 7-Step Chain-of-Thought

Every classification follows this documented process:

```
1. Emergency Check: Does query contain emergency keywords?
2. Domain Check: Is this medical/health-related or off-topic?
3. Keyword Analysis: Identify key terms and medical concepts
4. Intent Mapping: Match to one or more intent categories
5. False Negative Verification: Did I miss any medical intent?
6. Confidence Assessment: How certain am I? (medical queries should be >0.8)
7. Final Decision: List all applicable intents
```

### Example Classification

**Query**: "어떤 질환에 대해서 알려줘"

```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.95,
  "reasoning": "1. No emergency keywords. 2. Domain: Medical (contains '질환'=disease). 3. Keywords: '질환' (disease/condition), '알려줘' (tell me). 4. This is a general inquiry about diseases/conditions → MEDICAL_INFO. 5. False Negative Check: Yes, this is definitely medical - contains '질환'. 6. High confidence 0.95. 7. Final: MEDICAL_INFO",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

## False Negative Prevention

### Critical Rules

**NEVER miss medical queries** by enforcing these rules:

1. **Medical Term Detection**: If query contains ANY of these, classify as MEDICAL_INFO:
   - Disease names: 질환, 질병, 병, disease, condition
   - Symptoms: 증상, symptom
   - Treatments: 치료, 투석, 이식, dialysis, transplant
   - Medical terms: 의학, 의료, medical

2. **Ambiguity Resolution**:
   - Uncertain between CHIT_CHAT and MEDICAL_INFO? → Choose MEDICAL_INFO
   - Uncertain between DIET_INFO and MEDICAL_INFO? → Include both

3. **Confidence Threshold**:
   - Medical queries require confidence >= 0.8
   - If confidence < 0.8 but medical terms present → Default to MEDICAL_INFO

4. **Explicit Verification**:
   - Step 5 in Chain-of-Thought explicitly asks: "Did I miss any medical intent?"

## Testing

### Run Test Suite

```bash
cd /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/Agent/router

# Run all tests
python test_intent_classification.py

# Interactive mode
python test_intent_classification.py --mode interactive

# Helper tests only
python test_intent_classification.py --mode helpers
```

### Test Cases

The test suite includes 15 critical test cases:

```python
# Critical Test: Original Problem
{
  "query": "어떤 질환에 대해서 알려줘",
  "expected_intents": ["MEDICAL_INFO"],
  "min_confidence": 0.8
}

# Emergency Detection
{
  "query": "흉통이 심해요",
  "expected_intents": ["MEDICAL_INFO"],
  "is_emergency": True
}

# Multi-Intent
{
  "query": "CKD 증상과 먹을 음식 알려줘",
  "expected_intents": ["MEDICAL_INFO", "DIET_INFO"]
}
```

### Expected Output

```
================================================================================
Starting Intent Classification Test Suite
Total test cases: 15
================================================================================

Testing: 어떤 질환에 대해서 알려줘
Expected: ['MEDICAL_INFO']
Actual: ['MEDICAL_INFO']
Confidence: 0.95
✓ PASS

...

================================================================================
TEST SUMMARY
================================================================================
Total: 15
Passed: 15 (100.0%)
Failed: 0
================================================================================

CRITICAL TEST RESULT
================================================================================
Query: 어떤 질환에 대해서 알려줘
Expected: MEDICAL_INFO
Actual: ['MEDICAL_INFO']
Status: ✓ PASS
Confidence: 0.95
================================================================================
```

## Prompt Engineering Techniques

### Techniques Used

1. **Role-Playing**: "You are an expert medical intent classifier..."
2. **Chain-of-Thought**: 7-step reasoning process
3. **Structured Output**: Enforced JSON format
4. **Few-Shot Learning**: 9 detailed examples in system prompt
5. **Meta-Prompting**: Self-referential instructions
6. **Safety Constraints**: "MUST NEVER miss medical queries"
7. **Contextual Guardrails**: Confidence thresholds

### Why These Techniques Work

- **Role-Playing**: Establishes expertise and domain context
- **Chain-of-Thought**: Forces step-by-step reasoning, improving accuracy
- **Structured Output**: Ensures predictable, parsable responses
- **Few-Shot Examples**: Provides concrete patterns to follow
- **Meta-Prompting**: Guides model behavior at a higher level
- **Safety Constraints**: Prevents critical failures
- **Guardrails**: Quality control mechanisms

## Performance Metrics

### Target KPIs

| Metric | Target | Description |
|--------|--------|-------------|
| False Negative Rate | < 0.1% | Medical queries missed |
| Classification Accuracy | > 95% | Correct intent assigned |
| Multi-Intent Recall | > 90% | Both intents detected |
| Confidence (Medical) | 0.8 - 1.0 | Medical query confidence |

### Monitoring

```python
logger.info(f"📊 Intent Classification:")
logger.info(f"   Query: {query}")
logger.info(f"   Intents: {intents}")
logger.info(f"   Confidence: {confidence:.2f}")
logger.info(f"   Emergency: {is_emergency}")
logger.info(f"   Reasoning: {reasoning[:200]}...")
```

## Emergency Handling

### Emergency Keywords

```python
EMERGENCY_KEYWORDS = [
    "흉통", "가슴 통증",
    "호흡곤란", "숨쉬기 힘들",
    "의식저하", "정신 잃",
    "경련", "발작",
    "심한 두통",
    "구토", "토혈",
    "혈뇨", "피오줌",
    "심한 복통",
    "고열",
    "chest pain", "difficulty breathing", "seizure", "unconscious"
]
```

### Emergency Response Flow

1. Quick keyword check (pre-LLM filter)
2. If emergency detected → Route to research_paper immediately
3. Set `is_emergency: true` flag
4. Agent provides 119 emergency guidance

## Future Enhancements

### Planned Improvements

1. **Few-Shot Enhancement**: Add more domain-specific examples
2. **Active Learning**: Collect low-confidence queries for labeling
3. **Semantic Search**: Use embeddings for intent classification
4. **Multi-Model Ensemble**: Vote across GPT-4, Claude, Gemini
5. **User Feedback Loop**: Track and fix misclassifications

### Research Directions

- **Self-Consistency**: Generate multiple responses, select most common
- **Tree-of-Thoughts**: Explore multiple reasoning paths
- **Reflection**: Model critiques its own classification
- **Tool Use**: Call external validators for high-stakes queries

## Troubleshooting

### Common Issues

**Issue**: Classification returns CHIT_CHAT for medical queries

**Solution**: Check if medical terms are in the query. The prompt explicitly prevents this, but if it happens:
1. Review the query for medical keywords
2. Check confidence score (should be >= 0.8 for medical)
3. Examine reasoning in logs
4. Verify prompt is being used correctly

**Issue**: Low confidence scores

**Solution**:
1. Check if query is ambiguous or vague
2. Review reasoning to understand why confidence is low
3. Consider adding more examples to the prompt

**Issue**: Multi-intent not detected

**Solution**:
1. Verify query contains clear signals for multiple intents
2. Check if both intents are valid according to the prompt
3. Review reasoning to see which intent was prioritized

## Contributing

### Adding New Test Cases

Edit `prompts.py` and add to `INTENT_CLASSIFICATION_TEST_CASES`:

```python
{
    "query": "Your test query here",
    "expected_intents": ["MEDICAL_INFO"],
    "expected_primary": "MEDICAL_INFO",
    "min_confidence": 0.8,
    "description": "Description of what this tests"
}
```

### Updating Prompts

Edit `INTENT_CLASSIFICATION_SYSTEM_PROMPT` in `prompts.py`. Be careful to:
1. Maintain the 7-step Chain-of-Thought structure
2. Keep False Negative prevention rules
3. Preserve emergency detection logic
4. Update examples if categories change

## References

### Related Files

- Frontend Intent Types: `/new_frontend/src/types/intent.ts`
- Frontend Router: `/new_frontend/src/services/intentRouter.ts`
- Backend Agent: `/backend/Agent/router/agent.py`

### Documentation

- Design Document: `INTENT_CLASSIFICATION_DESIGN.md`
- PRD: CareGuide PRD v0.95

### Prompt Engineering Resources

- Chain-of-Thought: Wei et al. (2022)
- Tree-of-Thoughts: Yao et al. (2023)
- Self-Consistency: Wang et al. (2022)
- ReAct: Yao et al. (2022)

## License

Copyright 2024 CareGuide Team. All rights reserved.

## Contact

For questions or issues, please contact the CareGuide development team.

---

**Last Updated**: 2024-11-26
**Version**: 1.0.0
**Status**: Production Ready
