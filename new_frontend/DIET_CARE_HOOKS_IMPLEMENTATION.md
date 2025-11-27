# Diet Care React Hooks - Implementation Summary

## Overview

This document provides a comprehensive overview of the custom React hooks implemented for the Diet Care feature. All hooks follow React 18 best practices, include proper TypeScript typing, error handling, and production-ready patterns.

## Implemented Hooks

### 1. useImageUpload Hook
**Location:** `/new_frontend/src/hooks/useImageUpload.ts`

**Status:** ✅ Already Implemented

**Features:**
- File selection and drag-and-drop support
- Client-side validation (file type, size)
- Preview URL generation with cleanup
- Memory leak prevention (URL.revokeObjectURL)
- Multi-language support

**Usage:**
```typescript
const {
  selectedImage,
  imagePreview,
  isValidImage,
  error,
  handleImageSelect,
  handleImageDrop,
  clearImage,
  resetError
} = useImageUpload('ko');
```

**Key Patterns:**
- Cleanup on unmount (useEffect)
- Input reset after selection
- Type-safe file validation

---

### 2. useNutritionAnalysis Hook
**Location:** `/new_frontend/src/hooks/useNutritionAnalysis.ts`

**Status:** ✅ Enhanced with State Machine

**Features:**
- Robust state machine (idle → creating_session → analyzing → success/error)
- AbortController for request cancellation
- Automatic timeout handling (30 seconds)
- Session management with reuse
- Memory cleanup on unmount
- Type-safe error handling with discriminated unions

**State Machine:**
```
idle ──START_SESSION──> creating_session
     ──SESSION_CREATED──> analyzing
     ──ANALYSIS_SUCCESS──> success
     ──ANALYSIS_ERROR──> error
     ──RESET──> idle
```

**Usage:**
```typescript
const {
  state,              // 'idle' | 'creating_session' | 'analyzing' | 'success' | 'error'
  result,             // NutritionAnalysisResult | null
  error,              // string | null
  sessionId,          // string | null
  isAnalyzing,        // boolean
  analyze,            // (image: File, text?: string) => Promise<void>
  reset,              // () => void
  abort,              // () => void
  clearResult,        // () => void
  clearError          // () => void
} = useNutritionAnalysis('ko');

// Example usage
await analyze(imageFile, "음식 영양 분석");
```

**Key Patterns:**
- useReducer for state machine
- AbortController for cancellation
- Promise.race for timeout
- Cleanup refs with useCallback

**Unit Test Example:**
```typescript
describe('useNutritionAnalysis', () => {
  it('should transition through states correctly', async () => {
    const { result } = renderHook(() => useNutritionAnalysis());
    expect(result.current.state).toBe('idle');

    await act(async () => {
      await result.current.analyze(mockFile, "test");
    });

    expect(result.current.state).toBe('success');
    expect(result.current.result).toBeDefined();
  });

  it('should handle timeout gracefully', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useNutritionAnalysis());

    const promise = result.current.analyze(mockFile, "test");
    jest.advanceTimersByTime(31000);
    await promise;

    expect(result.current.state).toBe('error');
    expect(result.current.error).toContain('timeout');
  });
});
```

---

### 3. useDietGoals Hook
**Location:** `/new_frontend/src/hooks/useDietGoals.ts`

**Status:** ✅ Enhanced with Optimistic Updates

**Features:**
- Optimistic updates for instant UI feedback
- Automatic rollback on server error
- Client-side validation before save
- Form state management with react-hook-form
- Individual field updates
- Type-safe goal management

**Usage:**
```typescript
const {
  goals,              // DietGoals | null
  loading,            // boolean
  saving,             // boolean
  error,              // string | null
  form,               // UseFormReturn<DietGoalsFormData>
  saveGoals,          // (data: DietGoalsFormData) => Promise<void>
  refreshGoals,       // () => Promise<void>
  updateGoal          // <K>(field: K, value: V) => Promise<void>
} = useDietGoals('ko');

// Example: Save all goals
await saveGoals({
  targetSodium: 2000,
  targetProtein: 50,
  targetPotassium: 2000,
  targetPhosphorus: 1000,
  targetCalories: 2000
});

// Example: Update single goal
await updateGoal('targetSodium', 1500);
```

**Validation Constraints:**
```typescript
const VALIDATION_CONSTRAINTS = {
  targetSodium: { min: 500, max: 5000 },
  targetProtein: { min: 20, max: 200 },
  targetPotassium: { min: 1000, max: 5000 },
  targetPhosphorus: { min: 500, max: 2000 },
  targetCalories: { min: 1000, max: 4000 },
};
```

**Key Patterns:**
- Optimistic update with rollback
- useRef for previous state
- Client-side validation
- Form integration with react-hook-form

