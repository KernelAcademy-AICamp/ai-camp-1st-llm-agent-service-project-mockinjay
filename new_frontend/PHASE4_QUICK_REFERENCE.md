# Phase 4: UX Component Library - Quick Reference

> One-page cheat sheet for all Phase 4 components

---

## Component Import Map

```tsx
// Core UX Components
import {
  MedicalTooltip,
  MEDICAL_TERMS,
  ConfirmDialog,
  EmptyState,
  OnboardingTour,
  shouldShowTour,
  MedicalDisclaimer,
} from '@/components/common';

// Layout Components
import {
  AppLayout,
  PageContainer,
  PageSection,
  TwoColumnLayout,
  GridLayout,
  MobileHeader,
  MobileNav,
} from '@/components/layout';
```

---

## 1-Minute Component Usage

### MedicalTooltip
```tsx
<MedicalTooltip {...MEDICAL_TERMS.GFR} />
```

### ConfirmDialog
```tsx
<ConfirmDialog
  isOpen={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  variant="danger"
  title="삭제하시겠습니까?"
  description="이 작업은 취소할 수 없습니다."
/>
```

### EmptyState
```tsx
<EmptyState variant="no-data" />

{/* Or specialized */}
<NoMealLogsEmpty onAddMeal={() => setShowModal(true)} />
```

### OnboardingTour
```tsx
const [showTour, setShowTour] = useState(() => shouldShowTour('chat'));

<OnboardingTour
  tourId="chat"
  steps={tourSteps}
  isActive={showTour}
  onComplete={() => setShowTour(false)}
  onSkip={() => setShowTour(false)}
/>
```

### PageContainer
```tsx
<PageContainer>
  <PageSection title="타이틀">
    <Content />
  </PageSection>
</PageContainer>
```

### TwoColumnLayout
```tsx
<TwoColumnLayout
  main={<MainContent />}
  sidebar={<SidebarContent />}
/>
```

### GridLayout
```tsx
<GridLayout columns={3} gap="lg">
  {items.map(item => <Card key={item.id} {...item} />)}
</GridLayout>
```

### MobileHeader
```tsx
<MobileHeader
  title="페이지 제목"
  onBack={() => navigate(-1)}
  showProfile
/>
```

---

## Medical Terms Dictionary

```tsx
MEDICAL_TERMS.CKD        // 만성신장병
MEDICAL_TERMS.GFR        // 사구체 여과율
MEDICAL_TERMS.Creatinine // 크레아티닌
MEDICAL_TERMS.Potassium  // 칼륨
MEDICAL_TERMS.Sodium     // 나트륨
MEDICAL_TERMS.Phosphorus // 인
MEDICAL_TERMS.Protein    // 단백질
MEDICAL_TERMS.Dialysis   // 투석
MEDICAL_TERMS.Anemia     // 빈혈
MEDICAL_TERMS.Edema      // 부종
```

---

## Empty State Variants

| Variant | Use Case | Icon |
|---------|----------|------|
| `no-data` | Generic empty | Inbox |
| `no-messages` | Chat | MessageSquare |
| `no-results` | Search | Search |
| `no-posts` | Community | FileText |
| `no-bookmarks` | Bookmarks | Heart |
| `no-logs` | Diet logs | Calendar |
| `error` | Error state | AlertCircle |
| `welcome` | Onboarding | Sparkles |

---

## ConfirmDialog Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| `danger` | Red | Delete, destructive actions |
| `warning` | Yellow | Logout, data loss warnings |
| `info` | Blue | Save, informational confirmations |

---

## Layout Breakpoints

| Breakpoint | Width | Sidebar | Header | Bottom Nav |
|------------|-------|---------|--------|------------|
| Mobile | <768px | Hidden (Drawer) | Hidden | Visible |
| Tablet | 768-1023px | 72px (collapsed) | Visible | Hidden |
| Desktop | ≥1024px | 280px (full) | Visible | Hidden |

---

## Touch Target Sizes

| Size | Pixels | Use Case |
|------|--------|----------|
| MIN | 44x44 | iOS minimum |
| RECOMMENDED | 48x48 | Android recommended |
| COMFORTABLE | 56x56 | Primary actions |

---

## Z-Index Scale

