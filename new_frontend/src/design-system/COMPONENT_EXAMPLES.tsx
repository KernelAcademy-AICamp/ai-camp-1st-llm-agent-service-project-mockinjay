/**
 * CareGuide Design System - Component Examples
 *
 * Healthcare-focused component patterns with accessibility built-in.
 * All examples follow WCAG 2.2 Level AA standards.
 */

import {
  Heart,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  Phone,
  Trash2,
  Settings,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// ============================================================================
// BUTTONS
// ============================================================================

/**
 * Primary Button - Main CTAs
 * Use for primary actions like "Save", "Submit", "Continue"
 */
export const PrimaryButton = () => (
  <button
    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    type="button"
  >
    저장하기
  </button>
);

/**
 * Secondary Button - Alternative actions
 * Use for secondary actions like "Cancel", "Back"
 */
export const SecondaryButton = () => (
  <button
    className="px-6 py-3 bg-white border border-primary-600 text-primary-700 hover:bg-primary-50 font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    type="button"
  >
    취소
  </button>
);

/**
 * Ghost Button - Tertiary actions
 * Use for less prominent actions like "Close", "Skip"
 */
export const GhostButton = () => (
  <button
    className="px-6 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
    type="button"
  >
    닫기
  </button>
);

/**
 * Danger Button - Destructive actions
 * Use for dangerous actions like "Delete", "Remove"
 */
export const DangerButton = () => (
  <button
    className="px-6 py-3 bg-error-600 hover:bg-error-700 active:bg-error-800 text-white font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2"
    type="button"
  >
    <Trash2 size={20} className="inline-block mr-2" aria-hidden="true" />
    삭제
  </button>
);

/**
 * Icon Button - 44x44px touch target (WCAG AAA)
 * Always include aria-label for screen readers
 */
export const IconButton = () => (
  <button
    className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    aria-label="설정 열기"
    type="button"
  >
    <Settings size={20} />
  </button>
);

/**
 * Loading Button - Indicates async action in progress
 */
export const LoadingButton = () => (
  <button
    disabled
    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl opacity-60 cursor-not-allowed"
    aria-busy="true"
    type="button"
  >
    <Loader2 className="animate-spin inline-block mr-2" size={20} aria-hidden="true" />
    <span className="sr-only">저장 중...</span>
    저장 중
  </button>
);

// ============================================================================
// FORM INPUTS
// ============================================================================

/**
 * Text Input - Standard input field
 * Includes label, input, and help text
 */
export const TextInput = () => (
  <div className="space-y-2">
    <label
      htmlFor="username"
      className="block text-sm font-medium text-gray-700"
    >
      사용자 이름
    </label>

    <input
      id="username"
      type="text"
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
      placeholder="이름을 입력하세요"
      aria-describedby="username-help"
    />

    <p id="username-help" className="text-xs text-gray-500">
      2-20자 사이로 입력해주세요
    </p>
  </div>
);

/**
 * Health Metric Input - For medical measurements
 * Includes label, unit, help text with normal range
 */
export const HealthMetricInput = () => (
  <div className="space-y-2">
    <label
      htmlFor="blood-pressure"
      className="block text-sm font-medium text-gray-700"
    >
      혈압 (mmHg)
      <span className="text-error-600 ml-1" aria-label="필수">
        *
      </span>
    </label>

    <input
      id="blood-pressure"
      type="number"
      required
      aria-required="true"
      min="0"
      max="300"
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
      placeholder="120"
      aria-describedby="blood-pressure-help"
    />

    <p id="blood-pressure-help" className="text-xs text-gray-500" role="note">
      정상 범위: 90-120 mmHg
    </p>
  </div>
);

/**
 * Input with Error - Shows validation error
 */
export const InputWithError = () => (
  <div className="space-y-2">
    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
      이메일
    </label>

    <input
      id="email"
      type="email"
      aria-invalid="true"
      aria-describedby="email-error"
      className="w-full px-4 py-3 rounded-xl border border-error-600 focus:border-error-700 focus:ring-2 focus:ring-error-500/20 outline-none transition-all"
      value="invalid-email"
    />

    <p id="email-error" role="alert" className="flex items-center gap-2 text-sm text-error-600">
      <AlertCircle size={16} aria-hidden="true" />
      유효한 이메일 주소를 입력하세요
    </p>
  </div>
);

// ============================================================================
// CARDS
// ============================================================================

/**
 * Health Metric Card - Display patient vital signs
 */
export const HealthMetricCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm text-gray-600">혈압</p>
        <p className="text-2xl font-bold text-gray-800 mt-1" aria-label="혈압 120/80 mmHg">
          120/80
        </p>
      </div>
      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
        <Heart className="text-primary-600" size={24} aria-hidden="true" />
      </div>
    </div>

    <div className="flex items-center gap-2">
      <CheckCircle className="text-success-600" size={16} aria-hidden="true" />
      <span className="text-sm font-medium text-success-700">정상 범위</span>
    </div>

    <div className="mt-3 text-xs text-gray-500" role="note">
      정상 범위: 90-120 / 60-80 mmHg
    </div>
  </div>
);

