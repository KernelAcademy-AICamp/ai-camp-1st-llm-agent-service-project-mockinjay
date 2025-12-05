/**
 * NewsFeed Component
 *
 * Displays a feed of kidney disease and health-related news articles.
 * Features:
 * - Multi-source API integration (RSS, GNews, NewsData)
 * - Language selection (English/Korean)
 * - Original/Translated text toggle
 * - 6-hour localStorage caching
 * - Responsive card layout
 * - Translation via MyMemory API
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Bookmark, Loader2, RefreshCw, ExternalLink, Globe, Languages } from 'lucide-react';
import { ImageWithFallback } from '../ui/image-with-fallback';
import { translateToKorean } from '../../services/translateApi';

// ==================== Types ====================

export interface NewsItem {
  id: string;
  title: string;
  titleOriginal?: string;
  titleTranslated?: string;
  source: string;
  time: string;
  description: string | null;
  descriptionOriginal?: string | null;
  descriptionTranslated?: string | null;
  image: string | null;
  link: string;
  pubDate?: string;
  language?: string;
}

interface NewsApiResponse {
  articles: NewsItem[];
  totalResults: number;
  status: string;
  cached: boolean;
  sourceUsed: string;
}

// ==================== Cache Configuration ====================

const CACHE_KEY_PREFIX = 'careguide_news_feed';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CachedNewsData {
  data: NewsApiResponse;
  timestamp: number;
}

function getCacheKey(language: string): string {
  return `${CACHE_KEY_PREFIX}_${language}`;
}

function getCachedNews(language: string): NewsApiResponse | null {
  try {
    const cached = localStorage.getItem(getCacheKey(language));
    if (!cached) return null;

    const parsedCache: CachedNewsData = JSON.parse(cached);
    const now = Date.now();

    if (now - parsedCache.timestamp < CACHE_DURATION_MS) {
      console.log(`[NewsFeed] Using cached news data for ${language}`);
      return parsedCache.data;
    }

    localStorage.removeItem(getCacheKey(language));
    console.log('[NewsFeed] Cache expired');
    return null;
  } catch (error) {
    console.warn('[NewsFeed] Error reading cache:', error);
    return null;
  }
}

function setCachedNews(language: string, data: NewsApiResponse): void {
  try {
    const cacheData: CachedNewsData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(getCacheKey(language), JSON.stringify(cacheData));
    console.log(`[NewsFeed] Cached news data for ${language}`);
  } catch (error) {
    console.warn('[NewsFeed] Error saving to cache:', error);
  }
}

// ==================== Translation Cache ====================

const TRANSLATION_CACHE_KEY = 'news_translations';

interface TranslationCacheEntry {
  title: string;
  description: string | null;
}

function getTranslationCache(): Record<string, TranslationCacheEntry> {
  try {
    const cache = localStorage.getItem(TRANSLATION_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
}

function setTranslationCache(id: string, entry: TranslationCacheEntry): void {
  try {
    const cache = getTranslationCache();
    cache[id] = entry;
    // Limit cache size
    const keys = Object.keys(cache);
    if (keys.length > 200) {
      keys.slice(0, 50).forEach((k) => delete cache[k]);
    }
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore
  }
}

// ==================== Component ====================

interface NewsFeedProps {
  className?: string;
  defaultLanguage?: 'ko' | 'en';
}

type ViewMode = 'original' | 'translated';

const NewsFeed: React.FC<NewsFeedProps> = ({ className = '', defaultLanguage = 'en' }) => {
  // State
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isCached, setIsCached] = useState(false);
  const [sourceUsed, setSourceUsed] = useState<string>('');

  // Language and view mode
  const [newsLanguage, setNewsLanguage] = useState<'ko' | 'en'>(defaultLanguage);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [translating, setTranslating] = useState(false);
  const [translatedItems, setTranslatedItems] = useState<Map<string, TranslationCacheEntry>>(new Map());

  /**
   * Fetch news from API
   */
  const fetchNews = useCallback(async (forceRefresh = false) => {
    setError(null);

    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedNews(newsLanguage);
      if (cached) {
        setNewsItems(cached.articles);
        setSourceUsed(cached.sourceUsed);
        setIsCached(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setIsCached(false);

    try {
      const response = await fetch('/api/news/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: newsLanguage === 'en' ? 'kidney health' : '신장 건강',
          language: newsLanguage,
          page: 1,
          page_size: 15,
          source: 'auto',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`);
      }

      const data: NewsApiResponse = await response.json();

      // Save to cache
      setCachedNews(newsLanguage, data);

      setNewsItems(data.articles);
      setSourceUsed(data.sourceUsed);
      setIsCached(data.cached);
    } catch (err) {
      console.error('[NewsFeed] Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
      setNewsItems([]);
    } finally {
      setLoading(false);
    }
  }, [newsLanguage]);

  // Initial fetch and refetch when language changes
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  /**
   * Translate news items to Korean
   */
  const translateNews = useCallback(async () => {
    if (newsLanguage === 'ko') return; // Already Korean

    setTranslating(true);
    const cache = getTranslationCache();
    const newTranslations = new Map<string, TranslationCacheEntry>();

    try {
      for (const item of newsItems) {
        // Check cache first
        if (cache[item.id]) {
          newTranslations.set(item.id, cache[item.id]);
          continue;
        }

        // Translate title and description
        const translatedTitle = await translateToKorean(item.title);
        const translatedDescription = item.description
          ? await translateToKorean(item.description)
          : null;

        const entry: TranslationCacheEntry = {
          title: translatedTitle,
          description: translatedDescription,
        };

        newTranslations.set(item.id, entry);
        setTranslationCache(item.id, entry);

        // Small delay to avoid API rate limits
        await new Promise((r) => setTimeout(r, 100));
      }

      setTranslatedItems(newTranslations);
    } catch (err) {
      console.error('[NewsFeed] Translation error:', err);
    } finally {
      setTranslating(false);
    }
  }, [newsItems, newsLanguage]);

  // Auto-translate when switching to translated view
  useEffect(() => {
    if (viewMode === 'translated' && newsLanguage === 'en' && translatedItems.size === 0) {
      translateNews();
    }
  }, [viewMode, newsLanguage, translatedItems.size, translateNews]);

  /**
   * Get display text for an item based on view mode
   */
  const getDisplayText = useCallback(
    (item: NewsItem) => {
      if (viewMode === 'original' || newsLanguage === 'ko') {
        return {
          title: item.title,
          description: item.description,
        };
      }

      const translation = translatedItems.get(item.id);
      if (translation) {
        return {
          title: translation.title,
          description: translation.description,
        };
      }

      return {
        title: item.title,
        description: item.description,
      };
    },
    [viewMode, newsLanguage, translatedItems]
  );

  /**
   * Handle bookmark toggle
   */
  const handleBookmarkClick = useCallback((e: React.MouseEvent, newsId: string) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle news card click
   */
  const handleCardClick = useCallback((link: string) => {
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }, []);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, link: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick(link);
      }
    },
    [handleCardClick]
  );

  // Get source label for display
  const sourceLabel = useMemo(() => {
    switch (sourceUsed) {
      case 'gnews':
        return 'GNews';
      case 'rss':
        return 'RSS';
      case 'newsdata':
        return 'NewsData';
      case 'mock':
        return 'Sample';
      default:
        return '';
    }
  }, [sourceUsed]);

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-bold text-[#1F2937] dark:text-white"
            style={{ fontSize: '18px', fontFamily: 'Noto Sans KR, sans-serif' }}
          >
            {newsLanguage === 'ko' ? '건강 뉴스' : 'Health News'}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin mb-4" size={48} color="#00C9B7" />
          <p
            className="text-[#9CA3AF]"
            style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '14px' }}
          >
            {newsLanguage === 'ko' ? '뉴스를 불러오는 중...' : 'Loading news...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} role="feed" aria-label="Health News Feed">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3
            className="font-bold text-[#1F2937] dark:text-white"
            style={{ fontSize: '18px', fontFamily: 'Noto Sans KR, sans-serif' }}
          >
            {newsLanguage === 'ko' ? '건강 뉴스' : 'Health News'}
          </h3>
          {isCached && (
            <span
              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full"
              title="Cached data (updates every 6 hours)"
            >
              {newsLanguage === 'ko' ? '캐시됨' : 'Cached'}
            </span>
          )}
          {sourceLabel && (
            <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              {sourceLabel}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setNewsLanguage('en')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                newsLanguage === 'en'
                  ? 'bg-white dark:bg-gray-600 text-[#00C9B7] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              aria-pressed={newsLanguage === 'en'}
            >
              <Globe size={14} />
              EN
            </button>
            <button
              onClick={() => setNewsLanguage('ko')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                newsLanguage === 'ko'
                  ? 'bg-white dark:bg-gray-600 text-[#00C9B7] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              aria-pressed={newsLanguage === 'ko'}
            >
              KO
            </button>
          </div>

          {/* Translation Toggle (only for English news) */}
          {newsLanguage === 'en' && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'original'
                    ? 'bg-white dark:bg-gray-600 text-[#00C9B7] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                aria-pressed={viewMode === 'original'}
              >
                Original
              </button>
              <button
                onClick={() => setViewMode('translated')}
                disabled={translating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'translated'
                    ? 'bg-white dark:bg-gray-600 text-[#00C9B7] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                } ${translating ? 'opacity-50 cursor-wait' : ''}`}
                aria-pressed={viewMode === 'translated'}
              >
                <Languages size={14} />
                {translating ? '번역중...' : '한글'}
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchNews(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={newsLanguage === 'ko' ? '새로고침' : 'Refresh'}
            aria-label="Refresh news"
          >
            <RefreshCw size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            {newsLanguage === 'ko'
              ? '뉴스를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
              : 'Error loading news. Please try again later.'}
          </p>
        </div>
      )}

      {/* Translating indicator */}
      {translating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} color="#3B82F6" />
          <p className="text-sm text-blue-700 dark:text-blue-400">번역 중입니다...</p>
        </div>
      )}

      {/* News list */}
      {newsItems.map((news) => {
        const isBookmarked = bookmarkedIds.has(news.id);
        const hasExternalLink = news.link && news.link !== '#';
        const displayText = getDisplayText(news);

        return (
          <article
            key={news.id}
            onClick={() => handleCardClick(news.link)}
            onKeyDown={(e) => handleKeyDown(e, news.link)}
            className={`bg-white dark:bg-gray-800 rounded-[16px] overflow-hidden transition-shadow relative flex flex-col md:flex-row focus:outline-none focus:ring-2 focus:ring-[#00C9B7] focus:ring-offset-2 ${
              hasExternalLink ? 'cursor-pointer hover:shadow-lg' : ''
            }`}
            style={{
              boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)',
              minHeight: '180px',
            }}
            tabIndex={hasExternalLink ? 0 : -1}
            role="article"
            aria-label={`${displayText.title}, ${news.source}, ${news.time}`}
          >
            {/* Image Section */}
            <div className="relative w-full md:w-[160px] h-[160px] md:h-auto flex-shrink-0">
              <ImageWithFallback
                src={
                  news.image ||
                  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop'
                }
                alt={displayText.title}
                className="w-full h-full object-cover"
              />
              {hasExternalLink && (
                <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                  <ExternalLink size={14} color="white" />
                </div>
              )}
              {/* Language badge */}
              {news.language && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                  {news.language.toUpperCase()}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 md:p-5 md:pl-6 flex flex-col justify-between">
              <div className="flex-1">
                {/* Title */}
                <h4
                  className="font-bold text-black dark:text-white mb-2 line-clamp-2"
                  style={{
                    fontSize: '15px',
                    lineHeight: '22px',
                    fontFamily: 'Noto Sans KR, sans-serif',
                  }}
                >
                  {displayText.title}
                </h4>

                {/* Description */}
                <p
                  className="text-[#272727] dark:text-gray-300 line-clamp-3"
                  style={{
                    fontSize: '13px',
                    lineHeight: '19px',
                    fontFamily: 'Noto Sans KR, sans-serif',
                  }}
                >
                  {displayText.description || ''}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-2">
                <p className="text-[#777777] dark:text-gray-500" style={{ fontSize: '11px' }}>
                  {news.source} | {news.time}
                </p>

                {/* Bookmark Button */}
                <button
                  onClick={(e) => handleBookmarkClick(e, news.id)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C9B7]"
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  aria-pressed={isBookmarked}
                >
                  <Bookmark
                    size={20}
                    color={isBookmarked ? '#00C9B7' : '#CCCCCC'}
                    fill={isBookmarked ? '#00C9B7' : 'none'}
                    strokeWidth={1.4}
                  />
                </button>
              </div>
            </div>
          </article>
        );
      })}

      {/* Empty state */}
      {newsItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <p
            className="text-[#9CA3AF] dark:text-gray-500"
            style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '14px' }}
          >
            {newsLanguage === 'ko' ? '표시할 뉴스가 없습니다.' : 'No news to display.'}
          </p>
          <button
            onClick={() => fetchNews(true)}
            className="mt-4 px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00B5A5] transition-colors"
          >
            {newsLanguage === 'ko' ? '다시 시도' : 'Try again'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
