# Quick Testing Guide for Chat Fixes

## Pre-Test Setup

### 1. Ensure Backend is Running
```bash
# Check if backend is accessible
curl http://localhost:8000/docs

# Expected: Swagger UI documentation page
```

### 2. Check Environment Variables
```bash
# View current environment config
cat .env.development

# Should show:
# VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Frontend Development Server
```bash
npm run dev
```

---

## Test Cases

### ✅ Test 1: Basic Message Send/Receive

**Steps:**
1. Navigate to Chat page
2. Type: "만성콩팥병이란 무엇인가요?"
3. Click Send

**Expected Results:**
- ✅ Message appears in chat immediately
- ✅ Loading indicator shows
- ✅ Response streams in progressively (word by word)
- ✅ No console errors

**Console Check:**
```javascript
// Open DevTools → Console
// Should NOT see:
❌ "Failed to fetch"
❌ "TypeError"
❌ "Uncaught error"
```

---

### ✅ Test 2: Request Cancellation (AbortController)

**Steps:**
1. Type a message: "신장 투석에 대해 알려줘"
2. Click Send
3. **Immediately** type and send another message: "안녕"
4. Observe Network tab

**Expected Results:**
- ✅ First request shows status: "cancelled" in Network tab
- ✅ Console shows: "Request was cancelled"
- ✅ Only second response appears
- ✅ No memory leak or duplicate responses

**Network Tab Check:**
```
DevTools → Network → Filter: "stream"
Should see:
- First request: (cancelled) - Red
- Second request: 200 OK - Green
```

---

### ✅ Test 3: Environment URL Usage

**Steps:**
1. Open DevTools → Network tab
2. Send any message
3. Click on the "stream" request
4. Check Request URL

**Expected Results:**
- ✅ URL starts with `http://localhost:8000` (from .env.development)
- ✅ NOT hardcoded

**Verification:**
```
Request URL: http://localhost:8000/api/chat/stream ✅
NOT: http://localhost:8000/api/chat/stream (hardcoded) ❌
```

---

### ✅ Test 4: Session Management

**Test A: Guest User**
1. Log out (if logged in)
2. Send a message
3. Check localStorage

**Expected:**
```javascript
localStorage.getItem('careguide_session_id')
// Should exist and be a valid session ID
```

**Test B: Authenticated User**
1. Log in with valid credentials
2. Send a message
3. Reload page
4. Check if chat history persists

**Expected Results:**
- ✅ Session created with user ID (not 'guest_user')
- ✅ Chat history visible after reload
- ✅ Messages persist for 1 hour

---

### ✅ Test 5: Navigation Cleanup

**Steps:**
1. Navigate to Chat page
2. Type and send a long query
3. **Immediately** navigate to another page (e.g., Community)
4. Check Network tab

**Expected Results:**
- ✅ Stream request is cancelled
- ✅ Console shows: "Request was cancelled"
- ✅ No ongoing requests on new page
- ✅ No memory leaks

---

### ✅ Test 6: Error Handling

**Test A: Backend Offline**
1. Stop backend server
2. Send a message
3. Observe error

**Expected:**
- ✅ Error message displayed in chat
- ✅ No infinite loading
- ✅ User can try again

**Test B: Network Error**
1. Throttle network to "Offline" in DevTools
2. Send message
3. Restore network
4. Send again

**Expected:**
- ✅ Graceful error handling
- ✅ Can retry after network restored

---

## Performance Testing

### Memory Leak Check

**Steps:**
1. Open DevTools → Performance → Memory
2. Take heap snapshot
3. Send 20 messages rapidly (before responses complete)
4. Wait for all responses
5. Take another heap snapshot
6. Compare

**Expected:**
- ✅ Memory usage returns to baseline
- ✅ No growing number of listeners
- ✅ No accumulating fetch requests

---

## Browser Console Checks

### What You SHOULD See (Normal Operation)

```javascript
✅ "Request was cancelled" (when sending new message before old completes)
✅ "AuthContext initialization"
✅ "Saved token: ..." (if logged in)
```

### What You SHOULD NOT See (Indicates Bug)

```javascript
❌ "Failed to fetch from http://localhost:8000"
❌ "TypeError: Cannot read property of undefined"
❌ "Unhandled promise rejection"
❌ "CORS error"
❌ "JSON.parse error"
❌ Multiple duplicate responses
```

---

## Network Tab Analysis

### Successful Stream Request

```
General:
  Request URL: http://localhost:8000/api/chat/stream ✅
  Request Method: POST
  Status Code: 200 OK

Request Headers:
  Content-Type: application/json

Request Payload:
  {
    "query": "...",
    "session_id": "...",
    "agent_type": "auto",
    "user_profile": "patient"
  }

Response:
  EventStream data (SSE format)
  data: {"content": "...", "status": "streaming"}
  data: [DONE]
```

### Cancelled Request (Expected)

```
General:
  Request URL: http://localhost:8000/api/chat/stream
  Request Method: POST
  Status Code: (cancelled) ✅ This is GOOD!

Console:
  "Request was cancelled" ✅
```

---

## Integration Tests

### Test Scenario: Full Chat Flow

1. **Login**
   - Enter credentials
   - Verify token saved

2. **Select Profile**
   - Change profile to "환자"
   - Verify profile saved

3. **Send Medical Query**
   - Type: "크레아티닌 수치가 1.5인데 위험한가요?"
   - Verify medical disclaimer appears

4. **Send Nutrition Query**
   - Navigate to Nutrition chat
   - Type: "콩팥에 좋은 음식은?"
   - Verify response

5. **Upload Image (Nutrition)**
   - Click image button
   - Upload food image
   - Verify analysis

6. **Navigate Away**
   - Go to Community page
   - Verify no ongoing requests

7. **Return to Chat**
   - Go back to Chat
   - Verify history restored

8. **Logout**
   - Click logout
   - Verify all data cleared

---

## Automated Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test ChatInterface

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## Debugging Tips

### If streaming doesn't work:

1. **Check Backend Logs**
   ```bash
   # In backend terminal
   # Should see incoming POST requests
   ```

2. **Check Network Tab**
   - Filter by "stream"
   - Check request payload
   - Check response format

3. **Check Console**
   - Look for JSON parse errors
   - Check for CORS errors

4. **Verify Environment**
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_API_BASE_URL)
   // Should output: "http://localhost:8000"
   ```

### If messages appear out of order:

- ✅ **FIXED**: AbortController cancels old requests
- If still happening, check for race conditions

### If memory leak occurs:

- ✅ **FIXED**: Cleanup on unmount
- Check DevTools → Performance → Memory over time

---

## Success Criteria

All tests pass if:

- ✅ Messages send and receive correctly
- ✅ Streaming works progressively
- ✅ Old requests cancel when new message sent
- ✅ No console errors in normal operation
- ✅ Environment URLs used (not hardcoded)
- ✅ Session persists correctly
- ✅ No memory leaks after 20+ messages
- ✅ Cleanup works on navigation
- ✅ Error handling is graceful

---

## Report Template

```
## Test Results - [Date]

### Environment
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Browser: Chrome 120.x

### Test Results
1. Basic Send/Receive: ✅ / ❌
2. Request Cancellation: ✅ / ❌
3. Environment URLs: ✅ / ❌
4. Session Management: ✅ / ❌
5. Navigation Cleanup: ✅ / ❌
6. Error Handling: ✅ / ❌

### Issues Found
- [None] or [List issues]

### Notes
- [Any additional observations]
```

---

**Last Updated:** 2025-11-26
**Version:** 1.0
