# MyPage API Documentation

**Backend API documentation for CarePlus MyPage features**

---

## 1. Executive Summary

This document provides comprehensive API specifications for the MyPage feature set in CarePlus, a healthcare/wellness application. The APIs enable users to manage their profiles, health information, preferences, bookmarked research papers, and view their community activity.

**Technology Stack:**
- FastAPI (Python web framework)
- MongoDB (Database)
- JWT Authentication (Bearer token)
- Pydantic (Data validation)

**Base URL:** `http://localhost:8000/api/mypage`

**Authentication:** All endpoints require JWT Bearer token in the Authorization header.

---

## 2. Architecture Overview

### System Components

1. **User Profile Service**: Manages user account information (name, bio, profile image)
2. **Health Profile Service**: Stores and manages health-related data (conditions, allergies, dietary restrictions)
3. **Preferences Service**: Handles user settings (theme, language, notification preferences)
4. **Bookmarks Service**: Manages saved research papers
5. **User Posts Service**: Retrieves user's community posts

### MongoDB Collections

- `users` - User account data
- `health_profiles` - Health profile data per user
- `user_preferences` - User preference settings
- `bookmarks` - Bookmarked research papers
- `posts` - Community posts (existing collection)

### Data Flow

```
Client → API Gateway → Authentication Middleware → MyPage Router → MongoDB Collections
                                   ↓
                           JWT Token Validation
                                   ↓
                        Extract current_user from token
```

---

## 3. Service Definitions

### 3.1 User Profile Service

**Responsibilities:**
- Retrieve current user's profile information
- Update user profile fields (fullName, bio, profileImage)
- Return standardized profile data

**Key Features:**
- Partial updates supported (only update provided fields)
- Automatic timestamp management

### 3.2 Health Profile Service

**Responsibilities:**
- Manage health-related user information
- Store chronic conditions, allergies, dietary restrictions
- Track age and gender for personalized recommendations

**Key Features:**
- Upsert operations (create if not exists, update if exists)
- Returns empty default profile if no data exists

### 3.3 Preferences Service

**Responsibilities:**
- Store UI/UX preferences (theme, language)
- Manage notification settings per category
- Sync user settings across devices

**Key Features:**
- Default preference values
- Granular notification control (email, push, community, trends)

### 3.4 Bookmarks Service

**Responsibilities:**
- Save research papers for later reference
- Provide paginated access to bookmarks
- Prevent duplicate bookmarks

**Key Features:**
- Pagination support for large bookmark lists
- Store complete paper metadata
- Duplicate detection

### 3.5 User Posts Service

**Responsibilities:**
- Retrieve user's community posts
- Support pagination for post history
- Filter out deleted posts

**Key Features:**
- Read-only access (creation/editing handled by Community API)
- Pagination for performance
- Chronological ordering (newest first)

---

## 4. API Contracts

### 4.1 User Profile APIs

#### GET `/api/mypage/profile`

**Description:** Get current user's profile information

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "홍길동",
  "bio": "건강한 삶을 추구합니다",
  "profileImage": "/uploads/profile_123.jpg",
  "profile": "patient",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

#### PUT `/api/mypage/profile`

**Description:** Update current user's profile

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "홍길동",
  "bio": "건강한 삶을 추구하는 환자입니다",
  "profileImage": "/uploads/profile_123.jpg"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Success Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "홍길동",
  "bio": "건강한 삶을 추구하는 환자입니다",
  "profileImage": "/uploads/profile_123.jpg",
  "profile": "patient",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - No fields provided to update
- `401 Unauthorized` - Invalid JWT token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

### 4.2 Health Profile APIs

#### GET `/api/mypage/health-profile`

**Description:** Get current user's health profile

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "conditions": ["고혈압", "당뇨"],
  "allergies": ["땅콩", "새우"],
  "dietaryRestrictions": ["저염식", "저당식"],
  "age": 45,
  "gender": "male",
  "updatedAt": "2024-01-20T14:30:00Z"
}
```

**Note:** If no health profile exists, returns empty default values:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "conditions": [],
  "allergies": [],
  "dietaryRestrictions": [],
  "age": null,
  "gender": null,
  "updatedAt": null
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid JWT token
- `500 Internal Server Error` - Server error

---

#### PUT `/api/mypage/health-profile`

**Description:** Update health profile (creates if not exists)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "conditions": ["고혈압", "당뇨"],
  "allergies": ["땅콩"],
  "dietaryRestrictions": ["저염식"],
  "age": 45,
  "gender": "male"
}
```

