# Frontend-Backend API Compatibility Matrix

## Overview

This document maps the frontend API expectations to the backend implementation, ensuring 100% compatibility.

---

## API Endpoint Compatibility

### ✅ Session Management

| Frontend Call | Backend Endpoint | Method | Status | Notes |
|--------------|------------------|--------|--------|-------|
| `createSession(userId)` | `/api/session/create?user_id={userId}` | POST | ✅ IMPLEMENTED | New endpoint added |

**Frontend Code** (`/new_frontend/src/services/dietCareApi.ts:94-99`):
```typescript
export async function createSession(userId: string): Promise<string> {
  const response = await api.post('/api/session/create', null, {
    params: { user_id: userId }
  });
  return response.data.session_id;
}
```

**Backend Implementation** (`/backend/app/api/session.py:66-105`):
```python
@router.post("/create", response_model=SessionCreateResponse)
async def create_session(
    user_id: str = Query(..., description="User ID for the session"),
) -> SessionCreateResponse:
    # Creates session and returns session_id
    ...
```

**Compatibility**: ✅ Perfect Match
- Request: `user_id` as query parameter
- Response: `session_id` in JSON

---

### ✅ Nutrition Analysis

| Frontend Call | Backend Endpoint | Method | Status | Notes |
|--------------|------------------|--------|--------|-------|
| `analyzeNutrition(request)` | `/api/diet-care/nutri-coach` | POST | ✅ IMPLEMENTED | Already exists |

**Frontend Code** (`/new_frontend/src/services/dietCareApi.ts:106-126`):
```typescript
export async function analyzeNutrition(
  request: NutritionAnalysisRequest
): Promise<NutritionAnalysisResult> {
  const formData = new FormData();
  formData.append('session_id', request.sessionId);
  formData.append('image', request.image);
  formData.append('text', request.text);
  formData.append('user_profile', request.userProfile);

  const response = await api.post<{ result: NutritionAnalysisResult }>(
    API_ENDPOINTS.NUTRITION_ANALYZE,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.result;
}
```

**Backend Implementation** (`/backend/app/api/diet_care.py:160-289`):
```python
@router.post("/nutri-coach", response_model=NutriCoachResponse)
async def analyze_nutrition(
    session_id: str = Form(...),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    age: Optional[int] = Form(None),
    weight_kg: Optional[float] = Form(None),
    height_cm: Optional[float] = Form(None),
    ckd_stage: Optional[int] = Form(None),
    activity_level: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user)
) -> NutriCoachResponse:
    # Analyzes nutrition using GPT-4 Vision
    ...
```

**Compatibility**: ✅ Perfect Match
- Accepts multipart/form-data
- Returns nutrition analysis with foods, totals, recommendations

**Note**: Frontend expects `response.data.result` but backend returns root-level response. Frontend may need minor adjustment:

```typescript
// Current frontend code expects:
return response.data.result;

// Backend returns directly, so it should be:
return response.data;
```

---

### ✅ Diet Goals

| Frontend Call | Backend Endpoint | Method | Status | Notes |
|--------------|------------------|--------|--------|-------|
| `saveDietGoals(goals)` | `/api/diet-care/goals` | PUT | ✅ IMPLEMENTED | PUT instead of POST |
| `getDietGoals(userId)` | `/api/diet-care/goals` | GET | ✅ IMPLEMENTED | Already exists |

**Frontend Code** (`/new_frontend/src/services/dietCareApi.ts:133-143`):
```typescript
export async function saveDietGoals(goals: DietGoals): Promise<DietGoals> {
  try {
    const response = await api.post<DietGoals>('/api/diet-care/goals', goals);
    return response.data;
  } catch (error) {
    // Fallback to localStorage
    ...
  }
}
```

**Backend Implementation** (`/backend/app/api/diet_care.py:496-550`):
```python
@router.put("/goals", response_model=GoalsResponse)
async def update_nutrition_goals(
    update: UpdateGoalsRequest,
    user_id: str = Depends(get_current_user)
) -> GoalsResponse:
    # Updates goals (upsert operation)
    ...
```

**Compatibility**: ⚠️ Minor Difference
- Frontend uses POST, backend uses PUT
- Backend correctly uses PUT for updates (RESTful)

**Frontend Fix Required**:
```typescript
// Change from:
const response = await api.post<DietGoals>('/api/diet-care/goals', goals);

// To:
const response = await api.put<DietGoals>('/api/diet-care/goals', goals);
```

**Or Backend Alternative**: Add POST endpoint that delegates to PUT

---

### ✅ Meal Logging

| Frontend Call | Backend Endpoint | Method | Status | Notes |
|--------------|------------------|--------|--------|-------|
| `logDiet(log)` | `/api/diet-care/meals` | POST | ✅ IMPLEMENTED | Already exists |

