# CareGuide UI Design System Specification

**Version:** 1.0
**Last Updated:** 2025-11-26
**Application:** CareGuide - Healthcare AI Chat Application

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components Library](#components-library)
6. [Chat Interface Components](#chat-interface-components)
7. [Responsive Design](#responsive-design)
8. [Dark Mode](#dark-mode)
9. [Animations & Transitions](#animations--transitions)
10. [Accessibility Guidelines](#accessibility-guidelines)

---

## 1. Design Principles

### Core Values
- **Clarity**: Medical information must be clear and unambiguous
- **Trust**: Professional appearance that instills confidence
- **Accessibility**: Inclusive design for all users including elderly and visually impaired
- **Calm**: Healthcare environments should reduce anxiety, not increase it

### Visual Hierarchy
1. Critical actions (emergency, submit)
2. Primary actions (send message, select agent)
3. Secondary actions (filters, options)
4. Tertiary actions (settings, help)

---

## 2. Color System

### Primary Colors

```css
/* Main Brand Colors */
--color-primary: #00C9B7;              /* Primary teal */
--color-primary-hover: #00B3A3;        /* Hover state */
--color-primary-pressed: #008C80;      /* Active/pressed state */
--color-primary-dark: #00A899;         /* Dark mode variant */
--color-accent-purple: #9F7AEA;        /* Accent for gradients */
```

**Usage:**
- Primary buttons, active states, links
- Gradient overlays for emphasis
- Brand elements and logo

### Gradient

```css
--gradient-primary: linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%);
```

**Usage:**
- User message bubbles
- Call-to-action buttons
- Hero sections
- Feature highlights

### Text Colors

```css
--color-text-primary: #1F2937;         /* Headings, important text */
--color-text-secondary: #4B5563;       /* Body text */
--color-text-tertiary: #6B7280;        /* Labels, captions */
--color-disabled: #CCCCCC;             /* Disabled states */
```

### Semantic Colors

```css
--color-success: #00A8E8;              /* Success messages */
--color-warning: #F59E0B;              /* Warnings, disclaimers */
--color-error: #EF4444;                /* Errors, critical alerts */
```

### Line/Border Colors

```css
--color-line-strong: #D1D5DB;          /* Dividers, strong borders */
--color-line-medium: #E5E7EB;          /* Input borders, card borders */
--color-line-light: #F3F4F6;           /* Subtle dividers */
--color-line-subtle: #F9FAFB;          /* Background variations */
```

### Background Colors

```css
--color-background: #FFFFFF;           /* Main background */
--color-surface: #F8FAFC;              /* Elevated surfaces */
--color-input-bar: #F2FFFD;            /* Input focus background */
```

### Navigation Colors

```css
--color-nav-unselected: #666666;       /* Inactive nav items */
--color-nav-selected: #00C8B4;         /* Active nav items */
```

### Chat Bubble Colors

```css
--color-bubble-user: #E6F7F5;          /* User message background (alternative) */
--color-bubble-ai: #FFFFFF;            /* AI message background */
--color-bubble-ai-border: #E0E0E0;     /* AI message border */
```

---

## 3. Typography

### Font Families

```css
font-family: 'Noto Sans KR', 'Inter', system-ui, sans-serif;
```

**Rationale:**
- Noto Sans KR: Excellent Korean character support
- Inter: Clean, modern Latin characters
- System fallback for performance

### Type Scale

```css
/* Headings */
h1 {
  font-size: 2rem;        /* 32px */
  font-weight: 700;
  line-height: 1.2;
}

h2 {
  font-size: 1.5rem;      /* 24px */
  font-weight: 700;
  line-height: 1.3;
}

h3 {
  font-size: 1.25rem;     /* 20px */
  font-weight: 600;
  line-height: 1.4;
}

h4 {
  font-size: 1.125rem;    /* 18px */
  font-weight: 600;
  line-height: 1.4;
}

/* Body Text */
p {
  font-size: 1rem;        /* 16px */
  font-weight: 400;
  line-height: 1.6;
}

/* Small Text */
.text-sm {
  font-size: 0.875rem;    /* 14px */
}

.text-xs {
  font-size: 0.75rem;     /* 12px */
}

/* Tiny Text (captions) */
.text-[11px] {
  font-size: 0.6875rem;   /* 11px */
}
```

### Font Weights

- **300** - Light (decorative only)
- **400** - Regular (body text)
- **500** - Medium (emphasis)
- **600** - Semibold (subheadings)
- **700** - Bold (headings)

---

## 4. Spacing & Layout

### Spacing Scale

```css
/* Base spacing unit: 4px */
0.5 = 2px
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
```

### Layout Grid

- **Mobile**: 4px padding, 16px margins
- **Desktop**: 24px padding, 32px margins
- **Max Content Width**: 1280px
- **Sidebar Width**: 280px (desktop)

### Container Classes

```css
/* Main container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Content padding */
.p-content {
  padding: 1rem;        /* mobile */
}

@media (min-width: 1024px) {
  .p-content {
    padding: 1.5rem;    /* desktop */
  }
}
```

---

## 5. Components Library

### 5.1 Buttons

#### Primary Button

**Visual Specification:**
- Background: `var(--color-primary)` (#00C9B7)
- Text: White
- Padding: 24px horizontal, 12px vertical
- Border Radius: 12px
- Font: 16px, medium weight
- Min Touch Target: 44px height

```css
.btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  background-color: var(--color-primary);
  color: white;
  transition: all 200ms ease-in-out;
  min-height: 44px;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 200, 180, 0.2);
}

.btn-primary:active {
  background-color: var(--color-primary-pressed);
  transform: translateY(0);
}

.btn-primary:disabled {
  background-color: var(--color-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### Gradient Action Button

**Visual Specification:**
- Background: `var(--gradient-primary)`
- Text: White
- Use for: Highest priority actions

```css
.btn-primary-action {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  background: var(--gradient-primary);
  color: white;
  transition: all 200ms ease-in-out;
}

.btn-primary-action:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 200, 180, 0.3);
}
```

#### Secondary Button

**Visual Specification:**
- Background: White
- Border: 1px solid `var(--color-primary)`
- Text: `var(--color-primary)`

```css
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  background-color: white;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  transition: all 200ms ease-in-out;
}

.btn-secondary:hover {
  background-color: var(--color-input-bar);
  border-color: var(--color-primary-hover);
}
```

#### Ghost Button

**Visual Specification:**
- Background: Transparent
- Text: `var(--color-text-secondary)`
- No border

```css
.btn-ghost {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  background-color: transparent;
  color: var(--color-text-secondary);
  transition: all 200ms ease-in-out;
}

.btn-ghost:hover {
  background-color: var(--color-line-light);
}
```

#### Icon Button

**Visual Specification:**
- Size: 44px x 44px (minimum touch target)
- Border Radius: 50% (circular) or 12px (rounded square)
- Icon Size: 18-20px

```css
.btn-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 200ms ease-in-out;
}

.btn-icon:hover {
  background-color: var(--color-line-light);
  transform: scale(1.05);
}
```

### 5.2 Input Fields

#### Text Input

**Visual Specification:**
- Background: White
- Border: 1px solid `var(--color-line-medium)`
- Padding: 12px 16px
- Border Radius: 12px
- Min Height: 44px

```css
.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background-color: white;
  border: 1px solid var(--color-line-medium);
  color: var(--color-text-primary);
  transition: all 200ms ease-in-out;
  min-height: 44px;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-input-bar);
  box-shadow: 0 0 0 3px rgba(0, 200, 180, 0.1);
}

.input-field:disabled {
  background-color: var(--color-line-light);
  color: var(--color-disabled);
  cursor: not-allowed;
}

.input-field::placeholder {
  color: var(--color-text-tertiary);
}
```

#### Select Dropdown

**Visual Specification:**
- Same as text input
- Chevron icon on right (12px)
- Custom dropdown styling

```css
.select-field {
  /* Inherits from .input-field */
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Chevron down */
  background-position: right 12px center;
  background-repeat: no-repeat;
  padding-right: 36px;
}
```

### 5.3 Cards

#### Standard Card

**Visual Specification:**
- Background: White
- Border: 1px solid #E5E7EB
- Border Radius: 16px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 24px

```css
.card {
  background-color: white;
  border-radius: 1rem;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: all 200ms ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #D1D5DB;
}
```

#### Interactive Card

**Visual Specification:**
- Adds hover effect with primary color tint

```css
.card-interactive {
  /* Inherits from .card */
  cursor: pointer;
}

.card-interactive:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 200, 180, 0.3);
  transform: translateY(-2px);
}
```

### 5.4 Badges

**Visual Specification:**
- Padding: 4px 10px
- Border Radius: 9999px (full rounded)
- Font Size: 12px
- Font Weight: 500

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Semantic variants */
.badge-free {
  background-color: #D1FAE5;
  color: #065F46;
}

.badge-patient {
  background-color: #FEF3C7;
  color: #92400E;
}

.badge-researcher {
  background-color: #DBEAFE;
  color: #1E3A8A;
}
```

