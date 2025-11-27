# Diet Care Type System - Quick Reference

## Quick Import Guide

```typescript
// Import everything you need from the central index
import {
  // Types
  FoodItem,
  MealType,
  NutritionAnalysisResult,
  UserProfile,
  MealEntry,
  NutritionGoals,

  // Type Guards
  isValidImageFile,
  isValidFileSize,
  isValidFoodItem,
  isMealType,

  // Utility Types
  AsyncState,
  ImageUploadState,
  Result,
  Ok,
  Err,

  // Constants
  API_ENDPOINTS,
  MEAL_TYPE_CONFIG,
  FILE_UPLOAD_CONFIG,
  ERROR_MESSAGES,
} from '@/types';
```

## Common Patterns

### 1. Image Upload with Validation

```typescript
function ImageUploader() {
  const [uploadState, setUploadState] = useState<ImageUploadState>({
    stage: 'initial',
  });

  const handleFileSelect = (file: File) => {
    if (!isValidImageFile(file)) {
      setUploadState({ stage: 'error', error: ERROR_MESSAGES.INVALID_FILE_TYPE });
      return;
    }

    if (!isValidFileSize(file, FILE_UPLOAD_CONFIG.MAX_SIZE_MB)) {
      setUploadState({ stage: 'error', error: ERROR_MESSAGES.FILE_TOO_LARGE });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setUploadState({ stage: 'selected', file, previewUrl });
  };
}
```

### 2. API Call with AsyncState

```typescript
function NutritionAnalyzer() {
  const [state, setState] = useState<AsyncState<NutritionAnalysisResult>>({
    status: 'idle',
  });

  const analyze = async (sessionId: string, image: File) => {
    setState({ status: 'loading' });
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('image', image);

      const response = await fetch(API_ENDPOINTS.NUTRI_COACH, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setState({ status: 'success', data: data.analysis });
    } catch (error) {
      setState({ status: 'error', error: error as Error });
    }
  };
}
```

### 3. Safe Data Fetching with Type Guards

```typescript
async function fetchMeals(startDate: string, endDate: string): Promise<MealEntry[]> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const response = await fetch(`${API_ENDPOINTS.MEALS.BASE}?${params}`);
  const data = await response.json();

  if (Array.isArray(data.meals) && data.meals.every(isValidMealEntry)) {
    return data.meals;
  }

  throw new Error('Invalid response format');
}
```

## Type Cheat Sheet

### Common Enums
```typescript
MealType.Breakfast | Lunch | Dinner | Snack
AnalysisStatus.Pending | Processing | Completed | Failed
```

### Type Guards
```typescript
isValidImageFile(file: File): boolean
isValidFileSize(file: File, maxSizeMB?: number): boolean
isMealType(value: unknown): value is MealType
isValidFoodItem(item: unknown): item is FoodItem
isValidCKDStage(stage: number): boolean
```

For detailed documentation, see `DIET_CARE_TYPE_SYSTEM.md`.
