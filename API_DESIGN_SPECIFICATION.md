# API Design Specification for CareGuide Chat System

## Executive Summary

This document specifies the API design for missing chat-related endpoints in the CareGuide application. The frontend is currently calling endpoints that don't exist in the backend, causing integration failures.

### Missing Endpoints
1. **POST `/api/session/create`** - Session creation endpoint
2. **POST `/api/chat/stream`** - Streaming chat responses (exists but proxies to non-existent Parlant server)
3. **GET `/api/chat/history`** - Chat history retrieval (referenced but not implemented)

---

## Current Architecture Analysis

### Backend Components
- **FastAPI** application with MongoDB storage
- **Agent System** with built-in SessionManager and AgentManager
- **Chat Router** (`/api/chat`) with room management
- **Auth System** with JWT tokens

### Frontend Requirements
- React/TypeScript with SSE (Server-Sent Events) support
- Session persistence with localStorage fallback
- Multi-room chat support
- Chat history restoration
- Profile-based personalization (general/patient/researcher)

### Integration Gaps
1. Frontend calls `/api/session/create` but backend doesn't expose it
2. `/api/chat/stream` proxies to Parlant (port 8800) which returns 404
3. Chat history endpoint referenced in frontend but not implemented
4. CORS preflight failures for missing endpoints

---

## API Specifications

### 1. Session Management API

#### 1.1 Create Session
**Endpoint:** `POST /api/session/create`

**Purpose:** Create a new chat session for a user, integrating with the existing AgentManager's SessionManager.

**Request:**
```json
{
  "user_id": "string (required)"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "session_id": "uuid-v4-string",
  "created_at": "2025-11-27T12:00:00Z",
  "expires_at": "2025-11-27T12:30:00Z",
  "timeout_minutes": 30
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "detail": "user_id is required"
}
```

**Implementation Notes:**
- Use existing `AgentManager.create_user_session()` from `/backend/Agent/agent_manager.py`
- Session timeout should match AgentManager default (30 minutes)
- Store session metadata in MongoDB for persistence across restarts
- Return session expiration time for frontend timeout handling

**Database Schema (MongoDB - `sessions` collection):**
```json
{
  "_id": "ObjectId",
  "session_id": "uuid-v4-string",
  "user_id": "string",
  "created_at": "ISODate",
  "last_activity": "ISODate",
  "expires_at": "ISODate",
  "active_agent": "string | null",
  "status": "active | expired"
}
```

---

#### 1.2 Get Session Info
**Endpoint:** `GET /api/session/{session_id}`

**Purpose:** Retrieve session information and context usage.

**Response (Success - 200):**
```json
{
  "success": true,
  "session_id": "uuid-v4-string",
  "user_id": "string",
  "created_at": "2025-11-27T12:00:00Z",
  "last_activity": "2025-11-27T12:15:00Z",
  "expires_at": "2025-11-27T12:30:00Z",
  "active_agent": "nutrition",
  "context": {
    "total_tokens": 1250,
    "max_tokens": 128000,
    "remaining_tokens": 126750,
    "usage_by_agent": {
      "nutrition": 800,
      "research_paper": 450
    }
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "detail": "Session not found or expired"
}
```

**Implementation Notes:**
- Use `AgentManager.get_session_info()`
- Check session expiration before returning
- Update `last_activity` timestamp on access

---

#### 1.3 Delete Session
**Endpoint:** `DELETE /api/session/{session_id}`

**Purpose:** Explicitly end a session (for logout or session reset).

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "detail": "Session not found"
}
```

---

### 2. Chat Streaming API

#### 2.1 Stream Chat Response
**Endpoint:** `POST /api/chat/stream`

**Purpose:** Stream LLM responses using Server-Sent Events (SSE) without relying on Parlant server.

**Request:**
```json
{
  "query": "string (required) - User's question",
  "session_id": "string (required) - Active session ID",
  "agent_type": "string (optional) - auto|nutrition|medical_welfare|research_paper|trend_visualization",
  "user_profile": "string (optional) - general|patient|researcher",
  "room_id": "string (optional) - Chat room ID for context"
}
```

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**SSE Stream Format:**

```
# Status Event (agent selection)
data: {"status": "agent_selected", "agent_type": "nutrition"}