**Field Validation:**
- `conditions`, `allergies`, `dietaryRestrictions`: Array of strings
- `age`: Integer between 1 and 150
- `gender`: String ("male", "female", "other")
- All fields are optional

**Success Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "conditions": ["고혈압", "당뇨"],
  "allergies": ["땅콩"],
  "dietaryRestrictions": ["저염식"],
  "age": 45,
  "gender": "male",
  "updatedAt": "2024-01-20T14:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid field values (e.g., age out of range)
- `401 Unauthorized` - Invalid JWT token
- `500 Internal Server Error` - Server error

---

### 4.3 User Preferences APIs

#### GET `/api/mypage/preferences`

**Description:** Get user preferences (theme, language, notifications)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "theme": "light",
  "language": "ko",
  "notifications": {
    "email": true,
    "push": true,
    "community": true,
    "trends": true
  },
  "updatedAt": "2024-01-20T14:30:00Z"
}
```

**Default Values (if no preferences exist):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "theme": "light",
  "language": "ko",
  "notifications": {
    "email": true,
    "push": true,
    "community": true,
    "trends": true
  },
  "updatedAt": null
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid JWT token
- `500 Internal Server Error` - Server error

---

#### PUT `/api/mypage/preferences`

**Description:** Update user preferences

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "theme": "dark",
  "language": "en",
  "notifications": {
    "email": true,
    "push": false,
    "community": true,
    "trends": false
  }
}
```

**Field Options:**
- `theme`: "light" or "dark"
- `language`: "ko" or "en"
- `notifications`: Object with boolean values for each notification type

**Success Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "theme": "dark",
  "language": "en",
  "notifications": {
    "email": true,
    "push": false,
    "community": true,
    "trends": false
  },
  "updatedAt": "2024-01-20T15:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid JWT token
- `500 Internal Server Error` - Server error

---

### 4.4 Bookmarks APIs

#### GET `/api/mypage/bookmarks?limit=20&offset=0`

**Description:** Get user's bookmarked papers with pagination

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `limit` (optional): Number of bookmarks to return (default: 20, max: 50)
- `offset` (optional): Number of bookmarks to skip (default: 0)

**Success Response (200 OK):**
```json
{
  "bookmarks": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "paperId": "12345678",
      "paperData": {
        "title": "Research on Hypertension Treatment",
        "authors": ["Kim, J.", "Lee, S."],
        "abstract": "This study investigates...",
        "pub_date": "2024-01-15",
        "journal": "Medical Journal"
      },
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid JWT token
- `500 Internal Server Error` - Server error

---

#### POST `/api/mypage/bookmarks`

**Description:** Add a paper to bookmarks

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paperId": "12345678",
  "paperData": {
    "title": "Research on Hypertension Treatment",
    "authors": ["Kim, J.", "Lee, S."],
    "abstract": "This study investigates...",
    "pub_date": "2024-01-15",
    "journal": "Medical Journal"
  }
}
```

**Success Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "paperId": "12345678",
  "paperData": {
    "title": "Research on Hypertension Treatment",
    "authors": ["Kim, J.", "Lee, S."],
    "abstract": "This study investigates...",
    "pub_date": "2024-01-15",
    "journal": "Medical Journal"
  },
  "createdAt": "2024-01-20T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Paper already bookmarked
- `401 Unauthorized` - Invalid JWT token
- `500 Internal Server Error` - Server error

---

#### DELETE `/api/mypage/bookmarks/{paper_id}`

**Description:** Remove a paper from bookmarks

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters:**
- `paper_id`: Paper ID (PMID or unique identifier)

**Success Response (204 No Content):**
No response body

**Error Responses:**
- `401 Unauthorized` - Invalid JWT token
- `404 Not Found` - Bookmark not found
- `500 Internal Server Error` - Server error

---

### 4.5 User Posts APIs

#### GET `/api/mypage/posts?limit=20&offset=0`

**Description:** Get user's community posts with pagination

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `limit` (optional): Number of posts to return (default: 20, max: 50)
- `offset` (optional): Number of posts to skip (default: 0)

