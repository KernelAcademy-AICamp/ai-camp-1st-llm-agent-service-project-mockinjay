# Frontend Migration Action Items

**프로젝트**: CareGuide new_frontend/ 보완 작업
**생성일**: 2025-11-27
**예상 완료**: 2주 (15-20시간)

---

## 📋 P0 - 필수 작업 (즉시)

### ✅ 1. 커뮤니티 작성 페이지 생성
- [ ] **Step 1.1**: `new_frontend/src/types/careguide-ia.ts`에 라우트 추가
  ```typescript
  export const ROUTES = {
    // ...existing routes
    COMMUNITY_CREATE: '/community/create',
  }
  ```

- [ ] **Step 1.2**: `new_frontend/src/routes/AppRoutes.tsx`에 라우트 등록
  ```tsx
  <Route path={ROUTES.COMMUNITY_CREATE} element={
    <ErrorBoundary><CommunityCreatePage /></ErrorBoundary>
  } />
  ```

- [ ] **Step 1.3**: `new_frontend/src/pages/CommunityCreatePage.tsx` 생성
  - 참고: `frontend/src/pages/CommunityCreatePage.tsx`
  - 필요 컴포넌트: Button, Input, Textarea (from shadcn/ui)
  - API 연동: `createPost()` from `services/communityApi.ts`

- [ ] **Step 1.4**: `CommunityPageEnhanced.tsx` 글쓰기 버튼 수정
  ```tsx
  // Before
  onClick={() => setIsCreateModalOpen(true)}

  // After
  onClick={() => navigate(ROUTES.COMMUNITY_CREATE)}
  ```

**예상 시간**: 2시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

### ✅ 2. 커뮤니티 수정 페이지 생성
- [ ] **Step 2.1**: `new_frontend/src/types/careguide-ia.ts`에 라우트 추가
  ```typescript
  export const ROUTES = {
    // ...existing routes
    COMMUNITY_EDIT: '/community/edit/:id',
  }
  ```

- [ ] **Step 2.2**: `new_frontend/src/routes/AppRoutes.tsx`에 라우트 등록
  ```tsx
  <Route path={ROUTES.COMMUNITY_EDIT} element={
    <ErrorBoundary><CommunityEditPage /></ErrorBoundary>
  } />
  ```

- [ ] **Step 2.3**: `new_frontend/src/pages/CommunityEditPage.tsx` 생성
  - 참고: `frontend/src/pages/CommunityEditPage.tsx`
  - 필요 API: `fetchPostDetail()`, `updatePost()` from `services/communityApi.ts`

- [ ] **Step 2.4**: `CommunityPageEnhanced.tsx` PostDetailView에 수정 버튼 추가
  ```tsx
  {canEditPost && (
    <button
      onClick={() => navigate(`/community/edit/${postId}`)}
      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
    >
      <Edit size={20} />
      <span className="text-sm">수정</span>
    </button>
  )}
  ```

**예상 시간**: 2.5시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

## 📋 P1 - 중요 작업 (1주 내)

### ✅ 3. 식사 추가 페이지 생성
- [ ] **Step 3.1**: `new_frontend/src/types/careguide-ia.ts`에 라우트 추가
  ```typescript
  export const ROUTES = {
    // ...existing routes
    ADD_FOOD: '/add-food',
  }
  ```

- [ ] **Step 3.2**: `new_frontend/src/routes/AppRoutes.tsx`에 라우트 등록
  ```tsx
  <Route path={ROUTES.ADD_FOOD} element={
    <ErrorBoundary><AddFoodPage /></ErrorBoundary>
  } />
  ```

- [ ] **Step 3.3**: `new_frontend/src/pages/AddFoodPage.tsx` 생성
  - 기능: 식사 시간, 음식 목록, 영양소 정보 입력
  - API: `createDietLog()` from `services/dietApi.ts` (신규 생성 필요)

- [ ] **Step 3.4**: `DietCarePageEnhanced.tsx` 식사 추가 버튼에 onClick 연결
  ```tsx
  <button
    onClick={() => navigate(ROUTES.ADD_FOOD)}
    className="px-4 py-2 rounded-xl text-white font-medium"
    style={{ backgroundColor: '#00C9B7' }}
  >
    식사 추가
  </button>
  ```

**예상 시간**: 3시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

### ✅ 4. 식사 상세/수정 페이지 생성
- [ ] **Step 4.1**: `new_frontend/src/types/careguide-ia.ts`에 라우트 추가
  ```typescript
  export const ROUTES = {
    // ...existing routes
    DIET_LOG_DETAIL: '/diet-log-detail/:id',
  }
  ```

