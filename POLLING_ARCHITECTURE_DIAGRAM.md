# Parlant Continuous Polling Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Agent Classes (ResearchPaper / MedicalWelfare)  │   │
│  │                                                           │   │
│  │  Class Variables:                                         │   │
│  │  • _parlant_client: AsyncParlantClient                   │   │
│  │  • _active_sessions: Dict[session_id, SessionData]       │   │
│  │                                                           │   │
│  │  SessionData:                                             │   │
│  │    {                                                      │   │
│  │      task: asyncio.Task,      ← Background polling       │   │
│  │      queue: Queue,             ← Event queue             │   │
│  │      last_offset: int,         ← Current offset          │   │
│  │      is_active: bool           ← State flag              │   │
│  │    }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Session Lifecycle                         │   │
│  │                                                           │   │
│  │   1. _start_session_polling()                            │   │
│  │      ├─ Create Queue                                      │   │
│  │      ├─ Initialize SessionData                            │   │
│  │      └─ Spawn _continuous_polling_task()                 │   │
│  │                                                           │   │
│  │   2. _continuous_polling_task()                          │   │
│  │      ├─ Long-poll Parlant API (60s)                      │   │
│  │      ├─ Update last_offset                                │   │
│  │      └─ Queue events                                      │   │
│  │         (runs until is_active = False)                    │   │
│  │                                                           │   │
│  │   3. process() / process_stream()                        │   │
│  │      ├─ Get event queue                                   │   │
│  │      ├─ Send message                                      │   │
│  │      ├─ Consume events from queue                         │   │
│  │      └─ Return when status:ready                          │   │
│  │                                                           │   │
│  │   4. _stop_session_polling()                             │   │
│  │      ├─ Set is_active = False                            │   │
│  │      ├─ Cancel task                                       │   │
│  │      └─ Cleanup resources                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Parlant Server (localhost:8800/8801)            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Event Stream                           │   │
│  │                                                           │   │
│  │   Offset 0: customer message                             │   │
│  │   Offset 1: status:acknowledged                          │   │
│  │   Offset 2: status:processing                            │   │
│  │   Offset 3: agent message (partial)                      │   │
│  │   Offset 4: agent message (partial)                      │   │
│  │   Offset 5: agent message (final)                        │   │
│  │   Offset 6: status:ready         ← Polling continues!    │   │
│  │   Offset 7: customer message     ← Next message          │   │
│  │   Offset 8: status:acknowledged                          │   │
│  │   ...                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow Sequence

```
User Request 1                User Request 2
     │                             │
     ▼                             │
┌────────────────┐                 │
│ process()      │                 │
│                │                 │
│ 1. Check if    │                 │
│    polling     │                 │
│    active      │                 │
│    ↓ NO        │                 │
│ 2. Start       │                 │
│    polling     │                 │
│    task ────────────┐            │
│                │    │            │
│ 3. Send        │    │            │
│    message     │    │            │
│    ↓           │    │            │
│ 4. Wait for    │    │            │
│    events      │    ▼            │
│    from queue  │  ┌──────────────┴───────┐
│    ↓           │  │ Background Task      │
│ 5. Process     │  │ (runs continuously)  │
│    message     │  │                      │
│    events      │  │ while is_active:     │
│    ↓           │  │   events = poll(60s) │
│ 6. Receive     │  │   queue.put(events)  │
│    status:ready│  │                      │
│    ↓           │  └──────────┬───────────┘
│ 7. Return      │             │
│    response    │             │
└────────────────┘             │
                               │
                               ▼
                          (continues)
                               │
                               │
     ┌─────────────────────────┘
     │
     ▼
┌────────────────┐
│ process()      │
│                │
│ 1. Check if    │
│    polling     │
│    active      │
│    ↓ YES       │
│ 2. Reuse       │
│    existing    │
│    queue       │
│    ↓           │
│ 3. Send        │
│    message     │
│    ↓           │
│ 4. Wait for    │
│    events      │
│    from queue  │
│    ↓           │
│ 5. Process     │
│    message     │
│    events      │
│    ↓           │
│ 6. Receive     │
│    status:ready│
│    ↓           │
│ 7. Return      │
│    response    │
└────────────────┘
```

## Event Queue Pattern

