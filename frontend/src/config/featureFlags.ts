/**
 * ========================================
 * CareGuide Feature Flags System
 * ========================================
 * Version: 1.0.0
 *
 * This module provides a comprehensive feature flag system for the CareGuide migration project.
 * It supports both environment variables and localStorage overrides for flexible feature toggling.
 *
 * Usage:
 * - Import and use isFeatureEnabled() for imperative checks
 * - Use useFeatureFlag() hook for React components
 * - Use toggleFeatureForTesting() for testing purposes
 *
 * @example
 * ```typescript
 * // In TypeScript/JavaScript
 * if (isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')) {
 *   // Use new design system
 * }
 *
 * // In React components
 * const { enabled, toggle } = useFeatureFlag('PHASE_1_DESIGN_SYSTEM');
 * if (enabled) {
 *   return <NewComponent />;
 * }
 * ```
 */

// ========================================
// PHASE DEFINITIONS
// ========================================

/**
 * All available feature flags organized by migration phase
 */
export const FEATURE_FLAGS = {
  // ===== Phase 0: Infrastructure & Setup =====
  PHASE_0_FEATURE_FLAGS: {
    key: 'PHASE_0_FEATURE_FLAGS' as const,
    defaultEnabled: true,
    description: 'Feature flag infrastructure system',
    phase: 0,
  },

  // ===== Phase 1: Design System Migration =====
  PHASE_1_DESIGN_SYSTEM: {
    key: 'PHASE_1_DESIGN_SYSTEM' as const,
    defaultEnabled: true,
    description: 'WCAG 2.2 AA compliant design system with Tailwind config',
    phase: 1,
  },
  PHASE_1_TYPESCRIPT_CONFIG: {
    key: 'PHASE_1_TYPESCRIPT_CONFIG' as const,
    defaultEnabled: true,
    description: 'Stricter TypeScript configuration with path aliases',
    phase: 1,
  },
  PHASE_1_VITE_CONFIG: {
    key: 'PHASE_1_VITE_CONFIG' as const,
    defaultEnabled: true,
    description: 'Optimized Vite build configuration',
    phase: 1,
  },

  // ===== Phase 2: Core UI Components =====
  PHASE_2_UI_COMPONENTS: {
    key: 'PHASE_2_UI_COMPONENTS' as const,
    defaultEnabled: false,
    description: 'Shadcn/UI component library integration',
    phase: 2,
  },
  PHASE_2_LAYOUT_SYSTEM: {
    key: 'PHASE_2_LAYOUT_SYSTEM' as const,
    defaultEnabled: false,
    description: 'Responsive layout components (Header, Sidebar, MobileNav)',
    phase: 2,
  },
  PHASE_2_ICON_SYSTEM: {
    key: 'PHASE_2_ICON_SYSTEM' as const,
    defaultEnabled: false,
    description: 'Lucide React icon system',
    phase: 2,
  },

  // ===== Phase 3: Page Migrations =====
  PHASE_3_CHAT_PAGE: {
    key: 'PHASE_3_CHAT_PAGE' as const,
    defaultEnabled: false,
    description: 'Enhanced chat page with improved UX',
    phase: 3,
  },
  PHASE_3_TRENDS_PAGE: {
    key: 'PHASE_3_TRENDS_PAGE' as const,
    defaultEnabled: false,
    description: 'Research trends page with papers and clinical trials',
    phase: 3,
  },
  PHASE_3_DIET_CARE_PAGE: {
    key: 'PHASE_3_DIET_CARE_PAGE' as const,
    defaultEnabled: false,
    description: 'Nutrition management and meal tracking',
    phase: 3,
  },
  PHASE_3_COMMUNITY_PAGE: {
    key: 'PHASE_3_COMMUNITY_PAGE' as const,
    defaultEnabled: false,
    description: 'Community forum with posts and discussions',
    phase: 3,
  },
  PHASE_3_MY_PAGE: {
    key: 'PHASE_3_MY_PAGE' as const,
    defaultEnabled: false,
    description: 'User profile and settings management',
    phase: 3,
  },

  // ===== Phase 4: Advanced Features =====
  PHASE_4_QUIZ_SYSTEM: {
    key: 'PHASE_4_QUIZ_SYSTEM' as const,
    defaultEnabled: false,
    description: 'Interactive quiz and learning system',
    phase: 4,
  },
  PHASE_4_NOTIFICATIONS: {
    key: 'PHASE_4_NOTIFICATIONS' as const,
    defaultEnabled: false,
    description: 'Real-time notification system',
    phase: 4,
  },
  PHASE_4_BOOKMARKS: {
    key: 'PHASE_4_BOOKMARKS' as const,
    defaultEnabled: false,
    description: 'Enhanced bookmark management',
    phase: 4,
  },
  PHASE_4_ANALYTICS: {
    key: 'PHASE_4_ANALYTICS' as const,
    defaultEnabled: false,
    description: 'User analytics and insights',
    phase: 4,
  },

  // ===== Phase 5: Polish & Optimization =====
  PHASE_5_ANIMATIONS: {
    key: 'PHASE_5_ANIMATIONS' as const,
    defaultEnabled: false,
    description: 'Smooth page transitions and micro-interactions',
    phase: 5,
  },
  PHASE_5_ACCESSIBILITY: {
    key: 'PHASE_5_ACCESSIBILITY' as const,
    defaultEnabled: false,
    description: 'Enhanced accessibility features (keyboard nav, ARIA)',
    phase: 5,
  },
  PHASE_5_PERFORMANCE: {
    key: 'PHASE_5_PERFORMANCE' as const,
    defaultEnabled: false,
    description: 'Performance optimizations (lazy loading, code splitting)',
    phase: 5,
  },
  PHASE_5_PWA: {
    key: 'PHASE_5_PWA' as const,
    defaultEnabled: false,
    description: 'Progressive Web App capabilities',
    phase: 5,
  },
  PHASE_5_DARK_MODE: {
    key: 'PHASE_5_DARK_MODE' as const,
    defaultEnabled: false,
    description: 'Dark mode theme support',
    phase: 5,
  },
} as const;

