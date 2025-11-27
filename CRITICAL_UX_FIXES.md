# Critical UX Fixes - Implementation Guide
**Quick Reference for Immediate Implementation**

## Priority 1: Stop Button (CRITICAL)

### File: `ChatPageEnhanced.tsx`

**Add abort controller:**
```tsx
// Add near top of component (after line 51)
const abortControllerRef = useRef<AbortController | null>(null);
```

**Update handleSend function (around line 229):**
```tsx
try {
  // Create new abort controller
  abortControllerRef.current = new AbortController();

  const response = await fetch('http://localhost:8000/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: abortControllerRef.current.signal, // ADD THIS LINE
  });

  // ... rest of streaming logic
} catch (error) {
  // Handle abort
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Streaming aborted by user');
    // Save partial response if any
    if (streamingContent) {
      const partialMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: streamingContent + '\n\n_[응답이 중단되었습니다]_',
        timestamp: new Date(),
      };
      setChatHistories(prev => ({
        ...prev,
        [location.pathname]: [...prev[location.pathname], partialMessage]
      }));
    }
    return; // Don't treat as error
  }
  // ... existing error handling
}
```

**Add stop handler:**
```tsx
// Add after handleSend function
const handleStopStreaming = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    setIsTyping(false);
    setStreamingContent('');
  }
};
```

**Add stop button UI (replace line 518-541):**
```tsx
{isTyping && streamingContent && (
  <div className="flex justify-start">
    <div className="max-w-3xl rounded-xl p-4"
      style={{
        background: '#F9FAFB',
        color: 'var(--color-text-primary)',
        border: '1px solid #E0E0E0',
        borderRadius: '4px 12px 12px 12px'
      }}
    >
      <div className="flex items-start gap-3">
        <Bot size={20} className="mt-1 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        <div className="flex-1">
          <div className="whitespace-pre-wrap text-xs">{streamingContent}</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }}></div>
              <span>응답 생성 중...</span>
            </div>
            <button
              onClick={handleStopStreaming}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg
                         text-xs font-medium transition-colors flex items-center gap-1.5"
              aria-label="응답 생성 중지"
            >
              <StopCircle size={14} />
              <span>중지</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

**Import StopCircle icon (line 6):**
```tsx
import { Send, Bot, User, Heart, Sparkles, FileText, Image, X, ChevronDown, StopCircle, RotateCcw } from 'lucide-react';
```

---

## Priority 2: New Chat Button

### File: `ChatPageEnhanced.tsx`

**Add to header section (after line 333):**
```tsx
<div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
  <div className="flex items-center gap-3">
    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
      {t.nav.aiChatbot}
    </h1>
    {messages.length > 0 && (
      <span className="text-sm text-gray-500">
        ({messages.length}개 메시지)
      </span>
    )}
  </div>

  {messages.length > 0 && (
    <button
      onClick={() => {
        if (confirm('현재 대화를 초기화하시겠습니까?\n\n저장된 대화 기록은 유지되며, 새로운 대화를 시작합니다.')) {
          setChatHistories(prev => ({
            ...prev,
            [location.pathname]: []
          }));
        }
      }}
      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900
                 hover:bg-gray-100 rounded-lg transition-colors
                 flex items-center gap-1.5 border border-gray-200"
      aria-label="새 대화 시작"
    >
      <RotateCcw size={14} />
      <span className="hidden sm:inline">새 대화</span>
    </button>
  )}
