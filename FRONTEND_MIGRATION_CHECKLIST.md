# Frontend Migration Checklist

**Analysis Date:** 2025-11-27
**Old Frontend Location:** `/frontend/`
**New Frontend Location:** `/new_frontend/`

## Executive Summary

- **Old Frontend Files:** 52 TypeScript/React files (excluding UI library)
- **New Frontend Files:** 72 TypeScript/React files (excluding UI library)
- **Missing Pages:** 15 pages need migration
- **Missing Components:** 10+ components need migration
- **Figma Components:** 1 utility component identified

---

## 1. Figma Integration Components

### 1.1 ImageWithFallback Component

**File Path:** `/frontend/src/components/figma/ImageWithFallback.tsx`

**Purpose:** Provides graceful image loading with error fallback display

**Dependencies:**
- React (useState)
- No external libraries

**Usage Pattern:**
```tsx
<ImageWithFallback
  src={imageUrl}
  alt="Description"
  className="w-full h-full object-cover"
/>
```

**Migration Status:** REQUIRED
**Migration Complexity:** LOW
**Action Required:**
- Copy to `/new_frontend/src/components/figma/`
- Currently used in: NewsDetailPage, NutriCoachPage, DietLogPage
- Test with various image URLs and error scenarios

---

## 2. Missing Pages Analysis

### 2.1 BookmarkPage
**File:** `/frontend/src/pages/BookmarkPage.tsx` (191 lines)

**Purpose:** Manage bookmarked news articles and research papers

**Features:**
- Tab-based interface (News/Papers)
- Bookmark removal functionality
- Navigation to detail pages
- Empty state handling

**Dependencies:**
- lucide-react: Star, ExternalLink, ChevronRight
- MobileHeader component
- React Router (useNavigate)

**Migration Complexity:** MEDIUM
**Needs Adaptation:** YES
- Replace MobileHeader with new_frontend's layout system
- Update routing paths
- Integrate with new_frontend's state management
- Connect to backend API for bookmarks

---

### 2.2 DashboardPage
**File:** `/frontend/src/pages/DashboardPage.tsx` (93 lines)

**Purpose:** Display trending keywords and research trends dashboard

**Features:**
- Popular keywords with trend indicators
- Research trends visualization area
- Responsive grid layout

**Dependencies:**
- lucide-react: TrendingUp, TrendingDown
- Mock data (needs backend integration)

**Migration Complexity:** LOW
**Needs Adaptation:** YES
- Connect to real backend API
- Implement actual chart visualization
- Update design system colors

---

### 2.3 DietLogPage
**File:** `/frontend/src/pages/DietLogPage.tsx` (301 lines)

**Purpose:** Track daily meal logs with nutrient tracking

**Features:**
- Meal logging with nutrients (potassium, phosphorus, protein, calories)
- Diet goal setting modal
- Progress bars for nutrient tracking
- Add/Edit/Delete meal logs
- Floating action button

**Dependencies:**
- lucide-react: Plus, Edit, Trash2, TrendingUp
- ImageWithFallback component
- Complex state management

**Migration Complexity:** HIGH
**Needs Adaptation:** YES
- Integrate with DietCarePageEnhanced
- Backend API integration for meal logs
- Replace ImageWithFallback import path
- Update modal system to match new_frontend

---

### 2.4 HealthRecordsPage
**File:** `/frontend/src/pages/HealthRecordsPage.tsx` (272 lines)

**Purpose:** Manage hospital checkup records

**Features:**
- Medical record CRUD operations
- Form for adding/editing records
- Display of creatinine, eGFR metrics
- Date-based organization
- Inline edit mode

**Dependencies:**
- lucide-react: Plus, Calendar, X, ChevronDown
- MobileHeader component
- Complex form state

**Migration Complexity:** MEDIUM
**Needs Adaptation:** YES
- Backend integration for health records
- Update form validation
- Replace MobileHeader
- Consider merging with MyPageEnhanced health features

---

### 2.5 KidneyDiseaseStagePage
**File:** `/frontend/src/pages/KidneyDiseaseStagePage.tsx` (113 lines)

**Purpose:** Select and update kidney disease stage

**Features:**
- Single-select disease stage picker
- 9 disease stage options (CKD 1-5, dialysis types)
- Save functionality
- Custom radio button UI

**Dependencies:**
- lucide-react: ArrowLeft, Check
- React Router navigation

**Migration Complexity:** LOW
**Needs Adaptation:** YES
- Could be integrated into MyPageEnhanced
- Backend API for profile update
- Update design tokens

---

