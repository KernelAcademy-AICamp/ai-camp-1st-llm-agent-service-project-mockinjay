# API Integration Summary

## Overview

This document summarizes the API design for integrating the CareGuide frontend with the backend Agent system.

## Problem Statement

The frontend React application is calling three API endpoints that either don't exist or are misconfigured:

1. **POST `/api/session/create`** - Not implemented (returns 404)
2. **POST `/api/chat/stream`** - Proxies to non-existent Parlant server (returns 503/504)
3. **GET `/api/chat/history`** - Referenced but not implemented

This causes:
- CORS preflight failures (OPTIONS returns 400)
- Session initialization errors
- Chat streaming failures
- History restoration failures

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ChatInterface│  │ useChatSession│ │ useChatRooms │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTP/SSE
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                           ▼           BACKEND (FastAPI)          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              API Routers (app/api/)                     │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │    │
│  │  │  session.py│  │  chat.py   │  │  auth.py   │        │    │
│  │  │            │  │            │  │            │        │    │
│  │  │ - create   │  │ - /stream  │  │ - login    │        │    │
│  │  │ - get      │  │ - /history │  │ - signup   │        │    │
│  │  │ - delete   │  │ - /rooms   │  │            │        │    │
│  │  └─────┬──────┘  └─────┬──────┘  └────────────┘        │    │
│  └────────┼───────────────┼──────────────────────────────────┘  │
│           │               │                                      │
│           ▼               ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Agent System (backend/Agent/)                 │    │
│  │  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐ │    │
│  │  │ AgentManager   │  │SessionManager│  │ContextTracker│ │    │
│  │  │                │  │              │  │             │ │    │
│  │  │ - route_request│  │ - create     │  │ - track     │ │    │
│  │  │ - get_info     │  │ - get        │  │ - check     │ │    │
│  │  └────────┬───────┘  └──────────────┘  └─────────────┘ │    │
│  │           │                                             │    │
│  │           ▼                                             │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │           Specialized Agents                     │  │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │    │
│  │  │  │Nutrition │ │Medical   │ │Research Paper    │ │  │    │
│  │  │  │Agent     │ │Welfare   │ │Agent             │ │  │    │
│  │  │  └──────────┘ └──────────┘ └──────────────────┘ │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Database (MongoDB)                         │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │    │
│  │  │  sessions  │  │chat_history│  │chat_rooms  │        │    │
│  │  │            │  │            │  │            │        │    │
│  │  │ - session_id│ │ - user_id  │  │ - room_id  │        │    │
│  │  │ - user_id  │  │ - session_id│ │ - messages │        │    │
│  │  │ - expires_at│ │ - messages │  │ - metadata │        │    │
│  │  └────────────┘  └────────────┘  └────────────┘        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints Summary

### 1. Session Management API

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/session/create` | Create new session | ⚠️ To Implement |
| GET | `/api/session/{id}` | Get session info | ⚠️ To Implement |
| DELETE | `/api/session/{id}` | Delete session | ⚠️ To Implement |

**Key Features:**
- Integrates with existing AgentManager
- 30-minute session timeout
- MongoDB persistence for reliability
- Returns session_id, expiration time

---

### 2. Chat Streaming API

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/chat/stream` | Stream chat responses (SSE) | ⚠️ To Fix |
| GET | `/api/chat/history` | Get conversation history | ⚠️ To Implement |

**Key Features:**
- Server-Sent Events (SSE) for real-time streaming
- Agent auto-routing or explicit selection
- Profile-based personalization (patient/general/researcher)
- Conversation persistence to MongoDB

**SSE Event Types:**
```javascript
// Agent selection
{ status: "agent_selected", agent_type: "nutrition" }

// Streaming content
{ status: "streaming", content: "text chunk", chunk_index: 0 }

// Multi-turn response
{ status: "new_message", content: "additional message", message_index: 1 }

// Completion
{ status: "complete", total_tokens: 150, agent_type: "nutrition" }

// End marker
"[DONE]"
```

---

### 3. Room Management API (Existing - Enhanced)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/chat/rooms` | Create room | ✅ Implemented |
| GET | `/api/chat/rooms` | List rooms | ✅ Implemented |
| PATCH | `/api/chat/rooms/{id}` | Update room | ✅ Implemented |
| DELETE | `/api/chat/rooms/{id}` | Delete room | ✅ Implemented |

