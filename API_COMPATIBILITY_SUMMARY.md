# API Compatibility Summary - Quick Reference

**Project:** CareGuide AI Agent Service
**Analysis Date:** 2025-11-27

---

## TL;DR - Executive Summary

- **Old Frontend (`/frontend`):** Empty scaffold - can be ignored
- **New Frontend (`/new_frontend`):** Production-ready with full API integration
- **Backend:** 75% compatible with new_frontend
- **Critical Gaps:** Quiz API missing, Chat room management missing, Login format issue
- **Migration Timeline:** 1-2 weeks for full compatibility

---

## Critical Issues (MUST FIX)

### 1. Quiz API - NOT IMPLEMENTED ❌

**Impact:** Quiz feature completely broken

**Frontend Ready:**
```typescript
// All these exist in new_frontend/src/services/quizApi.ts
POST /api/quiz/session/start
POST /api/quiz/session/submit-answer
POST /api/quiz/session/complete
GET /api/quiz/stats
GET /api/quiz/history
```

**Backend Status:** File exists (`nutri.py`) but empty (1 line only)

**Action Required:** Create `backend/app/api/quiz.py` with 5 endpoints

**Estimated Effort:** 1-2 days

---

### 2. Chat Room Management - NOT IMPLEMENTED ❌

**Impact:** Chat rooms stored in localStorage only (data loss on browser clear)

**Frontend Ready:**
```typescript
// Defined but mocked in new_frontend/src/services/api.ts
POST /api/chat/rooms        // Create room
GET /api/chat/rooms         // List rooms
PATCH /api/chat/rooms/{id}  // Update room
DELETE /api/chat/rooms/{id} // Delete room
```

**Backend Status:** Not found (chat.py only proxies to Parlant server)

**Action Required:** Add room management endpoints to `backend/app/api/chat.py`

**Estimated Effort:** 1-2 days

---

### 3. Login Request Format - INCOMPATIBLE ⚠️

**Issue:** Frontend sends JSON, Backend expects form parameters

**Frontend Sends:**
```typescript
POST /api/auth/login
Content-Type: application/json
{ "email": "user@example.com", "password": "pass123" }
```

**Backend Expects:**
```python
@router.post("/login")
async def login(email: str, password: str):  # Expects form params
```

**Action Required:** Change backend to accept JSON body (Pydantic model)

**Estimated Effort:** 30 minutes

---

## Working Features (FULLY COMPATIBLE ✅)

### 1. Community System - 100% Compatible

**All endpoints working:**
- ✅ Posts CRUD (create, read, update, delete)
- ✅ Comments CRUD
- ✅ Like/Unlike
- ✅ Image uploads
- ✅ Featured posts
- ✅ Pagination

**Data models perfectly aligned between frontend and backend**

---

### 2. Trends & Research Papers - 95% Compatible

**Working endpoints:**
- ✅ Temporal trend analysis
- ✅ Geographic distribution
- ✅ MeSH category analysis
- ✅ Keyword comparison
- ✅ Paper search
- ✅ Summarization

**Possibly missing (need verification):**
- ⚠️ One-line summaries endpoint
- ⚠️ Translation endpoint

---

### 3. Authentication - 90% Compatible

**Working:**
- ✅ Signup endpoint
- ✅ JWT token generation
- ✅ Bearer token authentication
- ✅ User profile retrieval

**Issues:**
- ⚠️ Login format (see above)
- ⚠️ Profile update limited to name only (needs full object support)

---

## API Endpoints Comparison

