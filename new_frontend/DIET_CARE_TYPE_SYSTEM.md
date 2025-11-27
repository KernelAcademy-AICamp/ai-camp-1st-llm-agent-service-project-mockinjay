# Diet Care Type System Documentation

## Overview

The Diet Care feature has a comprehensive, type-safe TypeScript type system that aligns perfectly with the backend API structure. This document provides a complete reference for all types, constants, guards, and utilities.

## Architecture

The type system is organized into four main files:

```
src/types/
├── diet-care.ts           # Core domain types and API types
├── diet-care.guards.ts    # Runtime type guards and validators
├── diet-care.utils.ts     # Utility types and helper functions
└── diet-care.constants.ts # Type-safe constants and configuration
```

All types are re-exported through `src/types/index.ts` for convenient importing:

```typescript
import { FoodItem, MealType, isValidImageFile } from '@/types';
```

## File Reference

### 1. `diet-care.ts` - Core Domain Types

**Purpose:** Defines all core data structures that match the backend API.

**Backend Alignment:** Types in this file correspond 1:1 with Pydantic models in `backend/app/models/diet_care.py`.

**Key Type Categories:**

#### Enums

```typescript
enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack',
}

enum AnalysisStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}
```

#### Core Data Types

- **`FoodItem`**: Individual food with nutrition data
- **`UserProfile`**: User health profile (age, CKD stage, etc.)
- **`NutritionAnalysisResult`**: AI analysis output
- **`NutritionGoals`**: Daily nutrition targets
- **`MealEntry`**: Logged meal record
- **`AnalysisSession`**: Session tracking

#### API Request/Response Types

- **`CreateSessionRequest/Response`**: Session management
- **`NutritionAnalysisRequest/Response`**: Food analysis
- **`CreateMealRequest`**: Meal logging
- **`MealQueryParams`**: Query parameters
- **`UpdateGoalsRequest`**: Goal updates
- **`DailyProgressResponse`**: Daily progress data
- **`WeeklyProgressResponse`**: Weekly statistics
- **`StreakResponse`**: Logging streak data

**Usage Example:**

```typescript
import { FoodItem, MealType, NutritionAnalysisResult } from '@/types';

const food: FoodItem = {
  name: 'Grilled Chicken',
  amount: '150g',
  calories: 165,
  protein_g: 31,
  sodium_mg: 75,
  potassium_mg: 220,
  phosphorus_mg: 200,
  carbs_g: 0,
  fat_g: 3.6,
};

const analysisResult: NutritionAnalysisResult = {
  foods: [food],
  total_calories: 165,
  total_protein_g: 31,
  total_sodium_mg: 75,
  total_potassium_mg: 220,
  total_phosphorus_mg: 200,
  total_carbs_g: 0,
  total_fat_g: 3.6,
  total_fiber_g: 0,
  confidence_score: 0.95,
  recommendations: ['Good protein source for CKD patients'],
  warnings: [],
};
```

### 2. `diet-care.guards.ts` - Type Guards

**Purpose:** Runtime validation and type narrowing.

**Key Features:**
- Type-safe validation
- Clear error detection
- Enables exhaustive pattern matching

**Available Guards:**

#### Enum Validators
```typescript
isMealType(value: unknown): value is MealType
isAnalysisStatus(value: unknown): value is AnalysisStatus
isActivityLevel(value: unknown): value is ActivityLevel
isNutrientStatus(value: unknown): value is NutrientStatus
```

#### File Validators
```typescript
isValidImageFile(file: File): boolean
isValidFileSize(file: File, maxSizeMB?: number): boolean
```

#### Numeric Validators
```typescript
isValidNumericValue(value: number, min?: number, max?: number): boolean
isValidConfidence(confidence: number): boolean
isValidPercentage(value: number): boolean
isValidCKDStage(stage: number): boolean
```

#### Object Validators
```typescript
isValidFoodItem(item: unknown): item is FoodItem
isValidUserProfile(profile: unknown): profile is UserProfile
isValidNutritionAnalysisResult(result: unknown): result is NutritionAnalysisResult
isValidMealEntry(entry: unknown): entry is MealEntry
```

**Usage Example:**

```typescript
import { isValidImageFile, isValidFileSize, isValidFoodItem } from '@/types';

function handleFileUpload(file: File) {
  if (!isValidImageFile(file)) {
    throw new Error('Invalid image type');
  }

  if (!isValidFileSize(file, 10)) {
    throw new Error('File too large (max 10MB)');
  }

  // File is valid, proceed with upload
}

function processFoodData(data: unknown) {
  if (isValidFoodItem(data)) {
    // TypeScript now knows data is FoodItem
    console.log(`${data.name}: ${data.calories} kcal`);
  }
}
```