**Success Response (200 OK):**
```json
{
  "posts": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "authorName": "홍길동",
      "title": "저염식 시작했어요!",
      "content": "오늘부터 저염식 시작합니다. 같이 하실 분?",
      "postType": "BOARD",
      "imageUrls": ["/uploads/image1.jpg"],
      "thumbnailUrl": "/uploads/image1.jpg",
      "likes": 5,
      "commentCount": 3,
      "viewCount": 42,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "lastActivityAt": "2024-01-16T14:20:00Z",
      "isPinned": false,
      "isDeleted": false
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0,
  "hasMore": false
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid JWT token
- `500 Internal Server Error` - Server error

---

## 5. Data Schema

### 5.1 Users Collection (Existing - Extended)

```javascript
{
  _id: ObjectId,
  username: String,           // Unique username
  email: String,              // Unique email
  password: String,           // Hashed password
  fullName: String,           // Full name (NEW)
  bio: String,                // User bio/description (NEW)
  profileImage: String,       // Profile image URL (NEW)
  profile: String,            // Profile type: "general" | "patient" | "researcher"
  role: String,               // "user" | "admin"
  parlant_customer_id: String,
  created_at: ISODate,
  updated_at: ISODate         // NEW
}

// Indexes
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
```

### 5.2 Health Profiles Collection (New)

```javascript
{
  _id: ObjectId,
  userId: String,                    // User ID (indexed)
  conditions: [String],              // Health conditions
  allergies: [String],               // Allergies
  dietaryRestrictions: [String],     // Dietary restrictions
  age: Number,                       // Age (1-150)
  gender: String,                    // "male" | "female" | "other"
  updatedAt: ISODate
}

// Indexes
db.health_profiles.createIndex({ "userId": 1 }, { unique: true })
```

### 5.3 User Preferences Collection (New)

```javascript
{
  _id: ObjectId,
  userId: String,                    // User ID (indexed)
  theme: String,                     // "light" | "dark"
  language: String,                  // "ko" | "en"
  notifications: {
    email: Boolean,
    push: Boolean,
    community: Boolean,
    trends: Boolean
  },
  updatedAt: ISODate
}

// Indexes
db.user_preferences.createIndex({ "userId": 1 }, { unique: true })
```

### 5.4 Bookmarks Collection (New)

```javascript
{
  _id: ObjectId,
  userId: String,                    // User ID (indexed)
  paperId: String,                   // Paper PMID or unique identifier
  paperData: {
    title: String,
    authors: [String],
    abstract: String,
    pub_date: String,
    journal: String,
    // ... other paper metadata
  },
  createdAt: ISODate
}

// Indexes
db.bookmarks.createIndex({ "userId": 1, "paperId": 1 }, { unique: true })
db.bookmarks.createIndex({ "userId": 1, "createdAt": -1 })
```

### 5.5 Posts Collection (Existing - Used for User Posts Query)

```javascript
{
  _id: ObjectId,
  userId: String,                    // Post author (indexed)
  authorName: String,
  title: String,
  content: String,
  postType: String,                  // "BOARD" | "CHALLENGE" | "SURVEY"
  imageUrls: [String],
  thumbnailUrl: String,
  likes: Number,
  commentCount: Number,
  viewCount: Number,
  createdAt: ISODate,
  updatedAt: ISODate,
  lastActivityAt: ISODate,
  isPinned: Boolean,
  isDeleted: Boolean
}

