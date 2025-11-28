/**
 * Common Components Index
 *
 * Centralized export for reusable UI components.
 * Improves import consistency and discoverability.
 */

// Feedback & Guidance
export { Tooltip } from './Tooltip';
export { MedicalTooltip, MEDICAL_TERMS } from './MedicalTooltip';

// Dialogs & Modals
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogVariant } from './ConfirmDialog';

// Onboarding & Education
export { OnboardingTour, shouldShowTour } from './OnboardingTour';
export type { TourStep } from './OnboardingTour';

// Empty States
export {
  EmptyState,
  NoChatMessagesEmpty,
  NoMealLogsEmpty,
  NoCommunityPostsEmpty,
  NoSearchResultsEmpty,
  ErrorStateEmpty,
} from './EmptyState';
export type { EmptyStateVariant } from './EmptyState';
