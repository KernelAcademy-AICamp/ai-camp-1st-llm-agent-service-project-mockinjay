# Phase 4: UX Component Library - Testing Checklist

> Comprehensive testing checklist for all Phase 4 components

---

## Testing Overview

| Component | Unit Tests | Integration Tests | Accessibility | Visual Regression | Manual Testing |
|-----------|------------|-------------------|---------------|-------------------|----------------|
| MedicalTooltip | ✅ | ✅ | ✅ | ✅ | ✅ |
| ConfirmDialog | ✅ | ✅ | ✅ | ✅ | ✅ |
| EmptyState | ✅ | ✅ | ✅ | ✅ | ✅ |
| OnboardingTour | ✅ | ✅ | ✅ | ✅ | ✅ |
| AppLayout | ✅ | ✅ | ✅ | ✅ | ✅ |
| MobileHeader | ✅ | ✅ | ✅ | ✅ | ✅ |
| MobileNav | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 1. MedicalTooltip Component

### Unit Tests
- [ ] Renders with term and definition
- [ ] Shows tooltip on click
- [ ] Hides tooltip on Escape key
- [ ] Hides tooltip on outside click
- [ ] Renders "Learn More" link when provided
- [ ] Uses pre-built MEDICAL_TERMS dictionary
- [ ] Wraps custom children when provided

### Integration Tests
- [ ] Integrates with page layout
- [ ] Multiple tooltips on same page work independently
- [ ] Tooltip stays within viewport bounds
- [ ] Mobile modal variant displays correctly

### Accessibility Tests
- [ ] Keyboard accessible (Tab, Enter, Escape)
- [ ] ARIA labels present (`aria-describedby`, `aria-label`)
- [ ] Screen reader announces tooltip content
- [ ] Focus trap works correctly
- [ ] Touch target ≥ 44x44px
- [ ] Color contrast ≥ 4.5:1

### Visual Regression Tests
- [ ] Desktop tooltip positioning (top/bottom/left/right)
- [ ] Mobile centered modal
- [ ] Hover state styling
- [ ] Active state styling
- [ ] HelpCircle icon displays

### Manual Testing
- [ ] Click to open tooltip
- [ ] Press Escape to close
- [ ] Click outside to close
- [ ] "Learn More" link opens in new tab
- [ ] Mobile modal centers correctly
- [ ] Tooltip doesn't overflow viewport

**Test on:**
- [ ] Chrome Desktop
- [ ] Safari Desktop
- [ ] Firefox Desktop
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] iPhone with notch (safe area)

---

## 2. ConfirmDialog Component

### Unit Tests
- [ ] Renders when isOpen=true
- [ ] Hides when isOpen=false
- [ ] Calls onConfirm when confirm button clicked
- [ ] Calls onClose when cancel button clicked
- [ ] Calls onClose when Escape key pressed
- [ ] Renders all 3 variants (danger, warning, info)
- [ ] Custom confirm/cancel text displays

### Integration Tests
- [ ] Works with state management (useState)
- [ ] Prevents scroll when open
- [ ] Blocks background interaction
- [ ] Multiple dialogs can be queued

### Accessibility Tests
- [ ] Focus trap works (Tab cycles within dialog)
- [ ] Auto-focus on cancel button (safer default)
- [ ] Escape key closes dialog
- [ ] ARIA labels present (`role="dialog"`, `aria-modal="true"`)
- [ ] Screen reader announces title and description
- [ ] Touch targets ≥ 48x48px

### Visual Regression Tests
- [ ] Danger variant (red)
- [ ] Warning variant (yellow)
- [ ] Info variant (blue)
- [ ] Modal backdrop opacity
- [ ] Button hover states
- [ ] Icon rendering

### Manual Testing
- [ ] Click confirm button
- [ ] Click cancel button
- [ ] Press Escape key
- [ ] Click backdrop (should not close)
- [ ] Tab through focusable elements
- [ ] Verify body scroll is prevented

**Test on:**
- [ ] Chrome Desktop
- [ ] Safari Desktop
- [ ] Firefox Desktop
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Small screens (<375px)

---

## 3. EmptyState Component

### Unit Tests
- [ ] Renders all 8 variants correctly
- [ ] Custom title and description override defaults
- [ ] Primary action button renders and works
- [ ] Secondary action button renders and works
- [ ] Custom icon displays
- [ ] Specialized components render (NoChatMessagesEmpty, etc.)

