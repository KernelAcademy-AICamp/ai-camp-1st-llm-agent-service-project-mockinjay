# Quick Fix Guide - Priority Issues

## 🔴 CRITICAL FIX #1: Add Disclaimer Banner (30 minutes)

### Issue
Disclaimer banner exists in `ChatInterface.tsx` but not visible in `ChatPageEnhanced.tsx` (the active component).

### File to Edit
`/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/pages/ChatPageEnhanced.tsx`

### Implementation

**Step 1**: Add disclaimer after ChatHeader (around line 547)

```tsx
{/* Header */}
<ChatHeader
  currentPath={location.pathname}
  isStreaming={isStreaming}
  onToggleSidebar={toggleSidebar}
  onStopStream={handleStopStream}
  onResetSession={handleResetSession}
  onResetAllSessions={handleResetAllSessions}
/>

{/* ADD THIS - Disclaimer Banner */}
<div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-2 text-center text-xs text-yellow-800 dark:text-yellow-200 transition-colors duration-200">
  ⚠️ 본 답변은 의학적 진단이 아니며 참고용 정보입니다. 증상이 있으시면 반드시 의료 전문가와 상담하시기 바랍니다.
</div>

{/* Messages */}
<ChatMessages
  messages={currentMessages}
  ...
/>
```

### Verification
1. Restart dev server: `npm run dev`
2. Navigate to http://localhost:5175
3. Check for yellow banner above chat messages
4. Run test: `npx playwright test --grep "CHA-010"`

---

## 🔴 CRITICAL FIX #2: Display Source Citations (1-2 hours)

### Issue
Backend provides sources in response, but frontend doesn't render them.

### File to Edit
`/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/components/chat/ChatMessages.tsx`

### Step 1: Update ChatMessage Type

**File**: `/new_frontend/src/types/chat.ts`

Add to ChatMessage interface:
```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intents?: IntentCategory[];
  agents?: AgentType[];
  confidence?: number;
  isDirectResponse?: boolean;
  isEmergency?: boolean;
  roomId?: string;

  // ADD THESE
  sources?: Array<{
    name: string;
    url: string;
    type?: 'pubmed' | 'kfda' | 'ksn' | 'other';
  }>;
}
```

### Step 2: Render Sources in ChatMessages Component

**Location**: After message content display (around line 206)

```tsx
{/* Message Content */}
<div className="whitespace-pre-wrap text-xs lg:text-sm break-words overflow-wrap-anywhere word-break-break-word">
  {message.content}
</div>

{/* ADD THIS - Source Citations */}
{message.role === 'assistant' && message.sources && message.sources.length > 0 && (
  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
      📚 참고 자료:
    </p>
    <div className="space-y-1">
      {message.sources.map((source, idx) => (
        <a
          key={idx}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline block"
        >
          • {source.name}
          {source.type === 'pubmed' && ' (PubMed)'}
          {source.type === 'kfda' && ' (식약처)'}
          {source.type === 'ksn' && ' (대한신장학회)'}
        </a>
      ))}
    </div>
  </div>
)}
```

### Step 3: Update Backend Response Handling

**File**: `/new_frontend/src/pages/ChatPageEnhanced.tsx`

Update the assistant message creation (around line 461):

```typescript
const assistantMessage: ChatMessage = {
  id: assistantMessageId,
  role: 'assistant',
  content: response.content,
  timestamp: new Date(),
  intents: response.intents,
  agents: response.agents,
  confidence: response.confidence,
  isDirectResponse: response.isDirectResponse,
  isEmergency: response.isEmergency,
  roomId,
  // ADD THIS
  sources: response.sources || [], // Backend should provide this
};
```

### Verification
1. Send a medical question
2. Check for "📚 참고 자료:" section at bottom of AI response
3. Verify links are clickable
4. Run test: `npx playwright test --grep "CHA-008"`

### Backend Coordination Required
Backend needs to include `sources` array in response:
```json
{
  "content": "...",
  "sources": [
    {
      "name": "Chronic Kidney Disease Overview",
      "url": "https://pubmed.ncbi.nlm.nih.gov/...",
      "type": "pubmed"
    },
    {
      "name": "신장병 환자 영양 가이드",
      "url": "https://www.kfda.go.kr/...",
      "type": "kfda"
    }
  ]
}
```

