# NewsFeed Component - Integration Guide

Quick reference for integrating the NewsFeed component into TrendsPageEnhanced.

## Quick Start

### 1. Import the Component

```tsx
// In TrendsPageEnhanced.tsx
import { NewsFeed } from '../components/trends';
```

### 2. Add to Your Page

```tsx
function TrendsPageEnhanced() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Existing content */}

      {/* Add News Feed Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">최신 뉴스</h2>
        <NewsFeed />
      </section>
    </div>
  );
}
```

## Integration Options

### Option A: Add as a New Tab

If you want to add news as a separate tab alongside your existing analysis tabs:

```tsx
const [activeTab, setActiveTab] = useState<'analysis' | 'news'>('analysis');

return (
  <div>
    {/* Tab Navigation */}
    <div className="flex gap-4 border-b mb-6">
      <button
        onClick={() => setActiveTab('analysis')}
        className={activeTab === 'analysis' ? 'active-tab' : 'inactive-tab'}
      >
        트렌드 분석
      </button>
      <button
        onClick={() => setActiveTab('news')}
        className={activeTab === 'news' ? 'active-tab' : 'inactive-tab'}
      >
        뉴스
      </button>
    </div>

    {/* Tab Content */}
    {activeTab === 'analysis' && (
      <div>
        {/* Your existing analysis content */}
      </div>
    )}

    {activeTab === 'news' && (
      <NewsFeed />
    )}
  </div>
);
```

### Option B: Add as a Sidebar Widget

If you want to show news alongside your main content:

```tsx
return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Content (2/3 width) */}
    <div className="lg:col-span-2">
      {/* Your existing trends analysis */}
    </div>

    {/* Sidebar (1/3 width) */}
    <div className="lg:col-span-1">
      <h3 className="text-xl font-bold mb-4">최신 뉴스</h3>
      <NewsFeed newsItems={newsItems.slice(0, 3)} />
    </div>
  </div>
);
```

### Option C: Add Below Main Content

If you want to show news at the bottom of your page:

```tsx
return (
  <div className="max-w-6xl mx-auto">
    {/* Step Indicator */}
    {renderStepIndicator()}

    {/* Main Content */}
    {step === 'results' && resultState && (
      <div className="space-y-6">
        {/* Charts and Papers */}
      </div>
    )}

    {/* News Section - Always visible */}
    <section className="mt-16 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">관련 뉴스</h2>
        <a href="/news" className="text-purple-600 hover:underline">
          더보기 →
        </a>
      </div>
      <NewsFeed />
    </section>
  </div>
);
```

## With API Integration

If you want to fetch news from an API instead of using mock data:

```tsx
import { useState, useEffect } from 'react';
import { NewsFeed, type NewsItem } from '../components/trends';

function TrendsPageEnhanced() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const response = await fetch('/api/news');
        const data = await response.json();
        setNews(data.items);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div>
      {newsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </div>
      ) : (
        <NewsFeed newsItems={news} />
      )}
    </div>
  );
}
```

## Styling Customization

### Add Custom Spacing

```tsx
<NewsFeed className="space-y-6" />
```

### Limit Number of Items

```tsx
const topNews = MOCK_NEWS_ITEMS.slice(0, 5);
<NewsFeed newsItems={topNews} />
```

### Wrap in a Card

```tsx
<div className="bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-xl font-bold mb-4">최신 뉴스</h3>
  <NewsFeed />
</div>
```

## File Locations

- **Component**: `/new_frontend/src/components/trends/NewsFeed.tsx`
- **Tests**: `/new_frontend/src/components/trends/__tests__/NewsFeed.test.tsx`
- **Types**: Exported from component file
- **Index**: Already added to `/new_frontend/src/components/trends/index.ts`

## Import Paths

```tsx
// Named import
import { NewsFeed } from '../components/trends';

// With type
import { NewsFeed, type NewsItem } from '../components/trends';

// Default import (if needed)
import NewsFeed from '../components/trends/NewsFeed';
```

## Props Reference

```tsx
interface NewsFeedProps {
  newsItems?: NewsItem[];  // Optional, uses mock data by default
  className?: string;       // Optional, for custom styling
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  description: string;
  image: string;
}
```

## Testing

After integration, verify:

1. **Visual Check**
   - Component renders correctly
   - Images load properly
   - Layout is responsive

2. **Functionality**
   - Clicking cards navigates to `/news/detail/:id`
   - Bookmark icons toggle correctly
   - Keyboard navigation works

3. **Run Tests**
   ```bash
   npm test NewsFeed.test.tsx
   ```

## Common Issues

### Import Error
```tsx
// ❌ Wrong
import NewsFeed from '@/components/trends/NewsFeed';

// ✅ Correct
import { NewsFeed } from '../components/trends';
```

### Navigation Not Working
Make sure route exists in your router:
```tsx
// In AppRoutes.tsx
<Route path="/news/detail/:id" element={<NewsDetailPage />} />
```

### Images Not Loading
The component uses `ImageWithFallback` which automatically handles broken images.

## Need Help?

- **Documentation**: See `NewsFeed.md` for full documentation
- **Examples**: See `NewsFeed.example.tsx` for usage examples
- **Tests**: See `__tests__/NewsFeed.test.tsx` for test examples

## Checklist

Before deploying:

- [ ] Component imported correctly
- [ ] Route for `/news/detail/:id` exists
- [ ] Tests passing
- [ ] Responsive on mobile and desktop
- [ ] Keyboard navigation works
- [ ] Screen reader tested (optional)