### Integration Tests
- [ ] Conditional rendering based on data length
- [ ] Actions trigger parent callbacks
- [ ] Empty state to content transition is smooth

### Accessibility Tests
- [ ] ARIA label present (`role="region"`)
- [ ] Icon has `aria-hidden="true"`
- [ ] Action buttons have proper labels
- [ ] Keyboard accessible
- [ ] Screen reader announces empty state

### Visual Regression Tests
- [ ] All 8 variant icons and colors
- [ ] Button layout (single vs. dual action)
- [ ] Mobile vs. desktop spacing
- [ ] Icon background circle
- [ ] Text alignment

### Manual Testing
- [ ] Click primary action button
- [ ] Click secondary action button
- [ ] Verify messaging is supportive, not negative
- [ ] Check mobile responsive layout

**Test on:**
- [ ] Chrome Desktop
- [ ] Safari Desktop
- [ ] Chrome Mobile
- [ ] Safari Mobile

---

## 4. OnboardingTour Component

### Unit Tests
- [ ] Renders when isActive=true
- [ ] Hides when isActive=false
- [ ] Steps advance on "Next" button
- [ ] Steps go back on "Previous" button
- [ ] Tour completes on last step
- [ ] Tour skips on "Skip" button
- [ ] Escape key skips tour
- [ ] Arrow keys navigate (← →)
- [ ] "Don't show again" persists to localStorage

### Integration Tests
- [ ] Spotlight highlights target elements
- [ ] Auto-scrolls target into view
- [ ] Tooltip positions correctly (top/bottom/left/right/center)
- [ ] Progress indicator updates
- [ ] Works with dynamic content

### Accessibility Tests
- [ ] Keyboard navigation works (←/→/Escape/Enter)
- [ ] Focus management (stays within tour)
- [ ] ARIA labels present
- [ ] Screen reader announces steps
- [ ] Keyboard shortcuts displayed

### Visual Regression Tests
- [ ] Spotlight effect (dark overlay with cutout)
- [ ] Tooltip positioning at all placements
- [ ] Progress dots animation
- [ ] Gradient header background
- [ ] Keyboard hint badges

### Manual Testing
- [ ] Click "Next" button
- [ ] Click "Previous" button
- [ ] Press right arrow key
- [ ] Press left arrow key
- [ ] Press Escape key
- [ ] Click "Don't show again"
- [ ] Verify localStorage persistence
- [ ] Test on mobile (centered tooltip)

**Test on:**
- [ ] Chrome Desktop
- [ ] Safari Desktop
- [ ] Firefox Desktop
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Tablet (iPad)

---

## 5. AppLayout Component

### Unit Tests
- [ ] Renders with Outlet
- [ ] Shows/hides layout based on path
- [ ] Network banner appears when offline
- [ ] Reconnect banner appears and auto-dismisses
- [ ] Scrolls to top on route change

### Integration Tests
- [ ] Sidebar displays on desktop (lg)
- [ ] Collapsed sidebar on tablet (md)
- [ ] Bottom nav on mobile
- [ ] Drawer opens on mobile
- [ ] Routes render correctly

### Accessibility Tests
- [ ] Semantic HTML5 tags (`<header>`, `<aside>`, `<main>`, `<nav>`)
- [ ] ARIA labels present
- [ ] Landmark regions identified
- [ ] Skip to main content link
- [ ] Keyboard navigation works

### Visual Regression Tests
- [ ] Desktop layout (sidebar + header + main)
- [ ] Tablet layout (collapsed sidebar)
- [ ] Mobile layout (bottom nav)
- [ ] Network banners
- [ ] Safe area padding on iPhone

### Manual Testing
- [ ] Resize window (desktop → tablet → mobile)
- [ ] Disconnect network (see offline banner)
- [ ] Reconnect network (see reconnect banner)
- [ ] Navigate between routes
- [ ] Verify scroll to top

**Test on:**
- [ ] Desktop 1920x1080
- [ ] Tablet 768x1024
- [ ] Mobile 375x667
- [ ] iPhone 13 (with notch)
- [ ] Android (Samsung)

---

## 6. MobileHeader Component

### Unit Tests
- [ ] Renders with title
- [ ] Back button navigates
- [ ] Menu button opens drawer
- [ ] Profile button navigates to /mypage or /login
- [ ] Notification badge displays
- [ ] Haptic feedback triggers on touch

### Integration Tests
- [ ] Integrates with navigation (useNavigate)
- [ ] Drawer context works
- [ ] Auth context works
- [ ] Safe area support on notched devices

