/**
 * NutritionAnalysisContent Component
 * Displays nutrition analysis with charts and insights
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Droplets,
  Flame,
  Beef,
  Pill,
  Leaf
} from 'lucide-react';

export interface NutritionAnalysisContentProps {
  language: 'en' | 'ko';
}

interface NutrientData {
  name: string;
  nameEn: string;
  current: number;
  goal: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface WeeklyData {
  day: string;
  dayEn: string;
  calories: number;
  protein: number;
  sodium: number;
  potassium: number;
  phosphorus: number;
}

// Mock weekly data
const WEEKLY_DATA: WeeklyData[] = [
  { day: '월', dayEn: 'Mon', calories: 1850, protein: 48, sodium: 1800, potassium: 1900, phosphorus: 850 },
  { day: '화', dayEn: 'Tue', calories: 2100, protein: 55, sodium: 2200, potassium: 2100, phosphorus: 920 },
  { day: '수', dayEn: 'Wed', calories: 1950, protein: 52, sodium: 1950, potassium: 1850, phosphorus: 880 },
  { day: '목', dayEn: 'Thu', calories: 1780, protein: 45, sodium: 1700, potassium: 1750, phosphorus: 800 },
  { day: '금', dayEn: 'Fri', calories: 2050, protein: 58, sodium: 2100, potassium: 2050, phosphorus: 950 },
  { day: '토', dayEn: 'Sat', calories: 2200, protein: 62, sodium: 2400, potassium: 2200, phosphorus: 1020 },
  { day: '일', dayEn: 'Sun', calories: 1900, protein: 50, sodium: 1850, potassium: 1900, phosphorus: 870 },
];

export const NutritionAnalysisContent: React.FC<NutritionAnalysisContentProps> = ({ language }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const isKo = language === 'ko';

  // Calculate averages and current nutrient status
  const nutrientData: NutrientData[] = useMemo(() => {
    const avgCalories = Math.round(WEEKLY_DATA.reduce((sum, d) => sum + d.calories, 0) / WEEKLY_DATA.length);
    const avgProtein = Math.round(WEEKLY_DATA.reduce((sum, d) => sum + d.protein, 0) / WEEKLY_DATA.length);
    const avgSodium = Math.round(WEEKLY_DATA.reduce((sum, d) => sum + d.sodium, 0) / WEEKLY_DATA.length);
    const avgPotassium = Math.round(WEEKLY_DATA.reduce((sum, d) => sum + d.potassium, 0) / WEEKLY_DATA.length);
    const avgPhosphorus = Math.round(WEEKLY_DATA.reduce((sum, d) => sum + d.phosphorus, 0) / WEEKLY_DATA.length);

    return [
      {
        name: '칼로리',
        nameEn: 'Calories',
        current: avgCalories,
        goal: 2000,
        unit: 'kcal',
        icon: Flame,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        trend: avgCalories > 2000 ? 'up' : avgCalories < 1800 ? 'down' : 'stable',
        trendPercent: Math.round(((avgCalories - 2000) / 2000) * 100),
      },
      {
        name: '단백질',
        nameEn: 'Protein',
        current: avgProtein,
        goal: 50,
        unit: 'g',
        icon: Beef,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        trend: avgProtein > 55 ? 'up' : avgProtein < 45 ? 'down' : 'stable',
        trendPercent: Math.round(((avgProtein - 50) / 50) * 100),
      },
      {
        name: '나트륨',
        nameEn: 'Sodium',
        current: avgSodium,
        goal: 2000,
        unit: 'mg',
        icon: Droplets,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        trend: avgSodium > 2000 ? 'up' : 'stable',
        trendPercent: Math.round(((avgSodium - 2000) / 2000) * 100),
      },
      {
        name: '칼륨',
        nameEn: 'Potassium',
        current: avgPotassium,
        goal: 2000,
        unit: 'mg',
        icon: Leaf,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        trend: avgPotassium > 2000 ? 'up' : 'stable',
        trendPercent: Math.round(((avgPotassium - 2000) / 2000) * 100),
      },
      {
        name: '인',
        nameEn: 'Phosphorus',
        current: avgPhosphorus,
        goal: 1000,
        unit: 'mg',
        icon: Pill,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        trend: avgPhosphorus > 1000 ? 'up' : avgPhosphorus < 800 ? 'down' : 'stable',
        trendPercent: Math.round(((avgPhosphorus - 1000) / 1000) * 100),
      },
    ];
  }, []);

  // Generate insights
  const insights = useMemo(() => {
    const results: { type: 'warning' | 'success' | 'info'; message: string; messageEn: string }[] = [];

    nutrientData.forEach(nutrient => {
      const percentage = (nutrient.current / nutrient.goal) * 100;

      if (percentage > 110) {
        results.push({
          type: 'warning',
          message: `${nutrient.name} 섭취량이 목표치를 ${Math.round(percentage - 100)}% 초과했습니다. 섭취량 조절이 필요합니다.`,
          messageEn: `${nutrient.nameEn} intake exceeds target by ${Math.round(percentage - 100)}%. Consider reducing intake.`,
        });
      } else if (percentage >= 90 && percentage <= 110) {
        results.push({
          type: 'success',
          message: `${nutrient.name} 섭취량이 목표 범위 내에 있습니다. 잘 관리하고 계십니다!`,
          messageEn: `${nutrient.nameEn} intake is within target range. Great job managing your diet!`,
        });
      }
    });

    return results;
  }, [nutrientData]);

  // Simple bar chart component
  const SimpleBarChart: React.FC<{ data: WeeklyData[]; dataKey: keyof Omit<WeeklyData, 'day' | 'dayEn'>; goal: number; color: string }> = ({
    data,
    dataKey,
    goal,
    color,
  }) => {
    const maxValue = Math.max(...data.map(d => d[dataKey]), goal * 1.2);

    return (
      <div className="flex items-end gap-1 h-32">
        {data.map((item, idx) => {
          const value = item[dataKey];
          const height = (value / maxValue) * 100;
          const isOverGoal = value > goal;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all ${isOverGoal ? 'bg-red-400' : color}`}
                style={{ height: `${height}%` }}
                title={`${value}`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isKo ? item.day : item.dayEn}
              </span>
            </div>
          );
        })}
        {/* Goal line indicator */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400"
          style={{ bottom: `${(goal / maxValue) * 100}%` }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <BarChart3 className="text-blue-500" size={24} />
          {isKo ? '영양 분석' : 'Nutrition Analysis'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isKo ? '주간' : 'Weekly'}
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isKo ? '월간' : 'Monthly'}
          </button>
        </div>
      </div>

      {/* Nutrient Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {nutrientData.map(nutrient => {
          const NutrientIcon = nutrient.icon;
          const percentage = Math.round((nutrient.current / nutrient.goal) * 100);
          const isOverGoal = percentage > 100;

          return (
            <div
              key={nutrient.name}
              className={`${nutrient.bgColor} p-4 rounded-xl`}
            >
              <div className="flex items-center justify-between mb-2">
                <NutrientIcon className={nutrient.color} size={24} />
                <div className="flex items-center gap-1">
                  {nutrient.trend === 'up' && <TrendingUp className="text-red-500" size={16} />}
                  {nutrient.trend === 'down' && <TrendingDown className="text-green-500" size={16} />}
                  <span className={`text-sm font-medium ${
                    nutrient.trendPercent > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {nutrient.trendPercent > 0 ? '+' : ''}{nutrient.trendPercent}%
                  </span>
                </div>
              </div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {isKo ? nutrient.name : nutrient.nameEn}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {nutrient.current.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">{nutrient.unit}</span>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>{isKo ? '목표' : 'Goal'}: {nutrient.goal.toLocaleString()}</span>
                  <span className={isOverGoal ? 'text-red-500 font-medium' : ''}>
                    {percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverGoal ? 'bg-red-500' : nutrient.color.replace('text-', 'bg-')
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Trend Charts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="text-blue-500" size={20} />
          {isKo ? '주간 섭취량 추이' : 'Weekly Intake Trends'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Calories Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Flame className="text-orange-500" size={16} />
              {isKo ? '칼로리' : 'Calories'}
            </h4>
            <div className="relative h-36 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <SimpleBarChart data={WEEKLY_DATA} dataKey="calories" goal={2000} color="bg-orange-400" />
            </div>
          </div>

          {/* Sodium Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Droplets className="text-blue-500" size={16} />
              {isKo ? '나트륨' : 'Sodium'}
            </h4>
            <div className="relative h-36 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <SimpleBarChart data={WEEKLY_DATA} dataKey="sodium" goal={2000} color="bg-blue-400" />
            </div>
          </div>

          {/* Protein Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Beef className="text-red-500" size={16} />
              {isKo ? '단백질' : 'Protein'}
            </h4>
            <div className="relative h-36 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <SimpleBarChart data={WEEKLY_DATA} dataKey="protein" goal={50} color="bg-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Target className="text-indigo-500" size={20} />
          {isKo ? 'AI 영양 인사이트' : 'AI Nutrition Insights'}
        </h3>

        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg flex items-start gap-3 ${
                insight.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : insight.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {insight.type === 'warning' && <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />}
              {insight.type === 'success' && <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={20} />}
              <p className="text-gray-700 dark:text-gray-300">
                {isKo ? insight.message : insight.messageEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white">
        <h3 className="text-xl font-bold mb-4">
          {isKo ? '맞춤 추천' : 'Personalized Recommendations'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight size={16} />
              {isKo ? '나트륨 섭취 줄이기' : 'Reduce Sodium Intake'}
            </h4>
            <p className="text-sm opacity-90">
              {isKo
                ? '이번 주 나트륨 섭취량이 목표치를 초과했습니다. 가공식품 대신 신선한 재료를 사용해 보세요.'
                : 'Your sodium intake exceeded the target this week. Try using fresh ingredients instead of processed foods.'}
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight size={16} />
              {isKo ? '단백질 균형 맞추기' : 'Balance Protein Intake'}
            </h4>
            <p className="text-sm opacity-90">
              {isKo
                ? '단백질 섭취가 약간 불규칙합니다. 매끼 일정한 양의 양질의 단백질을 섭취하세요.'
                : 'Your protein intake is slightly irregular. Try to consume consistent amounts of quality protein with each meal.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionAnalysisContent;
