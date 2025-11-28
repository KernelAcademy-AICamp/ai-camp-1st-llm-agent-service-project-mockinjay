# CareGuide Layout System

Complete guide to the layout architecture for the CareGuide application, optimized for CKD patients with focus on accessibility, mobile-first design, and clear navigation.

## Table of Contents

1. [Layout Architecture](#layout-architecture)
2. [Responsive Strategy](#responsive-strategy)
3. [Layout Components](#layout-components)
4. [Spacing System](#spacing-system)
5. [Accessibility Guidelines](#accessibility-guidelines)
6. [Usage Examples](#usage-examples)

---

## Layout Architecture

### Overall Structure

```
┌─────────────────────────────────────────────────────┐
│  Desktop Layout (>= 1024px)                         │
├─────────────┬───────────────────────────────────────┤
│   Sidebar   │  Header (fixed, 64px height)          │
│   (280px)   ├───────────────────────────────────────┤
│   Fixed     │  Main Content Area                    │
│             │  - Responsive padding                 │
│             │  - Max-width containers               │
│             │                                       │
└─────────────┴───────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Mobile Layout (< 1024px)                           │
├─────────────────────────────────────────────────────┤
│  Main Content Area (full width)                     │
│  - Responsive padding                               │
│  - Bottom navigation clearance                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Mobile Bottom Navigation (fixed, 72px height)      │
│  - 5 navigation items                               │
│  - 56x56px minimum touch targets                    │
└─────────────────────────────────────────────────────┘
```

### Key Measurements

**Desktop:**
- Sidebar width: 280px (fixed)
- Header height: 64px (fixed)
- Main content: `calc(100vw - 280px)`
- Content padding: 32px horizontal, 24px vertical

**Mobile:**
- Bottom nav height: 72px (fixed, includes safe area)
- Content padding: 16px horizontal, 16px vertical
- Touch target minimum: 44x44px (implemented as 56x56px with padding)

---

## Responsive Strategy

### Breakpoints

```javascript
// Tailwind breakpoints (mobile-first)
'xs': '475px',   // Extra small devices (large phones landscape)
'sm': '640px',   // Small devices (landscape phones, small tablets)
'md': '768px',   // Medium devices (tablets)
'lg': '1024px',  // Large devices (desktops) - MAIN BREAKPOINT
'xl': '1280px',  // Extra large devices (large desktops)
'2xl': '1536px', // 2X Extra large devices
```

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
// ✅ CORRECT - Mobile first
<div className="px-4 sm:px-6 lg:px-8">

// ❌ WRONG - Desktop first
<div className="px-8 lg:px-4">
```

### Content Width Strategy

Different page types need different max-widths:

| Page Type | Max Width | Use Case |
|-----------|-----------|----------|
| `sm` (640px) | Forms, single-column content | Login, Signup, Forms |
| `md` (768px) | Reading content | Articles, Documentation |
| `lg` (1024px) | Standard pages | Chat, Community, Most pages |
| `xl` (1280px) | Dashboards | Trends, Analytics |
| `2xl` (1536px) | Wide layouts | Admin panels |
| `full` | No constraint | Full-width charts, tables |

---

## Layout Components

### 1. PageContainer

Standard container for all page content with responsive padding and max-width.

**Props:**
```typescript
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'; // default: 'lg'
  noPadding?: boolean; // default: false
  className?: string;
}
```

**Usage:**
```tsx
import { PageContainer } from '@/components/layout';

// Standard page
<PageContainer>
  <YourPageContent />
</PageContainer>

// Form page (narrower)
<PageContainer maxWidth="sm">
  <LoginForm />
</PageContainer>

// Dashboard (wider)
<PageContainer maxWidth="xl">
  <TrendsDashboard />
</PageContainer>

// Full width (no constraint)
<PageContainer maxWidth="full" noPadding>
  <FullWidthChart />
</PageContainer>
```

**Responsive Padding:**
- Mobile: 16px horizontal
- Tablet (sm): 24px horizontal
- Desktop (lg): 32px horizontal

---

### 2. PageSection

Reusable section component with consistent vertical spacing and optional title.

**Props:**
```typescript
interface PageSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl'; // default: 'md'
  className?: string;
  action?: React.ReactNode;
}
```

**Usage:**
```tsx
import { PageSection } from '@/components/layout';

<PageSection
  title="Recent Posts"
  subtitle="Check out the latest community discussions"
  spacing="lg"
  action={<Button>View All</Button>}
>
  <PostList />
</PageSection>
```

**Spacing Values:**
- `sm`: 16px margin bottom
- `md`: 24px margin bottom (default)
- `lg`: 32px margin bottom
- `xl`: 48px margin bottom

---

### 3. GridLayout

Responsive grid system for card layouts with automatic column adjustment.

**Props:**
```typescript
interface GridLayoutProps {
  children: React.ReactNode;
  columns?: {
    xs?: 1 | 2;
    sm?: 1 | 2 | 3;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl'; // default: 'md'
  className?: string;
}
```

**Usage:**
```tsx
import { GridLayout } from '@/components/layout';

// Default: 1 col mobile, 2 col tablet, 3 col desktop
<GridLayout>
  <Card />
  <Card />
  <Card />
</GridLayout>

// Custom columns
<GridLayout columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="lg">
  <ProductCard />
  <ProductCard />
  <ProductCard />
  <ProductCard />
</GridLayout>
```

**Gap Values:**
- `sm`: 12px
- `md`: 16px (default)
- `lg`: 24px
- `xl`: 32px

---

### 4. TwoColumnLayout

Standard two-column layout with responsive stacking.

**Props:**
```typescript
interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: '1/4' | '1/3' | '1/2' | '2/3'; // default: '1/3'
  gap?: 'sm' | 'md' | 'lg' | 'xl'; // default: 'md'
  reverseOnMobile?: boolean; // default: false
  breakpoint?: 'md' | 'lg'; // default: 'lg'
  stickyLeft?: boolean; // default: false
  className?: string;
}
```

**Usage:**
```tsx
import { TwoColumnLayout } from '@/components/layout';

// Sidebar + Main content
<TwoColumnLayout
  left={<FilterSidebar />}
  right={<PostList />}
  leftWidth="1/4"
  stickyLeft
/>

// Form + Preview (reverse on mobile to show preview first)
<TwoColumnLayout
  left={<MarkdownEditor />}
  right={<Preview />}
  leftWidth="1/2"
  reverseOnMobile
/>
```

---

## Spacing System

### Spacing Scale

Use Tailwind's spacing scale for consistency:

```css
4px   = 1    (p-1, m-1)
8px   = 2    (p-2, m-2)
12px  = 3    (p-3, m-3)
16px  = 4    (p-4, m-4) ← Mobile padding
20px  = 5    (p-5, m-5)
24px  = 6    (p-6, m-6) ← Tablet padding
32px  = 8    (p-8, m-8) ← Desktop padding
48px  = 12   (p-12, m-12)
```

### Component Spacing Patterns

**Card Spacing:**
```tsx
// Mobile
<div className="p-4 sm:p-5 lg:p-6">

// Tight spacing
<div className="p-3 sm:p-4 lg:p-5">
```

**Section Spacing:**
```tsx
// Between major sections
<section className="mb-6 sm:mb-8 lg:mb-12">

// Between related items
<div className="mb-4 sm:mb-5 lg:mb-6">
```

**Stack Spacing (vertical):**
```tsx
// Tight stack
<div className="space-y-2">

// Standard stack
<div className="space-y-4">

// Loose stack
<div className="space-y-6">
```

---

## Accessibility Guidelines

### Touch Targets

**Minimum Size:** 44x44px (WCAG AAA standard)
**Implemented:** 56x56px (including padding) for elderly users

```tsx
// ✅ CORRECT - Adequate touch target
<button className="min-h-[48px] px-4 py-3">

// ❌ WRONG - Too small
<button className="px-2 py-1">
```

### Navigation Improvements

**Sidebar:**
- Minimum 48px height for all nav items
- Clear focus indicators (2px ring)
- ARIA labels for screen readers
- Semantic HTML (`<nav>`, `<ul>`, `<li>`)

**Mobile Bottom Nav:**
- 72px total height (includes safe area)
- 56x56px minimum touch targets
- Active state indication with `aria-current="page"`
- Clear visual feedback on tap (`active:bg-gray-50`)

### ARIA Attributes

Always include proper ARIA attributes:

```tsx
// Navigation
<nav aria-label="주요 네비게이션">
  <Link aria-current={isActive ? 'page' : undefined}>

// Icons (decorative)
<Icon aria-hidden="true" />

// Buttons with icon only
<button aria-label="로그아웃">
  <LogOut />
</button>
```

### Focus Management

All interactive elements must have visible focus indicators:

```tsx
// Standard focus ring
className="focus:outline-none focus:ring-2 focus:ring-primary-500"

// Inset focus ring (for tight spaces)
className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
```

---

## Usage Examples

### Example 1: Community Page with Cards

```tsx
import { PageContainer, PageSection, GridLayout } from '@/components/layout';

export const CommunityPage = () => {
  return (
    <PageContainer maxWidth="xl">
      {/* Hero Section */}
      <PageSection
        title="커뮤니티"
        subtitle="신장 질환 환우들과 소통하고 정보를 나누세요"
        spacing="lg"
        action={<Button>새 글 작성</Button>}
      />

      {/* Featured Posts */}
      <PageSection title="인기 게시글" spacing="md">
        <GridLayout columns={{ xs: 1, md: 2, lg: 3 }} gap="lg">
          {featuredPosts.map(post => (
            <FeaturedCard key={post.id} {...post} />
          ))}
        </GridLayout>
      </PageSection>

      {/* Recent Posts */}
      <PageSection title="최근 게시글" spacing="md">
        <PostList />
      </PageSection>
    </PageContainer>
  );
};
```

### Example 2: Form Page (Login/Signup)

```tsx
import { PageContainer } from '@/components/layout';

export const LoginPage = () => {
  return (
    <PageContainer maxWidth="sm">
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">
            로그인
          </h1>
          <LoginForm />
        </div>
      </div>
    </PageContainer>
  );
};
```

### Example 3: Dashboard with Sidebar Filter

```tsx
import { PageContainer, TwoColumnLayout, GridLayout } from '@/components/layout';

export const TrendsPage = () => {
  return (
    <PageContainer maxWidth="2xl">
      <TwoColumnLayout
        left={
          <div className="space-y-4">
            <FilterPanel />
            <DateRangePicker />
          </div>
        }
        right={
          <>
            <ChartSection />
            <GridLayout columns={{ xs: 1, md: 2, xl: 3 }} gap="lg">
              <StatCard />
              <StatCard />
              <StatCard />
            </GridLayout>
          </>
        }
        leftWidth="1/4"
        stickyLeft
      />
    </PageContainer>
  );
};
```

### Example 4: Chat Page (Full Width)

```tsx
import { PageContainer } from '@/components/layout';

export const ChatPage = () => {
  return (
    <PageContainer maxWidth="full" noPadding>
      {/* Chat uses its own internal padding for full control */}
      <div className="flex h-[calc(100vh-64px)]">
        <ChatSidebar />
        <ChatMain />
      </div>
    </PageContainer>
  );
};
```

---

## Best Practices

### 1. Consistent Spacing

Use the provided spacing system consistently:
- Mobile: 16px padding (p-4)
- Tablet: 24px padding (sm:p-6)
- Desktop: 32px padding (lg:p-8)

### 2. Max Width for Readability

Never let text lines exceed 75-100 characters. Use appropriate max-width:
- Articles/reading: `max-w-3xl` (768px)
- Standard pages: `max-w-5xl` (1024px)
- Wide dashboards: `max-w-7xl` (1280px)

### 3. Touch-Friendly Buttons

Always ensure minimum 44x44px touch targets:
```tsx
// ✅ Good
<button className="min-h-[44px] px-4">

// ✅ Better (for elderly users)
<button className="min-h-[48px] px-4 py-3">
```

### 4. Clear Visual Hierarchy

Use spacing to create clear content hierarchy:
```tsx
<div className="space-y-8">       {/* Major sections */}
  <section className="space-y-4"> {/* Section content */}
    <div className="space-y-2">   {/* Related items */}
      <p>Item 1</p>
      <p>Item 2</p>
    </div>
  </section>
</div>
```

### 5. Responsive Images

Always make images responsive:
```tsx
<img
  src={imageSrc}
  alt="Description"
  className="w-full h-auto object-cover rounded-lg"
/>
```

### 6. Grid Gap Consistency

Match grid gaps with your spacing system:
- Tight grids: `gap-3` (12px)
- Standard grids: `gap-4` (16px)
- Loose grids: `gap-6` (24px)
- Very loose: `gap-8` (32px)

---

## Migration Guide

### Before (Old Pattern)

```tsx
// Direct implementation in each page
export const OldCommunityPage = () => {
  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <h1>Community</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card />
        </div>
      </div>
    </div>
  );
};
```

### After (New Pattern)

```tsx
// Using layout components
import { PageContainer, PageSection, GridLayout } from '@/components/layout';

export const NewCommunityPage = () => {
  return (
    <PageContainer maxWidth="xl">
      <PageSection title="Community">
        <GridLayout columns={{ xs: 1, md: 3 }}>
          <Card />
        </GridLayout>
      </PageSection>
    </PageContainer>
  );
};
```

### Benefits

1. **Consistency**: All pages use the same spacing system
2. **Maintainability**: Change layout in one place
3. **Accessibility**: Built-in ARIA and focus management
4. **Responsive**: Mobile-first by default
5. **Readability**: Self-documenting code

---

## Support

For questions or issues with the layout system:
1. Check this documentation
2. Review example implementations in `/src/pages`
3. Consult with the design team
4. Create an issue in the project repository

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
**Maintained by:** CareGuide Frontend Team