- [ ] **Step 4.2**: `new_frontend/src/routes/AppRoutes.tsx`에 라우트 등록
  ```tsx
  <Route path={ROUTES.DIET_LOG_DETAIL} element={
    <ErrorBoundary><DietLogDetailPage /></ErrorBoundary>
  } />
  ```

- [ ] **Step 4.3**: `new_frontend/src/pages/DietLogDetailPage.tsx` 생성
  - 기능: 식사 상세 조회, 수정, 삭제
  - API: `getDietLog()`, `updateDietLog()`, `deleteDietLog()` from `services/dietApi.ts`

- [ ] **Step 4.4**: `DietCarePageEnhanced.tsx` 식사 카드에 클릭 이벤트 추가
  ```tsx
  {dietLogs.map((log) => (
    <div
      key={log.id}
      onClick={() => navigate(`/diet-log-detail/${log.id}`)}
      className="card cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* 기존 카드 내용 */}
    </div>
  ))}
  ```

**예상 시간**: 3시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

## 📋 P2 - 중간 작업 (2주 내)

### ✅ 5. 아이디 찾기 페이지 생성
- [ ] **Step 5.1**: `new_frontend/src/types/careguide-ia.ts`에 라우트 추가
  ```typescript
  export const ROUTES = {
    // ...existing routes
    FIND_ID: '/findid',
  }
  ```

- [ ] **Step 5.2**: `new_frontend/src/routes/AppRoutes.tsx`에 라우트 등록
  ```tsx
  <Route path={ROUTES.FIND_ID} element={<FindIdPage />} />
  ```

- [ ] **Step 5.3**: `new_frontend/src/pages/FindIdPage.tsx` 생성
  - 기능: 이메일 또는 전화번호로 아이디 찾기
  - API: `findUserId()` from `services/api.ts`

- [ ] **Step 5.4**: `LoginPageFull.tsx`에 링크 추가
  ```tsx
  <div className="flex justify-between text-sm">
    <Link to={ROUTES.FIND_ID} className="text-primary-600 hover:underline">
      아이디 찾기
    </Link>
    <Link to={ROUTES.FIND_PW} className="text-primary-600 hover:underline">
      비밀번호 찾기
    </Link>
  </div>
  ```

**예상 시간**: 1.5시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

### ✅ 6. 비밀번호 찾기 페이지 생성
- [ ] **Step 6.1**: `new_frontend/src/types/careguide-ia.ts`에 라우트 추가
  ```typescript
  export const ROUTES = {
    // ...existing routes
    FIND_PW: '/findpw',
  }
  ```

- [ ] **Step 6.2**: `new_frontend/src/routes/AppRoutes.tsx`에 라우트 등록
  ```tsx
  <Route path={ROUTES.FIND_PW} element={<FindPwPage />} />
  ```

- [ ] **Step 6.3**: `new_frontend/src/pages/FindPwPage.tsx` 생성
  - 기능: 이메일로 비밀번호 재설정 링크 전송
  - API: `resetPassword()` from `services/api.ts`

**예상 시간**: 1시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

## 📋 추가 개선 작업 (선택)

### ✅ 7. CreatePostModal을 페이지로 전환 (선택)
- [ ] **Step 7.1**: `CreatePostModal.tsx` 사용 중단 결정
- [ ] **Step 7.2**: Modal 관련 코드 제거
- [ ] **Step 7.3**: 모든 글쓰기 버튼을 `/community/create`로 연결

**이유**: 일관성 유지 (다른 작성/수정 페이지는 독립 페이지)
**대안**: Modal 유지하고 수정도 Modal로 변경 (전체 패턴 변경 필요)

**예상 시간**: 1시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

### ✅ 8. 회원탈퇴 모달 구현 (선택)
- [ ] **Step 8.1**: `MyPage.tsx`에 회원탈퇴 Dialog 추가
- [ ] **Step 8.2**: 탈퇴 확인 프로세스 구현
- [ ] **Step 8.3**: API 연동: `deleteAccount()` from `services/api.ts`

**예상 시간**: 2시간
**담당자**: [이름]
**완료 기한**: [날짜]

---

## 📋 API 개발 필요 항목

다음 API 엔드포인트들이 `services/` 파일에 없거나 백엔드 구현이 필요할 수 있습니다:

### dietApi.ts (신규 생성 필요)
- [ ] `createDietLog(data)` - POST /api/diet/logs
- [ ] `getDietLog(id)` - GET /api/diet/logs/:id
- [ ] `updateDietLog(id, data)` - PUT /api/diet/logs/:id
- [ ] `deleteDietLog(id)` - DELETE /api/diet/logs/:id
- [ ] `getDietLogs(userId)` - GET /api/diet/logs?userId=:userId

