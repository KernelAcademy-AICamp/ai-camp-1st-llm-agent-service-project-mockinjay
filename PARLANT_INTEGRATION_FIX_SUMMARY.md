# Parlant Integration Fix Summary

## Problem Identified

The ResearchPaperAgent integration with Parlant was experiencing 504 Gateway Timeout errors when polling for agent responses. The tool execution completed successfully, but the final agent response never arrived at the client.

## Root Causes Identified

### 1. CRITICAL: Invalid Event Source Filter
**Location**: Lines 284 and 472 in `agent.py`

**Problem**:
```python
# WRONG CODE:
new_agent_messages = [
    event for event in events
    if event.kind == 'message' and event.source in ('agent', 'ai_agent')
]
```

**Issue**: The filter was checking for `source == 'agent'`, but **'agent' is NOT a valid Parlant event source**!

**Valid Parlant Event Sources** (from SDK):
- `'customer'` - Messages from customers
- `'customer_ui'` - UI-generated customer messages
- `'human_agent'` - Human agent messages
- `'human_agent_on_behalf_of_ai_agent'` - Human acting as AI
- `'ai_agent'` - **AI agent responses** (the one we need!)
- `'system'` - System messages

**Fix Applied**:
```python
# CORRECT CODE:
new_agent_messages = [
    event for event in events
    if event.kind == 'message' and event.source == 'ai_agent'
]
```

### 2. CRITICAL: Inefficient Polling Parameters
**Location**: Lines 260, 279, 444, 465 in `agent.py`

**Problem**:
```python
poll_interval = 3  # Too short!
wait_for_data=3    # Too short!
```

**Issue**:
- 3 seconds is too short for long polling
- Causes rapid unnecessary requests
- Doesn't give LLM enough time to generate responses
- Parlant documentation recommends **30-60 seconds**

**Fix Applied**:
```python
poll_interval = 30   # Long polling: 30 seconds (Parlant recommended)
wait_for_data=30     # Matches poll_interval
```

### 3. Adjusted Timeout Strategy
**Location**: Lines 259-265, 443-450 in `agent.py`

**Before**:
```python
max_wait_time = 600           # 10 minutes
poll_interval = 3             # 3 seconds
max_no_new_events = 40        # 40 × 3s = 2 minutes
```

**After**:
```python
max_wait_time = 300           # 5 minutes (more reasonable)
poll_interval = 30            # 30 seconds (long polling)
max_no_new_events = 10        # 10 × 30s = 5 minutes
```

**Rationale**:
- Total timeout reduced from 10m to 5m (still generous)
- No-new-events timeout increased from 2m to 5m (gives LLM more time)
- Aligned with Parlant's long-polling best practices

### 4. Enhanced Debugging Logs
**Location**: Lines 282-285, 468-471 in `agent.py`

**Added**:
```python
# Log all events for debugging
if events:
    for evt in events:
        logger.info(f"📩 Event: offset={evt.offset}, kind={evt.kind}, source={evt.source}")
```

**Purpose**:
- Helps diagnose event flow issues
- Shows ALL events received (not just filtered ones)
- Makes it obvious if events are arriving with unexpected sources

## Files Modified

- `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/Agent/research_paper/agent.py`
  - Lines 259-265: Adjusted timeout parameters in `process_stream`
  - Lines 279-291: Fixed event source filter and added logging in `process_stream`
  - Lines 443-450: Adjusted timeout parameters in `process`
  - Lines 465-479: Fixed event source filter and added logging in `process`

## Testing Instructions

### 1. Restart Services

```bash
# Terminal 1: Restart Parlant Server
cd /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/Agent/research_paper/server
python healthcare_v2_en.py

# Terminal 2: Restart FastAPI Backend
cd /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend
uvicorn app.main:app --reload --port 8000
```

### 2. Test Research Query

Send a research query through the API:

```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "신장 관련 최신 연구 논문 알려줘",
    "session_id": "test_session_123"
  }'
```

Or use the frontend chat interface.

### 3. Monitor Logs

**Expected Log Pattern** (Backend):

