# CareGuide Chat API - Backend Architecture Design

## Executive Summary

The CareGuide chat API has been redesigned to support multi-room conversations with granular session control and stream management. The current implementation had basic streaming chat but lacked proper room CRUD operations, session lifecycle management, and the ability to cancel ongoing streams.

**Key Improvements:**
- **Chat Rooms API**: Complete CRUD operations for managing multiple conversation threads per user
- **Session Control API**: Enhanced lifecycle management with reset and cancellation capabilities
- **Stream Management**: Graceful cancellation of ongoing streams with partial response retrieval
- **Fixed Architecture**: Resolved `context_system` initialization issues and improved separation of concerns

**Technology Stack:** FastAPI, MongoDB (Motor), AsyncIO, Pydantic

---

## Architecture Overview

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FastAPI Application Layer                      │
│                                                                        │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────────┐   │
│  │   Chat API     │  │   Rooms API     │  │   Session API      │   │
│  │  /api/chat/*   │  │  /api/rooms/*   │  │  /api/session/*    │   │
│  └────────┬───────┘  └────────┬────────┘  └─────────┬──────────┘   │
│           │                    │                      │                │
│           └────────────────────┼──────────────────────┘                │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │   Context System    │
                        │    (Singleton)      │
                        └─────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼────────┐         ┌───────▼─────────┐
            │ SessionManager │         │ ContextEngineer  │
            │  (In-Memory)   │         │  (Orchestrator)  │
            └────────────────┘         └────────┬─────────┘
                                                 │
                                        ┌────────▼────────┐
                                        │ ContextManager  │
                                        │   (MongoDB)     │
                                        └─────────────────┘
                                                 │
                                        ┌────────▼────────┐
                                        │   MongoDB       │
                                        │   Collections:  │
                                        │   - chat_rooms  │
                                        │   - conv_history│
                                        │   - active_stms │
                                        └─────────────────┘
```

### Component Responsibilities

#### 1. **Chat API (`/api/chat`)**
- Main chat endpoint with streaming support
- Route messages to appropriate agents via RouterAgent
- Track active streams per session
- Handle stream cancellation requests
- Save conversation history to MongoDB

**Key Methods:**
- `POST /message` - Main chat with streaming
- `POST /stream` - Alternative streaming endpoint
- `GET /history` - Retrieve conversation history

#### 2. **Rooms API (`/api/rooms`)**
- Create new chat rooms for users
- List all rooms with pagination and sorting
- Update room metadata (name, tags)
- Delete rooms and associated conversations
- Retrieve room-specific history

**Key Methods:**
- `POST /` - Create room
- `GET /` - List user rooms
- `GET /{room_id}` - Get room details
- `PATCH /{room_id}` - Update room
- `DELETE /{room_id}` - Delete room
- `GET /{room_id}/history` - Get room history

#### 3. **Session API (`/api/session`)**
- Create sessions with room association
- Reset specific agent or entire session
- Stop active streams gracefully
- Clear conversation history from MongoDB
- Delete sessions

**Key Methods:**
- `POST /create` - Create session
- `GET /{session_id}` - Get session details
- `POST /{session_id}/reset` - Reset session
- `POST /{session_id}/stop` - Stop stream
- `DELETE /{session_id}/history` - Clear history
- `DELETE /{session_id}` - Delete session

#### 4. **Context System (Singleton)**
- Central orchestrator for session and context management
- Provides unified access to SessionManager and ContextEngineer
- Ensures single instance across application

**Components:**
- `SessionManager` - In-memory session tracking
- `ContextEngineer` - Coordinates context operations
- `ContextManager` - MongoDB persistence layer

---

## Service Definitions

### 1. Rooms Service

**Purpose:** Manage chat room lifecycle and metadata

**Core Operations:**
```python
# Create room
room = create_room(user_id, room_name, metadata)

# List rooms with filtering
rooms = list_rooms(user_id, limit=50, offset=0, sort_by="last_activity")

# Update room
updated_room = update_room(room_id, user_id, room_name, metadata)

# Delete room (soft delete)
delete_room(room_id, user_id)

# Get room history with pagination
history = get_room_history(room_id, limit=50, offset=0)
```

**Business Rules:**
- Maximum 50 rooms per user
- Room names limited to 100 characters
- Metadata size limited to 10KB
- Soft delete (mark as deleted, preserve data)
- Room ownership verified on update/delete

---

### 2. Session Service

**Purpose:** Manage session lifecycle and stream control

**Core Operations:**
```python
# Create session with room
session = create_session(user_id, room_id)

# Reset specific agent
reset_session(session_id, agent_type="research_paper")

# Reset all agents
reset_session(session_id, agent_type=None)

# Stop active stream
stop_stream(session_id)

# Clear history from MongoDB
clear_history(session_id, room_id)

# Delete session
delete_session(session_id)
```

**Business Rules:**
- Session timeout: 30 minutes
- Idle timeout: 10 minutes (clears in-memory history)
- One active stream per session
- Session bound to user and room
- Expired sessions auto-cleaned

---

### 3. Chat Service

**Purpose:** Process chat messages and manage streaming

**Core Operations:**
```python
# Process message with streaming
async for chunk in process_message(query, session_id, room_id):
    # Check cancellation
    if should_cancel(session_id):
        yield {"status": "cancelled"}
        break

    yield chunk

# Save to history
save_conversation(user_id, session_id, room_id, query, response)
```

**Business Rules:**
- Stream registered in active_streams_tracker
- Cancellation checked on each chunk
- Partial response preserved on cancellation
- Conversation saved after stream completes
- Context injection for personalization

---

## API Contracts

### Rooms API

#### POST /api/rooms
**Request:**
```json
{
  "user_id": "user_123",
  "room_name": "Kidney Disease Discussion",
  "metadata": {
    "initial_agent": "research_paper",
    "tags": ["kidney", "research"]
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room_id": "room_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "user_123",
    "room_name": "Kidney Disease Discussion",
    "created_at": "2025-01-26T10:30:00Z",
    "last_activity": "2025-01-26T10:30:00Z",
    "message_count": 0,
    "metadata": {
      "initial_agent": "research_paper",
      "tags": ["kidney", "research"]
    }
  },
  "timestamp": "2025-01-26T10:30:00Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Maximum room limit (50) reached. Please delete old rooms.",
  "error_code": "ROOM_LIMIT_EXCEEDED",
  "timestamp": "2025-01-26T10:30:00Z"
}
```

#### GET /api/rooms?user_id={user_id}&limit=50&offset=0&sort_by=last_activity

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": {
    "rooms": [
      {
        "room_id": "room_a1b2c3d4",
        "user_id": "user_123",
        "room_name": "Kidney Disease Discussion",
        "created_at": "2025-01-20T10:00:00Z",
        "last_activity": "2025-01-26T15:45:00Z",
        "message_count": 12,
        "metadata": {},
        "last_message": {
          "user_input": "What are the latest treatments?",
          "agent_response": "Based on recent research...",
          "agent_type": "research_paper",
          "timestamp": "2025-01-26T15:45:00Z"
        }
      }
    ],
    "total": 3,
    "page": 1,
    "page_size": 50
  },
  "timestamp": "2025-01-26T16:00:00Z"
}
```

---

### Session API

#### POST /api/session/create
**Request:**
```json
{
  "user_id": "user_123",
  "room_id": "room_a1b2c3d4"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "session_id": "session_xyz789",
    "user_id": "user_123",
    "room_id": "room_a1b2c3d4",
    "created_at": "2025-01-26T16:30:00Z",
    "expires_at": "2025-01-26T17:00:00Z"
  },
  "timestamp": "2025-01-26T16:30:00Z"
}
```

#### POST /api/session/{session_id}/reset
**Request:**
```json
{
  "agent_type": "research_paper"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session reset successfully",
  "data": {
    "session_id": "session_xyz789",
    "reset_scope": "research_paper",
    "conversations_cleared": 5
  },
  "timestamp": "2025-01-26T16:35:00Z"
}
```

#### POST /api/session/{session_id}/stop
**Success Response (200):**
```json
{
  "success": true,
  "message": "Stream stop requested",
  "data": {
    "session_id": "session_xyz789",
    "room_id": "room_a1b2c3d4",
    "status": "stop_requested",
    "partial_response": "Based on recent research in kidney disease treatment..."
  },
  "timestamp": "2025-01-26T16:40:00Z"
}
```

---

## Data Schema

### MongoDB Collections

#### 1. chat_rooms
```javascript
{
  "_id": ObjectId("..."),
  "room_id": "room_a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // Unique UUID
  "user_id": "user_123",                                    // Owner
  "room_name": "Kidney Disease Discussion",                // Display name
  "created_at": ISODate("2025-01-20T10:00:00Z"),          // Creation timestamp
  "last_activity": ISODate("2025-01-26T15:45:00Z"),       // Last message time
  "message_count": 12,                                     // Cached count
  "metadata": {                                            // Flexible metadata
    "initial_agent": "research_paper",
    "tags": ["kidney", "research"],
    "custom_fields": {}
  },
  "is_deleted": false,                                     // Soft delete flag
  "deleted_at": null                                       // Deletion timestamp
}
```

**Indexes:**
```javascript
// User + last_activity for room listing
db.chat_rooms.createIndex(
  { "user_id": 1, "last_activity": -1 },
  { name: "user_last_activity_idx" }
)

// User + deleted filter
db.chat_rooms.createIndex(
  { "user_id": 1, "is_deleted": 1 },
  { name: "user_deleted_idx" }
)

// Unique room_id
db.chat_rooms.createIndex(
  { "room_id": 1 },
  { name: "room_id_unique_idx", unique: true }
)
```

---

#### 2. conversation_history (Enhanced)
```javascript
{
  "_id": ObjectId("..."),
  "user_id": "user_123",                      // User who sent message
  "session_id": "session_xyz789",             // Session identifier
  "room_id": "room_a1b2c3d4",                 // Room association (NEW)
  "agent_type": "research_paper",             // Agent that processed
  "user_input": "What are the latest treatments?",
  "agent_response": "Based on recent research...",
  "timestamp": ISODate("2025-01-26T15:45:00Z"),
  "metadata": {                                // Optional metadata
    "tokens_used": 450,
    "response_time_ms": 1250,
    "model": "gpt-4"
  }
}
```

**Indexes:**
```javascript
// Existing indexes
db.conversation_history.createIndex(
  { "user_id": 1, "timestamp": -1 },
  { name: "user_timestamp_idx" }
)

db.conversation_history.createIndex(
  { "session_id": 1, "agent_type": 1 },
  { name: "session_agent_idx" }
)

// NEW indexes for room queries
db.conversation_history.createIndex(
  { "room_id": 1, "timestamp": -1 },
  { name: "room_timestamp_idx" }
)

db.conversation_history.createIndex(
  { "user_id": 1, "agent_type": 1, "timestamp": -1 },
  { name: "user_agent_timestamp_idx" }
)
```

---

#### 3. active_streams (NEW)
```javascript
{
  "_id": ObjectId("..."),
  "stream_id": "stream_abc123",               // Unique stream identifier
  "session_id": "session_xyz789",             // Associated session
  "room_id": "room_a1b2c3d4",                 // Room where streaming
  "user_id": "user_123",                      // User receiving stream
  "agent_type": "research_paper",             // Agent streaming response
  "started_at": ISODate("2025-01-26T16:30:00Z"),
  "status": "streaming",                      // streaming | completed | cancelled
  "cancel_requested": false,                  // Cancellation flag
  "last_heartbeat": ISODate("2025-01-26T16:30:15Z")  // For TTL cleanup
}
```

**Indexes:**
```javascript
// Session lookup
db.active_streams.createIndex(
  { "session_id": 1 },
  { name: "session_idx" }
)

// Room lookup
db.active_streams.createIndex(
  { "room_id": 1 },
  { name: "room_idx" }
)

// TTL index for auto-cleanup (5 minutes)
db.active_streams.createIndex(
  { "last_heartbeat": 1 },
  { name: "ttl_heartbeat_idx", expireAfterSeconds: 300 }
)
```

---

## Technology Stack Rationale

### 1. FastAPI
**Chosen:** Already in use, excellent async support

**Justification:**
- Native async/await for streaming and concurrent operations
- Automatic API documentation (OpenAPI/Swagger)
- Built-in request validation with Pydantic
- Excellent SSE (Server-Sent Events) support
- Type safety and IDE autocomplete

**Trade-offs vs Alternatives:**
| Feature | FastAPI | Flask | Django |
|---------|---------|-------|--------|
| Async Support | ✅ Native | ❌ Limited | ⚠️ Via channels |
| Performance | ✅ High | ⚠️ Medium | ⚠️ Medium |
| Learning Curve | ⚠️ Moderate | ✅ Easy | ❌ Steep |
| API Docs | ✅ Auto | ❌ Manual | ⚠️ DRF required |
| Type Safety | ✅ Yes | ❌ No | ⚠️ Partial |

**Decision:** FastAPI is optimal for streaming chat with async operations.

---

### 2. MongoDB with Motor
**Chosen:** Already integrated, flexible schema

**Justification:**
- Flexible schema for evolving room metadata
- Excellent aggregation pipeline for room statistics
- TTL indexes for automatic cleanup
- Motor provides async MongoDB client for Python
- Horizontal scaling via sharding

**Trade-offs vs Alternatives:**
| Feature | MongoDB | PostgreSQL | Redis |
|---------|---------|------------|-------|
| Schema Flexibility | ✅ High | ❌ Rigid | ✅ High |
| Complex Queries | ✅ Aggregation | ✅ SQL | ❌ Limited |
| ACID Compliance | ⚠️ Partial | ✅ Full | ❌ None |
| Horizontal Scaling | ✅ Sharding | ⚠️ Complex | ✅ Cluster |
| TTL Support | ✅ Native | ❌ Manual | ✅ Native |

**Decision:** MongoDB fits document-oriented conversation data with evolving schema needs.

---

### 3. AsyncIO Task Management
**Chosen:** Native Python async for stream tracking

**Justification:**
- In-process tracking with low overhead
- Native cancellation support via task.cancel()
- Seamless integration with FastAPI
- No external dependencies
- Suitable for single-instance deployment

**Trade-offs vs Alternatives:**
| Feature | AsyncIO | Redis PubSub | Celery |
|---------|---------|--------------|--------|
| Latency | ✅ Low | ⚠️ Network | ⚠️ High |
| Multi-Instance | ❌ No | ✅ Yes | ✅ Yes |
| Persistence | ❌ Memory | ✅ Disk | ✅ DB |
| Complexity | ✅ Simple | ⚠️ Moderate | ❌ High |
| Real-time | ✅ Immediate | ⚠️ ~ms | ❌ ~seconds |

**Decision:** Start with AsyncIO for simplicity; migrate to Redis if horizontal scaling needed.

**Migration Path:**
```python
# Phase 1: AsyncIO (Current)
active_streams_tracker = {}  # In-process dict

# Phase 2: Redis (Multi-instance)
import aioredis
redis = await aioredis.create_redis_pool('redis://localhost')
await redis.hset('active_streams', session_id, json.dumps(stream_info))
```

---

### 4. Pydantic Models
**Chosen:** Already in use for validation

**Justification:**
- Type-safe request/response models
- Automatic validation and error messages
- JSON schema generation for OpenAPI
- IDE autocomplete and type checking
- Consistent API contracts

**Example:**
```python
class RoomCreate(BaseModel):
    user_id: str = Field(..., description="User ID")
    room_name: Optional[str] = Field(None, max_length=100)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @field_validator('metadata')
    @classmethod
    def validate_metadata_size(cls, v):
        if len(json.dumps(v)) > 10240:  # 10KB limit
            raise ValueError("Metadata too large")
        return v
```

---

## Key Considerations

### 1. Scalability

#### Current Capacity (Single Instance)
- **Concurrent Users:** ~100
- **Active Streams:** ~50
- **Requests per Second:** ~200
- **Database Connections:** Pool of 10-100

#### 10x Load Strategy

**Phase 1: Vertical Scaling**
- Increase server resources (CPU, RAM)
- Optimize MongoDB connection pool (100-200)
- Add indexes for slow queries
- Enable MongoDB query caching

**Phase 2: Horizontal Scaling**
1. **Session State Migration:**
   ```python
   # Move SessionManager to Redis
   from aioredis import Redis

   class RedisSessionManager:
       async def create_session(self, user_id, room_id):
           session_id = str(uuid.uuid4())
           await redis.setex(
               f"session:{session_id}",
               1800,  # 30 min TTL
               json.dumps({
                   "user_id": user_id,
                   "room_id": room_id,
                   "created_at": datetime.utcnow().isoformat()
               })
           )
           return session_id
   ```

2. **Load Balancing:**
   ```nginx
   upstream backend {
       least_conn;  # Route to least busy instance
       server backend1:8000;
       server backend2:8000;
       server backend3:8000;
   }

   server {
       location / {
           proxy_pass http://backend;
           # Sticky sessions for active streams
           proxy_set_header X-Session-ID $http_x_session_id;
       }
   }
   ```

3. **MongoDB Scaling:**
   ```javascript
   // Replica set for read scaling
   rs.initiate({
       _id: "careguide_rs",
       members: [
           { _id: 0, host: "mongo1:27017", priority: 2 },
           { _id: 1, host: "mongo2:27017", priority: 1 },
           { _id: 2, host: "mongo3:27017", priority: 1 }
       ]
   })

   // Read preference: secondary for history queries
   client = MongoClient(uri, read_preference=ReadPreference.SECONDARY_PREFERRED)
   ```

**Phase 3: Microservices**
```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Chat      │────▶│   Message    │────▶│   Streaming   │
│   Gateway   │     │   Queue      │     │   Workers     │
└─────────────┘     │  (RabbitMQ)  │     └───────────────┘
                    └──────────────┘
                            │
                    ┌───────▼──────┐
                    │   Room       │
                    │   Service    │
                    └──────────────┘
```

---

### 2. Security

#### Threat Model

**1. Unauthorized Room Access**
```python
# Mitigation: Always verify ownership
async def verify_room_ownership(room_id: str, user_id: str):
    room = await db.chat_rooms.find_one({"room_id": room_id})
    if not room:
        raise HTTPException(404, "Room not found")
    if room["user_id"] != user_id:
        raise HTTPException(403, "Access denied")
    return room
```

**2. Session Hijacking**
```python
# Mitigation: JWT tokens with short expiration
from jose import jwt

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=30),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# Optional: Bind to IP address
async def verify_session(session_id: str, request: Request):
    session = get_session(session_id)
    if session["ip_address"] != request.client.host:
        raise HTTPException(403, "Session IP mismatch")
```

**3. NoSQL Injection**
```python
# Mitigation: Pydantic validation + sanitization
class RoomQuery(BaseModel):
    user_id: str = Field(..., regex=r'^[a-zA-Z0-9_-]+$')
    room_name: Optional[str] = Field(None, max_length=100)

# Sanitize MongoDB queries
def sanitize_query(query: dict) -> dict:
    """Remove MongoDB operators from user input"""
    return {
        k: v for k, v in query.items()
        if not k.startswith('$')
    }
```

**4. Rate Limiting**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/rooms")
@limiter.limit("10/hour")  # 10 rooms per hour
async def create_room(request: Request, data: RoomCreate):
    ...

@app.post("/api/chat/message")
@limiter.limit("100/minute")  # 100 messages per minute
async def chat_message(request: Request):
    ...
```

**5. DoS Prevention**
```python
# Max rooms per user
MAX_ROOMS_PER_USER = 50

# Max concurrent streams
MAX_CONCURRENT_STREAMS = 5

# Auto-cleanup inactive rooms
async def cleanup_inactive_rooms():
    """Delete rooms inactive for > 30 days"""
    cutoff = datetime.utcnow() - timedelta(days=30)
    result = await db.chat_rooms.delete_many({
        "last_activity": {"$lt": cutoff},
        "is_deleted": False
    })
    logger.info(f"Cleaned up {result.deleted_count} inactive rooms")
```

---

### 3. Observability

#### Logging Strategy

**Structured Logging with Context:**
```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def log(self, level: str, message: str, **context):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            "service": "careguide-chat",
            **context
        }
        self.logger.log(
            getattr(logging, level.upper()),
            json.dumps(log_entry)
        )

# Usage
logger = StructuredLogger(__name__)
logger.log("info", "Room created",
    user_id=user_id,
    room_id=room_id,
    request_id=request_id
)
```

**Log Levels:**
- **DEBUG**: Stream chunks, internal state changes
- **INFO**: API requests, CRUD operations, session lifecycle
- **WARNING**: Timeouts, retries, rate limit hits
- **ERROR**: Exceptions, database errors, agent failures
- **CRITICAL**: System-wide failures, data corruption

---

#### Metrics (Prometheus)

```python
from prometheus_client import Counter, Histogram, Gauge, Summary

# Counters
room_creations = Counter('room_creations_total', 'Total room creations')
chat_requests = Counter('chat_requests_total', 'Total chat requests',
    ['agent_type', 'status'])
errors = Counter('errors_total', 'Total errors', ['error_type'])

# Gauges
active_streams = Gauge('active_streams', 'Number of active streams')
active_sessions = Gauge('active_sessions', 'Number of active sessions')

# Histograms
response_time = Histogram('response_time_seconds',
    'Response time in seconds',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0])
db_query_time = Histogram('db_query_seconds',
    'Database query time',
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0])

# Summary
stream_duration = Summary('stream_duration_seconds',
    'Stream duration in seconds')

# Usage
with response_time.time():
    result = await process_request()

active_streams.set(len(active_streams_tracker))
chat_requests.labels(agent_type='research_paper', status='success').inc()
```

**Grafana Dashboard:**
```yaml
# Example dashboard panels
panels:
  - title: Active Streams
    type: graph
    query: active_streams

  - title: Request Rate
    type: graph
    query: rate(chat_requests_total[5m])

  - title: Error Rate
    type: graph
    query: rate(errors_total[5m])

  - title: Response Time (95th percentile)
    type: graph
    query: histogram_quantile(0.95, response_time_seconds_bucket)

  - title: Database Query Latency
    type: heatmap
    query: db_query_seconds
```

---

#### Distributed Tracing (OpenTelemetry)

```python
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Initialize tracing
tracer = trace.get_tracer(__name__)

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# Add spans
@app.post("/api/rooms")
async def create_room(data: RoomCreate):
    with tracer.start_as_current_span("create_room") as span:
        span.set_attribute("user_id", data.user_id)
        span.set_attribute("room_name", data.room_name)

        with tracer.start_as_current_span("db.insert_room"):
            room = await db.chat_rooms.insert_one(...)

        span.set_attribute("room_id", room_id)
        return room
```

**Trace Example:**
```
Trace ID: abc123...
  └─ create_room (200ms)
      ├─ validate_request (5ms)
      ├─ check_room_limit (10ms)
      │   └─ db.count_rooms (8ms)
      ├─ db.insert_room (50ms)
      └─ update_cache (2ms)
```

---

#### Health Checks

```python
@app.get("/api/health")
async def health_check():
    """
    Comprehensive health check
    """
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "checks": {}
    }

    # MongoDB check
    try:
        await db.command("ping")
        health["checks"]["mongodb"] = {
            "status": "healthy",
            "latency_ms": 5
        }
    except Exception as e:
        health["status"] = "unhealthy"
        health["checks"]["mongodb"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # Session manager check
    health["checks"]["sessions"] = {
        "status": "healthy",
        "active_count": len(context_system.session_manager.sessions)
    }

    # Active streams check
    active_stream_count = len(active_streams_tracker)
    health["checks"]["streams"] = {
        "status": "healthy" if active_stream_count < 500 else "degraded",
        "active_count": active_stream_count,
        "capacity": 500
    }

    return health

# Liveness probe (K8s)
@app.get("/healthz")
async def liveness():
    return {"status": "alive"}

# Readiness probe (K8s)
@app.get("/readyz")
async def readiness():
    try:
        await db.command("ping")
        return {"status": "ready"}
    except:
        raise HTTPException(503, "Not ready")
```

---

#### Alerting Rules

```yaml
# Prometheus AlertManager rules
groups:
  - name: careguide_chat_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # Slow response time
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, response_time_seconds_bucket) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time > 10s"

      # MongoDB connection issues
      - alert: MongoDBDown
        expr: up{job="mongodb"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MongoDB is down"

      # High stream count
      - alert: HighStreamCount
        expr: active_streams > 500
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Active streams approaching capacity"
          description: "Current: {{ $value }}, Capacity: 500"

      # Connection pool exhausted
      - alert: ConnectionPoolExhausted
        expr: mongodb_connection_pool_available == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MongoDB connection pool exhausted"
```

---

### 4. Deployment & CI/CD

#### Docker Setup

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/healthz || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - MONGODB_DB_NAME=careguide
      - SESSION_TIMEOUT_MINUTES=30
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:  # For future multi-instance support
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mongo_data:
```

---

#### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy Chat API

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-asyncio pytest-cov

      - name: Run tests
        run: |
          cd backend
          pytest tests/ --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run flake8
        run: |
          pip install flake8
          flake8 backend/app --max-line-length=120

      - name: Run mypy
        run: |
          pip install mypy
          mypy backend/app --ignore-missing-imports

  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -t careguide-backend:${{ github.sha }} backend/

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push careguide-backend:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/careguide-backend \
            backend=careguide-backend:${{ github.sha }} \
            -n staging
          kubectl rollout status deployment/careguide-backend -n staging

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/careguide-backend \
            backend=careguide-backend:${{ github.sha }} \
            -n production
          kubectl rollout status deployment/careguide-backend -n production

      - name: Smoke tests
        run: |
          curl -f https://api.careguide.com/healthz || exit 1
          curl -f https://api.careguide.com/api/health || exit 1
```

---

#### Kubernetes Deployment

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: careguide-backend
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: careguide-backend
  template:
    metadata:
      labels:
        app: careguide-backend
    spec:
      containers:
      - name: backend
        image: careguide-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: careguide-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /readyz
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: careguide-backend
  namespace: production
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000
  selector:
    app: careguide-backend
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: careguide-backend-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: careguide-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Summary

This architecture provides:
- ✅ Full CRUD operations for chat rooms
- ✅ Enhanced session lifecycle management
- ✅ Stream cancellation with partial response retrieval
- ✅ Scalable design with clear migration path
- ✅ Comprehensive security measures
- ✅ Production-ready observability
- ✅ CI/CD pipeline with automated deployments

**Next Steps:**
1. Run database migration script
2. Test new endpoints
3. Update frontend to use new API
4. Monitor metrics and adjust capacity
5. Plan Phase 2 scaling (Redis integration)