### 2.6 NewsDetailPage
**File:** `/frontend/src/pages/NewsDetailPage.tsx` (146 lines)

**Purpose:** Display full news article with related articles

**Features:**
- Article content display
- Bookmark toggle
- Related news recommendations
- External link to original article
- 16:9 thumbnail display

**Dependencies:**
- lucide-react: Star, ChevronRight
- MobileHeader
- ImageWithFallback
- React Router (useParams)

**Migration Complexity:** MEDIUM
**Needs Adaptation:** YES
- Backend API for news content
- Replace MobileHeader
- Update ImageWithFallback import
- Consider integration with TrendsPageEnhanced

---

### 2.7 NutriCoachPage
**File:** `/frontend/src/pages/NutriCoachPage.tsx` (240 lines)

**Purpose:** Nutritional guidance with food recommendations

**Features:**
- Tab interface (Guide/Log)
- Detailed nutrient information (Potassium, Phosphorus, Protein)
- Safe vs. avoid food lists with images
- CKD stage-specific protein guidelines
- Image-based food cards

**Dependencies:**
- MobileHeader
- ImageWithFallback
- Unsplash images (external)
- Tab navigation

**Migration Complexity:** HIGH
**Needs Adaptation:** YES
- Could merge with DietCarePageEnhanced
- Backend API for nutrition data
- Replace image sources
- Update layout system

---

### 2.8 ProfilePage
**File:** `/frontend/src/pages/ProfilePage.tsx` (290 lines)

**Purpose:** User profile management with multiple tabs

**Features:**
- 3 tabs: Account Info, Personal Info, Medical Info
- Form inputs for various profile fields
- Navigation to KidneyDiseaseStagePage
- Save functionality per tab

**Dependencies:**
- lucide-react: Save, ChevronRight
- React Router navigation
- Complex form state

**Migration Complexity:** MEDIUM
**Needs Adaptation:** YES
- Merge with MyPageEnhanced
- Backend API for profile updates
- Form validation
- Update design system

---

### 2.9 QuizListPage
**File:** `/frontend/src/pages/QuizListPage.tsx` (179 lines)

**Purpose:** Display available quizzes with stats

**Features:**
- Quiz list with completion status
- Stats cards (completed, level, points)
- Quiz metadata display
- Level-based progression

**Dependencies:**
- lucide-react: Trophy, Star, Clock, ChevronRight, CheckCircle
- MobileHeader
- Mock quiz data

**Migration Complexity:** MEDIUM
**Needs Adaptation:** YES
- Backend API for quiz data
- Consider merging with existing QuizPage
- Update stats calculation
- Replace MobileHeader

---

### 2.10 SupportPage
**File:** `/frontend/src/pages/SupportPage.tsx` (299 lines)

**Purpose:** Help and support center

**Features:**
- 3 tabs: FAQ, Contact, Guide
- Expandable FAQ accordion
- Contact form
- Usage guides for features

**Dependencies:**
- lucide-react: HelpCircle, MessageCircle, Mail, Phone, FileText
- Form state management
- Custom tab styling

**Migration Complexity:** MEDIUM
**Needs Adaptation:** YES
- Backend API for contact form
- Update FAQ content
- Design system alignment
- Could be standalone page

---

### 2.11 Splash Page
**File:** `/frontend/src/pages/Splash.tsx` (76 lines)

**Purpose:** App splash screen with branding

**Features:**
- Animated entry
- CareGuide branding
- Auto-redirect timer (disabled)
- Start button navigation

**Dependencies:**
- React Router navigation
- CSS animations
- Gradient styling

**Migration Complexity:** LOW
**Needs Adaptation:** YES
- Update branding if needed
- Configure auto-redirect
- Design system colors

---

### 2.12 Chat Pages (Subdirectory)

#### 2.12.1 SimpleChatPage
**File:** `/frontend/src/pages/chat/SimpleChatPage.tsx` (~350 lines estimated)

**Purpose:** Simplified chat interface

**Migration Complexity:** HIGH
**Needs Adaptation:** YES
- May conflict with ChatPageEnhanced
- Evaluate if needed or can be removed

#### 2.12.2 ChatPage (Parlant Integration)
**File:** `/frontend/src/pages/chat/ChatPage.tsx` (~1100 lines estimated)

**Purpose:** Full-featured chat with Parlant client

**Dependencies:**
- parlantClient.ts
- utils.ts
- sleep.ts

**Migration Complexity:** VERY HIGH
**Needs Adaptation:** YES
- Review overlap with ChatPageEnhanced
- Determine if Parlant integration is still needed
- May require complete reimplementation

---

### 2.13 Other Page Files (Empty or Minimal)

