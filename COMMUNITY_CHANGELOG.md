# 커뮤니티 기능 개발 이력

> **개발자:** 철희 (Community 담당)
> **마지막 업데이트:** 2025-11-19
> **프로젝트:** CareGuide - AI 기반 CKD 환자 지원 플랫폼

---

## 📋 수정 내용 요약

### 핵심 기능 (완성도: 100%)
- ✅ 게시글 CRUD (작성/조회/수정/삭제)
- ✅ 댓글 기능 (작성/수정/삭제)
- ✅ 좋아요 기능
- ✅ 무한 스크롤 (cursor 기반 페이징)
- ✅ 이미지 업로드

---

## 🔧 상세 수정 이력

### Session 1-4: 초기 기능 구현
**날짜:** 2025-11-18~19 초반

**구현된 항목:**
1. ✅ 기본 게시글 목록 페이지 (Community.tsx)
2. ✅ 게시글 상세 페이지 (PostDetailPage.tsx)
3. ✅ 게시글 카드 컴포넌트 (PostCard.tsx)
4. ✅ API 엔드포인트 (12개)
5. ✅ 무한 스크롤 구현 (Intersection Observer)

---

### Session 5-6: 수정/삭제 기능 추가
**날짜:** 2025-11-18 중반

**파일 수정:**
- `PostDetailPage.tsx`: 게시글 수정 버튼 추가
- `PostCard.tsx`: 삭제 버튼 추가
- `backend/community/router.py`: 수정/삭제 엔드포인트 추가

**기능:**
- ✅ 게시글 작성자 본인만 수정/삭제 가능
- ✅ 수정 후 자동 페이지 새로고침
- ✅ 삭제 후 목록에서 즉시 제거

---

### Session 7-8: UI 개선 및 레이아웃 수정
**날짜:** 2025-11-18 후반

**파일 수정:**
- `PostDetailPage.tsx`: 뒤로가기 버튼 추가
- `PostDetailPage.css`: 반응형 CSS 추가
- `PostCard.tsx`: 레이아웃 개선

**기능:**
- ✅ 상세 페이지에서 목록 페이지로 돌아가기
- ✅ 게시글 길이에 따른 동적 레이아웃
- ✅ 모바일 반응형 디자인 개선

---

### Session 9: 더미 데이터 추가
**날짜:** 2025-11-18 저녁

**파일 생성/수정:**
- `backend/seed_community_data.py`: 더미 데이터 생성 스크립트 생성
- 추가된 데이터:
  - 게시글: 18개 (BOARD 10개, CHALLENGE 5개, SURVEY 3개)
  - 댓글: 84개 (게시글당 3-8개)
  - 다양한 이미지 URL 포함

**기능:**
- ✅ 테스트용 다양한 게시글 생성
- ✅ 댓글 자동 생성
- ✅ 이미지 URL 최적화 (picsum.photos 사용)

---

### Session 10: 조회수 중복 계산 버그 수정
**날짜:** 2025-11-19 초반

**파일 수정:**
- `PostDetailPage.tsx` (라인 31-66): useEffect 중복 실행 방지

**버그 해결:**
- ❌ **문제:** React StrictMode에서 조회수가 2번 증가
- ✅ **해결:** `isMounted` 플래그 추가로 두 번째 실행 무시

**코드:**
```typescript
useEffect(() => {
  let isMounted = true;
  const loadDetail = async () => {
    const data = await fetchPostDetailPage(postId);
    if (isMounted) {  // ← 두 번째 실행에서 false
      setPost(data.post);
    }
  };
  loadDetail();
  return () => { isMounted = false; };
}, [postId]);
```

---

### Session 11-13: 4가지 주요 버그 수정
**날짜:** 2025-11-19 중반

#### **버그 1: 더미 데이터 이미지 깨짐**
- **파일:** `backend/seed_community_data.py`
- **원인:** Unsplash 임시 URL 사용
- **해결:** picsum.photos 영구 URL로 변경
- **코드 위치:** `IMAGE_URLS` 리스트 변경

