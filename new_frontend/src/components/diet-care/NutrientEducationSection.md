# NutrientEducationSection Component

## Overview

The `NutrientEducationSection` component displays educational content about specific nutrients (e.g., Potassium, Phosphorus) with support for bilingual content (Korean/English) and dark mode. It's designed for use in the CareGuide CKD patient education platform.

## Location

```
/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/components/diet-care/NutrientEducationSection.tsx
```

## Features

- **Bilingual Support**: Displays content in Korean or English
- **Dark Mode**: Full support for dark theme with Tailwind CSS
- **Accessibility**: ARIA attributes, semantic HTML, keyboard navigation
- **Performance**: Memoized with `React.memo` to prevent unnecessary re-renders
- **Extensible**: Accepts children for additional content (e.g., Safe/Warning food cards)
- **Type-Safe**: Full TypeScript support with exported interfaces

## Installation

```bash
# Already included in the project
# lucide-react is required for the BarChart2 icon
npm install lucide-react
```

## Usage

### Basic Usage

```tsx
import { NutrientEducationSection, NutrientInfo } from '@/components/diet-care';

const potassiumInfo: NutrientInfo = {
  id: 'potassium',
  nameKo: '칼륨',
  nameEn: 'Potassium',
  bulletPoints: {
    ko: [
      '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
      '신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다'
    ],
    en: [
      'Potassium is a crucial mineral for nerve and muscle function',
      'When kidney function declines, potassium can accumulate in the body'
    ]
  }
};

function MyComponent() {
  return (
    <NutrientEducationSection
      nutrient={potassiumInfo}
      language="ko"
    />
  );
}
```

### With Additional Content (Children)

```tsx
<NutrientEducationSection
  nutrient={phosphorusInfo}
  language="ko"
>
  {/* Safe Foods Card */}
  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
    <h4 className="font-semibold text-green-800 dark:text-green-300">
      안전한 식품
    </h4>
    <ul className="text-sm text-green-700 dark:text-green-400">
      <li>쌀, 국수</li>
      <li>사과, 배</li>
    </ul>
  </div>

  {/* Warning Foods Card */}
  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
    <h4 className="font-semibold text-red-800 dark:text-red-300">
      주의 식품
    </h4>
    <ul className="text-sm text-red-700 dark:text-red-400">
      <li>바나나, 오렌지</li>
      <li>토마토, 감자</li>
    </ul>
  </div>
</NutrientEducationSection>
```

### Multiple Sections in a Page

```tsx
const nutrients: NutrientInfo[] = [potassiumInfo, phosphorusInfo, sodiumInfo];

function DietCarePage() {
  return (
    <div className="space-y-8">
      {nutrients.map((nutrient) => (
        <NutrientEducationSection
          key={nutrient.id}
          nutrient={nutrient}
          language="ko"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        />
      ))}
    </div>
  );
}
```

## Props

### `NutrientEducationSectionProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `nutrient` | `NutrientInfo` | Yes | - | Nutrient information to display |
| `language` | `'en' \| 'ko'` | No | `'ko'` | Display language |
| `children` | `React.ReactNode` | No | - | Additional content below bullet points |
| `className` | `string` | No | `''` | Additional CSS classes for the section |

### `NutrientInfo` Interface

```typescript
interface NutrientInfo {
  id: string;              // Unique identifier (e.g., 'potassium')
  nameKo: string;          // Korean name (e.g., '칼륨')
  nameEn: string;          // English name (e.g., 'Potassium')
  bulletPoints: {
    ko: string[];          // Korean bullet points
    en: string[];          // English bullet points
  };
}
```

## Styling

### Design System Colors

- **Light Mode**:
  - Icon & Title: `#1F2937` (gray-800)
  - Bullet Points: `#4B5563` (gray-600)

- **Dark Mode**:
  - Icon & Title: `white`
  - Bullet Points: `gray-400`

### Custom Styling

```tsx
// Add custom background and spacing
<NutrientEducationSection
  nutrient={nutrientInfo}
  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-lg"
/>
```

