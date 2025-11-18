/**
 * Trends Page
 * Interactive 3-step workflow for PubMed trend analysis and visualization
 */
import React, { useState } from 'react';
import QueryBuilder from './trends/components/QueryBuilder';
import AnalysisSelector from './trends/components/AnalysisSelector';
import ChartRenderer from './trends/components/ChartRenderer';
import PaperList from './trends/components/PaperList';
import SummaryPanel from './trends/components/SummaryPanel';
import { trendsApi } from './trends/utils/trendsApi';
import type {
  AnalysisType,
  TrendResponse,
  MultiplePaperSummary
} from './trends/types';

type Step = 1 | 2 | 3;

const Trends: React.FC = () => {
  // Step management
  const [step, setStep] = useState<Step>(1);

  // Query state
  const [query, setQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [startYear, setStartYear] = useState(2015);
  const [endYear, setEndYear] = useState(2024);

  // Analysis state
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Results state
  const [analysisResult, setAnalysisResult] = useState<TrendResponse | null>(null);
  const [aiSummary, setAiSummary] = useState<MultiplePaperSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Step 1: Handle query submission
  const handleQuerySubmit = (
    newQuery: string,
    newKeywords: string[],
    newStartYear: number,
    newEndYear: number
  ) => {
    setQuery(newQuery);
    setKeywords(newKeywords);
    setStartYear(newStartYear);
    setEndYear(newEndYear);
    setStep(2);
    setSelectedAnalysis(null);
    setAnalysisResult(null);
    setAiSummary(null);
  };

  // Step 2: Handle analysis selection
  const handleAnalysisSelect = async (type: AnalysisType) => {
    setSelectedAnalysis(type);
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      let result: TrendResponse;

      switch (type) {
        case 'temporal':
          result = await trendsApi.analyzeTemporalTrends({
            query,
            start_year: startYear,
            end_year: endYear,
            normalize: true
          });
          break;

        case 'geographic':
          result = await trendsApi.analyzeGeographicDistribution({
            query
          });
          break;

        case 'mesh':
          result = await trendsApi.analyzeMeshCategories({
            query
          });
          break;

        case 'compare':
          result = await trendsApi.compareKeywords({
            keywords,
            start_year: startYear,
            end_year: endYear
          });
          break;

        default:
          throw new Error('Unknown analysis type');
      }

      setAnalysisResult(result);
      setStep(3);
    } catch (error: any) {
      console.error('Analysis error:', error);
      setAnalysisError(error.response?.data?.detail || error.message || '분석 오류가 발생했습니다');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Step 3: Handle AI summary generation
  const handleGenerateSummary = async () => {
    if (!analysisResult || !analysisResult.papers || analysisResult.papers.length === 0) {
      return;
    }

    setSummaryLoading(true);

    try {
      const result = await trendsApi.summarizePapers({
        papers: analysisResult.papers,
        query,
        language: 'ko',
        summary_type: 'multiple'
      });

      setAiSummary(result as MultiplePaperSummary);
    } catch (error: any) {
      console.error('Summarization error:', error);
      setAiSummary({
        overview: '',
        key_themes: [],
        research_trends: '',
        clinical_implications: '',
        recommendations: [],
        papers_analyzed: 0,
        total_papers: 0,
        error: error.response?.data?.detail || error.message || '요약 생성 오류가 발생했습니다'
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Reset to step 1
  const handleReset = () => {
    setStep(1);
    setQuery('');
    setKeywords([]);
    setSelectedAnalysis(null);
    setAnalysisResult(null);
    setAiSummary(null);
    setAnalysisError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 PubMed 트렌드 분석
          </h1>
          <p className="text-gray-600">
            의학 연구 논문의 트렌드를 분석하고 시각화합니다
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                      step >= num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {num}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-600">
                    {num === 1 && '검색'}
                    {num === 2 && '분석 선택'}
                    {num === 3 && '결과'}
                  </div>
                </div>
                {num < 3 && (
                  <div
                    className={`h-1 w-24 transition-colors ${
                      step > num ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Query Builder */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto">
            <QueryBuilder onSubmit={handleQuerySubmit} />
          </div>
        )}

        {/* Step 2: Analysis Selector */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="max-w-4xl mx-auto">
              <AnalysisSelector
                onSelect={handleAnalysisSelect}
                hasMultipleKeywords={keywords.length >= 2}
                loading={analysisLoading}
              />
            </div>

            {/* Error Display */}
            {analysisError && (
              <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">❌ 분석 오류</p>
                <p className="text-red-600 text-sm mt-1">{analysisError}</p>
              </div>
            )}

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← 이전으로
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && analysisResult && (
          <div className="space-y-6">
            {/* Analysis Explanation */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedAnalysis === 'temporal' && '📈 시간별 추세 분석'}
                {selectedAnalysis === 'geographic' && '🌍 지역별 분포 분석'}
                {selectedAnalysis === 'mesh' && '🏷️ MeSH 카테고리 분석'}
                {selectedAnalysis === 'compare' && '🔄 키워드 비교 분석'}
              </h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-line text-gray-700">
                  {analysisResult.answer}
                </div>
              </div>

              {/* Metadata */}
              {analysisResult.metadata && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                  {Object.entries(analysisResult.metadata).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Charts */}
            {analysisResult.sources && analysisResult.sources.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analysisResult.sources.map((chartConfig, idx) => (
                  <ChartRenderer
                    key={idx}
                    config={chartConfig}
                    title={
                      analysisResult.sources.length > 1
                        ? `차트 ${idx + 1}`
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            {/* Papers List */}
            {analysisResult.papers && analysisResult.papers.length > 0 && (
              <PaperList
                papers={analysisResult.papers}
                onRequestSummary={handleGenerateSummary}
                loading={summaryLoading}
              />
            )}

            {/* Summary Panel */}
            {analysisResult.papers && analysisResult.papers.length > 0 && (
              <SummaryPanel
                papers={analysisResult.papers}
                aiSummary={aiSummary}
                loading={summaryLoading}
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                다른 분석 보기
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                새로운 검색
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trends;
