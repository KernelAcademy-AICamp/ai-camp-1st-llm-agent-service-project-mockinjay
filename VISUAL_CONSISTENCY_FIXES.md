# Visual Consistency Issues - Line-by-Line Fixes

This document provides specific line-by-line fixes for visual consistency issues found in the MyPage components.

---

## MyPage.tsx Fixes

### Issue 1: MenuItem Hover Color Inconsistency
**Location**: Line 182
**Current**:
```tsx
<div className="text-gray-400 mr-4 group-hover:text-primary-500 transition-colors">{icon}</div>
```
**Fix**:
```tsx
<div className="text-gray-400 mr-4 group-hover:text-primary-600 transition-colors">{icon}</div>
```
**Reason**: Should use `primary-600` to match MyPageEnhanced.tsx (line 383)

---

### Issue 2: Logout Button Not Using Standard Classes
**Location**: Lines 165-170
**Current**:
```tsx
<button
  onClick={handleLogout}
  className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
>
  <LogOut size={18} className="mr-2" /> 로그아웃
</button>
```
**Fix** (temporary, until Button component is created):
```tsx
<button
  onClick={handleLogout}
  className="btn-danger w-full flex items-center justify-center gap-2"
>
  <LogOut size={18} /> 로그아웃
</button>
```

**Additional CSS needed in index.css**:
```css
.btn-danger {
  @apply px-6 py-3 rounded-xl font-medium transition-all duration-200;
  background-color: #FEF2F2; /* red-50 */
  color: #DC2626; /* red-600 */
}

.btn-danger:hover {
  background-color: #FEE2E2; /* red-100 */
}
```

---

### Issue 3: Inconsistent Dark Mode Support
**Location**: Lines 107, 115, 123, 131, 139
**Current**:
```tsx
<div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
```
**Issue**: Dark mode classes present in MyPage.tsx but not in MyPageEnhanced.tsx

**Decision Required**:
1. **Option A**: Remove dark mode classes from MyPage.tsx (for now)
2. **Option B**: Add dark mode classes to MyPageEnhanced.tsx

**Recommended**: Option A (remove until dark mode is fully implemented)
```tsx
<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
```

---

### Issue 4: Icon Size for Stat Cards
**Location**: Line 101
**Current**:
```tsx
<Trophy className="text-white/80" size={32} />
```
**Fix**: No change needed - size is appropriate for large decorative icon

---

### Issue 5: Inconsistent Stat Card Text Colors
**Location**: Multiple lines (107-145)
**Current**: Uses different text colors for different stats
```tsx
className="text-primary-500"   // Line 109
className="text-accent-purple" // Line 117
className="text-primary-500"   // Line 125
className="text-orange-500"    // Line 133
className="text-amber-500"     // Line 141
```

**Analysis**: This is intentional for visual differentiation - **No fix needed**

However, these should be documented as semantic color tokens:
```typescript
// Add to design-system/tokens.ts
export const STAT_COLORS = {
  primary: 'text-primary-500',
  accuracy: 'text-accent-purple',
  streak: 'text-orange-500',
  best: 'text-amber-500',
} as const;
```

---

## MyPageEnhanced.tsx Fixes

### Issue 1: Missing Dark Mode Classes
**Location**: Lines 255, 263, 273, 283, 291
**Current**:
```tsx
<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
```
**Fix**: Either add dark mode or keep consistent with removal in MyPage.tsx
```tsx
<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
```
**Recommendation**: Keep as-is (no dark mode) until feature is fully planned

---

### Issue 2: Logout Button Duplication
**Location**: Lines 320-325
**Current**: Identical to MyPage.tsx - same issue
**Fix**: Same as MyPage.tsx Issue 2

---

### Issue 3: ChevronRight Missing from MenuItem
**Location**: Line 395
**Current**: MenuItem in MyPageEnhanced.tsx doesn't include ChevronRight icon
**Fix**: Already properly implemented - includes ChevronRight when no badge

**No fix needed** - implementation is correct

---

## MyPageModals.tsx Fixes

### Issue 1: Inconsistent Modal Footer Button Layout
**Location**: Multiple locations (Lines 281-291, 606-612, 812-818)

**Current Pattern 1** (ProfileEditModal, HealthProfileModal):
```tsx
<div className="flex gap-3 pt-4 border-t border-gray-100">
  <button type="button" onClick={onClose} className="btn-ghost flex-1">
    취소
  </button>
  <button type="submit" className="btn-primary flex-1">
    저장
  </button>
</div>
```

**Current Pattern 2** (BookmarkedPapersModal, MyPostsModal):
```tsx
<div className="border-t border-gray-100 px-6 py-4">
  <button onClick={onClose} className="btn-ghost w-full">
    닫기
  </button>
</div>
```

**Issue**: Inconsistent padding and structure

**Fix**: Standardize all modal footers
```tsx
// For modals with actions
<div className="border-t border-gray-100 px-6 py-4 flex gap-3">
  <button onClick={onClose} className="btn-ghost flex-1">
    취소
  </button>
  <button onClick={handleSubmit} className="btn-primary flex-1">
    저장
  </button>
</div>

// For modals with single close button
<div className="border-t border-gray-100 px-6 py-4">
  <button onClick={onClose} className="btn-ghost w-full">
    닫기
  </button>
</div>
```

**Changes Required**:
- Line 281: Change `pt-4` to `px-6 py-4` (remove padding from parent, add to footer)
- Line 606: Already correct ✅
- Line 812: Already correct ✅

---

### Issue 2: Tab Border Color Inconsistency
**Location**: Line 406
**Current**:
```tsx
className={activeTab === 'conditions' ? 'tab-selected' : 'tab-unselected'}
```

