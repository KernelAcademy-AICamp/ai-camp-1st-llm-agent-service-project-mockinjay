/**
 * PaperList Component
 * 연구 논문 목록 및 확장 가능한 초록 표시
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, FileText, Calendar, BookOpen, User, Sparkles, Loader2, Languages, FileBarChart } from 'lucide-react';
import type { PaperResult } from '../../services/trendsApi';
import { generateOneLineSummaries, translateAbstracts } from '../../services/trendsApi';

interface PaperListProps {
  papers: PaperResult[];
  onRequestSummary?: () => void;
  loading?: boolean;
  language: 'ko' | 'en';
}

type ViewMode = 'original' | 'korean' | 'summary';

const PaperList: React.FC<PaperListProps> = ({ papers, onRequestSummary, loading = false, language }) => {
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set());
  const [oneLineSummaries, setOneLineSummaries] = useState<Map<string, string>>(new Map());
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [summaryLoading, setSummaryLoading] = useState<Set<string>>(new Set());
  const [translationLoading, setTranslationLoading] = useState<Set<string>>(new Set());
  const [viewModes, setViewModes] = useState<Map<string, ViewMode>>(new Map());

  const toggleExpand = (pmid: string) => {
    const newExpanded = new Set(expandedPapers);
    if (newExpanded.has(pmid)) {
      newExpanded.delete(pmid);
    } else {
      newExpanded.add(pmid);
    }
    setExpandedPapers(newExpanded);
  };

  const handleOneLineSummary = async (paper: PaperResult) => {
    if (oneLineSummaries.has(paper.pmid)) {
      return;
    }

    const newLoading = new Set(summaryLoading);
    newLoading.add(paper.pmid);
    setSummaryLoading(newLoading);

    try {
      const response = await generateOneLineSummaries([paper], language);
      // response.summaries is a Record<string, string> mapping PMID to summary
      const summary = response.summaries[paper.pmid];
      if (summary) {
        const newSummaries = new Map(oneLineSummaries);
        newSummaries.set(paper.pmid, summary);
        setOneLineSummaries(newSummaries);
      }
    } catch (error) {
      console.error('Failed to generate one-line summary:', error);
    } finally {
      const newLoading = new Set(summaryLoading);
      newLoading.delete(paper.pmid);
      setSummaryLoading(newLoading);
    }
  };

  const handleTranslate = async (paper: PaperResult) => {
    if (translations.has(paper.pmid)) {
      return;
    }

    if (!paper.abstract) {
      return;
    }

    const newLoading = new Set(translationLoading);
    newLoading.add(paper.pmid);
    setTranslationLoading(newLoading);

    try {
      const response = await translateAbstracts([paper], 'ko');
      // response.translations is a Record<string, string> mapping PMID to translation
      const translated = response.translations[paper.pmid];
      if (translated) {
        const newTranslations = new Map(translations);
        newTranslations.set(paper.pmid, translated);
        setTranslations(newTranslations);
      }
    } catch (error) {
      console.error('Failed to translate abstract:', error);
    } finally {
      const newLoading = new Set(translationLoading);
      newLoading.delete(paper.pmid);
      setTranslationLoading(newLoading);
    }
  };

  const handleViewModeChange = async (paper: PaperResult, mode: ViewMode) => {
    // 한글 초록 버튼 클릭 시 번역 자동 실행
    if (mode === 'korean' && !translations.has(paper.pmid) && paper.abstract) {
      await handleTranslate(paper);
    }

    // AI 한글 요약 버튼 클릭 시 요약 자동 실행
    if (mode === 'summary' && !oneLineSummaries.has(paper.pmid)) {
      await handleOneLineSummary(paper);
    }

    const newModes = new Map(viewModes);
    newModes.set(paper.pmid, mode);
    setViewModes(newModes);
  };

  const getCurrentContent = (paper: PaperResult): string => {
    const mode = viewModes.get(paper.pmid) || 'original';

    switch (mode) {
      case 'korean':
        return translations.get(paper.pmid) || paper.abstract || '';
      case 'summary':
        return oneLineSummaries.get(paper.pmid) || '';
      case 'original':
      default:
        return paper.abstract || '';
    }
  };

  const t = {
    title: language === 'ko' ? '📚 관련 논문' : '📚 Related Papers',
    count: language === 'ko' ? '개' : ' papers',
    allPapersSummary: language === 'ko' ? '5개 논문 요약 보고서' : 'Summary Report (All Papers)',
    generating: language === 'ko' ? '생성 중...' : 'Generating...',
    noTitle: language === 'ko' ? '제목 없음' : 'No title',
    showMore: language === 'ko' ? '더 보기' : 'Show more',
    showLess: language === 'ko' ? '접기' : 'Show less',
    others: language === 'ko' ? '명' : ' others',
    originalAbstract: language === 'ko' ? '영어 초록' : 'Original Abstract',
    koreanAbstract: language === 'ko' ? '한글 초록' : 'Korean Abstract',
    aiSummary: language === 'ko' ? 'AI 한글 요약' : 'AI Summary',
    noAbstract: language === 'ko' ? '초록이 제공되지 않습니다' : 'Abstract not available',
    loading: language === 'ko' ? '로딩 중...' : 'Loading...',
  };

  if (papers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FileText className="text-orange-500" />
          {t.title} ({papers.length}{t.count})
        </h3>
        {onRequestSummary && (
          <button
            onClick={onRequestSummary}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
              hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400
              dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed
              transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {t.generating}
              </>
            ) : (
              <>
                <FileBarChart size={18} />
                {t.allPapersSummary}
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {papers.map((paper) => {
          const isExpanded = expandedPapers.has(paper.pmid);
          const hasAbstract = paper.abstract && paper.abstract.trim().length > 0;
          const currentMode = viewModes.get(paper.pmid) || 'original';
          const currentContent = getCurrentContent(paper);
          const isLoadingSummary = summaryLoading.has(paper.pmid);
          const isLoadingTranslation = translationLoading.has(paper.pmid);

          return (
            <div
              key={paper.pmid}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4
                hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              {/* Paper Title */}
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2 leading-tight">
                {paper.title || t.noTitle}
              </h4>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                {paper.pub_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {paper.pub_date}
                  </span>
                )}
                {paper.journal && (
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {paper.journal}
                  </span>
                )}
                {paper.authors && paper.authors.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {paper.authors[0]}
                    {paper.authors.length > 1 && ` + ${paper.authors.length - 1}${t.others}`}
                  </span>
                )}
              </div>

              {/* View Mode Buttons */}
              {hasAbstract && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleViewModeChange(paper, 'korean')}
                    disabled={isLoadingTranslation}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 font-medium
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${currentMode === 'korean' || currentMode === 'original'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {isLoadingTranslation ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Languages size={14} />
                    )}
                    {t.koreanAbstract}
                  </button>

                  <button
                    onClick={() => handleViewModeChange(paper, 'summary')}
                    disabled={isLoadingSummary}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 font-medium
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${currentMode === 'summary'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {isLoadingSummary ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {t.aiSummary}
                  </button>
                </div>
              )}

              {/* Abstract Content */}
              {hasAbstract ? (
                <>
                  {(isLoadingSummary && currentMode === 'summary') ||
                   (isLoadingTranslation && currentMode === 'korean') ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4">
                      <Loader2 size={16} className="animate-spin" />
                      {t.loading}
                    </div>
                  ) : currentContent ? (
                    <>
                      <div
                        className={`text-sm leading-relaxed
                          ${currentMode === 'summary'
                            ? 'text-purple-800 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                          }
                          ${isExpanded ? '' : 'line-clamp-3'}`}
                      >
                        {currentContent}
                      </div>
                      <button
                        onClick={() => toggleExpand(paper.pmid)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300
                          text-sm font-medium mt-2 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            {t.showLess} <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            {t.showMore} <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                      {currentMode === 'summary' ? t.loading : t.noAbstract}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                  {t.noAbstract}
                </div>
              )}

              {/* Keywords */}
              {paper.keywords && paper.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {paper.keywords.slice(0, 5).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30
                        text-purple-700 dark:text-purple-300 text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {paper.keywords.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700
                      text-gray-600 dark:text-gray-400 text-xs rounded">
                      +{paper.keywords.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Links */}
              <div className="mt-3 flex gap-3">
                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300
                      flex items-center gap-1"
                  >
                    PubMed <ExternalLink size={12} />
                  </a>
                )}
                {paper.doi && (
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300
                      flex items-center gap-1"
                  >
                    DOI <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaperList;
