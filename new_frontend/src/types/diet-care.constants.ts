/**
 * @fileoverview Type-safe constants for Diet Care feature
 * @module types/diet-care.constants
 *
 * All constants are strongly typed and exported as readonly values.
 */

import { MealType } from './diet-care';

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * API endpoint paths for Diet Care feature
 * Backend: /backend/app/api/diet_care.py
 */
export const API_ENDPOINTS = {
  /** Session management endpoints */
  SESSION: {
    CREATE: '/api/diet-care/session/create',
  },
  /** Nutrition analysis endpoint */
  NUTRI_COACH: '/api/diet-care/nutri-coach',
  /** Meal logging endpoints */
  MEALS: {
    BASE: '/api/diet-care/meals',
    BY_ID: (id: string) => `/api/diet-care/meals/${id}`,
  },
  /** Goal management endpoints */
  GOALS: {
    BASE: '/api/diet-care/goals',
  },
  /** Progress tracking endpoints */
  PROGRESS: {
    DAILY: '/api/diet-care/progress/daily',
    WEEKLY: '/api/diet-care/progress/weekly',
  },
  /** Streak endpoint */
  STREAK: '/api/diet-care/streak',
} as const;

// ============================================================================
// Meal Type Configuration
// ============================================================================

/**
 * Meal type metadata and display information
 */
export const MEAL_TYPE_CONFIG = {
  [MealType.Breakfast]: {
    label: 'Breakfast',
    labelKo: '아침',
    icon: 'sunrise',
    color: '#FFB84D',
    typicalTimeRange: { start: 6, end: 10 },
    caloriePercentage: 25,
  },
  [MealType.Lunch]: {
    label: 'Lunch',
    labelKo: '점심',
    icon: 'sun',
    color: '#FF6B6B',
    typicalTimeRange: { start: 11, end: 14 },
    caloriePercentage: 35,
  },
  [MealType.Dinner]: {
    label: 'Dinner',
    labelKo: '저녁',
    icon: 'moon',
    color: '#4ECDC4',
    typicalTimeRange: { start: 17, end: 21 },
    caloriePercentage: 35,
  },
  [MealType.Snack]: {
    label: 'Snack',
    labelKo: '간식',
    icon: 'cookie',
    color: '#95E1D3',
    typicalTimeRange: { start: 0, end: 23 },
    caloriePercentage: 5,
  },
} as const;

// ============================================================================
// File Upload Configuration
// ============================================================================

/**
 * File upload constraints for images
 */
export const FILE_UPLOAD_CONFIG = {
  /** Maximum file size in bytes (10MB) */
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  /** Maximum file size in megabytes */
  MAX_SIZE_MB: 10,
  /** Accepted image MIME types */
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  /** Maximum image dimensions */
  MAX_DIMENSIONS: {
    width: 4096,
    height: 4096,
  },
  /** File input accept attribute value */
  ACCEPT_ATTR: 'image/jpeg,image/jpg,image/png,image/webp',
} as const;

// ============================================================================
// Nutrient Display Configuration
// ============================================================================

/**
 * Display configuration for nutrients
 */
export const NUTRIENT_DISPLAY = {
  calories: {
    label: 'Calories',
    labelKo: '칼로리',
    unit: 'kcal',
    color: '#FF6B6B',
    icon: 'flame',
    description: 'Energy from food',
  },
  protein: {
    label: 'Protein',
    labelKo: '단백질',
    unit: 'g',
    color: '#4ECDC4',
    icon: 'drumstick',
    description: 'Essential for tissue repair',
  },
  carbohydrates: {
    label: 'Carbs',
    labelKo: '탄수화물',
    unit: 'g',
    color: '#FFE66D',
    icon: 'wheat',
    description: 'Primary energy source',
  },
  fat: {
    label: 'Fat',
    labelKo: '지방',
    unit: 'g',
    color: '#95E1D3',
    icon: 'droplet',
    description: 'Energy storage and vitamins',
  },
  sodium: {
    label: 'Sodium',
    labelKo: '나트륨',
    unit: 'mg',
    color: '#F38181',
    icon: 'salt',
    description: 'Regulate fluid balance',
    warning: true, // CKD patients need to limit
  },
  potassium: {
    label: 'Potassium',
    labelKo: '칼륨',
    unit: 'mg',
    color: '#AA96DA',
    icon: 'banana',
    description: 'Heart and muscle function',
    warning: true, // CKD patients need to limit
  },
  phosphorus: {
    label: 'Phosphorus',
    labelKo: '인',
    unit: 'mg',
    color: '#FCBAD3',
    icon: 'bone',
    description: 'Bone health',
    warning: true, // CKD patients need to limit
  },
  fiber: {
    label: 'Fiber',
    labelKo: '식이섬유',
    unit: 'g',
    color: '#A8D8EA',
    icon: 'leaf',
    description: 'Digestive health',
  },
} as const;

