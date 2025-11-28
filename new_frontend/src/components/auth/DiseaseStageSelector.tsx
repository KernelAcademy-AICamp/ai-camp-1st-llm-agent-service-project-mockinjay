import React, { useState } from 'react';
import { Activity, Check, Info, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CKD_STAGES,
  getSeverityColor,
  getSeverityBadge,
  DIETARY_RECOMMENDATIONS,
} from '../../config/diseaseStages';

interface DiseaseStageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showRecommendations?: boolean;
}

/**
 * DiseaseStageSelector Component
 * Enhanced CKD stage selection with medical tooltips and recommendations
 *
 * Features:
 * - 10 CKD stage options with detailed descriptions
 * - Medical tooltips with eGFR information
 * - Severity indicators with color coding
 * - Dietary recommendations per stage
 * - Keyboard accessible
 * - Screen reader friendly
 *
 * Usage:
 * ```tsx
 * <DiseaseStageSelector
 *   value={diseaseInfo}
 *   onChange={setDiseaseInfo}
 *   required
 *   showRecommendations
 * />
 * ```
 */
export const DiseaseStageSelector: React.FC<DiseaseStageSelectorProps> = ({
  value,
  onChange,
  required = false,
  showRecommendations = false,
}) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const selectedStage = CKD_STAGES.find(stage => stage.value === value);

  const toggleStageInfo = (stageValue: string) => {
    setExpandedStage(prev => prev === stageValue ? null : stageValue);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 ml-1">
        <Activity size={18} className="text-primary" />
        <label className="text-sm font-medium text-gray-700">
          해당하는 질환을 선택해주세요
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Info Banner */}
      <div
        className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm"
        role="note"
      >
        <Info size={18} className="flex-shrink-0 mt-0.5" />
        <p>
          선택하신 정보를 바탕으로 맞춤형 건강 정보와 식단 가이드를 제공합니다.
          정보는 언제든지 마이페이지에서 수정할 수 있습니다.
        </p>
      </div>

      {/* Stage Options Grid */}
      <div
        className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
        role="radiogroup"
        aria-label="질환 단계 선택"
      >
        {CKD_STAGES.map((stage, index) => (
          <div key={stage.value} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <label
              className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 touch-target ${
                value === stage.value
                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 active:scale-[0.98]'
              }`}
            >
              {/* Radio Button and Main Info */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    value === stage.value
                      ? 'border-primary bg-primary scale-110'
                      : 'border-gray-300'
                  }`}
                  role="radio"
                  aria-checked={value === stage.value}
                  tabIndex={0}
                >
                  <input
                    type="radio"
                    name="disease"
                    checked={value === stage.value}
                    onChange={() => onChange(stage.value)}
                    className="sr-only"
                    aria-label={stage.label}
                  />
                  {value === stage.value && (
                    <Check
                      size={12}
                      className="text-white animate-scale-in"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium transition-colors ${
                        value === stage.value ? 'text-primary' : 'text-gray-700'
                      }`}
                    >
                      {stage.label}
                    </span>

                    {/* Severity Badge */}
                    {stage.severity && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityColor(
                          stage.severity
                        )}`}
                      >
                        {getSeverityBadge(stage.severity)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 mt-1">{stage.description}</p>

                  {/* eGFR Info */}
                  {stage.egfr && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">{stage.egfr}</p>
                  )}
                </div>

                {/* Expand Button */}
                {stage.tooltip && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleStageInfo(stage.value);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors flex-shrink-0"
                    aria-expanded={expandedStage === stage.value}
                    aria-label={`${stage.label} 상세 정보 ${expandedStage === stage.value ? '숨기기' : '보기'}`}
                  >
                    {expandedStage === stage.value ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                )}
              </div>

              {/* Expanded Info */}
              {expandedStage === stage.value && (
                <div className="mt-3 pt-3 border-t border-gray-200 animate-slide-down">
                  {/* Medical Tooltip */}
                  {stage.tooltip && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-3">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {stage.tooltip}
                      </p>
                    </div>
                  )}

                  {/* Dietary Recommendations */}
                  {showRecommendations && DIETARY_RECOMMENDATIONS[stage.value] && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-700">
                        권장 식이요법
                      </h4>
                      <ul className="space-y-1">
                        {DIETARY_RECOMMENDATIONS[stage.value].map((recommendation, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-gray-600"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </label>
          </div>
        ))}
      </div>

      {/* Selected Stage Summary */}
      {selectedStage && selectedStage.value !== 'None' && (
        <div
          className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <p className="text-green-800">
            <strong>{selectedStage.label}</strong>이(가) 선택되었습니다.
          </p>
          {selectedStage.description && (
            <p className="text-green-700 text-xs mt-1">{selectedStage.description}</p>
          )}
        </div>
      )}

      {/* Skip Option */}
      {!required && (
        <button
          type="button"
          onClick={() => onChange('None')}
          className={`w-full text-center text-sm py-2 rounded-lg transition-colors ${
            value === 'None'
              ? 'text-primary font-medium bg-primary/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          해당사항 없음 / 나중에 입력하기
        </button>
      )}
    </div>
  );
};
