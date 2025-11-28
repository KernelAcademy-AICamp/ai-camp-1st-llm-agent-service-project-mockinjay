# CareGuide UX Implementation Guide

**Purpose:** Step-by-step guide to implement the UX improvements identified in the evaluation report.

**Target Audience:** Frontend developers working on CareGuide

**Timeline:** 4 weeks (see phased approach in evaluation report)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [New Components Overview](#new-components-overview)
3. [Phase 1: Critical Fixes](#phase-1-critical-fixes)
4. [Phase 2: High-Value Enhancements](#phase-2-high-value-enhancements)
5. [Phase 3: Engagement Features](#phase-3-engagement-features)
6. [Phase 4: Polish & Delight](#phase-4-polish--delight)
7. [Testing Guidelines](#testing-guidelines)
8. [Accessibility Checklist](#accessibility-checklist)

---

## Quick Start

### New Components Created

Four new reusable components have been created in `/components/common/`:

1. **Tooltip** - Educational tooltips for medical terms
2. **ConfirmDialog** - Confirmation dialogs for destructive actions
3. **OnboardingTour** - Interactive guided tours
4. **EmptyState** - Actionable empty state screens

### Import and Usage

```tsx
// Import from common components
import {
  Tooltip,
  MedicalTooltip,
  ConfirmDialog,
  OnboardingTour,
  EmptyState,
} from '../components/common';
```

---

## New Components Overview

### 1. Tooltip Component

**Purpose:** Provide contextual help and medical term education

**Use Cases:**
- Explaining CKD biomarkers (creatinine, GFR, etc.)
- Form field help text
- Feature introductions
- Medical terminology definitions

**Example Implementation:**

```tsx
// Basic tooltip
<label className="flex items-center gap-2">
  혈청 크레아티닌
  <Tooltip content="신장 기능을 나타내는 핵심 지표입니다." />
</label>

// Medical term with detailed explanation
<div className="flex items-center gap-2">
  <span>GFR (사구체여과율)</span>
  <MedicalTooltip
    term="GFR (Glomerular Filtration Rate)"
    definition="신장이 혈액을 걸러내는 능력을 나타내는 수치입니다."
    normalRange="90 mL/min/1.73m² 이상"
    whyItMatters="GFR이 낮아지면 만성신장병이 진행되고 있다는 신호입니다."
  />
</div>
```

**Where to Add:**
- [ ] SignupPage - Disease info step (CKD stage selection)
- [ ] MyPageEnhanced - Health profile section
- [ ] DietCarePageEnhanced - Nutrient cards
- [ ] Any form with medical terminology

### 2. ConfirmDialog Component

**Purpose:** Prevent accidental data loss through confirmation

**Use Cases:**
- Deleting posts, comments, chat rooms
- Clearing history
- Logging out
- Removing bookmarks

**Example Implementation:**

```tsx
function CommunityPost() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(postId);
      toast.success('게시글이 삭제되었습니다.');
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowDeleteDialog(true)}>
        게시글 삭제
      </button>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
```

**Where to Add:**
- [ ] ChatPageEnhanced - Reset session, delete room
- [ ] MyPageEnhanced - Logout, delete account
- [ ] CommunityPageEnhanced - Delete post, delete comment
- [ ] DietCarePageEnhanced - Delete meal log

### 3. OnboardingTour Component

**Purpose:** Guide first-time users through features

**Use Cases:**
- First-time chat experience
- Meal logging walkthrough
- Community guidelines introduction
- Feature discovery

**Example Implementation:**

```tsx
// Define tour steps
const chatTourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: '케어가이드에 오신 것을 환영합니다!',
    content: (
      <div>
        <p className="mb-2">
          AI 건강 도우미가 신장병 관리를 도와드립니다.
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          <li>24/7 AI 전문가 상담</li>
          <li>식단 관리 및 영양 정보</li>
          <li>건강 커뮤니티 참여</li>
        </ul>
      </div>
    ),
    placement: 'center',
  },
  {
    id: 'agent-tabs',
    target: '[data-tour="agent-tabs"]',
    title: '전문 AI 에이전트 선택',
    content: '의료복지, 식이영양, 연구논문 전문가 중에서 선택하세요. 자동 선택도 가능합니다.',
    placement: 'bottom',
  },
  {
    id: 'suggestions',
    target: '[data-tour="suggestion-chips"]',
    title: '추천 질문',
    content: '무엇을 물어볼지 모르겠다면, 이 추천 질문을 클릭해보세요.',
    placement: 'top',
  },
  {
    id: 'input',
    target: '[data-tour="chat-input"]',
    title: '메시지 입력',
    content: '궁금한 점을 자유롭게 물어보세요. 사진 업로드도 가능합니다.',
    placement: 'top',
  },
];

// In component
function ChatPageEnhanced() {
  const [showTour, setShowTour] = useState(() =>
    shouldShowTour('chat-intro')
  );

  return (
    <>
      <OnboardingTour
        tourId="chat-intro"
        steps={chatTourSteps}
        isActive={showTour}
        onComplete={() => setShowTour(false)}
        onSkip={() => setShowTour(false)}
      />

      {/* Add data-tour attributes to target elements */}
      <div data-tour="agent-tabs">
        {/* Agent tabs */}
      </div>

      <div data-tour="suggestion-chips">
        {/* Suggestion chips */}
      </div>

      <div data-tour="chat-input">
        {/* Chat input */}
      </div>
    </>
  );
}
```

**Where to Add:**
- [ ] ChatPageEnhanced - First-time chat experience
- [ ] DietCarePageEnhanced - Meal logging workflow
- [ ] CommunityPageEnhanced - Community guidelines
- [ ] MyPageEnhanced - Profile setup

**Important:** Add `data-tour="unique-id"` attributes to elements you want to highlight.

### 4. EmptyState Component

**Purpose:** Convert empty states into opportunities for engagement

**Use Cases:**
- No chat messages yet
- No meal logs
- No community posts
- No search results
- Error states

**Example Implementation:**

```tsx
import { NoChatMessagesEmpty } from '../components/common';

function ChatMessages() {
  const messages = useMessages();

  if (messages.length === 0) {
    return (
      <NoChatMessagesEmpty
        onStartChat={() => {
          // Focus input or show suggestions
          inputRef.current?.focus();
        }}
      />
    );
  }

  return (
    <div>
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
    </div>
  );
}

// Custom empty state
<EmptyState
  icon={<Trophy size={48} className="text-amber-400" />}
  title="아직 퀴즈를 풀지 않으셨네요!"
  description="건강 상식을 재미있게 배우고 포인트도 획득하세요."
  primaryAction={{
    label: '첫 퀴즈 시작',
    onClick: () => navigate('/quiz'),
    icon: <Trophy size={18} />
  }}
/>
```

**Where to Add:**
- [ ] ChatMessages - No messages state
- [ ] DietLogContent - No meal logs
- [ ] CommunityPageEnhanced - No posts
- [ ] TrendsPageEnhanced - No bookmarks
- [ ] MyPageEnhanced - Empty quiz stats

---

## Phase 1: Critical Fixes (Week 1)

### 1.1 Add Onboarding Tutorial

**File:** `ChatPageEnhanced.tsx`

**Steps:**
1. Import OnboardingTour component
2. Define tour steps (see example above)
3. Add `data-tour` attributes to target elements
4. Add state management for tour visibility
5. Test tour flow on mobile and desktop

**Code Changes:**

```tsx
// At top of file
import { OnboardingTour, shouldShowTour } from '../components/common';

// In component
const [showTour, setShowTour] = useState(() => shouldShowTour('chat-intro'));

// Define tour steps
const chatTourSteps: TourStep[] = [
  // ... steps here
];

// In JSX, before main content
<OnboardingTour
  tourId="chat-intro"
  steps={chatTourSteps}
  isActive={showTour}
  onComplete={() => setShowTour(false)}
  onSkip={() => setShowTour(false)}
/>

// Add data-tour attributes to target elements
<div data-tour="agent-tabs" className="...">
```

**Testing:**
- [ ] Tour appears on first visit
- [ ] Tour doesn't appear after completion
- [ ] "Don't show again" works
- [ ] Skip button works
- [ ] Keyboard navigation works (← → ESC)
- [ ] Mobile responsive

### 1.2 Add Confirmation Dialogs

**Files to Update:**
- `ChatPageEnhanced.tsx` (reset session, delete room)
- `MyPageEnhanced.tsx` (logout)
- `CommunityPageEnhanced.tsx` (delete post)

**Example for Logout:**

```tsx
// In MyPageEnhanced.tsx
import { ConfirmDialog } from '../components/common';

const [showLogoutDialog, setShowLogoutDialog] = useState(false);

// Replace direct logout with dialog
<button onClick={() => setShowLogoutDialog(true)}>
  <LogOut size={18} className="mr-2" /> 로그아웃
</button>

<ConfirmDialog
  isOpen={showLogoutDialog}
  title="로그아웃"
  message="정말 로그아웃하시겠습니까?"
  confirmText="로그아웃"
  cancelText="취소"
  variant="warning"
  onConfirm={() => {
    logout();
    navigate(ROUTES.MAIN);
  }}
  onCancel={() => setShowLogoutDialog(false)}
/>
```

**Testing:**
- [ ] Dialog appears on action trigger
- [ ] ESC key closes dialog
- [ ] Click outside closes dialog
- [ ] Focus returns to trigger after close
- [ ] Confirm action works
- [ ] Cancel action works

### 1.3 Fix Form Validation Timing

**File:** `SignupPage.tsx`

**Current Issue:** Validation fires immediately as user types

**Solution:** Delay validation until blur or 500ms after typing stops

```tsx
// Add debounced validation
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

// In component
const [emailError, setEmailError] = useState('');

const validateEmail = useMemo(
  () =>
    debounce((email: string) => {
      if (!email) {
        setEmailError('');
        return;
      }
      if (!email.includes('@')) {
        setEmailError('이메일 주소에 @를 포함해주세요.');
      } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setEmailError('올바른 이메일 형식이 아닙니다. (예: user@example.com)');
      } else {
        setEmailError('');
      }
    }, 500),
  []
);

// In input onChange
onChange={(e) => {
  setAccountInfo({ ...accountInfo, email: e.target.value });
  validateEmail(e.target.value);
}}

// Show error with improved message
{emailError && (
  <p className="mt-1 text-sm text-red-600">{emailError}</p>
)}
```

**Testing:**
- [ ] Error doesn't appear immediately
- [ ] Error appears 500ms after typing stops
- [ ] Error appears on blur
- [ ] Error messages are specific and helpful
- [ ] Successful validation shows checkmark

### 1.4 Add Medical Term Tooltips

**Files to Update:**
- `SignupPage.tsx` (disease info step)
- `KidneyDiseaseStagePage.tsx`
- `NutriCoachContent.tsx` (nutrient cards)

**Implementation:**

```tsx
// In SignupPage.tsx, disease selection step
import { MedicalTooltip } from '../components/common';

// Update disease options with tooltips
const diseaseOptions = [
  {
    label: (
      <div className="flex items-center gap-2">
        <span>만성신장병 1단계</span>
        <MedicalTooltip
          term="CKD 1단계"
          definition="신장 기능이 정상이지만 소변이나 영상검사에서 이상이 발견된 단계입니다."
          normalRange="GFR ≥ 90 mL/min/1.73m²"
          whyItMatters="조기 발견으로 진행을 늦출 수 있는 중요한 시기입니다."
        />
      </div>
    ),
    value: 'CKD1',
  },
  // ... more options
];
```

**Testing:**
- [ ] Tooltip appears on hover (desktop)
- [ ] Tooltip appears on tap (mobile)
- [ ] Tooltip closes on ESC
- [ ] Tooltip closes on click outside (mobile)
- [ ] Content is readable and helpful

### 1.5 Add Health Profile Completion Nudge

**File:** `SignupPage.tsx`

**Implementation:**

```tsx
// After successful signup, before navigation
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    await signup({...});

    toast.success('회원가입이 완료되었습니다!', {
      description: '건강 프로필을 완성하면 맞춤형 추천을 받을 수 있습니다.',
      action: {
        label: '지금 완성하기',
        onClick: () => navigate(ROUTES.MY_PAGE + '?openHealthProfile=true'),
      },
    });

    // Navigate after delay
    setTimeout(() => {
      navigate(ROUTES.MY_PAGE + '?openHealthProfile=true');
    }, 2000);
  } catch (error) {
    // ...
  }
};
```

**File:** `MyPageEnhanced.tsx`

```tsx
// Check URL parameter and open health profile modal
useEffect(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('openHealthProfile') === 'true') {
    setIsHealthModalOpen(true);
  }
}, [location.search]);
```

**Testing:**
- [ ] Success toast shows with action button
- [ ] Modal opens automatically
- [ ] User can skip modal
- [ ] Profile completion is tracked

### 1.6 Improve Accessibility

**Skip Link Implementation:**

```tsx
// In AppLayout.tsx, before main content
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
>
  본문으로 건너뛰기
</a>

<main id="main-content" className="...">
  {/* Main content */}
</main>
```

**Testing:**
- [ ] Skip link appears on Tab focus
- [ ] Skip link navigates to main content
- [ ] Focus moves correctly
- [ ] Works with screen reader

---

## Phase 2: High-Value Enhancements (Week 2)

### 2.1 Add Contextual Help System

**Create:** `HelpButton.tsx`

```tsx
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HelpButtonProps {
  topic: string;
  content: React.ReactNode;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ topic, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 lg:bottom-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="도움말"
      >
        <HelpCircle size={24} />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">{topic}</h3>
            <div className="text-gray-700">{content}</div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
};
```

**Add to Each Major Page:**
- ChatPageEnhanced
- DietCarePageEnhanced
- CommunityPageEnhanced
- MyPageEnhanced

### 2.2 Add Lab Result Tracking Feature

**Create:** `LabResultsTracker.tsx` in `components/mypage/`

```tsx
// Features:
// - Add lab result (date, test name, value, unit)
// - Trend visualization (Chart.js or Recharts)
// - Normal range indicators
// - Educational tooltips on each biomarker
// - Export to PDF
```

This is a larger feature - see detailed spec in separate file.

### 2.3 Improve Mobile Keyboard Handling

**File:** `ChatInput.tsx`

```tsx
// Add ref to input
const inputRef = useRef<HTMLInputElement>(null);

// Scroll input into view on focus
useEffect(() => {
  const input = inputRef.current;
  if (!input) return;

  const handleFocus = () => {
    setTimeout(() => {
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300); // Wait for keyboard animation
  };

  input.addEventListener('focus', handleFocus);
  return () => input.removeEventListener('focus', handleFocus);
}, []);
```

**Testing:**
- [ ] Input scrolls into view on iOS Safari
- [ ] Input scrolls into view on Android Chrome
- [ ] No double-scroll issue
- [ ] Keyboard opens smoothly

---

## Phase 3: Engagement Features (Week 3)

### 3.1 Add Nutrient Goal Setting

**File:** `DietCarePageEnhanced.tsx`

**Features:**
- Set daily limits for sodium, potassium, protein
- Progress bars showing current vs goal
- Warnings when approaching limit
- Personalized based on CKD stage

**Implementation:** See detailed spec in separate file.

### 3.2 Add Meal History Calendar

**File:** `DietLogContent.tsx`

**Features:**
- Calendar view of logged meals
- Color coding (green = within limits, yellow = warning, red = over limit)
- Daily nutrient totals
- Click to view meal details

**Library:** Use `react-calendar` or build custom with date-fns

### 3.3 Add Community Guidelines & Report System

**File:** `CommunityPageEnhanced.tsx`

**Implementation:**

```tsx
// Show guidelines banner on first visit
const [showGuidelines, setShowGuidelines] = useState(() =>
  !localStorage.getItem('community_guidelines_seen')
);

{showGuidelines && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h3 className="font-bold text-blue-900 mb-2">커뮤니티 가이드라인</h3>
    <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
      <li>서로를 존중하고 배려해주세요</li>
      <li>의학적 조언은 반드시 전문가와 상담하세요</li>
      <li>개인정보를 공유하지 마세요</li>
    </ul>
    <button
      onClick={() => {
        localStorage.setItem('community_guidelines_seen', 'true');
        setShowGuidelines(false);
      }}
      className="mt-3 text-sm text-blue-600 underline"
    >
      확인했습니다
    </button>
  </div>
)}

// Add report button on each post
<button
  onClick={() => handleReport(post.id)}
  className="text-gray-400 hover:text-red-500"
  aria-label="신고"
>
  <Flag size={16} />
</button>
```

### 3.4 Add Encouragement Messages

**Create:** `EncouragementSystem.tsx`

```tsx
// Features:
// - Daily health tip on login
// - Streak rewards
// - Progress celebrations
// - Personalized messages based on user activity

// Example messages:
const encouragements = {
  login: [
    "안녕하세요! 오늘도 건강한 하루 되세요.",
    "만나서 반가워요! 오늘의 건강 목표를 확인해볼까요?",
  ],
  mealLog: [
    "식단 기록 완료! 꾸준함이 가장 중요합니다.",
    "훌륭해요! 오늘도 건강 관리 성공!",
  ],
  streak: [
    "7일 연속 기록! 대단해요! 🎉",
    "한 달 연속 달성! 정말 자랑스러워요! 🏆",
  ],
};
```

---

## Phase 4: Polish & Delight (Week 4)

### 4.1 Add Microinteractions

**Button Press Animation:**

```tsx
// Add to button classes
className="... active:scale-95 transition-transform"
```

**Success Celebration:**

```tsx
// After quiz completion
import confetti from 'canvas-confetti';

confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
});
```

### 4.2 Add Haptic Feedback (Mobile)

```tsx
// Create utility function
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[type]);
  }
};

// Use in components
<button
  onClick={() => {
    hapticFeedback('light');
    handleClick();
  }}
>
  클릭
</button>
```

### 4.3 Add Trust Badges

**Create:** `TrustBadge.tsx`

```tsx
export const TrustBadge: React.FC<{ variant: 'privacy' | 'security' | 'verified' }> = ({ variant }) => {
  // Display badges indicating:
  // - Data encryption
  // - Privacy compliance
  // - Medical information verification
};
```

**Add to:**
- Signup page (privacy badge)
- Login page (security badge)
- Footer (all badges)

---

## Testing Guidelines

### Manual Testing Checklist

**For Each Component:**
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Desktop Firefox
- [ ] Mobile iOS Safari
- [ ] Mobile Android Chrome
- [ ] Tablet (iPad)

**Interaction Tests:**
- [ ] Mouse interaction
- [ ] Keyboard navigation (Tab, Enter, ESC, Arrow keys)
- [ ] Touch interaction (tap, swipe)
- [ ] Screen reader (VoiceOver on iOS, TalkBack on Android)

**Edge Cases:**
- [ ] Very long text
- [ ] Very short text
- [ ] Empty states
- [ ] Error states
- [ ] Loading states
- [ ] Offline mode

### Automated Testing

**Add Tests for:**
1. Component rendering
2. User interactions
3. Accessibility (axe-core)
4. Visual regression (Chromatic or Percy)

**Example Test:**

```tsx
// ConfirmDialog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('calls onConfirm when confirmed', () => {
    const handleConfirm = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test message"
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByText('확인'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on ESC key', () => {
    const handleCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={handleCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
```

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance

**Perceivable:**
- [ ] All images have alt text
- [ ] Color is not the only visual means of conveying information
- [ ] Text has minimum 4.5:1 contrast ratio
- [ ] Text can be resized up to 200% without loss of functionality

**Operable:**
- [ ] All functionality available via keyboard
- [ ] No keyboard trap
- [ ] Skip links provided
- [ ] Focus indicators visible
- [ ] Touch targets minimum 44x44px

**Understandable:**
- [ ] Language of page identified (lang="ko")
- [ ] Error messages are clear and specific
- [ ] Labels and instructions provided for inputs
- [ ] Consistent navigation

**Robust:**
- [ ] Valid HTML
- [ ] ARIA attributes used correctly
- [ ] Compatible with assistive technologies

### Screen Reader Testing

**VoiceOver (iOS):**
1. Enable: Settings > Accessibility > VoiceOver
2. Navigate: Swipe right/left
3. Activate: Double-tap

**Test Scenarios:**
- [ ] Navigate through signup flow
- [ ] Send a chat message
- [ ] Log a meal
- [ ] Create a community post
- [ ] Complete a quiz

---

## Performance Considerations

### Code Splitting

Already implemented via React.lazy in AppRoutes. New components should follow this pattern if they're page-level.

### Image Optimization

- Use WebP format with JPEG fallback
- Lazy load images below fold
- Add loading="lazy" to img tags
- Compress images (TinyPNG, ImageOptim)

### Bundle Size

- Audit bundle size: `npm run build -- --stats`
- Visualize: `npx webpack-bundle-analyzer dist/stats.json`
- Target: Keep main bundle under 500KB gzipped

---

## Common Pitfalls to Avoid

1. **Don't skip accessibility testing** - Screen reader testing is non-optional
2. **Don't hardcode strings** - Use i18n for all user-facing text
3. **Don't ignore mobile** - 50%+ users are on mobile
4. **Don't forget loading states** - Every async action needs feedback
5. **Don't use generic error messages** - Be specific and actionable
6. **Don't assume technical literacy** - CKD patients are elderly-skewed
7. **Don't be judgmental** - Supportive language only
8. **Don't hide important info in tooltips** - Critical info should be visible

---

## Questions & Support

For questions about this implementation:
1. Check the UX_EVALUATION_REPORT.md for context
2. Review component inline documentation
3. Check existing component examples
4. Ask in team Slack channel

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
**Author:** UX Design Team
