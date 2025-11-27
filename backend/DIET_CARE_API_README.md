# Diet Care API Documentation

## Executive Summary

The Diet Care API provides a comprehensive nutrition management system specifically designed for Chronic Kidney Disease (CKD) patients. It leverages GPT-4 Vision for intelligent food image analysis and delivers personalized nutrition recommendations based on CKD stage and individual health profiles.

**Base URL**: `http://localhost:8000/api/diet-care`

**Technology Stack**:
- FastAPI (REST API framework)
- MongoDB (data persistence)
- OpenAI GPT-4 Vision (nutrition analysis)
- JWT Authentication (security)

---

## Architecture Overview

The Diet Care system consists of five major components:

1. **Session Management**: Temporary analysis sessions with 1-hour expiration
2. **Nutrition Analysis**: AI-powered food recognition and nutrient calculation
3. **Meal Logging**: Historical meal tracking with nutrition totals
4. **Goal Management**: Personalized daily nutrition targets
5. **Progress Tracking**: Daily/weekly summaries and logging streaks

### Data Flow

```
Client → [Session Creation] → Session ID → [Image/Text Analysis] → Nutrition Data → [Meal Logging] → Progress Tracking
                                                                                  ↓
                                                                          User Goals (Comparison)
```

---

## Service Definitions

### 1. Session Service
- **Purpose**: Manage temporary analysis sessions
- **Storage**: `diet_sessions_collection` (MongoDB)
- **Lifetime**: 1 hour per session
- **Key Fields**: session_id, user_id, status, analysis_result, expires_at

### 2. Nutrition Analyzer Service
- **Purpose**: Analyze food images using GPT-4 Vision
- **Provider**: OpenAI API
- **Input**: Image bytes (JPEG/PNG), text description, user profile
- **Output**: Structured nutrition data (calories, protein, sodium, potassium, phosphorus)
- **Special Features**: CKD-specific warnings and recommendations

### 3. Meal Service
- **Purpose**: Store and retrieve meal history
- **Storage**: `diet_meals_collection` (MongoDB)
- **Operations**: Create, Read, Delete
- **Key Fields**: meal_type, foods[], totals, logged_at, notes, image_url

### 4. Goals Service
- **Purpose**: Manage user nutrition targets
- **Storage**: `diet_goals_collection` (MongoDB)
- **Operations**: Get (with defaults), Update
- **Default Goals**: calories=2000, protein=50g, sodium=2000mg, potassium=2000mg, phosphorus=1000mg

### 5. Progress Calculator
- **Purpose**: Generate statistics and compliance scores
- **Operations**: Daily progress, weekly summary, streak calculation
- **Metrics**: Nutrient percentage, compliance score (0-100), consecutive logging days

---

## API Contracts

### Authentication

All endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

The token must contain a valid `user_id` claim. Use `/api/auth/login` to obtain a token.

---

### 1. Session Management

#### POST /api/diet-care/session/create

Create a new analysis session before uploading food images.

**Headers**:
```http
Authorization: Bearer <token>
```

**Request Body**: None (user_id extracted from JWT)

**Success Response** (201 Created):
```json
{
  "session_id": "session_a1b2c3d4e5f6",
  "created_at": "2025-11-27T10:00:00Z",
  "expires_at": "2025-11-27T11:00:00Z"
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "detail": "유효하지 않은 인증 토큰입니다"
}
```

---

### 2. Nutrition Analysis

#### POST /api/diet-care/nutri-coach

Analyze food nutrition using GPT-4 Vision. Supports image, text, or both.

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| session_id | string | Yes | Session ID from create endpoint |
| image | file | No* | Food image (JPEG/PNG, max 20MB) |
| text | string | No* | Text description of meal |
| age | integer | No | User age (0-150) |
| weight_kg | float | No | User weight in kg |
| height_cm | float | No | User height in cm |
| ckd_stage | integer | No | CKD stage (1-5) |
| activity_level | string | No | sedentary/light/moderate/active/very_active |

*At least one of `image` or `text` is required.

**Example Request** (using curl):
```bash
curl -X POST "http://localhost:8000/api/diet-care/nutri-coach" \
  -H "Authorization: Bearer <token>" \
  -F "session_id=session_abc123" \
  -F "image=@meal.jpg" \
  -F "text=Grilled chicken with vegetables" \
  -F "ckd_stage=3" \
  -F "age=45" \
  -F "weight_kg=70"
```

