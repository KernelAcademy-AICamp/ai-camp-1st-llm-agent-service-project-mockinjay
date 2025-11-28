# Frontend → New_Frontend 통합 계획

> frontend/ 에서 new_frontend/ 로 누락된 기능들을 통합하는 계획

## 개요

| 항목 | 상태 | 우선순위 |
|------|------|----------|
| 페이지 통합 | 🔴 미완료 | 높음 |
| 컴포넌트 통합 | 🟡 부분완료 | 중간 |
| 이미지 에셋 | 🔴 미완료 | 낮음 |
| Context 통합 | 🟡 부분완료 | 높음 |

---

## 1. 페이지 통합

### 1.1 Splash 페이지 추가 (신규)
- **출처**: `frontend/src/pages/Splash.tsx`
- **대상**: `new_frontend/src/pages/SplashPage.tsx`
- **작업**:
  - [x] Splash.tsx 파일 생성
  - [x] 애니메이션 스타일을 Tailwind 클래스로 변환
  - [x] AppRoutes.tsx에 "/" 경로를 Splash로 변경
  - [x] 3초 후 자동 이동 또는 "시작하기" 버튼 클릭 시 /main으로 이동

### 1.2 Dashboard 페이지 복원 (선택적)
- **출처**: `frontend/src/pages/DashboardPage.tsx`
- **현재 상태**: TrendsPageEnhanced로 리다이렉트 중
- **결정 필요**:
  - 옵션 A: 현재처럼 Trends로 리다이렉트 유지
  - 옵션 B: 별도 Dashboard 페이지 복원
- **권장**: 옵션 A 유지 (TrendsPageEnhanced가 이미 키워드/트렌드 기능 포함)

---

## 2. 컴포넌트 통합

### 2.1 Logo 컴포넌트 추가
- **출처**: `frontend/src/components/Logo.tsx`
- **대상**: `new_frontend/src/components/ui/Logo.tsx`
- **작업**:
  - [x] Logo.tsx 파일 생성
  - [x] size prop (sm/md/lg) 지원
  - [x] showTextOnMobile prop 지원
  - [x] Header, Sidebar에서 사용

### 2.2 Drawer 컴포넌트 추가 (모바일 사이드 메뉴)
- **출처**: `frontend/src/components/Drawer.tsx`
- **대상**: `new_frontend/src/components/layout/Drawer.tsx`
- **작업**:
  - [x] Drawer.tsx 파일 생성
  - [x] LayoutContext 대신 AuthContext 사용으로 수정
  - [x] useLayout → useDrawer + useAuth로 분리
  - [x] MobileHeader에서 햄버거 메뉴 클릭 시 Drawer 표시

### 2.3 BottomNav → MobileNav 기능 병합
- **출처**: `frontend/src/components/BottomNav.tsx`
- **대상**: `new_frontend/src/components/layout/MobileNav.tsx` (이미 존재)
- **작업**:
  - [x] hideNavPaths 로직 추가 (Splash, Login, Signup에서 숨김)
  - [x] 활성 탭 하이라이트 개선 (하단 인디케이터 바)
  - [x] 트렌드 탭 추가 (기존 MobileNav에 없음)

---

## 3. Context 통합

### 3.1 SessionContext 추가
- **출처**: `frontend/src/context/SessionContext.tsx`
- **대상**: `new_frontend/src/contexts/SessionContext.tsx`
- **작업**:
  - [x] SessionContext.tsx 파일 생성
  - [x] 세션 ID 생성 및 관리
  - [x] 30분 비활동 시 자동 로그아웃
  - [x] localStorage 세션 복구
  - [x] AuthContext와 연동 (로그아웃 시 세션도 종료)

### 3.2 LayoutContext 기능 분리
- **출처**: `frontend/src/components/LayoutContext.tsx`
- **현재 상태**: new_frontend에는 AuthContext가 있음
- **작업**:
  - [x] DrawerContext 생성 (Drawer 상태 관리 전용)
  - [x] isDrawerOpen, toggleDrawer, closeDrawer, openDrawer
  - [x] 로그인/로그아웃은 AuthContext에서 처리 (이미 완료)

---

## 4. 이미지 에셋 복사