/**
 * Interactive Card - Clickable card with hover state
 */
export const InteractiveCard = () => (
  <button
    className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-6 text-left focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    type="button"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">식단 기록</h4>
        <p className="text-sm text-gray-600 mt-1">오늘의 식사를 기록하세요</p>
      </div>
      <ChevronRight className="text-gray-400 shrink-0 ml-4" size={20} aria-hidden="true" />
    </div>
  </button>
);

/**
 * Warning Card - Out-of-range health metric
 */
export const WarningCard = () => (
  <div className="bg-warning-50 border border-warning-500 rounded-xl p-4" role="alert">
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-warning-600 shrink-0 mt-0.5" size={20} aria-hidden="true" />
      <div className="flex-1">
        <h4 className="font-semibold text-warning-900">혈압 주의 필요</h4>
        <p className="text-sm text-warning-800 mt-1">
          혈압이 정상 범위를 초과했습니다. 의료진과 상담을 권장합니다.
        </p>
        <p className="text-xs text-warning-700 mt-2">
          측정값: 145/95 mmHg (정상: 90-120 / 60-80)
        </p>
      </div>
    </div>
  </div>
);

// ============================================================================
// ALERTS & NOTIFICATIONS
// ============================================================================

/**
 * Success Alert - Action completed successfully
 */
export const SuccessAlert = () => (
  <div
    role="status"
    aria-live="polite"
    className="bg-success-50 border border-success-500 rounded-lg p-4"
  >
    <div className="flex items-center gap-3">
      <CheckCircle className="text-success-600 shrink-0" size={20} aria-hidden="true" />
      <p className="font-medium text-success-900">건강 기록이 저장되었습니다</p>
    </div>
  </div>
);

/**
 * Error Alert - Action failed
 */
export const ErrorAlert = () => (
  <div role="alert" className="bg-error-50 border border-error-500 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="text-error-600 shrink-0 mt-0.5" size={20} aria-hidden="true" />
      <div className="flex-1">
        <h4 className="font-semibold text-error-900">오류가 발생했습니다</h4>
        <p className="text-sm text-error-800 mt-1">
          네트워크 연결을 확인하고 다시 시도해주세요.
        </p>
      </div>
    </div>
  </div>
);

/**
 * Info Alert - Informational message
 */
export const InfoAlert = () => (
  <div className="bg-info-50 border-l-4 border-info-600 rounded-r-lg p-4">
    <div className="flex items-start gap-3">
      <Info className="text-info-600 shrink-0 mt-0.5" size={20} aria-hidden="true" />
      <div>
        <h4 className="font-semibold text-info-900">알림</h4>
        <p className="text-sm text-info-800 mt-1">
          시스템 점검이 예정되어 있습니다. 2025년 1월 15일 오전 2시-4시
        </p>
      </div>
    </div>
  </div>
);

/**
 * Medical Disclaimer - Required for health information
 */
export const MedicalDisclaimer = () => (
  <div className="bg-amber-50 border-t-2 border-amber-400 p-4 rounded-b-lg" role="alert">
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} aria-hidden="true" />
      <div className="flex-1">
        <h4 className="font-semibold text-amber-900 text-sm">의학적 면책 조항</h4>
        <p className="text-sm text-amber-900 mt-1 leading-relaxed">
          본 정보는 의학적 진단이 아니며 참고용으로만 제공됩니다.
          건강 관련 증상이 있는 경우 반드시 의료 전문가와 상담하세요.
        </p>
      </div>
    </div>
  </div>
);

// ============================================================================
// HEALTHCARE-SPECIFIC PATTERNS
// ============================================================================

/**
 * Dietary Warning - Food restriction information
 */
export const DietaryWarning = () => (
  <div className="border-l-4 border-warning-600 bg-warning-50 p-4 rounded-r-lg">
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-warning-600 shrink-0 mt-0.5" size={20} aria-hidden="true" />
      <div>
        <h4 className="font-semibold text-warning-900">칼륨 제한 식품</h4>
        <p className="text-sm text-warning-800 mt-1">
          바나나, 감자, 토마토는 칼륨 함량이 높아 섭취를 제한해야 합니다.
        </p>
        <div className="mt-3 p-2 bg-warning-100 rounded text-xs text-warning-900">
          <span className="font-medium">권장 섭취량:</span> 하루 2000mg 이하
        </div>
      </div>
    </div>
  </div>
);

