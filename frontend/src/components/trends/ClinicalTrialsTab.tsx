import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { ClinicalTrialCard } from '../ClinicalTrialCard';
import { fetchClinicalTrials } from '../../services/trendsApi';
import type { ClinicalTrial, ClinicalTrialsResponse } from '../../types/trends';

interface ClinicalTrialsTabProps {
  condition?: string;
}

const DEFAULT_CONDITION = 'kidney disease';
const DEFAULT_PAGE_SIZE = 10;
const CACHE_PREFIX = 'clinical-trials-tab';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const isBrowser = typeof window !== 'undefined';

type CachedTrialsPayload = {
  timestamp: number;
  value: ClinicalTrialsResponse;
};

const sanitizeCondition = (value?: string): string => {
  const trimmed = (value ?? '').trim();
  return trimmed.length ? trimmed : DEFAULT_CONDITION;
};

const slugifyCondition = (value: string): string => {
  return sanitizeCondition(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
};

const buildCacheKey = (condition: string, page: number, pageSize: number): string => {
  return `${CACHE_PREFIX}:${slugifyCondition(condition)}:p${page}:s${pageSize}`;
};

const readCachedTrials = (condition: string, page: number, pageSize: number): ClinicalTrialsResponse | null => {
  if (!isBrowser) {
    return null;
  }

  const cacheKey = buildCacheKey(condition, page, pageSize);

  try {
    const cachedValue = window.localStorage.getItem(cacheKey);
    if (!cachedValue) {
      return null;
    }

    const cached = JSON.parse(cachedValue) as CachedTrialsPayload;
    if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
      window.localStorage.removeItem(cacheKey);
      return null;
    }

    return cached.value;
  } catch {
    return null;
  }
};

const writeCachedTrials = (
  condition: string,
  page: number,
  pageSize: number,
  response: ClinicalTrialsResponse
): void => {
  if (!isBrowser) {
    return;
  }

  const cacheKey = buildCacheKey(condition, page, pageSize);
  const payload: CachedTrialsPayload = {
    timestamp: Date.now(),
    value: response,
  };

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // Ignore cache write failures (e.g., quota exceeded)
  }
};

const ClinicalTrialsTab: React.FC<ClinicalTrialsTabProps> = ({ condition = DEFAULT_CONDITION }) => {
  const initialCondition = sanitizeCondition(condition);
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(initialCondition);
  const [activeCondition, setActiveCondition] = useState(initialCondition);
  const pageSizeRef = useRef(pageSize);

  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / (pageSize || DEFAULT_PAGE_SIZE))),
    [totalCount, pageSize]
  );

  const loadTrials = useCallback(
    async (conditionValue: string, targetPage: number, size: number, options: { force?: boolean } = {}) => {
      const normalizedCondition = sanitizeCondition(conditionValue);
      const normalizedSize = size > 0 ? size : DEFAULT_PAGE_SIZE;

      if (!options.force) {
        const cachedResponse = readCachedTrials(normalizedCondition, targetPage, normalizedSize);
        if (cachedResponse) {
          setTrials(cachedResponse.trials ?? []);
          setTotalCount(cachedResponse.totalCount ?? cachedResponse.trials.length);
          setPage(cachedResponse.page ?? targetPage);
          setPageSize(cachedResponse.pageSize ?? normalizedSize);
          setError(null);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetchClinicalTrials(normalizedCondition, targetPage, normalizedSize);
        const nextTrials = response.trials ?? [];
        const nextTotal = typeof response.totalCount === 'number' ? response.totalCount : nextTrials.length;
        const nextPage = response.page ?? targetPage;
        const nextPageSize = response.pageSize ?? normalizedSize;

        setTrials(nextTrials);
        setTotalCount(nextTotal);
        setPage(nextPage);
        setPageSize(nextPageSize);

        writeCachedTrials(normalizedCondition, nextPage, nextPageSize, response);
      } catch (fetchError) {
        setTrials([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load clinical trials.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const normalized = sanitizeCondition(condition);
    setSearchInput(normalized);
    setActiveCondition(normalized);
    setPage(1);
    loadTrials(normalized, 1, pageSizeRef.current ?? DEFAULT_PAGE_SIZE);
  }, [condition, loadTrials]);

  const handleSearch = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const normalized = sanitizeCondition(searchInput);
      setActiveCondition(normalized);
      setPage(1);
      loadTrials(normalized, 1, pageSizeRef.current ?? DEFAULT_PAGE_SIZE);
    },
    [searchInput, loadTrials]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage <= 0 || nextPage > totalPages || nextPage === page) {
        return;
      }

      loadTrials(activeCondition, nextPage, pageSizeRef.current ?? DEFAULT_PAGE_SIZE);
    },
    [activeCondition, page, totalPages, loadTrials]
  );

  const handleRefresh = useCallback(() => {
    loadTrials(activeCondition, page, pageSizeRef.current ?? DEFAULT_PAGE_SIZE, { force: true });
  }, [activeCondition, page, loadTrials]);

  const pageNumbers = useMemo(() => {
    if (!totalPages) {
      return [1];
    }

    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  const handleCardClick = useCallback((trial: ClinicalTrial) => {
    if (!isBrowser) {
      return;
    }

    const fallbackUrl = trial.url || (trial.nctId ? `https://clinicaltrials.gov/study/${trial.nctId}` : '');
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const startIndex = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIndex = totalCount > 0 ? Math.min(totalCount, startIndex + trials.length - 1) : 0;
  const hasResults = trials.length > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleSearch}>
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Condition</label>
            <div className="mt-1 flex gap-3">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search kidney-related conditions"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2"
              >
                Search
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {hasResults ? `${startIndex}-${endIndex}` : 0}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{totalCount}</span> trials for{' '}
            <span className="font-semibold text-teal-600">{activeCondition}</span>
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-400">Cached for 24 hours</p>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm text-slate-500">Fetching the latest clinical trials...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && hasResults && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {trials.map((trial) => (
              <div key={trial.nctId} className="relative">
                <ClinicalTrialCard trial={trial} onClick={() => handleCardClick(trial)} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-6" aria-label="Pagination">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => handlePageChange(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  className={`h-10 w-10 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    pageNumber === page
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      {!loading && !error && !hasResults && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No clinical trials were found for{' '}
          <span className="font-semibold text-slate-900">{activeCondition}</span>. Try searching a
          different condition.
        </div>
      )}
    </section>
  );
};

export default ClinicalTrialsTab;
