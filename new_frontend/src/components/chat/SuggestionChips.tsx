import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Props interface for SuggestionChips component
 */
interface SuggestionChipsProps {
  /** Array of suggestion strings to display */
  suggestions: string[];
  /** Callback function when a suggestion is clicked */
  onSuggestionClick: (suggestion: string) => void;
  /** Optional flag to disable all suggestion buttons */
  isDisabled?: boolean;
}

/**
 * SuggestionChips Component
 *
 * A horizontally scrollable container for displaying suggestion buttons.
 * Features:
 * - Auto-detects when scrolling is needed
 * - Shows left/right arrow buttons only when content overflows
 * - Smooth scroll behavior (200px per click)
 * - Fully accessible with keyboard navigation
 * - Responsive and mobile-friendly
 *
 * Usage Example:
 * ```tsx
 * <SuggestionChips
 *   suggestions={['만성 신장병이란?', '투석 방법 알려줘', '식단 추천해줘']}
 *   onSuggestionClick={(suggestion) => console.log(suggestion)}
 *   isDisabled={false}
 * />
 * ```
 */
export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSuggestionClick,
  isDisabled = false,
}) => {
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  /**
   * Check if the suggestions container needs scroll buttons
   * Compares scrollWidth (total content width) vs clientWidth (visible width)
   */
  useEffect(() => {
    const checkScroll = () => {
      if (suggestionsRef.current) {
        const { scrollWidth, clientWidth } = suggestionsRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };

    // Initial check
    checkScroll();

    // Recheck on window resize
    window.addEventListener('resize', checkScroll);

    return () => window.removeEventListener('resize', checkScroll);
  }, [suggestions]); // Re-run when suggestions change

  /**
   * Scroll the suggestions container left or right
   * @param direction - Direction to scroll ('left' or 'right')
   */
  const scrollSuggestions = (direction: 'left' | 'right') => {
    if (suggestionsRef.current) {
      const scrollAmount = 200; // px to scroll
      suggestionsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  /**
   * Handle suggestion button click
   * @param suggestion - The suggestion text that was clicked
   */
  const handleSuggestionClick = (suggestion: string) => {
    if (!isDisabled) {
      onSuggestionClick(suggestion);
    }
  };

  // If no suggestions, render nothing
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="relative mt-4" role="region" aria-label="Suggestion chips">
      {/* Left scroll button */}
      {showScrollButtons && (
        <button
          onClick={() => scrollSuggestions('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 border border-gray-100 text-gray-500 hover:text-primary"
          disabled={isDisabled}
          aria-label="Scroll suggestions left"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* Scrollable suggestions container */}
      <div
        ref={suggestionsRef}
        className="flex gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="list"
      >
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(suggestion)}
            className={`
              bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-700 
              hover:bg-primary/5 hover:border-primary/30 hover:text-primary hover:shadow-sm hover:-translate-y-0.5
              whitespace-nowrap text-left flex-shrink-0 transition-all duration-300
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            disabled={isDisabled}
            role="listitem"
            aria-label={`Suggestion: ${suggestion}`}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      {showScrollButtons && (
        <button
          onClick={() => scrollSuggestions('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 border border-gray-100 text-gray-500 hover:text-primary"
          disabled={isDisabled}
          aria-label="Scroll suggestions right"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

