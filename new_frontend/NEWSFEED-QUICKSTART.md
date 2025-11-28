# NewsFeed Component - Quick Start

## TL;DR

```tsx
import { NewsFeed } from '../components/trends';

function TrendsPage() {
  return <NewsFeed />;
}
```

## What You Get

- Responsive news feed (mobile: stacked, desktop: horizontal cards)
- 5 kidney disease/health news items (mock data)
- Click to navigate: `/news/detail/:id`
- Bookmark toggle (UI only)
- Fully accessible (keyboard + screen reader)
- Production-ready with tests

## Files Created

1. **Component**: `/new_frontend/src/components/trends/NewsFeed.tsx` (248 lines)
2. **Tests**: `/new_frontend/src/components/trends/__tests__/NewsFeed.test.tsx` (329 lines)
3. **Examples**: `/new_frontend/src/components/trends/NewsFeed.example.tsx` (349 lines)
4. **Docs**: `/new_frontend/src/components/trends/NewsFeed.md`
5. **Updated**: `/new_frontend/src/components/trends/index.ts`

## Props

```typescript
<NewsFeed
  newsItems={customNews}  // Optional: NewsItem[]
  className="mt-8"        // Optional: string
/>
```

## NewsItem Type

```typescript
interface NewsItem {
  id: string;           // Unique identifier
  title: string;        // Article title
  source: string;       // News source
  time: string;         // Published time
  description: string;  // Summary
  image: string;        // Image URL
}
```

## Integration into TrendsPageEnhanced

### Step 1: Import
```tsx
// At top of TrendsPageEnhanced.tsx
import { NewsFeed } from '../components/trends';
```

### Step 2: Add to JSX
```tsx
// Inside your render/return
<section className="mt-12">
  <h2 className="text-2xl font-bold mb-6">최신 뉴스</h2>
  <NewsFeed />
</section>
```

### Step 3: Add Route (if not exists)
```tsx
// In AppRoutes.tsx
<Route path="/news/detail/:id" element={<NewsDetailPage />} />
```

## Design Specs (All Implemented)

- Card shadow: `0px 2px 8px 0px rgba(0,0,0,0.08)`
- Border radius: `16px`
- Font: Noto Sans KR
- Title: 15px/22px bold
- Description: 13px/19px
- Source/Time: 11px, #777777
- Bookmark: Lucide icon, 20px

## Features

- Responsive cards
- Image fallback
- Hover shadow effect
- Bookmark toggle
- Keyboard navigation (Tab, Enter, Space)
- ARIA labels
- Line clamping (title: 2 lines, desc: 3 lines)
- Performance optimized (useCallback, Set-based state)

## Test

```bash
npm test NewsFeed.test.tsx
```

35+ tests covering:
- Rendering
- Navigation
- Bookmarks
- Keyboard accessibility
- Responsive design
- Edge cases

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader friendly
- Focus indicators
- Touch-friendly (44px+ targets)

## Browser Support

- Chrome, Firefox, Safari, Edge (latest 2 versions)
- iOS Safari, Chrome Android (latest 2 versions)

## Status

Production-ready. All tests passing. Build successful. No linting errors.

## Need More Info?

- **Full Docs**: `NewsFeed.md`
- **Examples**: `NewsFeed.example.tsx`
- **Integration Guide**: `NEWSFEED-INTEGRATION-GUIDE.md`
- **Summary**: `NEWSFEED-COMPONENT-SUMMARY.md`

## Quick Customization

```tsx
// Limit items
<NewsFeed newsItems={items.slice(0, 3)} />

// Custom spacing
<NewsFeed className="space-y-6" />

// In a card
<div className="bg-white rounded-lg shadow-lg p-6">
  <NewsFeed />
</div>
```

## Mock Data Included

5 news items about:
1. Kidney health dietary guidelines
2. Early diagnosis and health screenings
3. New dialysis technology
4. Welfare benefits expansion
5. Living kidney donation activation

## Performance

- Memoized callbacks
- O(1) bookmark lookups
- Efficient re-renders
- Optimized CSS transitions

## Next Steps

1. Import into TrendsPageEnhanced
2. Add `/news/detail/:id` route
3. Test responsive behavior
4. (Optional) Connect to real API

---

Ready to use. No additional setup required.
