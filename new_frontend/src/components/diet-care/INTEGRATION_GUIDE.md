# NutrientEducationSection Integration Guide

## Quick Start

### 1. Import the Component

```tsx
import { NutrientEducationSection, NutrientInfo } from '@/components/diet-care';
```

### 2. Define Your Nutrient Data

```tsx
const potassiumData: NutrientInfo = {
  id: 'potassium',
  nameKo: '칼륨',
  nameEn: 'Potassium',
  bulletPoints: {
    ko: [
      '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
      '신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다',
      '고칼륨혈증은 심장 리듬에 영향을 줄 수 있습니다'
    ],
    en: [
      'Potassium is a crucial mineral for nerve and muscle function',
      'When kidney function declines, potassium can accumulate in the body',
      'Hyperkalemia can affect heart rhythm'
    ]
  }
};
```

### 3. Use in Your Component

```tsx
function DietCarePage() {
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  return (
    <div className="container mx-auto px-4 py-8">
      <NutrientEducationSection
        nutrient={potassiumData}
        language={language}
      />
    </div>
  );
}
```

## Integration with Existing DietCarePage

### Step 1: Update DietCarePage.tsx

Replace the existing hardcoded nutrient sections with the component:

**Before:**
```tsx
// frontend/src/pages/DietCarePage.tsx (lines 89-100)
<section>
  <div className="flex items-center gap-2 mb-4">
    <BarChart2 className="text-[#1F2937]" size={24} />
    <h3 className="text-lg font-bold text-[#1F2937]">칼륨 (Potassium)</h3>
  </div>
  <div className="text-sm text-[#4B5563] space-y-2 mb-6 pl-1">
    <p>• 칼륨은 신경과 근육 기능에 중요한 미네랄입니다</p>
    ...
  </div>
</section>
```

**After:**
```tsx
import { NutrientEducationSection, NutrientInfo } from '@/components/diet-care';

// Define nutrient data at the top of the file
const NUTRIENTS: NutrientInfo[] = [
  {
    id: 'potassium',
    nameKo: '칼륨',
    nameEn: 'Potassium',
    bulletPoints: {
      ko: [
        '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
        '신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다',
        '고칼륨혈증은 심장 리듬에 영향을 줄 수 있습니다',
        '만성 콩팥병 환자는 칼륨 섭취를 제한해야 합니다'
      ],
      en: [
        'Potassium is a crucial mineral for nerve and muscle function',
        'When kidney function declines, potassium can accumulate in the body',
        'Hyperkalemia can affect heart rhythm',
        'CKD patients need to limit potassium intake'
      ]
    }
  },
  {
    id: 'phosphorus',
    nameKo: '인',
    nameEn: 'Phosphorus',
    bulletPoints: {
      ko: [
        '인은 뼈와 치아 건강에 필수적인 미네랄입니다',
        '신장이 약해지면 인이 배출되지 않고 체내에 쌓입니다',
        '고인산혈증은 뼈를 약하게 만들고 혈관 석회화를 유발합니다'
      ],
      en: [
        'Phosphorus is essential for bone and teeth health',
        'When kidneys weaken, phosphorus is not excreted and accumulates',
        'Hyperphosphatemia weakens bones and causes vascular calcification'
      ]
    }
  }
];

// In your component JSX
function DietCarePage() {
  return (
    <div className="space-y-8">
      {NUTRIENTS.map((nutrient) => (
        <NutrientEducationSection
          key={nutrient.id}
          nutrient={nutrient}
          language="ko"
        />
      ))}
    </div>
  );
}
```

### Step 2: Add Safe/Warning Food Cards

Integrate with existing FoodInfoCard components:

```tsx
import {
  NutrientEducationSection,
  SafeFoodCard,
  WarningFoodCard
} from '@/components/diet-care';

<NutrientEducationSection
  nutrient={potassiumData}
  language="ko"
>
  <SafeFoodCard
    title="안전한 음식"
    foods={[
      { nameKo: '쌀', nameEn: 'Rice', amount: '적당량' },
      { nameKo: '사과', nameEn: 'Apple', amount: '1개' }
    ]}
  />

  <WarningFoodCard
    title="주의 음식"
    foods={[
      { nameKo: '바나나', nameEn: 'Banana', amount: '제한' },
      { nameKo: '오렌지', nameEn: 'Orange', amount: '제한' }
    ]}
  />
</NutrientEducationSection>
```

## API Integration

### Fetching Nutrient Data from Backend

```tsx
import { useEffect, useState } from 'react';
import { NutrientEducationSection, NutrientInfo } from '@/components/diet-care';
import { api } from '@/services/api';

function DietCarePage() {
  const [nutrients, setNutrients] = useState<NutrientInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await api.get('/api/nutrition/nutrients');
        setNutrients(response.data);
      } catch (error) {
        console.error('Failed to fetch nutrients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNutrients();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {nutrients.map((nutrient) => (
        <NutrientEducationSection
          key={nutrient.id}
          nutrient={nutrient}
          language="ko"
        />
      ))}
    </div>
  );
}
```

### Backend API Response Format

Your backend should return data in this format:

```json
{
  "success": true,
  "data": [
    {
      "id": "potassium",
      "nameKo": "칼륨",
      "nameEn": "Potassium",
      "bulletPoints": {
        "ko": [
          "칼륨은 신경과 근육 기능에 중요한 미네랄입니다",
          "신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다"
        ],
        "en": [
          "Potassium is a crucial mineral for nerve and muscle function",
          "When kidney function declines, potassium can accumulate in the body"
        ]
      }
    }
  ]
}
```

