# Diet Care Component Testing Checklist

## Overview
Comprehensive testing checklist for all Diet Care components and hooks.

## Component Testing

### ✅ DietTypeCard

#### Functionality
- [ ] Displays title correctly
- [ ] Displays limit information
- [ ] Renders all tips in the list
- [ ] Applies correct border color

#### Performance
- [ ] Does not re-render when parent re-renders with same props
- [ ] Does not re-render when unrelated props change
- [ ] Renders consistently with React.memo

#### Accessibility
- [ ] Has proper semantic HTML (article, h3, ul, li)
- [ ] Has aria-labelledby pointing to title
- [ ] Has role="region"
- [ ] Tips list has aria-label
- [ ] Bullet points have aria-hidden="true"

#### Visual
- [ ] Card has hover shadow effect
- [ ] Dark mode colors render correctly
- [ ] Border colors match theme
- [ ] Text is readable in both light/dark modes

### ✅ NutriCoachContent

#### Functionality
- [ ] Renders all 4 diet type cards
- [ ] Displays correct content based on language (ko/en)
- [ ] Includes FoodImageAnalyzer component
- [ ] Diet types array changes when language changes

#### Performance
- [ ] Component is memoized with React.memo
- [ ] dietTypes array is memoized with useMemo
- [ ] Only re-renders when language prop changes

#### Accessibility
- [ ] Section has aria-labelledby
- [ ] Heading has unique ID
- [ ] Diet cards grid has role="list"
- [ ] Icon has aria-hidden="true"

### ✅ FoodImageAnalyzer

#### Functionality
- [ ] File input accepts image files
- [ ] Drag and drop works correctly
- [ ] Image preview shows after selection
- [ ] Clear button removes image
- [ ] Analyze button calls analyze function
- [ ] Abort button cancels ongoing analysis
- [ ] Error messages display correctly
- [ ] Results display after successful analysis

#### Performance
- [ ] Component is memoized
- [ ] Event handlers are memoized with useCallback
- [ ] No unnecessary re-renders during analysis

#### Accessibility
- [ ] Section has aria-labelledby
- [ ] File input has aria-label
- [ ] Upload area has role="button" and tabIndex={0}
- [ ] Analyze button has aria-label and aria-busy
- [ ] Clear button has aria-label
- [ ] Abort button has aria-label
- [ ] Error has role="alert" and aria-live="assertive"
- [ ] Results have role="region" and aria-live="polite"
- [ ] Focus returns to file input after clearing

#### Focus Management
- [ ] File input is focusable
- [ ] Upload area is keyboard accessible
- [ ] Focus moves to clear button after upload
- [ ] Focus returns to file input after clear
- [ ] Tab order is logical

#### Visual States
- [ ] Upload area shows hover state
- [ ] Upload area shows focus ring
- [ ] Disabled states render correctly
- [ ] Loading spinner animates during analysis
- [ ] State text changes based on analysis phase
- [ ] Abort button only shows during analysis

### ✅ NutritionProgressBar

#### Functionality
- [ ] Displays correct current/target values
- [ ] Calculates percentage correctly
- [ ] Shows warning state at threshold
- [ ] Shows danger state when exceeded
- [ ] Color changes based on percentage
- [ ] Status text updates correctly

#### Performance
- [ ] Component is memoized
- [ ] Only re-renders when props change

#### Accessibility
- [ ] Has role="region"
- [ ] Label has unique ID
- [ ] Progress has aria-labelledby
- [ ] Progress has aria-valuenow/min/max
- [ ] Progress has aria-valuetext
- [ ] Percentage has aria-live="polite"
- [ ] Status has role="status"

#### Visual
- [ ] Progress bar fills correctly
- [ ] Colors change at thresholds
- [ ] Text color matches progress color
- [ ] Dark mode works correctly
- [ ] Number formatting includes commas

### ✅ GoalSettingForm

#### Functionality
- [ ] All 5 input fields render
- [ ] Form validation works
- [ ] Min/max constraints enforced
- [ ] Submit button calls saveGoals
- [ ] Loading state shows during save
- [ ] Success toast appears after save
- [ ] Error toast appears on failure

#### Accessibility
- [ ] Each input has proper label
- [ ] Error messages are announced
- [ ] Form has semantic structure
- [ ] Submit button is keyboard accessible

### ✅ MealLogForm

#### Functionality
- [ ] All 4 meal sections render
- [ ] Add food button works
- [ ] Remove food button works (when > 1 item)
- [ ] Multiple food items can be added
- [ ] Form submits with correct data
- [ ] Empty food names are filtered out

#### Accessibility
- [ ] Each input has proper label
- [ ] Add/remove buttons have aria-labels
- [ ] Form structure is semantic

## Hook Testing

### ✅ useImageUpload

#### Functionality
- [ ] File selection updates state
- [ ] Drag and drop updates state
- [ ] File validation works (type, size)
- [ ] Preview URL is created
- [ ] Clear function works
- [ ] Error state updates correctly

#### Memory Management
- [ ] Object URL is revoked on clear
- [ ] Object URL is revoked on new selection
- [ ] Object URL is revoked on unmount
- [ ] No memory leaks

#### Error Handling
- [ ] Invalid file type shows error
- [ ] File too large shows error
- [ ] Error messages are localized

### ✅ useNutritionAnalysis

#### State Machine
- [ ] Starts in 'idle' state
- [ ] Transitions to 'creating_session'
- [ ] Transitions to 'analyzing'
- [ ] Transitions to 'success' on completion
- [ ] Transitions to 'error' on failure
- [ ] Reset returns to 'idle'

#### Functionality
- [ ] Creates session if needed
- [ ] Reuses existing session
- [ ] Calls analyzeNutrition API
- [ ] Handles successful response
- [ ] Handles error response
- [ ] Handles timeout (30s)
- [ ] Handles abort

