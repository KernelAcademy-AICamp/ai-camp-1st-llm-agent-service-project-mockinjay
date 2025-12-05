/**
 * @fileoverview Type guards and runtime validators for Diet Care feature
 * @module types/diet-care.guards
 *
 * Provides runtime type checking and validation for Diet Care types.
 * All validators follow strict TypeScript type safety principles.
 */

import { MealType, AnalysisStatus } from './diet-care';
import type {
  ActivityLevel,
  NutrientStatus,
  FoodItem,
  HealthProfile,
  NutritionAnalysisResult,
  MealEntry,
  NutrientProgress,
} from './diet-care';

// ============================================================================
// Enum Type Guards
// ============================================================================

/**
 * Type guard to check if value is a valid MealType
 * @param value - The value to check
 * @returns True if value is a valid MealType enum value
 * @example
 * ```typescript
 * if (isMealType(input)) {
 *   console.log(`Valid meal type: ${input}`);
 * }
 * ```
 */
export function isMealType(value: unknown): value is MealType {
  return Object.values(MealType).includes(value as MealType);
}

/**
 * Type guard to check if value is a valid AnalysisStatus
 * @param value - The value to check
 * @returns True if value is a valid AnalysisStatus enum value
 */
export function isAnalysisStatus(value: unknown): value is AnalysisStatus {
  return Object.values(AnalysisStatus).includes(value as AnalysisStatus);
}

/**
 * Type guard to check if value is a valid ActivityLevel
 * @param value - The value to check
 * @returns True if value is a valid activity level
 */
export function isActivityLevel(value: unknown): value is ActivityLevel {
  const validLevels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  return typeof value === 'string' && validLevels.includes(value as ActivityLevel);
}

/**
 * Type guard to check if value is a valid NutrientStatus
 * @param value - The value to check
 * @returns True if value is a valid nutrient status
 */
export function isNutrientStatus(value: unknown): value is NutrientStatus {
  const validStatuses: NutrientStatus[] = ['under', 'optimal', 'over'];
  return typeof value === 'string' && validStatuses.includes(value as NutrientStatus);
}

// ============================================================================
// File Validation
// ============================================================================

/**
 * Type guard to check if a file is an image
 * @param file - The file to check
 * @returns True if file is an image type
 * @example
 * ```typescript
 * if (isValidImageFile(file)) {
 *   // Safe to upload as image
 * }
 * ```
 */
export function isValidImageFile(file: File): boolean {
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validImageTypes.includes(file.type);
}

/**
 * Type guard to check if file size is valid
 * @param file - The file to check
 * @param maxSizeMB - Maximum allowed size in megabytes (default: 10MB)
 * @returns True if file size is within limits
 * @example
 * ```typescript
 * if (!isValidFileSize(file, 5)) {
 *   alert('File must be less than 5MB');
 * }
 * ```
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size > 0 && file.size <= maxSizeBytes;
}

// ============================================================================
// Numeric Validation
// ============================================================================

/**
 * Validates that a numeric value is within acceptable range
 * @param value - The value to validate
 * @param min - Minimum acceptable value (default: 0)
 * @param max - Maximum acceptable value (optional)
 * @returns True if value is valid
 */
export function isValidNumericValue(
  value: number,
  min: number = 0,
  max?: number
): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Validates that a confidence score is within valid range (0-1)
 * @param confidence - The confidence score to validate
 * @returns True if confidence is valid
 */
export function isValidConfidence(confidence: number): boolean {
  return Number.isFinite(confidence) && confidence >= 0 && confidence <= 1;
}

/**
 * Validates that a percentage value is within 0-100 range
 * @param value - The value to validate
 * @returns True if value is a valid percentage
 */
