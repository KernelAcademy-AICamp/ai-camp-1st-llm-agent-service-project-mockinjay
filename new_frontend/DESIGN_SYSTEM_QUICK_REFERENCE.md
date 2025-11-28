# CareGuide Design System - 빠른 참조

개발 시 빠르게 참조할 수 있는 핵심 토큰 및 사용 예시입니다.

---

## 색상

### 브랜드

```jsx
// Primary (민트)
className="bg-primary text-white"           // #00c9b7
className="bg-primary-hover"                // 호버: #00b3a3
className="bg-primary-light text-primary"   // 연한 배경: #e6f7f5

// Secondary (보라)
className="bg-secondary text-white"         // #9f7aea
className="bg-secondary-hover"              // 호버: #805ad5
```

### 상태

```jsx
className="bg-success text-white"     // 성공: #10b981
className="bg-warning text-white"     // 경고: #f59e0b
className="bg-error text-white"       // 오류: #ef4444
className="bg-info text-white"        // 정보: #3b82f6
```

### 시맨틱 (라이트/다크 자동 전환)

```jsx
className="bg-background text-foreground"   // 메인 배경/텍스트
className="bg-card text-card-foreground"    // 카드
className="bg-muted text-muted-foreground"  // 비활성
className="border-border"                   // 테두리
```

---

## 타이포그래피

### 제목

```jsx
className="text-h1"  // 40px, bold, -0.02em
className="text-h2"  // 32px, bold, -0.01em
className="text-h3"  // 28px, semibold
className="text-h4"  // 24px, semibold
className="text-h5"  // 20px, semibold
className="text-h6"  // 18px, semibold
```

### 본문

```jsx
className="text-body-xl"  // 18px (강조 본문)
className="text-body-lg"  // 16px (기본 본문)
className="text-body"     // 14px (모바일 본문)
className="text-body-sm"  // 13px (보조 텍스트)
className="text-body-xs"  // 12px (캡션)
```

### 굵기

```jsx
className="font-light"     // 300
className="font-normal"    // 400
className="font-medium"    // 500
className="font-semibold"  // 600
className="font-bold"      // 700
```

---

## 간격

```jsx
// Padding
className="p-4"      // 16px (기본 간격)
className="p-6"      // 24px (카드 내부)
className="px-4"     // 가로 16px
className="py-3"     // 세로 12px

// Margin
className="m-4"      // 16px
className="mt-6"     // 상단 24px
className="mb-8"     // 하단 32px

// Gap (Grid/Flex)
className="gap-4"    // 16px
className="gap-6"    // 24px
className="space-y-4" // 세로 간격 16px
className="space-x-3" // 가로 간격 12px
```

**간격 스케일:** `0.5` (2px), `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px), `16` (64px)

---

## 컴포넌트

### Button

```jsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">기본 버튼</Button>
<Button variant="secondary">보조 버튼</Button>
<Button variant="outline">아웃라인</Button>
<Button variant="ghost">고스트</Button>
<Button variant="destructive">삭제</Button>

// Sizes
<Button size="sm">작게</Button>
<Button size="default">기본</Button>
<Button size="lg">크게</Button>
<Button size="xl">특대</Button>

// Icon
<Button size="icon"><Icon /></Button>
```

### Alert

```jsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

<Alert variant="info">
  <AlertTitle>제목</AlertTitle>
  <AlertDescription>설명</AlertDescription>
</Alert>

// Variants: default, info, success, warning, destructive
```

### Card

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>내용</CardContent>
  <CardFooter>푸터</CardFooter>
</Card>
```

### Input & Textarea

```jsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

<Input type="text" placeholder="입력" />
<Textarea placeholder="내용" className="min-h-32" />
```

### Badge

```jsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">뱃지</Badge>
<Badge variant="secondary">보조</Badge>
<Badge variant="outline">아웃라인</Badge>
<Badge variant="destructive">삭제</Badge>
```

---

## 레이아웃

### Container

```jsx
className="container mx-auto px-4"  // 중앙 정렬 컨테이너
className="max-w-7xl mx-auto"       // 최대 너비 제한
```

### Grid

```jsx
// 반응형 그리드
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Auto-fit
className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4"
```

### Flex

```jsx
className="flex items-center justify-between gap-4"
className="flex flex-col space-y-4"
```

---

## 반응형

### 브레이크포인트

