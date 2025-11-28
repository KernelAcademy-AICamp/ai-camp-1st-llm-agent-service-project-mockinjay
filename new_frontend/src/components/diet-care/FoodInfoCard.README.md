# FoodInfoCard Components

Production-ready React components for displaying safe and warning food information in the DietCare page of the CareGuide platform.

## Components

### `FoodInfoCard`
Generic card component for displaying categorized food information with either safe or warning styling.

### `SafeFoodCard`
Specialized component for displaying safe/recommended foods with a green check icon.

### `WarningFoodCard`
Specialized component for displaying warning/restricted foods with a red alert triangle icon.

## Features

- **Bilingual Support**: Korean and English labels
- **Dark Mode**: Full support with appropriate color schemes
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Performance**: Memoized with React.memo to prevent unnecessary re-renders
- **Responsive**: Mobile-first design with grid layouts
- **Type Safety**: Full TypeScript support with exported interfaces

## Installation

The components are already available in the diet-care module:

```tsx
import { SafeFoodCard, WarningFoodCard, FoodCategory } from '@/components/diet-care';
```

## Basic Usage

### SafeFoodCard Example

```tsx
import { SafeFoodCard, FoodCategory } from '@/components/diet-care';

const safeFoods: FoodCategory[] = [
  { label: '과일', items: ['사과', '베리류', '체리', '포도'] },
  { label: '채소', items: ['양배추', '오이', '가지'] },
  { label: '곡물', items: ['흰 쌀밥', '흰 빵', '파스타'] }
];

function MyComponent() {
  return (
    <SafeFoodCard
      title="저칼륨 음식 (먹어도 되는 음식)"
      categories={safeFoods}
      language="ko"
    />
  );
}
```

### WarningFoodCard Example

```tsx
import { WarningFoodCard, FoodCategory } from '@/components/diet-care';

const warningFoods: FoodCategory[] = [
  { label: '과일', items: ['바나나', '오렌지', '키위'] },
  { label: '채소', items: ['시금치', '감자', '고구마'] },
  { label: '견과류', items: ['모든 견과류'] }
];

function MyComponent() {
  return (
    <WarningFoodCard
      title="고칼륨 음식 (피해야 하는 음식)"
      categories={warningFoods}
      language="ko"
    />
  );
}
```

### Side-by-Side Layout

```tsx
import { SafeFoodCard, WarningFoodCard, FoodCategory } from '@/components/diet-care';

function DietInfoSection() {
  const safeFoods: FoodCategory[] = [...];
  const warningFoods: FoodCategory[] = [...];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <SafeFoodCard
        title="저칼륨 음식"
        categories={safeFoods}
        language="ko"
      />
      <WarningFoodCard
        title="고칼륨 음식"
        categories={warningFoods}
        language="ko"
      />
    </div>
  );
}
```

## API Reference

### FoodCategory Interface

```tsx
interface FoodCategory {
  label: string;      // Category label (e.g., '과일', '채소')
  items: string[];    // Array of food items in this category
}
```

### FoodInfoCardProps

```tsx
interface FoodInfoCardProps {
  type: 'safe' | 'warning';        // Card type (determines icon and styling)
  title: string;                   // Card title displayed in header
  categories: FoodCategory[];      // Array of food categories to display
  language?: 'en' | 'ko';         // Language for ARIA labels (default: 'ko')
  className?: string;              // Additional CSS classes
}
```

### SafeFoodCardProps

```tsx
interface SafeFoodCardProps {
  title: string;                   // Card title
  categories: FoodCategory[];      // Array of food categories
  language?: 'en' | 'ko';         // Language (default: 'ko')
  className?: string;              // Additional CSS classes
}
```

### WarningFoodCardProps

```tsx
interface WarningFoodCardProps {
  title: string;                   // Card title
  categories: FoodCategory[];      // Array of food categories
  language?: 'en' | 'ko';         // Language (default: 'ko')
  className?: string;              // Additional CSS classes
}
```

## Advanced Usage

### Integration with NutrientEducationSection

```tsx
import {
  NutrientEducationSection,
  SafeFoodCard,
  WarningFoodCard,
  NutrientInfo,
  FoodCategory
} from '@/components/diet-care';

const potassiumInfo: NutrientInfo = {
  id: 'potassium',
  nameKo: '칼륨',
  nameEn: 'Potassium',
  bulletPoints: {
    ko: [
      '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
      '신장 기능이 저하되면 칼륨이 체내에 축적됩니다'
    ],
    en: [
      'Potassium is crucial for nerve and muscle function',
      'When kidney function declines, potassium accumulates'
    ]
  }
};

const safeFoods: FoodCategory[] = [...];
const warningFoods: FoodCategory[] = [...];

function PotassiumSection() {
  return (
    <NutrientEducationSection nutrient={potassiumInfo} language="ko">
      <div className="grid md:grid-cols-2 gap-6">
        <SafeFoodCard
          title="저칼륨 음식"
          categories={safeFoods}
          language="ko"
        />
        <WarningFoodCard
          title="고칼륨 음식"
          categories={warningFoods}
          language="ko"
        />
      </div>
    </NutrientEducationSection>
  );
}
```

### Custom Styling

```tsx
<SafeFoodCard
  title="Safe Foods"
  categories={foods}
  language="en"
  className="shadow-lg hover:shadow-xl transition-shadow"
/>
```

### English Version

