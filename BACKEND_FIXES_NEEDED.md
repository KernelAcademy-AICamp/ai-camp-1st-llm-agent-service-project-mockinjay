# Backend Fixes Needed for Frontend Compatibility

## Critical Fixes (Must Implement)

### 1. Add Profile Update Endpoint

**Problem:** Frontend calls `PATCH /api/auth/profile` but the endpoint doesn't exist.

**Location:** `backend/app/api/auth.py`

**Add this route:**

```python
from fastapi import Depends
from app.services.auth import get_current_user
from bson import ObjectId

@router.patch("/profile")
async def update_profile(
    profile_update: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile type

    Request body:
        {"profile": "general" | "patient" | "researcher"}

    Returns:
        {"success": true, "profile": "patient"}
    """
    allowed_profiles = ["general", "patient", "researcher"]
    new_profile = profile_update.get("profile")

    if not new_profile:
        raise HTTPException(status_code=400, detail="프로필 타입이 필요합니다")

    if new_profile not in allowed_profiles:
        raise HTTPException(
            status_code=400,
            detail=f"유효하지 않은 프로필입니다. 가능한 값: {', '.join(allowed_profiles)}"
        )

    # Update user profile in database
    result = users_collection.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {"profile": new_profile}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    return {"success": True, "profile": new_profile}
```

**Also add to auth.py if not already present:**

```python
from app.db.connection import users_collection
```

### 2. Fix CORS Preflight for OPTIONS Requests

**Problem:** OPTIONS requests fail with 400 Bad Request

**Location:** `backend/app/api/chat.py`

**Add before the catch-all proxy route (around line 207):**

```python
@router.options("/{path:path}")
async def options_handler(path: str):
    """
    Handle CORS preflight requests explicitly
    Returns 200 OK for all OPTIONS requests without validation
    """
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    )
```

**Note:** This should be placed BEFORE the catch-all `@router.api_route("/{path:path}")` so it matches first.

### 3. Improve Parlant Error Messages

**Problem:** Error messages expose internal URLs and are in English

**Location:** `backend/app/api/chat.py` (lines 266-283)

**Replace the error handlers with:**

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
    except httpx.TimeoutException:
        logger.error(f"Timeout connecting to Parlant server")
        raise HTTPException(
            status_code=504,
            detail={
                "message": "채팅 서버 응답 시간 초과",
                "error_code": "PARLANT_TIMEOUT",
                "retry_after": 10
            }
        )
    except Exception as e:
        logger.error(f"Proxy error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "채팅 서비스 오류가 발생했습니다",
                "error_code": "PROXY_ERROR"
            }
        )
```

## Important Fixes (Should Implement)

### 4. Add get_current_user Dependency

**Problem:** If `get_current_user` doesn't exist, the profile update won't work

**Location:** `backend/app/services/auth.py` or create if doesn't exist

**Add this function:**

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth import verify_access_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current user from JWT token

    Returns:
        {"user_id": "...", "email": "...", etc.}
    """
    token = credentials.credentials

    try:
        payload = verify_access_token(token)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="유효하지 않은 인증 토큰입니다"
        )
```

**Note:** If `verify_access_token` doesn't exist, you'll need to create it using JWT:

```python
import jwt
from datetime import datetime

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

def verify_access_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Check if token is expired
        if payload.get("exp") and datetime.utcnow().timestamp() > payload["exp"]:
            raise HTTPException(status_code=401, detail="토큰이 만료되었습니다")

        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
```

### 5. Add Health Check for Parlant

**Location:** `backend/app/api/chat.py`

**Enhance the `/api/chat/info` endpoint:**

