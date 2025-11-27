# Chat System Implementation Summary
# 채팅 시스템 구현 요약

## Overview
## 개요

This document summarizes the complete chat system implementation for the CareGuide healthcare application. The system features multiple chat rooms, streaming responses, session management, and proper state handling.

이 문서는 CareGuide 헬스케어 애플리케이션을 위한 완전한 채팅 시스템 구현을 요약합니다. 시스템은 다중 채팅 방, 스트리밍 응답, 세션 관리, 적절한 상태 처리 기능을 포함합니다.

## Architecture
## 아키텍처

### File Structure
### 파일 구조

```
new_frontend/src/
├── types/
│   └── chat.ts                    # Type definitions for chat system
├── hooks/
│   ├── useChatRooms.ts           # Room management hook
│   ├── useChatStream.ts          # Streaming with AbortController
│   └── useChatSession.ts         # Session and message management
├── components/
│   └── chat/
│       ├── ChatSidebar.tsx       # Room list sidebar
│       ├── ChatHeader.tsx        # Header with controls
│       ├── ChatMessages.tsx      # Message display area
│       └── ChatInput.tsx         # Input with profile selector
├── services/
│   └── api.ts                    # API client with room endpoints
└── pages/
    └── ChatPageEnhanced.tsx      # Main chat page (to be updated)
```

## Components
## 컴포넌트

### 1. ChatSidebar Component
### 1. ChatSidebar 컴포넌트

**Purpose:** Displays list of chat rooms with CRUD operations
**목적:** CRUD 작업이 가능한 채팅 방 목록 표시

**Features:**
**기능:**
- Create new chat rooms
- Switch between rooms
- Search rooms by title or last message
- Pin/unpin rooms
- Archive/unarchive rooms
- Delete rooms with confirmation
- Mobile-responsive with overlay
- Real-time timestamp formatting

**Props:**
```typescript
interface ChatSidebarProps {
  rooms: ChatRoom[];
  currentRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onDeleteRoom: (roomId: string) => void;
  onTogglePin: (roomId: string) => void;
  onToggleArchive: (roomId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}
```

**Accessibility:**
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus management

### 2. ChatHeader Component
### 2. ChatHeader 컴포넌트

**Purpose:** Provides chat controls and agent type navigation
**목적:** 채팅 제어 및 에이전트 타입 네비게이션 제공

**Features:**
**기능:**
- Stop streaming button (appears during streaming)
- Reset current session button
- Reset all sessions button
- Agent type tabs (Auto, Medical Welfare, Nutrition, Research)
- Disclaimer banner
- Mobile menu toggle

**Props:**
```typescript
interface ChatHeaderProps {
  currentPath: string;
  isStreaming: boolean;
  onToggleSidebar: () => void;
  onStopStream: () => void;
  onResetSession: () => void;
  onResetAllSessions: () => void;
}
```

### 3. ChatMessages Component
### 3. ChatMessages 컴포넌트

**Purpose:** Displays chat messages with streaming support
**목적:** 스트리밍 지원과 함께 채팅 메시지 표시

**Features:**
**기능:**
- Message bubbles with user/assistant styling
- Streaming message display
- Date grouping (Today, Yesterday, specific dates)
- Timestamps for each message
- Emergency badge for urgent messages
- Intent and agent information display
- Session expired state
- Restore history functionality
- Auto-scroll to bottom

**Props:**
```typescript
interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isSessionExpired: boolean;
  isRestoringHistory: boolean;
  onRestoreHistory: () => void;
  onStartNewConversation: () => void;
}
```

### 4. ChatInput Component
### 4. ChatInput 컴포넌트

**Purpose:** Provides input field with profile selector and image upload
**목적:** 프로필 선택기와 이미지 업로드가 있는 입력 필드 제공

**Features:**
**기능:**
- Text input field
- Profile selector (General, Patient, Researcher)
- Image upload button (for nutrition agent)
- Image preview with remove button
- Send button with dynamic styling
- Enter key support
- Input validation

**Props:**
```typescript
interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isDisabled: boolean;
  placeholder?: string;
  showImageUpload?: boolean;
  selectedImage?: File | null;
  imagePreview?: string | null;
  onImageSelect?: (file: File) => void;
  onImageRemove?: () => void;
}
```