/**
 * Emergency Contact Card - Critical contact information
 */
export const EmergencyContactCard = () => (
  <div className="bg-error-50 border border-error-500 rounded-xl p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
        <Phone className="text-error-600" size={24} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-error-900">응급 연락처</h3>
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
        <span className="text-sm text-gray-700">응급실</span>
        <span className="text-sm font-bold text-gray-900">119</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
        <span className="text-sm text-gray-700">주치의</span>
        <span className="text-sm font-bold text-gray-900">02-1234-5678</span>
      </div>
    </div>

    <button
      className="w-full px-6 py-3 bg-error-600 hover:bg-error-700 active:bg-error-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2"
      type="button"
    >
      <Phone size={20} aria-hidden="true" />
      응급 전화 걸기
    </button>
  </div>
);

/**
 * Medication Reminder - Daily medication tracking
 */
export const MedicationReminder = () => (
  <div className="bg-info-50 border border-info-500 rounded-xl p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-info-100 rounded-full flex items-center justify-center">
        <Info className="text-info-600" size={20} aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-info-900">복약 알림</h4>
        <p className="text-xs text-info-700 mt-0.5">오전 8시</p>
      </div>
      <span className="text-xs font-medium text-info-700 bg-info-100 px-2 py-1 rounded-full">
        오늘
      </span>
    </div>

    <div className="mb-3">
      <p className="text-sm font-medium text-info-900">혈압약</p>
      <p className="text-xs text-info-800 mt-1">1정, 식후 복용</p>
    </div>

    <button
      className="w-full px-4 py-2 bg-info-600 hover:bg-info-700 text-white text-sm font-medium rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2"
      type="button"
    >
      복용 완료 표시
    </button>
  </div>
);

/**
 * CKD Stage Badge - Patient's kidney disease stage
 */
export const CKDStageBadge = () => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-100 border border-primary-300">
    <div className="w-2 h-2 bg-primary-600 rounded-full" aria-hidden="true"></div>
    <span className="text-sm font-medium text-primary-800">1단계 CKD</span>
  </div>
);

// ============================================================================
// BADGES & STATUS INDICATORS
// ============================================================================

/**
 * Status Badges - Various status indicators
 */
export const StatusBadges = () => (
  <div className="flex flex-wrap gap-2">
    {/* Success */}
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
      완료
    </span>

    {/* In Progress */}
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-info-100 text-info-700">
      진행중
    </span>

    {/* Pending */}
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
      대기중
    </span>

    {/* Cancelled */}
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
      취소됨
    </span>

    {/* Normal Range */}
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
      <CheckCircle size={12} aria-hidden="true" />
      정상 범위
    </span>

    {/* Attention Needed */}
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
      <AlertTriangle size={12} aria-hidden="true" />
      주의 필요
    </span>
  </div>
);

// ============================================================================
// LOADING STATES
// ============================================================================

/**
 * Skeleton Card - Loading placeholder
 */
export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

/**
 * Loading Spinner - Centered loading indicator
 */
export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12" role="status">
    <Loader2 className="animate-spin text-primary-600 mb-3" size={32} aria-hidden="true" />
    <span className="text-sm text-gray-600">로딩 중...</span>
    <span className="sr-only">콘텐츠를 불러오는 중입니다</span>
  </div>
);

// ============================================================================
// EMPTY STATES
// ============================================================================

/**
 * Empty State - No data available
 */
export const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Heart className="text-gray-400" size={32} aria-hidden="true" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">건강 기록이 없습니다</h3>
    <p className="text-sm text-gray-600 mb-6 max-w-sm">
      첫 건강 기록을 추가하여 관리를 시작하세요.
    </p>
    <button
      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      type="button"
    >
      기록 추가하기
    </button>
  </div>
);

/**
 * Complete component showcase
 */
export const ComponentShowcase = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <PrimaryButton />
          <SecondaryButton />
          <GhostButton />
          <DangerButton />
          <IconButton />
          <LoadingButton />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Form Inputs</h2>
        <div className="space-y-6 max-w-md">
          <TextInput />
          <HealthMetricInput />
          <InputWithError />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Cards</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <HealthMetricCard />
          <InteractiveCard />
        </div>
        <div className="mt-6">
          <WarningCard />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Alerts</h2>
        <div className="space-y-4">
          <SuccessAlert />
          <ErrorAlert />
          <InfoAlert />
          <MedicalDisclaimer />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Healthcare Patterns</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <DietaryWarning />
          <EmergencyContactCard />
          <MedicationReminder />
          <div>
            <CKDStageBadge />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Status Badges</h2>
        <StatusBadges />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Loading States</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard />
          <LoadingSpinner />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Empty State</h2>
        <EmptyState />
      </section>
    </div>
  );
};

export default ComponentShowcase;
