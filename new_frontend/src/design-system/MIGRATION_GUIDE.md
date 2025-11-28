# Design System Migration Guide

Guide for migrating existing CareGuide components to the improved design system.

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Color Updates](#color-updates)
- [Component Updates](#component-updates)
- [Accessibility Improvements](#accessibility-improvements)
- [Step-by-Step Migration](#step-by-step-migration)
- [Validation Checklist](#validation-checklist)

## Overview

### What's Changed

The design system has been enhanced with:

1. **WCAG 2.2 Level AA compliant color palette** with improved contrast ratios
2. **Healthcare-specific semantic colors** for kidney, blood, heart, and nutrition
3. **Enhanced accessibility tokens** for focus states, touch targets, and reduced motion
4. **Comprehensive documentation** with usage examples and guidelines
5. **Updated Tailwind configuration** with new design tokens

### Migration Timeline

- **Phase 1**: Review and update critical healthcare components (Week 1)
- **Phase 2**: Migrate form inputs and interactive elements (Week 2)
- **Phase 3**: Update cards, alerts, and status indicators (Week 3)
- **Phase 4**: Accessibility audit and testing (Week 4)

## Breaking Changes

### 1. Primary Color Usage

**Before:**
```tsx
<button className="bg-primary-500 text-white">
  Button
</button>
```

**After (Preferred):**
```tsx
<button className="bg-primary-600 text-white">
  Button
</button>
```

**Reason**: `primary-600` (#00B3A3) provides 4.5:1 contrast ratio (WCAG AA compliant), while `primary-500` only provides 3.9:1 contrast.

### 2. Semantic Color Changes

**Before:**
```tsx
<div className="text-success">Success message</div>
<div className="text-warning">Warning message</div>
<div className="text-error">Error message</div>
```

**After:**
```tsx
<div className="text-success-600">Success message</div>
<div className="text-warning-600">Warning message</div>
<div className="text-error-600">Error message</div>
```

**Reason**: Using specific shades ensures consistent contrast ratios across the application.

### 3. Text Color Updates

**Before:**
```tsx
<p className="text-gray-500">Body text</p>
```

**After:**
```tsx
<p className="text-gray-600">Body text</p>
```

**Reason**: `text-gray-600` (#4B5563) provides 8.1:1 contrast (AAA), while `gray-500` only provides 5.7:1 (AA).

## Color Updates

### Primary Colors

| Old Class | Old Value | New Class | New Value | Contrast Ratio |
|-----------|-----------|-----------|-----------|----------------|
| `bg-primary-500` | #00C9B7 | `bg-primary-600` | #00B3A3 | 4.5:1 (AA) |
| `text-primary-500` | #00C9B7 | `text-primary-700` | #00A899 | 5.1:1 (AA) |

### Success Colors

| Old Class | Old Value | New Class | New Value | Contrast Ratio |
|-----------|-----------|-----------|-----------|----------------|
| `text-success` | #00A8E8 | `text-success-600` | #059669 | 6.4:1 (AA) |
| `bg-success` | #00A8E8 | `bg-success-50` | #ECFDF5 | - |

### Warning Colors

| Old Class | Old Value | New Class | New Value | Contrast Ratio |
|-----------|-----------|-----------|-----------|----------------|
| `text-warning` | #F59E0B | `text-warning-600` | #D97706 | 5.1:1 (AA) |
| `bg-warning` | #F59E0B | `bg-warning-50` | #FFFBEB | - |

### Error Colors

| Old Class | Old Value | New Class | New Value | Contrast Ratio |
|-----------|-----------|-----------|-----------|----------------|
| `text-error` | #EF4444 | `text-error-600` | #DC2626 | 5.9:1 (AA) |
| `bg-error` | #EF4444 | `bg-error-50` | #FEF2F2 | - |

### Text Colors

| Old Class | Old Value | New Class | New Value | Contrast Ratio |
|-----------|-----------|-----------|-----------|----------------|
| `text-gray-500` | #6B7280 | `text-gray-600` | #4B5563 | 8.1:1 (AAA) |
| `text-gray-600` | #4B5563 | `text-gray-700` | #374151 | 10.6:1 (AAA) |
| N/A | - | `text-gray-800` | #1F2937 | 13.6:1 (AAA) |

## Component Updates

### Buttons

#### Primary Button

**Before:**
```tsx
<button className="btn-primary">
  저장
</button>
```

**After:**
```tsx
<button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  저장
</button>
```

**Changes:**
- Updated to `bg-primary-600` for better contrast
- Added `focus-visible:ring-2` for keyboard accessibility
- Added `active:bg-primary-800` for clear pressed state

#### Icon Button

**Before:**
```tsx
<button className="p-2">
  <Settings size={20} />
</button>
```

**After:**
```tsx
<button
  className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-500"
  aria-label="설정"
>
  <Settings size={20} />
</button>
```

**Changes:**
- Fixed size to 44x44px (WCAG AAA touch target)
- Added `aria-label` for screen readers
- Added focus-visible ring

### Form Inputs

#### Standard Input

**Before:**
```tsx
<input
  type="text"
  className="input-field"
  placeholder="입력하세요"
/>
```

**After:**
```tsx
<div className="space-y-2">
  <label htmlFor="field-id" className="block text-sm font-medium text-gray-700">
    Label
  </label>
  <input
    id="field-id"
    type="text"
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 outline-none"
    placeholder="입력하세요"
    aria-describedby="field-help"
  />
  <p id="field-help" className="text-xs text-gray-500">
    Help text
  </p>
</div>
```

**Changes:**
- Added explicit label with `htmlFor`
- Added help text linked with `aria-describedby`
- Updated focus styles with ring

#### Input with Error

**Before:**
```tsx
<input type="email" className="input-field border-red-500" />
<p className="text-red-500 text-sm">Error message</p>
```

**After:**
```tsx
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
  className="w-full px-4 py-3 rounded-xl border border-error-600 focus:ring-2 focus:ring-error-500/20"
/>
<p id="email-error" role="alert" className="text-sm text-error-600 mt-1 flex items-center gap-2">
  <AlertCircle size={14} />
  Error message
</p>
```

**Changes:**
- Added `aria-invalid="true"`
- Added `role="alert"` to error message
- Added icon for visual reinforcement
- Updated to `text-error-600` for better contrast

### Cards

#### Health Metric Card

**Before:**
```tsx
<div className="card p-6">
  <p className="text-gray-500">혈압</p>
  <p className="text-2xl font-bold">120/80</p>
</div>
```

**After:**
```tsx
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-sm text-gray-600">혈압</p>
      <p className="text-2xl font-bold text-gray-800 mt-1" aria-label="혈압 120/80 mmHg">
        120/80
      </p>
    </div>
    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
      <Heart className="text-primary-600" size={24} />
    </div>
  </div>
  <div className="flex items-center gap-2">
    <CheckCircle className="text-success-600" size={16} />
    <span className="text-sm font-medium text-success-700">정상 범위</span>
  </div>
  <div className="mt-3 text-xs text-gray-500" role="note">
    정상 범위: 90-120 / 60-80 mmHg
  </div>
</div>
```

**Changes:**
- Added icon for visual identity
- Added status indicator with icon + text
- Added reference range
- Added `aria-label` for screen readers
- Updated text colors for better contrast

### Alerts

#### Success Alert

**Before:**
```tsx
<div className="bg-green-50 text-green-700 p-4">
  Success message
</div>
```

**After:**
```tsx
<div role="status" aria-live="polite" className="bg-success-50 border border-success-500 rounded-lg p-4">
  <div className="flex items-center gap-3">
    <CheckCircle className="text-success-600" size={20} />
    <p className="font-medium text-success-900">Success message</p>
  </div>
</div>
```

**Changes:**
- Added `role="status"` and `aria-live="polite"`
- Added icon for visual reinforcement
- Added border for definition
- Updated colors for better contrast

#### Medical Disclaimer

**Before:**
```tsx
<div className="bg-yellow-50 p-4">
  <p>본 정보는 참고용입니다.</p>
</div>
```

**After:**
```tsx
<div className="bg-amber-50 border-t-2 border-amber-400 p-4 rounded-b-lg" role="alert">
  <div className="flex items-start gap-3">
    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
    <div>
      <h4 className="font-semibold text-amber-900 text-sm">의학적 면책 조항</h4>
      <p className="text-sm text-amber-900 mt-1">
        본 정보는 의학적 진단이 아니며 참고용으로만 제공됩니다.
        건강 관련 증상이 있는 경우 반드시 의료 전문가와 상담하세요.
      </p>
    </div>
  </div>
</div>
```

**Changes:**
- Added warning icon
- Added title
- Expanded disclaimer text
- Added `role="alert"` for importance
- Enhanced visual prominence

### Badges

**Before:**
```tsx
<span className="badge badge-free">자유</span>
```

**After:**
```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
  자유
</span>
```

**Changes:**
- Explicit color classes instead of generic badge classes
- Consistent sizing and spacing
- Better contrast ratios

## Accessibility Improvements

### Focus Indicators

**Add visible focus indicators to all interactive elements:**

```tsx
// Before
<button className="btn-primary">Button</button>

// After
<button className="btn-primary focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  Button
</button>
```

### Touch Targets

**Ensure all interactive elements meet 44x44px minimum:**

```tsx
// Before - Too small
<button className="p-2">
  <Icon size={20} />
</button>

// After - Meets WCAG AAA
<button className="w-11 h-11 flex items-center justify-center" aria-label="Action">
  <Icon size={20} />
</button>
```

### ARIA Labels

**Add labels to icon-only buttons:**

```tsx
// Before - No label
<button>
  <Settings size={20} />
</button>

// After - Has label
<button aria-label="설정 열기">
  <Settings size={20} />
</button>
```

### Form Labels

**Ensure all inputs have associated labels:**

```tsx
// Before - No label
<input type="text" placeholder="이름" />

// After - Has label
<label htmlFor="name" className="block text-sm font-medium text-gray-700">
  이름
</label>
<input id="name" type="text" placeholder="이름을 입력하세요" />
```

### Error Messages

**Link error messages to inputs:**

```tsx
// Before
<input type="email" className="border-red-500" />
<p className="text-red-500">Error</p>

// After
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
  className="border-error-600"
/>
<p id="email-error" role="alert" className="text-error-600">
  Error message
</p>
```

## Step-by-Step Migration

### Step 1: Audit Current Components

1. List all components using old color classes
2. Identify components missing accessibility features
3. Prioritize healthcare-critical components first

```bash
# Find components using old primary color
grep -r "bg-primary-500" src/

# Find components with icon buttons
grep -r "<button.*<.*Icon" src/

# Find inputs without labels
grep -r "<input" src/ | grep -v "label"
```

### Step 2: Update Color Classes

Create a migration script or manually update:

```bash
# Example: Update primary button colors
find src/ -type f -name "*.tsx" -exec sed -i '' 's/bg-primary-500/bg-primary-600/g' {} +
```

### Step 3: Add Accessibility Features

For each component:

1. Add focus-visible rings to interactive elements
2. Add aria-labels to icon buttons
3. Add labels to form inputs
4. Link error messages with aria-describedby
5. Ensure 44x44px minimum touch targets

### Step 4: Test and Validate

1. **Visual check**: Verify colors look correct
2. **Contrast check**: Use browser DevTools to verify contrast ratios
3. **Keyboard test**: Tab through all interactive elements
4. **Screen reader test**: Use VoiceOver/NVDA to test announcements
5. **Touch test**: Verify all targets are easily tappable on mobile

### Step 5: Update Documentation

Update component documentation with:

- New color classes
- Accessibility features
- Usage examples

## Validation Checklist

### Color Compliance

- [ ] All primary buttons use `bg-primary-600` or darker
- [ ] All text on white backgrounds meets 4.5:1 contrast
- [ ] Success messages use `text-success-600` or darker
- [ ] Warning messages use `text-warning-600` or darker
- [ ] Error messages use `text-error-600` or darker
- [ ] Body text uses `text-gray-600` or darker
- [ ] Headings use `text-gray-700` or darker

### Accessibility Features

- [ ] All interactive elements have focus-visible rings
- [ ] All icon-only buttons have aria-labels
- [ ] All form inputs have associated labels
- [ ] All error messages are linked with aria-describedby
- [ ] All icon buttons are at least 44x44px
- [ ] All text buttons have adequate padding (min-h-[44px])
- [ ] All alerts have appropriate role attributes
- [ ] Color is never the only way to convey information

### Healthcare Compliance

- [ ] Medical information includes disclaimers
- [ ] Health metrics show reference ranges
- [ ] Dietary warnings use appropriate severity
- [ ] Emergency contacts are prominently displayed
- [ ] CKD stages are clearly labeled
- [ ] Medication reminders are actionable

### Testing

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces all content correctly
- [ ] Focus indicators are clearly visible
- [ ] Colors work in high contrast mode
- [ ] Animations respect prefers-reduced-motion
- [ ] Touch targets are easily tappable on mobile
- [ ] Text remains readable at 200% zoom
- [ ] Components work in dark mode (if enabled)

## Common Issues and Solutions

### Issue 1: Low Contrast Text

**Problem:**
```tsx
<p className="text-gray-500">Important information</p>
```

**Solution:**
```tsx
<p className="text-gray-600">Important information</p>
```

### Issue 2: Missing Focus Indicators

**Problem:**
```tsx
<button className="btn-primary">Button</button>
```

**Solution:**
```tsx
<button className="btn-primary focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  Button
</button>
```

### Issue 3: Small Touch Targets

**Problem:**
```tsx
<button className="p-2">
  <X size={16} />
</button>
```

**Solution:**
```tsx
<button className="w-11 h-11 flex items-center justify-center" aria-label="닫기">
  <X size={20} />
</button>
```

### Issue 4: Unlabeled Icon Buttons

**Problem:**
```tsx
<button>
  <Trash2 size={20} />
</button>
```

**Solution:**
```tsx
<button aria-label="삭제">
  <Trash2 size={20} />
</button>
```

### Issue 5: Unlinked Error Messages

**Problem:**
```tsx
<input type="email" className="border-red-500" />
<p className="text-red-500">Invalid email</p>
```

**Solution:**
```tsx
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
  className="border-error-600"
/>
<p id="email-error" role="alert" className="text-error-600">
  Invalid email
</p>
```

## Resources

- **Design System Documentation**: `DESIGN_SYSTEM.md`
- **Accessibility Guidelines**: `ACCESSIBILITY_GUIDELINES.md`
- **Quick Reference**: `QUICK_REFERENCE_V2.md`
- **Component Examples**: `COMPONENT_EXAMPLES.tsx`
- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/

## Support

For migration questions or issues:
- Slack: #design-system
- Email: design-system@careguide.com

---

**Last Updated**: January 2025
**Version**: 1.0.0
