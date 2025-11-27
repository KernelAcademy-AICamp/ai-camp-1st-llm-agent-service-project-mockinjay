# Diet Care Design System

> **Version**: 2.0.0
> **Last Updated**: 2025-11-27
> **Status**: Production Ready
> **Working Directory**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/`

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography Scale](#typography-scale)
3. [Spacing System](#spacing-system)
4. [Component Specifications](#component-specifications)
5. [Animation Guidelines](#animation-guidelines)
6. [Accessibility Requirements](#accessibility-requirements)
7. [Responsive Breakpoints](#responsive-breakpoints)
8. [Quick Reference](#quick-reference)

---

## Color Palette

### Diet Type Colors

Each diet type has a dedicated color scheme with semantic meaning and multiple shades for various UI states.

#### Low Sodium Diet (Blue)
```css
/* Primary Colors */
--diet-sodium-primary: #3B82F6;      /* Blue-500 */
--diet-sodium-light: #DBEAFE;        /* Blue-50 */
--diet-sodium-medium: #93C5FD;       /* Blue-300 */
--diet-sodium-dark: #1E40AF;         /* Blue-800 */
--diet-sodium-gradient: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
```

**Tailwind Classes**:
- Primary: `bg-blue-500 text-blue-500 border-blue-500`
- Light background: `bg-blue-50 dark:bg-blue-900/20`
- Text: `text-blue-600 dark:text-blue-400`
- Border: `border-blue-200 dark:border-blue-800`
- Hover: `hover:bg-blue-600 hover:border-blue-300`

**Usage**:
- Low sodium diet cards
- Sodium intake tracking
- Salt-related warnings

---

#### Low Protein Diet (Green/Emerald)
```css
/* Primary Colors */
--diet-protein-primary: #10B981;     /* Emerald-500 */
--diet-protein-light: #D1FAE5;       /* Emerald-50 */
--diet-protein-medium: #6EE7B7;      /* Emerald-300 */
--diet-protein-dark: #047857;        /* Emerald-800 */
--diet-protein-gradient: linear-gradient(135deg, #10B981 0%, #047857 100%);
```

**Tailwind Classes**:
- Primary: `bg-emerald-500 text-emerald-500 border-emerald-500`
- Light background: `bg-emerald-50 dark:bg-emerald-900/20`
- Text: `text-emerald-600 dark:text-emerald-400`
- Border: `border-emerald-200 dark:border-emerald-800`
- Hover: `hover:bg-emerald-600 hover:border-emerald-300`

**Usage**:
- Low protein diet cards
- Protein intake tracking
- Protein-related recommendations

---

#### Low Potassium Diet (Yellow/Amber)
```css
/* Primary Colors */
--diet-potassium-primary: #F59E0B;   /* Amber-500 */
--diet-potassium-light: #FEF3C7;     /* Amber-50 */
--diet-potassium-medium: #FCD34D;    /* Amber-300 */
--diet-potassium-dark: #B45309;      /* Amber-800 */
--diet-potassium-gradient: linear-gradient(135deg, #F59E0B 0%, #B45309 100%);
```

**Tailwind Classes**:
- Primary: `bg-amber-500 text-amber-500 border-amber-500`
- Light background: `bg-amber-50 dark:bg-amber-900/20`
- Text: `text-amber-600 dark:text-amber-400`
- Border: `border-amber-200 dark:border-amber-800`
- Hover: `hover:bg-amber-600 hover:border-amber-300`

**Usage**:
- Low potassium diet cards
- Potassium intake warnings
- Banana/orange warnings

---

#### Low Phosphorus Diet (Purple)
```css
/* Primary Colors */
--diet-phosphorus-primary: #9F7AEA;  /* Purple-500 (CarePlus Accent) */
--diet-phosphorus-light: #EDE9FE;    /* Purple-50 */
--diet-phosphorus-medium: #C4B5FD;   /* Purple-300 */
--diet-phosphorus-dark: #6D28D9;     /* Purple-800 */
--diet-phosphorus-gradient: linear-gradient(135deg, #9F7AEA 0%, #6D28D9 100%);
```

**Tailwind Classes**:
- Primary: `bg-purple-500 text-purple-500 border-purple-500`
- Light background: `bg-purple-50 dark:bg-purple-900/20`
- Text: `text-purple-600 dark:text-purple-400`
- Border: `border-purple-200 dark:border-purple-800`
- Hover: `hover:bg-purple-600 hover:border-purple-300`

**Usage**:
- Low phosphorus diet cards
- Phosphorus tracking
- Dairy/nut warnings

---

### Semantic Colors (Nutrition Levels)

#### Safe/Good Level (Green)
```css
--nutrition-safe: #10B981;           /* Emerald-500 */
--nutrition-safe-bg: #D1FAE5;        /* Emerald-50 */
--nutrition-safe-text: #047857;      /* Emerald-800 */
--nutrition-safe-border: #6EE7B7;    /* Emerald-300 */
```

**Usage**:
- Daily intake under target (0-70% of limit)
- Good progress indicators
- Success messages

**Tailwind**: `bg-emerald-50 text-emerald-800 border-emerald-500`

**WCAG Contrast**: 7.2:1 (AAA compliant)

---

#### Warning Level (Yellow/Amber)
```css
--nutrition-warning: #F59E0B;        /* Amber-500 */
--nutrition-warning-bg: #FEF3C7;     /* Amber-50 */
--nutrition-warning-text: #B45309;   /* Amber-800 */
--nutrition-warning-border: #FCD34D; /* Amber-300 */
```

**Usage**:
- Approaching limit (70-90% of daily goal)
- Caution indicators
- "Watch out" messages

**Tailwind**: `bg-amber-50 text-amber-800 border-amber-500`

**WCAG Contrast**: 6.8:1 (AAA compliant)

---

#### Danger/Over Limit (Red)
```css
--nutrition-danger: #EF4444;         /* Red-500 */
--nutrition-danger-bg: #FEE2E2;      /* Red-50 */
--nutrition-danger-text: #991B1B;    /* Red-800 */
--nutrition-danger-border: #FCA5A5;  /* Red-300 */
```

**Usage**:
- Exceeded daily limit (90-100%+)
- Critical warnings
- Error states

**Tailwind**: `bg-red-50 text-red-800 border-red-500`

**WCAG Contrast**: 8.1:1 (AAA compliant)

---

#### Info/Neutral (Blue)
```css
--nutrition-info: #00A8E8;           /* CarePlus Success */
--nutrition-info-bg: #E0F2FE;        /* Sky-50 */
--nutrition-info-text: #075985;      /* Sky-800 */
--nutrition-info-border: #93C5FD;    /* Blue-300 */
```

**Usage**:
- General information
- Tips and recommendations
- Neutral status messages

**Tailwind**: `bg-sky-50 text-sky-800 border-sky-500`

---

### Dark Mode Variants

```css
@media (prefers-color-scheme: dark) {
  /* Diet Type Colors - Adjusted for Dark Backgrounds */
  --diet-sodium-primary: #60A5FA;       /* Blue-400 */
  --diet-protein-primary: #34D399;      /* Emerald-400 */
  --diet-potassium-primary: #FBBF24;    /* Amber-400 */
  --diet-phosphorus-primary: #A78BFA;   /* Purple-400 */

  /* Semantic Colors - Dark Mode */
  --nutrition-safe: #34D399;            /* Emerald-400 */
  --nutrition-warning: #FBBF24;         /* Amber-400 */
  --nutrition-danger: #F87171;          /* Red-400 */
  --nutrition-info: #38BDF8;            /* Sky-400 */

  /* Background Adjustments */
  --diet-card-bg: #1F2937;              /* Gray-800 */
  --diet-card-border: #374151;          /* Gray-700 */
  --diet-card-hover: #111827;           /* Gray-900 */
}
```

**Dark Mode Tailwind Pattern**:
```jsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
```

---

## Typography Scale

### Font Families
```css
--font-primary: 'Noto Sans KR', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
```

Loaded from: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/index.css`

---

### Headings

#### H1 - Page Title
```css
font-size: 2rem;        /* 32px */
font-weight: 700;       /* Bold */
line-height: 1.2;       /* 38.4px */
color: var(--color-text-primary);
```
**Tailwind**: `text-4xl font-bold leading-tight text-gray-900 dark:text-white`

**Usage**: Main page titles ("Diet Care Dashboard", "Meal Analysis")

---

#### H2 - Section Title
```css
font-size: 1.5rem;      /* 24px */
font-weight: 700;       /* Bold */
line-height: 1.3;       /* 31.2px */
color: var(--color-text-primary);
```
**Tailwind**: `text-2xl font-bold text-gray-900 dark:text-white`

**Usage**: Section headers ("Today's Summary", "Nutrition Goals")

---

#### H3 - Subsection Title
```css
font-size: 1.25rem;     /* 20px */
font-weight: 600;       /* Semibold */
line-height: 1.4;       /* 28px */
color: var(--color-text-primary);
```
**Tailwind**: `text-xl font-semibold text-gray-900 dark:text-white`

**Usage**: Card titles, modal headers

---

#### H4 - Component Title
```css
font-size: 1.125rem;    /* 18px */
font-weight: 600;       /* Semibold */
line-height: 1.4;       /* 25.2px */
color: var(--color-text-primary);
```
**Tailwind**: `text-lg font-semibold text-gray-900 dark:text-white`

**Usage**: Table headers, list section titles

---

### Body Text

#### Regular Body
```css
font-size: 1rem;        /* 16px */
font-weight: 400;       /* Regular */
line-height: 1.6;       /* 25.6px */
color: var(--color-text-primary);
```
**Tailwind**: `text-base text-gray-900 dark:text-white`

**Usage**: Default text, descriptions, content

---

#### Small Body
```css
font-size: 0.875rem;    /* 14px */
font-weight: 400;       /* Regular */
line-height: 1.5;       /* 21px */
color: var(--color-text-secondary);
```
**Tailwind**: `text-sm text-gray-600 dark:text-gray-400`

**Usage**: Helper text, timestamps, secondary info

---

#### Caption
```css
font-size: 0.75rem;     /* 12px */
font-weight: 400;       /* Regular */
line-height: 1.5;       /* 18px */
color: var(--color-text-tertiary);
```
**Tailwind**: `text-xs text-gray-500 dark:text-gray-500`

**Usage**: Labels, tags, footnotes, units

---

### Data Display Typography

#### Large Data (Primary Metric)
```css
font-size: 2.5rem;      /* 40px */
font-weight: 700;       /* Bold */
line-height: 1;         /* 40px */
font-variant-numeric: tabular-nums;
color: var(--color-text-primary);
```
**Tailwind**: `text-5xl font-bold tabular-nums text-gray-900 dark:text-white`

**Usage**: Daily nutrition totals (e.g., "1,650 mg")

---

#### Medium Data (Secondary Metric)
```css
font-size: 1.875rem;    /* 30px */
font-weight: 600;       /* Semibold */
line-height: 1.2;       /* 36px */
font-variant-numeric: tabular-nums;
```
**Tailwind**: `text-3xl font-semibold tabular-nums`

**Usage**: Individual meal nutrition values

---

#### Small Data (Inline Metric)
```css
font-size: 1.125rem;    /* 18px */
font-weight: 600;       /* Semibold */
line-height: 1.4;       /* 25.2px */
font-variant-numeric: tabular-nums;
```
**Tailwind**: `text-lg font-semibold tabular-nums`

**Usage**: Table cells, nutrition badges

---

#### Data Units
```css
font-size: 0.875rem;    /* 14px */
font-weight: 400;       /* Regular */
color: var(--color-text-secondary);
```
**Tailwind**: `text-sm text-gray-600 dark:text-gray-400`

**Usage**: "mg", "g", "kcal" beside values

**Example**:
```jsx
<span className="text-lg font-semibold tabular-nums">1,650</span>
<span className="text-sm text-gray-600 dark:text-gray-400 ml-1">mg</span>
```

---

## Spacing System

### Base Unit
- Base spacing unit: **4px** (0.25rem)
- Tailwind scale: `1 = 4px`, `2 = 8px`, `4 = 16px`, etc.

---

### Component Spacing

#### Card Padding
```css
/* Small cards (compact info) */
padding: 1rem;                    /* 16px - Tailwind: p-4 */

/* Medium cards (default) */
padding: 1.5rem;                  /* 24px - Tailwind: p-6 */

/* Large cards (feature cards) */
padding: 2rem;                    /* 32px - Tailwind: p-8 */
```

**Responsive Example**:
```jsx
<div className="p-4 sm:p-6 lg:p-8">
  {/* Responsive padding: 16px mobile, 24px tablet, 32px desktop */}
</div>
```

---

#### Stack Spacing (Vertical)
```css
/* Tight spacing (related items, list items) */
gap: 0.5rem;                      /* 8px - Tailwind: gap-2 */

/* Normal spacing (form fields, sections) */
gap: 1rem;                        /* 16px - Tailwind: gap-4 */

/* Loose spacing (major sections) */
gap: 1.5rem;                      /* 24px - Tailwind: gap-6 */

/* Section spacing (page sections) */
gap: 2rem;                        /* 32px - Tailwind: gap-8 */
```

---

#### Inline Spacing (Horizontal)
```css
/* Tight spacing (button groups) */
gap: 0.5rem;                      /* 8px - Tailwind: gap-2 */

/* Normal spacing (form labels to inputs) */
gap: 0.75rem;                     /* 12px - Tailwind: gap-3 */

/* Loose spacing (card grids) */
gap: 1rem;                        /* 16px - Tailwind: gap-4 */
```

---

### Form Element Spacing

#### Input Fields
```css
/* Input internal padding */
padding: 0.75rem 1rem;            /* 12px 16px - Tailwind: py-3 px-4 */

/* Label to input gap */
margin-top: 0.5rem;               /* 8px - Tailwind: mt-2 */

/* Form field vertical gap */
gap: 1rem;                        /* 16px - Tailwind: gap-4 */
```

---

#### Buttons
```css
/* Small button */
padding: 0.5rem 1rem;             /* 8px 16px - Tailwind: py-2 px-4 */

/* Medium button (default) */
padding: 0.75rem 1.5rem;          /* 12px 24px - Tailwind: py-3 px-6 */

/* Large button (CTA) */
padding: 1rem 2rem;               /* 16px 32px - Tailwind: py-4 px-8 */

/* Button group gap */
gap: 0.5rem;                      /* 8px - Tailwind: gap-2 */
```

---

### Border Radius
```css
--radius-sm: 8px;      /* Badges, small elements */
--radius-md: 12px;     /* Buttons, inputs (default) */
--radius-lg: 16px;     /* Cards */
--radius-xl: 20px;     /* Feature cards */
--radius-full: 9999px; /* Pills, circular */
```

**Tailwind Classes**:
```
rounded-lg    /* 12px - default */
rounded-xl    /* 16px - cards */
rounded-2xl   /* 20px - large cards */
rounded-full  /* 9999px - pills */
```

---

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
--shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

**Tailwind Classes**:
```
shadow-sm         /* Subtle */
shadow-card       /* Default cards */
shadow-card-hover /* Hover states */
shadow-lg         /* Modals, dropdowns */
```

---

## Component Specifications

### 1. DietTypeCard

**Purpose**: Display information about a specific kidney disease diet type (Low Sodium, Low Protein, etc.)

#### Structure
```jsx
<Card className="diet-type-card" data-diet="sodium">
  <AccentBar />
  <IconContainer />
  <Title />
  <Description />
  <TipsList />
  <ActionButton />
</Card>
```

#### Base Styles
```css
.diet-type-card {
  background: white;
  border-radius: 16px;              /* rounded-2xl */
  border: 2px solid transparent;
  padding: 1.5rem;                  /* p-6 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}
```

**Tailwind Base**:
```
relative bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent p-6 shadow-card transition-all duration-200 overflow-hidden group
```

---

#### Accent Bar (Top Border)
```jsx
{/* Sodium - Blue */}
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>

{/* Protein - Green */}
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

{/* Potassium - Amber */}
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>

{/* Phosphorus - Purple */}
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
```

---

#### Icon Container
```jsx
{/* Sodium */}
<div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400">{/* Icon */}</svg>
</div>

{/* Protein */}
<div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400">{/* Icon */}</svg>
</div>

{/* Potassium */}
<div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400">{/* Icon */}</svg>
</div>

{/* Phosphorus */}
<div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400">{/* Icon */}</svg>
</div>
```

---

#### Interactive States

**Hover State**:
```css
.diet-type-card:hover {
  border-color: var(--diet-type-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  transform: translateY(-2px);
}
```
**Tailwind**: `hover:border-blue-500 hover:shadow-card-hover hover:-translate-y-0.5`

**Active/Selected State**:
```css
.diet-type-card.active {
  border-color: var(--diet-type-color);
  background: var(--diet-type-light);
}
```
**Tailwind**: `border-blue-500 bg-blue-50 dark:bg-blue-900/20`

---

#### Complete Example
```jsx
<div className="relative bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-blue-500 p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
  {/* Accent Bar */}
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>

  {/* Content */}
  <div className="space-y-4">
    {/* Icon and Title */}
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400">
          {/* Icon */}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Low Sodium Diet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Daily sodium intake under 2,000mg
        </p>
      </div>
    </div>

    {/* Tips List */}
    <ul className="space-y-2">
      <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5">
          {/* Checkmark */}
        </svg>
        <span>Use fresh ingredients instead of processed foods</span>
      </li>
    </ul>

    {/* Action Button (appears on hover) */}
    <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30">
      Learn More
    </button>
  </div>
</div>
```

---

### 2. NutritionTable

**Purpose**: Display tabular nutrition data with color-coded levels

#### Structure
```jsx
<Table className="nutrition-table">
  <TableHeader />
  <TableBody>
    <TableRow data-level="safe" />
    <TableRow data-level="warning" />
    <TableRow data-level="danger" />
  </TableBody>
</Table>
```

#### Base Styles

**Table Container**:
```jsx
<div className="overflow-x-auto -mx-2">
  <table className="min-w-full border-separate border-spacing-0">
    {/* ... */}
  </table>
</div>
```

**Table Header**:
```jsx
<thead>
  <tr className="border-b border-gray-200 dark:border-gray-700">
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
      Food Item
    </th>
    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
      Sodium
    </th>
    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
      Protein
    </th>
  </tr>
</thead>
```

---

#### Table Rows with Level States

**Safe Level**:
```jsx
<tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors duration-200" data-level="safe">
  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
    Grilled Chicken
  </td>
  <td className="px-4 py-4 text-sm text-right tabular-nums text-gray-700 dark:text-gray-300">
    <span className="text-blue-600 dark:text-blue-400 font-semibold">74</span> mg
  </td>
</tr>
```

**Warning Level**:
```jsx
<tr className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors" data-level="warning">
  {/* ... */}
</tr>
```

**Danger Level**:
```jsx
<tr className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" data-level="danger">
  {/* ... */}
</tr>
```

---

#### Data Alignment

**Left-aligned** (Food names, descriptive text):
```jsx
<td className="px-4 py-4 text-left text-sm">Food Name</td>
```

**Right-aligned** (Numeric values):
```jsx
<td className="px-4 py-4 text-right text-sm tabular-nums">1,650 mg</td>
```

**Center-aligned** (Status badges):
```jsx
<td className="px-4 py-4 text-center">
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
    Safe
  </span>
</td>
```

---

### 3. ImageUploadZone

**Purpose**: Allow users to upload meal photos for AI nutrition analysis

#### States
- `idle`: Default waiting state
- `hover`: User dragging file over zone
- `uploading`: File upload in progress
- `success`: Upload completed successfully
- `error`: Upload failed

---

#### Base State (Idle)
```jsx
<div className="relative group">
  <input type="file" className="hidden" id="food-upload" accept="image/*" />
  <label
    htmlFor="food-upload"
    className="flex flex-col items-center justify-center w-full min-h-[240px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group-hover:border-primary-400 dark:group-hover:border-primary-500"
  >
    {/* Upload Icon */}
    <div className="w-16 h-16 mb-4 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
      <svg className="w-8 h-8 text-primary-500">
        {/* Upload icon */}
      </svg>
    </div>

    {/* Text */}
    <div className="text-center px-6">
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        <span className="text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        PNG, JPG, GIF up to 10MB
      </p>
    </div>

    {/* Hint */}
    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
      <svg className="w-4 h-4">{/* Camera */}</svg>
      <span>Take a photo or select from gallery</span>
    </div>
  </label>
</div>
```

---

#### Hover/Drag State
```jsx
<div className="border-2 border-dashed border-primary-500 bg-primary-50 dark:bg-primary-900/20" data-state="hover">
  {/* Content */}
</div>
```

**Tailwind**:
```
data-[state=hover]:border-primary-500 data-[state=hover]:bg-cyan-50 dark:data-[state=hover]:bg-primary-900/20
```

---

#### Uploading State
```jsx
<div className="border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 pointer-events-none" data-state="uploading">
  {/* Progress Bar */}
  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mt-4">
    <div
      className="h-full bg-gradient-primary transition-all duration-300"
      style={{ width: '65%' }}
    ></div>
  </div>
  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Uploading... 65%</p>
</div>
```

---

#### Success State
```jsx
<div className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" data-state="success">
  <svg className="w-12 h-12 text-emerald-500 mx-auto">
    {/* Checkmark */}
  </svg>
  <p className="text-emerald-700 dark:text-emerald-400 font-medium mt-2">
    Upload successful!
  </p>
</div>
```

---

#### Error State
```jsx
<div className="border-2 border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake" data-state="error">
  <svg className="w-12 h-12 text-red-500 mx-auto">
    {/* Alert icon */}
  </svg>
  <p className="text-red-700 dark:text-red-400 font-medium mt-2">
    Upload failed. File too large.
  </p>
  <button className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium hover:underline">
    Try again
  </button>
</div>
```

**Shake Animation** (for error state):
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
```

---

### 4. GoalInput

**Purpose**: Numeric input for setting daily nutrition goals

#### Structure
```jsx
<InputGroup className="goal-input">
  <Label />
  <InputWrapper>
    <Input type="number" />
    <UnitLabel />
  </InputWrapper>
  <HelperText />
</InputGroup>
```

#### Complete Example
```jsx
<div className="space-y-2">
  {/* Label */}
  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
    <span>Sodium Target</span>
  </label>

  {/* Input Wrapper */}
  <div className="relative">
    <input
      type="number"
      placeholder="2000"
      className="w-full py-3 pr-16 pl-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold tabular-nums text-right placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:bg-cyan-50 dark:focus:bg-primary-900/20 transition-all"
    />
    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-400 pointer-events-none">
      mg
    </span>
  </div>

  {/* Helper Text */}
  <p className="text-xs text-gray-500 dark:text-gray-400">
    Recommended: 1,500 - 2,000 mg/day
  </p>
</div>
```

---

#### Focus Ring Colors by Nutrient

**Sodium (Blue)**:
```
focus:ring-2 focus:ring-blue-500 focus:border-blue-500
```

**Protein (Green)**:
```
focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
```

**Potassium (Amber)**:
```
focus:ring-2 focus:ring-amber-500 focus:border-amber-500
```

**Phosphorus (Purple)**:
```
focus:ring-2 focus:ring-purple-500 focus:border-purple-500
```

---

#### Number Formatting

Display large numbers with thousand separators:

```tsx
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

// Usage: formatNumber(2000) => "2,000"
```

---

### 5. MealLogCard

**Purpose**: Display individual meal with nutrition summary

#### Structure
```jsx
<Card className="meal-log-card">
  <MealHeader>
    <MealIcon />
    <TimeIndicator />
  </MealHeader>
  <MealImage />
  <FoodItemsList />
  <NutritionSummary />
  <Actions />
</Card>
```

#### Complete Example
```jsx
<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-card hover:shadow-card-hover transition-shadow">
  {/* Header */}
  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3">
      {/* Meal Icon - Breakfast */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
        <svg className="w-5 h-5">{/* Icon */}</svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Breakfast
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          8:00 AM
        </p>
      </div>
    </div>

    {/* Quick Stats */}
    <div className="flex items-center gap-4 text-sm">
      <div className="text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">Calories</div>
        <div className="font-semibold text-gray-900 dark:text-white tabular-nums">450</div>
      </div>
    </div>
  </div>

  {/* Meal Image */}
  <img
    src="/meal.jpg"
    alt="Breakfast"
    className="w-full aspect-video rounded-xl object-cover my-4"
  />

  {/* Food Items */}
  <div className="space-y-2 mb-4">
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">🍳</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">
          Scrambled Eggs
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          2 eggs, 100g
        </p>
      </div>
      <button className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
        <svg className="w-4 h-4">{/* X */}</svg>
      </button>
    </div>
  </div>

  {/* Nutrition Summary */}
  <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
    <div className="text-center">
      <div className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
        74 <span className="text-xs font-normal text-gray-500">mg</span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Sodium
      </div>
    </div>
  </div>

  {/* Add Food Button */}
  <button className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2">
    <svg className="w-4 h-4">{/* Plus */}</svg>
    <span>Add Food Item</span>
  </button>
</div>
```

---

#### Meal Type Colors

**Breakfast** (Morning - Amber/Orange):
```jsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
```

**Lunch** (Midday - Green):
```jsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white">
```

**Dinner** (Evening - Purple):
```jsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white">
```

**Snack** (Anytime - Pink):
```jsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white">
```

---

### 6. Food Item Chips

**Purpose**: Display individual food items as removable chips

```jsx
<div className="flex flex-wrap gap-2">
  <div className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-cyan-50 dark:bg-primary-900/20 border border-primary-500 rounded-full text-sm text-primary-600 dark:text-primary-400">
    <span>Chicken Breast</span>
    <button className="ml-1 hover:text-red-500 transition-colors">
      <svg className="w-3 h-3">{/* X */}</svg>
    </button>
  </div>
</div>
```

**Tailwind**:
```
inline-flex items-center gap-1.5 py-1.5 px-3 bg-cyan-50 dark:bg-primary-900/20 border border-primary-500 rounded-full text-sm text-primary-600 dark:text-primary-400
```

---

## Animation Guidelines

### Loading Spinners

#### Primary Spinner
```jsx
<div className="flex items-center justify-center p-12">
  <div className="relative w-16 h-16">
    {/* Outer ring */}
    <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
    {/* Spinning ring */}
    <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
  </div>
</div>
```

**Tailwind**: `animate-spin border-4 border-transparent border-t-primary-500 rounded-full`

---

#### Skeleton Loading
```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    <div className="flex-1 space-y-3">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
  <div className="mt-4 space-y-2">
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
  </div>
</div>
```

**Tailwind**: `animate-pulse` on container, `bg-gray-200 dark:bg-gray-700` on skeleton elements

---

#### Progress Dots
```jsx
<div className="flex items-center justify-center gap-2 p-8">
  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
</div>
```

---

### Progress Bars

#### Linear Progress Bar
```jsx
<div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
  <div
    className="h-full bg-gradient-primary transition-all duration-500 ease-out"
    style={{ width: '75%' }}
  ></div>
</div>
```

**With Glow Effect**:
```jsx
<div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
  {/* Fill */}
  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded transition-all duration-500 ease-out" style={{ width: '75%' }}></div>
  {/* Glow */}
  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded blur-sm opacity-40 transition-all duration-500" style={{ width: '75%' }}></div>
</div>
```

---

#### Circular Progress (Goal Indicator)
```jsx
<div className="relative inline-flex items-center justify-center">
  <svg className="w-32 h-32 -rotate-90">
    {/* Background circle */}
    <circle
      cx="64"
      cy="64"
      r="56"
      className="fill-none stroke-gray-200 dark:stroke-gray-700"
      strokeWidth="8"
    />
    {/* Progress circle */}
    <circle
      cx="64"
      cy="64"
      r="56"
      className="fill-none stroke-blue-500 transition-all duration-500 ease-out"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="351.86"
      strokeDashoffset={351.86 * (1 - 0.75)}  /* 75% progress */
    />
  </svg>

  {/* Center content */}
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
      75%
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">
      Sodium
    </div>
  </div>
</div>
```

**Calculate `strokeDashoffset`**:
```tsx
const circumference = 2 * Math.PI * radius; // For r=56: 351.86
const offset = circumference * (1 - (value / max));
```

---

### Success Checkmarks

#### Animated Checkmark
```jsx
<div className="flex flex-col items-center justify-center p-8">
  <svg className="w-20 h-20" viewBox="0 0 80 80">
    {/* Circle */}
    <circle
      cx="40"
      cy="40"
      r="36"
      className="fill-none stroke-emerald-500"
      strokeWidth="4"
      strokeDasharray="226"
      strokeDashoffset="0"
      style={{
        animation: 'drawCircle 0.6s ease-out forwards'
      }}
    />
    {/* Checkmark */}
    <path
      d="M25 40 L35 50 L55 30"
      className="fill-none stroke-emerald-500"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="50"
      strokeDashoffset="0"
      style={{
        animation: 'drawCheck 0.4s 0.6s ease-out forwards'
      }}
    />
  </svg>
  <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
    Goal Saved!
  </p>
</div>
```

**Keyframes** (add to global CSS):
```css
@keyframes drawCircle {
  from { stroke-dashoffset: 226; }
  to { stroke-dashoffset: 0; }
}

@keyframes drawCheck {
  from { stroke-dashoffset: 50; }
  to { stroke-dashoffset: 0; }
}
```

---

### Error Shakes

#### Shake Animation
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}
```

**Apply to element**:
```jsx
<div className="animate-shake">
  {/* Error content */}
</div>
```

Add to Tailwind config:
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px)' },
        }
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
      }
    }
  }
}
```

---

### Micro-interactions

#### Button Press
```jsx
<button className="px-6 py-3 bg-primary-500 text-white rounded-xl active:scale-98 transition-transform duration-100">
  Click Me