```python
@router.get("/info")
async def chat_info():
    """
    Get chat service information including Parlant health
    """
    # Try to ping Parlant server
    parlant_status = "unknown"
    try:
        response = await client.get(f"{PARLANT_BASE_URL}/health", timeout=2.0)
        if response.status_code == 200:
            parlant_status = "healthy"
        else:
            parlant_status = "unhealthy"
    except:
        parlant_status = "unavailable"

    return {
        "service": "Chat API (Parlant Proxy + Room Management)",
        "parlant_server": PARLANT_BASE_URL,
        "parlant_status": parlant_status,
        "status": "proxying" if parlant_status == "healthy" else "degraded",
        "total_rooms": len(chat_rooms)
    }
```

## Nice to Have Fixes

### 6. Add Request/Response Logging

**Location:** `backend/app/api/chat.py`

**Add to the proxy function:**

```python
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_to_parlant(path: str, request: Request):
    """
    Proxy all requests to the Parlant server with enhanced logging
    """
    try:
        url = f"{PARLANT_BASE_URL}/{path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"

        headers = {
            key: value
            for key, value in request.headers.items()
            if key.lower() not in ["host", "content-length"]
        }

        body = await request.body()

        # Enhanced logging
        logger.info(f"Proxying {request.method} {url}")
        logger.debug(f"Request headers: {headers}")
        logger.debug(f"Request body (first 200 chars): {body[:200] if body else 'empty'}")

        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )

        logger.info(f"Parlant response status: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")

        # ... rest of the function
```

### 7. Add Rate Limiting for Session Creation

**Location:** `backend/app/api/chat.py` or create middleware

**Purpose:** Prevent abuse of session creation endpoint

```python
from fastapi import Request
from datetime import datetime, timedelta
from collections import defaultdict

# Simple in-memory rate limiter (use Redis in production)
session_creation_attempts = defaultdict(list)

@router.post("/session/create")  # If you create this endpoint instead of proxying
async def create_session(request: Request, user_id: str):
    """
    Create a new chat session with rate limiting
    """
    # Rate limiting: 10 sessions per hour per IP
    client_ip = request.client.host
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)

    # Clean old attempts
    session_creation_attempts[client_ip] = [
        attempt for attempt in session_creation_attempts[client_ip]
        if attempt > one_hour_ago
    ]

    # Check rate limit
    if len(session_creation_attempts[client_ip]) >= 10:
        raise HTTPException(
            status_code=429,
            detail="세션 생성 요청이 너무 많습니다. 1시간 후 다시 시도해주세요."
        )

    session_creation_attempts[client_ip].append(now)

    # Forward to Parlant or create session
    # ... implementation
```

## Testing After Fixes

### Test Profile Update

```bash
# Get token from login first
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Then test profile update
curl -X PATCH http://localhost:8000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"profile": "researcher"}'
```

### Test CORS OPTIONS

```bash
curl -X OPTIONS http://localhost:8000/api/chat/stream \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Expected response: `200 OK` with CORS headers

### Test Parlant Proxy

```bash
# With Parlant running
curl -X POST http://localhost:8000/api/chat/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user"}'

# With Parlant stopped
curl -X POST http://localhost:8000/api/chat/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user"}'
```

Expected: Second request should return `503` with Korean error message

## Deployment Checklist

- [ ] Implement profile update endpoint
- [ ] Add OPTIONS handler for CORS
- [ ] Improve error messages (Korean + remove internal URLs)
- [ ] Add get_current_user dependency
- [ ] Test all endpoints with frontend
- [ ] Test CORS with actual frontend origin
- [ ] Test error handling (Parlant down)
- [ ] Add logging for debugging
- [ ] Update API documentation
- [ ] Set proper JWT secret in production
- [ ] Consider rate limiting for production

## Priority Order

1. **Profile Update Endpoint** - Critical, breaks existing functionality
2. **OPTIONS CORS Handler** - Critical, prevents API calls from browser
3. **Error Message Improvements** - Important, better UX
4. **get_current_user Dependency** - Important, needed for #1
5. **Health Check Enhancement** - Nice to have
6. **Logging Improvements** - Nice to have
7. **Rate Limiting** - Nice to have for production