## Hooks
## 훅

### 1. useChatRooms Hook
### 1. useChatRooms 훅

**Purpose:** Manages chat room state and localStorage persistence
**목적:** 채팅 방 상태 및 localStorage 지속성 관리

**Features:**
**기능:**
- Create, update, delete rooms
- Pin/unpin, archive/unarchive rooms
- Filter rooms by criteria
- Sort rooms (pinned first, then by activity)
- Update last message and message count
- Automatic localStorage synchronization

**Return Value:**
```typescript
{
  rooms: ChatRoom[];
  activeRooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  currentRoomId: string | null;
  createRoom: (options?: CreateRoomOptions) => ChatRoom;
  deleteRoom: (roomId: string) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  togglePinRoom: (roomId: string) => void;
  toggleArchiveRoom: (roomId: string) => void;
  updateRoomLastMessage: (roomId: string, message: string, timestamp: Date) => void;
  incrementMessageCount: (roomId: string) => void;
  clearAllRooms: () => void;
  setCurrentRoomId: (roomId: string | null) => void;
  filterRooms: (options: RoomFilterOptions) => ChatRoom[];
}
```

### 2. useChatStream Hook
### 2. useChatStream 훅

**Purpose:** Handles streaming responses with cancellation support
**목적:** 취소 지원과 함께 스트리밍 응답 처리

**Features:**
**기능:**
- Stream messages with callbacks
- Cancel streaming with AbortController
- Error handling
- Reset stream state

**Return Value:**
```typescript
{
  isStreaming: boolean;
  streamingContent: string;
  error: Error | null;
  streamMessage: (query: string, options?: ChatStreamOptions) => Promise<RouterResponse>;
  cancelStream: () => void;
  resetStream: () => void;
}
```

### 3. useChatSession Hook
### 3. useChatSession 훅

**Purpose:** Manages session lifecycle and message persistence
**목적:** 세션 라이프사이클 및 메시지 지속성 관리

**Features:**
**기능:**
- Initialize/restore session
- Add, update, clear messages
- Restore chat history from backend
- Session expiration handling
- Per-room message storage

**Return Value:**
```typescript
{
  sessionId: string | null;
  isSessionExpired: boolean;
  isRestoringHistory: boolean;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, content: string) => void;
  clearMessages: () => void;
  clearAllMessages: () => void;
  restoreChatHistory: (limit?: number) => Promise<void>;
  expireSession: () => void;
  createNewSession: () => Promise<void>;
  initializeSession: () => Promise<void>;
}
```

## Types
## 타입

### Core Types
### 핵심 타입

```typescript
interface ChatMessage {
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
  sessionId?: string;
  imageUrl?: string;
}

interface ChatRoom {
  id: string;
  title: string;
  agentType: AgentType | 'auto';
  lastMessage?: string;
  lastMessageTime?: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  isArchived?: boolean;
}

interface ChatSession {
  sessionId: string;
  roomId: string;
  userId?: string;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  lastActivityAt: Date;
}
```

## API Endpoints
## API 엔드포인트

### Chat History
```typescript
// Get chat history for a user
GET /api/chat/history?user_id={userId}&session_id={sessionId}&limit={limit}

// Example usage
const history = await getChatHistory(userId, sessionId, 50);
```

### Session Management
```typescript
// Create new session
POST /api/session/create
Body: { user_id: string }

// Example usage
const response = await api.post('/api/session/create', { user_id: 'user123' });
```

### Chat Streaming
```typescript
// Stream chat response
POST /api/chat/stream
Body: {
  query: string;
  agent_type: string;
  session_id: string;
  user_profile: 'general' | 'patient' | 'researcher';
}

// Example usage (using intentRouter service)
const response = await routeQueryStream(query, onChunk, onError, userProfile);
```

### Room Management (Client-side for now)
```typescript
// Note: These functions are currently client-side only
// Backend endpoints can be added later

// Create room
const room = await createChatRoom('Room Title', 'auto');

// Get rooms
const rooms = await getChatRooms(userId);

// Update room
const updated = await updateChatRoom(roomId, { title: 'New Title' });

// Delete room
await deleteChatRoom(roomId);
```