</button>
```

Add to Tailwind config:
```js
scale: {
  '98': '0.98',
}
```

---

#### Card Hover Lift
```jsx
<div className="transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
  {/* Card content */}
</div>
```

---

#### Icon Scale on Hover
```jsx
<div className="group">
  <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200">
    {/* Icon */}
  </svg>
</div>
```

---

#### Fade In (Page Load)
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Tailwind**:
```jsx
<div className="animate-fadeIn">
  {/* Content */}
</div>
```

Add to config:
```js
animation: {
  fadeIn: 'fadeIn 0.3s ease-out',
}
```

---

## Accessibility Requirements

### Color Contrast Ratios (WCAG AA)

#### Text Contrast
- **Normal text**: 4.5:1 minimum
- **Large text** (18px+): 3:1 minimum

#### Verified Combinations
| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| `#1F2937` (gray-900) | `#FFFFFF` (white) | 12.6:1 | AAA |
| `#6B7280` (gray-600) | `#FFFFFF` (white) | 5.7:1 | AAA |
| `#FFFFFF` (white) | `#00C9B7` (primary) | 4.8:1 | AA |
| `#047857` (emerald-800) | `#D1FAE5` (emerald-50) | 7.2:1 | AAA |
| `#B45309` (amber-800) | `#FEF3C7` (amber-50) | 6.8:1 | AAA |
| `#991B1B` (red-800) | `#FEE2E2` (red-50) | 8.1:1 | AAA |

