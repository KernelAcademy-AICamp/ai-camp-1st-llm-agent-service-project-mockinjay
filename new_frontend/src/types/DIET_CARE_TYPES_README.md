# Diet Care Type System Documentation

A comprehensive, production-ready TypeScript type system for the Diet Care feature with strict type safety, advanced patterns, and full JSDoc documentation.

## Overview

This type system provides:
- **Type Safety**: Strict TypeScript types with branded IDs and discriminated unions
- **Runtime Validation**: Type guards and validators for runtime type checking
- **State Management**: Type-safe state machines and async state patterns
- **API Contracts**: Complete request/response types for backend integration
- **Constants**: Type-safe constants with `as const` assertions

## File Structure

```
src/types/
├── diet-care.ts              # Core domain types
├── diet-care.api.ts          # API request/response types
├── diet-care.guards.ts       # Type guards and validators
├── diet-care.utils.ts        # Utility types and helpers
├── diet-care.constants.ts    # Type-safe constants
└── index.ts                  # Re-exports all types
```

## Core Types (`diet-care.ts`)

### Branded Types

Branded types prevent accidental mixing of different ID types:

```typescript
import { SessionId, MealEntryId, FoodItemId } from '@/types';

// Compile-time type safety - these cannot be mixed
const sessionId: SessionId = 'session-123' as SessionId;
const mealId: MealEntryId = 'meal-456' as MealEntryId;

// ❌ Type error: Type 'MealEntryId' is not assignable to type 'SessionId'
const wrongId: SessionId = mealId;
```

### Enums

```typescript
import { CKDStage, MealType } from '@/types';

// CKD stages from Stage 1 (normal) to Stage 5 (kidney failure)
const stage: CKDStage = CKDStage.Stage3a;

// Meal types for daily tracking
const meal: MealType = MealType.Breakfast;
```

### Nutrition Data

```typescript
import { NutrientData, FoodItem, NutrientTotals } from '@/types';

const nutrition: NutrientData = {
  calories: 250,
  protein: 15,
  carbohydrates: 30,
  fat: 8,
  sodium: 400,
  potassium: 300,
  phosphorus: 200,
  fiber: 5,      // optional
  sugar: 10,     // optional
};

const food: FoodItem = {
  id: 'food-123' as FoodItemId,
  name: 'Grilled Chicken Breast',
  servingSize: '100g',
  nutrition,
  category: 'protein',
};
```

### Discriminated Unions

The analysis result uses discriminated unions for type-safe error handling:

```typescript
import { NutritionAnalysisResult, isNutritionSuccess } from '@/types';

function handleAnalysis(result: NutritionAnalysisResult) {
  if (result.type === 'success') {
    // TypeScript knows result is NutritionAnalysisSuccess
    console.log(result.foods);
    console.log(result.totals);
    console.log(result.confidence);
  } else {
    // TypeScript knows result is NutritionAnalysisError
    console.error(result.code);
    console.error(result.message);
  }
}

// Or use type guards
function handleWithGuard(result: NutritionAnalysisResult) {
  if (isNutritionSuccess(result)) {
    // result is narrowed to NutritionAnalysisSuccess
    const foods = result.foods;
  }
}
```

### User Profile & Goals

```typescript
import { UserProfile, DietGoals, CKDStage } from '@/types';

const profile: UserProfile = {
  ckdStage: CKDStage.Stage3a,
  age: 55,
  weight: 75,
  height: 170,
  sex: 'MALE',
  activityLevel: 'MODERATE',
  allergies: ['peanuts', 'shellfish'],
  dietaryPreferences: ['VEGETARIAN'],
};

const goals: DietGoals = {
  ckdStage: CKDStage.Stage3a,
  dailyCalories: 2000,
  dailyProtein: 50,
  dailySodium: 1800,
  dailyPotassium: 2500,
  dailyPhosphorus: 850,
};
```

## API Types (`diet-care.api.ts`)

