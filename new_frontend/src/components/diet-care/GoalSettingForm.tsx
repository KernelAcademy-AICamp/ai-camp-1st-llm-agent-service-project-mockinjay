/**
 * GoalSettingForm Component
 * Form for setting daily nutrition goals
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useDietGoals } from '../../hooks/useDietGoals';
import type { UpdateGoalsRequest } from '../../types/diet-care';

export interface GoalSettingFormProps {
  language: 'en' | 'ko';
}

export const GoalSettingForm: React.FC<GoalSettingFormProps> = ({ language }) => {
  const { goals, saving, saveGoals, loading } = useDietGoals(language);

  const [formData, setFormData] = useState<UpdateGoalsRequest>({
    calories_kcal: 2000,
    protein_g: 50,
    sodium_mg: 2000,
    potassium_mg: 2000,
    phosphorus_mg: 1000,
    fluid_ml: 2000,
  });

  // Sync form with loaded goals
  useEffect(() => {
    if (goals) {
      setFormData({
        calories_kcal: goals.calories_kcal,
        protein_g: goals.protein_g,
        sodium_mg: goals.sodium_mg,
        potassium_mg: goals.potassium_mg,
        phosphorus_mg: goals.phosphorus_mg,
        fluid_ml: goals.fluid_ml,
      });
    }
  }, [goals]);

  const handleChange = (field: keyof UpdateGoalsRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: Number(e.target.value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoals(formData);
  };

  const goalFields = [
    {
      name: 'sodium_mg' as const,
      label: language === 'ko' ? '목표 나트륨 (mg/일)' : 'Target Sodium (mg/day)',
      placeholder: '2000',
    },
    {
      name: 'protein_g' as const,
      label: language === 'ko' ? '목표 단백질 (g/일)' : 'Target Protein (g/day)',
      placeholder: '50',
    },
    {
      name: 'potassium_mg' as const,
      label: language === 'ko' ? '목표 칼륨 (mg/일)' : 'Target Potassium (mg/day)',
      placeholder: '2000',
    },
    {
      name: 'phosphorus_mg' as const,
      label: language === 'ko' ? '목표 인 (mg/일)' : 'Target Phosphorus (mg/day)',
      placeholder: '1000',
    },
    {
      name: 'calories_kcal' as const,
      label: language === 'ko' ? '목표 칼로리 (kcal/일)' : 'Target Calories (kcal/day)',
      placeholder: '2000',
    },
    {
      name: 'fluid_ml' as const,
      label: language === 'ko' ? '목표 수분 (ml/일)' : 'Target Fluid (ml/day)',
      placeholder: '2000',
    },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-center">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Save Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {language === 'ko' ? '목표 설정' : 'Goal Settings'}
        </h2>
        <button
          type="submit"
          form="goal-form"
          disabled={saving}
          className="px-4 py-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: 'rgb(0, 201, 183)' }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = 'rgb(0, 181, 165)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(0, 201, 183)';
          }}
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          {language === 'ko' ? '목표 저장' : 'Save Goals'}
        </button>
      </div>

      {/* Form Card with Gradient Background */}
      <form id="goal-form" onSubmit={handleSubmit}>
        <div
          className="p-6 rounded-2xl transition-all duration-200 dark:bg-gray-800 dark:border dark:border-gray-700"
          style={{
            background: 'linear-gradient(135deg, #F2FFFD 0%, #F8F4FE 100%)'
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm mb-2 text-gray-600 dark:text-gray-300">
                  {field.label}
                </label>
                <input
                  type="number"
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={handleChange(field.name)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    transition-all duration-200
                    focus:border-teal-500 focus:outline-none focus:ring-0
                    placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default GoalSettingForm;