```
┌─────────────────────────────────────────────────────────┐
│              Background Polling Task                     │
│                                                          │
│  while is_active:                                        │
│      events = await parlant.list_events(                │
│          min_offset=last_offset + 1,                     │
│          wait_for_data=60                                │
│      )                                                   │
│      ↓                                                   │
│      for event in events:                                │
│          await queue.put(event) ────┐                   │
│      ↓                               │                   │
│      last_offset = events[-1].offset │                   │
│      ↓                               │                   │
│      (loop continues...)             │                   │
└──────────────────────────────────────┼───────────────────┘
                                       │
                                       │  Event Queue
                                       │  (asyncio.Queue)
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────┐
│              Request Handler (process)                   │
│                                                          │
│  while not response_complete:                            │
│      event = await queue.get(timeout=5.0)               │
│      ↓                                                   │
│      if event.kind == 'message':                         │
│          agent_messages.append(event)                    │
│      ↓                                                   │
│      elif event.kind == 'status':                        │
│          if status == 'ready':                           │
│              response_complete = True                    │
│              break  ← Exit loop, NOT stop polling!       │
│      ↓                                                   │
│      (continues until response complete)                 │
└─────────────────────────────────────────────────────────┘
```

## Key Difference: Before vs After

### Before (Broken)
```
Request → Poll → status:ready → EXIT → 🛑 STOPPED
                                        │
                                Next message can't be received
```

### After (Fixed)
```
Request 1 → Listen to Queue → status:ready → Return
    │                              │
    │       Background Polling (continuous)
    │              │               │
    └──────────────┴───────────────┘
                   │
Request 2 → Listen to Queue → status:ready → Return
                   │
            (polling continues)
```

## State Transitions

```
Session State Machine:

[NOT STARTED] ──start_session_polling()──▶ [POLLING ACTIVE]
                                                  │
                                                  │ Events queued
                                                  │ continuously
                                                  │
                                                  ├──▶ process() reads queue
                                                  │    └─▶ Returns (polling continues)
                                                  │
                                                  ├──▶ process() reads queue
                                                  │    └─▶ Returns (polling continues)
                                                  │
                                                  │ (Can handle N requests)
                                                  │
[STOPPED] ◀──stop_session_polling()──┘
```

## Resource Lifecycle

```
Application Startup
    │
    └─▶ Agent Class Initialized
            │
            ├─▶ _active_sessions = {}
            └─▶ _parlant_client = None
                    │
                    │
First Request      │
    │              │
    └─▶ _start_session_polling(session_id)
            │
            ├─▶ Create Queue
            ├─▶ Create SessionData
            ├─▶ Spawn Background Task
            └─▶ Store in _active_sessions[session_id]
                    │
                    ├─▶ Handles Request 1
                    ├─▶ Handles Request 2
                    ├─▶ Handles Request 3
                    └─▶ ...
                    │
Session End         │
    │              │
    └─▶ _stop_session_polling(session_id)
            │
            ├─▶ Set is_active = False
            ├─▶ Cancel background task
            ├─▶ Remove from _active_sessions
            └─▶ (Resources freed)
```

## Error Handling Flow

```
Background Polling Task
    │
    ├─▶ try: poll events
    │       │
    │       ├─▶ Success → Queue events
    │       │
    │       └─▶ 504 Timeout → Continue (normal)
    │
    ├─▶ except: Other errors
    │       │
    │       └─▶ Queue error dict: {"error": str(e)}
    │           │
    │           └─▶ Backoff 5 seconds
    │               │
    │               └─▶ Continue polling
    │
    └─▶ finally: Task cancelled
            │
            └─▶ Cleanup
```

## Performance Characteristics

| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| Polling restarts per session | N (one per request) | 1 | -95% overhead |
| Connection reuse | No | Yes | Lower latency |
| Multi-turn support | No | Yes | ✅ Enabled |
| Missed messages | Yes | No | ✅ Fixed |
| Resource efficiency | Low | High | ✅ Improved |

## Concurrency Model

```
┌────────────┐   ┌────────────┐   ┌────────────┐
│ Session A  │   │ Session B  │   │ Session C  │
└──────┬─────┘   └──────┬─────┘   └──────┬─────┘
       │                │                │
       ├─▶ Task A       ├─▶ Task B       ├─▶ Task C
       │   (polls)      │   (polls)      │   (polls)
       │                │                │
       ├─▶ Queue A      ├─▶ Queue B      ├─▶ Queue C
       │                │                │
       └─▶ Request      └─▶ Request      └─▶ Request
           handlers         handlers         handlers

Independent, non-blocking, concurrent execution
```

## Summary

This architecture provides:
- ✅ Continuous event reception
- ✅ Multi-turn conversation support
- ✅ Efficient resource utilization
- ✅ Graceful error handling
- ✅ Backward compatibility
- ✅ Official Parlant pattern compliance
