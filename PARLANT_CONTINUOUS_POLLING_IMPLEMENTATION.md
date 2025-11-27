# Parlant Session-Based Continuous Polling Implementation

## Executive Summary

Implemented session-based continuous polling architecture for Parlant agents to resolve the issue where polling loops terminated prematurely after receiving `status:ready` events, preventing subsequent messages from being received.

## Problem Description

**Before**: The polling logic would terminate after receiving `status:ready`, causing the agent to miss any follow-up messages in the same session.

**Root Cause**: Single-request polling pattern that exited the loop upon completion signals.

## Solution Overview

Implemented a **session-based continuous polling architecture** where:
1. Background polling tasks run continuously for the lifetime of a session
2. Events are queued asynchronously for processing
3. `status:ready` signals response completion but polling continues
4. Sessions are explicitly managed and terminated only when needed

## Architecture Changes

### 1. Session Management Structure

Added class-level session tracking:
```python
_active_sessions: Dict[str, Dict[str, Any]] = {}
# parlant_session_id -> {
#     task: asyncio.Task,        # Background polling task
#     queue: Queue,              # Event queue
#     last_offset: int,          # Current offset
#     is_active: bool            # Session state
# }
```

### 2. Core Components

#### Background Polling Task
- **Method**: `_continuous_polling_task(parlant_session_id, event_queue)`
- **Behavior**: Runs continuously until session is explicitly stopped
- **Pattern**: Official Parlant long-polling (60-second wait_for_data)
- **Error Handling**: Graceful handling of 504 timeouts (normal for long-polling)

#### Session Lifecycle Management
- **Start**: `_start_session_polling(parlant_session_id, initial_offset) -> Queue`
  - Creates event queue
  - Spawns background polling task
  - Returns queue for event consumption

- **Stop**: `_stop_session_polling(parlant_session_id)`
  - Marks session inactive
  - Cancels polling task
  - Cleans up resources

#### Event Processing Pattern
- Background task puts events into queue
- Request handlers consume events from queue
- Decouples polling from request processing
- Enables continuous event reception

### 3. Request Processing Flow

#### Before (Single-Request Pattern)
```
User Message → Poll Until status:ready → Return → STOP
                                                     ↓
                                           Next message missed!
```

#### After (Continuous Polling Pattern)
```
Session Start → Background Polling (runs continuously)
                         ↓
User Message → Listen to Queue → status:ready → Return
                         ↓                         ↓
                    Polling continues!    Ready for next message
```

## Modified Files

### 1. `/backend/Agent/research_paper/agent.py`

**Key Changes**:
- Added `from asyncio import Queue, Task` import
- Added `_active_sessions` class variable
- Implemented `_continuous_polling_task()` method
- Implemented `_start_session_polling()` method
- Implemented `_stop_session_polling()` method
- Refactored `process()` to use event queue pattern
- Refactored `process_stream()` to use event queue pattern

**Lines Modified**: ~250 lines changed/added

### 2. `/backend/Agent/medical_welfare/agent.py`

**Key Changes**:
- Added `from asyncio import Queue, Task` import
- Added `_active_sessions` class variable
- Implemented `_continuous_polling_task()` method
- Implemented `_start_session_polling()` method
- Implemented `_stop_session_polling()` method
- Refactored `process()` to use event queue pattern
- Refactored `process_stream()` to use event queue pattern

**Lines Modified**: ~250 lines changed/added

## Technical Implementation Details

### Event Queue Pattern

```python
# Start continuous polling if not already started
if parlant_session_id not in self._active_sessions:
    event_queue = await self._start_session_polling(parlant_session_id, -1)
else:
    event_queue = self._active_sessions[parlant_session_id]['queue']

# Send message
customer_event = await self.client.sessions.create_event(...)

# Consume events from queue
while True:
    event = await asyncio.wait_for(event_queue.get(), timeout=5.0)

    # Process message events
    if event.kind == 'message':
        agent_messages.append(event)

    # Process status events
    elif event.kind == 'status':
        if status == 'ready' and agent_messages:
            response_complete = True
            break  # Exit response collection, NOT polling
```

### Polling Task Pattern (Official Parlant)

