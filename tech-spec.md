# CareGuide Tech Spec

> 만성콩팥병(CKD) 환자를 위한 종합 케어 플랫폼

## 1. 프로젝트 개요

### 목표
만성콩팥병 환자에게 AI 챗봇 기반 의료정보, 영양 관리, 커뮤니티 기능을 제공하는 웹 플랫폼 개발

### 팀 구성
- **Yj**: Nutri Coach (영양 관리)
- **ch**: Community (커뮤니티)
- **jh**: Knowledge Search, Trends (지식 검색, 대시보드)
- **jk**: Sign up, My Page (회원가입, 마이페이지)

## 2. 기술 스택

### 백엔드
- **언어**: Python 3.10+
- **프레임워크**: FastAPI
- **데이터베이스**: MongoDB (일반 데이터)
- **벡터 DB**: MongoDB Atlas Vector Search (논문 임베딩)
- **AI/ML**: OpenAI API (GPT-3.5-turbo, text-embedding-3-small), Parlant SDK

### 프론트엔드
- **프레임워크**: React 18
- **언어**: TypeScript
- **상태관리**: React Context API
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios

### 개발 도구
- **버전 관리**: Git
- **패키지 관리**: npm (Frontend), pip (Backend)
- **개발 서버**: Vite (Frontend)

## 3. 프로젝트 구조 (모노레포)

```
careguide/
├── backend/                # Python 백엔드
│   ├── Agent/             # 🆕 Agent 시스템
│   │   ├── agent_manager.py          # Agent 관리 및 라우팅
│   │   ├── base_agent.py             # Agent 기본 클래스
│   │   ├── context_tracker.py        # 컨텍스트 추적 (20k 제한)
│   │   ├── session_manager.py        # 세션 관리
│   │   ├── medical_welfare/          # 의료복지 검색 Agent
│   │   │   ├── agent.py
│   │   │   └── prompts.py
│   │   ├── nutrition/                # 영양 관리 Agent
│   │   │   ├── agent.py
│   │   │   └── prompts.py
│   │   ├── research_paper/           # 연구논문 검색 Agent
│   │   │   ├── agent.py
│   │   │   └── prompts.py
│   │   └── trend_visualization/      # 트렌드 시각화 Agent
│   │       ├── agent.py
│   │       └── prompts.py
│   │
│   ├── app/
│   │   ├── main.py        # FastAPI 앱 진입점
│   │   ├── api/           # API 라우터
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── nutri.py
│   │   │   ├── community.py
│   │   │   └── trends.py
│   │   ├── models/        # 데이터 모델
│   │   ├── services/      # 비즈니스 로직
│   │   └── db/            # DB 연결
│   ├── requirements.txt
│   └── .env
│
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── pages/        # 페이지 컴포넌트
│   │   │   ├── Chat.tsx
│   │   │   ├── Nutri.tsx
│   │   │   ├── Community.tsx
│   │   │   ├── Trends.tsx
│   │   │   ├── SignUp.tsx
│   │   │   └── MyPage.tsx
│   │   ├── components/   # 재사용 컴포넌트
│   │   ├── api/          # API 호출
│   │   ├── types/        # TypeScript 타입
│   │   └── App.tsx
│   ├── package.json
│   └── .env
│
├── data/                 # 데이터 파일 (로컬 개발용)
└── README.md
```

## 4. Agent 아키텍처 (🆕 추가)

### 4.0 Agent 시스템 개요

#### Agent Manager
- **역할**: 모든 Agent 조율, 라우팅, 세션 및 컨텍스트 메타데이터 관리
- **컨텍스트 제한**: 세션당 **20,000 토큰**
- **오버플로우 처리**: 제한 초과 시 사용자에게 팝업 알림 (Frontend 연동)

#### Specialized Agents
1. **Medical Welfare Agent**: 의료복지 정보 검색
   - 의료복지 제도 및 혜택 안내
   - 의료비 지원 프로그램 검색
   - 건강보험 관련 질문 응답

2. **Nutrition Agent**: 영양 관리 기능
   - 식품 영양 성분 분석
   - 개인 맞춤형 식단 계획
   - 영양소 섭취 권장량 안내

3. **Research Paper Agent**: 학술 논문 검색
   - PubMed 논문 검색 및 요약
   - 논문 신뢰도 평가
   - 최신 연구 동향 분석

4. **Trend Visualization Agent**: 데이터 트렌드 시각화
   - 건강 데이터 트렌드 분석
   - 시간별/지역별 통계 시각화
   - 패턴 인식 및 인사이트 도출

#### Context Tracking
- **실시간 토큰 사용량 모니터링**: 각 Agent 호출 시 토큰 사용량 추적
- **Agent별 컨텍스트 사용량 추적**: 세션 내 Agent별 사용량 분리 관리
- **세션 수준 컨텍스트 집계**: 전체 세션의 누적 사용량 계산
- **제한 초과 방지**: 예상 사용량 사전 체크 후 실행

#### Session Management
- **세션 생성 및 관리**: 사용자별 세션 ID 발급
- **대화 히스토리 저장**: Agent별 대화 내용 보존
- **세션 타임아웃**: 30분 비활성 시 자동 종료
- **세션 정리**: 만료된 세션 자동 삭제

#### API 통합
```python
# Agent 요청 라우팅 예시
POST /api/agent/route
{
  "agent_type": "medical_welfare",
  "user_input": "만성콩팥병 의료비 지원 제도가 있나요?",
  "session_id": "uuid-session-id"
}

# 응답
{
  "success": true,
  "agent_type": "medical_welfare",
  "result": {
    "response": "...",
    "tokens_used": 1500
  },
  "context_info": {
    "current_usage": 15000,
    "max_limit": 20000,
    "remaining": 5000
  }
}
```