### Accessibility Tests
- [ ] Touch targets ≥ 48x48px
- [ ] ARIA labels present
- [ ] Keyboard accessible
- [ ] Focus indicators visible

### Visual Regression Tests
- [ ] With back button
- [ ] With menu button
- [ ] With subtitle
- [ ] Notification badge
- [ ] Safe area padding

### Manual Testing
- [ ] Tap back button
- [ ] Tap menu button
- [ ] Tap profile button
- [ ] Verify haptic feedback
- [ ] Test on iPhone with notch

**Test on:**
- [ ] iPhone 13 (notch)
- [ ] iPhone SE (no notch)
- [ ] Android (various)

---

## 7. MobileNav Component

### Unit Tests
- [ ] Renders 5 nav items
- [ ] Active state updates on route change
- [ ] Navigation works
- [ ] Haptic feedback triggers
- [ ] Hides on login/signup/main pages

### Integration Tests
- [ ] Integrates with React Router
- [ ] Safe area support on iPhone
- [ ] Active state indicator animates

### Accessibility Tests
- [ ] Touch targets ≥ 48x48px
- [ ] ARIA labels present (`aria-label`, `aria-current`)
- [ ] Keyboard accessible
- [ ] Screen reader announces current page

### Visual Regression Tests
- [ ] All 5 tabs render correctly
- [ ] Active state with top bar
- [ ] Icon scale animation
- [ ] Safe area padding

### Manual Testing
- [ ] Tap each tab
- [ ] Verify navigation
- [ ] Verify haptic feedback
- [ ] Test on iPhone with home indicator

**Test on:**
- [ ] iPhone 13 (home indicator)
- [ ] iPhone 8 (no home indicator)
- [ ] Android (various)

---

## 8. Additional Layout Components

### PageContainer
- [ ] Responsive padding (4px → 8px)
- [ ] Max-width constraint (7xl = 1280px)
- [ ] Auto-centering
- [ ] Full-width mode

### PageSection
- [ ] Title and description render
- [ ] Responsive spacing
- [ ] Semantic `<section>` tag
- [ ] Heading hierarchy

### TwoColumnLayout
- [ ] Responsive collapse (stacked on mobile)
- [ ] Configurable column ratios
- [ ] Sticky sidebar option

### GridLayout
- [ ] Auto-responsive columns
- [ ] Gap spacing
- [ ] Equal height option

---

## Accessibility Audit (WCAG 2.2 AA)

### Perceivable
- [ ] All images have alt text
- [ ] Color contrast ≥ 4.5:1 (normal text)
- [ ] Color contrast ≥ 3:1 (large text)
- [ ] Information not conveyed by color alone
- [ ] Captions for video/audio (if applicable)

### Operable
- [ ] All functionality via keyboard
- [ ] No keyboard traps
- [ ] Touch targets ≥ 44x44px
- [ ] Focus indicators visible
- [ ] Skip navigation links
- [ ] Sufficient time for actions

### Understandable
- [ ] Language declared (`lang="ko"`)
- [ ] Consistent navigation
- [ ] Clear error messages
- [ ] Input labels and instructions
- [ ] Logical focus order

### Robust
- [ ] Valid HTML5 semantics
- [ ] ARIA labels where needed
- [ ] Accessible names for interactive elements
- [ ] Compatible with assistive technologies

---

## Performance Testing

### Bundle Size
- [ ] MedicalTooltip < 2.5 KB
- [ ] ConfirmDialog < 2 KB
- [ ] EmptyState < 2.5 KB
- [ ] OnboardingTour < 5 KB
- [ ] AppLayout < 6 KB
- [ ] MobileNav < 3 KB

### Lighthouse Scores
- [ ] Performance ≥ 90
- [ ] Accessibility = 100
- [ ] Best Practices = 100
- [ ] SEO = 100

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

---

## Cross-Browser Testing

### Desktop Browsers
- [ ] Chrome 90+ (Windows, macOS)
- [ ] Safari 14+ (macOS)
- [ ] Firefox 88+ (Windows, macOS)
- [ ] Edge 90+ (Windows)

### Mobile Browsers
- [ ] Chrome Mobile (Android 10+)
- [ ] Safari Mobile (iOS 14+)
- [ ] Samsung Internet (latest)
- [ ] Firefox Mobile (Android)

---

## Device Testing

