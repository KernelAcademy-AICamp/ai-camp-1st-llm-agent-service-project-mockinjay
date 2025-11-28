# ClinicalTrialCard Component

A production-ready React component for displaying clinical trial information in an accessible, visually appealing card format. Built for the CareGuide platform's TrendsPage.

## Overview

The `ClinicalTrialCard` component displays comprehensive clinical trial information including NCT ID, title, status, phase, conditions, interventions, sponsor details, and dates. It features color-coded status badges, responsive design, and full keyboard accessibility.

## Features

- **Status Badges**: Color-coded status indicators (Recruiting, Completed, Active, etc.)
- **Condition & Intervention Tags**: Display up to 3 conditions/interventions with overflow indicator
- **Responsive Design**: Mobile-first design that adapts to different screen sizes
- **Keyboard Navigation**: Full keyboard support with Enter/Space activation
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and semantic HTML
- **Performance**: Memoized component for optimal re-render prevention
- **Visual Feedback**: Hover and focus states with smooth transitions

## Installation

The component is already integrated into the project. Import it as follows:

```typescript
import ClinicalTrialCard from '@/components/trends/ClinicalTrialCard';
import type { ClinicalTrial } from '@/components/trends/ClinicalTrialCard';
```

## Usage

### Basic Example

```tsx
import ClinicalTrialCard from '@/components/trends/ClinicalTrialCard';

const trial = {
  nctId: 'NCT12345678',
  title: 'Study of Treatment for Chronic Kidney Disease',
  status: 'Recruiting',
  phase: 'Phase 3',
  conditions: ['Chronic Kidney Disease', 'Diabetes'],
  interventions: ['Drug: Experimental Treatment'],
  startDate: '2024-01-15',
  completionDate: '2026-12-31',
  sponsor: 'University Medical Center',
  briefSummary: 'This study evaluates the efficacy and safety...'
};

<ClinicalTrialCard
  trial={trial}
  onClick={() => console.log('Trial clicked:', trial.nctId)}
/>
```

### In a List with Pagination

```tsx
import ClinicalTrialCard from '@/components/trends/ClinicalTrialCard';
import { useNavigate } from 'react-router-dom';

function ClinicalTrialsTab() {
  const navigate = useNavigate();
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);

  const handleTrialClick = (nctId: string) => {
    navigate(`/trends/clinical-trial/${nctId}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {trials.map((trial) => (
        <ClinicalTrialCard
          key={trial.nctId}
          trial={trial}
          onClick={() => handleTrialClick(trial.nctId)}
        />
      ))}
    </div>
  );
}
```

## Props

### `ClinicalTrialCardProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `trial` | `ClinicalTrial` | Yes | Clinical trial data object |
| `onClick` | `() => void` | Yes | Callback function when card is clicked |

### `ClinicalTrial` Interface

```typescript
interface ClinicalTrial {
  nctId: string;              // NCT identifier (e.g., "NCT12345678")
  title: string;              // Trial title
  status: string;             // Current status (Recruiting, Completed, Active, etc.)
  phase: string;              // Trial phase (Phase 1, Phase 2, etc.)
  conditions: string[];       // Medical conditions being studied
  interventions: string[];    // Interventions being tested
  startDate?: string;         // Start date (ISO format recommended)
  completionDate?: string;    // Estimated completion date
  sponsor?: string;           // Sponsoring organization
  briefSummary?: string;      // Brief description of the trial
}
```

## Status Colors

The component applies different colors based on the trial status:

| Status | Background | Text | Border | Use Case |
|--------|------------|------|--------|----------|
| Recruiting | `#ECFDF5` | `#10B981` (green) | `#A7F3D0` | Currently enrolling participants |
| Completed | `#EFF6FF` | `#3B82F6` (blue) | `#BFDBFE` | Trial has concluded |
| Active | `#F3E8FF` | `#8B5CF6` (purple) | `#DDD6FE` | Ongoing, not recruiting |
| Active, not recruiting | `#F3E8FF` | `#8B5CF6` (purple) | `#DDD6FE` | Same as Active |
| Terminated | `#FEF2F2` | `#EF4444` (red) | `#FECACA` | Stopped early |
| Withdrawn | `#FEF2F2` | `#EF4444` (red) | `#FECACA` | Withdrawn before enrollment |
| Suspended | `#FEF3C7` | `#F59E0B` (orange) | `#FDE68A` | Temporarily halted |
| Other | `#F3F4F6` | `#6B7280` (gray) | `#E5E7EB` | Unknown or other status |

## Accessibility Features

### Keyboard Navigation
- **Tab**: Focus on the card
- **Enter**: Activate the card (calls `onClick`)
- **Space**: Activate the card (calls `onClick`)

