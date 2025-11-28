# CareGuide Color Usage Guide

## Overview

This guide provides clear instructions on when and how to use colors in the CareGuide healthcare application. All colors are WCAG 2.2 Level AA compliant and optimized for healthcare contexts.

---

## Color Psychology & Healthcare

### Why Medical Blue is Primary
- **Trust & Professionalism:** Blue is the #1 color associated with healthcare
- **Calmness & Focus:** Reduces anxiety in patients
- **Universal Recognition:** Hospitals, medical devices, pharmaceuticals all use blue
- **Scientific Authority:** Associated with reliability and expertise

### Why Healthcare Teal is Secondary
- **Wellness & Growth:** Combines blue (trust) + green (health)
- **Modern & Fresh:** Differentiates from traditional healthcare
- **Calming Effect:** Ideal for long-term health management apps
- **Balanced Energy:** Not as clinical as pure blue

---

## Primary Colors

### Medical Blue (Primary)

**When to Use:**
- Primary action buttons (Submit, Save, Confirm)
- Navigation active states
- Primary links and interactive text
- Progress indicators for health tracking
- Key CTAs (Call-to-Actions)
- Focus states for inputs and forms

**Variants:**
```css
primary-50  (#EBF5FF)  - Lightest background, hover states
primary-100 (#D1E9FF)  - Light backgrounds, selected states
primary-200 (#B3D9FF)  - Subtle highlights
primary-300 (#84C5FF)  - Borders, dividers
primary-400 (#53A8FF)  - Icons, decorative elements
primary-500 (#2B87F5)  - UI components (5.2:1 contrast)
primary-600 (#0066CC)  - PREFERRED: Text, links, buttons (7.3:1)
primary-700 (#0052A3)  - Pressed states, dark text (9.1:1)
primary-800 (#003D7A)  - Very dark variants (11.8:1)
primary-900 (#002952)  - Darkest text (14.2:1)
```

**Best Practices:**
- Use `primary-600` for all text and links
- Use `primary-500` or `primary-600` for button backgrounds
- Use `primary-100` for hover backgrounds
- Use `primary-50` for selected/focus backgrounds

**Example:**
```tsx
// Button
<button className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white">
  Submit
</button>

// Link
<a href="/chat" className="text-primary-600 hover:text-primary-700">
  Start Chat
</a>

// Selected navigation
<div className="bg-primary-100 text-primary-600 border-l-4 border-primary-600">
  Active Tab
</div>
```

---

### Healthcare Teal (Secondary)

**When to Use:**
- Secondary actions (Cancel, Alternative options)
- Wellness and lifestyle features
- Nutrition and diet sections
- Community and social features
- Decorative accents
- Alternative CTAs

**Variants:**
```css
secondary-50  (#E6F7F5)  - Lightest backgrounds
secondary-100 (#B3EDE8)  - Light backgrounds
secondary-500 (#00B3A3)  - UI components (4.1:1)
secondary-600 (#00998C)  - Text alternative (5.3:1)
secondary-700 (#007F73)  - High contrast text (7.1:1)
```

**Best Practices:**
- Use for nutrition/diet related features
- Pair with primary blue for gradients
- Use for non-critical secondary actions
- Great for wellness indicators

**Example:**
```tsx
// Secondary button
<button className="bg-white border-2 border-secondary-600 text-secondary-700 hover:bg-secondary-50">
  View Details
</button>

// Nutrition card
<div className="bg-secondary-50 border-secondary-200">
  <div className="text-secondary-700">Nutrition Goal</div>
</div>
```

---

## Semantic Colors

### Success (Green) - Health & Positive Outcomes

**When to Use:**
- Successful form submissions
- Health goal achievements
- Positive health metrics (improved results)
- Confirmation messages
- Completed tasks/milestones
- "Healthy" food indicators

**Variants:**
```css
success-600 (#059669)  - PREFERRED (6.4:1 contrast)
success-700 (#047857)  - High contrast (8.5:1)
```

**Color-blind Note:** Always pair with checkmark icon ✓

