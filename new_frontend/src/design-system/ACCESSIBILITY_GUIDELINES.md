# CareGuide Accessibility Guidelines

WCAG 2.2 Level AA Compliance for Healthcare Applications

## Table of Contents

- [Overview](#overview)
- [Color & Contrast](#color--contrast)
- [Typography](#typography)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Readers](#screen-readers)
- [Touch Targets](#touch-targets)
- [Focus Management](#focus-management)
- [Forms & Inputs](#forms--inputs)
- [Error Handling](#error-handling)
- [Medical Content](#medical-content)
- [Testing Checklist](#testing-checklist)

## Overview

CareGuide serves CKD patients, including elderly users and those with various accessibility needs. All interfaces must meet or exceed WCAG 2.2 Level AA standards.

### Key Principles

1. **Perceivable**: Content must be presentable in ways users can perceive
2. **Operable**: UI components must be operable by all users
3. **Understandable**: Information must be understandable
4. **Robust**: Content must work with assistive technologies

### Target Audience Considerations

- **Elderly users**: Larger text, high contrast, clear language
- **Low vision**: Screen magnification support, high contrast mode
- **Color blindness**: Never use color alone to convey information
- **Motor impairments**: Large touch targets, keyboard navigation
- **Screen reader users**: Semantic HTML, ARIA labels

## Color & Contrast

### Contrast Ratios (WCAG AA)

#### Text Contrast

| Text Size | Minimum Ratio | CareGuide Standard |
|-----------|---------------|-------------------|
| Normal text (< 18px) | 4.5:1 | Use `text-gray-700` or darker |
| Large text (≥ 18px or bold ≥ 14px) | 3:1 | Use `text-gray-600` or darker |
| UI components | 3:1 | Borders, icons, interactive elements |

#### CareGuide Approved Color Combinations

```tsx
// Primary text on white background
<p className="text-gray-800">Primary content (13.6:1 contrast - AAA)</p>
<p className="text-gray-700">Body text (10.6:1 contrast - AAA)</p>
<p className="text-gray-600">Secondary text (8.1:1 contrast - AAA)</p>
<p className="text-gray-500">Tertiary text (5.7:1 contrast - AA)</p>

// Interactive elements
<button className="bg-primary-600 text-white">
  Button (4.5:1 contrast - AA)
</button>

<a href="#" className="text-primary-700">
  Link (5.1:1 contrast - AA)
</a>

// Semantic colors (on white)
<div className="text-success-600">Success message (6.4:1 - AA)</div>
<div className="text-warning-600">Warning message (5.1:1 - AA)</div>
<div className="text-error-600">Error message (5.9:1 - AA)</div>
<div className="text-info-600">Info message (6.3:1 - AA)</div>
```

### Color Independence

Never use color alone to convey information. Always pair with:

```tsx
// Bad: Color only
<span className="text-error-600">High risk</span>

// Good: Color + icon
<span className="text-error-600 flex items-center gap-2">
  <AlertTriangle size={16} />
  High risk
</span>

// Good: Color + text
<div className="text-error-600 font-medium">
  위험: 혈압이 정상 범위를 초과했습니다
</div>

// Good: Color + pattern
<div className="border-l-4 border-error-600 bg-error-50 p-4">
  <div className="flex items-center gap-2">
    <AlertCircle className="text-error-600" />
    <span className="font-semibold">주의 필요</span>
  </div>
  <p className="mt-1 text-sm">혈압이 정상 범위를 벗어났습니다.</p>
</div>
```

### High Contrast Mode

Support users who enable high contrast mode:

```css
@media (prefers-contrast: high) {
  :root {
    /* Increase contrast for primary colors */
    --color-primary: #00A899;  /* Darker teal */
    --color-text-secondary: #374151;  /* Darker gray */
    --color-line-medium: #D1D5DB;  /* Stronger borders */
  }

  /* Strengthen borders */
  .border {
    border-width: 2px;
  }
}
```

## Typography

### Font Sizes

Minimum 16px for body text (elderly users benefit from larger text):

```tsx
// Base text sizes
<p className="text-base">Body text (16px minimum)</p>
<p className="text-lg">Large body (18px)</p>
<p className="text-sm">Small text (14px - use sparingly)</p>

// Headings
<h1 className="text-3xl md:text-4xl font-bold">Page title (30-36px)</h1>
<h2 className="text-2xl font-bold">Section title (24px)</h2>
<h3 className="text-xl font-semibold">Subsection (20px)</h3>
<h4 className="text-lg font-semibold">Card title (18px)</h4>
```

### Line Height & Spacing

```tsx
// Body text
<p className="text-base leading-relaxed">
  Comfortable reading with 1.625 line height
</p>

// Long-form content
<article className="text-base leading-loose">
  Extra space for easier reading (2.0 line height)
</article>

// Paragraph spacing
<div className="space-y-4">
  <p>First paragraph</p>
  <p>Second paragraph (16px gap)</p>
</div>
```

### Text Zoom Support

Support 200% text zoom without loss of content:

```tsx
// Use relative units
<div className="p-4">  {/* 16px padding */}
  <p className="text-base">Text scales properly</p>
</div>

// Avoid fixed heights on text containers
<div className="min-h-[100px]"> {/* min-height, not height */}
  <p>Content can expand when text is zoomed</p>
</div>

// Use max-width for readability
<div className="max-w-2xl"> {/* 672px max width */}
  <p>45-75 characters per line for optimal reading</p>
</div>
```

## Keyboard Navigation

All interactive elements must be keyboard accessible.

### Tab Order

Ensure logical tab order through the page:

```tsx
// Use semantic HTML for natural tab order
<nav>
  <a href="/">Home</a>  {/* Tab 1 */}
  <a href="/chat">Chat</a>  {/* Tab 2 */}
  <a href="/diet">Diet</a>  {/* Tab 3 */}
</nav>

// Avoid tabindex > 0 (disrupts natural order)
// Bad
<button tabIndex={5}>Button</button>

// Good: Let natural order work
<button>Button</button>

// Remove from tab order when hidden
<button
  className={isHidden ? "hidden" : ""}
  tabIndex={isHidden ? -1 : 0}
>
  Conditional button
</button>
```

### Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| Tab | Move to next focusable | All pages |
| Shift + Tab | Move to previous focusable | All pages |
| Enter / Space | Activate button | Buttons |
| Escape | Close modal/dialog | Modals, dropdowns |
| Arrow keys | Navigate menu items | Menus, lists |
| Home / End | First / last item | Lists |

### Skip Links

Provide skip-to-content links for keyboard users:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-white"
>
  본문으로 건너뛰기
</a>

<main id="main-content" tabIndex={-1}>
  {/* Main content */}
</main>
```

## Screen Readers

### Semantic HTML

Use semantic HTML elements:

```tsx
// Good: Semantic HTML
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>
<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>
<footer>
  <p>Footer content</p>
</footer>

// Bad: Generic divs
<div>
  <div>
    <span onClick={handleClick}>Home</span>
  </div>
</div>
```

### ARIA Labels

Provide descriptive labels for interactive elements:

```tsx
// Icon buttons need labels
<button aria-label="혈압 기록 삭제">
  <Trash2 size={20} />
</button>

// Decorative icons should be hidden
<div>
  <Heart size={20} aria-hidden="true" />
  <span>건강 기록</span>
</div>

// Complex widgets need roles
<div
  role="tablist"
  aria-label="식단 관리 탭"
>
  <button
    role="tab"
    aria-selected={activeTab === 'breakfast'}
    aria-controls="breakfast-panel"
  >
    아침
  </button>
</div>

<div
  id="breakfast-panel"
  role="tabpanel"
  aria-labelledby="breakfast-tab"
>
  {/* Breakfast content */}
</div>
```

### Live Regions

Announce dynamic content changes:

```tsx
// Polite announcements (not urgent)
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive announcements (important)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Example: Form submission
const [message, setMessage] = useState('');

const handleSubmit = async () => {
  setMessage('저장 중...');
  await saveData();
  setMessage('저장 완료');
};

return (
  <>
    <button onClick={handleSubmit}>저장</button>
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  </>
);
```

### Loading States

Announce loading states to screen readers:

```tsx
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && (
    <>
      <Loader2 className="animate-spin" size={20} />
      <span className="sr-only">저장 중...</span>
    </>
  )}
  {isLoading ? '저장 중' : '저장하기'}
</button>
```

## Touch Targets

### Minimum Size (WCAG AAA)

All interactive elements must be at least 44x44px:

```tsx
// Icon buttons
<button className="w-11 h-11 flex items-center justify-center rounded-lg">
  <Settings size={20} />
</button>

// Text buttons have adequate padding
<button className="px-6 py-3 min-h-[44px]">
  Button Text
</button>

// Links in body text
<a href="#" className="inline-block py-1">
  Link text (vertical padding ensures touch target)
</a>

// Checkbox/radio (wrapped in label for larger area)
<label className="flex items-center gap-3 py-2 cursor-pointer">
  <input type="checkbox" className="w-5 h-5" />
  <span>Option label</span>
</label>
```

### Spacing Between Targets

Maintain adequate spacing between touch targets:

```tsx
// Button groups with spacing
<div className="flex gap-3">
  <button className="btn-primary">Primary</button>
  <button className="btn-secondary">Secondary</button>
</div>

// List items with spacing
<ul className="space-y-2">
  <li><button className="w-full text-left p-3">Item 1</button></li>
  <li><button className="w-full text-left p-3">Item 2</button></li>
</ul>
```

## Focus Management

### Visible Focus Indicators

Always show focus indicators:

```tsx
// Primary button with focus
<button className="btn-primary focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  Button
</button>

// Input with focus
<input
  className="input-field focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
  type="text"
/>

// Link with focus
<a
  href="#"
  className="text-primary-700 hover:text-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 focus-visible:rounded"
>
  Link text
</a>

// Custom focus styles
<div
  tabIndex={0}
  className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
>
  Custom focusable element
</div>
```

### Focus Trap in Modals

Trap focus within modal dialogs:

```tsx
import { Dialog } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {/* Focus automatically trapped here */}
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>

    <div>
      <input type="text" autoFocus />
      <button>Save</button>
      <button onClick={() => setIsOpen(false)}>Cancel</button>
    </div>
  </DialogContent>
</Dialog>
```

### Focus Restoration

Restore focus after interactions:

```tsx
const triggerRef = useRef<HTMLButtonElement>(null);

const handleDelete = () => {
  deleteItem();
  // Restore focus to trigger button
  triggerRef.current?.focus();
};

return (
  <>
    <button ref={triggerRef}>Delete</button>
    <ConfirmDialog onConfirm={handleDelete} />
  </>
);
```

## Forms & Inputs

### Form Labels

Every input must have an associated label:

```tsx
// Good: Explicit label
<div className="space-y-2">
  <label htmlFor="blood-pressure" className="block text-sm font-medium">
    혈압 (mmHg)
  </label>
  <input
    id="blood-pressure"
    type="number"
    className="input-field"
  />
</div>

// Good: aria-label for icon-only buttons
<button aria-label="검색">
  <Search size={20} />
</button>

// Bad: No label
<input type="text" placeholder="Enter name" />
```

### Help Text & Instructions

Provide clear instructions and help text:

```tsx
<div className="space-y-2">
  <label htmlFor="password" className="block text-sm font-medium">
    비밀번호
  </label>

  <input
    id="password"
    type="password"
    className="input-field"
    aria-describedby="password-requirements"
  />

  <p id="password-requirements" className="text-sm text-gray-600">
    8자 이상, 대문자, 소문자, 숫자 포함
  </p>
</div>
```

### Required Fields

Clearly indicate required fields:

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium">
    이메일 <span className="text-error-600" aria-label="필수">*</span>
  </label>

  <input
    id="email"
    type="email"
    required
    aria-required="true"
    className="input-field"
  />
</div>
```

### Input Validation

Provide clear, accessible validation messages:

```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const validate = () => {
  if (!email.includes('@')) {
    setError('유효한 이메일 주소를 입력하세요');
    return false;
  }
  setError('');
  return true;
};

return (
  <div className="space-y-2">
    <label htmlFor="email">이메일</label>

    <input
      id="email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onBlur={validate}
      aria-invalid={!!error}
      aria-describedby={error ? 'email-error' : undefined}
      className={`input-field ${error ? 'border-error-600 focus:ring-error-500/20' : ''}`}
    />

    {error && (
      <div
        id="email-error"
        role="alert"
        className="flex items-center gap-2 text-sm text-error-600"
      >
        <AlertCircle size={16} />
        {error}
      </div>
    )}
  </div>
);
```

## Error Handling

### Error Messages

Display errors clearly with multiple cues:

```tsx
// Form-level error
<div role="alert" className="bg-error-50 border border-error-500 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="text-error-600 shrink-0" size={20} />
    <div>
      <h3 className="font-semibold text-error-900">오류가 발생했습니다</h3>
      <p className="text-sm text-error-800 mt-1">
        다음 필드를 확인해주세요:
      </p>
      <ul className="list-disc list-inside mt-2 text-sm text-error-800">
        <li>이메일 형식이 올바르지 않습니다</li>
        <li>비밀번호는 8자 이상이어야 합니다</li>
      </ul>
    </div>
  </div>
</div>

// Inline field error
<div>
  <input
    aria-invalid="true"
    aria-describedby="field-error"
    className="input-field border-error-600"
  />
  <p id="field-error" role="alert" className="text-sm text-error-600 mt-1">
    <AlertCircle size={14} className="inline mr-1" />
    이 필드는 필수입니다
  </p>
</div>
```

### Success Feedback

Confirm successful actions:

```tsx
// Toast notification
<div role="status" className="bg-success-50 border border-success-500 rounded-lg p-4">
  <div className="flex items-center gap-3">
    <CheckCircle className="text-success-600" size={20} />
    <p className="font-medium text-success-900">저장 완료</p>
  </div>
</div>

// Inline confirmation
<div
  role="status"
  aria-live="polite"
  className="flex items-center gap-2 text-success-600"
>
  <CheckCircle size={16} />
  <span>변경사항이 저장되었습니다</span>
</div>
```

## Medical Content

### Disclaimers

Always display medical disclaimers prominently:

```tsx
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';

// Medical information page
<DisclaimerBanner
  message="본 정보는 의학적 진단이 아니며 참고용입니다. 증상이 있는 경우 반드시 의료진과 상담하세요."
  position="bottom"
  dismissible={false}
  role="alert"
  aria-label="의학적 면책 조항"
/>

// AI chat response
<div role="article" aria-label="AI 응답">
  <p>{aiResponse}</p>

  <div className="mt-4 p-3 bg-warning-50 border border-warning-500 rounded-lg">
    <div className="flex gap-2">
      <AlertTriangle className="text-warning-600 shrink-0" size={16} />
      <p className="text-xs text-warning-800">
        이 답변은 의학적 조언이 아닙니다. 건강 문제는 의사와 상담하세요.
      </p>
    </div>
  </div>
</div>
```

### Health Metrics

Display health data with context:

```tsx
<div className="space-y-4">
  {/* Metric with range */}
  <div className="bg-white rounded-xl border p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">혈압</p>
        <p className="text-2xl font-bold text-gray-900" aria-label="혈압 120/80 mmHg">
          120/80
        </p>
      </div>
      <div className="flex items-center gap-2 text-success-600">
        <CheckCircle size={20} />
        <span className="font-medium">정상</span>
      </div>
    </div>

    <div className="mt-3 text-xs text-gray-500" role="note">
      정상 범위: 90-120 / 60-80 mmHg
    </div>
  </div>

  {/* Out-of-range metric */}
  <div
    className="bg-warning-50 border border-warning-500 rounded-xl p-4"
    role="alert"
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-warning-600 shrink-0" size={20} />
      <div className="flex-1">
        <p className="text-sm font-medium text-warning-900">
          혈압이 정상 범위를 초과했습니다
        </p>
        <p className="text-sm text-warning-800 mt-1">
          의료진과 상담을 권장합니다
        </p>
      </div>
    </div>
  </div>
</div>
```

## Testing Checklist

### Manual Testing

- [ ] **Keyboard navigation**: Can you reach all interactive elements with Tab?
- [ ] **Focus indicators**: Are focus states visible on all elements?
- [ ] **Skip links**: Do skip links work and are they visible on focus?
- [ ] **Zoom to 200%**: Is content still readable and functional?
- [ ] **Color contrast**: Do all text colors meet contrast requirements?
- [ ] **Color independence**: Is information conveyed without color alone?

### Screen Reader Testing

Test with:
- **macOS**: VoiceOver (Cmd + F5)
- **Windows**: NVDA (free) or JAWS
- **iOS**: VoiceOver (Settings > Accessibility)
- **Android**: TalkBack (Settings > Accessibility)

Check:
- [ ] **Headings**: Logical heading hierarchy (H1, H2, H3)?
- [ ] **Landmarks**: Are main regions identified (header, nav, main, footer)?
- [ ] **Alt text**: Do images have descriptive alt text?
- [ ] **Form labels**: Are all inputs properly labeled?
- [ ] **Live regions**: Are dynamic updates announced?
- [ ] **Button labels**: Do icon buttons have aria-labels?

### Automated Testing

Use tools to catch common issues:

```bash
# Install axe-core for accessibility testing
npm install --save-dev @axe-core/react

# Run accessibility tests
npm run test:a11y
```

```tsx
// In tests
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Browser Extensions

- **axe DevTools**: Comprehensive accessibility testing
- **WAVE**: Visual feedback on accessibility issues
- **Lighthouse**: Overall accessibility score

## Resources

- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **Inclusive Components**: https://inclusive-components.design/

## Contact

For accessibility questions or issues:
- Slack: #design-accessibility
- Email: accessibility@careguide.com

---

**Last Updated**: January 2025
**Version**: 1.0.0
