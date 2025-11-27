/**
 * MealLogForm Component
 * Multi-tab meal logging with dynamic food items
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { MealType, FoodItem, AmountUnit, MealLog } from '../../types/diet';

interface MealLogFormProps {
  onSave?: (mealLog: MealLog) => void;
  initialData?: Partial<MealLog>;
  language?: 'en' | 'ko';
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const AMOUNT_UNITS: AmountUnit[] = ['g', 'cup', 'portion', 'ml', 'oz'];

const DEFAULT_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '12:00',
  dinner: '18:00',
  snack: '15:00',
};

/**
 * Meal Log Form Component
 * Features: 4 meal tabs, dynamic food rows, autocomplete, amount units, time picker
 */
export const MealLogForm = memo<MealLogFormProps>(({
  onSave,
  initialData: _initialData,
  language = 'en',
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [mealData, setMealData] = useState<Record<MealType, { foods: FoodItem[]; time: string; notes: string }>>(() => ({
    breakfast: { foods: [createEmptyFoodItem()], time: DEFAULT_TIMES.breakfast, notes: '' },
    lunch: { foods: [createEmptyFoodItem()], time: DEFAULT_TIMES.lunch, notes: '' },
    dinner: { foods: [createEmptyFoodItem()], time: DEFAULT_TIMES.dinner, notes: '' },
    snack: { foods: [createEmptyFoodItem()], time: DEFAULT_TIMES.snack, notes: '' },
  }));
  const [isSaving, setIsSaving] = useState(false);

  const t = useMemo(() => ({
    meals: {
      breakfast: language === 'ko' ? '아침' : 'Breakfast',
      lunch: language === 'ko' ? '점심' : 'Lunch',
      dinner: language === 'ko' ? '저녁' : 'Dinner',
      snack: language === 'ko' ? '간식' : 'Snack',
    },
    foodName: language === 'ko' ? '음식명' : 'Food name',
    amount: language === 'ko' ? '양' : 'Amount',
    unit: language === 'ko' ? '단위' : 'Unit',
    time: language === 'ko' ? '시간' : 'Time',
    notes: language === 'ko' ? '메모' : 'Notes',
    addFood: language === 'ko' ? '음식 추가' : 'Add food',
    save: language === 'ko' ? '저장' : 'Save',
    saving: language === 'ko' ? '저장 중...' : 'Saving...',
    removeFood: language === 'ko' ? '삭제' : 'Remove',
    notesPlaceholder: language === 'ko' ? '메모를 입력하세요 (선택사항)' : 'Add notes (optional)',
  }), [language]);

  /**
   * Create empty food item
   */
  function createEmptyFoodItem(): FoodItem {
    return {
      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      amount: 0,
      unit: 'g',
    };
  }

  /**
   * Add food item to current meal
   */
  const addFoodItem = useCallback(() => {
    setMealData(prev => ({
      ...prev,
      [selectedMealType]: {
        ...prev[selectedMealType],
        foods: [...prev[selectedMealType].foods, createEmptyFoodItem()],
      },
    }));
  }, [selectedMealType]);

  /**
   * Remove food item
   */
  const removeFoodItem = useCallback((foodId: string) => {
    setMealData(prev => {
      const currentFoods = prev[selectedMealType].foods;
      // Keep at least one food item
      if (currentFoods.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        [selectedMealType]: {
          ...prev[selectedMealType],
          foods: currentFoods.filter(food => food.id !== foodId),
        },
      };
    });
  }, [selectedMealType]);

  /**
   * Update food item field
   */
  const updateFoodItem = useCallback((foodId: string, field: keyof FoodItem, value: string | number) => {
    setMealData(prev => ({
      ...prev,
      [selectedMealType]: {
        ...prev[selectedMealType],
        foods: prev[selectedMealType].foods.map(food =>
          food.id === foodId ? { ...food, [field]: value } : food
        ),
      },
    }));
  }, [selectedMealType]);

  /**
   * Update meal time
   */
  const updateMealTime = useCallback((time: string) => {
    setMealData(prev => ({
      ...prev,
      [selectedMealType]: {
        ...prev[selectedMealType],
        time,
      },
    }));
  }, [selectedMealType]);

  /**
   * Update meal notes
   */
  const updateNotes = useCallback((notes: string) => {
    setMealData(prev => ({
      ...prev,
      [selectedMealType]: {
        ...prev[selectedMealType],
        notes,
      },
    }));
  }, [selectedMealType]);

  /**
   * Save meal log
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const currentMeal = mealData[selectedMealType];
      const validFoods = currentMeal.foods.filter(food => food.name.trim() !== '');

      if (validFoods.length === 0) {
        // Show error - no valid foods
        setIsSaving(false);
        return;
      }

      const mealLog: MealLog = {
        id: `meal-${Date.now()}`,
        type: selectedMealType,
        date: new Date().toISOString().split('T')[0],
        time: currentMeal.time,
        foods: validFoods,
        notes: currentMeal.notes || undefined,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      onSave?.(mealLog);

      // Reset current meal
      setMealData(prev => ({
        ...prev,
        [selectedMealType]: {
          foods: [createEmptyFoodItem()],
          time: DEFAULT_TIMES[selectedMealType],
          notes: '',
        },
      }));
    } catch (error) {
      console.error('Error saving meal log:', error);
    } finally {
      setIsSaving(false);
    }
  }, [mealData, selectedMealType, onSave]);

  const currentMeal = mealData[selectedMealType];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {language === 'ko' ? '식사 기록' : 'Meal Log'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as MealType)}>
          <TabsList className="grid w-full grid-cols-4">
            {MEAL_TYPES.map(mealType => (
              <TabsTrigger key={mealType} value={mealType}>
                {t.meals[mealType]}
              </TabsTrigger>
            ))}
          </TabsList>

          {MEAL_TYPES.map(mealType => (
            <TabsContent key={mealType} value={mealType} className="space-y-4 mt-4">
              {/* Time Picker */}
              <div className="space-y-2">
                <Label htmlFor={`time-${mealType}`} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t.time}
                </Label>
                <Input
                  id={`time-${mealType}`}
                  type="time"
                  value={currentMeal.time}
                  onChange={(e) => updateMealTime(e.target.value)}
                  className="max-w-[150px]"
                />
              </div>

              {/* Food Items */}
              <div className="space-y-3">
                <Label>{language === 'ko' ? '음식 목록' : 'Food Items'}</Label>
                {currentMeal.foods.map((food, index) => (
                  <div key={food.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`food-name-${food.id}`} className="text-xs text-muted-foreground">
                        {t.foodName}
                      </Label>
                      <Input
                        id={`food-name-${food.id}`}
                        type="text"
                        placeholder={language === 'ko' ? '예: 현미밥' : 'e.g., Brown rice'}
                        value={food.name}
                        onChange={(e) => updateFoodItem(food.id, 'name', e.target.value)}
                        className="w-full"
                        aria-label={`${t.foodName} ${index + 1}`}
                      />
                    </div>

                    <div className="w-24 space-y-2">
                      <Label htmlFor={`food-amount-${food.id}`} className="text-xs text-muted-foreground">
                        {t.amount}
                      </Label>
                      <Input
                        id={`food-amount-${food.id}`}
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={food.amount || ''}
                        onChange={(e) => updateFoodItem(food.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full"
                        aria-label={`${t.amount} ${index + 1}`}
                      />
                    </div>

                    <div className="w-28 space-y-2">
                      <Label htmlFor={`food-unit-${food.id}`} className="text-xs text-muted-foreground">
                        {t.unit}
                      </Label>
                      <Select
                        value={food.unit}
                        onValueChange={(value) => updateFoodItem(food.id, 'unit', value)}
                      >
                        <SelectTrigger id={`food-unit-${food.id}`} aria-label={`${t.unit} ${index + 1}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AMOUNT_UNITS.map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFoodItem(food.id)}
                      disabled={currentMeal.foods.length <= 1}
                      aria-label={`${t.removeFood} ${food.name || `item ${index + 1}`}`}
                      className="mb-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFoodItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addFood}
                </Button>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor={`notes-${mealType}`}>{t.notes}</Label>
                <Input
                  id={`notes-${mealType}`}
                  type="text"
                  placeholder={t.notesPlaceholder}
                  value={currentMeal.notes}
                  onChange={(e) => updateNotes(e.target.value)}
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? t.saving : t.save}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
});

MealLogForm.displayName = 'MealLogForm';