# Streaming Event (chunk-by-chunk response)
data: {"status": "streaming", "content": "안녕하세요!", "chunk_index": 0}

data: {"status": "streaming", "content": " 영양 상담을", "chunk_index": 1}

data: {"status": "streaming", "content": " 도와드리겠습니다.", "chunk_index": 2}

# New Message Event (multi-turn responses)
data: {"status": "new_message", "content": "추가로 도움이 필요하신가요?", "message_index": 1}

# Complete Event (end of stream)
data: {"status": "complete", "total_tokens": 150, "agent_type": "nutrition"}

data: [DONE]
```

**Event Types:**
| Status | Purpose | Fields |
|--------|---------|--------|
| `agent_selected` | Agent routing complete | `agent_type` |
| `streaming` | Streaming content chunk | `content`, `chunk_index` |
| `new_message` | New message in multi-turn | `content`, `message_index` |
| `complete` | Stream finished | `total_tokens`, `agent_type` |
| `error` | Error occurred | `error`, `detail` |

**Error Response (HTTP 4xx/5xx):**
```json
{
  "success": false,
  "detail": "Error description",
  "error_code": "SESSION_EXPIRED | INVALID_AGENT | CONTEXT_LIMIT_EXCEEDED"
}
```

**Implementation Strategy:**

**Option A: Direct Agent Integration (Recommended)**
```python
from fastapi.responses import StreamingResponse
from backend.Agent.agent_manager import AgentManager

agent_manager = AgentManager()

async def stream_chat_response(request: ChatStreamRequest):
    """Stream chat responses using existing Agent system"""

    # 1. Validate session
    session = agent_manager.get_session_info(request.session_id)
    if not session:
        raise HTTPException(404, "Session expired")

    # 2. Determine agent (auto-routing or explicit)
    agent_type = request.agent_type or route_to_agent(request.query)

    # 3. Stream generator
    async def event_generator():
        # Emit agent selection
        yield f"data: {json.dumps({'status': 'agent_selected', 'agent_type': agent_type})}\n\n"

        # Route to agent and stream response
        result = await agent_manager.route_request(
            agent_type=agent_type,
            user_input=request.query,
            session_id=request.session_id,
            context={"user_profile": request.user_profile}
        )

        if not result["success"]:
            yield f"data: {json.dumps({'status': 'error', 'error': result['error']})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # Stream the response (chunk by chunk)
        response_text = result["result"]["response"]

        # Simulate streaming for non-streaming LLMs
        chunks = split_into_chunks(response_text, chunk_size=10)
        for i, chunk in enumerate(chunks):
            yield f"data: {json.dumps({'status': 'streaming', 'content': chunk, 'chunk_index': i})}\n\n"
            await asyncio.sleep(0.05)  # Smooth streaming effect

        # Complete event
        yield f"data: {json.dumps({'status': 'complete', 'total_tokens': result['result'].get('tokens_used', 0), 'agent_type': agent_type})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Option B: Parlant Integration (If Parlant becomes available)**
- Keep existing proxy behavior
- Add fallback to Option A when Parlant is unavailable
- Transform Parlant responses to match SSE format above

**Database Storage:**
After streaming completes, save conversation to MongoDB:
```json
{
  "_id": "ObjectId",
  "session_id": "uuid",
  "user_id": "string",
  "room_id": "string | null",
  "timestamp": "ISODate",
  "agent_type": "string",
  "user_input": "string",
  "agent_response": "string",
  "tokens_used": "integer",
  "user_profile": "general | patient | researcher"
}
```

---

### 3. Chat History API

