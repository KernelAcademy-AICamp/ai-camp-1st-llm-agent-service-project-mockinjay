import { useState, useEffect, useCallback } from 'react';
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
import { compareKeywords, type TrendResponse, type ChartConfig } from '../services/trendsApi';

// 신장병 관련 기본 키워드들
const DEFAULT_KEYWORDS = ['chronic kidney disease', 'dialysis', 'kidney transplant', 'renal diet'];

// 차트 색상
const CHART_COLORS = [
  '#00C9B7', // 민트 (브랜드 컬러)
  '#9F7AEA', // 보라 (브랜드 컬러)
  '#3B82F6', // 파랑
  '#F59E0B', // 주황
];

// 캐시 키 및 유효 시간 (24시간)
const CACHE_KEY = 'dashboard_trend_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

interface CachedData {
  timestamp: number;
  trendData: TrendDataPoint[];
  keywords: { text: string; change: number; trending: 'up' | 'down' }[];
  chartConfig: ChartConfig | null;
  answerText: string;
}

interface TrendDataPoint {
  year: string;
  [key: string]: string | number;
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [keywords, setKeywords] = useState<{ text: string; change: number; trending: 'up' | 'down' }[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [answerText, setAnswerText] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 캐시에서 데이터 로드
  const loadFromCache = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const now = Date.now();

      // 24시간 이내인지 확인
      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }

      // 만료된 캐시 삭제
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  // 캐시에 데이터 저장
  const saveToCache = useCallback((data: Omit<CachedData, 'timestamp'>) => {
    try {
      const cacheData: CachedData = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.warn('캐시 저장 실패:', err);
    }
  }, []);

  // API에서 트렌드 데이터 로드 (강제 새로고침 옵션)
  const loadTrendData = useCallback(async (forceRefresh = false) => {
    // 강제 새로고침이 아니면 캐시 확인
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
      let newKeywords: { text: string; change: number; trending: 'up' | 'down' }[] = [];
      let newChartConfig: ChartConfig | null = null;
      let newAnswerText = '';

      // 차트 데이터 변환
      if (response.sources && response.sources.length > 0) {
        const chart = response.sources[0];
        newChartConfig = chart;

        // recharts 형식으로 변환
        const labels = chart.data.labels || [];
        const datasets = chart.data.datasets || [];

        newTrendData = labels.map((year, index) => {
          const point: TrendDataPoint = { year: String(year) };
          datasets.forEach((dataset) => {
            point[dataset.label] = dataset.data[index] || 0;
          });
          return point;
        });

        // 키워드 트렌드 계산 (최근 2년 대비 변화율)
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

      // AI 분석 텍스트 저장
      if (response.answer) {
        newAnswerText = response.answer;
      }

      // 상태 업데이트
      setTrendData(newTrendData);
      setKeywords(newKeywords);
      setChartConfig(newChartConfig);
      setAnswerText(newAnswerText);
      setLastUpdated(new Date());

      // 캐시에 저장
      saveToCache({
        trendData: newTrendData,
        keywords: newKeywords,
        chartConfig: newChartConfig,
        answerText: newAnswerText,
      });

    } catch (err) {
      console.error('Failed to load trend data:', err);
      setError(err instanceof Error ? err.message : '트렌드 데이터를 불러오는데 실패했습니다.');

      // 에러 시 기본 Mock 데이터 표시
      setKeywords([
        { text: '만성콩팥병', change: 12, trending: 'up' },
        { text: '투석 치료', change: 8, trending: 'up' },
        { text: '신장 이식', change: 15, trending: 'up' },
        { text: '신장병 식단', change: 5, trending: 'up' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  // 강제 새로고침 핸들러
  const handleForceRefresh = useCallback(() => {
    loadTrendData(true);
  }, [loadTrendData]);

  useEffect(() => {
    loadTrendData(false);
  }, [loadTrendData]);

  // 한글 키워드 매핑
  const getKoreanLabel = (label: string): string => {
    const mapping: Record<string, string> = {
      'chronic kidney disease': '만성콩팥병',
      'dialysis': '투석 치료',
      'kidney transplant': '신장 이식',
      'renal diet': '신장병 식단',
    };
    return mapping[label.toLowerCase()] || label;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">대시보드</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              신장병 관련 PubMed 연구 트렌드를 확인하세요
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                마지막 업데이트: {lastUpdated.toLocaleDateString('ko-KR')} {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                {' '}(24시간마다 자동 갱신)
              </p>
            )}
          </div>

          <button
            onClick={handleForceRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
              bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
              transition-colors disabled:opacity-50"
            title="캐시를 무시하고 새로운 데이터를 가져옵니다"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Keywords Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">인기 키워드</h2>

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
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                    hover:shadow-md dark:hover:shadow-gray-900/30 transition-all duration-200"
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
                      style={{
                        color: keyword.trending === 'up' ? '#10B981' : '#EF4444',
                      }}
                    >
                      {keyword.trending === 'up' ? '+' : '-'}{keyword.change}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      전년 대비
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Research Trends Chart */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">연구 트렌드</h2>

          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-primary-600" size={40} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PubMed에서 트렌드 데이터를 불러오는 중...
                  </p>
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
                      value: '논문 수',
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
                      `${value.toLocaleString()}편`,
                      getKoreanLabel(name),
                    ]}
                    labelFormatter={(label) => `${label}년`}
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  트렌드 데이터가 없습니다
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Summary */}
        {answerText && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI 분석 요약</h2>

            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {answerText}
              </p>
            </div>
          </div>
        )}

        {/* Data Source Info */}
        <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            데이터 출처: PubMed (2018-2024) | 마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
}