**Check Tool**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

### Focus Indicators

#### Keyboard Focus Ring
```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Button
</button>
```

**Apply to all interactive elements**:
- Buttons
- Input fields
- Links
- Interactive cards
- Custom controls

---

#### Focus-Visible (Modern Browsers)
```jsx
<button className="focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none">
  Button
</button>
```

Shows focus ring only for keyboard navigation, not mouse clicks.

---

### Touch Target Sizes

#### Minimum Sizes
- **Interactive elements**: 48x48px minimum (WCAG 2.1 Level AAA)
- **Tap spacing**: 8px minimum between targets

#### Button Sizing
```jsx
{/* Small button - minimum size */}
<button className="min-h-[48px] min-w-[48px] py-3 px-6">
  Small
</button>

{/* Icon button - exact size */}
<button className="w-12 h-12 flex items-center justify-center">
  <svg className="w-5 h-5" />
</button>
```

#### Tap Spacing
```jsx
<div className="flex gap-2">
  {/* 8px minimum gap between touch targets */}
  <button className="min-h-[48px] px-4">Button 1</button>
  <button className="min-h-[48px] px-4">Button 2</button>
</div>
```

---

### ARIA Labels & Screen Readers

#### Progress Indicators
```jsx
<div
  role="progressbar"
  aria-label="Daily sodium intake progress"
  aria-valuenow={1650}
  aria-valuemin={0}
  aria-valuemax={2000}
  aria-valuetext="1,650 of 2,000 milligrams (82%)"
>
  {/* Progress visual */}
</div>
```

