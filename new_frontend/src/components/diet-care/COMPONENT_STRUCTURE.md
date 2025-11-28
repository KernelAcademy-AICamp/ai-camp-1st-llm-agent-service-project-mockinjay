# NutrientEducationSection Component Structure

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ <section> NutrientEducationSection                          │
│ data-testid="nutrient-section-{id}"                         │
│ aria-labelledby="nutrient-heading-{id}"                     │
│ className={className}                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Header Container (flex items-center gap-2 mb-4)   │    │
│  ├───────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  📊 <BarChart2 />                                  │    │
│  │     size={24}                                      │    │
│  │     className="text-[#1F2937] dark:text-white"    │    │
│  │     aria-hidden="true"                             │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────┐      │    │
│  │  │ <h3> Title                              │      │    │
│  │  │ id="nutrient-heading-{id}"              │      │    │
│  │  │ className="text-lg font-bold            │      │    │
│  │  │           text-[#1F2937] dark:text-white"│     │    │
│  │  │                                          │      │    │
│  │  │ {nameKo} ({nameEn})                     │      │    │
│  │  └─────────────────────────────────────────┘      │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Bullet Points Container                           │    │
│  │ className="text-sm text-[#4B5563]                 │    │
│  │           dark:text-gray-400 space-y-2            │    │
│  │           mb-6 pl-1"                              │    │
│  ├───────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  <p key="{id}-bullet-0">                          │    │
│  │    • {bulletPoints[language][0]}                  │    │
│  │  </p>                                              │    │
│  │                                                     │    │
│  │  <p key="{id}-bullet-1">                          │    │
│  │    • {bulletPoints[language][1]}                  │    │
│  │  </p>                                              │    │
│  │                                                     │    │
│  │  <p key="{id}-bullet-2">                          │    │
│  │    • {bulletPoints[language][2]}                  │    │
│  │  </p>                                              │    │
│  │                                                     │    │
│  │  ... (more bullet points)                         │    │
│  │                                                     │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Children Container (space-y-4)                    │    │
│  ├───────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  {children}                                        │    │
│  │  (e.g., SafeFoodCard, WarningFoodCard)           │    │
│  │                                                     │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Props Flow

```
Parent Component
      │
      ├─ nutrient: NutrientInfo
      │     ├─ id: string
      │     ├─ nameKo: string
      │     ├─ nameEn: string
      │     └─ bulletPoints: { ko: string[], en: string[] }
      │
      ├─ language?: 'en' | 'ko' (default: 'ko')
      │
      ├─ children?: React.ReactNode
      │
      └─ className?: string
            │
            ▼
    NutrientEducationSection
            │
            ├─ Renders Header (Icon + Title)
            ├─ Renders Bullet Points (based on language)
            └─ Renders Children (if provided)
```

## State and Data Flow

```
┌─────────────────────────┐
│ External State          │
│ (Parent Component)      │
│                         │
│ - nutrientData         │
│ - currentLanguage      │
└───────────┬─────────────┘
            │
            │ Props
            ▼
┌─────────────────────────┐
│ NutrientEducationSection│
│ (Stateless, Memoized)   │
│                         │
│ - Selects display name  │
│ - Selects bullet points │
│ - Validates data        │
└───────────┬─────────────┘
            │
            │ Render
            ▼
┌─────────────────────────┐
│ DOM Output              │
│                         │
│ - Semantic HTML         │
│ - ARIA attributes       │
│ - Styled with Tailwind  │
└─────────────────────────┘
```

## CSS Class Breakdown

### Light Mode
```css
.text-[#1F2937]   /* Icon and Title - Dark Gray */
.text-[#4B5563]   /* Bullet Points - Medium Gray */
```

### Dark Mode
```css
.dark:text-white       /* Icon and Title - White */
.dark:text-gray-400    /* Bullet Points - Light Gray */
```

### Layout Classes
```css
.flex              /* Header flex container */
.items-center      /* Vertical center alignment */
.gap-2            /* 8px gap between icon and title */
.mb-4             /* 16px margin bottom (header) */
.mb-6             /* 24px margin bottom (bullets) */
.space-y-2        /* 8px vertical spacing between paragraphs */
.space-y-4        /* 16px vertical spacing for children */
.pl-1             /* 4px left padding for bullet alignment */
```

### Typography Classes
```css
.text-lg          /* 18px font size (title) */
.text-sm          /* 14px font size (bullets) */
.font-bold        /* Bold font weight (title) */
```

## Example Rendered HTML

```html
<section
  class=""
  data-testid="nutrient-section-potassium"
  aria-labelledby="nutrient-heading-potassium"
>
  <!-- Header -->
  <div class="flex items-center gap-2 mb-4">
    <svg
      class="text-[#1F2937] dark:text-white"
      width="24"
      height="24"
      aria-hidden="true"
    >
      <!-- BarChart2 icon -->
    </svg>
    <h3
      id="nutrient-heading-potassium"
      class="text-lg font-bold text-[#1F2937] dark:text-white"
    >
      칼륨 (Potassium)
    </h3>
  </div>

  <!-- Bullet Points -->
  <div class="text-sm text-[#4B5563] dark:text-gray-400 space-y-2 mb-6 pl-1">
    <p>• 칼륨은 신경과 근육 기능에 중요한 미네랄입니다</p>
    <p>• 신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다</p>
    <p>• 고칼륨혈증은 심장 리듬에 영향을 줄 수 있습니다</p>
  </div>

  <!-- Children (if provided) -->
  <div class="space-y-4">
    <!-- SafeFoodCard, WarningFoodCard, etc. -->
  </div>
</section>
```

## Component Lifecycle

```
Mount
  ↓
Check props.nutrient.bulletPoints[props.language]
  ↓
If empty → console.warn
  ↓
Render structure
  ↓
Apply memoization (React.memo)
  ↓
Props change?
  ├─ Yes → Re-render
  └─ No  → Skip render (memoized)
```

## Integration Points

```
┌─────────────────────────────────────────────────┐
│ DietCarePage.tsx                                │
│                                                 │
│  const nutrients = [...]                       │
│                                                 │
│  {nutrients.map(nutrient => (                  │
│    <NutrientEducationSection                   │
│      nutrient={nutrient}                       │
│      language={currentLanguage}                │
│    >                                            │
│      <SafeFoodCard ... />                      │
│      <WarningFoodCard ... />                   │
│    </NutrientEducationSection>                 │
│  ))}                                            │
└─────────────────────────────────────────────────┘
```

## Accessibility Tree

```
section (nutrient-section-potassium)
├─ heading (level 3): "칼륨 (Potassium)"
├─ group (bullet points container)
│  ├─ paragraph: "• 칼륨은 신경과..."
│  ├─ paragraph: "• 신장 기능이..."
│  └─ paragraph: "• 고칼륨혈증은..."
└─ group (children container)
   ├─ [SafeFoodCard]
   └─ [WarningFoodCard]
```

## Performance Optimization Points

1. **React.memo**: Prevents re-render if props haven't changed
2. **Stable keys**: `{id}-bullet-{index}` for efficient reconciliation
3. **No inline functions**: All handlers/callbacks are stable
4. **Conditional rendering**: Early return for invalid data
5. **No state**: Stateless component, no useState/useEffect overhead

## File Dependencies

```
NutrientEducationSection.tsx
    │
    ├─ React (external)
    ├─ lucide-react (BarChart2) (external)
    │
    └─ Types (internal)
        ├─ NutrientInfo
        └─ NutrientEducationSectionProps
```

## Testing Structure

```
NutrientEducationSection.test.tsx
│
├─ Rendering Tests
│  ├─ Korean default
│  ├─ English explicit
│  ├─ Icon display
│  ├─ All bullets
│  ├─ Children
│  └─ Custom className
│
├─ Accessibility Tests
│  ├─ ARIA attributes
│  └─ Icon hidden from SR
│
├─ Edge Cases
│  ├─ Empty bullets
│  ├─ Missing language
│  └─ Single bullet
│
├─ Dark Mode Tests
│  ├─ Icon classes
│  ├─ Title classes
│  └─ Bullet classes
│
└─ Performance Tests
   └─ Memoization
```

## Directory Structure

```
diet-care/
├── NutrientEducationSection.tsx          # Main component
├── NutrientEducationSection.example.tsx  # Usage examples
├── NutrientEducationSection.md           # Documentation
├── INTEGRATION_GUIDE.md                  # Integration guide
├── COMPONENT_STRUCTURE.md                # This file
├── index.ts                              # Exports
└── __tests__/
    └── NutrientEducationSection.test.tsx # Tests
```

## Summary

The NutrientEducationSection is a well-structured, accessible, and performant React component that:

- Uses semantic HTML for proper document structure
- Implements ARIA attributes for screen reader support
- Applies Tailwind CSS for responsive, dark-mode styling
- Optimized with React.memo for performance
- Validates input data and handles edge cases
- Fully type-safe with TypeScript
- Extensible via children prop
- Thoroughly tested with 11+ test cases

Ready for production use in the CareGuide CKD patient platform.
