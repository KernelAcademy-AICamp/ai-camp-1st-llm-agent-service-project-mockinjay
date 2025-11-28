# MealEntryCard Component

## Overview

The `MealEntryCard` component is a production-ready React component designed to display individual meal history entries in the DietCare page. It shows meal information including the meal type, date, consumed foods, and total calories in a visually appealing and accessible card format.

## Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Support**: Full support for light and dark themes
- **Accessibility Compliant**: WCAG 2.1 AA compliant with proper ARIA labels
- **Performance Optimized**: Memoized with React.memo to prevent unnecessary re-renders
- **Interactive**: Optional click handler for detailed view navigation
- **Type Safe**: Full TypeScript support with comprehensive interfaces
- **Internationalization**: Supports both English and Korean languages

## Installation

The component is part of the diet-care components package and can be imported from the centralized export:

```tsx
import { MealEntryCard, type MealLog } from '@/components/diet-care';
```

## API Reference

### MealLog Interface

```typescript
interface MealLog {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Meal type (e.g., '아침', '점심', '저녁' in Korean or 'Breakfast', 'Lunch', 'Dinner' in English) */
  meal: string;
  /** Array of food items consumed in the meal */
  foods: string[];
  /** Total calories for the meal */
  calories: number;
}
```

### MealEntryCardProps Interface

```typescript
interface MealEntryCardProps {
  /** Meal log data to display */
  log: MealLog;
  /** Language for accessibility labels */
  language: 'en' | 'ko';
  /** Optional click handler for card interaction */
  onClick?: () => void;
}
```

## Usage Examples

### Basic Usage (Non-clickable)

```tsx
import { MealEntryCard, type MealLog } from '@/components/diet-care';

const log: MealLog = {
  date: '2025-11-23',
  meal: '아침',
  foods: ['현미밥', '된장찌개', '배추김치'],
  calories: 450
};

function MealHistory() {
  return (
    <MealEntryCard
      log={log}
      language="ko"
    />
  );
}
```

### Interactive Usage (With Click Handler)

```tsx
import { MealEntryCard, type MealLog } from '@/components/diet-care';
import { useNavigate } from 'react-router-dom';

function MealHistory() {
  const navigate = useNavigate();

  const log: MealLog = {
    date: '2025-11-23',
    meal: 'Breakfast',
    foods: ['Brown Rice', 'Miso Soup', 'Kimchi'],
    calories: 450
  };

  const handleClick = () => {
    navigate(`/diet-care/meal/${log.date}/${log.meal}`);
  };

  return (
    <MealEntryCard
      log={log}
      language="en"
      onClick={handleClick}
    />
  );
}
```

### Rendering Multiple Meal Entries

```tsx
import { MealEntryCard, type MealLog } from '@/components/diet-care';

function MealHistoryList() {
  const logs: MealLog[] = [
    {
      date: '2025-11-23',
      meal: '아침',
      foods: ['현미밥', '된장찌개', '배추김치'],
      calories: 450
    },
    {
      date: '2025-11-23',
      meal: '점심',
      foods: ['닭가슴살', '샐러드', '사과'],
      calories: 520
    },
    {
      date: '2025-11-23',
      meal: '저녁',
      foods: ['현미밥', '두부구이', '브로콜리'],
      calories: 480
    }
  ];

  return (
    <div className="space-y-4">
      {logs.map((log, index) => (
        <MealEntryCard
          key={`${log.date}-${log.meal}`}
          log={log}
          language="ko"
          onClick={() => console.log('Clicked:', log)}
        />
      ))}
    </div>
  );
}
```

## Styling

### Color Scheme

The component uses the following color palette:

- **Meal Title**: `#1F2937` (light mode), `white` (dark mode)
- **Date Text**: `#9CA3AF` (light mode), `gray-500` (dark mode)
- **Calorie Badge Background**: `#F3F4F6` (light mode), `gray-700` (dark mode)
- **Calorie Badge Text**: `#00C9B7` (brand teal)
- **Food Tag Background**: `#F9FAFB` (light mode), `gray-700` (dark mode)
- **Food Tag Text**: `#4B5563` (light mode), `gray-300` (dark mode)

### Layout

