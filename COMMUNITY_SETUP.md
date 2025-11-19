# 커뮤니티 기능 - 설정 및 실행 가이드

> 커뮤니티 기능을 로컬에서 실행하기 위한 단계별 가이드

---

## 📋 사전 준비

### 필수 설치
- ✅ Python 3.8 이상
- ✅ Node.js 16 이상
- ✅ MongoDB (로컬 또는 MongoDB Atlas)
- ✅ Git (선택)

### 확인 방법
```bash
python --version    # Python 3.8+ 확인
node --version      # Node.js 16+ 확인
npm --version       # npm 확인
```

---

## 🗄️ MongoDB 설정

### 방법 1: 로컬 MongoDB 설치 (Mac)

**1단계: Homebrew로 MongoDB 설치**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**2단계: MongoDB 실행**
```bash
brew services start mongodb-community
```

**3단계: 연결 확인**
```bash
mongosh  # 또는 mongo
```
```
> use careguide
> db.posts.find()
```

**4단계: .env 파일 설정**
```bash
cd backend
cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/careguide
EOF
```

---

### 방법 2: MongoDB Atlas (클라우드, 추천)

**1단계: MongoDB Atlas 가입**
1. https://www.mongodb.com/cloud/atlas 방문
2. "Create a free account" 클릭
3. 이메일로 가입

**2단계: 무료 클러스터 생성**
1. 로그인 후 "Create a Project" 클릭
2. 프로젝트명: "careguide-dev"
3. "Build a Cluster" → "Free" 선택
4. 클라우드 공급자: AWS
5. 리전: 가장 가까운 지역 (서울 권장)
6. 클러스터 생성 (5-10분 대기)

**3단계: 데이터베이스 연결 설정**

1. "Database" 메뉴에서 "Connect" 클릭
2. "Allow access from anywhere" 선택 (개발용)
   - IP 주소: `0.0.0.0/0`
3. "Create user" 클릭
   - Username: `careguide_user`
   - Password: 자신이 정한 비밀번호 (기억할 것!)

**4단계: 연결 문자열 복사**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
```

**5단계: .env 파일 설정**
```bash
cd backend
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://careguide_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/careguide
EOF
```

**경고:** 비밀번호를 .env에 저장하지 말고, .gitignore에 추가하세요!

---

## 🎬 백엔드 실행

### 1단계: 패키지 설치
```bash
cd backend

# 패키지 설치 (최초 1회만)
pip install -r requirements.txt --break-system-packages
```

**예상 결과:**
```
Successfully installed fastapi-0.115.12 uvicorn-0.38.0 ...
```

### 2단계: 더미 데이터 생성 (선택)
```bash
python seed_community_data.py
```

**예상 결과:**
```
🔍 MongoDB 연결 중...
✅ MongoDB 연결 성공!
📝 게시글 데이터 생성 중...
✅ 18개의 게시글 삽입 완료
💬 댓글 데이터 생성 중...
✅ 84개의 댓글 삽입 완료
```

### 3단계: 백엔드 서버 실행
```bash
python -m uvicorn main:app --reload
```

**예상 결과:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 4단계: 서버 확인
브라우저에서 다음 주소 방문:
- API 문서: http://localhost:8000/docs
- 서버 상태: http://localhost:8000

**API 문서에서 테스트:**
1. "Try it out" 버튼 클릭
2. "Execute" 클릭해서 응답 확인

---

## 🎨 프론트엔드 실행

### 1단계: 패키지 설치
```bash
cd frontend

# 패키지 설치 (최초 1회만)
npm install
```

**예상 결과:**
```
added 400+ packages
```

### 2단계: 환경 설정 (선택)
```bash
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:8000
EOF
```

### 3단계: 개발 서버 실행
```bash
npm run dev
```

**예상 결과:**
```
VITE v5.0.0  ready in 456 ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

### 4단계: 브라우저에서 확인
```
http://localhost:5173/community
```

---

## ✅ 정상 작동 확인

### 체크리스트

**백엔드:**
- [ ] http://localhost:8000/docs 접속 가능
- [ ] 게시글 목록 API 호출 가능
- [ ] MongoDB 연결 성공 (콘솔 메시지 확인)

**프론트엔드:**
- [ ] http://localhost:5173/community 접속 가능
- [ ] 게시글 목록 표시됨
- [ ] "테스트 로그인" 버튼 클릭 가능

