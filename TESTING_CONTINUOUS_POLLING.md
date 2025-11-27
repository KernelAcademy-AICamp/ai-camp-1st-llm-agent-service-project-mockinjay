# Testing Guide: Parlant Continuous Polling Implementation

## Overview

This guide provides comprehensive testing procedures for the session-based continuous polling implementation.

## Prerequisites

1. Backend server running (`python backend/app/main.py`)
2. Parlant servers running (ports 8800, 8801)
3. MongoDB connection active
4. Test user account available

## Test Scenarios

### 1. Single Message Test

**Objective**: Verify basic polling functionality

**Steps**:
```bash
# Terminal 1: Start backend with logging
cd backend
export LOG_LEVEL=DEBUG
python app/main.py

# Terminal 2: Send test request
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What is CKD stage 3?",
    "intent": "research_paper",
    "session_id": "test-session-1"
  }'
```

**Expected Results**:
- ✅ Log shows: "Starting continuous polling for session..."
- ✅ Response received with agent answer
- ✅ Log shows: "Agent status: ready - response complete"
- ✅ Background polling task continues running

**Verification**:
```bash
# Check logs for:
grep "continuous polling" backend.log
# Should show ONE "Starting continuous polling" message
```

---

### 2. Multi-Turn Conversation Test

**Objective**: Verify continuous polling receives multiple messages

**Steps**:
```bash
# Message 1
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What is CKD stage 3?",
    "intent": "research_paper",
    "session_id": "test-session-2"
  }'

# Wait for response, then immediately send Message 2
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What are the symptoms?",
    "intent": "research_paper",
    "session_id": "test-session-2"
  }'

# Message 3
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What diet should I follow?",
    "intent": "research_paper",
    "session_id": "test-session-2"
  }'
```

**Expected Results**:
- ✅ All three messages receive responses
- ✅ Log shows only ONE "Starting continuous polling" (reuses polling task)
- ✅ No "Polling error" or "No response received" errors
- ✅ Each message shows "Listening for events from continuous polling"

**Verification**:
```bash
# Count polling task starts
grep -c "Starting continuous polling for session test-session-2" backend.log
# Should be 1

# Count responses
grep -c "Response complete" backend.log
# Should be 3 (or more if testing multiple times)
```

---

### 3. Stream Mode Test

**Objective**: Verify streaming with continuous polling

**Steps**:
```bash
# Stream Message 1
curl -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Explain kidney disease",
    "intent": "research_paper",
    "session_id": "test-stream-1"
  }' --no-buffer

# After streaming completes, send Stream Message 2
curl -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What are treatment options?",
    "intent": "research_paper",
    "session_id": "test-stream-1"
  }' --no-buffer
```

**Expected Results**:
- ✅ Both requests stream responses
- ✅ Each message shows streaming chunks
- ✅ First message: status="streaming"
- ✅ Subsequent messages: status="new_message"
- ✅ Polling continues between requests

---

### 4. Concurrent Sessions Test

**Objective**: Verify independent polling for different sessions

**Steps**:
```bash
# Terminal 1: Session A
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Tell me about CKD",
    "intent": "research_paper",
    "session_id": "concurrent-a"
  }'

# Terminal 2: Session B (run simultaneously)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Find welfare programs",
    "intent": "medical_welfare",
    "session_id": "concurrent-b"
  }'
```

**Expected Results**:
- ✅ Both sessions receive responses
- ✅ Each session has independent polling task
- ✅ No interference between sessions
- ✅ Log shows 2 different "Starting continuous polling" entries

**Verification**:
```bash
# Check for both sessions
grep "Starting continuous polling for session concurrent" backend.log
# Should show both concurrent-a and concurrent-b
```

---

### 5. Error Recovery Test

**Objective**: Verify error handling and recovery

**Steps**:
```bash
# 1. Stop Parlant server temporarily
# (Simulate network error)

# 2. Send request
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Test message",
    "intent": "research_paper",
    "session_id": "error-test"
  }'

# 3. Restart Parlant server

# 4. Send another request with same session
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Another test",
    "intent": "research_paper",
    "session_id": "error-test"
  }'
```

**Expected Results**:
- ✅ First request fails gracefully with error message
- ✅ Error is queued and logged
- ✅ Polling task backs off (5 second delay)
- ✅ Second request succeeds after server restart
- ✅ No orphaned polling tasks

---

### 6. Long Idle Test

**Objective**: Verify idle timeout behavior

**Steps**:
```bash
# Send message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Test idle",
    "intent": "research_paper",
    "session_id": "idle-test"
  }'

# Wait 35+ seconds (idle_timeout = 30s)

# Check if response completed via fallback timeout
```

