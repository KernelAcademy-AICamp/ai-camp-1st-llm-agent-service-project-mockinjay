# SSE 스트림 완료 감지 개선

## 문제점

기존 코드는 메시지 개수만으로 SSE 스트림 완료를 판단했습니다:

```python
# 문제: 메시지가 2개 이상이면 무조건 완료로 간주
if total_messages_sent >= 2:
    should_complete = True
```

**문제:**
- Agent가 여러 개의 메시지를 보낼 수 있음 (예: 설명 + 참고문헌 + 추가 정보)
- 2개 메시지만 보내고 완료한다고 가정하는 것은 부정확
- 실제 agent의 작업 상태를 무시함

---

## 개선 방안

### 1. 다층 완료 감지 시스템

완료를 감지하는 3가지 방법을 우선순위로 구현:

#### 우선순위 1: Agent 명시적 완료 신호
```python
if agent_finished:
    # Agent가 명시적으로 'completed' 상태를 보냄
    should_complete = True
```

**장점:**
- 가장 신뢰할 수 있는 방법
- Agent가 직접 작업 완료를 알림

**단점:**
- Agent가 항상 완료 신호를 보내지 않을 수 있음

#### 우선순위 2: Agent 상태 기반 감지
```python
elif current_status in {"ready", "completed"}:
    if total_messages_sent > 0:
        # Agent가 ready/completed 상태이고 메시지도 보냄
        should_complete = True
```

**장점:**
- Agent의 실제 상태를 확인
- 메시지가 있을 때만 완료로 간주

**단점:**
- Agent가 일시적으로 ready 상태일 수 있음

#### 우선순위 3: 비활성 기반 감지
```python
# Option A: 연속 빈 폴링 횟수
if consecutive_empty_polls >= 3:
    # 45초 동안 이벤트 없음 (~15초 × 3회)
    should_complete = True

# Option B: 시간 기반
elif time_since_last_event > 60:
    # 마지막 이벤트 후 60초 경과
    should_complete = True
```

**장점:**
- Agent가 신호를 보내지 않아도 완료 감지
- 실제 작업 완료 후 대기 시간 최소화

**단점:**
- 너무 빨리 완료할 수 있음 (조정 필요)

#### 우선순위 4: 절대 타임아웃
```python
if attempt >= max_attempts:
    # 최대 시도 횟수 도달 (무한 루프 방지)
    should_complete = True
```

---

### 2. 비활성 추적 시스템

SSE 스트림에서 agent의 활동을 추적:

```python
# 초기화
consecutive_empty_polls = 0  # 연속 빈 폴링 횟수
last_event_time = time.time()  # 마지막 이벤트 수신 시간

# 이벤트 수신 시
if events:
    consecutive_empty_polls = 0
    last_event_time = time.time()
else:
    consecutive_empty_polls += 1
```

**추적 지표:**
- `consecutive_empty_polls`: 연속으로 이벤트가 없었던 폴링 횟수
- `last_event_time`: 마지막으로 이벤트를 받은 시간
- `time_since_last_event`: 마지막 이벤트 이후 경과 시간

---

### 3. 완료 조건 흐름도

```
새 이벤트 도착
    ↓
Agent 완료 신호? → YES → 완료
    ↓ NO
Agent 상태 ready/completed + 메시지 있음? → YES → 완료
    ↓ NO
연속 빈 폴링 ≥ 3회 + 메시지 있음? → YES → 완료
    ↓ NO
마지막 이벤트 후 60초 경과 + 메시지 있음? → YES → 완료
    ↓ NO
최대 시도 횟수 도달? → YES → 강제 완료
    ↓ NO
계속 폴링
```

---

## 구현 코드

### 변경 전 (문제 코드)

```python
if total_messages_sent >= 2:
    # 메시지 2개면 무조건 완료
    logger.info("Received %d messages total, completing SSE stream", total_messages_sent)
    should_complete = True
elif total_messages_sent == 1:
    # 메시지 1개면 계속 대기
    logger.debug("Only 1 message received so far (likely disclaimer), continuing...")
```

### 변경 후 (개선 코드)

```python
# 1. Agent 명시적 완료 신호
if agent_finished:
    logger.info("Agent finished status detected, completing SSE stream")
    should_complete = True

# 2. Agent 상태 기반 감지
elif current_status in {"ready", "completed"}:
    if total_messages_sent > 0:
        logger.info(
            "Agent status is '%s' with %d messages sent, completing SSE stream",
            current_status,
            total_messages_sent
        )
        should_complete = True
    else:
        logger.debug("Agent ready but no messages yet, continuing...")

# 3. 비활성 기반 감지
if not should_complete and total_messages_sent > 0:
    time_since_last_event = time.time() - last_event_time

    # 연속 빈 폴링
    if consecutive_empty_polls >= 3:
        logger.info(
            "Inactivity-based completion: %d consecutive empty polls, %d messages sent",
            consecutive_empty_polls,
            total_messages_sent
        )
        should_complete = True

    # 시간 기반
    elif time_since_last_event > 60:
        logger.info(
            "Time-based completion: %.1fs since last event, %d messages sent",
            time_since_last_event,
            total_messages_sent
        )
        should_complete = True

# 4. 절대 타임아웃
if not should_complete and attempt >= max_attempts:
    logger.warning(
        "Max attempts reached (%d), forcing completion with %d messages",
        max_attempts,
        total_messages_sent
    )
    should_complete = True
```

