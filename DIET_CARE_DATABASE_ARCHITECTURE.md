# Diet Care Database Architecture

## Executive Summary

This document describes the complete database architecture for the Diet Care feature, a nutrition tracking and analysis system designed for Chronic Kidney Disease (CKD) patients. The architecture uses MongoDB with a repository pattern, emphasizing scalability, data integrity, and efficient query performance.

### Key Technology Choices

- **Database**: MongoDB (NoSQL document database)
- **Pattern**: Repository Pattern with Service Layer
- **Language**: Python 3.11+ with Pydantic for validation
- **Collections**: 5 primary collections with optimized indexes

---

## Architecture Overview

The Diet Care database system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               Service Layer (Business Logic)             │
│  - DietCareService: Nutrition calculations, validation   │
│  - Goal vs Actual comparison                            │
│  - CKD stage-specific recommendations                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Repository Layer (Data Access)                │
│  - DietGoalsRepository                                   │
│  - MealLogRepository                                     │
│  - DietSessionRepository                                 │
│  - UserStreakRepository                                  │
│  - NutritionAnalysisRepository                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                MongoDB Database (careguide)              │
│  Collections: diet_goals, meal_logs, diet_sessions,     │
│               user_streaks, nutrition_analyses           │
└──────────────────────────────────────────────────────────┘
```

---

## Collection Schemas

### 1. diet_goals

Stores user dietary goals based on CKD stage.

**Purpose**: Track personalized nutrition targets for each user.

**Schema**:
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,           // Reference to users collection
  sodium_mg: Double,           // Daily sodium goal (mg)
  protein_g: Double,           // Daily protein goal (grams)
  potassium_mg: Double,        // Daily potassium goal (mg)
  phosphorus_mg: Double,       // Daily phosphorus goal (mg)
  ckd_stage: String,           // "1", "2", "3", "4", "5"
  created_at: Date,
  updated_at: Date
}
```

**Indexes**:
- `user_id` (unique): Fast user lookup
- `ckd_stage + updated_at`: Analytics by stage

**Validation**:
- Sodium: 0-10,000 mg
- Protein: 0-500 g
- Potassium: 0-10,000 mg
- Phosphorus: 0-5,000 mg
- CKD Stage: enum ["1", "2", "3", "4", "5"]

**Default Goals by CKD Stage**:
| Stage | Sodium (mg) | Protein (g) | Potassium (mg) | Phosphorus (mg) |
|-------|-------------|-------------|----------------|-----------------|
| 1     | 2,300       | 60          | 3,500          | 1,000           |
| 2     | 2,000       | 55          | 3,000          | 900             |
| 3     | 2,000       | 50          | 2,000          | 800             |
| 4     | 1,500       | 40          | 2,000          | 800             |
| 5     | 1,500       | 40          | 2,000          | 800             |

---

### 2. meal_logs

Records individual meal entries with detailed nutrition data.

**Purpose**: Track actual food consumption for progress analysis.

**Schema**:
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  meal_type: String,           // "breakfast", "lunch", "dinner", "snack"
  foods: [                     // Array of food items
    {
      name: String,
      portion_g: Double,       // Portion size in grams
      sodium_mg: Double,
      protein_g: Double,
      potassium_mg: Double,
      phosphorus_mg: Double
    }
  ],
  total_nutrients: {           // Pre-calculated totals for efficiency
    sodium_mg: Double,
    protein_g: Double,
    potassium_mg: Double,
    phosphorus_mg: Double
  },
  logged_at: Date,             // When meal was consumed
  created_at: Date             // When log was created
}
```

**Indexes**:
- `user_id + logged_at (desc)`: Recent meals query
- `user_id + meal_type + logged_at (desc)`: Meal type filtering
- `logged_at (desc)`: Global meal feed (if needed)

**Query Patterns**:
1. Get today's meals: `{user_id: X, logged_at: {$gte: startOfDay, $lte: endOfDay}}`
2. Weekly summary: Aggregation pipeline with `$match` + `$group`
3. Nutrition totals: Aggregation using `$sum` on `total_nutrients` fields

---

### 3. diet_sessions

Manages analysis sessions for rate limiting.

**Purpose**: Prevent API abuse and manage OpenAI costs (10 analyses per hour per user).

**Schema**:
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  created_at: Date,
  expires_at: Date,            // Auto-expires after 1 hour
  analysis_count: Int32        // 0-10
}
```

**Indexes**:
- `user_id + expires_at (desc)`: Active session lookup
- `expires_at (TTL)`: Automatic cleanup (MongoDB TTL index)

**Session Lifecycle**:
1. User requests analysis → Check for active session
2. If session exists and not expired → Increment count
3. If session expired or doesn't exist → Create new session
4. If count ≥ 10 → Return rate limit error
5. MongoDB automatically deletes expired sessions

