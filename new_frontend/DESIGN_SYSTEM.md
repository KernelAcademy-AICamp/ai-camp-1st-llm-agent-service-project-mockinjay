# CareGuide Design System

CareGuide의 일관되고 접근 가능한 사용자 경험을 위한 종합 디자인 시스템 문서입니다.

## 목차

- [색상 시스템](#색상-시스템)
- [타이포그래피](#타이포그래피)
- [간격 시스템](#간격-시스템)
- [컴포넌트 라이브러리](#컴포넌트-라이브러리)
- [애니메이션](#애니메이션)
- [반응형 디자인](#반응형-디자인)
- [접근성](#접근성)
- [다크 모드](#다크-모드)

---

## 색상 시스템

### 브랜드 색상

CareGuide의 브랜드 색상은 WCAG AA 표준을 준수하며, 의료 서비스의 신뢰성과 안정성을 전달합니다.

#### Primary (민트)
```css
primary-50:  #e6f9f7  /* 매우 밝은 배경용 */
primary-100: #ccf3ef
primary-200: #99e7df
primary-300: #66dbcf
primary-400: #33cfbf
primary-500: #00c9b7  /* 메인 브랜드 색상 */
primary-600: #00b3a3  /* 호버 상태 */
primary-700: #009d8f
primary-800: #008c80  /* 눌림 상태 */
primary-900: #007068
primary-950: #005a52  /* 가장 어두운 */
```

**사용 예시:**
- 메인 CTA 버튼
- 링크 및 인터랙티브 요소
- 진행률 표시
- 강조 요소

#### Secondary (보라)
```css
secondary-50:  #f5f3ff
secondary-100: #ede9fe
secondary-200: #ddd6fe
secondary-300: #c4b5fd
secondary-400: #a78bfa
secondary-500: #9f7aea  /* 메인 세컨더리 */
secondary-600: #805ad5  /* 호버 상태 */
secondary-700: #6b46c1
secondary-800: #553c9a
secondary-900: #44337a
```

**사용 예시:**
- 부가 기능 버튼
- 카테고리 배지
- 아이콘 강조

### 시맨틱 색상

의료 서비스 맥락에 맞는 상태 및 피드백 색상입니다.

#### Success (성공)
```css
success-50:  #f0fdf4  /* 배경 */
success-100: #dcfce7  /* 연한 배경 */
success-500: #10b981  /* 메인 */
success-600: #059669  /* 호버 */
success-700: #047857  /* 눌림 */
```

**사용 예시:** 성공 메시지, 완료 상태, 건강 지표 정상

#### Warning (경고)
```css
warning-50:  #fffbeb
warning-100: #fef3c7
warning-500: #f59e0b  /* 메인 */
warning-600: #d97706
warning-700: #b45309
```

**사용 예시:** 주의 메시지, 중요 알림, 건강 지표 주의

#### Error (오류)
```css
error-50:  #fef2f2
error-100: #fee2e2
error-500: #ef4444  /* 메인 */
error-600: #dc2626
error-700: #b91c1c
```

**사용 예시:** 에러 메시지, 삭제 확인, 건강 지표 위험

#### Info (정보)
```css
info-50:  #eff6ff
info-100: #dbeafe
info-500: #3b82f6  /* 메인 */
info-600: #2563eb
info-700: #1d4ed8
```

**사용 예시:** 정보 메시지, 팁, 도움말

### 중립 색상 (시맨틱 토큰)

라이트/다크 모드를 지원하는 HSL 기반 시맨틱 토큰입니다.

```css
/* 라이트 모드 */
--background:       0 0% 100%       /* 메인 배경 */
--foreground:       220 13% 13%     /* 메인 텍스트 */
--card:             0 0% 100%       /* 카드 배경 */
--card-foreground:  220 13% 13%     /* 카드 텍스트 */
--muted:            220 13% 91%     /* 비활성 배경 */
--muted-foreground: 220 9% 46%      /* 비활성 텍스트 */
--border:           220 13% 91%     /* 테두리 */
--input:            220 13% 91%     /* 입력 필드 배경 */
--ring:             174 100% 39%    /* 포커스 링 */

/* 다크 모드 */
--background:       222 47% 11%
--foreground:       210 40% 98%
/* ... (다크 모드 값들) */
```

### 색상 대비 비율 (WCAG AA)

모든 텍스트와 배경 조합은 최소 4.5:1 대비 비율을 유지합니다:

- **대형 텍스트 (18px+):** 3:1 이상
- **일반 텍스트 (18px 미만):** 4.5:1 이상
- **UI 요소:** 3:1 이상

---

## 타이포그래피

### 폰트 패밀리

```css
font-sans:    'Noto Sans KR', 'Inter', 'system-ui', '-apple-system', sans-serif
font-heading: 'Noto Sans KR', 'Inter', 'system-ui', '-apple-system', sans-serif
font-mono:    'JetBrains Mono', 'Consolas', 'Monaco', monospace
```

### 제목 스케일 (Heading Scale)

| 클래스 | 크기 | 줄간격 | 굵기 | 자간 | 용도 |
|--------|------|--------|------|------|------|
| `text-h1` | 40px (2.5rem) | 1.2 | 700 | -0.02em | 페이지 메인 타이틀 |
| `text-h2` | 32px (2rem) | 1.25 | 700 | -0.01em | 섹션 제목 |
| `text-h3` | 28px (1.75rem) | 1.3 | 600 | -0.01em | 서브섹션 제목 |
| `text-h4` | 24px (1.5rem) | 1.35 | 600 | 0 | 카드 제목 |
| `text-h5` | 20px (1.25rem) | 1.4 | 600 | 0 | 작은 제목 |
| `text-h6` | 18px (1.125rem) | 1.45 | 600 | 0 | 최소 제목 |

### 본문 스케일 (Body Scale)

| 클래스 | 크기 | 줄간격 | 굵기 | 용도 |
|--------|------|--------|------|------|
| `text-body-xl` | 18px (1.125rem) | 1.75 | 400 | 강조 본문, 리드 텍스트 |
| `text-body-lg` | 16px (1rem) | 1.75 | 400 | 기본 본문 (데스크톱) |
| `text-body` | 14px (0.875rem) | 1.6 | 400 | 기본 본문 (모바일) |
| `text-body-sm` | 13px (0.8125rem) | 1.5 | 400 | 보조 텍스트 |
| `text-body-xs` | 12px (0.75rem) | 1.5 | 400 | 캡션, 라벨 |

### UI 요소

| 클래스 | 크기 | 줄간격 | 굵기 | 변환 | 용도 |
|--------|------|--------|------|------|------|
| `text-caption` | 12px | 1.4 | 400 | - | 이미지 캡션, 타임스탬프 |
| `text-overline` | 12px | 1.4 | 600 | uppercase | 카테고리 라벨 |

### 폰트 굵기

```css
font-light:     300
font-normal:    400  /* 기본 본문 */
font-medium:    500  /* 버튼, 메뉴 */
font-semibold:  600  /* 제목, 강조 */
font-bold:      700  /* 메인 타이틀 */
```

---

## 간격 시스템

4px 기반 단위 시스템으로 일관된 시각적 리듬을 유지합니다.

### 간격 스케일

| 토큰 | 값 | Rem | 용도 |
|------|-----|-----|------|
| `0.5` | 2px | 0.125rem | 최소 간격 |
| `1` | 4px | 0.25rem | 아이콘 여백 |
| `2` | 8px | 0.5rem | 밀집 요소 간격 |
| `3` | 12px | 0.75rem | 버튼 내부 패딩 |
| `4` | 16px | 1rem | 기본 간격 단위 |
| `5` | 20px | 1.25rem | 중간 간격 |
| `6` | 24px | 1.5rem | 카드 내부 패딩 |
| `8` | 32px | 2rem | 섹션 간격 |
| `10` | 40px | 2.5rem | 큰 섹션 간격 |
| `12` | 48px | 3rem | 페이지 여백 |
| `16` | 64px | 4rem | 메인 섹션 간격 |
| `20` | 80px | 5rem | 대형 여백 |
| `24` | 96px | 6rem | 페이지 간 여백 |

### 사용 가이드

```jsx
// 컴포넌트 내부 간격
<div className="p-4">       // 16px 패딩
<div className="px-6 py-4"> // 가로 24px, 세로 16px

// 요소 간 간격
<div className="space-y-4"> // 자식 요소 간 16px 간격
<div className="gap-3">     // Grid/Flex 간격 12px

// 마진
<div className="mt-8 mb-6"> // 상단 32px, 하단 24px
```

---

## 컴포넌트 라이브러리

### Button

#### Variants

**Default (Primary)**
```jsx
<Button variant="default">
  주요 액션
</Button>
// 민트 배경, 흰색 텍스트, 호버 시 -0.5px 이동 + 그림자 증가
```

**Secondary**
```jsx
<Button variant="secondary">
  보조 액션
</Button>
// 보라 배경, 흰색 텍스트
```

**Outline**
```jsx
<Button variant="outline">
  아웃라인 버튼
</Button>
// 흰색 배경, 민트 테두리 및 텍스트
```

**Ghost**
```jsx
<Button variant="ghost">
  고스트 버튼
</Button>
// 투명 배경, 호버 시만 배경 표시
```

**Destructive**
```jsx
<Button variant="destructive">
  삭제
</Button>
// 빨강 배경, 위험한 액션용
```

#### Sizes

```jsx
<Button size="sm">작은 버튼</Button>      // h-9, px-4, text-xs
<Button size="default">기본 버튼</Button>  // h-10, px-6 (44px 최소 터치)
<Button size="lg">큰 버튼</Button>         // h-12, px-8
<Button size="xl">특대 버튼</Button>       // h-14, px-8

// 아이콘 버튼
<Button size="icon"><Icon /></Button>      // 10x10 (44px 터치)
<Button size="icon-sm"><Icon /></Button>   // 9x9
<Button size="icon-lg"><Icon /></Button>   // 12x12
```

#### 접근성 특징

- 최소 44x44px 터치 타겟 (모바일)
- 키보드 포커스 시 2px 링 표시
- 비활성 상태에서 50% 투명도 + cursor-not-allowed
- 호버/활성 상태 명확한 시각적 피드백

### Alert

#### Variants

```jsx
<Alert variant="default">
  <AlertTitle>기본 알림</AlertTitle>
  <AlertDescription>일반 정보를 표시합니다.</AlertDescription>
</Alert>

<Alert variant="info">
  <AlertTitle>정보</AlertTitle>
  <AlertDescription>유용한 정보를 제공합니다.</AlertDescription>
</Alert>

<Alert variant="success">
  <AlertTitle>성공</AlertTitle>
  <AlertDescription>작업이 성공적으로 완료되었습니다.</AlertDescription>
</Alert>

<Alert variant="warning">
  <AlertTitle>경고</AlertTitle>
  <AlertDescription>주의가 필요한 내용입니다.</AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTitle>오류</AlertTitle>
  <AlertDescription>문제가 발생했습니다.</AlertDescription>
</Alert>
```

#### 스타일 특징

- 왼쪽 4px 두께의 색상 바 (variant에 따라)
- 50% 투명도 배경으로 부드러운 느낌
- 아이콘 지원 (5x5 size)
- 그림자 및 둥근 모서리 (xl)

### Card

```jsx
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
    <CardAction>
      <Button size="icon-sm" variant="ghost">...</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    본문 내용
  </CardContent>
  <CardFooter>
    푸터 액션
  </CardFooter>
</Card>
```

### Input & Textarea

```jsx
<Input
  type="text"
  placeholder="입력하세요"
  aria-invalid={hasError}
/>

<Textarea
  placeholder="내용을 입력하세요"
  className="min-h-32"
/>
```

#### 특징

- 둥근 모서리 (xl)
- 포커스 시 2px 링 + 테두리 색상 변경
- 오류 상태 시 빨강 테두리 + 링
- 부드러운 transition (200ms)

### Badge

```jsx
<Badge variant="default">기본</Badge>
<Badge variant="secondary">세컨더리</Badge>
<Badge variant="outline">아웃라인</Badge>
<Badge variant="destructive">삭제</Badge>
```

---

## 애니메이션

### 입장 애니메이션

```css
animate-fade-in:      /* 0.3s 페이드 인 */
animate-fade-in-slow: /* 0.6s 페이드 인 */
animate-slide-up:     /* 아래에서 위로 슬라이드 */
animate-slide-down:   /* 위에서 아래로 슬라이드 */
animate-slide-left:   /* 오른쪽에서 왼쪽으로 */
animate-slide-right:  /* 왼쪽에서 오른쪽으로 */
animate-scale-in:     /* 0.3s 스케일 인 */
animate-scale-in-slow:/* 0.5s 스케일 인 */
```

### 상호작용 애니메이션

```css
animate-pulse:      /* 2s 무한 펄스 */
animate-pulse-slow: /* 3s 무한 펄스 */
animate-bounce:     /* 1s 무한 바운스 */
animate-spin:       /* 1s 무한 회전 (로딩) */
```

### 주의 애니메이션

```css
animate-shake:  /* 0.5s 흔들기 */
animate-wiggle: /* 0.5s 좌우 흔들림 */
```

### Transition 타이밍

```css
duration-75:   75ms   /* 즉각적 피드백 */
duration-100:  100ms
duration-150:  150ms
duration-200:  200ms  /* 기본 전환 */
duration-300:  300ms  /* 페이지 전환 */
duration-500:  500ms
duration-700:  700ms
duration-1000: 1000ms
```

### Easing 함수

```css
ease-smooth:         cubic-bezier(0.4, 0, 0.2, 1)       /* 기본 */
ease-bounce-in:      cubic-bezier(0.68, -0.55, 0.265, 1.55)
ease-in-out-back:    cubic-bezier(0.68, -0.6, 0.32, 1.6)
```

---

## 반응형 디자인

### 브레이크포인트

```css
xs:   375px   /* Mobile S (iPhone SE) */
sm:   640px   /* Mobile L */
md:   768px   /* Tablet */
lg:   1024px  /* Desktop */
xl:   1280px  /* Desktop L */
2xl:  1536px  /* Desktop XL */
```

### 모바일 우선 접근

```jsx
// 모바일: 기본 스타일
// 태블릿 이상: md: 접두사
// 데스크톱: lg: 접두사

<div className="p-4 md:p-6 lg:p-8">
  {/* 모바일: 16px, 태블릿: 24px, 데스크톱: 32px */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 반응형 그리드 */}
</div>
```

### 터치 타겟 크기

모바일 접근성을 위한 최소 크기:

```css
min-h-touch:         44px  /* iOS 권장 */
min-w-touch:         44px
min-h-touch-android: 48px  /* Android 권장 */
min-w-touch-android: 48px
```

### Safe Area (모바일 노치 대응)

```css
safe-area-top:    padding-top: env(safe-area-inset-top)
safe-area-bottom: padding-bottom: env(safe-area-inset-bottom)
safe-area-left:   padding-left: env(safe-area-inset-left)
safe-area-right:  padding-right: env(safe-area-inset-right)
```

---

## 접근성

### 포커스 관리

- 키보드 포커스 시 2px 링 표시
- 마우스 클릭 시에는 포커스 링 숨김 (`:focus-visible` 사용)
- Tab 순서 논리적으로 유지

```css
*:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--ring);
  ring-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

### 스크린 리더

```jsx
// 스크린 리더 전용 텍스트
<span className="sr-only">로딩 중...</span>

// ARIA 레이블
<button aria-label="메뉴 닫기">
  <X />
</button>

// ARIA 상태
<input aria-invalid={hasError} aria-describedby="error-msg" />
```

### 색상 대비

- 모든 텍스트: 최소 4.5:1
- 대형 텍스트 (18px+): 최소 3:1
- UI 컴포넌트: 최소 3:1

### 움직임 줄이기 (Reduced Motion)

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 다크 모드

### 활성화 방법

```jsx
// HTML root에 'dark' 클래스 추가
<html className="dark">
```

### 색상 매핑

다크 모드에서는 HSL 시맨틱 토큰이 자동으로 전환됩니다:

**라이트 모드:**
- `--background: 0 0% 100%` (흰색)
- `--foreground: 220 13% 13%` (거의 검정)

**다크 모드:**
- `--background: 222 47% 11%` (진한 남색)
- `--foreground: 210 40% 98%` (거의 흰색)

### 다크 모드 전용 스타일

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* 라이트/다크 모드별 색상 */}
</div>
```

### 글래스모피즘 효과

```css
/* 라이트 모드 */
--glass-border: rgba(255, 255, 255, 0.2);
--glass-surface: rgba(255, 255, 255, 0.7);
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);

/* 다크 모드 */
--glass-border: rgba(255, 255, 255, 0.1);
--glass-surface: rgba(255, 255, 255, 0.05);
--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
```

---

## 사용 예시

### 기본 페이지 레이아웃

```jsx
<div className="min-h-screen bg-background">
  <header className="border-b border-border bg-card">
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-h4">CareGuide</h1>
    </div>
  </header>

  <main className="container mx-auto px-4 py-8 space-y-8">
    <section>
      <h2 className="text-h2 mb-4">섹션 제목</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 카드들 */}
      </div>
    </section>
  </main>

  <footer className="border-t border-border bg-muted py-8">
    <div className="container mx-auto px-4 text-center text-muted-foreground">
      © 2024 CareGuide
    </div>
  </footer>
</div>
```

### 폼 예시

```jsx
<form className="space-y-4">
  <div>
    <Label htmlFor="email">이메일</Label>
    <Input
      id="email"
      type="email"
      placeholder="your@email.com"
      aria-invalid={errors.email}
    />
    {errors.email && (
      <p className="text-error text-body-sm mt-1">{errors.email}</p>
    )}
  </div>

  <div>
    <Label htmlFor="message">메시지</Label>
    <Textarea
      id="message"
      placeholder="내용을 입력하세요"
      className="min-h-32"
    />
  </div>

  <div className="flex gap-3">
    <Button type="submit" size="lg">제출</Button>
    <Button type="button" variant="outline" size="lg">취소</Button>
  </div>
</form>
```

---

## 유지보수 가이드

### 색상 추가 시

1. `tailwind.config.js`에서 색상 팔레트 확장
2. WCAG AA 대비 비율 검증
3. 다크 모드 색상도 함께 정의
4. 문서 업데이트

### 컴포넌트 추가 시

1. `src/components/ui/` 에 새 컴포넌트 생성
2. CVA (class-variance-authority) 사용하여 variants 정의
3. 접근성 속성 포함 (ARIA, 키보드 네비게이션)
4. 스토리북 또는 예시 페이지 작성
5. 이 문서에 사용법 추가

### 애니메이션 추가 시

1. `tailwind.config.js`의 `animation` 및 `keyframes` 섹션에 추가
2. `prefers-reduced-motion` 고려
3. 성능 테스트 (60fps 유지)

---

## 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI](https://www.radix-ui.com/) - 접근성 우선 컴포넌트
- [CVA 문서](https://cva.style/docs) - Class Variance Authority

---

**마지막 업데이트:** 2024-11-28
**버전:** 1.0.0
**담당:** CareGuide Design Team
