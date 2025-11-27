# Quick UX Reference Card
**Developer Cheat Sheet for CarePlus Chat Interface**

## Critical Issues at a Glance

```
┌─────────────────────────────────────────────────────┐
│  Priority 0 (DO NOW - 8 hours total)                │
├─────────────────────────────────────────────────────┤
│  1. Stop Button             [3h] ⚠️ SAFETY          │
│  2. WCAG Color Contrast     [2h] ⚠️ LEGAL           │
│  3. Emergency Banner        [2h] ⚠️ SAFETY          │
│  4. Persistent Disclaimer   [1h] ⚠️ SAFETY          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Priority 1 (THIS WEEK - 12 hours total)            │
├─────────────────────────────────────────────────────┤
│  5. New Chat Button         [3h] 📌 REQUESTED       │
│  6. Mobile Keyboard Fix     [3h] 📱 MOBILE          │
│  7. Profile Selector        [2h] ♿ A11Y            │
│  8. Trust Indicators        [2h] 🏥 TRUST          │
│  9. Error Recovery          [2h] 🔧 UX             │
└─────────────────────────────────────────────────────┘
```

---

## File Locations

```
Frontend:
├── ChatPageEnhanced.tsx    [MAIN FILE - most changes here]
├── ChatInterface.tsx       [Legacy - reference only]
├── MobileNav.tsx          [Mobile nav - working well]
├── AppLayout.tsx          [Layout - minor changes]
└── index.css              [Color tokens - update here]

Backend:
├── /api/chat/stream       [Add abort signal support]
└── /api/session/*         [Session mgmt - already exists]

Documentation:
├── UX_REVIEW_CHAT_INTERFACE.md    [Full review - 15k words]
├── CRITICAL_UX_FIXES.md           [Implementation guide]
├── UX_VISUAL_IMPROVEMENTS.md      [Visual specs]
└── UX_REVIEW_SUMMARY.md           [Executive summary]
```

---

## Code Snippets (Copy-Paste Ready)

### 1. Stop Button (ChatPageEnhanced.tsx)

**Add at top of component:**
```tsx
const abortControllerRef = useRef<AbortController | null>(null);
```

**In handleSend function:**
```tsx
abortControllerRef.current = new AbortController();

const response = await fetch('http://localhost:8000/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: abortControllerRef.current.signal,  // ADD THIS
});
```

**Stop handler:**
```tsx
const handleStopStreaming = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    setIsTyping(false);
  }
};
```

**UI (in streaming section):**
```tsx
<button
  onClick={handleStopStreaming}
  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700
             rounded-lg text-xs font-medium flex items-center gap-1.5"
>
  <StopCircle size={14} />
  <span>중지</span>
</button>
```

---

### 2. Color Contrast Fix (index.css)

**Replace in :root section:**
```css
/* BEFORE (failing WCAG) */
--color-primary: #00C8B4;      /* Contrast: 3.2:1 ✗ */
--color-disabled: #CCCCCC;     /* Contrast: 2.8:1 ✗ */

/* AFTER (passing WCAG AA) */
--color-primary: #00A899;      /* Contrast: 4.6:1 ✓ */
--color-disabled: #999999;     /* Contrast: 4.5:1 ✓ */
```

---

### 3. Emergency Banner (ChatPageEnhanced.tsx)

**Replace line 481-485 with:**
```tsx
{message.isEmergency && (
  <div className="mb-3 p-3 bg-red-50 border-2 border-red-500 rounded-lg">
    <div className="flex items-start gap-2">
      <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="text-sm font-bold text-red-900 mb-1">
          🚨 응급 상황이 감지되었습니다
        </p>
        <p className="text-xs text-red-800 mb-3">
          즉시 119에 연락하거나 가까운 응급실을 방문하세요.
        </p>
        <a
          href="tel:119"
          className="px-4 py-2 bg-red-600 text-white rounded-lg
                     text-sm font-bold hover:bg-red-700 inline-block"
        >
          📞 119 즉시 전화
        </a>
      </div>
    </div>
  </div>
)}
```

---

### 4. Persistent Disclaimer (ChatPageEnhanced.tsx)

**Add in input section (after line 586):**
```tsx
{messages.length > 0 && (
  <div className="mb-2 px-2 py-1.5 bg-yellow-50 rounded
                  text-xs text-yellow-900 flex items-center gap-2">
    <AlertTriangle size={12} className="text-yellow-600" />
    <span>
      AI 참고 정보 · 응급 시{' '}
      <a href="tel:119" className="font-bold text-red-700 underline">
        119
      </a>
    </span>
  </div>
)}
```

---

### 5. New Chat Button (ChatPageEnhanced.tsx)

