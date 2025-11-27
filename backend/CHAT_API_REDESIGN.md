# Chat API Redesign - Implementation Guide

## Overview

This document describes the redesigned chat API with full room management, session control, and stream cancellation capabilities.

## New Features

### 1. Chat Rooms Management (`/api/rooms`)
- Create, list, update, and delete chat rooms
- Get room-specific conversation history
- Paginated room listing with last message preview

### 2. Enhanced Session Control (`/api/session`)
- Create sessions with room association
- Reset specific agent or entire session
- Stop active streams mid-execution
- Clear conversation history

### 3. Stream Management
- Track active streams per session
- Graceful stream cancellation
- Partial response retrieval on cancellation

---

## API Endpoints

### Rooms API

#### Create Room
```bash
POST /api/rooms
Content-Type: application/json

{
  "user_id": "user_123",
  "room_name": "Kidney Disease Discussion",
  "metadata": {
    "initial_agent": "research_paper",
    "tags": ["kidney", "research"]
  }
}
```

#### List User Rooms
```bash
GET /api/rooms?user_id=user_123&limit=50&offset=0&sort_by=last_activity
```

#### Get Room Details
```bash
GET /api/rooms/{room_id}
```

#### Update Room
```bash
PATCH /api/rooms/{room_id}?user_id=user_123
Content-Type: application/json

{
  "room_name": "Updated Room Name",
  "metadata": {
    "tags": ["kidney", "treatment"]
  }
}
```

#### Delete Room
```bash
DELETE /api/rooms/{room_id}?user_id=user_123
```

#### Get Room History
```bash
GET /api/rooms/{room_id}/history?limit=50&offset=0
```

---

### Session API

#### Create Session
```bash
POST /api/session/create
Content-Type: application/json

{
  "user_id": "user_123",
  "room_id": "room_a1b2c3d4"  # Optional, auto-created if omitted
}
```

#### Get Session Details
```bash
GET /api/session/{session_id}
```

#### Reset Session
```bash
POST /api/session/{session_id}/reset
Content-Type: application/json

{
  "agent_type": "research_paper"  # Optional, resets all if omitted
}
```

#### Stop Stream
```bash
POST /api/session/{session_id}/stop
```

#### Clear History
```bash
DELETE /api/session/{session_id}/history?room_id=room_a1b2c3d4
```

#### Delete Session
```bash
DELETE /api/session/{session_id}
```

---

## Database Schema

### chat_rooms Collection
```javascript
{
  "_id": ObjectId,
  "room_id": "room_uuid",
  "user_id": "user_123",
  "room_name": "Room Name",
  "created_at": ISODate,
  "last_activity": ISODate,
  "message_count": 12,
  "metadata": {},
  "is_deleted": false
}
```

### conversation_history Collection (Enhanced)
```javascript
{
  "_id": ObjectId,
  "user_id": "user_123",
  "session_id": "session_xyz",
  "room_id": "room_a1b2c3d4",
  "agent_type": "research_paper",
  "user_input": "Question",
  "agent_response": "Answer",
  "timestamp": ISODate
}
```

### active_streams Collection
```javascript
{
  "_id": ObjectId,
  "stream_id": "stream_abc",
  "session_id": "session_xyz",
  "room_id": "room_a1b2c3d4",
  "user_id": "user_123",
  "started_at": ISODate,
  "status": "streaming",
  "cancel_requested": false,
  "last_heartbeat": ISODate  // TTL index (5 min)
}
```

---

## Setup Instructions

### 1. Run Database Migration
```bash
cd backend
python scripts/migrations/001_add_chat_rooms_collection.py upgrade
```

### 2. Verify Indexes
```bash
# In MongoDB shell
use careguide

db.chat_rooms.getIndexes()
db.conversation_history.getIndexes()
db.active_streams.getIndexes()
```

### 3. Test Endpoints
```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test room creation
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "room_name": "Test Room"
  }'

# List rooms
curl "http://localhost:8000/api/rooms?user_id=test_user"
```

---

## Usage Examples

### Frontend Integration

#### Create Room and Start Chat
```typescript
// 1. Create a room
const createRoomResponse = await fetch('/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    room_name: 'New Conversation'
  })
});
const { data: room } = await createRoomResponse.json();

// 2. Create session
const sessionResponse = await fetch('/api/session/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    room_id: room.room_id
  })
});
const { data: session } = await sessionResponse.json();

// 3. Start chat
const eventSource = new EventSource(
  `/api/chat/message?session_id=${session.session_id}&room_id=${room.room_id}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.status === 'streaming') {
    appendToChat(data.content);
  }
};
```

#### Cancel Stream
```typescript
async function cancelStream(sessionId: string) {
  const response = await fetch(`/api/session/${sessionId}/stop`, {
    method: 'POST'
  });

  const { data } = await response.json();
  console.log('Stream stopped:', data.partial_response);
}
```

#### List Rooms with Pagination
```typescript
async function loadRooms(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const response = await fetch(
    `/api/rooms?user_id=${userId}&limit=${pageSize}&offset=${offset}`
  );

  const { data } = await response.json();
  return {
    rooms: data.rooms,
    total: data.total,
    currentPage: data.page,
    totalPages: Math.ceil(data.total / pageSize)
  };
}
```

---

## Stream Cancellation Pattern

### Backend Implementation
```python
# In chat.py
active_streams_tracker[session_id] = {
    "cancel_requested": False,
    "partial_response": ""
}

