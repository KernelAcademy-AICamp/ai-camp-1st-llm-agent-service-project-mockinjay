import api from './api';
import type { MealType, NutritionAnalysis, NutritionGoal } from '../types/diet-care';

// Frontend-friendly MealEntry type (uses camelCase and string[] for foods)
export interface MealEntry {
  id: string;
  userId: string;
  mealType: MealType;
  foods: string[];
  imageUrl: string;
  nutritionInfo: NutritionAnalysis;
  createdAt: string;
}

const ENDPOINTS = {
  SESSION_CREATE: '/api/diet-care/session/create',
  NUTRI_COACH: '/api/diet-care/nutri-coach',
  MEALS: '/api/diet-care/meals',
  GOALS: '/api/diet-care/goals',
  DAILY_PROGRESS: '/api/diet-care/progress/daily',
} as const;

const FALLBACK_MEAL_TYPE: MealType = 'breakfast';

const EMPTY_NUTRITION: NutritionAnalysis = {
  calories: 0,
  protein: 0,
  sodium: 0,
  potassium: 0,
  phosphorus: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
};

type CreateSessionResponse = {
  session_id: string;
};

type FoodItemResponse = {
  name?: string;
  amount?: string;
  calories?: number;
  protein_g?: number;
  sodium_mg?: number;
  potassium_mg?: number;
  phosphorus_mg?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
};

type NutritionAnalysisPayload = {
  foods?: FoodItemResponse[];
  total_calories?: number;
  total_protein_g?: number;
  total_sodium_mg?: number;
  total_potassium_mg?: number;
  total_phosphorus_mg?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  total_fiber_g?: number;
  recommendations?: string[];
  warnings?: string[];
  analysis_notes?: string;
};

type NutriCoachApiResponse = {
  session_id?: string;
  analysis?: NutritionAnalysisPayload;
  analyzed_at?: string;
  image_url?: string | null;
};

type MealResponsePayload = {
  id?: string;
  _id?: string;
  user_id?: string;
  meal_type?: MealType | string;
  foods?: FoodItemResponse[];
  total_calories?: number;
  total_protein_g?: number;
  total_sodium_mg?: number;
  total_potassium_mg?: number;
  total_phosphorus_mg?: number;
  logged_at?: string;
  image_url?: string | null;
  created_at?: string;
};

type MealListResponse = {
  meals?: MealResponsePayload[];
};

type GoalsResponsePayload = {
  user_id?: string;
  goals?: {
    calories_kcal?: number;
    protein_g?: number;
    sodium_mg?: number;
    potassium_mg?: number;
    phosphorus_mg?: number;
  };
};

type UpdateGoalsRequestPayload = {
  calories_kcal?: number;
  protein_g?: number;
  sodium_mg?: number;
  potassium_mg?: number;
  phosphorus_mg?: number;
};

type NutrientProgressPayload = {
  current?: number;
  target?: number;
  percentage?: number;
};

type DailyProgressPayload = {
  date?: string;
  calories?: NutrientProgressPayload;
  protein?: NutrientProgressPayload;
  sodium?: NutrientProgressPayload;
  potassium?: NutrientProgressPayload;
  phosphorus?: NutrientProgressPayload;
};

function toMealType(value?: string): MealType {
  if (value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack') {
    return value;
  }
  return FALLBACK_MEAL_TYPE;
}

async function createAnalysisSession(): Promise<string> {
  const { data } = await api.post<CreateSessionResponse>(ENDPOINTS.SESSION_CREATE);
  return data.session_id;
}

function mapAnalysisToNutrition(analysis?: NutritionAnalysisPayload): NutritionAnalysis {
  if (!analysis) {
    return { ...EMPTY_NUTRITION };
  }

  return {
    calories: analysis.total_calories ?? 0,
    protein: analysis.total_protein_g ?? 0,
    sodium: analysis.total_sodium_mg ?? 0,
    potassium: analysis.total_potassium_mg ?? 0,
    phosphorus: analysis.total_phosphorus_mg ?? 0,
    carbs: analysis.total_carbs_g ?? 0,
    fat: analysis.total_fat_g ?? 0,
    fiber: analysis.total_fiber_g ?? 0,
  };
}

function sumMacrosFromFoods(foods: FoodItemResponse[] = []): Pick<NutritionAnalysis, 'carbs' | 'fat' | 'fiber'> {
  return foods.reduce(
    (totals, food) => ({
      carbs: totals.carbs + (food.carbs_g ?? 0),
      fat: totals.fat + (food.fat_g ?? 0),
      fiber: totals.fiber + (food.fiber_g ?? 0),
    }),
    { carbs: 0, fat: 0, fiber: 0 }
  );
}

