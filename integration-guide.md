# Integration Guide

> 각 기능을 통합하고 협업하는 방법

## 1. 개발 순서

### Phase 1: 기반 작업 (Week 1-2)
**담당**: jk

1. 프로젝트 초기 설정
   - 모노레포 구조 생성
   - Backend FastAPI 기본 구조
   - Frontend React 기본 구조
   - MongoDB 연결

2. 인증 시스템
   - 회원가입 API
   - 로그인 API
   - JWT 토큰 관리
   - 프로필 관리 API

✅ **완료 기준**: 회원가입/로그인이 작동하고, 다른 팀원이 API를 사용할 수 있어야 함

### Phase 2: 핵심 기능 개발 (Week 3-4)
**담당**: jh, Yj, ch (동시 진행)

**중요: jh는 먼저 벡터 DB 준비 작업 필요**
1. MongoDB Atlas Vector Search 설정
2. Archive.zip의 논문 데이터 임베딩 생성
3. 4,850개 논문 벡터 저장

각자 담당 기능 개발 시작
- jk가 완성한 인증 API 사용
- jh는 벡터 DB 준비 후 채팅 기능 개발
- Yj, ch는 각자 독립적으로 작업
- 매일 develop 브랜치 동기화

✅ **완료 기준**: 
- jh: 벡터 검색 작동, 채팅 API 완성
- Yj: 식사 기록 CRUD 작동
- ch: 게시글 CRUD 작동

### Phase 3: 통합 (Week 5)
**담당**: 전체

- API 통합 테스트
- UI/UX 일관성 확인
- 버그 수정

### Phase 4: 추가 기능 (Week 6)
**담당**: jh

- Trends 대시보드 개발
- 통계 시각화

## 2. API 엔드포인트 규칙

### 기본 URL
```
http://localhost:8000/api
```

### 각 기능별 prefix
- **Auth**: `/api/auth/*` (jk)
- **User**: `/api/user/*` (jk)
- **Chat**: `/api/chat/*` (jh)
- **Nutri**: `/api/nutri/*` (Yj)
- **Community**: `/api/community/*` (ch)
- **Trends**: `/api/trends/*` (jh)

### 예시
```
POST /api/auth/signup
POST /api/auth/login
GET  /api/user/profile
POST /api/chat/message
POST /api/nutri/record
GET  /api/community/posts
```

## 3. 공통 컴포넌트

### 모두가 사용할 컴포넌트 (jk가 먼저 만들기)
```
frontend/src/components/
├── Layout/
│   ├── Header.tsx        # 상단 네비게이션
│   ├── Sidebar.tsx       # 사이드바
│   └── Footer.tsx        # 하단
├── common/
│   ├── Button.tsx        # 공통 버튼
│   ├── Input.tsx         # 공통 입력
│   ├── Card.tsx          # 공통 카드
│   └── Loading.tsx       # 로딩 스피너
└── auth/
    └── ProtectedRoute.tsx # 인증 필요한 페이지
```

### 사용 예시
```typescript
import { Button } from '@/components/common/Button';
import { Header } from '@/components/Layout/Header';

function MyPage() {
  return (
    <>
      <Header />
      <Button onClick={handleClick}>클릭</Button>
    </>
  );
}
```

## 4. API 호출 규칙

### API Client 설정 (jk가 만들기)
```typescript
// frontend/src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// 요청 인터셉터 (토큰 자동 추가)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### 각 기능별 API 파일
```typescript
// frontend/src/api/nutri.ts (Yj)
import apiClient from './client';

export const nutriApi = {
  recordMeal: (data) => apiClient.post('/nutri/record', data),
  getStats: () => apiClient.get('/nutri/stats'),
  searchRecipes: (query) => apiClient.get('/nutri/recipes', { params: { query } }),
};

// frontend/src/api/chat.ts (jh)
export const chatApi = {
  sendMessage: (message) => apiClient.post('/chat/message', { message }),
  getHistory: () => apiClient.get('/chat/history'),
};

// frontend/src/api/community.ts (ch)
export const communityApi = {
  getPosts: () => apiClient.get('/community/posts'),
  createPost: (data) => apiClient.post('/community/posts', data),
  createComment: (postId, content) => apiClient.post('/community/comments', { postId, content }),
};
```

## 5. 상태 관리 (Context API)

### UserContext (jk가 만들기)
```typescript
// frontend/src/contexts/UserContext.tsx
import { createContext, useState } from 'react';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
```

### 사용 방법
```typescript
import { useContext } from 'react';
import { UserContext } from '@/contexts/UserContext';

