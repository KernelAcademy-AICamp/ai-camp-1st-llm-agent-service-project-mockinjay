# Diet Care API Service Layer

## Overview

Production-ready TypeScript API service layer for the Diet Care feature with complete type safety, robust error handling, request cancellation support, automatic retry logic, and mock implementations for development.

## Location

```
/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/services/dietCareApi.ts
```

## Features

- **Complete Type Safety**: Full TypeScript support with strict typing
- **Error Handling**: Custom error types with categorization and retry logic
- **Request Cancellation**: AbortController support for all endpoints
- **Automatic Retry**: Exponential backoff for transient failures
- **Mock Support**: Development mode with realistic mock data
- **Request/Response Transformation**: Automatic data mapping between backend and frontend formats
- **Comprehensive Documentation**: JSDoc comments for all public APIs

## Architecture

### Error Handling

#### DietCareApiError

Custom error class that extends `Error` with additional context:

```typescript
export class DietCareApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'DietCareApiError';
  }

  is(code: string): boolean;
  isRetryable(): boolean;
}
```

#### Error Codes

```typescript
export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',

  // Client errors (4xx)
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Server errors (5xx)
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Analysis specific
  INVALID_IMAGE: 'INVALID_IMAGE',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  NO_FOOD_DETECTED: 'NO_FOOD_DETECTED',

  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;
```

### Retry Logic

Automatic retry with exponential backoff for retryable errors:

```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};
```

Retryable errors include:
- 5xx server errors
- 408 Request Timeout
- 429 Too Many Requests
- Network errors

## API Reference

### Session Management

#### createSession

Create a new diet analysis session with user profile.

```typescript
async function createSession(
  userProfile: UserProfile,
  goals?: Partial<DietGoals>,
  abortSignal?: AbortSignal
): Promise<SessionCreateResponse>
```

**Example:**

```typescript
import { createSession, CKDStage } from '@/services/dietCareApi';

const { session, goals } = await createSession({
  ckdStage: CKDStage.Stage3a,
  age: 45,
  weight: 70,
  height: 170,
  sex: 'MALE',
  activityLevel: 'MODERATE'
});

console.log('Session ID:', session.id);
console.log('Daily sodium limit:', goals.dailySodium, 'mg');
```

#### getSession

Retrieve session information by session ID.

```typescript
async function getSession(
  sessionId: SessionId,
  abortSignal?: AbortSignal
): Promise<DietChatSession | null>
```

**Example:**

```typescript
const session = await getSession('session_123');

if (session) {
  console.log('Session status:', session.status);
  console.log('Message count:', session.messageCount);
}
```

### Nutrition Analysis

#### analyzeFood

Analyze food nutrition from an image using GPT-4 Vision.

```typescript
async function analyzeFood(
  sessionId: SessionId,
  image: File,
  options?: {
    mealType?: MealType;
    notes?: string;
    userProfile?: {
      age?: number;
      weight_kg?: number;
      height_cm?: number;
      ckd_stage?: number;
      activity_level?: string;
    };
  },
  abortSignal?: AbortSignal
): Promise<NutritionAnalysisResult>
```

**Example:**

```typescript
import { analyzeFood, MealType } from '@/services/dietCareApi';

const result = await analyzeFood(sessionId, imageFile, {
  mealType: MealType.Lunch,
  notes: 'Lunch at restaurant',
  userProfile: {
    age: 45,
    weight_kg: 70,
    height_cm: 170,
    ckd_stage: 3,
    activity_level: 'moderate'
  }
});

if (result.type === 'success') {
  console.log('Found foods:', result.foods);
  console.log('Total calories:', result.totals.calories);
  console.log('Analysis:', result.analysis);
  console.log('Confidence:', result.confidence);
} else {
  console.error('Analysis failed:', result.message);
  console.error('Error code:', result.code);
}
```

#### analyzeFoodText

Analyze food nutrition from a text description.

```typescript
async function analyzeFoodText(
  sessionId: SessionId,
  description: string,
  options?: {
    mealType?: MealType;
    notes?: string;
  },
  abortSignal?: AbortSignal
): Promise<NutritionAnalysisResult>
```

**Example:**

```typescript
const result = await analyzeFoodText(
  sessionId,
  '1 cup brown rice with grilled chicken breast and steamed broccoli',
  { mealType: MealType.Dinner }
);
```