## Accessibility

### ARIA Attributes

- Section has `aria-labelledby` pointing to heading ID
- Heading has unique `id` based on nutrient ID
- Icon has `aria-hidden="true"` (decorative)

### Semantic HTML

- Uses `<section>` for semantic structure
- Uses `<h3>` for proper heading hierarchy
- Bullet points wrapped in semantic `<div>` with paragraph tags

### Keyboard Navigation

- All content is keyboard accessible
- Proper focus management for interactive children

## Performance Optimizations

1. **React.memo**: Component is wrapped with `React.memo` to prevent unnecessary re-renders
2. **Key Props**: Proper keys on mapped bullet points for efficient reconciliation
3. **Conditional Rendering**: Validation checks prevent rendering empty content

### Memoization Example

```tsx
// Component will only re-render if props change
const MemoizedSection = React.memo(NutrientEducationSection);

// Use with stable data
const potassiumInfo = useMemo(() => ({
  id: 'potassium',
  nameKo: '칼륨',
  nameEn: 'Potassium',
  bulletPoints: { /* ... */ }
}), []);
```

## Testing

### Running Tests

```bash
cd new_frontend
npm test -- NutrientEducationSection.test.tsx
```

### Test Coverage

The component includes comprehensive tests for:

- ✅ Rendering in Korean and English
- ✅ Icon display
- ✅ All bullet points rendering
- ✅ Children content rendering
- ✅ Custom className application
- ✅ ARIA attributes
- ✅ Screen reader accessibility
- ✅ Empty bullet points handling
- ✅ Dark mode class application
- ✅ Memoization

### Example Test

```typescript
it('should render the component with Korean language by default', () => {
  render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

  expect(screen.getByText(/칼륨/)).toBeInTheDocument();
  expect(screen.getByText(/Potassium/)).toBeInTheDocument();
  expect(screen.getByText(/신경과 근육 기능/)).toBeInTheDocument();
});
```

## Deployment Checklist

Before deploying this component to production:

- [ ] Verify all bullet points display correctly in both languages
- [ ] Test dark mode appearance in browser
- [ ] Check responsive layout on mobile, tablet, and desktop
- [ ] Run accessibility audit (Lighthouse, axe DevTools)
- [ ] Verify keyboard navigation works properly
- [ ] Run all unit tests and ensure they pass
- [ ] Check console for any warnings or errors
- [ ] Validate TypeScript types compile without errors
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify icon loads correctly (lucide-react dependency)
- [ ] Test edge cases (empty data, missing translations)
- [ ] Ensure proper memoization for performance

## Browser Support

- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- Mobile Safari: ✅ iOS 14+
- Chrome Mobile: ✅ Latest

## Related Components

- `FoodInfoCard` - Displays individual food item information
- `NutritionProgressBar` - Shows nutrition intake progress
- `DietTypeCard` - Displays diet type recommendations

## Example Data

See `NutrientEducationSection.example.tsx` for complete usage examples with:
- Potassium information
- Phosphorus information
- Sodium information
- Calcium information
- Complete DietCare page implementation

## Troubleshooting

### Issue: Bullet points not showing

**Solution**: Ensure the `bulletPoints` object has data for the selected language:

```typescript
bulletPoints: {
  ko: ['포인트 1', '포인트 2'],  // Must have data
  en: ['Point 1', 'Point 2']      // Must have data
}
```

### Issue: Dark mode not working

**Solution**: Ensure Tailwind dark mode is configured in `tailwind.config.js`:

```javascript
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}
```

### Issue: Icon not displaying

**Solution**: Verify `lucide-react` is installed:

```bash
npm install lucide-react
```

## Contributing

When modifying this component:

1. Update TypeScript interfaces if props change
2. Add corresponding tests for new features
3. Update this documentation
4. Ensure accessibility standards are maintained
5. Test in both light and dark mode
6. Verify bilingual content works correctly

## License

Part of the CareGuide project. Internal use only.