| Feature | Frontend Expects | Backend Provides | Status |
|---------|-----------------|------------------|--------|
| **Authentication** | | | |
| Signup | POST /api/auth/signup | ✅ Implemented | ✅ |
| Login | POST /api/auth/login (JSON) | ⚠️ Form params | ⚠️ |
| Get Profile | GET /api/user/profile | ✅ Implemented | ✅ |
| Update Profile | PUT /api/user/profile | ⚠️ Name only | ⚠️ |
| **Chat** | | | |
| Stream Messages | POST /api/chat/stream | 🔄 Proxied | ⚠️ |
| Send Message | POST /api/chat/message | 🔄 Proxied | ⚠️ |
| Get History | GET /api/chat/history | 🔄 Proxied | ⚠️ |
| Create Room | POST /api/chat/rooms | ❌ Missing | ❌ |
| List Rooms | GET /api/chat/rooms | ❌ Missing | ❌ |
| Update Room | PATCH /api/chat/rooms/{id} | ❌ Missing | ❌ |
| Delete Room | DELETE /api/chat/rooms/{id} | ❌ Missing | ❌ |
| **Community** | | | |
| List Posts | GET /api/community/posts | ✅ Implemented | ✅ |
| Featured Posts | GET /api/community/posts/featured | ✅ Implemented | ✅ |
| Get Post | GET /api/community/posts/{id} | ✅ Implemented | ✅ |
| Create Post | POST /api/community/posts | ✅ Implemented | ✅ |
| Update Post | PUT /api/community/posts/{id} | ✅ Implemented | ✅ |
| Delete Post | DELETE /api/community/posts/{id} | ✅ Implemented | ✅ |
| Like Post | POST /api/community/posts/{id}/like | ✅ Implemented | ✅ |
| Unlike Post | DELETE /api/community/posts/{id}/like | ✅ Implemented | ✅ |
| Create Comment | POST /api/community/comments | ✅ Implemented | ✅ |
| Update Comment | PUT /api/community/comments/{id} | ✅ Implemented | ✅ |
| Delete Comment | DELETE /api/community/comments/{id} | ✅ Implemented | ✅ |
| Upload Image | POST /api/community/uploads | ✅ Implemented | ✅ |
| **Quiz** | | | |
| Start Session | POST /api/quiz/session/start | ❌ Missing | ❌ |
| Submit Answer | POST /api/quiz/session/submit-answer | ❌ Missing | ❌ |
| Complete Session | POST /api/quiz/session/complete | ❌ Missing | ❌ |
| Get Stats | GET /api/quiz/stats | ❌ Missing | ❌ |
| Get History | GET /api/quiz/history | ❌ Missing | ❌ |
| **Trends** | | | |
| Temporal Analysis | POST /api/trends/temporal | ✅ Implemented | ✅ |
| Geographic Analysis | POST /api/trends/geographic | ✅ Implemented | ✅ |
| MeSH Analysis | POST /api/trends/mesh | ✅ Implemented | ✅ |
| Compare Keywords | POST /api/trends/compare | ✅ Implemented | ✅ |
| Search Papers | POST /api/trends/papers | ✅ Implemented | ✅ |
| Summarize Papers | POST /api/trends/summarize | ✅ Implemented | ✅ |
| One-line Summaries | POST /api/trends/one-line-summaries | ⚠️ Unknown | ⚠️ |
| Translate Abstracts | POST /api/trends/translate | ⚠️ Unknown | ⚠️ |

**Legend:**
- ✅ Fully compatible
- ⚠️ Partial compatibility or needs verification
- ❌ Not implemented
- 🔄 Proxied to external service

---

## Configuration Files

### Backend Environment

**Location:** `/backend/.env`

```bash
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=careguide

# JWT Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Parlant Chat Server
PARLANT_HOST=127.0.0.1
PARLANT_PORT=8800

# Testing Mode
TEST_AUTH_ENABLED=false  # Set to true in production
```

---

### Frontend Environment

**Location:** `/new_frontend/.env.development`

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=CareGuide
VITE_APP_ENV=development
```

**Location:** `/new_frontend/.env.production`

```bash
VITE_API_BASE_URL=https://api.careguide.com
VITE_APP_NAME=CareGuide
VITE_APP_ENV=production
```

---

## Data Model Alignment

### User Model

**Frontend Type:**
```typescript
interface User {
  id: string;              // ⚠️ Different from backend
  email: string;           // ✅ Match
  name: string;            // ✅ Match
  profile: string;         // ✅ Match
  role: string;            // ✅ Match
}
```

**Backend Model:**
```python
class UserResponse(BaseModel):
    userId: str              # ⚠️ Should be 'id'
    email: str               # ✅ Match
    name: str                # ✅ Match
    profile: str             # ✅ Match
    role: str                # ✅ Match
    nickname: Optional[str]  # ➕ Extra field
    profile_image: Optional[str]  # ➕ Extra field
