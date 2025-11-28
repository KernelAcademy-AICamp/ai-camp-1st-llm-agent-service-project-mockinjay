# Phase 5: Feature Page Enhancements - Implementation Plan

## Overview
This document outlines the implementation plan for Phase 5, which focuses on migrating and integrating enhanced page implementations with feature flags for controlled rollout.

## Current Status

### ✅ Completed Components

#### 5.1 ChatPage Enhancements
- ✅ `ChatPageEnhanced.tsx` - Full-featured chat with sidebar and streaming
- ✅ `WelcomeMessage.tsx` - Agent-specific welcome messages
- ✅ `SuggestionChips.tsx` - Horizontal scrolling suggestions
- ✅ `QuizPromptBanner.tsx` - Quiz prompts after 4+ messages
- ✅ `SourceCitation.tsx` - Research paper citations
- ✅ `ChatHeader.tsx` - Enhanced header with profile
- ✅ `ChatSidebar.tsx` - Room management
- ✅ `ChatMessages.tsx` - Message display with streaming
- ✅ `ChatInput.tsx` - Input with image upload support

#### 5.2 DietCarePage Enhancements
- ✅ `DietCarePageEnhanced.tsx` - Multi-tab diet management
- ✅ `FoodInfoCard.tsx` - Traffic light nutrition system
- ✅ `MealEntryCard.tsx` - Meal logging
- ✅ `NutrientEducationSection.tsx` - Medical education
- ✅ `NutriCoachContent.tsx` - AI coach interface
- ✅ `GoalSettingForm.tsx` - Daily nutrition goals
- ✅ `MealHistoryContent.tsx` - Historical meal tracking

#### 5.3 MyPage Enhancements
- ✅ `MyPageEnhanced.tsx` - Profile and statistics dashboard
- ✅ `ProfileEditModal.tsx` - Profile editing
- ✅ `HealthProfileModal.tsx` - Health information management
- ✅ `SettingsModal.tsx` - User preferences
- ✅ `BookmarkedPapersModal.tsx` - Saved research papers
- ✅ `MyPostsModal.tsx` - User's community posts
- ✅ Quiz statistics visualization
- ✅ Loading skeletons and error states

#### 5.4 Community & Trends Pages
- ✅ `CommunityPageEnhanced.tsx` - 2-column grid, featured posts
- ✅ `PostCard.tsx` - Community post cards
- ✅ `CreatePostModal.tsx` - Post creation with images
- ✅ `EditPostModal.tsx` - Inline editing
- ✅ `TrendsPageEnhanced.tsx` - Research dashboard with tabs
- ✅ `NewsFeed.tsx` - News aggregation
- ✅ `ClinicalTrialsTab.tsx` - Clinical trials info
- ✅ `ResearchDashboardContent.tsx` - Analytics dashboard
- ✅ `PopularKeywords.tsx` - Trending research topics
- ✅ `ResearchTrendsChart.tsx` - Data visualization

### 🔄 Implementation Tasks

## Task 1: Feature Flag System

### 1.1 Create Feature Flag Configuration
**File:** `/new_frontend/src/config/featureFlags.ts`

