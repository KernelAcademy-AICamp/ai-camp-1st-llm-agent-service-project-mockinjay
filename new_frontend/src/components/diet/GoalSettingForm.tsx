/**
 * GoalSettingForm Component
 * Set nutrition goals with CKD stage presets
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Target, RefreshCw, Save, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { NutritionGoals, CKDStage } from '../../types/diet';
import { CKD_STAGE_PRESETS as PRESETS } from '../../types/diet';

interface GoalSettingFormProps {
  initialGoals?: NutritionGoals;
  onSave?: (goals: NutritionGoals) => void;
  language?: 'en' | 'ko';
}

/**
 * Goal Setting Form Component
 * Features: preset templates by CKD stage, custom values, validation, reset option
 */
export const GoalSettingForm = memo<GoalSettingFormProps>(({
  initialGoals,
  onSave,
  language = 'en',
}) => {
  const [selectedStage, setSelectedStage] = useState<CKDStage | 'custom'>(
    initialGoals ? 'custom' : 1
  );
  const [goals, setGoals] = useState<NutritionGoals>(
    initialGoals || PRESETS[0].goals
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const t = useMemo(() => ({
    title: language === 'ko' ? '영양 목표 설정' : 'Set Nutrition Goals',
    description: language === 'ko'
      ? '만성콩팥병 단계에 맞는 목표를 설정하거나 직접 입력하세요.'
      : 'Set goals based on CKD stage or customize your own.',
    stage: language === 'ko' ? 'CKD 단계' : 'CKD Stage',
    custom: language === 'ko' ? '직접 입력' : 'Custom',
    nutrients: {
      calories: language === 'ko' ? '칼로리' : 'Calories',
      protein: language === 'ko' ? '단백질' : 'Protein',
      sodium: language === 'ko' ? '나트륨' : 'Sodium',
      potassium: language === 'ko' ? '칼륨' : 'Potassium',
      phosphorus: language === 'ko' ? '인' : 'Phosphorus',
    },
    units: {
      calories: 'kcal/day',
      protein: 'g/day',
      sodium: 'mg/day',
      potassium: 'mg/day',
      phosphorus: 'mg/day',
    },
    save: language === 'ko' ? '목표 저장' : 'Save Goals',
    saving: language === 'ko' ? '저장 중...' : 'Saving...',
    reset: language === 'ko' ? '초기화' : 'Reset',
    info: language === 'ko' ? '정보' : 'Info',
    stageInfo: language === 'ko'
      ? '권장 목표는 일반적인 가이드라인입니다. 개인의 상태에 따라 조정이 필요할 수 있으니 의료진과 상담하세요.'
      : 'Recommended goals are general guidelines. Consult your healthcare provider for personalized targets.',
  }), [language]);

  /**
   * Handle stage selection
   */
  const handleStageChange = useCallback((value: string) => {
    if (value === 'custom') {
      setSelectedStage('custom');
      return;
    }

    const stage = parseInt(value) as CKDStage;
    setSelectedStage(stage);

    const preset = PRESETS.find(p => p.stage === stage);
    if (preset) {
      setGoals(preset.goals);
    }
  }, []);

  /**
   * Update individual goal
   */
  const updateGoal = useCallback((nutrient: keyof NutritionGoals, value: number) => {
    setGoals(prev => ({
      ...prev,
      [nutrient]: value,
    }));
    setSelectedStage('custom');
  }, []);

  /**
   * Reset to default preset
   */
  const handleReset = useCallback(() => {
    const stage = selectedStage === 'custom' ? 1 : selectedStage;
    const preset = PRESETS.find(p => p.stage === stage);
    if (preset) {
      setGoals(preset.goals);
      setSelectedStage(stage);
    }
  }, [selectedStage]);

  /**
   * Save goals
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      // Validate goals
      const isValid = Object.values(goals).every(value => value > 0);
      if (!isValid) {
        throw new Error('All goals must be positive numbers');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      onSave?.(goals);
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setIsSaving(false);
    }
  }, [goals, onSave]);

  const currentPreset = useMemo(() => {
    if (selectedStage === 'custom') return null;
    return PRESETS.find(p => p.stage === selectedStage);
  }, [selectedStage]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stage Selector */}
        <div className="space-y-2">
          <Label htmlFor="stage-select">{t.stage}</Label>
          <Select
            value={selectedStage.toString()}
            onValueChange={handleStageChange}
          >
            <SelectTrigger id="stage-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map(preset => (
                <SelectItem key={preset.stage} value={preset.stage.toString()}>
                  {preset.name} - {preset.description}
                </SelectItem>
              ))}
              <SelectItem value="custom">{t.custom}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Info Alert */}
        {showInfo && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t.stageInfo}
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="w-full"
        >
          <Info className="h-4 w-4 mr-2" />
          {t.info}
        </Button>

        {/* Preset Description */}
        {currentPreset && (
          <div className="p-4 rounded-lg bg-accent border">
            <h4 className="font-semibold text-sm mb-1">{currentPreset.name}</h4>
            <p className="text-xs text-muted-foreground">{currentPreset.description}</p>
          </div>
        )}

        {/* Goal Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(goals) as Array<keyof NutritionGoals>).map(nutrient => (
            <div key={nutrient} className="space-y-2">
              <Label htmlFor={`goal-${nutrient}`}>
                {t.nutrients[nutrient]}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({t.units[nutrient]})
                </span>
              </Label>
              <Input
                id={`goal-${nutrient}`}
                type="number"
                min="0"
                step={nutrient === 'protein' ? '0.1' : '1'}
                value={goals[nutrient]}
                onChange={(e) => updateGoal(nutrient, parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.reset}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t.save}
              </>
            )}
          </Button>
        </div>

        {/* Visual Preview */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-3">
            {language === 'ko' ? '일일 목표 요약' : 'Daily Goals Summary'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(goals) as Array<keyof NutritionGoals>).map(nutrient => (
              <div
                key={nutrient}
                className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center"
              >
                <div className="text-2xl font-bold text-primary">
                  {goals[nutrient]}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t.nutrients[nutrient]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.units[nutrient]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

GoalSettingForm.displayName = 'GoalSettingForm';