**TTL Configuration**:
```python
db.diet_sessions.create_index(
    [("expires_at", ASCENDING)],
    expireAfterSeconds=0  # Delete immediately when expires_at is reached
)
```

---

### 4. user_streaks

Tracks logging streaks for gamification.

**Purpose**: Encourage consistent meal logging through streak tracking.

**Schema**:
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  current_streak: Int32,       // Current consecutive days
  longest_streak: Int32,       // All-time longest streak
  last_logged_date: String,    // "YYYY-MM-DD" format
  total_days_logged: Int32     // Lifetime total
}
```

**Indexes**:
- `user_id` (unique): One streak record per user
- `current_streak (desc)`: Leaderboard queries
- `longest_streak (desc)`: Achievement tracking

**Streak Calculation Logic**:
```python
if not last_logged_date:
    # First log ever
    current_streak = 1
    longest_streak = 1
elif log_date == last_date:
    # Same day, no change
    pass
elif (log_date - last_date).days == 1:
    # Consecutive day
    current_streak += 1
    longest_streak = max(longest_streak, current_streak)
elif (log_date - last_date).days > 1:
    # Streak broken
    current_streak = 1
else:
    # Backdated entry, no change to streak
    pass
```

---

### 5. nutrition_analyses

Caches AI analysis results to reduce costs.

**Purpose**: Avoid re-analyzing identical or similar images.

**Schema**:
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  image_hash: String,          // SHA-256 hash of image
  analysis: Object,            // Full NutritionAnalysisResult
  created_at: Date,
  expires_at: Date,            // Auto-expires after 30 days
  hit_count: Int32             // Track cache effectiveness
}
```

**Indexes**:
- `user_id + image_hash`: Cache lookup
- `expires_at (TTL)`: Automatic cleanup

**Cache Strategy**:
1. Hash incoming image
2. Check for existing analysis with same hash
3. If found and not expired → Return cached result (increment hit_count)
4. If not found → Call OpenAI API, cache result
5. Track hit_count for cost analysis

---

## Repository Pattern Implementation

### Base Repository

All repositories extend `BaseRepository[T]` which provides:

**CRUD Operations**:
- `create(entity: T) -> str`
- `find_by_id(id: str) -> Optional[T]`
- `find_one(filter: Dict) -> Optional[T]`
- `find_many(filter: Dict, skip: int, limit: int) -> List[T]`
- `update(id: str, updates: Dict) -> bool`
- `delete(id: str) -> bool`
- `count(filter: Dict) -> int`
- `aggregate(pipeline: List[Dict]) -> List[Dict]`

**Benefits**:
1. **Consistency**: All repositories have the same interface
2. **Testability**: Easy to mock for unit tests
3. **Type Safety**: Generic typing with `TypeVar`
4. **Error Handling**: Centralized exception handling

### Repository Hierarchy

```
BaseRepository[T] (abstract)
    ├── DietGoalsRepository[DietGoal]
    ├── MealLogRepository[MealLog]
    ├── DietSessionRepository[DietSession]
    ├── UserStreakRepository[UserStreak]
    └── NutritionAnalysisRepository[Dict]
```

### Example: DietGoalsRepository

```python
class DietGoalsRepository(BaseRepository[DietGoal]):
    @property
    def collection(self) -> Collection:
        return db["diet_goals"]

    def _to_entity(self, document: Dict) -> DietGoal:
        # Convert MongoDB document to Pydantic model
        return DietGoal(...)

    def _to_document(self, entity: DietGoal) -> Dict:
        # Convert Pydantic model to MongoDB document
        return {...}

    def get_user_goals(self, user_id: str) -> Optional[DietGoal]:
        return self.find_one({"user_id": ObjectId(user_id)})

    def upsert_goals(self, user_id: str, goals: DietGoal) -> DietGoal:
        # Business logic for create or update
        ...
```

---

## Service Layer Architecture

### DietCareService

**Responsibilities**:
1. **Goal Management**: Validation, CKD stage recommendations
2. **Meal Logging**: Nutrient validation, streak updates
3. **Progress Tracking**: Daily/weekly summaries, compliance scoring
4. **Recommendations**: Stage-specific dietary advice

**Key Methods**:

```python
class DietCareService:
    # Goal Management
    def get_or_create_default_goals(user_id, ckd_stage) -> DietGoal
    def update_goals(user_id, request) -> DietGoal
    def get_recommended_goals(ckd_stage) -> Dict

    # Meal Logging
    def log_meal(user_id, request) -> (MealLog, streak_dict)
    def get_meals(user_id, filters...) -> List[MealLog]
    def delete_meal(meal_id, user_id) -> bool

    # Progress Tracking
    def get_daily_progress(user_id, date) -> DailyProgress
    def get_weekly_summary(user_id, start, end) -> Dict
    def calculate_compliance_score(consumed, goals) -> float

    # Session Management
    def get_or_create_session(user_id) -> session_info
    def increment_analysis_count(session_id) -> bool
```

