/**
 * PaperList Component
 * Display list of research papers with expandable abstracts
 */
import React, { useState } from 'react';
import type { PaperResult } from '../types';

interface PaperListProps {
  papers: PaperResult[];
  onRequestSummary?: () => void;
  loading?: boolean;
}

const PaperList: React.FC<PaperListProps> = ({ papers, onRequestSummary, loading = false }) => {
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set());

  const toggleExpand = (pmid: string) => {
    const newExpanded = new Set(expandedPapers);
    if (newExpanded.has(pmid)) {
      newExpanded.delete(pmid);
    } else {
      newExpanded.add(pmid);
    }
    setExpandedPapers(newExpanded);
  };

  if (papers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          📚 관련 논문 ({papers.length}개)
        </h3>
        {onRequestSummary && (
          <button
            onClick={onRequestSummary}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                요약 생성 중...
              </>
            ) : (
              <>
                ✨ AI 요약 생성
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {papers.map((paper) => {
          const isExpanded = expandedPapers.has(paper.pmid);
          const hasAbstract = paper.abstract && paper.abstract.trim().length > 0;

          return (
            <div
              key={paper.pmid}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              {/* Paper Title */}
              <h4 className="font-semibold text-gray-800 mb-2 leading-tight">
                {paper.title || '제목 없음'}
              </h4>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                {paper.pub_date && (
                  <span className="flex items-center gap-1">
                    📅 {paper.pub_date}
                  </span>
                )}
                {paper.journal && (
                  <span className="flex items-center gap-1">
                    📖 {paper.journal}
                  </span>
                )}
                {paper.authors && paper.authors.length > 0 && (
                  <span className="flex items-center gap-1">
                    👤 {paper.authors[0]}{paper.authors.length > 1 ? ` 외 ${paper.authors.length - 1}명` : ''}
                  </span>
                )}
              </div>

              {/* Abstract (Expandable) */}
              {hasAbstract && (
                <>
                  <div className={`text-sm text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {paper.abstract}
                  </div>
                  <button
                    onClick={() => toggleExpand(paper.pmid)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                  >
                    {isExpanded ? '접기 ▲' : '더 보기 ▼'}
                  </button>
                </>
              )}

              {/* Keywords */}
              {paper.keywords && paper.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {paper.keywords.slice(0, 5).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {paper.keywords.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      +{paper.keywords.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Links */}
              <div className="mt-3 flex gap-2">
                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    PubMed ↗
                  </a>
                )}
                {paper.doi && (
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    DOI ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        💡 AI 요약 버튼을 클릭하여 모든 논문의 통합 요약을 생성할 수 있습니다
      </div>
    </div>
  );
};

export default PaperList;