**Enhancement Needed:**
- Auto-update room metadata when messages are saved
- Sync `last_message`, `message_count` from chat history

---

## Database Schema

### New Collections

#### `sessions` Collection
```json
{
  "session_id": "uuid",
  "user_id": "string",
  "created_at": "ISODate",
  "last_activity": "ISODate",
  "expires_at": "ISODate",
  "active_agent": "nutrition | medical_welfare | research_paper | ...",
  "status": "active | expired"
}
```

**Indexes:**
- `session_id` (unique)
- `user_id`
- `expires_at` (TTL index for auto-cleanup)

#### `chat_history` Collection
```json
{
  "session_id": "uuid",
  "user_id": "string",
  "room_id": "string | null",
  "timestamp": "ISODate",
  "agent_type": "string",
  "user_input": "string",
  "agent_response": "string",
  "tokens_used": "integer",
  "user_profile": "patient | general | researcher"
}
```

**Indexes:**
- `user_id` + `timestamp` (descending)
- `session_id` + `timestamp` (descending)
- `room_id` + `timestamp` (descending)

---

## Request/Response Examples

### Example 1: Session Creation

**Request:**
```bash
POST /api/session/create
{
  "user_id": "user_12345"
}
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

---

### Example 2: Chat Streaming

**Request:**
```bash
POST /api/chat/stream
{
  "query": "What foods should I avoid with kidney disease?",
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_profile": "patient",
  "agent_type": "auto"
}
```

**Response (SSE Stream):**
```
data: {"status": "agent_selected", "agent_type": "nutrition"}

data: {"status": "streaming", "content": "For kidney disease patients,", "chunk_index": 0}

data: {"status": "streaming", "content": " you should avoid:", "chunk_index": 1}

data: {"status": "streaming", "content": "\n- High sodium foods", "chunk_index": 2}

data: {"status": "streaming", "content": "\n- Processed meats", "chunk_index": 3}

data: {"status": "complete", "total_tokens": 85, "agent_type": "nutrition"}

