/**
 * ErrorState Component
 * Displays error messages with retry functionality
 */
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error?: Error | string | null;
  onRetry?: () => void;
  title?: string;
  message?: string;
  showIcon?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = '문제가 발생했습니다',
  message,
  showIcon = true,
  className = '',
  variant = 'default',
}) => {
  const errorMessage = message || (error instanceof Error ? error.message : error) || '데이터를 불러오는데 실패했습니다.';

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-red-600 text-sm ${className}`}>
        {showIcon && <AlertCircle size={16} />}
        <span>{errorMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary-600 hover:text-primary-700 underline ml-2"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          {showIcon && <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />}
          <div className="flex-1">
            <p className="text-sm text-red-800">{errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                <RefreshCw size={14} />
                다시 시도
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {showIcon && (
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="text-red-600" size={32} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">{errorMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw size={18} />
          다시 시도
        </button>
      )}
    </div>
  );
};

// Quiz Stats Error Component
export const QuizStatsError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <ErrorState
        title="통계를 불러올 수 없습니다"
        message="퀴즈 통계를 불러오는데 문제가 발생했습니다."
        onRetry={onRetry}
        variant="compact"
      />
    </div>
  );
};

export default ErrorState;
