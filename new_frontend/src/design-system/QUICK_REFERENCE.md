# CarePlus Design System - Quick Reference Guide

## Design Tokens

### Colors

```typescript
// Use these Tailwind classes instead of hardcoded values

// Primary Colors
bg-primary-500    // Main primary: #00C9B7
text-primary-600  // Hover/emphasis
bg-primary-100    // Light background
text-primary-700  // Dark text on light bg

// Accent Colors
text-accent-purple   // #9F7AEA

// Text Hierarchy
text-gray-900     // Primary text (headings, important content)
text-gray-600     // Secondary text (body, descriptions)
text-gray-500     // Tertiary text (captions, metadata)
text-gray-400     // Disabled text

// Borders
border-gray-100   // Light borders
border-gray-200   // Medium borders

// Backgrounds
bg-white          // Cards, modals
bg-gray-50        // Subtle backgrounds
bg-[#F2FFFD]      // Input bar (--color-input-bar)
```

### CSS Variables (Use for special cases)

```css
var(--color-primary)           /* #00C9B7 */
var(--color-primary-hover)     /* #00B3A3 */
var(--gradient-primary)        /* Linear gradient teal to purple */
var(--color-input-bar)         /* #F2FFFD */
```

### Spacing

```typescript
// Cards & Sections
p-6              // Card padding
p-8              // Page section padding
gap-6            // Grid/flex gap
space-y-6        // Vertical spacing between sections

// Modals
p-6              // Modal content padding
px-6 py-4        // Modal header/footer padding
gap-4            // Modal internal gaps

// Buttons & Inputs
px-6 py-3        // Standard button/input padding
px-4 py-2        // Small button padding
```

### Border Radius

```typescript
rounded-2xl      // Cards (16px)
rounded-xl       // Buttons, inputs, smaller cards (12px)
rounded-lg       // Stat cards (10.25px)
rounded-full     // Badges, avatars
```

### Shadows

```typescript
shadow-sm                 // Default card shadow
hover:shadow-md          // Card hover state
shadow-xl                // Modals
```

### Icon Sizes

```typescript
// Standard sizes
<Icon size={16} />   // Small inline icons
<Icon size={20} />   // Menu items, buttons
<Icon size={24} />   // Section headers, modal headers
<Icon size={32} />   // Large decorative
<Icon size={48} />   // Empty states
```

---

## Component Classes

### Buttons

```tsx
// Primary Action (with gradient)
<button className="btn-primary-action">
  Click me
</button>

// Primary Solid
<button className="btn-primary">
  Click me
</button>

// Secondary (outlined)
<button className="btn-secondary">
  Click me
</button>

// Ghost (transparent)
<button className="btn-ghost">
  Cancel
</button>

// Danger (custom - to be standardized)
<button className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100">
  Delete
</button>
```

### Inputs

```tsx
<input
  type="text"
  className="input-field"
  placeholder="Enter text..."
/>

// With focus state (automatic)
// - border-color: var(--color-primary)
// - background: var(--color-input-bar)
```

### Badges

```tsx
<span className="badge badge-free">자유</span>
<span className="badge badge-challenge">챌린지</span>
<span className="badge badge-survey">설문조사</span>
<span className="badge badge-patient">환우</span>
<span className="badge badge-researcher">연구자</span>

// Custom badge
<span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
  Custom
</span>
```

### Cards

```tsx
// Standard card
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  Content
</div>

// Interactive card
<div className="card-interactive">
  Content
</div>

// Using card class
<div className="card p-6">
  Content
</div>
```

### Tabs

```tsx
// Selected tab
<button className="tab-selected">
  Active Tab
</button>

// Unselected tab
<button className="tab-unselected">
  Inactive Tab
</button>
```

---

## Common Patterns

### Modal Structure

```tsx
{isOpen && (
  <>
    {/* Backdrop */}
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
    />

    {/* Modal */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Title</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Your content */}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary flex-1">Save</button>
        </div>
      </div>
    </div>
  </>
)}
```

### MenuItem Pattern

```tsx
const MenuItem = ({ icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
  >
    <div className="flex items-center gap-4">
      <div className="text-gray-400 group-hover:text-primary-600 transition-colors">
        {icon}
      </div>
      <span className="text-gray-700 font-medium">{label}</span>
    </div>

    {badge && (
      <span className="px-2.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
        {badge}
      </span>
    )}
  </button>
);
```

### Stat Card Pattern

```tsx
<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
  <span className="text-gray-600 flex items-center gap-2">
    <Icon size={16} className="text-primary-500" />
    Label
  </span>
  <span className="font-semibold text-gray-900">Value</span>
</div>
```

### Avatar Pattern

```tsx
<div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
  {initials}
</div>
```

---

## Typography

### Headings

