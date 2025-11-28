# ClinicalTrialsTab Component

## Overview

The `ClinicalTrialsTab` component is a production-ready, fully-featured tab component for displaying clinical trials with pagination, loading states, error handling, and comprehensive accessibility support.

## Features

- **Loading State**: Animated spinner with descriptive text during data fetching
- **Clinical Trials List**: Displays trial information using the `ClinicalTrialCard` component
- **Smart Pagination**: Intelligent page number display with ellipsis logic
- **Error Handling**: Graceful error display with retry functionality
- **Empty State**: User-friendly message when no trials are available
- **Accessibility**: Full ARIA support, keyboard navigation, and screen reader compatibility
- **Performance**: Memoized callbacks and optimized re-renders
- **Responsive Design**: Mobile-first design with Tailwind CSS

## File Location

```
/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/components/trends/ClinicalTrialsTab.tsx
```

## Component Interface

### Props

```typescript
interface ClinicalTrialsTabProps {
  onTrialClick?: (nctId: string) => void;
}
```

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onTrialClick` | `(nctId: string) => void` | No | `undefined` | Callback function invoked when a trial card is clicked |

### State Management

```typescript
// Clinical trials data
const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]);

// Loading state
const [loadingTrials, setLoadingTrials] = useState<boolean>(false);

// Pagination state
const [currentPage, setCurrentPage] = useState<number>(1);
const [totalPages, setTotalPages] = useState<number>(1);

// Error state
const [error, setError] = useState<string | null>(null);
```

## Usage Example

### Basic Usage

```tsx
import ClinicalTrialsTab from '@/components/trends/ClinicalTrialsTab';

function TrendsPage() {
  return (
    <div className="container mx-auto p-6">
      <ClinicalTrialsTab />
    </div>
  );
}
```

### With Click Handler

```tsx
import ClinicalTrialsTab from '@/components/trends/ClinicalTrialsTab';
import { useState } from 'react';

