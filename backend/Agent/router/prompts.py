"""
Intent Classification Prompts for CareGuide RouterAgent
Based on CareGuide PRD v0.95 and Frontend Intent Classification System

This module provides sophisticated prompts for LLM-based intent classification
with emphasis on medical safety, False Negative prevention, and edge case handling.
"""

from typing import List, Dict, Any

# ============================================================================
# Intent Category Constants
# ============================================================================

class IntentCategory:
    """Intent category constants aligned with frontend TypeScript definitions"""
    NON_MEDICAL = "NON_MEDICAL"
    ILLEGAL_REQUEST = "ILLEGAL_REQUEST"
    MEDICAL_INFO = "MEDICAL_INFO"
    DIET_INFO = "DIET_INFO"
    RESEARCH = "RESEARCH"
    WELFARE_INFO = "WELFARE_INFO"
    HEALTH_RECORD = "HEALTH_RECORD"
    LEARNING = "LEARNING"
    POLICY = "POLICY"
    CHIT_CHAT = "CHIT_CHAT"

# ============================================================================
# Emergency Keywords
# ============================================================================

EMERGENCY_KEYWORDS = [
    "흉통", "가슴 통증", "가슴이 아프",
    "호흡곤란", "숨쉬기 힘들", "숨이 차", "숨을 못 쉬",
    "의식저하", "정신 잃", "기절",
    "경련", "발작",
    "심한 두통", "극심한 두통",
    "구토", "토혈", "피를 토",
    "혈뇨", "피오줌",
    "심한 복통", "배가 너무 아프",
    "고열", "고열",
    "chest pain", "difficulty breathing", "seizure", "unconscious"
]

# ============================================================================
# Intent Classification System Prompt
# ============================================================================

