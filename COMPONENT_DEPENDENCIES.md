# Component Dependencies Map

This document visualizes the dependencies between components and pages that need to be migrated.

---

## Dependency Graph

### ImageWithFallback Component (CRITICAL)
```
ImageWithFallback.tsx (MUST MIGRATE FIRST)
│
├── NewsDetailPage.tsx
├── NutriCoachPage.tsx
└── DietLogPage.tsx
```

### MobileHeader Component (CRITICAL)
```
MobileHeader.tsx (MUST MIGRATE FIRST)
│
├── LayoutContext.tsx (dependency)
│
├── BookmarkPage.tsx
├── NewsDetailPage.tsx
├── HealthRecordsPage.tsx
├── QuizListPage.tsx
└── NutriCoachPage.tsx
```

---

## Component Dependencies by Page

### BookmarkPage
```
BookmarkPage.tsx
│
├── MobileHeader.tsx (REQUIRED)
├── lucide-react (Star, ExternalLink, ChevronRight)
└── React Router (useNavigate)
```

### DashboardPage
```
DashboardPage.tsx
│
└── lucide-react (TrendingUp, TrendingDown)
```

### DietLogPage
```
DietLogPage.tsx
│
├── ImageWithFallback.tsx (REQUIRED)
├── lucide-react (Plus, Edit, Trash2, TrendingUp)
└── Complex state management (meal logs, goals)
```

### HealthRecordsPage
```
HealthRecordsPage.tsx
│
├── MobileHeader.tsx (REQUIRED)
├── lucide-react (Plus, Calendar, X, ChevronDown)
└── Complex form state management
```

### KidneyDiseaseStagePage
```
KidneyDiseaseStagePage.tsx
│
├── lucide-react (ArrowLeft, Check)
└── React Router (useNavigate)
```

### NewsDetailPage
```
NewsDetailPage.tsx
│
├── MobileHeader.tsx (REQUIRED)
├── ImageWithFallback.tsx (REQUIRED)
├── lucide-react (Star, ChevronRight)
└── React Router (useParams, useNavigate)
```

### NutriCoachPage
```
NutriCoachPage.tsx
│
├── MobileHeader.tsx (REQUIRED)
├── ImageWithFallback.tsx (REQUIRED)
└── Tab navigation state
```

### NutritionAnalysisCard
```
NutritionAnalysisCard.tsx
│
├── Custom SVG circular gauge (complex)
├── Recipe card sub-component
└── No external dependencies (self-contained)
```

### ProfilePage
```
ProfilePage.tsx
│
├── lucide-react (Save, ChevronRight)
├── React Router (useNavigate)
├── Complex form state (3 tabs)
└── Navigation to KidneyDiseaseStagePage
```

### QuizListPage
```
QuizListPage.tsx
│
├── MobileHeader.tsx (REQUIRED)
├── lucide-react (Trophy, Star, Clock, ChevronRight, CheckCircle)
└── Quiz data state
```

### SupportPage
```
SupportPage.tsx
│
├── lucide-react (HelpCircle, MessageCircle, Mail, Phone, FileText)
├── Tab state management (3 tabs)
└── Form state for contact form
```

### Splash
```
Splash.tsx
│
├── React Router (useNavigate)
└── CSS animations (inline styles)
```

---

## Migration Order Recommendation

### Phase 1: Foundation Components (Days 1-3)
```
1. ImageWithFallback.tsx
2. MobileHeader.tsx (or integrate with existing Header)
3. LayoutContext updates
4. UI components (accordion, alert, etc.)
```

### Phase 2: Independent Pages (Days 4-7)
```
5. Splash.tsx (no dependencies)
6. DashboardPage.tsx (minimal dependencies)
7. KidneyDiseaseStagePage.tsx (minimal dependencies)
```

### Phase 3: Feature Pages (Days 8-18)
```
8. SupportPage.tsx
9. QuizListPage.tsx (depends on MobileHeader)
10. BookmarkPage.tsx (depends on MobileHeader)
11. NutritionAnalysisCard.tsx
12. DietLogPage.tsx (depends on ImageWithFallback, NutritionAnalysisCard)
13. HealthRecordsPage.tsx (depends on MobileHeader)
14. NutriCoachPage.tsx (depends on MobileHeader, ImageWithFallback)
```