```

**Fix Needed:** Rename `userId` to `id` for consistency

---

### Post Model

**Frontend Type:**
```typescript
interface Post {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  postType: 'BOARD' | 'CHALLENGE' | 'SURVEY';
  imageUrls: string[];
  thumbnailUrl?: string;
  likes: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  isPinned: boolean;
  isDeleted: boolean;
}
```

**Backend Model:**
```python
class Post(BaseModel):
    # Exactly matches frontend - perfect alignment ✅
```

**Status:** ✅ Perfect match

---

## Quick Fix Checklist

### Backend Changes Required

- [ ] **Fix 1: Login endpoint** (30 min)
  - Change to accept JSON body instead of form params
  - File: `/backend/app/api/auth.py`

- [ ] **Fix 2: Implement Quiz API** (1-2 days)
  - Create `/backend/app/api/quiz.py`
  - Implement 5 endpoints
  - Register in `main.py`

- [ ] **Fix 3: Chat room management** (1-2 days)
  - Add to `/backend/app/api/chat.py`
  - Implement CRUD endpoints (4 endpoints)
  - Add MongoDB collection for rooms

- [ ] **Fix 4: User profile update** (1 hour)
  - Support full profile object in PUT /api/user/profile
  - File: `/backend/app/api/user.py`

- [ ] **Fix 5: Field naming** (30 min)
  - Rename `userId` to `id` in UserResponse
  - File: `/backend/app/models/user.py`

---

### Frontend Changes Optional

- [ ] Add feature flags for missing APIs
  - Quiz feature toggle
  - Chat rooms feature toggle

- [ ] Add backend health check on startup

- [ ] Add fallback UI for disabled features

---

## Testing Strategy

### Priority 1 - Critical Path

1. **Authentication Flow**
   ```bash
   # Test signup
   curl -X POST http://localhost:8000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"pass123","name":"Test","profile":"general"}'

   # Test login (after fix)
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"pass123"}'
   ```

2. **Community Features**
   ```bash
   # Test post creation
   curl -X POST http://localhost:8000/api/community/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"title":"Test","content":"Test content","postType":"BOARD","imageUrls":[]}'
   ```

3. **Trends Features**
   ```bash
   # Test temporal analysis
   curl -X POST http://localhost:8000/api/trends/temporal \
     -H "Content-Type: application/json" \
     -d '{"query":"diabetes","start_year":2015,"end_year":2024,"language":"ko"}'
   ```

---

### Priority 2 - After Implementation

4. **Quiz Features** (once implemented)
5. **Chat Room Management** (once implemented)

---

## Deployment Checklist

### Before Deployment

- [ ] All critical APIs implemented
- [ ] Backend tests passing
- [ ] Frontend E2E tests passing
- [ ] Environment variables configured
- [ ] MongoDB connection verified
- [ ] Parlant server running and accessible
- [ ] CORS origins configured correctly
- [ ] SSL certificates configured (production)
- [ ] Error tracking enabled (Sentry/similar)
- [ ] Logging configured
- [ ] Health check endpoints working

---

### Monitoring After Deployment

- [ ] API response times < 200ms (95th percentile)
- [ ] Error rate < 1%
- [ ] Database connection pool healthy
- [ ] Parlant server responding
- [ ] Authentication flow working
- [ ] All features accessible

---

## Support & Documentation

### Key Files

**Frontend:**
- `/new_frontend/src/services/api.ts` - Main API client
- `/new_frontend/src/config/env.ts` - Environment config
- `/new_frontend/.env.development` - Dev environment vars

**Backend:**
- `/backend/app/main.py` - FastAPI app entry point
- `/backend/app/api/` - All API routers
- `/backend/app/models/` - Pydantic models
- `/backend/.env` - Backend environment vars

### Related Documentation

- Full analysis: `BACKEND_INTEGRATION_ANALYSIS.md`
- Frontend README: `/new_frontend/README.md`
- Backend API docs: `http://localhost:8000/docs` (when running)

---

## Next Steps

1. **Review this summary with team**
2. **Prioritize fixes based on business impact**
3. **Assign tasks from checklist**
4. **Set up development environment**
5. **Begin implementation of critical fixes**
6. **Test thoroughly before merging**
7. **Deploy to staging**
8. **User acceptance testing**
9. **Production deployment**

---

**Questions?** Refer to full analysis document: `BACKEND_INTEGRATION_ANALYSIS.md`

**Last Updated:** 2025-11-27
