# CareGuide 프로젝트 설정 완료 가이드

## ✅ 완료된 설정

### 1. 프로젝트 구조
```
mergetodo/
├── backend/          # Python FastAPI 백엔드
│   ├── app/
│   │   ├── main.py
│   │   ├── api/      # API 라우터 (향후 추가)
│   │   ├── models/   # 데이터 모델 (향후 추가)
│   │   ├── services/ # 비즈니스 로직 (향후 추가)
│   │   └── db/       # MongoDB 연결
│   ├── requirements.txt
│   └── .env
├── frontend/         # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
├── data/            # 데이터 파일 디렉토리
└── README.md
```

### 2. Backend 설정
- ✅ FastAPI 앱 생성
- ✅ CORS 설정 (Frontend 연동 준비)
- ✅ MongoDB 연결 코드
- ✅ Health check 엔드포인트
- ✅ DB 연결 확인 엔드포인트

### 3. Frontend 설정
- ✅ Vite + React + TypeScript 구성
- ✅ Tailwind CSS 설정
- ✅ React Router 설정
- ✅ Axios 설치
- ✅ 환경 변수 설정
- ✅ 홈 페이지 (시스템 상태 확인)

---

## 🚀 실행 방법

### 사전 준비
1. **MongoDB 설치 및 실행**
   ```bash
   # macOS (Homebrew)
   brew install mongodb-community
   brew services start mongodb-community

   # 또는 Docker 사용
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Python 3.10+ 설치 확인**
   ```bash
   python --version  # 3.10 이상 필요
   ```

3. **Node.js 설치 확인**
   ```bash
   node --version    # v18 이상 권장
   npm --version
   ```

---

### Backend 실행

```bash
# 1. backend 디렉토리로 이동
cd backend

# 2. 가상환경 생성 (선택사항이지만 권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경 변수 확인 (.env 파일 수정)
# MONGODB_URL, SECRET_KEY, OPENAI_API_KEY 설정

# 5. 서버 실행
uvicorn app.main:app --reload

# ✅ 브라우저에서 확인
# http://localhost:8000          - API 정보
# http://localhost:8000/health   - Health check
# http://localhost:8000/db-check - MongoDB 연결 확인
# http://localhost:8000/docs     - API 문서 (Swagger UI)
```

---

### Frontend 실행

```bash
# 1. frontend 디렉토리로 이동
cd frontend

# 2. 의존성 설치
npm install

# 3. 환경 변수 확인 (.env 파일)
# VITE_API_URL=http://localhost:8000

# 4. 개발 서버 실행
npm run dev

# ✅ 브라우저에서 확인
# http://localhost:5173
```

---

## 🧪 테스트 시나리오

### 1. Backend 단독 테스트
```bash
# Terminal 1: Backend 실행
cd backend
uvicorn app.main:app --reload

# Terminal 2: API 테스트
curl http://localhost:8000/
curl http://localhost:8000/health
curl http://localhost:8000/db-check
```

### 2. Frontend 단독 테스트
```bash
# Terminal 1: Frontend 실행
cd frontend
npm run dev

# 브라우저: http://localhost:5173
# (Backend가 실행되지 않아도 UI는 표시됨)
```

### 3. 전체 통합 테스트
```bash
# Terminal 1: Backend 실행
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend 실행
cd frontend
npm run dev

# 브라우저: http://localhost:5173
# ✅ Backend API 상태: 연결됨
# ✅ MongoDB: 연결됨 (MongoDB가 실행 중인 경우)
```

---

## 📝 다음 단계

### Week 2: 인증 기능 구현 (jk 담당)

#### Backend 작업
1. **User 모델 작성** (`backend/app/models/user.py`)
2. **인증 서비스** (`backend/app/services/auth.py`)
   - 비밀번호 해싱
   - JWT 토큰 생성/검증
3. **Auth API** (`backend/app/api/auth.py`)
   - POST `/api/auth/signup` - 회원가입
   - POST `/api/auth/login` - 로그인
4. **User API** (`backend/app/api/user.py`)
   - GET `/api/user/profile` - 프로필 조회
   - PUT `/api/user/profile` - 프로필 수정

#### Frontend 작업
1. **User Context** (`frontend/src/contexts/UserContext.tsx`)
   - 로그인 상태 관리
2. **회원가입 페이지** (`frontend/src/pages/SignUp.tsx`)
3. **로그인 페이지** (`frontend/src/pages/Login.tsx`)
4. **마이페이지** (`frontend/src/pages/MyPage.tsx`)
5. **공통 컴포넌트**
   - Header (네비게이션)
   - Button, Input 등

---

## ⚠️ 주의사항

### 환경 변수
- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 올라가지 않습니다
- 팀원들과 공유할 때는 환경 변수 값을 별도로 공유하세요

### MongoDB
- 로컬 개발: `mongodb://localhost:27017`
- 프로덕션: MongoDB Atlas 사용 권장
  - `.env`의 `MONGODB_URL`만 변경하면 됨

### CORS
- 현재 Frontend 주소(`http://localhost:5173`)만 허용
- 다른 포트 사용 시 `backend/app/main.py`의 CORS 설정 수정

---

## 🐛 트러블슈팅

### MongoDB 연결 오류
```bash
# MongoDB 실행 확인
brew services list  # macOS
mongosh             # MongoDB Shell 접속 테스트
```

### Backend 포트 충돌
```bash
# 8000 포트 사용 중인 프로세스 확인
lsof -i :8000
# 프로세스 종료
kill -9 <PID>
```

### Frontend 포트 충돌
```bash
# 5173 포트 사용 중인 프로세스 확인
lsof -i :5173
# 또는 다른 포트 사용
npm run dev -- --port 3000
```

### 패키지 설치 오류
```bash
# Backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [React 공식 문서](https://react.dev/)
- [Vite 공식 문서](https://vitejs.dev/)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/)
- [MongoDB Python Driver](https://pymongo.readthedocs.io/)

---

## 👥 팀원 연락처

문제 발생 시 해당 담당자에게 문의하세요:
- **jk**: 회원가입, 로그인, 마이페이지, 프로젝트 기반 구조
- **jh**: 지식 검색(Chat), 트렌드(Trends)
- **Yj**: 영양 관리(Nutri Coach)
- **ch**: 커뮤니티(Community)
