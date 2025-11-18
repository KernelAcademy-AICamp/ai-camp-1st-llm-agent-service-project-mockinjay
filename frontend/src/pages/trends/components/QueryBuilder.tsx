/**
 * QueryBuilder Component
 * Search interface for trends analysis
 */
import React, { useState } from 'react';

interface QueryBuilderProps {
  onSubmit: (query: string, keywords: string[], startYear: number, endYear: number) => void;
  loading?: boolean;
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({ onSubmit, loading = false }) => {
  const [query, setQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [startYear, setStartYear] = useState(2015);
  const [endYear, setEndYear] = useState(2024);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleAddKeyword = () => {
    if (keywordInput.trim() && keywords.length < 4) {
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🔍 트렌드 검색</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Query Input */}
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
            검색 키워드
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: chronic kidney disease, diabetes mellitus"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            PubMed 논문 검색을 위한 키워드를 입력하세요
          </p>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          {showAdvanced ? '▼' : '▶'} 고급 옵션
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Multiple Keywords for Comparison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비교 키워드 (최대 4개)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="키워드 입력 후 Enter 또는 추가 버튼 클릭"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={loading || keywords.length >= 4}
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  disabled={loading || keywords.length >= 4 || !keywordInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>

              {/* Keyword Tags */}
              {keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(index)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 mb-2">
                  시작 연도
                </label>
                <input
                  id="startYear"
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(parseInt(e.target.value))}
                  min={1950}
                  max={currentYear}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 mb-2">
                  종료 연도
                </label>
                <input
                  id="endYear"
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(parseInt(e.target.value))}
                  min={startYear}
                  max={currentYear}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              검색 중...
            </>
          ) : (
            <>
              🚀 트렌드 분석 시작
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
        <p className="font-medium mb-1">💡 팁:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>단일 키워드 검색 시 다양한 분석을 선택할 수 있습니다</li>
          <li>비교 키워드를 추가하면 키워드 비교 분석이 가능합니다</li>
          <li>검색어는 영어로 입력하면 더 많은 결과를 얻을 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};

export default QueryBuilder;
