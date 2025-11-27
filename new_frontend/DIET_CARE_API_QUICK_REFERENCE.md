# Diet Care API - Quick Reference Card

## Import

```typescript
import {
  // Session Management
  createSession,
  getSession,

  // Nutrition Analysis
  analyzeFood,
  analyzeFoodText,

  // Goals
  getGoals,
  saveGoals,

  // Meals
  getMeals,
  logMeal,
  deleteMeal,

  // Progress
  getDailyProgress,
  getWeeklyStats,
  getStreak,

  // Error Handling
  DietCareApiError,
  ErrorCodes,

  // Mocks
  mockAnalyzeFood,
  enableMocks,
  disableMocks,
} from '@/services/dietCareApi';

// Types
import type {
  SessionId,
  MealEntryId,
  UserProfile,
  DietGoals,
  MealType,
  CKDStage,
} from '@/types/diet-care';
```

## Common Patterns

### 1. Create Session & Analyze Food

```typescript
// Step 1: Create session
const { session, goals } = await createSession({
  ckdStage: CKDStage.Stage3a,
  age: 45,
  weight: 70,
  height: 170,
  sex: 'MALE',
  activityLevel: 'MODERATE'
});

// Step 2: Analyze food
const result = await analyzeFood(session.id, imageFile);

if (result.type === 'success') {
  // Step 3: Log meal
  await logMeal('user_123', {
    sessionId: session.id,
    mealType: MealType.Lunch,
    consumedAt: new Date().toISOString(),
    foods: result.foods,
    totals: result.totals
  });
}
```

### 2. Error Handling

```typescript
try {
  const result = await analyzeFood(sessionId, imageFile);
} catch (error) {
  if (error instanceof DietCareApiError) {
    if (error.is(ErrorCodes.NETWORK_ERROR)) {
      toast.error('Network error. Please check your connection.');
    } else if (error.is(ErrorCodes.INVALID_IMAGE)) {
      toast.error('Invalid image. Please try a different photo.');
    } else {
      toast.error(error.message);
    }
  }
}
```

### 3. Request Cancellation

```typescript
const controller = new AbortController();

const promise = analyzeFood(
  sessionId,
  imageFile,
  {},
  controller.signal
);

// Cancel if needed
controller.abort();
```

### 4. React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
const { data: progress } = useQuery({
  queryKey: ['dailyProgress', userId, date],
  queryFn: () => getDailyProgress(userId, date),
});

// Mutation
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (meal) => logMeal(userId, meal),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['meals', userId] });
    queryClient.invalidateQueries({ queryKey: ['dailyProgress', userId] });
  },
});
```

## Function Signatures

### Session Management

```typescript
createSession(
  userProfile: UserProfile,
  goals?: Partial<DietGoals>,
  abortSignal?: AbortSignal
): Promise<SessionCreateResponse>

getSession(
  sessionId: SessionId,
  abortSignal?: AbortSignal
): Promise<DietChatSession | null>
```

### Nutrition Analysis

```typescript
analyzeFood(
  sessionId: SessionId,
  image: File,
  options?: {
    mealType?: MealType;
    notes?: string;
    userProfile?: {...};
  },
  abortSignal?: AbortSignal
): Promise<NutritionAnalysisResult>

analyzeFoodText(
  sessionId: SessionId,
  description: string,
  options?: {
    mealType?: MealType;
    notes?: string;
  },
  abortSignal?: AbortSignal
): Promise<NutritionAnalysisResult>
```

### Goals Management

```typescript
getGoals(
  userId: string,
  abortSignal?: AbortSignal
): Promise<DietGoals>

saveGoals(
  userId: string,
  goals: Partial<DietGoals>,
  abortSignal?: AbortSignal
): Promise<DietGoals>
```

### Meal Logging

```typescript
getMeals(
  userId: string,
  startDate?: string,
  endDate?: string,
  abortSignal?: AbortSignal
): Promise<MealEntry[]>

logMeal(
  userId: string,
  meal: Omit<MealEntry, 'id' | 'createdAt' | 'updatedAt'>,
  abortSignal?: AbortSignal
): Promise<MealEntry>

deleteMeal(
  userId: string,
  mealId: MealEntryId,
  abortSignal?: AbortSignal
): Promise<void>
```

### Progress Tracking

```typescript
getDailyProgress(
  userId: string,
  date?: string,
  abortSignal?: AbortSignal
): Promise<DailyProgressData>

getWeeklyStats(
  userId: string,
  abortSignal?: AbortSignal
): Promise<WeeklyStatsData>

getStreak(
  userId: string,
  abortSignal?: AbortSignal
): Promise<StreakData>
```

## Error Codes

```typescript
ErrorCodes.NETWORK_ERROR      // Network connection failed
ErrorCodes.TIMEOUT             // Request timeout
ErrorCodes.CANCELLED           // Request cancelled by user
ErrorCodes.INVALID_REQUEST     // Invalid request data
ErrorCodes.UNAUTHORIZED        // Authentication required
ErrorCodes.FORBIDDEN           // Access denied
ErrorCodes.NOT_FOUND           // Resource not found
ErrorCodes.VALIDATION_ERROR    // Validation failed
ErrorCodes.SESSION_EXPIRED     // Session no longer valid
ErrorCodes.SERVER_ERROR        // Server error (5xx)
ErrorCodes.INVALID_IMAGE       // Invalid image format
ErrorCodes.ANALYSIS_FAILED     // Analysis processing failed
ErrorCodes.NO_FOOD_DETECTED    // No food in image
```

## Type Guards

```typescript
// Check if analysis was successful
if (result.type === 'success') {
  // TypeScript knows: result.foods, result.totals, result.analysis
  const foods = result.foods;
}