**Success Response** (200 OK):
```json
{
  "session_id": "session_abc123",
  "analyzed_at": "2025-11-27T10:05:00Z",
  "image_url": null,
  "analysis": {
    "foods": [
      {
        "name": "Grilled Chicken Breast",
        "amount": "150g",
        "calories": 165,
        "protein_g": 31,
        "sodium_mg": 74,
        "potassium_mg": 256,
        "phosphorus_mg": 228,
        "carbs_g": 0,
        "fat_g": 3.6,
        "fiber_g": 0
      },
      {
        "name": "Steamed Broccoli",
        "amount": "100g",
        "calories": 34,
        "protein_g": 2.8,
        "sodium_mg": 33,
        "potassium_mg": 316,
        "phosphorus_mg": 66,
        "carbs_g": 7,
        "fat_g": 0.4,
        "fiber_g": 2.6
      }
    ],
    "total_calories": 199,
    "total_protein_g": 33.8,
    "total_sodium_mg": 107,
    "total_potassium_mg": 572,
    "total_phosphorus_mg": 294,
    "total_carbs_g": 7,
    "total_fat_g": 4,
    "total_fiber_g": 2.6,
    "meal_type_suggestion": "lunch",
    "confidence_score": 0.85,
    "recommendations": [
      "Good protein source for CKD stage 3",
      "Sodium level is within safe range",
      "Consider reducing portion size of broccoli to lower potassium intake"
    ],
    "warnings": [
      "Moderate potassium content - monitor daily total",
      "Phosphorus is elevated - avoid additional high-phosphorus foods today"
    ],
    "analysis_notes": "Well-balanced meal with lean protein. Watch potassium and phosphorus totals for the day."
  }
}
```

**Error Responses**:

400 Bad Request (missing inputs):
```json
{
  "detail": "At least one of 'image' or 'text' is required"
}
```

404 Not Found (invalid session):
```json
{
  "detail": "Session not found"
}
```

403 Forbidden (session ownership):
```json
{
  "detail": "Session does not belong to this user"
}
```

400 Bad Request (expired session):
```json
{
  "detail": "Session has expired"
}
```

500 Internal Server Error (OpenAI API failure):
```json
{
  "detail": "Failed to analyze nutrition: <error details>"
}
```

---

### 3. Meal Logging

#### POST /api/diet-care/meals

Log a meal entry with nutrition data.

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "meal_type": "lunch",
  "foods": [
    {
      "name": "Grilled Chicken Breast",
      "amount": "150g",
      "calories": 165,
      "protein_g": 31,
      "sodium_mg": 74,
      "potassium_mg": 256,
      "phosphorus_mg": 228,
      "carbs_g": 0,
      "fat_g": 3.6,
      "fiber_g": 0
    }
  ],
  "logged_at": "2025-11-27T12:30:00Z",
  "notes": "Post-workout meal",
  "image_url": "https://example.com/meal.jpg"
}
```

**Field Descriptions**:

- `meal_type`: One of "breakfast", "lunch", "dinner", "snack"
- `foods`: Array of food items with nutrition details
- `logged_at`: ISO timestamp (optional, defaults to now)
- `notes`: Optional text notes
- `image_url`: Optional image URL

**Success Response** (201 Created):
```json
{
  "id": "674789a1b2c3d4e5f6g7h8i9",
  "user_id": "user123",
  "meal_type": "lunch",
  "foods": [...],
  "total_calories": 165,
  "total_protein_g": 31,
  "total_sodium_mg": 74,
  "total_potassium_mg": 256,
  "total_phosphorus_mg": 228,
  "logged_at": "2025-11-27T12:30:00Z",
  "notes": "Post-workout meal",
  "image_url": "https://example.com/meal.jpg",
  "created_at": "2025-11-27T12:35:00Z"
}
```

---

#### GET /api/diet-care/meals

Retrieve meal history for a date range.

**Headers**:
```http
Authorization: Bearer <token>
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | string | No | 7 days ago | ISO date string (YYYY-MM-DD) |
| end_date | string | No | today | ISO date string (YYYY-MM-DD) |

**Example Request**:
```http
GET /api/diet-care/meals?start_date=2025-11-20&end_date=2025-11-27
```

