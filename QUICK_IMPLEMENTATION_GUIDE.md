# Quick Implementation Guide

This is a condensed guide for implementing the missing chat API endpoints. For full specifications, see `API_DESIGN_SPECIFICATION.md`.

## Quick Start: Critical Endpoints

### 1. Session Management (Priority 1)

**File:** `backend/app/api/session.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from backend.Agent.agent_manager import AgentManager

router = APIRouter(prefix="/api/session", tags=["session"])
agent_manager = AgentManager()

class SessionCreateRequest(BaseModel):
    user_id: str

class SessionResponse(BaseModel):
    success: bool
    session_id: str
    created_at: str
    expires_at: str
    timeout_minutes: int

@router.post("/create", response_model=SessionResponse)
async def create_session(request: SessionCreateRequest):
    """Create a new chat session"""
    session_id = agent_manager.create_user_session(request.user_id)

    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(minutes=30)

    return SessionResponse(
        success=True,
        session_id=session_id,
        created_at=created_at.isoformat(),
        expires_at=expires_at.isoformat(),
        timeout_minutes=30
    )

@router.get("/{session_id}")
async def get_session(session_id: str):
    """Get session information"""
    info = agent_manager.get_session_info(session_id)
    if not info:
        raise HTTPException(404, "Session not found or expired")
    return {"success": True, **info}

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    success = agent_manager.session_manager.delete_session(session_id)
    if not success:
        raise HTTPException(404, "Session not found")
    return {"success": True, "message": "Session deleted"}
```

**Add to `backend/app/main.py`:**
```python
from app.api import session

app.include_router(session.router)
```

---

### 2. Chat Streaming (Priority 1)

**Update:** `backend/app/api/chat.py`

Add this BEFORE the catch-all proxy route:

```python
from fastapi.responses import StreamingResponse
import json
import asyncio

class ChatStreamRequest(BaseModel):
    query: str
    session_id: str
    agent_type: Optional[str] = "auto"
    user_profile: Optional[str] = "patient"
    room_id: Optional[str] = None

@router.post("/stream")
async def stream_chat(request: ChatStreamRequest):
    """Stream chat responses using SSE"""

    async def event_generator():
        try:
            # Validate session
            session_info = agent_manager.get_session_info(request.session_id)
            if not session_info:
                error_data = {"status": "error", "error": "Session expired"}
                yield f"data: {json.dumps(error_data)}\n\n"
                yield "data: [DONE]\n\n"
                return

            # Determine agent type (auto-routing or explicit)
            agent_type = request.agent_type

            # Emit agent selection
            yield f"data: {json.dumps({'status': 'agent_selected', 'agent_type': agent_type})}\n\n"

            # Route to agent
            result = await agent_manager.route_request(
                agent_type=agent_type,
                user_input=request.query,
                session_id=request.session_id,
                context={"user_profile": request.user_profile, "room_id": request.room_id}
            )

            if not result["success"]:
                error_data = {"status": "error", "error": result.get("error", "Unknown error")}
                yield f"data: {json.dumps(error_data)}\n\n"
                yield "data: [DONE]\n\n"
                return

            # Get response text
            response_text = result["result"].get("response", "")

            # Stream in chunks (simulate streaming for non-streaming LLMs)
            chunk_size = 20  # characters per chunk
            chunks = [response_text[i:i+chunk_size] for i in range(0, len(response_text), chunk_size)]

            for i, chunk in enumerate(chunks):
                chunk_data = {
                    "status": "streaming",
                    "content": chunk,
                    "chunk_index": i
                }
                yield f"data: {json.dumps(chunk_data)}\n\n"
                await asyncio.sleep(0.05)  # Small delay for smooth streaming

            # Save to database (implement this)
            # await save_chat_history(request, result)

            # Complete event
            complete_data = {
                "status": "complete",
                "total_tokens": result["result"].get("tokens_used", 0),
                "agent_type": agent_type
            }
            yield f"data: {json.dumps(complete_data)}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            error_data = {"status": "error", "error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
```

**Import at top of file:**
```python
from backend.Agent.agent_manager import AgentManager

# Create agent manager instance
agent_manager = AgentManager()
```

---

### 3. Chat History (Priority 2)

**Add to `backend/app/api/chat.py`:**

