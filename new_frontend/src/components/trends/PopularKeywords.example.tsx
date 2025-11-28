/**
 * PopularKeywords Component Examples
 * Visual examples and usage patterns for development and testing
 */
import { useState } from 'react';
import PopularKeywords from './PopularKeywords';

interface Keyword {
  text: string;
  count: number;
  rank: number;
}

/**
 * Example 1: Basic Usage with Default Keywords
 */
export const BasicExample = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Example 1: Default Keywords
        </h2>
        <PopularKeywords />
      </div>
    </div>
  );
};

/**
 * Example 2: Interactive with Click Handler
 */
export const InteractiveExample = () => {
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [clickCount, setClickCount] = useState(0);

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    setClickCount(prev => prev + 1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Example 2: Interactive with Click Handler
        </h2>

        <PopularKeywords onKeywordClick={handleKeywordClick} />

        {selectedKeyword && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">Click Info:</h3>
            <p className="text-gray-600">
              Selected: <span className="font-bold text-[#00C8B4]">{selectedKeyword}</span>
            </p>
            <p className="text-gray-600">
              Total Clicks: <span className="font-bold">{clickCount}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Example 3: Custom Keywords with Different Counts
 */
export const CustomKeywordsExample = () => {
  const customKeywords: Keyword[] = [
    { text: '신장 이식', count: 2500, rank: 1 },
    { text: 'CKD 단계', count: 1800, rank: 2 },
    { text: '혈액 투석', count: 1500, rank: 3 },
    { text: '단백질 제한', count: 1200, rank: 4 },
    { text: '칼륨 관리', count: 950, rank: 5 },
    { text: '복막 투석', count: 800, rank: 6 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Example 3: Custom Keywords (6 items)
        </h2>
        <PopularKeywords keywords={customKeywords} />
      </div>
    </div>
  );
};

/**
 * Example 4: Dynamic Keywords with State
 */
export const DynamicExample = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([
    { text: '당뇨병성 신증', count: 1245, rank: 1 },
    { text: '25년 복지 수당 신청', count: 1087, rank: 2 },
    { text: '저칼륨 식단', count: 924, rank: 3 },
    { text: '투석 관리', count: 856, rank: 4 },
  ]);

  const refreshKeywords = () => {
    // Simulate fetching new data
    setKeywords([
      { text: '신장 건강', count: Math.floor(Math.random() * 2000), rank: 1 },
      { text: '만성 신부전', count: Math.floor(Math.random() * 2000), rank: 2 },
      { text: '혈압 관리', count: Math.floor(Math.random() * 2000), rank: 3 },
      { text: '영양 상담', count: Math.floor(Math.random() * 2000), rank: 4 },
    ]);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Example 4: Dynamic Keywords
          </h2>
          <button
            onClick={refreshKeywords}
            className="px-4 py-2 bg-[#00C8B4] text-white rounded-lg hover:bg-[#00B8A4] transition-colors"
          >
            Refresh Keywords
          </button>
        </div>

        <PopularKeywords keywords={keywords} />
      </div>
    </div>
  );
};

/**
 * Example 5: Empty State
 */
export const EmptyStateExample = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Example 5: Empty Keywords Array
        </h2>
        <PopularKeywords keywords={[]} />
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Note: Component handles empty arrays gracefully. Consider adding a "No keywords available" message.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 6: Large Numbers Formatting
 */
export const LargeNumbersExample = () => {
  const largeCountKeywords: Keyword[] = [
    { text: '초고인기 키워드', count: 1234567, rank: 1 },
    { text: '매우 인기 키워드', count: 987654, rank: 2 },
    { text: '보통 인기 키워드', count: 123456, rank: 3 },
    { text: '낮은 인기 키워드', count: 12345, rank: 4 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Example 6: Large Number Formatting
        </h2>
        <PopularKeywords keywords={largeCountKeywords} />
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            Numbers are automatically formatted with locale-specific thousands separators.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 7: Integration with Search
 */
export const SearchIntegrationExample = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleKeywordClick = (keyword: string) => {
    setSearchQuery(keyword);
    setSearchHistory(prev => [keyword, ...prev.slice(0, 4)]);
    // In real app: navigate('/search?q=' + keyword)
    console.log('Searching for:', keyword);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Example 7: Search Integration
        </h2>

        {/* Search Bar */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C8B4]"
          />
        </div>

        <PopularKeywords onKeywordClick={handleKeywordClick} />

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3">Recent Searches:</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((query, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {query}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Example 8: Dark Mode (if supported)
 */
export const DarkModeExample = () => {
  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Example 8: Dark Mode Considerations
        </h2>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 mb-4">
          <p className="text-gray-300 text-sm">
            Note: Current component uses fixed colors. For dark mode support, replace fixed colors with Tailwind dark: variants.
          </p>
        </div>
        <PopularKeywords />
      </div>
    </div>
  );
};

/**
 * Example 9: Responsive Layout Demo
 */
export const ResponsiveExample = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Example 9: Responsive Layout
        </h2>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm mb-2 font-semibold">
            Resize your browser to see responsive behavior:
          </p>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Mobile (&lt; 768px): 1 column</li>
            <li>• Desktop (≥ 768px): 2 columns</li>
          </ul>
        </div>
        <PopularKeywords />
      </div>
    </div>
  );
};

/**
 * Example 10: All Examples Showcase
 */
export const AllExamplesShowcase = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-12">
      <BasicExample />
      <InteractiveExample />
      <CustomKeywordsExample />
      <DynamicExample />
      <SearchIntegrationExample />
      <LargeNumbersExample />
    </div>
  );
};

// Export for Storybook or standalone testing
export default {
  BasicExample,
  InteractiveExample,
  CustomKeywordsExample,
  DynamicExample,
  EmptyStateExample,
  LargeNumbersExample,
  SearchIntegrationExample,
  DarkModeExample,
  ResponsiveExample,
  AllExamplesShowcase,
};