### Business Logic Examples

**1. Nutrient Adherence Calculation**:
```python
def _calculate_adherence(consumed: Nutrients, goals: Nutrients) -> NutrientAdherence:
    return NutrientAdherence(
        sodium_mg=round((consumed.sodium_mg / goals.sodium_mg) * 100, 1),
        protein_g=round((consumed.protein_g / goals.protein_g) * 100, 1),
        potassium_mg=round((consumed.potassium_mg / goals.potassium_mg) * 100, 1),
        phosphorus_mg=round((consumed.phosphorus_mg / goals.phosphorus_mg) * 100, 1)
    )
```

**2. Compliance Score** (0-100):
- 100: All nutrients within 90-110% of goal (excellent)
- 80-99: Minor deviations (good)
- 60-79: Some significant violations (moderate)
- <60: Multiple violations (poor)

**3. Violation Detection**:
- Sodium/Potassium/Phosphorus: >110% of goal = violation
- Protein: <80% of goal = violation

---

## Index Strategy

### Primary Access Patterns

1. **User-specific queries** (most common):
   - `user_id` indexes on all collections
   - Unique where applicable (goals, streaks)

2. **Time-based queries**:
   - `logged_at` for meal retrieval
   - `expires_at` for session management

3. **Compound indexes**:
   - `user_id + logged_at`: Efficient date range queries
   - `user_id + meal_type + logged_at`: Meal type filtering

4. **TTL indexes**:
   - Auto-cleanup for sessions and cached analyses
   - Reduces manual maintenance

### Index Performance Impact

**Before Indexes** (1M meals):
```javascript
db.meal_logs.find({user_id: X, logged_at: {$gte: date}})
// COLLSCAN: 1,000,000 documents examined
// Execution time: ~5000ms
```

**After Indexes**:
```javascript
// IXSCAN using user_logged_idx
// 50 documents examined
// Execution time: ~5ms
```

---

## Technology Stack Rationale

### MongoDB vs PostgreSQL

**Why MongoDB was chosen**:

| Aspect | MongoDB | PostgreSQL | Decision |
|--------|---------|-----------|----------|
| **Schema Flexibility** | Documents can vary (meals have different food counts) | Fixed schema | ✅ MongoDB |
| **Nested Data** | Native support for arrays (foods in meals) | Requires JOIN tables | ✅ MongoDB |
| **Horizontal Scaling** | Built-in sharding | More complex | ✅ MongoDB |
| **JSON Storage** | Native (BSON) | JSONB works well | Tie |
| **ACID Compliance** | Document-level (sufficient for our needs) | Full ACID | ⚠️ PostgreSQL |
| **Query Complexity** | Good for our patterns | Better for complex JOINs | Tie |

**Trade-offs**:
- **Chose MongoDB** because:
  1. Meals naturally map to documents (foods array)
  2. Schema can evolve (add new nutrients without migration)
  3. Existing project uses MongoDB
  4. No complex JOINs needed (denormalized design)

- **Sacrificed**:
  1. Strong ACID guarantees across collections
  2. Complex relational queries
  3. Built-in constraint enforcement (handled at application level)

### Repository Pattern vs Active Record

**Why Repository Pattern**:

| Pattern | Pros | Cons | Decision |
|---------|------|------|----------|
| **Repository** | Testable, decoupled, clear boundaries | More boilerplate | ✅ Chosen |
| **Active Record** | Less code, simpler | Tight coupling, hard to test | ❌ |

**Trade-offs**:
- **Chose Repository** because:
  1. Business logic isolation (service layer)
  2. Easy to mock repositories in tests
  3. Clear separation of concerns
  4. Can swap database implementation

- **Sacrificed**:
  1. More files to maintain
  2. Additional abstraction layer
  3. Steeper learning curve

---

## Key Considerations

### Scalability

**Current Design (1-10K users)**:
- Single MongoDB instance
- Indexes handle query performance
- TTL indexes prevent unbounded growth

**10x Growth (10-100K users)**:
```
┌────────────────────────────────────────────┐
│         MongoDB Replica Set (3 nodes)      │
│  Primary (writes) + 2 Secondaries (reads)  │
└────────────────────────────────────────────┘
                     ↕
┌────────────────────────────────────────────┐
│          Application Servers (3+)          │
│         (Load Balanced with Nginx)         │
└────────────────────────────────────────────┘
```