### Screen Reader Support
- Proper ARIA labels for all interactive elements
- Semantic HTML structure
- Descriptive `aria-label` for the main card button
- Region labels for conditions and interventions sections
- Status and phase information clearly labeled

### Visual Accessibility
- Focus indicators with 2px ring in primary color (#00C9B7)
- Sufficient color contrast (WCAG AA compliant)
- Hover states for mouse users
- No reliance on color alone for information

## Styling Guidelines

### Colors
- **Primary**: `#00C9B7` (teal) - brand color for hover/focus states
- **Background**: `#FFFFFF` (white)
- **Border**: `#F3F4F6` (light gray) - default, `#00C9B7` on hover
- **Text**: `#1F2937` (dark gray) for headings, `#272727` for body

### Typography
- **Font Family**: `Noto Sans KR, sans-serif`
- **Title**: 16px, bold, line-height 24px
- **Summary**: 14px, regular, line-height 20px
- **Metadata**: 14px
- **Tags**: 12px

### Spacing
- **Card Padding**: 20px (mobile), 24px (desktop)
- **Border Radius**: 16px
- **Gap between elements**: 12px-16px

### Responsive Behavior
- Mobile (< 768px): Single column layout, full width
- Desktop (≥ 768px): Maintains aspect ratio, max-width constraints

## Performance Optimizations

1. **Memoization**: Component wrapped with `React.memo` to prevent unnecessary re-renders
2. **Efficient Rendering**: Only first 3 conditions/interventions rendered, with overflow indicator
3. **Text Truncation**: Long text truncated at 30 characters for tags
4. **Event Delegation**: Single click handler for the entire card

## Testing

### Running Tests

```bash
cd new_frontend
npm test -- ClinicalTrialCard.test.tsx
```

### Test Coverage

The test suite covers:
- ✅ All props rendering correctly
- ✅ Status badge color coding
- ✅ Condition and intervention tag display
- ✅ Date formatting
- ✅ Click and keyboard interactions
- ✅ Accessibility features
- ✅ Edge cases (missing data, long text, invalid dates)

### Example Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ClinicalTrialCard from './ClinicalTrialCard';

it('calls onClick when card is clicked', () => {
  const mockOnClick = jest.fn();
  const trial = { /* trial data */ };

  render(<ClinicalTrialCard trial={trial} onClick={mockOnClick} />);

  const card = screen.getByRole('button');
  fireEvent.click(card);

  expect(mockOnClick).toHaveBeenCalledTimes(1);
});
```

## Deployment Checklist

Before deploying this component to production:

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Accessibility audit passed (Lighthouse, axe DevTools)
- [ ] Visual regression tests completed
- [ ] Works in all target browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified on real devices
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA, JAWS, VoiceOver)
- [ ] Performance profiled (React DevTools Profiler)
- [ ] API integration verified
- [ ] Error states handled gracefully
- [ ] Loading states implemented (if applicable)

## Troubleshooting

### Issue: Status badge has wrong color
**Solution**: Check that the status string matches exactly one of the predefined statuses. The component is case-sensitive.

### Issue: Dates not displaying
**Solution**: Ensure dates are in a valid format (ISO 8601 recommended: `YYYY-MM-DD`).

### Issue: onClick not firing
**Solution**: Verify that the `onClick` prop is provided and is a function. Check browser console for errors.

### Issue: Card not focusable
**Solution**: Ensure the component is rendered in a valid DOM context and not hidden by CSS.

## API Integration

Expected API response format:

```typescript
interface ClinicalTrialsResponse {
  trials: ClinicalTrial[];
  totalPages: number;
  currentPage: number;
  totalTrials: number;
}
```

Example API call:

```typescript
const fetchClinicalTrials = async (page: number) => {
  const response = await fetch('/api/clinical-trials/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      condition: 'kidney',
      page: page,
      page_size: 10,
    }),
  });

  const data: ClinicalTrialsResponse = await response.json();
  return data;
};
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari (iOS): Latest 2 versions
- Chrome Mobile (Android): Latest 2 versions

## Contributing

When modifying this component:

1. Update the TypeScript interface if adding new props
2. Add corresponding tests for new features
3. Update this documentation
4. Run the full test suite
5. Check accessibility with automated tools
6. Verify no performance regressions

## Related Components

- `PaperCard` - Similar card component for research papers
- `FeaturedCard` - Card component for featured community posts
- `QueryBuilder` - Search query builder for trends
- `PaperList` - List view for papers

## License

This component is part of the CareGuide project. See the main project LICENSE for details.

## Support

For issues or questions:
- File an issue in the project repository
- Check the project CLAUDE.md for development guidelines
- Review the PR25-PLAN-TrendsPage.md for implementation context

---

**Last Updated**: 2025-11-27
**Version**: 1.0.0
**Author**: Claude Code (AI Frontend Developer)
