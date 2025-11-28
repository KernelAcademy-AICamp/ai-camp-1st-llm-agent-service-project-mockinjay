# PR #25 Component Migration Plan
## frontend/ → new_frontend/ 이식 계획서

> **분석 일시**: 2025-11-27
> **분석 도구**: UI Designer, UX Reviewer, UX Designer, Design System Builder Agents

---

## Executive Summary

PR #25의 `frontend/`에서 `new_frontend/`로 이식할 컴포넌트를 6개 전문 에이전트가 분석한 결과입니다.

| 영역 | frontend/ | new_frontend/ | Gap |
|------|-----------|---------------|-----|
| **UI 컴포넌트** | 51개 | 36개 | 15개 부족 |
| **페이지** | 27개 | 21개 | 6개 부족 |
| **의료 온보딩** | 4단계 | 3단계 | CKD 단계 선택 부재 |
| **약관 동의** | 있음 | 없음 | 법적 컴플라이언스 위험 |

---

## Page-by-Page Migration Plan

---

### 1. ChatPage (채팅 페이지)

**Source**: `frontend/src/pages/ChatPage.tsx`
**Target**: `new_frontend/src/pages/ChatPageEnhanced.tsx`

#### 이식할 컴포넌트 (Priority Order)

| Priority | Component | Description | Lines |
|----------|-----------|-------------|-------|
| **P0** | Welcome Message | 에이전트별 환영 메시지 + 아이콘 | 299-351 |
| **P0** | Suggestion Chips | 좌우 스크롤 가능한 제안 버튼 | 315-350 |
| **P0** | Fallback Indicator | 오렌지 배경 + 경고 아이콘 | 367-373 |
| **P1** | Profile Selector | "맞춤 정보: 신장병 환우" 드롭다운 | 439-462 |
| **P1** | Tab Lock | 첫 메시지 후 탭 비활성화 | 260-267 |
| **P2** | Session ID Display | 세션 ID 표시 (디버깅용) | 457-461 |

#### UX 개선 포인트
- **Onboarding Flow**: 환영 메시지 + 제안으로 신규 사용자 안내
- **Progressive Disclosure**: 제안 버튼이 기능 발견을 도움
- **Error Communication**: Fallback 메시지 시각적 구분

---

### 2. CommunityPage (커뮤니티 페이지)

**Source**: `frontend/src/pages/CommunityPage.tsx`
**Target**: `new_frontend/src/pages/CommunityPageEnhanced.tsx`

#### 이식할 컴포넌트

| Priority | Component | Description | Lines |
|----------|-----------|-------------|-------|
| **P0** | Knowledge Badge | "환우 \| 레벨 3" 배지 | 164-173 |
| **P0** | 2-Column Grid | 데스크탑에서 2열 레이아웃 | 144-285 |
| **P1** | Inline Edit/Delete | 게시글 헤더에 수정/삭제 버튼 | 179-216 |
| **P1** | Unified Category Color | 모든 카테고리 동일 틸 색상 | 313-316 |
| **P2** | Relative Time | "방금 전", "5분 전" 포맷 | 302-311 |

#### UX 개선 포인트
- **Information Density**: 2열 그리드로 더 많은 콘텐츠 표시
- **Gamification**: 지식 레벨 배지로 신뢰도 구축
- **Quick Actions**: 인라인 수정/삭제로 클릭 감소

---

### 3. DietCarePage (식단 관리 페이지)

**Source**: `frontend/src/pages/DietCarePage.tsx`
**Target**: `new_frontend/src/pages/DietCarePageEnhanced.tsx`

#### 이식할 컴포넌트

| Priority | Component | Description | Lines |
|----------|-----------|-------------|-------|
| **P0** | Inline Tab Navigation | 페이지 로딩 없는 탭 전환 | 40-84 |
| **P0** | Educational Headers | 아이콘 + 불릿 포인트 설명 | 89-100 |
| **P0** | Safe/Warning Cards | 녹색(안전)/빨간색(주의) 음식 카드 | 102-222 |
| **P1** | Goal Setting Form | 칼륨/인/단백질/칼로리 입력 | 230-281 |
| **P1** | Meal Entry Cards | 식사 타입, 날짜, 칼로리 배지 | 291-319 |
| **P2** | Gradient Background | 그라디언트 카드 배경 | 238 |

#### UX 개선 포인트
- **Single-Page Experience**: 인라인 탭으로 빠른 전환
- **Medical Context**: "왜"를 설명하는 교육 콘텐츠
- **Visual Safety**: 색상으로 안전/위험 음식 구분

---

