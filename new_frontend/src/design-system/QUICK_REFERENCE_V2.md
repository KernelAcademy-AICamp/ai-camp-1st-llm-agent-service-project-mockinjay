# CareGuide Design System - Quick Reference

Healthcare-focused design system for CKD patient care platform (WCAG 2.2 AA compliant)

## Colors

### Primary (Teal - Healthcare Trust)

```tsx
// Use for main CTAs, links, active states
bg-primary-500        // Main brand: #00C9B7 (3.9:1)
bg-primary-600        // PREFERRED for buttons: #00B3A3 (4.5:1 - AA)
text-primary-700      // Text/links: #00A899 (5.1:1 - AA)
bg-primary-800        // High contrast: #008C80 (6.3:1 - AA)
```

### Secondary (Medical Blue)

```tsx
// Use for professional/trust elements
bg-secondary-500      // Accent: #2B87F5 (4.2:1)
bg-secondary-600      // PREFERRED: #0066CC (7.3:1 - AAA)
text-secondary-700    // High contrast: #0052A3 (9.1:1 - AAA)
```

### Semantic Colors (WCAG AA)

```tsx
// Success (Medical Green)
text-success-600      // PREFERRED: #059669 (6.4:1 - AA)
bg-success-50         // Light background: #ECFDF5
bg-success-100        // Surface: #D1FAE5

// Warning (Amber)
text-warning-600      // PREFERRED: #D97706 (5.1:1 - AA)
bg-warning-50         // Light background: #FFFBEB
bg-warning-100        // Surface: #FEF3C7

// Error (Red)
text-error-600        // PREFERRED: #DC2626 (5.9:1 - AA)
bg-error-50           // Light background: #FEF2F2
bg-error-100          // Surface: #FEE2E2

// Info (Blue)
text-info-600         // PREFERRED: #2563EB (6.3:1 - AA)
bg-info-50            // Light background: #EFF6FF
bg-info-100           // Surface: #DBEAFE
```

### Text Colors (High Contrast)

```tsx
text-gray-800         // Primary text: #1F2937 (13.6:1 - AAA)
text-gray-700         // Headings: #374151 (10.6:1 - AAA)
text-gray-600         // Body text: #4B5563 (8.1:1 - AAA)
text-gray-500         // Secondary text: #6B7280 (5.7:1 - AA)
text-gray-400         // Muted text: #9CA3AF (3.9:1)
```

### Healthcare-Specific

```tsx
// Organ/system colors
text-healthcare-kidney        // #00C9B7
text-healthcare-blood         // #DC2626
text-healthcare-heart         // #EC4899

// Nutrition macros
text-healthcare-nutrition-protein      // #8B5CF6
text-healthcare-nutrition-sodium       // #D97706
text-healthcare-nutrition-potassium    // #059669
text-healthcare-nutrition-phosphorus   // #2563EB
```

## Typography

### Font Sizes (16px base for accessibility)

```tsx
text-xs      // 12px - Metadata only
text-sm      // 14px - Small labels
text-base    // 16px - MINIMUM body text
text-lg      // 18px - Large body
text-xl      // 20px - H4
text-2xl     // 24px - H3
text-3xl     // 30px - H2
text-4xl     // 36px - H1
```

### Font Weights

```tsx
font-normal     // 400 - Body text
font-medium     // 500 - Emphasis, buttons
font-semibold   // 600 - Subheadings
font-bold       // 700 - Headings
```

### Line Heights

```tsx
leading-tight     // 1.2 - Headings
leading-snug      // 1.375 - Subheadings
leading-normal    // 1.5 - Body text
leading-relaxed   // 1.625 - Long-form content
leading-loose     // 2.0 - Spacious reading
```

### Common Patterns

```tsx
{/* Page title */}
<h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
  만성콩팥병 관리
</h1>

{/* Section title */}
<h2 className="text-2xl font-bold text-gray-800 leading-tight">
  식단 관리
</h2>

{/* Body text */}
<p className="text-base text-gray-600 leading-relaxed">
  환자분의 건강을 위한 식단 정보입니다.
</p>

{/* Caption */}
<span className="text-sm text-gray-500">
  마지막 업데이트: 2025년 1월
</span>
```

## Spacing

### Scale (8px base unit)

```tsx
p-1   // 4px
p-2   // 8px - Base unit
p-3   // 12px
p-4   // 16px
p-5   // 20px
p-6   // 24px - Standard card padding
p-8   // 32px - Section padding
```

### Common Patterns

```tsx
{/* Card */}
<div className="p-6 space-y-4">

{/* Button */}
<button className="px-6 py-3">

{/* Input */}
<input className="px-4 py-3">

{/* Section gaps */}
<div className="space-y-6">

{/* Grid gaps */}
<div className="grid gap-6">
```