- Card padding: `p-4` (16px)
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow` (default shadow)
- Gap between food tags: `gap-2` (8px)
- Spacing between sections: `mb-3` (12px)

### Interactive States

When `onClick` is provided:

- **Hover**: Increased shadow (`hover:shadow-lg`), teal border (`hover:border-[#00C9B7]`)
- **Focus**: Focus ring with teal color (`focus:ring-2 focus:ring-[#00C9B7]`)
- **Transition**: Smooth transition for all state changes (`transition-all duration-200`)

## Accessibility

### ARIA Labels

The component includes comprehensive ARIA labels based on the selected language:

**Korean (`language="ko"`)**:
- Calories: "450 칼로리"
- Foods list: "음식 목록"
- Click to view: "자세히 보기"

**English (`language="en"`)**:
- Calories: "450 Calories"
- Foods list: "Foods list"
- Click to view: "Click to view details"

### Keyboard Navigation

- When clickable, the card is fully keyboard accessible
- Supports Enter and Space key activation
- Focus indicator visible with 2px teal ring

### Screen Reader Support

- Proper semantic HTML elements (`<article>`, `<button>`, `<h4>`)
- Screen reader only text for clickable cards
- Unique IDs for ARIA labeling
- List semantics for food items (`role="list"`, `role="listitem"`)

### Accessibility Checklist

- [x] Proper heading hierarchy
- [x] ARIA labels for all interactive elements
- [x] Keyboard navigation support
- [x] Focus indicators
- [x] Screen reader friendly structure
- [x] Semantic HTML
- [x] Color contrast compliance (WCAG AA)
- [x] Alternative text for status information

## Performance Considerations

### React.memo

The component is wrapped with `React.memo` to prevent unnecessary re-renders. It will only re-render when props change.

```tsx
export const MealEntryCard: React.FC<MealEntryCardProps> = React.memo(({ ... }) => {
  // Component implementation
});
```

### Optimization Tips

1. **Stable Keys**: When rendering lists, use stable keys combining date and meal
   ```tsx
   key={`${log.date}-${log.meal}`}
   ```

2. **Callback Memoization**: If passing onClick handlers in lists, use `useCallback`
   ```tsx
   const handleClick = useCallback((log: MealLog) => {
     navigate(`/meal/${log.date}`);
   }, [navigate]);
   ```

3. **Avoid Inline Objects**: Don't create new objects in render
   ```tsx
   // Bad
   <MealEntryCard log={{ date: '2025-11-23', ... }} />

   // Good
   const log = useMemo(() => ({ date: '2025-11-23', ... }), []);
   <MealEntryCard log={log} />
   ```

## Testing

The component includes comprehensive test coverage:

- Rendering with different props
- Accessibility compliance
- Click interaction
- Dark mode support
- Edge cases (empty foods, large numbers, special characters)
- Memoization behavior

Run tests:

```bash
npm test MealEntryCard
```

## Dark Mode

The component automatically supports dark mode through Tailwind's `dark:` variants. Ensure your app has dark mode configured:

```tsx
// In your root component
<html className={isDarkMode ? 'dark' : ''}>
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome 90+

## Migration from Legacy Code

If you're migrating from the old DietCarePage component:

**Before**:
```tsx
<div className="card">
  <div className="flex justify-between items-start mb-3">
    <div>
      <h4 style={{ color: '#1F2937' }}>{log.meal}</h4>
      <p className="text-sm" style={{ color: '#9CA3AF' }}>
        {log.date}
      </p>
    </div>
    <span className="px-3 py-1 rounded-lg text-sm font-medium"
      style={{ background: '#F3F4F6', color: '#00C9B7' }}>
      {log.calories} kcal
    </span>
  </div>
  <div className="flex flex-wrap gap-2">
    {log.foods.map((food, idx) => (
      <span key={idx} className="px-3 py-1 rounded-lg text-sm"
        style={{ background: '#F9FAFB', color: '#4B5563' }}>
        {food}
      </span>
    ))}
  </div>
</div>
```

**After**:
```tsx
<MealEntryCard log={log} language="ko" />
```

## Deployment Checklist

Before deploying to production:

- [ ] Component renders correctly in light mode
- [ ] Component renders correctly in dark mode
- [ ] All accessibility tests pass
- [ ] Click interactions work as expected
- [ ] No console errors or warnings
- [ ] Performance metrics are acceptable
- [ ] TypeScript compilation succeeds
- [ ] All unit tests pass
- [ ] Visual regression tests pass (if applicable)

## Related Components

- `MealLogForm` - Form for adding new meal entries
- `MealHistoryContent` - Container for meal history list
- `GoalSettingForm` - Form for setting dietary goals
- `NutritionResults` - Display nutrition analysis results

## License

Part of the CareGuide project.
