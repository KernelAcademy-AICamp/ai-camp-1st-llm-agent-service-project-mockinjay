# CareGuide UI Component Showcase

Visual reference guide for enhanced UI components with code examples.

---

## Buttons

### Primary Action Button (Gradient)
```tsx
<button className="btn-primary-action interactive-scale">
  시작하기
</button>
```
**Visual:** Teal-to-purple gradient, white text, scales on hover

### Primary Button (Solid)
```tsx
<button className="btn-primary focus-ring">
  확인
</button>
```
**Visual:** Solid teal, white text, focus ring on keyboard navigation

### Icon Button
```tsx
<button className="btn-icon">
  <Settings size={20} />
</button>
```
**Visual:** White background, teal border on hover, lifts slightly

### Ghost Button
```tsx
<button className="btn-ghost">
  취소
</button>
```
**Visual:** Transparent, gray text, light background on hover

---

## Badges & Pills

### Primary Pill
```tsx
<span className="pill-primary">
  레벨 3
</span>
```
**Visual:** Light teal background, teal border and text

### Accent Pill
```tsx
<span className="pill-accent">
  챌린지
</span>
```
**Visual:** Light purple background, purple border and text

### Success Pill
```tsx
<span className="pill-success flex items-center gap-1">
  <CheckCircle size={12} />
  완료
</span>
```
**Visual:** Light blue background, blue border and text, with icon

### Notification Badge
```tsx
<div className="relative">
  <Bell size={24} />
  <span className="notification-badge">3</span>
</div>
```
**Visual:** Red gradient circle, white text, positioned top-right

---

## Cards

### Basic Card with Elevation
```tsx
<div className="bg-white rounded-xl p-6 border border-gray-100 card-elevation-2">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here.</p>
</div>
```
**Visual:** White background, subtle shadow, rounded corners

### Interactive Card with Hover Lift
```tsx
<button className="w-full text-left bg-white rounded-xl p-6 border
  border-gray-100 card-elevation-1 card-hover-lift transition-all">
  <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
  <p className="text-gray-600">Lifts on hover with enhanced shadow.</p>
</button>
```
**Visual:** Lifts 4px on hover, shadow increases

### Glass Card
```tsx
<div className="glass rounded-xl p-6">
  <h3 className="text-lg font-semibold mb-2">Glass Effect</h3>
  <p className="text-gray-600">Semi-transparent with blur effect.</p>
</div>
```
**Visual:** Translucent white, blurred background

---

## Form Elements

### Enhanced Input Field
```tsx
<input
  type="text"
  className="input-field-enhanced focus-ring"
  placeholder="Enter text..."
/>
```
**Visual:** Light shadow, lifts on focus, teal glow ring

### Input with Error State
```tsx
<div>
  <input type="email" className="input-field-error" value="invalid@" />
  <div className="flex items-center gap-2 mt-2 text-sm text-error">
    <AlertCircle size={14} />
    <span>Invalid email address</span>
  </div>
</div>
```
**Visual:** Red border, light red background, error icon and message

### Input with Success State
```tsx
<div className="relative">
  <input type="email" className="input-field-success" value="valid@email.com" />
  <div className="absolute right-3 top-3 text-success">
    <CheckCircle size={20} />
  </div>
</div>
```
**Visual:** Blue border, light blue background, checkmark icon

---

## Progress Indicators

### Linear Progress Bar
```tsx
<div className="progress-bar">
  <div className="progress-bar-fill" style={{ width: '65%' }} />
</div>
```
**Visual:** Gray track, teal-to-purple gradient fill

### Circular Progress
```tsx
<div className="relative w-32 h-32">
  <svg className="transform -rotate-90 w-32 h-32">
    <circle
      cx="64" cy="64" r="56"
      stroke="#E5E7EB"
      strokeWidth="12"
      fill="none"
    />
    <circle
      cx="64" cy="64" r="56"
      stroke="url(#gradient)"
      strokeWidth="12"
      fill="none"
      strokeDasharray={`${percent * 3.52} 352`}
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="gradient">
        <stop offset="0%" stopColor="#00C9B7" />
        <stop offset="100%" stopColor="#9F7AEA" />
      </linearGradient>
    </defs>
  </svg>
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <span className="text-3xl font-bold">{percent}%</span>
    <span className="text-xs text-gray-500">완료</span>
  </div>
</div>
```
**Visual:** Circular gradient ring with percentage in center