**통합 테스트:**
```bash
cd frontend
npm run dev  # 실행 중
```
브라우저 개발자 도구:
1. F12 또는 우클릭 > 검사
2. Network 탭 클릭
3. http://localhost:5173/community 새로고침
4. "posts" 요청이 200 상태코드로 응답하는지 확인

---

## 🆘 문제 해결

### 문제 1: "MongoDB 연결 안 됨"
```
ServerSelectionTimeoutError: localhost:27017
```

**해결:**
```bash
# MongoDB 실행 확인
brew services list | grep mongodb

# 실행 중이 아니면 시작
brew services start mongodb-community
```

### 문제 2: "포트 이미 사용 중"
```
Address already in use: ('127.0.0.1', 8000)
```

**해결:**
```bash
# 다른 포트로 실행
python -m uvicorn main:app --reload --port 8001
```

### 문제 3: "npm install 에러"
```
npm ERR! Could not resolve dependency
```

**해결:**
```bash
# 캐시 초기화
npm cache clean --force

# 다시 설치
npm install
```

### 문제 4: "패키지 버전 충돌"
```
conflict: FastAPI v0.115.12 and Pydantic v2.11.7
```

**해결:**
```bash
# requirements.txt의 정확한 버전 사용
pip install --no-cache-dir -r requirements.txt --break-system-packages
```

### 문제 5: "게시글 안 보임"

**확인 사항:**
1. 더미 데이터 생성 확인
   ```bash
   python seed_community_data.py
   ```

2. MongoDB 데이터 확인
   ```bash
   mongosh
   > use careguide
   > db.posts.countDocuments()  # 0이 아닌 숫자가 나와야 함
   ```

3. API 응답 확인
   ```bash
   curl http://localhost:8000/api/community/posts
   ```

---

## 📁 파일 구조

설정 후 다음과 같은 구조가 되어야 합니다:

```
project-root/
├── backend/
│   ├── .env (✨ 생성해야 함)
│   ├── main.py
│   ├── requirements.txt
│   ├── seed_community_data.py
│   └── community/
│       ├── models.py
│       ├── router.py
│       └── database.py
│
└── frontend/
    ├── .env.local (선택)
    ├── package.json
    ├── vite.config.ts
    ├── src/
    │   ├── pages/
    │   │   ├── Community.tsx
    │   │   └── PostDetailPage.tsx
    │   ├── components/
    │   └── api/
    │       └── community.ts
```

---

## 🚀 한 번에 실행하기

### Mac/Linux 자동화 스크립트
```bash
# start-dev.sh 생성
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 CareGuide 커뮤니티 개발 서버 시작..."

# 백엔드 시작 (백그라운드)
echo "📦 백엔드 실행 중..."
cd backend
python -m uvicorn main:app --reload &
BACKEND_PID=$!

# 프론트엔드 시작 (포그라운드)
echo "🎨 프론트엔드 실행 중..."
cd ../frontend
npm run dev

# 정리
kill $BACKEND_PID
EOF

# 실행 권한 부여
chmod +x start-dev.sh

# 실행
./start-dev.sh
```

### 또는 별도 터미널에서
**터미널 1 (백엔드):**
```bash
cd backend
python -m uvicorn main:app --reload
```

**터미널 2 (프론트엔드):**
```bash
cd frontend
npm run dev
```

---

## 📚 다음 단계

1. ✅ 설정 완료
2. → TESTING_GUIDE.md 로 테스트 방법 학습
3. → COMMUNITY_CHANGELOG.md 로 수정 이력 확인

---

## 💬 팁

### 개발 중 유용한 명령어

**더미 데이터 재생성**
```bash
cd backend
python seed_community_data.py
```

**MongoDB 데이터 확인**
```bash
mongosh
> use careguide
> db.posts.find().pretty()
> db.comments.find().pretty()
```

**API 빠른 테스트**
```bash
# 게시글 목록
curl http://localhost:8000/api/community/posts

# 특정 게시글
curl http://localhost:8000/api/community/posts/{postId}
```

**프론트엔드 빌드**
```bash
cd frontend
npm run build  # dist/ 폴더에 프로덕션 빌드 생성
```

---

## 📞 지원

**문제가 있으시면:**
1. TROUBLESHOOTING.md 참고
2. 브라우저 콘솔 (F12) 확인
3. 네트워크 탭 (Network) 확인
4. 서버 로그 (터미널) 확인

---

**마지막 업데이트:** 2025-11-19
**작성자:** 철희 (Community 담당)
