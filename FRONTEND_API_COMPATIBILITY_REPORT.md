# Frontend API Compatibility Report

## Executive Summary

This report analyzes the frontend API integration and identifies compatibility issues between the frontend code and backend endpoints. The main issues are:

1. **Session Creation Endpoint** - Frontend calls `/api/session/create` which doesn't exist (should proxy through Parlant)
2. **Chat Stream Endpoint** - Frontend calls `/api/chat/stream` correctly, but it proxies to Parlant
3. **Auth Login Endpoint** - Frontend calls `/api/auth/login` correctly
4. **CORS Preflight Issues** - OPTIONS requests failing due to backend routing

---

## Detailed Analysis

### 1. Session Creation Endpoint

**Frontend Call:**
- **File:** `new_frontend/src/components/ChatInterface.tsx` (Line 71)
- **File:** `new_frontend/src/hooks/useChatSession.ts` (Line 97)
- **Endpoint:** `POST /api/session/create`
- **Payload:**
  ```json
  {
    "user_id": "guest_user" | "actual_user_id"
  }
  ```

**Backend Implementation:**
- **Status:** NOT IMPLEMENTED as a direct endpoint
- **Architecture:** The chat API uses a proxy pattern to forward all non-room requests to the Parlant server
- **Route:** `backend/app/api/chat.py` has a catch-all proxy route (Line 208)
  ```python
  @router.api_route("/{path:path}", methods=["GET", "POST", ...])
  async def proxy_to_parlant(path: str, request: Request)
  ```

**Issue:**
The frontend is calling `/api/session/create` but:
1. The backend router has specific routes like `/rooms`, `/info` that match first
2. The catch-all proxy expects paths AFTER `/api/chat/`
3. So `/api/session/create` would proxy to `http://localhost:8800/session/create`
4. This assumes Parlant has a `/session/create` endpoint

**Expected vs Actual:**

| Aspect | Frontend Expectation | Backend Reality |
|--------|---------------------|-----------------|
| Endpoint | `/api/session/create` | Proxied to Parlant |
| Method | POST | POST (proxied) |
| Request Body | `{ "user_id": string }` | Proxied as-is |
| Response | `{ "session_id": string }` | Depends on Parlant |
| Error Handling | Expects 200 with session_id | May get 503 if Parlant down |

---

### 2. Chat Stream Endpoint

**Frontend Call:**
- **File:** `new_frontend/src/components/ChatInterface.tsx` (Line 220)
- **File:** `new_frontend/src/services/intentRouter.ts` (Line 187)
- **Endpoint:** `POST /api/chat/stream`
- **Payload:**
  ```json
  {
    "query": "user question",
    "session_id": "session_id",
    "agent_type": "auto" | "medical_welfare" | "nutrition" | "research_paper",
    "user_profile": "general" | "patient" | "researcher"
  }
  ```
- **Expected Response:** Server-Sent Events (SSE) stream with format:
  ```
  data: {"content": "...", "status": "streaming", "agent_type": "..."}
  data: [DONE]
  ```

**Backend Implementation:**
- **Status:** Proxied to Parlant server
- **Route:** Falls through to catch-all proxy in `chat.py` (Line 208)
- **Proxies to:** `http://localhost:8800/stream`

**Issue:**
The endpoint exists as a proxy, but:
1. Depends entirely on Parlant server being running and available
2. Frontend gets 503 error if Parlant is down
3. No fallback mechanism in frontend for Parlant unavailability
4. CORS preflight (OPTIONS) requests may fail if not handled properly

**Expected vs Actual:**

| Aspect | Frontend Expectation | Backend Reality |
|--------|---------------------|-----------------|
| Endpoint | `/api/chat/stream` | Proxied to Parlant |
| Method | POST | POST (proxied) |
| Content-Type | SSE (text/event-stream) | Proxied from Parlant |
| Response Format | SSE chunks | Proxied from Parlant |
| Error Handling | Network errors only | 503 if Parlant down |

---

### 3. Auth Login Endpoint

**Frontend Call:**
- **File:** `new_frontend/src/contexts/AuthContext.tsx` (Line 101)
- **Endpoint:** `POST /api/auth/login`
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

