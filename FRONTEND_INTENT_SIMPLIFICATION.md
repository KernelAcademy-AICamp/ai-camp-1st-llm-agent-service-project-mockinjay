# 프론트엔드 의도 분류 간소화 - 변경사항 문서

## 개요

백엔드 LLM 기반 의도 분류로 전환하면서 프론트엔드 코드를 간소화한 작업입니다.

**작업 날짜**: 2025-11-26
**브랜치**: feature/careplus-design-system
**주요 목표**: 프론트엔드의 복잡한 패턴 매칭 제거 + 백엔드 LLM 정밀 분류 활용

---

## 문제점

### 기존 방식의 한계

프론트엔드에서 간단한 키워드 매칭으로 의도를 분류하던 방식은 다음과 같은 문제가 있었습니다:

```typescript
// ❌ 문제: "어떤 질환에 대해서 알려줘" 같은 질문을 제대로 분류하지 못함
const medicalPatterns = ['증상', '치료', '투석', ...];
if (medicalPatterns.some(pattern => text.includes(pattern))) {
  intents.push('MEDICAL_INFO');
}
```

**한계점**:
- 키워드가 없으면 분류 실패
- 복잡한 문장 구조 이해 불가
- 맥락 파악 불가
- 유지보수 어려움 (키워드 계속 추가 필요)

---

## 해결 방법

### 백엔드 RouterAgent의 LLM 분류 활용

백엔드의 RouterAgent가 GPT-4o-mini를 사용하여 정밀한 의도 분류를 수행합니다.

**장점**:
- ✅ 자연어 이해 능력
- ✅ 맥락 파악 가능
- ✅ 복합 의도 감지 (예: 의료 정보 + 식단 질문)
- ✅ 유지보수 용이

---

## 주요 변경사항

### 1. `detectIntent()` 함수 간소화

**변경 전** (87줄):
```typescript
export function detectIntent(text: string): IntentCategory[] {
  const intents: IntentCategory[] = [];
  const lowerText = text.toLowerCase();

  // 응급 키워드 체크
  const hasEmergency = EMERGENCY_KEYWORDS.some(...);
  if (hasEmergency) {
    intents.push('MEDICAL_INFO');
    return intents;
  }

  // 불법 요청 체크
  const illegalPatterns = ['돈 보내', '욕해', ...];
  if (illegalPatterns.some(...)) {
    intents.push('ILLEGAL_REQUEST');
    return intents;
  }

  // 도메인 외 요청 체크
  // 인사/잡담 체크
  // 의료 정보
  // 식이 영양
  // 연구 논문
  // 복지 정보
  // 건강 기록
  // 학습 퀴즈
  // 정책
  // ... 많은 로직

  if (intents.length === 0) {
    intents.push('CHIT_CHAT');
  }

  return intents;
}
```

**변경 후** (13줄):
```typescript
export function detectIntent(text: string): IntentCategory[] {
  const lowerText = text.toLowerCase();

  // 응급 키워드만 프론트에서 즉시 체크 (빠른 응답)
  const hasEmergency = EMERGENCY_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword)
  );

  if (hasEmergency) {
    return ['MEDICAL_INFO']; // 응급 상황은 우선 처리
  }

  // 나머지는 백엔드에서 LLM으로 정밀 분류
  return []; // 빈 배열 = 백엔드 분류 필요
}
```

**개선 효과**:
- 87줄 → 13줄로 감소 (85% 감소)
- 응급 상황만 즉시 처리
- 나머지는 백엔드에 위임

---

### 2. `callBackendAgentStream()` 수정

백엔드 응답에서 의도 정보를 추출하도록 개선했습니다.

**추가된 기능**:

```typescript
export interface BackendStreamChunk {
  content?: string;
  answer?: string;
  status?: 'streaming' | 'processing' | 'complete';
  agent_type?: string;
  metadata?: {
    routed_to?: string[];  // ✅ 백엔드가 분류한 에이전트 목록
    synthesis?: boolean;
    individual_responses?: Record<string, string>;
  };
  error?: string;
}
```

