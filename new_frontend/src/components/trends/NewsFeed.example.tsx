/**
 * NewsFeed Component Usage Examples
 *
 * This file demonstrates various ways to use the NewsFeed component.
 *
 * NOTE: The NewsFeed component is now self-contained and fetches its own data
 * from the /api/news/list endpoint. It manages:
 * - Data fetching with multi-source API support
 * - 6-hour localStorage caching
 * - Language selection (English/Korean)
 * - Translation to Korean via MyMemory API
 */

import React from 'react';
import NewsFeed from './NewsFeed';

// ==================== Example 1: Basic Usage ====================

/**
 * Simplest usage - component handles all data fetching internally
 * Defaults to English news with original text view
 */
export function BasicNewsFeedExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">신장 질환 뉴스</h1>
      <NewsFeed />
    </div>
  );
}

// ==================== Example 2: Korean Default ====================

/**
 * Start with Korean news as the default language
 */
export function KoreanNewsFeedExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">건강 뉴스</h1>
      <NewsFeed defaultLanguage="ko" />
    </div>
  );
}

// ==================== Example 3: With Custom Styling ====================

/**
 * Using className prop for custom styling
 */
export function StyledNewsFeedExample() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <NewsFeed className="mt-8 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl" />
    </div>
  );
}

// ==================== Example 4: Integration with TrendsPage ====================

/**
 * How to integrate NewsFeed into TrendsPageEnhanced with tabs
 */
export function TrendsPageWithNewsFeed() {
  const [activeTab, setActiveTab] = React.useState<'trends' | 'news'>('trends');

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-8">연구 트렌드 분석</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'trends'
              ? 'text-[#00C9B7] border-b-2 border-[#00C9B7]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          트렌드 분석
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'news'
              ? 'text-[#00C9B7] border-b-2 border-[#00C9B7]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          최신 뉴스
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'trends' && (
        <div>
          {/* Existing trends analysis content */}
          <p>트렌드 분석 콘텐츠...</p>
        </div>
      )}

      {activeTab === 'news' && (
        <div>
          <NewsFeed defaultLanguage="en" />
        </div>
      )}
    </div>
  );
}

// ==================== Example 5: Side-by-Side Languages ====================

/**
 * Displaying both English and Korean news feeds side by side
 */
export function DualLanguageNewsFeed() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">글로벌 건강 뉴스</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">English News</h2>
          <NewsFeed defaultLanguage="en" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">한국어 뉴스</h2>
          <NewsFeed defaultLanguage="ko" />
        </div>
      </div>
    </div>
  );
}

// ==================== Example 6: Dashboard Integration ====================

/**
 * Integrating NewsFeed into a dashboard layout
 */
export function DashboardWithNewsFeed() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          CareGuide 대시보드
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">오늘의 식단</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">1,850 kcal</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">운동 시간</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">45분</p>
              </div>
            </div>

            {/* Other dashboard content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
              <h3 className="text-lg font-semibold mb-4">건강 기록</h3>
              <p className="text-gray-500 dark:text-gray-400">차트 및 기록 표시 영역</p>
            </div>
          </div>

          {/* News sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
            <NewsFeed defaultLanguage="ko" className="max-h-[600px] overflow-y-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Example 7: Full Page News ====================

/**
 * Full page news view with maximized reading experience
 */
export function FullPageNewsFeed() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            건강 뉴스
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            신장 건강 및 만성신장질환 관련 최신 뉴스를 확인하세요
          </p>
        </header>

        <NewsFeed defaultLanguage="en" />
      </div>
    </div>
  );
}