function MyComponent() {
  const { user, isLoggedIn } = useContext(UserContext);

  if (!isLoggedIn) {
    return <div>로그인이 필요합니다</div>;
  }

  return <div>안녕하세요, {user.name}님</div>;
}
```

## 6. 데이터베이스 스키마

### MongoDB Collections

> **주의**: MongoDB에서는 `_id`를 primary key로 사용하지만, 애플리케이션 레벨(TypeScript 모델)에서는 명확성을 위해 각 모델별로 `userId`, `postId`, `chatMessageId` 등으로 매핑합니다.

#### users (jk)
```json
{
  "_id": "ObjectId",  // 애플리케이션 레벨: userId
  "email": "user@example.com",
  "password": "hashed_password",
  "name": "홍길동",
  "profile": "patient",
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### papers (jh) - **벡터 검색용**
```json
{
  "_id": "ObjectId",
  "title": "Efficacy of interpersonal psychotherapy...",
  "abstract": "Evidence for the efficacy...",
  "authors": ["Salman Althobaiti", "..."],
  "journal": "Journal of affective disorders",
  "doi": "10.1016/j.jad.2019.12.021",
  "keywords": ["Interpersonal psychotherapy", "PTSD"],
  "embedding": [0.023, -0.045, ...],  // 1536 dimensions
  "created_at": "2025-01-01T00:00:00Z"
}

// Vector Search Index (MongoDB Atlas에서 생성)
// Index Name: "vector_index"
// Field: "embedding"
// Dimensions: 1536
// Similarity: cosine
```

#### chat_messages (jh)
```json
{
  "_id": "ObjectId",  // 애플리케이션 레벨: chatMessageId
  "user_id": "ObjectId",  // 애플리케이션 레벨: userId
  "message": "질문...",
  "response": "답변...",
  "papers": [
    {
      "title": "...",
      "source": "Local DB",
      "relevance": "0.85"
    }
  ],
  "timestamp": "2025-01-01T00:00:00Z"
}
```

#### nutri_records (Yj)
```json
{
  "_id": "ObjectId",  // 애플리케이션 레벨: nutriRecordId
  "user_id": "ObjectId",  // 애플리케이션 레벨: userId
  "meal_type": "breakfast",
  "foods": ["밥", "김치"],
  "nutrients": {
    "calories": 500,
    "protein": 20,
    "sodium": 800,
    "potassium": 300
  },
  "date": "2025-01-01T00:00:00Z"
}
```

#### posts (ch)
```json
{
  "_id": "ObjectId",  // 애플리케이션 레벨: postId
  "user_id": "ObjectId",  // 애플리케이션 레벨: userId
  "title": "제목",
  "content": "내용",
  "likes": 10,
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### comments (ch)
```json
{
  "_id": "ObjectId",  // 애플리케이션 레벨: commentId
  "post_id": "ObjectId",  // 애플리케이션 레벨: postId
  "user_id": "ObjectId",  // 애플리케이션 레벨: userId
  "content": "댓글 내용",
  "created_at": "2025-01-01T00:00:00Z"
}
```

## 7. 협업 규칙

### 코드 리뷰
- PR 올리면 최소 1명의 리뷰 필요
- 간단한 피드백도 OK
- "LGTM" (Looks Good To Me) 또는 "👍"로 승인

### 미팅
- **일일 스탠드업** (10분)
  - 어제 한 일
  - 오늘 할 일
  - 막힌 부분

- **주간 통합 미팅** (30분)
  - 각자 진행 상황 공유
  - 통합 이슈 논의

### 소통
- **Slack/Discord**: 일상적인 질문
- **GitHub Issues**: 버그, 기능 요청
- **GitHub PR**: 코드 리뷰

## 8. 파일 충돌 방지

### 각자 담당 파일
- **jk**: `frontend/src/pages/SignUp.tsx`, `MyPage.tsx`, `backend/app/api/auth.py`
- **jh**: `frontend/src/pages/Chat.tsx`, `Trends.tsx`, `backend/app/api/chat.py`
- **Yj**: `frontend/src/pages/Nutri.tsx`, `backend/app/api/nutri.py`
- **ch**: `frontend/src/pages/Community.tsx`, `backend/app/api/community.py`

### 공통 파일 수정 시
1. 먼저 팀원에게 알리기
2. 빠르게 작업하고 바로 푸시
3. 다른 팀원은 즉시 pull 받기

## 9. 테스트 가이드

### API 테스트 (Postman/Thunder Client)
각자 API 완성하면:
1. Postman Collection 만들기
2. 팀원과 공유
3. 서로 API 테스트해보기

### 통합 테스트 시나리오
1. 회원가입 → 로그인
2. 로그인 → 채팅
3. 로그인 → 식사 기록
4. 로그인 → 게시글 작성
5. 로그인 → 마이페이지

## 10. 문제 해결

### API가 안 돼요!
1. Backend 서버 실행 확인: `http://localhost:8000`
2. Frontend 환경변수 확인: `.env` 파일의 `VITE_API_URL`
3. 브라우저 콘솔 확인: F12 → Console 탭
4. Network 탭에서 요청/응답 확인

### 벡터 검색이 안 돼요!
1. MongoDB Atlas Vector Search 인덱스 생성 확인
2. 논문 임베딩 데이터 확인: `papers_collection.count_documents({"embedding": {"$exists": True}})`
3. OpenAI API 키 확인: `.env` 파일의 `OPENAI_API_KEY`
4. 벡터 차원 확인: 1536 dimensions (text-embedding-3-small)

### OpenAI API 에러
1. API 키 확인
2. 요금 한도 확인 (무료 크레딧 소진 여부)
3. Rate limit 에러: 요청 속도 줄이기
4. 임베딩 생성 시 배치 처리 (한 번에 최대 100개)

### CORS 에러
Backend `main.py`에서 설정 확인:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### MongoDB 연결 안 됨
1. MongoDB 실행 확인 (로컬) 또는 Atlas 연결 확인
2. `.env` 파일의 `MONGODB_URL` 확인
3. 방화벽 확인
4. Atlas의 경우: Network Access에서 IP 허용 확인

## 11. 배포 전 체크리스트

- [ ] 모든 API 테스트 완료
- [ ] 회원가입/로그인 작동
- [ ] 각 페이지 정상 작동
- [ ] 에러 처리 확인
- [ ] 로딩 상태 표시
- [ ] 반응형 디자인 (모바일 제외)
- [ ] 환경변수 설정

## 12. 긴급 연락망

### 막혔을 때
1. Slack/Discord에 질문
2. 30분 이상 막히면 즉시 공유
3. 서로 도와가며 해결

### 각자 강점
- **jk**: 인증, 데이터베이스
- **jh**: AI, 검색
- **Yj**: 데이터 처리
- **ch**: UI/UX

어려운 부분은 서로의 강점을 활용!
