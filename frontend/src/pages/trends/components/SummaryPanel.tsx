/**
 * SummaryPanel Component
 * Display original abstracts or AI-generated summaries
 */
import React, { useState } from 'react';
import type { PaperResult, MultiplePaperSummary } from '../types';

interface SummaryPanelProps {
  papers: PaperResult[];
  aiSummary: MultiplePaperSummary | null;
  loading?: boolean;
}

type ViewMode = 'original' | 'ai';

const SummaryPanel: React.FC<SummaryPanelProps> = ({ papers, aiSummary, loading = false }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('original');

  if (papers.length === 0) {
    return null;
  }

  const renderOriginalView = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        📄 총 {papers.length}개 논문의 원본 초록을 표시하고 있습니다
      </div>

      {papers.map((paper, index) => (
        <div key={paper.pmid} className="border-l-4 border-blue-500 pl-4 py-2">
          <div className="font-semibold text-gray-800 mb-1">
            {index + 1}. {paper.title}
          </div>
          <div className="text-sm text-gray-600 mb-1">
            {paper.pub_date} • {paper.journal}
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            {paper.abstract || '초록이 제공되지 않았습니다.'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAiView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full" />
          <p className="text-gray-600">AI가 논문을 분석하고 요약을 생성하는 중입니다...</p>
        </div>
      );
    }

    if (!aiSummary) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">✨ AI 요약이 아직 생성되지 않았습니다</p>
          <p className="text-sm">논문 목록의 "AI 요약 생성" 버튼을 클릭하세요</p>
        </div>
      );
    }

    if (aiSummary.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">❌ 요약 생성 실패</p>
          <p className="text-red-600 text-sm mt-1">{aiSummary.error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overview */}
        {aiSummary.overview && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              📝 전체 개요
            </h4>
            <p className="text-gray-700 leading-relaxed">{aiSummary.overview}</p>
          </div>
        )}

        {/* Key Themes */}
        {aiSummary.key_themes && aiSummary.key_themes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              🔑 주요 연구 주제
            </h4>
            <ul className="space-y-1">
              {aiSummary.key_themes.map((theme, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{theme}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Research Trends */}
        {aiSummary.research_trends && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              📈 연구 동향
            </h4>
            <p className="text-gray-700 leading-relaxed">{aiSummary.research_trends}</p>
          </div>
        )}

        {/* Clinical Implications */}
        {aiSummary.clinical_implications && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              🏥 임상적 시사점
            </h4>
            <p className="text-gray-700 leading-relaxed">{aiSummary.clinical_implications}</p>
          </div>
        )}

        {/* Recommendations */}
        {aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              💡 향후 연구 방향
            </h4>
            <ul className="space-y-1">
              {aiSummary.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>
            📊 분석된 논문: {aiSummary.papers_analyzed}개
            {aiSummary.total_papers !== aiSummary.papers_analyzed &&
              ` (전체 ${aiSummary.total_papers}개 중)`}
          </p>
          {aiSummary.tokens_used && (
            <p>🔢 사용된 토큰: {aiSummary.tokens_used.toLocaleString()}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">📖 논문 요약</h3>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('original')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'original'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            원본 초록
          </button>
          <button
            onClick={() => setViewMode('ai')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'ai'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            AI 요약
          </button>
        </div>
      </div>

      <div className="mt-4">
        {viewMode === 'original' ? renderOriginalView() : renderAiView()}
      </div>
    </div>
  );
};

export default SummaryPanel;
