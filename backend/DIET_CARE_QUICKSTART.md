# Diet Care API - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Python 3.11+
- MongoDB running on localhost:27017
- OpenAI API key (for image analysis)

### 1. Environment Setup

```bash
cd /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017"
export OPENAI_API_KEY="sk-your-key-here"
export SECRET_KEY="your-secret-key-256-bits"
```

### 2. Start the Server

```bash
# Assuming dependencies are already installed
uvicorn app.main:app --reload --port 8000
```

Server will start at: http://localhost:8000

### 3. Get a JWT Token

```bash
# Register a user (if not already)
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "profile": "patient"
  }'

# Login to get JWT token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

Save the returned `token` for the next steps.

---

## 📝 Common API Calls

### Create a Session

```bash
TOKEN="your-jwt-token-here"

curl -X POST "http://localhost:8000/api/diet-care/session/create" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "session_id": "session_abc123def456",
  "created_at": "2025-11-27T10:00:00Z",
  "expires_at": "2025-11-27T11:00:00Z"
}
```

---

### Analyze a Meal (Text Only)

```bash
SESSION_ID="session_abc123def456"

curl -X POST "http://localhost:8000/api/diet-care/nutri-coach" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_id=$SESSION_ID" \
  -F "text=Grilled chicken breast 150g with steamed broccoli" \
  -F "ckd_stage=3"
```

---

### Analyze a Meal (With Image)

```bash
curl -X POST "http://localhost:8000/api/diet-care/nutri-coach" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_id=$SESSION_ID" \
  -F "image=@/path/to/meal_photo.jpg" \
  -F "text=Lunch" \
  -F "ckd_stage=3" \
  -F "age=45" \
  -F "weight_kg=70"
```

---

### Log a Meal

```bash
curl -X POST "http://localhost:8000/api/diet-care/meals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
    "notes": "Post-workout meal"
  }'
```

---

### Get Meal History

```bash
# Get meals from last 7 days (default)
curl -X GET "http://localhost:8000/api/diet-care/meals" \
  -H "Authorization: Bearer $TOKEN"

# Get meals for specific date range
curl -X GET "http://localhost:8000/api/diet-care/meals?start_date=2025-11-20&end_date=2025-11-27" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Get Nutrition Goals

```bash
curl -X GET "http://localhost:8000/api/diet-care/goals" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
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

### Update Nutrition Goals

```bash
curl -X PUT "http://localhost:8000/api/diet-care/goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories_kcal": 1800,
    "protein_g": 45,
    "sodium_mg": 1500
  }'
```

---

### Get Daily Progress

```bash
# Get today's progress
curl -X GET "http://localhost:8000/api/diet-care/progress/daily" \
  -H "Authorization: Bearer $TOKEN"

# Get progress for specific date
curl -X GET "http://localhost:8000/api/diet-care/progress/daily?date=2025-11-27" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Get Weekly Summary

```bash
curl -X GET "http://localhost:8000/api/diet-care/progress/weekly" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Get Logging Streak

```bash
curl -X GET "http://localhost:8000/api/diet-care/streak" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Testing with Postman

### Import this Collection

1. Create a new collection named "Diet Care API"
2. Add environment variables:
   - `BASE_URL`: http://localhost:8000
   - `TOKEN`: (your JWT token)

### Example Requests

#### 1. Session Creation
```
POST {{BASE_URL}}/api/diet-care/session/create
Headers:
  Authorization: Bearer {{TOKEN}}
```

#### 2. Nutrition Analysis
```
POST {{BASE_URL}}/api/diet-care/nutri-coach
Headers:
  Authorization: Bearer {{TOKEN}}
Body (form-data):
  session_id: session_xxx
  text: "Grilled chicken with vegetables"
  ckd_stage: 3
```

---

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY environment variable is required"

**Solution:** Set the OpenAI API key in your environment:
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

---

### Issue: "Session not found"

**Cause:** Session expired (1 hour lifetime) or invalid session_id

**Solution:** Create a new session with `/session/create`

---

### Issue: "유효하지 않은 인증 토큰입니다" (Invalid token)

**Cause:** JWT token is missing, expired, or invalid

**Solution:** 
1. Check token is included in Authorization header
2. Login again to get a fresh token
3. Ensure token format is: `Bearer <token>`

---

### Issue: MongoDB connection error

**Solution:**
1. Start MongoDB: `mongod --dbpath /path/to/data`
2. Check MONGODB_URI environment variable
3. Verify MongoDB is running on port 27017

---

## 📊 API Documentation

### Auto-generated Swagger UI
http://localhost:8000/docs

### ReDoc
http://localhost:8000/redoc

### OpenAPI JSON
http://localhost:8000/openapi.json

---

## 🧪 Example Test Workflow

```bash
# 1. Login
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' | jq -r '.token')

# 2. Create session
SESSION=$(curl -s -X POST "http://localhost:8000/api/diet-care/session/create" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.session_id')

echo "Session: $SESSION"

# 3. Analyze meal
curl -X POST "http://localhost:8000/api/diet-care/nutri-coach" \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_id=$SESSION" \
  -F "text=Chicken breast 150g, broccoli 100g" \
  -F "ckd_stage=3" | jq '.'

# 4. Check daily progress
curl -X GET "http://localhost:8000/api/diet-care/progress/daily" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Check streak
curl -X GET "http://localhost:8000/api/diet-care/streak" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 📚 Additional Resources

- **Full API Documentation**: `DIET_CARE_API_README.md`
- **Implementation Status**: `DIET_CARE_IMPLEMENTATION_STATUS.md`
- **Code Location**: `/backend/app/api/diet_care.py`

---

## 💡 Tips

1. **Session Management**: Create a session once and reuse it for multiple analyses
2. **Image Size**: Keep images under 2MB for faster processing
3. **CKD Stage**: Always provide `ckd_stage` for personalized recommendations
4. **Date Ranges**: Use ISO format (YYYY-MM-DD) for date parameters
5. **Partial Updates**: Only include fields you want to change in PUT requests

---

**Need Help?** Check the full documentation in `DIET_CARE_API_README.md`