**Files with minimal/no content:**
- `/frontend/src/pages/Nutri.tsx` (0 bytes - empty)
- `/frontend/src/pages/SignUp.tsx` (0 bytes - empty)

**Action:** Can be ignored or removed

---

## 3. Missing Components Analysis

### 3.1 Layout Components

#### 3.1.1 MobileHeader
**File:** `/frontend/src/components/MobileHeader.tsx` (72 lines)

**Purpose:** Consistent mobile header with navigation

**Features:**
- Back button / Menu button toggle
- Centered title
- Optional right action
- Profile/Login button
- Integration with LayoutContext

**Dependencies:**
- lucide-react: ChevronLeft, Menu, User, LogIn
- LayoutContext
- React Router

**Migration Status:** REQUIRED for many pages
**Migration Complexity:** MEDIUM
**Action Required:**
- Compare with new_frontend's Header component
- Check if functionality exists in AppLayout
- May need to create wrapper or update existing

---

#### 3.1.2 Drawer
**File:** `/frontend/src/components/Drawer.tsx` (estimated 150 lines)

**Purpose:** Mobile navigation drawer

**Migration Complexity:** MEDIUM
**Needs Adaptation:** Check overlap with Sidebar/MobileNav in new_frontend

---

#### 3.1.3 Sidebar
**File:** `/frontend/src/components/Sidebar.tsx` (estimated 170 lines)

**Purpose:** Desktop sidebar navigation

**Migration Complexity:** MEDIUM
**Needs Adaptation:** Compare with new_frontend's Sidebar component

---

#### 3.1.4 BottomNav
**File:** `/frontend/src/components/BottomNav.tsx` (estimated 60 lines)

**Purpose:** Mobile bottom navigation bar

**Migration Complexity:** LOW
**Needs Adaptation:** Check if MobileNav in new_frontend covers this

---

#### 3.1.5 Layout & LayoutContext
**Files:**
- `/frontend/src/components/Layout.tsx` (10 lines)
- `/frontend/src/components/LayoutContext.tsx` (50 lines)

**Purpose:** Layout wrapper and context provider

**Migration Complexity:** HIGH
**Needs Adaptation:** Compare with AppContext in new_frontend

---

### 3.2 Specialized Components

#### 3.2.1 NutritionAnalysisCard
**File:** `/frontend/src/components/NutritionAnalysisCard.tsx` (177 lines)

**Purpose:** Display nutrition analysis with circular gauges

**Features:**
- Circular progress gauges for nutrients
- Status indicators (safe/warning/danger)
- Recipe recommendations
- Dietary guidelines display

**Dependencies:**
- Complex SVG circular gauge implementation
- No external chart libraries

**Migration Complexity:** HIGH
**Needs Adaptation:** YES
- Used in diet-related features
- Should integrate with DietCarePageEnhanced
- Consider using chart library instead

---

#### 3.2.2 Logo
**File:** `/frontend/src/components/Logo.tsx` (estimated 30 lines)

**Purpose:** App logo component

**Migration Complexity:** LOW
**Needs Adaptation:** Check if exists in new_frontend

---

## 4. UI Component Library Comparison

### Old Frontend (frontend/src/components/ui/)
**Count:** ~50 shadcn/ui components

**Unique components in old frontend:**
- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- aspect-ratio.tsx
- breadcrumb.tsx
- calendar.tsx
- carousel.tsx
- chart.tsx
- collapsible.tsx
- command.tsx
- context-menu.tsx
- drawer.tsx
- hover-card.tsx
- input-otp.tsx
- menubar.tsx
- navigation-menu.tsx
- pagination.tsx
- popover.tsx
- resizable.tsx
- sidebar.tsx (shadcn version)
- slider.tsx
- table.tsx
- toggle-group.tsx
- toggle.tsx
- tooltip.tsx
- use-mobile.ts (hook)

### New Frontend (new_frontend/src/components/ui/)
**Count:** ~25 shadcn/ui components

**Missing UI components in new_frontend:**
- accordion
- alert-dialog
- alert
- aspect-ratio
- breadcrumb
- calendar
- carousel
- chart
- collapsible
- command
- context-menu
- drawer
- hover-card
- input-otp
- menubar
- navigation-menu
- pagination
- popover
- resizable
- sidebar (shadcn)
- slider
- table
- toggle-group
- toggle
- tooltip
- use-mobile hook

**Action Required:**
- Evaluate which components are needed
- Copy required components from old to new
- Test for version compatibility

---

## 5. Migration Priority Matrix