### 5.5 Tabs

**Visual Specification:**
- Height: 44px
- Padding: 8px 16px
- Border Bottom: 2px solid

```css
.tab-unselected {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 200ms ease-in-out;
  min-height: 44px;
}

.tab-unselected:hover {
  color: var(--color-primary);
  border-bottom-color: rgba(0, 200, 180, 0.3);
}

.tab-selected {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-accent-purple);
}
```

---

## 6. Chat Interface Components

### 6.1 Chat Message Bubbles

#### User Message

**Visual Specification:**
- Background: `var(--gradient-primary)`
- Text: White
- Max Width: 85% (mobile), 70% (desktop)
- Padding: 12px 16px
- Border Radius: 12px 12px 4px 12px (tail on bottom-right)
- Alignment: Right

```css
.chat-bubble-user {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem 0.75rem 0.25rem 0.75rem;
  background: var(--gradient-primary);
  color: white;
  margin-left: auto;
}

@media (min-width: 1024px) {
  .chat-bubble-user {
    max-width: 70%;
  }
}
```

#### AI Message

**Visual Specification:**
- Background: #F9FAFB
- Border: 1px solid #E0E0E0
- Text: `var(--color-text-primary)`
- Max Width: 85% (mobile), 70% (desktop)
- Padding: 12px 16px
- Border Radius: 4px 12px 12px 12px (tail on top-left)
- Alignment: Left
- Icon: Bot icon (18px) in primary color

