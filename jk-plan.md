# jk 개발 계획 (Auth & My Page)

> 회원가입, 로그인, 마이페이지

## 담당 기능
- Sign up (회원가입)
- Login (로그인)
- My Page (마이페이지)
- 프로젝트 기반 구조 설정

## 개발 순서

### Week 1: 프로젝트 초기 설정

#### 1. 모노레포 구조 생성
```bash
careguide/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── db/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

**체크리스트**:
- [x] 폴더 구조 생성
- [x] Backend FastAPI 기본 설정
- [x] Frontend React + Vite 설정
- [x] `.gitignore` 파일 작성
- [x] README.md 작성

#### 2. Backend 기본 설정

**파일**: `backend/app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CareGuide API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "CareGuide API"}
```

**파일**: `backend/requirements.txt`
```
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
python-jose[cryptography]==3.3.0
passlib==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
```

**파일**: `backend/.env`
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=careguide
SECRET_KEY=your-secret-key-change-this
```

**체크리스트**:
- [x] FastAPI 앱 생성
- [x] CORS 설정
- [x] requirements.txt 작성
- [x] .env 파일 설정
- [x] 서버 실행 확인: `uvicorn app.main:app --reload`

#### 3. MongoDB 연결

**파일**: `backend/app/db/connection.py`
```python
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DATABASE_NAME")]

# Collections
users_collection = db["users"]
```

**체크리스트**:
- [ ] MongoDB 설치 및 실행 (사용자가 직접 설치 필요)
- [x] 연결 코드 작성
- [x] 연결 테스트 (엔드포인트 `/db-check` 제공)

#### 4. Frontend 기본 설정

**설치**:
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install axios react-router-dom tailwindcss
```

**파일**: `frontend/src/main.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

**파일**: `frontend/.env`
```
VITE_API_URL=http://localhost:8000
```

**체크리스트**:
- [x] Vite + React + TypeScript 설정
- [x] 필요한 패키지 설치
- [x] Tailwind CSS 설정
- [x] 기본 라우팅 설정
- [x] 개발 서버 실행 확인: `npm run dev`

### Week 2: 인증 기능 구현

#### 5. 회원가입 API

**파일**: `backend/app/models/user.py`
```python
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    profile: str  # "general", "patient", "researcher"

class UserResponse(BaseModel):
    userId: str  # MongoDB _id와 매핑
    email: str
    name: str
    profile: str
```

**파일**: `backend/app/services/auth.py`
```python
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm="HS256")
```

**파일**: `backend/app/api/auth.py`
```python
from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserResponse
from app.services.auth import hash_password, create_access_token
from app.db.connection import users_collection
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup")
async def signup(user: UserCreate):
    # 이메일 중복 확인
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다")
    
    # 사용자 생성
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "profile": user.profile,
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_doc)
    
    return {"success": True, "message": "회원가입 성공"}

@router.post("/login")
async def login(email: str, password: str):
    # 사용자 찾기
    user = users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 잘못되었습니다")
    
    # 토큰 생성
    token = create_access_token({"user_id": str(user["_id"])})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "profile": user["profile"]
        }
    }
```

**main.py에 라우터 추가**:
```python
from app.api import auth

app.include_router(auth.router)
```

**체크리스트**:
- [ ] User 모델 작성
- [ ] 비밀번호 해싱 함수
- [ ] JWT 토큰 생성 함수
- [ ] 회원가입 API
- [ ] 로그인 API
- [ ] Postman으로 테스트

#### 6. 회원가입 페이지

**파일**: `frontend/src/pages/SignUp.tsx`
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState('general');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        email,
        password,
        name,
        profile
      });
      alert('회원가입 성공!');
      navigate('/login');
    } catch (error) {
      alert('회원가입 실패');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">회원가입</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <select
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="general">일반인</option>
          <option value="patient">환자</option>
          <option value="researcher">연구자</option>
        </select>
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          회원가입
        </button>
      </form>
    </div>
  );
}
```

**체크리스트**:
- [ ] 회원가입 폼 UI
- [ ] 입력 검증
- [ ] API 연동
- [ ] 에러 처리
- [ ] 성공 시 로그인 페이지로 이동

#### 7. 로그인 페이지

**파일**: `frontend/src/pages/Login.tsx`
```typescript
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '@/contexts/UserContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        null,
        { params: { email, password } }
      );
      
      // 토큰 저장
      localStorage.setItem('token', response.data.token);
      
      // Context 업데이트
      login(response.data.user);
      
      alert('로그인 성공!');
      navigate('/chat');
    } catch (error) {
      alert('로그인 실패');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">로그인</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          로그인
        </button>
      </form>
    </div>
  );
}
```

**체크리스트**:
- [ ] 로그인 폼 UI
- [ ] API 연동
- [ ] 토큰 저장
- [ ] Context 업데이트
- [ ] 성공 시 채팅 페이지로 이동

#### 8. User Context 생성

**파일**: `frontend/src/contexts/UserContext.tsx`
```typescript
import { createContext, useState, useEffect } from 'react';

