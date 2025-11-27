/**
 * QueryBuilder Component
 * 트렌드 분석을 위한 검색 인터페이스
 */
import React, { useState } from 'react';
import { Search, Plus, X, Calendar } from 'lucide-react';

interface QueryBuilderProps {
  onSubmit: (query: string, keywords: string[], startYear: number, endYear: number) => void;
  loading?: boolean;
  language: 'ko' | 'en';
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({ onSubmit, loading = false, language }) => {
  const [query, setQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [startYear, setStartYear] = useState(2015);
  const [endYear, setEndYear] = useState(2024);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleAddKeyword = () => {
    if (keywordInput.trim() && keywords.length < 4 && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || keywords.length > 0) {
      const finalQuery = query.trim() || keywords[0] || '';
      onSubmit(finalQuery, keywords, startYear, endYear);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const t = {
    title: language === 'ko' ? '🔍 트렌드 검색' : '🔍 Trend Search',
    placeholder: language === 'ko' ? '예: chronic kidney disease, diabetes mellitus' : 'e.g., chronic kidney disease, diabetes mellitus',
    label: language === 'ko' ? '검색 키워드' : 'Search Keywords',
    hint: language === 'ko' ? 'PubMed 논문 검색을 위한 키워드를 입력하세요' : 'Enter keywords for PubMed paper search',
    advanced: language === 'ko' ? '고급 옵션' : 'Advanced Options',
    compareLabel: language === 'ko' ? '비교 키워드 (최대 4개)' : 'Compare Keywords (max 4)',
    comparePlaceholder: language === 'ko' ? '키워드 입력 후 Enter 또는 추가 버튼 클릭' : 'Enter keyword and press Enter or Add',
    add: language === 'ko' ? '추가' : 'Add',
    startYear: language === 'ko' ? '시작 연도' : 'Start Year',
    endYear: language === 'ko' ? '종료 연도' : 'End Year',
    submit: language === 'ko' ? '🚀 트렌드 분석 시작' : '🚀 Start Trend Analysis',
    searching: language === 'ko' ? '검색 중...' : 'Searching...',
    tips: language === 'ko' ? '💡 팁:' : '💡 Tips:',
    tip1: language === 'ko' ? '단일 키워드 검색 시 다양한 분석을 선택할 수 있습니다' : 'Single keyword search allows various analysis types',
    tip2: language === 'ko' ? '비교 키워드를 추가하면 키워드 비교 분석이 가능합니다' : 'Adding compare keywords enables keyword comparison',
    tip3: language === 'ko' ? '검색어는 영어로 입력하면 더 많은 결과를 얻을 수 있습니다' : 'English keywords yield more results',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t.title}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Query Input */}
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.label}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.placeholder}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.hint}</p>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center gap-1"
        >
          {showAdvanced ? '▼' : '▶'} {t.advanced}
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {/* Multiple Keywords for Comparison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.compareLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.comparePlaceholder}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-purple-500"
                  disabled={loading || keywords.length >= 4}
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  disabled={loading || keywords.length >= 4 || !keywordInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700
                    disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                    flex items-center gap-1"
                >
                  <Plus size={16} />
                  {t.add}
                </button>
              </div>

              {/* Keyword Tags */}
              {keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30
                        text-purple-800 dark:text-purple-300 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(index)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  {t.startYear}
                </label>
                <input
                  id="startYear"
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(parseInt(e.target.value))}
                  min={1950}
                  max={currentYear}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  {t.endYear}
                </label>
                <input
                  id="endYear"
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(parseInt(e.target.value))}
                  min={startYear}
                  max={currentYear}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (!query.trim() && keywords.length === 0)}
          className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700
            disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              {t.searching}
            </>
          ) : (
            t.submit
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium mb-1">{t.tips}</p>
        <ul className="list-disc list-inside space-y-1">
          <li>{t.tip1}</li>
          <li>{t.tip2}</li>
          <li>{t.tip3}</li>
        </ul>
      </div>
    </div>
  );
};

export default QueryBuilder;