#### Memory Management
- [ ] AbortController is created
- [ ] AbortController is cleaned up
- [ ] Timeout is cleared on success
- [ ] Timeout is cleared on error
- [ ] Cleanup runs on unmount

#### Error Types
- [ ] Handles AbortError
- [ ] Handles timeout error
- [ ] Handles network error
- [ ] Handles API error
- [ ] Error messages are localized

### ✅ useDietGoals

#### Functionality
- [ ] Loads goals on mount
- [ ] Updates form when goals load
- [ ] Saves goals to API
- [ ] Saves goals to localStorage (fallback)
- [ ] Success toast on save
- [ ] Error toast on failure

#### Integration
- [ ] Works with react-hook-form
- [ ] Form default values are correct
- [ ] Form resets with loaded values

### ✅ useDietLog

#### Functionality
- [ ] Initializes field arrays correctly
- [ ] Add functions work for each meal type
- [ ] Remove functions work for each meal type
- [ ] Submit converts data correctly
- [ ] Filters out empty food names
- [ ] Adds timestamps to entries

#### Integration
- [ ] Works with react-hook-form
- [ ] Works with useFieldArray
- [ ] Form state updates correctly

### ✅ useNutritionProgress

#### Functionality
- [ ] Loads daily summary on mount
- [ ] Calculates percentages correctly
- [ ] Caps percentage at 100%
- [ ] Refreshes on demand
- [ ] Updates when date changes

#### Calculations
- [ ] Handles zero target (no division by zero)
- [ ] Rounds percentages correctly
- [ ] Formats numbers correctly

## Integration Testing

### User Flows

#### Flow 1: Set Goals
1. [ ] Navigate to Diet Log page
2. [ ] Enter all goal values
3. [ ] Click "Save Goals"
4. [ ] See success toast
5. [ ] Goals persist on page reload

#### Flow 2: Analyze Food Image
1. [ ] Navigate to Nutri Coach page
2. [ ] Upload food image via click
3. [ ] See image preview
4. [ ] Click "Analyze"
5. [ ] See loading state
6. [ ] See results with nutrition table
7. [ ] See recommendations/warnings

#### Flow 3: Analyze Food Image (Drag & Drop)
1. [ ] Navigate to Nutri Coach page
2. [ ] Drag food image to upload area
3. [ ] See image preview
4. [ ] Continue with analysis

#### Flow 4: Log Meal
1. [ ] Navigate to Diet Log page
2. [ ] Add food items to breakfast
3. [ ] Add food items to lunch
4. [ ] Add food items to dinner
5. [ ] Add snacks
6. [ ] Click "View Nutrition Analysis"
7. [ ] See success toast
8. [ ] Meal persists on page reload

#### Flow 5: Abort Analysis
1. [ ] Upload image
2. [ ] Click "Analyze"
3. [ ] Click "Cancel" during analysis
4. [ ] Analysis stops
5. [ ] Can upload new image

#### Flow 6: Error Handling
1. [ ] Upload invalid file type
2. [ ] See error message
3. [ ] Upload file too large
4. [ ] See error message
5. [ ] Try analysis without image
6. [ ] See error message

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals (if any)

### Screen Reader Testing
- [ ] All images have alt text
- [ ] All buttons have labels
- [ ] Form labels are associated
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Success messages are announced
- [ ] Live regions update correctly

### ARIA Validation
- [ ] Run axe DevTools
- [ ] No accessibility violations
- [ ] All interactive elements have roles
- [ ] All regions have labels
- [ ] All progress bars have ARIA attributes

## Visual Testing

### Responsive Design
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)
- [ ] Layout adapts correctly
- [ ] No horizontal scroll

### Dark Mode
- [ ] All text is readable
- [ ] All colors have sufficient contrast
- [ ] Border colors are visible
- [ ] Focus indicators are visible
- [ ] Icons are visible

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Mobile Chrome

## Performance Testing

### React DevTools Profiler
- [ ] DietTypeCard renders <3ms
- [ ] NutriCoachContent renders <10ms
- [ ] FoodImageAnalyzer renders <5ms
- [ ] No unnecessary re-renders
- [ ] Memo optimization working

### Memory Testing
- [ ] No memory leaks in image upload
- [ ] No memory leaks in analysis
- [ ] Object URLs are properly cleaned up
- [ ] Event listeners are cleaned up

### Network Testing
- [ ] Analysis request completes
- [ ] Timeout works after 30s
- [ ] Abort cancels request
- [ ] Error handling for network failures

## Edge Cases

### Empty States
- [ ] No goals set
- [ ] No meals logged
- [ ] No analysis results
- [ ] Empty food lists

### Error States
- [ ] API error
- [ ] Network error
- [ ] Timeout error
- [ ] Invalid file
- [ ] File too large

### Boundary Values
- [ ] Zero values in goals
- [ ] Maximum values in goals
- [ ] 100% progress
- [ ] >100% progress
- [ ] Negative values (rejected)

### Localization
- [ ] All Korean text displays correctly
- [ ] All English text displays correctly
- [ ] Language switch works mid-flow
- [ ] Numbers format correctly for locale

## Test Coverage Goals

- [ ] Unit tests: >90% coverage
- [ ] Integration tests: >80% coverage
- [ ] E2E tests: Critical paths covered
- [ ] Accessibility tests: No violations
- [ ] Visual regression tests: Key components

## Sign-off

- [ ] All functionality tests passed
- [ ] All performance tests passed
- [ ] All accessibility tests passed
- [ ] All visual tests passed
- [ ] All edge cases handled
- [ ] Documentation complete
- [ ] Code review complete
- [ ] Ready for production