### api.ts (기존 파일에 추가)
- [ ] `findUserId(email)` - POST /api/auth/find-id
- [ ] `resetPassword(email)` - POST /api/auth/reset-password
- [ ] `deleteAccount(userId)` - DELETE /api/user/:userId

---

## 📊 진행 상황 추적

| 작업 | 우선순위 | 상태 | 담당자 | 완료일 |
|------|---------|------|--------|--------|
| 1. 커뮤니티 작성 페이지 | P0 | ⬜ 대기 | - | - |
| 2. 커뮤니티 수정 페이지 | P0 | ⬜ 대기 | - | - |
| 3. 식사 추가 페이지 | P1 | ⬜ 대기 | - | - |
| 4. 식사 상세 페이지 | P1 | ⬜ 대기 | - | - |
| 5. 아이디 찾기 페이지 | P2 | ⬜ 대기 | - | - |
| 6. 비밀번호 찾기 페이지 | P2 | ⬜ 대기 | - | - |
| 7. Modal→Page 전환 | 선택 | ⬜ 대기 | - | - |
| 8. 회원탈퇴 모달 | 선택 | ⬜ 대기 | - | - |

**상태 기호**
- ⬜ 대기
- 🟡 진행중
- ✅ 완료
- ❌ 보류

---

## 🧪 테스트 체크리스트

각 작업 완료 후 다음을 확인하세요:

- [ ] 페이지가 올바르게 렌더링되는가?
- [ ] 모든 네비게이션 링크가 작동하는가?
- [ ] 폼 제출 시 API가 정상 호출되는가?
- [ ] 에러 처리가 적절한가?
- [ ] 모바일 반응형이 정상 작동하는가?
- [ ] 다크모드가 정상 작동하는가? (지원 시)
- [ ] 접근성 (a11y) 기준을 충족하는가?

---

## 📝 참고 파일

### 기존 frontend/ 참고 파일
- `frontend/src/pages/CommunityCreatePage.tsx`
- `frontend/src/pages/CommunityEditPage.tsx`
- `frontend/src/pages/DietCarePage.tsx`
- `frontend/src/routes.tsx`

### new_frontend/ 수정 대상 파일
- `new_frontend/src/types/careguide-ia.ts`
- `new_frontend/src/routes/AppRoutes.tsx`
- `new_frontend/src/pages/CommunityPageEnhanced.tsx`
- `new_frontend/src/pages/DietCarePageEnhanced.tsx`
- `new_frontend/src/pages/LoginPageFull.tsx`

### 신규 생성 파일
- `new_frontend/src/pages/CommunityCreatePage.tsx`
- `new_frontend/src/pages/CommunityEditPage.tsx`
- `new_frontend/src/pages/AddFoodPage.tsx`
- `new_frontend/src/pages/DietLogDetailPage.tsx`
- `new_frontend/src/pages/FindIdPage.tsx`
- `new_frontend/src/pages/FindPwPage.tsx`
- `new_frontend/src/services/dietApi.ts`

---

## 🚀 Quick Start

### 우선순위 작업 시작 가이드

1. **브랜치 생성**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/community-crud-pages
   ```

2. **P0-1 작업: 커뮤니티 작성 페이지**
   ```bash
   # 1. 라우트 추가
   # new_frontend/src/types/careguide-ia.ts 수정

   # 2. 페이지 생성
   # frontend/src/pages/CommunityCreatePage.tsx 복사
   # new_frontend/src/pages/CommunityCreatePage.tsx로 수정

   # 3. 라우트 등록
   # new_frontend/src/routes/AppRoutes.tsx 수정

   # 4. 네비게이션 연결
   # new_frontend/src/pages/CommunityPageEnhanced.tsx 수정
   ```

3. **테스트**
   ```bash
   cd new_frontend
   npm run dev
   # http://localhost:5173/community/create 접속 확인
   ```

4. **커밋 & PR**
   ```bash
   git add .
   git commit -m "feat: Add community create/edit pages for CRUD completion"
   git push origin feature/community-crud-pages
   # GitHub에서 PR 생성 (develop 브랜치로)
   ```

---

**작업 시작 전 확인사항**
- [ ] `FRONTEND_ARCHITECTURE_COMPARISON.json` 읽음
- [ ] `FRONTEND_COMPARISON_SUMMARY.md` 읽음
- [ ] 기존 `frontend/` 코드 검토 완료
- [ ] API 엔드포인트 확인 완료

**문의사항**
- Slack: [채널명]
- 이슈: GitHub Issues

---

**Last Updated**: 2025-11-27
**Version**: 1.0