**Unit Test Example:**
```typescript
describe('useDietGoals', () => {
  it('should perform optimistic update and rollback on error', async () => {
    const { result } = renderHook(() => useDietGoals());
    const previousGoals = result.current.goals;
    const newGoals = { targetSodium: 1500, ... };

    // Mock API to fail
    jest.spyOn(api, 'saveDietGoals').mockRejectedValue(new Error());

    await act(async () => {
      await result.current.saveGoals(newGoals);
    });

    // Should rollback to previous goals
    expect(result.current.goals).toEqual(previousGoals);
  });
});
```

---

### 4. useDietLog Hook
**Location:** `/new_frontend/src/hooks/useDietLog.ts`

**Status:** ✅ Implemented (Can be enhanced further)

**Features:**
- Field array management for multiple meals
- Meal type categorization (breakfast, lunch, dinner, snack)
- Form validation
- Batch meal submission
- Empty meal filtering

**Usage:**
```typescript
const {
  logging,            // boolean
  error,              // string | null
  form,               // UseFormReturn<DietLogFormData>
  breakfastFields,    // FieldArrayWithId[]
  lunchFields,        // FieldArrayWithId[]
  dinnerFields,       // FieldArrayWithId[]
  snackFields,        // FieldArrayWithId[]
  appendBreakfast,    // (meal: MealFormData) => void
  appendLunch,        // (meal: MealFormData) => void
  appendDinner,       // (meal: MealFormData) => void
  appendSnack,        // (meal: MealFormData) => void
  removeBreakfast,    // (index: number) => void
  removeLunch,        // (index: number) => void
  removeDinner,       // (index: number) => void
  removeSnack,        // (index: number) => void
  submitLog,          // (data: DietLogFormData) => Promise<void>
  resetForm           // () => void
} = useDietLog('ko');

// Example: Add meal
appendBreakfast({ foodName: '계란', amount: 2, unit: '개' });

// Example: Submit all meals
await submitLog(form.getValues());
```

**Potential Enhancements:**
- Real-time nutrient totals calculation
- Goal comparison integration
- Daily progress tracking
- Local storage backup
- Meal templates

---

### 5. useNutritionProgress Hook
**Location:** `/new_frontend/src/hooks/useNutritionProgress.ts`

**Status:** ✅ Implemented

**Features:**
- Daily nutrition summary fetching
- Progress percentage calculation vs goals
- Real-time goal comparison
- Multi-nutrient tracking
- Date-based filtering

**Usage:**
```typescript
const {
  summary,            // DailyNutritionSummary | null
  progress,           // NutritionProgress | null
  loading,            // boolean
  error,              // string | null
  refreshProgress     // () => Promise<void>
} = useNutritionProgress('2025-01-15', 'ko');

// Example: Check progress
if (progress) {
  console.log(`Calories: ${progress.calories.current} / ${progress.calories.target}`);
  console.log(`Progress: ${progress.calories.percentage}%`);
}
```

**Progress Structure:**
```typescript
interface NutritionProgress {
  calories: { current: number; target: number; percentage: number };
  protein: { current: number; target: number; percentage: number };
  sodium: { current: number; target: number; percentage: number };
  potassium: { current: number; target: number; percentage: number };
  phosphorus: { current: number; target: number; percentage: number };
}
```

**Potential Enhancements:**
- Weekly/monthly aggregates
- Streak calculation
- Achievement tracking
- Trend analysis
- Export functionality

---

## Common Patterns Across All Hooks

### 1. Error Handling
All hooks implement consistent error handling:
```typescript
try {
  // API call
} catch (error: any) {
  console.error('Error:', error);
  const errorMessage = language === 'ko'
    ? '한국어 에러 메시지'
    : 'English error message';
  setError(errorMessage);
  toast.error(errorMessage);
}
```

### 2. Memory Management
All hooks clean up resources on unmount:
```typescript
useEffect(() => {
  return () => {
    // Cleanup: abort requests, clear timeouts, revoke URLs
    cleanup();
  };
}, [cleanup]);
```

### 3. Type Safety
All hooks use TypeScript with:
- Strict type definitions
- Readonly properties where appropriate
- Discriminated unions for result types
- Generic constraints

### 4. Loading States
All async operations have loading indicators:
```typescript
const [loading, setLoading] = useState(false);

const operation = async () => {
  setLoading(true);
  try {
    // operation
  } finally {
    setLoading(false);
  }
};
```

### 5. Multi-language Support
All user-facing messages support i18n:
```typescript
const message = language === 'ko'
  ? '한국어 메시지'
  : 'English message';
```

---

## Integration Example

Here's how to use multiple hooks together in a component:

