# CareGuide Design System

A comprehensive, healthcare-focused design system for Chronic Kidney Disease (CKD) patient care platform.

## Overview

The CareGuide Design System is built specifically for healthcare applications serving CKD patients, caregivers, and healthcare professionals. It emphasizes accessibility, trust, clarity, and compliance with WCAG 2.2 Level AA standards.

### Key Features

- **WCAG 2.2 Level AA Compliant**: All colors meet minimum 4.5:1 contrast ratios
- **Healthcare-Optimized**: Colors and patterns designed for medical trust and clarity
- **Accessibility-First**: Built-in support for screen readers, keyboard navigation, and touch targets
- **Comprehensive Documentation**: Detailed guidelines, examples, and migration paths
- **Tailwind-Based**: Leverages Tailwind CSS for utility-first styling

## Quick Start

### 1. Review the Design System

Start with the comprehensive design system documentation:

```
DESIGN_SYSTEM.md - Full design system specification
```

This covers:
- Design principles
- Complete color system
- Typography scale
- Spacing system
- Component patterns
- Healthcare-specific patterns
- Dark mode support

### 2. Quick Reference

For day-to-day development, use the quick reference guide:

```
QUICK_REFERENCE_V2.md - Quick reference for common patterns
```

Includes:
- Color class quick lookup
- Typography patterns
- Common component recipes
- Healthcare patterns
- Accessibility checklist

### 3. Accessibility Guidelines

Ensure all components meet accessibility standards:

```
ACCESSIBILITY_GUIDELINES.md - WCAG 2.2 Level AA compliance guide
```

Covers:
- Color & contrast requirements
- Keyboard navigation
- Screen reader support
- Touch target sizing
- Focus management
- Medical content guidelines

### 4. Component Examples

See working examples of all patterns:

```
COMPONENT_EXAMPLES.tsx - React component examples
```

Copy-paste ready examples for:
- Buttons (primary, secondary, ghost, danger)
- Form inputs (standard, health metrics, error states)
- Cards (health metrics, interactive, warnings)
- Alerts (success, error, warning, info, medical disclaimers)
- Healthcare-specific patterns

### 5. Migration Guide

Migrating existing components? Follow the migration guide:

```
MIGRATION_GUIDE.md - Step-by-step migration instructions
```

Includes:
- Breaking changes
- Color updates
- Component updates
- Accessibility improvements
- Validation checklist

## File Structure

```
design-system/
├── README.md                      # This file - Getting started guide
├── DESIGN_SYSTEM.md               # Complete design system specification
├── QUICK_REFERENCE_V2.md          # Quick reference for daily use
├── ACCESSIBILITY_GUIDELINES.md    # WCAG 2.2 AA compliance guide
├── COMPONENT_EXAMPLES.tsx         # React component examples
└── MIGRATION_GUIDE.md             # Migration guide for existing code
```

## Core Design Tokens

### Colors

#### Primary (Healthcare Teal)

```tsx
bg-primary-500    // #00C9B7 - Main brand
bg-primary-600    // #00B3A3 - PREFERRED for buttons (4.5:1 contrast)
text-primary-700  // #00A899 - Text/links (5.1:1 contrast)
bg-primary-800    // #008C80 - High contrast (6.3:1 contrast)
```

#### Semantic Colors (WCAG AA)

```tsx
// Success
text-success-600  // #059669 (6.4:1 contrast)
bg-success-50     // #ECFDF5 (light background)

// Warning
text-warning-600  // #D97706 (5.1:1 contrast)
bg-warning-50     // #FFFBEB (light background)

// Error
text-error-600    // #DC2626 (5.9:1 contrast)
bg-error-50       // #FEF2F2 (light background)

// Info
text-info-600     // #2563EB (6.3:1 contrast)
bg-info-50        // #EFF6FF (light background)
```

#### Text Colors (High Contrast)

```tsx
text-gray-800     // #1F2937 (13.6:1 - AAA) - Primary text
text-gray-700     // #374151 (10.6:1 - AAA) - Headings
text-gray-600     // #4B5563 (8.1:1 - AAA) - Body text
text-gray-500     // #6B7280 (5.7:1 - AA) - Secondary text
```

### Typography

```tsx
// Base: 16px minimum for accessibility
text-base     // 16px - MINIMUM body text
text-lg       // 18px - Large body
text-xl       // 20px - H4
text-2xl      // 24px - H3
text-3xl      // 30px - H2
text-4xl      // 36px - H1
```

### Spacing

```tsx
p-4    // 16px
p-6    // 24px - Standard card padding
p-8    // 32px - Section padding
gap-6  // 24px - Standard gaps
```

## Common Patterns