### CRITICAL (Must Have)
1. **ImageWithFallback** - Used by multiple pages
2. **NutritionAnalysisCard** - Core diet feature
3. **MobileHeader** - Used by 10+ pages
4. **DietLogPage** - Important feature gap

### HIGH Priority
5. **HealthRecordsPage** - Core health tracking
6. **NutriCoachPage** - Diet guidance
7. **BookmarkPage** - User engagement
8. **SupportPage** - User support
9. **ProfilePage** - User profile management

### MEDIUM Priority
10. **NewsDetailPage** - Content display
11. **QuizListPage** - Gamification
12. **KidneyDiseaseStagePage** - Profile setup
13. **DashboardPage** - Analytics
14. **Chat subdirectory pages** - Evaluate need

### LOW Priority
15. **Splash** - Nice to have
16. **Layout components** - May already exist in new_frontend

---

## 6. Component Adaptation Guidelines

### For Each Component/Page Migration:

#### Step 1: Assessment
- [ ] Compare with existing new_frontend components
- [ ] Identify functionality overlap
- [ ] List unique features
- [ ] Check dependencies

#### Step 2: Design System Alignment
- [ ] Update color tokens (var(--color-*) → Tailwind classes)
- [ ] Replace custom gradients with design system
- [ ] Update spacing using Tailwind
- [ ] Align typography with new system

#### Step 3: Component Updates
- [ ] Replace MobileHeader with new layout system
- [ ] Update routing paths
- [ ] Connect to backend APIs (replace mock data)
- [ ] Update state management (Context → Zustand if needed)
- [ ] Replace ImageWithFallback import paths

#### Step 4: Testing
- [ ] Unit tests for logic
- [ ] Component tests with React Testing Library
- [ ] Integration tests with backend
- [ ] Accessibility validation
- [ ] Mobile responsiveness
- [ ] Cross-browser testing

---

## 7. Backend Integration Requirements

### Pages Requiring API Integration:

1. **BookmarkPage**
   - GET /api/bookmarks/news
   - GET /api/bookmarks/papers
   - DELETE /api/bookmarks/{id}

2. **DietLogPage**
   - GET /api/diet/logs
   - POST /api/diet/logs
   - PUT /api/diet/logs/{id}
   - DELETE /api/diet/logs/{id}
   - GET /api/diet/goals
   - PUT /api/diet/goals

3. **HealthRecordsPage**
   - GET /api/health/records
   - POST /api/health/records
   - PUT /api/health/records/{id}
   - DELETE /api/health/records/{id}

4. **NewsDetailPage**
   - GET /api/news/{id}
   - GET /api/news/{id}/related
   - POST /api/bookmarks/news/{id}

5. **ProfilePage**
   - GET /api/user/profile
   - PUT /api/user/profile/account
   - PUT /api/user/profile/personal
   - PUT /api/user/profile/medical

6. **QuizListPage**
   - GET /api/quiz/list
   - GET /api/user/quiz/progress

7. **SupportPage**
   - POST /api/support/contact
   - GET /api/support/faq

---

## 8. File Structure Recommendation

### Proposed new_frontend structure after migration:

```
new_frontend/src/
├── components/
│   ├── chat/          (existing)
│   ├── community/     (existing)
│   ├── diet/          (NEW - migrate NutritionAnalysisCard here)
│   ├── figma/         (NEW - migrate ImageWithFallback)
│   ├── health/        (NEW - health record components)
│   ├── layout/        (existing - update with MobileHeader features)
│   ├── mypage/        (existing)
│   ├── news/          (NEW - news components)
│   ├── quiz/          (NEW - quiz components)
│   ├── support/       (NEW - support components)
│   ├── trends/        (existing)
│   └── ui/            (existing - add missing shadcn components)
├── pages/
│   ├── BookmarkPage.tsx           (MIGRATE)
│   ├── DashboardPage.tsx          (MIGRATE)
│   ├── DietLogPage.tsx            (MIGRATE or merge with DietCarePageEnhanced)
│   ├── HealthRecordsPage.tsx      (MIGRATE)
│   ├── KidneyDiseaseStagePage.tsx (MIGRATE)
│   ├── NewsDetailPage.tsx         (MIGRATE)
│   ├── NutriCoachPage.tsx         (MIGRATE or merge)
│   ├── ProfilePage.tsx            (MERGE with MyPageEnhanced)
│   ├── QuizListPage.tsx           (MIGRATE)
│   ├── SplashPage.tsx             (MIGRATE)
│   └── SupportPage.tsx            (MIGRATE)
```

---

## 9. Estimated Migration Effort

### Time Estimates (Developer Days)

