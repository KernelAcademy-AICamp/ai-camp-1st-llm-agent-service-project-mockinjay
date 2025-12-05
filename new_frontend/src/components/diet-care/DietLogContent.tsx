/**
 * DietLogContent Component
 * Combines goal setting and meal logging forms
 */

import React from 'react';
import { GoalSettingForm } from './GoalSettingForm';
import { MealLogForm } from './MealLogForm';

export interface DietLogContentProps {
  language: 'en' | 'ko';
}

export const DietLogContent: React.FC<DietLogContentProps> = ({ language }) => {
  return (
    <div className="space-y-6">
      <GoalSettingForm language={language} />
      <MealLogForm language={language} />
    </div>
  );
};