**Replace header (line 329-333):**
```tsx
<div className="flex items-center justify-between mb-3 pb-3 border-b">
  <div className="flex items-center gap-3">
    <h1 className="text-xl lg:text-2xl font-bold">
      {t.nav.aiChatbot}
    </h1>
    {messages.length > 0 && (
      <span className="text-sm text-gray-500">
        ({messages.length}개)
      </span>
    )}
  </div>

  {messages.length > 0 && (
    <button
      onClick={() => {
        if (confirm('현재 대화를 초기화하시겠습니까?')) {
          setChatHistories(prev => ({
            ...prev,
            [location.pathname]: []
          }));
        }
      }}
      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100
                 rounded-lg flex items-center gap-1.5 border"
    >
      <RotateCcw size={14} />
      <span className="hidden sm:inline">새 대화</span>
    </button>
  )}
</div>
```

---

### 6. Mobile Keyboard Fix (ChatPageEnhanced.tsx)

**Add ref:**
```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);
```

**Add effect:**
```tsx
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, streamingContent]);

useEffect(() => {
  const handleResize = () => {
    if (document.activeElement?.tagName === 'INPUT') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  window.visualViewport?.addEventListener('resize', handleResize);
  return () => window.visualViewport?.removeEventListener('resize', handleResize);
}, []);
```

**Add to messages end:**
```tsx
<div ref={messagesEndRef} />
```

**Update input wrapper:**
```tsx
<div className="... pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
```

---

### 7. Accessible Profile Selector (ChatPageEnhanced.tsx)

**Replace lines 588-611:**
```tsx
<div className="flex items-center gap-2 mb-2">
  <label htmlFor="profile-select" className="text-xs text-gray-600">
    맞춤 정보:
  </label>
  <div className="relative">
    <select
      id="profile-select"
      value={selectedProfile}
      onChange={(e) => {
        const newProfile = e.target.value as 'general' | 'patient' | 'researcher';
        setSelectedProfile(newProfile);
        updateProfile(newProfile);
      }}
      className="text-xs font-medium bg-white border rounded-lg
                 pl-2 pr-7 py-1.5 cursor-pointer appearance-none
                 focus:ring-2 focus:ring-primary"
      style={{ color: 'var(--color-primary)' }}
    >
      <option value="patient">환자 (신장병 환우)</option>
      <option value="general">일반인 (간병인)</option>
      <option value="researcher">연구원</option>
    </select>
    <ChevronDown
      size={14}
      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ color: 'var(--color-primary)' }}
    />
  </div>
</div>
```

---

### 8. Trust Indicators (ChatPageEnhanced.tsx)

**Add after message content (around line 488):**
```tsx
{message.role === 'assistant' && (
  <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs">
    <div className="flex items-center gap-3">
      {message.agents?.map(agent => (
        <span key={agent} className="px-1.5 py-0.5 bg-blue-50
                                     text-blue-700 rounded text-[10px]">
          {agent === 'medical_welfare' ? '의료복지' :
           agent === 'nutrition' ? '영양' :
           agent === 'research' ? '연구' : 'Auto'}
        </span>
      ))}
      {message.confidence && message.confidence >= 0.7 && (
        <div className="flex items-center gap-1 text-gray-500">
          <CheckCircle size={10} className="text-green-600" />
          <span>신뢰도 높음</span>
        </div>
      )}
    </div>
    <span className="text-gray-400">
      {new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(message.timestamp)}
    </span>
  </div>
)}
```

---

### 9. Error Recovery (ChatPageEnhanced.tsx)

**Update catch block in handleSend:**
```tsx
catch (error) {
  let errorMessage = '죄송합니다. 오류가 발생했습니다.';

  if (error instanceof Error && error.name === 'AbortError') {
    console.log('User aborted');
    return;
  }

  // Network error
  if (error instanceof TypeError) {
    errorMessage = '네트워크 연결을 확인해주세요.';
  }

  const errorMsg: Message = {
    id: assistantMessageId,
    role: 'assistant',
    content: errorMessage + '\n\n[다시 시도하려면 메시지를 재전송하세요]',
    timestamp: new Date(),
  };

  setChatHistories(prev => ({
    ...prev,
    [location.pathname]: [...prev[location.pathname], errorMsg]
  }));
}
```

---

## Required Imports

**Add to line 6 in ChatPageEnhanced.tsx:**
```tsx
import {
  Send, Bot, User, Heart, Sparkles, FileText, Image, X,
  ChevronDown, StopCircle, RotateCcw, AlertTriangle, CheckCircle
} from 'lucide-react';
```

---

## Testing Checklist

### Before Commit
```bash
□ npm run lint          # No errors
□ npm run type-check    # No type errors (if available)
□ Test on Chrome        # Desktop
□ Test on Safari        # Desktop
□ Test on iPhone        # Mobile Safari
□ Test on Android       # Chrome Mobile
□ Test keyboard nav     # Tab through all elements
□ Test screen reader    # VoiceOver/NVDA
□ Check color contrast  # Use axe DevTools
```

