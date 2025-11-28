/**
 * PopularKeywords Component
 * Displays trending search keywords with rank badges in a responsive grid layout
 *
 * Usage Example:
 * ```tsx
 * import PopularKeywords from './components/trends/PopularKeywords';
 *
 * // With default keywords
 * <PopularKeywords />
 *
 * // With custom keywords and click handler
 * <PopularKeywords
 *   keywords={customKeywords}
 *   onKeywordClick={(keyword) => console.log('Clicked:', keyword)}
 * />
 * ```
 */
import React from 'react';

export interface Keyword {
  text: string;
  count: number;
  rank: number;
}

export interface PopularKeywordsProps {
  keywords?: Keyword[];
  onKeywordClick?: (keyword: string) => void;
}

const defaultKeywords: Keyword[] = [
  { text: '당뇨병성 신증', count: 1245, rank: 1 },
  { text: '25년 복지 수당 신청', count: 1087, rank: 2 },
  { text: '저칼륨 식단', count: 924, rank: 3 },
  { text: '투석 관리', count: 856, rank: 4 },
];

const PopularKeywords: React.FC<PopularKeywordsProps> = ({
  keywords = defaultKeywords,
  onKeywordClick,
}) => {
  const handleKeywordClick = (keyword: string) => {
    if (onKeywordClick) {
      onKeywordClick(keyword);
    }
  };

  return (
    <section className="w-full">
      <h3
        className="mb-4 font-bold text-[#1F2937]"
        style={{ fontSize: '18px', fontFamily: 'Noto Sans KR, sans-serif' }}
      >
        📈 인기 키워드
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {keywords.map((keyword, index) => (
          <div
            key={index}
            onClick={() => handleKeywordClick(keyword.text)}
            className={`p-4 rounded-lg border border-gray-200 bg-white
              transition-all duration-200 hover:shadow-md
              ${onKeywordClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
            role={onKeywordClick ? 'button' : 'article'}
            tabIndex={onKeywordClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onKeywordClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleKeywordClick(keyword.text);
              }
            }}
            aria-label={`키워드: ${keyword.text}, 검색 횟수: ${keyword.count.toLocaleString()}, 순위: ${keyword.rank}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <span
                  className="flex items-center justify-center rounded-full bg-[#EFF6FF] text-[#00C8B4] font-bold"
                  style={{
                    fontSize: '14px',
                    width: '28px',
                    height: '28px',
                    fontFamily: 'Noto Sans KR, sans-serif'
                  }}
                  aria-hidden="true"
                >
                  {keyword.rank}
                </span>

                {/* Keyword Text */}
                <span
                  className="text-[#1F2937] font-medium"
                  style={{
                    fontSize: '14px',
                    fontFamily: 'Noto Sans KR, sans-serif'
                  }}
                >
                  {keyword.text}
                </span>
              </div>

              {/* Count */}
              <span
                className="text-gray-400"
                style={{ fontSize: '12px' }}
              >
                {keyword.count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularKeywords;