**Success Response** (200 OK):
```json
{
  "meals": [
    {
      "id": "674789a1b2c3d4e5f6g7h8i9",
      "user_id": "user123",
      "meal_type": "lunch",
      "foods": [...],
      "total_calories": 165,
      "total_protein_g": 31,
      "total_sodium_mg": 74,
      "total_potassium_mg": 256,
      "total_phosphorus_mg": 228,
      "logged_at": "2025-11-27T12:30:00Z",
      "notes": "Post-workout meal",
      "image_url": null,
      "created_at": "2025-11-27T12:35:00Z"
    }
  ],
  "total_count": 1,
  "date_range": {
    "start": "2025-11-20T00:00:00Z",
    "end": "2025-11-27T23:59:59Z"
  }
}
```

---

#### DELETE /api/diet-care/meals/{meal_id}

Delete a meal entry. Only the meal owner can delete it.

**Headers**:
```http
Authorization: Bearer <token>
```

**Path Parameters**:
- `meal_id`: MongoDB ObjectId of the meal

**Example Request**:
```http
DELETE /api/diet-care/meals/674789a1b2c3d4e5f6g7h8i9
```

**Success Response** (204 No Content):
```
(Empty body)
```

**Error Responses**:

400 Bad Request (invalid ID):
```json
{
  "detail": "Invalid meal ID format"
}
```

404 Not Found:
```json
{
  "detail": "Meal not found"
}
```

403 Forbidden:
```json
{
  "detail": "You can only delete your own meals"
}
```

---

### 4. Goal Management

#### GET /api/diet-care/goals

Get user's nutrition goals. Returns defaults if not set.

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "user_id": "user123",
  "goals": {
    "calories_kcal": 2000,
    "protein_g": 50,
    "sodium_mg": 2000,
    "potassium_mg": 2000,
    "phosphorus_mg": 1000,
    "fluid_ml": 2000
  },
  "last_updated": "2025-11-27T10:00:00Z"
}
```

---

#### PUT /api/diet-care/goals

Update user's nutrition goals. Only provided fields are updated.

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "calories_kcal": 1800,
  "protein_g": 45,
  "sodium_mg": 1500,
  "potassium_mg": 1800,
  "phosphorus_mg": 900,
  "fluid_ml": 1800
}
```

**Success Response** (200 OK):
```json
{
  "user_id": "user123",
  "goals": {
    "calories_kcal": 1800,
    "protein_g": 45,
    "sodium_mg": 1500,
    "potassium_mg": 1800,
    "phosphorus_mg": 900,
    "fluid_ml": 1800
  },
  "last_updated": "2025-11-27T14:30:00Z"
}
```

---

### 5. Progress & Statistics

#### GET /api/diet-care/progress/daily

Get daily nutrition progress compared to goals.

**Headers**:
```http
Authorization: Bearer <token>
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| date | string | No | today | ISO date string (YYYY-MM-DD) |

**Example Request**:
```http
GET /api/diet-care/progress/daily?date=2025-11-27
```

**Success Response** (200 OK):
```json
{
  "date": "2025-11-27",
  "calories": {
    "current": 1650,
    "target": 2000,
    "percentage": 82.5,
    "status": "optimal"
  },
  "protein": {
    "current": 48,
    "target": 50,
    "percentage": 96.0,
    "status": "optimal"
  },
  "sodium": {
    "current": 1800,
    "target": 2000,
    "percentage": 90.0,
    "status": "optimal"
  },
  "potassium": {
    "current": 1750,
    "target": 2000,
    "percentage": 87.5,
    "status": "optimal"
  },
  "phosphorus": {
    "current": 950,
    "target": 1000,
    "percentage": 95.0,
    "status": "optimal"
  },
  "meals_logged": 3,
  "total_meals": 3
}
```

**Status Values**:
- `under`: <80% of target
- `optimal`: 80-120% of target
- `over`: >120% of target

---

#### GET /api/diet-care/progress/weekly

Get weekly nutrition summary for the past 7 days.

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "week_start": "2025-11-21",
  "week_end": "2025-11-27",
  "daily_summaries": [
    {
      "date": "2025-11-21",
      "total_calories": 1950,
      "total_protein_g": 52,
      "total_sodium_mg": 1850,
      "total_potassium_mg": 1920,
      "total_phosphorus_mg": 980,
      "meals_count": 3,
      "compliance_score": 95.5
    },
    {
      "date": "2025-11-22",
      "total_calories": 2100,
      "total_protein_g": 48,
      "total_sodium_mg": 2200,
      "total_potassium_mg": 2150,
      "total_phosphorus_mg": 1050,
      "meals_count": 3,
      "compliance_score": 88.2
    }
  ],
  "average_compliance": 91.3,
  "streak_days": 7,
  "total_meals_logged": 21
}
```

