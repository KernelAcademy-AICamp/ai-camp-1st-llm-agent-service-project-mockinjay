# CareGuide Design Tokens

> Design System v2.0 - Comprehensive Token Reference

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Border Radius](#border-radius)
5. [Shadows](#shadows)
6. [Animations](#animations)
7. [Breakpoints](#breakpoints)
8. [Z-Index](#z-index)

---

## Color System

### Brand Colors

#### Primary (Mint/Teal)
The primary color represents health, vitality, and trust - core values for a medical platform.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#e6faf8` | Light backgrounds, hover states |
| `primary-100` | `#ccf5f1` | Subtle highlights |
| `primary-200` | `#99ebe3` | Light accents |
| `primary-300` | `#66e0d5` | Medium accents |
| `primary-400` | `#33d6c7` | Interactive elements |
| `primary-500` | `#00c9b7` | **Main brand color** |
| `primary-600` | `#00b3a3` | Hover states |
| `primary-700` | `#009d8f` | Active/pressed states |
| `primary-800` | `#00877a` | Dark accents |
| `primary-900` | `#006156` | Very dark |
| `primary-950` | `#004a42` | Darkest |

```css
/* Usage */
.btn-primary { background: var(--primary-500); }
.btn-primary:hover { background: var(--primary-600); }
.btn-primary:active { background: var(--primary-700); }
```

#### Secondary (Purple)
Secondary color for accents and complementary elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary-50` | `#f5f3ff` | Light backgrounds |
| `secondary-100` | `#ede9fe` | Very light |
| `secondary-200` | `#ddd6fe` | Light |
| `secondary-300` | `#c4b5fd` | Light accent |
| `secondary-400` | `#a78bfa` | Medium light |
| `secondary-500` | `#9f7aea` | **Main secondary** |
| `secondary-600` | `#805ad5` | Hover states |
| `secondary-700` | `#6b46c1` | Active states |
| `secondary-800` | `#553c9a` | Dark accent |
| `secondary-900` | `#44337a` | Very dark |

### Semantic Colors

#### Success (Green)
For positive feedback, confirmation, and success states.

| Token | Hex | WCAG AA |
|-------|-----|---------|
| `success-50` | `#ecfdf5` | Background |
| `success-500` | `#10b981` | **Default** (4.5:1 on white) |
| `success-600` | `#059669` | Hover |
| `success-700` | `#047857` | Active |

#### Warning (Amber)
For caution messages and warnings.

| Token | Hex | Note |
|-------|-----|------|
| `warning-50` | `#fffbeb` | Background |
| `warning-500` | `#f59e0b` | **Default** |
| `warning-600` | `#d97706` | Hover |
| `warning-700` | `#b45309` | Active |

#### Error (Red)
For error states and destructive actions.

| Token | Hex | WCAG AA |
|-------|-----|---------|
| `error-50` | `#fef2f2` | Background |
| `error-500` | `#ef4444` | **Default** (4.5:1 on white) |
| `error-600` | `#dc2626` | Hover |
| `error-700` | `#b91c1c` | Active |

#### Info (Blue)
For informational messages.

| Token | Hex | WCAG AA |
|-------|-----|---------|
| `info-50` | `#eff6ff` | Background |
| `info-500` | `#3b82f6` | **Default** |
| `info-600` | `#2563eb` | Hover |
| `info-700` | `#1d4ed8` | Active |

### Gray Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#f9fafb` | Page backgrounds |
| `gray-100` | `#f3f4f6` | Card backgrounds |
| `gray-200` | `#e5e7eb` | Borders (light) |
| `gray-300` | `#d1d5db` | Borders (medium) |
| `gray-400` | `#9ca3af` | Placeholder text |
| `gray-500` | `#6b7280` | Muted text |
| `gray-600` | `#4b5563` | Secondary text |
| `gray-700` | `#374151` | Body text (dark) |
| `gray-800` | `#1f2937` | **Primary text** |
| `gray-900` | `#111827` | Headings |
| `gray-950` | `#030712` | Darkest |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `#1f2937` | Main body text |
| `text-secondary` | `#4b5563` | Secondary text |
| `text-tertiary` | `#9ca3af` | Placeholder, hints |
| `text-muted` | `#6b7280` | Less important |
| `text-inverted` | `#ffffff` | On dark backgrounds |

### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `border-light` | `#e5e7eb` | Subtle dividers |
| `border-medium` | `#d1d5db` | Default borders |
| `border-strong` | `#9ca3af` | Emphasis borders |

---

## Typography

### Font Families

```css
--font-sans: 'Noto Sans KR', 'Inter', system-ui, -apple-system, sans-serif;
--font-heading: 'Noto Sans KR', 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### Heading Scale

| Class | Size | Line Height | Weight | Letter Spacing |
|-------|------|-------------|--------|----------------|
| `text-display-2xl` | 72px | 1.1 | 800 | -0.03em |
| `text-display-xl` | 60px | 1.1 | 800 | -0.025em |
| `text-display-lg` | 48px | 1.15 | 700 | -0.02em |
| `text-h1` | 40px | 1.2 | 700 | -0.02em |
| `text-h2` | 32px | 1.25 | 700 | -0.015em |
| `text-h3` | 28px | 1.3 | 600 | -0.01em |
| `text-h4` | 24px | 1.35 | 600 | -0.005em |
| `text-h5` | 20px | 1.4 | 600 | 0 |
| `text-h6` | 18px | 1.45 | 600 | 0 |

### Body Scale

| Class | Size | Line Height | Weight |
|-------|------|-------------|--------|
| `text-body-xl` | 20px | 1.75 | 400 |
| `text-body-lg` | 18px | 1.75 | 400 |
| `text-body` | 16px | 1.6 | 400 |
| `text-body-sm` | 14px | 1.5 | 400 |
| `text-body-xs` | 12px | 1.5 | 400 |

### UI Text

| Class | Size | Weight | Use Case |
|-------|------|--------|----------|
| `text-label` | 14px | 500 | Form labels |
| `text-caption` | 12px | 400 | Captions |
| `text-overline` | 12px | 600 | Overlines (uppercase) |
| `text-button` | 14px | 600 | Buttons |
| `text-button-sm` | 12px | 600 | Small buttons |
| `text-button-lg` | 16px | 600 | Large buttons |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `thin` | 100 | Decorative |
| `extralight` | 200 | Light headings |
| `light` | 300 | Subtle text |
| `normal` | 400 | Body text |
| `medium` | 500 | Emphasis |
| `semibold` | 600 | Headings, labels |
| `bold` | 700 | Strong emphasis |
| `extrabold` | 800 | Display text |
| `black` | 900 | Maximum emphasis |

---

## Spacing

Based on a 4px grid system (0.25rem base unit).

| Token | Value | Pixels |
|-------|-------|--------|
| `0.5` | 0.125rem | 2px |
| `1` | 0.25rem | 4px |
| `1.5` | 0.375rem | 6px |
| `2` | 0.5rem | 8px |
| `2.5` | 0.625rem | 10px |
| `3` | 0.75rem | 12px |
| `4` | 1rem | 16px |
| `5` | 1.25rem | 20px |
| `6` | 1.5rem | 24px |
| `8` | 2rem | 32px |
| `10` | 2.5rem | 40px |
| `12` | 3rem | 48px |
| `16` | 4rem | 64px |
| `20` | 5rem | 80px |
| `24` | 6rem | 96px |

### Component Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `card-padding` | 24px | Card internal padding |
| `card-padding-sm` | 16px | Compact card padding |
| `section-gap` | 32px | Between sections |
| `page-padding` | 24px | Page margins |
| `page-padding-lg` | 32px | Larger page margins |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | No rounding |
| `xs` | 2px | Minimal |
| `sm` | 4px | Small elements |
| `DEFAULT` | 8px | Default |
| `md` | 8px | Medium |
| `lg` | 12px | Cards, dialogs |
| `xl` | 16px | Large cards |
| `2xl` | 20px | Extra large |
| `3xl` | 24px | Modals |
| `4xl` | 32px | Very large |
| `full` | 9999px | Pills, circles |

### Component Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `button` | 12px | Buttons |
| `button-sm` | 8px | Small buttons |
| `button-lg` | 16px | Large buttons |
| `input` | 12px | Form inputs |
| `card` | 16px | Cards |
| `card-lg` | 24px | Large cards |
| `badge` | 9999px | Badges (pill) |
| `tag` | 6px | Tags |

---

## Shadows

### Elevation Scale

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.1)` | Small elevation |
| `shadow` | `0 4px 6px rgba(0,0,0,0.1)` | Default |
| `shadow-md` | `0 10px 15px rgba(0,0,0,0.1)` | Medium |
| `shadow-lg` | `0 20px 25px rgba(0,0,0,0.1)` | Large |
| `shadow-xl` | `0 25px 50px rgba(0,0,0,0.25)` | Extra large |
| `shadow-2xl` | `0 35px 60px rgba(0,0,0,0.3)` | Maximum |

### Design System Shadows

| Token | Usage |
|-------|-------|
| `shadow-soft` | Cards, subtle containers |
| `shadow-medium` | Hover states, elevated cards |
| `shadow-hard` | Prominent elevation |
| `shadow-elevated` | Maximum depth |

### Component Shadows

| Token | Usage |
|-------|-------|
| `shadow-card` | Default card shadow |
| `shadow-card-hover` | Card hover state |
| `shadow-button` | Button resting |
| `shadow-button-hover` | Button hover |
| `shadow-dropdown` | Dropdown menus |
| `shadow-modal` | Modal dialogs |
| `shadow-popover` | Popovers, tooltips |

### Glow Effects

| Token | Color | Usage |
|-------|-------|-------|
| `shadow-glow-primary` | Primary | Focus states, emphasis |
| `shadow-glow-secondary` | Secondary | Accent glow |
| `shadow-glow-error` | Error | Error emphasis |
| `shadow-glow-success` | Success | Success emphasis |

---

## Animations

### Timing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful interactions |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Springy feel |
| `ease-snappy` | `cubic-bezier(0.16, 1, 0.3, 1)` | Quick, snappy |

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `duration-75` | 75ms | Micro interactions |
| `duration-100` | 100ms | Quick transitions |
| `duration-150` | 150ms | Button clicks |
| `duration-200` | 200ms | Standard transitions |
| `duration-300` | 300ms | Content changes |
| `duration-500` | 500ms | Slow transitions |

### Animation Presets

| Animation | Duration | Usage |
|-----------|----------|-------|
| `animate-fade-in` | 200ms | Content appearance |
| `animate-fade-in-up` | 300ms | Staggered lists |
| `animate-scale-in` | 200ms | Modal entry |
| `animate-slide-up` | 300ms | Bottom sheets |
| `animate-slide-down` | 300ms | Dropdowns |
| `animate-shimmer` | 2s loop | Skeleton loading |
| `animate-pulse` | 2s loop | Attention |
| `animate-spin` | 1s loop | Loading spinner |

---

## Breakpoints

Mobile-first responsive design.

| Token | Min Width | Target |
|-------|-----------|--------|
| `xs` | 375px | Mobile S (iPhone SE) |
| `sm` | 640px | Mobile L |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / Desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |
| `3xl` | 1920px | Extra large |

### Max-width Variants

| Token | Max Width | Usage |
|-------|-----------|-------|
| `max-xs` | 374px | Below mobile S |
| `max-sm` | 639px | Mobile only |
| `max-md` | 767px | Below tablet |
| `max-lg` | 1023px | Below desktop |

### Input Variants

| Token | Query | Usage |
|-------|-------|-------|
| `touch` | `(hover: none) and (pointer: coarse)` | Touch devices |
| `pointer` | `(hover: hover) and (pointer: fine)` | Mouse devices |

---

## Z-Index

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Default stacking |
| `z-above` | 10 | Above content |
| `z-dropdown` | 1000 | Dropdown menus |
| `z-sticky` | 1020 | Sticky headers |
| `z-fixed` | 1030 | Fixed elements |
| `z-drawer` | 1040 | Side drawers |
| `z-modal-backdrop` | 1050 | Modal overlay |
| `z-modal` | 1060 | Modal content |
| `z-popover` | 1070 | Popovers |
| `z-tooltip` | 1080 | Tooltips |
| `z-toast` | 1090 | Toast notifications |
| `z-max` | 9999 | Maximum priority |

---

## Touch Targets

Minimum sizes for accessibility.

| Token | Size | Platform |
|-------|------|----------|
| `min-h-touch` | 44px | iOS minimum |
| `min-w-touch` | 44px | iOS minimum |
| `min-h-touch-android` | 48px | Material Design |
| `min-w-touch-android` | 48px | Material Design |
| `min-h-touch-sm` | 36px | Compact UI |

---

## Container

| Screen | Max Width | Padding |
|--------|-----------|---------|
| Default | - | 16px |
| `sm` | 640px | 24px |
| `md` | 768px | 24px |
| `lg` | 1024px | 32px |
| `xl` | 1280px | 40px |
| `2xl` | 1400px | 48px |

```html
<div class="container">
  <!-- Centered with responsive padding -->
</div>
```

---

## CSS Variables Reference

All semantic colors are available as HSL CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 220 13% 13%;
  --card: 0 0% 100%;
  --card-foreground: 220 13% 13%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 13% 13%;
  --primary: 174 100% 39%;
  --primary-foreground: 0 0% 100%;
  --secondary: 262 48% 70%;
  --secondary-foreground: 0 0% 100%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --accent: 220 14% 96%;
  --accent-foreground: 220 13% 13%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 174 100% 39%;
  --radius: 0.5rem;
}
```

Usage:
```css
.element {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```