```typescript
import React from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useNutritionAnalysis } from '@/hooks/useNutritionAnalysis';
import { useDietGoals } from '@/hooks/useDietGoals';
import { useNutritionProgress } from '@/hooks/useNutritionProgress';

export function DietCarePage() {
  // Image upload
  const {
    selectedImage,
    imagePreview,
    handleImageSelect,
    clearImage
  } = useImageUpload('ko');

  // Nutrition analysis
  const {
    state: analysisState,
    result: analysisResult,
    analyze,
    reset: resetAnalysis
  } = useNutritionAnalysis('ko');

  // Diet goals
  const {
    goals,
    form: goalsForm,
    saveGoals
  } = useDietGoals('ko');

  // Progress tracking
  const {
    progress,
    refreshProgress
  } = useNutritionProgress(undefined, 'ko');

  // Handle analysis
  const handleAnalyze = async () => {
    if (!selectedImage) return;
    await analyze(selectedImage);
    await refreshProgress(); // Update progress after analysis
  };

  // Render UI
  return (
    <div>
      <ImageUploader
        preview={imagePreview}
        onSelect={handleImageSelect}
        onClear={clearImage}
      />

      <Button
        onClick={handleAnalyze}
        disabled={!selectedImage || analysisState === 'analyzing'}
      >
        {analysisState === 'analyzing' ? '분석 중...' : '영양 분석'}
      </Button>

      {analysisResult && (
        <NutritionResults result={analysisResult} />
      )}

      {progress && (
        <ProgressChart progress={progress} goals={goals} />
      )}
    </div>
  );
}
```

---

## Best Practices Applied

1. **Single Responsibility:** Each hook has one clear purpose
2. **Composition:** Hooks can be composed together
3. **Testability:** All hooks are easily testable with @testing-library/react-hooks
4. **Performance:** Uses useCallback, useMemo, and useReducer appropriately
5. **Error Boundaries:** Graceful error handling with user feedback
6. **Accessibility:** Loading states and error messages for screen readers
7. **Documentation:** Comprehensive JSDoc comments with examples

---

## Testing Strategy

### Unit Tests
- State transitions
- Error handling
- Cleanup on unmount
- Validation logic

### Integration Tests
- Multiple hooks working together
- API interactions
- Form submissions
- Progress calculations

### Example Test Setup
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useNutritionAnalysis } from '@/hooks/useNutritionAnalysis';

describe('useNutritionAnalysis', () => {
  it('should handle analysis workflow', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useNutritionAnalysis()
    );

    expect(result.current.state).toBe('idle');

    await act(async () => {
      await result.current.analyze(mockFile);
    });

    await waitForNextUpdate();

    expect(result.current.state).toBe('success');
    expect(result.current.result).toBeDefined();
  });
});
```

---

## File Structure

```
new_frontend/src/hooks/
├── useImageUpload.ts          ✅ File validation & preview
├── useNutritionAnalysis.ts    ✅ State machine for analysis
├── useDietGoals.ts            ✅ Optimistic updates
├── useDietLog.ts              ✅ Meal logging
├── useNutritionProgress.ts    ✅ Progress tracking
├── useBookmarks.ts            ✅ Bookmark management
├── useChatRooms.ts            ✅ Chat room management
├── useChatSession.ts          ✅ Chat session lifecycle
├── useChatStream.ts           ✅ Streaming chat responses
├── useIdleTimer.ts            ✅ Idle detection
├── useNetworkStatus.ts        ✅ Network monitoring
├── useQuizPrompt.ts           ✅ Quiz prompt display
└── __tests__/
    ├── useImageUpload.test.ts
    ├── useNutritionAnalysis.test.ts
    └── useDietGoals.test.ts
```

---

## Performance Considerations

1. **Memoization:** Use `useMemo` for expensive calculations
2. **Debouncing:** Consider debouncing for rapid updates (e.g., slider inputs)
3. **Lazy Loading:** Load data only when needed
4. **Caching:** Consider React Query for server state caching
5. **Code Splitting:** Dynamic imports for large dependencies

---

## Future Enhancements

### Recommended Additions:

1. **useWeeklyProgress Hook**
   - Aggregate weekly nutrition data
   - Trend analysis
   - Goal adherence scoring

2. **useMealTemplates Hook**
   - Save frequent meals as templates
   - Quick meal logging
   - Template management

3. **useNutritionRecommendations Hook**
   - AI-generated recommendations
   - Based on progress and goals
   - Personalized suggestions

4. **useStreakTracking Hook**
   - Track consecutive days of goal achievement
   - Gamification elements
   - Achievement badges

5. **useExportData Hook**
   - Export nutrition data to CSV/PDF
   - Date range selection
   - Report generation

---

## Conclusion

All Diet Care hooks are production-ready, following React 18 best practices with:
- ✅ TypeScript type safety
- ✅ Comprehensive error handling
- ✅ Memory leak prevention
- ✅ Multi-language support
- ✅ Unit test examples
- ✅ JSDoc documentation
- ✅ Performance optimization

The hooks are ready for integration into the Diet Care feature components.