### Loading Skeleton
```tsx
<div className="skeleton w-full h-20 rounded-xl" />
```
**Visual:** Animated shimmer effect, gray gradient

---

## Navigation

### Modern Pill Tabs
```tsx
<div className="tab-pill-container">
  <button className="tab-pill-active">
    <ChefHat size={18} className="mr-2" />
    Nutri Coach
  </button>
  <button className="tab-pill">
    <BookOpen size={18} className="mr-2" />
    Diet Log
  </button>
</div>
```
**Visual:** Gray container, white active tab with shadow, icons

### Traditional Tabs (Legacy)
```tsx
<div className="flex border-b border-gray-200">
  <button className="tab-active">Active Tab</button>
  <button className="tab">Inactive Tab</button>
</div>
```
**Visual:** Border bottom, purple underline on active

---

## Status Indicators

### Status Dots
```tsx
<div className="flex items-center gap-2">
  <span className="status-dot-success" />
  <span className="text-sm">Online</span>
</div>

<div className="flex items-center gap-2">
  <span className="status-dot-warning" />
  <span className="text-sm">Away</span>
</div>

<div className="flex items-center gap-2">
  <span className="status-dot-error" />
  <span className="text-sm">Offline</span>
</div>

<div className="flex items-center gap-2">
  <span className="status-dot-info" />
  <span className="text-sm">Busy</span>
</div>
```
**Visual:** Colored dots with glow effect

### Pulsing Indicator
```tsx
<button className="relative btn-primary pulse-ring">
  New Feature
</button>
```
**Visual:** Button with pulsing teal ring animation

---

## Chat Bubbles

### Enhanced User Message
```tsx
<div className="flex justify-end">
  <div className="chat-bubble-user-enhanced">
    안녕하세요! 건강 정보가 필요해요.
  </div>
</div>
```
**Visual:** Gradient background, white text, rounded, with shadow

### Enhanced AI Message
```tsx
<div className="flex justify-start">
  <div className="chat-bubble-ai-enhanced">
    네, 도와드리겠습니다. 어떤 정보를 원하시나요?
  </div>
</div>
```
**Visual:** White background, gray border, subtle shadow

---

## Special Effects

### Gradient Text
```tsx
<h1 className="gradient-text text-4xl font-bold">
  CareGuide
</h1>
```
**Visual:** Teal-to-purple gradient fill on text

### Interactive Scale
```tsx
<button className="btn-primary interactive-scale">
  Hover Me
</button>
```
**Visual:** Scales to 102% on hover, 98% on click

### Animations

#### Bounce In
```tsx
<div className="bounce-in bg-white rounded-xl p-6">
  I bounced in!
</div>
```
**Visual:** Enters with bounce animation

#### Slide In Right
```tsx
<div className="slide-in-right bg-white rounded-xl p-6">
  I slid in from the right!
</div>
```
**Visual:** Slides in from right side

#### Fade In
```tsx
<div className="fade-in bg-white rounded-xl p-6">
  I faded in!
</div>
```
**Visual:** Fades from 0 to 100% opacity

---

## Complex Components

### Enhanced Post Card
```tsx
<div className="bg-white rounded-xl overflow-hidden border border-gray-100
  card-elevation-2 card-hover-lift">
  {/* Image with overlay */}
  <div className="relative h-48">
    <img src={imageUrl} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div className="absolute bottom-4 left-4">
      <span className="pill-accent">카테고리</span>
    </div>
  </div>

  {/* Content */}
  <div className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Post Title
    </h3>
    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
      Post content preview...
    </p>

    {/* Actions */}
    <div className="flex items-center gap-3">
      <button className="group flex items-center gap-2 px-4 py-2
        rounded-xl bg-gray-50 hover:bg-red-50 transition-all">
        <Heart className="group-hover:scale-110 transition-transform" size={18} />
        <span className="font-medium">24</span>
      </button>

      <button className="flex items-center gap-2 px-4 py-2
        rounded-xl bg-gray-50 hover:bg-primary-50 transition-all">
        <MessageSquare size={18} />
        <span className="font-medium">8</span>
      </button>
    </div>
  </div>
</div>
```