### 4.1 에셋 파일 복사
- **출처**: `frontend/src/assets/` (14개 PNG 파일)
- **대상**: `new_frontend/src/assets/`
- **작업**:
  - [x] 모든 PNG 파일 복사
  ```
  1407778ba45085eb6cfe9ede362437b370d988d2.png
  1c515157c0bcac074f0275c981b23397827a5cfe.png
  43db826ac762225d98b09bb5fa5d5ba450e0db4b.png
  4e4fdf76b8437f3803d90799bbfb04f9e90b06dd.png
  4e94bc5dbc8b4ecdb119bcd07f7514b85fe7a97a.png
  846b63eb46ba0068e2820e8c0569c177d49f19c9.png
  94edcf03a48343a4968b0f15d76b0b3fe1300c2d.png
  a41d0bce69dcf5e5e8ffb4715e64f304ea60ef40.png
  ae4b2d9e84e858889e12ebaf61578a3e3b0566ee.png
  c98a6fdc8c03f18221ec677c6bf7c2c07a92f88c.png
  d47d8e35234fb905b955d7974c74d1f72bab5e5f.png
  d7e1e0454380300cf13574ce506f3fd2ee851220.png
  e716f3384c2867e1f8e429c84073e4eeb52c49ca.png
  f28ae6c86d33816393fcfe64500e0a33421e0efe.png
  ```
  - [x] 에셋 사용처 확인 및 import 경로 업데이트

---

## 5. 라우팅 업데이트

### 5.1 AppRoutes.tsx 수정
```tsx
// 추가할 라우트
<Route path="/" element={<SplashPage />} />
<Route path="/home" element={<Navigate to="/main" replace />} />
```

### 5.2 ROUTES 상수 업데이트 (types/careguide-ia.ts)
```tsx
export const ROUTES = {
  SPLASH: '/',
  // ... 기존 라우트
}
```

---

## 6. 통합 순서 (권장)

### Phase 1: Core (핵심 기능)
1. SessionContext 추가
2. DrawerContext 추가
3. Logo 컴포넌트 추가

### Phase 2: Layout (레이아웃)
4. Drawer 컴포넌트 추가
5. MobileNav 개선
6. MobileHeader에 Drawer 연결

### Phase 3: Pages (페이지)
7. SplashPage 추가
8. 라우팅 업데이트

### Phase 4: Assets (에셋)
9. 이미지 파일 복사
10. 에셋 참조 확인

---

## 7. 파일 생성 체크리스트

| 파일 | 상태 | 비고 |
|------|------|------|
| `src/contexts/SessionContext.tsx` | ⬜ | 신규 생성 |
| `src/contexts/DrawerContext.tsx` | ⬜ | 신규 생성 |
| `src/components/ui/Logo.tsx` | ⬜ | 신규 생성 |
| `src/components/layout/Drawer.tsx` | ⬜ | 신규 생성 |
| `src/pages/SplashPage.tsx` | ⬜ | 신규 생성 |
| `src/components/layout/MobileNav.tsx` | ⬜ | 수정 |
| `src/components/layout/MobileHeader.tsx` | ⬜ | 수정 |
| `src/routes/AppRoutes.tsx` | ⬜ | 수정 |
| `src/types/careguide-ia.ts` | ⬜ | 수정 |
| `src/assets/*.png` | ⬜ | 14개 파일 복사 |

---

## 8. 예상 작업 시간

- Phase 1: Context 통합 - 약 30분
- Phase 2: 레이아웃 컴포넌트 - 약 45분
- Phase 3: 페이지 & 라우팅 - 약 20분
- Phase 4: 에셋 복사 - 약 10분

**총 예상 시간**: 약 2시간

---

## 9. 주의사항

1. **AuthContext 활용**: 기존 LayoutContext의 로그인/로그아웃 기능은 이미 AuthContext에 구현되어 있음
2. **스타일 일관성**: CSS 변수(--color-*, --gradient-*) 사용 유지
3. **반응형 디자인**: lg:hidden, lg:flex 등 breakpoint 일관성 유지
4. **타입 안전성**: TypeScript 타입 정의 추가

---

## 작성일: 2024-11-28
## 작성자: Claude Code
