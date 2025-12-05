/**
 * MealLogForm Component
 * Form for logging daily meals - simplified version without react-hook-form
 */

import React, { useState } from 'react';
import { Loader2, Plus, Trash2, BarChart3 } from 'lucide-react';
import { useDietLog } from '../../hooks/useDietLog';
import { MealType } from '../../types/diet-care';
import type { FoodItem } from '../../types/diet-care';

// Available meal types with labels
const MEAL_TYPES = {
  breakfast: { en: 'Breakfast', ko: '아침' },
  lunch: { en: 'Lunch', ko: '점심' },
  dinner: { en: 'Dinner', ko: '저녁' },
  snack: { en: 'Snack', ko: '간식' },
} as const;

// Empty food item template
const emptyFoodItem: FoodItem = {
  name: '',
  amount: '',
  calories: 0,
  protein_g: 0,
  sodium_mg: 0,
  potassium_mg: 0,
  phosphorus_mg: 0,
};

export interface MealLogFormProps {
  language: 'en' | 'ko';
  date?: string;
}

export const MealLogForm: React.FC<MealLogFormProps> = ({
  language,
  date = new Date().toISOString().split('T')[0],
}) => {
  const { logging, logMeal } = useDietLog(date, language);

  // Selected meal type
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.Breakfast);

  // Foods for the current meal
  const [foods, setFoods] = useState<FoodItem[]>([{ ...emptyFoodItem }]);

  // Notes for the meal
  const [notes, setNotes] = useState('');

  /**
   * Add a new food item row
   */
  const handleAddFood = () => {
    setFoods(prev => [...prev, { ...emptyFoodItem }]);
  };

  /**
   * Remove a food item row
   */
  const handleRemoveFood = (index: number) => {
    setFoods(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Update a food item field
   */
  const handleFoodChange = (
    index: number,
    field: keyof FoodItem,
    value: string | number
  ) => {
    setFoods(prev =>
      prev.map((food, i) =>
        i === index ? { ...food, [field]: value } : food
      )
    );
  };

  /**
   * Submit the meal log
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty foods
    const validFoods = foods.filter(food => food.name.trim() !== '');

    if (validFoods.length === 0) {
      return;
    }

    await logMeal(selectedMealType, validFoods, notes || undefined);

    // Reset form after successful submission
    setFoods([{ ...emptyFoodItem }]);
    setNotes('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {language === 'ko' ? '식사 정보 등록' : 'Log Meal Information'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Meal Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            {language === 'ko' ? '식사 종류' : 'Meal Type'}
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(MEAL_TYPES) as [MealType, { en: string; ko: string }][]).map(
              ([type, labels]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMealType(type)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedMealType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {language === 'ko' ? labels.ko : labels.en}
                </button>
              )
            )}
          </div>
        </div>

        {/* Food Items */}
        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {language === 'ko' ? '음식 목록' : 'Food Items'}
            </h3>
            <button
              type="button"
              onClick={handleAddFood}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Plus size={16} />
              {language === 'ko' ? '음식 추가' : 'Add food'}
            </button>
          </div>

          <div className="space-y-3">
            {foods.map((food, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder={language === 'ko' ? '음식명' : 'Food name'}
                  value={food.name}
                  onChange={e => handleFoodChange(index, 'name', e.target.value)}
                  className="md:col-span-5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder={language === 'ko' ? '양 (예: 1인분)' : 'Amount (e.g., 1 serving)'}
                  value={food.amount}
                  onChange={e => handleFoodChange(index, 'amount', e.target.value)}
                  className="md:col-span-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder={language === 'ko' ? '칼로리' : 'Calories'}
                  value={food.calories || ''}
                  onChange={e => handleFoodChange(index, 'calories', Number(e.target.value))}
                  className="md:col-span-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {foods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFood(index)}
                    className="md:col-span-1 px-2 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label={language === 'ko' ? '음식 삭제' : 'Remove food'}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            {language === 'ko' ? '메모 (선택사항)' : 'Notes (optional)'}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={language === 'ko' ? '식사에 대한 메모를 입력하세요...' : 'Add notes about your meal...'}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={logging || foods.every(f => !f.name.trim())}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
        >
          {logging ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {language === 'ko' ? '저장 중...' : 'Saving...'}
            </>
          ) : (
            <>
              <BarChart3 size={20} />
              {language === 'ko' ? '식사 기록 저장' : 'Save Meal Log'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MealLogForm;