### Enhanced Quiz Card
```tsx
<button className="w-full text-left p-5 rounded-xl border border-gray-200
  bg-white card-elevation-1 card-hover-lift relative group">
  {/* Difficulty indicator */}
  <div className="absolute top-4 right-4 flex gap-1 text-accent-purple">
    <Star size={12} fill="currentColor" />
    <Star size={12} fill="currentColor" />
    <Star size={12} fill="currentColor" />
  </div>

  <div className="flex items-start gap-4">
    {/* Number badge */}
    <div className="w-12 h-12 rounded-xl flex items-center justify-center
      text-white font-bold" style={{ background: 'var(--gradient-primary)' }}>
      1
    </div>

    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-gray-900">
          Quiz Title
        </h3>
        <span className="pill-success flex items-center gap-1">
          <CheckCircle size={12} />
          완료
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        Quiz description text...
      </p>

      <div className="flex items-center gap-3 text-xs">
        <span className="pill-primary">1레벨</span>
        <span className="text-gray-500">문제 10개</span>
        <span className="flex items-center gap-1 text-accent-purple font-medium">
          <Star size={12} fill="currentColor" />
          100P
        </span>
      </div>
    </div>

    <ChevronRight size={24} className="text-gray-400
      group-hover:text-primary-500 transition-colors" />
  </div>
</button>
```

### Enhanced Profile Card
```tsx
<div className="relative overflow-hidden rounded-xl bg-white border border-gray-100">
  {/* Gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-primary-500
    to-accent-purple opacity-10" />

  <div className="relative p-8 flex items-center gap-6">
    {/* Avatar */}
    <div className="w-24 h-24 rounded-2xl flex items-center justify-center
      text-white text-3xl font-bold shadow-lg"
      style={{ background: 'var(--gradient-primary)' }}>
      JK
    </div>

    <div className="flex-1">
      <h2 className="text-3xl font-bold text-gray-900 mb-1">
        김철수
      </h2>
      <p className="text-gray-600 mb-3">
        chulsoo@example.com
      </p>

      {/* Badges */}
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-full bg-primary-100
          text-primary-700 font-medium text-sm">
          레벨 5
        </div>
        <div className="px-4 py-2 rounded-full bg-accent-purple/10
          text-accent-purple font-medium text-sm">
          500P
        </div>
      </div>
    </div>
  </div>
</div>
```

### Enhanced Menu Item
```tsx
<button className="w-full p-5 rounded-xl border border-gray-100
  hover:border-primary-300 hover:bg-primary-50/30 transition-all
  group text-left">
  <div className="flex items-center gap-4">
    {/* Icon */}
    <div className="w-12 h-12 rounded-xl bg-gray-50
      group-hover:bg-primary-100 transition-colors
      flex items-center justify-center text-gray-600
      group-hover:text-primary-600">
      <User size={24} />
    </div>

    {/* Content */}
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900">프로필 정보</h4>
      <p className="text-sm text-gray-500">이름, 이메일, 연락처 관리</p>
    </div>

    {/* Arrow */}
    <ChevronRight className="text-gray-400 group-hover:text-primary-500
      transition-colors" />
  </div>
</button>
```

---

## Accessibility Features

### Focus Ring
```tsx
<button className="btn-primary focus-ring">
  Accessible Button
</button>
```
**Visual:** Teal ring appears on keyboard focus (Tab navigation)

### Screen Reader Text
```tsx
<span className="sr-only">
  This text is only for screen readers
</span>
```

### ARIA Labels
```tsx
<button
  aria-label="닫기"
  className="btn-icon">
  <X size={20} />
</button>
```

---

## Color Palette Reference

### Primary Colors
- **Teal:** #00C9B7 (var(--color-primary))
- **Teal Hover:** #00B3A3 (var(--color-primary-hover))
- **Teal Pressed:** #008C80 (var(--color-primary-pressed))

### Accent Colors
- **Purple:** #9F7AEA (var(--color-accent-purple))
- **Mint:** #00BFA5

### Semantic Colors
- **Success:** #00A8E8 (var(--color-success))
- **Warning:** #F59E0B (var(--color-warning))
- **Error:** #EF4444 (var(--color-error))

### Text Colors
- **Primary:** #1F2937 (var(--color-text-primary))
- **Secondary:** #4B5563 (var(--color-text-secondary))
- **Tertiary:** #6B7280 (var(--color-text-tertiary))

### Background Colors
- **White:** #FFFFFF (var(--color-background))
- **Surface:** #F8FAFC (var(--color-surface))
- **Input:** #F2FFFD (var(--color-input-bar))

### Border Colors
- **Strong:** #D1D5DB (var(--color-line-strong))
- **Medium:** #E5E7EB (var(--color-line-medium))
- **Light:** #F3F4F6 (var(--color-line-light))
- **Subtle:** #F9FAFB (var(--color-line-subtle))

