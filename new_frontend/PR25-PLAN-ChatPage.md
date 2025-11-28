# PR25-PLAN-ChatPage

## ChatPage 이식 상세 계획서

**Source**: `frontend/src/pages/ChatPage.tsx` (468 lines)
**Target**: `new_frontend/src/pages/ChatPageEnhanced.tsx` (586 lines)

---

## 1. 기능 비교 테이블

| 기능 | frontend/ | new_frontend/ | 이식 필요 |
|------|-----------|---------------|-----------|
| Welcome Message | ✅ 있음 (299-351) | ❌ 없음 | **P0 필수** |
| Suggestion Chips | ✅ 스크롤 가능 (315-350) | ❌ 없음 | **P0 필수** |
| Fallback Indicator | ✅ 오렌지 배경 (367-373) | ❌ 없음 | **P0 필수** |
| Profile Selector | ✅ 드롭다운 (439-462) | ❌ 없음 | **P1 권장** |
| Tab Lock | ✅ 첫 메시지 후 비활성화 (260-267) | ❌ 없음 | **P1 권장** |
| Session ID Display | ✅ 표시 (457-461) | ❌ 없음 | **P2 선택** |
| Chat Rooms Sidebar | ❌ 없음 | ✅ 있음 | 유지 |
| Stream Cancellation | ❌ 없음 | ✅ AbortController | 유지 |
| localStorage Persistence | ❌ 없음 | ✅ 있음 | 유지 |

---

## 2. 이식할 코드 스니펫

### P0-1: Welcome Message 컴포넌트

**Source Location**: `frontend/src/pages/ChatPage.tsx:299-351`

```tsx
// 환영 메시지 (에이전트별 아이콘 + 메시지)
{messages.length === 0 && (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
        <ActiveIcon size={14} color="#4A5565" />
      </div>
      <span className="text-[12px] text-[#6a7282]">CareGuide AI</span>
    </div>
    <div className="bg-[#f0f4ff] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] p-4 max-w-[500px]">
      <p className="text-[14px] text-black leading-[22px]">
        {getWelcomeMessage()}
      </p>
    </div>
    {/* ... Suggestions ... */}
  </div>
)}
```

**구현 위치**: `ChatMessages.tsx` 컴포넌트 내부

---

### P0-2: Suggestion Chips (좌우 스크롤)

**Source Location**: `frontend/src/pages/ChatPage.tsx:315-350`

```tsx
// 제안 버튼 (좌우 스크롤 가능)
<div className="relative mt-4">
  {showScrollButtons && (
    <button
      onClick={() => scrollSuggestions('left')}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
      style={{ border: '1px solid #E5E7EB' }}
    >
      <ChevronLeft size={14} color="#666666" />
    </button>
  )}
  <div
    ref={suggestionsRef}
    className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    {getSuggestions().map((suggestion, idx) => (
      <button
        key={idx}
        onClick={() => handleSendMessage(suggestion)}
        className="bg-white border border-[#ebebeb] rounded-[8px] px-4 py-2 text-[10px] font-medium text-[#1f1f1f] hover:bg-gray-50 whitespace-nowrap text-left flex-shrink-0"
        disabled={isLoading}
      >
        {suggestion}
      </button>
    ))}
  </div>
  {showScrollButtons && (
    <button
      onClick={() => scrollSuggestions('right')}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 ..."
    >
      <ChevronRight size={14} color="#666666" />
    </button>
  )}
</div>
```

**Dependencies**:
- `useRef<HTMLDivElement>(null)` for `suggestionsRef`
- `useState(false)` for `showScrollButtons`
- Scroll detection logic (lines 69-80)

---

### P0-3: Fallback Indicator (에러 메시지 시각화)

**Source Location**: `frontend/src/pages/ChatPage.tsx:367-373`

```tsx
// Fallback 메시지 표시 (오렌지 배경 + 경고 아이콘)
<div className={`rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] p-4 ${
  msg.fallbackType ? 'bg-orange-50 border border-orange-200' : 'bg-[#f0f4ff]'
}`}>
  <p className="text-[14px] text-black leading-[22px] whitespace-pre-wrap">{msg.content}</p>
</div>

// Header에 경고 아이콘
{msg.fallbackType && (
  <span className="text-[10px] text-orange-500">⚠️</span>
)}
```

