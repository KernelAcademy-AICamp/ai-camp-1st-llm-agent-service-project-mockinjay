# Layout System Documentation

Complete responsive layout system for CareGuide application.

## Table of Contents

1. [Breakpoints](#breakpoints)
2. [Shell Layout](#shell-layout)
3. [Container Components](#container-components)
4. [Grid System](#grid-system)
5. [Two-Column Layouts](#two-column-layouts)
6. [Page Sections](#page-sections)
7. [Spacing Guidelines](#spacing-guidelines)
8. [Mobile Considerations](#mobile-considerations)

---

## Breakpoints

Mobile-first breakpoints aligned with Tailwind CSS:

| Breakpoint | Min Width | Use Case |
|------------|-----------|----------|
| xs | 375px | Mobile S |
| sm | 640px | Mobile L / Small Tablet |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Desktop L |
| 2xl | 1536px | Desktop XL |

```tsx
// Access in code
import { BREAKPOINTS } from './components/layout';

// Tailwind classes
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

---

## Shell Layout

### Overall Structure

```
Desktop (lg+):
+------------------+------------------------+
|                  |       Header (64px)    |
|    Sidebar       +------------------------+
|    (280px)       |                        |
|                  |    Main Content        |
|                  |    (max-w-7xl)         |
|                  |                        |
+------------------+------------------------+

Tablet (md-lg):
+------+----------------------------------+
|      |          Header (64px)           |
| Side +----------------------------------+
| bar  |                                  |
|(72px)|       Main Content               |
|      |                                  |
+------+----------------------------------+

Mobile (<md):
+----------------------------------------+
|                                        |
|           Main Content                 |
|                                        |
+----------------------------------------+
|        Bottom Navigation (64px)        |
+----------------------------------------+
```

### AppLayout Usage

The `AppLayout` component handles all shell structure automatically:

```tsx
// In App.tsx or routes
import { AppLayout } from './components/layout';

<Route element={<AppLayout />}>
  <Route path="/chat" element={<ChatPage />} />
  <Route path="/trends" element={<TrendsPage />} />
</Route>
```

### Sidebar Variants

```tsx
// Desktop: Full sidebar with labels
<Sidebar variant="desktop" />  // 280px width

// Tablet: Icon-only sidebar
<Sidebar variant="tablet" />   // 72px width
```

### Header Variants

```tsx
// Desktop: With logo
<Header variant="desktop" />

// Tablet: Title only
<Header variant="tablet" />
```

### MobileHeader Usage

```tsx
// With back button (default)
<MobileHeader title="Page Title" />

// With hamburger menu
<MobileHeader title="Page Title" showMenu />

// With profile button
<MobileHeader title="Page Title" showProfile />

// With custom right action
<MobileHeader
  title="Page Title"
  rightAction={<Button>Save</Button>}
/>
```

---

## Container Components

### PageContainer

Standard container for all page content:

```tsx
import { PageContainer } from './components/layout';

// Standard page
<PageContainer>
  <YourContent />
</PageContainer>

// Form page (narrow)
<PageContainer maxWidth="sm">
  <FormContent />
</PageContainer>

// Dashboard (wide)
<PageContainer maxWidth="xl">
  <DashboardContent />
</PageContainer>

// Full-screen (no max-width)
<PageContainer maxWidth="full" horizontalPadding="none">
  <FullWidthContent />
</PageContainer>

// Centered (auth pages)
<PageContainer centered>
  <LoginForm />
</PageContainer>
```

### Container Options

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| maxWidth | sm, md, lg, xl, 2xl, full | lg | Maximum container width |
| horizontalPadding | none, sm, md, lg | md | Horizontal padding |
| verticalPadding | none, sm, md, lg, xl | md | Vertical padding |
| centered | boolean | false | Center vertically |
| useSafeArea | boolean | false | Apply safe area insets |
| fullHeight | boolean | false | Fill available height |

### Convenience Containers

```tsx
import { NarrowContainer, WideContainer, FluidContainer } from './components/layout';

// Forms and single-column content (640px max)
<NarrowContainer>...</NarrowContainer>

// Dashboards and wide content (1280px max)
<WideContainer>...</WideContainer>

// Full width, no constraints
<FluidContainer>...</FluidContainer>
```

---

## Grid System

### GridLayout

Responsive grid for card layouts:

```tsx
import { GridLayout } from './components/layout';

// Explicit column counts
<GridLayout columns={{ xs: 1, sm: 2, lg: 3, xl: 4 }}>
  <Card />
  <Card />
  <Card />
</GridLayout>

// Auto-fit fluid grid
<GridLayout autoFit minItemWidth="280px">
  <Card />
  <Card />
  <Card />
</GridLayout>
```

### Grid Options

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| columns | { xs, sm, md, lg, xl, 2xl } | { xs:1, sm:2, md:2, lg:3 } | Column count per breakpoint |
| gap | xs, sm, md, lg, xl | md | Gap between items |
| autoFit | boolean | false | Use CSS auto-fit |
| minItemWidth | string | 280px | Min item width (autoFit) |
| alignItems | start, center, end, stretch | stretch | Vertical alignment |

### Pre-configured Grids

```tsx
import { CardGrid, DenseGrid, FluidGrid, StackLayout } from './components/layout';

// Card grid: 1 -> 2 -> 3 columns
<CardGrid>
  <Card />
</CardGrid>

// Dense grid: 2 -> 3 -> 4 -> 5 columns
<DenseGrid>
  <SmallItem />
</DenseGrid>

// Fluid grid: auto-fit based on width
<FluidGrid minItemWidth="300px">
  <Card />
</FluidGrid>

// Single column stack
<StackLayout>
  <Item />
</StackLayout>
```

---

## Two-Column Layouts

### TwoColumnLayout

Side-by-side on desktop, stacked on mobile:

```tsx
import { TwoColumnLayout } from './components/layout';

// Basic usage
<TwoColumnLayout
  left={<Sidebar />}
  right={<MainContent />}
  leftWidth="1/3"
/>

// With sticky sidebar
<TwoColumnLayout
  left={<FilterPanel />}
  right={<Results />}
  leftWidth="1/4"
  stickyLeft
  breakpoint="md"
/>

// Reverse order on mobile
<TwoColumnLayout
  left={<Details />}
  right={<Summary />}
  reverseOnMobile
/>
```

### Width Ratios

| leftWidth | Left Column | Right Column |
|-----------|-------------|--------------|
| 1/4 | 25% | 75% |
| 1/3 | 33% | 67% |
| 2/5 | 40% | 60% |
| 1/2 | 50% | 50% |
| 3/5 | 60% | 40% |
| 2/3 | 67% | 33% |
| 3/4 | 75% | 25% |

### Pre-configured Layouts

```tsx
import { SidebarLayout, SplitLayout, MasterDetailLayout } from './components/layout';

// Sidebar: 25% left (sticky), 75% right
<SidebarLayout
  left={<Navigation />}
  right={<Content />}
/>

// Split: 50/50
<SplitLayout
  left={<Editor />}
  right={<Preview />}
/>

// Master-detail: 67% left, 33% right
<MasterDetailLayout
  left={<List />}
  right={<Detail />}
/>
```

---

## Page Sections

### PageSection

Section wrapper with consistent spacing:

```tsx
import { PageSection } from './components/layout';

// With title
<PageSection title="Recent Activity">
  <ActivityList />
</PageSection>

// With subtitle
<PageSection
  title="Settings"
  subtitle="Manage your account preferences"
>
  <SettingsForm />
</PageSection>

// With action button
<PageSection
  title="Bookmarks"
  action={<Button>View All</Button>}
>
  <BookmarkList />
</PageSection>

// With divider
<PageSection title="Section 1" divider>
  <Content />
</PageSection>
```

### Section Options

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| spacing | none, sm, md, lg, xl | md | Bottom margin |
| titleSize | sm, md, lg | md | Title font size |
| divider | boolean | false | Show bottom divider |
| id | string | - | Anchor ID |

### Section Variants

```tsx
import { CompactSection, MajorSection } from './components/layout';

// Compact: smaller title, less spacing
<CompactSection title="Quick Actions">
  <Actions />
</CompactSection>

// Major: larger title, more spacing
<MajorSection title="Dashboard Overview">
  <Dashboard />
</MajorSection>
```

---

## Spacing Guidelines

### Horizontal Padding

| Screen | Padding | Tailwind |
|--------|---------|----------|
| Mobile (< 640px) | 16px | px-4 |
| Tablet (768px+) | 24px | sm:px-6 |
| Desktop (1024px+) | 32px | lg:px-8 |

### Vertical Spacing

| Size | Value | Use Case |
|------|-------|----------|
| sm | 16px | Compact sections |
| md | 24px | Default sections |
| lg | 32px | Major sections |
| xl | 48px | Page divisions |

### Gap Sizes

| Size | Value | Use Case |
|------|-------|----------|
| xs | 8px | Dense grids |
| sm | 12px | Compact lists |
| md | 16px | Default grids |
| lg | 24px | Card grids |
| xl | 32px | Large items |

---

## Mobile Considerations

### Safe Areas

Support for notched devices (iPhone X+):

```tsx
// In MobileHeader and MobileNav
style={{
  paddingTop: 'max(env(safe-area-inset-top), 12px)',
  paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
}}

// In PageContainer
<PageContainer useSafeArea>
  <Content />
</PageContainer>
```

### Touch Targets

Minimum touch target sizes:

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| iOS | 44px | 48px |
| Android | 48px | 56px |

```tsx
// All interactive elements should have
className="min-h-[44px] min-w-[44px]"
// or
style={{ minHeight: 44, minWidth: 44 }}
```

### Bottom Navigation Height

Account for bottom nav when calculating content height:

```tsx
// Content padding for mobile
className="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8"
```

### Keyboard Handling

For chat pages and forms with input at bottom:

```tsx
// Ensure input stays visible when keyboard opens
className="h-screen overflow-hidden"
// Input container
className="fixed bottom-0 left-0 right-0"
```

---

## Common Page Patterns

### Dashboard Page

```tsx
<PageContainer maxWidth="xl">
  <MajorSection title="Dashboard">
    <CardGrid gap="lg">
      <StatCard />
      <StatCard />
      <StatCard />
    </CardGrid>
  </MajorSection>

  <PageSection title="Recent Activity">
    <ActivityList />
  </PageSection>
</PageContainer>
```

### List + Detail Page

```tsx
<PageContainer maxWidth="full" horizontalPadding="none">
  <TwoColumnLayout
    left={<ItemList />}
    right={<ItemDetail />}
    leftWidth="1/3"
    stickyRight
  />
</PageContainer>
```

### Form Page

```tsx
<PageContainer maxWidth="sm" centered>
  <PageSection title="Create Account">
    <SignupForm />
  </PageSection>
</PageContainer>
```

### Card List Page

```tsx
<PageContainer>
  <PageSection
    title="Community Posts"
    action={<Button>New Post</Button>}
  >
    <FluidGrid minItemWidth="320px" gap="lg">
      {posts.map(post => <PostCard key={post.id} {...post} />)}
    </FluidGrid>
  </PageSection>
</PageContainer>
```

---

## Import Examples

```tsx
// Import all layout components
import {
  // Shell
  AppLayout,
  Sidebar,
  Header,
  MobileHeader,
  MobileNav,
  Drawer,

  // Containers
  PageContainer,
  NarrowContainer,
  WideContainer,

  // Sections
  PageSection,
  CompactSection,
  MajorSection,

  // Layouts
  TwoColumnLayout,
  SidebarLayout,
  GridLayout,
  CardGrid,
  FluidGrid,

  // Constants
  BREAKPOINTS,
  SIDEBAR,
  HEADER,
  Z_INDEX,
} from './components/layout';
```

---

## Z-Index Scale

| Layer | Value | Use |
|-------|-------|-----|
| BASE | 0 | Default content |
| STICKY | 10 | Sticky headers within content |
| SIDEBAR | 30 | Side navigation |
| HEADER | 40 | Top navigation |
| DROPDOWN | 50 | Dropdown menus |
| MODAL | 50 | Modal dialogs |
| TOAST | 60 | Toast notifications |
| BANNER | 60 | Alert banners |
| TOOLTIP | 70 | Tooltips |
