/**
 * SummaryPanel Component
 * AI 생성 요약 표시
 */
import React from 'react';
import { FileText, Sparkles, Loader2, AlertCircle, BookOpen, TrendingUp, Stethoscope, Lightbulb } from 'lucide-react';
import type { PaperResult, MultiplePaperSummary } from '../../services/trendsApi';

interface SummaryPanelProps {
  papers: PaperResult[];
  aiSummary: MultiplePaperSummary | null;
  loading?: boolean;
  language: 'ko' | 'en';
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ papers, aiSummary, loading = false, language }) => {
  const t = {
    title: language === 'ko' ? '📖 논문 요약' : '📖 Paper Summary',
    generating: language === 'ko' ? 'AI가 논문을 분석하고 요약을 생성하는 중입니다...' : 'AI is analyzing papers and generating summary...',
    notGenerated: language === 'ko' ? '✨ AI 요약이 아직 생성되지 않았습니다' : '✨ AI summary not yet generated',
    clickToGenerate: language === 'ko' ? '논문 목록의 "AI 요약 생성" 버튼을 클릭하세요' : 'Click "Generate AI Summary" button in the paper list',
    failed: language === 'ko' ? '❌ 요약 생성 실패' : '❌ Summary generation failed',
    overview: language === 'ko' ? '📝 전체 개요' : '📝 Overview',
    keyThemes: language === 'ko' ? '🔑 주요 연구 주제' : '🔑 Key Research Themes',
    researchTrends: language === 'ko' ? '📈 연구 동향' : '📈 Research Trends',
    clinicalImplications: language === 'ko' ? '🏥 임상적 시사점' : '🏥 Clinical Implications',
    recommendations: language === 'ko' ? '💡 향후 연구 방향' : '💡 Future Research Directions',
    papersAnalyzed: language === 'ko' ? '📊 분석된 논문:' : '📊 Papers analyzed:',
    tokensUsed: language === 'ko' ? '🔢 사용된 토큰:' : '🔢 Tokens used:',
    outOf: language === 'ko' ? '전체' : 'out of',
  };

  if (papers.length === 0) {
    return null;
  }

  // 텍스트 포맷팅 함수: **bold** 처리 및 줄바꿈
  const formatText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <div key={i} className={`${line.trim() === '' ? 'h-2' : 'mb-1'}`}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </div>
    ));
  };

  const renderAiView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="animate-spin text-green-600 dark:text-green-400" size={48} />
          <p className="text-gray-600 dark:text-gray-400">{t.generating}</p>
        </div>
      );
    }

    if (!aiSummary) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Sparkles size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="mb-4">{t.notGenerated}</p>
          <p className="text-sm">{t.clickToGenerate}</p>
        </div>
      );
    }

    if (aiSummary.error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 font-medium flex items-center gap-2">
            <AlertCircle size={18} />
            {t.failed}
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{aiSummary.error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overview */}
        {aiSummary.overview && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-500" />
              {t.overview}
            </h4>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {formatText(aiSummary.overview)}
            </div>
          </div>
        )}

        {/* Key Themes */}
        {aiSummary.key_themes && aiSummary.key_themes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <FileText size={18} className="text-purple-500" />
              {t.keyThemes}
            </h4>
            <ul className="space-y-1">
              {aiSummary.key_themes.map((theme, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{formatText(theme)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Research Trends */}
        {aiSummary.research_trends && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              {t.researchTrends}
            </h4>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {formatText(aiSummary.research_trends)}
            </div>
          </div>
        )}

        {/* Clinical Implications */}
        {aiSummary.clinical_implications && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Stethoscope size={18} className="text-red-500" />
              {t.clinicalImplications}
            </h4>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {formatText(aiSummary.clinical_implications)}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-500" />
              {t.recommendations}
            </h4>
            <ul className="space-y-1">
              {aiSummary.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{formatText(rec)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          <p>
            {t.papersAnalyzed} {aiSummary.papers_analyzed}
            {language === 'ko' ? '개' : ''}
            {aiSummary.total_papers !== aiSummary.papers_analyzed &&
              ` (${t.outOf} ${aiSummary.total_papers}${language === 'ko' ? '개 중' : ''})`}
          </p>
          {aiSummary.tokens_used && (
            <p>
              {t.tokensUsed} {aiSummary.tokens_used.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.title}</h3>
      </div>

      <div className="mt-4">{renderAiView()}</div>
    </div>
  );
};

export default SummaryPanel;