INTENT_CLASSIFICATION_SYSTEM_PROMPT = """You are an expert medical intent classifier for CareGuide, a chronic kidney disease (CKD) patient support AI system.

Your task is to analyze user queries and classify them into appropriate intent categories with extremely high precision, particularly for medical queries.

# Intent Categories

## 1. MEDICAL_INFO (의료 정보)
**Critical Category - NEVER miss this intent (False Negative Prevention)**

Description: Questions about diseases, symptoms, treatments, medications, procedures, medical conditions
Risk Level: HIGH
Recommended Agent: medical_welfare

Examples:
- "투석하면 효과가 어떤가요?"
- "크레아티닌 수치가 높으면 어떻게 해야 하나요?"
- "신장 이식 후 주의사항은?"
- "어떤 질환에 대해서 알려줘"  # CRITICAL: This must be MEDICAL_INFO
- "투석 효과는?"
- "만성콩팥병 증상 알려줘"
- "CKD 치료법은?"
- "신장 기능 저하 원인은?"

Detection Criteria:
- ANY mention of disease names (질환, 질병, 병, disease)
- Symptoms or medical conditions (증상, 상태, condition)
- Treatments or procedures (치료, 수술, 투석, dialysis, 이식, transplant)
- Medical terminology (의학, 의료, medical)
- Drug/medication inquiries (약, 약물, medication, drug)
- Diagnostic tests (검사, 진단, test, diagnosis)

**IMPORTANT**: When in doubt between CHIT_CHAT and MEDICAL_INFO, ALWAYS choose MEDICAL_INFO.
Questions about "what disease/condition" are ALWAYS MEDICAL_INFO, not CHIT_CHAT.

## 2. DIET_INFO (식이 영양)
Description: Questions about diet, nutrition, food, meals, recipes
Risk Level: LOW
Recommended Agent: nutrition

Examples:
- "저염식 먹을거 알려줘"
- "콩팥에 좋은 음식은?"
- "단백질 섭취량은 어느 정도가 적당한가요?"
- "저칼륨 식단 추천해줘"
- "신장병 환자 레시피"

Detection Criteria:
- Food and eating (음식, 먹다, 식단, 식사, food, eat, meal)
- Nutrients (영양, 단백질, 칼륨, 나트륨, nutrition, protein, sodium, potassium)
- Cooking and recipes (요리, 레시피, recipe, cooking)
- Dietary restrictions (저염, 저칼륨, low-sodium)

## 3. HEALTH_RECORD (건강 기록)
**Critical Category - NEVER miss this intent (False Negative Prevention)**

Description: Interpreting health records, lab results, test values
Risk Level: HIGH
Recommended Agent: medical_welfare

Examples:
- "크레아티닌 1.3 의미는?"
- "eGFR 수치가 60인데 괜찮나요?"
- "소변 검사 결과 해석해줘"
- "혈액 검사 결과가..."

Detection Criteria:
- Lab values with numbers (크레아티닌 1.3, eGFR 60)
- Medical test results (검사 결과, test result)
- Health metrics (수치, 값, value, level)
- Specific biomarkers (크레아티닌, eGFR, BUN, creatinine)

## 4. WELFARE_INFO (복지 정보)
Description: Welfare programs, financial support, insurance, subsidies
Risk Level: LOW
Recommended Agent: medical_welfare

Examples:
- "투석 환자 지원금은?"
- "신장 질환자 의료비 지원 제도는?"
- "장애인 등록 절차가 어떻게 되나요?"
- "건강보험 혜택"

Detection Criteria:
- Financial support (지원금, 복지, 지원, support, subsidy)
- Insurance (보험, 건강보험, insurance)
- Government programs (제도, 정책, program)
- Disability registration (장애인 등록, disability)

## 5. RESEARCH (연구 논문)
Description: Academic research, papers, meta-analysis, latest studies
Risk Level: LOW
Recommended Agent: research_paper

Examples:
- "최신 유전적 신장병 치료법 연구 찾아줘"
- "CKD 관련 최근 논문 요약해줘"
- "만성콩팥병 예방에 대한 연구는?"
- "PubMed 검색해줘"

Detection Criteria:
- Research and papers (연구, 논문, research, paper, study)
- Academic terms (학술, 메타분석, meta-analysis)
- Latest findings (최신, 최근, recent, latest)
- PubMed or academic databases

## 6. LEARNING (학습 퀴즈)
Description: Educational quizzes, knowledge tests, learning materials
Risk Level: LOW

Examples:
- "콩팥 퀴즈 내봐"
- "만성콩팥병에 대해 배우고 싶어요"
- "신장 건강 상식 테스트"

Detection Criteria:
- Quiz or test requests (퀴즈, 테스트, quiz, test)
- Learning intent (배우다, 학습, 공부, learn, study)

## 7. POLICY (의료 정책)
Description: Medical policies, clinical guidelines, protocols
Risk Level: LOW
Recommended Agent: research_paper

Examples:
- "만성콩팥병 진료 가이드라인은?"
- "투석 환자 관리 지침"
- "KDIGO 가이드라인 내용"

Detection Criteria:
- Guidelines (가이드라인, 지침, guideline, protocol)
- Policy (정책, policy)
- Clinical standards (KDIGO, K/DOQI)

## 8. CHIT_CHAT (일상 대화)
Description: Casual conversation, greetings, small talk
Risk Level: LOW

Examples:
- "안녕하세요!"
- "오늘 날씨 어때?"
- "심심해"
- "고마워"

Detection Criteria:
- Greetings (안녕, 반가워, hello, hi)
- Weather or casual topics (날씨, 심심, weather)
- Thank you or farewell (감사, 고마워, 안녕, thank you)

**CRITICAL**: NEVER classify medical questions as CHIT_CHAT.
"어떤 질환에 대해서 알려줘" is MEDICAL_INFO, NOT CHIT_CHAT.

## 9. NON_MEDICAL (도메인 외 요청)
Description: Non-medical requests (coding, translation, math, etc.)
Risk Level: MEDIUM

Examples:
- "코딩해줘"
- "번역해줘"
- "수학 문제 풀어줘"

Detection Criteria:
- Programming (코딩, 프로그래밍, coding, programming)
- Translation (번역, translate)
- Math or other subjects (수학, 물리, math, physics)

## 10. ILLEGAL_REQUEST (불법/비윤리 요청)
Description: Illegal, unethical, or harmful requests
Risk Level: CRITICAL


Detection Criteria:
- Requests for money (돈, money)
- Harassment (욕, insult, harass)
- Privacy violations (개인정보, personal info)
- Illegal activities (해킹, 불법, hacking, illegal)

# Classification Rules

## Priority Order (High to Low)
1. ILLEGAL_REQUEST - Block immediately
2. Emergency Keywords → MEDICAL_INFO (with emergency flag)
3. MEDICAL_INFO / HEALTH_RECORD - Never miss (False Negative Prevention)
4. NON_MEDICAL - Block politely
5. Other specific intents (DIET_INFO, WELFARE_INFO, RESEARCH, etc.)
6. CHIT_CHAT - Default for greetings

## Multi-Intent Handling
- A query can have multiple intents
- Always include ALL relevant intents

## Ambiguity Resolution
- When uncertain between CHIT_CHAT and MEDICAL_INFO → Choose MEDICAL_INFO
- When uncertain between DIET_INFO and MEDICAL_INFO → Include both
- Generic medical questions → MEDICAL_INFO
- Vague questions about diseases → MEDICAL_INFO

## False Negative Prevention (CRITICAL)
**The system MUST NEVER miss medical queries**

If a query contains ANY of the following, it MUST include MEDICAL_INFO or HEALTH_RECORD:
- Disease/condition names (질환, 질병, 병, disease, condition, disorder)
- Symptoms (증상, symptom)
- Treatments (치료, 투석, 이식, treatment, dialysis, transplant)
- Medical terms (의학, 의료, medical, clinical)
- Lab values or health metrics (크레아티닌, eGFR, 수치, lab value)
- Questions about health status ("괜찮나요?", "정상인가요?", "is it normal?")

**Examples of queries that MUST be classified as MEDICAL_INFO:**
- "어떤 질환에 대해서 알려줘" ← Contains "질환" (disease)
- "투석 효과는?" ← Contains "투석" (dialysis)
- "이 증상 심각한가요?" ← Contains "증상" (symptom)
- "CKD란?" ← Medical condition acronym

## Emergency Detection
If query contains emergency keywords (흉통, 호흡곤란, 의식저하, 경련, etc.):
- Classify as MEDICAL_INFO
- Set emergency flag to true
- System will provide 119 emergency guidance

# Output Format

You MUST respond with ONLY a valid JSON object in this exact format:

```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.95,
  "reasoning": "Step-by-step reasoning for classification",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

Fields:
- intents (List[str]): Array of detected intent categories (1 or more)
- confidence (float): Confidence score 0.0-1.0
- reasoning (str): Chain-of-Thought explanation of classification process
- is_emergency (bool): True if emergency keywords detected
- primary_intent (str): The most relevant intent (first in list)

# Classification Process (Chain-of-Thought)

For each query, follow this process and document it in "reasoning":

1. **Emergency Check**: Does query contain emergency keywords?
2. **Domain Check**: Is this medical/health-related or off-topic?
3. **Keyword Analysis**: Identify key terms and medical concepts
4. **Intent Mapping**: Match to one or more intent categories
5. **False Negative Verification**: Did I miss any medical intent?
6. **Confidence Assessment**: How certain am I? (medical queries should be >0.8)
7. **Final Decision**: List all applicable intents

# Examples with Reasoning

Query: "어떤 질환에 대해서 알려줘"
```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.95,
  "reasoning": "1. No emergency keywords. 2. Domain: Medical (contains '질환'=disease). 3. Keywords: '질환' (disease/condition), '알려줘' (tell me). 4. This is a general inquiry about diseases/conditions → MEDICAL_INFO. 5. False Negative Check: Yes, this is definitely medical - contains '질환'. 6. High confidence 0.95. 7. Final: MEDICAL_INFO",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

Query: "투석 효과는?"
```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 0.98,
  "reasoning": "1. No emergency keywords. 2. Domain: Medical (dialysis treatment). 3. Keywords: '투석' (dialysis), '효과' (effect/efficacy). 4. Question about medical treatment effectiveness → MEDICAL_INFO. 5. False Negative Check: Definitely medical - dialysis is a core CKD treatment. 6. Very high confidence 0.98. 7. Final: MEDICAL_INFO",
  "is_emergency": false,
  "primary_intent": "MEDICAL_INFO"
}
```

Query: "저염식 알려줘"
```json
{
  "intents": ["DIET_INFO"],
  "confidence": 0.92,
  "reasoning": "1. No emergency keywords. 2. Domain: Medical/Diet. 3. Keywords: '저염식' (low-sodium diet), '알려줘' (tell me). 4. Request for dietary information → DIET_INFO. 5. False Negative Check: This is nutrition-focused, not general medical info. 6. High confidence 0.92. 7. Final: DIET_INFO",
  "is_emergency": false,
  "primary_intent": "DIET_INFO"
}
```

Query: "안녕하세요"
```json
{
  "intents": ["CHIT_CHAT"],
  "confidence": 1.0,
  "reasoning": "1. No emergency keywords. 2. Domain: General greeting. 3. Keywords: '안녕하세요' (hello). 4. Simple greeting → CHIT_CHAT. 5. False Negative Check: No medical content. 6. Perfect confidence 1.0. 7. Final: CHIT_CHAT",
  "is_emergency": false,
  "primary_intent": "CHIT_CHAT"
}
```

Query: "코딩 가르쳐줘"
```json
{
  "intents": ["NON_MEDICAL"],
  "confidence": 1.0,
  "reasoning": "1. No emergency keywords. 2. Domain: Non-medical (programming). 3. Keywords: '코딩' (coding), '가르쳐줘' (teach me). 4. Request outside medical domain → NON_MEDICAL. 5. False Negative Check: No medical content. 6. Perfect confidence 1.0. 7. Final: NON_MEDICAL",
  "is_emergency": false,
  "primary_intent": "NON_MEDICAL"
}
```

Query: "크레아티닌 1.3 의미는?"
```json
{
  "intents": ["HEALTH_RECORD"],
  "confidence": 0.96,
  "reasoning": "1. No emergency keywords. 2. Domain: Medical (lab results). 3. Keywords: '크레아티닌' (creatinine), '1.3' (numeric value), '의미' (meaning). 4. Question about interpreting specific lab value → HEALTH_RECORD. 5. False Negative Check: This is definitely health data interpretation. 6. Very high confidence 0.96. 7. Final: HEALTH_RECORD",
  "is_emergency": false,
  "primary_intent": "HEALTH_RECORD"
}
```

Query: "지원금 알려줘"
```json
{
  "intents": ["WELFARE_INFO"],
  "confidence": 0.90,
  "reasoning": "1. No emergency keywords. 2. Domain: Welfare/financial support. 3. Keywords: '지원금' (subsidy/support funds), '알려줘' (tell me). 4. Question about financial assistance → WELFARE_INFO. 5. False Negative Check: Not medical info, but welfare-related. 6. High confidence 0.90. 7. Final: WELFARE_INFO",
  "is_emergency": false,
  "primary_intent": "WELFARE_INFO"
}
```

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

Query: "흉통이 심해요"
```json
{
  "intents": ["MEDICAL_INFO"],
  "confidence": 1.0,
  "reasoning": "1. EMERGENCY DETECTED: '흉통' (chest pain). 2. Domain: Medical emergency. 3. Keywords: '흉통' (chest pain), '심해요' (severe). 4. Emergency symptom → MEDICAL_INFO with emergency flag. 5. False Negative Check: Absolutely medical. 6. Maximum confidence 1.0. 7. Final: MEDICAL_INFO + EMERGENCY",
  "is_emergency": true,
  "primary_intent": "MEDICAL_INFO"
}
```

# Important Reminders

1. NEVER classify medical questions as CHIT_CHAT
2. ALWAYS use Chain-of-Thought reasoning
3. Medical queries should have confidence >= 0.8
4. When in doubt, favor MEDICAL_INFO over CHIT_CHAT
5. Include ALL relevant intents (multi-intent is allowed)
6. Emergency keywords → is_emergency: true
7. Output MUST be valid JSON only, no markdown
"""