```tsx
Z_INDEX.BASE          = 0   // Normal content
Z_INDEX.SIDEBAR       = 40  // Sidebar
Z_INDEX.HEADER        = 50  // Header
Z_INDEX.BANNER        = 60  // Network banners
Z_INDEX.DRAWER        = 70  // Mobile drawer
Z_INDEX.DROPDOWN      = 80  // Dropdowns
Z_INDEX.TOOLTIP       = 90  // Tooltips
Z_INDEX.MODAL_BACKDROP = 100 // Modal backdrop
Z_INDEX.MODAL         = 110 // Modal content
Z_INDEX.TOUR_BACKDROP = 100 // Tour backdrop
Z_INDEX.TOUR          = 101 // Tour content
Z_INDEX.TOAST         = 120 // Toasts
```

---

## Responsive Patterns

### Pattern 1: Standard Page
```tsx
<PageContainer>
  <PageSection title="Title">
    <Content />
  </PageSection>
</PageContainer>
```

### Pattern 2: Dashboard
```tsx
<TwoColumnLayout
  main={<MainContent />}
  sidebar={<RecentActivity />}
/>
```

### Pattern 3: Grid
```tsx
<GridLayout columns={3}>
  {items.map(item => <Card key={item.id} {...item} />)}
</GridLayout>
```

### Pattern 4: Mobile Page
```tsx
<>
  <MobileHeader title="Title" onBack={() => navigate(-1)} />
  <PageContainer>
    <Content />
  </PageContainer>
</>
```

---

## Accessibility Checklist

- ✅ All touch targets ≥ 44x44px
- ✅ Keyboard accessible (Tab, Enter, Escape)
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators visible
- ✅ Color contrast ≥ 4.5:1
- ✅ Semantic HTML5 tags
- ✅ Screen reader compatible

---

## Animation Durations

```tsx
ANIMATION.FAST   = 150ms  // Micro-interactions
ANIMATION.NORMAL = 300ms  // Standard transitions
ANIMATION.SLOW   = 500ms  // Deliberate animations
```

---

## Safe Area Support

```tsx
// Mobile header with notch support
paddingTop: max(env(safe-area-inset-top), 12px)

// Bottom nav with home indicator
paddingBottom: max(env(safe-area-inset-bottom), 8px)
```

---

## Common Data Attributes for Tours

Add these to elements you want to highlight in onboarding tours:

```tsx
<div data-tour="agent-tabs">...</div>
<div data-tour="suggestion-chips">...</div>
<div data-tour="search-bar">...</div>
<div data-tour="profile-menu">...</div>
```

---

## Haptic Feedback

```tsx
// Trigger haptic feedback on touch (mobile)
if ('vibrate' in navigator) {
  navigator.vibrate(10); // 10ms vibration
}
```

---

## LocalStorage Keys

| Key | Purpose |
|-----|---------|
| `tour_chat-intro_completed` | Chat page tour |
| `tour_diet-care-intro_completed` | Diet care tour |
| `tour_community-intro_completed` | Community tour |
| `medical_disclaimer_accepted` | Medical disclaimer |

---

## Testing Commands

```bash
# Run all tests
npm test

# Run component tests
npm test -- MedicalTooltip
npm test -- ConfirmDialog
npm test -- EmptyState
npm test -- OnboardingTour

# Run accessibility audit
npm run a11y

# Run Lighthouse
npm run lighthouse
```

---

## Performance Budgets

| Metric | Target |
|--------|--------|
| Component bundle size | < 5 KB each |
| First paint | < 100ms |
| Time to interactive | < 3s |
| Lighthouse accessibility | 100/100 |
| WCAG compliance | 2.2 AA |

---

## Browser Support Matrix

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Safari | 14+ |
| Firefox | 88+ |
| Edge | 90+ |
| iOS Safari | 14+ |
| Android WebView | 80+ |

---

## Common Pitfalls

### ❌ Don't
```tsx
// Missing onClose handler
<ConfirmDialog isOpen={true} onConfirm={handleDelete} />

// No data-tour attribute
<OnboardingTour steps={steps} isActive={true} />
<div>Element to highlight</div>

// Touch target too small
<button className="p-1">...</button>
```

### ✅ Do
```tsx
// Always provide onClose
<ConfirmDialog
  isOpen={true}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
/>

// Add data-tour attribute
<OnboardingTour steps={steps} isActive={true} />
<div data-tour="target-element">Element to highlight</div>

// Ensure touch targets are ≥ 44x44px
<button className="p-3 min-w-[44px] min-h-[44px]">...</button>
```

---

## Support

- **Full Documentation:** `/new_frontend/PHASE4_UX_COMPONENT_LIBRARY.md`
- **Design System:** `/new_frontend/DESIGN_SYSTEM.md`
- **Inline JSDoc:** Check component files for detailed prop documentation
