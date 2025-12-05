/**
 * AnalysisSelector Component
 * 트렌드 분석 유형 선택
 */
import React from 'react';
import { TrendingUp, Globe, Tag, GitCompare, Loader2 } from 'lucide-react';
import type { AnalysisType } from '../../services/trendsApi';

interface AnalysisOption {
  type: AnalysisType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface AnalysisSelectorProps {
  onSelect: (type: AnalysisType) => void;
  hasMultipleKeywords: boolean;
  loading?: boolean;
  language: 'ko' | 'en';
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    type: 'temporal',
    title: '시간별 추세',
    titleEn: 'Temporal Trends',
    description: '연도별 논문 발행 트렌드를 분석합니다. 연구 주제의 시간에 따른 관심도 변화를 확인할 수 있습니다.',
    descriptionEn: 'Analyze publication trends over time. See how interest in your research topic has changed.',
    icon: <TrendingUp size={28} />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
  },
  {
    type: 'geographic',
    title: '지역별 분포',
    titleEn: 'Geographic Distribution',
    description: '국가 및 지역별 연구 기여도를 분석합니다. 전 세계 어느 지역에서 활발히 연구되는지 확인할 수 있습니다.',
    descriptionEn: 'Analyze research contribution by country/region. See where research is most active globally.',
    icon: <Globe size={28} />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
  },
  {
    type: 'mesh',
    title: 'MeSH 카테고리',
    titleEn: 'MeSH Categories',
    description: '의학 주제 분류(MeSH)를 분석합니다. 연구 주제의 카테고리 분포와 연구 관점을 파악할 수 있습니다.',
    descriptionEn: 'Analyze Medical Subject Headings (MeSH). Understand the categorical distribution of research.',
    icon: <Tag size={28} />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
  },
  {
    type: 'compare',
    title: '키워드 비교',
    titleEn: 'Keyword Comparison',
    description: '여러 키워드의 트렌드를 비교합니다. 다양한 연구 주제의 관심도를 시간에 따라 비교할 수 있습니다.',
    descriptionEn: 'Compare trends across multiple keywords. See how different topics compare over time.',
    icon: <GitCompare size={28} />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600',
  },
];

const AnalysisSelector: React.FC<AnalysisSelectorProps> = ({
  onSelect,
  hasMultipleKeywords,
  loading = false,
  language,
}) => {
  const handleSelect = (type: AnalysisType, disabled: boolean) => {
    if (!disabled && !loading) {
      onSelect(type);
    }
  };

  const t = {
    title: language === 'ko' ? '📊 분석 유형 선택' : '📊 Select Analysis Type',
    subtitle: language === 'ko'
      ? '원하는 분석 유형을 선택하세요. 각 분석은 다양한 인사이트를 제공합니다.'
      : 'Choose an analysis type. Each provides different insights.',
    analyzing: language === 'ko' ? '분석 중...' : 'Analyzing...',
    needsKeywords: language === 'ko' ? '⚠️ 비교 키워드 필요 (2-4개)' : '⚠️ Needs compare keywords (2-4)',
    guide: language === 'ko' ? '📖 분석 유형 가이드:' : '📖 Analysis Type Guide:',
    guide1: language === 'ko'
      ? '시간별 추세: 연구 주제의 인기도가 시간에 따라 어떻게 변화했는지 확인'
      : 'Temporal Trends: See how popularity has changed over time',
    guide2: language === 'ko'
      ? '지역별 분포: 어느 국가에서 해당 주제를 가장 많이 연구하는지 파악'
      : 'Geographic: See which countries research this topic most',
    guide3: language === 'ko'
      ? 'MeSH 카테고리: 의학적 관점에서 주제가 어떤 카테고리에 속하는지 분석'
      : 'MeSH Categories: Analyze medical subject categorization',
    guide4: language === 'ko'
      ? '키워드 비교: 여러 연구 주제의 트렌드를 동시에 비교 (비교 키워드 입력 필요)'
      : 'Keyword Comparison: Compare multiple topics (requires compare keywords)',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ANALYSIS_OPTIONS.map((option) => {
          const isCompareAnalysis = option.type === 'compare';
          const disabled = isCompareAnalysis && !hasMultipleKeywords;

          return (
            <div
              key={option.type}
              onClick={() => handleSelect(option.type, disabled)}
              className={`p-6 rounded-lg border-2 transition-all cursor-pointer
                ${disabled
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                  : `${option.borderColor} ${option.bgColor}`
                }
                ${!disabled && 'hover:shadow-lg hover:-translate-y-1'}
              `}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !disabled) {
                  handleSelect(option.type, disabled);
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className={`${disabled ? 'text-gray-400 dark:text-gray-500' : option.color}`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white'
                  }`}>
                    {language === 'ko' ? option.title : option.titleEn}
                  </h3>
                  <p className={`text-sm ${
                    disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {language === 'ko' ? option.description : option.descriptionEn}
                  </p>
                  {disabled && (
                    <div className="mt-2 inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700
                      text-gray-600 dark:text-gray-400 text-xs rounded">
                      {t.needsKeywords}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="animate-spin" size={20} />
          <span>{t.analyzing}</span>
        </div>
      )}

      {/* Help Box */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t.guide}</p>
        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
          <li>• <strong>{language === 'ko' ? '시간별 추세:' : 'Temporal:'}</strong> {t.guide1.split(':')[1]}</li>
          <li>• <strong>{language === 'ko' ? '지역별 분포:' : 'Geographic:'}</strong> {t.guide2.split(':')[1]}</li>
          <li>• <strong>MeSH:</strong> {t.guide3.split(':')[1]}</li>
          <li>• <strong>{language === 'ko' ? '키워드 비교:' : 'Comparison:'}</strong> {t.guide4.split(':')[1]}</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalysisSelector;
