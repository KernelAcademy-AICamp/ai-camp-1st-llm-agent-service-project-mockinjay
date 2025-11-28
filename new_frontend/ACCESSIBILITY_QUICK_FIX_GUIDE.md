# Accessibility Quick Fix Guide

**For Developers**: Copy-paste solutions for common WCAG violations

---

## 🔴 CRITICAL FIXES (Do These First)

### 1. Add Skip Navigation Link

**Where**: Every page (App.tsx, SignupPage.tsx, LoginPage.tsx, etc.)

```tsx
// Add at the very top of your page component
const YourPage = () => {
  return (
    <>
      {/* Skip Link - Must be first focusable element */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
      >
        본문으로 건너뛰기
      </a>

      <div className="page-layout">
        {/* Header, sidebar, etc. */}

        <main id="main-content" tabIndex={-1}>
          {/* Your main content here */}
        </main>
      </div>
    </>
  );
};
```

**Why**: Keyboard users need to skip repetitive navigation
**WCAG**: 2.4.1 Bypass Blocks (Level A)

---

### 2. Label All Icon Buttons

**Before** ❌:
```tsx
<button onClick={handleDelete}>
  <Trash2 size={20} />
</button>
```

**After** ✅:
```tsx
<button onClick={handleDelete} aria-label="삭제">
  <Trash2 size={20} aria-hidden="true" />
</button>
```

**Pattern for toggle buttons**:
```tsx
const [isOpen, setIsOpen] = useState(false);

<button
  onClick={() => setIsOpen(!isOpen)}
  aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
  aria-expanded={isOpen}
>
  {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
</button>
```

**Why**: Screen readers need text alternatives
**WCAG**: 1.1.1 Non-text Content (Level A)

---

### 3. Add Landmark Roles

**Before** ❌:
```tsx
<div className="page">
  <div className="header">...</div>
  <div className="content">...</div>
  <div className="footer">...</div>
</div>
```

**After** ✅:
```tsx
<div className="page">
  <header role="banner">
    <nav aria-label="주 메뉴">...</nav>
  </header>

  <main role="main" id="main-content">
    {/* Page content */}
  </main>

  <footer role="contentinfo">...</footer>
</div>
```

**Why**: Screen readers navigate by landmarks
**WCAG**: 1.3.1 Info and Relationships (Level A)

---

### 4. Fix Custom Checkboxes

**SignupPage.tsx** - CustomCheckbox component fix:

**Before** ❌:
```tsx
const CustomCheckbox = ({ checked, onChange }) => (
  <div className={`w-5 h-5 rounded ${checked ? 'bg-primary' : 'bg-white'}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    {checked && <Check />}
  </div>
);
```

**After** ✅:
```tsx
const CustomCheckbox = ({ checked, onChange, id, ariaLabel }) => (
  <>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
      aria-label={ariaLabel}
    />
    <label
      htmlFor={id}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer
        peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2
        transition-colors
        ${checked ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}
    >
      {checked && <Check size={14} className="text-white" aria-hidden="true" />}
    </label>
  </>
);

// Usage:
<CustomCheckbox
  id="terms-service"
  checked={agreements.service}
  onChange={(e) => handleAgreementChange('service', e.target.checked)}
  ariaLabel="서비스 이용약관 동의"
/>
```

**Why**: Keyboard users need to access visual checkboxes
**WCAG**: 2.1.1 Keyboard (Level A)

---

### 5. Announce Form Errors

**Before** ❌:
```tsx
{emailError && (
  <p className="text-red-500 text-sm">{emailError}</p>
)}
```

**After** ✅:
```tsx
{emailError && (
  <p
    id="email-error"
    role="alert"
    aria-live="assertive"
    className="flex items-center gap-1 text-sm text-error"
  >
    <AlertCircle size={14} aria-hidden="true" />
    {emailError}
  </p>
)}

{/* Associated input */}
<input
  type="email"
  aria-invalid={!!emailError}
  aria-describedby={emailError ? "email-error" : undefined}
  // ...
