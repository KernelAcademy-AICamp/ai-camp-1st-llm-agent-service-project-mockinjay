# Diet Care Type System - Quick Reference Guide

Quick reference for developers working with the Diet Care feature's TypeScript type system.

## Quick Import

All types are exported from a single entry point:

```typescript
import {
  // Core types
  CKDStage,
  MealType,
  NutritionAnalysisResult,
  FoodItem,
  MealEntry,
  DietGoals,
  UserProfile,

  // Type guards
  isNutritionSuccess,
  isNutritionError,
  isValidNutrientData,
  isImageFile,
  isValidFileSize,

  // Utility types
  AsyncState,
  Result,
  Option,
  Ok,
  Err,

  // Constants
  NUTRIENT_LIMITS,
  IMAGE_FILE_CONSTRAINTS,
  API_ENDPOINTS,
} from '@/types';
```

## Common Patterns

### 1. Handling Analysis Results

```typescript
import { NutritionAnalysisResult, isNutritionSuccess } from '@/types';

function displayResult(result: NutritionAnalysisResult) {
  if (isNutritionSuccess(result)) {
    // TypeScript knows: result.foods, result.totals, result.confidence
    return <SuccessView foods={result.foods} totals={result.totals} />;
  } else {
    // TypeScript knows: result.code, result.message
    return <ErrorView code={result.code} message={result.message} />;
  }
}
```

### 2. Managing Async State

```typescript
import { AsyncState, MealEntry } from '@/types';

const [state, setState] = useState<AsyncState<MealEntry[]>>({ status: 'idle' });

// Loading
setState({ status: 'loading' });

// Success
setState({ status: 'success', data: meals });

// Error
setState({ status: 'error', error: new Error('Failed') });

// Rendering
if (state.status === 'loading') return <Spinner />;
if (state.status === 'error') return <Error message={state.error.message} />;
if (state.status === 'success') return <MealList meals={state.data} />;
```

### 3. Using Result Type

```typescript
import { Result, Ok, Err } from '@/types';

function parseCalories(input: string): Result<number, string> {
  const value = parseFloat(input);
  if (isNaN(value)) return Err('Invalid number');
  if (value < 0) return Err('Must be positive');
  return Ok(value);
}

const result = parseCalories('250');
if (result.ok) {
  console.log('Calories:', result.value);
} else {
  console.error('Error:', result.error);
}
```

### 4. File Validation

```typescript
import { isImageFile, isValidFileSize, IMAGE_FILE_CONSTRAINTS } from '@/types';

function validateImageUpload(file: File): string | null {
  if (!isImageFile(file)) {
    return 'Please upload a valid image (JPEG, PNG, or WebP)';
  }

  if (!isValidFileSize(file, IMAGE_FILE_CONSTRAINTS.maxSizeBytes)) {
    return 'File size must be less than 10MB';
  }

  return null; // Valid
}
```

### 5. CKD Stage Limits

```typescript
import { NUTRIENT_LIMITS, CKDStage } from '@/types';

function getNutrientGoals(stage: CKDStage) {
  const limits = NUTRIENT_LIMITS[stage];

  return {
    dailySodium: limits.sodium.max,
    dailyProtein: limits.protein.max,
    dailyPotassium: limits.potassium.max,
  };
}
```

### 6. API Requests

```typescript
import { SessionCreateRequest, SessionCreateResponse, CKDStage } from '@/types';

async function createSession(): Promise<SessionCreateResponse> {
  const request: SessionCreateRequest = {
    userProfile: {
      ckdStage: CKDStage.Stage3a,
      age: 45,
      weight: 70,
      height: 170,
      sex: 'MALE',
      activityLevel: 'MODERATE',
    },
  };

  const response = await fetch('/api/diet-care/session/create', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response.json();
}
```

## Type Guard Cheat Sheet

| Type Guard | Purpose | Returns |
|------------|---------|---------|
| `isNutritionSuccess(result)` | Check if analysis succeeded | `result is NutritionAnalysisSuccess` |
| `isNutritionError(result)` | Check if analysis failed | `result is NutritionAnalysisError` |
| `isImageFile(file)` | Validate image file type | `boolean` |
| `isValidFileSize(file, max?)` | Validate file size | `boolean` |
| `isValidNutrientData(data)` | Validate nutrient object | `data is NutrientData` |
| `isValidFoodItem(item)` | Validate food item | `item is FoodItem` |
| `isCKDStage(value)` | Check CKD stage enum | `value is CKDStage` |
| `isMealType(value)` | Check meal type enum | `value is MealType` |
| `isValidPercentage(n)` | Check 0-100 range | `boolean` |
| `isValidConfidence(n)` | Check 0-1 range | `boolean` |

