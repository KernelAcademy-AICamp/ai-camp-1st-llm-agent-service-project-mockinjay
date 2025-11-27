import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLocation, Link } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { ChefHat, BookOpen, Upload, BarChart3, Apple, Loader2, X, Camera } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '../services/api';

const DietCarePageEnhanced: React.FC = () => {
  const { t, language } = useApp();
  const location = useLocation();

  const isNutriCoach = location.pathname === ROUTES.NUTRI_COACH;
  const isDietLog = location.pathname === ROUTES.DIET_LOG;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
          {t.nav.dietCare}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ko'
            ? '만성콩팥병 환자를 위한 식단 관리 및 영양 정보'
            : 'Diet management and nutrition information for CKD patients'}
        </p>
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
        <Link
          to={ROUTES.NUTRI_COACH}
          className={isNutriCoach ? 'tab-selected' : 'tab-unselected'}
        >
          <ChefHat className="inline-block mr-2" size={20} />
          {t.nav.nutriCoach}
        </Link>
        <Link
          to={ROUTES.DIET_LOG}
          className={isDietLog ? 'tab-selected' : 'tab-unselected'}
        >
          <BookOpen className="inline-block mr-2" size={20} />
          {t.nav.dietLog}
        </Link>
      </div>

      {/* Content */}
      {isNutriCoach && <NutriCoachContent language={language} />}
      {isDietLog && <DietLogContent language={language} />}
    </div>
  );
};

interface NutritionAnalysisResult {
  status: string;
  answer?: string;
  response?: string;  // 백엔드에서 response 필드로 반환
  nutrition_data?: {
    foods?: Array<{
      name: string;
      amount?: string;
      calories?: number;
      protein?: number;
      sodium?: number;
      potassium?: number;
      phosphorus?: number;
    }>;
    total?: {
      calories?: number;
      protein?: number;
      sodium?: number;
      potassium?: number;
      phosphorus?: number;
    };
    recommendations?: string[];
    warnings?: string[];
  };
}

