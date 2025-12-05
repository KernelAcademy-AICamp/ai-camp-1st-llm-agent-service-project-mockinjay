/**
 * ========================================
 * Feature Flags Testing Suite
 * ========================================
 *
 * This test suite demonstrates how to test feature flags
 * and provides examples for different testing scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isFeatureEnabled,
  getAllFeatureFlags,
  getFeatureFlagsByPhase,
  toggleFeatureForTesting,
  clearAllFeatureOverrides,
  enablePhaseForTesting,
  disablePhaseForTesting,
  FEATURE_FLAGS,
} from './featureFlags';

describe('Feature Flags System', () => {
  // Clean up localStorage before and after each test
  beforeEach(() => {
    clearAllFeatureOverrides();
  });

  afterEach(() => {
    clearAllFeatureOverrides();
  });

  describe('isFeatureEnabled', () => {
    it('should return default value when no overrides exist', () => {
      expect(isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')).toBe(
        FEATURE_FLAGS.PHASE_1_DESIGN_SYSTEM.defaultEnabled
      );
    });

    it('should respect localStorage override', () => {
      toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', true);
      expect(isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')).toBe(true);

      toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', false);
      expect(isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')).toBe(false);
    });

    it('should handle unknown feature flags gracefully', () => {
      // @ts-expect-error - Testing invalid flag
      expect(isFeatureEnabled('UNKNOWN_FLAG')).toBe(false);
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags', () => {
      const flags = getAllFeatureFlags();
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0]).toHaveProperty('key');
      expect(flags[0]).toHaveProperty('enabled');
      expect(flags[0]).toHaveProperty('description');
      expect(flags[0]).toHaveProperty('phase');
      expect(flags[0]).toHaveProperty('source');
    });

    it('should show correct source for flags', () => {
      const flags = getAllFeatureFlags();
      const phase1Flag = flags.find((f) => f.key === 'PHASE_1_DESIGN_SYSTEM');
      expect(phase1Flag?.source).toBe('default');

      toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', true);
      const flagsAfterToggle = getAllFeatureFlags();
      const updatedFlag = flagsAfterToggle.find(
        (f) => f.key === 'PHASE_1_DESIGN_SYSTEM'
      );
      expect(updatedFlag?.source).toBe('localStorage');
    });
  });

  describe('getFeatureFlagsByPhase', () => {
    it('should return flags for specific phase', () => {
      const phase1Flags = getFeatureFlagsByPhase(1);
      expect(phase1Flags.length).toBeGreaterThan(0);
      phase1Flags.forEach((flag) => {
        const fullFlag = getAllFeatureFlags().find((f) => f.key === flag.key);
        expect(fullFlag?.phase).toBe(1);
      });
    });

    it('should return empty array for non-existent phase', () => {
      const flags = getFeatureFlagsByPhase(999);
      expect(flags).toEqual([]);
    });
  });

  describe('toggleFeatureForTesting', () => {
    it('should toggle feature flag state', () => {
      const initialState = isFeatureEnabled('PHASE_1_DESIGN_SYSTEM');
      toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM');
      expect(isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')).toBe(!initialState);
    });

    it('should set explicit value', () => {
      toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', true);
      expect(isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')).toBe(true);

      toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', false);
      expect(isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')).toBe(false);
    });
  });

  describe('clearAllFeatureOverrides', () => {
    it('should remove all localStorage overrides', () => {
      toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', true);
      toggleFeatureForTesting('PHASE_2_UI_COMPONENTS', false);

      const flagsBefore = getAllFeatureFlags();
      const hasLocalStorageSource = flagsBefore.some(
        (f) => f.source === 'localStorage'
      );
      expect(hasLocalStorageSource).toBe(true);

      clearAllFeatureOverrides();

      const flagsAfter = getAllFeatureFlags();
      const stillHasLocalStorageSource = flagsAfter.some(
        (f) => f.source === 'localStorage'
      );
      expect(stillHasLocalStorageSource).toBe(false);
    });
  });

  describe('enablePhaseForTesting', () => {
    it('should enable all features in a phase', () => {
      enablePhaseForTesting(1);
      const phase1Flags = getFeatureFlagsByPhase(1);
      phase1Flags.forEach((flag) => {
        expect(flag.enabled).toBe(true);
      });
    });
  });

  describe('disablePhaseForTesting', () => {
    it('should disable all features in a phase', () => {
      disablePhaseForTesting(1);
      const phase1Flags = getFeatureFlagsByPhase(1);
      phase1Flags.forEach((flag) => {
        expect(flag.enabled).toBe(false);
      });
    });
  });

  describe('Phase organization', () => {
    it('should have flags for Phase 0', () => {
      const phase0Flags = getFeatureFlagsByPhase(0);
      expect(phase0Flags.length).toBeGreaterThan(0);
    });

    it('should have flags for Phase 1', () => {
      const phase1Flags = getFeatureFlagsByPhase(1);
      expect(phase1Flags.length).toBeGreaterThan(0);
    });

    it('should have flags for Phase 2', () => {
      const phase2Flags = getFeatureFlagsByPhase(2);
      expect(phase2Flags.length).toBeGreaterThan(0);
    });

    it('should have flags for Phase 3', () => {
      const phase3Flags = getFeatureFlagsByPhase(3);
      expect(phase3Flags.length).toBeGreaterThan(0);
    });

    it('should have flags for Phase 4', () => {
      const phase4Flags = getFeatureFlagsByPhase(4);
      expect(phase4Flags.length).toBeGreaterThan(0);
    });

    it('should have flags for Phase 5', () => {
      const phase5Flags = getFeatureFlagsByPhase(5);
      expect(phase5Flags.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Example usage patterns for testing with feature flags
 */
describe('Feature Flag Usage Examples', () => {
  beforeEach(() => {
    clearAllFeatureOverrides();
  });

  it('Example: Testing with feature enabled', () => {
    toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', true);

    // Your component or feature logic here
    if (isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')) {
      // New design system code
      expect(true).toBe(true);
    }
  });

  it('Example: Testing with feature disabled', () => {
    toggleFeatureForTesting('PHASE_1_DESIGN_SYSTEM', false);

    // Your component or feature logic here
    if (!isFeatureEnabled('PHASE_1_DESIGN_SYSTEM')) {
      // Old design system code
      expect(true).toBe(true);
    }
  });

  it('Example: Testing entire phase', () => {
    enablePhaseForTesting(1);

    const phase1Enabled = getFeatureFlagsByPhase(1).every((f) => f.enabled);
    expect(phase1Enabled).toBe(true);
  });
});