```python
while session_data['is_active']:
    try:
        # Long-polling (60 seconds)
        events = await cls._parlant_client.sessions.list_events(
            session_id=parlant_session_id,
            min_offset=last_offset + 1,
            wait_for_data=60
        )

        if events:
            last_offset = max(e.offset for e in events)
            session_data['last_offset'] = last_offset

            # Queue all events
            for event in events:
                await event_queue.put(event)

    except Exception as e:
        if "504" in str(e):  # Normal timeout
            continue
        else:
            await event_queue.put({"error": str(e)})
```

## Key Features

### 1. Continuous Event Reception
- Background task never stops on `status:ready`
- Can receive multiple message sequences in same session
- Supports multi-turn conversations

### 2. Asynchronous Event Processing
- Polling and processing are decoupled
- Non-blocking event consumption
- Multiple requests can share same polling task

### 3. Resource Management
- Sessions tracked in `_active_sessions` dictionary
- Explicit cleanup via `_stop_session_polling()`
- Graceful cancellation of background tasks

### 4. Error Handling
- 504 timeouts handled as normal (long-polling behavior)
- Errors queued for processing
- Fallback idle timeout (30s) as safety net

### 5. Backward Compatibility
- Same API interface (`process`, `process_stream`)
- Transparent to callers
- Session caching maintained

## Testing Considerations

### Test Scenarios

1. **Single Message**
   - Send message → Receive response → Verify polling continues

2. **Multiple Messages in Sequence**
   - Send message 1 → Receive response → Send message 2 → Receive response
   - Verify both responses received without restarting polling

3. **Session Lifecycle**
   - Start session → Verify polling task created
   - Process requests → Verify events processed
   - Stop session → Verify task cancelled and resources cleaned

4. **Error Handling**
   - Simulate polling errors → Verify error queued
   - Verify graceful recovery

5. **Timeout Behavior**
   - No events for extended period → Verify idle timeout
   - 504 timeouts → Verify handled as normal

### Manual Testing Commands

```bash
# Start the backend server
cd backend
python app/main.py

# Test research paper agent
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about CKD stage 3", "intent": "research_paper"}'

# Send follow-up message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the symptoms?", "intent": "research_paper"}'

# Verify both responses received
```

## Benefits

### 1. Reliability
- No missed messages
- Handles multi-turn conversations
- Resilient to timing issues

### 2. Performance
- Reuses polling tasks across requests
- Reduces polling overhead
- Efficient resource utilization

### 3. Scalability
- Supports concurrent sessions
- Independent polling per session
- Non-blocking architecture

### 4. Maintainability
- Clear separation of concerns
- Follows official Parlant patterns
- Well-documented code

## Official Parlant Pattern Compliance

This implementation follows the official Parlant documentation pattern:

```python
# From Parlant docs: Continuous polling pattern
while session_is_active:
    new_events = await client.sessions.list_events(
        session_id=SESSION_ID,
        min_offset=last_offset + 1,
        wait_for_data=60,  # 60-second long-polling
    )
    if new_events:
        last_offset = new_events[-1].offset
        for event in new_events:
            process_event(event)
```

## Future Enhancements

### Potential Improvements

1. **Session Cleanup Policy**
   - Implement automatic session cleanup after inactivity
   - Add session TTL configuration
   - Periodic cleanup task

2. **Event Queue Monitoring**
   - Track queue depth
   - Alert on queue overflow
   - Metrics and logging

3. **Connection Pooling**
   - Reuse HTTP connections across polling requests
   - Optimize network resource usage

4. **Graceful Shutdown**
   - Stop all polling tasks on application shutdown
   - Ensure no orphaned background tasks

## Migration Notes

### Breaking Changes
**None** - API interface remains unchanged

### Deployment Considerations
- No database migrations required
- No configuration changes needed
- Backward compatible with existing sessions

### Rollback Strategy
If issues arise, revert to previous commit:
```bash
git checkout <previous_commit_hash> -- backend/Agent/research_paper/agent.py
git checkout <previous_commit_hash> -- backend/Agent/medical_welfare/agent.py
```

## Summary

Successfully refactored both ResearchPaperAgent and MedicalWelfareAgent to use session-based continuous polling architecture. This resolves the premature polling termination issue while maintaining API compatibility and improving overall reliability for multi-turn conversations.

**Key Achievement**: Agents can now receive multiple messages in a session without restarting polling, enabling true conversational interaction with Parlant.

**Implementation Status**: Complete and ready for testing
**Estimated Impact**: High - Enables multi-turn conversations
**Risk Level**: Low - Backward compatible, follows official patterns