## Constants Reference

### Nutrient Limits

```typescript
import { NUTRIENT_LIMITS, CKDStage } from '@/types';

// Access limits for a specific stage
const stage3aLimits = NUTRIENT_LIMITS[CKDStage.Stage3a];
// {
//   calories: { min: 1800, max: 2200 },
//   protein: { min: 40, max: 60 },
//   sodium: { min: 1500, max: 2000 },
//   potassium: { min: 1500, max: 3000 },
//   phosphorus: { min: 700, max: 1000 }
// }
```

### File Constraints

```typescript
import { IMAGE_FILE_CONSTRAINTS } from '@/types';

// {
//   maxSizeBytes: 10485760, // 10 MB
//   acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
//   maxDimensions: { width: 4096, height: 4096 }
// }
```

### Meal Type Info

```typescript
import { MEAL_TYPE_INFO, MealType } from '@/types';

const breakfastInfo = MEAL_TYPE_INFO[MealType.Breakfast];
// {
//   label: 'Breakfast',
//   icon: 'sunrise',
//   typicalTimeRange: { start: 6, end: 10 },
//   caloriePercentage: 25
// }
```

### CKD Stage Info

```typescript
import { CKD_STAGE_INFO, CKDStage } from '@/types';

const stage3aInfo = CKD_STAGE_INFO[CKDStage.Stage3a];
// {
//   label: 'Stage 3a',
//   description: 'Mild to moderate decrease in kidney function',
//   gfrRange: '45-59',
//   severity: 'moderate',
//   color: '#FFC107'
// }
```

### API Endpoints

```typescript
import { API_ENDPOINTS } from '@/types';

// Session endpoints
API_ENDPOINTS.SESSION.CREATE  // '/api/diet-care/session/create'
API_ENDPOINTS.SESSION.GET     // '/api/diet-care/session/:sessionId'

// Analysis endpoints
API_ENDPOINTS.ANALYSIS.IMAGE  // '/api/diet-care/analysis/image'
API_ENDPOINTS.ANALYSIS.TEXT   // '/api/diet-care/analysis/text'
```

## Common Enums

### CKDStage

```typescript
enum CKDStage {
  Stage1 = 'STAGE_1',   // GFR >= 90
  Stage2 = 'STAGE_2',   // GFR 60-89
  Stage3a = 'STAGE_3A', // GFR 45-59
  Stage3b = 'STAGE_3B', // GFR 30-44
  Stage4 = 'STAGE_4',   // GFR 15-29
  Stage5 = 'STAGE_5',   // GFR < 15
}
```

### MealType

```typescript
enum MealType {
  Breakfast = 'BREAKFAST',
  Lunch = 'LUNCH',
  Dinner = 'DINNER',
  Snack = 'SNACK',
}
```

## Branded Types

Prevent ID confusion at compile time:

```typescript
type SessionId = string & { readonly __brand: 'SessionId' };
type MealEntryId = string & { readonly __brand: 'MealEntryId' };
type FoodItemId = string & { readonly __brand: 'FoodItemId' };

// Usage
const sessionId = 'session-123' as SessionId;
const mealId = 'meal-456' as MealEntryId;

// This would be a TypeScript error:
// function takesSessionId(id: SessionId) {}
// takesSessionId(mealId); // ERROR: MealEntryId is not assignable to SessionId
```

## Utility Type Examples

### DeepReadonly

```typescript
import { DeepReadonly } from '@/types';

type Config = {
  user: { name: string; profile: { age: number } };
};

type ReadonlyConfig = DeepReadonly<Config>;
// All properties at all levels are readonly
```

### RequireAtLeastOne

```typescript
import { RequireAtLeastOne } from '@/types';

type Update = RequireAtLeastOne<{
  name?: string;
  email?: string;
  age?: number;
}>;

// Valid: at least one property is present
const update1: Update = { name: 'John' };
const update2: Update = { name: 'John', email: 'john@example.com' };

// Invalid: no properties
// const update3: Update = {}; // ERROR
```