async for chunk in router_agent.process_stream(request):
    # Check cancellation
    if active_streams_tracker.get(session_id, {}).get("cancel_requested"):
        yield {"status": "cancelled"}
        break

    yield chunk
```

### Frontend Implementation
```typescript
class StreamManager {
  private eventSource: EventSource | null = null;

  startStream(sessionId: string) {
    this.eventSource = new EventSource(`/api/chat/message?session_id=${sessionId}`);
    this.eventSource.onmessage = this.handleMessage;
  }

  async stopStream(sessionId: string) {
    // Close connection
    this.eventSource?.close();

    // Notify backend
    await fetch(`/api/session/${sessionId}/stop`, { method: 'POST' });
  }

  handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    if (data.status === 'cancelled') {
      console.log('Stream was cancelled');
      this.eventSource?.close();
    }
  }
}
```

---

## Error Handling

### Common Error Codes

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 403 | ACCESS_DENIED | User doesn't own the resource |
| 404 | NOT_FOUND | Resource not found |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### Error Response Format
```json
{
  "success": false,
  "error": "Access denied: You don't own this room",
  "error_code": "ACCESS_DENIED",
  "timestamp": "2025-01-26T16:00:00Z",
  "path": "/api/rooms/room_123"
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Connection Pooling**
   - MongoDB pool: 10-100 connections
   - Reuse connections across requests

2. **Indexing**
   - All queries use indexed fields
   - Compound indexes for multi-field queries

3. **Pagination**
   - Default page size: 50
   - Max page size: 200
   - Use offset-based pagination

4. **Caching**
   - Room metadata cached in SessionManager
   - MongoDB TTL index for auto-cleanup

5. **Async Operations**
   - All DB operations are async
   - Parallel queries where possible

### Monitoring Metrics

```python
# Add to your monitoring setup
metrics = {
    "room_creation_rate": Counter,
    "active_streams": Gauge,
    "stream_duration": Histogram,
    "db_query_latency": Histogram,
    "error_rate": Counter
}
```

---

## Security Best Practices

### 1. Authentication
- All endpoints require valid user authentication
- Use JWT tokens with expiration

### 2. Authorization
- Verify room ownership before updates/deletes
- Session-to-user binding validation

### 3. Rate Limiting
```python
# Recommended limits
RATE_LIMITS = {
    "room_creation": "10 per hour",
    "chat_messages": "100 per minute",
    "stream_cancellation": "20 per minute"
}
```

### 4. Input Validation
- Pydantic models for all requests
- Metadata size limit: 10KB
- Room name max length: 100 chars

### 5. Data Sanitization
- Escape MongoDB queries
- Validate user_id format
- Sanitize room names (no special chars)

---

## Migration Guide

### From Old API to New API

#### Before
```python
# Old: Manual room management
rooms = await db.conversation_history.aggregate([
    {"$group": {"_id": "$session_id"}}
]).to_list(None)
```

#### After
```python
# New: Structured room API
response = await fetch(f"/api/rooms?user_id={user_id}")
rooms = response.json()["data"]["rooms"]
```

### Breaking Changes
- `/api/chat/rooms` endpoint deprecated (use `/api/rooms` instead)
- Session creation moved to `/api/session/create`
- New response format with `success` field

### Backward Compatibility
- Old endpoints still functional (deprecated)
- Gradual migration path available
- 6-month deprecation window

---

## Testing

### Unit Tests
```bash
pytest backend/tests/api/test_rooms.py
pytest backend/tests/api/test_session.py
```

### Integration Tests
```bash
pytest backend/tests/integration/test_chat_flow.py
```

### Load Tests
```bash
locust -f backend/tests/load/test_chat_api.py --host=http://localhost:8000
```

---

## Troubleshooting

### Common Issues

1. **"Room not found" error**
   - Check if room was soft-deleted (`is_deleted=true`)
   - Verify room_id format

2. **Stream not cancelling**
   - Check `active_streams_tracker` has the session
   - Verify cancellation flag is being checked in loop

3. **Slow room listing**
   - Verify indexes are created
   - Check MongoDB connection pool size

4. **MongoDB connection errors**
   - Check connection string in `.env`
   - Verify MongoDB is running
   - Check firewall/network settings

---

## Future Enhancements

### Planned Features
1. Real-time room updates via WebSocket
2. Room sharing between users
3. Room templates
4. Conversation export (PDF/JSON)
5. Advanced search across rooms
6. Room analytics dashboard

### Scalability Roadmap
1. **Phase 1** (Current): Single instance
2. **Phase 2**: Redis for session state
3. **Phase 3**: Horizontal scaling with load balancer
4. **Phase 4**: Microservices architecture

---

## Support

For issues or questions:
- GitHub Issues: [Project Repository]
- Documentation: `/docs` (Swagger UI)
- API Reference: `/redoc`

---

## Changelog

### v2.0.0 (2025-01-26)
- ✨ Added Rooms API (`/api/rooms`)
- ✨ Enhanced Session API (`/api/session`)
- ✨ Stream cancellation support
- ✨ Room management with metadata
- 🔧 Fixed `context_system` undefined issue
- 📝 Comprehensive API documentation
- 🗄️ Database migration script

### v1.0.0 (Previous)
- Basic chat endpoint
- Simple history retrieval
- Session management (in-memory)