#### 3.1 Get Chat History
**Endpoint:** `GET /api/chat/history`

**Purpose:** Retrieve conversation history for a user/session.

**Query Parameters:**
```
user_id (required): string - User ID
session_id (optional): string - Filter by session
room_id (optional): string - Filter by room
limit (optional): integer - Max conversations (default: 50, max: 200)
offset (optional): integer - Pagination offset (default: 0)
```

**Response (Success - 200):**
```json
{
  "success": true,
  "count": 25,
  "total": 125,
  "limit": 50,
  "offset": 0,
  "conversations": [
    {
      "id": "conversation_id",
      "session_id": "uuid",
      "room_id": "room_abc123",
      "timestamp": "2025-11-27T12:15:30Z",
      "agent_type": "nutrition",
      "user_input": "What foods should I avoid?",
      "agent_response": "For kidney disease patients...",
      "tokens_used": 150,
      "user_profile": "patient"
    }
  ]
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "detail": "user_id is required"
}
```

**Implementation Notes:**
- Query MongoDB `chat_history` collection
- Sort by timestamp descending (newest first)
- Support pagination for large histories
- Index on `user_id`, `session_id`, `room_id`, `timestamp`

**MongoDB Indexes:**
```javascript
db.chat_history.createIndex({ "user_id": 1, "timestamp": -1 })
db.chat_history.createIndex({ "session_id": 1, "timestamp": -1 })
db.chat_history.createIndex({ "room_id": 1, "timestamp": -1 })
```

---

#### 3.2 Delete Chat History
**Endpoint:** `DELETE /api/chat/history`

**Purpose:** Delete conversation history (GDPR compliance, user privacy).

**Request:**
```json
{
  "user_id": "string (required)",
  "session_id": "string (optional) - Delete specific session",
  "room_id": "string (optional) - Delete specific room",
  "before_date": "ISO8601 date (optional) - Delete before this date"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "deleted_count": 42,
  "message": "Chat history deleted successfully"
}
```

---

### 4. Room Integration

#### 4.1 Update Existing Room Endpoints

The existing room management endpoints need integration with chat history:

**POST `/api/chat/rooms`** - Already implemented ✓

**GET `/api/chat/rooms`** - Already implemented ✓

**PATCH `/api/chat/rooms/{room_id}`** - Enhancement needed:
```json
// Auto-update from chat history
{
  "last_message": "Latest message from chat history",
  "last_message_time": "2025-11-27T12:30:00Z",
  "message_count": 15
}
```

**Implementation:** Add a background task or trigger to update room metadata when new messages are saved.

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. **Session Management API**
   - Implement `POST /api/session/create`
   - Add MongoDB persistence for sessions
   - Integrate with existing AgentManager

2. **Chat Streaming API**
   - Implement `POST /api/chat/stream` with Agent integration
   - Use SSE for streaming responses
   - Add conversation persistence to MongoDB

### Phase 2: Important (Week 2)
3. **Chat History API**
   - Implement `GET /api/chat/history`
   - Add pagination support
   - Create MongoDB indexes

4. **Room Integration**
   - Auto-update room metadata from chat history
   - Add background task for room updates

### Phase 3: Enhancement (Week 3)
5. **Session Management Enhancements**
   - Implement `GET /api/session/{session_id}`
   - Implement `DELETE /api/session/{session_id}`
   - Add session cleanup cron job

6. **History Management**
   - Implement `DELETE /api/chat/history`
   - Add GDPR compliance features

---

## Database Schema Summary

### Collections to Create

#### 1. `sessions` Collection
```json
{
  "_id": "ObjectId",
  "session_id": "string (indexed, unique)",
  "user_id": "string (indexed)",
  "created_at": "ISODate",
  "last_activity": "ISODate",
  "expires_at": "ISODate",
  "active_agent": "string | null",
  "status": "active | expired"
}
```

**Indexes:**
```javascript
db.sessions.createIndex({ "session_id": 1 }, { unique: true })
db.sessions.createIndex({ "user_id": 1 })
db.sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 }) // TTL index
```