**의도 정보 추출**:

```typescript
// 백엔드 응답에서 의도 정보 추출
if (parsed.metadata?.routed_to && parsed.metadata.routed_to.length > 0) {
  const routedAgents = parsed.metadata.routed_to.map(a => a as AgentType);
  detectedAgents = routedAgents;
  detectedIntents = mapAgentsToIntents(routedAgents);
  console.log('🎯 Detected agents from backend:', detectedAgents);
  console.log('🎯 Mapped intents:', detectedIntents);
}
```

**반환 타입 변경**:

```typescript
// Before: Promise<void>
// After: Promise<{ agents: AgentType[]; intents: IntentCategory[] }>

const { agents, intents } = await callBackendAgentStream(
  query,
  'router',
  onChunk,
  onError
);
```

---

### 3. `routeQueryStream()` 간소화

**변경 전** (76줄):
```typescript
export async function routeQueryStream(...) {
  // 1. 의도 감지
  const intents = detectIntent(query);
  const primaryIntent = intents[0];

  // 2. 응급 상황 체크
  const isEmergency = EMERGENCY_KEYWORDS.some(...);
  if (isEmergency) {
    // 응급 응답 생성
  }

  // 3. 간단한 의도는 라우터가 직접 응답
  const directResponse = generateDirectResponse(primaryIntent);
  if (directResponse) {
    // 직접 응답 반환
  }

  // 4. 복잡한 의도는 에이전트로 라우팅
  const agents = selectAgents(intents);

  // 5. 백엔드 호출
  await callBackendAgentStream(...);

  // 6. Disclaimer 추가
  finalContent = addMedicalDisclaimer(finalContent, intents);

  return { ... };
}
```

**변경 후** (56줄):
```typescript
export async function routeQueryStream(...) {
  // 1. 응급 상황만 프론트에서 즉시 체크
  const frontendIntents = detectIntent(query);
  const isEmergency = frontendIntents.length > 0 &&
                      frontendIntents[0] === 'MEDICAL_INFO';

  if (isEmergency) {
    const emergencyContent = generateEmergencyResponse();
    onChunk(emergencyContent, true);
    return { ... };
  }

  // 2. 백엔드로 라우팅 (의도 분류는 백엔드가 수행)
  let finalContent = '';
  let backendAgents: AgentType[] = [];
  let backendIntents: IntentCategory[] = [];

  try {
    // 백엔드 스트리밍 호출 (의도 정보 추출)
    const { agents, intents } = await callBackendAgentStream(
      query,
      'router', // 항상 router로 시작 (자동 분류)
      (content, isComplete) => {
        finalContent = content;
        onChunk(content, isComplete);
      },
      onError
    );

    // 타입 안전성을 위해 필터링
    backendAgents = agents.filter((a): a is AgentType => ...);
    backendIntents = intents.filter((i): i is IntentCategory => ...);
  } catch (error) {
    // 폴백 처리
  }

  // 3. Medical Disclaimer 추가 (필요 시)
  const finalIntents: IntentCategory[] =
    backendIntents.length > 0 ? backendIntents : ['CHIT_CHAT'];
  finalContent = addMedicalDisclaimer(finalContent, finalIntents);

  return {
    content: finalContent,
    intents: finalIntents,
    agents: backendAgents,
    confidence: 0.85,
    isDirectResponse: false,
    isEmergency: false,
  };
}
```

**개선 효과**:
- 76줄 → 56줄로 감소 (26% 감소)
- 백엔드 의도 정보 활용
- 에러 처리 강화

---

### 4. 사용하지 않는 함수 제거

다음 함수들은 백엔드가 처리하므로 주석 처리했습니다:

