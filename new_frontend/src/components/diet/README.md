# Diet Care Components

Production-ready React components for nutrition management system designed for CKD (Chronic Kidney Disease) patients.

## Components Overview

### 1. FoodImageAnalyzer

AI-powered food image analysis with drag-and-drop support.

**Features:**
- Drag-and-drop file upload
- File validation (type, size)
- Image preview with rotation
- AI-powered nutrition analysis
- Results display with warnings and recommendations
- Error handling with retry capability

**Usage:**
```tsx
import { FoodImageAnalyzer } from '@/components/diet';

<FoodImageAnalyzer
  onAnalysisComplete={(result) => console.log(result)}
  maxFileSize={10 * 1024 * 1024}
  language="en"
/>
```

**Props:**
- `onAnalysisComplete?: (result: FoodAnalysisResult) => void` - Callback when analysis completes
- `maxFileSize?: number` - Maximum file size in bytes (default: 10MB)
- `acceptedFormats?: string[]` - Accepted file MIME types
- `language?: 'en' | 'ko'` - Display language

### 2. MealLogForm

Multi-tab meal logging with dynamic food item management.

**Features:**
- 4 meal type tabs (breakfast, lunch, dinner, snack)
- Dynamic food item rows (add/remove)
- Amount input with unit selector
- Time picker for each meal
- Notes field
- Optimistic updates

**Usage:**
```tsx
import { MealLogForm } from '@/components/diet';

<MealLogForm
  onSave={(mealLog) => saveMealLog(mealLog)}
  language="en"
/>
```

**Props:**
- `onSave?: (mealLog: MealLog) => void` - Callback when meal is saved
- `initialData?: Partial<MealLog>` - Pre-populate form data
- `language?: 'en' | 'ko'` - Display language

### 3. DailyProgress

Visual progress tracking with circular progress rings.

**Features:**
- Circular progress rings for each nutrient
- Color-coded status (good/warning/danger)
- Current vs target comparison
- Animated progress updates
- Summary statistics
- Clickable nutrients for detailed view
- Mobile-responsive with linear progress bars

**Usage:**
```tsx
import { DailyProgress } from '@/components/diet';

const current = {
  calories: 1500,
  protein: 40,
  sodium: 1200,
  potassium: 1800,
  phosphorus: 600,
};

const target = {
  calories: 2000,
  protein: 50,
  sodium: 1500,
  potassium: 2500,
  phosphorus: 800,
};

<DailyProgress
  current={current}
  target={target}
  onNutrientClick={(nutrient) => showDetails(nutrient)}
  language="en"
/>
```

**Props:**
- `current: Partial<NutritionData>` - Current nutrient intake
- `target: Partial<NutritionData>` - Target nutrient goals
- `onNutrientClick?: (nutrient: keyof NutritionData) => void` - Callback when nutrient is clicked
- `language?: 'en' | 'ko'` - Display language

### 4. GoalSettingForm

Nutrition goal management with CKD stage presets.

**Features:**
- Preset templates for CKD stages 1-5
- Custom goal input
- Real-time validation
- Reset to defaults
- Visual goal summary
- Info section with guidelines

**Usage:**
```tsx
import { GoalSettingForm } from '@/components/diet';

<GoalSettingForm
  initialGoals={currentGoals}
  onSave={(goals) => updateGoals(goals)}
  language="en"
/>
```

**Props:**
- `initialGoals?: NutritionGoals` - Pre-populate with existing goals
- `onSave?: (goals: NutritionGoals) => void` - Callback when goals are saved
- `language?: 'en' | 'ko'` - Display language

**CKD Stage Presets:**
- Stage 1: Normal/high kidney function
- Stage 2: Mild reduction
- Stage 3: Moderate reduction
- Stage 4: Severe reduction
- Stage 5: Kidney failure

### 5. StreakDisplay

Logging streak tracking with calendar heatmap and achievements.

**Features:**
- Current streak counter
- Longest streak record
- Total days tracked
- Calendar heatmap (30 days)
- Achievement badges
- Progress tracking for locked achievements
- Motivational messages

**Usage:**
```tsx
import { StreakDisplay } from '@/components/diet';

const streakData = {
  currentStreak: 7,
  longestStreak: 14,
  totalDays: 45,
  lastLoggedDate: '2024-01-15',
};

const calendarDays = generateLast30Days();

const achievements = [
  {
    id: '1',
    title: 'First Week',
    description: 'Logged meals for 7 consecutive days',
    icon: '🎉',
    unlockedAt: '2024-01-07',
  },
];

<StreakDisplay
  streakData={streakData}
  calendarDays={calendarDays}
  achievements={achievements}
  language="en"
/>
```

**Props:**
- `streakData: StreakData` - Streak statistics
- `calendarDays: CalendarDay[]` - Calendar data for heatmap
- `achievements?: Achievement[]` - Achievement badges
- `language?: 'en' | 'ko'` - Display language

## Type Definitions

All TypeScript types are exported from `@/types/diet`:

```tsx
import type {
  MealType,
  CKDStage,
  NutritionData,
  FoodItem,
  MealLog,
  NutritionGoals,
  NutrientProgress,
  StreakData,
  CalendarDay,
  Achievement,
  FoodAnalysisResult,
} from '@/types/diet';
```

## Best Practices

### Performance Optimization

All components use:
- `React.memo` for component memoization
- `useCallback` for event handlers
- `useMemo` for expensive computations
- Proper dependency arrays

### Accessibility

Components include:
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Semantic HTML

### Internationalization

All components support:
- English (en)
- Korean (ko)
- Easily extendable for more languages

### Dark Mode

All components fully support:
- Light mode
- Dark mode
- System preference detection

### Mobile Responsiveness

All components are:
- Mobile-first designed
- Touch-friendly
- Responsive grid layouts
- Adaptive UI elements

## Testing

Comprehensive test suites are provided for all components:

```bash
npm test -- components/diet
```

Test coverage includes:
- Component rendering
- User interactions
- State management
- Prop validation
- Accessibility
- Error handling
- Edge cases

## Error Handling

All components implement:
- Input validation
- Error boundaries
- User-friendly error messages
- Retry mechanisms
- Graceful degradation

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

Required peer dependencies:
- React 18+
- Radix UI components
- Lucide React icons
- Tailwind CSS
- TypeScript 5+

## Contributing

When adding new features:
1. Follow existing patterns
2. Add TypeScript types
3. Write comprehensive tests
4. Update documentation
5. Ensure accessibility
6. Test on mobile devices

## License

MIT