**Compliance Score**: 0-100 rating based on how well the user stayed within their nutrition goals.

---

#### GET /api/diet-care/streak

Get logging streak information.

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "current_streak": 14,
  "longest_streak": 28,
  "last_log_date": "2025-11-27"
}
```

**Streak Definition**: Number of consecutive days with at least 1 meal logged.

---

## Data Schema

### MongoDB Collections

#### diet_sessions

```javascript
{
  "_id": ObjectId,
  "session_id": "session_abc123",
  "user_id": "user123",
  "status": "completed",  // pending | processing | completed | failed
  "created_at": ISODate("2025-11-27T10:00:00Z"),
  "expires_at": ISODate("2025-11-27T11:00:00Z"),
  "analyzed_at": ISODate("2025-11-27T10:05:00Z"),
  "analysis_result": {
    "foods": [...],
    "total_calories": 199,
    // ... full NutritionAnalysisResult
  },
  "image_url": null
}
```

**Indexes**:
- `session_id` (unique)
- `user_id`
- `expires_at` (TTL index for auto-cleanup)

---

#### diet_meals

```javascript
{
  "_id": ObjectId,
  "user_id": "user123",
  "meal_type": "lunch",  // breakfast | lunch | dinner | snack
  "foods": [
    {
      "name": "Grilled Chicken",
      "amount": "150g",
      "calories": 165,
      "protein_g": 31,
      "sodium_mg": 74,
      "potassium_mg": 256,
      "phosphorus_mg": 228,
      "carbs_g": 0,
      "fat_g": 3.6,
      "fiber_g": 0
    }
  ],
  "total_calories": 165,
  "total_protein_g": 31,
  "total_sodium_mg": 74,
  "total_potassium_mg": 256,
  "total_phosphorus_mg": 228,
  "logged_at": ISODate("2025-11-27T12:30:00Z"),
  "notes": "Post-workout meal",
  "image_url": null,
  "created_at": ISODate("2025-11-27T12:35:00Z"),
  "updated_at": ISODate("2025-11-27T12:35:00Z")
}
```

**Indexes**:
- `user_id` + `logged_at` (compound, for efficient date range queries)
- `user_id`

---

#### diet_goals

```javascript
{
  "_id": ObjectId,
  "user_id": "user123",
  "goals": {
    "calories_kcal": 2000,
    "protein_g": 50,
    "sodium_mg": 2000,
    "potassium_mg": 2000,
    "phosphorus_mg": 1000,
    "fluid_ml": 2000
  },
  "created_at": ISODate("2025-11-20T10:00:00Z"),
  "updated_at": ISODate("2025-11-27T14:30:00Z")
}
```

**Indexes**:
- `user_id` (unique)

---

## Technology Stack Rationale

### 1. FastAPI
**Choice**: FastAPI over Flask/Django

**Justification**:
- Native async/await support for OpenAI API calls
- Automatic OpenAPI documentation
- Built-in Pydantic validation reduces boilerplate
- High performance comparable to Node.js

**Trade-offs**:
- Flask is simpler for small projects, but FastAPI scales better
- Django has more built-in features, but is heavier and slower

---

### 2. MongoDB
**Choice**: MongoDB over PostgreSQL

**Justification**:
- Flexible schema for evolving nutrition data models
- Efficient storage of nested food arrays
- Fast document retrieval for user-specific data
- Easy horizontal scaling

**Trade-offs**:
- PostgreSQL offers better ACID guarantees and joins
- MongoDB requires careful index management
- For this use case, document model fits naturally

---

### 3. OpenAI GPT-4 Vision
**Choice**: GPT-4 Vision over Google Vision API or custom ML model

**Justification**:
- State-of-the-art food recognition accuracy
- Natural language understanding for portion sizes
- Contextual recommendations based on CKD stage
- No need to train/maintain custom models

**Trade-offs**:
- Higher cost per request (~$0.01-0.03/image)
- Requires internet connectivity
- Google Vision is cheaper but less contextual
- Custom models are cheaper at scale but require ML expertise

---

### 4. JWT Authentication
**Choice**: JWT over session-based auth

**Justification**:
- Stateless authentication (no server-side session storage)
- Works well with mobile apps
- Easy to integrate with existing auth system
- Can include user_id in claims

**Trade-offs**:
- Cannot revoke tokens before expiration (mitigated with short TTL)
- Slightly larger request size
- Session-based auth is more secure for sensitive operations

---

## Key Considerations

### Scalability

**Current Load**: Single-server deployment can handle ~1000 concurrent users

**10x Growth Strategy**:

1. **Database Scaling**:
   - Enable MongoDB sharding on `user_id`
   - Add read replicas for query distribution
   - Implement connection pooling

2. **API Scaling**:
   - Deploy multiple FastAPI instances behind load balancer
   - Use Redis for distributed caching of user goals
   - Implement rate limiting per user (e.g., 100 requests/hour)

3. **OpenAI API Optimization**:
   - Implement request batching where possible
   - Cache common food analysis results
   - Use smaller image sizes (reduce to 512x512 for lower cost)

4. **Database Indexes**:
   ```javascript
   // Ensure these indexes exist
   db.diet_meals.createIndex({ "user_id": 1, "logged_at": -1 })
   db.diet_sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })
   db.diet_goals.createIndex({ "user_id": 1 }, { unique: true })
   ```

---

### Security

**Primary Threat Vectors**:

1. **Unauthorized Access to User Data**
   - **Mitigation**: JWT validation on all endpoints
   - **Mitigation**: User ownership checks (sessions, meals, goals)
   - **Implementation**: `get_current_user()` dependency

2. **Injection Attacks**
   - **Mitigation**: Pydantic validation on all inputs
   - **Mitigation**: MongoDB parameterized queries (no raw string interpolation)
   - **Mitigation**: File upload validation (image type, size limits)

3. **API Abuse / DDoS**
   - **Mitigation**: Rate limiting (100 requests/hour per user)
   - **Mitigation**: Session expiration (1 hour)
   - **Mitigation**: Image size limits (20MB max)

4. **Sensitive Data Exposure**
   - **Mitigation**: HTTPS in production (TLS 1.3)
   - **Mitigation**: Do not log nutrition data or images
   - **Mitigation**: CORS configuration (whitelist allowed origins)

5. **OpenAI API Key Leakage**
   - **Mitigation**: Store in environment variables (never commit)
   - **Mitigation**: Rotate keys monthly
   - **Mitigation**: Monitor API usage for anomalies

**Security Checklist**:
- [ ] JWT secret key is strong (>256 bits) and environment-based
- [ ] HTTPS enabled in production
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured
- [ ] Image upload size limited
- [ ] OpenAI API key rotated monthly
- [ ] MongoDB authentication enabled
- [ ] User input validated with Pydantic

---

### Observability

**Monitoring Strategy**:

1. **Application Metrics** (via Prometheus):
   - Request rate and latency per endpoint
   - Error rate (4xx, 5xx)
   - OpenAI API response time
   - Session creation rate

2. **Health Checks**:
   ```http
   GET /health
   GET /db-check
   ```

3. **Logging** (via Python logging):
   - Info: Session creation, meal logging, goal updates
   - Warning: Expired sessions, failed validations
   - Error: OpenAI API failures, database errors

4. **Alerts**:
   - OpenAI API error rate >5%
   - Database connection failures
   - Response time >2 seconds (p95)

5. **Debugging**:
   - Include `session_id` in all logs for request tracing
   - Log OpenAI API response length (not content)
   - Track user_id for ownership issues

**Example Log Format**:
```
2025-11-27 10:05:23 INFO [diet_care] Created session session_abc123 for user user123
2025-11-27 10:05:45 INFO [nutrition_analyzer] GPT-4 Vision response received: 1523 characters
2025-11-27 10:06:01 INFO [diet_care] Created meal 674789a1b2c3d4e5f6g7h8i9 for user user123
```

---

### Deployment & CI/CD

**Deployment Architecture**:

```
Client (Mobile/Web)
        ↓
    Load Balancer (nginx)
        ↓
    FastAPI Instances (Docker containers)
        ↓
    MongoDB Cluster (3 replicas)