#### 2. `chat_history` Collection
```json
{
  "_id": "ObjectId",
  "session_id": "string (indexed)",
  "user_id": "string (indexed)",
  "room_id": "string | null (indexed)",
  "timestamp": "ISODate (indexed)",
  "agent_type": "string",
  "user_input": "string",
  "agent_response": "string",
  "tokens_used": "integer",
  "user_profile": "string"
}
```

**Indexes:**
```javascript
db.chat_history.createIndex({ "user_id": 1, "timestamp": -1 })
db.chat_history.createIndex({ "session_id": 1, "timestamp": -1 })
db.chat_history.createIndex({ "room_id": 1, "timestamp": -1 })
```

---

## Integration Recommendations

### 1. CORS Configuration
Ensure CORS allows OPTIONS requests for all endpoints:
```python
app.add_middleware(
    CORSMiddleware,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)
```

### 2. Error Handling
Standardize error responses across all endpoints:
```json
{
  "success": false,
  "detail": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "timestamp": "2025-11-27T12:00:00Z"
}
```

### 3. Authentication
All endpoints should validate JWT tokens (except public endpoints):
```python
from fastapi import Depends, HTTPException
from app.services.auth import verify_token

async def get_current_user(token: str = Depends(verify_token)):
    if not token:
        raise HTTPException(401, "Authentication required")
    return token
```

### 4. Rate Limiting
Implement rate limiting for streaming endpoints:
- Session creation: 10 requests/minute per IP
- Chat streaming: 30 requests/minute per user
- History retrieval: 100 requests/minute per user

### 5. Monitoring
Add logging for:
- Session creation/expiration
- Agent routing decisions
- Streaming errors
- Database query performance

---

## Testing Strategy

### Unit Tests
- Session creation/validation
- Agent routing logic
- SSE stream formatting
- Database CRUD operations

### Integration Tests
- End-to-end session lifecycle
- Chat stream with multiple agents
- History retrieval with pagination
- Room metadata updates

### Load Tests
- Concurrent SSE streams (100+ users)
- Session creation under load
- Database query performance with 10k+ conversations

---

## Migration Plan

### Step 1: Add Database Collections
```bash
# Run MongoDB migration script
python backend/scripts/migrate_add_chat_collections.py
```

### Step 2: Create New Endpoints
```bash
# Create session.py router
touch backend/app/api/session.py

# Update chat.py router with streaming
# Update imports in main.py
```

### Step 3: Update Frontend Configuration
```typescript
// Update env.ts to use new endpoints
export const API_ENDPOINTS = {
  SESSION_CREATE: '/api/session/create',
  CHAT_STREAM: '/api/chat/stream',
  CHAT_HISTORY: '/api/chat/history',
}
```

### Step 4: Deploy and Monitor
1. Deploy backend changes
2. Monitor error logs for integration issues
3. Verify CORS preflight passes
4. Test SSE connections with browser DevTools

---

## Performance Considerations

### Streaming Optimization
- Use asyncio for non-blocking streaming
- Implement connection timeout (30 seconds)
- Add heartbeat events every 15 seconds
- Close stale connections automatically

### Database Optimization
- Use connection pooling (max 100 connections)
- Implement query result caching (Redis)
- Archive old chat history (>90 days) to separate collection
- Use bulk inserts for batch operations

### Caching Strategy
- Cache session info in Redis (TTL: 30 minutes)
- Cache user profiles in memory (TTL: 1 hour)
- Cache chat history queries (TTL: 5 minutes)

---

## Security Considerations

### 1. Input Validation
- Sanitize all user inputs
- Validate session IDs format (UUID)
- Limit query/response length (max 10,000 chars)

### 2. Access Control
- Users can only access their own sessions/history
- Admin role can access all data
- Implement audit logging for data access