```python
from app.db.connection import db

# Get chat_history collection
chat_history_collection = db["chat_history"]

@router.get("/history")
async def get_chat_history(
    user_id: str = Query(..., description="User ID"),
    session_id: Optional[str] = Query(None, description="Session ID filter"),
    room_id: Optional[str] = Query(None, description="Room ID filter"),
    limit: int = Query(50, ge=1, le=200, description="Max conversations"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """Get chat history for a user"""

    # Build query filter
    query_filter = {"user_id": user_id}
    if session_id:
        query_filter["session_id"] = session_id
    if room_id:
        query_filter["room_id"] = room_id

    # Count total
    total = chat_history_collection.count_documents(query_filter)

    # Get conversations
    cursor = chat_history_collection.find(query_filter).sort(
        "timestamp", -1
    ).skip(offset).limit(limit)

    conversations = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
        conversations.append(doc)

    return {
        "success": True,
        "count": len(conversations),
        "total": total,
        "limit": limit,
        "offset": offset,
        "conversations": conversations
    }
```

---

### 4. Database Setup

**File:** `backend/scripts/setup_chat_collections.py`

```python
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(MONGODB_URI)
db = client["careguide"]

# Create collections
sessions_collection = db["sessions"]
chat_history_collection = db["chat_history"]

# Create indexes
print("Creating indexes for sessions collection...")
sessions_collection.create_index("session_id", unique=True)
sessions_collection.create_index("user_id")
sessions_collection.create_index("expires_at", expireAfterSeconds=0)  # TTL index

print("Creating indexes for chat_history collection...")
chat_history_collection.create_index([("user_id", 1), ("timestamp", -1)])
chat_history_collection.create_index([("session_id", 1), ("timestamp", -1)])
chat_history_collection.create_index([("room_id", 1), ("timestamp", -1)])

print("Database setup complete!")
```

**Run:**
```bash
cd backend
python scripts/setup_chat_collections.py
```

---

### 5. Update Connection File

**File:** `backend/app/db/connection.py`

Add these collections:
```python
# Chat collections
sessions_collection: Collection = db["sessions"]
chat_history_collection: Collection = db["chat_history"]
```

---

## Testing

### Test Session Creation
```bash
curl -X POST http://localhost:8000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user"}'
```

Expected response:
```json
{
  "success": true,
  "session_id": "uuid-here",
  "created_at": "2025-11-27T...",
  "expires_at": "2025-11-27T...",
  "timeout_minutes": 30
}
```

### Test Chat Streaming
```bash
curl -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is CKD?",
    "session_id": "your-session-id",
    "agent_type": "auto"
  }'
```

Expected: SSE stream with status events

### Test Chat History
```bash
curl "http://localhost:8000/api/chat/history?user_id=test_user&limit=10"
```

---

## Common Issues & Fixes

### Issue 1: CORS Preflight Failures
**Fix:** Ensure OPTIONS is in allowed methods
```python
app.add_middleware(
    CORSMiddleware,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
)
```

### Issue 2: Session Not Persisting
**Fix:** Ensure MongoDB is running and sessions collection exists
```bash
# Check MongoDB
mongosh
use careguide
db.sessions.find()
```

### Issue 3: SSE Not Streaming
**Fix:** Check response headers and disable buffering
```python
headers={
    "X-Accel-Buffering": "no",  # Disable nginx buffering
    "Cache-Control": "no-cache"
}
```

### Issue 4: Agent Manager Import Error
**Fix:** Ensure correct import path
```python
# If in backend/app/api/chat.py:
import sys
sys.path.append("../../")
from backend.Agent.agent_manager import AgentManager
```

---

## Deployment Checklist

- [ ] Create session.py router
- [ ] Update chat.py with streaming endpoint
- [ ] Run database setup script
- [ ] Update connection.py with new collections
- [ ] Update main.py to include session router
- [ ] Test all endpoints locally
- [ ] Update frontend API calls
- [ ] Deploy to staging
- [ ] Monitor logs for errors
- [ ] Deploy to production

---

## Next Steps

1. **Implement Phase 1** (Session + Streaming)
2. **Test with Frontend** - Update frontend to use new endpoints
3. **Monitor Performance** - Check database query times, SSE latency
4. **Implement Phase 2** (History + Room Integration)
5. **Add Enhancements** (Caching, rate limiting, monitoring)

For detailed specifications, troubleshooting, and advanced features, see **API_DESIGN_SPECIFICATION.md**.