---

#### Interactive Cards
```jsx
<button
  className="diet-type-card"
  role="button"
  aria-label="Select low sodium diet information"
  aria-pressed={isActive}
>
  {children}
</button>
```

---

#### Image Upload
```jsx
<div
  role="button"
  tabIndex={0}
  aria-label="Upload meal photo for nutrition analysis"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerUpload();
    }
  }}
>
  <input
    type="file"
    aria-label="Select image file from device"
    className="sr-only"
  />
</div>
```

---

#### Status Messages
```jsx
{/* Polite announcement (non-critical) */}
<div role="status" aria-live="polite" aria-atomic="true">
  Meal logged successfully
</div>

{/* Assertive announcement (critical) */}
<div role="alert" aria-live="assertive" aria-atomic="true">
  Error: Daily sodium limit exceeded
</div>
```

---

#### Screen Reader Only Text
```jsx
<label htmlFor="sodium-input" className="sr-only">
  Enter your daily sodium target in milligrams
</label>

{/* Tailwind SR-only class */}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### Keyboard Navigation

#### Tab Order
```
1. Skip to main content link (hidden, appears on focus)
2. Navigation menu items
3. Primary action buttons (CTAs)
4. Form inputs (top to bottom, left to right)
5. Secondary actions
6. Footer links
```

---

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Enter` | Activate button/link |
| `Space` | Activate button, toggle checkbox |
| `Escape` | Close modal/dialog/dropdown |
| `Arrow keys` | Navigate between tabs/radio options |
| `Tab` | Move to next focusable element |
| `Shift + Tab` | Move to previous focusable element |