### 3. Data Privacy
- Encrypt sensitive data at rest
- Implement data retention policies (90 days)
- Support GDPR right-to-deletion

### 4. Rate Limiting
- Prevent abuse of streaming endpoints
- Implement exponential backoff for retries
- Block suspicious IP addresses

---

## Appendix A: Request/Response Examples

### Example 1: Complete Chat Flow

**1. Create Session**
```bash
curl -X POST http://localhost:8000/api/session/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"user_id": "user123"}'
```

**Response:**
```json
{
  "success": true,
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2025-11-27T12:00:00Z",
  "expires_at": "2025-11-27T12:30:00Z",
  "timeout_minutes": 30
}
```

**2. Send Chat Message (SSE)**
```javascript
const eventSource = new EventSource(
  'http://localhost:8000/api/chat/stream',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What foods should I avoid?',
      session_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      user_profile: 'patient'
    })
  }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data === '[DONE]') {
    eventSource.close();
    return;
  }

  if (data.status === 'streaming') {
    appendToMessage(data.content);
  }
};
```

**SSE Response:**
```
data: {"status": "agent_selected", "agent_type": "nutrition"}

data: {"status": "streaming", "content": "For kidney disease patients, you should avoid:", "chunk_index": 0}

data: {"status": "streaming", "content": "\n- High sodium foods", "chunk_index": 1}

data: {"status": "streaming", "content": "\n- Processed meats", "chunk_index": 2}

data: {"status": "complete", "total_tokens": 85, "agent_type": "nutrition"}

data: [DONE]
```

**3. Retrieve History**
```bash
curl -X GET "http://localhost:8000/api/chat/history?user_id=user123&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 42,
  "conversations": [
    {
      "id": "conv_001",
      "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "timestamp": "2025-11-27T12:05:00Z",
      "agent_type": "nutrition",
      "user_input": "What foods should I avoid?",
      "agent_response": "For kidney disease patients, you should avoid...",
      "tokens_used": 85
    }
  ]
}
```

---

## Appendix B: Error Code Reference

| Error Code | HTTP Status | Description | Resolution |
|-----------|-------------|-------------|------------|
| `SESSION_EXPIRED` | 404 | Session not found or expired | Create new session |
| `INVALID_AGENT` | 400 | Unknown agent type | Use valid agent type |
| `CONTEXT_LIMIT_EXCEEDED` | 429 | Context window full | Reset session context |
| `UNAUTHORIZED` | 401 | Missing/invalid token | Login again |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry |
| `VALIDATION_ERROR` | 422 | Invalid request format | Fix request body |
| `DATABASE_ERROR` | 500 | Database operation failed | Contact support |
| `STREAMING_ERROR` | 500 | SSE stream failed | Retry request |

---

## Appendix C: Frontend Integration Guide

### React Hook Example
```typescript
// useChatStream.ts
export function useChatStream() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Create session
  const createSession = async (userId: string) => {
    const response = await api.post('/api/session/create', { user_id: userId });
    setSessionId(response.data.session_id);
    return response.data.session_id;
  };

  // Stream chat
  const streamChat = async (query: string, onChunk: (chunk: string) => void) => {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, session_id: sessionId })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (data === '[DONE]') return;
          if (data.status === 'streaming') {
            onChunk(data.content);
          }
        }
      }
    }
  };

  return { createSession, streamChat, sessionId };
}
```

---

## Conclusion

This API design provides a complete solution for integrating the frontend chat interface with the backend Agent system. The implementation follows RESTful principles, leverages existing backend components, and ensures scalability for production use.

**Key Benefits:**
- Seamless integration with existing AgentManager
- SSE-based streaming for real-time responses
- MongoDB persistence for reliability
- Comprehensive error handling
- GDPR compliance support
- Performance optimization built-in

**Next Steps:**
1. Review and approve this specification
2. Create implementation tasks in project management system
3. Begin Phase 1 development
4. Set up monitoring and logging infrastructure
5. Prepare frontend updates for new endpoints
