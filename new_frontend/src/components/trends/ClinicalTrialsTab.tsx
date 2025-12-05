/**
 * ClinicalTrialsTab Component
 *
 * A production-ready tab component for displaying clinical trials with pagination.
 * Features include loading states, empty states, API integration, and smart pagination.
 *
 * @example
 * ```tsx
 * import ClinicalTrialsTab from '@/components/trends/ClinicalTrialsTab';
 *
 * <ClinicalTrialsTab onTrialClick={(nctId) => handleTrialClick(nctId)} />
 * ```
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Loader2 } from 'lucide-react';
import ClinicalTrialCard from './ClinicalTrialCard';
import type { ClinicalTrial } from '../../types/trends';

// ==================== Types ====================

interface ClinicalTrialsTabProps {
  onTrialClick?: (nctId: string) => void;
}

interface ClinicalTrialsResponse {
  trials: ClinicalTrial[];
  totalPages: number;
  currentPage: number;
  totalTrials?: number;
}

// ==================== Cache Configuration ====================

const CACHE_KEY_PREFIX = 'careguide_clinical_trials_';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  data: ClinicalTrialsResponse;
  timestamp: number;
}

/**
 * Get cached clinical trials data for a specific page
 * 특정 페이지의 캐시된 임상시험 데이터 가져오기
 */
function getCachedTrials(page: number): ClinicalTrialsResponse | null {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}page_${page}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const parsedCache: CachedData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within 24 hours)
    if (now - parsedCache.timestamp < CACHE_DURATION_MS) {
      console.log(`[ClinicalTrials] Using cached data for page ${page}`);
      return parsedCache.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(cacheKey);
    console.log(`[ClinicalTrials] Cache expired for page ${page}`);
    return null;
  } catch (error) {
    console.warn('[ClinicalTrials] Error reading cache:', error);
    return null;
  }
}

/**
 * Save clinical trials data to cache
 * 임상시험 데이터를 캐시에 저장
 */
function setCachedTrials(page: number, data: ClinicalTrialsResponse): void {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}page_${page}`;
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[ClinicalTrials] Cached data for page ${page}`);
  } catch (error) {
    console.warn('[ClinicalTrials] Error saving to cache:', error);
  }
}

// ==================== Main Component ====================

const ClinicalTrialsTab: React.FC<ClinicalTrialsTabProps> = memo(({ onTrialClick }) => {
  // State management
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]);
  const [loadingTrials, setLoadingTrials] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch clinical trials from API with 24-hour caching
  const fetchClinicalTrials = useCallback(async (page: number, forceRefresh = false) => {
    setError(null);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getCachedTrials(page);
      if (cachedData) {
        setClinicalTrials(cachedData.trials || []);
        setTotalPages(cachedData.totalPages || 1);
        setCurrentPage(page);
        return; // Use cached data, skip API call
      }
    }

    setLoadingTrials(true);

    try {
      const response = await fetch('/api/clinical-trials/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          condition: 'kidney',
          page: page,
          page_size: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch clinical trials: ${response.statusText}`);
      }

      const data: ClinicalTrialsResponse = await response.json();

      // Save to cache for 24 hours
      setCachedTrials(page, data);

      setClinicalTrials(data.trials || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching clinical trials:', error);
      setError(error instanceof Error ? error.message : 'Failed to load clinical trials');
      setClinicalTrials([]);
    } finally {
      setLoadingTrials(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchClinicalTrials(1);
  }, [fetchClinicalTrials]);

  // Handle page change with scroll to top
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
        fetchClinicalTrials(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentPage, totalPages, fetchClinicalTrials]
  );

  // Handle trial card click
  const handleTrialClick = useCallback(
    (nctId: string) => {
      if (onTrialClick) {
        onTrialClick(nctId);
      }
    },
    [onTrialClick]
  );

  // Generate page numbers with smart ellipsis logic
  const getPageNumbers = useCallback((): number[] => {
    if (totalPages <= 5) {
      // Show all pages if total is 5 or less
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      // Show first 5 pages
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      // Show last 5 pages
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }

    // Show current page with 2 pages on each side
    return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
  }, [currentPage, totalPages]);

  const pageNumbers = getPageNumbers();

  // ==================== Render ====================

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <h3
        className="font-bold text-[#1F2937] mb-4"
        style={{ fontSize: '18px', fontFamily: 'Noto Sans KR, sans-serif' }}
      >
        임상시험
      </h3>

      {/* Info Banner */}
      <div
        className="rounded-[16px] p-4 mb-6"
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F9FAFB 100%)',
          border: '1px solid #E0F2FE',
        }}
        role="region"
        aria-label="Clinical trials information"
      >
        <p
          className="text-[#272727]"
          style={{ fontSize: '14px', lineHeight: '20px', fontFamily: 'Noto Sans KR, sans-serif' }}
        >
          신장 질환 관련 임상시험 정보를 ClinicalTrials.gov에서 제공받고 있습니다. 각 임상시험을
          클릭하면 AI가 요약한 정보를 확인할 수 있습니다. (최신 업데이트순으로 정렬됨)
        </p>
      </div>

      {/* Loading State */}
      {loadingTrials ? (
        <div
          className="flex flex-col items-center justify-center py-12"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="animate-spin mb-4" size={48} color="#00C9B7" aria-hidden="true" />
          <p
            className="text-[#9CA3AF]"
            style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '14px' }}
          >
            임상시험 정보를 불러오는 중...
          </p>
        </div>
      ) : error ? (
        // Error State
        <div
          className="flex flex-col items-center justify-center py-12"
          role="alert"
          aria-live="assertive"
        >
          <p
            className="text-[#EF4444] mb-2"
            style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '14px' }}
          >
            임상시험 정보를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            onClick={() => fetchClinicalTrials(currentPage, true)}
            className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00B5A5] transition-colors"
            style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '14px' }}
          >
            다시 시도
          </button>
        </div>
      ) : clinicalTrials.length > 0 ? (
        <>
          {/* Clinical Trials List */}
          <div className="grid grid-cols-1 gap-4" role="list" aria-label="Clinical trials list">
            {clinicalTrials.map((trial) => (
              <div key={trial.nctId} role="listitem">
                <ClinicalTrialCard trial={trial} onClick={() => handleTrialClick(trial.nctId)} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 pt-6"
              role="navigation"
              aria-label="Pagination"
            >
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage === 1 ? '#F3F4F6' : '#00C9B7',
                  color: currentPage === 1 ? '#9CA3AF' : 'white',
                  fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                aria-label="Previous page"
                aria-disabled={currentPage === 1}
              >
                이전
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1" role="group" aria-label="Page numbers">
                {pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10 h-10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C9B7] focus:ring-offset-2"
                    style={{
                      backgroundColor: currentPage === pageNum ? '#00C9B7' : '#F3F4F6',
                      color: currentPage === pageNum ? 'white' : '#272727',
                      fontFamily: 'Noto Sans KR, sans-serif',
                      fontSize: '14px',
                      fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                    }}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#00C9B7',
                  color: currentPage === totalPages ? '#9CA3AF' : 'white',
                  fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                aria-label="Next page"
                aria-disabled={currentPage === totalPages}
              >
                다음
              </button>
            </nav>
          )}
        </>
      ) : (
        // Empty State
        <div className="text-center py-12" role="status" aria-live="polite">
          <p
            className="text-[#9CA3AF]"
            style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '14px' }}
          >
            임상시험 정보를 찾을 수 없습니다.
          </p>
        </div>
      )}
    </div>
  );
});

ClinicalTrialsTab.displayName = 'ClinicalTrialsTab';

export default ClinicalTrialsTab;