export function isValidPercentage(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

/**
 * Validates CKD stage (1-5)
 * @param stage - The CKD stage to validate
 * @returns True if stage is valid
 */
export function isValidCKDStage(stage: number): boolean {
  return Number.isInteger(stage) && stage >= 1 && stage <= 5;
}

// ============================================================================
// Object Type Guards
// ============================================================================

/**
 * Type guard to validate FoodItem object
 * @param item - The item to validate
 * @returns True if item is a valid FoodItem
 * @example
 * ```typescript
 * if (isValidFoodItem(data)) {
 *   // TypeScript now knows data is FoodItem
 *   console.log(data.calories);
 * }
 * ```
 */
export function isValidFoodItem(item: unknown): item is FoodItem {
  if (typeof item !== 'object' || item === null) return false;

  const food = item as Record<string, unknown>;

  // Required fields
  if (typeof food.name !== 'string' || food.name.length === 0) return false;
  if (typeof food.amount !== 'string' || food.amount.length === 0) return false;
  if (typeof food.calories !== 'number' || !isValidNumericValue(food.calories)) return false;
  if (typeof food.protein_g !== 'number' || !isValidNumericValue(food.protein_g)) return false;
  if (typeof food.sodium_mg !== 'number' || !isValidNumericValue(food.sodium_mg)) return false;
  if (typeof food.potassium_mg !== 'number' || !isValidNumericValue(food.potassium_mg)) return false;
  if (typeof food.phosphorus_mg !== 'number' || !isValidNumericValue(food.phosphorus_mg)) return false;

  // Optional fields
  if ('carbs_g' in food && typeof food.carbs_g !== 'number') return false;
  if ('fat_g' in food && typeof food.fat_g !== 'number') return false;
  if ('fiber_g' in food && typeof food.fiber_g !== 'number') return false;

  return true;
}

/**
 * Type guard to validate HealthProfile object
 * @param profile - The profile to validate
 * @returns True if profile is a valid HealthProfile
 */
export function isValidHealthProfile(profile: unknown): profile is HealthProfile {
  if (typeof profile !== 'object' || profile === null) return false;

  const p = profile as Record<string, unknown>;

  // All fields are optional, but if present must be valid
  if ('age' in p && (typeof p.age !== 'number' || !isValidNumericValue(p.age, 0, 150))) {
    return false;
  }
  if ('weight_kg' in p && (typeof p.weight_kg !== 'number' || !isValidNumericValue(p.weight_kg, 0, 500))) {
    return false;
  }
  if ('height_cm' in p && (typeof p.height_cm !== 'number' || !isValidNumericValue(p.height_cm, 0, 300))) {
    return false;
  }
  if ('ckd_stage' in p && (typeof p.ckd_stage !== 'number' || !isValidCKDStage(p.ckd_stage))) {
    return false;
  }
  if ('activity_level' in p && !isActivityLevel(p.activity_level)) {
    return false;
  }
  if ('medical_conditions' in p && (!Array.isArray(p.medical_conditions) || !p.medical_conditions.every((c) => typeof c === 'string'))) {
    return false;
  }
  if ('allergies' in p && (!Array.isArray(p.allergies) || !p.allergies.every((a) => typeof a === 'string'))) {
    return false;
  }

  return true;
}

/**
 * Type guard to validate NutritionAnalysisResult object
 * @param result - The result to validate
 * @returns True if result is a valid NutritionAnalysisResult
 */
export function isValidNutritionAnalysisResult(result: unknown): result is NutritionAnalysisResult {
  if (typeof result !== 'object' || result === null) return false;

  const r = result as Record<string, unknown>;

  // Validate foods array
  if (!Array.isArray(r.foods) || !r.foods.every(isValidFoodItem)) return false;

  // Validate totals
  if (typeof r.total_calories !== 'number' || !isValidNumericValue(r.total_calories)) return false;
  if (typeof r.total_protein_g !== 'number' || !isValidNumericValue(r.total_protein_g)) return false;
  if (typeof r.total_sodium_mg !== 'number' || !isValidNumericValue(r.total_sodium_mg)) return false;
  if (typeof r.total_potassium_mg !== 'number' || !isValidNumericValue(r.total_potassium_mg)) return false;
  if (typeof r.total_phosphorus_mg !== 'number' || !isValidNumericValue(r.total_phosphorus_mg)) return false;
  if (typeof r.total_carbs_g !== 'number' || !isValidNumericValue(r.total_carbs_g)) return false;
  if (typeof r.total_fat_g !== 'number' || !isValidNumericValue(r.total_fat_g)) return false;
  if (typeof r.total_fiber_g !== 'number' || !isValidNumericValue(r.total_fiber_g)) return false;

  // Validate confidence score
  if (typeof r.confidence_score !== 'number' || !isValidConfidence(r.confidence_score)) return false;

  // Validate arrays
  if (!Array.isArray(r.recommendations) || !r.recommendations.every((rec) => typeof rec === 'string')) return false;
  if (!Array.isArray(r.warnings) || !r.warnings.every((warn) => typeof warn === 'string')) return false;

  // Optional fields
  if ('meal_type_suggestion' in r && r.meal_type_suggestion !== undefined && !isMealType(r.meal_type_suggestion)) {
    return false;
  }
  if ('analysis_notes' in r && r.analysis_notes !== undefined && typeof r.analysis_notes !== 'string') {
    return false;
  }

  return true;
}

/**
 * Type guard to validate NutrientProgress object
 * @param progress - The progress to validate
 * @returns True if progress is a valid NutrientProgress
 */
export function isValidNutrientProgress(progress: unknown): progress is NutrientProgress {
  if (typeof progress !== 'object' || progress === null) return false;

  const p = progress as Record<string, unknown>;

  return (
    typeof p.current === 'number' &&
    isValidNumericValue(p.current) &&
    typeof p.target === 'number' &&
    isValidNumericValue(p.target) &&
    typeof p.percentage === 'number' &&
    isValidPercentage(p.percentage) &&
    isNutrientStatus(p.status)
  );
}

/**
 * Type guard to validate MealEntry object
 * @param entry - The entry to validate
 * @returns True if entry is a valid MealEntry
 */
export function isValidMealEntry(entry: unknown): entry is MealEntry {
  if (typeof entry !== 'object' || entry === null) return false;

  const meal = entry as Record<string, unknown>;

  return (
    typeof meal.id === 'string' &&
    meal.id.length > 0 &&
    typeof meal.user_id === 'string' &&
    meal.user_id.length > 0 &&
    isMealType(meal.meal_type) &&
    Array.isArray(meal.foods) &&
    meal.foods.every(isValidFoodItem) &&
    typeof meal.total_calories === 'number' &&
    typeof meal.total_protein_g === 'number' &&
    typeof meal.total_sodium_mg === 'number' &&
    typeof meal.total_potassium_mg === 'number' &&
    typeof meal.total_phosphorus_mg === 'number' &&
    typeof meal.logged_at === 'string' &&
    isValidISODateString(meal.logged_at) &&
    typeof meal.created_at === 'string' &&
    isValidISODateString(meal.created_at)
  );
}

// ============================================================================
// String Validation
// ============================================================================

/**
 * Type guard to check if value is a valid ISO 8601 date string
 * @param value - The value to check
 * @returns True if value is a valid date string
 * @example
 * ```typescript
 * if (isValidISODateString('2025-01-15T10:30:00Z')) {
 *   // Valid ISO date
 * }
 * ```
 */
export function isValidISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Type guard to validate email format
 * @param value - The value to check
 * @returns True if value is a valid email format
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Validates that a URL string is well-formed
 * @param value - The value to check
 * @returns True if value is a valid URL
 */
export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates session ID format
 * @param value - The value to check
 * @returns True if value is a valid session ID
 */
export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.startsWith('session_');
}