```css
.chat-bubble-ai {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem 0.75rem 0.75rem 0.75rem;
  background-color: #F9FAFB;
  color: var(--color-text-primary);
  border: 1px solid #E0E0E0;
}

@media (min-width: 1024px) {
  .chat-bubble-ai {
    max-width: 70%;
  }
}
```

### 6.2 Chat Input Area

**Visual Specification:**
- Background: White
- Border Top: 1px solid #E5E7EB
- Padding: 12px 16px (mobile), 16px 24px (desktop)
- Height: Auto (min 80px)

**Components:**
1. Profile selector (11px text, chevron icon)
2. Image attach button (nutrition only, 44px x 44px)
3. Text input (flexible width)
4. Send button (44px x 44px, circular)

```css
.chat-input-container {
  background-color: white;
  border-top: 1px solid #E5E7EB;
  padding: 0.75rem 1rem;
}

@media (min-width: 1024px) {
  .chat-input-container {
    padding: 1rem 1.5rem;
  }
}

.chat-send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  transition: all 200ms ease-in-out;
}

.chat-send-button:disabled {
  background-color: #F3F4F6;
}

.chat-send-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  transform: scale(1.05);
}
```

### 6.3 Agent Type Tabs

**Visual Specification:**
- Container: Horizontal scrollable (mobile), flex wrap (desktop)
- Gap: 8px (mobile), 16px (desktop)
- Height: 44px
- Min Width per tab: 110px

**States:**

**Unselected:**
- Background: White
- Border: 2px solid #E5E7EB
- Text: #666666
- Icon: 16px

**Selected:**
- Background: White
- Border: 2px solid transparent
- Border Image: `var(--gradient-primary)`
- Text: `var(--color-primary)`, bold
- Icon: 16px

```css
.agent-tab-unselected {
  flex: 1;
  min-width: 110px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background-color: white;
  color: #666666;
  border: 2px solid #E5E7EB;
  transition: all 200ms ease-in-out;
}

.agent-tab-selected {
  flex: 1;
  min-width: 110px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background-color: white;
  color: var(--color-primary);
  font-weight: 700;
  border: 2px solid transparent;
  background-image: linear-gradient(white, white), var(--gradient-primary);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
```

### 6.4 Profile Selector

**Visual Specification:**
- Size: Small (11px text)
- Position: Above input field
- Style: Minimal dropdown (native select with custom overlay)

