/**
 * TrendsPage
 * PubMed 기반 연구 트렌드 분석 페이지
 *
 * Quick Access Tabs 포함:
 * - 연구 분석: Step 기반 PubMed 분석
 * - 뉴스: 신장 질환 관련 뉴스 피드
 * - 임상시험: ClinicalTrials.gov 기반 임상시험 정보
 * - 대시보드: 인기 키워드 + 연구 트렌드 차트
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, ArrowLeft, AlertCircle, RefreshCw, Search, Newspaper, FlaskConical, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

// Hooks
import { useBookmarks } from '../hooks/useBookmarks';

// Components
import {
  QueryBuilder,
  AnalysisSelector,
  ChartRenderer,
  PaperList,
  SummaryPanel,
  PaperComparison,
  NewsFeed,
  ClinicalTrialsTab,
  ResearchDashboardContent
} from '../components/trends';
import { MobileHeader } from '../components/MobileHeader';

// API & Types
import {
  searchTemporalTrends,
  searchGeographicTrends,
  searchMeshDistribution,
  compareKeywords,
  summarizePapers,
  type AnalysisType,
  type ChartConfig,
  type PaperResult,
  type MultiplePaperSummary,
  type TrendResponse,
} from '../services/trendsApi';

// ==================== Types ====================

type Step = 'query' | 'analysis' | 'results';
type QuickTab = 'analysis' | 'news' | 'clinical-trials' | 'dashboard';
type Language = 'ko' | 'en';

interface QueryState {
  query: string;
  keywords: string[];
  startYear: number;
  endYear: number;
}

interface ResultState {
  analysisType: AnalysisType;
  explanation: string;
  chartConfig: ChartConfig | null;
  papers: PaperResult[];
  metadata: Record<string, unknown>;
}

// ==================== Main Component ====================

export function TrendsPage(): React.ReactElement {
  // Language - default to Korean (can be extended to use AppContext later)
  const language: Language = 'ko';
  const { user } = useAuth();

  // Bookmark management
  const { bookmarks, addBookmark, removeBookmarkByPaperId } = useBookmarks(user?.id, true);
  const bookmarkedPaperIds = useMemo(() => new Set(bookmarks.map(b => b.paperId)), [bookmarks]);

  // Quick Tab state (for landing page)
  const [activeTab, setActiveTab] = useState<QuickTab>('analysis');

  // Step state (for analysis flow)
  const [step, setStep] = useState<Step>('query');

  // Query state
  const [queryState, setQueryState] = useState<QueryState>({
    query: '',
    keywords: [],
    startYear: 2015,
    endYear: 2024,
  });

  // Result state
  const [resultState, setResultState] = useState<ResultState | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkLoadingPapers, setBookmarkLoadingPapers] = useState<Set<string>>(new Set());

  // Summary state
  const [aiSummary, setAiSummary] = useState<MultiplePaperSummary | null>(null);

  // Paper comparison state
  const [selectedPapers, setSelectedPapers] = useState<PaperResult[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Translations
  const t = {
    title: language === 'ko' ? '연구 트렌드 분석' : 'Research Trend Analysis',
    subtitle: language === 'ko'
      ? 'PubMed 데이터를 기반으로 연구 트렌드를 분석하고 시각화합니다'
      : 'Analyze and visualize research trends based on PubMed data',
    back: language === 'ko' ? '뒤로' : 'Back',
    newSearch: language === 'ko' ? '새 검색' : 'New Search',
    retry: language === 'ko' ? '다시 시도' : 'Retry',
    errorTitle: language === 'ko' ? '오류 발생' : 'Error Occurred',
    stepQuery: language === 'ko' ? '1. 검색어 입력' : '1. Enter Query',
    stepAnalysis: language === 'ko' ? '2. 분석 유형 선택' : '2. Select Analysis',
    stepResults: language === 'ko' ? '3. 결과 확인' : '3. View Results',
    // Quick Tabs
    tabAnalysis: language === 'ko' ? '연구 분석' : 'Research Analysis',
    tabNews: language === 'ko' ? '뉴스' : 'News',
    tabClinicalTrials: language === 'ko' ? '임상시험' : 'Clinical Trials',
    tabDashboard: language === 'ko' ? '대시보드' : 'Dashboard',
  };

  // Handle query submission
  const handleQuerySubmit = useCallback(
    (query: string, keywords: string[], startYear: number, endYear: number) => {
      setQueryState({ query, keywords, startYear, endYear });
      setError(null);
      setStep('analysis');
    },
    []
  );

  // Handle analysis selection
  const handleAnalysisSelect = useCallback(
    async (analysisType: AnalysisType) => {
      setLoading(true);
      setError(null);
      setAiSummary(null);

      try {
        let response: TrendResponse;

        switch (analysisType) {
          case 'temporal':
            response = await searchTemporalTrends(
              queryState.query,
              queryState.startYear,
              queryState.endYear
            );
            break;

          case 'geographic':
            response = await searchGeographicTrends(queryState.query);
            break;

          case 'mesh':
            response = await searchMeshDistribution(queryState.query);
            break;

          case 'compare':
            if (queryState.keywords.length < 2) {
              throw new Error(
                language === 'ko'
                  ? '키워드 비교에는 최소 2개의 키워드가 필요합니다'
                  : 'Keyword comparison requires at least 2 keywords'
              );
            }
            response = await compareKeywords(
              queryState.keywords,
              queryState.startYear,
              queryState.endYear
            );
            break;

          default:
            throw new Error(`Unknown analysis type: ${analysisType}`);
        }

        // Extract chart config from sources
        const chartConfig: ChartConfig | null =
          response.sources && response.sources.length > 0 ? (response.sources[0] ?? null) : null;

        setResultState({
          analysisType,
          explanation: response.answer,
          chartConfig,
          papers: response.papers || [],
          metadata: response.metadata || {},
        });

        setStep('results');
      } catch (err) {
        console.error('Analysis error:', err);
        const errorMessage = err instanceof Error ? err.message : '트렌드 분석 중 오류가 발생했습니다';
        setError(errorMessage);

        // 사용자 친화적인 에러 팝업 표시
        toast.error(errorMessage, {
          description: '잠시 후 다시 시도해주세요.',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    },
    [queryState, language]
  );

  // Handle summary generation
  const handleRequestSummary = useCallback(async () => {
    if (!resultState || resultState.papers.length === 0) return;

    setSummaryLoading(true);

    try {
      const summary = await summarizePapers(
        resultState.papers,
        queryState.query,
        language,
        'multiple'
      );

      setAiSummary(summary);
    } catch (err) {
      console.error('Summary error:', err);
      const errorMessage = err instanceof Error ? err.message : '논문 요약 생성 중 오류가 발생했습니다';

      setAiSummary({
        error: errorMessage,
        status: 'error',
      });

      // 사용자 친화적인 에러 팝업 표시
      toast.error(errorMessage, {
        description: '잠시 후 다시 시도해주세요.',
        duration: 5000,
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [resultState, queryState.query, language]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (step === 'results') {
      setStep('analysis');
    } else if (step === 'analysis') {
      setStep('query');
    }
  }, [step]);

  // Handle reset
  const handleReset = useCallback(() => {
    setStep('query');
    setActiveTab('analysis');
    setQueryState({
      query: '',
      keywords: [],
      startYear: 2015,
      endYear: 2024,
    });
    setResultState(null);
    setAiSummary(null);
    setError(null);
    setSelectedPapers([]);
    setShowComparison(false);
  }, []);

  // Handle keyword click from PopularKeywords - exported for potential use
  const handleKeywordClick = useCallback((keyword: string) => {
    setQueryState(prev => ({
      ...prev,
      query: keyword,
    }));
    setActiveTab('analysis');
    toast.info(language === 'ko' ? `"${keyword}" 검색어가 입력되었습니다` : `Search term "${keyword}" has been entered`);
  }, [language]);
  // Expose handleKeywordClick to avoid unused variable warning
  void handleKeywordClick;

  // Handle paper selection for comparison
  const handlePaperSelect = useCallback((paper: PaperResult) => {
    setSelectedPapers(prev => {
      const isSelected = prev.some(p => p.pmid === paper.pmid);
      if (isSelected) {
        return prev.filter(p => p.pmid !== paper.pmid);
      }
      if (prev.length >= 4) {
        toast.warning(language === 'ko' ? '최대 4개까지 선택 가능합니다' : 'Maximum 4 papers can be selected');
        return prev;
      }
      return [...prev, paper];
    });
  }, [language]);

  // Handle compare button click
  const handleCompare = useCallback(() => {
    if (selectedPapers.length < 2) {
      toast.warning(language === 'ko' ? '비교하려면 최소 2개 논문을 선택하세요' : 'Select at least 2 papers to compare');
      return;
    }
    setShowComparison(true);
  }, [selectedPapers.length, language]);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback(async (paper: PaperResult) => {
    try {
      setBookmarkLoadingPapers(prev => new Set([...prev, paper.pmid]));
      if (bookmarkedPaperIds.has(paper.pmid)) {
        await removeBookmarkByPaperId(paper.pmid);
      } else {
        await addBookmark(paper);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setBookmarkLoadingPapers(prev => {
        const next = new Set(prev);
        next.delete(paper.pmid);
        return next;
      });
    }
  }, [bookmarkedPaperIds, addBookmark, removeBookmarkByPaperId]);

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 gap-2">
      {[
        { key: 'query', label: t.stepQuery },
        { key: 'analysis', label: t.stepAnalysis },
        { key: 'results', label: t.stepResults },
      ].map((s, index) => (
        <React.Fragment key={s.key}>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              step === s.key
                ? 'bg-purple-600 text-white'
                : step === 'results' || (step === 'analysis' && s.key === 'query')
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {s.label}
          </div>
          {index < 2 && (
            <div
              className={`w-8 h-0.5 ${
                (step === 'analysis' && index === 0) || step === 'results'
                  ? 'bg-purple-400'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Render Quick Access Tabs (shown when step is 'query')
  const renderQuickTabs = () => (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {([
          { key: 'analysis', label: t.tabAnalysis, icon: Search },
          { key: 'news', label: t.tabNews, icon: Newspaper },
          { key: 'clinical-trials', label: t.tabClinicalTrials, icon: FlaskConical },
          { key: 'dashboard', label: t.tabDashboard, icon: BarChart3 },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render News Tab Content
  const renderNewsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          {language === 'ko' ? '📰 신장 질환 관련 뉴스' : '📰 Kidney Disease News'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {language === 'ko'
            ? '최신 신장 질환 관련 뉴스와 건강 정보를 확인하세요.'
            : 'Stay updated with the latest kidney disease news and health information.'}
        </p>
      </div>
      <NewsFeed />
    </div>
  );

  // Render Clinical Trials Tab Content
  const renderClinicalTrialsTab = () => (
    <ClinicalTrialsTab condition="kidney disease" />
  );

  // Render Dashboard Tab Content (Real API-driven dashboard)
  const renderDashboardTab = () => (
    <ResearchDashboardContent />
  );

  // Render error
  const renderError = () =>
    error && (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="font-medium text-red-800 dark:text-red-300">{t.errorTitle}</h4>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            ×
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader
          title={t.title}
          showMenu={true}
          showProfile={true}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:pb-10">
        {/* Header */}
        <div className="mb-8 hidden lg:block">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="text-purple-600" />
              {t.title}
            </h1>

            {step !== 'query' && (
              <div className="flex gap-2">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                    flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  {t.back}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-lg
                    text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20
                    flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  {t.newSearch}
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
        </div>

        {/* Error Display */}
        {renderError()}

        {/* Quick Access Tabs (only show on query step) */}
        {step === 'query' && renderQuickTabs()}

        {/* Step Content */}
        {step === 'query' && activeTab === 'analysis' && (
          <>
            {renderStepIndicator()}
            <QueryBuilder
              onSubmit={handleQuerySubmit}
              loading={loading}
              language={language}
            />
          </>
        )}

        {step === 'query' && activeTab === 'news' && renderNewsTab()}

        {step === 'query' && activeTab === 'clinical-trials' && renderClinicalTrialsTab()}

        {step === 'query' && activeTab === 'dashboard' && renderDashboardTab()}

        {step === 'analysis' && (
          <>
            {renderStepIndicator()}
            <AnalysisSelector
              onSelect={handleAnalysisSelect}
              hasMultipleKeywords={queryState.keywords.length >= 2}
              loading={loading}
              language={language}
            />
          </>
        )}

        {step === 'results' && resultState && (
          <div className="space-y-6">
            {renderStepIndicator()}
            {/* Explanation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {language === 'ko' ? '📊 분석 결과' : '📊 Analysis Results'}
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                  {resultState.explanation}
                </pre>
              </div>
            </div>

            {/* Chart */}
            {resultState.chartConfig && (
              <ChartRenderer config={resultState.chartConfig} height={400} />
            )}

            {/* Paper Comparison Controls */}
            {resultState.papers.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {language === 'ko' ? '논문 비교' : 'Compare Papers'}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                      {selectedPapers.length}/4 {language === 'ko' ? '선택됨' : 'selected'}
                    </span>
                  </div>
                  <button
                    onClick={handleCompare}
                    disabled={selectedPapers.length < 2}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700
                      disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {language === 'ko' ? '비교하기' : 'Compare'}
                  </button>
                </div>
                {selectedPapers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPapers.map(paper => (
                      <span
                        key={paper.pmid}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20
                          text-purple-700 dark:text-purple-300 rounded text-xs"
                      >
                        {paper.title.substring(0, 30)}...
                        <button
                          onClick={() => handlePaperSelect(paper)}
                          className="ml-1 text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Papers */}
            {resultState.papers.length > 0 && (
              <PaperList
                papers={resultState.papers}
                onRequestSummary={handleRequestSummary}
                loading={summaryLoading}
                language={language}
                selectedPapers={selectedPapers}
                onPaperSelect={handlePaperSelect}
                bookmarkedPaperIds={bookmarkedPaperIds}
                onToggleBookmark={handleToggleBookmark}
                bookmarkLoading={bookmarkLoadingPapers}
              />
            )}

            {/* Summary Panel */}
            {resultState.papers.length > 0 && (
              <SummaryPanel
                papers={resultState.papers}
                aiSummary={aiSummary}
                loading={summaryLoading}
                language={language}
              />
            )}
          </div>
        )}

        {/* Paper Comparison Modal */}
        {showComparison && selectedPapers.length >= 2 && (
          <PaperComparison
            papers={selectedPapers}
            onClose={() => setShowComparison(false)}
          />
        )}
      </div>
    </div>
  );
}
