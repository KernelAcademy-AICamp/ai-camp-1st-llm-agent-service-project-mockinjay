# CareGuide 기술 명세서 (Technical Specification)

**버전**: 1.0
**작성일**: 2025-01-13
**프로젝트**: CareGuide - 만성콩팥병 환자를 위한 AI 기반 의료 정보 플랫폼

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [API 설계](#5-api-설계)
6. [AI/ML 시스템](#6-aiml-시스템)
7. [보안 및 인증](#7-보안-및-인증)
8. [배포 및 인프라](#8-배포-및-인프라)
9. [성능 요구사항](#9-성능-요구사항)
10. [구현 우선순위](#10-구현-우선순위)

---

## 1. 시스템 개요

### 1.1 프로젝트 목표
만성콩팥병(CKD) 환자, 질환자, 연구자를 위한 맞춤형 의료 정보 제공 플랫폼

### 1.2 주요 기능
- **Knowledge Search**: AI 챗봇을 통한 의료 정보 검색 및 PubMed 논문 검색
- **NutriCoach**: 질환 단계별 영양 정보 및 식단 추천
- **Learning**: 퀴즈 시스템 및 레벨/포인트 게임화
- **Community**: 게시판, 설문 조사, 건강 챌린지
- **MyPage**: 프로필 관리, 북마크, 알림 설정

### 1.3 사용자 유형
| 유형 | 설명 | 주요 기능 |
|------|------|----------|
| **일반인** | 예방 정보 중심 | 기본 의료 정보, 영양 정보 |
| **질환자** | 질환 단계별 관리 | 단계별 맞춤 정보, 식단 관리 |
| **연구자** | 논문 검색 및 데이터 분석 | PubMed 무제한 검색, 설문 생성 |

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├──────────────────┬──────────────────┬──────────────────────┤
│   Web (React)    │  Mobile (React   │  Admin Dashboard     │
│   + TypeScript   │   Native)        │  (Internal)          │
└──────────────────┴──────────────────┴──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
├──────────────────┬──────────────────┬──────────────────────┤
│  FastAPI         │  Authentication  │  Rate Limiting       │
│  (REST API)      │  (JWT)           │  (Redis)             │
└──────────────────┴──────────────────┴──────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│   Application Layer     │  │   AI/ML Layer           │
├─────────────────────────┤  ├─────────────────────────┤
│ • User Management       │  │ • Parlant Agent         │
│ • Content Management    │  │   (Chatbot)             │
│ • Community Service     │  │ • RAG Pipeline          │
│ • Point/Level System    │  │ • Intent Classifier     │
│ • Notification Service  │  │ • NutriCoach Engine     │
└─────────────────────────┘  └─────────────────────────┘
                │                       │
                └───────────┬───────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  PostgreSQL  │  MongoDB     │  Pinecone    │  Redis        │
│  (주 DB)     │  (문서 DB)   │  (벡터 DB)   │  (캐시/세션)  │
└──────────────┴──────────────┴──────────────┴───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  PubMed API  │  OpenAI API  │  FCM         │  Payment      │
│  (논문 검색)  │  (LLM)       │  (푸시 알림)  │  (결제)       │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

### 2.2 마이크로서비스 구조

```yaml
services:
  api-gateway:
    port: 8000
    role: 요청 라우팅, 인증, Rate Limiting

  user-service:
    port: 8001
    role: 회원 관리, 프로필, 인증
    database: PostgreSQL

  chatbot-service:
    port: 8002
    role: Parlant Agent 챗봇, 의도 분류
    dependencies: [MongoDB, Pinecone, OpenAI]

  pubmed-service:
    port: 8003
    role: PubMed 논문 검색, 북마크 관리
    dependencies: [MongoDB, PubMed API]

  nutricoach-service:
    port: 8004
    role: 영양 정보, 식단 추천
    database: MongoDB (영양 성분 DB)

  community-service:
    port: 8005
    role: 게시판, 설문, 챌린지
    database: PostgreSQL

  gamification-service:
    port: 8006
    role: 퀴즈, 레벨, 포인트
    database: PostgreSQL + Redis

  notification-service:
    port: 8007
    role: 알림 발송, 푸시 알림
    dependencies: [FCM, Redis]
```

### 2.3 현재 구현 상태 매핑

| 기능 | 구현 파일 | 상태 |
|------|----------|------|
| **AI 챗봇** | `parlant/healthcare_v2.py` | ✅ 구현 완료 |
| **하이브리드 검색** | `parlant/search/hybrid_search.py` | ✅ 구현 완료 |
| **PubMed 검색** | `parlant/pubmed_advanced.py` | ✅ 구현 완료 |
| **MongoDB 관리** | `parlant/database/mongodb_manager.py` | ✅ 구현 완료 |
| **Pinecone 관리** | `parlant/database/vector_manager.py` | ✅ 구현 완료 |
| **데이터 전처리** | `preprocess/` | ✅ 구현 완료 |
| **FastAPI 서버** | - | ❌ 미구현 |
| **인증 시스템** | - | ❌ 미구현 |
| **커뮤니티** | - | ❌ 미구현 |
| **게임화** | - | ❌ 미구현 |

---

## 3. 기술 스택

### 3.1 Backend

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| **Framework** | FastAPI | 0.109+ | REST API 서버 |
| **AI Agent** | Parlant SDK | latest | 챗봇 프레임워크 |
| **LLM** | OpenAI GPT-4 | latest | 의도 분류, 답변 생성 |
| **LLM Alt** | Anthropic Claude | latest | 대체 LLM |
| **Auth** | JWT | PyJWT 2.8+ | 인증/세션 관리 |
| **Task Queue** | Celery | 5.3+ | 비동기 작업 |
| **Message Broker** | RabbitMQ | 3.12+ | 메시지 큐 |
| **Caching** | Redis | 7.2+ | 캐시, 세션, Rate Limiting |

### 3.2 Database

| 데이터베이스 | 용도 | 스키마 |
|-------------|------|--------|
| **PostgreSQL** | 주 데이터베이스 | 사용자, 커뮤니티, 포인트, 알림 |
| **MongoDB** | 문서 데이터베이스 | QA, 논문, 의료 데이터 |
| **Pinecone** | 벡터 데이터베이스 | 의미론적 검색 (임베딩) |
| **Redis** | 인메모리 캐시 | 세션, 캐시, Rate Limiting |

### 3.3 Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18+ | UI 라이브러리 |
| **TypeScript** | 5+ | 타입 안전성 |
| **Next.js** | 14+ | SSR/SSG 프레임워크 |
| **TailwindCSS** | 3+ | 스타일링 |
| **Zustand** | 4+ | 상태 관리 |
| **React Query** | 5+ | 서버 상태 관리 |
| **Axios** | 1.6+ | HTTP 클라이언트 |

### 3.4 AI/ML

| 기술 | 용도 |
|------|------|
| **Parlant SDK** | 챗봇 Agent 프레임워크 |
| **OpenAI Embeddings** | 텍스트 임베딩 (text-embedding-3-small) |
| **sentence-transformers** | 로컬 임베딩 (대체) |
| **LangChain** | RAG 파이프라인 (선택) |
| **scikit-learn** | 머신러닝 유틸리티 |

### 3.5 External APIs

| API | 용도 |
|-----|------|
| **PubMed E-utilities** | 논문 검색 (esearch, efetch) |
| **Firebase Cloud Messaging** | 푸시 알림 |
| **Stripe / 토스페이먼츠** | 결제 처리 |

### 3.6 DevOps & Infrastructure

| 기술 | 용도 |
|------|------|
| **Docker** | 컨테이너화 |
| **Docker Compose** | 로컬 개발 환경 |
| **Kubernetes** | 오케스트레이션 (프로덕션) |
| **GitHub Actions** | CI/CD |
| **AWS EC2 / Lightsail** | 서버 호스팅 |
| **AWS S3** | 정적 파일 저장소 |
| **CloudFront** | CDN |
| **Sentry** | 에러 모니터링 |
| **Prometheus + Grafana** | 메트릭 모니터링 |

---

## 4. 데이터베이스 설계

### 4.1 PostgreSQL 스키마

#### 4.1.1 사용자 관리 (users)

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('general', 'patient', 'researcher')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
```

#### 4.1.2 프로필 (profiles)

```sql
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    nickname VARCHAR(50),
    profile_image_url TEXT,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    weight DECIMAL(5,2),  -- kg

    -- 검진 수치
    systolic_bp INTEGER,  -- 수축기 혈압
    diastolic_bp INTEGER, -- 이완기 혈압
    creatinine DECIMAL(5,2),
    egfr DECIMAL(5,2),

    -- 질환 정보 (질환자만)
    ckd_stage INTEGER CHECK (ckd_stage BETWEEN 1 AND 5),

    -- 영양 목표치 (질환자만)
    target_sodium INTEGER,   -- mg/day
    target_potassium INTEGER, -- mg/day
    target_phosphorus INTEGER, -- mg/day
    target_protein DECIMAL(5,2), -- g/kg

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);
```

#### 4.1.3 약관 동의 (consents)

```sql
CREATE TABLE consents (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    terms_of_service BOOLEAN DEFAULT FALSE,  -- 필수
    privacy_policy BOOLEAN DEFAULT FALSE,    -- 필수
    marketing_consent BOOLEAN DEFAULT FALSE, -- 선택
    consented_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.4 세션 (sessions)

```sql
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

#### 4.1.5 레벨 & 포인트 (user_points)

```sql
CREATE TABLE user_points (
    point_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1,
    current_points INTEGER DEFAULT 0,
    total_earned_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_points_user ON user_points(user_id);
```

#### 4.1.6 포인트 히스토리 (point_history)

```sql
CREATE TABLE point_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    -- 'quiz_correct', 'post_create', 'comment_create', 'survey_participate', 'daily_checkin'
    points_change INTEGER NOT NULL, -- +10, -100 등
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_history_user ON point_history(user_id);
CREATE INDEX idx_history_created ON point_history(created_at);
```

#### 4.1.7 퀴즈 (quizzes)

```sql
CREATE TABLE quizzes (
    quiz_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer BOOLEAN NOT NULL, -- OX 퀴즈
    explanation TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3), -- 1: 쉬움, 2: 보통, 3: 어려움
    source TEXT, -- "식약처", "질병청", "대한신장학회"
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.8 퀴즈 응답 (quiz_responses)

```sql
CREATE TABLE quiz_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    user_answer BOOLEAN NOT NULL,
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_responses_user ON quiz_responses(user_id);
CREATE INDEX idx_responses_quiz ON quiz_responses(quiz_id);
```

#### 4.1.9 커뮤니티 게시글 (posts)

```sql
CREATE TABLE posts (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('question', 'info_share', 'daily')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[], -- 이미지 URL 배열
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created ON posts(created_at);
```

#### 4.1.10 댓글 (comments)

```sql
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);
```

#### 4.1.11 설문 조사 (surveys)

```sql
CREATE TABLE surveys (
    survey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_audience VARCHAR(20) CHECK (target_audience IN ('all', 'patient', 'general')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_surveys_creator ON surveys(creator_id);
CREATE INDEX idx_surveys_status ON surveys(status);
```

#### 4.1.12 설문 문항 (survey_questions)

```sql
CREATE TABLE survey_questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(survey_id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) CHECK (question_type IN ('multiple_choice', 'text')),
    options JSONB -- 객관식 선택지 (JSON 배열)
);

CREATE INDEX idx_questions_survey ON survey_questions(survey_id);
```

#### 4.1.13 설문 응답 (survey_responses)

```sql
CREATE TABLE survey_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(survey_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    question_id UUID REFERENCES survey_questions(question_id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    answered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_user ON survey_responses(user_id);
```

#### 4.1.14 건강 챌린지 (challenges)

```sql
CREATE TABLE challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    goal TEXT, -- 예: "30일 동안 저염 식단 유지"
    reward_points INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'ongoing', 'completed')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_challenges_creator ON challenges(creator_id);
CREATE INDEX idx_challenges_status ON challenges(status);
```

#### 4.1.15 챌린지 참가자 (challenge_participants)

```sql
CREATE TABLE challenge_participants (
    participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(challenge_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_participants_user ON challenge_participants(user_id);
```

#### 4.1.16 챌린지 기록 (challenge_records)

```sql
CREATE TABLE challenge_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES challenge_participants(participant_id) ON DELETE CASCADE,
    record_type VARCHAR(20) CHECK (record_type IN ('photo', 'text')),
    content TEXT, -- 텍스트 또는 이미지 URL
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_records_participant ON challenge_records(participant_id);
```

#### 4.1.17 알림 (notifications)

```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    -- 'quiz', 'comment_reply', 'post_like', 'survey_new', 'challenge_reminder', 'level_up', 'point_low', 'update_notice'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_link TEXT, -- 관련 페이지 URL
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

#### 4.1.18 알림 설정 (notification_settings)

```sql
CREATE TABLE notification_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    quiz_enabled BOOLEAN DEFAULT TRUE,
    comment_enabled BOOLEAN DEFAULT TRUE,
    like_enabled BOOLEAN DEFAULT TRUE,
    survey_enabled BOOLEAN DEFAULT TRUE,
    challenge_enabled BOOLEAN DEFAULT TRUE,
    levelup_enabled BOOLEAN DEFAULT TRUE,
    point_low_enabled BOOLEAN DEFAULT TRUE,
    update_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
```

#### 4.1.19 결제 (payments)

```sql
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    package_type VARCHAR(50) NOT NULL, -- '500P', '1000P', '3000P'
    amount DECIMAL(10,2) NOT NULL, -- 결제 금액 (원)
    points INTEGER NOT NULL, -- 충전된 포인트
    payment_method VARCHAR(50), -- 'card', 'simple_payment'
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'refunded')),
    transaction_id TEXT, -- 외부 결제 시스템 트랜잭션 ID
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
```

### 4.2 MongoDB 컬렉션

#### 4.2.1 QA 데이터 (qa_data)

```javascript
{
  "_id": ObjectId("..."),
  "id": "d6182052db4c333b",
  "question": "복막투석을 시작하는 환자입니다...",
  "answer": "비행기 내에서 투석하기가...",
  "source_dataset": "대한신장학회",
  "category": "콩팥병 궁금증",
  "keywords": ["복막투석", "비행기"],
  "created_at": ISODate("2025-01-01T00:00:00Z")
}

// 인덱스
db.qa_data.createIndex({ question: "text", answer: "text" })
db.qa_data.createIndex({ keywords: 1 })
db.qa_data.createIndex({ category: 1 })
```

#### 4.2.2 논문 데이터 (papers)

```javascript
{
  "_id": ObjectId("..."),
  "title": "Efficacy of interpersonal psychotherapy for...",
  "abstract": "Evidence for the efficacy of treatments...",
  "metadata": {
    "keywords": ["Interpersonal psychotherapy", "PTSD"],
    "journal": "Journal of affective disorders",
    "authors": ["Salman Althobaiti", ...],
    "doi": "10.1016/j.jad.2019.12.021",
    "publication_date": "2020-03-15",
    "pmid": "31837675"
  },
  "embedding_id": "paper_31837675", // Pinecone ID
  "created_at": ISODate("2025-01-01T00:00:00Z")
}

// 인덱스
db.papers.createIndex({ title: "text", abstract: "text" })
db.papers.createIndex({ "metadata.keywords": 1 })
db.papers.createIndex({ "metadata.pmid": 1 })
```

#### 4.2.3 의료 데이터 (medical_data)

```javascript
{
  "_id": ObjectId("..."),
  "id": "dccb4325f42bcafc",
  "text": "본 발명에 의한 안마장치는...",
  "keyword": ["척추부", "근육", "받침대"],
  "category": "재활의학/물리치료학",
  "embedding_id": "medical_dccb4325f42bcafc",
  "created_at": ISODate("2025-01-01T00:00:00Z")
}

// 인덱스
db.medical_data.createIndex({ text: "text" })
db.medical_data.createIndex({ keyword: 1 })
db.medical_data.createIndex({ category: 1 })
```

#### 4.2.4 영양 성분 DB (nutrition_db)

```javascript
{
  "_id": ObjectId("..."),
  "food_name": "사과",
  "food_type": "과일",
  "serving_size": "100g",
  "nutrition": {
    "calories": 52,       // kcal
    "protein": 0.3,       // g
    "sodium": 1,          // mg
    "potassium": 107,     // mg
    "phosphorus": 11,     // mg
    "carbohydrate": 14,   // g
    "fiber": 2.4          // g
  },
  "ckd_safety": {
    "stage_1": "safe",
    "stage_2": "safe",
    "stage_3": "caution", // 칼륨 주의
    "stage_4": "warning",
    "stage_5": "danger"
  },
  "alternatives": ["배", "복숭아"], // 대체 식재료
  "created_at": ISODate("2025-01-01T00:00:00Z")
}

// 인덱스
db.nutrition_db.createIndex({ food_name: "text" })
db.nutrition_db.createIndex({ food_type: 1 })
```

#### 4.2.5 챗봇 대화 히스토리 (chat_history)

```javascript
{
  "_id": ObjectId("..."),
  "session_id": "uuid",
  "user_id": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "GFR 45는 어떤 단계인가요?",
      "timestamp": ISODate("2025-01-13T10:00:00Z")
    },
    {
      "role": "assistant",
      "content": "GFR 45는 CKD 3단계에 해당합니다...",
      "intent": "MEDICAL_INFO",
      "sources": ["qa_data", "pubmed"],
      "confidence": 0.92,
      "timestamp": ISODate("2025-01-13T10:00:05Z")
    }
  ],
  "created_at": ISODate("2025-01-13T10:00:00Z"),
  "updated_at": ISODate("2025-01-13T10:00:05Z")
}

// 인덱스
db.chat_history.createIndex({ session_id: 1 })
db.chat_history.createIndex({ user_id: 1 })
db.chat_history.createIndex({ created_at: 1 })
```

#### 4.2.6 북마크 (bookmarks)

```javascript
{
  "_id": ObjectId("..."),
  "user_id": "uuid",
  "pmid": "31837675",
  "folder": "관심 논문", // "관심 논문", "읽은 논문", "나중에 읽을 논문"
  "memo": "CKD 환자 영양 관련 중요 논문",
  "bookmarked_at": ISODate("2025-01-13T10:00:00Z")
}

// 인덱스
db.bookmarks.createIndex({ user_id: 1, pmid: 1 }, { unique: true })
db.bookmarks.createIndex({ user_id: 1, folder: 1 })
```

### 4.3 Pinecone 벡터 DB

#### 4.3.1 Namespace 구조

```yaml
index_name: careguide-embeddings
dimension: 1536  # OpenAI text-embedding-3-small
metric: cosine

namespaces:
  qa:
    description: QA 데이터 임베딩
    vector_count: ~10,000
    metadata_schema:
      id: string
      question: string
      source_dataset: string

  papers:
    description: 논문 임베딩 (title + abstract)
    vector_count: ~4,850
    metadata_schema:
      pmid: string
      title: string
      journal: string

  medical:
    description: 의료 데이터 임베딩
    vector_count: ~10,000
    metadata_schema:
      id: string
      category: string
```

#### 4.3.2 벡터 형식

```python
# QA 벡터
{
    "id": "qa_d6182052db4c333b",
    "values": [0.01, 0.02, ...],  # 1536 dim
    "metadata": {
        "id": "d6182052db4c333b",
        "question": "복막투석을 시작하는 환자입니다...",
        "source_dataset": "대한신장학회",
        "category": "콩팥병 궁금증"
    }
}

# 논문 벡터
{
    "id": "paper_31837675",
    "values": [0.01, 0.02, ...],
    "metadata": {
        "pmid": "31837675",
        "title": "Efficacy of interpersonal psychotherapy...",
        "journal": "Journal of affective disorders",
        "publication_date": "2020-03-15"
    }
}
```

### 4.4 Redis 캐시 구조

```
# 세션 (key: session:{session_id})
session:uuid -> {
  "user_id": "uuid",
  "access_token": "jwt_token",
  "expires_at": 1705123456
}
TTL: 1 hour

# Rate Limiting (key: ratelimit:{user_id}:{endpoint})
ratelimit:uuid:/api/pubmed/search -> 10
TTL: 1 day
INCR on each request

# 논문 검색 캐시 (key: pubmed:{query_hash})
pubmed:md5(query) -> {
  "results": [...],
  "cached_at": 1705123456
}
TTL: 24 hours

# 챗봇 대화 캐시 (key: chat:{session_id})
chat:uuid -> [
  {"role": "user", "content": "..."},
  {"role": "assistant", "content": "..."}
]
TTL: 24 hours
```

---

## 5. API 설계

### 5.1 API 기본 구조

```
Base URL: https://api.careguide.com/v1
Authentication: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### 5.2 인증 API

#### POST /auth/register
**설명**: 회원가입

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "user_type": "patient",
  "consents": {
    "terms_of_service": true,
    "privacy_policy": true,
    "marketing_consent": false
  }
}
```

**Response** (201 Created):
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "message": "인증 이메일이 발송되었습니다."
}
```

#### POST /auth/login
**설명**: 로그인

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "remember_me": true
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 3600,
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "user_type": "patient",
    "nickname": "홍길동"
  }
}
```

#### POST /auth/refresh
**설명**: Access Token 갱신

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGc...",
  "expires_in": 3600
}
```