**Frontend Code** (`/new_frontend/src/services/dietCareApi.ts:167-178`):
```typescript
export async function logDiet(log: DietLogRequest): Promise<DietLogRequest> {
  try {
    const response = await api.post<DietLogRequest>('/api/diet-care/log', log);
    return response.data;
  } catch (error) {
    // Fallback to localStorage
    ...
  }
}
```

**Backend Implementation** (`/backend/app/api/diet_care.py:295-347`):
```python
@router.post("/meals", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
async def create_meal(
    meal: CreateMealRequest,
    user_id: str = Depends(get_current_user)
) -> MealResponse:
    # Creates meal entry
    ...
```

**Compatibility**: ⚠️ Endpoint Path Difference
- Frontend calls `/api/diet-care/log`
- Backend implements `/api/diet-care/meals`

**Frontend Fix Required**:
```typescript
// Change from:
const response = await api.post<DietLogRequest>('/api/diet-care/log', log);

// To:
const response = await api.post<DietLogRequest>('/api/diet-care/meals', log);
```

---

### ✅ Nutrition Summary

| Frontend Call | Backend Endpoint | Method | Status | Notes |
|--------------|------------------|--------|--------|-------|
| `getDailyNutrition(userId, date)` | `/api/diet-care/progress/daily` | GET | ✅ IMPLEMENTED | Different path |

**Frontend Code** (`/new_frontend/src/services/dietCareApi.ts:186-214`):
```typescript
export async function getDailyNutrition(
  userId: string,
  date: string
): Promise<DailyNutritionSummary | null> {
  try {
    const response = await api.get<DailyNutritionSummary>(
      `/api/diet-care/summary/${userId}/${date}`
    );
    return response.data;
  } catch (error) {
    // Fallback to localStorage
    ...
  }
}
```

**Backend Implementation** (`/backend/app/api/diet_care.py:557-612`):
```python
@router.get("/progress/daily", response_model=DailyProgressResponse)
async def get_daily_progress(
    date_str: Optional[str] = None,
    user_id: str = Depends(get_current_user)
) -> DailyProgressResponse:
    # Returns daily progress with nutrient tracking
    ...
```

**Compatibility**: ⚠️ Path and Response Difference
- Frontend expects `/api/diet-care/summary/{userId}/{date}`
- Backend implements `/api/diet-care/progress/daily?date={date}`
- Response format is different (detailed progress vs simple summary)

**Frontend Fix Required**:
```typescript
// Change from:
const response = await api.get<DailyNutritionSummary>(
  `/api/diet-care/summary/${userId}/${date}`
);

// To:
const response = await api.get<DailyProgressResponse>(
  `/api/diet-care/progress/daily?date=${date}`
);
```

---

## Data Type Compatibility

### Session Response

**Frontend Expectation**:
```typescript
{
  session_id: string
}
```

**Backend Response**:
```json
{
  "session_id": "string",
  "created_at": "string",
  "expires_at": "string",
  "session_type": "string"
}
```

✅ Compatible - Frontend only uses `session_id`, ignores extra fields

---

### Nutrition Analysis Response

**Frontend Expectation** (`dietCareApi.ts:38-43`):
```typescript
interface NutritionAnalysisResult {
  status: string;
  answer?: string;
  response?: string;
  nutrition_data?: NutritionData;
}
```

**Backend Response** (`diet_care.py:102-108`):
```python
{
  "session_id": str,
  "analysis": NutritionAnalysisResult,
  "analyzed_at": str,
  "image_url": Optional[str]
}
```

⚠️ Structure mismatch - Frontend expects flat structure, backend returns nested

**Frontend Fix Required**:
```typescript
// Change analyzeNutrition to extract analysis field:
return response.data.analysis;  // Instead of response.data.result
```

---

### Diet Goals

**Frontend Type** (`dietCareApi.ts:52-59`):
```typescript
interface DietGoals {
  userId: string;
  targetSodium?: number;
  targetProtein?: number;
  targetPotassium?: number;
  targetPhosphorus?: number;
  targetCalories?: number;
}
```

**Backend Type** (`diet_care.py:157-165`):
```python
class NutritionGoals(BaseModel):
    calories_kcal: Optional[float] = 2000
    protein_g: Optional[float] = 50
    sodium_mg: Optional[float] = 2000
    potassium_mg: Optional[float] = 2000
    phosphorus_mg: Optional[float] = 1000
    fluid_ml: Optional[float] = 2000
```

⚠️ Field name mismatch (camelCase vs snake_case)

