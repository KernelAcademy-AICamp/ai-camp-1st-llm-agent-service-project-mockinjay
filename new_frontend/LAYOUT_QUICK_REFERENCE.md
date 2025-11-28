# Layout System - Quick Reference

Quick cheat sheet for using the CareGuide layout system.

## Import

```tsx
import {
  PageContainer,
  PageSection,
  GridLayout,
  TwoColumnLayout
} from '@/components/layout';
```

---

## PageContainer

Standard page wrapper with responsive padding and max-width.

```tsx
// Standard page (1024px max)
<PageContainer>
  <YourContent />
</PageContainer>

// Narrow form (640px max)
<PageContainer maxWidth="sm">
  <LoginForm />
</PageContainer>

// Wide dashboard (1280px max)
<PageContainer maxWidth="xl">
  <Dashboard />
</PageContainer>

// Full width chart
<PageContainer maxWidth="full" noPadding>
  <FullWidthChart />
</PageContainer>
```

**Max Width Options:**
- `sm` = 640px (forms)
- `md` = 768px (articles)
- `lg` = 1024px (default, most pages)
- `xl` = 1280px (dashboards)
- `2xl` = 1536px (admin)
- `full` = no max-width

---

## PageSection

Section divider with optional title and consistent spacing.

```tsx
// Basic section
<PageSection title="Recent Posts">
  <PostList />
</PageSection>

// With subtitle and action
<PageSection
  title="Community"
  subtitle="Share and discuss"
  spacing="lg"
  action={<Button>New Post</Button>}
>
  <Posts />
</PageSection>
```

**Spacing Options:**
- `sm` = 16px
- `md` = 24px (default)
- `lg` = 32px
- `xl` = 48px

---

## GridLayout

Responsive grid for cards.

```tsx
// Auto: 1 col mobile, 2 tablet, 3 desktop
<GridLayout>
  <Card />
  <Card />
  <Card />
</GridLayout>

// Custom columns
<GridLayout columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="lg">
  <Card />
</GridLayout>
```

**Gap Options:**
- `sm` = 12px
- `md` = 16px (default)
- `lg` = 24px
- `xl` = 32px

---

## TwoColumnLayout

Sidebar + content layout.

```tsx
// 25% sidebar, 75% content
<TwoColumnLayout
  left={<Sidebar />}
  right={<Content />}
  leftWidth="1/4"
  stickyLeft
/>

// 50/50 split
<TwoColumnLayout
  left={<Editor />}
  right={<Preview />}
  leftWidth="1/2"
  reverseOnMobile
/>
```

**Width Options:**
- `1/4` = 25% left, 75% right
- `1/3` = 33% left, 67% right (default)
- `1/2` = 50% left, 50% right
- `2/3` = 67% left, 33% right

---

## Common Patterns

### Standard Page
```tsx
<PageContainer>
  <PageSection title="Page Title" spacing="lg">
    <Content />
  </PageSection>
</PageContainer>
```

### Card Grid Page
```tsx
<PageContainer maxWidth="xl">
  <PageSection title="Products">
    <GridLayout columns={{ xs: 1, sm: 2, lg: 3 }}>
      {products.map(p => <Card key={p.id} {...p} />)}
    </GridLayout>
  </PageSection>
</PageContainer>
```

### Form Page
```tsx
<PageContainer maxWidth="sm">
  <div className="min-h-screen flex items-center justify-center">
    <LoginForm />
  </div>
</PageContainer>
```

### Dashboard
```tsx
<PageContainer maxWidth="2xl">
  <TwoColumnLayout
    left={<Filters />}
    right={
      <>
        <Charts />
        <GridLayout columns={{ xs: 1, md: 2, xl: 3 }}>
          <StatCard />
        </GridLayout>
      </>
    }
    leftWidth="1/4"
    stickyLeft
  />
</PageContainer>
```

---

## Responsive Breakpoints

```
xs:  475px  (large phones landscape)
sm:  640px  (small tablets)
md:  768px  (tablets)
lg:  1024px (desktops) ← MAIN BREAKPOINT
xl:  1280px (large desktops)
2xl: 1536px (extra large)
```

---

## Spacing Scale

```
p-4  = 16px  (mobile)
p-6  = 24px  (tablet)
p-8  = 32px  (desktop)

gap-3 = 12px (tight)
gap-4 = 16px (standard)
gap-6 = 24px (loose)
gap-8 = 32px (very loose)
```

---

## Touch Targets

Minimum size for elderly users: **48x48px**

```tsx
// ✅ Good
<button className="min-h-[48px] px-4 py-3">

// ❌ Too small
<button className="px-2 py-1">
```

---

## Accessibility

Always include:

```tsx
// Navigation
<nav aria-label="Main navigation">

// Active state
<Link aria-current={isActive ? 'page' : undefined}>

// Icons (decorative)
<Icon aria-hidden="true" />

// Icon-only buttons
<button aria-label="Close">
  <X />
</button>

// Focus indicators
className="focus:outline-none focus:ring-2 focus:ring-primary-500"
```

---

## Mobile-First CSS

Always start with mobile, then enhance:

```tsx
// ✅ Correct
className="px-4 sm:px-6 lg:px-8"

// ❌ Wrong
className="px-8 lg:px-4"
```

---

For full documentation, see [LAYOUT_SYSTEM.md](./LAYOUT_SYSTEM.md)