#### POST /auth/logout
**설명**: 로그아웃

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "message": "로그아웃되었습니다."
}
```

### 5.3 챗봇 API

#### POST /chatbot/message
**설명**: 챗봇 메시지 전송

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "session_id": "uuid",
  "message": "GFR 45는 어떤 단계인가요?",
  "file": null
}
```

**Response** (200 OK):
```json
{
  "session_id": "uuid",
  "response": {
    "content": "GFR 45는 CKD 3단계(중등도 신장 기능 저하)에 해당합니다...",
    "intent": "MEDICAL_INFO",
    "sources": [
      {
        "type": "qa_data",
        "title": "CKD 단계 분류",
        "link": null
      },
      {
        "type": "pubmed",
        "title": "Chronic Kidney Disease Staging",
        "pmid": "31837675",
        "link": "https://pubmed.ncbi.nlm.nih.gov/31837675/"
      }
    ],
    "confidence": 0.92,
    "timestamp": "2025-01-13T10:00:05Z"
  },
  "follow_up_questions": [
    "CKD 3단계에서 주의해야 할 식단은?",
    "GFR 수치를 개선하는 방법은?"
  ]
}
```

#### POST /chatbot/session
**설명**: 새 챗봇 세션 생성

**Headers**: `Authorization: Bearer {access_token}`