// Indexes
db.posts.createIndex({ "userId": 1, "isDeleted": 1, "createdAt": -1 })
```

---

## 6. Technology Stack Rationale

### 6.1 FastAPI (Python Web Framework)

**Justification:**
- Already used in the existing CarePlus backend
- Built-in support for async/await operations for MongoDB queries
- Automatic API documentation generation (OpenAPI/Swagger)
- Excellent Pydantic integration for data validation

**Trade-offs:**
- **FastAPI vs Django REST Framework**: FastAPI chosen for better async support and lighter weight, which is ideal for microservices architecture. Django would provide more built-in admin features but with higher overhead.

### 6.2 MongoDB (NoSQL Database)

**Justification:**
- Existing database choice for CarePlus
- Schema flexibility for health profiles and preferences (different users may have different fields)
- Good performance for document-based queries
- Native support for nested objects (notifications, paperData)

**Trade-offs:**
- **MongoDB vs PostgreSQL**: MongoDB chosen for schema flexibility and existing infrastructure. PostgreSQL would provide better relational integrity and ACID compliance, but requires more rigid schemas.

### 6.3 JWT Authentication (Bearer Token)

**Justification:**
- Existing authentication mechanism in CarePlus
- Stateless authentication (no server-side session storage)
- Works well with single-page applications (SPAs)
- Easy to implement role-based access control

**Trade-offs:**
- **JWT vs Session-based Auth**: JWT chosen for statelessness and scalability. Session-based auth would provide easier token revocation but requires centralized session storage.

### 6.4 Pydantic (Data Validation)

**Justification:**
- Native FastAPI integration
- Type-safe data models with automatic validation
- Clear error messages for invalid inputs
- Generates OpenAPI schemas automatically

**Trade-offs:**
- **Pydantic vs Marshmallow**: Pydantic chosen for better FastAPI integration and performance. Marshmallow provides more flexible serialization but with slower validation.

---

## 7. Key Considerations

### 7.1 Scalability

**Current Load Handling:**
- Designed for 100-1,000 concurrent users
- Pagination implemented for bookmarks and posts (prevents large result sets)
- MongoDB indexes on frequently queried fields

**10x Scaling Strategy:**
1. **Database Level:**
   - Add MongoDB replica sets for read scaling
   - Implement sharding on userId for horizontal scaling
   - Use connection pooling (already in Motor driver)

2. **Application Level:**
   - Deploy multiple FastAPI instances behind a load balancer
   - Implement Redis caching for frequently accessed data (profiles, preferences)
   - Add rate limiting to prevent API abuse

3. **Infrastructure:**
   - Use CDN for profile images
   - Implement database query result caching
   - Monitor query performance and add indexes as needed

### 7.2 Security

**Primary Threat Vectors:**

1. **Unauthorized Access:**
   - **Mitigation**: All endpoints require JWT authentication
   - **Mitigation**: Token expiration set to 7 days (configurable)
   - **Mitigation**: User can only access their own data (userId validation)

2. **Data Injection:**
   - **Mitigation**: Pydantic validates all input data
   - **Mitigation**: MongoDB parameterized queries prevent NoSQL injection
   - **Mitigation**: Field length limits prevent excessive data storage

3. **Privacy Leaks:**
   - **Mitigation**: Health data isolated in separate collection
   - **Mitigation**: No exposure of other users' health profiles
   - **Mitigation**: Response models explicitly define returned fields

4. **Session Hijacking:**
   - **Mitigation**: JWT tokens signed with secret key
   - **Mitigation**: HTTPS enforced in production (recommended)
   - **Mitigation**: Short token expiration time

**Additional Security Measures:**
- Input sanitization for bio and profile image URLs
- File upload validation for profile images (type, size)
- Rate limiting on API endpoints (recommended)

### 7.3 Observability

**Monitoring Strategy:**

1. **Application Logs:**
   - Structured logging with Python's logging module
   - Log levels: INFO for operations, ERROR for failures
   - Includes user IDs for traceability

2. **Health Checks:**
   - `/api/mypage/health` endpoint for service status
   - Returns status of all sub-services

3. **Error Tracking:**
   - All exceptions logged with stack traces
   - HTTP error codes clearly mapped to issues
   - User-friendly error messages in responses

4. **Performance Metrics (Recommended):**
   - Request duration tracking
   - Database query performance monitoring
   - API endpoint usage analytics

**Debugging Workflow:**
1. Check health endpoint status
2. Review application logs for error messages
3. Verify MongoDB connection and collection indexes
4. Test JWT token validity
5. Validate request payload against Pydantic models

### 7.4 Deployment & CI/CD

**Deployment Architecture:**

1. **Development Environment:**
   - Local FastAPI server with hot-reload
   - Local MongoDB instance
   - JWT secret key from environment variables

2. **Production Environment:**
   - FastAPI deployed via Uvicorn/Gunicorn
   - MongoDB Atlas or self-hosted MongoDB cluster
   - Environment variables for configuration (`.env` file)
   - HTTPS/SSL certificates for secure communication

**CI/CD Pipeline (Recommended):**

```yaml
# Example GitHub Actions workflow
name: Deploy MyPage API

on:
  push:
    branches: [main, develop]

jobs:
  test:
    - Install dependencies (requirements.txt)
    - Run unit tests (pytest)
    - Run linting (flake8, black)
    - Run type checking (mypy)

  deploy:
    - Build Docker image
    - Push to container registry
    - Deploy to production server
    - Run smoke tests
    - Monitor error rates