```css
.profile-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.profile-selector-label {
  font-size: 0.6875rem;
  color: #6B7280;
}

.profile-selector-value {
  font-size: 0.6875rem;
  color: var(--color-primary);
  font-weight: 500;
  cursor: pointer;
}
```

### 6.5 Streaming Indicator

**Visual Specification:**
- Animated pulsing dots (3 dots)
- Color: Primary color
- Size: 8px per dot
- Animation: Bounce with stagger

```css
.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
}

.streaming-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-primary);
  animation: pulse 1.4s infinite ease-in-out;
}

.streaming-dot:nth-child(1) {
  animation-delay: 0s;
}

.streaming-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.streaming-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 6.6 Empty State

**Visual Specification:**
- Icon: Bot icon, 64px, gray-300
- Heading: 24px, bold
- Description: 16px, secondary color
- Suggested Questions: Grid layout (1 column mobile, 2 columns desktop)

```css
.chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.suggested-questions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-top: 1.5rem;
  max-width: 42rem;
  width: 100%;
}

@media (min-width: 768px) {
  .suggested-questions-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.suggested-question-button {
  padding: 0.75rem 1rem;
  background-color: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  text-align: left;
  min-height: 44px;
  transition: all 200ms ease-in-out;
}

.suggested-question-button:hover {
  background-color: #F9FAFB;
  border-color: var(--color-primary);
}
```

### 6.7 Session Expired State

**Visual Specification:**
- Icon: Clock icon, 48px, gray-300
- Heading: 18px, semibold
- Description: 14px, tertiary color
- Buttons: Primary (restore) + Secondary (new chat)

```css
.session-expired-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.session-expired-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (min-width: 640px) {
  .session-expired-buttons {
    flex-direction: row;
  }
}
```

### 6.8 Disclaimer Banner

**Visual Specification:**
- Background: #FEF3C7 (yellow-50)
- Border: 1px solid #FDE68A (yellow-200)
- Text: 12px, #78350F (yellow-900)
- Icon: Warning icon
- Padding: 8px 12px
- Border Radius: 8px

```css
.disclaimer-banner {
  background-color: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
}

.disclaimer-text {
  font-size: 0.75rem;
  color: #78350F;
  line-height: 1.4;
}
```

---

## 7. Responsive Design

### Breakpoints

```css
/* Mobile First */
/* xs: 0-639px (default) */

/* sm: 640px+ */
@media (min-width: 640px) { }

/* md: 768px+ */
@media (min-width: 768px) { }

/* lg: 1024px+ (desktop) */
@media (min-width: 1024px) { }

/* xl: 1280px+ */
@media (min-width: 1280px) { }

/* 2xl: 1536px+ */
@media (min-width: 1536px) { }
```

### Layout Adjustments

**Mobile (< 1024px):**
- Full width layout
- Bottom navigation
- Sidebar hidden
- Single column layouts
- Larger touch targets (44px minimum)
- Reduced padding/margins

**Desktop (>= 1024px):**
- Sidebar visible (280px)
- Top header
- Multi-column layouts
- Hover states active
- Increased white space

### Touch Targets

**Minimum touch target size: 44px x 44px**

Critical for:
- All buttons
- Tab switches
- Input fields (height)
- Links in chat
- Icon buttons

---

## 8. Dark Mode

### Color Mappings

```css
/* Dark mode uses Tailwind's dark: variant */

:root {
  /* Light mode (default) */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Background */
    --color-background: #111827;
    --color-surface: #1F2937;

    /* Text */
    --color-text-primary: #F9FAFB;
    --color-text-secondary: #D1D5DB;
    --color-text-tertiary: #9CA3AF;

    /* Borders */
    --color-line-strong: #4B5563;
    --color-line-medium: #374151;
    --color-line-light: #1F2937;

    /* Chat Bubbles */
    --color-bubble-ai: #1F2937;
    --color-bubble-ai-border: #374151;
  }
}
```

### Implementation

```css
/* Example: Card in dark mode */
.card {
  background-color: white;
}

@media (prefers-color-scheme: dark) {
  .card {
    background-color: #1F2937;
    border-color: #374151;
  }
}

