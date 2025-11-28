/**
 * PaperComparison Component
 * 논문 비교 (한글 번역 지원)
 */
import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Users, BookOpen, ExternalLink, Loader2, Languages } from 'lucide-react';
import type { PaperResult } from '../../services/trendsApi';
import { translateToKorean } from '../../services/translateApi';

interface PaperComparisonProps {
  papers: PaperResult[];
  onClose: () => void;
}

interface TranslatedPaper {
  title: string;
  findings: string[];
  keywords: string[];
}

/**
 * Extract key findings from abstract
 */
function extractKeyFindings(abstract: string): string[] {
  if (!abstract) return [];

  const keywordPatterns = [
    /result(s)?\s+show(ed|s)?/i,
    /we found/i,
    /demonstrate(d|s)?/i,
    /reveal(ed|s)?/i,
    /indicate(d|s)?/i,
    /suggest(ed|s)?/i,
    /conclude(d)?/i,
    /conclusion(s)?/i,
  ];

  const sentences = abstract.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const findings: string[] = [];

  for (const sentence of sentences) {
    if (findings.length >= 3) break;
    if (keywordPatterns.some((pattern) => pattern.test(sentence))) {
      findings.push(sentence.trim());
    }
  }

  if (findings.length === 0 && sentences.length > 0) {
    return sentences.slice(0, 2).map((s) => s.trim());
  }

  return findings;
}

/**
 * Find common themes across papers
 */
function findCommonThemes(papers: PaperResult[]): string[] {
  const allKeywords = papers.flatMap((p) => p.keywords || []);
  const keywordCounts: Record<string, number> = {};

  allKeywords.forEach((keyword) => {
    const normalized = keyword.toLowerCase();
    keywordCounts[normalized] = (keywordCounts[normalized] || 0) + 1;
  });

  return Object.entries(keywordCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword]) => keyword);
}

/**
 * Identify unique aspects of each paper
 */
function identifyDifferences(papers: PaperResult[]): Record<string, string[]> {
  const differences: Record<string, string[]> = {};

  papers.forEach((paper) => {
    const uniqueKeywords =
      paper.keywords?.filter((keyword) => {
        const normalized = keyword.toLowerCase();
        const count = papers.filter((p) =>
          p.keywords?.some((k) => k.toLowerCase() === normalized)
        ).length;
        return count === 1;
      }) || [];

    differences[paper.pmid] = uniqueKeywords.slice(0, 3);
  });

  return differences;
}