**Response** (201 Created):
```json
{
  "session_id": "uuid",
  "created_at": "2025-01-13T10:00:00Z"
}
```

#### POST /chatbot/upload
**설명**: PDF 파일 업로드 (최대 5MB)

**Headers**:
- `Authorization: Bearer {access_token}`
- `Content-Type: multipart/form-data`

**Request Body**:
```
file: <PDF file>
session_id: uuid
```

**Response** (200 OK):
```json
{
  "session_id": "uuid",
  "file_name": "document.pdf",
  "extracted_text": "추출된 텍스트 내용...",
  "message": "PDF 내용을 분석했습니다."
}
```

### 5.4 PubMed 검색 API

#### GET /pubmed/search
**설명**: PubMed 논문 검색

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `query` (required): 검색 키워드
- `max_results` (optional, default=20): 최대 결과 수
- `sort` (optional, default=relevance): 정렬 방식 (relevance, pub_date)

**Example**: `/pubmed/search?query=chronic%20kidney%20disease&max_results=10`

**Response** (200 OK):
```json
{
  "query": "chronic kidney disease",
  "total_results": 10,
  "results": [
    {
      "pmid": "31837675",
      "title": "Efficacy of interpersonal psychotherapy for...",
      "abstract": "Evidence for the efficacy of treatments...",
      "authors": ["Salman Althobaiti", "..."],
      "journal": "Journal of affective disorders",
      "pub_date": "2020-03-15",
      "doi": "10.1016/j.jad.2019.12.021",
      "url": "https://pubmed.ncbi.nlm.nih.gov/31837675/",
      "keywords": ["Interpersonal psychotherapy", "PTSD"],
      "mesh_terms": ["Renal Insufficiency, Chronic"]
    }
  ],
  "search_method": "hybrid",
  "cached": false
}
```

