/**
 * SearchLimitDisplay Component
 * Shows search usage for free users with upgrade option
 */
import React from 'react';
import { AlertCircle, TrendingUp, Sparkles } from 'lucide-react';

interface SearchLimitDisplayProps {
  currentSearches: number;
  maxSearches: number;
  language: 'ko' | 'en';
  userType?: 'free' | 'premium';
  onUpgrade?: () => void;
}

const SearchLimitDisplay: React.FC<SearchLimitDisplayProps> = ({
  currentSearches,
  maxSearches,
  language,
  userType = 'free',
  onUpgrade,
}) => {
  const t = {
    todaySearches: language === 'ko' ? '오늘 검색' : "Today's Searches",
    of: language === 'ko' ? '/' : ' / ',
    times: language === 'ko' ? '회' : '',
    warningNearLimit:
      language === 'ko'
        ? '일일 검색 한도에 가까워지고 있습니다'
        : 'Approaching daily search limit',
    warningLimitReached:
      language === 'ko' ? '일일 검색 한도에 도달했습니다' : 'Daily search limit reached',
    upgradeMessage:
      language === 'ko'
        ? '포인트 100P로 추가 검색 가능'
        : 'Use 100 points for additional searches',
    upgradeButton: language === 'ko' ? '포인트로 검색하기' : 'Use Points',
    premiumUnlimited: language === 'ko' ? '프리미엄: 무제한 검색' : 'Premium: Unlimited Searches',
  };

  // Don't show for premium users
  if (userType === 'premium') {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
        <Sparkles size={18} />
        <span className="text-sm font-medium">{t.premiumUnlimited}</span>
      </div>
    );
  }

  const percentage = (currentSearches / maxSearches) * 100;
  const isNearLimit = percentage >= 70;
  const isLimitReached = currentSearches >= maxSearches;

  // Color scheme based on usage
  const getColorScheme = () => {
    if (isLimitReached) {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        icon: 'text-red-500',
        progress: 'bg-red-500',
        progressBg: 'bg-red-100 dark:bg-red-900/30',
      };
    } else if (isNearLimit) {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: 'text-yellow-500',
        progress: 'bg-yellow-500',
        progressBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      };
    } else {
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-500',
        progress: 'bg-blue-500',
        progressBg: 'bg-blue-100 dark:bg-blue-900/30',
      };
    }
  };

  const colors = getColorScheme();

  return (
    <div
      className={`rounded-lg border ${colors.bg} ${colors.border} p-4 shadow-sm transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Search counter and progress */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className={colors.icon} />
            <span className={`text-sm font-medium ${colors.text}`}>
              {t.todaySearches}: {currentSearches}
              {t.of}
              {maxSearches}
              {t.times}
            </span>
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-2 ${colors.progressBg} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${colors.progress} transition-all duration-300`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Warning Message */}
          {(isNearLimit || isLimitReached) && (
            <div className={`flex items-start gap-2 mt-3 ${colors.text}`}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs">
                {isLimitReached ? t.warningLimitReached : t.warningNearLimit}
              </p>
            </div>
          )}
        </div>

        {/* Right: Upgrade option */}
        {isLimitReached && onUpgrade && (
          <div className="flex-shrink-0">
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg
                text-sm font-medium flex items-center gap-2"
            >
              <Sparkles size={16} />
              {t.upgradeButton}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              {t.upgradeMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchLimitDisplay;