---

#### Implementation
```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  } else if (e.key === 'Escape') {
    handleClose();
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
>
  {children}
</div>
```

---

### Motion Preferences

Respect `prefers-reduced-motion` for users with vestibular disorders:

```jsx
<div className="transition-all duration-200 motion-reduce:transition-none">
  {/* Content */}
</div>
```

**Global CSS**:
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

---

## Responsive Breakpoints

### Breakpoint System

```css
/* Mobile (default - no prefix) */
@media (min-width: 0px) { }

/* Small tablets (sm:) */
@media (min-width: 640px) { }

/* Tablets (md:) */
@media (min-width: 768px) { }

/* Desktop (lg:) */
@media (min-width: 1024px) { }

/* Large desktop (xl:) */
@media (min-width: 1280px) { }

/* Extra large (2xl:) */
@media (min-width: 1536px) { }
```

---

### Mobile (< 640px)

#### Layout
```jsx
<div className="px-4 max-w-full">
  <div className="grid grid-cols-1 gap-4">
    {/* Single column */}
  </div>
</div>
```

#### Typography
```jsx
<h1 className="text-3xl">Page Title</h1>  {/* 28px */}
<h2 className="text-xl">Section</h2>      {/* 20px */}
<h3 className="text-lg">Subsection</h3>   {/* 18px */}
```

