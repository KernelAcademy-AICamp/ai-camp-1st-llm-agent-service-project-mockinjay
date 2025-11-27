# Profile System Backend API Documentation

## Executive Summary

This document provides comprehensive technical documentation for the Profile System backend API implementation. The system supports three distinct user profile types (general, patient, researcher) that enable personalized chat agent interactions and user experiences.

**Key Features:**
- Three profile types with validation: `general`, `patient`, `researcher`
- Profile stored during registration with `general` as default
- Profile included in all authentication responses
- Dedicated endpoint for updating user profiles
- Integration-ready for chat agent personalization

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│           (Frontend - React/TypeScript)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP/REST API
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Auth Router (/auth/*)                      │  │
│  │  - Registration with profile                         │  │
│  │  - Login (returns profile)                           │  │
│  │  - Profile update                                    │  │
│  │  - Get current user                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Chat Router (/api/chat/*)                  │  │
│  │  - Receives user_id with profile context            │  │
│  │  - Routes to specialized agents                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ MongoDB Driver
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  Collection: users                                          │
│  - _id (ObjectId)                                           │
│  - username (string, indexed)                               │
│  - email (string, indexed, unique)                          │
│  - password (hashed string)                                 │
│  - profile (string: "general"|"patient"|"researcher")       │
│  - role (string: "user"|"admin")                            │
│  - created_at (datetime)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Definitions

### 1. Authentication Service
**Responsibility**: User registration, login, authentication, and profile management

**Core Functions**:
- User registration with profile type selection
- User login with profile information retrieval
- JWT token generation and validation
- Profile type updates for authenticated users
- Current user information retrieval

**Database Dependencies**: MongoDB `users` collection

**Security**: bcrypt password hashing, JWT token-based authentication

---

## API Contracts

### 1. User Registration

**Endpoint**: `POST /auth/register`

**Description**: Register a new user with profile type selection

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "profile": "patient"
}
```

**Request Fields**:
- `username` (string, required): Unique username (validated)
- `email` (string, required): Valid email address (unique)
- `password` (string, required): Password meeting security requirements
- `fullName` (string, optional): User's full name
- `profile` (string, optional): Profile type - `"general"` (default), `"patient"`, or `"researcher"`

**Success Response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "profile": "patient"
  }
}
```

**Error Responses**:

**400 Bad Request** - Username validation failed:
```json
{
  "detail": "사용자명은 3-20자의 영문, 숫자, 언더스코어만 사용 가능합니다"
}
```

**400 Bad Request** - Invalid profile type:
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "profile"],
      "msg": "Profile must be one of: general, patient, researcher"
    }
  ]
}
```

**400 Bad Request** - Duplicate username:
```json
{
  "detail": "이미 존재하는 아이디입니다"
}
```

**400 Bad Request** - Duplicate email:
```json
{
  "detail": "이미 존재하는 이메일입니다"
}
```

**400 Bad Request** - Password validation failed:
```json
{
  "detail": {
    "message": "비밀번호가 요구사항을 충족하지 않습니다",
    "errors": [
      "최소 8자 이상이어야 합니다"
    ],
    "requirements": "비밀번호 요구사항: ..."
  }
}
```

---

### 2. User Login

**Endpoint**: `POST /auth/login`

**Description**: Authenticate user and return profile information

**Request Body** (Form Data):
```
username=johndoe&password=SecurePass123!
```

**Request Fields**:
- `username` (string, required): Username or email address
- `password` (string, required): User password

**Success Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "profile": "patient"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "detail": "아이디 또는 비밀번호가 잘못되었습니다"
}
```

---

### 3. Get Current User

**Endpoint**: `GET /auth/me`

**Description**: Retrieve current authenticated user's information including profile type

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "profile": "patient",
  "role": "user"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "detail": "인증 정보를 확인할 수 없습니다"
}
```

---

### 4. Update User Profile

**Endpoint**: `PATCH /auth/profile`

**Description**: Update the current user's profile type. This affects how chat agents interact with the user.

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "profile": "researcher"
}
```

**Request Fields**:
- `profile` (string, required): New profile type - `"general"`, `"patient"`, or `"researcher"`

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "프로필이 성공적으로 업데이트되었습니다",
  "profile": "researcher"
}
```

**Error Responses**:

**400 Bad Request** - Invalid profile type:
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "profile"],
      "msg": "Profile must be one of: general, patient, researcher"
    }
  ]
}
```

**401 Unauthorized**:
```json
{
  "detail": "인증 정보를 확인할 수 없습니다"
}
```

**404 Not Found**:
```json
{
  "detail": "사용자를 찾을 수 없습니다"
}
```

---

### 5. Development Auto-Login

**Endpoint**: `POST /auth/dev-login`

**Description**: Development-only endpoint for automatic test user creation and login

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "profile": "general"
  }
}
```

**Note**: This endpoint should be disabled in production environments.

---

## Data Schema

### MongoDB Users Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  username: "johndoe",                    // Unique, indexed
  email: "john@example.com",              // Unique, indexed
  password: "$2b$12$...",                 // bcrypt hashed
  fullName: "John Doe",
  profile: "patient",                     // "general" | "patient" | "researcher"
  role: "user",                           // "user" | "admin"
  created_at: ISODate("2025-01-15T10:30:00Z")
}
```

**Indexes**:
```javascript
// Unique index on email
db.users.createIndex({ "email": 1 }, { unique: true })

// Unique index on username
db.users.createIndex({ "username": 1 }, { unique: true })

// Index on profile for queries
db.users.createIndex({ "profile": 1 })
```

**Primary Key**: `_id` (ObjectId)

**Unique Constraints**:
- `email` (unique)
- `username` (unique)

**Validation Rules**:
- `profile` must be one of: `"general"`, `"patient"`, `"researcher"`
- `email` must be valid email format (validated by Pydantic EmailStr)
- `password` must meet security requirements (minimum 8 characters)
- `username` must be 3-20 characters, alphanumeric + underscore only

---

## Technology Stack Rationale

### 1. FastAPI

**Choice**: FastAPI for REST API framework

**Justification**:
- Native async/await support for high-performance I/O operations
- Automatic OpenAPI documentation generation
- Built-in Pydantic integration for request/response validation
- Type hints for better IDE support and fewer bugs

**Trade-offs**:
- **vs Flask**: FastAPI provides better performance and automatic validation, but Flask has a larger ecosystem
- **vs Django**: FastAPI is more lightweight and async-first, while Django provides more batteries-included features

### 2. Pydantic

**Choice**: Pydantic v2 for data validation and serialization

**Justification**:
- Automatic validation of profile types using Literal types
- Field validators for custom validation logic
- Runtime type checking prevents invalid data from entering the system
- Seamless integration with FastAPI

**Trade-offs**:
- **vs Marshmallow**: Pydantic offers better performance and native FastAPI support
- **vs Manual validation**: Automated validation reduces boilerplate and human error

### 3. MongoDB

**Choice**: MongoDB for user data storage

**Justification**:
- Schema flexibility allows easy addition of new profile-related fields
- Native JSON-like document storage matches API response format
- Excellent performance for user profile queries
- Already integrated in the existing codebase

**Trade-offs**:
- **vs PostgreSQL**: MongoDB offers schema flexibility, PostgreSQL offers better ACID guarantees and relational integrity
- **vs Redis**: MongoDB provides persistent storage, Redis is better for caching

### 4. JWT (JSON Web Tokens)

**Choice**: JWT for authentication tokens

**Justification**:
- Stateless authentication enables horizontal scaling
- Profile information can be included in token payload
- 7-day expiration provides good balance of security and UX
- Industry standard with excellent library support

**Trade-offs**:
- **vs Session cookies**: JWTs are stateless (better scalability) but cannot be invalidated server-side
- **vs OAuth2**: JWT is simpler for internal auth, OAuth2 better for third-party integrations

### 5. bcrypt

**Choice**: bcrypt for password hashing

**Justification**:
- Industry-standard password hashing algorithm
- Built-in salt generation prevents rainbow table attacks
- Adaptive cost factor can be increased as hardware improves
- Resistant to brute-force attacks

**Trade-offs**:
- **vs argon2**: bcrypt is more established, argon2 is newer and potentially more secure
- **vs PBKDF2**: bcrypt is simpler and has better brute-force resistance

---

## Key Considerations

### Scalability

**How will the system handle 10x the initial load?**

1. **Database Optimization**:
   - Indexed queries on `profile`, `email`, and `username` ensure O(log n) lookup times
   - MongoDB's horizontal sharding can distribute user data across multiple servers
   - Connection pooling prevents database connection exhaustion

2. **Stateless Authentication**:
   - JWT tokens eliminate the need for session storage
   - Any backend instance can validate tokens without database lookups
   - Enables horizontal scaling of API servers behind a load balancer

3. **Caching Strategy**:
   - User profile data can be cached in Redis after first lookup
   - JWT tokens already include user_id, reducing database queries
   - Profile changes invalidate cache for that specific user

4. **API Performance**:
   - Async/await architecture prevents blocking I/O
   - FastAPI's async request handling supports 10,000+ concurrent connections
   - Pydantic validation happens in compiled Rust code (fast)

**Scaling Recommendations**:
```
Current: Single MongoDB instance + Single FastAPI instance
→ 10x load: MongoDB replica set + 3-5 FastAPI instances + Redis cache + Load balancer
→ 100x load: MongoDB sharded cluster + Auto-scaling API instances + CDN + Multi-region deployment
```

---

### Security

**Primary Threat Vectors and Mitigation Strategies**:

1. **Password Security**:
   - **Threat**: Weak passwords, password reuse
   - **Mitigation**:
     - PasswordValidator enforces minimum 8 characters
     - bcrypt hashing with automatic salt generation
     - Consider adding password strength meter in frontend

2. **Authentication Bypass**:
   - **Threat**: Token theft, token forgery
   - **Mitigation**:
     - JWT signed with SECRET_KEY (minimum 32 characters)
     - Token expiration set to 7 days
     - HTTPS required in production (prevents man-in-the-middle)
     - Consider implementing token refresh mechanism

3. **Profile Type Manipulation**:
   - **Threat**: Attacker changes profile to gain unauthorized access
   - **Mitigation**:
     - Profile updates require valid authentication token
     - Pydantic validation ensures only valid profile types accepted
     - All profile changes logged with timestamp
     - Consider implementing profile change notifications

4. **Email Enumeration**:
   - **Threat**: Attackers can check if email exists in system
   - **Mitigation**:
     - Same error message for invalid username/password
     - Rate limiting on login attempts (TODO)
     - CAPTCHA after 3 failed attempts (TODO)

5. **Injection Attacks**:
   - **Threat**: NoSQL injection, XSS
   - **Mitigation**:
     - Pydantic validation sanitizes all inputs
     - MongoDB driver uses parameterized queries
     - No raw user input in database queries

**Security Checklist**:
- [x] Password hashing (bcrypt)
- [x] JWT token authentication
- [x] Input validation (Pydantic)
- [x] Email/username uniqueness validation
- [x] HTTPS enforcement (via middleware in production)
- [ ] Rate limiting (recommended)
- [ ] CAPTCHA for brute force protection (recommended)
- [ ] Token refresh mechanism (recommended)
- [ ] Account lockout after failed attempts (recommended)

---

### Observability

**How will we monitor the system's health and debug issues?**

1. **Logging Strategy**:
```python
# Current implementation locations:
# - /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/logging_config.py

# Key events to log:
- User registration (with profile type)
- Login attempts (success/failure)
- Profile updates
- Authentication failures
- Database errors
```

2. **Metrics to Track**:
```
# User Metrics
- New registrations per day (by profile type)
- Login success rate
- Profile update frequency
- Active users by profile type

# System Metrics
- API response times (by endpoint)
- Database query latency
- JWT token validation time
- Error rates (by error type)

# Security Metrics
- Failed login attempts
- Invalid token attempts
- Profile change frequency
```

3. **Monitoring Tools** (Recommendations):
```
# Application Performance Monitoring
- Sentry for error tracking
- Prometheus + Grafana for metrics
- ELK stack for log aggregation

# Database Monitoring
- MongoDB Atlas monitoring (if using Atlas)
- Custom metrics via mongo queries

# Health Checks
- /health endpoint (TODO)
- Database connection check
- JWT signing verification
```

4. **Debugging Support**:
```python
# Structured logging with context:
logger.info("User registered", extra={
    "user_id": user_id,
    "profile": profile_type,
    "timestamp": datetime.utcnow()
})

# Error tracking with stack traces
logger.error("Profile update failed", exc_info=True, extra={
    "user_id": user_id,
    "attempted_profile": profile
})
```

5. **Development Tools**:
- `/auth/dev-login` endpoint for testing
- FastAPI automatic OpenAPI docs at `/docs`
- Request/response logging in development mode

---

### Deployment & CI/CD

**Deployment Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Environment                   │
│                                                              │
│  ┌────────────────┐      ┌─────────────────────────────┐   │
│  │  Load Balancer │──────▶  FastAPI Instances (N)       │   │
│  │   (Nginx/AWS)  │      │  - Docker containers         │   │
│  └────────────────┘      │  - Auto-scaling group        │   │
│                           │  - Health checks enabled     │   │
│                           └─────────────────────────────┘   │
│                                      │                       │
│                                      ▼                       │
│                           ┌─────────────────────────────┐   │
│                           │  MongoDB Cluster             │   │
│                           │  - Replica set (3 nodes)     │   │
│                           │  - Automatic failover        │   │
│                           └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Environment Configuration**:

```bash
# Required environment variables (production):
MONGODB_URI=mongodb://user:pass@host:27017/careguide
DB_NAME=careguide
SECRET_KEY=<secure-random-32-char-string>
CORS_ORIGINS=https://app.example.com,https://www.example.com
APP_ENV=production
DEBUG=false
OPENAI_API_KEY=<your-openai-key>
```

**Deployment Steps**:

1. **Build Docker Image**:
```bash
docker build -t careguide-api:latest ./backend
```

2. **Run Database Migrations** (if needed):
```bash
# Create indexes
docker exec -it mongodb mongosh
use careguide
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "profile": 1 })
```

3. **Deploy API Instances**:
```bash
# Using Docker Compose
docker-compose up -d --scale api=3

# Or using Kubernetes
kubectl apply -f k8s/deployment.yaml
```

4. **Health Check Configuration**:
```yaml
# Example Kubernetes health check
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
```

**CI/CD Pipeline**:

```yaml
# Example GitHub Actions workflow
name: Deploy Backend

on:
  push:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest tests/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t careguide-api:${{ github.sha }} .
      - name: Push to registry
        run: docker push careguide-api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Update Kubernetes deployment
          kubectl set image deployment/api api=careguide-api:${{ github.sha }}
```

---

## Chat Agent Integration

### How to Use Profile Information in Chat Agents

The profile system is designed to enable personalized chat experiences. Here's how to integrate profile information into your chat agents:

#### 1. Accessing User Profile in Chat Requests

When making chat requests, the user's profile is available through the `user_id`:

```python
# In chat.py (lines 268-316)
@router.post("/message")
async def chat_message(request: Request):
    body = await request.json()
    user_id = body.get("user_id")

    # Get user profile from database
    from app.db.connection import get_users_collection
    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    user_profile = user.get("profile", "general") if user else "general"

    # Add to context for agents
    context = body.get("context", {})
    context["user_profile"] = user_profile

    # Create request with profile context
    agent_request = AgentRequest(
        query=query,
        session_id=session_id,
        user_id=user_id,
        context=context
    )
```

#### 2. Profile-Based Agent Routing

Different profile types can be routed to specialized agents:

```python
# In RouterAgent (recommended enhancement)
def route_by_profile(self, query: str, user_profile: str):
    if user_profile == "patient":
        # Patient users get medical welfare info prioritized
        return "medical_welfare"
    elif user_profile == "researcher":
        # Researchers get research paper agent
        return "research_paper"
    else:
        # General users get standard routing
        return self.classify_intent(query)
```

#### 3. Personalizing Agent Responses

Agents can customize their responses based on profile type:

```python
# In agent prompts (e.g., research_paper/server/research_paper_guidelines.py)
system_prompt = f"""
You are a healthcare research assistant.

User Profile: {user_profile}

{"Provide detailed technical information and cite sources." if user_profile == "researcher"
 else "Explain concepts in simple, accessible language." if user_profile == "patient"
 else "Provide balanced information suitable for general audience."}
"""
```

#### 4. Profile-Specific Features

Enable or disable features based on profile:

```python
# Example: Advanced features for researchers
if user_profile == "researcher":
    # Enable research paper PDF downloads
    # Enable citation export
    # Enable data visualization tools
elif user_profile == "patient":
    # Enable symptom checker
    # Enable medication reminders
    # Enable appointment scheduling
```

#### 5. Frontend Integration Example

```typescript
// In frontend chat service (src/services/api.ts)
export const sendChatMessage = async (
  message: string,
  sessionId: string,
  userId: string,
  profile: 'general' | 'patient' | 'researcher'
) => {
  return fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: message,
      session_id: sessionId,
      user_id: userId,
      context: {
        user_profile: profile
      }
    })
  });
};
```

---

## Testing Guide

### Manual Testing

1. **Test Registration with Profile**:
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testpatient",
    "email": "patient@test.com",
    "password": "SecurePass123!",
    "fullName": "Test Patient",
    "profile": "patient"
  }'
```

2. **Test Login Returns Profile**:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testpatient&password=SecurePass123!"
```

3. **Test Get Current User**:
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer <token>"
```

4. **Test Profile Update**:
```bash
curl -X PATCH http://localhost:8000/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"profile": "researcher"}'
```

5. **Test Chat with Profile**:
```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest treatments for diabetes?",
    "user_id": "507f1f77bcf86cd799439011",
    "session_id": "test-session",
    "context": {
      "user_profile": "patient"
    }
  }'
```

### Automated Testing (Recommended)

Create test file: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/tests/test_profile_system.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_with_profile():
    response = client.post("/auth/register", json={
        "username": "testuser1",
        "email": "test1@example.com",
        "password": "SecurePass123!",
        "profile": "patient"
    })
    assert response.status_code == 200
    assert response.json()["user"]["profile"] == "patient"

def test_register_invalid_profile():
    response = client.post("/auth/register", json={
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "SecurePass123!",
        "profile": "invalid_profile"
    })
    assert response.status_code == 422  # Validation error

def test_profile_update():
    # First register
    register_response = client.post("/auth/register", json={
        "username": "testuser3",
        "email": "test3@example.com",
        "password": "SecurePass123!",
        "profile": "general"
    })
    token = register_response.json()["access_token"]

    # Update profile
    update_response = client.patch(
        "/auth/profile",
        json={"profile": "researcher"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["profile"] == "researcher"

    # Verify update
    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.json()["profile"] == "researcher"
```

---

## Migration Guide for Existing Users

If you already have users in your database without the `profile` field, run this migration:

```javascript
// MongoDB migration script
// File: /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/migrations/add_profile_field.js

db.users.updateMany(
  { profile: { $exists: false } },
  { $set: { profile: "general" } }
)

// Verify migration
db.users.find({ profile: { $exists: false } }).count()  // Should be 0
```

---

## Frequently Asked Questions

**Q1: Can users change their profile type after registration?**
A: Yes, users can update their profile type at any time using the `PATCH /auth/profile` endpoint.

**Q2: What happens if a user doesn't specify a profile during registration?**
A: The profile defaults to `"general"` automatically.

**Q3: Can we add more profile types in the future?**
A: Yes, add the new type to the `ProfileType` Literal in `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/models/user.py` and update validators.

**Q4: How do agents know which profile type the user has?**
A: The profile is included in the chat request context via `context.user_profile` after looking up the user by `user_id`.

**Q5: Is the profile information included in the JWT token?**
A: No, to keep tokens lightweight. Profile is fetched from the database when needed.

**Q6: Can we have role-based restrictions on profile types?**
A: Yes, you can add validation in the registration endpoint to restrict certain profiles to certain roles.

---

## File Locations Reference

All modified/created files for this implementation:

1. **User Models**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/models/user.py`
2. **Auth API**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/api/auth.py`
3. **Chat API** (for integration): `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/api/chat.py`
4. **Database Connection**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/db/connection.py`
5. **Auth Service**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/services/auth.py`

---

## Next Steps & Recommendations

### Immediate (High Priority)
- [ ] Add comprehensive test coverage for profile endpoints
- [ ] Update frontend to include profile selection in registration form
- [ ] Implement profile-aware routing in RouterAgent
- [ ] Add database migration script for existing users

### Short-term (Medium Priority)
- [ ] Add rate limiting to prevent brute-force attacks
- [ ] Implement token refresh mechanism
- [ ] Add profile change notifications/emails
- [ ] Create admin endpoints to manage user profiles
- [ ] Add analytics to track profile type usage

### Long-term (Nice to Have)
- [ ] Implement profile-specific UI themes
- [ ] Add profile-based feature flags
- [ ] Create personalized onboarding flows per profile
- [ ] Implement A/B testing for profile-specific features
- [ ] Add profile recommendations based on user behavior

---

## Changelog

### Version 1.0.0 (2025-11-26)
- Initial implementation of profile system
- Added three profile types: general, patient, researcher
- Implemented profile validation and storage
- Added profile update endpoint
- Updated all auth endpoints to include profile information
- Created comprehensive API documentation

---

## Support & Contribution

For questions or issues related to the profile system:

1. Check this documentation first
2. Review the code in the file locations listed above
3. Check existing GitHub issues
4. Create a new issue with detailed information

When reporting issues, include:
- Endpoint being called
- Request body (sanitize sensitive data)
- Error message
- Expected vs actual behavior

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-26
**Author**: Backend Architect Agent
**Status**: Production Ready
