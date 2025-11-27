/**
 * @fileoverview Tests for Diet Care type system
 * Demonstrates usage and validates type guards
 */

import { describe, it, expect } from 'vitest';
import {
  // Core types
  CKDStage,
  MealType,
  type NutritionAnalysisSuccess,
  type NutritionAnalysisError,
  type FoodItem,
  type FoodItemId,
  type SessionId,
  type MealEntryId,
  type NutrientData,

  // Type guards
  isNutritionSuccess,
  isNutritionError,
  isImageFile,
  isValidFileSize,
  isValidNutrientData,
  isValidFoodItem,
  isCKDStage,
  isMealType,
  isValidNutrientValue,
  isValidPercentage,
  isValidConfidence,
  isValidISODateString,

  // Utility types
  AsyncState,
  Result,
  Option,
  Ok,
  Err,
  Some,
  None,

  // Constants
  NUTRIENT_LIMITS,
  MEAL_TYPE_INFO,
  IMAGE_FILE_CONSTRAINTS,
  CONFIDENCE_THRESHOLDS,
  CKD_STAGE_INFO,
} from '../index';

describe('Diet Care Type System', () => {
  describe('Type Guards', () => {
    describe('isNutritionSuccess', () => {
      it('should identify success results', () => {
        const success: NutritionAnalysisSuccess = {
          type: 'success',
          foods: [],
          totals: {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            sodium: 0,
            potassium: 0,
            phosphorus: 0,
            itemCount: 0,
            calculatedAt: new Date().toISOString(),
          },
          analysis: 'Test',
          confidence: 0.9,
          analyzedAt: new Date().toISOString(),
        };

        expect(isNutritionSuccess(success)).toBe(true);
      });

      it('should reject error results', () => {
        const error: NutritionAnalysisError = {
          type: 'error',
          code: 'ANALYSIS_FAILED',
          message: 'Test error',
          occurredAt: new Date().toISOString(),
        };

        expect(isNutritionSuccess(error)).toBe(false);
      });
    });

    describe('isNutritionError', () => {
      it('should identify error results', () => {
        const error: NutritionAnalysisError = {
          type: 'error',
          code: 'INVALID_IMAGE',
          message: 'Invalid image format',
          occurredAt: new Date().toISOString(),
        };

        expect(isNutritionError(error)).toBe(true);
      });

      it('should reject success results', () => {
        const success: NutritionAnalysisSuccess = {
          type: 'success',
          foods: [],
          totals: {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            sodium: 0,
            potassium: 0,
            phosphorus: 0,
            itemCount: 0,
            calculatedAt: new Date().toISOString(),
          },
          analysis: 'Test',
          confidence: 0.9,
          analyzedAt: new Date().toISOString(),
        };

        expect(isNutritionError(success)).toBe(false);
      });
    });

    describe('isImageFile', () => {
      it('should accept valid image types', () => {
        const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
        const pngFile = new File([''], 'test.png', { type: 'image/png' });
        const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

        expect(isImageFile(jpegFile)).toBe(true);
        expect(isImageFile(pngFile)).toBe(true);
        expect(isImageFile(webpFile)).toBe(true);
      });

      it('should reject non-image types', () => {
        const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        const textFile = new File([''], 'test.txt', { type: 'text/plain' });

        expect(isImageFile(pdfFile)).toBe(false);
        expect(isImageFile(textFile)).toBe(false);
      });
    });

    describe('isValidFileSize', () => {
      it('should accept files within size limit', () => {
        const smallFile = new File(['x'.repeat(1000)], 'small.jpg');
        expect(isValidFileSize(smallFile, 10000)).toBe(true);
      });

      it('should reject files exceeding size limit', () => {
        const largeFile = new File(['x'.repeat(20000)], 'large.jpg');
        expect(isValidFileSize(largeFile, 10000)).toBe(false);
      });

      it('should reject empty files', () => {
        const emptyFile = new File([''], 'empty.jpg');
        expect(isValidFileSize(emptyFile)).toBe(false);
      });
    });

    describe('isValidNutrientData', () => {
      it('should accept valid nutrient data', () => {
        const validData: NutrientData = {
          calories: 250,
          protein: 15,
          carbohydrates: 30,
          fat: 8,
          sodium: 400,
          potassium: 300,
          phosphorus: 200,
        };

        expect(isValidNutrientData(validData)).toBe(true);
      });

      it('should accept nutrient data with optional fields', () => {
        const dataWithOptional: NutrientData = {
          calories: 250,
          protein: 15,
          carbohydrates: 30,
          fat: 8,
          sodium: 400,
          potassium: 300,
          phosphorus: 200,
          fiber: 5,
          sugar: 10,
        };

        expect(isValidNutrientData(dataWithOptional)).toBe(true);
      });

      it('should reject invalid nutrient data', () => {
        expect(isValidNutrientData(null)).toBe(false);
        expect(isValidNutrientData(undefined)).toBe(false);
        expect(isValidNutrientData('not an object')).toBe(false);
        expect(isValidNutrientData({})).toBe(false);
        expect(isValidNutrientData({ calories: -1, protein: 0 })).toBe(false);
      });
    });

    describe('isValidFoodItem', () => {
      it('should accept valid food items', () => {
        const validFood: FoodItem = {
          id: 'food-123' as FoodItemId,
          name: 'Chicken',
          servingSize: '100g',
          nutrition: {
            calories: 165,
            protein: 31,
            carbohydrates: 0,
            fat: 3.6,
            sodium: 74,
            potassium: 256,
            phosphorus: 220,
          },
        };

        expect(isValidFoodItem(validFood)).toBe(true);
      });

      it('should reject invalid food items', () => {
        expect(isValidFoodItem(null)).toBe(false);
        expect(isValidFoodItem({})).toBe(false);
        expect(isValidFoodItem({ id: '', name: 'Test' })).toBe(false);
      });
    });

    describe('isCKDStage', () => {
      it('should accept valid CKD stages', () => {
        expect(isCKDStage(CKDStage.Stage1)).toBe(true);
        expect(isCKDStage(CKDStage.Stage3a)).toBe(true);
        expect(isCKDStage(CKDStage.Stage5)).toBe(true);
      });

      it('should reject invalid values', () => {
        expect(isCKDStage('INVALID')).toBe(false);
        expect(isCKDStage(null)).toBe(false);
        expect(isCKDStage(123)).toBe(false);
      });
    });

    describe('isMealType', () => {
      it('should accept valid meal types', () => {
        expect(isMealType(MealType.Breakfast)).toBe(true);
        expect(isMealType(MealType.Lunch)).toBe(true);
        expect(isMealType(MealType.Snack)).toBe(true);
      });

      it('should reject invalid values', () => {
        expect(isMealType('INVALID')).toBe(false);
        expect(isMealType(null)).toBe(false);
      });
    });

    describe('isValidNutrientValue', () => {
      it('should accept valid values', () => {
        expect(isValidNutrientValue(100)).toBe(true);
        expect(isValidNutrientValue(0)).toBe(true);
        expect(isValidNutrientValue(50, 0, 100)).toBe(true);
      });

      it('should reject invalid values', () => {
        expect(isValidNutrientValue(-1)).toBe(false);
        expect(isValidNutrientValue(NaN)).toBe(false);
        expect(isValidNutrientValue(Infinity)).toBe(false);
        expect(isValidNutrientValue(150, 0, 100)).toBe(false);
      });
    });

    describe('isValidPercentage', () => {
      it('should accept values 0-100', () => {
        expect(isValidPercentage(0)).toBe(true);
        expect(isValidPercentage(50)).toBe(true);
        expect(isValidPercentage(100)).toBe(true);
      });

      it('should reject values outside 0-100', () => {
        expect(isValidPercentage(-1)).toBe(false);
        expect(isValidPercentage(101)).toBe(false);
        expect(isValidPercentage(NaN)).toBe(false);
      });
    });

    describe('isValidConfidence', () => {
      it('should accept values 0-1', () => {
        expect(isValidConfidence(0)).toBe(true);
        expect(isValidConfidence(0.5)).toBe(true);
        expect(isValidConfidence(1)).toBe(true);
      });

      it('should reject values outside 0-1', () => {
        expect(isValidConfidence(-0.1)).toBe(false);
        expect(isValidConfidence(1.1)).toBe(false);
        expect(isValidConfidence(NaN)).toBe(false);
      });
    });

    describe('isValidISODateString', () => {
      it('should accept valid ISO 8601 dates', () => {
        const validDate = new Date().toISOString();
        expect(isValidISODateString(validDate)).toBe(true);
      });

      it('should reject invalid date strings', () => {
        expect(isValidISODateString('not a date')).toBe(false);
        expect(isValidISODateString('2025-13-01')).toBe(false);
        expect(isValidISODateString(123)).toBe(false);
      });
    });
  });

  describe('Utility Types', () => {
    describe('AsyncState', () => {
      it('should handle idle state', () => {
        const state: AsyncState<string> = { status: 'idle' };
        expect(state.status).toBe('idle');
      });

      it('should handle loading state', () => {
        const state: AsyncState<string> = { status: 'loading', progress: 0.5 };
        expect(state.status).toBe('loading');
        expect(state.progress).toBe(0.5);
      });

      it('should handle success state', () => {
        const state: AsyncState<string> = { status: 'success', data: 'test' };
        expect(state.status).toBe('success');
        expect(state.data).toBe('test');
      });

      it('should handle error state', () => {
        const error = new Error('Test error');
        const state: AsyncState<string> = { status: 'error', error };
        expect(state.status).toBe('error');
        expect(state.error).toBe(error);
      });
    });

    describe('Result type', () => {
      it('should handle Ok results', () => {
        const result = Ok(42);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(42);
        }
      });

      it('should handle Err results', () => {
        const result = Err('error message');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('error message');
        }
      });
    });

    describe('Option type', () => {
      it('should handle Some values', () => {
        const option = Some(42);
        expect(option.some).toBe(true);
        if (option.some) {
          expect(option.value).toBe(42);
        }
      });

      it('should handle None values', () => {
        const option = None<number>();
        expect(option.some).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    describe('NUTRIENT_LIMITS', () => {
      it('should provide limits for all CKD stages', () => {
        expect(NUTRIENT_LIMITS[CKDStage.Stage1]).toBeDefined();
        expect(NUTRIENT_LIMITS[CKDStage.Stage3a]).toBeDefined();
        expect(NUTRIENT_LIMITS[CKDStage.Stage5]).toBeDefined();
      });

      it('should have decreasing limits for advanced stages', () => {
        const stage1Protein = NUTRIENT_LIMITS[CKDStage.Stage1].protein.max;
        const stage5Protein = NUTRIENT_LIMITS[CKDStage.Stage5].protein.max;
        expect(stage5Protein).toBeLessThan(stage1Protein);
      });
    });

    describe('MEAL_TYPE_INFO', () => {
      it('should provide info for all meal types', () => {
        expect(MEAL_TYPE_INFO[MealType.Breakfast]).toBeDefined();
        expect(MEAL_TYPE_INFO[MealType.Lunch]).toBeDefined();
        expect(MEAL_TYPE_INFO[MealType.Dinner]).toBeDefined();
        expect(MEAL_TYPE_INFO[MealType.Snack]).toBeDefined();
      });

      it('should have calorie percentages that sum appropriately', () => {
        const total = Object.values(MEAL_TYPE_INFO).reduce(
          (sum, info) => sum + info.caloriePercentage,
          0
        );
        expect(total).toBe(100);
      });
    });

    describe('IMAGE_FILE_CONSTRAINTS', () => {
      it('should have reasonable size limit', () => {
        expect(IMAGE_FILE_CONSTRAINTS.maxSizeBytes).toBeGreaterThan(0);
        expect(IMAGE_FILE_CONSTRAINTS.maxSizeBytes).toBeLessThanOrEqual(
          10 * 1024 * 1024
        );
      });

      it('should accept common image types', () => {
        expect(IMAGE_FILE_CONSTRAINTS.acceptedTypes).toContain('image/jpeg');
        expect(IMAGE_FILE_CONSTRAINTS.acceptedTypes).toContain('image/png');
      });
    });

    describe('CONFIDENCE_THRESHOLDS', () => {
      it('should have ascending thresholds', () => {
        expect(CONFIDENCE_THRESHOLDS.MINIMUM).toBeLessThan(
          CONFIDENCE_THRESHOLDS.LOW
        );
        expect(CONFIDENCE_THRESHOLDS.LOW).toBeLessThan(
          CONFIDENCE_THRESHOLDS.MEDIUM
        );
        expect(CONFIDENCE_THRESHOLDS.MEDIUM).toBeLessThan(
          CONFIDENCE_THRESHOLDS.HIGH
        );
      });

      it('should have values in valid range', () => {
        expect(CONFIDENCE_THRESHOLDS.MINIMUM).toBeGreaterThanOrEqual(0);
        expect(CONFIDENCE_THRESHOLDS.HIGH).toBeLessThanOrEqual(1);
      });
    });

    describe('CKD_STAGE_INFO', () => {
      it('should provide info for all stages', () => {
        Object.values(CKDStage).forEach((stage) => {
          expect(CKD_STAGE_INFO[stage]).toBeDefined();
          expect(CKD_STAGE_INFO[stage].label).toBeTruthy();
          expect(CKD_STAGE_INFO[stage].gfrRange).toBeTruthy();
        });
      });
    });
  });

  describe('Type Safety', () => {
    it('should prevent mixing branded types', () => {
      const sessionId: SessionId = 'session-123' as SessionId;
      const mealId: MealEntryId = 'meal-456' as MealEntryId;

      // This would be a compile-time error:
      // const wrongId: SessionId = mealId;

      // But at runtime they're just strings
      expect(typeof sessionId).toBe('string');
      expect(typeof mealId).toBe('string');
    });

    it('should enforce discriminated union exhaustiveness', () => {
      const success: NutritionAnalysisSuccess = {
        type: 'success',
        foods: [],
        totals: {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
          sodium: 0,
          potassium: 0,
          phosphorus: 0,
          itemCount: 0,
          calculatedAt: new Date().toISOString(),
        },
        analysis: 'Test',
        confidence: 0.9,
        analyzedAt: new Date().toISOString(),
      };

      // Type narrowing works correctly
      if (success.type === 'success') {
        expect(success.foods).toBeDefined();
        // TypeScript knows success.code doesn't exist
      }
    });
  });
});