---

## 🔴 CRITICAL FIX #3: Add Prominent "New Conversation" Button (2 hours)

### Issue
"새 대화" button only in sidebar, not easily accessible.

### File to Edit
`/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/components/chat/ChatHeader.tsx`

### Current Header Structure
The header already has reset buttons. We need to add a "New Conversation" button.

### Implementation

**Option A: Add to existing header**

Find the reset buttons section and add:

```tsx
{/* New Conversation Button */}
<button
  onClick={() => {
    // Show confirmation dialog
    if (window.confirm('새 대화를 시작하시겠습니까? 현재 대화 내용은 저장됩니다.')) {
      onCreateNewConversation?.();
    }
  }}
  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
  title="새 대화 시작"
  aria-label="Start new conversation"
>
  <PlusCircle size={20} className="text-gray-600 dark:text-gray-300" />
</button>
```

**Step 1**: Import PlusCircle icon
```tsx
import { PlusCircle, RotateCcw, Trash2, Square, Menu } from 'lucide-react';
```

**Step 2**: Add prop to ChatHeaderProps
```typescript
interface ChatHeaderProps {
  currentPath: string;
  isStreaming: boolean;
  onToggleSidebar: () => void;
  onStopStream: () => void;
  onResetSession: () => void;
  onResetAllSessions: () => void;
  onCreateNewConversation?: () => void; // ADD THIS
}
```

**Step 3**: Update ChatPageEnhanced to pass handler

```tsx
<ChatHeader
  currentPath={location.pathname}
  isStreaming={isStreaming}
  onToggleSidebar={toggleSidebar}
  onStopStream={handleStopStream}
  onResetSession={handleResetSession}
  onResetAllSessions={handleResetAllSessions}
  onCreateNewConversation={handleCreateRoom} // ADD THIS
/>
```

### Better Option: Use Dialog Component

Create a confirmation dialog for better UX:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

const [showNewChatDialog, setShowNewChatDialog] = useState(false);

// Button
<button
  onClick={() => setShowNewChatDialog(true)}
  className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
>
  <PlusCircle size={18} />
  <span className="hidden lg:inline">새 대화</span>
</button>

// Dialog
<Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>새 대화를 시작하시겠습니까?</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-gray-600">
      현재 대화는 대화 목록에 저장됩니다. 언제든지 다시 확인할 수 있습니다.
    </p>
    <DialogFooter>
      <button
        onClick={() => setShowNewChatDialog(false)}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        취소
      </button>
      <button
        onClick={() => {
          onCreateNewConversation?.();
          setShowNewChatDialog(false);
        }}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
      >
        새 대화 시작
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Verification
1. Look for "새 대화" button in header
2. Click button
3. Verify confirmation dialog appears
4. Test cancellation
5. Test confirmation creates new room
6. Run test: `npx playwright test --grep "CHA-011"`

---

## 🟡 MEDIUM PRIORITY FIX #4: Show Confidence Score Warnings (1 hour)

### File to Edit
`/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/components/chat/ChatMessages.tsx`

### Implementation

Add after message content (around line 210):

```tsx
{/* Low Confidence Warning */}
{message.role === 'assistant' &&
 message.confidence !== undefined &&
 message.confidence < 0.7 && (
  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded text-xs">
    <div className="flex items-start gap-2">
      <span className="text-amber-600 dark:text-amber-400 font-semibold">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
          답변 신뢰도 낮음
        </p>
        <p className="text-amber-700 dark:text-amber-300">
          이 답변의 신뢰도가 낮습니다 ({Math.round(message.confidence * 100)}%).
          정확한 정보는 전문의와 상담하시기 바랍니다.
        </p>
      </div>
    </div>
  </div>
)}
```

### Optional: Add confidence badge for all messages