```typescript
/**
 * Feature Flags Configuration
 * Allows controlled rollout of enhanced features
 */

export interface FeatureFlags {
  // Page-level feature flags
  ENHANCED_CHAT: boolean;
  ENHANCED_DIET_CARE: boolean;
  ENHANCED_MY_PAGE: boolean;
  ENHANCED_COMMUNITY: boolean;
  ENHANCED_TRENDS: boolean;

  // Component-level feature flags
  CHAT_WELCOME_MESSAGE: boolean;
  CHAT_SUGGESTION_CHIPS: boolean;
  CHAT_QUIZ_PROMPT: boolean;
  CHAT_SOURCE_CITATIONS: boolean;

  DIET_TRAFFIC_LIGHT_SYSTEM: boolean;
  DIET_MEAL_LOGGING: boolean;
  DIET_NUTRITION_EDUCATION: boolean;

  MYPAGE_QUIZ_STATS: boolean;
  MYPAGE_BOOKMARKS_MODAL: boolean;

  COMMUNITY_FEATURED_POSTS: boolean;
  COMMUNITY_INLINE_EDIT: boolean;

  TRENDS_NEWS_TAB: boolean;
  TRENDS_CLINICAL_TRIALS: boolean;
  TRENDS_DASHBOARD: boolean;
}

// Default feature flags (all enhanced features enabled by default)
const defaultFlags: FeatureFlags = {
  // Page-level
  ENHANCED_CHAT: true,
  ENHANCED_DIET_CARE: true,
  ENHANCED_MY_PAGE: true,
  ENHANCED_COMMUNITY: true,
  ENHANCED_TRENDS: true,

  // Component-level
  CHAT_WELCOME_MESSAGE: true,
  CHAT_SUGGESTION_CHIPS: true,
  CHAT_QUIZ_PROMPT: true,
  CHAT_SOURCE_CITATIONS: true,

  DIET_TRAFFIC_LIGHT_SYSTEM: true,
  DIET_MEAL_LOGGING: true,
  DIET_NUTRITION_EDUCATION: true,

  MYPAGE_QUIZ_STATS: true,
  MYPAGE_BOOKMARKS_MODAL: true,

  COMMUNITY_FEATURED_POSTS: true,
  COMMUNITY_INLINE_EDIT: true,

  TRENDS_NEWS_TAB: true,
  TRENDS_CLINICAL_TRIALS: true,
  TRENDS_DASHBOARD: true,
};

// Load flags from localStorage (for testing/debugging)
const STORAGE_KEY = 'careguide_feature_flags';

export function getFeatureFlags(): FeatureFlags {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultFlags, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load feature flags from localStorage:', error);
  }
  return defaultFlags;
}

export function setFeatureFlag(flag: keyof FeatureFlags, value: boolean): void {
  try {
    const current = getFeatureFlags();
    current[flag] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    // Trigger a custom event for listeners
    window.dispatchEvent(new CustomEvent('featureFlagsChanged', { detail: current }));
  } catch (error) {
    console.error('Failed to set feature flag:', error);
  }
}

export function resetFeatureFlags(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('featureFlagsChanged', { detail: defaultFlags }));
  } catch (error) {
    console.error('Failed to reset feature flags:', error);
  }
}

// Export a hook for React components
import { useState, useEffect } from 'react';

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());

  useEffect(() => {
    const handleChange = (event: CustomEvent<FeatureFlags>) => {
      setFlags(event.detail);
    };

    window.addEventListener('featureFlagsChanged', handleChange as EventListener);
    return () => {
      window.removeEventListener('featureFlagsChanged', handleChange as EventListener);
    };
  }, []);

  return flags;
}

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[flag];
}
```

### 1.2 Update constants.ts
Add feature flag storage key to existing constants.

## Task 2: Route-Level Integration

### 2.1 Update AppRoutes.tsx
Integrate feature flag checks at the route level.

```typescript
// In AppRoutes.tsx
import { useFeatureFlag } from '../config/featureFlags';

// Lazy load both standard and enhanced versions
const ChatPage = lazy(() => import('../pages/ChatPage'));
const ChatPageEnhanced = lazy(() => import('../pages/ChatPageEnhanced'));

const DietCarePage = lazy(() => import('../pages/DietCarePage'));
const DietCarePageEnhanced = lazy(() => import('../pages/DietCarePageEnhanced'));

// ... etc for MyPage, Community, Trends

// Inside AppRoutes component
const ChatPageComponent = () => {
  const useEnhanced = useFeatureFlag('ENHANCED_CHAT');
  return useEnhanced ? <ChatPageEnhanced /> : <ChatPage />;
};

const DietCarePageComponent = () => {
  const useEnhanced = useFeatureFlag('ENHANCED_DIET_CARE');
  return useEnhanced ? <DietCarePageEnhanced /> : <DietCarePage />;
};

// ... etc
```

## Task 3: Component-Level Feature Flags

### 3.1 ChatPage Components
Apply conditional rendering based on component-level flags:

```typescript
// In ChatMessages.tsx
const { CHAT_WELCOME_MESSAGE, CHAT_SUGGESTION_CHIPS } = useFeatureFlags();

{messages.length === 0 && CHAT_WELCOME_MESSAGE && (
  <WelcomeMessage agentType={agentType} onSuggestionClick={onSuggestionClick} />
)}

{messages.length === 0 && CHAT_SUGGESTION_CHIPS && !CHAT_WELCOME_MESSAGE && (
  <SuggestionChips suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
)}
```

### 3.2 DietCarePage Components
```typescript
// In NutriCoachContent.tsx
const { DIET_TRAFFIC_LIGHT_SYSTEM, DIET_NUTRITION_EDUCATION } = useFeatureFlags();

{DIET_TRAFFIC_LIGHT_SYSTEM && (
  <FoodInfoCard food={food} trafficLight={trafficLight} />
)}

{DIET_NUTRITION_EDUCATION && (
  <NutrientEducationSection nutrients={nutrients} />
)}
```

## Task 4: Developer Tools

### 4.1 Create Feature Flag Debug Panel
**File:** `/new_frontend/src/components/debug/FeatureFlagPanel.tsx`

