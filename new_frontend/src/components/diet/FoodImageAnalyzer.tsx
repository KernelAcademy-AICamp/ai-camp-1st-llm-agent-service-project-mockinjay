/**
 * FoodImageAnalyzer Component
 * AI-powered food image analysis with drag-and-drop support
 */

import React, { useState, useCallback, useRef, memo } from 'react';
import { Upload, X, Camera, RotateCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { FoodAnalysisResult, ImageUploadState } from '../../types/diet';

interface FoodImageAnalyzerProps {
  onAnalysisComplete?: (result: FoodAnalysisResult) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  language?: 'en' | 'ko';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Food Image Analyzer Component
 * Features: drag-and-drop, file validation, preview, crop/rotate, analysis
 */
export const FoodImageAnalyzer = memo<FoodImageAnalyzerProps>(({
  onAnalysisComplete,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFormats = ACCEPTED_FORMATS,
  language = 'en',
}) => {
  const [uploadState, setUploadState] = useState<ImageUploadState>({
    file: null,
    preview: null,
    analyzing: false,
    result: null,
    error: null,
  });
  const [dragActive, setDragActive] = useState(false);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    title: language === 'ko' ? '음식 사진 분석' : 'Food Image Analysis',
    description: language === 'ko'
      ? '음식 사진을 업로드하면 AI가 영양 성분을 분석해드립니다.'
      : 'Upload a food image and AI will analyze its nutritional content.',
    dragDrop: language === 'ko' ? '클릭하여 업로드 또는 드래그 앤 드롭' : 'Click to upload or drag and drop',
    formats: language === 'ko' ? '지원 형식' : 'Supported formats',
    maxSize: language === 'ko' ? '최대 크기' : 'Max size',
    analyzing: language === 'ko' ? '분석 중...' : 'Analyzing...',
    analyze: language === 'ko' ? '영양 분석 시작' : 'Analyze Nutrition',
    rotate: language === 'ko' ? '회전' : 'Rotate',
    retry: language === 'ko' ? '다시 시도' : 'Retry',
    errors: {
      fileSize: language === 'ko'
        ? `파일 크기는 ${(maxFileSize / 1024 / 1024).toFixed(0)}MB를 초과할 수 없습니다.`
        : `File size cannot exceed ${(maxFileSize / 1024 / 1024).toFixed(0)}MB.`,
      fileType: language === 'ko'
        ? '지원하지 않는 파일 형식입니다.'
        : 'Unsupported file format.',
      analysisError: language === 'ko'
        ? '분석 중 오류가 발생했습니다. 다시 시도해주세요.'
        : 'An error occurred during analysis. Please try again.',
    },
  };

  /**
   * Validate file size and type
   */
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return t.errors.fileSize;
    }
    if (!acceptedFormats.includes(file.type)) {
      return t.errors.fileType;
    }
    return null;
  }, [maxFileSize, acceptedFormats, t.errors]);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadState(prev => ({ ...prev, error }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadState({
        file,
        preview: e.target?.result as string,
        analyzing: false,
        result: null,
        error: null,
      });
      setRotation(0);
    };
    reader.readAsDataURL(file);
  }, [validateFile]);

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Clear selected image
   */
  const clearImage = useCallback(() => {
    setUploadState({
      file: null,
      preview: null,
      analyzing: false,
      result: null,
      error: null,
    });
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Rotate image
   */
  const rotateImage = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  /**
   * Analyze image with AI
   */
  const analyzeImage = useCallback(async () => {
    if (!uploadState.file) return;

    setUploadState(prev => ({ ...prev, analyzing: true, error: null }));

    try {
      // TODO: Integrate with actual API
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResult: FoodAnalysisResult = {
        foods: [
          {
            name: '삼겹살',
            confidence: 0.95,
            nutrition: {
              calories: 518,
              protein: 17.2,
              sodium: 55,
              potassium: 208,
              phosphorus: 140,
              carbohydrates: 0,
              fat: 51.3,
            },
          },
        ],
        totalNutrition: {
          calories: 518,
          protein: 17.2,
          sodium: 55,
          potassium: 208,
          phosphorus: 140,
        },
        recommendations: [
          language === 'ko'
            ? '단백질이 풍부하나 지방 함량이 높습니다.'
            : 'Rich in protein but high in fat content.',
        ],
        warnings: [
          language === 'ko'
            ? '지방 함량이 높으므로 섭취량에 주의하세요.'
            : 'High fat content - monitor portion size.',
        ],
      };

      setUploadState(prev => ({
        ...prev,
        analyzing: false,
        result: mockResult,
      }));

      onAnalysisComplete?.(mockResult);
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        analyzing: false,
        error: t.errors.analysisError,
      }));
    }
  }, [uploadState.file, onAnalysisComplete, language, t.errors.analysisError]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!uploadState.preview ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center
              w-full min-h-[200px] p-8
              border-2 border-dashed rounded-lg
              transition-colors cursor-pointer
              ${dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={t.dragDrop}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
          >
            <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm font-medium text-foreground">
              {t.dragDrop}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.formats}: PNG, JPG, GIF, WEBP
            </p>
            <p className="text-xs text-muted-foreground">
              {t.maxSize}: {(maxFileSize / 1024 / 1024).toFixed(0)}MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative inline-block w-full">
              <div className="relative overflow-hidden rounded-lg border bg-muted">
                <img
                  src={uploadState.preview}
                  alt="Food preview"
                  className="max-h-[400px] w-full object-contain transition-transform"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={rotateImage}
                className="flex-1"
                disabled={uploadState.analyzing}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                {t.rotate}
              </Button>
              <Button
                onClick={analyzeImage}
                disabled={uploadState.analyzing}
                className="flex-1"
              >
                {uploadState.analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.analyzing}
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    {t.analyze}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadState.error && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{uploadState.error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadState(prev => ({ ...prev, error: null }))}
                className="mt-2 h-auto p-0 text-destructive hover:text-destructive"
              >
                {t.retry}
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {uploadState.result && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">
              {language === 'ko' ? '분석 결과' : 'Analysis Results'}
            </h4>

            {/* Detected Foods */}
            <div className="space-y-2">
              {uploadState.result.foods.map((food, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-accent/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{food.name}</h5>
                    <span className="text-xs text-muted-foreground">
                      {(food.confidence * 100).toFixed(0)}% {language === 'ko' ? '확신' : 'confidence'}
                    </span>
                  </div>
                  {food.nutrition && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          {language === 'ko' ? '칼로리' : 'Calories'}:
                        </span>{' '}
                        {food.nutrition.calories}kcal
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {language === 'ko' ? '단백질' : 'Protein'}:
                        </span>{' '}
                        {food.nutrition.protein}g
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {language === 'ko' ? '나트륨' : 'Sodium'}:
                        </span>{' '}
                        {food.nutrition.sodium}mg
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Warnings */}
            {uploadState.result.warnings && uploadState.result.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <h5 className="font-medium text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                  {language === 'ko' ? '주의사항' : 'Warnings'}
                </h5>
                <ul className="space-y-1 text-xs text-yellow-600 dark:text-yellow-500">
                  {uploadState.result.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {uploadState.result.recommendations && uploadState.result.recommendations.length > 0 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <h5 className="font-medium text-sm text-green-700 dark:text-green-400 mb-2">
                  {language === 'ko' ? '권장사항' : 'Recommendations'}
                </h5>
                <ul className="space-y-1 text-xs text-green-600 dark:text-green-500">
                  {uploadState.result.recommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FoodImageAnalyzer.displayName = 'FoodImageAnalyzer';
