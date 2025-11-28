# UI 컴포넌트 빠른 참조 가이드

CareGuide 프로젝트의 개선된 UI 컴포넌트 사용법을 빠르게 참조할 수 있는 치트시트입니다.

## 목차
- [Button](#button)
- [Card](#card)
- [Input](#input)
- [Checkbox](#checkbox)
- [Select](#select)
- [Dialog](#dialog)
- [Progress](#progress)
- [LoadingSpinner](#loadingspinner)
- [Skeleton](#skeleton)
- [Badge](#badge)
- [Alert](#alert)

---

## Button

### Import
```tsx
import { Button } from '@/components/ui/button';
```

### Variants
```tsx
<Button variant="default">기본 버튼</Button>
<Button variant="destructive">삭제</Button>
<Button variant="outline">외곽선</Button>
<Button variant="secondary">보조</Button>
<Button variant="ghost">고스트</Button>
<Button variant="link">링크</Button>
```

### Sizes
```tsx
<Button size="sm">작은</Button>
<Button size="default">기본</Button>
<Button size="lg">큰</Button>
<Button size="icon"><Icon /></Button>
<Button size="icon-sm"><Icon /></Button>
<Button size="icon-lg"><Icon /></Button>
```

### With Icons
```tsx
import { Plus } from 'lucide-react';

<Button>
  <Plus />
  새로 만들기
</Button>
```

---

## Card

### Import
```tsx
import {
  Card,
  InteractiveCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction
} from '@/components/ui/card';
```

### Basic Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
  <CardFooter>
    푸터
  </CardFooter>
</Card>
```

### Interactive Card (Clickable)
```tsx
<InteractiveCard onClick={() => navigate('/detail')}>
  <CardHeader>
    <CardTitle>클릭 가능한 카드</CardTitle>
    <CardAction>
      <Button variant="ghost" size="icon-sm">
        <MoreHorizontal />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>...</CardContent>
</InteractiveCard>
```

---

## Input

### Import
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

### Basic Input
```tsx
<div>
  <Label htmlFor="email">이메일</Label>
  <Input
    id="email"
    type="email"
    placeholder="name@example.com"
  />
</div>
```

### With Error State
```tsx
<Input
  aria-invalid={hasError}
  placeholder="값을 입력하세요"
/>
{hasError && <p className="text-sm text-error mt-1">에러 메시지</p>}
```

### Disabled
```tsx
<Input disabled placeholder="비활성화됨" />
```

---

## Checkbox

### Import
```tsx
import { Checkbox } from '@/components/ui/checkbox';
```

### Basic Usage
```tsx
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">약관에 동의합니다</Label>
</div>
```

### Controlled
```tsx
const [checked, setChecked] = useState(false);

<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
/>
```

---

## Select

### Import
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

### Basic Select
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">옵션 1</SelectItem>
    <SelectItem value="2">옵션 2</SelectItem>
    <SelectItem value="3">옵션 3</SelectItem>
  </SelectContent>
</Select>
```

### With Label
```tsx
<div>
  <Label htmlFor="role">역할</Label>
  <Select>
    <SelectTrigger id="role">
      <SelectValue placeholder="역할을 선택하세요" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="patient">환자</SelectItem>
      <SelectItem value="doctor">의사</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Small Size
```tsx
<SelectTrigger size="sm">
  <SelectValue />
</SelectTrigger>
```

---

## Dialog

### Import
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
```

### Basic Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>열기</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>
        이것은 설명입니다.
      </DialogDescription>
    </DialogHeader>
    <div>콘텐츠</div>
    <DialogFooter>
      <Button variant="outline">취소</Button>
      <Button>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Controlled Dialog
```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    ...
  </DialogContent>
</Dialog>
```

---

## Progress

### Import
```tsx
import { Progress } from '@/components/ui/progress';
```

### Basic Progress
```tsx
<Progress value={60} />
```

### Sizes
```tsx
<Progress value={60} size="sm" />
<Progress value={60} size="default" />
<Progress value={60} size="lg" />
```

### Variants
```tsx
<Progress value={60} variant="default" />
<Progress value={60} variant="primary" />
<Progress value={60} variant="secondary" />
<Progress value={60} variant="success" />
<Progress value={60} variant="gradient" />
```

### With Glow Effect
```tsx
<Progress value={60} variant="gradient" showGlow />
```

### With Label
```tsx
<div>
  <div className="flex justify-between mb-2">
    <span className="text-sm font-medium">진행률</span>
    <span className="text-sm text-muted-foreground">60%</span>
  </div>
  <Progress value={60} />
</div>
```

---

## LoadingSpinner

### Import
```tsx
import { LoadingSpinner, InlineSpinner } from '@/components/ui/loading-spinner';
```

### Full Page Loading
```tsx
<LoadingSpinner size="lg" label="데이터 로딩 중..." />
```

### Sizes
```tsx
<LoadingSpinner size="xs" />
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />
<LoadingSpinner size="xl" />
```

### Variants
```tsx
<LoadingSpinner variant="primary" />
<LoadingSpinner variant="secondary" />
<LoadingSpinner variant="white" />
<LoadingSpinner variant="muted" />
```

### Without Label
```tsx
<LoadingSpinner showLabel={false} />
```

### Inline Spinner
```tsx
<Button disabled>
  <InlineSpinner size="sm" variant="white" />
  로딩 중...
</Button>
```

---

## Skeleton

### Import
```tsx
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/ui/skeleton';
```

### Basic Skeleton
```tsx
<Skeleton className="h-4 w-32" />
```

### Variants
```tsx
<Skeleton className="h-4 w-32" variant="default" />
<Skeleton className="h-4 w-32" variant="shimmer" />
<Skeleton className="h-4 w-32" variant="wave" />
```

### Text Skeleton
```tsx
<SkeletonText lines={3} />
```

### Card Skeleton
```tsx
<SkeletonCard />
```

### Custom Skeleton Layout
```tsx
<div className="space-y-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-64" />
    <Skeleton className="h-4 w-48" />
  </div>
</div>
```

---

## Badge

### Import
```tsx
import { Badge } from '@/components/ui/badge';
```

### Variants
```tsx
<Badge variant="default">기본</Badge>
<Badge variant="secondary">보조</Badge>
<Badge variant="destructive">에러</Badge>
<Badge variant="success">성공</Badge>
<Badge variant="warning">경고</Badge>
<Badge variant="info">정보</Badge>
<Badge variant="outline">외곽선</Badge>
<Badge variant="soft">소프트</Badge>
```

### Sizes
```tsx
<Badge size="sm">작음</Badge>
<Badge size="default">기본</Badge>
<Badge size="lg">큼</Badge>
```

### With Icon
```tsx
import { Check } from 'lucide-react';

<Badge variant="success">
  <Check />
  완료
</Badge>
```

### As Link
```tsx
<Badge asChild>
  <a href="/notifications">새 메시지 5개</a>
</Badge>
```

---

## Alert

### Import
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
```

### Variants
```tsx
<Alert variant="default">
  <Info />
  <AlertTitle>기본</AlertTitle>
  <AlertDescription>기본 알림 메시지입니다.</AlertDescription>
</Alert>

<Alert variant="info">
  <Info />
  <AlertTitle>정보</AlertTitle>
  <AlertDescription>정보성 메시지입니다.</AlertDescription>
</Alert>

<Alert variant="success">
  <CheckCircle />
  <AlertTitle>성공</AlertTitle>
  <AlertDescription>작업이 성공적으로 완료되었습니다.</AlertDescription>
</Alert>

<Alert variant="warning">
  <AlertTriangle />
  <AlertTitle>경고</AlertTitle>
  <AlertDescription>주의가 필요합니다.</AlertDescription>
</Alert>

<Alert variant="destructive">
  <XCircle />
  <AlertTitle>오류</AlertTitle>
  <AlertDescription>오류가 발생했습니다.</AlertDescription>
</Alert>
```

### Without Icon
```tsx
<Alert>
  <AlertTitle>제목만</AlertTitle>
  <AlertDescription>설명</AlertDescription>
</Alert>
```

---

## 일반적인 패턴

### 폼 레이아웃
```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="name">이름</Label>
    <Input id="name" placeholder="홍길동" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="email">이메일</Label>
    <Input id="email" type="email" placeholder="hong@example.com" />
  </div>

  <div className="flex items-center gap-2">
    <Checkbox id="terms" />
    <Label htmlFor="terms">약관에 동의합니다</Label>
  </div>

  <Button type="submit" className="w-full">
    제출
  </Button>
</form>
```

### 통계 카드
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>월간 리포트</CardTitle>
      <Badge variant="success">+12%</Badge>
    </div>
    <CardDescription>이번 달 통계</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm">목표 달성률</span>
          <span className="font-semibold">85%</span>
        </div>
        <Progress value={85} variant="success" />
      </div>
    </div>
  </CardContent>
</Card>
```

### 로딩 상태 처리
```tsx
{isLoading ? (
  <div className="space-y-4">
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
) : error ? (
  <Alert variant="destructive">
    <XCircle />
    <AlertTitle>오류</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
) : (
  <div className="space-y-4">
    {data.map(item => (
      <Card key={item.id}>...</Card>
    ))}
  </div>
)}
```

### 모달 폼
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>새 항목 추가</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>새 항목 추가</DialogTitle>
      <DialogDescription>
        새로운 항목을 추가합니다.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">제목</Label>
        <Input id="title" />
      </div>
      <div>
        <Label htmlFor="category">카테고리</Label>
        <Select>
          <SelectTrigger id="category">
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">카테고리 1</SelectItem>
            <SelectItem value="2">카테고리 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline">취소</Button>
      <Button>저장</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 색상 시스템

### Primary Colors
```tsx
bg-primary      // #00c9b7
bg-primary-50   // 가장 밝음
bg-primary-500  // 기본
bg-primary-900  // 가장 어두움
```

### Secondary Colors
```tsx
bg-secondary    // #9f7aea
```

### Semantic Colors
```tsx
bg-success      // #10b981
bg-warning      // #f59e0b
bg-error        // #ef4444
bg-info         // #3b82f6
```

### Text Colors
```tsx
text-text-primary     // #1f2937
text-text-secondary   // #4b5563
text-text-tertiary    // #9ca3af
```

### Border Colors
```tsx
border-border-light   // #f3f4f6
border-border-medium  // #e5e7eb
border-border-strong  // #d1d5db
```

---

## 그림자 시스템

```tsx
shadow-xs      // 매우 미세
shadow-sm      // 작음
shadow-soft    // 부드러움 (권장)
shadow-md      // 중간
shadow-medium  // 중간 (권장)
shadow-lg      // 큼
shadow-glow-primary    // 발광 효과 (primary)
shadow-glow-secondary  // 발광 효과 (secondary)
```

---

## 둥근 모서리

```tsx
rounded-sm     // 4px
rounded-md     // 8px
rounded-lg     // 12px
rounded-xl     // 16px (권장)
rounded-2xl    // 24px (권장)
rounded-3xl    // 32px
rounded-full   // 완전한 원형
```

---

## 간격 시스템

```tsx
gap-1    // 4px
gap-2    // 8px
gap-3    // 12px
gap-4    // 16px (권장)
gap-6    // 24px (권장)
gap-8    // 32px
```

---

**업데이트**: 2025-11-28
**버전**: 1.0.0
