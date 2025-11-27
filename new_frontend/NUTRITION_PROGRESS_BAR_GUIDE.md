# NutritionProgressBar Component Guide

## Overview
A reusable, accessible progress bar component for displaying nutrition consumption against daily goals.

## Features
- Memoized for performance
- Color-coded thresholds (warning/danger states)
- Full ARIA accessibility
- Live region updates
- Customizable colors and thresholds

## Basic Usage

```typescript
import { NutritionProgressBar } from './components/diet-care';

const MyComponent = () => {
  return (
    <NutritionProgressBar
      label="Sodium"
      current={1500}
      target={2000}
      unit="mg"
      color="blue"
    />
  );
};
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | ✅ | - | Display name of the nutrient |
| `current` | `number` | ✅ | - | Current consumption value |
| `target` | `number` | ✅ | - | Daily target/limit value |
| `unit` | `string` | ✅ | - | Unit of measurement (mg, g, kcal) |
| `color` | `'blue' \| 'green' \| 'yellow' \| 'red' \| 'purple'` | ❌ | `'blue'` | Base color theme |
| `warningThreshold` | `number` | ❌ | `80` | Percentage to show warning (yellow) |
| `dangerThreshold` | `number` | ❌ | `100` | Percentage to show danger (red) |

## Color Coding

The component automatically changes color based on percentage:

```typescript
// percentage < warningThreshold (< 80%) → use specified color
// percentage >= warningThreshold (≥ 80%) → yellow warning
// percentage >= dangerThreshold (≥ 100%) → red danger

<NutritionProgressBar
  label="Sodium"
  current={1900}  // 95% of 2000
  target={2000}
  unit="mg"
  // Will show YELLOW (warning state)
/>

<NutritionProgressBar
  label="Sodium"
  current={2100}  // 105% of 2000
  target={2000}
  unit="mg"
  // Will show RED (danger state)
/>
```

## Complete Example with useNutritionProgress

```typescript
import React from 'react';
import { NutritionProgressBar } from './components/diet-care';
import { useNutritionProgress } from './hooks/useNutritionProgress';

const DailyNutritionDashboard = () => {
  const { progress, loading } = useNutritionProgress();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!progress) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-4">
      <h2>Daily Nutrition Progress</h2>

      <NutritionProgressBar
        label="Calories"
        current={progress.calories.current}
        target={progress.calories.target}
        unit="kcal"
        color="green"
      />

      <NutritionProgressBar
        label="Protein"
        current={progress.protein.current}
        target={progress.protein.target}
        unit="g"
        color="purple"
      />

      <NutritionProgressBar
        label="Sodium"
        current={progress.sodium.current}
        target={progress.sodium.target}
        unit="mg"
        color="blue"
      />

      <NutritionProgressBar
        label="Potassium"
        current={progress.potassium.current}
        target={progress.potassium.target}
        unit="mg"
        color="yellow"
      />

      <NutritionProgressBar
        label="Phosphorus"
        current={progress.phosphorus.current}
        target={progress.phosphorus.target}
        unit="mg"
        color="red"
      />
    </div>
  );
};
```

## Accessibility Features

### ARIA Attributes
```typescript
// The component automatically includes:
<div role="region" aria-label="Sodium progress">
  <label id="progress-label-sodium">Sodium</label>

  <Progress
    aria-labelledby="progress-label-sodium"
    aria-valuenow={75}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuetext="75% of daily goal"
  />

  <span role="status" aria-live="polite">
    75%
  </span>
</div>
```

### Live Region Updates
The percentage and status text update dynamically using `aria-live="polite"`, announcing changes to screen readers.

## Styling

The component uses Tailwind CSS with dark mode support:

```typescript
// Light mode
bg-white text-gray-900

// Dark mode
dark:bg-gray-800 dark:text-white

// Progress colors adjust automatically
bg-blue-600 → dark:bg-blue-500
text-red-600 → dark:text-red-400
```

## Custom Thresholds

```typescript
// For nutrients where lower is better (sodium, potassium)
<NutritionProgressBar
  label="Sodium"
  current={1800}
  target={2000}
  unit="mg"
  color="blue"
  warningThreshold={80}   // Show warning at 1600mg (80%)
  dangerThreshold={100}   // Show danger at 2000mg (100%)