### Diet Goals Management

#### getGoals

Get user's nutrition goals or default goals if not set.

```typescript
async function getGoals(
  userId: string,
  abortSignal?: AbortSignal
): Promise<DietGoals>
```

**Example:**

```typescript
const goals = await getGoals('user_123');

console.log('Daily calorie target:', goals.dailyCalories);
console.log('Daily sodium limit:', goals.dailySodium, 'mg');
console.log('Daily protein target:', goals.dailyProtein, 'g');
```

#### saveGoals

Save or update user's nutrition goals.

```typescript
async function saveGoals(
  userId: string,
  goals: Partial<DietGoals>,
  abortSignal?: AbortSignal
): Promise<DietGoals>
```

**Example:**

```typescript
const updatedGoals = await saveGoals('user_123', {
  dailySodium: 1800,  // Reduce sodium to 1800mg
  dailyProtein: 45    // Reduce protein to 45g
});
```

### Meal Logging

#### getMeals

Get meals for a user within a date range.

```typescript
async function getMeals(
  userId: string,
  startDate?: string,
  endDate?: string,
  abortSignal?: AbortSignal
): Promise<MealEntry[]>
```

**Example:**

```typescript
// Get last 7 days of meals
const meals = await getMeals(
  'user_123',
  '2025-01-08T00:00:00Z',
  '2025-01-15T23:59:59Z'
);

console.log('Total meals logged:', meals.length);
meals.forEach(meal => {
  console.log(`${meal.mealType} on ${meal.consumedAt}: ${meal.totals.calories} kcal`);
});
```

#### logMeal

Log a new meal entry.

```typescript
async function logMeal(
  userId: string,
  meal: Omit<MealEntry, 'id' | 'createdAt' | 'updatedAt'>,
  abortSignal?: AbortSignal
): Promise<MealEntry>
```

**Example:**

```typescript
import { logMeal, MealType } from '@/services/dietCareApi';

const meal = await logMeal('user_123', {
  sessionId: 'session_123' as SessionId,
  mealType: MealType.Breakfast,
  consumedAt: new Date().toISOString(),
  foods: [{
    id: 'food_1' as FoodItemId,
    name: 'Oatmeal',
    servingSize: '1 cup',
    nutrition: {
      calories: 150,
      protein: 5,
      carbohydrates: 27,
      fat: 3,
      sodium: 0,
      potassium: 150,
      phosphorus: 180
    }
  }],
  totals: {
    calories: 150,
    protein: 5,
    carbohydrates: 27,
    fat: 3,
    sodium: 0,
    potassium: 150,
    phosphorus: 180,
    itemCount: 1,
    calculatedAt: new Date().toISOString()
  },
  notes: 'Healthy breakfast'
});

console.log('Meal logged with ID:', meal.id);
```

#### deleteMeal

Delete a meal entry.

```typescript
async function deleteMeal(
  userId: string,
  mealId: MealEntryId,
  abortSignal?: AbortSignal
): Promise<void>
```

**Example:**

```typescript
await deleteMeal('user_123', 'meal_456' as MealEntryId);
console.log('Meal deleted successfully');
```

### Progress Tracking

#### getDailyProgress

Get daily nutrition progress with goal comparison.

```typescript
async function getDailyProgress(
  userId: string,
  date?: string,
  abortSignal?: AbortSignal
): Promise<DailyProgressData>
```

**Example:**

```typescript
const progress = await getDailyProgress('user_123', '2025-01-15');

console.log('Date:', progress.date);
console.log('Calories:', progress.calories.current, '/', progress.calories.target);
console.log('Status:', progress.calories.status); // 'under', 'optimal', or 'over'
console.log('Meals logged:', progress.meals_logged, '/', progress.total_meals);
```

#### getWeeklyStats

Get weekly nutrition statistics and compliance scores.

```typescript
async function getWeeklyStats(
  userId: string,
  abortSignal?: AbortSignal
): Promise<WeeklyStatsData>
```

**Example:**

```typescript
const stats = await getWeeklyStats('user_123');

console.log('Week:', stats.week_start, 'to', stats.week_end);
console.log('Average compliance:', stats.average_compliance, '%');
console.log('Current streak:', stats.streak_days, 'days');
console.log('Total meals logged:', stats.total_meals_logged);

stats.daily_summaries.forEach(day => {
  console.log(`${day.date}: ${day.compliance_score}% compliance`);
});
```