</div>
```

---

## Priority 3: Accessible Profile Selector

### File: `ChatPageEnhanced.tsx`

**Replace profile selector (lines 588-611) with:**
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
      className="text-xs font-medium bg-white border border-gray-300 rounded-lg
                 pl-2 pr-7 py-1.5 cursor-pointer appearance-none
                 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                 hover:border-primary transition-colors"
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

## Priority 4: Enhanced Emergency Banner

### File: `ChatPageEnhanced.tsx`

**Replace emergency display (lines 481-485) with:**
```tsx
{message.isEmergency && (
  <div className="mb-3 p-3 bg-red-50 border-2 border-red-500 rounded-lg shadow-sm">
    <div className="flex items-start gap-2">
      <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="text-sm font-bold text-red-900 mb-1">
          🚨 응급 상황이 감지되었습니다
        </p>
        <p className="text-xs text-red-800 mb-3 leading-relaxed">
          AI가 응급 상황 가능성을 감지했습니다. 즉시 전문 의료진의 도움을 받으세요.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="tel:119"
            className="px-4 py-2 bg-red-600 text-white rounded-lg
                       text-sm font-bold hover:bg-red-700 transition-colors
                       flex items-center gap-2 min-h-[44px] justify-center"
          >
            📞 119 즉시 전화
          </a>
          <a
            href="tel:1339"
            className="px-4 py-2 border-2 border-red-600 text-red-600
                       rounded-lg text-sm font-medium hover:bg-red-50
                       transition-colors flex items-center gap-2 min-h-[44px]"
          >
            응급의료상담 1339
          </a>
        </div>
      </div>
    </div>
  </div>
)}
```

**Add import:**
```tsx
import { /*...*/ AlertTriangle } from 'lucide-react';
```

---

## Priority 5: Mobile Keyboard Fix

### File: `ChatPageEnhanced.tsx`

**Add ref for messages end (after line 51):**
```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);
```

**Add scroll effect:**
```tsx
// Add after useEffect for page visibility (around line 57)
useEffect(() => {
  // Scroll to bottom when messages change
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, streamingContent]);