const PaperComparison: React.FC<PaperComparisonProps> = ({ papers, onClose }) => {
  const [translations, setTranslations] = useState<Map<string, TranslatedPaper>>(new Map());
  const [translatedThemes, setTranslatedThemes] = useState<string[]>([]);
  const [translatedDifferences, setTranslatedDifferences] = useState<Record<string, string[]>>({});
  const [isTranslating, setIsTranslating] = useState(true);

  const t = {
    title: '논문 비교',
    compareCount: '개 논문 비교',
    paperTitle: '제목',
    authors: '저자',
    journal: '저널',
    pubDate: '발행일',
    keyFindings: '주요 결과',
    commonThemes: '공통 주제',
    uniqueAspects: '고유 특성',
    viewPaper: '논문 보기',
    noKeyFindings: '주요 결과를 찾을 수 없습니다',
    noCommonThemes: '공통 주제가 없습니다',
    noUniqueAspects: '고유 특성이 없습니다',
    translating: '번역 중...',
  };

  // 번역 실행
  useEffect(() => {
    const translateAll = async () => {
      setIsTranslating(true);

      try {
        // 공통 주제 번역
        const commonThemes = findCommonThemes(papers);
        const translatedThemesList: string[] = [];
        for (const theme of commonThemes) {
          const translated = await translateToKorean(theme);
          translatedThemesList.push(translated);
        }
        setTranslatedThemes(translatedThemesList);

        // 각 논문 번역
        const newTranslations = new Map<string, TranslatedPaper>();
        const differences = identifyDifferences(papers);
        const newDifferences: Record<string, string[]> = {};

        for (const paper of papers) {
          // 제목 번역
          const translatedTitle = await translateToKorean(paper.title);

          // 주요 결과 번역
          const findings = extractKeyFindings(paper.abstract || '');
          const translatedFindings: string[] = [];
          for (const finding of findings) {
            const translated = await translateToKorean(finding);
            translatedFindings.push(translated);
          }

          // 고유 키워드 번역
          const uniqueKeywords = differences[paper.pmid] || [];
          const translatedKeywords: string[] = [];
          for (const keyword of uniqueKeywords) {
            const translated = await translateToKorean(keyword);
            translatedKeywords.push(translated);
          }

          newTranslations.set(paper.pmid, {
            title: translatedTitle,
            findings: translatedFindings,
            keywords: translatedKeywords,
          });

          newDifferences[paper.pmid] = translatedKeywords;
        }

        setTranslations(newTranslations);
        setTranslatedDifferences(newDifferences);
      } catch (err) {
        console.error('번역 오류:', err);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [papers]);

  const getTranslatedTitle = (paper: PaperResult): string => {
    return translations.get(paper.pmid)?.title || paper.title;
  };

  const getTranslatedFindings = (paper: PaperResult): string[] => {
    const translated = translations.get(paper.pmid)?.findings;
    if (translated && translated.length > 0) return translated;
    return extractKeyFindings(paper.abstract || '');
  };

  const getTranslatedKeywords = (pmid: string): string[] => {
    return translatedDifferences[pmid] || [];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText size={28} />
            {t.title} ({papers.length}{t.compareCount})
          </h2>
          <div className="flex items-center gap-4">
            {isTranslating && (
              <span className="flex items-center gap-2 text-sm bg-purple-700 px-3 py-1 rounded-full">
                <Loader2 size={14} className="animate-spin" />
                <Languages size={14} />
                {t.translating}
              </span>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="닫기"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Common Themes Section */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-3">
              {t.commonThemes}
            </h3>
            {translatedThemes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {translatedThemes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            ) : isTranslating ? (
              <div className="flex items-center gap-2 text-green-600">
                <Loader2 size={16} className="animate-spin" />
                {t.translating}
              </div>
            ) : (
              <p className="text-sm text-green-600 dark:text-green-400 italic">
                {t.noCommonThemes}
              </p>
            )}
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-40">
                    항목
                  </th>
                  {papers.map((paper, idx) => (
                    <th
                      key={paper.pmid}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200"
                    >
                      논문 {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Title Row */}
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {t.paperTitle}
                  </td>
                  {papers.map((paper) => (
                    <td
                      key={paper.pmid}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-800 dark:text-gray-200"
                    >
                      <div className="font-semibold mb-2">
                        {isTranslating ? (
                          <span className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            {paper.title}
                          </span>
                        ) : (
                          getTranslatedTitle(paper)
                        )}
                      </div>
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                          {t.viewPaper} <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Authors Row */}
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Users size={16} className="inline mr-2" />
                    {t.authors}
                  </td>
                  {papers.map((paper) => (
                    <td
                      key={paper.pmid}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {paper.authors && paper.authors.length > 0 ? (
                        <div>
                          {paper.authors.slice(0, 3).join(', ')}
                          {paper.authors.length > 3 && (
                            <span className="text-gray-500"> 외 {paper.authors.length - 3}명</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Publication Date Row */}
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Calendar size={16} className="inline mr-2" />
                    {t.pubDate}
                  </td>
                  {papers.map((paper) => (
                    <td
                      key={paper.pmid}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {paper.pub_date || <span className="text-gray-400 italic">-</span>}
                    </td>
                  ))}
                </tr>

                {/* Journal Row */}
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <BookOpen size={16} className="inline mr-2" />
                    {t.journal}
                  </td>
                  {papers.map((paper) => (
                    <td
                      key={paper.pmid}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {paper.journal || <span className="text-gray-400 italic">-</span>}
                    </td>
                  ))}
                </tr>

                {/* Key Findings Row */}
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 align-top">
                    {t.keyFindings}
                  </td>
                  {papers.map((paper) => {
                    const findings = getTranslatedFindings(paper);
                    return (
                      <td
                        key={paper.pmid}
                        className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {isTranslating ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 size={14} className="animate-spin" />
                            {t.translating}
                          </div>
                        ) : findings.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {findings.map((finding, idx) => (
                              <li key={idx} className="text-xs">
                                {finding}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 italic text-xs">{t.noKeyFindings}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Unique Aspects Row */}
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 align-top">
                    {t.uniqueAspects}
                  </td>
                  {papers.map((paper) => {
                    const uniqueKeywords = getTranslatedKeywords(paper.pmid);
                    return (
                      <td
                        key={paper.pmid}
                        className="border border-gray-300 dark:border-gray-600 px-4 py-3"
                      >
                        {isTranslating ? (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Loader2 size={12} className="animate-spin" />
                            {t.translating}
                          </div>
                        ) : uniqueKeywords.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {uniqueKeywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            {t.noUniqueAspects}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaperComparison;