**Backend Implementation:**
- **Status:** FULLY IMPLEMENTED
- **Route:** `backend/app/api/auth.py` (Line 28)
- **Request Model:** `LoginRequest` (email: EmailStr, password: str)
- **Response:**
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "profile": "patient",
      "role": "user"
    }
  }
  ```

**Issue:**
Frontend calls login with `(email, password)` but variable name says `username`:
- **Line 97:** `const login = async (email: string, password: string) => {`
- This is correct! The parameter is properly named `email` and the payload is correct.

**Status:** ✅ NO ISSUES - Perfect compatibility

---

### 4. CORS Preflight Issues

**Problem:**
Server logs show:
```
OPTIONS /api/session/create?user_id=temp_user_123 → 400 Bad Request
OPTIONS /api/auth/login → 400 Bad Request
```

**Root Cause:**
1. CORS middleware is configured correctly in `backend/app/main.py` (Lines 43-54)
2. However, OPTIONS requests may be hitting validation before CORS middleware processes them
3. FastAPI processes request body validation before CORS preflight responses

**Backend CORS Config:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://192.168.129.32:5173",
        "http://192.168.129.32:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Frontend API Config:**
```typescript
// new_frontend/src/config/env.ts
apiBaseUrl: "http://localhost:8000"

// new_frontend/src/services/api.ts
const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' }
});
```

**Issue:**
- Frontend is at `http://localhost:5173`
- Backend allows this origin
- But OPTIONS requests with query parameters may fail validation
- Example: `OPTIONS /api/session/create?user_id=temp_user_123`
  - The `?user_id=` part should NOT be in the URL for a POST request
  - POST data should be in the request body

---

## Frontend Issues Found

### Issue 1: Session Create Call Uses Wrong Method

**Location:** `new_frontend/src/components/ChatInterface.tsx` (Line 71)

**Current Code:**
```typescript
const response = await api.post('/api/session/create', { user_id: userId });
```

**Problem:**
- This sends `user_id` in the request body (correct for POST)
- But it's being proxied to Parlant server
- We need to verify Parlant expects this format

**Recommendation:**
- Add error handling for when Parlant is unavailable
- Add retry logic with exponential backoff
- Consider session creation fallback (use local UUID if Parlant fails)

---

### Issue 2: Chat Stream Error Handling

**Location:** `new_frontend/src/components/ChatInterface.tsx` (Lines 387-407)

**Current Code:**
```typescript
} catch (error: any) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
    setMessages((prev) => prev.filter(msg => msg.id !== currentBotMessageId));
    return;
  }
  console.error('Failed to send message:', error);
  setMessages((prev) =>
    prev.map(msg =>
      msg.id === currentBotMessageId
        ? { ...msg, content: t.common.error }
        : msg
    )
  );
}
```

**Problem:**
- Generic error message doesn't distinguish between:
  - Network errors (backend down)
  - Parlant server errors (503)
  - Validation errors (400)
  - Authentication errors (401)

**Recommendation:**
- Add specific error handling for 503 (Parlant unavailable)
- Show user-friendly messages for each error type
- Implement retry mechanism for transient failures

---

### Issue 3: No Parlant Health Check

**Problem:**
- Frontend assumes backend and Parlant are always available
- No pre-flight check to verify Parlant connectivity
- User gets error mid-conversation if Parlant goes down

**Recommendation:**
- Add a health check endpoint call on app initialization
- Display warning banner if Parlant is unavailable
- Disable chat input if backend/Parlant is down

---

## Backend Issues Found

### Issue 1: CORS Preflight Not Handling Query Parameters

**Location:** Backend routing configuration

**Problem:**
- OPTIONS requests with query parameters fail validation
- Example: `OPTIONS /api/session/create?user_id=temp_user_123`

**Root Cause:**
- The catch-all proxy in `chat.py` may be processing OPTIONS requests
- FastAPI validation runs before CORS middleware returns 200 for OPTIONS

**Recommendation:**
- Add explicit OPTIONS handler for chat routes
- Or ensure proxy correctly handles OPTIONS without validation

---

### Issue 2: Parlant Connection Error Not User-Friendly

**Location:** `backend/app/api/chat.py` (Lines 266-271)

**Current Code:**
```python
except httpx.ConnectError:
    logger.error(f"Cannot connect to Parlant server at {PARLANT_BASE_URL}")
    raise HTTPException(
        status_code=503,
        detail=f"Parlant server unavailable at {PARLANT_BASE_URL}..."
    )
```

**Problem:**
- Exposes internal server URL to frontend
- Not localized for Korean users
- Technical message not suitable for end users

**Recommendation:**
- Return user-friendly error message
- Log technical details server-side only
- Add retry-after header for 503 responses

---

## API Endpoint Compatibility Matrix