data: [DONE]
```

---

### Example 3: Chat History

**Request:**
```bash
GET /api/chat/history?user_id=user_12345&limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 42,
  "limit": 10,
  "offset": 0,
  "conversations": [
    {
      "id": "conv_001",
      "session_id": "a1b2c3d4-...",
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

## Implementation Phases

### Phase 1: Critical (Week 1) - GET CHAT WORKING
**Goal:** Make chat interface functional

- [ ] Create `backend/app/api/session.py` router
- [ ] Implement `POST /api/session/create`
- [ ] Update `backend/app/api/chat.py` with `/stream` endpoint
- [ ] Connect streaming to AgentManager
- [ ] Create MongoDB collections and indexes
- [ ] Test session creation + streaming flow

**Deliverables:**
- Frontend can create sessions
- Frontend can send messages and receive streaming responses
- Conversations saved to database

---

### Phase 2: History & Persistence (Week 2) - RESTORE CONTEXT
**Goal:** Enable history restoration and multi-session support

- [ ] Implement `GET /api/chat/history`
- [ ] Add pagination support
- [ ] Connect history to room updates
- [ ] Implement session info endpoint
- [ ] Add session cleanup job

**Deliverables:**
- Users can restore previous conversations
- Room metadata auto-updates
- Session management in database

---

### Phase 3: Enhancements (Week 3) - POLISH & OPTIMIZE
**Goal:** Production-ready features

- [ ] Add rate limiting
- [ ] Implement caching (Redis)
- [ ] Add monitoring/logging
- [ ] Implement DELETE history endpoint
- [ ] Performance optimization
- [ ] Security hardening

**Deliverables:**
- Production-ready API
- Monitoring dashboard
- Performance benchmarks

---

## Integration Checklist

### Backend Tasks
- [ ] Create `backend/app/api/session.py`
- [ ] Update `backend/app/api/chat.py` (add `/stream` before proxy route)
- [ ] Update `backend/app/main.py` (include session router)
- [ ] Update `backend/app/db/connection.py` (add new collections)
- [ ] Run database setup script
- [ ] Update CORS configuration (allow OPTIONS)
- [ ] Add AgentManager import to chat.py
- [ ] Test endpoints with curl/Postman

### Frontend Tasks
- [ ] Update `services/api.ts` (remove fallback mocks)
- [ ] Verify `useChatSession.ts` calls correct endpoints
- [ ] Update `ChatInterface.tsx` SSE handling
- [ ] Test session creation flow
- [ ] Test chat streaming with real backend
- [ ] Test history restoration
- [ ] Update error handling

### Database Tasks
- [ ] Create `sessions` collection
- [ ] Create `chat_history` collection
- [ ] Create indexes on both collections
- [ ] Set up TTL index for session expiration
- [ ] Test MongoDB connection
- [ ] Verify data persistence

---

## Testing Strategy

### Unit Tests
```python
# test_session_api.py
def test_create_session():
    response = client.post("/api/session/create", json={"user_id": "test"})
    assert response.status_code == 201
    assert "session_id" in response.json()

# test_chat_stream.py
async def test_chat_stream():
    async with client.stream(
        "POST", "/api/chat/stream",
        json={"query": "test", "session_id": "valid_id"}
    ) as response:
        assert response.headers["content-type"] == "text/event-stream"
```

### Integration Tests
```bash
# Test full flow
1. Create session
2. Send chat message
3. Verify streaming response
4. Check database for saved conversation
5. Retrieve history
```

### Load Tests
```bash
# Concurrent streaming test
artillery run load-test.yml

# 100 concurrent users
# 30 messages per second
# Check for connection timeouts
```

---

## Common Issues & Solutions

### Issue 1: "Session expired" error
**Cause:** Session timeout or not persisted
**Solution:**
- Check MongoDB for session
- Verify TTL index is set correctly
- Increase timeout if needed

### Issue 2: SSE stream not appearing in frontend
**Cause:** CORS or buffering
**Solution:**
- Add `X-Accel-Buffering: no` header
- Verify CORS allows SSE content-type
- Check browser DevTools Network tab

### Issue 3: AgentManager import error
**Cause:** Python path not configured
**Solution:**
```python
import sys
sys.path.append("../../")
from backend.Agent.agent_manager import AgentManager
```

### Issue 4: Slow streaming
**Cause:** Large chunks or network latency
**Solution:**
- Reduce chunk size (10-20 chars)
- Add asyncio.sleep(0.05) between chunks
- Check server CPU usage

---

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Session creation | < 100ms | < 500ms |
| Stream first byte | < 200ms | < 1s |
| Chunk latency | < 50ms | < 200ms |
| History query | < 150ms | < 1s |
| Concurrent streams | 100+ | 50+ |
| Database writes | < 50ms | < 200ms |

---

## Security Considerations

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Users can only access their own sessions/history
3. **Input Validation:** Sanitize all user inputs
4. **Rate Limiting:** Prevent abuse (30 req/min per user)
5. **Data Privacy:** Encrypt sensitive data at rest
6. **GDPR Compliance:** Support data deletion

---

## Monitoring & Logging

### Key Metrics to Track
- Session creation rate
- Active sessions count
- Chat streaming errors
- Average response time
- Database query performance
- Agent routing distribution

### Log Events
```python
logger.info(f"Session created: {session_id} for user: {user_id}")
logger.info(f"Agent selected: {agent_type} for query: {query[:50]}")
logger.error(f"Stream error: {error} for session: {session_id}")
logger.warning(f"Context limit approaching: {usage}/{limit}")
```

---

## Next Steps

1. **Review this summary** with team
2. **Read full specification** in `API_DESIGN_SPECIFICATION.md`
3. **Follow implementation guide** in `QUICK_IMPLEMENTATION_GUIDE.md`
4. **Start with Phase 1** (Session + Streaming)
5. **Test thoroughly** before deploying
6. **Monitor production** after deployment

---

## Documentation Files

- **API_DESIGN_SPECIFICATION.md** - Full API specification with all details
- **QUICK_IMPLEMENTATION_GUIDE.md** - Step-by-step implementation guide
- **API_INTEGRATION_SUMMARY.md** - This file (overview)

---

## Support & Questions

For implementation questions or issues:
1. Check the implementation guide first
2. Review existing Agent code in `/backend/Agent/`
3. Test with curl before integrating frontend
4. Check MongoDB collections for data persistence
5. Review FastAPI logs for errors

**Happy coding!** 🚀