function TrendsPage() {
  const [selectedTrialId, setSelectedTrialId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTrialClick = (nctId: string) => {
    setSelectedTrialId(nctId);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <ClinicalTrialsTab onTrialClick={handleTrialClick} />

      {isModalOpen && (
        <ClinicalTrialDetailModal
          nctId={selectedTrialId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
```

## API Integration

### Endpoint

```
POST /api/clinical-trials/list
```

### Request Body

```typescript
{
  condition: 'kidney',
  page: number,
  page_size: 10
}
```

### Response Format

```typescript
interface ClinicalTrialsResponse {
  trials: ClinicalTrial[];
  totalPages: number;
  currentPage: number;
  totalTrials?: number;
}

interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  startDate?: string;
  completionDate?: string;
  sponsor?: string;
  briefSummary?: string;
}
```

### Fetch Function

```typescript
const fetchClinicalTrials = async (page: number) => {
  setLoadingTrials(true);
  setError(null);

  try {
    const response = await fetch('/api/clinical-trials/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        condition: 'kidney',
        page: page,
        page_size: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clinical trials: ${response.statusText}`);
    }

    const data: ClinicalTrialsResponse = await response.json();
    setClinicalTrials(data.trials || []);
    setTotalPages(data.totalPages || 1);
    setCurrentPage(page);
  } catch (error) {
    console.error('Error fetching clinical trials:', error);
    setError(error instanceof Error ? error.message : 'Failed to load clinical trials');
    setClinicalTrials([]);
  } finally {
    setLoadingTrials(false);
  }
};
```

## Pagination Logic

### Smart Page Number Display

The component implements intelligent pagination that shows a maximum of 5 page numbers:

```typescript
const getPageNumbers = (): number[] => {
  if (totalPages <= 5) {
    // Show all pages if total is 5 or less
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    // Show first 5 pages (e.g., [1, 2, 3, 4, 5])
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= totalPages - 2) {
    // Show last 5 pages (e.g., [6, 7, 8, 9, 10] if totalPages = 10)
    return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
  }

  // Show current page with 2 pages on each side (e.g., [3, 4, 5, 6, 7] if currentPage = 5)
  return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
};
```

### Examples

- **Total Pages ≤ 5**: Show all pages
  - `[1, 2, 3, 4, 5]` if totalPages = 5

- **Current Page ≤ 3**: Show first 5 pages
  - `[1, 2, 3, 4, 5]` if currentPage = 1, 2, or 3

- **Current Page ≥ totalPages - 2**: Show last 5 pages
  - `[6, 7, 8, 9, 10]` if currentPage = 8, 9, or 10 and totalPages = 10

- **Otherwise**: Show current ± 2 pages
  - `[3, 4, 5, 6, 7]` if currentPage = 5

## Styling Guidelines

### Color Palette

| Element | Style | Value |
|---------|-------|-------|
| Primary Color | Background | `#00C9B7` |
| Text Primary | Color | `#1F2937` |
| Text Secondary | Color | `#272727` |
| Text Muted | Color | `#9CA3AF` |
| Text Error | Color | `#EF4444` |

### Info Banner

```css
background: linear-gradient(135deg, #EFF6FF 0%, #F9FAFB 100%);
border: 1px solid #E0F2FE;
border-radius: 16px;
padding: 16px;
```

### Pagination Buttons

#### Active Page Button
```css
background-color: #00C9B7;
color: white;
font-weight: bold;
width: 40px;
height: 40px;
border-radius: 8px;
```

#### Inactive Page Button
```css
background-color: #F3F4F6;
color: #272727;
font-weight: normal;
width: 40px;
height: 40px;
border-radius: 8px;
```

#### Prev/Next Buttons
```css
background-color: #00C9B7; /* When enabled */
background-color: #F3F4F6; /* When disabled */
color: white; /* When enabled */
color: #9CA3AF; /* When disabled */
opacity: 0.5; /* When disabled */
padding: 8px 16px;
border-radius: 8px;
```

## Accessibility Checklist

- [x] **Semantic HTML**: Uses proper heading levels and landmark regions
- [x] **ARIA Labels**: All interactive elements have descriptive ARIA labels
- [x] **ARIA Live Regions**: Loading and error states use `aria-live` for screen reader announcements
- [x] **Keyboard Navigation**: All interactive elements are keyboard accessible
- [x] **Focus Management**: Focus indicators are visible and properly styled
- [x] **Screen Reader Support**: Component provides context and state information to screen readers
- [x] **Color Contrast**: All text meets WCAG 2.1 AA standards
- [x] **Alternative Text**: All visual indicators have text alternatives

### ARIA Attributes Used

```tsx
// Info banner
<div role="region" aria-label="Clinical trials information">

// Loading state
<div role="status" aria-live="polite">

// Error state
<div role="alert" aria-live="assertive">

// Clinical trials list
<div role="list" aria-label="Clinical trials list">
  <div role="listitem">...</div>
</div>

// Pagination
<nav role="navigation" aria-label="Pagination">
  <button aria-label="Previous page" aria-disabled={currentPage === 1}>
  <button aria-label="Page 1" aria-current={currentPage === 1 ? 'page' : undefined}>
  <button aria-label="Next page" aria-disabled={currentPage === totalPages}>
</nav>
```

## Performance Considerations

### Memoization

The component uses `React.memo` and `useCallback` to optimize performance:

```typescript
// Component is memoized
const ClinicalTrialsTab: React.FC<ClinicalTrialsTabProps> = memo(({ onTrialClick }) => {
  // Callbacks are memoized
  const fetchClinicalTrials = useCallback(async (page: number) => {
    // ...
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    // ...
  }, [currentPage, totalPages, fetchClinicalTrials]);

  const handleTrialClick = useCallback((nctId: string) => {
    // ...
  }, [onTrialClick]);
});
```

### Code Splitting

The component can be lazy-loaded:

```tsx
import { lazy, Suspense } from 'react';

const ClinicalTrialsTab = lazy(() => import('@/components/trends/ClinicalTrialsTab'));

function TrendsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClinicalTrialsTab />
    </Suspense>
  );
}
```

### Scroll Optimization

Smooth scroll to top on page change:

```typescript
window.scrollTo({ top: 0, behavior: 'smooth' });
```

## Testing

### Test File Location

```
/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/components/trends/__tests__/ClinicalTrialsTab.test.tsx
```

### Test Coverage

- ✅ Initial loading state
- ✅ Successful data fetching and rendering
- ✅ Pagination functionality (all scenarios)
- ✅ Error handling and retry
- ✅ Empty state
- ✅ Trial click handler
- ✅ Accessibility features
- ✅ Performance optimizations

### Running Tests

```bash
# Run all tests
npm test

# Run tests for ClinicalTrialsTab
npm test ClinicalTrialsTab

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Deployment Checklist

### Pre-deployment

- [ ] All TypeScript types are properly defined
- [ ] Component is exported from `index.ts`
- [ ] All tests pass successfully
- [ ] No console errors or warnings
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Responsive design tested on mobile, tablet, and desktop
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] API integration tested with real backend
- [ ] Error states tested with failed API calls
- [ ] Empty states tested with no data
- [ ] Pagination tested with various page counts

### Backend Requirements

- [ ] API endpoint `/api/clinical-trials/list` is implemented
- [ ] Endpoint accepts POST requests
- [ ] Request body validation is in place
- [ ] Response format matches expected interface
- [ ] Proper error handling for invalid requests
- [ ] Rate limiting configured
- [ ] CORS headers configured correctly

### Integration Testing

- [ ] Component integrates correctly with TrendsPage
- [ ] Trial detail modal integration works
- [ ] State management with parent components
- [ ] URL query parameters (if applicable)
- [ ] Browser history navigation

### Production Monitoring

- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics events for user interactions
- [ ] Performance monitoring (loading times, API latency)
- [ ] A/B testing setup (if needed)

## Dependencies

### Required

- `react` (^18.0.0)
- `lucide-react` (for Loader2 icon)
- TypeScript (^5.0.0)
- Tailwind CSS (^3.0.0)

### Development

- `@testing-library/react` (for testing)
- `@testing-library/jest-dom` (for test matchers)
- `jest` (for test runner)

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Known Issues and Limitations

### Current Limitations

1. **Fixed Condition**: Currently hardcoded to search for 'kidney' condition
2. **Page Size**: Fixed at 10 items per page
3. **No Search**: No built-in search/filter functionality
4. **No Sorting**: Relies on backend sorting

### Future Enhancements

- [ ] Add search/filter functionality
- [ ] Add sorting options (by date, status, phase)
- [ ] Make condition and page size configurable
- [ ] Add export functionality (CSV/PDF)
- [ ] Add bookmarking/favorites feature
- [ ] Add trial comparison feature
- [ ] Implement infinite scroll as alternative to pagination

## Troubleshooting

### Common Issues

#### Issue: Trials not loading

**Solution**: Check that the API endpoint is reachable and returning the correct format.

```bash
# Test API endpoint
curl -X POST http://localhost:8000/api/clinical-trials/list \
  -H "Content-Type: application/json" \
  -d '{"condition": "kidney", "page": 1, "page_size": 10}'
```

#### Issue: Pagination not working

**Solution**: Verify that `totalPages` is correctly set in the API response.

#### Issue: Styling not applied

**Solution**: Ensure Tailwind CSS is properly configured and the font family is available.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      },
    },
  },
};
```

## Support

For issues or questions, please contact the development team or create an issue in the project repository.

## License

This component is part of the CareGuide project. All rights reserved.