### Session Management

```typescript
import { SessionCreateRequest, SessionCreateResponse } from '@/types';

const createRequest: SessionCreateRequest = {
  userProfile: {
    ckdStage: CKDStage.Stage3a,
    age: 55,
    weight: 75,
    height: 170,
    sex: 'MALE',
    activityLevel: 'MODERATE',
  },
};

// Backend response is fully typed
const response: SessionCreateResponse = await api.createSession(createRequest);
console.log(response.session.id);
console.log(response.goals.dailyCalories);
```

### Nutrition Analysis

```typescript
import {
  NutritionAnalysisImageRequest,
  NutritionAnalysisResponse
} from '@/types';

// Image analysis
const imageRequest: NutritionAnalysisImageRequest = {
  sessionId: 'session-123' as SessionId,
  image: imageFile, // File object
  mealType: MealType.Lunch,
  notes: 'Lunch at home',
};

const response: NutritionAnalysisResponse = await api.analyzeImage(imageRequest);

if (response.result.type === 'success') {
  console.log(`Found ${response.result.foods.length} foods`);
  console.log(`Confidence: ${response.result.confidence}`);
}
```

### Meal Logging

```typescript
import { MealLogCreateRequest, MealLogResponse } from '@/types';

const logRequest: MealLogCreateRequest = {
  sessionId: 'session-123' as SessionId,
  mealType: MealType.Lunch,
  consumedAt: new Date().toISOString(),
  analysisResult: analysisResult,
  notes: 'Delicious and healthy!',
};

const response: MealLogResponse = await api.logMeal(logRequest);
console.log(response.mealEntry.id);
```

### Pagination

```typescript
import { PaginatedResponse, MealLogQueryRequest } from '@/types';

const queryRequest: MealLogQueryRequest = {
  sessionId: 'session-123' as SessionId,
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z',
  page: 1,
  pageSize: 20,
};

const response: PaginatedResponse<MealEntry> = await api.queryMealLogs(queryRequest);
console.log(`Page ${response.page} of ${response.totalPages}`);
console.log(`${response.items.length} items, ${response.total} total`);
```

## Type Guards (`diet-care.guards.ts`)

### Analysis Result Guards

```typescript
import { isNutritionSuccess, isNutritionError } from '@/types';

if (isNutritionSuccess(result)) {
  // result is NutritionAnalysisSuccess
  const foods = result.foods;
}

if (isNutritionError(result)) {
  // result is NutritionAnalysisError
  const errorCode = result.code;
}
```

### Validation Guards

```typescript
import {
  isImageFile,
  isValidFileSize,
  isValidNutrientData,
  isValidFoodItem,
  isCKDStage,
  isMealType,
} from '@/types';

// File validation
if (!isImageFile(file)) {
  throw new Error('File must be an image');
}

if (!isValidFileSize(file, 10 * 1024 * 1024)) {
  throw new Error('File too large');
}

// Data validation
if (!isValidNutrientData(data)) {
  throw new Error('Invalid nutrient data');
}

// Enum validation
if (isCKDStage(value)) {
  // value is CKDStage
}
```

### Nutrient Validation

```typescript
import { isValidNutrientValue, isValidPercentage } from '@/types';

const calories = 2000;
if (isValidNutrientValue(calories, 0, 5000)) {
  // calories is within acceptable range
}

const adherence = 85;
if (isValidPercentage(adherence)) {
  // adherence is 0-100
}
```

## Utility Types (`diet-care.utils.ts`)

### AsyncState Pattern