```tsx
const safeFoods: FoodCategory[] = [
  { label: 'Fruits', items: ['Apple', 'Berries', 'Cherries', 'Grapes'] },
  { label: 'Vegetables', items: ['Cabbage', 'Cucumber', 'Eggplant'] }
];

<SafeFoodCard
  title="Low Potassium Foods (Safe to Eat)"
  categories={safeFoods}
  language="en"
/>
```

## Styling Details

### Safe Food Card
- **Icon**: White check mark (size 16) in green circle background
- **Background**: `bg-[#22C55E]` (light mode), `bg-green-600` (dark mode)
- **Border**: `border-[#E5E7EB]` (light mode), `border-gray-700` (dark mode)

### Warning Food Card
- **Icon**: Red alert triangle (size 24)
- **Color**: `text-[#EF4444]` (light mode), `text-red-500` (dark mode)
- **Border**: Same as safe card

### Common Styles
- **Card**: `rounded-2xl p-6`
- **Category Label**: `font-bold min-w-[40px] text-[#1F2937]` (dark: `text-white`)
- **Category Items**: `text-[#6B7280]` (dark: `text-gray-400`)
- **Spacing**: `space-y-4` between categories

## Accessibility Checklist

- [x] Semantic HTML with proper heading levels (h4)
- [x] ARIA labels for icons
- [x] aria-hidden on decorative icons
- [x] Role="region" for card containers
- [x] aria-labelledby linking titles
- [x] Proper color contrast ratios (WCAG 2.1 AA)
- [x] Dark mode support
- [x] Keyboard navigation support (focusable regions)
- [x] Screen reader friendly structure

## Performance Considerations

### Memoization
All components are wrapped with `React.memo` to prevent unnecessary re-renders:

```tsx
export const SafeFoodCard: React.FC<SafeFoodCardProps> = React.memo((props) => {
  return <FoodInfoCard type="safe" {...props} />;
});
```

### Display Names
Components have displayName set for better debugging in React DevTools:

```tsx
FoodInfoCard.displayName = 'FoodInfoCard';
SafeFoodCard.displayName = 'SafeFoodCard';
WarningFoodCard.displayName = 'WarningFoodCard';
```

### Optimization Tips

1. **Memoize category data** outside component or use `useMemo`:
   ```tsx
   const safeFoods = useMemo(() => [
     { label: '과일', items: ['사과', '베리류'] }
   ], []);
   ```

2. **Avoid inline object creation** for categories:
   ```tsx
   // Bad
   <SafeFoodCard categories={[{ label: '과일', items: ['사과'] }]} />

   // Good
   const foods = [{ label: '과일', items: ['사과'] }];
   <SafeFoodCard categories={foods} />
   ```

3. **Use stable references** for props to benefit from memoization

## Testing

### Running Tests

```bash
npm test -- FoodInfoCard.test.tsx
```

### Test Coverage

- Component rendering (safe and warning types)
- Bilingual support (Korean/English)
- Dark mode classes
- Accessibility attributes
- Performance optimizations
- Custom styling
- Empty categories handling

### Example Test

```tsx
import { render, screen } from '@testing-library/react';
import { SafeFoodCard, FoodCategory } from './FoodInfoCard';

test('renders safe food card with categories', () => {
  const foods: FoodCategory[] = [
    { label: '과일', items: ['사과', '베리류'] }
  ];

  render(
    <SafeFoodCard
      title="저칼륨 음식"
      categories={foods}
      language="ko"
    />
  );

  expect(screen.getByText('저칼륨 음식')).toBeInTheDocument();
  expect(screen.getByText('과일:')).toBeInTheDocument();
  expect(screen.getByText(/사과.*베리류/)).toBeInTheDocument();
});
```

## Deployment Checklist

Before deploying to production, verify:

- [ ] All TypeScript types are properly exported
- [ ] Components are exported from index.ts
- [ ] Tests pass with 100% coverage
- [ ] No console errors or warnings
- [ ] Dark mode works correctly
- [ ] Accessibility audit passes (Lighthouse/axe)
- [ ] Performance metrics are acceptable
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Icons render correctly (lucide-react dependency)
- [ ] Korean and English labels display properly
- [ ] Component works in all target browsers

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- iOS Safari (latest 2 versions)
- Android Chrome (latest 2 versions)

## Dependencies

- React 18+
- TypeScript 4.9+
- lucide-react (for icons)
- Tailwind CSS 3+ (for styling)

## Migration from Old Implementation

If you're replacing inline food cards from DietCarePage.tsx:

### Before
```tsx
<div className="border border-[#E5E7EB] rounded-2xl p-6">
  <div className="flex items-center gap-2 mb-6">
    <div className="w-6 h-6 rounded bg-[#22C55E] flex items-center justify-center">
      <Check size={16} color="white" strokeWidth={3} />
    </div>
    <h4 className="font-bold text-[#1F2937]">저칼륨 음식</h4>
  </div>
  <div className="space-y-4 text-sm">
    {/* manual categories */}
  </div>
</div>
```

### After
```tsx
<SafeFoodCard
  title="저칼륨 음식"
  categories={safeFoods}
  language="ko"
/>
```

## Related Components

- `NutrientEducationSection`: Wrapper component for nutrient information with bullet points
- `DietTypeCard`: Card for different diet types (low sodium, low protein, etc.)
- `NutritionResults`: Display nutrition analysis results
- `NutritionProgressBar`: Show nutrition goal progress

## Support

For issues or questions:
1. Check the usage examples in `FoodInfoCard.usage.example.tsx`
2. Review the tests in `__tests__/FoodInfoCard.test.tsx`
3. Consult the component JSDoc comments in `FoodInfoCard.tsx`

## License

Part of the CareGuide platform. All rights reserved.