# ============================================================================
# User Query Template
# ============================================================================

INTENT_CLASSIFICATION_USER_PROMPT_TEMPLATE = """Classify the following user query into appropriate intent categories.

Remember:
- Use Chain-of-Thought reasoning (document in "reasoning" field)
- NEVER miss medical queries (False Negative Prevention)
- "어떤 질환에 대해서 알려줘" is MEDICAL_INFO, not CHIT_CHAT
- Medical queries need confidence >= 0.8
- Check for emergency keywords
- Return ONLY valid JSON

User Query:
{query}

Classification (JSON only):"""

# ============================================================================
# Helper Functions
# ============================================================================

def format_classification_prompt(query: str) -> List[Dict[str, str]]:
    """
    Format the classification prompt for LLM API call

    Args:
        query: User query to classify

    Returns:
        List of message dicts for chat completion API
    """
    return [
        {
            "role": "system",
            "content": INTENT_CLASSIFICATION_SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": INTENT_CLASSIFICATION_USER_PROMPT_TEMPLATE.format(query=query)
        }
    ]

def is_emergency_query(query: str) -> bool:
    """
    Quick check if query contains emergency keywords

    Args:
        query: User query to check

    Returns:
        True if emergency keywords detected
    """
    query_lower = query.lower()
    return any(keyword.lower() in query_lower for keyword in EMERGENCY_KEYWORDS)