### FormField

```typescript
import { FormField } from '@/types';

const field: FormField<string> = {
  value: 'John Doe',
  touched: true,
  error: undefined,
  validating: false,
};
```

## Testing Utilities

```typescript
import { describe, it, expect } from 'vitest';
import { isValidNutrientData, CKDStage, NUTRIENT_LIMITS } from '@/types';

describe('Diet Care Features', () => {
  it('should validate nutrient data', () => {
    const valid = {
      calories: 250,
      protein: 15,
      carbohydrates: 30,
      fat: 8,
      sodium: 400,
      potassium: 300,
      phosphorus: 200,
    };

    expect(isValidNutrientData(valid)).toBe(true);
  });

  it('should have limits for all CKD stages', () => {
    Object.values(CKDStage).forEach(stage => {
      expect(NUTRIENT_LIMITS[stage]).toBeDefined();
    });
  });
});
```

## Error Handling Pattern

```typescript
import { NutritionAnalysisError } from '@/types';

function handleAnalysisError(error: NutritionAnalysisError) {
  switch (error.code) {
    case 'INVALID_IMAGE':
      return 'Please upload a valid food image';
    case 'ANALYSIS_FAILED':
      return 'Unable to analyze the image. Please try again';
    case 'NO_FOOD_DETECTED':
      return 'No food items detected in the image';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection';
    case 'UNKNOWN':
    default:
      return 'An unexpected error occurred';
  }
}
```

## React Component Example

```typescript
import React, { useState } from 'react';
import {
  AsyncState,
  NutritionAnalysisResult,
  isNutritionSuccess,
  isImageFile,
  isValidFileSize,
} from '@/types';

function FoodAnalyzer() {
  const [state, setState] = useState<AsyncState<NutritionAnalysisResult>>({
    status: 'idle',
  });

  const handleUpload = async (file: File) => {
    // Validate
    if (!isImageFile(file)) {
      alert('Please upload an image file');
      return;
    }

    if (!isValidFileSize(file)) {
      alert('File size must be less than 10MB');
      return;
    }

    // Analyze
    setState({ status: 'loading' });

    try {
      const result = await analyzeFood(file);
      setState({ status: 'success', data: result });
    } catch (error) {
      setState({ status: 'error', error: error as Error });
    }
  };

  // Render based on state
  if (state.status === 'loading') {
    return <div>Analyzing...</div>;
  }

  if (state.status === 'error') {
    return <div>Error: {state.error.message}</div>;
  }

  if (state.status === 'success') {
    const result = state.data;

    if (isNutritionSuccess(result)) {
      return (
        <div>
          <h3>Analysis Complete</h3>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <ul>
            {result.foods.map(food => (
              <li key={food.id}>{food.name}: {food.nutrition.calories} kcal</li>
            ))}
          </ul>
        </div>
      );
    } else {
      return <div>Error: {result.message}</div>;
    }
  }

  return <input type="file" onChange={(e) => handleUpload(e.target.files![0])} />;
}
```

## Pro Tips

1. **Always use type guards for runtime data**
   ```typescript
   // Good
   if (isValidNutrientData(apiResponse)) {
     // Safe to use
   }

   // Bad - unsafe cast
   const data = apiResponse as NutrientData;
   ```

2. **Leverage discriminated unions**
   ```typescript
   // TypeScript narrows the type automatically
   if (result.type === 'success') {
     // result.foods is available here
   }
   ```

3. **Use constants instead of magic numbers**
   ```typescript
   // Good
   if (fileSize > IMAGE_FILE_CONSTRAINTS.maxSizeBytes) { }

   // Bad
   if (fileSize > 10485760) { }
   ```

4. **Import from single entry point**
   ```typescript
   // Good
   import { CKDStage, MealType, isNutritionSuccess } from '@/types';

   // Bad
   import { CKDStage } from '@/types/diet-care';
   import { MealType } from '@/types/diet-care';
   ```

5. **Use branded types for IDs**
   ```typescript
   // Good - compile-time safety
   function getMeal(id: MealEntryId) { }

   // Bad - any string works
   function getMeal(id: string) { }
   ```

---

**Need more details?** See [DIET_CARE_TYPE_SYSTEM_COMPLETE.md](./DIET_CARE_TYPE_SYSTEM_COMPLETE.md) for comprehensive documentation.