### Phase 4: Integration Pages (Days 19-25)
```
15. NewsDetailPage.tsx (depends on MobileHeader, ImageWithFallback)
16. ProfilePage.tsx (merge with MyPageEnhanced)
17. Chat pages evaluation
```

---

## External Dependencies Analysis

### NPM Packages Required

#### Already in new_frontend:
- react
- react-router-dom
- lucide-react
- tailwindcss

#### May need to add:
- None identified (all dependencies exist)

### Asset Dependencies

#### Images:
- Unsplash integration in NutriCoachPage
  - Can be replaced with local assets or API

#### Icons:
- All using lucide-react (already available)

#### Fonts:
- Using system fonts (no special requirements)

---

## State Management Dependencies

### Pages Using Context:
```
MobileHeader.tsx
├── useLayout() from LayoutContext
    ├── openDrawer
    └── isLoggedIn
```

**Action Required:**
- Compare LayoutContext with AppContext in new_frontend
- Migrate or adapt context patterns

### Pages with Complex State:
```
DietLogPage.tsx
├── Diet goals state
├── Meal logs array state
└── Modal visibility states

HealthRecordsPage.tsx
├── Health records array state
├── Form data state
└── Edit mode state

ProfilePage.tsx
├── Account info state
├── Personal info state
└── Tab navigation state

SupportPage.tsx
├── Contact form state
├── Tab navigation state
└── FAQ expansion state
```

**Action Required:**
- Consider using form libraries (react-hook-form)
- May benefit from Zustand for complex state

---

## API Integration Points

### Backend Endpoints Needed

```
BookmarkPage
├── GET /api/bookmarks/news
├── GET /api/bookmarks/papers
└── DELETE /api/bookmarks/{id}

DietLogPage
├── GET /api/diet/logs
├── POST /api/diet/logs
├── PUT /api/diet/logs/{id}
├── DELETE /api/diet/logs/{id}
├── GET /api/diet/goals
└── PUT /api/diet/goals

HealthRecordsPage
├── GET /api/health/records
├── POST /api/health/records
├── PUT /api/health/records/{id}
└── DELETE /api/health/records/{id}

NewsDetailPage
├── GET /api/news/{id}
├── GET /api/news/{id}/related
└── POST /api/bookmarks/news/{id}

ProfilePage
├── GET /api/user/profile
├── PUT /api/user/profile/account
├── PUT /api/user/profile/personal
└── PUT /api/user/profile/medical

QuizListPage
├── GET /api/quiz/list
└── GET /api/user/quiz/progress

SupportPage
├── POST /api/support/contact
└── GET /api/support/faq
```

---

## Routing Dependencies

### New Routes to Add

```typescript
// Add to new_frontend/src/routes/AppRoutes.tsx

// Bookmarks
<Route path="/bookmarks" element={<BookmarkPage />} />

// Dashboard (if keeping separate from trends)
<Route path="/dashboard" element={<DashboardPage />} />

// Diet
<Route path="/diet/log" element={<DietLogPage />} />
<Route path="/diet/coach" element={<NutriCoachPage />} />

// Health
<Route path="/health/records" element={<HealthRecordsPage />} />

// News
<Route path="/news/detail/:id" element={<NewsDetailPage />} />

// Profile
<Route path="/profile" element={<ProfilePage />} />
<Route path="/profile/kidney-stage" element={<KidneyDiseaseStagePage />} />

// Quiz
<Route path="/quiz" element={<QuizListPage />} />

// Support
<Route path="/support" element={<SupportPage />} />

// Splash (optional)
<Route path="/splash" element={<Splash />} />
```

---

## Design Token Mapping

### Old Frontend → New Frontend

#### Colors
```
Old: var(--color-primary)
New: #00C9B7 or bg-primary/text-primary

Old: var(--color-text-primary)
New: #1F2937 or text-gray-900

Old: var(--color-text-secondary)
New: #666666 or text-gray-600

Old: var(--color-text-tertiary)
New: #999999 or text-gray-400

Old: var(--color-line-2)
New: #E0E0E0 or border-gray-200

Old: var(--color-line-3)
New: #E5E7EB or border-gray-300

Old: var(--gradient-primary)
New: linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)
```