## Components

### Buttons

```tsx
// Primary CTA
<button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  저장하기
</button>

// Secondary
<button className="px-6 py-3 bg-white border border-primary-600 text-primary-700 hover:bg-primary-50 font-medium rounded-xl transition-all">
  취소
</button>

// Ghost
<button className="px-6 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-all">
  닫기
</button>

// Danger
<button className="px-6 py-3 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl">
  삭제
</button>

// Icon button (44x44px minimum)
<button className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-500" aria-label="설정">
  <Settings size={20} />
</button>
```

### Inputs

```tsx
// Standard input
<input
  type="text"
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
  placeholder="입력하세요"
/>

// With label and help text
<div className="space-y-2">
  <label htmlFor="blood-pressure" className="block text-sm font-medium text-gray-700">
    혈압 (mmHg)
  </label>
  <input
    id="blood-pressure"
    type="number"
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
    aria-describedby="blood-pressure-help"
  />
  <p id="blood-pressure-help" className="text-xs text-gray-500">
    정상 범위: 90-120 mmHg
  </p>
</div>

// Error state
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
  className="w-full px-4 py-3 rounded-xl border border-error-600 focus:ring-2 focus:ring-error-500/20"
/>
<p id="email-error" role="alert" className="text-sm text-error-600 mt-1">
  <AlertCircle size={14} className="inline mr-1" />
  유효한 이메일을 입력하세요
</p>
```

### Cards

```tsx
// Standard card
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-3">Card Title</h3>
  <p className="text-base text-gray-600">Card content</p>
</div>

// Interactive card
<button className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-6 text-left">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold text-gray-800">Title</h4>
      <p className="text-sm text-gray-600 mt-1">Description</p>
    </div>
    <ChevronRight className="text-gray-400" size={20} />
  </div>
</button>

// Health metric card
<div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">혈압</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">120/80</p>
    </div>
    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
      <Heart className="text-primary-600" size={24} />
    </div>
  </div>
  <div className="mt-4 flex items-center gap-2">
    <CheckCircle className="text-success-600" size={16} />
    <span className="text-sm font-medium text-success-700">정상 범위</span>
  </div>
</div>
```

### Alerts

```tsx
// Info alert
<div className="bg-info-50 border-l-4 border-info-600 rounded-r-lg p-4">
  <div className="flex items-start gap-3">
    <Info className="text-info-600 shrink-0" size={20} />
    <div>
      <h4 className="font-semibold text-info-900">알림</h4>
      <p className="text-sm text-info-800 mt-1">정보 메시지입니다.</p>
    </div>
  </div>
</div>

// Success alert
<div className="bg-success-50 border border-success-500 rounded-lg p-4">
  <div className="flex items-center gap-3">
    <CheckCircle className="text-success-600" size={20} />
    <p className="font-medium text-success-900">저장 완료</p>
  </div>
</div>

// Warning alert
<div className="bg-warning-50 border-l-4 border-warning-600 rounded-r-lg p-4">
  <div className="flex items-start gap-3">
    <AlertTriangle className="text-warning-600 shrink-0" size={20} />
    <div>
      <h4 className="font-semibold text-warning-900">주의</h4>
      <p className="text-sm text-warning-800 mt-1">확인이 필요합니다.</p>
    </div>
  </div>
</div>

// Error alert
<div className="bg-error-50 border border-error-500 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="text-error-600 shrink-0" size={20} />
    <div>
      <h4 className="font-semibold text-error-900">오류</h4>
      <p className="text-sm text-error-800 mt-1">문제가 발생했습니다.</p>
    </div>
  </div>
</div>

// Medical disclaimer (amber)
<div className="bg-amber-50 border-t-2 border-amber-400 p-4 rounded-b-lg">
  <div className="flex items-start gap-3">
    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
    <p className="text-sm text-amber-900">
      본 정보는 의학적 진단이 아니며 참고용입니다.
      증상이 있는 경우 반드시 의료진과 상담하세요.
    </p>
  </div>
</div>
```

### Badges

```tsx
// Status badges
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
  완료
</span>

<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
  대기중
</span>

<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
  취소됨
</span>

// CKD stage
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
  1단계 CKD
</span>

// Community badges
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
  자유
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
  챌린지
</span>
```

### Loading States

```tsx
// Button loading
<button disabled className="px-6 py-3 bg-primary-600 text-white rounded-xl opacity-60 cursor-not-allowed">
  <Loader2 className="animate-spin inline-block mr-2" size={20} />
  <span className="sr-only">저장 중...</span>
  저장 중
</button>

// Skeleton card
<div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
</div>

// Spinner
<div className="flex items-center justify-center py-12">
  <Loader2 className="animate-spin text-primary-600" size={32} />
  <span className="sr-only">로딩 중...</span>
</div>
```

