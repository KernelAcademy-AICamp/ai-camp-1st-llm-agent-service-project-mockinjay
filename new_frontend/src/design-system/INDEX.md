# CareGuide Design System - Documentation Index

Complete index of all design system documentation files.

## Start Here

👉 **New to the design system?** Start with [README.md](./README.md)

## Documentation Files

### 1. README.md
**Purpose**: Getting started guide and overview
**When to use**: First-time setup, understanding structure
**Contents**:
- Quick start guide
- File structure
- Core design tokens
- Common patterns
- FAQ

[View README.md →](./README.md)

---

### 2. DESIGN_SYSTEM.md
**Purpose**: Complete design system specification
**When to use**: Detailed information on colors, typography, components
**Contents**:
- Design principles
- Complete color system
- Typography scale
- Spacing system
- Component patterns
- Healthcare patterns
- Accessibility integration
- Dark mode support

[View DESIGN_SYSTEM.md →](./DESIGN_SYSTEM.md)

---

### 3. QUICK_REFERENCE_V2.md
**Purpose**: Daily development reference
**When to use**: Quick lookups during development
**Contents**:
- Color class lookup
- Typography patterns
- Spacing guide
- Component recipes
- Healthcare patterns
- Accessibility checklist

[View QUICK_REFERENCE_V2.md →](./QUICK_REFERENCE_V2.md)

---

### 4. ACCESSIBILITY_GUIDELINES.md
**Purpose**: WCAG 2.2 Level AA compliance guide
**When to use**: Ensuring accessibility compliance
**Contents**:
- Color & contrast requirements
- Typography accessibility
- Keyboard navigation
- Screen reader support
- Touch target sizing
- Focus management
- Form accessibility
- Testing procedures

[View ACCESSIBILITY_GUIDELINES.md →](./ACCESSIBILITY_GUIDELINES.md)

---

### 5. COMPONENT_EXAMPLES.tsx
**Purpose**: Production-ready React component examples
**When to use**: Implementing new components
**Contents**:
- Button variants (6 types)
- Form inputs (3 types)
- Cards (3 types)
- Alerts (5 types)
- Healthcare patterns (4 types)
- Status badges
- Loading states
- Empty states

[View COMPONENT_EXAMPLES.tsx →](./COMPONENT_EXAMPLES.tsx)

---

### 6. MIGRATION_GUIDE.md
**Purpose**: Upgrade existing components
**When to use**: Migrating legacy components to new design system
**Contents**:
- Breaking changes
- Color migration table
- Component updates
- Accessibility improvements
- Step-by-step process
- Validation checklist

[View MIGRATION_GUIDE.md →](./MIGRATION_GUIDE.md)

---

## Quick Navigation by Task

### "I need to build a new component"

1. Check [COMPONENT_EXAMPLES.tsx](./COMPONENT_EXAMPLES.tsx) for similar patterns
2. Reference [QUICK_REFERENCE_V2.md](./QUICK_REFERENCE_V2.md) for colors and spacing
3. Follow [ACCESSIBILITY_GUIDELINES.md](./ACCESSIBILITY_GUIDELINES.md) for compliance
4. Test with checklist in [README.md](./README.md)

### "I need to update an existing component"

1. Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for breaking changes
2. Update colors using migration table
3. Add accessibility features from [ACCESSIBILITY_GUIDELINES.md](./ACCESSIBILITY_GUIDELINES.md)
4. Validate with checklist

### "I need to understand the design principles"

1. Read [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) design principles section
2. Review healthcare patterns
3. See examples in [COMPONENT_EXAMPLES.tsx](./COMPONENT_EXAMPLES.tsx)

### "I need color values quickly"

