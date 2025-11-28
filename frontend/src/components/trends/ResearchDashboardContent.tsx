import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { compareKeywords } from '../../services/trendsApi';
import type { ChartConfig as TrendChartConfig } from '../../types/trends';

const DEFAULT_KEYWORDS = ['chronic kidney disease', 'dialysis', 'kidney transplant', 'CKD nutrition'];
const CACHE_PREFIX = 'research-dashboard';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_COLORS = ['#2563eb', '#dc2626', '#059669', '#eab308'];
const IS_BROWSER = typeof window !== 'undefined';

type ComparisonChartConfig = TrendChartConfig & {
  data?: {
    labels?: Array<string | number>;
    datasets?: Array<{
      label?: string;
      data?: Array<number | string>;
      borderColor?: string;
      backgroundColor?: string;
    }>;
  };
};

type CachedDashboardPayload = {
  timestamp: number;
  chartData: ComparisonChartConfig | null;
  summary: string;
  keywords: string[];
};

type SeriesDescriptor = {
  label: string;
  values: number[];
  color: string;
};

type KeywordStat = {
  keyword: string;
  lastValue: number | null;
  previousValue: number | null;
  yoyChange: number | null;
  color: string;
};

type ChartPoint = {
  year: string;
  [series: string]: string | number;
};

const isValidChartConfig = (value: unknown): value is ComparisonChartConfig => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as ComparisonChartConfig;
  if (!candidate.data || typeof candidate.data !== 'object') {
    return false;
  }

  const { labels, datasets } = candidate.data;
  return Array.isArray(labels) && Array.isArray(datasets);
};