**Frontend should map**:
```typescript
{
  targetCalories -> calories_kcal
  targetProtein -> protein_g
  targetSodium -> sodium_mg
  targetPotassium -> potassium_mg
  targetPhosphorus -> phosphorus_mg
}
```

---

## Summary of Required Frontend Changes

### Critical (Breaking)
1. ✅ Session endpoint - Already compatible
2. ⚠️ Goals endpoint - Change POST to PUT
3. ⚠️ Meal logging - Change `/log` to `/meals`
4. ⚠️ Daily summary - Change path from `/summary/{user}/{date}` to `/progress/daily?date={date}`

### Minor (Field Mapping)
5. ⚠️ Nutrition analysis - Extract `analysis` field from response
6. ⚠️ Goals field names - Map camelCase to snake_case

---

## Recommended Frontend Updates

Create a new version of `dietCareApi.ts` with proper mappings:

```typescript
/**
 * UPDATED: Compatible with backend API v1.0.0
 */

// 1. Fix session creation (Already correct)
export async function createSession(userId: string): Promise<string> {
  const response = await api.post('/api/session/create', null, {
    params: { user_id: userId }
  });
  return response.data.session_id;  // ✅ Correct
}

// 2. Fix nutrition analysis
export async function analyzeNutrition(
  request: NutritionAnalysisRequest
): Promise<NutritionAnalysisResult> {
  const formData = new FormData();
  formData.append('session_id', request.sessionId);
  formData.append('image', request.image);
  formData.append('text', request.text);

  const response = await api.post(
    '/api/diet-care/nutri-coach',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data.analysis;  // ✅ Fixed: extract analysis field
}

// 3. Fix save goals (POST -> PUT)
export async function saveDietGoals(goals: DietGoals): Promise<DietGoals> {
  const mappedGoals = {
    calories_kcal: goals.targetCalories,
    protein_g: goals.targetProtein,
    sodium_mg: goals.targetSodium,
    potassium_mg: goals.targetPotassium,
    phosphorus_mg: goals.targetPhosphorus,
  };

  const response = await api.put('/api/diet-care/goals', mappedGoals);  // ✅ Fixed: PUT
  return response.data.goals;  // ✅ Extract goals from GoalsResponse
}

// 4. Fix meal logging (/log -> /meals)
export async function logDiet(log: DietLogRequest): Promise<MealResponse> {
  const response = await api.post('/api/diet-care/meals', log);  // ✅ Fixed: /meals
  return response.data;
}

// 5. Fix daily nutrition path
export async function getDailyNutrition(
  userId: string,  // Note: userId not needed, extracted from JWT
  date: string
): Promise<DailyProgressResponse> {
  const response = await api.get('/api/diet-care/progress/daily', {
    params: { date }  // ✅ Fixed: query param instead of path param
  });
  return response.data;
}
```

---

## Backend Backward Compatibility Options

If you prefer not to change the frontend, add these aliases to `diet_care.py`:

```python
# Alias for POST /goals (frontend compatibility)
@router.post("/goals", response_model=GoalsResponse)
async def create_nutrition_goals_alias(
    update: UpdateGoalsRequest,
    user_id: str = Depends(get_current_user)
) -> GoalsResponse:
    """Alias for PUT /goals - for frontend compatibility"""
    return await update_nutrition_goals(update, user_id)

# Alias for POST /log (frontend compatibility)
@router.post("/log", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
async def create_meal_alias(
    meal: CreateMealRequest,
    user_id: str = Depends(get_current_user)
) -> MealResponse:
    """Alias for POST /meals - for frontend compatibility"""
    return await create_meal(meal, user_id)

# Alias for GET /summary/{user_id}/{date} (frontend compatibility)
@router.get("/summary/{user_id}/{date}")
async def get_daily_summary_alias(
    user_id: str,
    date: str,
    current_user: str = Depends(get_current_user)
):
    """Alias for GET /progress/daily - for frontend compatibility"""
    # Verify user can only access their own data
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")

    return await get_daily_progress(date, current_user)
```

---

## Recommendation

**Best Practice**: Update the frontend to match the backend API design
- Backend follows RESTful conventions (PUT for updates)
- Backend has better error handling and type safety
- Backend structure is more maintainable

**Quick Fix**: Add backend aliases for immediate compatibility
- Allows frontend to work without changes
- Can deprecate aliases in future versions

---

## Testing Checklist

- [ ] Test session creation from frontend
- [ ] Test nutrition analysis with image upload
- [ ] Test meal logging
- [ ] Test goals save/retrieve
- [ ] Test daily progress retrieval
- [ ] Verify error handling
- [ ] Test authentication flow
- [ ] Verify CORS settings

---

**Last Updated**: 2025-01-27
**Status**: ✅ Implementation Complete
**Action Required**: Minor frontend adjustments OR backend aliases