---

## Typography Scale

### Headings
```tsx
<h1 className="text-4xl font-bold">Heading 1 (2rem/32px)</h1>
<h2 className="text-3xl font-bold">Heading 2 (1.5rem/24px)</h2>
<h3 className="text-2xl font-semibold">Heading 3 (1.25rem/20px)</h3>
<h4 className="text-xl font-semibold">Heading 4 (1.125rem/18px)</h4>
```

### Body Text
```tsx
<p className="text-base">Body text (1rem/16px)</p>
<p className="text-sm">Small text (0.875rem/14px)</p>
<p className="text-xs">Extra small text (0.75rem/12px)</p>
```

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

## Spacing Scale

Tailwind spacing utilities (multiply by 4px):
- `gap-1` = 4px
- `gap-2` = 8px
- `gap-3` = 12px
- `gap-4` = 16px
- `gap-6` = 24px
- `gap-8` = 32px

Padding/Margin:
- `p-3` = 12px
- `p-4` = 16px
- `p-5` = 20px
- `p-6` = 24px
- `p-8` = 32px

---

## Border Radius

- `rounded-lg` = 10.25px
- `rounded-xl` = 12px
- `rounded-2xl` = 16px
- `rounded-full` = 9999px (perfect circle/pill)

---

## Shadow System

### Card Elevations
1. **Elevation 1:** Subtle (hover states)
2. **Elevation 2:** Default cards
3. **Elevation 3:** Elevated modals
4. **Elevation 4:** Floating elements

Use: `card-elevation-1` through `card-elevation-4`

---

## Usage Guidelines

### When to Use Enhanced Components

#### Use Interactive Scale for:
- Buttons
- Cards that are clickable
- Navigation items
- Action tiles

#### Use Card Hover Lift for:
- Post cards
- Quiz cards
- Product cards
- Content previews

#### Use Pill Badges for:
- Status indicators
- Category labels
- Achievement badges
- Progress markers

#### Use Enhanced Inputs for:
- Important forms (signup, login)
- Data entry interfaces
- Search fields
- Settings pages

### Performance Considerations

1. **Animations:** Keep under 300ms for snappy feel
2. **Shadows:** Use sparingly, layer elevations
3. **Gradients:** Limit to key UI elements
4. **Transitions:** Use `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion

### Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Touch targets are 44x44px minimum
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Screen reader text for icon-only buttons

---

## Quick Reference

### Most Common Classes

```css
/* Buttons */
.btn-primary-action     /* Gradient button */
.btn-primary            /* Solid teal button */
.btn-icon               /* Icon-only button */

/* Cards */
.card-elevation-2       /* Standard card shadow */
.card-hover-lift        /* Lift on hover */
.interactive-scale      /* Scale animation */

/* Forms */
.input-field-enhanced   /* Enhanced input */
.focus-ring             /* Accessibility focus */

/* Badges */
.pill-primary           /* Teal pill */
.pill-accent            /* Purple pill */
.pill-success           /* Blue pill */

/* Progress */
.progress-bar           /* Linear progress */
.skeleton               /* Loading skeleton */

/* Tabs */
.tab-pill-container     /* Tab wrapper */
.tab-pill-active        /* Active tab */
.tab-pill               /* Inactive tab */

/* Effects */
.gradient-text          /* Gradient text fill */
.glass                  /* Frosted glass effect */
```

---

## Tips & Best Practices

1. **Consistency:** Use the same button style for similar actions across the app
2. **Hierarchy:** Reserve gradient buttons for primary actions only
3. **Spacing:** Maintain consistent padding (p-4, p-5, p-6) for similar components
4. **Colors:** Stick to defined CSS variables for maintainability
5. **Animations:** Don't overuse - reserve for meaningful interactions
6. **Accessibility:** Always include `focus-ring` on interactive elements
7. **Performance:** Test animations on lower-end devices
8. **Documentation:** Update this file when adding new component patterns

---

## Component Library Integration

To create a Storybook documentation:

1. Install Storybook: `npx sb init`
2. Create stories for each component type
3. Document props and variants
4. Include accessibility tests
5. Add interaction tests

Example story structure:
```tsx
// Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = () => (
  <button className="btn-primary">Primary Button</button>
);

export const IconButton = () => (
  <button className="btn-icon">
    <Settings size={20} />
  </button>
);
```

---

This showcase provides a comprehensive visual and code reference for all enhanced UI components in the CareGuide application.
