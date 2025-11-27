# Diet Care Hooks - Quick Reference

## Import Statements

```typescript
// Image upload
import { useImageUpload } from '@/hooks/useImageUpload';

// Nutrition analysis
import { useNutritionAnalysis } from '@/hooks/useNutritionAnalysis';

// Diet goals
import { useDietGoals } from '@/hooks/useDietGoals';

// Meal logging
import { useDietLog } from '@/hooks/useDietLog';

// Progress tracking
import { useNutritionProgress } from '@/hooks/useNutritionProgress';
```

## Quick Usage Examples

### 1. Image Upload & Analysis

```typescript
function AnalysisForm() {
  const { 
    imagePreview, 
    handleImageSelect, 
    clearImage 
  } = useImageUpload('ko');
  
  const { 
    state, 
    result, 
    analyze 
  } = useNutritionAnalysis('ko');

  return (
    <>
      <input type="file" onChange={handleImageSelect} />
      {imagePreview && <img src={imagePreview} />}
      <button onClick={() => analyze(selectedImage)}>
        {state === 'analyzing' ? 'Analyzing...' : 'Analyze'}
      </button>
      {result?.type === 'success' && (
        <div>Total calories: {result.totals.calories}</div>
      )}
    </>
  );
}
```

### 2. Goal Management

```typescript
function GoalsPanel() {
  const { goals, form, saveGoals, updateGoal } = useDietGoals('ko');

  return (
    <form onSubmit={form.handleSubmit(saveGoals)}>
      <input {...form.register('targetSodium')} />
      <input {...form.register('targetProtein')} />
      <button type="submit">Save</button>
      
      {/* Or update single goal */}
      <button onClick={() => updateGoal('targetSodium', 1500)}>
        Set Sodium to 1500mg
      </button>
    </form>
  );
}
```

### 3. Meal Logging

```typescript
function MealLogger() {
  const {
    form,
    breakfastFields,
    appendBreakfast,
    removeBreakfast,
    submitLog
  } = useDietLog('ko');

  return (
    <form onSubmit={form.handleSubmit(submitLog)}>
      {breakfastFields.map((field, index) => (
        <div key={field.id}>
          <input {...form.register(`breakfast.${index}.foodName`)} />
          <input {...form.register(`breakfast.${index}.amount`)} />
          <button onClick={() => removeBreakfast(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => appendBreakfast({ foodName: '', amount: 0, unit: 'g' })}>
        Add Meal
      </button>
      <button type="submit">Save</button>
    </form>
  );
}
```

### 4. Progress Tracking

```typescript
function ProgressCard() {
  const { progress, loading } = useNutritionProgress(undefined, 'ko');

  if (loading) return <Spinner />;

  return (
    <div>
      {progress && (
        <>
          <ProgressBar 
            current={progress.calories.current}
            target={progress.calories.target}
            percentage={progress.calories.percentage}
          />
          <p>{progress.calories.current} / {progress.calories.target} kcal</p>
        </>
      )}
    </div>
  );
}
```

## State Management Cheatsheet

### useNutritionAnalysis States
- `idle` - Ready for new analysis
- `creating_session` - Creating session
- `analyzing` - Analysis in progress
- `success` - Analysis complete
- `error` - Analysis failed

### Typical Flow
```
User selects image → analyze() → 
  creating_session → analyzing → success → 
  Display results
```

## Common Patterns

### Loading States
```typescript
const { loading } = useHook();
if (loading) return <Spinner />;
```

### Error Handling
```typescript
const { error } = useHook();
{error && <ErrorMessage>{error}</ErrorMessage>}
```

### Optimistic Updates
```typescript
// useDietGoals automatically handles this
await saveGoals(newData); // UI updates immediately
```

### Request Cancellation
```typescript
const { abort } = useNutritionAnalysis();
<button onClick={abort}>Cancel</button>
```

## TypeScript Types

```typescript
// Image upload
type UseImageUploadReturn = {
  selectedImage: File | null;
  imagePreview: string | null;
  isValidImage: boolean;
  error: string | null;
  handleImageSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
};

// Nutrition analysis
type AnalysisState = 'idle' | 'creating_session' | 'analyzing' | 'success' | 'error';

// Diet goals
interface DietGoalsFormData {
  targetSodium: number;
  targetProtein: number;
  targetPotassium: number;
  targetPhosphorus: number;
  targetCalories: number;
}

// Meal logging
interface MealFormData {
  foodName: string;
  amount: number;
  unit: string;
}

// Progress
interface NutritionProgress {
  calories: { current: number; target: number; percentage: number };
  protein: { current: number; target: number; percentage: number };
  sodium: { current: number; target: number; percentage: number };
  // ...
}
```

## Best Practices

1. Always handle loading states
2. Always handle errors
3. Clean up on unmount (hooks do this automatically)
4. Use TypeScript for type safety
5. Provide user feedback (toasts)
6. Use multi-language support

## Common Gotchas

1. Don't forget to await async functions
2. Check for null before using data
3. Handle both success and error cases
4. Cleanup refs on unmount (automatic)
5. Validate input before submission (automatic in hooks)

## Performance Tips

1. Use individual field updates for goals
2. Debounce rapid updates (slider inputs)
3. Clear images when done (useImageUpload does this)
4. Abort requests on unmount (automatic)
5. Use optimistic updates for better UX