**Error** (429 Too Many Requests):
```json
{
  "error": "일일 검색 한도 초과",
  "message": "일일 10회 검색 한도를 초과했습니다. 포인트 100P 사용 또는 프리미엄 구매로 추가 검색 가능합니다.",
  "options": {
    "use_points": 100,
    "upgrade_premium": true
  }
}
```

#### POST /pubmed/bookmark
**설명**: 논문 북마크

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "pmid": "31837675",
  "folder": "관심 논문",
  "memo": "CKD 환자 영양 관련 중요 논문"
}
```

**Response** (201 Created):
```json
{
  "bookmark_id": "uuid",
  "pmid": "31837675",
  "message": "북마크가 저장되었습니다."
}
```

#### DELETE /pubmed/bookmark/{bookmark_id}
**설명**: 북마크 해제

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "message": "북마크가 삭제되었습니다."
}
```

#### GET /pubmed/bookmarks
**설명**: 북마크 목록 조회

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `folder` (optional): 폴더 필터
- `search` (optional): 제목/저자 검색
- `year` (optional): 발행 연도 필터
- `sort` (optional, default=latest): 정렬 (latest, oldest)
- `page` (optional, default=1): 페이지 번호
- `limit` (optional, default=20): 페이지당 결과 수

**Response** (200 OK):
```json
{
  "total_count": 42,
  "page": 1,
  "limit": 20,
  "bookmarks": [
    {
      "bookmark_id": "uuid",
      "pmid": "31837675",
      "title": "Efficacy of interpersonal psychotherapy...",
      "authors": ["Salman Althobaiti"],
      "journal": "Journal of affective disorders",
      "pub_date": "2020-03-15",
      "folder": "관심 논문",
      "memo": "CKD 환자 영양 관련 중요 논문",
      "bookmarked_at": "2025-01-13T10:00:00Z"
    }
  ]
}
```