```typescript
// ❌ 제거: generateDirectResponse() - 백엔드가 처리
// ❌ 제거: selectAgents() - 백엔드 RouterAgent가 선택
// ❌ 제거: combineAgentResponses() - 백엔드가 synthesis 수행
```

**레거시 호환성**:
- 주석으로 남겨서 향후 참고 가능
- 필요 시 복원 가능

---

## 에러 처리 개선

### 1. 백엔드 분류 실패 시 폴백

```typescript
try {
  const { agents, intents } = await callBackendAgentStream(...);
} catch (error) {
  console.error('❌ Error in streaming call:', error);

  // 폴백: 친절한 에러 메시지
  const fallbackContent = `죄송합니다. 백엔드 서버와 통신 중 오류가 발생했습니다.

**가능한 원인:**
- 백엔드 서버가 실행 중이 아닐 수 있습니다
- 네트워크 연결 문제일 수 있습니다

백엔드 서버를 확인해주세요: http://localhost:8000

응급 상황이라면 즉시 119에 연락하거나 가까운 병원을 방문하세요.`;

  onChunk(fallbackContent, true);

  return {
    content: fallbackContent,
    intents: ['CHIT_CHAT'],
    agents: [],
    confidence: 0.0,
    isDirectResponse: true,
    isEmergency: false,
  };
}
```

### 2. 타입 안전성 강화

```typescript
// 백엔드에서 받은 에이전트를 필터링하여 타입 안전성 확보
backendAgents = agents.filter((a): a is AgentType =>
  ['medical_welfare', 'nutrition', 'research_paper', 'router'].includes(a)
);

backendIntents = intents.filter((i): i is IntentCategory =>
  ['NON_MEDICAL', 'ILLEGAL_REQUEST', 'MEDICAL_INFO', 'DIET_INFO',
   'RESEARCH', 'WELFARE_INFO', 'HEALTH_RECORD', 'LEARNING',
   'POLICY', 'CHIT_CHAT'].includes(i)
);
```

---

## ChatPageEnhanced.tsx 활용

ChatPageEnhanced.tsx는 이미 백엔드 응답을 잘 활용하고 있습니다:

```typescript
// ✅ 백엔드에서 받은 의도 정보 활용
const response = await routeQueryStream(
  currentInput,
  (content, isComplete) => {
    setStreamingContent(content);
    if (isComplete) {
      console.log('✅ Streaming complete, saving message');
    }
  },
  (error) => {
    console.error('❌ Streaming error:', error);
  }
);

// ✅ 의도 정보 UI 표시
{message.intents && message.intents.length > 0 && (
  <div className="mt-4 pt-3 border-t border-gray-300">
    {message.intents.length === 1 && (
      <IntentClassifier
        detectedIntent={message.intents[0]}
        confidence={message.confidence}
        compact
      />
    )}
  </div>
)}
```

**추가 작업 불필요**:
- 이미 백엔드 응답을 올바르게 처리
- 의도 정보 UI 표시 완료
- 에러 처리 구현됨

---

## 백엔드 RouterAgent 확인

백엔드 RouterAgent는 다음과 같이 의도를 분류합니다:

```python
# Agent/router/agent.py

async def _classify_intent(self, query: str) -> List[str]:
    """
    Classify the user query into agent types using LLM.
    Returns a list of agent types to execute.
    """
    system_prompt = """You are an intelligent router for a medical AI system.

    **Intent Categories:**
    1. 'medical_welfare': Welfare programs, hospital search, costs
    2. 'research_paper': Medical research, symptoms, general knowledge
    3. 'nutrition': Diet, food, nutrition analysis
    4. 'quiz': Quiz, test knowledge
    5. 'trend_visualization': Visualize trends, charts
    6. 'NON_MEDICAL': Non-medical requests
    7. 'ILLEGAL_REQUEST': Unethical requests
    8. 'CHIT_CHAT': Greetings or small talk

    Output ONLY a JSON array of strings.
    Example: ["medical_welfare", "nutrition"] or ["NON_MEDICAL"]
    """

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query}
    ]

    content = await self._chat_completion(
        messages=messages,
        temperature=0.0,
        max_tokens=256
    )

    agents = json.loads(content)
    return agents
```