**Expected Results**:
- ✅ Response completes after idle timeout (30s + margin)
- ✅ Log shows: "Response complete (fallback: idle timeout)"
- ✅ Polling task continues running (doesn't stop)

---

### 7. Agent Switch Test

**Objective**: Verify different agents work independently

**Steps**:
```bash
# Research Paper Agent
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "CKD information",
    "intent": "research_paper",
    "session_id": "agent-test-rp"
  }'

# Medical Welfare Agent
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Find hospitals",
    "intent": "medical_welfare",
    "session_id": "agent-test-mw"
  }'
```

**Expected Results**:
- ✅ Both agents receive responses
- ✅ Each agent has separate `_active_sessions`
- ✅ Port 8800 used for research_paper
- ✅ Port 8801 used for medical_welfare

---

## Automated Testing Script

Create a test script for convenience:

```bash
#!/bin/bash
# test_continuous_polling.sh

BASE_URL="http://localhost:8000"
TOKEN="YOUR_AUTH_TOKEN"
SESSION_ID="auto-test-$(date +%s)"

echo "Testing Continuous Polling Implementation"
echo "Session ID: $SESSION_ID"
echo "=========================================="

# Test 1: First message
echo "Sending message 1..."
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"message\": \"What is CKD stage 3?\",
    \"intent\": \"research_paper\",
    \"session_id\": \"$SESSION_ID\"
  }" | jq -r '.answer' | head -c 100
echo ""

# Wait a bit
sleep 2

# Test 2: Second message (should reuse polling)
echo "Sending message 2..."
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"message\": \"What are the symptoms?\",
    \"intent\": \"research_paper\",
    \"session_id\": \"$SESSION_ID\"
  }" | jq -r '.answer' | head -c 100
echo ""

# Wait a bit
sleep 2

# Test 3: Third message
echo "Sending message 3..."
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"message\": \"How is it treated?\",
    \"intent\": \"research_paper\",
    \"session_id\": \"$SESSION_ID\"
  }" | jq -r '.answer' | head -c 100
echo ""

echo "=========================================="
echo "Test completed. Check backend logs for polling behavior."
echo "Expected: Only ONE 'Starting continuous polling' message"
```

**Usage**:
```bash
chmod +x test_continuous_polling.sh
./test_continuous_polling.sh
```

---

## Log Analysis

### Key Log Messages to Monitor

#### Success Indicators:
```
✅ "Starting continuous polling for session {session_id}"
   → Should appear ONCE per session

✅ "Event queued: {event_kind} (offset: {offset})"
   → Shows events being queued by background task

✅ "Received message (total: {count})"
   → Shows messages being processed

✅ "Agent status: ready - response complete"
   → Shows completion without stopping polling

✅ "Listening for events from continuous polling"
   → Request is consuming from existing queue
```

#### Warning Signs:
```
⚠️ "Starting continuous polling" appears multiple times for same session
   → Polling task being recreated (should not happen)

⚠️ "Polling error: {error}"
   → Network or Parlant server issues

⚠️ "No response received from Parlant"
   → Timeout or no events received
```

#### Error Indicators:
```
❌ "Session data not found for {session_id}"
   → Session management issue

❌ "Polling error: {error}" (repeated)
   → Persistent connectivity issues

❌ "Fatal polling error: {error}"
   → Unrecoverable error in polling task
```

---

## Performance Metrics

### Expected Behavior:

| Metric | Expected Value |
|--------|---------------|
| Polling task restarts per session | 1 |
| Response latency (first message) | ~1-3 seconds |
| Response latency (subsequent) | ~0.5-2 seconds |
| Memory usage per session | ~1-2 MB |
| CPU usage (idle polling) | <1% |

### Monitoring Commands:

```bash
# Count active polling tasks
grep -c "Starting continuous polling" backend.log

# Count completed responses
grep -c "Response complete" backend.log

# Average response time (requires timestamp parsing)
grep "Response complete" backend.log | awk '{print $3}'

# Check for errors
grep -i "error\|exception" backend.log | grep -v "504"
```

---

## Troubleshooting

### Issue: Multiple polling tasks for same session

**Symptoms**: Log shows multiple "Starting continuous polling" for same session_id

**Cause**: Session not properly cached in `_active_sessions`

**Fix**:
```python
# Check in code:
if parlant_session_id in cls._active_sessions:
    return cls._active_sessions[parlant_session_id]['queue']
# Should return existing queue, not create new one
```

---

### Issue: Responses not received after first message

**Symptoms**: First message works, subsequent messages timeout

**Cause**: Polling task stopped prematurely

**Debug**:
```bash
# Check if polling task is still running
grep "Polling task ended" backend.log
# Should NOT appear unless session explicitly stopped
```

---

### Issue: 504 Gateway Timeout errors in logs

**Symptoms**: Frequent "Gateway Timeout" messages

**Cause**: Normal long-polling behavior (not an error)

**Action**: No action needed if responses still work

---

### Issue: Queue overflow

**Symptoms**: Memory usage increasing, slow responses

**Cause**: Events being queued faster than consumed

**Debug**:
```python
# Add logging in code:
logger.info(f"Queue size: {event_queue.qsize()}")
```

**Fix**: Adjust queue consumption timeout or add queue size limits

---

## Success Criteria

Implementation is successful if:

1. ✅ Single session can handle multiple requests without restarting polling
2. ✅ Each request receives complete responses
3. ✅ No "No response received" errors in multi-turn conversations
4. ✅ Polling tasks are reused across requests in same session
5. ✅ Different sessions have independent polling tasks
6. ✅ Graceful error handling and recovery
7. ✅ No memory leaks or orphaned tasks

## Conclusion

After running these tests, verify:
- All test scenarios pass
- Logs show expected behavior
- No errors or warnings
- Performance metrics within expected ranges

If any issues are found, refer to troubleshooting section or review implementation details in `PARLANT_CONTINUOUS_POLLING_IMPLEMENTATION.md`.