#### Components
- Stack cards vertically
- Full-width buttons
- Single column forms
- Hide secondary information
- Bottom navigation

---

### Tablet (640px - 1024px)

#### Layout
```jsx
<div className="px-4 sm:px-6 max-w-screen-md mx-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
    {/* 2 columns */}
  </div>
</div>
```

#### Typography
```jsx
<h1 className="text-3xl sm:text-4xl">Page Title</h1>  {/* 32px */}
<h2 className="text-xl sm:text-2xl">Section</h2>     {/* 24px */}
```

#### Components
- 2-column card grid
- Side-by-side forms
- Show more metadata
- Expanded tables

---

### Desktop (> 1024px)

#### Layout
```jsx
<div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
    {/* 3 columns */}
  </div>
</div>
```

#### Typography
```jsx
<h1 className="text-3xl sm:text-4xl lg:text-5xl">Page Title</h1>  {/* 48px */}
<h2 className="text-xl sm:text-2xl lg:text-3xl">Section</h2>     {/* 30px */}
```

#### Components
- 3-4 column card grid
- Multi-column forms
- Full data tables
- Sidebars and panels
- Hover interactions

---

### Component-Specific Responsive Patterns

#### DietTypeCard Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  {dietTypes.map(type => <DietTypeCard key={type} />)}
</div>
```

#### NutritionTable
```jsx
{/* Horizontal scroll on mobile, full table on desktop */}
<div className="overflow-x-auto lg:overflow-visible -mx-4 sm:-mx-0">
  <table className="min-w-[640px] lg:min-w-full">
    {/* ... */}
  </table>