// ============================================================================
// CKD Stage Configuration
// ============================================================================

/**
 * Chronic Kidney Disease stage information and default goals
 * Based on KDOQI (Kidney Disease Outcomes Quality Initiative) guidelines
 * @see https://www.kidney.org/professionals/guidelines
 */
export const CKD_STAGE_CONFIG = {
  1: {
    label: 'Stage 1',
    labelKo: '1단계',
    description: 'Normal kidney function with kidney damage',
    gfrRange: '≥90',
    severity: 'minimal',
    color: '#4CAF50',
    defaultGoals: {
      calories_kcal: 2000,
      protein_g: 65,
      sodium_mg: 2000,
      potassium_mg: 3000,
      phosphorus_mg: 1000,
      fluid_ml: 2000,
    },
  },
  2: {
    label: 'Stage 2',
    labelKo: '2단계',
    description: 'Mildly decreased kidney function',
    gfrRange: '60-89',
    severity: 'mild',
    color: '#8BC34A',
    defaultGoals: {
      calories_kcal: 2000,
      protein_g: 60,
      sodium_mg: 2000,
      potassium_mg: 2750,
      phosphorus_mg: 1000,
      fluid_ml: 2000,
    },
  },
  3: {
    label: 'Stage 3',
    labelKo: '3단계',
    description: 'Moderate decrease in kidney function',
    gfrRange: '30-59',
    severity: 'moderate',
    color: '#FFC107',
    defaultGoals: {
      calories_kcal: 2000,
      protein_g: 50,
      sodium_mg: 2000,
      potassium_mg: 2500,
      phosphorus_mg: 900,
      fluid_ml: 2000,
    },
  },
  4: {
    label: 'Stage 4',
    labelKo: '4단계',
    description: 'Severe decrease in kidney function',
    gfrRange: '15-29',
    severity: 'severe',
    color: '#FF5722',
    defaultGoals: {
      calories_kcal: 1900,
      protein_g: 40,
      sodium_mg: 1500,
      potassium_mg: 1500,
      phosphorus_mg: 700,
      fluid_ml: 1500,
    },
  },
  5: {
    label: 'Stage 5',
    labelKo: '5단계',
    description: 'Kidney failure',
    gfrRange: '<15',
    severity: 'kidney failure',
    color: '#F44336',
    defaultGoals: {
      calories_kcal: 1900,
      protein_g: 35,
      sodium_mg: 1250,
      potassium_mg: 1500,
      phosphorus_mg: 700,
      fluid_ml: 1000,
    },
  },
} as const;

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Validation rules for user input
 */
export const VALIDATION_RULES = {
  /** Age constraints */
  AGE: {
    MIN: 1,
    MAX: 150,
  },
  /** Weight constraints (kg) */
  WEIGHT: {
    MIN: 10,
    MAX: 500,
  },
  /** Height constraints (cm) */
  HEIGHT: {
    MIN: 50,
    MAX: 300,
  },
  /** CKD stage constraints */
  CKD_STAGE: {
    MIN: 1,
    MAX: 5,
  },
  /** Text description constraints */
  DESCRIPTION: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 500,
  },
  /** Notes constraints */
  NOTES: {
    MAX_LENGTH: 1000,
  },
  /** Foods per meal limit */
  FOODS: {
    MAX_PER_MEAL: 50,
  },
} as const;