interface User {
  userId: string;
  email: string;
  name: string;
  profile: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 페이지 로드 시 토큰 확인
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: 토큰으로 사용자 정보 가져오기
      setIsLoggedIn(true);
    }
  }, []);

  const login = (userData: User) => {
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

**체크리스트**:
- [ ] Context 생성
- [ ] Provider 구현
- [ ] 로그인 상태 관리
- [ ] App.tsx에 Provider 추가

#### 9. 마이페이지 API

**파일**: `backend/app/api/user.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import UserResponse
from app.db.connection import users_collection
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "profile": user["profile"]
    }

@router.put("/profile")
async def update_profile(name: str, user_id: str = Depends(get_current_user)):
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"name": name}}
    )
    return {"success": True, "message": "프로필 업데이트 완료"}
```

**체크리스트**:
- [ ] 프로필 조회 API
- [ ] 프로필 수정 API
- [ ] JWT 인증 미들웨어

#### 10. 마이페이지 UI

**파일**: `frontend/src/pages/MyPage.tsx`
```typescript
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '@/contexts/UserContext';

export default function MyPage() {
  const [name, setName] = useState('');
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdate = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/profile`,
        null,
        { params: { name } }
      );
      alert('프로필 업데이트 완료!');
    } catch (error) {
      alert('업데이트 실패');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">마이페이지</h1>
      <div className="mb-4">
        <label className="block mb-2">이메일</label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full p-2 border rounded bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">프로필</label>
        <input
          type="text"
          value={user?.profile || ''}
          disabled
          className="w-full p-2 border rounded bg-gray-100"
        />
      </div>
      <button
        onClick={handleUpdate}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        저장
      </button>
    </div>
  );
}
```

**체크리스트**:
- [ ] 마이페이지 UI
- [ ] 프로필 조회
- [ ] 프로필 수정
- [ ] 로그아웃 버튼

### Week 3: 공통 컴포넌트 제공

#### 11. 공통 컴포넌트 작성

**파일**: `frontend/src/components/common/Button.tsx`
```typescript
export function Button({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
    >
      {children}
    </button>
  );
}
```

**파일**: `frontend/src/components/Layout/Header.tsx`
```typescript
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '@/contexts/UserContext';

export function Header() {
  const { isLoggedIn, logout } = useContext(UserContext);

  return (
    <header className="bg-blue-600 text-white p-4">
      <nav className="flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">CareGuide</Link>
        <div className="space-x-4">
          <Link to="/chat">지식검색</Link>
          <Link to="/nutri">영양관리</Link>
          <Link to="/community">커뮤니티</Link>
          <Link to="/trends">트렌드</Link>
          {isLoggedIn ? (
            <>
              <Link to="/mypage">마이페이지</Link>
              <button onClick={logout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>
              <Link to="/signup">회원가입</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
```

**체크리스트**:
- [ ] Button 컴포넌트
- [ ] Input 컴포넌트
- [ ] Card 컴포넌트
- [ ] Header 컴포넌트
- [ ] Loading 컴포넌트

#### 12. API Client 설정

**파일**: `frontend/src/api/client.ts`
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

**체크리스트**:
- [ ] Axios 인스턴스 생성
- [ ] 인터셉터 설정
- [ ] 기본 URL 설정
- [ ] 토큰 자동 추가

## 완료 기준

### Backend
- [x] FastAPI 서버 실행
- [x] MongoDB 연결
- [ ] 회원가입 API 작동 (Week 2)
- [ ] 로그인 API 작동 및 JWT 토큰 반환 (Week 2)
- [ ] 프로필 조회/수정 API 작동 (Week 2)
- [x] CORS 설정 완료

### Frontend
- [x] React 앱 실행
- [ ] 회원가입 페이지 작동 (Week 2)
- [ ] 로그인 페이지 작동 및 토큰 저장 (Week 2)
- [ ] 마이페이지 작동 (Week 2)
- [ ] Context API로 로그인 상태 관리 (Week 2)
- [ ] 공통 컴포넌트 제공 (Header, Button 등) (Week 3)
- [ ] API Client 설정 완료 (Week 3)

### 통합
- [ ] 다른 팀원이 API Client 사용 가능 (Week 3)
- [ ] 다른 팀원이 공통 컴포넌트 사용 가능 (Week 3)
- [ ] 다른 팀원이 UserContext 사용 가능 (Week 2-3)

## 도움이 필요한 부분
- JWT 인증 미들웨어 구현
- MongoDB 인덱스 설정
- 비밀번호 찾기 기능 (선택)
