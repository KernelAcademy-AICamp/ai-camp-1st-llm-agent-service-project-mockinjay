# Diet Care API Service - Usage Examples

## React Component Integration Examples

### 1. Food Image Analysis Component

```typescript
import React, { useState } from 'react';
import { analyzeFood, DietCareApiError, ErrorCodes } from '@/services/dietCareApi';
import { MealType, type SessionId } from '@/types/diet-care';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FoodAnalyzerProps {
  sessionId: SessionId;
  onAnalysisComplete?: (result: NutritionAnalysisSuccess) => void;
}

export function FoodAnalyzer({ sessionId, onAnalysisComplete }: FoodAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const result = await analyzeFood(
        sessionId,
        selectedFile,
        {
          mealType: MealType.Lunch,
          notes: 'Analyzed via image upload',
          userProfile: {
            age: 45,
            weight_kg: 70,
            height_cm: 170,
            ckd_stage: 3,
            activity_level: 'moderate'
          }
        },
        controller.signal
      );

      if (result.type === 'success') {
        toast.success('Food analyzed successfully!');
        onAnalysisComplete?.(result);
      } else {
        // Handle analysis error
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof DietCareApiError) {
        if (error.is(ErrorCodes.CANCELLED)) {
          toast.info('Analysis cancelled');
        } else if (error.is(ErrorCodes.INVALID_IMAGE)) {
          toast.error('Invalid image. Please upload a clear photo of your food.');
        } else if (error.is(ErrorCodes.NETWORK_ERROR)) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setIsAnalyzing(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isAnalyzing}
      />

      {selectedFile && (
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
          </Button>

          {isAnalyzing && (
            <Button
              onClick={handleCancel}
              variant="outline"
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. Meal Logger Component

```typescript
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logMeal } from '@/services/dietCareApi';
import { MealType, type MealEntry, type SessionId } from '@/types/diet-care';
import { toast } from 'sonner';

interface MealLoggerProps {
  userId: string;
  sessionId: SessionId;
  analysisResult: NutritionAnalysisSuccess;
  mealType: MealType;
}

