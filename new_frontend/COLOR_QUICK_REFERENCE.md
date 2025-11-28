# CareGuide Color Quick Reference Card

## At a Glance

### Primary Actions → Teal or Blue
```tsx
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Brand Action (Teal)
</button>

<button className="bg-secondary-600 hover:bg-secondary-700 text-white">
  Medical Action (Blue)
</button>
```

### Text Colors
```tsx
<h1 className="text-careplus-text-primary">Heading</h1>
<p className="text-careplus-text-secondary">Body text</p>
<span className="text-careplus-text-tertiary">Muted text</span>
```

### Status Messages
```tsx
<div className="bg-success-100 border-success-600 text-success-700">✓ Success</div>
<div className="bg-warning-100 border-warning-600 text-warning-700">⚠️ Warning</div>
<div className="bg-error-100 border-error-500 text-error-600">✗ Error</div>
<div className="bg-info-100 border-info-600 text-info-700">ⓘ Info</div>
```

---

## Color Scales

### Primary (Teal) - Brand
```
50  #E0F7F5  ▓░░░░░░░░░  Lightest bg
100 #B3EDE8  ▓▓░░░░░░░░  Light bg
200 #80E2DA  ▓▓▓░░░░░░░  Hover bg
300 #4DD7CC  ▓▓▓▓░░░░░░  Borders
400 #26D0C2  ▓▓▓▓▓░░░░░  Icons
500 #00C9B7  ▓▓▓▓▓▓░░░░  UI (3.9:1)
600 #00B3A3  ▓▓▓▓▓▓▓░░░  Text/Buttons ✓ (4.5:1)
700 #00A899  ▓▓▓▓▓▓▓▓░░  Active (5.1:1)
800 #008C80  ▓▓▓▓▓▓▓▓▓░  High contrast (6.3:1)
900 #006B62  ▓▓▓▓▓▓▓▓▓▓  Darkest (8.1:1 AAA)
```

### Secondary (Blue) - Professional
```
50  #EBF5FF  ░▓░░░░░░░░  Lightest bg
100 #D1E9FF  ░▓▓░░░░░░░  Light bg
200 #B3D9FF  ░▓▓▓░░░░░░  Hover bg
300 #84C5FF  ░▓▓▓▓░░░░░  Borders
400 #53A8FF  ░▓▓▓▓▓░░░░  Icons
500 #2B87F5  ░▓▓▓▓▓▓░░░  UI (4.2:1)
600 #0066CC  ░▓▓▓▓▓▓▓░░  Text/Buttons ✓ (7.3:1 AAA)
700 #0052A3  ░▓▓▓▓▓▓▓▓░  Active (9.1:1 AAA)
800 #003D7A  ░▓▓▓▓▓▓▓▓▓  Very dark
900 #002952  ░▓▓▓▓▓▓▓▓▓  Darkest
```

### Success (Green)
```
600 #059669  ✓ PREFERRED (6.4:1 AA)
700 #047857  ✓ High contrast (8.5:1 AAA)
```

### Warning (Amber)
```
600 #D97706  ⚠️ PREFERRED (5.1:1 AA)
700 #B45309  ⚠️ High contrast (7.2:1 AAA)
```

### Error (Red)
```
500 #DC2626  ✗ PREFERRED (5.9:1 AA)
600 #B91C1C  ✗ High contrast (7.8:1 AAA)
```

### Info (Blue)
```
600 #2563EB  ⓘ PREFERRED (6.3:1 AA)
700 #1D4ED8  ⓘ High contrast (8.1:1 AAA)
```

---

## Decision Tree

### "What color should I use?"

```
Is it the PRIMARY action?
├─ Yes → Brand-focused? → primary-600 (Teal)
└─ Yes → Medical-focused? → secondary-600 (Blue)

Is it a status message?
├─ Positive/Success? → success-600 (Green) + ✓ icon
├─ Caution/Warning? → warning-600 (Amber) + ⚠️ icon
├─ Error/Danger? → error-500 (Red) + ✗ icon
└─ Info/Neutral? → info-600 (Blue) + ⓘ icon

Is it text?
├─ Heading? → text-careplus-text-primary
├─ Body? → text-careplus-text-secondary
├─ Caption? → text-careplus-text-tertiary
└─ Link? → text-primary-600 or text-secondary-600

Is it a background?
├─ Card? → bg-white
├─ Page? → bg-careplus-bg
└─ Subtle? → bg-careplus-surface

Is it a border?
├─ Strong? → border-careplus-border-strong
├─ Normal? → border-careplus-border
└─ Light? → border-careplus-border-light
```

---

## Common Patterns

### Navigation (Active)
```tsx
className="bg-primary-100 text-primary-600 border-l-4 border-primary-600"
```

### Navigation (Inactive)
```tsx
className="text-neutral-500 hover:bg-neutral-100 hover:text-primary-600"
```

### Card
```tsx
className="bg-white border border-neutral-200 rounded-2xl hover:shadow-lg hover:border-primary-200"
```

### Input (Normal)
```tsx
className="border border-neutral-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
```

### Input (Error)
```tsx
className="border border-error-500 focus:border-error-600 focus:ring-2 focus:ring-error-100"
```

### Badge
```tsx
className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full"
```

---

## Accessibility Checklist

Before using any color:

- [ ] **Contrast:** Does it meet 4.5:1 for text, 3:1 for UI?
- [ ] **Icon:** Is there an icon alongside the color?
- [ ] **Label:** Is there a text label explaining the color meaning?
- [ ] **Pattern:** For charts/graphs, is there a pattern alternative?
- [ ] **High Contrast:** Will it work in high contrast mode?
- [ ] **Color-blind:** Is it distinguishable in color-blind modes?

---

## Don't Forget

### Always Add Icons to Semantic Colors
```tsx
// ❌ BAD
<div className="text-success-600">Success</div>

// ✅ GOOD
<div className="text-success-600 flex items-center gap-2">
  <CheckCircle className="w-4 h-4" />
  Success
</div>
```

### Always Test Contrast
```tsx
// ❌ BAD - Low contrast
<button className="bg-primary-400 text-white">

// ✅ GOOD - High contrast
<button className="bg-primary-600 text-white">
```

### Always Provide Text Alternative
```tsx
// ❌ BAD - Icon only
<span className="text-error-500">
  <XCircle />
</span>

// ✅ GOOD - Icon + label + aria
<span className="text-error-500 flex items-center gap-1">
  <XCircle aria-hidden="true" />
  <span>Error:</span> Message failed
</span>
```

---

## When in Doubt

1. **Check the guide:** `/new_frontend/COLOR_USAGE_GUIDE.md`
2. **Test contrast:** https://webaim.org/resources/contrastchecker/
3. **Use these defaults:**
   - Primary action: `bg-primary-600` (Teal) or `bg-secondary-600` (Blue)
   - Text: `text-careplus-text-primary` or `text-careplus-text-secondary`
   - Border: `border-neutral-200`
   - Background: `bg-white` or `bg-careplus-surface`

4. **Ask yourself:**
   - Will this work for color-blind users?
   - Is the contrast high enough?
   - Is there a non-color indicator (icon/text)?
   - Does it match the healthcare brand?

---

## Resources

- **Full Guide:** `/new_frontend/COLOR_USAGE_GUIDE.md`
- **Audit Report:** `/new_frontend/COLOR_SYSTEM_AUDIT.md`
- **Implementation:** `/new_frontend/COLOR_SYSTEM_IMPLEMENTATION_SUMMARY.md`
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Color-blind Simulator:** Chrome DevTools > Rendering > Emulate vision deficiencies

---

**Last Updated:** 2025-11-28