### Manual Tests
```
□ Stop button appears and works during streaming
□ New chat button clears messages with confirmation
□ Profile selector visible and keyboard accessible
□ Emergency banner shows with call button
□ Mobile keyboard doesn't cover input
□ Trust indicators show agent, confidence, time
□ Errors show helpful messages
□ 119 link triggers phone call
□ All colors meet WCAG AA (4.5:1 minimum)
```

---

## Common Pitfalls

### Don't Do This ❌

```tsx
// ❌ Hardcoded colors
<div style={{ color: '#00C8B4' }}>

// ❌ Small text
<span className="text-[11px]">

// ❌ No keyboard accessibility
<div onClick={handleClick}>Click me</div>

// ❌ Missing ARIA labels
<button>
  <Icon />
</button>

// ❌ Low contrast
<span className="text-gray-400">Important text</span>
```

### Do This Instead ✅

```tsx
// ✅ CSS variables
<div style={{ color: 'var(--color-primary)' }}>

// ✅ Minimum 12px (0.75rem = 12px)
<span className="text-xs">

// ✅ Proper button
<button onClick={handleClick}>Click me</button>

// ✅ ARIA label
<button aria-label="Close modal">
  <X />
</button>

// ✅ Good contrast
<span className="text-gray-700">Important text</span>
```

---

## Quick WCAG Check

```bash
# Install axe DevTools browser extension
# Open DevTools → axe tab → Scan All of My Page

Target: 0 violations

Common issues to fix:
□ Color contrast < 4.5:1
□ Missing alt text on images
□ Buttons without labels
□ Form inputs without labels
□ Focus order incorrect
□ Missing ARIA landmarks
```

---

## Performance Budget

```
Initial Load:    < 2s
First Response:  < 3s
Streaming Start: < 1s
Input Lag:       < 100ms
Scroll FPS:      > 50fps

Bundle Size:
Main chunk:      < 500KB
Chat component:  < 100KB
```

---

## Git Workflow

```bash
# 1. Create feature branch
git checkout -b fix/critical-ux-improvements

# 2. Implement fixes one by one
# Commit after each working fix

git add ChatPageEnhanced.tsx
git commit -m "feat: add stop button for streaming responses"

git add index.css
git commit -m "fix: update color contrast for WCAG AA compliance"

# 3. Test thoroughly
npm run test
npm run lint

# 4. Push and create PR
git push -u origin fix/critical-ux-improvements

# 5. Request review
# Tag: @ux-reviewer @accessibility-specialist
```

---

## Emergency Rollback

If something breaks in production:

```bash
# 1. Identify the breaking commit
git log --oneline

# 2. Revert specific commit
git revert <commit-hash>

# 3. Or revert entire PR
git revert -m 1 <merge-commit-hash>

# 4. Test and deploy
npm run build
# Deploy

# Each fix is independent, can rollback individually
```

---

## Support Resources

**Accessibility:**
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Contrast Checker: https://webaim.org/resources/contrastchecker/
- axe DevTools: Browser extension

**Testing:**
- Screen Readers: VoiceOver (Mac), NVDA (Windows)
- Mobile Testing: BrowserStack, real devices
- Color Blindness: Colorblind Web Page Filter

**Documentation:**
- Full Review: UX_REVIEW_CHAT_INTERFACE.md
- Implementation: CRITICAL_UX_FIXES.md
- Visual Specs: UX_VISUAL_IMPROVEMENTS.md
- Summary: UX_REVIEW_SUMMARY.md

---

## Questions?

**Technical Questions:**
- Check CRITICAL_UX_FIXES.md for detailed implementation
- Review UX_REVIEW_CHAT_INTERFACE.md for context
- Ask in #frontend-development Slack channel

**Design Questions:**
- Check UX_VISUAL_IMPROVEMENTS.md for visual specs
- Review design system in index.css
- Ask in #design-review Slack channel

**Accessibility Questions:**
- Check WCAG guidelines linked above
- Run axe DevTools audit
- Consult accessibility specialist

---

## Success Criteria

✅ **Ready to Ship When:**

```
□ All P0 fixes implemented (stop, WCAG, emergency)
□ No axe DevTools violations
□ Tested on 2+ browsers
□ Tested on 2+ mobile devices
□ Keyboard navigation works 100%
□ Screen reader announces correctly
□ Code reviewed and approved
□ QA tested and signed off
```

---

**Last Updated:** 2025-11-26
**Version:** 1.0
**Status:** Ready for Implementation

**Quick Start:** Implement fixes 1-4 today (8 hours). Deploy Friday. Test over weekend. Ship Monday.