### 3. `diet-care.utils.ts` - Utility Types

**Purpose:** Generic utility types for state management and async operations.

**Key Utility Types:**

#### Async State Management
```typescript
type AsyncState<T, E = Error> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly progress?: number }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: E };
```

#### Form State Management
```typescript
interface FormField<T> {
  readonly value: T;
  readonly touched: boolean;
  readonly error?: string;
  readonly validating?: boolean;
}

type FormState<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: FormField<T[K]>;
};
```

#### Image Upload State
```typescript
type ImageUploadState =
  | { readonly stage: 'initial' }
  | { readonly stage: 'selected'; readonly file: File; readonly previewUrl: string }
  | { readonly stage: 'uploading'; readonly file: File; readonly previewUrl: string; readonly progress: number }
  | { readonly stage: 'uploaded'; readonly file: File; readonly previewUrl: string; readonly url: string }
  | { readonly stage: 'error'; readonly file?: File; readonly error: string };
```

#### Result and Option Types
```typescript
type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

type Option<T> =
  | { readonly some: true; readonly value: T }
  | { readonly some: false };

// Helper functions
function Ok<T>(value: T): Result<T, never>
function Err<E>(error: E): Result<never, E>
function Some<T>(value: T): Option<T>
function None<T>(): Option<T>
```

**Usage Example:**

```typescript
import { AsyncState, ImageUploadState, Result, Ok, Err } from '@/types';

// Async state for API calls
const [analysisState, setAnalysisState] = useState<AsyncState<NutritionAnalysisResult>>({
  status: 'idle',
});

// Image upload tracking
const [uploadState, setUploadState] = useState<ImageUploadState>({
  stage: 'initial',
});

// Result type for error handling
async function analyzeFood(image: File): Promise<Result<NutritionAnalysisResult, string>> {
  try {
    const result = await api.analyze(image);
    return Ok(result);
  } catch (error) {
    return Err(error.message);
  }
}

// Using the result
const result = await analyzeFood(imageFile);
if (result.ok) {
  console.log('Analysis successful:', result.value);
} else {
  console.error('Analysis failed:', result.error);
}
```

### 4. `diet-care.constants.ts` - Constants

**Purpose:** Type-safe configuration, validation rules, and display settings.

**Key Constant Categories:**

#### API Endpoints
```typescript
const API_ENDPOINTS = {
  SESSION: { CREATE: '/api/diet-care/session/create' },
  NUTRI_COACH: '/api/diet-care/nutri-coach',
  MEALS: { BASE: '/api/diet-care/meals', BY_ID: (id: string) => ... },
  GOALS: { BASE: '/api/diet-care/goals' },
  PROGRESS: { DAILY: ..., WEEKLY: ... },
  STREAK: '/api/diet-care/streak',
} as const;
```

#### Meal Type Configuration
```typescript
const MEAL_TYPE_CONFIG = {
  [MealType.Breakfast]: {
    label: 'Breakfast',
    labelKo: '아침',
    icon: 'sunrise',
    color: '#FFB84D',
    typicalTimeRange: { start: 6, end: 10 },
    caloriePercentage: 25,
  },
  // ... other meal types
} as const;
```

#### File Upload Config
```typescript
const FILE_UPLOAD_CONFIG = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_SIZE_MB: 10,
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_DIMENSIONS: { width: 4096, height: 4096 },
  ACCEPT_ATTR: 'image/jpeg,image/jpg,image/png,image/webp',
} as const;
```

#### CKD Stage Configuration
```typescript
const CKD_STAGE_CONFIG = {
  1: {
    label: 'Stage 1',
    labelKo: '1단계',
    description: 'Normal kidney function with kidney damage',
    gfrRange: '≥90',
    severity: 'minimal',
    color: '#4CAF50',
    defaultGoals: { calories_kcal: 2000, protein_g: 65, ... },
  },
  // ... stages 2-5
} as const;
```

#### Validation Rules
```typescript
const VALIDATION_RULES = {
  AGE: { MIN: 1, MAX: 150 },
  WEIGHT: { MIN: 10, MAX: 500 },
  HEIGHT: { MIN: 50, MAX: 300 },
  CKD_STAGE: { MIN: 1, MAX: 5 },
  DESCRIPTION: { MIN_LENGTH: 3, MAX_LENGTH: 500 },
  NOTES: { MAX_LENGTH: 1000 },
  FOODS: { MAX_PER_MEAL: 50 },
} as const;
```

**Usage Example:**