| Task | Complexity | Estimated Days |
|------|-----------|----------------|
| ImageWithFallback migration | Low | 0.5 |
| NutritionAnalysisCard migration | High | 2 |
| MobileHeader integration | Medium | 1.5 |
| DietLogPage migration | High | 3 |
| HealthRecordsPage migration | Medium | 2 |
| NutriCoachPage migration | High | 2.5 |
| BookmarkPage migration | Medium | 1.5 |
| NewsDetailPage migration | Medium | 1.5 |
| ProfilePage merge | Medium | 2 |
| QuizListPage migration | Medium | 1.5 |
| KidneyDiseaseStagePage migration | Low | 1 |
| SupportPage migration | Medium | 2 |
| DashboardPage migration | Low | 1 |
| SplashPage migration | Low | 0.5 |
| UI components migration | Medium | 2 |
| Chat pages evaluation | High | 3 |
| Backend API integration | High | 5 |
| Testing & QA | High | 4 |
| **TOTAL** | | **35-40 days** |

---

## 10. Migration Workflow

### Phase 1: Foundation (Week 1)
- [ ] Migrate ImageWithFallback component
- [ ] Migrate critical UI components from old shadcn
- [ ] Set up component directory structure
- [ ] Create backend API service stubs

### Phase 2: Core Features (Week 2-3)
- [ ] Migrate NutritionAnalysisCard
- [ ] Integrate MobileHeader functionality
- [ ] Migrate DietLogPage or merge with existing
- [ ] Migrate HealthRecordsPage
- [ ] Backend API integration for diet/health

### Phase 3: User Features (Week 4-5)
- [ ] Migrate ProfilePage (merge with MyPageEnhanced)
- [ ] Migrate BookmarkPage
- [ ] Migrate QuizListPage
- [ ] Backend API integration for user data

### Phase 4: Content & Support (Week 6)
- [ ] Migrate NewsDetailPage
- [ ] Migrate NutriCoachPage
- [ ] Migrate SupportPage
- [ ] Backend API for news/support

### Phase 5: Polish & Additional (Week 7)
- [ ] Migrate DashboardPage
- [ ] Migrate KidneyDiseaseStagePage
- [ ] Migrate SplashPage
- [ ] Evaluate Chat pages
- [ ] Final design alignment

### Phase 6: Testing & Deployment (Week 8)
- [ ] Comprehensive testing
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment preparation

---

## 11. Risks & Considerations

### Technical Risks
1. **State Management Conflicts**: Old frontend uses different context patterns
2. **Design System Divergence**: CSS custom properties vs Tailwind
3. **Chat Implementation**: Potential Parlant integration complexity
4. **API Compatibility**: Backend endpoints may need updates

### Mitigation Strategies
1. Standardize on new_frontend's state management approach
2. Create design token mapping document
3. Evaluate chat implementation requirements early
4. Coordinate with backend team on API contracts

---

## 12. Checklist Template for Each Page

Use this template when migrating each page:

```markdown
## [Page Name] Migration

- [ ] Code review completed
- [ ] Dependencies identified
- [ ] Design system updated
- [ ] Mock data replaced with API calls
- [ ] State management integrated
- [ ] Routing configured
- [ ] Component imports updated
- [ ] Error handling added
- [ ] Loading states implemented
- [ ] Empty states designed
- [ ] Mobile responsive tested
- [ ] Desktop layout tested
- [ ] Accessibility validated (WCAG 2.1 AA)
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Documentation updated
- [ ] Code review passed
- [ ] QA approved
```

---

## 13. Next Steps

1. **Immediate Actions:**
   - Review this checklist with the team
   - Prioritize pages based on business value
   - Assign migration tasks to developers
   - Set up tracking board (Jira/Trello/GitHub Projects)

2. **Before Starting Migration:**
   - Audit backend API readiness
   - Create design token mapping
   - Set up testing environment
   - Define acceptance criteria for each page

3. **During Migration:**
   - Daily standups to track progress
   - Code review for each migrated component
   - Incremental testing
   - Document decisions and blockers

4. **After Migration:**
   - Deprecate old frontend
   - Update deployment pipelines
   - User acceptance testing
   - Performance benchmarking

---

## 14. Contact & Resources

### Documentation References
- Figma Design System: [Link needed]
- Backend API Docs: [Link needed]
- New Frontend Architecture: `/new_frontend/README.md`
- Component Library: shadcn/ui documentation

### Key Stakeholders
- Frontend Lead: [Name]
- Backend Lead: [Name]
- UX/UI Designer: [Name]
- QA Lead: [Name]

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Prepared By:** Claude Code Analysis
