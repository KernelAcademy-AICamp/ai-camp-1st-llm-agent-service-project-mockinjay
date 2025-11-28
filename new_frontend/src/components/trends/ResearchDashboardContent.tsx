/**
 * ResearchDashboardContent Component
 *
 * Real PubMed research trends dashboard with:
 * - API-driven data from compareKeywords
 * - 24-hour localStorage caching
 * - Popular keywords with trend indicators
 * - Interactive line chart
 * - AI analysis summary
 */
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { compareKeywords, type TrendResponse, type ChartConfig } from '../../services/trendsApi';

// Default CKD-related keywords
const DEFAULT_KEYWORDS = ['chronic kidney disease', 'dialysis', 'kidney transplant', 'renal diet'];

// Chart colors (brand colors)
const CHART_COLORS = [
  '#00C9B7', // Mint (brand)
  '#9F7AEA', // Purple (brand)
  '#3B82F6', // Blue
  '#F59E0B', // Orange
];

// Cache key and duration (24 hours)
const CACHE_KEY = 'research_dashboard_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CachedData {
  timestamp: number;
  trendData: TrendDataPoint[];
  keywords: KeywordTrend[];
  chartConfig: ChartConfig | null;
  answerText: string;
}

interface TrendDataPoint {
  year: string;
  [key: string]: string | number;
}

interface KeywordTrend {
  text: string;
  change: number;
  trending: 'up' | 'down';
}

export interface ResearchDashboardContentProps {
  onKeywordClick?: (keyword: string) => void;
  language?: 'ko' | 'en';
}