export function MealLogger({
  userId,
  sessionId,
  analysisResult,
  mealType
}: MealLoggerProps) {
  const queryClient = useQueryClient();

  const logMealMutation = useMutation({
    mutationFn: async (notes?: string) => {
      return await logMeal(userId, {
        sessionId,
        mealType,
        consumedAt: new Date().toISOString(),
        foods: analysisResult.foods,
        totals: analysisResult.totals,
        notes,
        imageUrl: analysisResult.imageUrl
      });
    },
    onSuccess: (meal) => {
      toast.success('Meal logged successfully!');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['meals', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyProgress', userId] });
      queryClient.invalidateQueries({ queryKey: ['weeklyStats', userId] });
    },
    onError: (error) => {
      if (error instanceof DietCareApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to log meal');
      }
    }
  });

  const [notes, setNotes] = React.useState('');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Foods Detected:</h3>
        <ul className="list-disc list-inside">
          {analysisResult.foods.map((food) => (
            <li key={food.id}>
              {food.name} - {food.servingSize} ({food.nutrition.calories} kcal)
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Add any notes about this meal..."
        />
      </div>

      <Button
        onClick={() => logMealMutation.mutate(notes)}
        disabled={logMealMutation.isPending}
      >
        {logMealMutation.isPending ? 'Logging...' : 'Log This Meal'}
      </Button>
    </div>
  );
}
```

### 3. Daily Progress Dashboard

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailyProgress } from '@/services/dietCareApi';
import { Progress } from '@/components/ui/progress';

interface DailyProgressDashboardProps {
  userId: string;
  date?: string;
}

export function DailyProgressDashboard({ userId, date }: DailyProgressDashboardProps) {
  const { data: progress, isLoading, error } = useQuery({
    queryKey: ['dailyProgress', userId, date],
    queryFn: () => getDailyProgress(userId, date),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <div>Loading progress...</div>;
  }

  if (error) {
    return <div>Error loading progress: {error.message}</div>;
  }

  if (!progress) {
    return null;
  }

  const nutrients = [
    { name: 'Calories', data: progress.calories, unit: 'kcal' },
    { name: 'Protein', data: progress.protein, unit: 'g' },
    { name: 'Sodium', data: progress.sodium, unit: 'mg' },
    { name: 'Potassium', data: progress.potassium, unit: 'mg' },
    { name: 'Phosphorus', data: progress.phosphorus, unit: 'mg' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under':
        return 'text-yellow-600';
      case 'optimal':
        return 'text-green-600';
      case 'over':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Progress</h2>
        <span className="text-sm text-gray-500">
          {progress.meals_logged} / {progress.total_meals} meals logged
        </span>
      </div>

      {nutrients.map(({ name, data, unit }) => (
        <div key={name} className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">{name}</span>
            <span className={getStatusColor(data.status)}>
              {data.current} / {data.target} {unit}
            </span>
          </div>
          <Progress value={data.percentage} className="h-2" />
          <div className="text-xs text-gray-500 text-right">
            {data.percentage.toFixed(1)}% of daily goal
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 4. Goals Settings Component

```typescript
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGoals, saveGoals } from '@/services/dietCareApi';
import { CKDStage } from '@/types/diet-care';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface GoalsSettingsProps {
  userId: string;
}

export function GoalsSettings({ userId }: GoalsSettingsProps) {
  const queryClient = useQueryClient();

  const { data: currentGoals, isLoading } = useQuery({
    queryKey: ['dietGoals', userId],
    queryFn: () => getGoals(userId),
  });

  const [formData, setFormData] = React.useState({
    dailyCalories: 0,
    dailyProtein: 0,
    dailySodium: 0,
    dailyPotassium: 0,
    dailyPhosphorus: 0,
  });

  React.useEffect(() => {
    if (currentGoals) {
      setFormData({
        dailyCalories: currentGoals.dailyCalories,
        dailyProtein: currentGoals.dailyProtein,
        dailySodium: currentGoals.dailySodium,
        dailyPotassium: currentGoals.dailyPotassium,
        dailyPhosphorus: currentGoals.dailyPhosphorus,
      });
    }
  }, [currentGoals]);

  const saveGoalsMutation = useMutation({
    mutationFn: () => saveGoals(userId, formData),
    onSuccess: (updatedGoals) => {
      toast.success('Goals updated successfully!');
      queryClient.setQueryData(['dietGoals', userId], updatedGoals);
    },
    onError: (error) => {
      toast.error('Failed to update goals');
    }
  });

  if (isLoading) {
    return <div>Loading goals...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Nutrition Goals</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Daily Calories (kcal)
          </label>
          <Input
            type="number"
            value={formData.dailyCalories}
            onChange={(e) => setFormData({
              ...formData,
              dailyCalories: parseInt(e.target.value)
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Daily Protein (g)
          </label>
          <Input
            type="number"
            value={formData.dailyProtein}
            onChange={(e) => setFormData({
              ...formData,
              dailyProtein: parseInt(e.target.value)
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Daily Sodium (mg)
          </label>
          <Input
            type="number"
            value={formData.dailySodium}
            onChange={(e) => setFormData({
              ...formData,
              dailySodium: parseInt(e.target.value)
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Daily Potassium (mg)
          </label>
          <Input
            type="number"
            value={formData.dailyPotassium}
            onChange={(e) => setFormData({
              ...formData,
              dailyPotassium: parseInt(e.target.value)
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Daily Phosphorus (mg)
          </label>
          <Input
            type="number"
            value={formData.dailyPhosphorus}
            onChange={(e) => setFormData({
              ...formData,
              dailyPhosphorus: parseInt(e.target.value)
            })}
          />
        </div>
      </div>

      <Button
        onClick={() => saveGoalsMutation.mutate()}
        disabled={saveGoalsMutation.isPending}
      >
        {saveGoalsMutation.isPending ? 'Saving...' : 'Save Goals'}
      </Button>
    </div>
  );
}
```

### 5. Meal History List

```typescript
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMeals, deleteMeal } from '@/services/dietCareApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MealHistoryProps {
  userId: string;
  startDate?: string;
  endDate?: string;
}

export function MealHistory({ userId, startDate, endDate }: MealHistoryProps) {
  const queryClient = useQueryClient();

  const { data: meals, isLoading } = useQuery({
    queryKey: ['meals', userId, startDate, endDate],
    queryFn: () => getMeals(userId, startDate, endDate),
  });

  const deleteMealMutation = useMutation({
    mutationFn: (mealId: MealEntryId) => deleteMeal(userId, mealId),
    onSuccess: () => {
      toast.success('Meal deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['meals', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyProgress', userId] });
    },
    onError: (error) => {
      toast.error('Failed to delete meal');
    }
  });

  if (isLoading) {
    return <div>Loading meals...</div>;
  }

  if (!meals || meals.length === 0) {
    return <div>No meals logged yet.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Meal History</h2>

      {meals.map((meal) => (
        <Card key={meal.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">
                {meal.mealType}
              </h3>
              <p className="text-sm text-gray-500">
                {format(new Date(meal.consumedAt), 'PPpp')}
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMealMutation.mutate(meal.id)}
              disabled={deleteMealMutation.isPending}
            >
              Delete
            </Button>
          </div>

          <div className="mt-3">
            <h4 className="font-medium text-sm mb-2">Foods:</h4>
            <ul className="list-disc list-inside text-sm">
              {meal.foods.map((food) => (
                <li key={food.id}>
                  {food.name} - {food.servingSize}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Calories:</span>{' '}
              <span className="font-medium">{meal.totals.calories} kcal</span>
            </div>
            <div>
              <span className="text-gray-500">Protein:</span>{' '}
              <span className="font-medium">{meal.totals.protein} g</span>
            </div>
            <div>
              <span className="text-gray-500">Sodium:</span>{' '}
              <span className="font-medium">{meal.totals.sodium} mg</span>
            </div>
          </div>

          {meal.notes && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 italic">{meal.notes}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

### 6. Weekly Stats Chart

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWeeklyStats } from '@/services/dietCareApi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WeeklyStatsChartProps {
  userId: string;
}

export function WeeklyStatsChart({ userId }: WeeklyStatsChartProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['weeklyStats', userId],
    queryFn: () => getWeeklyStats(userId),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return <div>Loading weekly stats...</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Weekly Summary</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {stats.streak_days}
          </div>
          <div className="text-sm text-gray-500">Day Streak</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {stats.average_compliance.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Avg Compliance</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            {stats.total_meals_logged}
          </div>
          <div className="text-sm text-gray-500">Meals Logged</div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold mb-2">Daily Breakdown</h3>
        {stats.daily_summaries.map((day) => {
          const complianceColor =
            day.compliance_score >= 80
              ? 'bg-green-100 text-green-800'
              : day.compliance_score >= 60
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800';

          return (
            <div
              key={day.date}
              className="flex justify-between items-center p-2 border rounded"
            >
              <div>
                <div className="font-medium">
                  {format(new Date(day.date), 'EEE, MMM d')}
                </div>
                <div className="text-sm text-gray-500">
                  {day.meals_count} meals - {day.total_calories} kcal
                </div>
              </div>
              <Badge className={complianceColor}>
                {day.compliance_score.toFixed(0)}%
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

### 7. Session Management Hook

```typescript
import { useState, useEffect } from 'react';
import { createSession, getSession } from '@/services/dietCareApi';
import { CKDStage, type SessionId, type UserProfile } from '@/types/diet-care';

export function useSessionManagement(userProfile: UserProfile) {
  const [sessionId, setSessionId] = useState<SessionId | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeSession() {
      setIsCreatingSession(true);
      setError(null);

      try {
        const { session, goals } = await createSession(userProfile);
        setSessionId(session.id);

        // Store session ID for later use
        localStorage.setItem('diet_care_session_id', session.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session');
      } finally {
        setIsCreatingSession(false);
      }
    }

    // Check for existing session
    const existingSessionId = localStorage.getItem('diet_care_session_id');
    if (existingSessionId) {
      setSessionId(existingSessionId as SessionId);
    } else {
      initializeSession();
    }
  }, [userProfile]);

  const refreshSession = async () => {
    setIsCreatingSession(true);
    setError(null);

    try {
      const { session } = await createSession(userProfile);
      setSessionId(session.id);
      localStorage.setItem('diet_care_session_id', session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  return {
    sessionId,
    isCreatingSession,
    error,
    refreshSession,
  };
}

// Usage in component:
function DietCareApp() {
  const userProfile: UserProfile = {
    ckdStage: CKDStage.Stage3a,
    age: 45,
    weight: 70,
    height: 170,
    sex: 'MALE',
    activityLevel: 'MODERATE'
  };

  const { sessionId, isCreatingSession, error } = useSessionManagement(userProfile);

  if (isCreatingSession) {
    return <div>Initializing session...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!sessionId) {
    return null;
  }

  return (
    <div>
      <FoodAnalyzer sessionId={sessionId} />
      {/* Other components */}
    </div>
  );
}
```

## Custom Hooks for Common Patterns

### useNutritionAnalysis Hook

```typescript
import { useState } from 'react';
import { analyzeFood, type SessionId } from '@/services/dietCareApi';

export function useNutritionAnalysis(sessionId: SessionId) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionAnalysisResult | null>(null);
  const [error, setError] = useState<DietCareApiError | null>(null);

  const analyze = async (file: File, options?: AnalysisOptions) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResult = await analyzeFood(sessionId, file, options);
      setResult(analysisResult);
      return analysisResult;
    } catch (err) {
      if (err instanceof DietCareApiError) {
        setError(err);
      }
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    analyze,
    reset,
    isAnalyzing,
    result,
    error,
  };
}
```

### useMealLogging Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logMeal, deleteMeal } from '@/services/dietCareApi';
import { toast } from 'sonner';

export function useMealLogging(userId: string) {
  const queryClient = useQueryClient();

  const logMealMutation = useMutation({
    mutationFn: (meal: Omit<MealEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
      logMeal(userId, meal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyProgress', userId] });
      toast.success('Meal logged successfully!');
    },
    onError: (error) => {
      toast.error('Failed to log meal');
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: (mealId: MealEntryId) => deleteMeal(userId, mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyProgress', userId] });
      toast.success('Meal deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete meal');
    },
  });

  return {
    logMeal: logMealMutation.mutate,
    deleteMeal: deleteMealMutation.mutate,
    isLoggingMeal: logMealMutation.isPending,
    isDeletingMeal: deleteMealMutation.isPending,
  };
}
```

These examples demonstrate real-world usage patterns with proper error handling, loading states, and React Query integration.