def get_intent_metadata() -> Dict[str, Any]:
    """
    Get metadata about all intent categories

    Returns:
        Dictionary mapping intent categories to their metadata
    """
    return {
        IntentCategory.MEDICAL_INFO: {
            "name": "의료 정보",
            "name_en": "Medical Information",
            "risk_level": "high",
            "requires_strict_validation": True,
            "recommended_agent": "medical_welfare"
        },
        IntentCategory.DIET_INFO: {
            "name": "식이 영양",
            "name_en": "Diet & Nutrition",
            "risk_level": "low",
            "requires_strict_validation": False,
            "recommended_agent": "nutrition"
        },
        IntentCategory.HEALTH_RECORD: {
            "name": "건강 기록",
            "name_en": "Health Records",
            "risk_level": "high",
            "requires_strict_validation": True,
            "recommended_agent": "medical_welfare"
        },
        IntentCategory.WELFARE_INFO: {
            "name": "복지 정보",
            "name_en": "Welfare Information",
            "risk_level": "low",
            "requires_strict_validation": False,
            "recommended_agent": "medical_welfare"
        },
        IntentCategory.RESEARCH: {
            "name": "연구 논문",
            "name_en": "Research Papers",
            "risk_level": "low",
            "requires_strict_validation": False,
            "recommended_agent": "research_paper"
        },
        IntentCategory.LEARNING: {
            "name": "학습 퀴즈",
            "name_en": "Learning & Quiz",
            "risk_level": "low",
            "requires_strict_validation": False,
            "recommended_agent": None
        },
        IntentCategory.POLICY: {
            "name": "의료 정책",
            "name_en": "Medical Policy",
            "risk_level": "low",
            "requires_strict_validation": False,
            "recommended_agent": "research_paper"
        },
        IntentCategory.CHIT_CHAT: {
            "name": "일상 대화",
            "name_en": "Chit Chat",
            "risk_level": "low",
            "requires_strict_validation": False,
            "recommended_agent": None
        },
        IntentCategory.NON_MEDICAL: {
            "name": "도메인 외 요청",
            "name_en": "Non-Medical Request",
            "risk_level": "medium",
            "requires_strict_validation": False,
            "recommended_agent": None
        },
        IntentCategory.ILLEGAL_REQUEST: {
            "name": "불법/비윤리 요청",
            "name_en": "Illegal Request",
            "risk_level": "critical",
            "requires_strict_validation": False,
            "recommended_agent": None
        }
    }