```

**Database Migration Strategy:**
- New collections automatically created on first insert (MongoDB)
- Schema changes handled via Pydantic model updates
- Backward compatibility maintained for existing data
- Data migration scripts for breaking changes

---

## 8. Testing Guide

### 8.1 Manual Testing with cURL

**Get User Profile:**
```bash
curl -X GET "http://localhost:8000/api/mypage/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update User Profile:**
```bash
curl -X PUT "http://localhost:8000/api/mypage/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "홍길동",
    "bio": "건강한 삶을 추구합니다"
  }'
```

**Get Health Profile:**
```bash
curl -X GET "http://localhost:8000/api/mypage/health-profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update Health Profile:**
```bash
curl -X PUT "http://localhost:8000/api/mypage/health-profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": ["고혈압", "당뇨"],
    "allergies": ["땅콩"],
    "age": 45,
    "gender": "male"
  }'
```

**Add Bookmark:**
```bash
curl -X POST "http://localhost:8000/api/mypage/bookmarks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paperId": "12345678",
    "paperData": {
      "title": "Research on Hypertension",
      "authors": ["Kim, J."],
      "abstract": "This study...",
      "pub_date": "2024-01-15"
    }
  }'
```

### 8.2 Frontend Integration Example (TypeScript)

```typescript
// Example API service for MyPage
const API_BASE = 'http://localhost:8000';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profileImage?: string;
  profile: 'general' | 'patient' | 'researcher';
  role: string;
  createdAt: string;
}

async function getUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/mypage/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

async function updateUserProfile(
  token: string,
  updates: { fullName?: string; bio?: string; profileImage?: string }
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/mypage/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}
```

---

## 9. Implementation Summary

### Implemented Endpoints

✅ **User Profile**
- `GET /api/mypage/profile` - Get user profile
- `PUT /api/mypage/profile` - Update user profile

✅ **Health Profile**
- `GET /api/mypage/health-profile` - Get health profile
- `PUT /api/mypage/health-profile` - Update health profile

✅ **User Preferences**
- `GET /api/mypage/preferences` - Get preferences
- `PUT /api/mypage/preferences` - Update preferences

✅ **Bookmarks**
- `GET /api/mypage/bookmarks` - Get bookmarks (paginated)
- `POST /api/mypage/bookmarks` - Add bookmark
- `DELETE /api/mypage/bookmarks/{paper_id}` - Remove bookmark

✅ **User Posts**
- `GET /api/mypage/posts` - Get user's community posts (paginated)

✅ **Health Check**
- `GET /api/mypage/health` - Service health check

### File Locations

- **API Router**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/api/mypage.py`
- **Router Registration**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/api/careguide.py`
- **Documentation**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/MYPAGE_API_DOCUMENTATION.md`

### Next Steps for Frontend Integration

1. **Create MyPage UI Components:**
   - Profile editing form
   - Health profile form
   - Preferences/settings page
   - Bookmarks list with pagination
   - User posts list

2. **API Service Integration:**
   - Create TypeScript API service file
   - Add error handling and loading states
   - Implement optimistic updates for better UX

3. **State Management:**
   - Store user profile in context/state
   - Cache preferences locally
   - Sync bookmarks across components

4. **Testing:**
   - Test all endpoints with valid JWT tokens
   - Verify pagination works correctly
   - Test error scenarios (401, 404, 500)

---

## 10. API Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/mypage/profile` | GET | ✅ | Get user profile |
| `/api/mypage/profile` | PUT | ✅ | Update user profile |
| `/api/mypage/health-profile` | GET | ✅ | Get health profile |
| `/api/mypage/health-profile` | PUT | ✅ | Update health profile |
| `/api/mypage/preferences` | GET | ✅ | Get user preferences |
| `/api/mypage/preferences` | PUT | ✅ | Update preferences |
| `/api/mypage/bookmarks` | GET | ✅ | Get bookmarks |
| `/api/mypage/bookmarks` | POST | ✅ | Add bookmark |
| `/api/mypage/bookmarks/{id}` | DELETE | ✅ | Remove bookmark |
| `/api/mypage/posts` | GET | ✅ | Get user posts |
| `/api/mypage/health` | GET | ❌ | Health check |

---

**Document Version:** 1.0
**Last Updated:** 2025-01-26
**Author:** Backend Architect Agent (Claude Code)