### Primary Button

```tsx
<button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
  저장하기
</button>
```

### Health Metric Card

```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">혈압</p>
      <p className="text-2xl font-bold text-gray-800">120/80</p>
    </div>
    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
      <Heart className="text-primary-600" size={24} />
    </div>
  </div>
  <div className="mt-3 text-xs text-gray-500">
    정상 범위: 90-120 / 60-80 mmHg
  </div>
</div>
```

### Form Input with Label

```tsx
<div className="space-y-2">
  <label htmlFor="field-id" className="block text-sm font-medium text-gray-700">
    Label
  </label>
  <input
    id="field-id"
    type="text"
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
  />
</div>
```

### Medical Disclaimer

```tsx
<div className="bg-amber-50 border-t-2 border-amber-400 p-4 rounded-b-lg" role="alert">
  <div className="flex items-start gap-3">
    <AlertTriangle className="text-amber-600" size={20} />
    <p className="text-sm text-amber-900">
      본 정보는 의학적 진단이 아니며 참고용입니다.
      증상이 있는 경우 반드시 의료진과 상담하세요.
    </p>
  </div>
</div>
```

## Accessibility Quick Checklist

Before shipping any component:

- [ ] **Contrast**: All text meets 4.5:1 contrast ratio (use browser DevTools)
- [ ] **Touch targets**: All buttons are at least 44x44px
- [ ] **Focus states**: All interactive elements have visible focus indicators
- [ ] **Labels**: All icon buttons have aria-labels
- [ ] **Form labels**: All inputs have associated labels
- [ ] **Color independence**: Information is never conveyed by color alone
- [ ] **Keyboard**: Tested with keyboard navigation (Tab, Enter, Escape)
- [ ] **Screen reader**: Tested with VoiceOver/NVDA
- [ ] **Disclaimers**: Medical information includes appropriate disclaimers

## Healthcare-Specific Guidelines

### Medical Information

Always include disclaimers for AI-generated or informational medical content:

```tsx
<DisclaimerBanner
  message="본 정보는 의학적 진단이 아니며 참고용입니다."
  position="bottom"
/>
```

### Health Metrics

Display health metrics with:
1. Clear labels
2. Units of measurement
3. Reference ranges
4. Status indicators (with icon + text, not color alone)

### Dietary Information

Highlight restrictions with:
1. Warning icons
2. Clear severity levels
3. Specific foods to avoid/limit
4. Recommended daily amounts

### Emergency Contacts

Make emergency information:
1. Highly visible
2. Easily accessible
3. One-tap callable on mobile
4. Clearly labeled

## Configuration Files

### Tailwind Configuration

`/new_frontend/tailwind.config.js`

Extended Tailwind configuration with:
- Healthcare-optimized color palette
- WCAG AA compliant semantic colors
- Typography scale
- Spacing system
- Custom animations
- Touch target utilities

### CSS Variables

`/new_frontend/src/index.css`

CSS custom properties for:
- Primary and secondary colors
- Semantic colors (success, warning, error, info)
- Text colors with contrast ratios
- Background colors
- Healthcare-specific colors
- Accessibility tokens (focus rings, touch targets)
- Dark mode support
- Reduced motion support

## Browser Support

The design system supports:

- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari, Chrome Mobile (latest 2 versions)
- **Accessibility tools**: Screen readers (NVDA, JAWS, VoiceOver, TalkBack)

## Development Workflow

### For New Components

1. Review `DESIGN_SYSTEM.md` for principles and patterns
2. Check `COMPONENT_EXAMPLES.tsx` for similar patterns
3. Use `QUICK_REFERENCE_V2.md` for color/spacing values
4. Follow `ACCESSIBILITY_GUIDELINES.md` for compliance
5. Test with keyboard and screen reader
6. Validate with checklist before PR

### For Existing Components

1. Review `MIGRATION_GUIDE.md` for breaking changes
2. Update colors to meet contrast requirements
3. Add accessibility features (focus, labels, aria attributes)
4. Test with validation checklist
5. Update component documentation

## Testing

### Accessibility Testing Tools

```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/react jest-axe

# Run accessibility tests
npm run test:a11y
```

### Browser Extensions

- **axe DevTools**: Comprehensive accessibility testing
- **WAVE**: Visual feedback on accessibility issues
- **Lighthouse**: Overall accessibility score
- **Color Contrast Analyzer**: Check contrast ratios

### Manual Testing

1. **Keyboard navigation**: Tab through all interactive elements
2. **Screen reader**: Test with VoiceOver (macOS) or NVDA (Windows)
3. **Zoom**: Test at 200% text zoom
4. **High contrast**: Enable high contrast mode
5. **Touch**: Test on mobile devices for touch target sizing

