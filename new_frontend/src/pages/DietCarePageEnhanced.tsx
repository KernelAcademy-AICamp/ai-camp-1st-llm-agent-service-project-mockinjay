import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useLocation, Link, useParams } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { ChefHat, BookOpen, ArrowLeft } from 'lucide-react';

// 별도 컴포넌트 import
import { NutriCoachContent } from '../components/diet-care/NutriCoachContent';
import { DietLogContent } from '../components/diet-care/DietLogContent';
import { DietTypeDetailContent } from '../components/diet-care/DietTypeDetailContent';

const DietCarePageEnhanced: React.FC = () => {
  const { t, language } = useApp();
  const location = useLocation();
  const { dietType } = useParams<{ dietType: string }>();

  // 현재 경로 판단
  const isNutriCoach = location.pathname === ROUTES.NUTRI_COACH || location.pathname === ROUTES.DIET_CARE;
  const isDietLog = location.pathname === ROUTES.DIET_LOG;
  const isDietTypeDetail = location.pathname.startsWith('/diet-care/diet-type/');

  // 상세 페이지인 경우
  if (isDietTypeDetail && dietType) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <Link
          to={ROUTES.NUTRI_COACH}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {language === 'ko' ? '뉴트리 코치로 돌아가기' : 'Back to Nutri Coach'}
        </Link>

        <DietTypeDetailContent dietType={dietType} language={language} />
      </div>
    );
  }

  // 메인 페이지
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
          className={`flex items-center px-4 py-3 border-b-2 transition-colors ${
            isNutriCoach
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <ChefHat className="mr-2" size={20} />
          {t.nav.nutriCoach}
        </Link>
        <Link
          to={ROUTES.DIET_LOG}
          className={`flex items-center px-4 py-3 border-b-2 transition-colors ${
            isDietLog
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <BookOpen className="mr-2" size={20} />
          {t.nav.dietLog}
        </Link>
      </div>

      {/* Content - 별도 컴포넌트 사용 */}
      {isNutriCoach && <NutriCoachContent language={language} />}
      {isDietLog && <DietLogContent language={language} />}
    </div>
  );
};

export default DietCarePageEnhanced;