```typescript
import { AsyncState } from '@/types';

type AnalysisState = AsyncState<NutritionAnalysisResult, Error>;

// Idle state
const idle: AnalysisState = { status: 'idle' };

// Loading state
const loading: AnalysisState = {
  status: 'loading',
  progress: 0.5
};

// Success state
const success: AnalysisState = {
  status: 'success',
  data: analysisResult,
};

// Error state
const error: AnalysisState = {
  status: 'error',
  error: new Error('Analysis failed'),
};

// Type-safe state handling
function handleState(state: AnalysisState) {
  switch (state.status) {
    case 'idle':
      return 'Not started';
    case 'loading':
      return `Loading: ${(state.progress ?? 0) * 100}%`;
    case 'success':
      return `Found ${state.data.type === 'success' ? state.data.foods.length : 0} foods`;
    case 'error':
      return `Error: ${state.error.message}`;
  }
}
```

### Form State

```typescript
import { FormField, FormState } from '@/types';

interface ProfileForm {
  age: number;
  weight: number;
  height: number;
}

const formState: FormState<ProfileForm> = {
  age: { value: 55, touched: true, error: undefined },
  weight: { value: 75, touched: true, error: undefined },
  height: { value: 170, touched: false, error: 'Required' },
};
```

### State Machines

```typescript
import { ImageUploadState, AnalysisStateMachine } from '@/types';

// Image upload state machine
let uploadState: ImageUploadState = { stage: 'initial' };

uploadState = {
  stage: 'selected',
  file: imageFile,
  previewUrl: 'blob:...',
};

uploadState = {
  stage: 'uploading',
  file: imageFile,
  previewUrl: 'blob:...',
  progress: 0.5,
};

// Analysis state machine
let analysisState: AnalysisStateMachine = { state: 'idle' };

analysisState = {
  state: 'analyzing',
  input: imageFile,
  startedAt: new Date().toISOString(),
};

analysisState = {
  state: 'completed',
  input: imageFile,
  result: analysisResult,
  analyzedAt: new Date().toISOString(),
};
```

### Result and Option Types

```typescript
import { Result, Option, Ok, Err, Some, None } from '@/types';

// Result type (similar to Rust)
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('Division by zero');
  }
  return Ok(a / b);
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}

// Option type
function findFood(id: string): Option<FoodItem> {
  const food = database.find(id);
  if (food) {
    return Some(food);
  }
  return None();
}

const foodOption = findFood('food-123');
if (foodOption.some) {
  console.log(foodOption.value.name);
}
```

### Advanced Utility Types

```typescript
import {
  DeepReadonly,
  DeepPartial,
  KeysOfType,
  RequireAtLeastOne,
  RequireExactlyOne,
} from '@/types';

// Deep readonly
type ReadonlyConfig = DeepReadonly<DietGoals>;

// Deep partial
type PartialUpdate = DeepPartial<UserProfile>;

// Keys of specific type
type NumberKeys = KeysOfType<NutrientData, number>; // All keys

// Require at least one property
type UpdateGoals = RequireAtLeastOne<DietGoals>;

// Require exactly one property
type SingleFilter = RequireExactlyOne<{
  byDate: string;
  byMealType: MealType;
  byId: string;
}>;
```

## Constants (`diet-care.constants.ts`)

### Nutrient Limits

```typescript
import { NUTRIENT_LIMITS, CKDStage } from '@/types';

const stage3aLimits = NUTRIENT_LIMITS[CKDStage.Stage3a];
console.log(stage3aLimits.protein.max); // 60g
console.log(stage3aLimits.sodium.max); // 2000mg
```

### Meal Type Info

```typescript
import { MEAL_TYPE_INFO, MealType } from '@/types';

const breakfastInfo = MEAL_TYPE_INFO[MealType.Breakfast];
console.log(breakfastInfo.label); // "Breakfast"
console.log(breakfastInfo.caloriePercentage); // 25
```

### File Constraints

```typescript
import { IMAGE_FILE_CONSTRAINTS } from '@/types';

if (file.size > IMAGE_FILE_CONSTRAINTS.maxSizeBytes) {
  throw new Error('File too large');
}

if (!IMAGE_FILE_CONSTRAINTS.acceptedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}
```

### API Endpoints