/>

// For nutrients where you want to reach the goal (calories, protein)
<NutritionProgressBar
  label="Protein"
  current={35}
  target={50}
  unit="g"
  color="purple"
  warningThreshold={120}  // No warning until exceeding goal
  dangerThreshold={150}   // Only danger if far exceeding
/>
```

## Integration with Diet Log

```typescript
import { NutritionProgressBar } from './components/diet-care';
import { useDietGoals } from './hooks/useDietGoals';
import { useNutritionProgress } from './hooks/useNutritionProgress';

const DietLogSummary = () => {
  const { goals } = useDietGoals();
  const { progress } = useNutritionProgress();

  if (!goals || !progress) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Today's Progress</h3>

      <div className="space-y-4">
        <NutritionProgressBar
          label="Sodium"
          current={progress.sodium.current}
          target={goals.targetSodium}
          unit="mg"
          color="blue"
        />

        <NutritionProgressBar
          label="Protein"
          current={progress.protein.current}
          target={goals.targetProtein}
          unit="g"
          color="purple"
        />
      </div>
    </div>
  );
};
```

## Performance

The component is wrapped with `React.memo`, so it only re-renders when props change:

```typescript
// Only re-renders when current, target, or other props change
export const NutritionProgressBar = React.memo(({ ... }) => {
  // Component logic
});

// Usage: Won't re-render unnecessarily
<NutritionProgressBar
  label="Sodium"
  current={sodiumValue}  // Only re-renders if this changes
  target={2000}
  unit="mg"
/>
```

## Testing

```typescript
import { render, screen } from '@testing-library/react';
import { NutritionProgressBar } from './NutritionProgressBar';

describe('NutritionProgressBar', () => {
  it('should display correct percentage', () => {
    render(
      <NutritionProgressBar
        label="Sodium"
        current={1500}
        target={2000}
        unit="mg"
      />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('1,500 / 2,000 mg')).toBeInTheDocument();
  });

  it('should show warning state at threshold', () => {
    const { container } = render(
      <NutritionProgressBar
        label="Sodium"
        current={1600}
        target={2000}
        unit="mg"
        warningThreshold={80}
      />
    );

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText(/near limit/i)).toBeInTheDocument();
  });

  it('should show danger state when exceeded', () => {
    render(
      <NutritionProgressBar
        label="Sodium"
        current={2100}
        target={2000}
        unit="mg"
      />
    );

    expect(screen.getByText(/limit exceeded/i)).toBeInTheDocument();
  });

  it('should be accessible', async () => {
    const { container } = render(
      <NutritionProgressBar
        label="Sodium"
        current={1500}
        target={2000}
        unit="mg"
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});
```

## Tips

1. **Consistent Colors**: Use the same color for the same nutrient across your app
2. **Custom Thresholds**: Adjust thresholds based on CKD stage
3. **Responsive Design**: The component works well on mobile and desktop
4. **Dark Mode**: Automatically adapts to dark mode
5. **Localization**: Pass translated labels from your i18n system

## Common Patterns

### With Goals Form
```typescript
const GoalsWithProgress = () => {
  const { goals, form, saveGoals } = useDietGoals();
  const { progress } = useNutritionProgress();

  return (
    <div>
      <GoalSettingForm onSubmit={saveGoals} form={form} />

      {progress && (
        <div className="mt-6">
          <h3>Current Progress</h3>
          <NutritionProgressBar
            label="Sodium"
            current={progress.sodium.current}
            target={goals?.targetSodium || 2000}
            unit="mg"
          />
        </div>
      )}
    </div>
  );
};
```

### With Meal Log
```typescript
const MealLogWithFeedback = () => {
  const { submitLog } = useDietLog();
  const { progress, refreshProgress } = useNutritionProgress();

  const handleSubmit = async (data) => {
    await submitLog(data);
    await refreshProgress(); // Update progress bars
  };

  return (
    <div>
      <MealLogForm onSubmit={handleSubmit} />

      <div className="mt-6">
        <h3>Updated Progress</h3>
        {progress && (
          <>
            <NutritionProgressBar {...progress.sodium} unit="mg" />
            <NutritionProgressBar {...progress.protein} unit="g" />
          </>
        )}
      </div>
    </div>
  );
};
```
