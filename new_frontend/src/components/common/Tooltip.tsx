/**
 * Tooltip Component
 *
 * Reusable tooltip component for displaying contextual help and educational content.
 * Essential for CKD patient education about medical terms and biomarkers.
 *
 * Features:
 * - Hover and focus triggers
 * - Keyboard accessible (ESC to close)
 * - Multiple positions (top, bottom, left, right)
 * - Mobile-friendly (tap to toggle)
 * - ARIA compliant
 */

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  /** Content to display in tooltip */
  content: string | React.ReactNode;
  /** Position of tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Custom trigger element (default: info icon) */
  children?: React.ReactNode;
  /** Additional CSS classes for styling */
  className?: string;
  /** Max width of tooltip */
  maxWidth?: number;
  /** ARIA label for trigger button */
  ariaLabel?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
  className = '',
  maxWidth = 300,
  ariaLabel = '도움말',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click outside to close on mobile
  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, isMobile]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible]);

  const handleMouseEnter = () => {
    if (!isMobile) setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile) setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMobile) {
      setIsVisible(!isVisible);
    }
  };

  const handleFocus = () => {
    if (!isMobile) setIsVisible(true);
  };

  const handleBlur = () => {
    if (!isMobile) setIsVisible(false);
  };

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-t-8 border-x-transparent border-x-8',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-b-8 border-x-transparent border-x-8',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-l-8 border-y-transparent border-y-8',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-r-8 border-y-transparent border-y-8',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        className="inline-flex items-center justify-center w-4 h-4 text-gray-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full transition-colors"
        aria-label={ariaLabel}
        aria-describedby={isVisible ? 'tooltip-content' : undefined}
      >
        {children || <HelpCircle size={16} />}
      </button>

      {/* Tooltip Content */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip-content"
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in zoom-in-95 duration-200`}
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 ${arrowClasses[position]}`}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3 leading-relaxed">
            {typeof content === 'string' ? (
              <p className="m-0">{content}</p>
            ) : (
              content
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Specialized Tooltip for Medical Terms
 * Pre-configured for CKD biomarker education
 */
export const MedicalTooltip: React.FC<{
  term: string;
  definition: string;
  normalRange?: string;
  whyItMatters?: string;
}> = ({ term, definition, normalRange, whyItMatters }) => {
  const content = (
    <div className="space-y-2">
      <div>
        <strong className="text-primary-300">{term}</strong>
        <p className="mt-1 text-xs">{definition}</p>
      </div>
      {normalRange && (
        <div>
          <strong className="text-green-300">정상 범위:</strong>
          <p className="mt-1 text-xs">{normalRange}</p>
        </div>
      )}
      {whyItMatters && (
        <div>
          <strong className="text-amber-300">왜 중요한가요?</strong>
          <p className="mt-1 text-xs">{whyItMatters}</p>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      content={content}
      maxWidth={320}
      ariaLabel={`${term}에 대한 설명`}
    />
  );
};

/**
 * Usage Examples:
 *
 * // Basic tooltip
 * <Tooltip content="이 기능은 식단 로그를 기록합니다." />
 *
 * // Medical term tooltip
 * <MedicalTooltip
 *   term="크레아티닌 (Creatinine)"
 *   definition="근육 활동의 부산물로, 신장 기능을 나타내는 지표입니다."
 *   normalRange="0.7~1.3 mg/dL (성인 남성)"
 *   whyItMatters="크레아티닌이 높으면 신장이 노폐물을 제대로 걸러내지 못한다는 신호입니다."
 * />
 *
 * // Custom trigger
 * <Tooltip content="도움말 내용">
 *   <span className="text-blue-500">?</span>
 * </Tooltip>
 */