#### getStreak

Get user's logging streak information.

```typescript
async function getStreak(
  userId: string,
  abortSignal?: AbortSignal
): Promise<StreakData>
```

**Example:**

```typescript
const streak = await getStreak('user_123');

console.log('Current streak:', streak.current_streak, 'days');
console.log('Longest streak:', streak.longest_streak, 'days');
console.log('Last log date:', streak.last_log_date);
```

## Request Cancellation

All API functions support request cancellation via AbortController:

```typescript
const controller = new AbortController();

// Start request
const promise = analyzeFood(sessionId, imageFile, {}, controller.signal);

// Cancel request if needed (e.g., user navigates away)
controller.abort();

try {
  await promise;
} catch (error) {
  if (error instanceof DietCareApiError && error.code === ErrorCodes.CANCELLED) {
    console.log('Request cancelled by user');
  }
}
```

## Error Handling Best Practices

### Basic Error Handling

```typescript
import { DietCareApiError, ErrorCodes } from '@/services/dietCareApi';

try {
  const result = await analyzeFood(sessionId, imageFile);
  // Handle success
} catch (error) {
  if (error instanceof DietCareApiError) {
    console.error('API Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Status Code:', error.statusCode);

    // Check specific error types
    if (error.is(ErrorCodes.UNAUTHORIZED)) {
      // Redirect to login
    } else if (error.is(ErrorCodes.NETWORK_ERROR)) {
      // Show offline message
    } else if (error.is(ErrorCodes.INVALID_IMAGE)) {
      // Prompt user to upload different image
    }
  }
}
```

### Retry Logic

```typescript
// Automatic retry is built-in for retryable errors
try {
  const result = await analyzeFood(sessionId, imageFile);
} catch (error) {
  if (error instanceof DietCareApiError) {
    if (error.isRetryable()) {
      // Already retried automatically, inform user
      toast.error('Server is temporarily unavailable. Please try again later.');
    } else {
      // Not retryable, handle immediately
      toast.error(error.message);
    }
  }
}
```

### Discriminated Union Pattern

```typescript
const result = await analyzeFood(sessionId, imageFile);

// TypeScript knows the type based on discriminator
if (result.type === 'success') {
  // result is NutritionAnalysisSuccess
  console.log('Foods found:', result.foods.length);
  console.log('Confidence:', result.confidence);
} else {
  // result is NutritionAnalysisError
  console.error('Analysis failed:', result.message);
  console.error('Error code:', result.code);
}
```

## Mock Implementation

### Enable Mocks for Development

```typescript
import { enableMocks, disableMocks, shouldUseMocks } from '@/services/dietCareApi';

// Enable mock mode (only works in development)
enableMocks();

// Check if mocks are enabled
if (shouldUseMocks()) {
  console.log('Using mock data');
}

// Disable mocks
disableMocks();
```

### Use Mock Functions

```typescript
import { mockAnalyzeFood, mockAnalyzeFoodError } from '@/services/dietCareApi';

// Mock successful analysis
const result = await mockAnalyzeFood(sessionId, imageFile);

// Mock error scenario
const errorResult = await mockAnalyzeFoodError();
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { analyzeFood, DietCareApiError, ErrorCodes } from '../dietCareApi';

describe('analyzeFood', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should analyze food successfully', async () => {
    const sessionId = 'session_123' as SessionId;
    const mockFile = new File(['mock'], 'food.jpg', { type: 'image/jpeg' });

    mockAxios.onPost('/api/diet-care/nutri-coach').reply(200, {
      result: {
        type: 'success',
        foods: [/* mock foods */],
        totals: {/* mock totals */},
        analysis: 'Healthy meal',
        confidence: 0.95,
        analyzedAt: new Date().toISOString()
      }
    });

    const result = await analyzeFood(sessionId, mockFile);

    expect(result.type).toBe('success');
  });

  it('should handle errors correctly', async () => {
    const sessionId = 'session_123' as SessionId;
    const mockFile = new File(['mock'], 'food.jpg', { type: 'image/jpeg' });

    mockAxios.onPost('/api/diet-care/nutri-coach').reply(500, {
      code: ErrorCodes.SERVER_ERROR,
      message: 'Server error'
    });

    await expect(analyzeFood(sessionId, mockFile)).rejects.toThrow(DietCareApiError);
  });
});
```