**CSS Reference** (index.css line 280):
```css
.tab-selected {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-accent-purple);
}
```

**Issue**: Tab uses accent-purple border but primary text color

**Analysis**: This is intentional design (gradient theme) - **No fix needed**

However, for better clarity, could create specific tab variant:
```css
.tab-health-selected {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-accent-purple);
}
```

---

### Issue 3: Arbitrary CSS Variable Usage
**Location**: Lines 189, 441, 449, 561, 679, 724, 758, 882, 998
**Current**:
```tsx
className="from-[var(--color-primary)] to-[var(--color-accent-purple)]"
className="border-[var(--color-primary)] bg-[var(--color-input-bar)]"
```

**Issue**: Verbose and inconsistent with Tailwind approach

**Fix**: Update tailwind.config.js to include these as named colors
```javascript
// tailwind.config.js
colors: {
  'input-bar': '#F2FFFD',
  // ... other colors
}
```

**Then update usage**:
```tsx
// Before
className="bg-[var(--color-input-bar)]"

// After
className="bg-input-bar"
```

**Exception**: Gradient backgrounds should keep inline styles
```tsx
// Keep as-is for gradients
style={{ background: 'var(--gradient-primary)' }}
```

---

### Issue 4: Toggle Switch Accessibility
**Location**: Line 844
**Current**:
```tsx
<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
```

**Issue**: Very long className, hard to maintain

**Fix**: Extract to component class in index.css
```css
/* Add to index.css */
.toggle-switch {
  @apply w-11 h-6 bg-gray-200 rounded-full;
  @apply peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2;
  @apply after:content-[''] after:absolute after:top-[2px] after:left-[2px];
  @apply after:bg-white after:rounded-full after:h-5 after:w-5;
  @apply after:transition-all;
  @apply peer-checked:after:translate-x-full peer-checked:after:border-white;
  background-color: var(--color-primary);
}

.toggle-switch:not(.peer-checked) {
  @apply bg-gray-200;
}
```

**Then update usage**:
```tsx
<div className="toggle-switch peer"></div>
```

---

### Issue 5: Badge Post Type Classes
**Location**: Lines 964-973
**Current**: Uses string-based badge class lookup
```tsx
const badges = {
  BOARD: 'badge-free',
  CHALLENGE: 'badge-challenge',
  SURVEY: 'badge-survey',
};
```

**Issue**: Mapping is correct but should be in a shared location

**Fix**: Move to constants file
```typescript
// src/constants/badges.ts
export const POST_TYPE_BADGES = {
  BOARD: { class: 'badge-free', label: '게시판' },
  CHALLENGE: { class: 'badge-challenge', label: '챌린지' },
  SURVEY: { class: 'badge-survey', label: '설문조사' },
} as const;
```

---

## Summary of Changes Required

### Immediate Fixes (High Priority)

| File | Line(s) | Issue | Complexity |
|------|---------|-------|------------|
| MyPage.tsx | 182 | MenuItem hover color | Easy |
| MyPage.tsx | 165-170 | Logout button standardization | Medium |
| MyPageModals.tsx | 281 | Modal footer padding | Easy |
| index.css | N/A | Add .btn-danger class | Easy |

### Medium Priority

| File | Line(s) | Issue | Complexity |
|------|---------|-------|------------|
| MyPage.tsx | 107-145 | Dark mode removal | Easy |
| MyPageEnhanced.tsx | 320-325 | Logout button (same as above) | Medium |
| tailwind.config.js | N/A | Add input-bar color | Easy |
| MyPageModals.tsx | Various | Replace arbitrary CSS vars | Medium |

### Low Priority (Refactoring)

| File | Line(s) | Issue | Complexity |
|------|---------|-------|------------|
| index.css | N/A | Extract toggle-switch class | Medium |
| constants/badges.ts | N/A | Create badge constants file | Easy |
| design-system/tokens.ts | N/A | Create stat color tokens | Easy |

---

## Testing Checklist

After applying fixes, test these scenarios:

- [ ] All buttons have consistent hover states
- [ ] Menu items show correct hover color (primary-600)
- [ ] Logout button uses btn-danger class
- [ ] Modal footers have consistent padding
- [ ] No dark mode classes in either MyPage file (or all have them)
- [ ] All badges render correctly
- [ ] Toggle switches work properly
- [ ] No visual regressions in spacing/layout

---

## Migration Order

1. **First**: Add .btn-danger to index.css
2. **Second**: Fix MenuItem hover color (MyPage.tsx line 182)
3. **Third**: Update logout buttons in both files
4. **Fourth**: Fix modal footer padding inconsistency
5. **Fifth**: Update tailwind.config.js with input-bar color
6. **Sixth**: Replace arbitrary CSS variable references
7. **Last**: Extract toggle-switch and badge constants

---

## Automated Fix Script

You can automate some of these fixes with this bash script:

```bash
#!/bin/bash

# Fix MenuItem hover color in MyPage.tsx
sed -i '' 's/group-hover:text-primary-500/group-hover:text-primary-600/g' \
  src/pages/MyPage.tsx

# Remove dark mode classes from MyPage.tsx (if decision is to remove)
sed -i '' 's/ dark:bg-gray-700//g' src/pages/MyPage.tsx
sed -i '' 's/ dark:bg-gray-700//g' src/pages/MyPage.tsx
sed -i '' 's/ dark:text-white//g' src/pages/MyPage.tsx
sed -i '' 's/ dark:text-gray-400//g' src/pages/MyPage.tsx

echo "Automated fixes applied. Please review changes and test."
```

**Warning**: Always review automated changes before committing!

---

Last Updated: 2025-11-27