```typescript
import { API_ENDPOINTS } from '@/types';

const url = API_ENDPOINTS.ANALYSIS.IMAGE;
const createUrl = API_ENDPOINTS.SESSION.CREATE;
```

### Nutrient Display

```typescript
import { NUTRIENT_DISPLAY_CONFIG } from '@/types';

const proteinConfig = NUTRIENT_DISPLAY_CONFIG.protein;
console.log(proteinConfig.label); // "Protein"
console.log(proteinConfig.unit); // "g"
console.log(proteinConfig.color); // "#4ECDC4"
```

### CKD Stage Info

```typescript
import { CKD_STAGE_INFO, CKDStage } from '@/types';

const stageInfo = CKD_STAGE_INFO[CKDStage.Stage3a];
console.log(stageInfo.label); // "Stage 3a"
console.log(stageInfo.gfrRange); // "45-59"
console.log(stageInfo.severity); // "moderate"
```

## Best Practices

### 1. Use Branded Types for IDs

```typescript
// ✅ Good: Type-safe IDs
function getMeal(id: MealEntryId): MealEntry { ... }

// ❌ Bad: Plain strings can be mixed
function getMeal(id: string): MealEntry { ... }
```

### 2. Leverage Discriminated Unions

```typescript
// ✅ Good: Exhaustive pattern matching
function handleResult(result: NutritionAnalysisResult) {
  switch (result.type) {
    case 'success':
      return handleSuccess(result);
    case 'error':
      return handleError(result);
  }
}

// ❌ Bad: Runtime checks without type narrowing
function handleResult(result: any) {
  if (result.foods) {
    return handleSuccess(result);
  }
}
```

### 3. Use Type Guards for Runtime Validation

```typescript
// ✅ Good: Type guard provides type narrowing
if (isNutritionSuccess(result)) {
  // TypeScript knows result.foods exists
  console.log(result.foods);
}

// ❌ Bad: Type assertion without validation
console.log((result as NutritionAnalysisSuccess).foods);
```

### 4. Use AsyncState for Loading States

```typescript
// ✅ Good: Type-safe state management
const [state, setState] = useState<AsyncState<Data>>({ status: 'idle' });

if (state.status === 'success') {
  // state.data is guaranteed to exist
  render(state.data);
}

// ❌ Bad: Multiple state variables
const [loading, setLoading] = useState(false);
const [data, setData] = useState<Data | null>(null);
const [error, setError] = useState<Error | null>(null);
```

### 5. Use Constants Over Magic Values

```typescript
// ✅ Good: Type-safe constant
if (confidence < CONFIDENCE_THRESHOLDS.MEDIUM) {
  showWarning();
}

// ❌ Bad: Magic number
if (confidence < 0.7) {
  showWarning();
}
```

### 6. Validate at Boundaries

```typescript
// ✅ Good: Validate external data
function processApiResponse(data: unknown): MealEntry {
  if (!isValidMealEntry(data)) {
    throw new Error('Invalid meal entry');
  }
  return data;
}

// ❌ Bad: Trust external data
function processApiResponse(data: any): MealEntry {
  return data as MealEntry;
}
```

## Integration Examples

### React Component with AsyncState

```typescript
import { useState, useEffect } from 'react';
import {
  AsyncState,
  NutritionAnalysisResult,
  NutritionAnalysisImageRequest,
  isNutritionSuccess,
} from '@/types';

function AnalysisComponent() {
  const [state, setState] = useState<AsyncState<NutritionAnalysisResult>>({
    status: 'idle',
  });

  const analyzeImage = async (file: File) => {
    setState({ status: 'loading', progress: 0 });

    try {
      const response = await api.analyzeImage({
        sessionId: currentSessionId,
        image: file,
      });

      setState({
        status: 'success',
        data: response.result,
      });
    } catch (error) {
      setState({
        status: 'error',
        error: error as Error,
      });
    }
  };

  return (
    <div>
      {state.status === 'idle' && <UploadPrompt onUpload={analyzeImage} />}
      {state.status === 'loading' && <LoadingSpinner progress={state.progress} />}
      {state.status === 'success' && isNutritionSuccess(state.data) && (
        <Results foods={state.data.foods} totals={state.data.totals} />
      )}
      {state.status === 'error' && <ErrorMessage error={state.error} />}
    </div>
  );
}
```

