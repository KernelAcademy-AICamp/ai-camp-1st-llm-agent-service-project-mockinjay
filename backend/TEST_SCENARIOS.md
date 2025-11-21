# Quiz API 테스트 시나리오

## 환경 설정
```bash
# 서버 실행 (별도 터미널)
cd /Users/parkchulhee/quiz_agent/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 환경 변수 설정 필요
export OPENAI_API_KEY="your-openai-api-key"
export MONGODB_URI="mongodb://localhost:27017"
```

## 시나리오 1: 퀴즈 세션 완전 진행

### 1. 세션 시작 (daily_quiz)

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_001",
    "sessionType": "daily_quiz"
  }'
```

**예상 응답 (201 Created):**
```json
{
  "sessionId": "67890abcdef12345",
  "userId": "test_user_001",
  "sessionType": "daily_quiz",
  "totalQuestions": 5,
  "currentQuestionNumber": 1,
  "score": 0,
  "status": "in_progress",
  "currentQuestion": {
    "id": "q_001",
    "category": "nutrition",
    "difficulty": "easy",
    "question": "만성콩팥병 환자는 칼륨이 많은 음식을 제한해야 한다.",
    "answer": true,
    "explanation": ""
  }
}
```

**주의사항:**
- `sessionId`를 저장해두고 다음 요청에 사용
- `currentQuestion.id`를 저장해두고 답안 제출에 사용
- `answer`는 더미값(true), `explanation`은 빈 문자열 (보안 처리됨)

---

### 2. 문제 1 답안 제출 (정답)

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "67890abcdef12345",
    "userId": "test_user_001",
    "questionId": "q_001",
    "userAnswer": true
  }'
```

**예상 응답 (200 OK):**
```json
{
  "isCorrect": true,
  "correctAnswer": true,
  "explanation": "만성콩팥병 환자는 신장 기능 저하로 칼륨 배설이 어려워 고칼륨혈증 위험이 있습니다. 바나나, 토마토 등 칼륨 함량이 높은 음식은 제한해야 합니다.",
  "pointsEarned": 10,
  "currentScore": 10,
  "consecutiveCorrect": 1,
  "questionStats": {
    "totalAttempts": 1,
    "correctAttempts": 1,
    "userChoicePercentage": 100.0
  },
  "nextQuestion": {
    "id": "q_002",
    "category": "lifestyle",
    "difficulty": "easy",
    "question": "만성콩팥병 환자는 규칙적인 운동을 완전히 피해야 한다.",
    "answer": true,
    "explanation": ""
  }
}
```

**포인트 시스템:**
- 기본 점수: 10점
- 보너스: 3개 이상 연속 정답 시 +5점

---

### 3. 문제 2 답안 제출 (오답)

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "67890abcdef12345",
    "userId": "test_user_001",
    "questionId": "q_002",
    "userAnswer": true
  }'
```

**예상 응답 (200 OK):**
```json
{
  "isCorrect": false,
  "correctAnswer": false,
  "explanation": "만성콩팥병 환자도 적절한 운동은 권장됩니다. 걷기, 가벼운 스트레칭 등은 심혈관 건강과 전반적인 컨디션 유지에 도움이 됩니다.",
  "pointsEarned": 0,
  "currentScore": 10,
  "consecutiveCorrect": 0,
  "questionStats": {
    "totalAttempts": 1,
    "correctAttempts": 0,
    "userChoicePercentage": 0.0
  },
  "nextQuestion": {
    "id": "q_003",
    "category": "nutrition",
    "difficulty": "medium",
    "question": "만성콩팥병 3단계 환자의 하루 단백질 권장량은 체중 1kg당 0.6~0.8g이다.",
    "answer": true,
    "explanation": ""
  }
}
```

**연속 정답 카운터 초기화:**
- 오답 시 `consecutiveCorrect`가 0으로 리셋됨

---

### 4. 문제 3 답안 제출 (정답)

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "67890abcdef12345",
    "userId": "test_user_001",
    "questionId": "q_003",
    "userAnswer": true
  }'
```

**예상 응답 (200 OK):**
```json
{
  "isCorrect": true,
  "correctAnswer": true,
  "explanation": "만성콩팥병이 진행되면 단백질 대사 산물인 요소가 축적되므로 적절한 단백질 제한이 필요합니다.",
  "pointsEarned": 10,
  "currentScore": 20,
  "consecutiveCorrect": 1,
  "questionStats": {
    "totalAttempts": 1,
    "correctAttempts": 1,
    "userChoicePercentage": 100.0
  },
  "nextQuestion": {
    "id": "q_004",
    "category": "treatment",
    "difficulty": "easy",
    "question": "만성콩팥병 환자는 정기적인 혈액 검사로 신장 기능을 모니터링해야 한다.",
    "answer": true,
    "explanation": ""
  }
}
```