### 5.5 NutriCoach API

#### POST /nutricoach/search
**설명**: 식재료/음식 영양 정보 검색

**Headers**: `Authorization: Bearer {access_token}` (선택)

**Request Body**:
```json
{
  "query": "사과",
  "serving_size": "100g"
}
```

**Response** (200 OK):
```json
{
  "food_name": "사과",
  "serving_size": "100g",
  "nutrition": {
    "calories": 52,
    "protein": 0.3,
    "sodium": 1,
    "potassium": 107,
    "phosphorus": 11
  },
  "safety_assessment": {
    "user_ckd_stage": 3,
    "risk_level": "caution",
    "reasons": ["칼륨 함량이 목표치의 35%를 차지합니다."],
    "alternatives": [
      {
        "food_name": "배",
        "reason": "칼륨 함량이 더 낮습니다."
      }
    ]
  },
  "target_comparison": {
    "sodium": {
      "amount": 1,
      "target": 2000,
      "percentage": 0.05
    },
    "potassium": {
      "amount": 107,
      "target": 2000,
      "percentage": 5.35
    }
  }
}
```

#### POST /nutricoach/recipe
**설명**: 질환 단계에 맞는 레시피 생성

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "dish_name": "김치찌개",
  "servings": 2
}
```

**Response** (200 OK):
```json
{
  "dish_name": "김치찌개 (CKD 3단계 맞춤)",
  "servings": 2,
  "ingredients": [
    {
      "name": "저염 김치",
      "amount": "200g",
      "substitution": "일반 김치 → 저염 김치 (나트륨 50% 감소)"
    },
    {
      "name": "두부",
      "amount": "150g"
    }
  ],
  "instructions": [
    "1. 저염 김치를 물에 한 번 헹궈 염분을 줄입니다.",
    "2. 냄비에 김치와 물을 넣고 끓입니다.",
    "3. 두부를 추가하고 5분간 더 끓입니다."
  ],
  "nutrition_summary": {
    "total_sodium": 850,
    "total_potassium": 420,
    "within_target": true
  }
}
```

### 5.6 퀴즈 API

#### GET /quiz/daily
**설명**: 오늘의 퀴즈 조회

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "quiz_id": "uuid",
  "question": "CKD 3단계 환자는 하루 나트륨 섭취를 2000mg 이하로 제한해야 한다.",
  "difficulty": 2,
  "source": "식약처"
}
```

#### POST /quiz/answer
**설명**: 퀴즈 정답 제출

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "quiz_id": "uuid",
  "user_answer": true
}
```

**Response** (200 OK):
```json
{
  "is_correct": true,
  "correct_answer": true,
  "explanation": "CKD 3단계 환자는 나트륨 섭취를 하루 2000mg 이하로 제한하는 것이 권장됩니다.",
  "points_earned": 10,
  "total_points": 150
}
```

### 5.7 커뮤니티 API

#### GET /community/posts
**설명**: 게시글 목록 조회

**Query Parameters**:
- `category` (optional): 카테고리 필터 (question, info_share, daily)
- `sort` (optional, default=latest): 정렬 (latest, popular)
- `page` (optional, default=1)
- `limit` (optional, default=20)

**Response** (200 OK):
```json
{
  "total_count": 150,
  "page": 1,
  "limit": 20,
  "posts": [
    {
      "post_id": "uuid",
      "user": {
        "user_id": "uuid",
        "nickname": "홍길동",
        "profile_image": "https://..."
      },
      "category": "question",
      "title": "CKD 3단계 식단 추천 부탁드려요",
      "content": "최근 CKD 3단계 진단을 받았습니다...",
      "image_urls": [],
      "view_count": 42,
      "like_count": 5,
      "comment_count": 3,
      "created_at": "2025-01-13T10:00:00Z"
    }
  ]
}
```

#### POST /community/posts
**설명**: 게시글 작성

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "category": "question",
  "title": "CKD 3단계 식단 추천 부탁드려요",
  "content": "최근 CKD 3단계 진단을 받았습니다...",
  "image_urls": []
}
```