### 4. MyPage (마이페이지)

**Source**: `frontend/src/pages/MyPage.tsx`
**Target**: `new_frontend/src/pages/MyPage.tsx`

#### 이식할 컴포넌트

| Priority | Component | Description | Lines |
|----------|-----------|-------------|-------|
| **P0** | Profile Card with Stats | 그라디언트 배경 + 포인트/레벨/토큰 | 82-139 |
| **P0** | 3-Tab System | 계정/개인/질환 정보 탭 | 142-146 |
| **P0** | Editable Forms | 인라인 수정 기능 | 150-298 |
| **P1** | Action Cards | 병원 검사 결과, 구독/결제 카드 | 302-329 |
| **P1** | Account Withdrawal | 회원 탈퇴 버튼 | 340-349 |

#### UX 개선 포인트
- **Visual Hierarchy**: 그라디언트 프로필 카드
- **Edit-in-Place**: 페이지 이동 없이 직접 수정
- **Progressive Disclosure**: 탭으로 정보 분리

---

### 5. TrendsPage (트렌드 페이지)

**Source**: `frontend/src/pages/TrendsPage.tsx`
**Target**: `new_frontend/src/pages/TrendsPageEnhanced.tsx`

#### 이식할 컴포넌트

| Priority | Component | Description | Lines |
|----------|-----------|-------------|-------|
| **P0** | News Feed | 뉴스 카드 + 북마크 기능 | 202-264 |
| **P0** | Clinical Trials | 임상시험 목록 + 페이지네이션 | 371-493 |
| **P1** | Popular Keywords | 랭킹 키워드 위젯 | 271-304 |
| **P1** | Research Chart | Recharts 기반 트렌드 차트 | 306-366 |

#### UX 개선 포인트
- **Content Diversity**: 뉴스/연구/임상시험 3가지 콘텐츠
- **Information Architecture**: 콘텐츠 소비와 분석 분리
- **Pagination**: 많은 페이지를 위한 생략(...) 패턴

---

### 6. SignupPage (회원가입 페이지)

**Source**: `frontend/src/pages/SignupPage.tsx`
**Target**: `new_frontend/src/pages/SignupPage.tsx`

#### 이식할 컴포넌트 (CRITICAL)

| Priority | Component | Description | Lines |
|----------|-----------|-------------|-------|
| **P0** | Terms Agreement | 약관 동의 아코디언 | 170-278 |
| **P0** | CKD Stage Selection | 10가지 CKD 단계 라디오 버튼 | 528-589 |
| **P0** | Duplicate Check | 이메일/닉네임 중복 확인 | 293-322 |
| **P0** | 4-Step Flow | 약관→계정→개인→질환 | 전체 |
| **P1** | Height/Weight | 키/체중 입력 | 482-509 |
| **P1** | Gender Selection | 성별 선택 버튼 | 443-465 |

#### CRITICAL: 법적 컴플라이언스
- **약관 동의**: 의료 데이터 처리에 필수 (GDPR/개인정보보호법)
- **CKD 단계**: 맞춤형 식단 추천의 기반 데이터
- **중복 확인**: 데이터 무결성 보장

---

### 7. QuizListPage (퀴즈 목록 페이지)

**Source**: `frontend/src/pages/QuizListPage.tsx`
**Target**: `new_frontend/src/pages/QuizListPage.tsx`

#### 역방향 이식 (new_frontend → frontend 스타일 참고)

| Priority | Component | Description | Source |
|----------|-----------|-------------|--------|
| **P0** | Featured Daily Quiz | 그라디언트 일일 퀴즈 카드 | new_frontend 109-135 |
| **P1** | Progress Bar | 완료율 프로그레스 바 | new_frontend 138-152 |

**Note**: QuizListPage는 new_frontend가 더 발전된 디자인을 가지고 있음

---

### 8. SupportPage (고객지원 페이지)

**Migration**: 불필요

두 버전이 기능적으로 동일함. 스타일링 차이만 존재.

---

## UI Component Library Migration

### 즉시 이식 필요 (HIGH)

| Component | Description | 필요한 Dependencies |
|-----------|-------------|---------------------|
| `chart.tsx` | Recharts 래퍼 | recharts@2.15.2 |
| `sidebar.tsx` | 반응형 사이드바 | @radix-ui/react-slot |
| `use-mobile.ts` | 모바일 감지 훅 | - |

### 권장 이식 (MEDIUM)

| Component | Description |
|-----------|-------------|
| `command.tsx` | Cmd+K 검색 인터페이스 |
| `hover-card.tsx` | 호버 프리뷰 카드 |
| `carousel.tsx` | 이미지 캐러셀 |
| `navigation-menu.tsx` | 복잡한 네비게이션 |