// ============================================================================
// Analysis Configuration
// ============================================================================

/**
 * Analysis confidence thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  /** Very high confidence (>= 0.9) */
  HIGH: 0.9,
  /** Medium confidence (>= 0.7) */
  MEDIUM: 0.7,
  /** Low confidence (>= 0.5) */
  LOW: 0.5,
  /** Minimum acceptable confidence */
  MINIMUM: 0.3,
} as const;

/**
 * Analysis timeout settings (milliseconds)
 */
export const ANALYSIS_TIMEOUTS = {
  /** Timeout for image analysis */
  IMAGE_ANALYSIS: 30000,
  /** Timeout for text analysis */
  TEXT_ANALYSIS: 15000,
  /** Timeout for general API calls */
  API_CALL: 10000,
} as const;

// ============================================================================
// Progress Tracking Configuration
// ============================================================================

/**
 * Nutrient status color coding
 */
export const STATUS_COLORS = {
  under: '#FFA726', // Orange - below target
  optimal: '#66BB6A', // Green - within target
  over: '#EF5350', // Red - above target
} as const;

/**
 * Compliance score ranges
 */
export const COMPLIANCE_RANGES = {
  EXCELLENT: { min: 90, max: 100, label: 'Excellent', color: '#4CAF50' },
  GOOD: { min: 75, max: 89, label: 'Good', color: '#8BC34A' },
  FAIR: { min: 60, max: 74, label: 'Fair', color: '#FFC107' },
  NEEDS_IMPROVEMENT: { min: 0, max: 59, label: 'Needs Improvement', color: '#FF5722' },
} as const;

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default nutrition goals (used when CKD stage is not specified)
 */
export const DEFAULT_NUTRITION_GOALS = {
  calories_kcal: 2000,
  protein_g: 50,
  sodium_mg: 2000,
  potassium_mg: 2000,
  phosphorus_mg: 1000,
  fluid_ml: 2000,
} as const;

/**
 * Default activity level
 */
export const DEFAULT_ACTIVITY_LEVEL = 'moderate' as const;

/**
 * Default query date range (days)
 */
export const DEFAULT_DATE_RANGE_DAYS = 7;

/**
 * Session expiration time (hours)
 */
export const SESSION_EXPIRATION_HOURS = 1;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Standard error messages
 */
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size must be less than 10MB',
  INVALID_FILE_TYPE: 'Please upload a valid image file (JPEG, PNG, or WebP)',
  NO_IMAGE_OR_TEXT: 'Please provide either an image or text description',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  SESSION_EXPIRED: 'Your session has expired. Please start a new analysis',
  ANALYSIS_FAILED: 'Failed to analyze the food. Please try again',
  NO_FOOD_DETECTED: 'No food detected in the image. Please try a clearer photo',
  INVALID_CKD_STAGE: 'CKD stage must be between 1 and 5',
  INVALID_AGE: 'Age must be between 1 and 150',
  INVALID_WEIGHT: 'Weight must be between 10 and 500 kg',
  INVALID_HEIGHT: 'Height must be between 50 and 300 cm',
} as const;

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Loading states and messages
 */
export const LOADING_MESSAGES = {
  CREATING_SESSION: 'Creating session...',
  ANALYZING_IMAGE: 'Analyzing your food...',
  ANALYZING_TEXT: 'Processing your description...',
  SAVING_MEAL: 'Saving meal entry...',
  LOADING_MEALS: 'Loading your meals...',
  LOADING_PROGRESS: 'Loading progress data...',
  UPDATING_GOALS: 'Updating your goals...',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SESSION_CREATED: 'Session created successfully',
  ANALYSIS_COMPLETE: 'Analysis complete',
  MEAL_SAVED: 'Meal saved successfully',
  MEAL_DELETED: 'Meal deleted successfully',
  GOALS_UPDATED: 'Goals updated successfully',
} as const;