// Type extraction for better type safety
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
export type FeatureFlagConfig = typeof FEATURE_FLAGS[FeatureFlagKey];

// ========================================
// LOCALSTORAGE KEY PREFIX
// ========================================

const STORAGE_PREFIX = 'careguide_feature_';

// ========================================
// CORE FEATURE FLAG FUNCTIONS
// ========================================

/**
 * Check if a feature flag is enabled
 *
 * Priority order:
 * 1. localStorage override (for development/testing)
 * 2. Environment variable (VITE_FEATURE_[FLAG_NAME])
 * 3. Default value from FEATURE_FLAGS config
 *
 * @param flagKey - The feature flag key to check
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')) {
 *   // Use new design system
 * }
 * ```
 */
export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  const flag = FEATURE_FLAGS[flagKey];
  if (!flag) {
    console.warn(`[FeatureFlags] Unknown feature flag: ${flagKey}`);
    return false;
  }

  // 1. Check localStorage override
  const storageKey = `${STORAGE_PREFIX}${flag.key}`;
  const localStorageValue = localStorage.getItem(storageKey);
  if (localStorageValue !== null) {
    return localStorageValue === 'true';
  }

  // 2. Check environment variable
  const envKey = `VITE_FEATURE_${flag.key}`;
  const envValue = import.meta.env[envKey];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === true;
  }

  // 3. Use default value
  return flag.defaultEnabled;
}

/**
 * Get all feature flags with their current status
 *
 * @returns Array of feature flag objects with their enabled status
 *
 * @example
 * ```typescript
 * const allFlags = getAllFeatureFlags();
 * console.table(allFlags);
 * ```
 */
export function getAllFeatureFlags(): Array<{
  key: string;
  enabled: boolean;
  description: string;
  phase: number;
  source: 'localStorage' | 'environment' | 'default';
}> {
  return Object.entries(FEATURE_FLAGS).map(([_, flag]) => {
    const storageKey = `${STORAGE_PREFIX}${flag.key}`;
    const hasLocalStorage = localStorage.getItem(storageKey) !== null;
    const envKey = `VITE_FEATURE_${flag.key}`;
    const hasEnv = import.meta.env[envKey] !== undefined;

    let source: 'localStorage' | 'environment' | 'default';
    if (hasLocalStorage) source = 'localStorage';
    else if (hasEnv) source = 'environment';
    else source = 'default';

    return {
      key: flag.key,
      enabled: isFeatureEnabled(flag.key as FeatureFlagKey),
      description: flag.description,
      phase: flag.phase,
      source,
    };
  });
}

/**
 * Get feature flags for a specific phase
 *
 * @param phase - The phase number (0-5)
 * @returns Array of feature flags for the specified phase
 *
 * @example
 * ```typescript
 * const phase1Flags = getFeatureFlagsByPhase(1);
 * ```
 */
export function getFeatureFlagsByPhase(phase: number): Array<{
  key: string;
  enabled: boolean;
  description: string;
}> {
  return getAllFeatureFlags().filter((flag) => flag.phase === phase);
}

// ========================================
// TESTING UTILITIES
// ========================================

/**
 * Toggle a feature flag for testing purposes
 * This sets the value in localStorage to override default/environment values
 *
 * @param flagKey - The feature flag key to toggle
 * @param enabled - Optional explicit value. If not provided, toggles current state
 *
 * @example
 * ```typescript
 * // Toggle to opposite state
 * toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM');
 *
 * // Set explicitly
 * toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', true);
 * ```
 */