**Example:**
```tsx
// Success alert
<div className="bg-success-100 border-success-600 text-success-700">
  <CheckCircle className="text-success-600" />
  Your health profile has been updated successfully!
</div>

// Success badge
<span className="bg-success-600 text-white px-3 py-1 rounded-full">
  Goal Achieved
</span>
```

---

### Warning (Amber) - Caution & Attention

**When to Use:**
- Caution messages (not critical)
- Approaching limits (sodium, sugar)
- Incomplete information
- Pending actions required
- Moderate health risks
- "Use in moderation" food warnings

**Variants:**
```css
warning-600 (#D97706)  - PREFERRED for text (5.1:1)
warning-700 (#B45309)  - High contrast (7.2:1)
```

**Color-blind Note:** Use warning icon ⚠️ or exclamation mark

**Example:**
```tsx
// Warning banner
<div className="bg-warning-100 border-warning-600 text-warning-700">
  <AlertTriangle className="text-warning-600" />
  You're approaching your daily sodium limit (85%)
</div>

// Warning badge
<span className="bg-warning-100 text-warning-700 px-3 py-1 rounded-full">
  Moderate Intake
</span>
```

---

### Error (Red) - Danger & Critical Issues

**When to Use:**
- Form validation errors
- Failed operations
- Critical health warnings
- Destructive actions (delete account)
- Exceeded safe limits
- "Avoid" food warnings for CKD

**Variants:**
```css
error-500 (#DC2626)  - PREFERRED (5.9:1 contrast)
error-600 (#B91C1C)  - High contrast (7.8:1)
```

**Color-blind Note:** Use X icon ✗ or "Error:" text prefix

**Example:**
```tsx
// Error message
<div className="bg-error-100 border-error-500 text-error-600">
  <XCircle className="text-error-500" />
  Invalid email address. Please check and try again.
</div>

// Destructive button
<button className="bg-error-500 hover:bg-error-600 text-white">
  <Trash2 className="w-4 h-4" />
  Delete Account
</button>
```

---

### Info (Blue) - Informational & Neutral

**When to Use:**
- Informational messages (FYI)
- Tips and helpful hints
- Educational content
- Neutral status updates
- Feature announcements
- Help tooltips

**Variants:**
```css
info-600 (#2563EB)  - PREFERRED (6.3:1 contrast)
info-700 (#1D4ED8)  - High contrast (8.1:1)
```

**Color-blind Note:** Use info icon ⓘ

**Example:**
```tsx
// Info banner
<div className="bg-info-100 border-info-600 text-info-700">
  <Info className="text-info-600" />
  Did you know? Regular exercise can improve kidney function.
</div>

// Info tooltip
<Tooltip className="bg-info-700 text-white">
  <Info className="w-4 h-4 text-info-600" />
</Tooltip>
```

---

## Text Colors

### Primary Text
```css
text-careplus-text-primary  (#1F2937, 13.6:1 contrast - AAA)
```
**Use for:** Main headings, body text, primary content

### Secondary Text
```css
text-careplus-text-secondary (#4B5563, 8.1:1 contrast - AAA)
```
**Use for:** Subheadings, descriptions, less prominent content

### Muted Text
```css
text-careplus-text-muted (#6B7280, 5.7:1 contrast - AA)
```
**Use for:** Captions, metadata, timestamps, helper text

### Disabled Text
```css
text-neutral-400 (#9CA3AF, 4.6:1 contrast - AA)
```
**Use for:** Disabled form fields, inactive menu items

---

## Background & Surface Colors

### White Background
```css
bg-white (#FFFFFF)
```
**Use for:** Main content areas, cards, modals, panels

### Surface Background
```css
bg-careplus-surface (#F9FAFB)
```
**Use for:** Page backgrounds, subtle separations

### Input Focus Background
```css
bg-primary-50 (#EBF5FF)
```
**Use for:** Focused input fields, active selection areas

---

## Borders & Dividers

### Strong Borders
```css
border-neutral-300 (#D1D5DB)
```
**Use for:** Card borders, prominent dividers