```tsx
<h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
<h2 className="text-2xl font-bold text-gray-900">Section Title</h2>
<h3 className="text-xl font-semibold text-gray-900">Subsection</h3>
<h4 className="text-lg font-semibold text-gray-900">Card Title</h4>
```

### Body Text

```tsx
<p className="text-base text-gray-600">Body text</p>
<p className="text-sm text-gray-500">Caption text</p>
<p className="text-xs text-gray-400">Metadata</p>
```

---

## Do's and Don'ts

### DO ✅

```tsx
// Use design system classes
<button className="btn-primary">Click me</button>

// Use consistent spacing
<div className="p-6 space-y-6">

// Use CSS variables for gradients
style={{ background: 'var(--gradient-primary)' }}

// Use Tailwind color classes
<p className="text-gray-600">

// Use consistent icon sizes
<User size={20} />
```

### DON'T ❌

```tsx
// Don't create custom button styles inline
<button className="px-4 py-2 bg-blue-500 text-white rounded">

// Don't use inconsistent spacing
<div className="p-4 space-y-3">  // Should be p-6 space-y-6 for cards

// Don't use hardcoded colors
<div style={{ color: '#666666' }}>

// Don't use arbitrary CSS variable references
<div className="border-[var(--some-random-var)]">

// Don't use inconsistent icon sizes
<User size={22} />  // Should be 16, 20, 24, 32, or 48
```

---

## Migration Examples

### Before/After: Button

```tsx
// ❌ Before
<button className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center">
  <LogOut size={18} className="mr-2" /> 로그아웃
</button>

// ✅ After (once Button component is available)
<Button variant="danger" fullWidth icon={<LogOut size={18} />}>
  로그아웃
</Button>
```

### Before/After: Color Usage

```tsx
// ❌ Before
<div className="border-[var(--color-line-medium)]">

// ✅ After
<div className="border-gray-100">
```

### Before/After: MenuItem

```tsx
// ❌ Before (duplicated code)
<button className="w-full px-6 py-4 flex items-center hover:bg-gray-50">
  <div className="text-gray-400 mr-4">{icon}</div>
  <span className="text-gray-700">{label}</span>
</button>

// ✅ After (once component is extracted)
<MenuItem icon={icon} label={label} onClick={handleClick} />
```

---

## Quick Checklist for New Components

- [ ] Use `btn-*` classes for buttons (not custom styles)
- [ ] Use Tailwind color classes (not hardcoded values)
- [ ] Use standard spacing (`p-6`, `gap-6` for cards)
- [ ] Use `rounded-2xl` for cards, `rounded-xl` for buttons/inputs
- [ ] Use standard icon sizes (16, 20, 24, 32, 48)
- [ ] Use `text-gray-900` for headings, `text-gray-600` for body
- [ ] Use `shadow-sm` for cards, `shadow-xl` for modals
- [ ] Include hover states with `transition-colors` or `transition-all`
- [ ] Use `group` and `group-hover:` for interactive elements

---

## Common Component Recipes

### Action Button with Icon

```tsx
<button className="btn-primary flex items-center gap-2">
  <Icon size={20} />
  Button Text
</button>
```

### Section Header

```tsx
<div className="flex items-center gap-2 mb-4">
  <Icon className="text-primary-600" size={24} />
  <h3 className="font-bold text-gray-900">Section Title</h3>
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon size={48} className="text-gray-300 mb-4" />
  <p className="text-gray-500">No items found</p>
</div>
```

### Loading Button

```tsx
<button className="btn-primary" disabled={isLoading}>
  {isLoading && <Loader2 size={18} className="animate-spin mr-2" />}
  Submit
</button>
```

---

## Resources

- **Full Analysis**: See `DESIGN_SYSTEM_ANALYSIS.md` in project root
- **Tailwind Config**: `/new_frontend/tailwind.config.js`
- **CSS Variables**: `/new_frontend/src/index.css` (lines 34-73)
- **Component Styles**: `/new_frontend/src/index.css` (lines 118+)

---

## Getting Help

**Common Questions**:

1. **Which button class should I use?**
   - Primary action: `btn-primary`
   - Secondary action: `btn-secondary`
   - Cancel/back: `btn-ghost`
   - Delete/dangerous: Custom red styles (to be standardized)

2. **What spacing should I use?**
   - Cards/sections: `p-6`, `gap-6`
   - Modals: `px-6 py-4`, `gap-4`
   - Dense layouts: `p-3`, `gap-3`

3. **What color should my text be?**
   - Headings: `text-gray-900`
   - Body: `text-gray-600`
   - Captions: `text-gray-500`
   - Disabled: `text-gray-400`

4. **How do I use the gradient?**
   ```tsx
   style={{ background: 'var(--gradient-primary)' }}
   ```

---

Last Updated: 2025-11-27
