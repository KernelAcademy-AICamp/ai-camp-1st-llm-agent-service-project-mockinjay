/**
 * @fileoverview Utility types for Diet Care feature
 * @module types/diet-care.utils
 */

import type { NutritionAnalysisResult } from './diet-care';

/**
 * Generic async state for managing loading, error, and data states
 * Enables type-safe state management for asynchronous operations
 * @template T - The success data type
 * @template E - The error type (defaults to Error)
 */
export type AsyncState<T, E = Error> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly progress?: number }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: E };

/**
 * Helper type to extract data from AsyncState
 * @template T - The AsyncState type
 */
export type AsyncData<T> = T extends AsyncState<infer D> ? D : never;

/**
 * Helper type to extract error from AsyncState
 * @template T - The AsyncState type
 */
export type AsyncError<T> = T extends AsyncState<unknown, infer E> ? E : never;

/**
 * Form field state with validation
 * @template T - The value type
 */
export interface FormField<T> {
  /** Current field value */
  readonly value: T;
  /** Whether field has been touched by user */
  readonly touched: boolean;
  /** Validation error message if any */
  readonly error?: string;
  /** Whether field is currently being validated */
  readonly validating?: boolean;
}

/**
 * Form state for multiple fields
 * @template T - The form data shape
 */
export type FormState<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: FormField<T[K]>;
};

/**
 * Image upload state machine
 * Uses discriminated union for type-safe state transitions
 */
export type ImageUploadState =
  | { readonly stage: 'initial' }
  | {
      readonly stage: 'selected';
      readonly file: File;
      readonly previewUrl: string;
    }
  | {
      readonly stage: 'uploading';
      readonly file: File;
      readonly previewUrl: string;
      readonly progress: number;
    }
  | {
      readonly stage: 'uploaded';
      readonly file: File;
      readonly previewUrl: string;
      readonly url: string;
    }
  | {
      readonly stage: 'error';
      readonly file?: File;
      readonly error: string;
    };

/**
 * Analysis state machine for nutrition analysis workflow
 * Ensures type-safe transitions through the analysis process
 */
export type AnalysisStateMachine =
  | { readonly state: 'idle' }
  | {
      readonly state: 'preparing';
      readonly input: File | string;
    }
  | {
      readonly state: 'analyzing';
      readonly input: File | string;
      readonly startedAt: string;
    }
  | {
      readonly state: 'completed';
      readonly input: File | string;
      readonly result: NutritionAnalysisResult;
      readonly analyzedAt: string;
    }
  | {
      readonly state: 'failed';
      readonly input: File | string;
      readonly error: string;
      readonly failedAt: string;
    };

/**
 * Pagination state
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  readonly currentPage: number;
  /** Items per page */
  readonly pageSize: number;
  /** Total number of items */
  readonly totalItems: number;
  /** Whether there are more pages */
  readonly hasNextPage: boolean;
  /** Whether there are previous pages */
  readonly hasPreviousPage: boolean;
}

/**
 * Sort configuration
 * @template T - The type being sorted
 */
export interface SortConfig<T> {
  /** Field to sort by */
  readonly field: keyof T;
  /** Sort direction */
  readonly direction: 'asc' | 'desc';
}

/**
 * Filter configuration
 * @template T - The type being filtered
 */
export type FilterConfig<T> = Partial<{
  readonly [K in keyof T]: T[K] | readonly T[K][] | { min?: T[K]; max?: T[K] };
}>;

/**
 * Debounced value wrapper
 * @template T - The value type
 */
export interface DebouncedValue<T> {
  /** Current immediate value */
  readonly currentValue: T;
  /** Debounced value */
  readonly debouncedValue: T;
  /** Whether debounce is pending */
  readonly isPending: boolean;
}

/**
 * Result type for operations that can succeed or fail
 * Similar to Rust's Result<T, E>
 * @template T - Success value type
 * @template E - Error type
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Option type for values that may or may not exist
 * Similar to Rust's Option<T>
 * @template T - The value type
 */
export type Option<T> = { readonly some: true; readonly value: T } | { readonly some: false };

/**
 * Helper to create a successful Result
 * @param value - The success value
 * @returns A success Result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Helper to create a failed Result
 * @param error - The error
 * @returns An error Result
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Helper to create a Some Option
 * @param value - The value
 * @returns A Some Option
 */
export function Some<T>(value: T): Option<T> {
  return { some: true, value };
}

/**
 * Helper to create a None Option
 * @returns A None Option
 */
export function None<T>(): Option<T> {
  return { some: false };
}

/**
 * Makes all properties of T deeply readonly
 * @template T - The type to make deeply readonly
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * Makes all properties of T deeply partial
 * @template T - The type to make deeply partial
 */
export type DeepPartial<T> = T extends (infer R)[]
  ? DeepPartialArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepPartialObject<T>
  : T;

interface DeepPartialArray<T> extends Array<DeepPartial<T>> {}

type DeepPartialObject<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

/**
 * Extracts keys of T where value type is assignable to V
 * @template T - The object type
 * @template V - The value type to match
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Ensures at least one property from T is required
 * @template T - The object type
 */
export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

/**
 * Ensures exactly one property from T is present
 * @template T - The object type
 */
export type RequireExactlyOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  /** Whether validation passed */
  readonly valid: boolean;
  /** Validation errors by field name */
  readonly errors: Readonly<Record<string, string>>;
  /** Warnings that don't prevent submission */
  readonly warnings?: Readonly<Record<string, string>>;
}

/**
 * Retry configuration for async operations
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  readonly maxAttempts: number;
  /** Delay between retries in milliseconds */
  readonly delayMs: number;
  /** Whether to use exponential backoff */
  readonly exponentialBackoff: boolean;
  /** Maximum delay for exponential backoff */
  readonly maxDelayMs?: number;
  /** Function to determine if error is retryable */
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Cache entry with expiration
 * @template T - The cached value type
 */
export interface CacheEntry<T> {
  /** Cached value */
  readonly value: T;
  /** Timestamp when cached */
  readonly cachedAt: string;
  /** Expiration timestamp */
  readonly expiresAt: string;
  /** Whether entry is stale but still usable */
  readonly isStale: boolean;
}

/**
 * Time range selector
 */
export interface TimeRange {
  /** Start timestamp (ISO 8601) */
  readonly start: string;
  /** End timestamp (ISO 8601) */
  readonly end: string;
  /** Preset identifier if using a preset range */
  readonly preset?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  /** Notification title */
  readonly title: string;
  /** Notification message */
  readonly message: string;
  /** Severity level */
  readonly severity: 'info' | 'success' | 'warning' | 'error';
  /** Auto-dismiss duration in milliseconds (0 for no auto-dismiss) */
  readonly duration?: number;
  /** Optional action button */
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void;
  };
}

/**
 * Extract the element type from an array type
 * @template T - The array type
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

/**
 * Make specific properties of T required
 * @template T - The object type
 * @template K - Keys to make required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties of T optional
 * @template T - The object type
 * @template K - Keys to make optional
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
