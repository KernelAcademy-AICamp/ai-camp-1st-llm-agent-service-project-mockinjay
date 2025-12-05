/**
 * NutritionResults Component
 * Displays nutrition analysis results
 */

import React from 'react';
import { BarChart3, AlertTriangle, Lightbulb } from 'lucide-react';
import type { NutritionAnalysisResult, FoodItem } from '../../types/diet-care';

export interface NutritionResultsProps {
  result: NutritionAnalysisResult;
  language: 'en' | 'ko';
}

export const NutritionResults: React.FC<NutritionResultsProps> = ({ result, language }) => {
  return (
    <div className="mt-6 space-y-4">
      <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart3 className="text-green-600" size={20} />
        {language === 'ko' ? '분석 결과' : 'Analysis Result'}
      </h4>

      {/* Analysis Notes */}
      {result.analysis_notes && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{result.analysis_notes}</p>
        </div>
      )}

      {/* Food Items Table */}
      {result.foods && result.foods.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'ko' ? '음식' : 'Food'}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'ko' ? '양' : 'Amount'}
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
              {result.foods.map((food: FoodItem, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">
                    {food.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {food.amount}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {food.calories} kcal
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {food.protein_g} g
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {food.sodium_mg} mg
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {food.potassium_mg} mg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ko' ? '총 칼로리' : 'Total Calories'}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.total_calories} kcal</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ko' ? '총 단백질' : 'Total Protein'}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.total_protein_g} g</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ko' ? '총 나트륨' : 'Total Sodium'}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.total_sodium_mg} mg</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ko' ? '총 칼륨' : 'Total Potassium'}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.total_potassium_mg} mg</p>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h5 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            {language === 'ko' ? '주의사항' : 'Warnings'}
          </h5>
          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            {result.warnings.map((warning: string, idx: number) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h5 className="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
            <Lightbulb size={16} />
            {language === 'ko' ? '권장사항' : 'Recommendations'}
          </h5>
          <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-400 space-y-1">
            {result.recommendations.map((rec: string, idx: number) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Score */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        {language === 'ko' ? '분석 정확도' : 'Confidence'}: {Math.round(result.confidence_score * 100)}%
      </div>
    </div>
  );
};

export default NutritionResults;