**Response** (201 Created):
```json
{
  "post_id": "uuid",
  "message": "게시글이 작성되었습니다.",
  "points_earned": 5
}
```

### 5.8 마이페이지 API

#### GET /users/profile
**설명**: 프로필 조회

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "user_type": "patient",
  "profile": {
    "nickname": "홍길동",
    "profile_image_url": "https://...",
    "gender": "male",
    "birth_date": "1990-01-01",
    "weight": 70.5,
    "systolic_bp": 130,
    "diastolic_bp": 85,
    "creatinine": 1.5,
    "egfr": 45,
    "ckd_stage": 3,
    "target_sodium": 2000,
    "target_potassium": 2000,
    "target_phosphorus": 800,
    "target_protein": 0.8
  }
}
```

#### PUT /users/profile
**설명**: 프로필 수정

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "nickname": "홍길동",
  "weight": 71.0,
  "systolic_bp": 128
}
```

**Response** (200 OK):
```json
{
  "message": "프로필이 수정되었습니다."
}
```

#### GET /users/points
**설명**: 포인트 내역 조회

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `filter` (optional): 필터 (earned, spent)
- `start_date` (optional): 시작일
- `end_date` (optional): 종료일

**Response** (200 OK):
```json
{
  "current_level": 3,
  "current_points": 450,
  "total_earned_points": 1200,
  "next_level_points": 600,
  "history": [
    {
      "history_id": "uuid",
      "activity_type": "quiz_correct",
      "points_change": 10,
      "description": "오늘의 퀴즈 정답",
      "created_at": "2025-01-13T10:00:00Z"
    }
  ]
}
```

---

## 6. AI/ML 시스템

### 6.1 Parlant Agent 구조

#### 6.1.1 Agent 정의
```python
# healthcare_v2.py 기반

agent = await server.create_agent(
    name="CareGuide_v2",
    description="""
    You are CareGuide v2.0, an advanced medical information chatbot.

    Core Features:
    1. Hybrid Search Engine (keyword 40% + semantic 60%)
    2. Multi-Source Integration (MongoDB, Pinecone, PubMed)
    3. User Profile System (researcher, patient, general)
    4. Ethical Guidelines (no diagnosis, emergency detection)
    """,
    composition_mode=p.CompositionMode.COMPOSITED
)
```

#### 6.1.2 Tools
```python
@p.tool
async def search_medical_qa(context: ToolContext, query: str) -> ToolResult:
    """의료 정보 통합 검색 (4개 소스)"""

@p.tool
async def get_kidney_stage_info(context: ToolContext, gfr: float, stage: int) -> ToolResult:
    """CKD 단계별 정보 제공"""

@p.tool
async def get_symptom_info(context: ToolContext, symptoms: str) -> ToolResult:
    """증상 정보 및 응급 감지"""

@p.tool
async def check_emergency_keywords(context: ToolContext, text: str) -> ToolResult:
    """응급 키워드 감지"""
```

#### 6.1.3 Guidelines
```python
# 안전성 가이드라인
await agent.create_guideline(
    condition="User mentions symptoms",
    action="Never use reassuring phrases. Always recommend consulting medical professionals."
)

await agent.create_guideline(
    condition="Emergency keywords detected",
    action="Immediately tell user to call 119."
)

# 프로필별 가이드라인
await agent.create_guideline(
    condition="The customer has the tag 'profile:researcher'",
    action="Use academic language, provide up to 10 results, include citations."
)
```

#### 6.1.4 Journey
```python
journey = await agent.create_journey(
    title="Medical Information Journey",
    description="Systematic medical information provision"
)

# Step 1: 인사 및 프로필 확인
t0 = await journey.initial_state.transition_to(
    chat_state="Greet user warmly. Confirm their profile type."
)

# Step 2: 정보 검색
t1 = await t0.target.transition_to(
    tool_state=search_medical_qa,
    condition="User asks a medical question"
)

# Step 3: 정보 제공
t2 = await t1.target.transition_to(
    chat_state="Use the refinement_prompt to generate response"
)
```

### 6.2 의도 분류 (Intent Classification)

#### 6.2.1 의도 카테고리
```python
INTENT_CATEGORIES = {
    "MEDICAL_INFO": "증상/질병/치료 정보",
    "DIET_INFO": "식단/영양 정보",
    "RESEARCH": "논문 검색",
    "WELFARE_INFO": "지원금/보험 정보",
    "HEALTH_RECORD": "검사 결과 해석",
    "LEARNING": "퀴즈/학습",
    "POLICY": "의료 정책",
    "CHIT_CHAT": "일상 대화",
    "NON_MEDICAL": "비의료 도메인 (차단)",
    "NON_ETHICAL": "비윤리적 (차단)"
}
```

#### 6.2.2 의도 분류 프롬프트
```python
INTENT_CLASSIFICATION_PROMPT = """
사용자 입력: "{user_input}"

다음 중 가장 적합한 의도를 분류하세요:
- MEDICAL_INFO: 의료 정보 (증상, 질병, 치료)
- DIET_INFO: 영양/식단 정보
- RESEARCH: 논문 검색
- NON_MEDICAL: 비의료 주제 (코딩, 번역 등)
- NON_ETHICAL: 비윤리적 (욕설, 불법 등)

출력 형식:
{{"intent": "MEDICAL_INFO", "confidence": 0.92}}
"""
```

### 6.3 하이브리드 검색 엔진

#### 6.3.1 검색 플로우
```
사용자 질문
    ↓
[1] 질문 임베딩 생성 (OpenAI Embeddings)
    ↓
[2] 병렬 검색
    ├─ MongoDB 텍스트 검색 (키워드)
    ├─ Pinecone 벡터 검색 (시맨틱)
    └─ PubMed API 검색
    ↓
[3] 결과 병합 및 점수 계산
    - 최종 점수 = 키워드 점수 × 0.4 + 시맨틱 점수 × 0.6
    ↓
[4] 상위 N개 반환
    ↓
[5] LLM 정제 프롬프트 생성
    ↓
[6] Parlant Agent 최종 답변 생성
```

