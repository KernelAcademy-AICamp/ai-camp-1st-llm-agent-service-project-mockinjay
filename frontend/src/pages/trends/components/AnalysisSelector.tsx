/**
 * AnalysisSelector Component
 * Choose which type of trend analysis to perform
 */
import React from 'react';
import type { AnalysisType } from '../types';

interface AnalysisOption {
  type: AnalysisType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface AnalysisSelectorProps {
  onSelect: (type: AnalysisType) => void;
  hasMultipleKeywords: boolean;
  loading?: boolean;
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    type: 'temporal',
    title: '시간별 추세',
    description: '연도별 논문 발행 트렌드를 분석합니다. 연구 주제의 시간에 따른 관심도 변화를 확인할 수 있습니다.',
    icon: '📈',
    color: 'blue'
  },
  {
    type: 'geographic',
    title: '지역별 분포',
    description: '국가 및 지역별 연구 기여도를 분석합니다. 전 세계 어느 지역에서 활발히 연구되는지 확인할 수 있습니다.',
    icon: '🌍',
    color: 'green'
  },
  {
    type: 'mesh',
    title: 'MeSH 카테고리',
    description: '의학 주제 분류(MeSH)를 분석합니다. 연구 주제의 카테고리 분포와 연구 관점을 파악할 수 있습니다.',
    icon: '🏷️',
    color: 'purple'
  },
  {
    type: 'compare',
    title: '키워드 비교',
    description: '여러 키워드의 트렌드를 비교합니다. 다양한 연구 주제의 관심도를 시간에 따라 비교할 수 있습니다.',
    icon: '🔄',
    color: 'orange'
  }
];

const AnalysisSelector: React.FC<AnalysisSelectorProps> = ({
  onSelect,
  hasMultipleKeywords,
  loading = false
}) => {
  const getCardClasses = (color: string, disabled: boolean) => {
    const baseClasses = 'p-6 rounded-lg border-2 transition-all cursor-pointer';
    const hoverClasses = disabled ? '' : 'hover:shadow-lg hover:-translate-y-1';

    const colorClasses = {
      blue: disabled
        ? 'border-gray-200 bg-gray-50'
        : 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100',
      green: disabled
        ? 'border-gray-200 bg-gray-50'
        : 'border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100',
      purple: disabled
        ? 'border-gray-200 bg-gray-50'
        : 'border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100',
      orange: disabled
        ? 'border-gray-200 bg-gray-50'
        : 'border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100'
    };

    return `${baseClasses} ${hoverClasses} ${colorClasses[color as keyof typeof colorClasses]}`;
  };

  const handleSelect = (type: AnalysisType, disabled: boolean) => {
    if (!disabled && !loading) {
      onSelect(type);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 분석 유형 선택</h2>
        <p className="text-gray-600">
          원하는 분석 유형을 선택하세요. 각 분석은 다양한 인사이트를 제공합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ANALYSIS_OPTIONS.map((option) => {
          const isCompareAnalysis = option.type === 'compare';
          const disabled = isCompareAnalysis && !hasMultipleKeywords;

          return (
            <div
              key={option.type}
              onClick={() => handleSelect(option.type, disabled)}
              className={getCardClasses(option.color, disabled)}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !disabled) {
                  handleSelect(option.type, disabled);
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{option.icon}</div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
                    {option.title}
                  </h3>
                  <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.description}
                  </p>
                  {disabled && (
                    <div className="mt-2 inline-block px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                      ⚠️ 비교 키워드 필요 (2-4개)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span>분석 중...</span>
        </div>
      )}

      {/* Help Box */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
        <p className="font-medium text-gray-700 mb-2">📖 분석 유형 가이드:</p>
        <ul className="space-y-1 text-gray-600">
          <li>• <strong>시간별 추세:</strong> 연구 주제의 인기도가 시간에 따라 어떻게 변화했는지 확인</li>
          <li>• <strong>지역별 분포:</strong> 어느 국가에서 해당 주제를 가장 많이 연구하는지 파악</li>
          <li>• <strong>MeSH 카테고리:</strong> 의학적 관점에서 주제가 어떤 카테고리에 속하는지 분석</li>
          <li>• <strong>키워드 비교:</strong> 여러 연구 주제의 트렌드를 동시에 비교 (비교 키워드 입력 필요)</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalysisSelector;