// Handle keyboard on mobile
useEffect(() => {
  const handleResize = () => {
    // When keyboard opens (viewport shrinks), scroll to bottom
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

**Add ref to messages end (at end of messages div, around line 563):**
```tsx
{/* After all messages and streaming content */}
<div ref={messagesEndRef} />
```

**Update input wrapper for safe area (line 586):**
```tsx
<div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700
                p-3 lg:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
```

---

## Priority 6: WCAG Color Contrast Fixes

### File: `index.css`

**Update CSS variables (around line 36):**
```css
:root {
  /* Updated primary for better contrast (was #00C9B7) */
  --color-primary: #00A899;
  --color-primary-hover: #008C80;
  --color-primary-pressed: #007066;

  /* Darker disabled for better contrast (was #CCCCCC) */
  --color-disabled: #999999;

  /* Navigation selected - darker for contrast */
  --color-nav-selected: #00A899;
}
```

---

## Priority 7: Disclaimer Persistence

### File: `ChatPageEnhanced.tsx`

**Update input section (around line 586):**
```tsx
<div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 lg:p-4">
  {/* Compact disclaimer when messages exist */}
  {messages.length > 0 && (
    <div className="mb-2 px-2 py-1.5 bg-yellow-50 rounded text-xs text-yellow-900 flex items-center gap-2">
      <AlertTriangle size={12} className="text-yellow-600 flex-shrink-0" />
      <span>
        AI 참고 정보 · 응급 시{' '}
        <a href="tel:119" className="font-bold text-red-700 underline">
          119
        </a>
      </span>
    </div>
  )}

  {/* Existing profile selector and input */}
  {/* ... */}
</div>
```

---

## Priority 8: Trust Indicators

### File: `ChatPageEnhanced.tsx`

**Add to assistant messages (after content, around line 488):**
```tsx
{message.role === 'assistant' && (
  <div className="mt-3 pt-2 border-t border-gray-200/50 flex items-center justify-between text-xs">
    <div className="flex items-center gap-3">
      {/* Agent badge */}
      {message.agents && message.agents.length > 0 && (
        <div className="flex items-center gap-1">
          <Bot size={10} className="text-gray-400" />
          {message.agents.map(agent => (
            <span
              key={agent}
              className="inline-flex items-center px-1.5 py-0.5 bg-blue-50
                         text-blue-700 rounded text-[10px] font-medium"
            >
              {agent === 'medical_welfare' ? '의료복지' :
               agent === 'nutrition' ? '영양' :
               agent === 'research' ? '연구' : 'Auto'}
            </span>
          ))}
        </div>
      )}

      {/* Confidence - only show if high */}
      {message.confidence !== undefined && message.confidence >= 0.7 && (
        <div className="flex items-center gap-1 text-gray-500">
          <CheckCircle size={10} className="text-green-600" />
          <span>신뢰도 높음</span>
        </div>
      )}
    </div>

    {/* Timestamp */}
    <span className="text-gray-400">
      {new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(message.timestamp)}
    </span>
  </div>
)}
```

**Add import:**
```tsx
import { /*...*/ CheckCircle } from 'lucide-react';
```

---

## Testing Checklist

After implementing the above fixes, test:

### Stop Button
- [ ] Stop button appears during streaming
- [ ] Clicking stop aborts the request
- [ ] Partial content is saved with "[중단됨]" marker
- [ ] Can send new message after stopping

### New Chat Button
- [ ] Button appears when messages exist
- [ ] Confirmation dialog shows before clearing
- [ ] Chat history is cleared on confirm
- [ ] Tab-specific (doesn't clear other tabs)

### Profile Selector
- [ ] Dropdown is visible and styled
- [ ] Can navigate with keyboard (Tab, Arrow keys, Enter)
- [ ] Focus outline is visible
- [ ] Screen reader announces selection
- [ ] Color contrast meets WCAG AA

### Emergency Banner
- [ ] Appears when isEmergency flag is true
- [ ] Call buttons have min 44px height
- [ ] 119 link actually triggers phone call
- [ ] Visually prominent (red colors)

### Mobile Keyboard
- [ ] Input stays visible when keyboard opens (iOS)
- [ ] Input stays visible when keyboard opens (Android)
- [ ] Auto-scrolls to bottom on keyboard open
- [ ] Safe area insets respected on notched phones

### Color Contrast
- [ ] Primary text on primary color: ≥ 4.5:1
- [ ] Disabled text: ≥ 4.5:1
- [ ] All text meets WCAG AA minimum

### Disclaimer
- [ ] Shows at top when no messages
- [ ] Shows compact version in input area when messages exist
- [ ] 119 link is clickable and prominent

### Trust Indicators
- [ ] Agent badges show for AI responses
- [ ] Timestamp shows for each message
- [ ] Confidence indicator appears when ≥ 0.7
- [ ] Layout doesn't break with long agent names

---

## Browser Testing Matrix

| Browser | Version | Test Status |
|---------|---------|-------------|
| Chrome | Latest | ⬜ Not tested |
| Firefox | Latest | ⬜ Not tested |
| Safari | Latest | ⬜ Not tested |
| Edge | Latest | ⬜ Not tested |
| iOS Safari | 16+ | ⬜ Not tested |
| Chrome Android | Latest | ⬜ Not tested |

---

## Accessibility Testing

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Can submit form with Enter
- [ ] Can close modals with Escape

### Screen Reader (VoiceOver/NVDA)
- [ ] Form fields have labels
- [ ] Buttons have descriptive text
- [ ] Messages are announced as they arrive
- [ ] Error messages are announced
- [ ] Loading states are announced

### Color & Contrast
- [ ] Run axe DevTools - 0 violations
- [ ] Run WAVE - 0 errors
- [ ] Manual contrast check passes

---

## Rollback Plan

If critical issues are found:

1. **Stop button issues**: Comment out stop button UI, keep abort controller for future use
2. **Profile selector**: Revert to original invisible overlay pattern
3. **Emergency banner**: Use simpler version without call buttons
4. **Keyboard handling**: Remove viewport listeners if causing issues
5. **Color changes**: Revert to original colors, add note for future fix

---

## Performance Impact

Expected impact of changes:

| Change | Performance Impact | Mitigation |
|--------|-------------------|------------|
| Stop button | None | Uses existing AbortController API |
| New chat | Minimal (localStorage) | Already using localStorage |
| Profile selector | None | Replacing existing component |
| Emergency banner | Minimal | Conditional render |
| Keyboard handling | Minimal | Passive event listeners |
| Trust indicators | Minimal | Simple conditional render |

**Overall:** No significant performance degradation expected.

---

## Deployment Steps

1. **Create feature branch:** `git checkout -b fix/critical-ux-improvements`
2. **Implement changes** one priority at a time
3. **Test each change** before moving to next
4. **Run linter:** `npm run lint`
5. **Run type check:** `npm run type-check` (if available)
6. **Test on multiple browsers**
7. **Test on mobile devices** (iOS + Android)
8. **Run accessibility audit**
9. **Create PR** with detailed description
10. **Request UX review** before merging

---

**Implementation Time Estimate:**
- Priority 1-3: 2-3 hours
- Priority 4-5: 1-2 hours
- Priority 6-8: 1-2 hours
- Testing: 2-3 hours
- **Total: 6-10 hours** (1-2 days)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-26
**Status:** Ready for Implementation
