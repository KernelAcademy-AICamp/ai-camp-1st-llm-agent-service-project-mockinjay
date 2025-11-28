# MealEntryCard - Quick Reference Card

## Import

```tsx
import { MealEntryCard, type MealLog } from '@/components/diet-care';
```

## Basic Usage

```tsx
// Non-interactive
<MealEntryCard log={log} language="ko" />

// Interactive
<MealEntryCard log={log} language="ko" onClick={() => {...}} />
```

## Data Structure

```typescript
const log: MealLog = {
  date: '2025-11-23',      // YYYY-MM-DD
  meal: '아침',             // Meal type
  foods: ['현미밥', '김치'],  // Food items
  calories: 450            // Total kcal
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `log` | `MealLog` | ✅ Yes | Meal data to display |
| `language` | `'en' \| 'ko'` | ✅ Yes | Language for accessibility |
| `onClick` | `() => void` | ❌ No | Click handler (makes card interactive) |

## Common Patterns

### List Rendering

```tsx
{logs.map((log) => (
  <MealEntryCard
    key={`${log.date}-${log.meal}`}
    log={log}
    language="ko"
  />
))}
```

### With Navigation

```tsx
const navigate = useNavigate();

<MealEntryCard
  log={log}
  language="ko"
  onClick={() => navigate(`/meal/${log.date}`)}
/>
```

### With Callback

```tsx
const handleClick = useCallback((log: MealLog) => {
  console.log('Clicked:', log);
}, []);

<MealEntryCard
  log={log}
  language="ko"
  onClick={() => handleClick(log)}
/>
```

## Styling

- Uses Tailwind CSS
- Automatic dark mode support
- Teal accent color: `#00C9B7`
- Responsive: works 320px+
- Touch-friendly: 44x44px minimum

## Accessibility

- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ High contrast support
- ✅ Focus indicators

## Performance

- Wrapped with `React.memo`
- Only re-renders when props change
- Use stable keys in lists
- Memoize onClick callbacks

## Testing

```bash
# Run tests
npm test -- MealEntryCard

# Run tests in watch mode
npm test -- MealEntryCard --watch
```

## Files

- **Component:** `MealEntryCard.tsx`
- **Tests:** `__tests__/MealEntryCard.test.tsx`
- **Examples:** `MealEntryCard.example.tsx`
- **Docs:** `MealEntryCard.README.md`

## Status

🟢 Production Ready | ✅ 26/26 Tests Passing | 📦 Build Successful