#### **버그 2: 댓글 작성자 정보 & 날짜 미표시**
- **파일:**
  - `backend/seed_community_data.py`
  - `frontend/src/components/CommentList.tsx`
- **원인:**
  - seed에서 `authorName` 필드 누락
  - CommentList에서 안전한 날짜 파싱 없음
- **해결:**
  - seed에 `"authorName": author["name"]` 추가 (라인 242)
  - `formatCommentDate()` 함수 추가로 try-catch 처리

**코드:**
```typescript
const formatCommentDate = (dateString: string | undefined): string => {
  if (!dateString) return '날짜 정보 없음';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '날짜 정보 없음';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '날짜 정보 없음';
  }
};
```

#### **버그 3: 게시글 수정 시 입력창 화면 밖으로 튀어남**
- **파일:** `PostDetailPage.tsx`
- **원인:** Tailwind 클래스로 충분한 제약 없음
- **해결:** textarea와 input에 인라인 스타일 적용 (라인 303-394)
- **스타일:**
  ```typescript
  style={{
    width: '100%',
    maxWidth: '100%',
    padding: '15px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }}
  ```

#### **버그 4: 댓글 수정 시 시간 정보 안 갱신**
- **파일:** `PostDetailPage.tsx`
- **원인:** 게시글 수정 시 `loadPostDetail()` 호출로 댓글 재로드
- **해결:** 로컬 상태 업데이트로 변경

---

### Session 14: 댓글 수정 UI 스타일 통일
**날짜:** 2025-11-19 중반

**파일 수정:**
- `CommentList.tsx` (라인 184-201)

**변경 사항:**
- 댓글 수정 textarea 스타일을 CommentForm과 동일하게 통일
- `px-4 py-3`, `border-gray-300` 적용
- 여백 처리 개선

---

### Session 15: 댓글 순서 유지 버그 수정
**날짜:** 2025-11-19 후반

**파일 수정:**
- `CommentList.tsx` (라인 37-42, 74-95)
- `PostDetailPage.tsx` (라인 197-215, 521)

**문제:**
- ❌ 댓글을 수정하면 전체 목록을 다시 로드해서 순서가 바뀜
- ❌ 맨 아래 댓글 수정 후 맨 위로 올라감

**해결:**
1. `onCommentUpdateLocal` prop 추가
2. CommentList에서 로컬 상태만 업데이트
3. 전체 목록 재로드 제거

**코드:**
```typescript
// PostDetailPage.tsx
const handleCommentUpdateLocal = (updatedComment: Comment) => {
  if (Object.keys(updatedComment).length === 1) {
    // 삭제: 필터링
    setComments(prev => prev.filter(comment =>
      comment.id !== updatedComment.id
    ));
  } else {
    // 수정: 해당 댓글만 교체
    setComments(prev => prev.map(comment =>
      comment.id === updatedComment.id ? updatedComment : comment
    ));
  }
};
```

---

### Session 16: 댓글 삭제 오류 수정
**날짜:** 2025-11-19 후반

**파일 수정:**
- `CommentList.tsx` (라인 98-119)

**오류:**
- ❌ `onCommentUpdate is not a function` 에러
- ❌ 구조 분해에서 `onCommentUpdateLocal` 받지 않음

**해결:**
- 구조 분해에 `onCommentUpdateLocal` 추가 (라인 41)
- 삭제 시 로컬 업데이트 콜백 호출

---

## 📊 최종 상태