## State Management
## 상태 관리

### localStorage Keys
```typescript
const STORAGE_KEYS = {
  SESSION_ID: 'careguide_session_id',
  LAST_ACTIVE: 'careguide_last_active',
  CHAT_ROOMS: 'careguide_chat_rooms',
  CURRENT_ROOM: 'careguide_current_room',
  ROOM_MESSAGES: 'careguide_room_messages',
};
```

### State Flow
```
User Action → Hook → LocalStorage + State Update → Component Re-render
```

## Usage Example
## 사용 예시

```typescript
import { useChatRooms } from '../hooks/useChatRooms';
import { useChatStream } from '../hooks/useChatStream';
import { useChatSession } from '../hooks/useChatSession';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';

function ChatPage() {
  // Initialize hooks
  const {
    rooms,
    currentRoom,
    currentRoomId,
    createRoom,
    deleteRoom,
    setCurrentRoomId,
    // ... other room actions
  } = useChatRooms();

  const {
    isStreaming,
    streamingContent,
    streamMessage,
    cancelStream,
  } = useChatStream();

  const {
    sessionId,
    messages,
    addMessage,
    restoreChatHistory,
    isSessionExpired,
    isRestoringHistory,
  } = useChatSession(currentRoomId);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      roomId: currentRoomId,
    };
    addMessage(userMessage);

    // Stream response
    const response = await streamMessage(input, {
      userProfile: selectedProfile,
      onChunk: (content) => {
        // Handle streaming chunks
      },
    });

    // Add assistant message
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      roomId: currentRoomId,
      intents: response.intents,
      agents: response.agents,
    };
    addMessage(assistantMessage);
  };

  return (
    <div className="flex h-screen">
      <ChatSidebar
        rooms={rooms}
        currentRoomId={currentRoomId}
        onSelectRoom={setCurrentRoomId}
        onCreateRoom={createRoom}
        onDeleteRoom={deleteRoom}
        // ... other props
      />
      <div className="flex flex-col flex-1">
        <ChatHeader
          isStreaming={isStreaming}
          onStopStream={cancelStream}
          onResetSession={() => clearMessages()}
          // ... other props
        />
        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          // ... other props
        />
        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          isDisabled={isStreaming}
        />
      </div>
    </div>
  );
}
```

## Testing
## 테스트

### Unit Tests
Create tests for:
- All hooks (useChatRooms, useChatStream, useChatSession)
- All components (ChatSidebar, ChatHeader, ChatMessages, ChatInput)
- API functions (chat history, room management)

### Integration Tests
Test interactions between:
- Room selection and message display
- Streaming and message updates
- Session expiration and recovery

### Accessibility Tests
Verify:
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Focus management

## Performance Considerations
## 성능 고려사항

1. **Message Virtualization**: For rooms with many messages, consider implementing virtual scrolling
2. **Debounced Search**: Search input should be debounced to avoid excessive re-renders
3. **Memoization**: Use React.memo, useMemo, and useCallback appropriately
4. **Lazy Loading**: Load room history on demand, not all at once

## Accessibility Features
## 접근성 기능

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus management
- Screen reader announcements
- High contrast mode support
- Proper heading hierarchy

## Future Enhancements
## 향후 개선사항

1. **Backend Integration**: Add backend endpoints for room management
2. **Real-time Updates**: Implement WebSocket for real-time message updates
3. **Message Search**: Add ability to search within messages
4. **Export Chat**: Allow users to export chat history
5. **Voice Input**: Add voice-to-text functionality
6. **File Attachments**: Support multiple file types beyond images
7. **Message Reactions**: Add emoji reactions to messages
8. **Typing Indicators**: Show when assistant is "typing"
9. **Read Receipts**: Track when messages are read
10. **Collaborative Rooms**: Allow multiple users in same room

## Deployment Checklist
## 배포 체크리스트

- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Accessibility audit passed
- [ ] Performance metrics meet targets
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Error messages user-friendly
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility checked
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Monitoring and logging configured

## Support
## 지원

For questions or issues, please refer to:
- Component documentation in source files
- Type definitions in `/types/chat.ts`
- API documentation in `/services/api.ts`
- Hook documentation in `/hooks/` files