// Check if analysis failed
if (result.type === 'error') {
  // TypeScript knows: result.code, result.message
  const errorCode = result.code;
}
```

## Enums

```typescript
// CKD Stages
CKDStage.Stage1    // GFR >= 90
CKDStage.Stage2    // GFR 60-89
CKDStage.Stage3a   // GFR 45-59
CKDStage.Stage3b   // GFR 30-44
CKDStage.Stage4    // GFR 15-29
CKDStage.Stage5    // GFR < 15

// Meal Types
MealType.Breakfast
MealType.Lunch
MealType.Dinner
MealType.Snack
```

## Mock Mode

```typescript
// Development only
if (env.isDevelopment) {
  enableMocks();  // Enable mock responses
}

// Use mock functions
const result = await mockAnalyzeFood(sessionId, imageFile);
const error = await mockAnalyzeFoodError();
```

## Common Response Shapes

### Success Analysis Result

```typescript
{
  type: 'success',
  foods: [
    {
      id: 'food_1',
      name: 'Chicken Breast',
      servingSize: '150g',
      nutrition: {
        calories: 165,
        protein: 31,
        carbohydrates: 0,
        fat: 3.6,
        sodium: 74,
        potassium: 256,
        phosphorus: 228
      }
    }
  ],
  totals: {
    calories: 165,
    protein: 31,
    // ... aggregated totals
  },
  analysis: 'AI-generated analysis text',
  confidence: 0.95,
  analyzedAt: '2025-01-15T12:00:00Z'
}
```

### Error Analysis Result

```typescript
{
  type: 'error',
  code: 'NO_FOOD_DETECTED',
  message: 'No food items detected',
  details: 'Additional error context',
  occurredAt: '2025-01-15T12:00:00Z'
}
```

### Daily Progress

```typescript
{
  date: '2025-01-15',
  calories: {
    current: 1500,
    target: 2000,
    percentage: 75,
    status: 'under'  // 'under' | 'optimal' | 'over'
  },
  protein: { current: 40, target: 50, percentage: 80, status: 'optimal' },
  sodium: { current: 1800, target: 2000, percentage: 90, status: 'optimal' },
  potassium: { /* ... */ },
  phosphorus: { /* ... */ },
  meals_logged: 2,
  total_meals: 3
}
```

## Best Practices

### ✅ DO

```typescript
// Use try-catch for error handling
try {
  const result = await analyzeFood(sessionId, imageFile);
} catch (error) {
  if (error instanceof DietCareApiError) {
    handleError(error);
  }
}

// Provide abort signal for long operations
const controller = new AbortController();
await analyzeFood(sessionId, imageFile, {}, controller.signal);

// Use type guards for discriminated unions
if (result.type === 'success') {
  // TypeScript knows the exact type
}

// Invalidate queries after mutations
queryClient.invalidateQueries({ queryKey: ['meals', userId] });
```

### ❌ DON'T

```typescript
// Don't ignore errors
await analyzeFood(sessionId, imageFile);  // Missing try-catch

// Don't use 'any' type
const result: any = await analyzeFood(...);  // Loses type safety

// Don't forget to cancel long-running requests
// when component unmounts

// Don't mutate response data (it's readonly)
result.foods.push(newFood);  // TypeScript error
```

## Performance Tips

```typescript
// 1. Cache with React Query
const { data } = useQuery({
  queryKey: ['goals', userId],
  queryFn: () => getGoals(userId),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

// 2. Compress images before upload
const compressed = await compressImage(file, {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920
});

// 3. Use date ranges to limit data
const meals = await getMeals(
  userId,
  '2025-01-08T00:00:00Z',
  '2025-01-15T23:59:59Z'
);

// 4. Batch operations when possible
const mealPromises = meals.map(m => logMeal(userId, m));
await Promise.all(mealPromises);
```

## Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { analyzeFood } from '../dietCareApi';

describe('analyzeFood', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should analyze food successfully', async () => {
    mockAxios.onPost('/api/diet-care/nutri-coach').reply(200, {
      result: { type: 'success', /* ... */ }
    });

    const result = await analyzeFood(sessionId, mockFile);

    expect(result.type).toBe('success');
  });
});
```

## Related Documentation

- **Full API Reference**: `DIET_CARE_API_SERVICE.md`
- **Usage Examples**: `DIET_CARE_API_EXAMPLES.md`
- **Delivery Summary**: `DIET_CARE_API_DELIVERY_SUMMARY.md`
- **Type Definitions**: `/src/types/diet-care.ts`
- **Backend API**: `/backend/DIET_CARE_API_README.md`
