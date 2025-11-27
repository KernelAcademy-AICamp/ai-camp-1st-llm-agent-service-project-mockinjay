/**
 * PaperCard Component
 * Individual paper card with bookmark and comparison features
 */
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  BookOpen,
  User,
  Sparkles,
  Loader2,
  Languages,
  Bookmark,
  Check,
} from 'lucide-react';
import type { PaperResult } from '../../services/trendsApi';
import { generateOneLineSummaries, translateAbstracts } from '../../services/trendsApi';

interface PaperCardProps {
  paper: PaperResult;
  language: 'ko' | 'en';
  isBookmarked?: boolean;
  isSelected?: boolean;
  onToggleBookmark?: (paper: PaperResult) => void;
  onToggleSelect?: (paper: PaperResult) => void;
  showCheckbox?: boolean;
  bookmarkLoading?: boolean;
}

type ViewMode = 'original' | 'korean' | 'summary';

const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  language,
  isBookmarked = false,
  isSelected = false,
  onToggleBookmark,
  onToggleSelect,
  showCheckbox = false,
  bookmarkLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [oneLineSummary, setOneLineSummary] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('original');

  const t = {
    noTitle: language === 'ko' ? '제목 없음' : 'No title',
    showMore: language === 'ko' ? '더 보기' : 'Show more',
    showLess: language === 'ko' ? '접기' : 'Show less',
    others: language === 'ko' ? '명' : ' others',
    koreanAbstract: language === 'ko' ? '한글 초록' : 'Korean Abstract',
    aiSummary: language === 'ko' ? 'AI 한글 요약' : 'AI Summary',
    noAbstract: language === 'ko' ? '초록이 제공되지 않습니다' : 'Abstract not available',
    loading: language === 'ko' ? '로딩 중...' : 'Loading...',
    bookmarkAdd: language === 'ko' ? '북마크 추가' : 'Add bookmark',
    bookmarkRemove: language === 'ko' ? '북마크 제거' : 'Remove bookmark',
    compareSelect: language === 'ko' ? '비교 선택' : 'Select for comparison',
  };

  const hasAbstract = paper.abstract && paper.abstract.trim().length > 0;

  const handleOneLineSummary = async () => {
    if (oneLineSummary) return;

    setSummaryLoading(true);

    try {
      const response = await generateOneLineSummaries([paper], language);
      const summary = response.summaries[paper.pmid];
      if (summary) {
        setOneLineSummary(summary);
      }
    } catch (error) {
      console.error('Failed to generate one-line summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (translation || !paper.abstract) return;

    setTranslationLoading(true);

    try {
      const response = await translateAbstracts([paper], 'ko');
      const translated = response.translations[paper.pmid];
      if (translated) {
        setTranslation(translated);
      }
    } catch (error) {
      console.error('Failed to translate abstract:', error);
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleViewModeChange = async (mode: ViewMode) => {
    if (mode === 'korean' && !translation && paper.abstract) {
      await handleTranslate();
    }

    if (mode === 'summary' && !oneLineSummary) {
      await handleOneLineSummary();
    }

    setViewMode(mode);
  };

  const getCurrentContent = (): string => {
    switch (viewMode) {
      case 'korean':
        return translation || paper.abstract || '';
      case 'summary':
        return oneLineSummary || '';
      case 'original':
      default:
        return paper.abstract || '';
    }
  };

  const currentContent = getCurrentContent();

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
      }`}
    >
      {/* Header with Title and Actions */}
      <div className="flex items-start gap-3 mb-2">
        {/* Checkbox for comparison */}
        {showCheckbox && onToggleSelect && (
          <div className="flex-shrink-0 pt-1">
            <button
              onClick={() => onToggleSelect(paper)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-purple-600 border-purple-600'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
              }`}
              aria-label={t.compareSelect}
            >
              {isSelected && <Check size={14} className="text-white" />}
            </button>
          </div>
        )}

        {/* Title */}
        <h4 className="font-semibold text-gray-800 dark:text-white flex-1 leading-tight">
          {paper.title || t.noTitle}
        </h4>

        {/* Bookmark Button */}
        {onToggleBookmark && (
          <button
            onClick={() => onToggleBookmark(paper)}
            disabled={bookmarkLoading}
            className={`flex-shrink-0 p-1 rounded transition-colors ${
              isBookmarked
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isBookmarked ? t.bookmarkRemove : t.bookmarkAdd}
            aria-label={isBookmarked ? t.bookmarkRemove : t.bookmarkAdd}
          >
            {bookmarkLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
            )}
          </button>
        )}
      </div>

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
            onClick={() => handleViewModeChange('korean')}
            disabled={translationLoading}
            className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                viewMode === 'korean' || viewMode === 'original'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {translationLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Languages size={14} />
            )}
            {t.koreanAbstract}
          </button>

          <button
            onClick={() => handleViewModeChange('summary')}
            disabled={summaryLoading}
            className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                viewMode === 'summary'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {summaryLoading ? (
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
          {(summaryLoading && viewMode === 'summary') ||
          (translationLoading && viewMode === 'korean') ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4">
              <Loader2 size={16} className="animate-spin" />
              {t.loading}
            </div>
          ) : currentContent ? (
            <>
              <div
                className={`text-sm leading-relaxed
                  ${
                    viewMode === 'summary'
                      ? 'text-purple-800 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                  ${isExpanded ? '' : 'line-clamp-3'}`}
              >
                {currentContent}
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
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
              {viewMode === 'summary' ? t.loading : t.noAbstract}
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
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
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
};

export default PaperCard;