| Endpoint | Frontend Call | Backend Route | Status | Issues |
|----------|---------------|---------------|--------|--------|
| `POST /api/session/create` | ✅ ChatInterface.tsx:71<br>✅ useChatSession.ts:97 | Proxied to Parlant | ⚠️ Partial | Depends on Parlant availability |
| `POST /api/chat/stream` | ✅ ChatInterface.tsx:220<br>✅ intentRouter.ts:187 | Proxied to Parlant | ⚠️ Partial | SSE streaming via proxy |
| `POST /api/auth/login` | ✅ AuthContext.tsx:101 | ✅ auth.py:28 | ✅ Working | None |
| `POST /api/auth/signup` | ✅ AuthContext.tsx:145 | ✅ auth.py:9 | ✅ Working | None |
| `PATCH /api/auth/profile` | ✅ AuthContext.tsx:220 | ❌ Not implemented | ❌ Broken | Missing backend endpoint |
| `GET /api/chat/history` | ✅ api.ts:177 | Proxied to Parlant | ⚠️ Partial | Depends on Parlant |
| `POST /api/chat/rooms` | ✅ api.ts:234 | ✅ chat.py:75 | ✅ Working | None |
| `GET /api/chat/rooms` | ✅ api.ts:261 | ✅ chat.py:110 | ✅ Working | None |
| `PATCH /api/chat/rooms/{id}` | ✅ api.ts:283 | ✅ chat.py:147 | ✅ Working | None |
| `DELETE /api/chat/rooms/{id}` | ✅ api.ts:307 | ✅ chat.py:177 | ✅ Working | None |
| `OPTIONS` (all endpoints) | Browser preflight | CORS middleware | ⚠️ Failing | Query params in OPTIONS |

---

## Recommended Frontend Fixes

### Fix 1: Add Parlant Availability Check

**File:** `new_frontend/src/services/api.ts`

Add a health check function:

```typescript
/**
 * Check if backend and Parlant are available
 */
export async function checkBackendHealth(): Promise<{
  backend: boolean;
  parlant: boolean;
  message: string;
}> {
  try {
    const response = await api.get('/api/chat/info');
    return {
      backend: true,
      parlant: response.data.status === 'proxying',
      message: response.data.status
    };
  } catch (error) {
    return {
      backend: false,
      parlant: false,
      message: 'Backend unavailable'
    };
  }
}
```

### Fix 2: Improve Session Creation Error Handling

**File:** `new_frontend/src/components/ChatInterface.tsx`

```typescript
const initSession = async () => {
  try {
    const storedSession = storage.get<string>(STORAGE_KEY_SESSION);
    const storedMessages = storage.get<Message[]>(STORAGE_KEY_MESSAGES);
    const lastActive = storage.get<string>(STORAGE_KEY_TIMESTAMP);

    const now = Date.now();

    if (storedSession && lastActive && (now - parseInt(lastActive) < SESSION_TIMEOUT)) {
      setSessionId(storedSession);
      if (storedMessages && Array.isArray(storedMessages)) {
        const parsedMessages = storedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      }
    } else {
      const userId = user?.id || 'guest_user';

      try {
        const response = await api.post('/api/session/create', { user_id: userId });
        const newSessionId = response.data.session_id;
        setSessionId(newSessionId);
        setMessages([]);
        storage.set(STORAGE_KEY_SESSION, newSessionId);
        storage.remove(STORAGE_KEY_MESSAGES);
      } catch (sessionError: any) {
        // Fallback: Create local session if Parlant is unavailable
        if (sessionError.response?.status === 503) {
          console.warn('Parlant server unavailable, using local session');
          const fallbackSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setSessionId(fallbackSessionId);
          storage.set(STORAGE_KEY_SESSION, fallbackSessionId);
          toast.warning('채팅 서버 연결 불가. 일부 기능이 제한될 수 있습니다.');
        } else {
          throw sessionError; // Re-throw if it's not a Parlant issue
        }
      }
    }

    storage.set(STORAGE_KEY_TIMESTAMP, now.toString());
  } catch (error) {
    console.error('Failed to initialize session:', error);
    toast.error('세션 초기화 실패. 페이지를 새로고침해주세요.');
  }
};
```

### Fix 3: Improve Chat Stream Error Messages

**File:** `new_frontend/src/components/ChatInterface.tsx`

