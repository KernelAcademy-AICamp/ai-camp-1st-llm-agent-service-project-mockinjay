# CareGuide Layout System Guide

Complete guide to the responsive layout system for the CareGuide health platform.

## Table of Contents
1. [Overview](#overview)
2. [Responsive Breakpoints](#responsive-breakpoints)
3. [Layout Components](#layout-components)
4. [Safe Area Support](#safe-area-support)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)

---

## Overview

The CareGuide layout system provides a comprehensive, mobile-first responsive design framework that works seamlessly across all devices from mobile phones to large desktop screens.

### Key Features
- Mobile-first responsive design
- Safe area inset support for notched devices
- Adaptive layouts (desktop sidebar, tablet collapsed sidebar, mobile bottom nav)
- Glassmorphism design with backdrop blur
- Smooth animations and transitions
- Accessibility-compliant

---

## Responsive Breakpoints

### Tailwind Breakpoints
```css
sm: 640px   /* Small tablets and large phones (landscape) */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops and large tablets */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Device Layout Strategy

#### Mobile (< 768px)
- Bottom navigation bar (5 main items)
- Side drawer for additional menu items
- Full-width content
- Safe area insets for notched devices

#### Tablet (768px - 1023px)
- Collapsed sidebar (icon-only, 80px width)
- Top header bar
- Reduced padding for content
- Two-column layouts stack vertically

#### Desktop (≥ 1024px)
- Full sidebar (280px width)
- Top header bar
- Maximum content width constraints
- Multi-column layouts

---

## Layout Components

### 1. AppLayout
Main layout wrapper that provides the application shell.

**Path:** `src/components/layout/AppLayout.tsx`

**Features:**
- Responsive sidebar/navigation switching
- Network status banners
- Safe area padding
- Route-based layout toggling
- Smooth scroll to top on navigation

**Usage:**
```tsx
// Automatically applied to all routes in AppRoutes.tsx
<AppLayout>
  <Outlet /> {/* Page content renders here */}
</AppLayout>
```

**Responsive Behavior:**
```
Mobile (< md):
  - Bottom nav (MobileNav)
  - Side drawer (Drawer)
  - Full-width content
  - pb-[calc(80px+env(safe-area-inset-bottom))]

Tablet (md - lg):
  - Collapsed sidebar (80px)
  - Header (left: 80px)
  - Content (pl-20, pt-16)

Desktop (≥ lg):
  - Full sidebar (280px)
  - Header (left: 280px)
  - Content (pl-[280px], pt-16)
```

---

### 2. Sidebar
Desktop and tablet navigation sidebar.

**Path:** `src/components/layout/Sidebar.tsx`

**Features:**
- Responsive width (280px desktop, 80px tablet)
- Icon + label (desktop) or icon-only (tablet)
- Active state indicators
- Login/signup or My Page button
- Footer links (desktop only)
- Custom scrollbar styling

**Responsive Classes:**
```tsx
// Container
className="md:w-20 lg:w-[280px]"

// Menu items
className="md:justify-center lg:justify-start"

// Labels
className="hidden lg:inline"

// Footer links
className="hidden lg:block"  // Desktop only
className="md:flex lg:hidden" // Tablet only
```

---

### 3. MobileNav
Bottom navigation for mobile devices.

**Path:** `src/components/layout/MobileNav.tsx`

**Features:**
- Fixed to bottom of screen
- 5 main navigation items
- Active indicator line
- Safe area inset support
- Backdrop blur effect
- Touch-friendly tap targets (44x44px minimum)

**Safe Area Implementation:**
```tsx
style={{
  paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
  paddingTop: '8px',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
}}
```

**Usage:**
```tsx
// Automatically shown on mobile
// Hidden on: /, /splash, /login, /signup, /main
```

---

### 4. MobileHeader
Top header bar for mobile pages.

**Path:** `src/components/layout/MobileHeader.tsx`

**Props:**
```tsx
interface MobileHeaderProps {
  title: string;              // Page title
  onBack?: () => void;        // Custom back handler
  rightAction?: ReactNode;    // Custom right button
  showMenu?: boolean;         // Show menu instead of back
  showProfile?: boolean;      // Show profile/login button
  onMenuClick?: () => void;   // Custom menu handler
}
```

**Usage:**
```tsx
// Example: Chat page header
<MobileHeader
  title="AI챗봇"
  showMenu
  showProfile
/>

// Example: Detail page with back button
<MobileHeader
  title="게시글 상세"
  onBack={() => navigate(-1)}
  showProfile
/>
```

---

### 5. Drawer
Side drawer menu for mobile.

**Path:** `src/components/layout/Drawer.tsx`

**Features:**
- Slides in from left
- 80% screen width (max 320px)
- Main menu items
- Secondary menu items
- Login/logout button
- Body scroll lock when open
- Backdrop overlay
- Safe area insets

**Context Usage:**
```tsx
import { useDrawer } from '../../contexts/DrawerContext';

const { isDrawerOpen, openDrawer, closeDrawer, toggleDrawer } = useDrawer();
```

---

### 6. PageContainer
Standard container for page content with responsive padding and max-width.

**Path:** `src/components/layout/PageContainer.tsx`

**Props:**
```tsx
interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  noPadding?: boolean;
  verticalPadding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  centered?: boolean;
  useSafeArea?: boolean;
  className?: string;
}
```

**Max Width Values:**
```
sm:  640px  - Forms, single-column content
md:  768px  - Articles, reading content
lg:  1024px - Standard pages (default)
xl:  1280px - Dashboards, wide content
2xl: 1536px - Very wide layouts
full: No constraint
```

**Usage Examples:**
```tsx
// Standard page
<PageContainer>
  <YourContent />
</PageContainer>

// Form page (narrower)
<PageContainer maxWidth="md">
  <SignupForm />
</PageContainer>

// Dashboard (wider)
<PageContainer maxWidth="xl">
  <DashboardGrid />
</PageContainer>

// Full width with custom vertical padding
<PageContainer maxWidth="full" verticalPadding="lg">
  <HeroSection />
</PageContainer>

// Centered login page
<PageContainer maxWidth="sm" centered>
  <LoginForm />
</PageContainer>

// With safe area insets
<PageContainer useSafeArea>
  <MobileContent />
</PageContainer>
```

---

### 7. PageSection
Reusable section component with consistent spacing.

**Path:** `src/components/layout/PageSection.tsx`

**Props:**
```tsx
interface PageSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  action?: ReactNode;
  className?: string;
}
```

**Spacing Values:**
```
sm: 16px (mb-4)  - Compact sections
md: 24px (mb-6)  - Default
lg: 32px (mb-8)  - Major sections
xl: 48px (mb-12) - Page-level divisions
```

**Usage:**
```tsx
<PageSection
  title="최근 게시글"
  subtitle="커뮤니티 활동을 확인하세요"
  spacing="lg"
  action={
    <button>더보기</button>
  }
>
  <PostList />
</PageSection>
```

---

### 8. GridLayout
Responsive grid system for card layouts.

**Path:** `src/components/layout/GridLayout.tsx`

**Props:**
```tsx
interface GridLayoutProps {
  children: ReactNode;
  columns?: {
    xs?: 1 | 2;
    sm?: 1 | 2 | 3;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  autoFit?: boolean;
  minItemWidth?: string;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}
```

**Gap Values:**
```
xs: 8px
sm: 12px
md: 16px (default)
lg: 24px
xl: 32px
```

**Usage Examples:**
```tsx
// Responsive card grid
<GridLayout
  columns={{ xs: 1, sm: 2, lg: 3 }}
  gap="lg"
>
  <Card />
  <Card />
  <Card />
</GridLayout>

// Auto-fit grid (fills available space)
<GridLayout
  autoFit
  minItemWidth="280px"
  gap="md"
>
  <Card />
  <Card />
  <Card />
</GridLayout>

// Dashboard grid with 4 columns
<GridLayout
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap="xl"
  alignItems="start"
>
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</GridLayout>
```

---

### 9. TwoColumnLayout
Side-by-side layout that stacks on mobile.

**Path:** `src/components/layout/TwoColumnLayout.tsx`

**Props:**
```tsx
interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: '1/4' | '1/3' | '1/2' | '2/3';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  reverseOnMobile?: boolean;
  breakpoint?: 'md' | 'lg';
  stickyLeft?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
// Sidebar + Main Content
<TwoColumnLayout
  left={<Sidebar />}
  right={<MainContent />}
  leftWidth="1/3"
  gap="lg"
  stickyLeft
/>

// Form + Preview
<TwoColumnLayout
  left={<FormFields />}
  right={<Preview />}
  leftWidth="1/2"
  breakpoint="md"
/>

// Reverse on mobile (preview first)
<TwoColumnLayout
  left={<Details />}
  right={<Summary />}
  leftWidth="2/3"
  reverseOnMobile
/>
```

---

## Safe Area Support

### What are Safe Areas?
Safe areas are insets provided by mobile browsers to avoid notches, rounded corners, and home indicators on modern smartphones.

### CSS Environment Variables
```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

### Implementation

#### In CSS/Tailwind (Inline Styles)
```tsx
<div
  style={{
    paddingTop: 'max(env(safe-area-inset-top), 12px)',
    paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  }}
>
  Content
</div>
```

#### In CSS Classes
```css
.safe-area-top {
  padding-top: var(--safe-area-inset-top);
}
.safe-area-bottom {
  padding-bottom: var(--safe-area-inset-bottom);
}
```

#### Calculated Values
```tsx
// Ensure minimum padding even without safe area
paddingBottom: 'calc(64px + env(safe-area-inset-bottom))'

// Using max() for fallback
paddingBottom: 'max(env(safe-area-inset-bottom), 8px)'
```

### Where to Use Safe Areas

✅ **Use safe areas on:**
- Bottom navigation (MobileNav)
- Mobile headers (MobileHeader)
- Side drawer (Drawer)
- Full-screen modals
- Fixed position elements

❌ **Don't use safe areas on:**
- Desktop layouts (lg breakpoint and above)
- Scrollable content containers
- Inline elements

---

## Best Practices

### 1. Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```tsx
// Good ✅
className="w-full md:w-1/2 lg:w-1/3"

// Bad ❌
className="lg:w-1/3 md:w-1/2 w-full"
```

### 2. Touch Targets
Ensure interactive elements are at least 44x44px:

```tsx
// Use touch-target class
className="touch-target"

// Or explicit size
className="min-h-[44px] min-w-[44px]"
```

### 3. Consistent Spacing
Use the spacing scale consistently:

```
4px  (gap-1)   - Tight spacing
8px  (gap-2)   - Compact
12px (gap-3)   - Default small
16px (gap-4)   - Default medium
24px (gap-6)   - Large
32px (gap-8)   - Extra large
```

### 4. Accessibility

Always include:
- `aria-label` for icon-only buttons
- `aria-current="page"` for active nav items
- `role` attributes for semantic elements
- `aria-hidden="true"` for decorative elements

```tsx
<button
  aria-label="메뉴 열기"
  aria-current={isActive ? 'page' : undefined}
>
  <Menu aria-hidden="true" />
</button>
```

### 5. Performance

- Use `transition-all` sparingly
- Prefer specific transitions: `transition-colors`, `transition-transform`
- Use `will-change` for complex animations
- Implement `prefers-reduced-motion`

---

## Common Patterns

### 1. List/Detail Pattern

**Mobile:** Stack vertically, navigate between views
```tsx
<PageContainer>
  {/* List view */}
  <GridLayout columns={{ xs: 1 }} gap="md">
    <ItemCard onClick={() => navigate(`/item/${id}`)} />
  </GridLayout>
</PageContainer>
```

**Desktop:** Side-by-side layout
```tsx
<TwoColumnLayout
  left={<ItemList />}
  right={<ItemDetail />}
  leftWidth="1/3"
/>
```

### 2. Dashboard Pattern

```tsx
<PageContainer maxWidth="xl">
  {/* Stats Row */}
  <GridLayout
    columns={{ xs: 1, sm: 2, lg: 4 }}
    gap="lg"
    className="mb-8"
  >
    <StatCard />
    <StatCard />
    <StatCard />
    <StatCard />
  </GridLayout>

  {/* Main Content */}
  <TwoColumnLayout
    left={<Chart />}
    right={<ActivityFeed />}
    leftWidth="2/3"
  />
</PageContainer>
```

### 3. Form Pattern

```tsx
<PageContainer maxWidth="md" centered>
  <div className="w-full max-w-md">
    <PageSection
      title="회원가입"
      subtitle="정보를 입력해주세요"
      spacing="lg"
    >
      <form className="space-y-4">
        <input className="input-premium" />
        <input className="input-premium" />
        <button className="btn-primary w-full">
          가입하기
        </button>
      </form>
    </PageSection>
  </div>
</PageContainer>
```

### 4. Chat/Full-Height Pattern

```tsx
// In AppLayout, chat pages get special treatment
const isChatPage = location.pathname.startsWith('/chat');

// Chat page layout
<PageContainer maxWidth="full" noPadding verticalPadding="none">
  <div className="flex flex-col h-screen">
    <ChatHeader />
    <ChatMessages className="flex-1 overflow-y-auto" />
    <ChatInput />
  </div>
</PageContainer>
```

### 5. Card Grid Pattern

```tsx
<PageContainer>
  <PageSection
    title="트렌드 논문"
    subtitle="최신 연구 동향"
    action={<Link to="/trends">전체보기</Link>}
  >
    <GridLayout
      autoFit
      minItemWidth="300px"
      gap="lg"
    >
      <PaperCard />
      <PaperCard />
      <PaperCard />
    </GridLayout>
  </PageSection>
</PageContainer>
```

---

## Z-Index Scale

Consistent z-index values across the application:

```
1   - Sticky elements, card hovers
10  - Dropdowns, tooltips
20  - Modals background overlay
30  - Sidebar (fixed)
40  - Header (fixed)
50  - Mobile drawer, modals
60  - Toast notifications, banners
```

---

## Animation Guidelines

### Standard Durations
```
Fast:     150-200ms - Hover states, highlights
Standard: 250-300ms - Most transitions
Slow:     400-500ms - Page transitions, complex animations
```

### Easing Functions
```
Ease out: cubic-bezier(0.16, 1, 0.3, 1) - Entering
Ease in:  cubic-bezier(0.4, 0, 1, 1)     - Exiting
Spring:   cubic-bezier(0.34, 1.56, 0.64, 1) - Bouncy
```

### Usage
```tsx
// Standard transition
className="transition-all duration-300 ease-out"

// Hover transform
className="hover:-translate-y-0.5 transition-transform duration-200"

// Active scale
className="active:scale-95 transition-transform"
```

---

## Testing Checklist

### Mobile Testing
- [ ] Test on actual devices (iOS Safari, Android Chrome)
- [ ] Check safe area insets on notched devices
- [ ] Verify touch target sizes (min 44x44px)
- [ ] Test bottom navigation accessibility
- [ ] Check landscape orientation
- [ ] Verify drawer swipe gestures

### Tablet Testing
- [ ] Verify collapsed sidebar (icon-only)
- [ ] Check header positioning
- [ ] Test two-column layouts
- [ ] Verify grid columns

### Desktop Testing
- [ ] Test full sidebar expansion
- [ ] Verify max-width constraints
- [ ] Check multi-column layouts
- [ ] Test hover states

### Responsive Testing
- [ ] Test at all breakpoints (640, 768, 1024, 1280)
- [ ] Verify smooth transitions between breakpoints
- [ ] Check content reflow
- [ ] Test browser zoom (up to 200%)

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus visible indicators
- [ ] Color contrast ratios
- [ ] Reduced motion preference

---

## Troubleshooting

### Issue: Safe area not working
**Solution:** Ensure viewport meta tag includes `viewport-fit=cover`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Issue: Sidebar overlapping content on tablet
**Solution:** Check `md:pl-20 lg:pl-[280px]` on main content container

### Issue: Bottom nav hidden by content
**Solution:** Add bottom padding to main container:
```tsx
className="pb-[calc(80px+env(safe-area-inset-bottom))]"
```

### Issue: Flickering on resize
**Solution:** Use `transition-all` carefully, prefer specific properties:
```tsx
// Instead of
className="transition-all"

// Use
className="transition-[padding,margin,width] duration-300"
```

---

## File Structure

```
src/components/layout/
├── AppLayout.tsx          - Main app shell
├── Header.tsx             - Desktop header
├── Sidebar.tsx            - Desktop/tablet sidebar
├── MobileHeader.tsx       - Mobile header component
├── MobileNav.tsx          - Mobile bottom navigation
├── Drawer.tsx             - Mobile side drawer
├── PageContainer.tsx      - Page wrapper with max-width
├── PageSection.tsx        - Section with title/spacing
├── GridLayout.tsx         - Responsive grid
├── TwoColumnLayout.tsx    - Two-column responsive
└── index.ts               - Export all components

src/contexts/
├── DrawerContext.tsx      - Drawer state management

src/hooks/
├── useNetworkStatus.ts    - Network connectivity
```

---

## Additional Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Mobile Web Best Practices](https://developer.mozilla.org/en-US/docs/Web/Guide/Mobile)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
