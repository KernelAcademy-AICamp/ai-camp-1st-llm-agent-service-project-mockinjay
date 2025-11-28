# CareGuide UX Component Architecture

**Visual guide to component relationships and usage patterns**

---

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         AppLayout                                │
│  ┌──────────────┐  ┌────────────────────────────────────────┐  │
│  │   Sidebar    │  │          Main Content Area             │  │
│  │  (Desktop)   │  │                                        │  │
│  └──────────────┘  │  ┌──────────────────────────────────┐ │  │
│                    │  │         Page Component           │ │  │
│  ┌──────────────┐  │  │  (Chat/Diet/Community/MyPage)   │ │  │
│  │  MobileNav   │  │  │                                  │ │  │
│  │  (Mobile)    │  │  │  ┌────────────────────────────┐ │ │  │
│  └──────────────┘  │  │  │   Feature Components       │ │ │  │
│                    │  │  │   ┌──────────────────────┐ │ │ │  │
│                    │  │  │   │ 🆕 Common Components │ │ │ │  │
│                    │  │  │   │ - Tooltip           │ │ │ │  │
│                    │  │  │   │ - ConfirmDialog     │ │ │ │  │
│                    │  │  │   │ - OnboardingTour    │ │ │ │  │
│                    │  │  │   │ - EmptyState        │ │ │ │  │
│                    │  │  │   └──────────────────────┘ │ │ │  │
│                    │  │  └────────────────────────────┘ │ │  │
│                    │  └──────────────────────────────────┘ │  │
│                    └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Flows

### 1. First-Time User Journey

```
User Signs Up
     │
     ├─► SignupPage (4 steps)
     │   ├─ Step 0: Terms ─► Uses Tooltip for "Why we need this"
     │   ├─ Step 1: Account
     │   ├─ Step 2: Personal Info
     │   └─ Step 3: Disease Info ─► Uses MedicalTooltip for CKD stages
     │
     ├─► Success Toast with "Complete Profile" CTA
     │
     ├─► Navigate to MyPage with ?openHealthProfile=true
     │   └─► HealthProfileModal auto-opens
     │
     └─► First Feature Visit (e.g., Chat)
         └─► OnboardingTour activates
             ├─ Step 1: Welcome (center)
             ├─ Step 2: Agent tabs (bottom)
             ├─ Step 3: Suggestions (top)
             └─ Step 4: Input (top)
```

### 2. Destructive Action Flow

```
User Clicks Delete Button
     │
     ├─► ConfirmDialog opens
     │   ├─ Focus moves to Cancel button (danger actions)
     │   ├─ User reads confirmation message
     │   └─ User can ESC, click outside, or choose action
     │
     ├─► If Confirmed:
     │   ├─► isLoading = true (button shows spinner)
     │   ├─► API call
     │   ├─► Success: Toast notification + dialog closes
     │   └─► Error: Error message in dialog
     │
     └─► If Cancelled:
         └─► Dialog closes, focus returns to trigger
```

### 3. Empty State → Engagement Flow

```
User Opens Feature with No Data
     │
     ├─► EmptyState renders
     │   ├─ Shows friendly icon (not alarming)
     │   ├─ Shows supportive title
     │   ├─ Shows encouraging description
     │   └─ Shows actionable CTA button
     │
     └─► User Clicks CTA
         ├─► Navigates to creation flow
         └─► OnboardingTour (if first time)
             └─► Guides through process
```

### 4. Educational Tooltip Flow

```
User Encounters Medical Term
     │
     ├─► Sees term with (?) icon
     │
     ├─► Desktop: Hovers over icon
     │   └─► Tooltip appears with definition
     │
     ├─► Mobile: Taps icon
     │   ├─► Tooltip appears
     │   └─► Taps outside to close
     │
     └─► Reads Content:
         ├─ Term definition
         ├─ Normal range (if applicable)
         └─ "Why it matters" explanation
```

---

## Component State Management

### Tooltip Component

```
State:
┌─────────────────────────────────────┐
│ isVisible: boolean                  │  ← Controlled internally
│ isMobile: boolean                   │  ← Detected via window.innerWidth
│ targetRect: DOMRect | null          │  ← Position of trigger element
└─────────────────────────────────────┘

Props (Input):
┌─────────────────────────────────────┐
│ content: string | React.ReactNode   │
│ position: 'top' | 'bottom' | ...    │
│ children: React.ReactNode (trigger) │
│ maxWidth: number                    │
│ ariaLabel: string                   │
└─────────────────────────────────────┘

Events:
┌─────────────────────────────────────┐
│ onMouseEnter → show (desktop)       │
│ onMouseLeave → hide (desktop)       │
│ onClick → toggle (mobile)           │
│ onKeyDown(ESC) → hide               │
└─────────────────────────────────────┘
```