// ============================================================================
// Utility Type Guards
// ============================================================================

/**
 * Type guard to check if value is a non-empty array
 * @param value - The value to check
 * @returns True if value is a non-empty array
 * @example
 * ```typescript
 * if (isNonEmptyArray(foods)) {
 *   console.log(`First food: ${foods[0].name}`);
 * }
 * ```
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard to check if value is a plain object (not array, null, or other types)
 * @param value - The value to check
 * @returns True if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Validates that an object has all required keys
 * @param obj - Object to validate
 * @param requiredKeys - Array of required key names
 * @returns True if all keys are present
 * @example
 * ```typescript
 * if (hasRequiredKeys(obj, ['name', 'calories'])) {
 *   // Object has required fields
 * }
 * ```
 */
export function hasRequiredKeys<T extends object>(
  obj: T,
  requiredKeys: ReadonlyArray<keyof T>
): boolean {
  return requiredKeys.every((key) => key in obj);
}

/**
 * Validates string length is within bounds
 * @param value - The string to validate
 * @param minLength - Minimum length (inclusive)
 * @param maxLength - Maximum length (inclusive)
 * @returns True if string length is valid
 */
export function isValidStringLength(
  value: string,
  minLength: number,
  maxLength: number
): boolean {
  return value.length >= minLength && value.length <= maxLength;
}
