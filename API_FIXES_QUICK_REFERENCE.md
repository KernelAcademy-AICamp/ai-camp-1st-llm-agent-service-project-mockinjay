# API Fixes Quick Reference

## Status Overview

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Frontend Session Creation | ✅ Fixed | None - deployed |
| Frontend Error Handling | ✅ Fixed | None - deployed |
| Frontend Health Check | ✅ Added | None - deployed |
| Backend Profile Update | ❌ Missing | Must implement |
| Backend CORS OPTIONS | ❌ Broken | Must fix |
| Backend Error Messages | ⚠️ Needs improvement | Should fix |

## Quick Fixes for Backend

### 1. Add Profile Update (CRITICAL)

Add to `backend/app/api/auth.py`:

```python
@router.patch("/profile")
async def update_profile(profile_update: dict, current_user: dict = Depends(get_current_user)):
    allowed_profiles = ["general", "patient", "researcher"]
    new_profile = profile_update.get("profile")

    if new_profile not in allowed_profiles:
        raise HTTPException(status_code=400, detail="Invalid profile")

    users_collection.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {"profile": new_profile}}
    )

    return {"success": True, "profile": new_profile}
```

### 2. Fix CORS OPTIONS (CRITICAL)

Add to `backend/app/api/chat.py` BEFORE line 208:

```python
@router.options("/{path:path}")
async def options_handler(path: str):
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )
```

## API Endpoint Status

### Working Endpoints ✅

| Endpoint | Method | Frontend File | Backend File | Status |
|----------|--------|---------------|--------------|--------|
| `/api/auth/login` | POST | AuthContext.tsx:101 | auth.py:28 | ✅ Working |
| `/api/auth/signup` | POST | AuthContext.tsx:145 | auth.py:9 | ✅ Working |
| `/api/chat/rooms` | POST | api.ts:234 | chat.py:75 | ✅ Working |
| `/api/chat/rooms` | GET | api.ts:261 | chat.py:110 | ✅ Working |
| `/api/chat/rooms/{id}` | PATCH | api.ts:283 | chat.py:147 | ✅ Working |
| `/api/chat/rooms/{id}` | DELETE | api.ts:307 | chat.py:177 | ✅ Working |
| `/api/community/posts` | GET | - | community.py | ✅ Working |
| `/api/quiz/session/start` | POST | - | quiz.py | ✅ Working |

### Proxied to Parlant (Partial) ⚠️

| Endpoint | Method | Frontend File | Proxies To | Status |
|----------|--------|---------------|------------|--------|
| `/api/chat/session/create` | POST | ChatInterface.tsx:73 | Parlant | ⚠️ Has fallback |
| `/api/chat/stream` | POST | ChatInterface.tsx:220 | Parlant | ⚠️ Has fallback |
| `/api/chat/history` | GET | api.ts:177 | Parlant | ⚠️ Depends on Parlant |

### Broken Endpoints ❌

| Endpoint | Method | Frontend File | Issue | Priority |
|----------|--------|---------------|-------|----------|
| `/api/auth/profile` | PATCH | AuthContext.tsx:220 | Not implemented | CRITICAL |
| `OPTIONS` (all) | OPTIONS | Browser | CORS fails | CRITICAL |

## Error Messages Reference

### Frontend Error Messages (Korean)

| Status | Message |
|--------|---------|
| 400 | 잘못된 요청입니다. 입력을 확인해주세요. |
| 401 | 인증이 필요합니다. 로그인해주세요. |
| 404 | 채팅 서비스를 찾을 수 없습니다. |
| 429 | 요청이 너무 많습니다. 잠시 후 다시 시도해주세요. |
| 503 | 채팅 서버가 일시적으로 사용할 수 없습니다. |
| 500/502/504 | 서버 오류가 발생했습니다. |
| Network | 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요. |

## Session Creation Flow

### Normal Flow
```
Frontend → Backend → Parlant → Response
   ↓         ↓         ↓          ↓
Request   Proxy    Process    session_id
```

### Fallback Flow (Parlant Down)
```
Frontend → Backend → Parlant ❌
   ↓         ↓
Request   503 Error
   ↓
Frontend catches 503
   ↓
Creates local_xxx session
   ↓
App continues (limited functionality)
```

## Testing Commands

### Test Login (Working)
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Test Profile Update (BROKEN - Need to fix)
```bash
curl -X PATCH http://localhost:8000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"profile": "researcher"}'
```

### Test CORS OPTIONS (BROKEN - Need to fix)
```bash
curl -X OPTIONS http://localhost:8000/api/chat/stream \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Test Session Creation (Works with fallback)
```bash
# With Parlant running (normal)
curl -X POST http://localhost:8000/api/chat/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user"}'

# With Parlant stopped (frontend has fallback)
# Open frontend, check console for "using local session"
```

## Implementation Priority

### Phase 1: Critical (Do Now)
1. Implement `/api/auth/profile` endpoint
2. Fix CORS OPTIONS handler
3. Test with frontend

### Phase 2: Important (Do Soon)
1. Improve Parlant error messages (Korean)
2. Remove internal URLs from errors
3. Add health check to `/api/chat/info`

### Phase 3: Nice to Have (Do Later)
1. Add rate limiting
2. Add request/response logging
3. Add metrics/monitoring

## Files to Edit

### Backend Files
- `backend/app/api/auth.py` - Add profile update endpoint
- `backend/app/api/chat.py` - Fix OPTIONS, improve errors
- `backend/app/services/auth.py` - Add get_current_user if missing

### Already Fixed Frontend Files
- `new_frontend/src/components/ChatInterface.tsx` - ✅ Session fallback, error handling
- `new_frontend/src/hooks/useChatSession.ts` - ✅ Session fallback
- `new_frontend/src/services/api.ts` - ✅ Health check function

## Common Issues & Solutions

### Issue: "OPTIONS 400 Bad Request"
**Solution:** Add OPTIONS handler in chat.py before catch-all route

### Issue: "Parlant server unavailable"
**Solution:** Frontend now has fallback (already fixed)

### Issue: "Profile update fails"
**Solution:** Implement `/api/auth/profile` endpoint in backend

### Issue: "Error messages in English"
**Solution:** Update backend error messages to Korean

## Verification Checklist

After implementing backend fixes:

- [ ] Login works (already working)
- [ ] Signup works (already working)
- [ ] Profile update works (need to implement)
- [ ] Chat session creation works (already has fallback)
- [ ] Chat streaming works (depends on Parlant)
- [ ] CORS OPTIONS returns 200 (need to fix)
- [ ] Error messages are in Korean (need to fix)
- [ ] No internal URLs in error messages (need to fix)
- [ ] Health check shows Parlant status (optional)

## Support Contact

For questions about these fixes:
- Frontend fixes: See `FRONTEND_FIXES_SUMMARY.md`
- Backend fixes: See `BACKEND_FIXES_NEEDED.md`
- Full analysis: See `FRONTEND_API_COMPATIBILITY_REPORT.md`