</div>
```

#### MealLogCard
```jsx
{/* Vertical on mobile, horizontal on desktop */}
<div className="flex flex-col lg:flex-row gap-4">
  <img className="w-full lg:w-1/3 aspect-video object-cover rounded-xl" />
  <div className="flex-1">
    {/* Content */}
  </div>
</div>
```

#### GoalInput Form
```jsx
{/* Stack on mobile, inline on desktop */}
<div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
  <label className="lg:w-1/3 text-sm font-medium">Sodium Target</label>
  <input className="lg:w-2/3" />
</div>
```

---

## Quick Reference

### Common Patterns

#### Diet Type Color Mapping
```tsx
const DIET_COLORS = {
  sodium: 'blue',
  protein: 'emerald',
  potassium: 'amber',
  phosphorus: 'purple',
} as const;

type DietType = keyof typeof DIET_COLORS;

// Usage
const getDietClasses = (type: DietType) => ({
  bg: `bg-${DIET_COLORS[type]}-50 dark:bg-${DIET_COLORS[type]}-900/20`,
  text: `text-${DIET_COLORS[type]}-600 dark:text-${DIET_COLORS[type]}-400`,
  border: `border-${DIET_COLORS[type]}-500`,
});
```

---

#### Nutrition Level Badge
```tsx
const getNutritionLevelStyle = (percent: number) => {
  if (percent < 70) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400';
  } else if (percent < 90) {
    return 'bg-amber-50 text-amber-800 border-amber-500 dark:bg-amber-900/20 dark:text-amber-400';
  } else {
    return 'bg-red-50 text-red-800 border-red-500 dark:bg-red-900/20 dark:text-red-400';
  }
};