```

**Docker Deployment**:

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

**CI/CD Pipeline** (GitHub Actions):

```yaml
name: Deploy Diet Care API

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest backend/tests/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          ssh user@server 'cd /app && git pull && docker-compose up -d --build'
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (meal, session) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, missing required fields |
| 401 | Unauthorized | Invalid/missing JWT token |
| 403 | Forbidden | User doesn't own the resource |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | OpenAI API failure, database errors |

---

### Common Error Responses

**Validation Error** (400):
```json
{
  "detail": [
    {
      "loc": ["body", "foods", 0, "calories"],
      "msg": "ensure this value is greater than or equal to 0",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

**Authentication Error** (401):
```json
{
  "detail": "유효하지 않은 인증 토큰입니다"
}
```

**Ownership Error** (403):
```json
{
  "detail": "Session does not belong to this user"
}
```

**Not Found** (404):
```json
{
  "detail": "Session not found"
}
```

**Server Error** (500):
```json
{
  "detail": "Failed to analyze nutrition: OpenAI API connection timeout"
}
```

---

## Testing

### Unit Tests

```python
# backend/tests/test_diet_care.py
import pytest
from app.models.diet_care import FoodItem, NutritionAnalysisResult

def test_food_item_validation():
    """Test FoodItem validation"""
    food = FoodItem(
        name="Chicken",
        amount="100g",
        calories=165,
        protein_g=31,
        sodium_mg=74,
        potassium_mg=256,
        phosphorus_mg=228
    )
    assert food.calories == 165
    assert food.protein_g == 31