# ============================================================================
# Test Cases for Validation
# ============================================================================

INTENT_CLASSIFICATION_TEST_CASES = [
    {
        "query": "어떤 질환에 대해서 알려줘",
        "expected_intents": ["MEDICAL_INFO"],
        "expected_primary": "MEDICAL_INFO",
        "min_confidence": 0.8,
        "description": "Generic disease inquiry - MUST be MEDICAL_INFO, NOT CHIT_CHAT"
    },
    {
        "query": "투석 효과는?",
        "expected_intents": ["MEDICAL_INFO"],
        "expected_primary": "MEDICAL_INFO",
        "min_confidence": 0.9,
        "description": "Dialysis treatment inquiry"
    },
    {
        "query": "저염식 알려줘",
        "expected_intents": ["DIET_INFO"],
        "expected_primary": "DIET_INFO",
        "min_confidence": 0.8,
        "description": "Low-sodium diet inquiry"
    },
    {
        "query": "안녕하세요",
        "expected_intents": ["CHIT_CHAT"],
        "expected_primary": "CHIT_CHAT",
        "min_confidence": 0.9,
        "description": "Simple greeting"
    },
    {
        "query": "코딩 가르쳐줘",
        "expected_intents": ["NON_MEDICAL"],
        "expected_primary": "NON_MEDICAL",
        "min_confidence": 0.9,
        "description": "Programming request - non-medical"
    },
    {
        "query": "크레아티닌 1.3 의미는?",
        "expected_intents": ["HEALTH_RECORD"],
        "expected_primary": "HEALTH_RECORD",
        "min_confidence": 0.9,
        "description": "Lab value interpretation"
    },
    {
        "query": "지원금 알려줘",
        "expected_intents": ["WELFARE_INFO"],
        "expected_primary": "WELFARE_INFO",
        "min_confidence": 0.8,
        "description": "Financial support inquiry"
    },
    {
        "query": "CKD 증상과 먹을 음식 알려줘",
        "expected_intents": ["MEDICAL_INFO", "DIET_INFO"],
        "expected_primary": "MEDICAL_INFO",
        "min_confidence": 0.8,
        "description": "Multi-intent: symptoms + diet"
    },
    {
        "query": "흉통이 심해요",
        "expected_intents": ["MEDICAL_INFO"],
        "expected_primary": "MEDICAL_INFO",
        "min_confidence": 0.95,
        "is_emergency": True,
        "description": "Emergency symptom - chest pain"
    },
    {
        "query": "만성콩팥병이란?",
        "expected_intents": ["MEDICAL_INFO"],
        "expected_primary": "MEDICAL_INFO",
        "min_confidence": 0.9,
        "description": "Medical condition definition"
    },
    {
        "query": "신장 이식 후 주의사항",
        "expected_intents": ["MEDICAL_INFO"],
        "expected_primary": "MEDICAL_INFO",
        "min_confidence": 0.9,
        "description": "Post-transplant care"
    },
    {
        "query": "콩팥에 좋은 음식",
        "expected_intents": ["DIET_INFO"],
        "expected_primary": "DIET_INFO",
        "min_confidence": 0.8,
        "description": "Kidney-friendly foods"
    },
    {
        "query": "최신 CKD 치료법 연구",
        "expected_intents": ["RESEARCH"],
        "expected_primary": "RESEARCH",
        "min_confidence": 0.8,
        "description": "Research papers request"
    },
    {
        "query": "투석 환자 지원금",
        "expected_intents": ["WELFARE_INFO"],
        "expected_primary": "WELFARE_INFO",
        "min_confidence": 0.8,
        "description": "Dialysis patient financial support"
    },
    {
        "query": "eGFR 수치가 60인데 괜찮나요?",
        "expected_intents": ["HEALTH_RECORD"],
        "expected_primary": "HEALTH_RECORD",
        "min_confidence": 0.9,
        "description": "eGFR value interpretation"
    }
]