/* Or using Tailwind classes */
<div className="bg-white dark:bg-gray-800">
```

### Contrast Requirements

- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Icons and UI elements: Minimum 3:1 ratio

---

## 9. Animations & Transitions

### Transition Duration

```css
/* Standard transitions */
transition-duration: 200ms;   /* Default for most interactions */
transition-duration: 300ms;   /* Larger movements, modals */
transition-duration: 500ms;   /* Page transitions, major changes */
```

### Easing Functions

```css
transition-timing-function: ease-in-out;   /* Default smooth */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);  /* Material Design */
```

### Common Animations

#### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 300ms ease-in-out;
}
```

#### Slide Up

```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp 400ms ease-out;
}
```

#### Pulse (Loading)

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### Splash Effect (Button Click)

```css
@keyframes splash-expand {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(3);
  }
}

.splash-effect {
  animation: splash-expand 600ms ease-out;
}
```

### Hover Transitions

```css
/* Standard hover */
.hoverable {
  transition: all 200ms ease-in-out;
}

.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Button hover */
button {
  transition: all 200ms ease-in-out;
}

button:hover {
  transform: scale(1.02);
}

button:active {
  transform: scale(0.98);
}
```

---

## 10. Accessibility Guidelines

### Keyboard Navigation

**All interactive elements must be keyboard accessible:**
- Tab order follows visual hierarchy
- Focus indicators visible (outline or custom)
- Skip links for navigation
- Escape key closes modals

```css
/* Focus indicator */
*:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Custom focus for buttons */
.btn-primary:focus-visible {
  outline: 3px solid rgba(0, 200, 180, 0.5);
  outline-offset: 2px;
}
```

### Screen Reader Support

**ARIA labels:**
```html
<!-- Icon buttons need labels -->
<button aria-label="Send message">
  <Send size={18} />
</button>

<!-- Chat messages -->
<div role="log" aria-live="polite" aria-atomic="false">
  <!-- Messages appear here -->
</div>

<!-- Loading states -->
<div role="status" aria-live="polite">
  <span className="sr-only">Loading response...</span>
</div>
```

### Visual Accessibility

**Contrast ratios (WCAG AA):**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Font sizes:**
- Minimum body text: 16px (1rem)
- Minimum interactive text: 14px (0.875rem)
- Allow text scaling up to 200%

**Color independence:**
- Never rely on color alone to convey information
- Use icons, text labels, or patterns in addition to color

### Motion Accessibility

**Respect reduced motion preferences:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Error Handling

**Accessible error messages:**
```html
<div role="alert" aria-live="assertive">
  <p>Error: Message could not be sent. Please try again.</p>
</div>
```

---

## Implementation Checklist

### Before Launch

- [ ] All colors meet WCAG AA contrast requirements
- [ ] All interactive elements have 44px minimum touch target
- [ ] Keyboard navigation tested on all pages
- [ ] Screen reader tested (NVDA/JAWS/VoiceOver)
- [ ] Dark mode implemented and tested
- [ ] Mobile responsive tested (320px - 1920px)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Focus states visible on all interactive elements

### Performance

- [ ] CSS variables used for theming
- [ ] Animations use transform/opacity (GPU accelerated)
- [ ] Font files optimized and subset
- [ ] Critical CSS inlined
- [ ] Unused CSS purged

---

## Component Quick Reference

| Component | Class | File Location |
|-----------|-------|---------------|
| Primary Button | `.btn-primary` | `index.css` |
| Secondary Button | `.btn-secondary` | `index.css` |
| Ghost Button | `.btn-ghost` | `index.css` |
| Input Field | `.input-field` | `index.css` |
| Card | `.card` | `index.css` |
| User Chat Bubble | `.chat-bubble-user` | `index.css` |
| AI Chat Bubble | `.chat-bubble-ai` | `index.css` |
| Tab (Selected) | `.tab-selected` | `index.css` |
| Tab (Unselected) | `.tab-unselected` | `index.css` |
| Badge | `.badge` | `index.css` |
| Navigation Item | `.nav-item` | `index.css` |

---

## Design System Updates

**Version History:**

- **v1.0** (2025-11-26): Initial design system specification

**Future Considerations:**

1. Component variants for different medical contexts
2. Illustration style guide
3. Icon library standardization
4. Data visualization guidelines
5. Email template designs
6. Print stylesheet

---

## Contact & Contribution

For design system questions or contributions, please contact the design team.

**Figma Design Files:** [Link to Figma]
**Component Storybook:** [Link to Storybook]
**GitHub Repository:** [Link to repo]

---

**Last Updated:** 2025-11-26
**Next Review:** 2026-01-26