### ConfirmDialog Component

```
State:
┌─────────────────────────────────────┐
│ Parent manages: isOpen              │  ← Lifted state
│ Internal: focus trap references     │
└─────────────────────────────────────┘

Props (Input):
┌─────────────────────────────────────┐
│ isOpen: boolean                     │
│ title: string                       │
│ message: string | React.ReactNode   │
│ confirmText: string                 │
│ cancelText: string                  │
│ variant: 'danger' | 'warning' | ... │
│ isLoading: boolean                  │
│ showDontAskAgain: boolean           │
└─────────────────────────────────────┘

Events (Output):
┌─────────────────────────────────────┐
│ onConfirm: () => void               │
│ onCancel: () => void                │
│ onDontAskAgainChange: (bool) => void│
└─────────────────────────────────────┘
```

### OnboardingTour Component

```
State:
┌─────────────────────────────────────┐
│ currentStepIndex: number            │  ← Which step is active
│ targetRect: DOMRect | null          │  ← Position of highlighted element
└─────────────────────────────────────┘

Props (Input):
┌─────────────────────────────────────┐
│ tourId: string                      │  ← For localStorage key
│ steps: TourStep[]                   │  ← Array of tour steps
│ isActive: boolean                   │  ← Controlled by parent
│ showDontShowAgain: boolean          │
└─────────────────────────────────────┘

Events (Output):
┌─────────────────────────────────────┐
│ onComplete: () => void              │
│ onSkip: () => void                  │
└─────────────────────────────────────┘

LocalStorage:
┌─────────────────────────────────────┐
│ Key: tour_${tourId}_completed       │
│ Value: 'true' | null                │
└─────────────────────────────────────┘
```

### EmptyState Component

```
State:
┌─────────────────────────────────────┐
│ No internal state (stateless)       │
└─────────────────────────────────────┘

Props (Input):
┌─────────────────────────────────────┐
│ variant: EmptyStateVariant          │  ← Pre-configured types
│ title?: string                      │  ← Override default
│ description?: string                │  ← Override default
│ icon?: React.ReactNode              │  ← Override default
│ primaryAction?: { label, onClick }  │
│ secondaryAction?: { label, onClick }│
└─────────────────────────────────────┘

Events (Output):
┌─────────────────────────────────────┐
│ primaryAction.onClick               │
│ secondaryAction.onClick             │
└─────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Progressive Enhancement

Start with basic functionality, layer on UX enhancements:

```tsx
// Step 1: Basic functionality (existing)
<button onClick={handleDelete}>Delete</button>

// Step 2: Add confirmation (Phase 1)
<button onClick={() => setShowDialog(true)}>Delete</button>
<ConfirmDialog
  isOpen={showDialog}
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>

// Step 3: Add undo option (Phase 3)
<button onClick={() => setShowDialog(true)}>Delete</button>
<ConfirmDialog
  isOpen={showDialog}
  onConfirm={handleDeleteWithUndo}  // ← Soft delete with toast
  onCancel={() => setShowDialog(false)}
/>
```

### Pattern 2: Layered Onboarding

First-time, returning, and power users get different experiences:

```tsx
// First-time user (0 visits)
if (visitCount === 0 && shouldShowTour('feature-intro')) {
  return <OnboardingTour steps={fullTourSteps} />;
}

// Returning user (1-3 visits)
if (visitCount <= 3 && shouldShowTour('feature-tip')) {
  return <Tooltip content="Pro tip: You can..." />;
}

// Power user (4+ visits)
// No interruptions, just efficient workflow
```

### Pattern 3: Contextual Help Hierarchy

Information architecture from least to most intrusive:

```
1. Inline hint text
   ↓ (user needs more info)
2. Tooltip on hover/tap
   ↓ (user needs detailed explanation)
3. Help modal/panel
   ↓ (user needs step-by-step guide)
4. Onboarding tour
```

Example:

```tsx
<label>
  혈청 크레아티닌
  {/* Level 1: Inline hint */}
  <span className="text-xs text-gray-500">(mg/dL)</span>

  {/* Level 2: Tooltip */}
  <MedicalTooltip term="크레아티닌" definition="..." />
</label>

{/* Level 3: Help button (opens modal) */}
<HelpButton topic="Lab Results" content={<LabResultsGuide />} />

