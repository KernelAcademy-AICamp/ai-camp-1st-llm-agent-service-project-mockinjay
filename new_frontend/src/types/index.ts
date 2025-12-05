// Re-export all types
// 기존 타입들 / Existing types
export * from './intent';
export * from './careguide-ia';
export * from './community';

// Chat types (UserProfile은 여기서만 export)
// Chat types (UserProfile exported only from here)
export * from './chat';

// MyPage types (UserProfile 제외 - chat.ts와 충돌)
// MyPage types (excluding UserProfile - conflicts with chat.ts)
export {
  type HealthProfile,
  type HealthProfileUpdateRequest,
  type UserPreferences,
  type BookmarkedPaper,
  type UserNotification,
  type ProfileUpdateRequest,
  type PreferencesUpdateRequest,
  type UserLevelData,
  type Badge,
  type PointsData,
  type PointsHistoryItem,
  type PointsHistoryFilters,
  type NotificationSettings,
  type NotificationSettingsUpdateRequest,
  HEALTH_CONDITIONS,
  DIETARY_RESTRICTIONS,
} from './mypage';

// Diet Care 타입 시스템 (권장 사용) / Diet Care type system (recommended)
// diet-care.ts의 타입이 더 완전하므로 이것을 기본으로 사용
export * from './diet-care';
export * from './diet-care.guards';
export * from './diet-care.constants';

// diet-care.utils에서 ImageUploadState 제외 (diet-care.ts와 충돌)
// Exclude ImageUploadState from diet-care.utils (conflicts with diet-care.ts)
export {
  type AsyncState,
  type AsyncData,
  type AsyncError,
  type FormField,
  type FormState,
  type AnalysisStateMachine,
  type PaginationState,
  type SortConfig,
  type FilterConfig,
  type DebouncedValue,
  type Result,
  type Option,
  Ok,
  Err,
  Some,
  None,
  type DeepReadonly,
  type DeepPartial,
  type KeysOfType,
  type RequireAtLeastOne,
  type RequireExactlyOne,
  type ValidationResult,
  type RetryConfig,
  type CacheEntry,
  type TimeRange,
  type NotificationConfig,
  type ArrayElement,
  type RequireKeys,
  type PartialKeys,
} from './diet-care.utils';

// diet.ts는 별도 네임스페이스로 사용 시 직접 import
// Import diet.ts directly when using as separate namespace
// Example: import { MealType as DietMealType } from '@/types/diet';
