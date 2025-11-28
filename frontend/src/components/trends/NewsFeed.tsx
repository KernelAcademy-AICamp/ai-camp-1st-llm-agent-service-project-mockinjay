import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { NewsArticle } from '../../types/trends';
import { fetchNews } from '../../services/trendsApi';

interface NewsFeedProps {
  language?: 'en' | 'ko';
  query?: string;
}

type CachedNewsPayload = {
  timestamp: number;
  articles: NewsArticle[];
};

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;
const CACHE_PREFIX = 'trend-news-cache';
const DEFAULT_QUERIES = {
  en: 'kidney health trends',
  ko: '신장 건강 동향',
} as const;
const isBrowser = typeof window !== 'undefined';

const NewsFeed: React.FC<NewsFeedProps> = ({ language, query }) => {
  const initialLanguage = language ?? 'ko';
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ko'>(initialLanguage);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastPropLanguage = useRef(language);

  useEffect(() => {
    if (language !== undefined && language !== lastPropLanguage.current) {
      setCurrentLanguage(language);
      lastPropLanguage.current = language;
    }
  }, [language]);

  const getQueryForLanguage = useCallback(
    (lang: 'en' | 'ko'): string => {
      const trimmed = query?.trim();
      if (trimmed) {
        return trimmed;
      }
      return lang === 'en' ? DEFAULT_QUERIES.en : DEFAULT_QUERIES.ko;
    },
    [query]
  );

  const getCacheKey = useCallback(
    (lang: 'en' | 'ko', term: string) => `${CACHE_PREFIX}:${lang}:${term.toLowerCase()}`,
    []
  );

  const readFromCache = useCallback((key: string): NewsArticle[] | null => {
    if (!isBrowser) {
      return null;
    }

    try {
      const cached = window.localStorage.getItem(key);
      if (!cached) {
        return null;
      }

      const payload = JSON.parse(cached) as CachedNewsPayload;
      if (Date.now() - payload.timestamp < CACHE_DURATION_MS) {
        return payload.articles;
      }

      window.localStorage.removeItem(key);
      return null;
    } catch {
      return null;
    }
  }, []);

  const writeToCache = useCallback((key: string, value: NewsArticle[]) => {
    if (!isBrowser) {
      return;
    }

    try {
      const payload: CachedNewsPayload = {
        timestamp: Date.now(),
        articles: value,
      };
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore localStorage errors (e.g., quota exceeded)
    }
  }, []);

  const loadArticles = useCallback(
    async (forceRefresh = false) => {
      const lang = currentLanguage;
      const searchTerm = getQueryForLanguage(lang);
      const cacheKey = getCacheKey(lang, searchTerm);

      if (!forceRefresh) {
        const cachedArticles = readFromCache(cacheKey);
        if (cachedArticles) {
          setArticles(cachedArticles);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const latest = await fetchNews(searchTerm, lang);
        setArticles(latest);
        writeToCache(cacheKey, latest);
      } catch (fetchError) {
        const fallbackMessage =
          lang === 'ko' ? '뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' : 'Unable to fetch news. Please try again.';
        setError(fetchError instanceof Error ? fetchError.message : fallbackMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentLanguage, getCacheKey, getQueryForLanguage, readFromCache, writeToCache]
  );

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const formatDate = useCallback(
    (value: string) => {
      if (!value) {
        return currentLanguage === 'ko' ? '날짜 정보 없음' : 'Date unavailable';
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return currentLanguage === 'ko' ? '날짜 정보 없음' : 'Date unavailable';
      }
      const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    },
    [currentLanguage]
  );

  const handleLanguageChange = useCallback(
    (lang: 'en' | 'ko') => {
      if (lang === currentLanguage) {
        return;
      }
      setCurrentLanguage(lang);
      setLoading(true);
      setError(null);
    },
    [currentLanguage]
  );

  const handleRetry = useCallback(() => {
    loadArticles(true);
  }, [loadArticles]);

  const renderSkeletons = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`news-skeleton-${index}`}
          className="flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="h-40 w-full rounded-xl bg-slate-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderArticles = () => {
    if (!articles.length && !loading) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-800">표시할 뉴스가 없습니다.</p>
          <p className="mt-1 text-sm text-slate-500">
            {currentLanguage === 'ko' ? '다른 키워드를 입력해 보세요.' : 'Try a different keyword to see more stories.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => {
          const hasLink = Boolean(article.url);

          return (
            <article
              key={article.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.title || 'news thumbnail'}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                  {currentLanguage === 'ko' ? '이미지 없음' : 'No image available'}
                </div>
              )}

              <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-600">
                  <span>{article.source || (currentLanguage === 'ko' ? '출처 미확인' : 'Unknown source')}</span>
                  <span className="text-slate-300">•</span>
                  <time className="text-slate-500">{formatDate(article.publishedAt)}</time>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {article.title || (currentLanguage === 'ko' ? '제목 없음' : 'Untitled')}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {article.description ||
                    (currentLanguage === 'ko' ? '요약 정보가 제공되지 않았습니다.' : 'No summary provided.')}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                  <span className="text-xs uppercase text-slate-500">
                    {(article.language || currentLanguage).toUpperCase()}
                  </span>
                  <a
                    href={hasLink ? article.url : '#'}
                    target={hasLink ? '_blank' : undefined}
                    rel={hasLink ? 'noopener noreferrer' : undefined}
                    className={`inline-flex items-center font-medium ${
                      hasLink
                        ? 'text-indigo-600 hover:text-indigo-500'
                        : 'cursor-not-allowed text-slate-400 opacity-60'
                    }`}
                    aria-label={currentLanguage === 'ko' ? '뉴스 원문 열기' : 'Open news article'}
                  >
                    {currentLanguage === 'ko' ? '원문 보기' : 'Read article'}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const showSkeleton = loading && articles.length === 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">최신 뉴스 브리핑</p>
          <p className="text-sm text-slate-500">
            {currentLanguage === 'ko'
              ? '신장 질환 및 웰니스 관련 글로벌 소식을 확인하세요.'
              : 'Stay updated with the latest kidney health stories.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase text-slate-500">언어</span>
          <div className="flex overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold">
            {(['ko', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 transition ${
                  currentLanguage === lang ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lang === 'ko' ? 'KO' : 'EN'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => loadArticles(true)}
            disabled={loading}
            className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              다시 시도
            </button>
          </div>
        )}

        {showSkeleton ? renderSkeletons() : renderArticles()}
      </div>
    </section>
  );
};

export default NewsFeed;