### Mobile Devices
- [ ] iPhone 13 Pro Max (6.7")
- [ ] iPhone 13 (6.1")
- [ ] iPhone SE (4.7")
- [ ] Samsung Galaxy S21 (6.2")
- [ ] Google Pixel 6 (6.4")

### Tablets
- [ ] iPad Pro 12.9" (1024x1366)
- [ ] iPad Air (820x1180)
- [ ] Samsung Galaxy Tab (800x1280)

### Desktops
- [ ] 1920x1080 (Full HD)
- [ ] 1366x768 (Laptop)
- [ ] 2560x1440 (QHD)

---

## Regression Testing

### After Each Update
- [ ] Run full test suite (`npm test`)
- [ ] Run accessibility audit (`npm run a11y`)
- [ ] Run Lighthouse audit
- [ ] Manual smoke test on Chrome
- [ ] Manual smoke test on Safari Mobile

### Before Release
- [ ] Full cross-browser testing
- [ ] Full device testing
- [ ] Accessibility audit with screen reader
- [ ] Performance profiling
- [ ] User acceptance testing (UAT)

---

## Automated Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run accessibility audit
npm run a11y

# Run Lighthouse CI
npm run lighthouse

# Run visual regression tests
npm run test:visual

# Run E2E tests
npm run test:e2e
```

---

## Manual Testing Scripts

### Script 1: MedicalTooltip Flow
1. Navigate to /diet-care page
2. Click on "GFR" tooltip
3. Verify tooltip opens
4. Press Escape key
5. Verify tooltip closes
6. Click on "칼륨" tooltip
7. Click "자세히 알아보기" link
8. Verify link opens in new tab

### Script 2: ConfirmDialog Flow
1. Navigate to /community page
2. Create a test post
3. Click "삭제" button
4. Verify confirm dialog opens
5. Click "취소" button
6. Verify post is not deleted
7. Click "삭제" button again
8. Click "삭제" confirm button
9. Verify post is deleted

### Script 3: EmptyState Flow
1. Navigate to /diet-care page
2. Delete all meal logs
3. Verify "no-logs" empty state displays
4. Click "식단 기록하기" button
5. Verify add meal modal opens
6. Cancel modal
7. Verify empty state still displays

### Script 4: OnboardingTour Flow
1. Clear localStorage
2. Navigate to /chat page
3. Verify tour starts automatically
4. Click "다음" button 3 times
5. Press left arrow key
6. Verify step goes back
7. Press Escape key
8. Verify tour closes
9. Refresh page
10. Verify tour does not restart

### Script 5: Mobile Navigation Flow
1. Open mobile device (375px width)
2. Navigate to /chat page
3. Tap bottom nav "식단케어" tab
4. Verify navigation to /diet-care
5. Tap hamburger menu
6. Verify drawer opens
7. Tap outside drawer
8. Verify drawer closes
9. Tap profile icon
10. Verify navigation to /mypage or /login

---

## Bug Tracking Template

```markdown
### Bug Title
Brief description of the issue

**Component:** MedicalTooltip
**Severity:** High / Medium / Low
**Priority:** P0 / P1 / P2 / P3

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 110
- OS: macOS 13.2
- Device: Desktop

**Screenshots:**
(Attach screenshots if applicable)

**Additional Context:**
Any other relevant information
```

---

## Sign-Off Checklist

Before marking Phase 4 as complete:

### Documentation
- [ ] All components documented with JSDoc
- [ ] Usage examples provided
- [ ] PHASE4_UX_COMPONENT_LIBRARY.md complete
- [ ] PHASE4_QUICK_REFERENCE.md complete
- [ ] PHASE4_TESTING_CHECKLIST.md complete

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Accessibility audit passes (100/100)
- [ ] Cross-browser testing complete
- [ ] Mobile device testing complete

### Code Quality
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Code formatted with Prettier

### Performance
- [ ] All components < 5 KB bundle size
- [ ] Lighthouse Performance ≥ 90
- [ ] Core Web Vitals pass

### Accessibility
- [ ] WCAG 2.2 AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Touch targets ≥ 44x44px

### User Acceptance
- [ ] Product owner approval
- [ ] Designer approval
- [ ] Stakeholder demo complete

---

## Test Coverage Report

```bash
# Generate coverage report
npm test -- --coverage

# Expected coverage targets:
# - Statements: ≥ 80%
# - Branches: ≥ 75%
# - Functions: ≥ 80%
# - Lines: ≥ 80%
```

---

## Contact

For questions about testing:
- **Test Lead:** [Name]
- **QA Team:** [Email]
- **Slack Channel:** #careguide-testing
