import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { TermsAgreementProps, TermItemProps } from './types';
import { CustomCheckbox } from './TermsCheckbox';

/**
 * TermItem Component
 * Individual term accordion item with checkbox
 *
 * Features:
 * - Expandable/collapsible content
 * - Scrollable content area
 * - Keyboard accessible
 * - Screen reader support
 */
const TermItem: React.FC<TermItemProps> = ({
  title,
  content,
  checked,
  onChange,
  expanded,
  onToggle,
  required = false,
}) => {
  return (
    <div
      className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-all hover:shadow-sm"
      role="region"
      aria-labelledby={`term-title-${title}`}
    >
      <div className="p-4 flex items-center justify-between gap-3">
        <label
          className="flex items-center gap-3 cursor-pointer flex-1"
          id={`term-title-${title}`}
        >
          <CustomCheckbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-700">
            {title}
            {required && (
              <span className="text-red-500 ml-1" aria-label="필수 항목">
                *
              </span>
            )}
          </span>
        </label>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors touch-target"
          aria-expanded={expanded}
          aria-label={expanded ? '내용 숨기기' : '내용 보기'}
          type="button"
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 animate-slide-down">
          <div
            className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 leading-relaxed whitespace-pre-wrap h-32 overflow-y-auto custom-scrollbar"
            role="document"
            tabIndex={0}
            aria-label={`${title} 내용`}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * TermsAgreement Component
 * Main terms agreement component with 4-step accordion flow
 *
 * Features:
 * - All/individual term selection
 * - Required/optional term distinction
 * - Expandable term content
 * - Validation before proceeding
 * - Full accessibility support
 *
 * Usage:
 * ```tsx
 * <TermsAgreement
 *   termsData={termsData}
 *   agreements={agreements}
 *   onAgreementChange={handleAgreementChange}
 *   onAllAgreementChange={handleAllAgreementChange}
 *   canProceed={canProceed}
 *   onNext={handleNext}
 * />
 * ```
 */
export const TermsAgreement: React.FC<TermsAgreementProps> = ({
  termsData,
  agreements,
  onAgreementChange,
  onAllAgreementChange,
  canProceed,
  onNext,
}) => {
  const [expandedTerms, setExpandedTerms] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleTermContent = (key: string) => {
    setExpandedTerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fade-in" role="form" aria-label="약관 동의">
      {termsData ? (
        <div className="space-y-4">
          {/* All Agreement Checkbox */}
          <div
            className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
            role="group"
            aria-labelledby="all-agreement-label"
          >
            <label
              className="flex items-center gap-3 cursor-pointer"
              id="all-agreement-label"
            >
              <CustomCheckbox
                checked={agreements.all}
                onChange={(e) => onAllAgreementChange(e.target.checked)}
              />
              <span className="font-bold text-gray-900">
                서비스 전체 약관에 동의합니다
              </span>
            </label>
          </div>

          {/* Individual Terms */}
          <div className="space-y-3" role="list" aria-label="개별 약관 목록">
            <TermItem
              title={`(필수) ${termsData.service_terms.title}`}
              content={termsData.service_terms.content}
              checked={agreements.service}
              onChange={(checked) => onAgreementChange('service', checked)}
              expanded={expandedTerms.service}
              onToggle={() => toggleTermContent('service')}
              required={true}
            />
            <TermItem
              title={`(필수) ${termsData.privacy_required.title}`}
              content={termsData.privacy_required.content}
              checked={agreements.privacyRequired}
              onChange={(checked) =>
                onAgreementChange('privacyRequired', checked)
              }
              expanded={expandedTerms.privacyRequired}
              onToggle={() => toggleTermContent('privacyRequired')}
              required={true}
            />
            <TermItem
              title={`(선택) ${termsData.privacy_optional.title}`}
              content={termsData.privacy_optional.content}
              checked={agreements.privacyOptional}
              onChange={(checked) =>
                onAgreementChange('privacyOptional', checked)
              }
              expanded={expandedTerms.privacyOptional}
              onToggle={() => toggleTermContent('privacyOptional')}
              required={false}
            />
            <TermItem
              title={`(선택) ${termsData.marketing.title}`}
              content={termsData.marketing.content}
              checked={agreements.marketing}
              onChange={(checked) => onAgreementChange('marketing', checked)}
              expanded={expandedTerms.marketing}
              onToggle={() => toggleTermContent('marketing')}
              required={false}
            />
          </div>

          {/* Validation Notice */}
          {!canProceed && (
            <div
              className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm animate-slide-down"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>필수 약관에 모두 동의해야 다음 단계로 진행할 수 있습니다.</p>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="btn-primary w-full mt-4 touch-target"
            aria-disabled={!canProceed}
          >
            다음 단계로
          </button>
        </div>
      ) : (
        <div
          className="flex justify-center py-12"
          role="status"
          aria-label="약관 로딩 중"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="sr-only">약관을 불러오는 중입니다...</span>
        </div>
      )}
    </div>
  );
};