### 선택적 (LOW)

| Component | Description |
|-----------|-------------|
| `alert-dialog.tsx` | confirm-dialog와 비교 필요 |
| `context-menu.tsx` | 우클릭 메뉴 |
| `input-otp.tsx` | OTP 입력 |
| `toggle-group.tsx` | 토글 버튼 그룹 |

---

## Migration Priority Matrix

```
┌─────────────────────────────────────────────────────────┐
│                    UX IMPACT                            │
│     HIGH           │      MEDIUM        │     LOW       │
├────────────────────┼────────────────────┼───────────────┤
│  Terms Agreement   │  Profile Selector  │  Session ID   │
│  CKD Stage Select  │  Tab Lock          │  Hover Effects│
│  Welcome Message   │  Inline Edit/Delete│  Loading Dots │
│  Suggestion Chips  │  Educational Headers               │
│  Knowledge Badges  │  Goal Setting Form │               │
│  2-Column Grid     │                    │               │
│  News Feed         │                    │               │
│  Clinical Trials   │                    │               │
└────────────────────┴────────────────────┴───────────────┘
          P0 (Sprint 1)    P1 (Sprint 2)     P2 (Backlog)
```

---

## Implementation Phases

### Phase 1: Critical Features (Week 1)

1. **SignupPage 4-Step Flow**
   - Terms Agreement 컴포넌트 생성
   - CKD Stage Selection 추가
   - Duplicate Check 패턴 구현

2. **ChatPage Onboarding**
   - Welcome Message 컴포넌트
   - Suggestion Chips 컴포넌트
   - Fallback Indicator 스타일링

3. **UI Library**
   - chart.tsx 이식 + recharts 설치
   - use-mobile.ts 훅 이식

### Phase 2: Enhanced UX (Week 2)

1. **MyPage 프로필 개선**
   - Stats 카드 그라디언트 디자인
   - 3-Tab 시스템
   - Editable Forms

2. **CommunityPage 정보 밀도**
   - 2-Column 그리드 레이아웃
   - Knowledge Level 배지
   - Inline Edit/Delete

3. **TrendsPage 콘텐츠**
   - News Feed 컴포넌트
   - Clinical Trials 통합

### Phase 3: Polish (Week 3)

1. **DietCarePage 탭 vs 라우트 결정**
2. **QuizListPage Featured Card**
3. **Design System 일관성 검수**
4. **접근성(A11y) 테스트**

---

## Dependencies to Install

```bash
# Required for chart.tsx
npm install recharts@2.15.2

# Required for carousel.tsx
npm install embla-carousel-react

# Required for command.tsx
npm install cmdk

# Required for resizable.tsx
npm install react-resizable-panels
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| 약관 동의 부재 | 법적 문제 | **즉시 구현** |
| CKD 단계 데이터 부재 | 맞춤 서비스 불가 | Phase 1 우선순위 |
| Context 시스템 충돌 | 인증 오류 | useAuth() 통합 테스트 |
| 스타일 불일치 | UX 혼란 | Design Token 통일 |

---

## File References

### Source Files (frontend/)
- `frontend/src/pages/ChatPage.tsx`
- `frontend/src/pages/CommunityPage.tsx`
- `frontend/src/pages/DietCarePage.tsx`
- `frontend/src/pages/MyPage.tsx`
- `frontend/src/pages/TrendsPage.tsx`
- `frontend/src/pages/SignupPage.tsx`
- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/components/ui/` (51개 컴포넌트)

### Target Files (new_frontend/)
- `new_frontend/src/pages/ChatPageEnhanced.tsx`
- `new_frontend/src/pages/CommunityPageEnhanced.tsx`
- `new_frontend/src/pages/DietCarePageEnhanced.tsx`
- `new_frontend/src/pages/MyPage.tsx`
- `new_frontend/src/pages/TrendsPageEnhanced.tsx`
- `new_frontend/src/pages/SignupPage.tsx`
- `new_frontend/src/components/ui/` (36개 컴포넌트)

---

## Next Steps

1. [ ] 이 문서를 팀과 리뷰
2. [ ] Phase 1 작업 브랜치 생성: `feature/migrate-critical-components`
3. [ ] Terms API 백엔드 확인 (`/api/terms/all`)
4. [ ] CKD Stage 데이터 스키마 확인
5. [ ] recharts 패키지 설치 및 테스트

---

*Generated by AI Analysis Agents - Review required before implementation*