**100x Growth (100K-1M users)**:
- Shard by `user_id` (natural partition key)
- Redis cache for frequent queries
- Read replicas for analytics
- Archive old meals to cold storage

### Security

**Current Measures**:
1. **Input Validation**: Pydantic models with field validators
2. **ObjectId Validation**: Prevent MongoDB injection
3. **User Authorization**: Check `user_id` matches JWT token
4. **Rate Limiting**: Session-based analysis limits

**Future Enhancements**:
1. **Encryption at Rest**: MongoDB Enterprise feature
2. **Audit Logging**: Track all data modifications
3. **Field-Level Encryption**: PHI/PII protection
4. **Role-Based Access**: Admin vs User permissions

### Observability

**Monitoring Strategy**:

1. **Database Metrics**:
   - Query performance (explain plans)
   - Index utilization
   - Connection pool status
   - Disk usage trends

2. **Application Metrics**:
   - Repository method latency
   - Service method success rates
   - Cache hit rates (nutrition_analyses)
   - Session expiration rates

3. **Business Metrics**:
   - Daily active users (meal logging)
   - Average streak length
   - Compliance score distribution
   - Analysis API costs

**Logging**:
```python
# Structured logging with context
logger.info(
    "Logged meal",
    extra={
        "user_id": user_id,
        "meal_type": meal_type,
        "nutrient_totals": {...},
        "streak": streak.current_streak
    }
)
```

### Deployment & CI/CD

**Database Migrations**:
```bash
# Initial setup
python scripts/init_diet_care_collections.py --sample-data

# Index updates (safe, non-blocking)
python scripts/init_diet_care_collections.py --skip-validation

# Schema changes (requires manual migration)
python scripts/migrate_add_field.py
```

**Backup Strategy**:
1. **Daily snapshots**: Full database backup
2. **Oplog**: Point-in-time recovery
3. **Replica sets**: High availability

**Testing**:
```python
# Unit tests with mocked repositories
def test_calculate_compliance_score():
    service = DietCareService()
    score = service.calculate_compliance_score(consumed, goals)
    assert 90 <= score <= 100

# Integration tests with test database
@pytest.fixture
def test_db():
    # Use separate test database
    db = MongoClient()["careguide_test"]
    yield db
    db.client.drop_database("careguide_test")
```

---

## Migration Path

### Phase 1: Initial Setup (Current)
✅ Create collections with validation
✅ Create indexes
✅ Implement repositories
✅ Implement service layer

### Phase 2: API Integration (Next)
- Connect to diet_care API endpoints
- Add JWT authentication middleware
- Integrate with nutrition_analyzer service
- Add error handling and logging

### Phase 3: Production Readiness
- Set up MongoDB replica set
- Configure backups
- Add monitoring (Prometheus + Grafana)
- Load testing and optimization

### Phase 4: Advanced Features
- Redis caching layer
- Real-time notifications (meal reminders)
- Batch analytics jobs
- ML-based recommendations

---

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── diet.py                    # Domain entities
│   │   └── diet_care.py               # Request/Response models
│   ├── repositories/
│   │   ├── base_repository.py         # Abstract base class
│   │   └── diet_care_repository.py    # Diet Care repositories
│   ├── services/
│   │   └── diet_care_service.py       # Business logic
│   ├── core/
│   │   └── exceptions.py              # Custom exceptions
│   └── db/
│       └── connection.py              # MongoDB connection
└── scripts/
    └── init_diet_care_collections.py  # Database initialization
```

---

## API Contract Examples

### Create Meal Log

**Request**:
```http
POST /api/diet/meals
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
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
  "logged_at": "2025-11-27T08:00:00Z"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "meal": {
    "id": "674...",
    "user_id": "507...",
    "meal_type": "breakfast",
    "foods": [...],
    "total_nutrients": {...},
    "logged_at": "2025-11-27T08:00:00Z",
    "created_at": "2025-11-27T08:05:00Z"
  },
  "streak": {
    "current": 5,
    "longest": 12,
    "last_logged_date": "2025-11-27",
    "total_days_logged": 45
  }
}
```

### Get Daily Progress

**Request**:
```http
GET /api/diet/progress/daily?date=2025-11-27
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "progress": {
    "date": "2025-11-27",
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

---

## Summary

This database architecture provides:

✅ **Scalability**: Indexed queries, TTL cleanup, sharding-ready design
✅ **Security**: Input validation, authorization checks, rate limiting
✅ **Observability**: Structured logging, metric tracking, query monitoring
✅ **Maintainability**: Repository pattern, service layer, clear boundaries
✅ **Performance**: Optimized indexes, denormalized data, caching strategy

The design supports CKD patients with personalized nutrition tracking while maintaining cost efficiency through session-based rate limiting and analysis caching.