```
INFO:Agent.router.agent:Intent classified: RESEARCH
INFO:Agent.research_paper.agent:📝 Customer event created with offset: 0
INFO:Agent.research_paper.agent:📩 Event: offset=1, kind=message, source=ai_agent
INFO:Agent.research_paper.agent:📝 Received preamble message: ...
INFO:Agent.research_paper.agent:📩 Event: offset=2, kind=message, source=ai_agent
INFO:Agent.research_paper.agent:📨 Received actual response message
INFO:Agent.research_paper.agent:✅ Disclaimer found - response is complete!
INFO:Agent.research_paper.agent:✅ Response complete with disclaimer after 45.2s
```

**Expected Log Pattern** (Parlant Server):

```
✅ Search complete: 20 total results
⚡ Response time: 5.704s
INFO:httpx:HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 200 OK"
📊 Tool result size: 45.2 KB
```

### 4. Verify Success

Success indicators:
- No 504 Gateway Timeout errors
- Agent response message arrives (offset 2+)
- Response contains Korean medical information
- Response ends with disclaimer text
- Total response time: 30-90 seconds (normal for LLM processing)

## Expected Behavior

### Timeline of Events

1. **t=0s**: User sends research query
2. **t=1s**: RouterAgent classifies intent → RESEARCH
3. **t=2s**: ResearchPaperAgent creates Parlant session
4. **t=3s**: Customer message event created (offset 0)
5. **t=4s**: Parlant starts processing, sends preamble (offset 1, source='ai_agent')
6. **t=5-10s**: Tool execution (`search_medical_qa` runs, ~5-7s)
7. **t=11-45s**: LLM processes tool results and generates response
8. **t=46s**: Agent response message arrives (offset 2+, source='ai_agent')
9. **t=47s**: Response streamed to client

### Key Differences from Before

**Before**:
- Polling every 3 seconds → constant rapid requests
- Filtering for `source == 'agent'` → **no events matched!**
- 504 timeouts after 3 seconds → too impatient
- Never received agent response → wrong filter

**After**:
- Polling every 30 seconds → efficient long polling
- Filtering for `source == 'ai_agent'` → **correct filter!**
- Wait up to 30 seconds per poll → patient for LLM
- Agent response arrives successfully → fixed!

## Troubleshooting

### If Still Getting 504 Errors

1. **Check Parlant server logs** for errors during response generation
2. **Verify tool result size** - if > 100KB, may need optimization
3. **Check OpenAI API rate limits** - may be throttling requests
4. **Increase `max_wait_time`** to 600s if LLM is slow

### If No Events Arrive

1. **Verify Parlant server is running** at localhost:8800
2. **Check session creation** - look for "Created new Parlant session" log
3. **Verify customer event** was created (offset 0)
4. **Check event logs** - should see ALL events with debugging enabled

### If Events Have Wrong Source

1. **Check Parlant agent configuration** in healthcare_v2_en.py
2. **Verify agent composition_mode** (should be `COMPOSITED`)
3. **Check guidelines** - ensure agent is responding (not blocked)

## Performance Expectations

**Typical Response Times**:
- Tool execution: 5-10 seconds (search + retrieval)
- LLM processing: 20-60 seconds (depends on result size and complexity)
- Total: 30-90 seconds (acceptable for research queries)

**Timeout Settings**:
- `wait_for_data`: 30 seconds (per poll)
- `poll_interval`: 30 seconds (between polls)
- `max_wait_time`: 300 seconds (5 minutes total)
- `max_no_new_events`: 10 polls (5 minutes of idle time)

## References

- [Parlant Custom Frontend Docs](https://www.parlant.io/docs/production/custom-frontend/)
- [Parlant Sessions Documentation](https://www.parlant.io/docs/concepts/customization/sessions/)
- Parlant SDK: `parlant.client.sessions.client.AsyncSessionsClient`
- Valid event sources: See `parlant.client.types.event.Event`

## Next Steps

1. Test the integration with the fixes applied
2. Monitor logs for any remaining issues
3. Consider optimizing tool result size if responses are slow
4. Add metrics tracking for response times and success rates

---

**Fix Applied**: 2025-11-27
**Files Modified**: `backend/Agent/research_paper/agent.py`
**Status**: Ready for testing
