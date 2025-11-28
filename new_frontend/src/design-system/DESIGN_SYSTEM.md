# CareGuide Design System

A healthcare-focused design system for Chronic Kidney Disease (CKD) patient care platform.

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Accessibility](#accessibility)
- [Dark Mode](#dark-mode)
- [Healthcare Patterns](#healthcare-patterns)

## Overview

The CareGuide design system is built for healthcare applications serving CKD patients, caregivers, and healthcare professionals. It emphasizes accessibility, trust, clarity, and compliance with healthcare standards.

### Core Technologies

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library built on Radix UI
- **CSS Variables**: For dynamic theming and customization
- **class-variance-authority (CVA)**: For component variants

### Design Philosophy

1. **Accessibility First**: WCAG 2.2 Level AA compliance minimum
2. **Trust & Clarity**: Clear information hierarchy, medical-grade accuracy
3. **Patient-Centric**: Optimized for elderly users, high readability
4. **Consistency**: Unified patterns across all touchpoints

## Design Principles

### 1. Clear Communication

Healthcare information must be unambiguous and easy to understand.

- Use plain language over medical jargon
- Provide clear visual hierarchy
- Use icons to support text (never replace it)
- Ensure critical information stands out

### 2. Accessible by Default

Design for diverse abilities and contexts.

- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Touch targets minimum 44x44px
- Support keyboard navigation
- Provide screen reader support

### 3. Trustworthy & Professional

Build confidence through design.

- Use calming, professional colors (blues, teals, greens)
- Avoid overly playful or casual design
- Maintain consistent branding
- Use appropriate medical imagery

### 4. Scalable & Maintainable

Support long-term growth.

- Use design tokens for consistency
- Create reusable components
- Document patterns and usage
- Follow semantic naming conventions

## Color System

### Primary Colors

The primary color palette uses calming teal tones, associated with healthcare, trust, and wellness.

```css
/* Teal Primary Scale */
--primary-50:  #E0F7F5   /* Lightest - backgrounds */
--primary-100: #B3EDE8   /* Very light - hover states */
--primary-200: #80E2DA   /* Light - disabled states */
--primary-300: #4DD7CC   /* Medium light - borders */
--primary-400: #26D0C2   /* Medium */
--primary-500: #00C9B7   /* Main brand color */
--primary-600: #00B3A3   /* Hover state */
--primary-700: #00A899   /* Active state */
--primary-800: #008C80   /* Pressed state */
--primary-900: #006B62   /* Darkest - high emphasis */
```

**Usage:**
- Primary-500: Main CTAs, links, active states
- Primary-100: Hover backgrounds, subtle highlights
- Primary-700: Pressed buttons, high-contrast elements

### Accent Colors

```css
--accent-purple: #9F7AEA   /* Innovation, premium features */
--accent-mint:   #00BFA5   /* Success, positive feedback */
```

**Usage:**
- Purple: Premium features, highlights, gradients
- Mint: Confirmation, success states

### Semantic Colors

#### Success (Informational Blue-Green)

```css
--success-50:  #E0F7FA   /* Light background */
--success-100: #B2EBF2   /* Subtle highlight */
--success-500: #00A8E8   /* Main success color */
--success-600: #0097D1   /* Hover */
--success-700: #00839C   /* Active */
```

**Usage:** Successful operations, confirmations, positive health metrics

#### Warning (Amber)

```css
--warning-50:  #FFF8E1   /* Light background */
--warning-100: #FFECB3   /* Subtle highlight */
--warning-500: #F59E0B   /* Main warning color */
--warning-600: #D97706   /* Hover */
--warning-700: #B45309   /* Active */
```

**Usage:** Cautions, missing information, dietary warnings

#### Error (Red)

```css
--error-50:  #FEE2E2   /* Light background */
--error-100: #FECACA   /* Subtle highlight */
--error-500: #EF4444   /* Main error color */
--error-600: #DC2626   /* Hover */
--error-700: #B91C1C   /* Active */
```

**Usage:** Errors, dangerous actions, critical health alerts

#### Info (Blue)

```css
--info-50:  #EFF6FF   /* Light background */
--info-100: #DBEAFE   /* Subtle highlight */
--info-500: #3B82F6   /* Main info color */
--info-600: #2563EB   /* Hover */
--info-700: #1D4ED8   /* Active */
```

**Usage:** Informational messages, educational content, tips

### Neutral Colors (Gray Scale)

```css
/* Text Colors */
--gray-50:  #F9FAFB   /* Subtle backgrounds */
--gray-100: #F3F4F6   /* Light borders, dividers */
--gray-200: #E5E7EB   /* Borders */
--gray-300: #D1D5DB   /* Strong borders */
--gray-400: #9CA3AF   /* Disabled text */
--gray-500: #6B7280   /* Tertiary text, captions */
--gray-600: #4B5563   /* Secondary text, descriptions */
--gray-700: #374151   /* Body text */
--gray-800: #1F2937   /* Headings, primary text */
--gray-900: #111827   /* High-emphasis text */
```

### Background Colors

```css
--color-background:     #FFFFFF   /* Main canvas */
--color-surface:        #F8FAFC   /* Cards, panels */
--color-surface-raised: #FFFFFF   /* Elevated cards */
--color-input-bar:      #F2FFFD   /* Input focus backgrounds */
```

### Color Accessibility Guidelines

#### Contrast Ratios

| Element Type | Minimum Ratio | Example |
|--------------|---------------|---------|
| Normal text (< 18px) | 4.5:1 | Gray-700 on White |
| Large text (≥ 18px or bold 14px) | 3:1 | Gray-600 on White |
| UI components | 3:1 | Border on background |
| Active elements | 3:1 | Button on background |

#### Color Blindness Considerations

- Never use color alone to convey information
- Always pair color with icons, text, or patterns
- Test with color blindness simulators
- Provide high-contrast mode option

## Typography

### Font Families

```css
font-family: 'Noto Sans KR', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Rationale:**
- **Noto Sans KR**: Excellent Korean character support, high readability
- **Inter**: Modern, accessible Latin font with excellent hinting
- System fallbacks for performance

### Type Scale

Healthcare applications require larger, more readable text than typical applications.

```css
/* Base size: 16px (1rem) */

--text-xs:   0.75rem  /* 12px */
--text-sm:   0.875rem /* 14px */
--text-base: 1rem     /* 16px - Minimum body text */
--text-lg:   1.125rem /* 18px - Large body, small headings */
--text-xl:   1.25rem  /* 20px - H4 */
--text-2xl:  1.5rem   /* 24px - H3 */
--text-3xl:  1.875rem /* 30px - H2 */
--text-4xl:  2.25rem  /* 36px - H1 */
--text-5xl:  3rem     /* 48px - Display */
```

### Font Weights

```css
--font-light:     300  /* Rarely used */
--font-normal:    400  /* Body text */
--font-medium:    500  /* Emphasis, buttons */
--font-semibold:  600  /* Subheadings */
--font-bold:      700  /* Headings */
```

### Line Heights

```css
--leading-tight:   1.2   /* Headings */
--leading-snug:    1.375 /* Subheadings */
--leading-normal:  1.5   /* Body text */
--leading-relaxed: 1.625 /* Long-form content */
--leading-loose:   2.0   /* Spacious reading */
```

### Typography Patterns

#### Headings

```tsx
{/* Page Title - H1 */}
<h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
  만성콩팥병 관리
</h1>

{/* Section Title - H2 */}
<h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
  식단 관리
</h2>

{/* Subsection Title - H3 */}
<h3 className="text-xl font-semibold text-gray-900 leading-snug">
  칼륨 제한 식품
</h3>

{/* Card Title - H4 */}
<h4 className="text-lg font-semibold text-gray-900">
  오늘의 권장 식단
</h4>
```

#### Body Text

```tsx
{/* Primary body text */}
<p className="text-base text-gray-700 leading-relaxed">
  만성콩팥병 환자는 칼륨 섭취를 제한해야 합니다.
</p>

{/* Secondary descriptive text */}
<p className="text-sm text-gray-600 leading-normal">
  권장 섭취량: 하루 2000mg 이하
</p>

{/* Caption, metadata */}
<span className="text-xs text-gray-500">
  마지막 업데이트: 2025년 1월 15일
</span>
```

#### Labels & UI Text

```tsx
{/* Form labels */}
<label className="text-sm font-medium text-gray-700">
  혈압 (mmHg)
</label>

{/* Button text */}
<button className="text-sm font-medium">
  저장하기
</button>

{/* Badge text */}
<span className="text-xs font-medium">
  진행중
</span>
```

### Accessibility Guidelines

- **Minimum size**: 16px for body text (elderly users)
- **Line length**: 45-75 characters for optimal readability
- **Paragraph spacing**: Minimum 1.5x line height
- **Letter spacing**: Slightly increased for Korean text (0.01-0.02em)

## Spacing

CareGuide uses an 8px base unit for spacing, creating a consistent rhythm throughout the interface.

### Spacing Scale

```css
--spacing-0:  0      /* 0px */
--spacing-1:  0.25rem /* 4px */
--spacing-2:  0.5rem  /* 8px - Base unit */
--spacing-3:  0.75rem /* 12px */
--spacing-4:  1rem    /* 16px */
--spacing-5:  1.25rem /* 20px */
--spacing-6:  1.5rem  /* 24px */
--spacing-8:  2rem    /* 32px */
--spacing-10: 2.5rem  /* 40px */
--spacing-12: 3rem    /* 48px */
--spacing-16: 4rem    /* 64px */
--spacing-20: 5rem    /* 80px */
```

### Spacing Patterns

#### Component Internal Spacing

```tsx
{/* Button padding */}
<button className="px-6 py-3">  {/* 24px horizontal, 12px vertical */}

{/* Input padding */}
<input className="px-4 py-3">   {/* 16px horizontal, 12px vertical */}

{/* Card padding */}
<div className="p-6">            {/* 24px all sides */}
```

#### Layout Spacing

```tsx
{/* Section gaps */}
<div className="space-y-8">      {/* 32px between sections */}

{/* Card gaps */}
<div className="gap-6">          {/* 24px between cards */}

{/* Form field gaps */}
<div className="space-y-4">      {/* 16px between fields */}
```

#### Touch Targets

Minimum 44x44px for all interactive elements (WCAG AAA):

```tsx
{/* Icon button */}
<button className="w-11 h-11 flex items-center justify-center">
  <Icon size={20} />
</button>
```

## Components

### Buttons

#### Variants

```tsx
{/* Primary - Main CTAs */}
<Button variant="default">저장하기</Button>

{/* Secondary - Alternative actions */}
<Button variant="outline">취소</Button>

{/* Ghost - Tertiary actions */}
<Button variant="ghost">닫기</Button>

{/* Destructive - Dangerous actions */}
<Button variant="destructive">삭제</Button>

{/* Link - Navigation */}
<Button variant="link">자세히 보기</Button>
```

#### Sizes

```tsx
<Button size="sm">작은 버튼</Button>    {/* height: 32px */}
<Button size="default">기본 버튼</Button> {/* height: 36px */}
<Button size="lg">큰 버튼</Button>       {/* height: 40px */}
<Button size="icon">                     {/* 36x36px */}
  <Icon size={20} />
</Button>
```

#### Healthcare-Specific Buttons

```tsx
{/* Emergency actions */}
<Button
  variant="destructive"
  size="lg"
  className="bg-red-600 hover:bg-red-700"
>
  <AlertTriangle size={20} />
  응급 연락
</Button>

{/* Health record actions */}
<Button
  variant="default"
  className="bg-primary-600 hover:bg-primary-700"
>
  <Heart size={20} />
  건강 기록 저장
</Button>
```

### Input Fields

```tsx
{/* Standard text input */}
<Input
  type="text"
  placeholder="혈압을 입력하세요 (mmHg)"
  aria-label="혈압"
/>

{/* Number input with healthcare context */}
<div className="space-y-2">
  <Label htmlFor="blood-pressure">혈압 (mmHg)</Label>
  <Input
    id="blood-pressure"
    type="number"
    min="0"
    max="300"
    aria-describedby="blood-pressure-help"
  />
  <p id="blood-pressure-help" className="text-xs text-gray-500">
    정상 범위: 90-120 mmHg
  </p>
</div>
```

### Cards

```tsx
{/* Standard card */}
<Card>
  <CardHeader>
    <CardTitle>오늘의 식단</CardTitle>
    <CardDescription>권장 칼로리: 1800kcal</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    <Button>식단 보기</Button>
  </CardFooter>
</Card>

{/* Health metric card */}
<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">혈압</p>
      <p className="text-2xl font-bold text-gray-900">120/80</p>
    </div>
    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
      <Heart className="text-primary-600" size={24} />
    </div>
  </div>
</div>
```

### Alerts & Notifications

```tsx
{/* Medical disclaimer */}
<Alert variant="default" className="border-amber-400 bg-amber-50">
  <AlertTriangle className="text-amber-600" />
  <AlertTitle>의학적 면책 조항</AlertTitle>
  <AlertDescription>
    본 정보는 의학적 진단이 아니며 참고용입니다.
    증상이 있는 경우 반드시 의료진과 상담하세요.
  </AlertDescription>
</Alert>

{/* Success notification */}
<Alert variant="default" className="border-success-400 bg-success-50">
  <CheckCircle className="text-success-600" />
  <AlertTitle>저장 완료</AlertTitle>
  <AlertDescription>
    건강 기록이 성공적으로 저장되었습니다.
  </AlertDescription>
</Alert>

{/* Critical warning */}
<Alert variant="destructive">
  <AlertCircle className="text-error-600" />
  <AlertTitle>주의 필요</AlertTitle>
  <AlertDescription>
    혈압이 정상 범위를 벗어났습니다. 의료진과 상담하세요.
  </AlertDescription>
</Alert>
```

### Badges

```tsx
{/* Status badges */}
<Badge variant="default">진행중</Badge>
<Badge variant="success">완료</Badge>
<Badge variant="warning">대기중</Badge>
<Badge variant="destructive">취소됨</Badge>

{/* Healthcare-specific badges */}
<Badge className="bg-primary-100 text-primary-700">
  1단계 CKD
</Badge>

<Badge className="bg-success-100 text-success-700">
  정상 범위
</Badge>

<Badge className="bg-warning-100 text-warning-700">
  주의 필요
</Badge>
```

## Accessibility

### WCAG 2.2 Level AA Compliance

#### Focus Management

```tsx
{/* Visible focus indicator */}
<button className="focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  클릭
</button>

{/* Skip to main content */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg"
>
  본문으로 건너뛰기
</a>
```

#### Screen Reader Support

```tsx
{/* Descriptive labels */}
<button aria-label="혈압 기록 삭제">
  <Trash2 size={20} />
</button>

{/* Status announcements */}
<div role="status" aria-live="polite">
  {successMessage}
</div>

{/* Loading states */}
<button disabled aria-busy="true">
  <Loader2 className="animate-spin" size={20} />
  <span className="sr-only">저장 중...</span>
  저장 중
</button>
```

#### Keyboard Navigation

All interactive elements must be keyboard accessible:

- **Tab**: Move to next focusable element
- **Shift+Tab**: Move to previous element
- **Enter/Space**: Activate buttons
- **Escape**: Close modals/dialogs
- **Arrow keys**: Navigate menus, lists

```tsx
{/* Modal with keyboard support */}
<Dialog onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>설정 열기</Button>
  </DialogTrigger>
  <DialogContent>
    {/* Escape key closes automatically */}
    <DialogHeader>
      <DialogTitle>설정</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Healthcare-Specific Accessibility

#### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    --primary-500: #00A899;  /* Darker teal */
    --gray-600: #374151;     /* Darker gray */
  }
}
```

#### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Text Scaling

Support 200% text zoom without loss of content or functionality:

```tsx
{/* Use relative units */}
<div className="text-base leading-relaxed">
  {/* Text scales properly */}
</div>

{/* Avoid fixed heights on text containers */}
<div className="min-h-[100px]"> {/* min-height instead of height */}
  {/* Content can expand */}
</div>
```

## Dark Mode

CareGuide supports dark mode for reduced eye strain and energy savings.

### Color Tokens (Dark Mode)

```css
.dark {
  /* Primary colors remain similar for brand consistency */
  --primary-500: #00C9B7;
  --primary-600: #00E0CC;  /* Brighter for dark backgrounds */

  /* Backgrounds */
  --color-background: #0F172A;      /* Slate-900 */
  --color-surface: #1E293B;         /* Slate-800 */
  --color-surface-raised: #334155;  /* Slate-700 */

  /* Text */
  --gray-900: #F1F5F9;  /* Lightest for headings */
  --gray-700: #CBD5E1;  /* Light for body */
  --gray-600: #94A3B8;  /* Medium for secondary */
  --gray-500: #64748B;  /* Dim for tertiary */

  /* Borders */
  --gray-200: #334155;
  --gray-300: #475569;
}
```

### Dark Mode Components

```tsx
{/* Button in dark mode */}
<Button className="dark:bg-primary-600 dark:hover:bg-primary-700">
  저장
</Button>

{/* Card in dark mode */}
<Card className="dark:bg-slate-800 dark:border-slate-700">
  <CardContent>
    <p className="dark:text-slate-300">
      내용
    </p>
  </CardContent>
</Card>

{/* Alert in dark mode */}
<Alert className="dark:bg-amber-950/50 dark:border-amber-600">
  <AlertDescription className="dark:text-amber-100">
    주의사항
  </AlertDescription>
</Alert>
```

## Healthcare Patterns

### Medical Disclaimer Pattern

Always display medical disclaimers for health information:

```tsx
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';

<DisclaimerBanner
  message="본 답변은 의학적 진단이 아니며 참고용 정보입니다. 증상이 있는 경우 반드시 의료진과 상담하세요."
  position="bottom"
  dismissible={true}
/>
```

### Health Metric Display Pattern

Consistent display of health metrics:

```tsx
<div className="space-y-4">
  {/* Metric card */}
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
        <Heart className="text-primary-600" size={20} />
      </div>
      <div>
        <p className="text-sm text-gray-600">혈압</p>
        <p className="text-lg font-semibold text-gray-900">120/80</p>
      </div>
    </div>
    <Badge variant="success">정상</Badge>
  </div>

  {/* Reference range */}
  <p className="text-xs text-gray-500">
    정상 범위: 90-120 / 60-80 mmHg
  </p>
</div>
```

### Dietary Restriction Pattern

Display dietary restrictions clearly:

```tsx
<div className="border-l-4 border-warning-500 bg-warning-50 p-4 rounded-r-lg">
  <div className="flex items-start gap-3">
    <AlertTriangle className="text-warning-600 shrink-0" size={20} />
    <div>
      <h4 className="font-semibold text-warning-900">칼륨 주의</h4>
      <p className="text-sm text-warning-800 mt-1">
        바나나, 감자, 토마토는 칼륨 함량이 높으므로 제한하세요.
      </p>
      <p className="text-xs text-warning-700 mt-2">
        권장량: 하루 2000mg 이하
      </p>
    </div>
  </div>
</div>
```

### Medication Reminder Pattern

```tsx
<Card className="border-info-400 bg-info-50">
  <CardHeader>
    <div className="flex items-center gap-3">
      <Pill className="text-info-600" size={24} />
      <CardTitle className="text-info-900">복약 알림</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div>
        <p className="font-medium text-info-900">약물명</p>
        <p className="text-sm text-info-800">복용 시간: 오전 8시, 오후 8시</p>
      </div>
      <Button className="w-full bg-info-600 hover:bg-info-700 text-white">
        복용 완료 표시
      </Button>
    </div>
  </CardContent>
</Card>
```

### Emergency Contact Pattern

```tsx
<Card className="border-red-500 bg-red-50">
  <CardHeader>
    <div className="flex items-center gap-3">
      <Phone className="text-red-600" size={24} />
      <CardTitle className="text-red-900">응급 연락처</CardTitle>
    </div>
  </CardHeader>
  <CardContent className="space-y-3">
    <div>
      <p className="text-sm text-red-800 font-medium">응급실: 119</p>
      <p className="text-sm text-red-800 font-medium">병원: 02-1234-5678</p>
    </div>
    <Button
      variant="destructive"
      size="lg"
      className="w-full bg-red-600 hover:bg-red-700"
    >
      <Phone size={20} />
      응급 전화
    </Button>
  </CardContent>
</Card>
```

## Best Practices

### Do's

1. **Use design tokens**: Always use Tailwind classes or CSS variables
2. **Maintain consistency**: Follow established patterns
3. **Consider accessibility**: Test with keyboard, screen readers
4. **Provide context**: Add labels, descriptions, help text
5. **Test with users**: Validate with actual CKD patients
6. **Support internationalization**: Design for Korean and English
7. **Optimize performance**: Lazy load, optimize images
8. **Document changes**: Update design system when adding patterns

### Don'ts

1. **Don't hardcode colors**: Use tokens instead
2. **Don't use color alone**: Pair with icons, text, patterns
3. **Don't ignore focus states**: Always visible focus indicators
4. **Don't create one-off components**: Extract reusable patterns
5. **Don't skip accessibility testing**: Test every component
6. **Don't use unclear language**: Plain language over jargon
7. **Don't create tiny touch targets**: Minimum 44x44px
8. **Don't hide critical information**: Keep medical info prominent

## Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Radix UI Docs**: https://www.radix-ui.com
- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/

## Contributing

When adding new components or patterns:

1. Review existing patterns first
2. Follow accessibility guidelines
3. Document usage with examples
4. Update this design system document
5. Test with keyboard and screen readers
6. Validate with color blindness simulators
7. Get design review approval

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained by**: CareGuide Design Team