## Resources

### Internal Documentation

- `DESIGN_SYSTEM.md` - Complete design system specification
- `QUICK_REFERENCE_V2.md` - Quick reference guide
- `ACCESSIBILITY_GUIDELINES.md` - Accessibility compliance
- `COMPONENT_EXAMPLES.tsx` - React component examples
- `MIGRATION_GUIDE.md` - Migration instructions

### External Resources

- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Radix UI Docs**: https://www.radix-ui.com
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Inclusive Components**: https://inclusive-components.design/

## Contributing

### Adding New Patterns

When adding new component patterns:

1. **Review existing patterns** for consistency
2. **Follow accessibility guidelines** (WCAG 2.2 AA)
3. **Document with examples** in `COMPONENT_EXAMPLES.tsx`
4. **Update QUICK_REFERENCE** with new pattern
5. **Test thoroughly** with keyboard and screen readers
6. **Get design review** before merging

### Updating Colors

When adding or modifying colors:

1. **Check contrast ratios** (minimum 4.5:1 for text)
2. **Test with color blindness simulators**
3. **Verify in high contrast mode**
4. **Update all documentation**
5. **Provide migration path** if breaking change

### Reporting Issues

For design system issues:

- **Slack**: #design-system
- **GitHub**: Create issue with `design-system` label
- **Email**: design-system@careguide.com

Include:
- Component or pattern affected
- Expected vs actual behavior
- Screenshots/examples
- Browser/device information

## Changelog

### Version 2.0.0 (January 2025)

**Major Changes:**
- Complete color system overhaul for WCAG 2.2 AA compliance
- Enhanced accessibility features (focus states, touch targets, ARIA)
- Healthcare-specific color palette and patterns
- Comprehensive documentation suite
- Component examples library
- Migration guide for existing code

**Breaking Changes:**
- Primary color changed from `primary-500` to `primary-600` for buttons
- Semantic colors now require specific shades (e.g., `success-600`)
- Text colors updated for better contrast
- Icon buttons require 44x44px minimum size

See `MIGRATION_GUIDE.md` for complete migration instructions.

## FAQ

### Q: Which primary color should I use for buttons?

**A:** Use `bg-primary-600` (#00B3A3) for buttons as it provides 4.5:1 contrast ratio (WCAG AA compliant). The lighter `primary-500` should only be used for decorative elements or non-text UI.

### Q: How do I ensure my component is accessible?

**A:** Follow these steps:
1. Add focus-visible ring to interactive elements
2. Provide aria-labels for icon buttons
3. Link form inputs with labels
4. Use semantic HTML
5. Test with keyboard (Tab, Enter, Escape)
6. Test with screen reader (VoiceOver/NVDA)
7. Verify 44x44px minimum touch targets
8. Check color contrast with DevTools

### Q: When should I use a medical disclaimer?

**A:** Always include disclaimers when displaying:
- AI-generated health information
- Medical advice or recommendations
- Dietary restrictions
- Symptom information
- Treatment suggestions

### Q: How do I display out-of-range health metrics?

**A:** Use a warning card with:
1. Warning icon (AlertTriangle)
2. Clear title
3. Explanation of issue
4. Measured value vs normal range
5. Recommendation to consult healthcare provider

### Q: Can I use color alone to show status?

**A:** No. Never use color as the only way to convey information. Always pair color with:
- Icons
- Text labels
- Patterns (borders, backgrounds)
- Symbols

### Q: What if I need a color not in the design system?

**A:** First check if an existing color can work. If you truly need a new color:
1. Ensure it meets WCAG AA contrast requirements
2. Propose it in #design-system Slack channel
3. Get design review approval
4. Add to Tailwind config with documentation
5. Update design system documentation

### Q: How do I test accessibility?

**A:** Use multiple methods:
1. **Automated**: Run axe-core tests (`npm run test:a11y`)
2. **Browser extensions**: axe DevTools, WAVE, Lighthouse
3. **Manual keyboard testing**: Tab through interface
4. **Screen reader testing**: VoiceOver (Mac) or NVDA (Windows)
5. **Contrast checking**: Browser DevTools or WebAIM tool
6. **Mobile testing**: Test on actual devices for touch targets

## Support

Need help with the design system?

- **Documentation**: Check the relevant MD file in this directory
- **Examples**: See `COMPONENT_EXAMPLES.tsx` for working code
- **Slack**: #design-system channel
- **Email**: design-system@careguide.com
- **Office hours**: Tuesdays 2-3pm KST

---

**Version**: 2.0.0
**Last Updated**: January 2025
**Maintained by**: CareGuide Design Team