const ResearchDashboardContent: React.FC<ResearchDashboardContentProps> = ({
  onKeywordClick,
  language = 'ko',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [keywords, setKeywords] = useState<KeywordTrend[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [answerText, setAnswerText] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Korean label mapping
  const getKoreanLabel = (label: string): string => {
    const mapping: Record<string, string> = {
      'chronic kidney disease': '만성콩팥병',
      'dialysis': '투석 치료',
      'kidney transplant': '신장 이식',
      'renal diet': '신장병 식단',
    };
    return mapping[label.toLowerCase()] || label;
  };

  // Load from cache
  const loadFromCache = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }

      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  // Save to cache
  const saveToCache = useCallback((data: Omit<CachedData, 'timestamp'>) => {
    try {
      const cacheData: CachedData = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.warn('Cache save failed:', err);
    }
  }, []);

  // Load trend data from API
  const loadTrendData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = loadFromCache();
      if (cached) {
        setTrendData(cached.trendData);
        setKeywords(cached.keywords);
        setChartConfig(cached.chartConfig);
        setAnswerText(cached.answerText);
        setLastUpdated(new Date(cached.timestamp));
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response: TrendResponse = await compareKeywords(DEFAULT_KEYWORDS, 2018, 2024);

      let newTrendData: TrendDataPoint[] = [];
      let newKeywords: KeywordTrend[] = [];
      let newChartConfig: ChartConfig | null = null;
      let newAnswerText = '';

      // Transform chart data
      if (response.sources && response.sources.length > 0) {
        const chart = response.sources[0];
        newChartConfig = chart;

        const labels = chart.data.labels || [];
        const datasets = chart.data.datasets || [];

        newTrendData = labels.map((year, index) => {
          const point: TrendDataPoint = { year: String(year) };
          datasets.forEach((dataset) => {
            point[dataset.label] = dataset.data[index] || 0;
          });
          return point;
        });

        // Calculate keyword trends (year-over-year change)
        newKeywords = datasets.map((dataset) => {
          const data = dataset.data;
          const recent = data[data.length - 1] || 0;
          const previous = data[data.length - 2] || 1;
          const changePercent = Math.round(((recent - previous) / (previous || 1)) * 100);

          return {
            text: dataset.label,
            change: Math.abs(changePercent),
            trending: (changePercent >= 0 ? 'up' : 'down') as 'up' | 'down',
          };
        });
      }

      if (response.answer) {
        newAnswerText = response.answer;
      }

      setTrendData(newTrendData);
      setKeywords(newKeywords);
      setChartConfig(newChartConfig);
      setAnswerText(newAnswerText);
      setLastUpdated(new Date());

      saveToCache({
        trendData: newTrendData,
        keywords: newKeywords,
        chartConfig: newChartConfig,
        answerText: newAnswerText,
      });
    } catch (err) {
      console.error('Failed to load trend data:', err);
      setError(err instanceof Error ? err.message : '트렌드 데이터를 불러오는데 실패했습니다.');

      // Fallback mock data on error
      setKeywords([
        { text: 'chronic kidney disease', change: 12, trending: 'up' },
        { text: 'dialysis', change: 8, trending: 'up' },
        { text: 'kidney transplant', change: 15, trending: 'up' },
        { text: 'renal diet', change: 5, trending: 'up' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  const handleForceRefresh = useCallback(() => {
    loadTrendData(true);
  }, [loadTrendData]);

  useEffect(() => {
    loadTrendData(false);
  }, [loadTrendData]);

  const t = {
    title: language === 'ko' ? '연구 대시보드' : 'Research Dashboard',
    subtitle: language === 'ko' ? 'PubMed 기반 신장병 연구 트렌드' : 'PubMed-based CKD research trends',
    popularKeywords: language === 'ko' ? '📈 인기 키워드' : '📈 Popular Keywords',
    researchTrends: language === 'ko' ? '📊 연구 트렌드' : '📊 Research Trends',
    aiSummary: language === 'ko' ? '🤖 AI 분석 요약' : '🤖 AI Analysis Summary',
    refresh: language === 'ko' ? '새로고침' : 'Refresh',
    lastUpdate: language === 'ko' ? '마지막 업데이트' : 'Last updated',
    autoRefresh: language === 'ko' ? '24시간마다 자동 갱신' : 'Auto-refreshes every 24 hours',
    yoyChange: language === 'ko' ? '전년 대비' : 'YoY',
    papers: language === 'ko' ? '편' : 'papers',
    year: language === 'ko' ? '년' : '',
    loadingText: language === 'ko' ? 'PubMed에서 트렌드 데이터를 불러오는 중...' : 'Loading trend data from PubMed...',
    noData: language === 'ko' ? '트렌드 데이터가 없습니다' : 'No trend data available',
    dataSource: language === 'ko' ? '데이터 출처: PubMed (2018-2024)' : 'Data source: PubMed (2018-2024)',
  };

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t.lastUpdate}: {lastUpdated.toLocaleDateString('ko-KR')} {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              {' '}({t.autoRefresh})
            </p>
          )}
        </div>
        <button
          onClick={handleForceRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
            bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
            transition-colors disabled:opacity-50"
          title={language === 'ko' ? '캐시를 무시하고 새로운 데이터를 가져옵니다' : 'Force refresh data'}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {t.refresh}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Popular Keywords Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.popularKeywords}</h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keywords.map((keyword, index) => (
              <div
                key={index}
                onClick={() => onKeywordClick?.(keyword.text)}
                className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                  hover:shadow-md dark:hover:shadow-gray-900/30 transition-all duration-200
                  ${onKeywordClick ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center rounded-full w-8 h-8 text-sm font-bold"
                      style={{
                        background: CHART_COLORS[index % CHART_COLORS.length] + '20',
                        color: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getKoreanLabel(keyword.text)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3 ml-11">
                  {keyword.trending === 'up' ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                  <span
                    className="text-sm font-semibold"
                    style={{ color: keyword.trending === 'up' ? '#10B981' : '#EF4444' }}
                  >
                    {keyword.trending === 'up' ? '+' : '-'}{keyword.change}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {t.yoyChange}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Research Trends Chart */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.researchTrends}</h3>

        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-[#00C9B7]" size={40} />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.loadingText}</p>
              </div>
            </div>
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{
                    value: language === 'ko' ? '논문 수' : 'Papers',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#6B7280',
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()}${t.papers}`,
                    getKoreanLabel(name),
                  ]}
                  labelFormatter={(label) => `${label}${t.year}`}
                />
                <Legend
                  formatter={(value) => getKoreanLabel(value)}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                {chartConfig?.data.datasets.map((dataset, index) => (
                  <Line
                    key={dataset.label}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS[index % CHART_COLORS.length] }}
                    activeDot={{ r: 6, fill: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.noData}</p>
            </div>
          )}
        </div>
      </section>

      {/* AI Analysis Summary */}
      {answerText && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.aiSummary}</h3>
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-[#00C9B7]/5 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {answerText}
            </p>
          </div>
        </section>
      )}

      {/* Data Source Info */}
      <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.dataSource} | {t.lastUpdate}: {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  );
};

export default ResearchDashboardContent;