### Form Validation

```typescript
import { FormState, ValidationResult, isValidNutrientValue } from '@/types';

function validateGoals(goals: Partial<DietGoals>): ValidationResult {
  const errors: Record<string, string> = {};

  if (goals.dailyCalories !== undefined) {
    if (!isValidNutrientValue(goals.dailyCalories, 1000, 5000)) {
      errors.dailyCalories = 'Calories must be between 1000 and 5000';
    }
  }

  if (goals.dailyProtein !== undefined) {
    if (!isValidNutrientValue(goals.dailyProtein, 20, 200)) {
      errors.dailyProtein = 'Protein must be between 20 and 200g';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
```

### API Client

```typescript
import {
  SessionCreateRequest,
  SessionCreateResponse,
  ApiResponse,
  ApiErrorResponse,
  Result,
  Ok,
  Err,
} from '@/types';

class DietCareApi {
  async createSession(
    request: SessionCreateRequest
  ): Promise<Result<SessionCreateResponse, ApiErrorResponse>> {
    try {
      const response = await fetch(API_ENDPOINTS.SESSION.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        return Err(error);
      }

      const data: ApiResponse<SessionCreateResponse> = await response.json();
      return Ok(data.data);
    } catch (error) {
      return Err({
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
```

## Type Safety Guarantees

1. **Branded Types**: Prevent accidental ID mixing at compile time
2. **Discriminated Unions**: Exhaustive pattern matching for state handling
3. **Type Guards**: Runtime validation with compile-time type narrowing
4. **Readonly Types**: Immutable data structures enforced at compile time
5. **Const Assertions**: Type-level constants that prevent typos
6. **Strict Mode Compatible**: All types work with `strict: true` in tsconfig.json

## Testing Support

All types are designed for testability:

```typescript
import {
  NutritionAnalysisSuccess,
  FoodItem,
  FoodItemId,
} from '@/types';

// Test factories
function createMockFoodItem(overrides?: Partial<FoodItem>): FoodItem {
  return {
    id: 'test-food-1' as FoodItemId,
    name: 'Test Food',
    servingSize: '100g',
    nutrition: {
      calories: 100,
      protein: 10,
      carbohydrates: 15,
      fat: 5,
      sodium: 200,
      potassium: 150,
      phosphorus: 100,
    },
    ...overrides,
  };
}

function createMockAnalysisSuccess(): NutritionAnalysisSuccess {
  return {
    type: 'success',
    foods: [createMockFoodItem()],
    totals: {
      calories: 100,
      protein: 10,
      carbohydrates: 15,
      fat: 5,
      sodium: 200,
      potassium: 150,
      phosphorus: 100,
      itemCount: 1,
      calculatedAt: new Date().toISOString(),
    },
    analysis: 'Test analysis',
    confidence: 0.95,
    analyzedAt: new Date().toISOString(),
  };
}
```

## Migration Guide

If migrating from untyped code:

1. Start with core domain types (`diet-care.ts`)
2. Add API types for backend integration (`diet-care.api.ts`)
3. Implement type guards for runtime validation (`diet-care.guards.ts`)
4. Replace magic values with constants (`diet-care.constants.ts`)
5. Refactor state management to use utility types (`diet-care.utils.ts`)

## Contributing

When adding new types:

1. Add JSDoc comments explaining purpose and usage
2. Use readonly properties for immutable data
3. Create type guards for runtime validation
4. Add constants with `as const` assertions
5. Export from `index.ts`
6. Update this documentation

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Branded Types](https://egghead.io/blog/using-branded-types-in-typescript)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Const Assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
