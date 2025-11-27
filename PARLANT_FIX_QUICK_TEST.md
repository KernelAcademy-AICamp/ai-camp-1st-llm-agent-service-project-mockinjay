# Parlant Integration Fix - Quick Test Guide

## The Fix in 3 Bullets

1. **Changed event filter from `source in ('agent', 'ai_agent')` to `source == 'ai_agent'`**
   - 'agent' is NOT a valid Parlant source type!
   - This was preventing ANY agent responses from being recognized

2. **Increased long-polling timeout from 3s to 30s**
   - Matches Parlant's recommended long-polling pattern
   - Gives LLM enough time to generate responses

3. **Added detailed event logging**
   - Now logs ALL events received (offset, kind, source)
   - Helps diagnose event flow issues

## Quick Test (5 minutes)

### Step 1: Restart Services (2 min)

```bash
# Terminal 1: Parlant Server
cd backend/Agent/research_paper/server
python healthcare_v2_en.py

# Terminal 2: FastAPI Backend (in new terminal)
cd backend
uvicorn app.main:app --reload --port 8000
```

Wait for:
- Parlant: "Server is running" message
- FastAPI: "Application startup complete"

### Step 2: Test Research Query (3 min)

Use the frontend chat interface or curl:

```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "신장 관련 최신 연구 논문 알려줘",
    "session_id": "test_fix_123"
  }'
```

### Step 3: Watch Logs

**SUCCESS looks like**:
```
Backend Log:
INFO:Agent.research_paper.agent:📝 Customer event created with offset: 0
INFO:Agent.research_paper.agent:📩 Event: offset=1, kind=message, source=ai_agent  ← GOOD!
INFO:Agent.research_paper.agent:📝 Received preamble message
INFO:Agent.research_paper.agent:📩 Event: offset=2, kind=message, source=ai_agent  ← GOOD!
INFO:Agent.research_paper.agent:📨 Received actual response message
INFO:Agent.research_paper.agent:✅ Response complete with disclaimer after 45.2s

Parlant Server Log:
✅ Search complete: 20 total results
⚡ Response time: 5.704s
INFO:httpx:HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 200 OK"
```

**FAILURE looks like**:
```
Backend Log:
INFO:Agent.research_paper.agent:📝 Customer event created with offset: 0
INFO:Agent.research_paper.agent:📩 Event: offset=1, kind=message, source=agent  ← BAD! (wrong source)
INFO:httpx:HTTP Request: GET http://localhost:8800/sessions/xxx/events?min_offset=1&kinds=message&wait_for_data=3 "HTTP/1.1 504 Gateway Timeout"
(repeating 504 errors)
```

## What Changed in the Code

### Before (BROKEN):
```python
poll_interval = 3  # Too short!
events = await self.client.sessions.list_events(
    session_id=parlant_session_id,
    min_offset=last_event_offset + 1,
    kinds="message",
    wait_for_data=3  # Too short!
)
new_agent_messages = [
    event for event in events
    if event.kind == 'message' and event.source in ('agent', 'ai_agent')  # WRONG!
    #                                                  ^^^^^^^ NOT VALID!
]
```

### After (FIXED):
```python
poll_interval = 30  # Long polling (Parlant recommended)
events = await self.client.sessions.list_events(
    session_id=parlant_session_id,
    min_offset=last_event_offset + 1,
    kinds="message",
    wait_for_data=30  # Matches poll_interval
)
# Log ALL events for debugging
if events:
    for evt in events:
        logger.info(f"📩 Event: offset={evt.offset}, kind={evt.kind}, source={evt.source}")

new_agent_messages = [
    event for event in events
    if event.kind == 'message' and event.source == 'ai_agent'  # CORRECT!
]
```

## Common Issues

### Still Getting 504 Errors?

Check if events are arriving at all:
```bash
# In backend logs, look for:
📩 Event: offset=X, kind=message, source=Y

# If you see NO events → Parlant server not responding
# If you see events with source='agent' → OLD CODE still running (restart!)
# If you see events with source='ai_agent' → GOOD! Check if messages are empty
```

### No Agent Response After Tool Execution?

Check Parlant server logs for:
```
✅ Search complete: 20 total results
⚡ Response time: X.XXXs
📊 Tool result size: XX.X KB

# If tool result > 100KB → may need optimization
# If no OpenAI API calls after tool → check Parlant agent configuration
# If OpenAI API calls but no response → check OpenAI API errors
```

## Expected Timeline

| Time | Event |
|------|-------|
| t=0s | User sends query |
| t=1s | RouterAgent → RESEARCH intent |
| t=2s | Customer event created (offset 0) |
| t=3s | Preamble message (offset 1, source='ai_agent') |
| t=5-10s | Tool execution (search_medical_qa) |
| t=30-60s | LLM processes results |
| t=61s | Agent response (offset 2+, source='ai_agent') |
| t=62s | Response delivered to client |

**Total time**: 30-90 seconds (acceptable for research queries)

## Key Takeaways

1. **Valid Parlant event sources**: Only use `'ai_agent'` for AI responses
2. **Long polling**: Use 30-60s `wait_for_data` (not 3s!)
3. **Be patient**: LLM processing can take 30-60s for complex responses
4. **Debug with logs**: Always log ALL events to diagnose issues

## Files Modified

- `backend/Agent/research_paper/agent.py` (lines 259-291, 443-479)

## Reference Documents

- Full analysis: `PARLANT_INTEGRATION_ISSUE_ANALYSIS.md`
- Complete fix summary: `PARLANT_INTEGRATION_FIX_SUMMARY.md`

---

**Created**: 2025-11-27
**Test Status**: Ready to test