#### 6.3.2 코드 구조 (기존 구현)
```python
# parlant/search/hybrid_search.py

class HybridSearchEngine:
    async def search_all_sources(self, query, max_per_source=5):
        # 1. QA 검색
        qa_results = await self._hybrid_qa_search(query, max_per_source)

        # 2. 논문 검색
        paper_results = await self._hybrid_paper_search(query, max_per_source)

        # 3. PubMed 검색
        pubmed_results = await self.pubmed.search_papers(query, max_per_source)

        return {
            "qa_results": qa_results,
            "paper_results": paper_results,
            "pubmed_results": pubmed_results,
            "search_method": "hybrid"
        }

    def _merge_results(self, keyword_results, semantic_matches, limit):
        # 중복 제거 + 점수 조합
        for doc_id, info in merged_dict.items():
            info["final_score"] = (
                info["keyword_score"] * 0.4 +
                info["semantic_score"] * 0.6
            )
        return sorted_results[:limit]
```

### 6.4 RAG (Retrieval-Augmented Generation)

#### 6.4.1 RAG 파이프라인
```python
# 1. 검색 (Retrieval)
raw_results = await hybrid_search.search_all_sources(query)

# 2. 컨텍스트 생성
context = format_context(raw_results)

# 3. LLM 프롬프트 생성
prompt = f"""
사용자 질문: "{query}"

검색 결과:
{context}

사용자 프로필: {profile}

요구사항:
- 프로필에 맞는 언어 수준 사용
- 출처 명시
- 의료 면책 조항 추가

답변:
"""

# 4. LLM 호출 (Parlant Agent가 자동 처리)
response = await agent.generate_response(prompt)
```

### 6.5 NutriCoach 엔진

#### 6.5.1 위험도 계산 로직
```python
def calculate_risk_level(
    food_nutrition: dict,
    user_targets: dict,
    ckd_stage: int
) -> dict:
    """
    Args:
        food_nutrition: {"sodium": 850, "potassium": 420, ...}
        user_targets: {"sodium": 2000, "potassium": 2000, ...}
        ckd_stage: 1-5

    Returns:
        {
            "risk_level": "safe" | "caution" | "warning" | "danger",
            "reasons": ["칼륨 함량이 목표치의 35%를 차지합니다."],
            "alternatives": [...]
        }
    """

    risk_score = 0
    reasons = []

    # 각 영양소별 위험도 평가
    for nutrient in ["sodium", "potassium", "phosphorus"]:
        amount = food_nutrition.get(nutrient, 0)
        target = user_targets.get(nutrient, 0)

        percentage = (amount / target * 100) if target > 0 else 0

        if percentage >= 50:
            risk_score += 3
            reasons.append(f"{nutrient} 함량이 목표치의 {percentage:.0f}%를 차지합니다.")
        elif percentage >= 30:
            risk_score += 2
        elif percentage >= 20:
            risk_score += 1

    # 위험도 결정
    if risk_score >= 6:
        risk_level = "danger"
    elif risk_score >= 4:
        risk_level = "warning"
    elif risk_score >= 2:
        risk_level = "caution"
    else:
        risk_level = "safe"

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "reasons": reasons
    }
```

### 6.6 퀴즈 자동 생성

#### 6.6.1 RAG 기반 퀴즈 생성
```python
async def generate_quiz_from_rag(
    source_documents: list,
    difficulty: int,
    count: int = 5
) -> list:
    """
    Args:
        source_documents: 식약처/질병청 가이드라인 문서
        difficulty: 1-3 (쉬움/보통/어려움)
        count: 생성할 퀴즈 수

    Returns:
        [
            {
                "question": "CKD 3단계 환자는 하루 나트륨 섭취를 2000mg 이하로 제한해야 한다.",
                "answer": true,
                "explanation": "CKD 3단계 환자는...",
                "difficulty": 2,
                "source": "식약처"
            }
        ]
    """

    # RAG: 관련 문서 검색
    relevant_docs = await vector_db.semantic_search(
        query="CKD 영양 관리 가이드라인",
        namespace="guidelines"
    )

    # LLM 프롬프트
    prompt = f"""
    다음 가이드라인 문서를 기반으로 OX 퀴즈 {count}문제를 생성하세요.

    문서:
    {relevant_docs}

    난이도: {difficulty} (1: 쉬움, 2: 보통, 3: 어려움)

    형식:
    {{
        "question": "...",
        "answer": true/false,
        "explanation": "...",
        "difficulty": {difficulty},
        "source": "식약처"
    }}
    """

    response = await openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)
```

---

## 7. 보안 및 인증

### 7.1 JWT 토큰 구조

#### 7.1.1 Access Token
```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "user_type": "patient",
  "iat": 1705123456,
  "exp": 1705127056,
  "type": "access"
}
```
- **유효기간**: 1시간
- **저장 위치**: 메모리 또는 LocalStorage
- **갱신**: Refresh Token으로 자동 갱신

#### 7.1.2 Refresh Token
```json
{
  "sub": "user_uuid",
  "iat": 1705123456,
  "exp": 1705728256,
  "type": "refresh"
}
```
- **유효기간**: 7일
- **저장 위치**: HttpOnly Cookie
- **갱신**: 로그인 시에만 재발급

### 7.2 비밀번호 보안

#### 7.2.1 해싱
```python
import bcrypt

# 회원가입 시
password_hash = bcrypt.hashpw(
    password.encode('utf-8'),
    bcrypt.gensalt()
)

# 로그인 시
is_valid = bcrypt.checkpw(
    password.encode('utf-8'),
    stored_hash
)
```

#### 7.2.2 비밀번호 정책
- 최소 8자 이상
- 영문 대소문자, 숫자, 특수문자 중 3가지 이상 조합
- 이메일 주소 포함 불가
- 최근 3회 사용한 비밀번호 재사용 불가

### 7.3 Rate Limiting

#### 7.3.1 API Rate Limits
```python
# Redis 기반 Rate Limiting
RATE_LIMITS = {
    "/auth/login": "5/minute",
    "/auth/register": "3/minute",
    "/pubmed/search": "10/day" (무료 사용자),
    "/chatbot/message": "100/day",
    "/community/posts": "10/day"
}
```