export function toggleFeatureForTesting(
  flagKey: FeatureFlagKey,
  enabled?: boolean
): void {
  const flag = FEATURE_FLAGS[flagKey];
  if (!flag) {
    console.warn(`[FeatureFlags] Unknown feature flag: ${flagKey}`);
    return;
  }

  const storageKey = `${STORAGE_PREFIX}${flag.key}`;
  const newValue = enabled !== undefined ? enabled : !isFeatureEnabled(flagKey);

  localStorage.setItem(storageKey, String(newValue));
  console.log(
    `[FeatureFlags] ${flag.key} ${newValue ? 'enabled' : 'disabled'} (localStorage override)`
  );

  // Trigger a storage event for other tabs/windows
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: storageKey,
      newValue: String(newValue),
      oldValue: String(!newValue),
    })
  );
}

/**
 * Clear all feature flag localStorage overrides
 * Resets all flags to their default or environment variable values
 *
 * @example
 * ```typescript
 * clearAllFeatureOverrides();
 * ```
 */
export function clearAllFeatureOverrides(): void {
  Object.values(FEATURE_FLAGS).forEach((flag) => {
    const storageKey = `${STORAGE_PREFIX}${flag.key}`;
    localStorage.removeItem(storageKey);
  });
  console.log('[FeatureFlags] All localStorage overrides cleared');
}

/**
 * Enable all features in a specific phase for testing
 *
 * @param phase - The phase number (0-5)
 *
 * @example
 * ```typescript
 * enablePhaseForTesting(1); // Enable all Phase 1 features
 * ```
 */
export function enablePhaseForTesting(phase: number): void {
  Object.values(FEATURE_FLAGS)
    .filter((flag) => flag.phase === phase)
    .forEach((flag) => {
      toggleFeatureForTesting(flag.key as FeatureFlagKey, true);
    });
  console.log(`[FeatureFlags] All Phase ${phase} features enabled`);
}

/**
 * Disable all features in a specific phase for testing
 *
 * @param phase - The phase number (0-5)
 *
 * @example
 * ```typescript
 * disablePhaseForTesting(3); // Disable all Phase 3 features
 * ```
 */
export function disablePhaseForTesting(phase: number): void {
  Object.values(FEATURE_FLAGS)
    .filter((flag) => flag.phase === phase)
    .forEach((flag) => {
      toggleFeatureForTesting(flag.key as FeatureFlagKey, false);
    });
  console.log(`[FeatureFlags] All Phase ${phase} features disabled`);
}

// ========================================
// REACT HOOK
// ========================================

/**
 * React hook for using feature flags in components
 *
 * @param flagKey - The feature flag key to check
 * @returns Object with enabled state and toggle function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { enabled, toggle } = useFeatureFlag('PHASE_1_DESIGN_SYSTEM');
 *
 *   return (
 *     <div>
 *       {enabled ? <NewFeature /> : <OldFeature />}
 *       {process.env.NODE_ENV === 'development' && (
 *         <button onClick={toggle}>Toggle Feature</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagKey: FeatureFlagKey): {
  enabled: boolean;
  toggle: () => void;
  flag: FeatureFlagConfig;
} {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flagKey));
  const flag = FEATURE_FLAGS[flagKey];

  // Listen for storage events (from other tabs or toggleFeatureForTesting)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = `${STORAGE_PREFIX}${flag.key}`;
      if (e.key === storageKey) {
        setEnabled(isFeatureEnabled(flagKey));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flagKey, flag.key]);

  const toggle = () => {
    toggleFeatureForTesting(flagKey);
    setEnabled((prev) => !prev);
  };

  return { enabled, toggle, flag };
}

// ========================================
// DEVELOPMENT HELPERS
// ========================================

/**
 * Log all feature flags to console (useful for debugging)
 *
 * @example
 * ```typescript
 * logAllFeatureFlags();
 * ```
 */
export function logAllFeatureFlags(): void {
  console.group('[FeatureFlags] Current Configuration');
  console.table(getAllFeatureFlags());
  console.groupEnd();
}

/**
 * Export feature flags for debugging (attach to window in development)
 */
if (import.meta.env.DEV) {
  (window as any).__FEATURE_FLAGS__ = {
    isEnabled: isFeatureEnabled,
    getAll: getAllFeatureFlags,
    getByPhase: getFeatureFlagsByPhase,
    toggle: toggleFeatureForTesting,
    clearAll: clearAllFeatureOverrides,
    enablePhase: enablePhaseForTesting,
    disablePhase: disablePhaseForTesting,
    log: logAllFeatureFlags,
  };

  console.log(
    '%c[FeatureFlags] Development mode enabled',
    'color: #00c9b7; font-weight: bold'
  );
  console.log(
    '%cAccess feature flags via window.__FEATURE_FLAGS__',
    'color: #9f7aea'
  );
  console.log('%cExample: __FEATURE_FLAGS__.log()', 'color: #9f7aea');
}

// ========================================
// TYPE EXPORTS
// ========================================

export type FeatureFlagStatus = {
  key: string;
  enabled: boolean;
  description: string;
  phase: number;
  source: 'localStorage' | 'environment' | 'default';
};

export type PhaseFeatureFlags = {
  phase: number;
  flags: Array<{
    key: string;
    enabled: boolean;
    description: string;
  }>;
};