## Healthcare Patterns

### Health Metric Display

```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-sm text-gray-600">혈압</p>
      <p className="text-2xl font-bold text-gray-800" aria-label="혈압 120/80 mmHg">
        120/80
      </p>
    </div>
    <div className="flex items-center gap-2">
      <CheckCircle className="text-success-600" size={20} />
      <span className="text-sm font-medium text-success-700">정상</span>
    </div>
  </div>
  <div className="text-xs text-gray-500" role="note">
    정상 범위: 90-120 / 60-80 mmHg
  </div>
</div>
```

### Dietary Warning

```tsx
<div className="border-l-4 border-warning-600 bg-warning-50 p-4 rounded-r-lg">
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

### Emergency Contact

```tsx
<div className="bg-error-50 border border-error-500 rounded-xl p-6">
  <div className="flex items-center gap-3 mb-4">
    <Phone className="text-error-600" size={24} />
    <h3 className="text-lg font-bold text-error-900">응급 연락처</h3>
  </div>
  <div className="space-y-2 mb-4">
    <p className="text-sm text-error-800 font-medium">응급실: 119</p>
    <p className="text-sm text-error-800 font-medium">병원: 02-1234-5678</p>
  </div>
  <button className="w-full px-6 py-3 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
    <Phone size={20} />
    응급 전화
  </button>
</div>
```

## Accessibility

### Focus States

```tsx
// Always include focus-visible styles
<button className="focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  Button
</button>

<input className="focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20" />

<a href="#" className="focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2">
  Link
</a>
```

### Screen Reader Support

```tsx
// Icon buttons need labels
<button aria-label="삭제">
  <Trash2 size={20} />
</button>

// Hide decorative icons
<div>
  <Heart size={20} aria-hidden="true" />
  <span>건강 기록</span>
</div>

// Loading states
<div role="status" aria-live="polite">
  {loading && '로딩 중...'}
</div>

// Error messages
<div role="alert" className="text-error-600">
  {errorMessage}
</div>
```

### Touch Targets (44x44px minimum)

```tsx
// Icon buttons
<button className="w-11 h-11 flex items-center justify-center">
  <Icon size={20} />
</button>

// Text buttons with padding
<button className="px-6 py-3 min-h-[44px]">
  Button Text
</button>
```

### Color + Icon Pattern

Never use color alone:

```tsx
// Good: Color + icon + text
<div className="flex items-center gap-2 text-error-600">
  <AlertCircle size={16} />
  <span>오류 발생</span>
</div>

// Good: Color + border pattern
<div className="border-l-4 border-warning-600 bg-warning-50 p-4">
  <div className="flex items-center gap-2">
    <AlertTriangle size={20} />
    <span className="font-semibold">주의</span>
  </div>
</div>
```

## Common Recipes

### Modal

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Modal description text
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* Modal content */}
    </div>

    <DialogFooter>
      <button onClick={() => setIsOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl">
        취소
      </button>
      <button onClick={handleSave} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl">
        저장
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Field

```tsx
<div className="space-y-2">
  <label htmlFor="field-id" className="block text-sm font-medium text-gray-700">
    Label <span className="text-error-600" aria-label="필수">*</span>
  </label>

  <input
    id="field-id"
    type="text"
    required
    aria-required="true"
    aria-describedby="field-help"
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
  />

  <p id="field-help" className="text-xs text-gray-500">
    Help text for this field
  </p>
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
    <FileText className="text-gray-400" size={32} />
  </div>
  <h3 className="text-lg font-semibold text-gray-800 mb-2">데이터 없음</h3>
  <p className="text-sm text-gray-600 mb-4">
    아직 기록이 없습니다.
  </p>
  <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl">
    첫 기록 추가
  </button>
</div>
```

## Resources

- **Full Design System**: See `DESIGN_SYSTEM.md`
- **Accessibility Guidelines**: See `ACCESSIBILITY_GUIDELINES.md`
- **Tailwind Config**: `/new_frontend/tailwind.config.js`
- **CSS Variables**: `/new_frontend/src/index.css`

## Quick Checks

Before shipping:

- [ ] All text meets 4.5:1 contrast ratio (use browser DevTools)
- [ ] All buttons are at least 44x44px
- [ ] All interactive elements have focus states
- [ ] All icon buttons have aria-labels
- [ ] All form inputs have labels
- [ ] Color is never the only way to convey information
- [ ] Tested with keyboard navigation (Tab, Enter, Escape)
- [ ] Medical disclaimers are present where needed

---

**Version**: 2.0.0
**Last Updated**: January 2025