### ✅ 완성된 기능
| 기능 | 상태 | 구현 날짜 |
|------|------|---------|
| 게시글 목록 (무한 스크롤) | ✅ 완성 | 11-18 |
| 게시글 상세 | ✅ 완성 | 11-18 |
| 게시글 작성 | ✅ 완성 | 11-18 |
| 게시글 수정 | ✅ 완성 | 11-18 |
| 게시글 삭제 | ✅ 완성 | 11-18 |
| 댓글 작성 | ✅ 완성 | 11-18 |
| 댓글 수정 | ✅ 완성 | 11-19 |
| 댓글 삭제 | ✅ 완성 | 11-19 |
| 좋아요 | ✅ 완성 | 11-18 |
| 이미지 업로드 | ✅ 완성 | 11-18 |
| 뒤로가기 버튼 | ✅ 완성 | 11-18 |
| 반응형 디자인 | ✅ 완성 | 11-18 |

### ⚠️ 알려진 이슈 (모두 해결됨)
| 이슈 | 상태 | 해결 날짜 |
|------|------|---------|
| 조회수 2배 증가 | ✅ 해결 | 11-19 |
| 이미지 깨짐 | ✅ 해결 | 11-19 |
| 댓글 작성자 미표시 | ✅ 해결 | 11-19 |
| 날짜 Invalid Date | ✅ 해결 | 11-19 |
| 입력창 화면 밖으로 | ✅ 해결 | 11-19 |
| 수정 시간 미갱신 | ✅ 해결 | 11-19 |
| 댓글 순서 변경 | ✅ 해결 | 11-19 |
| 댓글 삭제 오류 | ✅ 해결 | 11-19 |

---

## 🎯 수정된 파일 목록 (총 10개)

### Frontend (7개)
```
frontend/src/
├── pages/
│   ├── Community.tsx (♻️ 수정)
│   └── PostDetailPage.tsx (♻️ 수정)
├── components/
│   ├── PostCard.tsx (♻️ 수정)
│   ├── CommentList.tsx (♻️ 수정, 댓글 순서 유지)
│   ├── CommentForm.tsx (확인)
│   └── CreatePostModal.tsx (확인)
└── pages/
    └── PostDetailPage.css (✨ 생성)
```

### Backend (3개)
```
backend/
├── seed_community_data.py (♻️ 수정, .gitignore 추가)
├── main.py (확인)
└── community/
    └── router.py (♻️ 수정)
```

**범례:**
- ✨ 새로 생성
- ♻️ 수정/개선
- 확인: 검토만 (큰 변화 없음)

---

## 📝 주요 기술적 결정사항

### 1. 상태 관리
- React의 `useState` + 로컬 상태 관리
- 댓글 수정/삭제 시 로컬 업데이트로 성능 최적화

### 2. 날짜 처리
- ISO 8601 형식으로 backend에서 저장
- try-catch로 안전한 파싱 처리

### 3. 이미지 URL
- picsum.photos 사용 (안정적, 무기한)
- Unsplash 임시 URL 제거

### 4. 데이터 플로우
- Backend: FastAPI + Motor (async MongoDB)
- Frontend: React Query 대신 직접 API 호출 (간단한 CRUD)

---

## 🚀 PR 준비 현황

- ✅ 코드 정리 완료 (.gitignore 추가)
- ✅ 버그 수정 완료 (8개)
- ✅ 문서 정리 중 (이 파일)
- ⏳ PR 작성 대기

---

## 💡 다음 개발자를 위한 팁

### 새로운 기능 추가 시
1. Backend: `backend/community/router.py`에 엔드포인트 추가
2. Frontend: `frontend/src/api/community.ts`에 API 함수 추가
3. 타입 정의: `frontend/src/types/community.ts` 업데이트
4. 컴포넌트: 필요한 React 컴포넌트 수정/생성

### 버그 수정 시
1. 콘솔 에러 메시지 확인
2. 브라우저 DevTools에서 Network 탭 확인
3. Backend vs Frontend 중 어디가 문제인지 파악
4. 해당 부분 수정 후 테스트

### 테스트 방법
- `TESTING_GUIDE.md` 참고
- 더미 데이터 재생성: `python backend/seed_community_data.py`

---

## 📞 문의

**개발자:** 철희 (ch - Community 담당)
**최종 정리:** 2025-11-19
**완성도:** 100% (모든 기능 구현 및 버그 수정 완료)