---

## 설정 가능한 매개변수

완료 감지를 조정할 수 있는 매개변수:

| 매개변수 | 기본값 | 설명 |
|---------|--------|------|
| `wait_for_data` | 15초 | 각 폴링에서 대기하는 시간 |
| `max_attempts` | 30회 | 최대 폴링 시도 횟수 (~7.5분) |
| `consecutive_empty_polls_threshold` | 3회 | 완료로 간주할 연속 빈 폴링 횟수 |
| `inactivity_timeout` | 60초 | 비활성 시간 초과 (마지막 이벤트 후) |

### 조정 방법

```python
# 더 빠른 완료 (민감한 감지)
consecutive_empty_polls_threshold = 2  # 30초 후 완료
inactivity_timeout = 30  # 30초 비활성 후 완료

# 더 느린 완료 (안전한 감지)
consecutive_empty_polls_threshold = 5  # 75초 후 완료
inactivity_timeout = 120  # 2분 비활성 후 완료
```

---

## 로그 출력 예시

### 정상 완료 (Agent 상태 기반)

```
2025-01-13 14:30:01 - SSE attempt 3/30 (offset=15, total_messages=2)
2025-01-13 14:30:01 - SSE received 5 events
2025-01-13 14:30:01 - SSE sent status: ready
2025-01-13 14:30:01 - SSE sent message #1 (status=ready): 당뇨병에 대한 설명드리겠습니다...
2025-01-13 14:30:01 - SSE sent message #2 (status=ready): 참고문헌을 확인하세요...
2025-01-13 14:30:01 - Agent status is 'ready' with 2 messages sent, completing SSE stream
```

### 비활성 기반 완료

```
2025-01-13 14:30:01 - SSE sent message #1 (status=ready): 답변입니다...
2025-01-13 14:30:16 - No events received (consecutive empty polls: 1)
2025-01-13 14:30:31 - No events received (consecutive empty polls: 2)
2025-01-13 14:30:46 - No events received (consecutive empty polls: 3)
2025-01-13 14:30:46 - Inactivity-based completion: 3 consecutive empty polls, 1 messages sent
```

### 타임아웃 완료

```
2025-01-13 14:30:01 - SSE sent message #1 (status=processing): 검색 중...
2025-01-13 14:31:01 - No events for 60s
2025-01-13 14:31:01 - Time-based completion: 60.2s since last event, 1 messages sent
```

---

## 테스트 시나리오

### 시나리오 1: 단일 메시지 응답
**입력:** "당뇨병이 뭐야?"
**예상 출력:**
- 메시지 1개 (설명)
- Agent 상태: ready
- 완료 방법: Agent 상태 기반 감지

### 시나리오 2: 다중 메시지 응답
**입력:** "당뇨병 치료법 논문 찾아줘"
**예상 출력:**
- 메시지 3개 (설명 + 검색 결과 + 참고문헌)
- Agent 상태: ready
- 완료 방법: Agent 상태 기반 감지 (모든 메시지 수신 후)

### 시나리오 3: 느린 응답
**입력:** "복잡한 질문"
**예상 출력:**
- 메시지 1-2개 (천천히 도착)
- Agent 상태: processing → typing → ready
- 완료 방법: Agent 상태 기반 감지

### 시나리오 4: Agent 오류
**입력:** "잘못된 질문"
**예상 출력:**
- 메시지 0개 또는 오류 메시지
- Agent 상태: error
- 완료 방법: 비활성 기반 감지 또는 타임아웃

---

## 장점

### 1. 신뢰성 향상
- ✅ Agent의 실제 상태를 기반으로 완료 판단
- ✅ 메시지 개수 제한 없음
- ✅ 다양한 완료 조건 (fallback 포함)

### 2. 유연성
- ✅ Agent가 여러 메시지를 보낼 수 있음
- ✅ 느린 응답도 처리 가능
- ✅ 오류 상황에서도 안전하게 완료

### 3. 효율성
- ✅ 불필요한 대기 시간 최소화
- ✅ 비활성 감지로 빠른 완료
- ✅ 타임아웃으로 무한 대기 방지

---

## 향후 개선 방향

### 1. 동적 임계값 조정
```python
# Agent의 평균 응답 시간을 학습하여 임계값 자동 조정
average_response_time = calculate_average_response_time()
inactivity_timeout = average_response_time * 1.5
```

### 2. Agent 작업 유형별 임계값
```python
# 검색 작업은 더 긴 대기 시간
if agent_task_type == "search":
    inactivity_timeout = 90
elif agent_task_type == "simple_qa":
    inactivity_timeout = 30
```

### 3. 진행 상황 표시
```python
# 클라이언트에 진행 상황 전송
yield f"event: progress\ndata: {json.dumps({
    'stage': 'searching',
    'percent': 50
})}\n\n"
```

---

## 요약

기존의 단순한 메시지 개수 기반 완료 감지를 다층 시스템으로 개선:

1. **Agent 명시적 신호** (가장 신뢰)
2. **Agent 상태 확인** (실제 작업 상태)
3. **비활성 감지** (연속 빈 폴링, 시간 경과)
4. **절대 타임아웃** (무한 루프 방지)

이를 통해 **신뢰성**, **유연성**, **효율성**을 모두 향상시켰습니다.

---

**작성일**: 2025-01-13
**작성자**: Claude Code
**버전**: 2.1.0