{/* Level 4: First-time tour (automatic) */}
<OnboardingTour steps={labResultsTourSteps} />
```

---

## Component Composition Examples

### Example 1: Enhanced Signup Step

```tsx
// Before (existing)
<div>
  <label>만성신장병 단계</label>
  <select>
    <option>만성신장병 1단계</option>
    {/* ... */}
  </select>
</div>

// After (with UX enhancements)
<div>
  <label className="flex items-center gap-2">
    만성신장병 단계
    <Tooltip content="정확한 단계를 선택하면 맞춤형 정보를 제공합니다." />
  </label>

  <div className="space-y-2">
    {diseaseOptions.map(option => (
      <label className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <input type="radio" value={option.value} />
          <span>{option.label}</span>
        </div>
        <MedicalTooltip
          term={option.term}
          definition={option.definition}
          normalRange={option.normalRange}
          whyItMatters={option.whyItMatters}
        />
      </label>
    ))}
  </div>
</div>
```

### Example 2: Enhanced Chat Page

```tsx
function ChatPageEnhanced() {
  const [showTour, setShowTour] = useState(() => shouldShowTour('chat'));
  const [showResetDialog, setShowResetDialog] = useState(false);

  return (
    <>
      {/* Onboarding for first-time users */}
      <OnboardingTour
        tourId="chat"
        steps={chatTourSteps}
        isActive={showTour}
        onComplete={() => setShowTour(false)}
        onSkip={() => setShowTour(false)}
      />

      <div data-tour="agent-tabs">
        {/* Agent selection tabs */}
      </div>

      <div>
        {messages.length === 0 ? (
          // Empty state instead of blank screen
          <NoChatMessagesEmpty onStartChat={focusInput} />
        ) : (
          <ChatMessages messages={messages} />
        )}
      </div>

      <div data-tour="chat-input">
        <ChatInput />
      </div>

      {/* Confirmation before destructive action */}
      <button onClick={() => setShowResetDialog(true)}>
        Reset Session
      </button>

      <ConfirmDialog
        isOpen={showResetDialog}
        title="대화 기록 삭제"
        message="모든 대화 내용이 삭제됩니다."
        variant="warning"
        onConfirm={handleReset}
        onCancel={() => setShowResetDialog(false)}
      />
    </>
  );
}
```

### Example 3: Enhanced Diet Care

```tsx
function DietCarePageEnhanced() {
  const mealLogs = useMealLogs();

  return (
    <div>
      <h2 className="flex items-center gap-2">
        오늘의 영양 섭취
        <Tooltip content="CKD 환자에게 중요한 영양소를 추적합니다." />
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Sodium card with educational tooltip */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">나트륨</span>
            <MedicalTooltip
              term="나트륨"
              definition="소금의 주성분으로, 혈압과 체액 조절에 관여합니다."
              normalRange="CKD: 1,500-2,000mg/일"
              whyItMatters="과다 섭취 시 혈압 상승과 부종을 유발할 수 있습니다."
            />
          </div>
          <div className="text-2xl font-bold">
            {sodiumIntake}mg
          </div>
          <ProgressBar value={sodiumIntake} max={2000} />
        </div>

        {/* Similar for potassium, protein, etc. */}
      </div>

      {mealLogs.length === 0 ? (
        <NoMealLogsEmpty onAddMeal={openMealForm} />
      ) : (
        <MealLogList logs={mealLogs} />
      )}
    </div>
  );
}
```

---

## Responsive Behavior

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────┐
│ [Sidebar] │                 Content                 │
│           │                                          │
│  Nav      │  ┌──────────────────────────────────┐  │
│  Items    │  │      Page Content                │  │
│           │  │                                  │  │
│  User     │  │  [Tooltip on hover]              │  │
│  Profile  │  │                                  │  │
│           │  │  [Modal dialog - centered]       │  │
│  Logout   │  │                                  │  │
│           │  │  [OnboardingTour - spotlight]    │  │
│           │  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Mobile (<1024px)

```
┌─────────────────────────┐
│      [Header]           │  ← Hidden when scrolling down
├─────────────────────────┤
│                         │
│   Content Area          │
│                         │
│  [Tooltip on tap]       │
│                         │
│  [Modal - fullscreen]   │
│                         │
│  [Tour - adapted pos]   │
│                         │
├─────────────────────────┤
│  [Bottom Navigation]    │  ← Always visible
└─────────────────────────┘
```

### Component Adaptations

**Tooltip:**
- Desktop: Hover trigger, any position
- Mobile: Tap trigger, prefers top/bottom (more space)

**ConfirmDialog:**
- Desktop: Centered modal, ~500px width
- Mobile: Bottom sheet or full-screen modal

**OnboardingTour:**
- Desktop: Tooltip positioned around element
- Mobile: Centered tooltip with arrow pointing to element

**EmptyState:**
- Desktop: Icon 48px, compact layout
- Mobile: Icon 40px, more vertical spacing

---

## Accessibility Features

### Keyboard Navigation Map

```
┌─────────────────────────────────────────────────────┐
│ Skip Link (hidden, visible on Tab)                  │
│   ↓ Tab                                             │
├─────────────────────────────────────────────────────┤
│ Sidebar Navigation                                  │
│   → Tab through nav items                           │
│   → Enter to activate                               │
│   → Tab to next section                             │
├─────────────────────────────────────────────────────┤
│ Main Content                                        │
│   → Tab through interactive elements                │
│   → ? icon (Tooltip)                                │
│      - Enter/Space to open                          │
│      - ESC to close                                 │
│   → Button with ConfirmDialog                       │
│      - Enter to open dialog                         │
│      - Tab between Cancel/Confirm                   │
│      - ESC to cancel                                │
│   → OnboardingTour (if active)                      │
│      - Tab through steps                            │
│      - ← → to navigate                              │
│      - ESC to skip                                  │
└─────────────────────────────────────────────────────┘
```

### Screen Reader Announcements

```
Component          → Announcement
─────────────────────────────────────────────────────
Tooltip            → "도움말 버튼, [label]"
                   → "툴팁 열림: [content]"