**Message Interface 확장**:
```typescript
interface ChatMessage {
  // 기존 필드...
  fallbackType?: string;  // 추가 필요
}
```

---

### P1-1: Profile Selector 드롭다운

**Source Location**: `frontend/src/pages/ChatPage.tsx:439-462`

```tsx
// 맞춤 정보 드롭다운 (신장병 환우/일반인/연구자)
<div className="border-t border-gray-100 pt-[4px] flex items-center justify-between h-[33.5px]">
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-gray-500">맞춤 정보:</span>
    <div className="relative flex items-center gap-1 cursor-pointer">
      <span className="text-[11px] text-[#00c8b4] font-medium">{selectedProfile}</span>
      <ChevronDown size={12} color="#00C8B4" />
      <select
        value={selectedProfile}
        onChange={(e) => setSelectedProfile(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        disabled={isLoading}
      >
        <option value="신장병 환우">신장병 환우</option>
        <option value="일반인">일반인(간병인)</option>
        <option value="연구자">연구자</option>
      </select>
    </div>
  </div>
  {/* Session ID */}
</div>
```

---

### P1-2: Tab Lock (첫 메시지 후 탭 비활성화)

**Source Location**: `frontend/src/pages/ChatPage.tsx:260-267`

```tsx
// 메시지가 있으면 다른 탭 비활성화
<button
  key={tab.id}
  onClick={() => {
    // Only allow tab change if no messages yet
    if (messages.length === 0) {
      setActiveTab(tab.id);
    }
  }}
  disabled={messages.length > 0 && activeTab !== tab.id}
  className={`... ${
    messages.length > 0 && activeTab !== tab.id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {/* ... */}
</button>

{/* 안내 메시지 */}
{messages.length > 0 && (
  <div className="text-[10px] text-gray-500 mt-2 text-center">
    대화 중에는 다른 에이전트로 변경할 수 없습니다
  </div>
)}
```

---

## 3. 에이전트별 Suggestion 데이터

**Source Location**: `frontend/src/pages/ChatPage.tsx:209-225`

```typescript
const getSuggestions = () => {
  const suggestions = {
    medical: [
      '신장병 환자를 위한 의료 복지 혜택은?',
      '투석 환자 지원 제도 알려줘'
    ],
    nutrition: [
      '저칼륨 음식 재료 알려줘',
      '신장병 환자를 위한 김장 레시피 알려줘'
    ],
    research: [
      '만성신장병 최신 연구 동향은?',
      'CKD 치료법 관련 논문 찾아줘'
    ]
  };
  return suggestions[activeTab] || suggestions.nutrition;
};
```

---

## 4. 구현 계획

### Phase 1: Welcome Message + Suggestions

1. `ChatMessages.tsx`에 빈 메시지 상태 처리 추가
2. `WelcomeMessage` 컴포넌트 생성
3. `SuggestionChips` 컴포넌트 생성 (스크롤 로직 포함)
4. 에이전트별 suggestion 데이터 정의

### Phase 2: Fallback Indicator

1. `ChatMessage` 타입에 `fallbackType` 필드 추가
2. 메시지 렌더링 로직에 fallback 스타일 조건 추가
3. API 응답에서 fallback 정보 파싱

### Phase 3: Profile Selector

1. `ChatInput.tsx`에 프로필 선택 UI 추가
2. 선택된 프로필을 API 요청에 포함

### Phase 4: Tab Lock

1. 메시지 존재 여부에 따른 탭 비활성화 로직 추가
2. 안내 메시지 표시

---

## 5. 스타일 가이드라인

| 요소 | 값 |
|------|-----|
| Welcome 배경 | `bg-[#f0f4ff]` |
| Fallback 배경 | `bg-orange-50 border border-orange-200` |
| Suggestion 버튼 | `border border-[#ebebeb] rounded-[8px] text-[10px]` |
| Profile 텍스트 | `text-[11px] text-[#00c8b4]` |
| 말풍선 radius | `rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px]` |

---

## 6. Dependencies 확인

| 패키지 | frontend/ | new_frontend/ | 비고 |
|--------|-----------|---------------|------|
| lucide-react | ✅ | ✅ | 동일 |
| axios | ✅ | ❌ fetch 사용 | 스타일 차이 |

---

*Generated: 2025-11-27*
