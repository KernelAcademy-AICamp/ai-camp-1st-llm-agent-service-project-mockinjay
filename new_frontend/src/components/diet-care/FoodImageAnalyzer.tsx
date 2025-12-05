/**
 * FoodImageAnalyzer Component
 * Upload and analyze food images for nutrition information
 * Enhanced with accessibility and UX improvements
 */

import React, { useCallback, useRef } from 'react';
import { Camera, Upload, X, Loader2, BarChart3, AlertCircle } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useNutritionAnalysis } from '../../hooks/useNutritionAnalysis';
import { NutritionResults } from './NutritionResults';

export interface FoodImageAnalyzerProps {
  language: 'en' | 'ko';
}

export const FoodImageAnalyzer: React.FC<FoodImageAnalyzerProps> = React.memo(({ language }) => {
  const {
    selectedImage,
    imagePreview,
    error: uploadError,
    handleImageSelect,
    handleImageDrop,
    clearImage,
  } = useImageUpload(language);

  const {
    status,
    result,
    error: analysisError,
    analyze,
    abort,
  } = useNutritionAnalysis(language);

  const analyzing = status === 'analyzing' || status === 'creating_session';

  // Ref for file input to enable keyboard interaction
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle analyze with memoization
   */
  const handleAnalyze = useCallback(() => {
    if (selectedImage) {
      const text = language === 'ko'
        ? '이 음식의 영양 성분을 분석해주세요.'
        : 'Please analyze the nutritional content of this food.';
      analyze(selectedImage, text);
    }
  }, [selectedImage, language, analyze]);

  /**
   * Handle clear with focus management
   */
  const handleClear = useCallback(() => {
    clearImage();
    fileInputRef.current?.focus();
  }, [clearImage]);

  /**
   * Handle abort
   */
  const handleAbort = useCallback(() => {
    abort();
  }, [abort]);

  const error = uploadError || analysisError;

  return (
    <section
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      aria-labelledby="food-analyzer-heading"
    >
      <h3
        id="food-analyzer-heading"
        className="font-semibold text-xl mb-2 flex items-center text-gray-900 dark:text-white"
      >
        <Camera className="mr-2 text-blue-600" size={24} aria-hidden="true" />
        {language === 'ko' ? '음식 사진 분석' : 'Food Image Analysis'}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {language === 'ko'
          ? '음식 사진을 업로드하면 AI가 영양 성분을 분석해드립니다.'
          : 'Upload a food image and AI will analyze its nutritional content.'}
      </p>

      {/* Image Upload Area */}
      {!imagePreview ? (
        <label
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
          onDrop={(e) => handleImageDrop(e as any)}
          onDragOver={(e) => e.preventDefault()}
          tabIndex={0}
          role="button"
          aria-label={language === 'ko' ? '이미지 업로드' : 'Upload image'}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" aria-hidden="true" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">
                {language === 'ko' ? '클릭하여 업로드' : 'Click to upload'}
              </span>
              {language === 'ko' ? ' 또는 드래그 앤 드롭' : ' or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF (MAX. 10MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            aria-label={language === 'ko' ? '음식 이미지 선택' : 'Select food image'}
          />
        </label>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt={language === 'ko' ? '선택된 음식 이미지' : 'Selected food image'}
              className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
            />
            <button
              onClick={handleClear}
              disabled={analyzing}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={language === 'ko' ? '이미지 제거' : 'Remove image'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={language === 'ko' ? '영양 성분 분석 시작' : 'Start nutrition analysis'}
              aria-busy={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                  <span role="status" aria-live="polite">
                    {status === 'creating_session'
                      ? (language === 'ko' ? '세션 생성 중...' : 'Creating session...')
                      : (language === 'ko' ? '분석 중...' : 'Analyzing...')
                    }
                  </span>
                </>
              ) : (
                <>
                  <BarChart3 size={20} aria-hidden="true" />
                  {language === 'ko' ? '영양 성분 분석하기' : 'Analyze Nutrition'}
                </>
              )}
            </button>

            {/* Abort Button */}
            {analyzing && (
              <button
                onClick={handleAbort}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label={language === 'ko' ? '분석 취소' : 'Cancel analysis'}
              >
                <X size={20} aria-hidden="true" />
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start gap-2"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Result */}
      {result && (
        <div role="region" aria-live="polite" aria-atomic="true">
          <NutritionResults result={result} language={language} />
        </div>
      )}
    </section>
  );
});

FoodImageAnalyzer.displayName = 'FoodImageAnalyzer';