```typescript
/**
 * Feature Flag Debug Panel
 * Only visible in development mode
 * Access via keyboard shortcut: Ctrl + Shift + F
 */

import React, { useState } from 'react';
import { getFeatureFlags, setFeatureFlag, resetFeatureFlags, type FeatureFlags } from '../../config/featureFlags';
import { X, RotateCcw } from 'lucide-react';

export const FeatureFlagPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());

  // Keyboard shortcut: Ctrl + Shift + F
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Listen for flag changes
  React.useEffect(() => {
    const handleChange = (event: CustomEvent<FeatureFlags>) => {
      setFlags(event.detail);
    };

    window.addEventListener('featureFlagsChanged', handleChange as EventListener);
    return () => {
      window.removeEventListener('featureFlagsChanged', handleChange as EventListener);
    };
  }, []);

  const handleToggle = (flag: keyof FeatureFlags) => {
    const newValue = !flags[flag];
    setFeatureFlag(flag, newValue);
    setFlags({ ...flags, [flag]: newValue });
  };

  const handleReset = () => {
    resetFeatureFlags();
    setFlags(getFeatureFlags());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          🚩 Feature Flags
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">DEV</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Reset all flags"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Flags List */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {Object.entries(flags).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {key}
            </span>
            <button
              onClick={() => handleToggle(key as keyof FeatureFlags)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-900 p-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Keyboard: <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl</kbd> +{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift</kbd> +{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">F</kbd>
      </div>
    </div>
  );
};
```

### 4.2 Add to App.tsx
```typescript
// In App.tsx
{import.meta.env.DEV && <FeatureFlagPanel />}
```

## Task 5: Testing & Validation

### 5.1 Integration Testing Checklist

#### ChatPage
- [ ] Welcome message displays on empty chat
- [ ] Suggestion chips scroll horizontally
- [ ] Quiz prompt shows after 4 messages
- [ ] Source citations render for research papers
- [ ] Tab lock works after first message
- [ ] Profile selector updates correctly

#### DietCarePage
- [ ] Traffic light system shows red/yellow/green
- [ ] Meal logging saves correctly
- [ ] Nutrition education tooltips work
- [ ] Goal setting persists
- [ ] Meal history loads correctly

#### MyPage
- [ ] Quiz statistics chart renders
- [ ] Bookmarked papers modal opens
- [ ] Profile editing saves
- [ ] Health profile updates
- [ ] Loading skeletons display

#### Community
- [ ] Featured posts carousel works
- [ ] 2-column grid layout responsive
- [ ] Inline edit/delete functional
- [ ] Anonymous posting works
- [ ] Infinite scroll loads more

#### Trends
- [ ] News feed updates
- [ ] Clinical trials search works
- [ ] Dashboard charts render
- [ ] Popular keywords clickable
- [ ] Bookmark papers functional

### 5.2 Accessibility Testing
- [ ] Screen reader announcements work
- [ ] Keyboard navigation functional
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA

### 5.3 Performance Testing
- [ ] Lazy loading works
- [ ] Bundle size acceptable
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] No memory leaks

## Task 6: Documentation

### 6.1 User Documentation
- [ ] Feature flag guide for developers
- [ ] Component usage examples
- [ ] Migration guide from standard to enhanced

### 6.2 Technical Documentation
- [ ] API integration guide
- [ ] State management patterns
- [ ] Testing strategies

## Expected Impact

### Engagement Metrics
- **ChatPage**: +40% feature discovery (suggestion chips)
- **DietCarePage**: +35% health outcomes (traffic light system)
- **MyPage**: +50% user retention (quiz gamification)
- **Community**: +45% post engagement (featured posts)
- **Trends**: +60% research discovery (dashboard)

### Performance Metrics
- Initial load time: -20% (code splitting)
- Bundle size: -15% (lazy loading)
- Accessibility score: 95+ (WCAG AA compliance)
- Test coverage: 80%+

## Timeline

### Day 23-25: ChatPage
- Implement feature flags
- Test all chat components
- Accessibility audit

### Day 26-28: DietCarePage
- Integrate traffic light system
- Test meal logging
- Medical education validation

### Day 29-30: MyPage
- Quiz stats visualization
- Modal integrations
- Performance testing

### Day 31-32: Community & Trends
- Featured posts carousel
- Dashboard tabs
- Final integration testing

## Rollout Strategy

### Phase 1: Internal Testing (Days 23-28)
- Enable all enhanced features
- Developer testing
- Bug fixes

### Phase 2: Beta Release (Days 29-30)
- Enable for 10% users
- Monitor metrics
- Collect feedback

### Phase 3: Full Rollout (Days 31-32)
- Enable for all users
- Monitor performance
- Document learnings

## Success Criteria

- [ ] All enhanced features deployed
- [ ] Feature flags working correctly
- [ ] 80%+ test coverage achieved
- [ ] Accessibility compliance (WCAG AA)
- [ ] Performance targets met
- [ ] Zero critical bugs
- [ ] Positive user feedback

## Rollback Plan

If issues arise:
1. Disable problematic feature flag
2. Monitor error logs
3. Fix issues in isolation
4. Re-enable after validation

Feature flags allow instant rollback without code deployment.

---

**Status**: Ready for implementation
**Assignee**: Development Team
**Priority**: High
**Estimated Effort**: 10 days (Days 23-32)