/>
```

**Why**: Screen readers need to hear error messages immediately
**WCAG**: 3.3.1 Error Identification (Level A)

---

## 🟠 HIGH PRIORITY FIXES

### 6. Accessible Step Indicator

**SignupPage.tsx** - StepIndicator component:

```tsx
const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => (
  <nav aria-label="회원가입 진행 상태">
    <div
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuetext={`4단계 중 ${currentStep + 1}단계: ${steps[currentStep].label}`}
      className="mb-3"
    >
      {/* Visual progress bar */}
      <div className="flex justify-between">
        {steps.map((_, index) => (
          <div key={index} className="flex-1 mx-1">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                index <= currentStep ? 'bg-primary' : 'bg-gray-200'
              }`}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </div>

    {/* Step labels */}
    <ol className="flex justify-between px-1">
      {steps.map((step, index) => (
        <li
          key={index}
          aria-current={index === currentStep ? 'step' : undefined}
          className={`flex items-center gap-1.5 ${
            index <= currentStep ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              index < currentStep
                ? 'bg-primary text-white'
                : index === currentStep
                ? 'bg-primary/20 text-primary border-2 border-primary'
                : 'bg-gray-200 text-gray-500'
            }`}
            aria-hidden="true"
          >
            {index < currentStep ? <Check size={12} /> : index + 1}
          </div>
          <span className="text-[11px] font-medium hidden sm:inline">
            {step.label}
          </span>
        </li>
      ))}
    </ol>

    {/* Current step description */}
    <p className="text-center text-sm text-gray-500 mt-3" aria-live="polite">
      {steps[currentStep].description}
    </p>
  </nav>
);
```

**Why**: Screen readers need to know progress through multi-step forms
**WCAG**: 1.3.1 Info and Relationships (Level A)

---

### 7. Dynamic Page Titles

**Install react-helmet-async**:
```bash
npm install react-helmet-async
```

**App.tsx setup**:
```tsx
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      <Routes>
        {/* Your routes */}
      </Routes>
    </HelmetProvider>
  );
}
```

**SignupPage.tsx**:
```tsx
import { Helmet } from 'react-helmet-async';

const SignupPage = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const stepTitles = [
    '약관 동의',
    '계정 정보',
    '개인 정보',
    '질환 정보'
  ];

  return (
    <>
      <Helmet>
        <title>{stepTitles[currentStep]} - 회원가입 | CareGuide</title>
        <meta
          name="description"
          content="CareGuide 회원가입 페이지입니다. 만성신장병 환자를 위한 건강관리 서비스를 시작하세요."
        />
      </Helmet>

      {/* Page content */}
    </>
  );
};
```

**Why**: Screen reader users identify pages by title
**WCAG**: 2.4.2 Page Titled (Level A)

---

### 8. Fix Heading Hierarchy

**Before** ❌:
```tsx
<div className="page">
  <h2>약관 동의</h2>
  {/* No H1! */}
</div>
```

**After** ✅:
```tsx
<div className="page">
  <h1 className="sr-only">CareGuide 회원가입</h1>
  <h2 className="text-center text-xl font-bold">약관 동의</h2>

  <section>
    <h3>서비스 이용약관</h3>
    {/* Content */}
  </section>
</div>
```

**Full page hierarchy**:
```tsx
<main>
  <h1>Page Title</h1>

  <section>
    <h2>Section 1</h2>
    <h3>Subsection 1.1</h3>
    <h3>Subsection 1.2</h3>
  </section>

  <section>
    <h2>Section 2</h2>
    <h3>Subsection 2.1</h3>
  </section>
</main>
```

**Why**: Screen readers use headings to navigate
**WCAG**: 1.3.1 Info and Relationships (Level A)

---

### 9. Configure Toast Accessibility

**Verify Sonner toast setup** in `App.tsx` or `main.tsx`:

```tsx
import { Toaster } from 'sonner';

<Toaster
  position="top-center"
  toastOptions={{
    // Ensure ARIA attributes
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  }}
/>

// For error toasts, use assertive:
toast.error('Error message', {
  role: 'alert',
  'aria-live': 'assertive',
});

// For success toasts, use polite:
toast.success('Success message', {
  role: 'status',
  'aria-live': 'polite',
});
```

**Why**: Screen readers need to announce status messages
**WCAG**: 4.1.3 Status Messages (Level AA)

---

## 🟡 MEDIUM PRIORITY FIXES

### 10. Hide Decorative Icons

**Pattern**: Add `aria-hidden="true"` to all decorative icons

```tsx
// Decorative icon inside labeled button
<button aria-label="검색">
  <Search size={20} aria-hidden="true" />
</button>

// Icon next to visible text
<div className="flex items-center gap-2">
  <CheckCircle size={16} aria-hidden="true" className="text-success" />
  <span>저장 완료</span>
</div>

// Input prefix icon (decorative)
<div className="relative">
  <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={20} aria-hidden="true" />
  <input type="email" placeholder="이메일" aria-label="이메일 주소" />
</div>
```

**Why**: Reduces screen reader clutter
**WCAG**: 1.1.1 Non-text Content (Level A)

---

### 11. Expand Touch Targets

**Pattern**: Use `.touch-target` utility class

```tsx
// Before: Too small
<button className="w-5 h-5 p-0">
  <X size={16} />
</button>

// After: Minimum 44x44px
<button className="w-5 h-5 p-0 touch-target">
  <X size={16} aria-hidden="true" />
</button>

// Or use explicit sizing
<button className="min-w-touch min-h-touch p-2 flex items-center justify-center">
  <X size={16} aria-hidden="true" />
</button>
```

**In Tailwind config** (already configured):
```javascript
minHeight: {
  'touch': '44px',      // iOS minimum
  'touch-android': '48px',  // Android Material minimum
},
minWidth: {
  'touch': '44px',
  'touch-android': '48px',
},
```

**Why**: Mobile users with motor impairments need larger tap areas
**WCAG**: 2.5.5 Target Size (Level AAA, but healthcare best practice)

---

### 12. Add Autocomplete Attributes

**SignupPage.tsx form inputs**:

```tsx
// Email
<input
  type="email"
  autoComplete="email"
  name="email"
  id="email"
  aria-label="이메일 주소"
  // ...
/>

// Password
<input
  type="password"
  autoComplete="new-password"
  name="password"
  id="password"
  aria-label="비밀번호"
  // ...
/>

// Nickname
<input
  type="text"
  autoComplete="username"
  name="nickname"
  id="nickname"
  aria-label="닉네임"
  // ...
/>

// Birth date
<input
  type="date"
  autoComplete="bday"
  name="birthDate"
  id="birthDate"
  aria-label="생년월일"
  // ...
/>

// Gender
<select
  autoComplete="sex"
  name="gender"
  id="gender"
  aria-label="성별"
>
  <option value="">선택</option>
  <option value="male">남성</option>
  <option value="female">여성</option>
  <option value="other">기타</option>
</select>
```

**Full autocomplete reference**:
- `name`: Full name
- `given-name`: First name
- `family-name`: Last name
- `email`: Email address
- `username`: Username
- `new-password`: New password (signup)
- `current-password`: Current password (login)
- `bday`: Birth date
- `sex`: Gender
- `tel`: Phone number
- `street-address`: Street address
- `postal-code`: ZIP/postal code

**Why**: Helps users with cognitive disabilities and improves UX
**WCAG**: 1.3.5 Identify Input Purpose (Level AA)

---

## Testing Checklist

### Before Committing Code

**Keyboard Test** (2 minutes):
```
1. Unplug your mouse
2. Tab through the entire page
3. Press Enter/Space on all buttons
4. Press Escape on modals
5. Verify you can complete all tasks
```

**Screen Reader Test** (5 minutes):
```
Windows (NVDA):
1. Download NVDA (free): https://www.nvaccess.org/
2. Press Ctrl+Alt+N to start
3. Navigate your page with Tab and arrow keys
4. Listen - do all elements make sense?

macOS (VoiceOver):
1. Press Cmd+F5 to start VoiceOver
2. Press VO+A (VO = Ctrl+Option) to start reading
3. Use Tab and VO+arrow keys to navigate
```

**Automated Test** (30 seconds):
```bash
# Install if needed
npm install --save-dev @axe-core/react

# Add to your component test
import { axe } from 'jest-axe';

test('no accessibility violations', async () => {
  const { container } = render(<SignupPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Common Patterns

### Loading States

```tsx
const [isLoading, setIsLoading] = useState(false);

// Accessible loading button
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="animate-spin" size={20} aria-hidden="true" />
      <span className="sr-only">저장 중...</span>
      저장 중
    </>
  ) : (
    '저장하기'
  )}
</button>

// Loading page content
{isLoading ? (
  <div role="status" aria-live="polite" className="flex justify-center py-12">
    <Loader2 className="animate-spin" size={32} aria-hidden="true" />
    <span className="sr-only">콘텐츠를 불러오는 중입니다...</span>
  </div>
) : (
  <div>{content}</div>
)}
```

---

### Modal Dialogs

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const [isOpen, setIsOpen] = useState(false);

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle>모달 제목</DialogTitle>
    </DialogHeader>

    <div id="dialog-description">
      <p>모달 내용</p>
    </div>

    <div className="flex gap-2 justify-end">
      <button onClick={() => setIsOpen(false)}>취소</button>
      <button onClick={handleConfirm}>확인</button>
    </div>
  </DialogContent>
</Dialog>
```

---

### Empty States

```tsx
// Accessible empty state
<div role="status" className="text-center py-12">
  <Inbox size={48} className="mx-auto text-gray-400" aria-hidden="true" />
  <p className="mt-4 text-gray-600">
    아직 항목이 없습니다
  </p>
  <button className="mt-4 btn-primary">
    새 항목 추가
  </button>
</div>
```

---

### Form Groups

```tsx
// Accessible form group
<fieldset>
  <legend className="text-sm font-medium mb-2">성별 선택</legend>

  <div className="space-y-2">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="gender"
        value="male"
        checked={gender === 'male'}
        onChange={(e) => setGender(e.target.value)}
      />
      <span>남성</span>
    </label>

    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="gender"
        value="female"
        checked={gender === 'female'}
        onChange={(e) => setGender(e.target.value)}
      />
      <span>여성</span>
    </label>
  </div>
</fieldset>
```

---

## Quick Reference

### ARIA Attributes Cheat Sheet

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `aria-label` | Name for element | `<button aria-label="닫기">` |
| `aria-labelledby` | ID of labeling element | `<div aria-labelledby="heading-id">` |
| `aria-describedby` | ID of description | `<input aria-describedby="help-text">` |
| `aria-hidden` | Hide from screen readers | `<Icon aria-hidden="true" />` |
| `aria-live` | Announce changes | `<div aria-live="polite">` |
| `aria-invalid` | Mark invalid input | `<input aria-invalid="true">` |
| `aria-required` | Mark required field | `<input aria-required="true">` |
| `aria-expanded` | Toggle state | `<button aria-expanded="true">` |
| `aria-current` | Current item | `<a aria-current="page">` |
| `aria-busy` | Loading state | `<div aria-busy="true">` |

### Role Attribute Cheat Sheet

| Role | Purpose | Example |
|------|---------|---------|
| `main` | Main content | `<main role="main">` |
| `banner` | Site header | `<header role="banner">` |
| `contentinfo` | Site footer | `<footer role="contentinfo">` |
| `navigation` | Nav section | `<nav role="navigation">` |
| `search` | Search form | `<form role="search">` |
| `status` | Status update | `<div role="status">` |
| `alert` | Important message | `<div role="alert">` |
| `dialog` | Modal dialog | `<div role="dialog">` |
| `progressbar` | Progress indicator | `<div role="progressbar">` |
| `tablist` | Tab container | `<div role="tablist">` |

---

## Resources

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Patterns**: https://www.w3.org/WAI/ARIA/apg/
- **React Accessibility**: https://react.dev/learn/accessibility
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **NVDA Screen Reader**: https://www.nvaccess.org/

---

**Last Updated**: January 28, 2025
**Questions?** Check `/new_frontend/ACCESSIBILITY_AUDIT_REPORT.md` for full details
