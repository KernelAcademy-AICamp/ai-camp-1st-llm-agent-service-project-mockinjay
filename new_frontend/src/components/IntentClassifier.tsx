import React from 'react';
import type { IntentCategory } from '../types';
import { INTENT_CLASSIFICATIONS } from '../types';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface IntentClassifierProps {
  /** 감지된 의도 */
  detectedIntent?: IntentCategory;
  /** 의도 감지 신뢰도 (0-1) */
  confidence?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
}

const IntentClassifier: React.FC<IntentClassifierProps> = ({
  detectedIntent,
  confidence = 0,
  compact = false,
}) => {
  if (!detectedIntent) return null;

  const intent = INTENT_CLASSIFICATIONS[detectedIntent];

  const getRiskIcon = () => {
    switch (intent.riskLevel) {
      case 'critical':
        return <AlertTriangle className="text-red-600" size={20} />;
      case 'high':
        return <AlertCircle className="text-orange-500" size={20} />;
      case 'medium':
        return <Info className="text-yellow-500" size={20} />;
      case 'low':
        return <CheckCircle className="text-green-500" size={20} />;
    }
  };

  const getRiskColor = () => {
    switch (intent.riskLevel) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getRiskColor()}`}>
        {getRiskIcon()}
        <span className="text-xs font-medium">{intent.name}</span>
        {confidence > 0 && (
          <span className="text-xs opacity-70">({(confidence * 100).toFixed(0)}%)</span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${getRiskColor()}`}>
      <div className="flex items-start gap-3">
        {getRiskIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm">
              {intent.name} ({intent.nameEn})
            </h4>
            {confidence > 0 && (
              <span className="text-xs opacity-70">
                신뢰도: {(confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-xs opacity-80">{intent.description}</p>

          {intent.requiresStrictValidation && (
            <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded text-xs">
              ⚠️ <strong>False Negative 방지 정책 적용</strong>:
              증상 보고 시 절대 안심 금지, 의료진 상담 권장
            </div>
          )}

          {intent.recommendedAgent && (
            <div className="mt-2 text-xs">
              <strong>추천 에이전트:</strong> {intent.recommendedAgent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntentClassifier;