#### 7.3.2 구현
```python
from fastapi import Request, HTTPException
from redis import Redis

redis_client = Redis(host='localhost', port=6379)

async def rate_limit_middleware(request: Request):
    user_id = request.state.user_id
    endpoint = request.url.path

    key = f"ratelimit:{user_id}:{endpoint}"
    count = redis_client.incr(key)

    if count == 1:
        redis_client.expire(key, 86400)  # 1 day

    limit = get_rate_limit(endpoint, request.state.user_type)

    if count > limit:
        raise HTTPException(
            status_code=429,
            detail="일일 요청 한도를 초과했습니다."
        )
```

### 7.4 데이터 암호화

#### 7.4.1 전송 중 암호화
- **HTTPS**: TLS 1.3
- **WSS**: WebSocket Secure

#### 7.4.2 저장 시 암호화
- **비밀번호**: bcrypt 해싱
- **민감 정보**: AES-256 암호화 (건강 데이터, 결제 정보)
- **API Key**: 환경 변수 또는 Secret Manager

### 7.5 CORS 설정

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://careguide.com",
        "https://www.careguide.com",
        "http://localhost:3000"  # 개발 환경
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

---

## 8. 배포 및 인프라

### 8.1 Docker 구성

#### 8.1.1 docker-compose.yml
```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/careguide
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  # Chatbot Service
  chatbot-service:
    build: ./services/chatbot
    ports:
      - "8002:8002"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017
      - PINECONE_API_KEY=${PINECONE_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb

  # PostgreSQL
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=careguide
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=careguide

  # MongoDB
  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  # Redis
  redis:
    image: redis:7
    ports:
      - "6379:6379"

  # Nginx
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api-gateway

volumes:
  postgres_data:
  mongodb_data:
```

### 8.2 CI/CD 파이프라인

#### 8.2.1 GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          python -m pytest tests/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker-compose build
      - name: Push to Docker Hub
        run: |
          docker-compose push

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /app/careguide
            docker-compose pull
            docker-compose up -d
```

### 8.3 모니터링

#### 8.3.1 Prometheus + Grafana
```yaml
# 메트릭 수집
- API 응답 시간
- 에러율
- 요청 수 (endpoints별)
- Database 연결 수
- Redis 메모리 사용량
- LLM API 호출 수
```

#### 8.3.2 Sentry (에러 모니터링)
```python
import sentry_sdk

sentry_sdk.init(
    dsn="https://...@sentry.io/...",
    traces_sample_rate=1.0
)
```

---

## 9. 성능 요구사항

### 9.1 응답 시간

| API Endpoint | 평균 응답 시간 | 95th Percentile |
|-------------|--------------|----------------|
| GET /users/profile | < 100ms | < 200ms |
| POST /chatbot/message | < 3s | < 5s |
| GET /pubmed/search | < 2s | < 4s |
| POST /community/posts | < 500ms | < 1s |

### 9.2 처리량

```yaml
동시 사용자:
  목표: 1,000명
  피크: 5,000명

일일 요청:
  목표: 100,000건
  피크: 500,000건

챗봇 대화:
  평균: 100 msg/sec
  피크: 500 msg/sec
```

### 9.3 가용성

```yaml
목표:
  Uptime: 99.9% (월 43분 다운타임 허용)
  RTO: 1시간
  RPO: 1시간
```

### 9.4 확장성

```yaml
수평 확장:
  API Gateway: Kubernetes Auto-scaling
  Chatbot Service: Replica Sets (3-10개)

수직 확장:
  Database: Read Replicas (PostgreSQL)
  Cache: Redis Cluster
```

---

## 11. 현재 구현 상태 활용 가이드

### 11.1 기존 코드 활용

#### 11.1.1 챗봇 서비스
```python
# 기존: parlant/healthcare_v2.py
# → FastAPI 엔드포인트로 래핑

from healthcare_v2 import SEARCH_ENGINE, initialize_search_engine
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/chatbot/message")
async def chatbot_message(
    session_id: str,
    message: str,
    user_id: str = Depends(get_current_user)
):
    # 기존 Parlant Agent 활용
    await initialize_search_engine()

    raw_results = await SEARCH_ENGINE.search_all_sources(
        query=message,
        max_per_source=5,
        use_semantic=True,
        use_pubmed=True
    )

    # LLM 정제 프롬프트 생성 (기존 함수 활용)
    refinement_prompt = await llm_refine_results_v2(
        message, raw_results, profile
    )

    # Parlant Agent 응답 생성
    response = await agent.generate_response(refinement_prompt)

    return {
        "session_id": session_id,
        "response": response,
        "sources": raw_results
    }
```

#### 11.1.2 PubMed 검색
```python
# 기존: parlant/pubmed_advanced.py
# → FastAPI 엔드포인트로 래핑

from pubmed_advanced import PubMedAdvancedSearch
from fastapi import FastAPI

app = FastAPI()
pubmed_searcher = PubMedAdvancedSearch(
    email=os.getenv("PUBMED_EMAIL")
)

@app.get("/pubmed/search")
async def search_pubmed(
    query: str,
    max_results: int = 20,
    user_id: str = Depends(get_current_user)
):
    # Rate limiting 확인
    check_rate_limit(user_id, "/pubmed/search")

    # 기존 PubMed 검색 활용
    papers = await pubmed_searcher.search_papers(
        query=query,
        max_results=max_results,
        sort="relevance"
    )

    return {
        "query": query,
        "total_results": len(papers),
        "results": papers
    }
```

### 11.2 데이터베이스 마이그레이션

#### 11.2.1 기존 MongoDB 데이터 활용
```python
# 기존 preprocess/ 파이프라인으로 생성된 데이터
# → MongoDB에 이미 저장되어 있음

# 추가 작업:
# 1. PostgreSQL 스키마 생성 (사용자, 커뮤니티 등)
# 2. MongoDB 인덱스 최적화
# 3. Pinecone 벡터 업데이트 (필요 시)
```