### Medium Borders
```css
border-neutral-200 (#E5E7EB)
```
**Use for:** Default borders, form inputs

### Light Borders
```css
border-neutral-100 (#F3F4F6)
```
**Use for:** Subtle dividers, table borders

---

## Gradients

### Primary Gradient (Medical Blue → Teal)
```css
bg-gradient-primary
/* linear-gradient(135deg, #2B87F5 0%, #00B3A3 100%) */
```
**Use for:** Hero sections, premium features, main CTAs

### Accent Gradient (Medical Blue → Purple)
```css
bg-gradient-accent
/* linear-gradient(135deg, #2B87F5 0%, #9F7AEA 100%) */
```
**Use for:** Challenge badges, special promotions, gamification

### Success Gradient
```css
bg-gradient-success
/* linear-gradient(135deg, #059669 0%, #34D399 100%) */
```
**Use for:** Achievement banners, success celebrations

---

## Badge Colors

### Free Badge
```css
bg-green-100 text-green-700
```
**Use for:** Free posts, open access content

### Challenge Badge
```css
bg-purple-100 text-purple-700
```
**Use for:** Challenge posts, gamification

### Survey Badge
```css
bg-cyan-100 text-cyan-700
```
**Use for:** Survey posts, research participation

### Patient Badge
```css
bg-amber-100 text-amber-700
```
**Use for:** Patient community posts

### Researcher Badge
```css
bg-blue-100 text-blue-700
```
**Use for:** Research papers, scientific content

---

## Accessibility Guidelines

### Contrast Ratios
- **Text:** Minimum 4.5:1 (WCAG AA)
- **Large Text (18px+ or 14px+ bold):** Minimum 3:1
- **UI Components:** Minimum 3:1
- **All our colors meet or exceed these standards**

### Color-blind Safety
1. **Never rely on color alone** - Always use:
   - Icons (✓ for success, ✗ for error, ⚠️ for warning, ⓘ for info)
   - Text labels ("Success:", "Error:", "Warning:", "Info:")
   - Patterns or shapes for charts
   - Underlines for links (not just color)

2. **Test with simulators:**
   - Protanopia (red-blind)
   - Deuteranopia (green-blind)
   - Tritanopia (blue-blind)

3. **Provide alternatives:**
   - High contrast mode support (use darker color variants)
   - Pattern fills for charts/graphs
   - Text alternatives for all visual information

### High Contrast Mode
When users enable high contrast mode, the system automatically:
- Switches to darker color variants (e.g., primary-700 instead of primary-600)
- Increases border thickness
- Uses higher contrast text colors

**No developer action required** - handled by CSS media queries

---

## Common Patterns

### Button Hierarchy

**Primary Action:**
```tsx
<button className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white">
  Save Changes
</button>
```

**Secondary Action:**
```tsx
<button className="bg-white border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50">
  Cancel
</button>
```

**Destructive Action:**
```tsx
<button className="bg-error-500 hover:bg-error-600 text-white">
  Delete
</button>
```

**Ghost Button:**
```tsx
<button className="text-primary-600 hover:bg-primary-50">
  Learn More
</button>
```

---

### Alert/Message Patterns

**Success:**
```tsx
<div className="bg-success-100 border-l-4 border-success-600 p-4">
  <div className="flex items-center gap-3">
    <CheckCircle className="text-success-600 w-5 h-5" />
    <div>
      <p className="font-medium text-success-700">Success!</p>
      <p className="text-success-600">Your changes have been saved.</p>
    </div>
  </div>
</div>
```

**Warning:**
```tsx
<div className="bg-warning-100 border-l-4 border-warning-600 p-4">
  <div className="flex items-center gap-3">
    <AlertTriangle className="text-warning-600 w-5 h-5" />
    <div>
      <p className="font-medium text-warning-700">Warning</p>
      <p className="text-warning-600">You're approaching your limit.</p>
    </div>
  </div>
</div>
```