```jsx
// 모바일 우선
className="p-4 md:p-6 lg:p-8"  // 모바일: 16px, 태블릿: 24px, 데스크톱: 32px

xs:  375px  // Mobile S
sm:  640px  // Mobile L
md:  768px  // Tablet
lg:  1024px // Desktop
xl:  1280px // Desktop L
2xl: 1536px // Desktop XL
```

### 숨기기/표시

```jsx
className="hidden md:block"      // 모바일 숨김, 태블릿+ 표시
className="block md:hidden"      // 모바일 표시, 태블릿+ 숨김
```

---

## 애니메이션

### 입장

```jsx
className="animate-fade-in"      // 0.3s 페이드
className="animate-slide-up"     // 아래→위 슬라이드
className="animate-scale-in"     // 스케일 인
```

### 상호작용

```jsx
className="hover:scale-105 transition-transform"
className="hover:-translate-y-0.5 transition-all duration-200"
className="active:scale-95"
```

### 로딩

```jsx
className="animate-pulse"        // 펄스
className="animate-spin"         // 회전 (로딩)
className="animate-shimmer"      // 반짝임
```

### Transition

```jsx
className="transition-all duration-200"      // 기본 전환
className="transition-colors duration-150"   // 색상만
className="transition-transform duration-300" // 변형만
```

---

## 둥근 모서리

```jsx
className="rounded"      // 8px (기본)
className="rounded-lg"   // 12px
className="rounded-xl"   // 16px (권장)
className="rounded-2xl"  // 24px (카드)
className="rounded-3xl"  // 32px
className="rounded-full" // 완전 둥글게
```

---

## 그림자

```jsx
className="shadow-soft"    // 부드러운 그림자
className="shadow-medium"  // 중간 그림자
className="shadow-lg"      // 큰 그림자
className="shadow-glow-primary"  // 민트 글로우
```

---

## 접근성

### 포커스

```jsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### 스크린 리더

```jsx
<span className="sr-only">로딩 중...</span>
```

### ARIA

```jsx
<button aria-label="닫기">
<input aria-invalid={hasError} />
<div role="alert">
```

### 터치 타겟

```jsx
className="min-h-touch min-w-touch"  // 44px 최소 터치
```

---

## 유틸리티

### 텍스트 자르기

```jsx
className="truncate"        // 1줄 말줄임
className="line-clamp-2"    // 2줄 말줄임
className="line-clamp-3"    // 3줄 말줄임
```

### 스크롤바

```jsx
className="scrollbar-hide"      // 스크롤바 숨김
className="custom-scrollbar"    // 커스텀 스크롤바
```

### 그라데이션 텍스트

```jsx
className="gradient-text"  // 민트→보라 그라데이션
```

### Safe Area (모바일 노치)

```jsx
className="safe-area-top"     // 상단 안전 영역
className="safe-area-bottom"  // 하단 안전 영역
```

---

## 다크 모드

```jsx
// 다크 모드 전용 스타일
className="bg-white dark:bg-gray-900"
className="text-gray-900 dark:text-white"
className="border-gray-200 dark:border-gray-700"

// HTML에서 활성화
<html className="dark">
```

---

## 자주 사용하는 패턴

### 센터 정렬

```jsx
className="flex items-center justify-center"
className="grid place-items-center"
```

### 카드 호버 효과

```jsx
className="hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
```

### 글래스모피즘 카드

```jsx
className="glass-card"  // 미리 정의된 클래스
```

### 버튼 그룹

```jsx
<div className="flex gap-3">
  <Button variant="default">확인</Button>
  <Button variant="outline">취소</Button>
</div>
```

### 폼 그룹

```jsx
<div className="space-y-2">
  <Label htmlFor="email">이메일</Label>
  <Input id="email" type="email" />
  <p className="text-body-sm text-muted-foreground">도움말 텍스트</p>
</div>
```

---

## 개발 팁

1. **일관성 유지:** 시스템 토큰을 사용하여 임의 값 지양
2. **모바일 우선:** 기본 스타일을 모바일로 설정하고 `md:`, `lg:` 추가
3. **접근성 체크:** 색상 대비, 포커스 상태, ARIA 속성 확인
4. **성능:** 애니메이션은 `transform`과 `opacity`만 사용 (GPU 가속)
5. **다크 모드:** 모든 색상에 다크 모드 대응 확인

---

**전체 문서:** `DESIGN_SYSTEM.md` 참조
