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

## 4. 핵심 기능

### 4.1 Knowledge Search (jh)
- **경로**: `/chat`
- **기능**: 
  - PubMed 논문 검색 및 요약
  - AI 챗봇 대화
  - 의도 분류 기반 응답
- **API**:
  - `POST /api/chat/message` - 메시지 전송
  - `GET /api/chat/history` - 대화 이력

### 4.2 Nutri Coach (Yj)
- **경로**: `/nutri`
- **기능**:
  - 식사 기록
  - 영양소 통계
  - 레시피 검색
- **API**:
  - `POST /api/nutri/record` - 식사 기록
  - `GET /api/nutri/stats` - 통계 조회
  - `GET /api/nutri/recipes` - 레시피 검색

### 4.3 Community (ch)
- **경로**: `/community`
- **기능**:
  - 게시글 작성/조회
  - 댓글
  - 좋아요
- **API**:
  - `POST /api/community/posts` - 게시글 작성
  - `GET /api/community/posts` - 게시글 목록
  - `POST /api/community/comments` - 댓글 작성

### 4.4 Trends (jh)
- **경로**: `/trends`
- **기능**:
  - 논문 트렌드 시각화
  - 통계 대시보드
- **API**:
  - `GET /api/trends/papers` - 논문 트렌드

### 4.5 Auth & My Page (jk)
- **경로**: `/signup`, `/login`, `/mypage`
- **기능**:
  - 회원가입/로그인
  - 프로필 관리
  - 북마크 관리
- **API**:
  - `POST /api/auth/signup` - 회원가입
  - `POST /api/auth/login` - 로그인
  - `GET /api/user/profile` - 프로필 조회
  - `PUT /api/user/profile` - 프로필 수정

## 5. 데이터 모델

### User
```typescript
{
  userId: string;
  email: string;
  name: string;
  profile: "general" | "patient" | "researcher";
  createdAt: Date;
}
```

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

## 6. API 명세

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

## 7. 개발 가이드라인

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

## 8. 환경 설정

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

## 9. 실행 방법

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

## 10. 제외 항목

- ❌ CI/CD
- ❌ Docker
- ❌ Mobile 앱
- ❌ 배포 전략
- ❌ 테스트 자동화

## 11. 참고 자료

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [React 문서](https://react.dev/)
- [MongoDB 문서](https://docs.mongodb.com/)
- [PubMed API](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
