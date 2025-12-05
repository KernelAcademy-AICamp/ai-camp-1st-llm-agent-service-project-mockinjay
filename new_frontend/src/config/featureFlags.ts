/**
 * Feature Flags Configuration
 * Allows controlled rollout of enhanced features
 *
 * Usage:
 * - In components: const isEnabled = useFeatureFlag('ENHANCED_CHAT');
 * - Debug panel: Ctrl + Shift + F (development mode only)
 */

import { useState, useEffect } from 'react';

export interface FeatureFlags {
  // Page-level feature flags
  ENHANCED_CHAT: boolean;
  ENHANCED_DIET_CARE: boolean;
  ENHANCED_MY_PAGE: boolean;
  ENHANCED_COMMUNITY: boolean;
  ENHANCED_TRENDS: boolean;

  // Component-level feature flags - Chat
  CHAT_WELCOME_MESSAGE: boolean;
  CHAT_SUGGESTION_CHIPS: boolean;
  CHAT_QUIZ_PROMPT: boolean;
  CHAT_SOURCE_CITATIONS: boolean;
  CHAT_SIDEBAR: boolean;

  // Component-level feature flags - Diet Care
  DIET_TRAFFIC_LIGHT_SYSTEM: boolean;
  DIET_MEAL_LOGGING: boolean;
  DIET_NUTRITION_EDUCATION: boolean;
  DIET_GOAL_SETTING: boolean;

  // Component-level feature flags - MyPage
  MYPAGE_QUIZ_STATS: boolean;
  MYPAGE_BOOKMARKS_MODAL: boolean;
  MYPAGE_HEALTH_PROFILE: boolean;

  // Component-level feature flags - Community
  COMMUNITY_FEATURED_POSTS: boolean;
  COMMUNITY_INLINE_EDIT: boolean;
  COMMUNITY_ANONYMOUS_POSTING: boolean;

  // Component-level feature flags - Trends
  TRENDS_NEWS_TAB: boolean;
  TRENDS_CLINICAL_TRIALS: boolean;
  TRENDS_DASHBOARD: boolean;
  TRENDS_BOOKMARKS: boolean;
}

// Default feature flags (all enhanced features enabled by default)
const defaultFlags: FeatureFlags = {
  // Page-level - All enhanced by default
  ENHANCED_CHAT: true,
  ENHANCED_DIET_CARE: true,
  ENHANCED_MY_PAGE: true,
  ENHANCED_COMMUNITY: true,
  ENHANCED_TRENDS: true,

  // Component-level - Chat
  CHAT_WELCOME_MESSAGE: true,
  CHAT_SUGGESTION_CHIPS: true,
  CHAT_QUIZ_PROMPT: true,
  CHAT_SOURCE_CITATIONS: true,
  CHAT_SIDEBAR: true,

  // Component-level - Diet Care
  DIET_TRAFFIC_LIGHT_SYSTEM: true,
  DIET_MEAL_LOGGING: true,
  DIET_NUTRITION_EDUCATION: true,
  DIET_GOAL_SETTING: true,

  // Component-level - MyPage
  MYPAGE_QUIZ_STATS: true,
  MYPAGE_BOOKMARKS_MODAL: true,
  MYPAGE_HEALTH_PROFILE: true,

  // Component-level - Community
  COMMUNITY_FEATURED_POSTS: true,
  COMMUNITY_INLINE_EDIT: true,
  COMMUNITY_ANONYMOUS_POSTING: true,

  // Component-level - Trends
  TRENDS_NEWS_TAB: true,
  TRENDS_CLINICAL_TRIALS: true,
  TRENDS_DASHBOARD: true,
  TRENDS_BOOKMARKS: true,
};

// Storage key for localStorage
const STORAGE_KEY = 'careguide_feature_flags';

/**
 * Get current feature flags (from localStorage or defaults)
 */
export function getFeatureFlags(): FeatureFlags {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all flags are present
      return { ...defaultFlags, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load feature flags from localStorage:', error);
  }
  return defaultFlags;
}

/**
 * Set a specific feature flag
 */
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

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('featureFlagsChanged', { detail: defaultFlags }));
  } catch (error) {
    console.error('Failed to reset feature flags:', error);
  }
}

/**
 * React hook to get all feature flags with live updates
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());

  useEffect(() => {
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<FeatureFlags>;
      setFlags(customEvent.detail);
    };

    window.addEventListener('featureFlagsChanged', handleChange);
    return () => {
      window.removeEventListener('featureFlagsChanged', handleChange);
    };
  }, []);

  return flags;
}

/**
 * React hook to get a specific feature flag with live updates
 *
 * @example
 * const isChatEnhanced = useFeatureFlag('ENHANCED_CHAT');
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[flag];
}

/**
 * Bulk update multiple feature flags
 */
export function setFeatureFlags(updates: Partial<FeatureFlags>): void {
  try {
    const current = getFeatureFlags();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('featureFlagsChanged', { detail: updated }));
  } catch (error) {
    console.error('Failed to set feature flags:', error);
  }
}

/**
 * Export all feature flags as an object (for debugging)
 */
export function exportFeatureFlags(): string {
  return JSON.stringify(getFeatureFlags(), null, 2);
}

/**
 * Import feature flags from JSON string
 */
export function importFeatureFlags(json: string): void {
  try {
    const parsed = JSON.parse(json);
    setFeatureFlags(parsed);
  } catch (error) {
    console.error('Failed to import feature flags:', error);
  }
}
