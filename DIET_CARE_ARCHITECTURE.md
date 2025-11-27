# Diet Care Backend Architecture

## 1. Executive Summary

This document outlines the production-ready backend architecture for the Diet Care feature, which provides nutrition analysis, meal logging, goal tracking, and progress monitoring for CKD (Chronic Kidney Disease) patients. The architecture follows clean architecture principles with clear separation of concerns across API, Service, Repository, and Data layers. The implementation leverages the existing FastAPI + MongoDB stack and introduces GPT-4 Vision for nutrition analysis from food images.

**Key Design Decisions:**
- Repository pattern for data access abstraction
- Service layer for business logic encapsulation
- Custom exception hierarchy for domain-specific errors
- MongoDB for flexible schema with proper indexing
- Redis caching for session and goal data (optional, with in-memory fallback)
- Rate limiting to control API costs and prevent abuse

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Frontend)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────┐
│                      API Layer (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/diet/* - DietRouter (diet.py)                      │  │
│  │  - POST   /analyze     (Nutrition analysis via GPT-4V)   │  │
│  │  - POST   /meals       (Log meal)                        │  │
│  │  - GET    /meals       (Get meal history)                │  │
│  │  - GET    /goals       (Get user goals)                  │  │
│  │  - PUT    /goals       (Update goals)                    │  │
│  │  - GET    /progress    (Get daily/weekly progress)       │  │
│  │  - GET    /streak      (Get logging streak)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     Service Layer                               │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ Nutrition      │  │ Meal        │  │ Goal             │    │
│  │ Analyzer       │  │ Service     │  │ Service          │    │
│  │ (GPT-4 Vision) │  │             │  │                  │    │
│  └────────────────┘  └─────────────┘  └──────────────────┘    │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ Progress       │  │ Streak      │  │ Session          │    │
│  │ Service        │  │ Service     │  │ Service          │    │
│  └────────────────┘  └─────────────┘  └──────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   Repository Layer                              │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ Session        │  │ Meal        │  │ Goal             │    │
│  │ Repository     │  │ Repository  │  │ Repository       │    │
│  └────────────────┘  └─────────────┘  └──────────────────┘    │
│  ┌────────────────┐  ┌─────────────┐                          │
│  │ Analysis       │  │ Streak      │                          │
│  │ Repository     │  │ Repository  │                          │
│  └────────────────┘  └─────────────┘                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Data Layer (MongoDB)                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Collections:                                          │    │
│  │  - diet_sessions                                       │    │
│  │  - diet_goals                                          │    │
│  │  - meal_logs                                           │    │
│  │  - nutrition_analyses                                  │    │
│  │  - user_streaks                                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              External Dependencies                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │ OpenAI       │  │ Redis        │  │ Rate Limiter     │     │
│  │ GPT-4 Vision │  │ (Optional)   │  │ (SlowAPI)        │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Service Definitions

### 3.1 Session Service
**Responsibility:** Manage analysis sessions with hourly rate limits
- Create new sessions for users
- Track analysis count per session
- Enforce 10 analyses per hour limit
- Expire sessions after 1 hour

### 3.2 Nutrition Analyzer Service
**Responsibility:** Analyze food images using GPT-4 Vision
- Process food images via OpenAI Vision API
- Extract nutritional information (sodium, protein, potassium, phosphorus)
- Parse structured JSON responses
- Handle API errors and retries

### 3.3 Meal Service
**Responsibility:** Manage meal logging and history
- Create meal log entries
- Retrieve meal history with pagination
- Calculate daily/weekly aggregates
- Update/delete meal logs

### 3.4 Goal Service
**Responsibility:** Manage user dietary goals
- Set/update nutritional goals based on CKD stage
- Retrieve current goals with caching
- Validate goal ranges
- Provide default goals by CKD stage

### 3.5 Progress Service
**Responsibility:** Calculate progress against goals
- Daily progress calculation
- Weekly trends analysis
- Adherence percentage
- Violation detection

### 3.6 Streak Service
**Responsibility:** Track consecutive logging streaks
- Update streak on meal log
- Calculate current/longest streaks
- Maintain logging history
- Reset streak on missed days

## 4. API Contracts

### 4.1 POST /api/diet/analyze
Analyze food image using GPT-4 Vision.

**Request:**
```json
{
  "image_url": "https://example.com/food.jpg",
  "user_id": "507f1f77bcf86cd799439011"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "analysis": {
    "foods": [
      {
        "name": "현미밥",
        "portion_g": 210,
        "sodium_mg": 2,
        "protein_g": 5.2,
        "potassium_mg": 157,
        "phosphorus_mg": 189
      }
    ],
    "total_nutrients": {
      "sodium_mg": 2,
      "protein_g": 5.2,
      "potassium_mg": 157,
      "phosphorus_mg": 189
    },
    "analysis_id": "507f1f77bcf86cd799439012",
    "remaining_analyses": 9
  }
}
```

**Error Responses:**
- 400 Bad Request: Invalid image URL
- 429 Too Many Requests: Rate limit exceeded (10/hour)
- 500 Internal Server Error: OpenAI API error

### 4.2 POST /api/diet/meals
Log a meal entry.

**Request:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "meal_type": "breakfast",
  "foods": [
    {
      "name": "현미밥",
      "portion_g": 210,
      "sodium_mg": 2,
      "protein_g": 5.2,
      "potassium_mg": 157,
      "phosphorus_mg": 189
    }
  ],
  "total_nutrients": {
    "sodium_mg": 2,
    "protein_g": 5.2,
    "potassium_mg": 157,
    "phosphorus_mg": 189
  },
  "logged_at": "2025-11-27T09:30:00Z"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "meal": {
    "id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439011",
    "meal_type": "breakfast",
    "foods": [...],
    "total_nutrients": {...},
    "logged_at": "2025-11-27T09:30:00Z",
    "created_at": "2025-11-27T09:35:00Z"
  },
  "streak": {
    "current": 5,
    "longest": 12
  }
}
```

**Error Responses:**
- 400 Bad Request: Invalid meal data
- 429 Too Many Requests: Rate limit exceeded (50/day)

### 4.3 GET /api/diet/meals
Get meal history with pagination.

**Query Parameters:**
- `user_id` (required): User ID
- `start_date` (optional): ISO 8601 date
- `end_date` (optional): ISO 8601 date
- `meal_type` (optional): breakfast, lunch, dinner, snack
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "meals": [
    {
      "id": "507f1f77bcf86cd799439013",
      "meal_type": "breakfast",
      "foods": [...],
      "total_nutrients": {...},
      "logged_at": "2025-11-27T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 4.4 GET /api/diet/goals
Get user's dietary goals.

**Query Parameters:**
- `user_id` (required): User ID

**Success Response (200):**
```json
{
  "success": true,
  "goals": {
    "id": "507f1f77bcf86cd799439014",
    "user_id": "507f1f77bcf86cd799439011",
    "sodium_mg": 2000,
    "protein_g": 50,
    "potassium_mg": 2000,
    "phosphorus_mg": 800,
    "ckd_stage": "3",
    "updated_at": "2025-11-20T10:00:00Z"
  }
}
```

### 4.5 PUT /api/diet/goals
Update user's dietary goals.

**Request:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "sodium_mg": 2000,
  "protein_g": 50,
  "potassium_mg": 2000,
  "phosphorus_mg": 800,
  "ckd_stage": "3"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "goals": {
    "id": "507f1f77bcf86cd799439014",
    "user_id": "507f1f77bcf86cd799439011",
    "sodium_mg": 2000,
    "protein_g": 50,
    "potassium_mg": 2000,
    "phosphorus_mg": 800,
    "ckd_stage": "3",
    "updated_at": "2025-11-27T10:00:00Z"
  }
}
```

### 4.6 GET /api/diet/progress
Get daily or weekly progress.

**Query Parameters:**
- `user_id` (required): User ID
- `date` (required): ISO 8601 date
- `period` (optional): daily, weekly (default: daily)

**Success Response (200):**
```json
{
  "success": true,
  "progress": {
    "date": "2025-11-27",
    "period": "daily",
    "consumed": {
      "sodium_mg": 1850,
      "protein_g": 45,
      "potassium_mg": 1750,
      "phosphorus_mg": 720
    },
    "goals": {
      "sodium_mg": 2000,
      "protein_g": 50,
      "potassium_mg": 2000,
      "phosphorus_mg": 800
    },
    "adherence": {
      "sodium_mg": 92.5,
      "protein_g": 90.0,
      "potassium_mg": 87.5,
      "phosphorus_mg": 90.0
    },
    "violations": []
  }
}
```

### 4.7 GET /api/diet/streak
Get user's logging streak.

**Query Parameters:**
- `user_id` (required): User ID

**Success Response (200):**
```json
{
  "success": true,
  "streak": {
    "current_streak": 5,
    "longest_streak": 12,
    "last_logged_date": "2025-11-27",
    "total_days_logged": 45
  }
}
```

## 5. Data Schema

### 5.1 diet_sessions Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  user_id: ObjectId("507f1f77bcf86cd799439010"),
  created_at: ISODate("2025-11-27T10:00:00Z"),
  expires_at: ISODate("2025-11-27T11:00:00Z"),
  analysis_count: 3  // Max 10 per session
}

// Indexes
db.diet_sessions.createIndex({ user_id: 1, expires_at: -1 });
db.diet_sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

### 5.2 diet_goals Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  user_id: ObjectId("507f1f77bcf86cd799439010"),
  sodium_mg: 2000,
  protein_g: 50,
  potassium_mg: 2000,
  phosphorus_mg: 800,
  ckd_stage: "3",  // 1, 2, 3, 4, 5
  updated_at: ISODate("2025-11-27T10:00:00Z")
}

// Indexes
db.diet_goals.createIndex({ user_id: 1 }, { unique: true });
```

### 5.3 meal_logs Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  user_id: ObjectId("507f1f77bcf86cd799439010"),
  meal_type: "breakfast",  // breakfast, lunch, dinner, snack
  foods: [
    {
      name: "현미밥",
      portion_g: 210,
      sodium_mg: 2,
      protein_g: 5.2,
      potassium_mg: 157,
      phosphorus_mg: 189
    }
  ],
  total_nutrients: {
    sodium_mg: 2,
    protein_g: 5.2,
    potassium_mg: 157,
    phosphorus_mg: 189
  },
  logged_at: ISODate("2025-11-27T09:30:00Z"),
  created_at: ISODate("2025-11-27T09:35:00Z")
}

// Indexes
db.meal_logs.createIndex({ user_id: 1, logged_at: -1 });
db.meal_logs.createIndex({ user_id: 1, meal_type: 1, logged_at: -1 });
db.meal_logs.createIndex({ created_at: -1 });
```

### 5.4 nutrition_analyses Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  session_id: ObjectId("507f1f77bcf86cd799439011"),
  user_id: ObjectId("507f1f77bcf86cd799439010"),
  image_url: "https://example.com/food.jpg",
  result: {
    foods: [...],
    total_nutrients: {...}
  },
  created_at: ISODate("2025-11-27T10:15:00Z")
}

// Indexes
db.nutrition_analyses.createIndex({ user_id: 1, created_at: -1 });
db.nutrition_analyses.createIndex({ session_id: 1 });
db.nutrition_analyses.createIndex({ created_at: -1 });
```

### 5.5 user_streaks Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  user_id: ObjectId("507f1f77bcf86cd799439010"),
  current_streak: 5,
  longest_streak: 12,
  last_logged_date: "2025-11-27",  // YYYY-MM-DD format
  history: [
    { date: "2025-11-27", logged: true },
    { date: "2025-11-26", logged: true },
    { date: "2025-11-25", logged: true }
  ]
}

// Indexes
db.user_streaks.createIndex({ user_id: 1 }, { unique: true });
```

## 6. Technology Stack Rationale

### 6.1 FastAPI (API Framework)
**Choice:** FastAPI
**Justification:**
- Already adopted in the project
- Excellent async performance for I/O-bound operations (OpenAI API calls)
- Automatic OpenAPI documentation
- Built-in request validation via Pydantic

**Trade-offs:**
- **vs Flask:** FastAPI provides better async support and automatic validation, critical for external API integration
- **vs Django:** FastAPI is lighter and more suitable for microservices, avoiding unnecessary ORM overhead

### 6.2 MongoDB (Primary Database)
**Choice:** MongoDB
**Justification:**
- Already adopted in the project
- Flexible schema for nutrition data (varying food items per meal)
- Excellent performance for document queries
- Native TTL indexes for session expiration

**Trade-offs:**
- **vs PostgreSQL:** MongoDB offers better flexibility for nested document structures (foods array in meals), though PostgreSQL's JSONB would also work
- **vs DynamoDB:** MongoDB provides better local development experience and no vendor lock-in

### 6.3 OpenAI GPT-4 Vision (Nutrition Analysis)
**Choice:** GPT-4 Vision API
**Justification:**
- State-of-the-art image understanding
- Can extract structured nutritional data from food images
- Handles Korean food recognition well
- JSON mode for structured responses

**Trade-offs:**
- **vs Custom ML Model:** GPT-4V requires no training data or model maintenance, faster to market
- **vs Third-party Nutrition API:** GPT-4V handles Korean foods better and provides more flexibility
- **Cost consideration:** Rate limiting (10/hour) controls costs while maintaining utility

### 6.4 Redis (Caching - Optional)
**Choice:** Redis with in-memory fallback
**Justification:**
- Fast goal retrieval (goals rarely change)
- Session management for rate limiting
- TTL support for automatic expiration

**Trade-offs:**
- **vs Memcached:** Redis provides richer data structures and persistence options
- **vs In-memory only:** Redis enables horizontal scaling across multiple app instances
- **Optional design:** System works without Redis, degrading gracefully

### 6.5 Repository Pattern (Data Access)
**Choice:** Repository pattern with abstract base class
**Justification:**
- Decouples business logic from data access
- Enables easy testing with mock repositories
- Supports future database migrations
- Consistent interface across collections

**Trade-offs:**
- **vs Direct database access:** Adds abstraction layer but significantly improves testability and maintainability
- **vs ORM:** Repository pattern provides more control and avoids ORM complexity with MongoDB

### 6.6 Service Layer Pattern (Business Logic)
**Choice:** Dedicated service classes
**Justification:**
- Encapsulates complex business logic
- Reusable across multiple endpoints
- Easier to test in isolation
- Clear separation of concerns

**Trade-offs:**
- **vs Fat controllers:** Service layer prevents controller bloat and improves code organization
- **vs Domain models:** Service layer is simpler for this use case than full DDD approach

## 7. Key Considerations

### 7.1 Scalability

**Current Load Capacity:**
- Handles ~1000 concurrent users with current design
- MongoDB indexed queries: <50ms average
- Rate limiting prevents abuse: 10 analyses/hour, 50 meals/day per user

**Scaling to 10x Load (10,000 users):**

1. **Database Scaling:**
   - MongoDB replica set for read scaling
   - Shard by user_id for write scaling
   - Connection pooling (already configured in PyMongo)

2. **API Scaling:**
   - Horizontal scaling: Deploy multiple FastAPI instances behind load balancer
   - Stateless design enables easy horizontal scaling
   - Redis for shared session/cache state across instances

3. **External API Rate Limits:**
   - OpenAI API: Upgrade to higher tier (1000 RPM+)
   - Implement request queuing for GPT-4 Vision calls
   - Cache common food analysis results

4. **Database Optimizations:**
   - Compound indexes for complex queries
   - Archive old meal_logs to separate collection after 1 year
   - Implement read replicas for analytics queries

### 7.2 Security

**Primary Threat Vectors and Mitigations:**

1. **Unauthorized Access:**
   - Threat: Users accessing other users' diet data
   - Mitigation: JWT authentication middleware (existing), user_id validation in all endpoints

2. **API Key Exposure:**
   - Threat: OpenAI API key leakage
   - Mitigation: Environment variables, never log API keys, rotate keys quarterly

3. **Image URL Injection:**
   - Threat: Malicious URLs in image_url field
   - Mitigation: URL validation, HTTPS-only, domain whitelist for user-uploaded images

4. **Rate Limit Bypass:**
   - Threat: Users creating multiple sessions to bypass limits
   - Mitigation: Session tracking by user_id, IP-based rate limiting as backup

5. **Data Injection:**
   - Threat: NoSQL injection via MongoDB queries
   - Mitigation: Pydantic validation, parameterized queries, input sanitization

6. **Data Privacy:**
   - Threat: Sensitive health data exposure
   - Mitigation: MongoDB encryption at rest, TLS for transport, access logging, GDPR compliance (data deletion endpoints)

### 7.3 Observability

**Monitoring Strategy:**

1. **Application Metrics:**
   - Request rate, latency (p50, p95, p99) per endpoint
   - Error rate by status code
   - OpenAI API call success/failure rate
   - Rate limit hit frequency

2. **Business Metrics:**
   - Daily active users logging meals
   - Average analyses per user
   - Streak distribution
   - Goal adherence percentage

3. **Database Metrics:**
   - Query performance (slow query log >100ms)
   - Connection pool utilization
   - Collection size growth
   - Index usage statistics

4. **Logging Strategy:**
   ```python
   # Structured logging with context
   logger.info("nutrition_analysis_requested", extra={
       "user_id": user_id,
       "session_id": session_id,
       "image_url": image_url[:50]  # Truncate for privacy
   })
   ```

5. **Error Tracking:**
   - Sentry integration for exception tracking
   - Alert on OpenAI API errors >5% rate
   - Alert on database connection failures

6. **Health Checks:**
   - `/health` endpoint: Basic service status
   - `/health/detailed`: Database, Redis, OpenAI API connectivity
   - Kubernetes liveness/readiness probes

### 7.4 Deployment and CI/CD

**Deployment Architecture:**

1. **Environment Structure:**
   - Development: Local MongoDB + Mock OpenAI API
   - Staging: MongoDB Atlas + OpenAI test tier
   - Production: MongoDB Atlas replica set + OpenAI production tier

2. **Container Strategy:**
   ```dockerfile
   # Multi-stage build
   FROM python:3.11-slim as builder
   COPY requirements.txt .
   RUN pip install --user -r requirements.txt

   FROM python:3.11-slim
   COPY --from=builder /root/.local /root/.local
   COPY ./app /app
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

3. **CI/CD Pipeline:**
   ```yaml
   # GitHub Actions workflow
   - Run linting (ruff, black)
   - Run type checking (mypy)
   - Run unit tests (pytest) with coverage >80%
   - Run integration tests against test MongoDB
   - Build Docker image
   - Deploy to staging on develop branch
   - Deploy to production on main branch (manual approval)
   ```

4. **Database Migrations:**
   - Schema changes tracked in `migrations/` directory
   - Migration scripts run before deployment
   - Backward-compatible changes only
   - Index creation in background mode

5. **Rollback Strategy:**
   - Keep previous 3 versions deployed
   - Blue-green deployment for zero-downtime
   - Database migrations are backward compatible
   - Feature flags for gradual rollout

## 8. Error Handling Strategy

### 8.1 Exception Hierarchy
```
DietCareException (base)
├── ValidationError (400)
│   ├── InvalidImageURLError
│   ├── InvalidMealDataError
│   └── InvalidGoalRangeError
├── ResourceNotFoundError (404)
│   ├── SessionNotFoundError
│   ├── GoalNotFoundError
│   └── MealNotFoundError
├── RateLimitExceededError (429)
│   ├── AnalysisLimitExceededError
│   └── MealLogLimitExceededError
├── ExternalServiceError (502)
│   ├── OpenAIAPIError
│   └── ImageProcessingError
└── DatabaseError (500)
    ├── ConnectionError
    └── QueryError
```

### 8.2 Error Response Format
All errors follow consistent structure:
```json
{
  "error_code": 429,
  "message": "시간당 분석 한도를 초과했습니다",
  "detail": {
    "limit": 10,
    "reset_at": "2025-11-27T11:00:00Z",
    "remaining_time_seconds": 1800
  },
  "request_id": "req_abc123"
}
```

## 9. Caching Strategy

### 9.1 Cache Layers

1. **Goal Cache (Redis/In-memory):**
   - Key: `diet:goal:{user_id}`
   - TTL: 1 hour
   - Invalidation: On goal update

2. **Session Cache (Redis/In-memory):**
   - Key: `diet:session:{user_id}:current`
   - TTL: 1 hour
   - Invalidation: Automatic (TTL)

3. **Analysis Result Cache:**
   - Key: `diet:analysis:{image_hash}`
   - TTL: 24 hours
   - Purpose: Avoid re-analyzing identical images

### 9.2 Cache Invalidation
- Write-through for updates
- Delete on explicit user action
- TTL-based for time-sensitive data

## 10. Rate Limiting Strategy

### 10.1 Limits
- Nutrition analysis: 10 per hour per user
- Meal logging: 50 per day per user
- Goal updates: 10 per day per user

### 10.2 Implementation
- SlowAPI library with Redis backend
- User-based keys: `rate:{user_id}:{endpoint}:{window}`
- Response headers:
  ```
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 7
  X-RateLimit-Reset: 1732705200
  ```

## 11. Testing Strategy

### 11.1 Unit Tests
- Service layer: Mock repositories
- Repository layer: Mock MongoDB client
- Coverage target: >80%

### 11.2 Integration Tests
- Test against real MongoDB (test database)
- Mock OpenAI API responses
- Test full request-response cycle

### 11.3 E2E Tests
- Critical user flows:
  1. Analyze food image -> Log meal -> Check progress
  2. Update goals -> Log meals -> Verify adherence
  3. Log meals consecutively -> Verify streak

## 12. Migration Path

### 12.1 Initial Setup (Week 1)
1. Create MongoDB indexes
2. Deploy core infrastructure (exceptions, repositories)
3. Implement Session + Goal services

### 12.2 Phase 2 (Week 2)
1. Implement Nutrition Analyzer
2. Deploy Meal Service
3. Integration testing

### 12.3 Phase 3 (Week 3)
1. Implement Progress Service
2. Implement Streak Service
3. Full E2E testing

### 12.4 Phase 4 (Week 4)
1. Performance optimization
2. Security audit
3. Production deployment

## 13. Next Steps

1. Review and approve architecture
2. Set up OpenAI API credentials
3. Create MongoDB indexes
4. Implement core modules (see Implementation Plan)
5. Write tests
6. Deploy to staging
7. User acceptance testing
8. Production deployment
