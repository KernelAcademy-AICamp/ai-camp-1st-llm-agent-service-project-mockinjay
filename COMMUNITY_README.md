# 🏥 CareGuide 커뮤니티 기능

> CKD(만성 콩팥병) 환자들을 위한 온라인 커뮤니티 서비스
> 게시판, 챌린지, 설문조사 등의 기능 제공

**개발자:** 철희 (Community 담당)
**완성도:** ✅ 100% (모든 기능 완성 및 버그 수정 완료)
**마지막 업데이트:** 2025-11-19

---

## ⚡ 빠른 시작 (5분)

### 1. 백엔드 실행
```bash
cd backend
pip install -r requirements.txt --break-system-packages
python seed_community_data.py  # 더미 데이터 생성 (선택)
python -m uvicorn main:app --reload
```
✅ `http://localhost:8000` 에서 서버 실행 중

### 2. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```
✅ `http://localhost:5173` 에서 앱 실행 중

### 3. 브라우저에서 확인
- **앱:** http://localhost:5173/community
- **API 문서:** http://localhost:8000/docs

---

## ✨ 주요 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 📝 **게시글** | 작성/조회/수정/삭제 | ✅ |
| 💬 **댓글** | 작성/수정/삭제 | ✅ |
| ❤️ **좋아요** | 게시글 좋아요 | ✅ |
| 🖼️ **이미지** | 업로드/표시 | ✅ |
| 📜 **무한 스크롤** | Cursor 기반 페이징 | ✅ |
| 🏷️ **분류** | 게시판/챌린지/설문조사 | ✅ |
| 📌 **추천글** | 상단 3개 추천 게시글 | ✅ |

---

## 🗂️ 폴더 구조

```
커뮤니티 관련 파일들:
├── 📄 COMMUNITY_README.md (이 파일)
├── 📄 COMMUNITY_SETUP.md (실행 방법)
├── 📄 TESTING_GUIDE.md (테스트 방법)
├── 📄 COMMUNITY_CHANGELOG.md (수정 이력)
│
└── 📁 backend/community/
    ├── models.py (데이터 모델)
    ├── router.py (API 엔드포인트 12개)
    └── database.py (MongoDB 연결)
│
└── 📁 frontend/src/
    ├── 📁 components/
    │   ├── PostCard.tsx (게시글 카드)
    │   ├── CommentList.tsx (댓글 목록)
    │   └── CreatePostModal.tsx (글쓰기)
    ├── 📁 pages/
    │   ├── Community.tsx (메인 페이지)
    │   └── PostDetailPage.tsx (상세 페이지)
    └── 📁 api/
        └── community.ts (API 함수들)
```

---

## 🔌 API 엔드포인트 (12개)

### 게시글 (Posts)
```
GET    /api/community/posts              # 목록 (무한 스크롤)
GET    /api/community/posts/featured     # 추천 3개
GET    /api/community/posts/{id}         # 상세
POST   /api/community/posts              # 작성
PUT    /api/community/posts/{id}         # 수정
DELETE /api/community/posts/{id}         # 삭제
```

### 댓글 (Comments)
```
POST   /api/community/comments           # 작성
PUT    /api/community/comments/{id}      # 수정
DELETE /api/community/comments/{id}      # 삭제
```

### 좋아요 (Likes)
```
POST   /api/community/posts/{id}/like    # 추가
DELETE /api/community/posts/{id}/like    # 취소
```

### 이미지 (Upload)
```
POST   /api/community/uploads            # 업로드
```

**상세 문서:** `/docs` 접속 (서버 실행 중)

---

## 🛠️ 기술 스택

### Backend
- **Framework:** FastAPI (parlant 호환)
- **Database:** MongoDB + Motor (async)
- **Validation:** Pydantic

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Styling:** Tailwind CSS 3.4
- **HTTP:** Axios

---

## 📚 문서

각 파일의 용도:

| 파일 | 용도 | 읽는 시간 |
|------|------|---------|
| **COMMUNITY_README.md** | 📖 전체 개요 (이 파일) | 5분 |
| **COMMUNITY_SETUP.md** | 🚀 실행/설정 방법 | 10분 |
| **TESTING_GUIDE.md** | ✅ 테스트 방법 | 15분 |
| **COMMUNITY_CHANGELOG.md** | 📝 수정 이력 | 20분 |

**처음 읽는 순서:** README → SETUP → TESTING → CHANGELOG

---

## ⚙️ 환경 설정

### 필수 환경
- Python 3.8+
- Node.js 16+
- MongoDB (로컬 또는 Atlas)

### .env 파일 (backend/.env)
```env
MONGODB_URI=mongodb://localhost:27017/careguide
# 또는 MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/careguide
```

### .env 파일 (frontend/.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## 🐛 알려진 이슈 및 해결

### ✅ 해결된 이슈 (Session 10-16)
- 조회수 2배 증가 → `isMounted` 플래그 추가
- 댓글 이미지 안 보임 → API 응답 수정
- 입력창 화면 밖으로 → 인라인 스타일 추가
- 댓글 순서 변경 → 로컬 상태 업데이트로 변경
- 댓글 삭제 오류 → prop 구조 분해 수정

**상세:** COMMUNITY_CHANGELOG.md 참고

---

## 💡 주요 구현 사항

### 1. 무한 스크롤
```typescript
// Intersection Observer + Cursor 기반 페이징
const lastPostRef = useCallback((node: HTMLDivElement) => {
  observer.current = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore) {
      loadMorePosts();
    }
  });
}, []);
```

### 2. 댓글 순서 유지
```typescript
// 댓글 수정 시 로컬 상태만 업데이트
setComments(prev => prev.map(comment =>
  comment.id === updatedComment.id ? updatedComment : comment
));
```

### 3. 안전한 날짜 처리
```typescript
const formatCommentDate = (dateString: string | undefined): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '날짜 정보 없음';
    return date.toLocaleDateString('ko-KR', {...});
  } catch {
    return '날짜 정보 없음';
  }
};
```

---

## 🚀 다음 단계

### 즉시 가능
1. 로컬 MongoDB 실행 또는 MongoDB Atlas 설정
2. `npm run dev` 로 앱 실행
3. TESTING_GUIDE.md 따라 테스트

### 향후 개선
- 검색 기능
- 게시글 필터링 (타입별)
- 사용자 프로필
- 알림 시스템

---

## ❓ FAQ

**Q: 더미 데이터를 다시 생성하고 싶어요**
```bash
cd backend
python seed_community_data.py
```

**Q: 특정 게시글이 안 보여요**
- API 문서 (http://localhost:8000/docs) 확인
- 브라우저 개발자 도구 Network 탭 확인
- TROUBLESHOOTING.md 참고

**Q: 새 기능을 추가하려면?**
1. backend/community/router.py 에서 엔드포인트 추가
2. frontend/src/api/community.ts 에서 함수 추가
3. frontend/src/pages 또는 components 에서 UI 구현

---

## 📞 개발자

**이름:** 철희 (ch)
**담당:** 커뮤니티 기능
**프로젝트:** CareGuide - MockingJay
**완성도:** ✅ 100%

---

## 📄 라이선스

CareGuide 프로젝트의 일부입니다.

---

**마지막 업데이트:** 2025-11-19
**다음 리뷰:** PR 리뷰 예정