def test_negative_calories():
    """Test negative calorie validation"""
    with pytest.raises(ValueError):
        FoodItem(
            name="Invalid",
            amount="100g",
            calories=-10,  # Invalid
            protein_g=0,
            sodium_mg=0,
            potassium_mg=0,
            phosphorus_mg=0
        )
```

### Integration Tests

```python
# backend/tests/test_diet_care_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_token():
    """Get JWT token for testing"""
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    return response.json()["token"]

def test_create_session(auth_token):
    """Test session creation"""
    response = client.post(
        "/api/diet-care/session/create",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    assert "session_id" in response.json()

def test_get_goals(auth_token):
    """Test getting nutrition goals"""
    response = client.get(
        "/api/diet-care/goals",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    goals = response.json()["goals"]
    assert goals["calories_kcal"] == 2000
```

---

## FAQ

### Q: How accurate is the nutrition analysis?

**A**: GPT-4 Vision achieves 80-90% accuracy on common foods. Accuracy is lower for:
- Mixed dishes with many ingredients
- Small portion sizes
- Foods without clear visual markers

We recommend users verify and edit the results before logging.

---

### Q: Can I use this API without images?

**A**: Yes! The `nutri-coach` endpoint accepts text-only descriptions. However, image-based analysis is generally more accurate.

---

### Q: How long are sessions valid?

**A**: Sessions expire after 1 hour. After expiration, you must create a new session.

---

### Q: What happens if I exceed my OpenAI API quota?

**A**: The `nutri-coach` endpoint will return a 500 error. You'll need to upgrade your OpenAI plan or wait for quota reset.

---

### Q: Can I get nutrition data for past dates?

**A**: Yes, use the `logged_at` field when creating meals. The `GET /meals` endpoint supports date range queries.

---

### Q: How is compliance score calculated?

**A**: Compliance score (0-100) is based on how close you stay to your nutrition goals across all nutrients. The formula considers:
- Calorie variance
- Sodium limit adherence
- Potassium limit adherence
- Phosphorus limit adherence

A score of 90+ indicates excellent adherence.

---

### Q: What image formats are supported?

**A**: JPEG, PNG, WebP, GIF. Max size: 20MB. Recommended: JPEG at 1024x1024 or smaller for faster processing.

---

## Changelog

### v1.0.0 (2025-11-27)
- Initial release
- Session management
- GPT-4 Vision nutrition analysis
- Meal logging with CRUD operations
- Nutrition goals management
- Daily/weekly progress tracking
- Logging streak calculation

---

## Support

For API issues or questions:
- GitHub Issues: [Project Repository]
- Email: support@careguide.com
- Documentation: This README

---

## License

Copyright 2025 CareGuide. All rights reserved.