function mapMealEntry(meal: MealResponsePayload): MealEntry {
  const foods = Array.isArray(meal.foods) ? meal.foods : [];
  const macronutrients = sumMacrosFromFoods(foods);
  const nutrition: NutritionAnalysis = {
    calories: meal.total_calories ?? 0,
    protein: meal.total_protein_g ?? 0,
    sodium: meal.total_sodium_mg ?? 0,
    potassium: meal.total_potassium_mg ?? 0,
    phosphorus: meal.total_phosphorus_mg ?? 0,
    carbs: macronutrients.carbs,
    fat: macronutrients.fat,
    fiber: macronutrients.fiber,
  };

  const foodNames = foods
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name && name.trim()));

  return {
    id: meal.id ?? meal._id ?? `meal_${Date.now()}`,
    userId: meal.user_id ?? '',
    mealType: toMealType(typeof meal.meal_type === 'string' ? meal.meal_type : undefined),
    foods: foodNames.length ? foodNames : ['등록된 식사'],
    imageUrl: meal.image_url ?? '',
    nutritionInfo: nutrition,
    createdAt: meal.created_at ?? meal.logged_at ?? new Date().toISOString(),
  };
}

function mapGoalsResponse(payload?: GoalsResponsePayload): NutritionGoal {
  const goals = payload?.goals ?? {};

  return {
    userId: payload?.user_id ?? '',
    dailyCalories: goals.calories_kcal ?? 0,
    dailyProtein: goals.protein_g ?? 0,
    dailySodium: goals.sodium_mg ?? 0,
    dailyPotassium: goals.potassium_mg ?? 0,
    dailyPhosphorus: goals.phosphorus_mg ?? 0,
  };
}

function toUpdateGoalsPayload(goals: Partial<NutritionGoal>): UpdateGoalsRequestPayload {
  const payload: UpdateGoalsRequestPayload = {};

  if (typeof goals.dailyCalories === 'number') {
    payload.calories_kcal = goals.dailyCalories;
  }

  if (typeof goals.dailyProtein === 'number') {
    payload.protein_g = goals.dailyProtein;
  }

  if (typeof goals.dailySodium === 'number') {
    payload.sodium_mg = goals.dailySodium;
  }

  if (typeof goals.dailyPotassium === 'number') {
    payload.potassium_mg = goals.dailyPotassium;
  }

  if (typeof goals.dailyPhosphorus === 'number') {
    payload.phosphorus_mg = goals.dailyPhosphorus;
  }

  return payload;
}

function buildAnalysisPrompt(mealType: MealType, foods: string[]): string {
  const details = foods.filter(Boolean).join(', ');
  return `Meal type: ${mealType}. Foods: ${details || '미입력'}.`;
}

async function downloadImageAsBlob(imageUrl: string): Promise<Blob> {
  if (typeof fetch !== 'function') {
    throw new Error('이미지를 업로드할 수 없는 환경입니다.');
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error('이미지를 불러오지 못했습니다.');
  }

  return response.blob();
}