---

### 5. 문제 4 답안 제출 (정답)

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "67890abcdef12345",
    "userId": "test_user_001",
    "questionId": "q_004",
    "userAnswer": true
  }'
```

**예상 응답 (200 OK):**
```json
{
  "isCorrect": true,
  "correctAnswer": true,
  "explanation": "크레아티닌, 사구체여과율(GFR) 등 혈액 검사는 신장 기능 평가의 필수 지표입니다.",
  "pointsEarned": 10,
  "currentScore": 30,
  "consecutiveCorrect": 2,
  "questionStats": {
    "totalAttempts": 1,
    "correctAttempts": 1,
    "userChoicePercentage": 100.0
  },
  "nextQuestion": {
    "id": "q_005",
    "category": "nutrition",
    "difficulty": "medium",
    "question": "만성콩팥병 환자는 인(phosphorus) 섭취를 제한해야 한다.",
    "answer": true,
    "explanation": ""
  }
}
```

---

### 6. 문제 5 답안 제출 (정답 + 보너스)

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "67890abcdef12345",
    "userId": "test_user_001",
    "questionId": "q_005",
    "userAnswer": true
  }'
```

**예상 응답 (200 OK):**
```json
{
  "isCorrect": true,
  "correctAnswer": true,
  "explanation": "신장 기능 저하로 인 배설이 감소하면 뼈와 심혈관 질환 위험이 증가합니다. 가공식품, 유제품 등의 인 섭취를 제한해야 합니다.",
  "pointsEarned": 15,
  "currentScore": 45,
  "consecutiveCorrect": 3,
  "questionStats": {
    "totalAttempts": 1,
    "correctAttempts": 1,
    "userChoicePercentage": 100.0
  },
  "nextQuestion": null
}
```

**보너스 점수 적용:**
- 3개 연속 정답 달성 → 10점 + 5점 보너스 = 15점
- `nextQuestion`이 null → 마지막 문제임을 표시

---

### 7. 세션 완료

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/complete?sessionId=67890abcdef12345" \
  -H "Content-Type: application/json"
```

**예상 응답 (200 OK):**
```json
{
  "sessionId": "67890abcdef12345",
  "userId": "test_user_001",
  "sessionType": "daily_quiz",
  "totalQuestions": 5,
  "correctAnswers": 4,
  "finalScore": 45,
  "accuracyRate": 80.0,
  "completedAt": "2025-11-20T10:30:00",
  "streak": 1,
  "categoryPerformance": [
    {
      "category": "nutrition",
      "correct": 2,
      "total": 3,
      "rate": 66.67
    },
    {
      "category": "lifestyle",
      "correct": 0,
      "total": 1,
      "rate": 0.0
    },
    {
      "category": "treatment",
      "correct": 1,
      "total": 1,
      "rate": 100.0
    }
  ]
}
```

**통계 업데이트:**
- `user_quiz_stats` 컬렉션에 사용자 통계 생성/업데이트
- `daily_quiz` 타입이므로 연속 출석 일수(`streak`) 계산
- 카테고리별 정답률 집계

---

## 시나리오 2: 통계 조회

### 1. 사용자 통계 조회

**요청:**
```bash
curl -X GET "http://localhost:8000/api/quiz/stats?userId=test_user_001" \
  -H "Content-Type: application/json"
```

**예상 응답 (200 OK):**
```json
{
  "userId": "test_user_001",
  "totalSessions": 1,
  "totalQuestions": 5,
  "correctAnswers": 4,
  "totalScore": 45,
  "accuracyRate": 80.0,
  "currentStreak": 1,
  "bestStreak": 1,
  "level": "intermediate",
  "lastSessionDate": "2025-11-20T10:30:00"
}
```

**레벨 판정 기준:**
- `advanced`: 80% 이상 (level_test 세션 기준)
- `intermediate`: 50-79%
- `beginner`: 50% 미만
- 첫 daily_quiz만 완료한 경우: `"intermediate"` (기본값)

---

### 2. 퀴즈 이력 조회

**요청:**
```bash
curl -X GET "http://localhost:8000/api/quiz/history?userId=test_user_001&limit=10&offset=0" \
  -H "Content-Type: application/json"
