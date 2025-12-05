/**
 * ClinicalTrialCard Component
 *
 * A production-ready card component for displaying clinical trial information
 * in the TrendsPage. Features status badges, condition/intervention tags,
 * and accessible keyboard navigation.
 *
 * @example
 * ```tsx
 * import ClinicalTrialCard from '@/components/trends/ClinicalTrialCard';
 *
 * const trial = {
 *   nctId: 'NCT12345678',
 *   title: 'Study of Treatment for CKD',
 *   status: 'Recruiting',
 *   phase: 'Phase 3',
 *   conditions: ['Chronic Kidney Disease', 'Diabetes'],
 *   interventions: ['Drug: Experimental Treatment'],
 *   startDate: '2024-01-15',
 *   completionDate: '2026-12-31',
 *   sponsor: 'University Medical Center',
 *   briefSummary: 'This study evaluates...'
 * };
 *
 * <ClinicalTrialCard
 *   trial={trial}
 *   onClick={() => handleTrialClick(trial.nctId)}
 * />
 * ```
 */

import React, { memo } from 'react';
import { Calendar, Building2, FileText, ChevronRight } from 'lucide-react';

// ==================== Types ====================

export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  startDate?: string;
  completionDate?: string;
  sponsor?: string;
  briefSummary?: string;
}

export interface ClinicalTrialCardProps {
  trial: ClinicalTrial;
  onClick: () => void;
}

// ==================== Constants ====================

const STATUS_COLORS = {
  Recruiting: {
    bg: '#ECFDF5',
    text: '#10B981',
    border: '#A7F3D0',
  },
  Completed: {
    bg: '#EFF6FF',
    text: '#3B82F6',
    border: '#BFDBFE',
  },
  Active: {
    bg: '#F3E8FF',
    text: '#8B5CF6',
    border: '#DDD6FE',
  },
  'Active, not recruiting': {
    bg: '#F3E8FF',
    text: '#8B5CF6',
    border: '#DDD6FE',
  },
  Terminated: {
    bg: '#FEF2F2',
    text: '#EF4444',
    border: '#FECACA',
  },
  Withdrawn: {
    bg: '#FEF2F2',
    text: '#EF4444',
    border: '#FECACA',
  },
  Suspended: {
    bg: '#FEF3C7',
    text: '#F59E0B',
    border: '#FDE68A',
  },
  default: {
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#E5E7EB',
  },
} as const;

// ==================== Helper Functions ====================

/**
 * Get status color configuration based on trial status
 */
const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
};

/**
 * Format date string to locale format
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Truncate text with ellipsis
 */
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// ==================== Component ====================

const ClinicalTrialCard: React.FC<ClinicalTrialCardProps> = memo(({ trial, onClick }) => {
  const statusColor = getStatusColor(trial.status);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`Clinical trial ${trial.nctId}: ${trial.title}`}
      className="bg-white rounded-[16px] p-5 md:p-6 cursor-pointer transition-all duration-200
        hover:shadow-lg border border-gray-100 hover:border-[#00C9B7]
        focus:outline-none focus:ring-2 focus:ring-[#00C9B7] focus:ring-offset-2
        group"
      style={{
        boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header: NCT ID and Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
                border: `1px solid ${statusColor.border}`,
              }}
              aria-label={`Status: ${trial.status}`}
            >
              {trial.status}
            </span>
            {trial.phase && (
              <span
                className="text-xs font-medium text-gray-600 px-2.5 py-1 rounded-full bg-gray-100"
                aria-label={`Phase: ${trial.phase}`}
              >
                {trial.phase}
              </span>
            )}
          </div>
          <span
            className="text-sm font-mono text-[#00C9B7] font-semibold"
            aria-label={`NCT ID: ${trial.nctId}`}
          >
            {trial.nctId}
          </span>
        </div>

        <ChevronRight
          size={20}
          className="text-gray-400 group-hover:text-[#00C9B7] transition-colors flex-shrink-0 mt-1"
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h4
        className="font-bold text-[#1F2937] mb-3 line-clamp-2 leading-tight"
        style={{
          fontSize: '16px',
          lineHeight: '24px',
          fontFamily: 'Noto Sans KR, sans-serif',
        }}
        title={trial.title}
      >
        {trial.title}
      </h4>

      {/* Brief Summary */}
      {trial.briefSummary && (
        <p
          className="text-[#272727] text-sm leading-relaxed mb-4 line-clamp-2"
          style={{
            fontSize: '14px',
            lineHeight: '20px',
            fontFamily: 'Noto Sans KR, sans-serif',
          }}
          title={trial.briefSummary}
        >
          {trial.briefSummary}
        </p>
      )}

      {/* Conditions Tags */}
      {trial.conditions && trial.conditions.length > 0 && (
        <div className="mb-3" role="region" aria-label="Conditions">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText size={14} className="text-gray-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Conditions
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trial.conditions.slice(0, 3).map((condition, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full
                  border border-blue-200"
                title={condition}
              >
                {truncateText(condition, 30)}
              </span>
            ))}
            {trial.conditions.length > 3 && (
              <span
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                aria-label={`${trial.conditions.length - 3} more conditions`}
              >
                +{trial.conditions.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interventions Tags */}
      {trial.interventions && trial.interventions.length > 0 && (
        <div className="mb-4" role="region" aria-label="Interventions">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText size={14} className="text-gray-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Interventions
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trial.interventions.slice(0, 3).map((intervention, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full
                  border border-purple-200"
                title={intervention}
              >
                {truncateText(intervention, 30)}
              </span>
            ))}
            {trial.interventions.length > 3 && (
              <span
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                aria-label={`${trial.interventions.length - 3} more interventions`}
              >
                +{trial.interventions.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Sponsor and Dates */}
      <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
        {trial.sponsor && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
            <span className="truncate" title={trial.sponsor}>
              {trial.sponsor}
            </span>
          </div>
        )}

        {(trial.startDate || trial.completionDate) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">
              {trial.startDate && (
                <span>
                  <span className="font-medium">Start:</span> {formatDate(trial.startDate)}
                </span>
              )}
              {trial.startDate && trial.completionDate && <span className="mx-1.5">|</span>}
              {trial.completionDate && (
                <span>
                  <span className="font-medium">End:</span> {formatDate(trial.completionDate)}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ClinicalTrialCard.displayName = 'ClinicalTrialCard';

export default ClinicalTrialCard;