const NutriCoachContent: React.FC<{ language: 'en' | 'ko' }> = ({ language }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NutritionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setError(null);

    try {
      // First create a session
      const sessionResponse = await api.post('/api/session/create', null, {
        params: { user_id: 'temp_user_123' }
      });
      const sessionId = sessionResponse.data.session_id;

      // Then analyze the image
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('image', selectedImage);
      formData.append('text', language === 'ko' ? '이 음식의 영양 성분을 분석해주세요.' : 'Please analyze the nutritional content of this food.');
      formData.append('user_profile', 'patient');

      const response = await api.post('/api/diet-care/nutri-coach', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📝 Nutrition analysis result:', response.data);
      setAnalysisResult(response.data.result);
    } catch (err: any) {
      console.error('Error analyzing image:', err);
      setError(
        language === 'ko'
          ? `분석 중 오류가 발생했습니다: ${err.response?.data?.detail || err.message}`
          : `Error during analysis: ${err.response?.data?.detail || err.message}`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const dietTypes = [
    {
      title: language === 'ko' ? '저염식 (Low Sodium)' : 'Low Sodium Diet',
      limit: language === 'ko' ? '하루 나트륨 섭취량 2,000mg 이하' : 'Daily sodium intake under 2,000mg',
      tips: language === 'ko'
        ? ['신선한 재료 사용', '가공식품 피하기', '천연 향신료 활용']
        : ['Use fresh ingredients', 'Avoid processed foods', 'Use natural spices'],
      color: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: language === 'ko' ? '저단백식 (Low Protein)' : 'Low Protein Diet',
      limit: language === 'ko' ? '체중 1kg당 0.6-0.8g 단백질' : '0.6-0.8g protein per kg body weight',
      tips: language === 'ko'
        ? ['양질의 단백질 섭취', '식물성 단백질 제한', '영양사 상담 권장']
        : ['Quality protein intake', 'Limit plant protein', 'Consult nutritionist'],
      color: 'border-green-200 dark:border-green-800',
    },
    {
      title: language === 'ko' ? '저칼륨식 (Low Potassium)' : 'Low Potassium Diet',
      limit: language === 'ko' ? '하루 칼륨 섭취량 2,000mg 이하' : 'Daily potassium under 2,000mg',
      tips: language === 'ko'
        ? ['과일/채소 데치기', '고칼륨 식품 피하기', '조리수 2회 이상 교체']
        : ['Blanch fruits/vegetables', 'Avoid high-K foods', 'Change cooking water 2+ times'],
      color: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: language === 'ko' ? '저인식 (Low Phosphorus)' : 'Low Phosphorus Diet',
      limit: language === 'ko' ? '하루 인 섭취량 800-1,000mg' : 'Daily phosphorus 800-1,000mg',
      tips: language === 'ko'
        ? ['유제품 제한', '견과류/잡곡 주의', '인 결합제 복용']
        : ['Limit dairy products', 'Watch nuts/grains', 'Take phosphate binders'],
      color: 'border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Apple className="text-green-600" />
          {language === 'ko' ? '질환식 정보' : 'Disease-Specific Diet Information'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {language === 'ko'
            ? '만성콩팥병 단계별 맞춤 식단 정보와 영양 가이드를 제공합니다.'
            : 'Provides customized diet information and nutrition guides for each CKD stage.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dietTypes.map((diet) => (
            <div key={diet.title} className={`border ${diet.color} p-4 rounded-lg bg-white dark:bg-gray-800`}>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{diet.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{diet.limit}</p>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {diet.tips.map((tip, idx) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Food Image Analysis Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-xl mb-2 flex items-center text-gray-900 dark:text-white">
          <Camera className="mr-2 text-blue-600" size={24} />
          {language === 'ko' ? '음식 사진 분석' : 'Food Image Analysis'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {language === 'ko'
            ? '음식 사진을 업로드하면 AI가 영양 성분을 분석해드립니다.'
            : 'Upload a food image and AI will analyze its nutritional content.'}
        </p>

        {/* Image Upload Area */}
        {!imagePreview ? (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
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
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Food preview"
                className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeImage}
              disabled={analyzing}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {language === 'ko' ? '분석 중...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <BarChart3 size={20} />
                  {language === 'ko' ? '영양 성분 분석하기' : 'Analyze Nutrition'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-green-600" size={20} />
              {language === 'ko' ? '분석 결과' : 'Analysis Result'}
            </h4>

            {/* AI Response */}
            {(analysisResult.answer || analysisResult.response) && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      (analysisResult.answer || analysisResult.response || '')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                        .replace(/\n/g, '<br />')
                    )
                  }}
                />
              </div>
            )}

            {/* Structured Nutrition Data */}
            {analysisResult.nutrition_data?.foods && analysisResult.nutrition_data.foods.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        {language === 'ko' ? '음식' : 'Food'}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        {language === 'ko' ? '칼로리' : 'Calories'}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        {language === 'ko' ? '단백질' : 'Protein'}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        {language === 'ko' ? '나트륨' : 'Sodium'}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        {language === 'ko' ? '칼륨' : 'Potassium'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analysisResult.nutrition_data.foods.map((food, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{food.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{food.calories || '-'} kcal</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{food.protein || '-'} g</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{food.sodium || '-'} mg</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{food.potassium || '-'} mg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Warnings */}
            {analysisResult.nutrition_data?.warnings && analysisResult.nutrition_data.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h5 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  {language === 'ko' ? '⚠️ 주의사항' : '⚠️ Warnings'}
                </h5>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  {analysisResult.nutrition_data.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysisResult.nutrition_data?.recommendations && analysisResult.nutrition_data.recommendations.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">
                  {language === 'ko' ? '💡 권장사항' : '💡 Recommendations'}
                </h5>
                <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-400 space-y-1">
                  {analysisResult.nutrition_data.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DietLogContent: React.FC<{ language: 'en' | 'ko' }> = ({ language }) => {
  const meals = language === 'ko' ? ['아침', '점심', '저녁', '간식'] : ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {language === 'ko' ? '식단 관리 목표 등록' : 'Set Diet Management Goals'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              {language === 'ko' ? '목표 나트륨 (mg/일)' : 'Target Sodium (mg/day)'}
            </label>
            <input
              type="number"
              placeholder="2000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              {language === 'ko' ? '목표 단백질 (g/일)' : 'Target Protein (g/day)'}
            </label>
            <input
              type="number"
              placeholder="40"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              {language === 'ko' ? '목표 칼륨 (mg/일)' : 'Target Potassium (mg/day)'}
            </label>
            <input
              type="number"
              placeholder="2000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
          {language === 'ko' ? '목표 저장' : 'Save Goals'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {language === 'ko' ? '식사 정보 등록' : 'Log Meal Information'}
        </h2>
        <div className="space-y-4">
          {meals.map((meal) => (
            <div key={meal} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">{meal}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={language === 'ko' ? '음식명' : 'Food name'}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder={language === 'ko' ? '양 (g)' : 'Amount (g)'}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                {language === 'ko' ? '+ 음식 추가' : '+ Add food'}
              </button>
            </div>
          ))}
        </div>
        <button className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center gap-2">
          <BarChart3 size={20} />
          {language === 'ko' ? '영양 분석 보기' : 'View Nutrition Analysis'}
        </button>
      </div>
    </div>
  );
};

export default DietCarePageEnhanced;