1. Use [QUICK_REFERENCE_V2.md](./QUICK_REFERENCE_V2.md) color section
2. Or check [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for complete palette

### "I need to ensure accessibility"

1. Follow [ACCESSIBILITY_GUIDELINES.md](./ACCESSIBILITY_GUIDELINES.md)
2. Use checklist in [README.md](./README.md)
3. Test with tools listed in [ACCESSIBILITY_GUIDELINES.md](./ACCESSIBILITY_GUIDELINES.md)

### "I'm new to the project"

1. Start with [README.md](./README.md)
2. Skim [QUICK_REFERENCE_V2.md](./QUICK_REFERENCE_V2.md)
3. Review [COMPONENT_EXAMPLES.tsx](./COMPONENT_EXAMPLES.tsx)
4. Bookmark [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for reference

## File Sizes

| File | Size | Estimated Read Time |
|------|------|---------------------|
| README.md | ~18KB | 10 minutes |
| DESIGN_SYSTEM.md | ~45KB | 30 minutes |
| QUICK_REFERENCE_V2.md | ~32KB | 20 minutes |
| ACCESSIBILITY_GUIDELINES.md | ~38KB | 25 minutes |
| COMPONENT_EXAMPLES.tsx | ~28KB | 15 minutes |
| MIGRATION_GUIDE.md | ~24KB | 15 minutes |

**Total**: ~185KB, ~2 hours to read completely

## Print-Friendly Versions

For offline reference, print these files in order:

1. README.md (overview)
2. QUICK_REFERENCE_V2.md (daily reference)
3. ACCESSIBILITY_GUIDELINES.md (compliance checklist)

## Configuration Files

Design system configuration is spread across:

### Tailwind Configuration
**Location**: `/new_frontend/tailwind.config.js`
**Contents**:
- Color palette
- Typography scale
- Spacing system
- Breakpoints
- Animations
- Custom utilities

### CSS Variables
**Location**: `/new_frontend/src/index.css`
**Contents**:
- CSS custom properties
- Base styles
- Component classes
- Dark mode
- Reduced motion support

## External Resources

### WCAG Guidelines
- **WCAG 2.2 Quick Reference**: https://www.w3.org/WAI/WCAG22/quickref/
- **Understanding WCAG**: https://www.w3.org/WAI/WCAG22/Understanding/

### Tools
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Blindness Simulator**: https://www.color-blindness.com/coblis-color-blindness-simulator/
- **axe DevTools**: https://www.deque.com/axe/devtools/

### Libraries
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Lucide Icons**: https://lucide.dev

### Learning Resources
- **Inclusive Components**: https://inclusive-components.design/
- **A11y Project**: https://www.a11yproject.com/
- **WebAIM**: https://webaim.org/

## Changelog

### Version 2.0.0 (January 2025)
- Complete design system overhaul
- WCAG 2.2 Level AA compliance
- Healthcare-optimized colors
- Comprehensive documentation
- Component examples library
- Migration guide

See [DESIGN_SYSTEM_IMPROVEMENTS_SUMMARY.md](../../DESIGN_SYSTEM_IMPROVEMENTS_SUMMARY.md) for complete changes.

## Support

### Internal
- **Slack**: #design-system
- **Email**: design-system@careguide.com
- **Office Hours**: Tuesdays 2-3pm KST

### Reporting Issues
When reporting design system issues, include:
- File/component name
- Expected vs actual behavior
- Screenshots
- Browser/device info
- Related documentation section

## Contributing

### Adding Documentation
1. Follow existing structure
2. Use clear headings
3. Include code examples
4. Add to this index
5. Update README.md if needed

### Updating Components
1. Check existing patterns first
2. Follow accessibility guidelines
3. Add examples to COMPONENT_EXAMPLES.tsx
4. Update QUICK_REFERENCE_V2.md
5. Document breaking changes

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | Jan 2025 | Major overhaul with WCAG 2.2 AA compliance |
| 1.0.0 | Nov 2024 | Initial design system |

---

**Last Updated**: January 2025
**Maintained By**: CareGuide Design Team

## Quick Links

- 📚 [Complete Documentation](./README.md)
- 🎨 [Design System Spec](./DESIGN_SYSTEM.md)
- ⚡ [Quick Reference](./QUICK_REFERENCE_V2.md)
- ♿ [Accessibility Guide](./ACCESSIBILITY_GUIDELINES.md)
- 💻 [Component Examples](./COMPONENT_EXAMPLES.tsx)
- 🔄 [Migration Guide](./MIGRATION_GUIDE.md)
- 📊 [Summary](../../DESIGN_SYSTEM_IMPROVEMENTS_SUMMARY.md)