## State Management Integration

### Using Context API

```tsx
// contexts/LanguageContext.tsx
import { createContext, useContext, useState } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko');

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
```

```tsx
// In your component
import { useLanguage } from '@/contexts/LanguageContext';

function DietCarePage() {
  const { language } = useLanguage();

  return (
    <NutrientEducationSection
      nutrient={nutrientData}
      language={language}
    />
  );
}
```

## Responsive Design

The component is mobile-first and fully responsive. Add container classes for optimal display:

```tsx
// Mobile: Full width with padding
// Tablet: Max width container
// Desktop: Centered with max width

<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="max-w-4xl mx-auto space-y-8">
    <NutrientEducationSection
      nutrient={nutrientData}
      language="ko"
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
    />
  </div>
</div>
```

## Animation and Transitions

Add smooth transitions for better UX:

```tsx
import { motion } from 'framer-motion';

function AnimatedNutrientSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <NutrientEducationSection
        nutrient={nutrientData}
        language="ko"
      />
    </motion.div>
  );
}
```

## Error Handling

```tsx
function DietCarePage() {
  const [nutrients, setNutrients] = useState<NutrientInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await api.get('/api/nutrition/nutrients');

        // Validate data structure
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid data format');
        }

        setNutrients(response.data);
      } catch (err) {
        setError('영양소 정보를 불러올 수 없습니다.');
        console.error('Failed to fetch nutrients:', err);
      }
    };

    fetchNutrients();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p className="text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {nutrients.map((nutrient) => (
        <NutrientEducationSection
          key={nutrient.id}
          nutrient={nutrient}
          language="ko"
        />
      ))}
    </div>
  );
}
```

## Testing Integration

### Component Testing

```tsx
// __tests__/DietCarePage.test.tsx
import { render, screen } from '@testing-library/react';
import DietCarePage from '../DietCarePage';

jest.mock('@/components/diet-care', () => ({
  NutrientEducationSection: ({ nutrient }: any) => (
    <div data-testid={`nutrient-${nutrient.id}`}>
      {nutrient.nameKo}
    </div>
  )
}));

describe('DietCarePage', () => {
  it('should render all nutrient sections', () => {
    render(<DietCarePage />);

    expect(screen.getByTestId('nutrient-potassium')).toBeInTheDocument();
    expect(screen.getByTestId('nutrient-phosphorus')).toBeInTheDocument();
  });
});
```

### E2E Testing

```typescript
// e2e/diet-care.spec.ts
import { test, expect } from '@playwright/test';

test('displays nutrient education sections', async ({ page }) => {
  await page.goto('/diet-care');

  // Check potassium section
  await expect(page.getByRole('heading', { name: /칼륨/i })).toBeVisible();
  await expect(page.getByText(/신경과 근육 기능/)).toBeVisible();

  // Check phosphorus section
  await expect(page.getByRole('heading', { name: /인/i })).toBeVisible();
});

test('supports language switching', async ({ page }) => {
  await page.goto('/diet-care');

  // Switch to English
  await page.click('[data-testid="language-toggle"]');

  await expect(page.getByText(/Potassium is a crucial mineral/)).toBeVisible();
});
```

## Migration Checklist

- [ ] Install `lucide-react` dependency
- [ ] Import `NutrientEducationSection` and `NutrientInfo` types
- [ ] Create nutrient data constants
- [ ] Replace hardcoded sections with component
- [ ] Add language state management
- [ ] Integrate with existing FoodInfoCard components
- [ ] Update tests to cover new component
- [ ] Test responsive design on mobile/tablet/desktop
- [ ] Verify dark mode functionality
- [ ] Run accessibility audit
- [ ] Update documentation

## Performance Considerations

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const NutrientEducationSection = lazy(() =>
  import('@/components/diet-care').then(module => ({
    default: module.NutrientEducationSection
  }))
);

function DietCarePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NutrientEducationSection
        nutrient={nutrientData}
        language="ko"
      />
    </Suspense>
  );
}
```

### Memoization

```tsx
import { useMemo } from 'react';

function DietCarePage() {
  const nutrientData = useMemo(() => ({
    id: 'potassium',
    nameKo: '칼륨',
    nameEn: 'Potassium',
    bulletPoints: { /* ... */ }
  }), []); // Empty deps - data doesn't change

  return (
    <NutrientEducationSection
      nutrient={nutrientData}
      language="ko"
    />
  );
}
```

## Troubleshooting

### Common Issues

**Issue**: Component not rendering
- **Solution**: Check import path and ensure component is exported from index.ts

**Issue**: Dark mode not working
- **Solution**: Verify Tailwind config has `darkMode: 'class'` enabled

**Issue**: Language switching not working
- **Solution**: Ensure language prop is being passed and updated correctly

**Issue**: Bullet points not showing
- **Solution**: Verify bulletPoints object has data for selected language

## Support

For issues or questions:
1. Check the main documentation: `NutrientEducationSection.md`
2. Review example usage: `NutrientEducationSection.example.tsx`
3. Run tests: `npm test -- NutrientEducationSection.test.tsx`
4. Check component source: `NutrientEducationSection.tsx`

## Next Steps

After successful integration:
1. Add more nutrient types (Sodium, Calcium, Protein, etc.)
2. Implement search/filter functionality
3. Add nutrition tracking integration
4. Create personalized recommendations based on user data
5. Add interactive charts and visualizations