ConfirmDialog      → "경고 대화상자"
                   → "제목: [title]"
                   → "설명: [message]"

OnboardingTour     → "안내 투어 시작"
                   → "단계 [n] / [total]: [title]"

EmptyState         → "영역: [variant]"
                   → "[title], [description]"

Loading State      → "로딩 중..."

Success/Error      → "성공/오류: [message]"
```

---

## Performance Optimization

### Code Splitting

```
App Entry Point (100KB)
    │
    ├─ Common Components (10KB) ← Tooltip, ConfirmDialog, etc.
    │  └─ Loaded: Immediately (frequently used)
    │
    ├─ ChatPage (50KB)
    │  └─ Loaded: On route visit
    │
    ├─ DietCarePage (40KB)
    │  └─ Loaded: On route visit
    │
    └─ OnboardingTour (15KB)
       └─ Loaded: On first visit (lazy)
```

### Lazy Loading Pattern

```tsx
// Lazy load OnboardingTour (only when needed)
const OnboardingTour = lazy(() =>
  import('../components/common/OnboardingTour')
);

function Page() {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      {showTour && (
        <Suspense fallback={<div>로딩 중...</div>}>
          <OnboardingTour {...props} />
        </Suspense>
      )}
    </>
  );
}
```

### Memoization Strategy

```tsx
// Memoize expensive computations
const MedicalTooltip = React.memo(({ term, definition, ... }) => {
  // Only re-render if props change
  return <Tooltip content={...} />;
});

// Memoize callbacks
const handleDelete = useCallback(() => {
  // Delete logic
}, [dependencies]);
```

---

## Testing Strategy by Component

### Tooltip
- [ ] Appears on hover (desktop)
- [ ] Appears on tap (mobile)
- [ ] Closes on ESC
- [ ] Closes on click outside (mobile)
- [ ] Positioned correctly (all positions)
- [ ] Accessible to screen readers

### ConfirmDialog
- [ ] Opens on trigger
- [ ] Closes on cancel
- [ ] Closes on ESC
- [ ] Closes on backdrop click
- [ ] Calls onConfirm correctly
- [ ] Loading state works
- [ ] Focus trap works
- [ ] Focus returns to trigger

### OnboardingTour
- [ ] Shows on first visit
- [ ] Doesn't show after completion
- [ ] Steps progress correctly
- [ ] Keyboard navigation works
- [ ] Skip button works
- [ ] "Don't show again" works
- [ ] Spotlight highlights correctly
- [ ] Tooltip positions correctly

### EmptyState
- [ ] Renders correct variant
- [ ] Actions call callbacks
- [ ] Responsive layout works
- [ ] Icons display correctly

---

## Conclusion

This architecture provides:
1. **Reusable components** that solve common UX patterns
2. **Consistent user experience** across all features
3. **Accessibility by default** in all interactions
4. **Progressive enhancement** from basic to delightful
5. **Composable design** for easy feature development

All components follow React best practices, TypeScript for type safety, and WCAG 2.1 AA for accessibility.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
