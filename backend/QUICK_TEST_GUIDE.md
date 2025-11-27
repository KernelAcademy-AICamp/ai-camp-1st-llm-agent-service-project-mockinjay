# Diet Care API - Quick Test Guide

## Prerequisites

1. MongoDB is running on `localhost:27017`
2. Environment variables are set in `.env`
3. Backend server is running: `uvicorn app.main:app --reload`

## Test Sequence

### 1. Health Check
```bash
curl http://localhost:8000/health
```

Expected: `{"status": "healthy"}`

---

### 2. Database Check
```bash
curl http://localhost:8000/db-check
```

Expected: `{"status": "success", "message": "MongoDB 연결 성공"}`

---

### 3. Create Session (No Auth Required)
```bash
curl -X POST "http://localhost:8000/api/session/create?user_id=test_user_123" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "session_id": "session_...",
  "created_at": "2024-01-27T...",
  "expires_at": "2024-01-27T...",
  "session_type": "analysis"
}
```

**Save the `session_id` for next steps!**

---

### 4. Get Nutrition Goals (Requires Auth)

First, login to get a token:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Then get goals:
```bash
curl -X GET "http://localhost:8000/api/diet-care/goals" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: Default goals if not set, or user's custom goals

---

### 5. Analyze Nutrition with Text Only

```bash
curl -X POST "http://localhost:8000/api/diet-care/nutri-coach" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "session_id=SESSION_ID_FROM_STEP_3" \
  -F "text=Grilled chicken breast with steamed broccoli and brown rice" \
  -F "ckd_stage=3"
```

This will call GPT-4 Vision API (requires `OPENAI_API_KEY` in .env)

Expected: Detailed nutrition analysis with foods array, totals, recommendations, and warnings

---

### 6. Create Meal Entry

```bash
curl -X POST "http://localhost:8000/api/diet-care/meals" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
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
    "notes": "Lunch at home"
  }'
```

Expected: `201 Created` with meal details including `id`

---

### 7. Get Meal History

```bash
curl -X GET "http://localhost:8000/api/diet-care/meals" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: List of meals from the last 7 days

---

### 8. Get Daily Progress

```bash
curl -X GET "http://localhost:8000/api/diet-care/progress/daily" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: Daily nutrition progress with percentages and status

---

### 9. Update Goals

```bash
curl -X PUT "http://localhost:8000/api/diet-care/goals" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "calories_kcal": 1800,
    "protein_g": 45,
    "sodium_mg": 1500
  }'
```

Expected: Updated goals response

---

### 10. Get Session Status

```bash
curl -X GET "http://localhost:8000/api/session/SESSION_ID_FROM_STEP_3" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: Session status with analysis result if completed

---

## Testing with Image Upload

Create a test with an actual food image:

```bash
curl -X POST "http://localhost:8000/api/diet-care/nutri-coach" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "session_id=SESSION_ID" \
  -F "image=@/path/to/food-image.jpg" \
  -F "text=What's in this meal?" \
  -F "age=45" \
  -F "weight_kg=70" \
  -F "height_cm=170" \
  -F "ckd_stage=3" \
  -F "activity_level=moderate"
```

This sends both image and text for comprehensive analysis.

---

## Common Issues

### 401 Unauthorized
- Token expired or invalid
- Login again to get a fresh token

### 404 Session Not Found
- Session ID is incorrect
- Session may have expired (sessions last 1 hour)
- Create a new session

### 400 Bad Request
- Missing required fields
- Check the request body matches the expected schema

### 500 Internal Server Error
- Check backend logs: `tail -f backend/logs/app.log`
- Verify OpenAI API key is valid
- Ensure MongoDB is running

---

## API Documentation

Interactive API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Environment Variables Checklist

Make sure these are set in `backend/.env`:

```bash
# Required for nutrition analysis
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=4096

# Required for database
MONGODB_URI=mongodb://localhost:27017

# Required for authentication
SECRET_KEY=your-secret-key-at-least-32-characters-long
```

---

## Quick Frontend Integration Test

Once backend is verified, test from frontend:

```typescript
// In browser console or React component
import { createSession, analyzeNutrition } from './services/dietCareApi';

// 1. Create session
const sessionId = await createSession('user_123');
console.log('Session ID:', sessionId);

// 2. Analyze nutrition
const result = await analyzeNutrition({
  sessionId,
  image: imageFile,  // from file input
  text: 'Chicken salad',
  userProfile: 'patient'
});
console.log('Analysis:', result);
```

---

## Monitoring

Check server logs for detailed information:

```bash
# Backend logs
tail -f backend/logs/app.log

# Or if running with uvicorn directly
# Logs will appear in the terminal
```

---

## Success Criteria

All endpoints should:
1. ✅ Return proper HTTP status codes
2. ✅ Include CORS headers for frontend
3. ✅ Validate input with Pydantic models
4. ✅ Handle errors gracefully
5. ✅ Log important events
6. ✅ Protect routes with authentication where needed

---

**Last Updated**: 2025-01-27