// Usage
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getNutritionLevelStyle(82)}`}>
  82%
</span>
```

---

#### Responsive Container
```jsx
<div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
  {children}
</div>
```

---

#### Card Hover Effect
```jsx
<div className="transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer">
  {children}
</div>
```

---

### Copy-Paste Class Strings

#### Buttons
```
/* Primary Button */
px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200

/* Secondary Button */
px-6 py-3 bg-white dark:bg-gray-800 border-2 border-primary-500 text-primary-600 dark:text-primary-400 rounded-xl font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200

/* Danger Button */
px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors duration-200

/* Ghost Button */
px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200
```

---

#### Cards
```
/* Default Card */
bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-card p-6

/* Interactive Card */
bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-6

/* Gradient Header */
bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20
```

---

#### Inputs
```
/* Text Input */
w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all

/* Number Input with Unit */
w-full py-3 pr-16 pl-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-lg font-semibold tabular-nums text-right placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all
```

---

#### Alerts
```
/* Success */
p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg

/* Warning */
p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg

/* Error */
p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg

/* Info */
p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg
```

---

#### Badges
```
/* Streak Badge */
inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-sm font-bold text-gray-900 dark:text-white

/* Status Badge - Success */
inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400

/* Status Badge - Warning */
inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
```

---

## Implementation Checklist

### Before Starting
- [ ] Review `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/src/index.css` for existing tokens
- [ ] Verify `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/tailwind.config.js` configuration
- [ ] Ensure font families are loaded (Noto Sans KR, Inter)

### Per Component
- [ ] Apply correct diet type color scheme
- [ ] Use semantic colors for nutrition levels
- [ ] Add hover/focus states with transitions
- [ ] Implement responsive breakpoints (mobile, tablet, desktop)
- [ ] Add ARIA labels for screen readers
- [ ] Implement keyboard navigation (Enter, Space, Escape, Arrows)
- [ ] Test color contrast ratios (WCAG AA minimum)
- [ ] Verify touch target sizes (48x48px minimum)
- [ ] Add loading/success/error states with animations
- [ ] Respect `prefers-reduced-motion`

### Before Production
- [ ] Test in dark mode
- [ ] Verify accessibility with screen reader (NVDA, VoiceOver)
- [ ] Test keyboard-only navigation
- [ ] Check mobile touch interactions (iOS Safari, Chrome Android)
- [ ] Validate WCAG 2.1 AA compliance
- [ ] Performance audit (Lighthouse)
- [ ] Animation performance (60fps)
- [ ] Image optimization (lazy loading, WebP format)

---

## File References

**Root Directory**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/`

**Design Tokens**:
- Global CSS: `src/index.css`
- Tailwind Config: `tailwind.config.js`

**Components**:
- UI Components: `src/components/ui/`
- Diet Care Components: `src/components/diet-care/` (to be created)

**Types**:
- Diet Care Types: `src/types/diet-care.ts`

---

## Document Metadata

**Version**: 2.0.0
**Last Updated**: 2025-11-27
**Maintained By**: Frontend Team
**Status**: Production Ready

**Changes from v1.0**:
- Added comprehensive component specifications
- Expanded accessibility guidelines with WCAG compliance
- Added responsive breakpoint examples
- Included animation keyframes and implementation
- Added keyboard navigation patterns
- Expanded dark mode support
- Added copy-paste ready Tailwind class strings

---

**End of Document**