```tsx
{message.role === 'assistant' && message.confidence !== undefined && (
  <span
    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
      message.confidence >= 0.8
        ? 'bg-green-100 text-green-800'
        : message.confidence >= 0.7
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800'
    }`}
  >
    신뢰도: {Math.round(message.confidence * 100)}%
  </span>
)}
```

---

## 🟢 LOW PRIORITY FIX #5: Add Markdown Rendering (2 hours)

### Step 1: Install react-markdown

```bash
cd /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend
npm install react-markdown remark-gfm --legacy-peer-deps
```

### Step 2: Update ChatMessages Component

**File**: `/new_frontend/src/components/chat/ChatMessages.tsx`

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Replace plain text rendering (line 205):
// OLD:
<div className="whitespace-pre-wrap text-xs lg:text-sm break-words">
  {message.content}
</div>

// NEW:
<div className="prose prose-sm dark:prose-invert max-w-none">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      // Custom styling for links
      a: ({ node, ...props }) => (
        <a
          {...props}
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        />
      ),
      // Custom styling for code blocks
      code: ({ node, inline, ...props }) =>
        inline ? (
          <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded" {...props} />
        ) : (
          <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded" {...props} />
        ),
    }}
  >
    {message.content}
  </ReactMarkdown>
</div>
```

### Step 3: Add Tailwind Typography

```bash
npm install @tailwindcss/typography --legacy-peer-deps
```

Update `tailwind.config.js`:
```javascript
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
    // ... other plugins
  ],
};
```

---

## Testing Checklist After Fixes

### Run Automated Tests
```bash
cd /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend

# Run all tests
npx playwright test

# Run specific feature tests
npx playwright test --grep "CHA-010"  # Disclaimer
npx playwright test --grep "CHA-008"  # Sources
npx playwright test --grep "CHA-011"  # New conversation
```

### Manual Testing Checklist

- [ ] Disclaimer banner visible on all chat pages
- [ ] Disclaimer text correct: "본 답변은 의학적 진단이 아니며..."
- [ ] Source citations appear at bottom of AI responses
- [ ] Source links are clickable and open in new tab
- [ ] "새 대화" button visible in header
- [ ] Clicking "새 대화" shows confirmation dialog
- [ ] Confirming creates new chat room
- [ ] Canceling keeps current chat
- [ ] Low confidence warning appears when confidence < 0.7
- [ ] Warning message clear and helpful
- [ ] Markdown renders correctly (if implemented)
  - [ ] **Bold** text works
  - [ ] *Italic* text works
  - [ ] Links are clickable
  - [ ] Lists display properly
  - [ ] Code blocks formatted

### Cross-browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Accessibility Testing
- [ ] Screen reader announces disclaimer
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast sufficient

---

## Rollback Plan

If issues occur after deployment:

### Disclaimer Banner
```tsx
// To quickly disable, wrap in conditional:
{false && (
  <div className="bg-yellow-50...">
    Disclaimer text
  </div>
)}
```

### Source Citations
```tsx
// To disable rendering:
{false && message.sources && (
  // source rendering code
)}
```

### New Conversation Button
```tsx
// Hide button:
{false && (
  <button onClick={...}>새 대화</button>
)}
```

---

## Support & Resources

### Documentation
- Full Test Report: `TEST_REPORT.md`
- Executive Summary: `TESTING_SUMMARY.md`
- This Guide: `QUICK_FIX_GUIDE.md`

### Test Results
- Screenshots: `/test-results/screenshots/`
- Test Logs: `/test-results/`
- Playwright Config: `/playwright.config.ts`

### Key Files Reference
```
/new_frontend/
├── src/
│   ├── pages/
│   │   └── ChatPageEnhanced.tsx         # Main chat page
│   ├── components/
│   │   └── chat/
│   │       ├── ChatHeader.tsx           # Header with controls
│   │       ├── ChatMessages.tsx         # Message display
│   │       ├── ChatInput.tsx            # Input field
│   │       └── ChatSidebar.tsx          # Room list
│   ├── types/
│   │   └── chat.ts                      # TypeScript types
│   └── services/
│       └── intentRouter.ts              # Backend API calls
└── tests/
    └── e2e/
        └── chat-features.spec.ts        # E2E tests
```

### Getting Help
- Review screenshots in `/test-results/screenshots/`
- Check console logs during development
- Run Playwright in UI mode: `npx playwright test --ui`
- Debug tests: `npx playwright test --debug`

---

**Last Updated**: November 27, 2025
**Priority**: Complete Critical Fixes (#1-3) within 1 day