```typescript
} catch (error: any) {
  // Don't show error if request was aborted (user cancelled)
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
    setMessages((prev) => prev.filter(msg => msg.id !== currentBotMessageId));
    return;
  }

  console.error('Failed to send message:', error);

  let errorMessage = t.common.error;

  // Provide specific error messages based on error type
  if (error.response) {
    switch (error.response.status) {
      case 503:
        errorMessage = '채팅 서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        break;
      case 401:
        errorMessage = '인증이 필요합니다. 로그인해주세요.';
        break;
      case 429:
        errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        break;
      case 400:
        errorMessage = '잘못된 요청입니다. 입력을 확인해주세요.';
        break;
      default:
        errorMessage = `오류가 발생했습니다. (${error.response.status})`;
    }
  } else if (error.request) {
    errorMessage = '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  }

  setMessages((prev) =>
    prev.map(msg =>
      msg.id === currentBotMessageId
        ? { ...msg, content: errorMessage }
        : msg
    )
  );
}
```

### Fix 4: Add Missing Profile Update Endpoint

**Problem:** Frontend calls `PATCH /api/auth/profile` but backend doesn't implement it.

**Backend file to create:** `backend/app/api/user.py` (if not exists) or add to `auth.py`

```python
@router.patch("/profile")
async def update_profile(
    profile_update: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile

    Request body:
        {"profile": "general" | "patient" | "researcher"}
    """
    allowed_profiles = ["general", "patient", "researcher"]
    new_profile = profile_update.get("profile")

    if new_profile not in allowed_profiles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid profile. Must be one of: {allowed_profiles}"
        )

    # Update user profile in database
    users_collection.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {"profile": new_profile}}
    )

    return {"success": True, "profile": new_profile}
```

---

## Recommended Backend Fixes

### Fix 1: Add Explicit OPTIONS Handler for CORS

**File:** `backend/app/api/chat.py`

Add before the catch-all proxy route:

```python
@router.options("/{path:path}")
async def options_handler(path: str):
    """
    Handle CORS preflight requests
    Returns 200 OK for all OPTIONS requests
    """
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )
```

### Fix 2: Improve Parlant Error Messages

**File:** `backend/app/api/chat.py`

```python
except httpx.ConnectError:
    logger.error(f"Cannot connect to Parlant server at {PARLANT_BASE_URL}")
    raise HTTPException(
        status_code=503,
        detail={
            "message": "채팅 서비스가 일시적으로 사용할 수 없습니다",
            "error_code": "PARLANT_UNAVAILABLE",
            "retry_after": 30  # seconds
        }
    )
```

---

## Testing Checklist

### Frontend Tests

- [ ] Test session creation with Parlant running
- [ ] Test session creation with Parlant down (should use fallback)
- [ ] Test chat stream with various message types
- [ ] Test chat stream error handling (503, 401, 400)
- [ ] Test login flow
- [ ] Test signup flow
- [ ] Test profile update (after backend fix)
- [ ] Test chat room CRUD operations
- [ ] Test CORS preflight (OPTIONS) requests
- [ ] Test network error handling

### Backend Tests

- [ ] Test CORS configuration with actual frontend origin
- [ ] Test OPTIONS requests return 200
- [ ] Test Parlant proxy with server running
- [ ] Test Parlant proxy with server down (should return 503)
- [ ] Test session creation endpoint via proxy
- [ ] Test chat stream endpoint via proxy
- [ ] Test auth endpoints (login, signup)
- [ ] Test profile update endpoint (after implementation)
- [ ] Test chat room CRUD endpoints

---

## Summary

### Critical Issues (Must Fix)

1. ❌ **Profile Update Endpoint Missing** - Frontend calls `/api/auth/profile` but backend doesn't implement it
2. ⚠️ **OPTIONS CORS Handling** - Preflight requests failing with 400
3. ⚠️ **No Parlant Health Check** - No way for frontend to know if Parlant is available

### Important Issues (Should Fix)

4. **Error Message Localization** - Backend returns English messages, frontend is Korean
5. **Generic Error Handling** - Frontend shows same error for all failure types
6. **No Session Fallback** - App breaks if Parlant is unavailable

### Nice to Have (Consider)

7. Health check endpoint integration
8. Retry logic for transient failures
9. Better loading states during API calls
10. Offline mode with limited functionality

---

## Conclusion

The frontend code is well-structured and mostly compatible with the backend. The main issues are:

1. **Missing backend endpoint for profile update** - Easy fix, just implement the endpoint
2. **CORS OPTIONS handling** - Add explicit OPTIONS handler
3. **Parlant dependency** - Add health checks and fallback mechanisms

Most endpoints work correctly. The architecture using Parlant as a proxy is sound, but needs better error handling and fallback strategies.
