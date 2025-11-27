# Chat API Quick Reference

## Setup

```bash
# 1. Run migration
python scripts/migrations/001_add_chat_rooms_collection.py upgrade

# 2. Start server
uvicorn app.main:app --reload

# 3. Access docs
open http://localhost:8000/docs
```

---

## Rooms API

### Create Room
```bash
POST /api/rooms
```
```json
{
  "user_id": "user_123",
  "room_name": "My Room",
  "metadata": {"tags": ["kidney"]}
}
```

### List Rooms
```bash
GET /api/rooms?user_id=user_123&limit=20&offset=0&sort_by=last_activity
```

### Get Room
```bash
GET /api/rooms/{room_id}
```

### Update Room
```bash
PATCH /api/rooms/{room_id}?user_id=user_123
```
```json
{
  "room_name": "Updated Name",
  "metadata": {"tags": ["kidney", "treatment"]}
}
```

### Delete Room
```bash
DELETE /api/rooms/{room_id}?user_id=user_123
```

### Room History
```bash
GET /api/rooms/{room_id}/history?limit=50&offset=0
```

---

## Session API

### Create Session
```bash
POST /api/session/create
```
```json
{
  "user_id": "user_123",
  "room_id": "room_abc"
}
```

### Get Session
```bash
GET /api/session/{session_id}
```

### Reset Session
```bash
POST /api/session/{session_id}/reset
```
```json
{
  "agent_type": "research_paper"  // or null for all
}
```

### Stop Stream
```bash
POST /api/session/{session_id}/stop
```

### Clear History
```bash
DELETE /api/session/{session_id}/history?room_id=room_abc
```

### Delete Session
```bash
DELETE /api/session/{session_id}
```

---

## Chat API

### Send Message
```bash
POST /api/chat/message
```
```json
{
  "query": "What are kidney disease treatments?",
  "session_id": "session_xyz",
  "room_id": "room_abc",
  "user_id": "user_123"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"status": "streaming", "content": "Based on...", "agent_type": "research_paper"}
data: {"status": "complete", "content": "Full response"}
data: [DONE]
```

---

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-01-26T10:00:00Z"
}
```

### Error
```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-01-26T10:00:00Z"
}
```

---

## Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `ROOM_LIMIT_EXCEEDED` | 400 | Max 50 rooms reached |
| `ACCESS_DENIED` | 403 | Not room owner |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Database Collections

### chat_rooms
```javascript
{
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

### conversation_history
```javascript
{
  "user_id": "user_123",
  "session_id": "session_xyz",
  "room_id": "room_abc",
  "agent_type": "research_paper",
  "user_input": "Question",
  "agent_response": "Answer",
  "timestamp": ISODate
}
```

### active_streams
```javascript
{
  "stream_id": "stream_abc",
  "session_id": "session_xyz",
  "room_id": "room_abc",
  "started_at": ISODate,
  "cancel_requested": false,
  "last_heartbeat": ISODate
}
```

---

## Frontend Examples

### Create Room and Chat
```typescript
// 1. Create room
const roomRes = await fetch('/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    room_name: 'New Chat'
  })
});
const { data: room } = await roomRes.json();

// 2. Create session
const sessionRes = await fetch('/api/session/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    room_id: room.room_id
  })
});
const { data: session } = await sessionRes.json();

// 3. Start streaming
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

### Cancel Stream
```typescript
await fetch(`/api/session/${sessionId}/stop`, {
  method: 'POST'
});
eventSource.close();
```

### List Rooms
```typescript
const res = await fetch(`/api/rooms?user_id=${userId}&limit=20`);
const { data } = await res.json();
console.log(data.rooms); // Array of rooms
```

---

## Limits

- **Max rooms per user:** 50
- **Max concurrent streams:** 5
- **Session timeout:** 30 minutes
- **Idle timeout:** 10 minutes
- **Room name max length:** 100 chars
- **Metadata max size:** 10KB

---

## Files Created

```
backend/
├── app/
│   ├── models/
│   │   └── chat.py                    # Pydantic models
│   └── api/
│       ├── rooms.py                   # Rooms API
│       ├── session.py                 # Session API
│       └── chat.py                    # Updated chat API
├── scripts/
│   └── migrations/
│       └── 001_add_chat_rooms_collection.py  # DB migration
└── docs/
    ├── CHAT_ARCHITECTURE.md           # Full architecture
    ├── CHAT_API_REDESIGN.md           # Usage guide
    ├── IMPLEMENTATION_SUMMARY.md      # Summary
    └── QUICK_REFERENCE.md             # This file
```

---

## Helpful Commands

```bash
# Check MongoDB connection
mongosh

# View collections
use careguide
show collections

# Count rooms
db.chat_rooms.countDocuments()

# View indexes
db.chat_rooms.getIndexes()
db.conversation_history.getIndexes()

# Run migration
python scripts/migrations/001_add_chat_rooms_collection.py upgrade

# Rollback migration
python scripts/migrations/001_add_chat_rooms_collection.py downgrade

# Test endpoint
curl http://localhost:8000/api/health
```

---

## Documentation Links

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Architecture:** `/backend/CHAT_ARCHITECTURE.md`
- **Usage Guide:** `/backend/CHAT_API_REDESIGN.md`
- **Summary:** `/backend/IMPLEMENTATION_SUMMARY.md`