```

**예상 응답 (200 OK):**
```json
{
  "sessions": [
    {
      "sessionId": "67890abcdef12345",
      "sessionType": "daily_quiz",
      "totalQuestions": 5,
      "correctAnswers": 4,
      "finalScore": 45,
      "accuracyRate": 80.0,
      "completedAt": "2025-11-20T10:30:00",
      "categoryPerformance": [
        {
          "category": "nutrition",
          "correct": 2,
          "total": 3,
          "rate": 66.67
        },
        {
          "category": "lifestyle",
          "correct": 0,
          "total": 1,
          "rate": 0.0
        },
        {
          "category": "treatment",
          "correct": 1,
          "total": 1,
          "rate": 100.0
        }
      ]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "hasMore": false
}
```

**페이지네이션:**
- `limit`: 최대 50 (기본값 10)
- `offset`: 시작 위치 (기본값 0)
- `hasMore`: 더 많은 데이터 존재 여부

---

## 추가 시나리오: 레벨 테스트

### 레벨 테스트 시작

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_002",
    "sessionType": "level_test"
  }'
```

**예상 응답:**
- `totalQuestions`: 5
- 난이도 구성: easy 2개 + medium 2개 + hard 1개
- 카테고리: 무작위 3개 (nutrition, treatment, lifestyle 중)

**레벨 판정 (완료 후):**
- 4-5개 정답 (80%+): `"advanced"`
- 2-3개 정답 (40-60%): `"intermediate"`
- 0-1개 정답 (<40%): `"beginner"`

---

## 추가 시나리오: 학습 미션

### 학습 미션 시작

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_003",
    "sessionType": "learning_mission",
    "category": "nutrition",
    "difficulty": "medium"
  }'
```

**예상 응답:**
- `totalQuestions`: 5
- 모든 문제가 `category: "nutrition"`, `difficulty: "medium"`

**필수 파라미터:**
- `category`: nutrition, treatment, lifestyle 중 하나
- `difficulty`: easy, medium, hard 중 하나

---

## 에러 처리

### 1. 존재하지 않는 세션

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "invalid_session",
    "userId": "test_user_001",
    "questionId": "q_001",
    "userAnswer": true
  }'
```

**예상 응답 (404 Not Found):**
```json
{
  "detail": "세션을 찾을 수 없습니다"
}
```

---

### 2. 이미 완료된 세션

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "67890abcdef12345",
    "userId": "test_user_001",
    "questionId": "q_001",
    "userAnswer": true
  }'
```

**예상 응답 (400 Bad Request):**
```json
{
  "detail": "이미 완료된 세션입니다"
}
```

---

### 3. 존재하지 않는 문제

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "67890abcdef12345",
    "userId": "test_user_001",
    "questionId": "invalid_question",
    "userAnswer": true
  }'
```

**예상 응답 (404 Not Found):**
```json
{
  "detail": "문제를 찾을 수 없습니다"
}
```

---

### 4. 모든 문제 미완료 상태에서 세션 완료 시도

**요청:**
```bash
curl -X POST "http://localhost:8000/api/quiz/session/complete?sessionId=67890abcdef12345" \
  -H "Content-Type: application/json"
```

**예상 응답 (400 Bad Request):**
```json
{
  "detail": "모든 문제를 풀어야 세션을 완료할 수 있습니다"
}
```

---

### 5. 페이지네이션 제한 초과

**요청:**
```bash
curl -X GET "http://localhost:8000/api/quiz/history?userId=test_user_001&limit=100&offset=0" \
  -H "Content-Type: application/json"
```

**예상 응답 (400 Bad Request):**
```json
{
  "detail": "limit은 최대 50까지 가능합니다"
}
```

---

## 데이터베이스 확인 (MongoDB)

### quiz_sessions 컬렉션
```javascript
db.quiz_sessions.findOne({"_id": ObjectId("67890abcdef12345")})
```

### quiz_questions 컬렉션
```javascript
db.quiz_questions.find({"_id": {$in: ["q_001", "q_002", "q_003", "q_004", "q_005"]}})
```

### quiz_attempts 컬렉션
```javascript
db.quiz_attempts.find({"sessionId": "67890abcdef12345"})
```

### user_quiz_stats 컬렉션
```javascript
db.user_quiz_stats.findOne({"userId": "test_user_001"})
```

---

## 주의사항

1. **OpenAI API 키 필수:** `generate_quiz_with_ai()` 함수는 OpenAI API를 사용하므로 환경 변수 설정 필수
2. **MongoDB 연결:** `MONGODB_URI` 환경 변수 확인
3. **sessionId 저장:** 세션 시작 응답에서 받은 `sessionId`를 모든 후속 요청에 사용
4. **questionId 매칭:** 각 문제의 `id`를 정확히 저장하고 답안 제출 시 사용
5. **보안:** 클라이언트에게 전달되는 `answer`는 더미값, `explanation`은 빈 문자열 (답안 제출 후에만 실제 값 반환)