const ResearchDashboardContent: React.FC = () => {
  const [chartData, setChartData] = useState<ComparisonChartConfig | null>(null);
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [keywordInput, setKeywordInput] = useState(DEFAULT_KEYWORDS.join(', '));

  const normalizeKeywords = useCallback((value: string | string[]): string[] => {
    const initial = Array.isArray(value) ? value : value.split(',');
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const item of initial) {
      const trimmed = item.trim();
      if (!trimmed) {
        continue;
      }

      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) {
        continue;
      }

      seen.add(lower);
      normalized.push(trimmed);

      if (normalized.length === 4) {
        break;
      }
    }

    return normalized;
  }, []);

  const getCacheKey = useCallback(
    (list: string[]): string => {
      const normalized = normalizeKeywords(list)
        .map((keyword) => keyword.toLowerCase())
        .sort()
        .join('|');
      return `${CACHE_PREFIX}:${normalized}`;
    },
    [normalizeKeywords]
  );

  const readCache = useCallback(
    (key: string): CachedDashboardPayload | null => {
      if (!IS_BROWSER) {
        return null;
      }

      try {
        const cached = window.localStorage.getItem(key);
        if (!cached) {
          return null;
        }

        const parsed = JSON.parse(cached) as CachedDashboardPayload;
        if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
          window.localStorage.removeItem(key);
          return null;
        }

        return parsed;
      } catch {
        return null;
      }
    },
    []
  );

  const writeCache = useCallback((key: string, payload: CachedDashboardPayload): void => {
    if (!IS_BROWSER) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const fetchComparison = useCallback(
    async (nextKeywords: string[], options: { force?: boolean } = {}) => {
      const sanitized = normalizeKeywords(nextKeywords);
      if (sanitized.length < 2) {
        setError('비교할 키워드를 두 개 이상 입력해주세요.');
        return;
      }

      const cacheKey = getCacheKey(sanitized);
      if (!options.force) {
        const cached = readCache(cacheKey);
        if (cached) {
          setChartData(cached.chartData);
          setAiSummary(cached.summary);
          setLastUpdated(cached.timestamp);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const currentYear = new Date().getFullYear();
        const startYear = Math.max(2000, currentYear - 9);
        const response = await compareKeywords(sanitized, startYear, currentYear);
        // TrendResponse uses 'sources' (array of ChartConfig) and 'answer' (string)
        const chartSource = response.sources?.[0];
        const config = isValidChartConfig(chartSource) ? (chartSource as ComparisonChartConfig) : null;
        const summary = response.answer ?? '';
        const timestamp = Date.now();

        setChartData(config);
        setAiSummary(summary);
        setLastUpdated(timestamp);

        writeCache(cacheKey, {
          timestamp,
          chartData: config,
          summary,
          keywords: sanitized,
        });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load PubMed comparison data.');
      } finally {
        setLoading(false);
      }
    },
    [getCacheKey, normalizeKeywords, readCache, writeCache]
  );

  useEffect(() => {
    fetchComparison(keywords);
  }, [keywords, fetchComparison]);

  useEffect(() => {
    setKeywordInput(keywords.join(', '));
  }, [keywords]);

  const seriesCollection = useMemo<SeriesDescriptor[]>(() => {
    if (!chartData?.data || !Array.isArray(chartData.data.datasets)) {
      return [];
    }

    return chartData.data.datasets.map((dataset = {}, index) => {
      const rawValues = Array.isArray(dataset.data) ? dataset.data : [];
      const values = rawValues.map((value) => {
        if (typeof value === 'number') {
          return value;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      });

      const palette = dataset.borderColor || dataset.backgroundColor;
      const color = typeof palette === 'string' && palette.trim().length
        ? palette
        : FALLBACK_COLORS[index % FALLBACK_COLORS.length];

      return {
        label: dataset.label || `Keyword ${index + 1}`,
        values,
        color: color ?? '#000000',
      };
    });
  }, [chartData]);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (!chartData?.data || !Array.isArray(chartData.data.labels)) {
      return [];
    }

    if (!seriesCollection.length) {
      return [];
    }

    return chartData.data.labels.map((label, labelIndex) => {
      const entry: ChartPoint = {
        year: String(label),
      };

      seriesCollection.forEach((series) => {
        const value = series.values[labelIndex];
        entry[series.label] = typeof value === 'number' ? Number(value.toFixed(2)) : 0;
      });

      return entry;
    });
  }, [chartData, seriesCollection]);

  const keywordStats = useMemo<KeywordStat[]>(() => {
    return seriesCollection.map((series) => {
      const lastIndex = series.values.length - 1;
      const lastValue = lastIndex >= 0 ? series.values[lastIndex] ?? null : null;
      const prevValue = lastIndex > 0 ? series.values[lastIndex - 1] ?? null : null;

      let yoyChange: number | null = null;
      if (typeof lastValue === 'number' && typeof prevValue === 'number' && prevValue !== 0) {
        yoyChange = ((lastValue - prevValue) / prevValue) * 100;
      }

      return {
        keyword: series.label,
        lastValue,
        previousValue: prevValue,
        yoyChange,
        color: series.color,
      };
    });
  }, [seriesCollection]);

  const handleKeywordSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = normalizeKeywords(keywordInput);

      if (parsed.length < 2) {
        setError('비교할 키워드를 두 개 이상 입력해주세요.');
        return;
      }

      setKeywords(parsed);
    },
    [keywordInput, normalizeKeywords]
  );

  const handleForceRefresh = useCallback(() => {
    fetchComparison(keywords, { force: true });
  }, [fetchComparison, keywords]);

  const handleKeywordCardClick = useCallback(
    (keyword: string) => {
      setKeywords((prev) => {
        const remainder = prev.filter((item) => item.toLowerCase() !== keyword.toLowerCase());
        const candidate = normalizeKeywords([keyword, ...remainder, ...DEFAULT_KEYWORDS]);
        return candidate.length >= 2 ? candidate : DEFAULT_KEYWORDS;
      });

      if (IS_BROWSER) {
        const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(keyword)}`;
        window.open(pubmedUrl, '_blank', 'noopener,noreferrer');
      }
    },
    [normalizeKeywords]
  );

  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Research dashboard</h2>
          <p className="text-sm text-slate-500">
            Live PubMed keyword comparisons with AI-generated insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {lastUpdatedLabel && <span>Last updated {lastUpdatedLabel}</span>}
          <button
            type="button"
            onClick={handleForceRefresh}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Force refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleKeywordSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="block text-sm font-medium text-slate-700">Compare keywords</label>
        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="e.g. chronic kidney disease, dialysis, ..."
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Update dashboard
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Enter 2-4 keywords separated by commas.</p>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">PubMed keyword comparison</h3>
              <p className="text-sm text-slate-500">Normalized publication counts per year</p>
            </div>
            {loading && (
              <span className="text-xs font-medium text-slate-500">Refreshing…</span>
            )}
          </div>
          <div className="mt-4 h-80">
            {loading && !chartPoints.length ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading PubMed data…
              </div>
            ) : chartPoints.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 10, right: 16, bottom: 12, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  {seriesCollection.map((series) => (
                    <Line
                      key={series.label}
                      type="monotone"
                      dataKey={series.label}
                      stroke={series.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No chart data available yet. Try refreshing or updating the keywords.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">AI summary</h3>
          <p className="mt-3 text-sm text-slate-600">
            {loading && !aiSummary
              ? 'Synthesizing summary from the latest PubMed data…'
              : aiSummary || 'No AI summary yet. Run a comparison to see the highlights.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-900">Popular keywords (YoY)</h3>
          <p className="text-sm text-slate-500">
            Calculated from normalized publication counts between the last two years.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {keywordStats.length ? (
            keywordStats.map((stat) => (
              <button
                key={stat.keyword}
                type="button"
                onClick={() => handleKeywordCardClick(stat.keyword)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold" style={{ color: stat.color }}>
                    {stat.keyword}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      stat.yoyChange === null
                        ? 'text-slate-500'
                        : stat.yoyChange >= 0
                          ? 'text-green-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {stat.yoyChange === null
                      ? '—'
                      : `${stat.yoyChange >= 0 ? '+' : ''}${stat.yoyChange.toFixed(1)}% YoY`}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {stat.lastValue !== null ? stat.lastValue.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-slate-500">
                  Prev. year {stat.previousValue !== null ? stat.previousValue.toFixed(1) : 'n/a'}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Click to open a PubMed search and refresh the dashboard.
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No keyword stats yet. Run a comparison to see YoY movements.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResearchDashboardContent;