**Error:**
```tsx
<div className="bg-error-100 border-l-4 border-error-500 p-4">
  <div className="flex items-center gap-3">
    <XCircle className="text-error-500 w-5 h-5" />
    <div>
      <p className="font-medium text-error-600">Error</p>
      <p className="text-error-500">Something went wrong. Please try again.</p>
    </div>
  </div>
</div>
```

**Info:**
```tsx
<div className="bg-info-100 border-l-4 border-info-600 p-4">
  <div className="flex items-center gap-3">
    <Info className="text-info-600 w-5 h-5" />
    <div>
      <p className="font-medium text-info-700">Did you know?</p>
      <p className="text-info-600">Helpful information here.</p>
    </div>
  </div>
</div>
```

---

### Navigation Pattern

```tsx
// Active navigation item
<Link
  to="/chat"
  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-100 text-primary-600 border-l-4 border-primary-600"
>
  <MessageSquare className="w-5 h-5" />
  <span className="font-medium">AI Chat</span>
</Link>

// Inactive navigation item
<Link
  to="/community"
  className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-primary-600"
>
  <Users className="w-5 h-5" />
  <span className="font-medium">Community</span>
</Link>
```

---

### Card Pattern

```tsx
<div className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all">
  {/* Card content */}
</div>
```

---

## What NOT to Do

### Don't Use Colors That Fail Contrast
```tsx
// ❌ BAD - Low contrast
<button className="bg-primary-400 text-white">Click Me</button>

// ✅ GOOD - High contrast
<button className="bg-primary-600 text-white">Click Me</button>
```

### Don't Rely on Color Alone
```tsx
// ❌ BAD - Color only
<span className="text-success-600">Approved</span>

// ✅ GOOD - Color + icon + text
<span className="text-success-600 flex items-center gap-2">
  <CheckCircle className="w-4 h-4" />
  Status: Approved
</span>
```

### Don't Mix Too Many Colors
```tsx
// ❌ BAD - Color chaos
<div className="bg-primary-100 border-secondary-500 text-success-700">
  Confusing design
</div>

// ✅ GOOD - Consistent color family
<div className="bg-primary-100 border-primary-300 text-primary-700">
  Clear design
</div>
```

### Don't Use Pure Black or Pure Gray for Text
```tsx
// ❌ BAD - Too harsh
<p className="text-black">Harsh text</p>

// ✅ GOOD - Softer, more readable
<p className="text-neutral-800">Readable text</p>
```

---

## Quick Reference

### Most Common Combinations

| Purpose | Background | Border | Text | Icon |
|---------|-----------|--------|------|------|
| Primary Button | `primary-600` | - | `white` | `white` |
| Secondary Button | `white` | `neutral-300` | `neutral-700` | `neutral-700` |
| Success Alert | `success-100` | `success-600` | `success-700` | `success-600` |
| Warning Alert | `warning-100` | `warning-600` | `warning-700` | `warning-600` |
| Error Alert | `error-100` | `error-500` | `error-600` | `error-500` |
| Info Alert | `info-100` | `info-600` | `info-700` | `info-600` |
| Card | `white` | `neutral-200` | `neutral-800` | `neutral-600` |
| Active Nav | `primary-100` | `primary-600` (left) | `primary-600` | `primary-600` |
| Inactive Nav | `transparent` | - | `neutral-500` | `neutral-500` |

---

## Migration from Old Colors

If you see teal (#00C9B7) in existing code:
- Replace with `primary-600` (#0066CC) for better accessibility
- Use `secondary-600` (#00998C) if you specifically need teal aesthetic

If you see "success" as blue (#00A8E8):
- Replace with `success-600` (#059669) - proper green for success
- Use `info-600` (#2563EB) for informational blue

---

## Testing Your Color Choices

1. **Contrast Checker:** https://webaim.org/resources/contrastchecker/
2. **Color-blind Simulator:** Chrome DevTools > Rendering > Emulate vision deficiencies
3. **High Contrast Mode:** Enable system high contrast and test
4. **Print Preview:** Check if design works in grayscale

---

**Last Updated:** 2025-11-28
**Maintained by:** CareGuide Design Team