**메타데이터 반환**:

```python
# 단일 에이전트
response.metadata = {
    "routed_to": target_agents,  # 프론트엔드가 사용
    "synthesis": False,
    "individual_responses": { ... }
}

# 복수 에이전트 (synthesis)
return AgentResponse(
    answer=final_answer,
    metadata={
        "routed_to": target_agents,  # 프론트엔드가 사용
        "synthesis": True,
        "individual_responses": { ... }
    }
)
```

---

## 최종 결과

### 코드 간소화

| 함수 | 변경 전 | 변경 후 | 감소율 |
|------|---------|---------|--------|
| `detectIntent()` | 87줄 | 13줄 | 85% |
| `routeQueryStream()` | 76줄 | 56줄 | 26% |
| **전체** | **163줄** | **69줄** | **58%** |

### 기능 개선

✅ **정확도 향상**: LLM 기반 분류로 복잡한 질문 이해
✅ **유지보수성**: 키워드 패턴 제거, 백엔드에서 중앙 관리
✅ **확장성**: 새로운 의도 추가 시 백엔드만 수정
✅ **사용자 경험**: 응급 상황 즉시 처리 + 정확한 응답
✅ **에러 처리**: 폴백 로직 강화, 사용자 친화적 메시지

---

## 테스트 시나리오

### 1. 응급 상황 테스트

**입력**: "가슴이 아파요", "숨쉬기 힘들어요"
**예상**: 프론트엔드에서 즉시 응급 응답 생성

### 2. 복잡한 질문 테스트

**입력**: "어떤 질환에 대해서 알려줘"
**예상**: 백엔드 RouterAgent가 LLM으로 분류 → research_paper 에이전트 호출

### 3. 복합 의도 테스트

**입력**: "CKD 증상이 뭐고 어떤 음식을 먹어야 하나요?"
**예상**: 백엔드가 medical_welfare + nutrition 에이전트 모두 호출 → synthesis

### 4. 에러 처리 테스트

**시나리오**: 백엔드 서버 중지
**예상**: 친절한 에러 메시지 + 응급 상황 안내

---

## 다음 단계

### 선택적 개선 사항

1. **비스트리밍 `routeQuery()` 제거**
   - 현재는 레거시 호환성 유지
   - 모든 코드가 스트리밍으로 전환되면 제거 가능

2. **의도 매핑 개선**
   - `mapAgentsToIntents()` 함수를 더 정교하게 개선
   - 복합 의도 처리 고도화

3. **로딩 상태 UI 개선**
   - "의도를 분석하는 중..." 메시지 추가 (선택사항)
   - 프로그레스 바 추가

---

## 관련 파일

### 프론트엔드

- `/new_frontend/src/services/intentRouter.ts` - 주요 변경
- `/new_frontend/src/types/intent.ts` - 타입 정의 (변경 없음)
- `/new_frontend/src/pages/ChatPageEnhanced.tsx` - UI 활용 (변경 없음)

### 백엔드

- `/backend/Agent/router/agent.py` - RouterAgent 의도 분류
- `/backend/app/api/chat.py` - 스트리밍 API 엔드포인트

---

## 결론

프론트엔드의 복잡한 패턴 매칭을 제거하고 백엔드 LLM 기반 분류로 전환하여:

- **58% 코드 감소** (163줄 → 69줄)
- **정확도 향상** (LLM 자연어 이해)
- **유지보수성 개선** (중앙 집중식 관리)
- **사용자 경험 개선** (응급 상황 즉시 처리 + 정확한 응답)

프론트엔드는 응급 상황만 즉시 처리하고, 나머지는 백엔드에 위임하는 간소한 구조로 변경되었습니다.