```typescript
import { API_ENDPOINTS, MEAL_TYPE_CONFIG, FILE_UPLOAD_CONFIG, CKD_STAGE_CONFIG } from '@/types';

// API calls
const response = await fetch(API_ENDPOINTS.NUTRI_COACH, { ... });

// Display meal type info
const breakfastConfig = MEAL_TYPE_CONFIG[MealType.Breakfast];
console.log(`${breakfastConfig.label} (${breakfastConfig.labelKo})`);

// Validate file
if (file.size > FILE_UPLOAD_CONFIG.MAX_SIZE_BYTES) {
  throw new Error('File too large');
}

// Get CKD stage goals
const ckdStage = 3;
const goals = CKD_STAGE_CONFIG[ckdStage].defaultGoals;
```

## Best Practices

### 1. Always Use Type Guards for Runtime Validation

```typescript
// ❌ Bad - Assumes data is valid
const food = apiResponse as FoodItem;

// ✅ Good - Validates at runtime
if (isValidFoodItem(apiResponse)) {
  const food = apiResponse;
  // TypeScript knows food is FoodItem
}
```

### 2. Prefer AsyncState for API Calls

```typescript
const [state, setState] = useState<AsyncState<NutritionAnalysisResult>>({
  status: 'idle',
});

async function analyze() {
  setState({ status: 'loading' });
  try {
    const data = await api.analyze(image);
    setState({ status: 'success', data });
  } catch (error) {
    setState({ status: 'error', error: error as Error });
  }
}

// Type-safe rendering
{state.status === 'loading' && <Spinner />}
{state.status === 'success' && <Results data={state.data} />}
{state.status === 'error' && <Error message={state.error.message} />}
```

### 3. Use Constants for Configuration

```typescript
// ❌ Bad - Magic numbers
if (file.size > 10485760) { ... }

// ✅ Good - Named constant
if (file.size > FILE_UPLOAD_CONFIG.MAX_SIZE_BYTES) { ... }
```

### 4. Leverage Discriminated Unions

```typescript
type ImageUploadState =
  | { stage: 'initial' }
  | { stage: 'uploading'; progress: number }
  | { stage: 'uploaded'; url: string }
  | { stage: 'error'; error: string };

function render(state: ImageUploadState) {
  switch (state.stage) {
    case 'initial': return <UploadButton />;
    case 'uploading': return <Progress value={state.progress} />;
    case 'uploaded': return <Image src={state.url} />;
    case 'error': return <ErrorMessage message={state.error} />;
    // TypeScript ensures all cases are handled
  }
}
```

## Backend Compatibility

All types in `diet-care.ts` are designed to match the backend API exactly:

| Frontend Type | Backend Model | Endpoint |
|---------------|---------------|----------|
| `FoodItem` | `FoodItem(BaseModel)` | - |
| `UserProfile` | `UserProfile(BaseModel)` | - |
| `NutritionAnalysisResult` | `NutritionAnalysisResult(BaseModel)` | - |
| `CreateSessionResponse` | `CreateSessionResponse(BaseModel)` | POST `/api/diet-care/session/create` |
| `NutritionAnalysisResponse` | `NutriCoachResponse(BaseModel)` | POST `/api/diet-care/nutri-coach` |
| `MealEntry` | `MealResponse(BaseModel)` | GET/POST `/api/diet-care/meals` |
| `GoalsResponse` | `GoalsResponse(BaseModel)` | GET/PUT `/api/diet-care/goals` |
| `DailyProgressResponse` | `DailyProgressResponse(BaseModel)` | GET `/api/diet-care/progress/daily` |
| `WeeklyProgressResponse` | `WeeklyProgressResponse(BaseModel)` | GET `/api/diet-care/progress/weekly` |
| `StreakResponse` | `StreakResponse(BaseModel)` | GET `/api/diet-care/streak` |

## Testing

All type guards include examples in their JSDoc comments. Here's a testing pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { isValidFoodItem, isValidImageFile } from '@/types';

describe('Diet Care Type Guards', () => {
  describe('isValidFoodItem', () => {
    it('accepts valid food item', () => {
      const validFood = {
        name: 'Apple',
        amount: '1 medium',
        calories: 95,
        protein_g: 0.5,
        sodium_mg: 2,
        potassium_mg: 195,
        phosphorus_mg: 20,
      };
      expect(isValidFoodItem(validFood)).toBe(true);
    });

    it('rejects invalid food item', () => {
      const invalidFood = { name: 'Apple' }; // Missing required fields
      expect(isValidFoodItem(invalidFood)).toBe(false);
    });
  });
});
```

## Summary

The Diet Care type system provides:

1. **Type Safety**: Compile-time type checking prevents bugs
2. **Runtime Validation**: Type guards ensure data integrity
3. **Backend Alignment**: Types match API structure exactly
4. **Developer Experience**: JSDoc comments and examples
5. **Maintainability**: Centralized constants and configuration
6. **Reusability**: Generic utility types for common patterns

All types follow strict TypeScript best practices with no `any` types and comprehensive readonly modifiers for immutability.