#### Spacing
```
Old: Custom padding/margin
New: Use Tailwind spacing (p-4, m-6, etc.)
```

#### Typography
```
Old: fontSize inline styles
New: Tailwind text utilities (text-sm, text-base, text-lg)

Old: Font weights in style objects
New: Tailwind font utilities (font-normal, font-medium, font-bold)
```

#### Border Radius
```
Old: Custom border-radius
New: Tailwind rounded utilities (rounded-xl, rounded-lg)
```

---

## Testing Dependencies

### Components Requiring Test Setup

```
Each migrated component needs:
├── Unit tests (component logic)
├── Integration tests (with APIs)
├── Accessibility tests (a11y)
└── Visual regression tests (optional)
```

### Test Files to Create

```
new_frontend/src/
├── components/
│   ├── figma/__tests__/
│   │   └── ImageWithFallback.test.tsx
│   ├── diet/__tests__/
│   │   └── NutritionAnalysisCard.test.tsx
│   └── layout/__tests__/
│       └── MobileHeader.test.tsx
└── pages/__tests__/
    ├── BookmarkPage.test.tsx
    ├── DietLogPage.test.tsx
    ├── HealthRecordsPage.test.tsx
    ├── NewsDetailPage.test.tsx
    ├── NutriCoachPage.test.tsx
    ├── ProfilePage.test.tsx
    ├── QuizListPage.test.tsx
    └── SupportPage.test.tsx
```

---

## Critical Path Analysis

### Blocking Dependencies (Must Complete First)

```
CRITICAL PATH:
1. ImageWithFallback.tsx
   └── Blocks: NewsDetailPage, NutriCoachPage, DietLogPage

2. MobileHeader.tsx (or integration)
   └── Blocks: BookmarkPage, NewsDetailPage, HealthRecordsPage, QuizListPage, NutriCoachPage

3. Backend API endpoints
   └── Blocks: All functional pages (can use mock data temporarily)
```

### Parallel Work Opportunities

```
CAN WORK IN PARALLEL:
Group A:
- Splash.tsx
- DashboardPage.tsx
- KidneyDiseaseStagePage.tsx

Group B (after ImageWithFallback):
- DietLogPage.tsx
- NutriCoachPage.tsx
- NewsDetailPage.tsx

Group C (after MobileHeader):
- BookmarkPage.tsx
- HealthRecordsPage.tsx
- QuizListPage.tsx

Group D (independent):
- SupportPage.tsx
- ProfilePage.tsx (partial)
- NutritionAnalysisCard.tsx
```

---

## Documentation Dependencies

### Required Documentation

```
1. Component API Documentation
   ├── ImageWithFallback props
   ├── NutritionAnalysisCard props
   └── MobileHeader props

2. Page Documentation
   ├── Each page's purpose
   ├── State management approach
   ├── API integration points
   └── User flows

3. Migration Notes
   ├── Decisions made
   ├── Deviations from original
   ├── Known issues
   └── Future improvements

4. Testing Documentation
   ├── Test coverage reports
   ├── Test scenarios
   └── Manual testing checklists
```

---

## Version Control Strategy

### Branch Structure

```
develop (main integration branch)
│
├── feature/migrate-foundation
│   ├── ImageWithFallback component
│   ├── MobileHeader integration
│   └── UI components
│
├── feature/migrate-diet-features
│   ├── DietLogPage
│   ├── NutriCoachPage
│   └── NutritionAnalysisCard
│
├── feature/migrate-health-features
│   ├── HealthRecordsPage
│   └── KidneyDiseaseStagePage
│
├── feature/migrate-user-features
│   ├── ProfilePage
│   ├── BookmarkPage
│   └── QuizListPage
│
└── feature/migrate-content-features
    ├── NewsDetailPage
    ├── SupportPage
    └── Splash
```

### PR Strategy

```
Each feature branch:
1. Small, focused PRs (1-2 pages max)
2. Include tests
3. Update documentation
4. Get design review
5. QA approval before merge
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Prepared By:** Claude Code Analysis