async function requestNutritionAnalysis(formData: FormData): Promise<NutriCoachApiResponse> {
  const { data } = await api.post<NutriCoachApiResponse>(ENDPOINTS.NUTRI_COACH, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
}

function buildAggregatedFoodItem(foods: string[], analysis: NutritionAnalysis): FoodItemResponse {
  return {
    name: foods.filter(Boolean).join(', ') || '기록된 식사',
    amount: '1 serving',
    calories: analysis.calories,
    protein_g: analysis.protein,
    sodium_mg: analysis.sodium,
    potassium_mg: analysis.potassium,
    phosphorus_mg: analysis.phosphorus,
    carbs_g: analysis.carbs,
    fat_g: analysis.fat,
    fiber_g: analysis.fiber,
  };
}

function buildProgressGoal(progress?: DailyProgressPayload): NutritionGoal {
  return {
    userId: 'current',
    dailyCalories: progress?.calories?.target ?? 0,
    dailyProtein: progress?.protein?.target ?? 0,
    dailySodium: progress?.sodium?.target ?? 0,
    dailyPotassium: progress?.potassium?.target ?? 0,
    dailyPhosphorus: progress?.phosphorus?.target ?? 0,
  };
}

function buildProgressConsumption(progress?: DailyProgressPayload): NutritionAnalysis {
  if (!progress) {
    return { ...EMPTY_NUTRITION };
  }

  return {
    calories: progress.calories?.current ?? 0,
    protein: progress.protein?.current ?? 0,
    sodium: progress.sodium?.current ?? 0,
    potassium: progress.potassium?.current ?? 0,
    phosphorus: progress.phosphorus?.current ?? 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };
}

function computeProgressPercentage(progress?: DailyProgressPayload): number {
  if (!progress) {
    return 0;
  }

  const values = [
    progress.calories?.percentage,
    progress.protein?.percentage,
    progress.sodium?.percentage,
    progress.potassium?.percentage,
    progress.phosphorus?.percentage,
  ].filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  if (!values.length) {
    return 0;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(average * 10) / 10;
}

export async function analyzeNutrition(imageUrl: string, mealType: MealType): Promise<NutritionAnalysis> {
  if (!imageUrl) {
    throw new Error('분석할 이미지가 필요합니다.');
  }

  const sessionId = await createAnalysisSession();
  const imageBlob = await downloadImageAsBlob(imageUrl);
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('image', imageBlob, 'meal-image');
  formData.append('text', `이미지 기반 식단 분석 요청. ${buildAnalysisPrompt(mealType, [])}`);

  const response = await requestNutritionAnalysis(formData);
  return mapAnalysisToNutrition(response.analysis);
}

export async function analyzeNutritionByText(
  foods: string[],
  mealType: MealType
): Promise<NutritionAnalysis> {
  if (!foods.length) {
    throw new Error('분석할 음식 정보를 입력해주세요.');
  }

  const sessionId = await createAnalysisSession();
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('text', buildAnalysisPrompt(mealType, foods));

  const response = await requestNutritionAnalysis(formData);
  return mapAnalysisToNutrition(response.analysis);
}

export async function fetchMealHistory(startDate?: string, endDate?: string): Promise<MealEntry[]> {
  const params: Record<string, string> = {};

  if (startDate) {
    params.start_date = startDate;
  }

  if (endDate) {
    params.end_date = endDate;
  }

  const { data } = await api.get<MealListResponse>(ENDPOINTS.MEALS, {
    params: Object.keys(params).length ? params : undefined,
  });

  const meals = Array.isArray(data?.meals) ? data.meals : [];
  return meals.map((meal) => mapMealEntry(meal));
}

export async function createMealEntry(data: {
  mealType: MealType;
  foods: string[];
  imageUrl?: string;
}): Promise<MealEntry> {
  if (!data.foods.length) {
    throw new Error('기록할 음식 이름을 입력해주세요.');
  }

  const estimatedNutrition = await analyzeNutritionByText(data.foods, data.mealType);
  const payload = {
    meal_type: data.mealType,
    foods: [buildAggregatedFoodItem(data.foods, estimatedNutrition)],
    logged_at: new Date().toISOString(),
    image_url: data.imageUrl,
  };

  const { data: response } = await api.post<MealResponsePayload>(ENDPOINTS.MEALS, payload);
  return mapMealEntry(response);
}

export async function deleteMealEntry(entryId: string): Promise<void> {
  await api.delete(`${ENDPOINTS.MEALS}/${entryId}`);
}

export async function fetchNutritionGoals(): Promise<NutritionGoal> {
  const { data } = await api.get<GoalsResponsePayload>(ENDPOINTS.GOALS);
  return mapGoalsResponse(data);
}

export async function updateNutritionGoals(goals: Partial<NutritionGoal>): Promise<NutritionGoal> {
  const payload = toUpdateGoalsPayload(goals);
  const { data } = await api.put<GoalsResponsePayload>(ENDPOINTS.GOALS, payload);
  return mapGoalsResponse(data);
}

export async function fetchDailyProgress(
  date?: string
): Promise<{ consumed: NutritionAnalysis; goals: NutritionGoal; percentage: number }> {
  const params = date ? { date } : undefined;
  const { data } = await api.get<DailyProgressPayload>(ENDPOINTS.DAILY_PROGRESS, { params });

  return {
    consumed: buildProgressConsumption(data),
    goals: buildProgressGoal(data),
    percentage: computeProgressPercentage(data),
  };
}

export async function getNutriCoachAdvice(query: string): Promise<string> {
  if (!query.trim()) {
    throw new Error('질문을 입력해주세요.');
  }

  const sessionId = await createAnalysisSession();
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('text', query);

  const response = await requestNutritionAnalysis(formData);
  const analysis = response.analysis;
  const recommendations = analysis?.recommendations?.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  );

  if (recommendations && recommendations.length > 0) {
    return recommendations.join('\n');
  }

  if (analysis?.analysis_notes) {
    return analysis.analysis_notes;
  }

  if (analysis?.warnings?.length) {
    return analysis.warnings.filter(Boolean).join('\n');
  }

  return 'NutriCoach에서 제공할 추가 조언이 없습니다.';
}
