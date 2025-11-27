/**
 * MealHistoryContent Component
 * Displays meal history with calendar view and meal details
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Utensils,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export interface MealHistoryContentProps {
  language: 'en' | 'ko';
}

interface MealRecord {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: {
    name: string;
    amount: string;
    calories: number;
    protein_g: number;
    sodium_mg: number;
    potassium_mg: number;
    phosphorus_mg: number;
  }[];
  notes?: string;
}

// Mock data for demonstration
const MOCK_MEAL_HISTORY: MealRecord[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    mealType: 'breakfast',
    foods: [
      { name: '오트밀', amount: '1컵', calories: 150, protein_g: 5, sodium_mg: 0, potassium_mg: 130, phosphorus_mg: 180 },
      { name: '바나나', amount: '1개', calories: 105, protein_g: 1.3, sodium_mg: 1, potassium_mg: 422, phosphorus_mg: 26 },
    ],
    notes: '오늘 아침은 가볍게',
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch',
    foods: [
      { name: '현미밥', amount: '1공기', calories: 218, protein_g: 4.5, sodium_mg: 0, potassium_mg: 83, phosphorus_mg: 162 },
      { name: '구운 닭가슴살', amount: '100g', calories: 165, protein_g: 31, sodium_mg: 74, potassium_mg: 256, phosphorus_mg: 196 },
      { name: '채소 샐러드', amount: '1접시', calories: 50, protein_g: 2, sodium_mg: 30, potassium_mg: 200, phosphorus_mg: 40 },
    ],
  },
  {
    id: '3',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    mealType: 'dinner',
    foods: [
      { name: '파스타', amount: '1인분', calories: 350, protein_g: 12, sodium_mg: 200, potassium_mg: 150, phosphorus_mg: 120 },
      { name: '토마토 소스', amount: '100g', calories: 80, protein_g: 2, sodium_mg: 400, potassium_mg: 300, phosphorus_mg: 30 },
    ],
    notes: '나트륨 섭취 주의',
  },
];

const MEAL_TYPE_CONFIG = {
  breakfast: {
    icon: Coffee,
    label: { ko: '아침', en: 'Breakfast' },
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  lunch: {
    icon: Sun,
    label: { ko: '점심', en: 'Lunch' },
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  dinner: {
    icon: Moon,
    label: { ko: '저녁', en: 'Dinner' },
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  snack: {
    icon: Cookie,
    label: { ko: '간식', en: 'Snack' },
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
  },
};

export const MealHistoryContent: React.FC<MealHistoryContentProps> = ({ language }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const isKo = language === 'ko';

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (number | null)[] = [];

    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  }, [currentMonth]);

  // Get meals for selected date
  const selectedDateMeals = useMemo(() => {
    return MOCK_MEAL_HISTORY.filter(meal => meal.date === selectedDate);
  }, [selectedDate]);

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    return selectedDateMeals.reduce(
      (acc, meal) => {
        meal.foods.forEach(food => {
          acc.calories += food.calories;
          acc.protein_g += food.protein_g;
          acc.sodium_mg += food.sodium_mg;
          acc.potassium_mg += food.potassium_mg;
          acc.phosphorus_mg += food.phosphorus_mg;
        });
        return acc;
      },
      { calories: 0, protein_g: 0, sodium_mg: 0, potassium_mg: 0, phosphorus_mg: 0 }
    );
  }, [selectedDateMeals]);

  // Goals for comparison (simplified)
  const goals = {
    calories: 2000,
    protein_g: 50,
    sodium_mg: 2000,
    potassium_mg: 2000,
    phosphorus_mg: 1000,
  };

  const getProgressStatus = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage < 80) return { icon: TrendingDown, color: 'text-green-500', status: 'good' };
    if (percentage <= 100) return { icon: Minus, color: 'text-yellow-500', status: 'caution' };
    return { icon: TrendingUp, color: 'text-red-500', status: 'over' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isKo
      ? `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const monthNames = isKo
    ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = isKo
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="text-blue-500" size={24} />
            {isKo ? '식사 기록 달력' : 'Meal History Calendar'}
          </h2>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentMonth.getFullYear()} {monthNames[currentMonth.getMonth()]}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="h-10" />;
            }

            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasMeals = MOCK_MEAL_HISTORY.some(meal => meal.date === dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  h-10 rounded-lg text-sm font-medium transition-colors relative
                  ${isSelected
                    ? 'bg-blue-600 text-white'
                    : isToday
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }
                `}
              >
                {day}
                {hasMeals && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Summary */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
          {formatDate(selectedDate)} {isKo ? '요약' : 'Summary'}
        </h3>

        {selectedDateMeals.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {isKo ? '기록된 식사가 없습니다.' : 'No meals recorded for this date.'}
          </p>
        ) : (
          <>
            {/* Daily Totals */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: isKo ? '칼로리' : 'Calories', value: dailyTotals.calories, goal: goals.calories, unit: 'kcal' },
                { label: isKo ? '단백질' : 'Protein', value: dailyTotals.protein_g, goal: goals.protein_g, unit: 'g' },
                { label: isKo ? '나트륨' : 'Sodium', value: dailyTotals.sodium_mg, goal: goals.sodium_mg, unit: 'mg' },
                { label: isKo ? '칼륨' : 'Potassium', value: dailyTotals.potassium_mg, goal: goals.potassium_mg, unit: 'mg' },
                { label: isKo ? '인' : 'Phosphorus', value: dailyTotals.phosphorus_mg, goal: goals.phosphorus_mg, unit: 'mg' },
              ].map(item => {
                const status = getProgressStatus(item.value, item.goal);
                const StatusIcon = status.icon;
                return (
                  <div key={item.label} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                      <StatusIcon className={status.color} size={14} />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {item.value.toLocaleString()} <span className="text-xs text-gray-500">{item.unit}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      / {item.goal.toLocaleString()} {item.unit}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meal List */}
            <div className="space-y-4">
              {selectedDateMeals.map(meal => {
                const config = MEAL_TYPE_CONFIG[meal.mealType];
                const MealIcon = config.icon;
                const mealTotals = meal.foods.reduce(
                  (acc, food) => ({
                    calories: acc.calories + food.calories,
                    protein_g: acc.protein_g + food.protein_g,
                  }),
                  { calories: 0, protein_g: 0 }
                );

                return (
                  <div
                    key={meal.id}
                    className={`${config.bgColor} p-4 rounded-lg`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MealIcon className={config.color} size={20} />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {config.label[language]}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {mealTotals.calories} kcal
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {meal.foods.map((food, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
                        >
                          <div className="flex items-center gap-2">
                            <Utensils size={14} className="text-gray-400" />
                            <span>{food.name}</span>
                            <span className="text-gray-500">({food.amount})</span>
                          </div>
                          <span>{food.calories} kcal</span>
                        </li>
                      ))}
                    </ul>

                    {meal.notes && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-600 pt-2">
                        {meal.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MealHistoryContent;