## 5. 핵심 기능

### 5.1 Knowledge Search (jh) - **Research Paper Agent 연동**
- **경로**: `/chat`
- **Agent**: Research Paper Agent
- **기능**:
  - PubMed 논문 검색 및 요약
  - AI 챗봇 대화
  - 의도 분류 기반 응답
- **API**:
  - `POST /api/chat/message` - 메시지 전송 (Agent Manager 라우팅)
  - `GET /api/chat/history` - 대화 이력

### 5.2 Nutri Coach (Yj) - **Nutrition Agent 연동**
- **경로**: `/nutri`
- **Agent**: Nutrition Agent
- **기능**:
  - 식사 기록
  - 영양소 통계
  - 레시피 검색
- **API**:
  - `POST /api/nutri/record` - 식사 기록
  - `GET /api/nutri/stats` - 통계 조회 (Agent Manager 라우팅)
  - `GET /api/nutri/recipes` - 레시피 검색

### 5.3 Community (ch)
- **경로**: `/community`
- **기능**:
  - 게시글 작성/조회
  - 댓글
  - 좋아요
  - 🆕 관리자 게시글 삭제
- **API**:
  - `POST /api/community/posts` - 게시글 작성
  - `GET /api/community/posts` - 게시글 목록
  - `POST /api/community/comments` - 댓글 작성
  - `DELETE /api/community/posts/{post_id}` - 게시글 삭제 (관리자 전용)

### 5.4 Trends (jh) - **Trend Visualization Agent 연동**
- **경로**: `/trends`
- **Agent**: Trend Visualization Agent
- **기능**:
  - 논문 트렌드 시각화
  - 통계 대시보드
- **API**:
  - `GET /api/trends/papers` - 논문 트렌드 (Agent Manager 라우팅)

### 5.5 Auth & My Page (jk)
- **경로**: `/signup`, `/login`, `/mypage`
- **기능**:
  - 회원가입/로그인
  - 프로필 관리
  - 북마크 관리
  - 🆕 관리자 권한 관리
- **API**:
  - `POST /api/auth/signup` - 회원가입 (role 포함)
  - `POST /api/auth/login` - 로그인 (role 반환)
  - `GET /api/user/profile` - 프로필 조회 (role 포함)
  - `PUT /api/user/profile` - 프로필 수정

**관리자 권한 검증:**
```python
from app.api.dependencies import require_admin

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    admin_id: str = Depends(require_admin)  # 관리자만 접근 가능
):
    # 게시글 삭제 로직
    pass
```

### 5.6 Agent 관리 API (🆕)
- **기능**: Agent 시스템 관리
- **API**:
  - `POST /api/agent/route` - Agent 요청 라우팅
  - `POST /api/agent/session` - 세션 생성
  - `GET /api/agent/session/{session_id}` - 세션 정보 조회
  - `DELETE /api/agent/session/{session_id}` - 세션 초기화
  - `GET /api/agent/available` - 사용 가능한 Agent 목록

## 6. 데이터 모델

### User
```typescript
{
  userId: string;
  email: string;
  name: string;
  profile: "general" | "patient" | "researcher";
  role: "user" | "admin";  // 🆕 관리자 권한 (기본값: "user")
  createdAt: Date;
}
```

**권한 시스템:**
- `user`: 일반 사용자 (기본값)
- `admin`: 관리자 (게시글 삭제 등 관리 권한)

### ChatMessage
```typescript
{
  chatMessageId: string;
  userId: string;
  message: string;
  response: string;
  timestamp: Date;
}
```

### NutriRecord
```typescript
{
  nutriRecordId: string;
  userId: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foods: string[];
  nutrients: {
    calories: number;
    protein: number;
    sodium: number;
    potassium: number;
  };
  date: Date;
}
```

### Post
```typescript
{
  postId: string;
  userId: string;
  title: string;
  content: string;
  likes: number;
  comments: Comment[];
  createdAt: Date;
}
```

## 7. API 명세

### 공통 응답 형식
```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 8. 개발 가이드라인

### 코드 컨벤션
- **Python**: PEP 8
- **TypeScript**: ESLint + Prettier
- **커밋 메시지**: `[기능] 설명` (예: `[Auth] 로그인 API 구현`)

### 브랜치 전략
- `main`: 배포용 (건드리지 않음)
- `develop`: 통합 개발 브랜치
- `feature/기능명`: 각자 기능 개발

### 개발 순서
1. **Week 1-2**: 기본 구조 및 Auth (jk)
2. **Week 3**: 
   - jh: 벡터 DB 준비 (논문 임베딩 생성)
   - Yj, ch: 각자 기능 개발 시작
3. **Week 4**: 
   - jh: Chat 기능 완성
   - Yj, ch: 각자 기능 완성
4. **Week 5**: 통합 및 테스트
5. **Week 6**: Trends (jh) 추가 개발

## 9. 환경 설정

### Backend `.env`
```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/careguide
DATABASE_NAME=careguide
OPENAI_API_KEY=sk-...
SECRET_KEY=your-secret-key-change-this
```

**중요**: 
- MongoDB Atlas 사용 권장 (Vector Search 지원)
- OpenAI API 키 필수 (임베딩 + GPT-3.5)

### Frontend `.env`
```
VITE_API_URL=http://localhost:8000
```

## 10. 실행 방법

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 11. 제외 항목

- ❌ CI/CD
- ❌ Docker
- ❌ Mobile 앱
- ❌ 배포 전략
- ❌ 테스트 자동화

## 12. 참고 자료

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [React 문서](https://react.dev/)
- [MongoDB 문서](https://docs.mongodb.com/)
- [PubMed API](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