### Integration Test Example

```typescript
import { createSession, analyzeFood, logMeal } from '@/services/dietCareApi';

// Full workflow test
async function testFullWorkflow() {
  // 1. Create session
  const { session, goals } = await createSession({
    ckdStage: CKDStage.Stage3a,
    age: 45,
    weight: 70,
    height: 170,
    sex: 'MALE',
    activityLevel: 'MODERATE'
  });

  // 2. Analyze food
  const result = await analyzeFood(session.id, imageFile, {
    mealType: MealType.Lunch
  });

  if (result.type === 'success') {
    // 3. Log meal
    const meal = await logMeal('user_123', {
      sessionId: session.id,
      mealType: MealType.Lunch,
      consumedAt: new Date().toISOString(),
      foods: result.foods,
      totals: result.totals
    });

    console.log('Workflow completed successfully');
  }
}
```

## Type Guards

Use type guards for runtime type checking:

```typescript
function isNutritionSuccess(
  result: NutritionAnalysisResult
): result is NutritionAnalysisSuccess {
  return result.type === 'success';
}

function isNutritionError(
  result: NutritionAnalysisResult
): result is NutritionAnalysisError {
  return result.type === 'error';
}

// Usage
const result = await analyzeFood(sessionId, imageFile);

if (isNutritionSuccess(result)) {
  // TypeScript knows result is NutritionAnalysisSuccess
  const foods = result.foods;
} else if (isNutritionError(result)) {
  // TypeScript knows result is NutritionAnalysisError
  const errorCode = result.code;
}
```

## Performance Considerations

### Request Timeouts

Different endpoints have different timeout configurations:

- Image analysis: 60 seconds (GPT-4 Vision processing)
- Text analysis: 30 seconds
- Other endpoints: Default axios timeout (2 minutes from api.ts)

### Caching Strategy

Consider implementing a caching layer for:
- User goals (cache with 5-minute TTL)
- Meal entries (cache with 1-minute TTL)
- Progress data (cache with 30-second TTL)

Example with React Query:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getGoals } from '@/services/dietCareApi';

function useUserGoals(userId: string) {
  return useQuery({
    queryKey: ['dietGoals', userId],
    queryFn: () => getGoals(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

## Accessibility Considerations

When using the API in UI components:

1. **Loading States**: Show loading indicators during API calls
2. **Error Messages**: Display user-friendly error messages
3. **Success Feedback**: Confirm successful operations
4. **Retry Options**: Provide retry button for failed requests
5. **Offline Support**: Handle network errors gracefully

## Security Best Practices

1. **Authentication**: All requests automatically include auth token from storage
2. **HTTPS Only**: API base URL should always use HTTPS in production
3. **Input Validation**: Validate all user input before sending to API
4. **File Upload**: Validate file type and size before upload
5. **Error Messages**: Don't expose sensitive information in error messages

## Production Checklist

Before deploying to production:

- [ ] Environment variables configured correctly
- [ ] Mock mode disabled in production
- [ ] Error tracking integrated (e.g., Sentry)
- [ ] Analytics tracking added for key events
- [ ] All API endpoints tested
- [ ] Error handling tested for all endpoints
- [ ] Request cancellation tested
- [ ] Timeout handling tested
- [ ] Retry logic tested
- [ ] Type safety verified
- [ ] Documentation reviewed

## Related Files

- **Type Definitions**: `/src/types/diet-care.ts`
- **API Types**: `/src/types/diet-care.api.ts`
- **Base API**: `/src/services/api.ts`
- **Environment Config**: `/src/config/env.ts`
- **Constants**: `/src/config/constants.ts`
- **Backend API**: `/backend/app/api/diet_care.py`

## Support

For issues or questions:
1. Check the type definitions in `/src/types/diet-care.ts`
2. Review backend API documentation in `/backend/DIET_CARE_API_README.md`
3. Consult error codes in this document
4. Check test files for usage examples

## Version History

- **v1.0.0** (2025-01-27): Initial production release
  - Complete API coverage for all Diet Care endpoints
  - Error handling with custom error types
  - Retry logic with exponential backoff
  - Request cancellation support
  - Mock implementations for development
  - Comprehensive test coverage
