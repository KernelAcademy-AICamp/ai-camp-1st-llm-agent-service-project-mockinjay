# Yj 개발 계획 (Nutri Coach)

> 영양 관리 및 식사 기록

## 담당 기능
- 식사 기록
- 영양소 통계
- 레시피 검색
- 대체 재료 추천

## 의존성
- **jk의 작업**: 인증 API, API Client, UserContext (Week 2 완료 후 시작)

## 개발 순서

### Week 3: 식사 기록 기능

#### 1. 데이터 모델 정의

**파일**: `backend/app/models/nutri.py`
```python
from pydantic import BaseModel
from datetime import datetime
from typing import List

class NutrientInfo(BaseModel):
    calories: float
    protein: float
    sodium: float
    potassium: float
    phosphorus: float

class MealRecord(BaseModel):
    meal_type: str  # "breakfast", "lunch", "dinner", "snack"
    foods: List[str]
    nutrients: NutrientInfo
    date: datetime

class MealRecordResponse(BaseModel):
    nutriRecordId: str  # MongoDB _id와 매핑
    userId: str
    meal_type: str
    foods: List[str]
    nutrients: NutrientInfo
    date: datetime
```

**체크리스트**:
- [ ] Pydantic 모델 작성
- [ ] 영양소 정보 모델
- [ ] 식사 기록 모델

#### 2. MongoDB 스키마 설정

**파일**: `backend/app/db/connection.py` (추가)
```python
# jk가 만든 파일에 추가
nutri_records_collection = db["nutri_records"]
```

**체크리스트**:
- [ ] Collection 추가
- [ ] 인덱스 설정 (user_id, date)

#### 3. 식사 기록 API

**파일**: `backend/app/api/nutri.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from app.models.nutri import MealRecord, MealRecordResponse
from app.db.connection import nutri_records_collection
from app.services.auth import get_current_user
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/nutri", tags=["nutri"])

@router.post("/record")
async def create_meal_record(
    meal: MealRecord,
    user_id: str = Depends(get_current_user)
):
    """식사 기록 생성"""
    meal_doc = {
        "user_id": user_id,
        "meal_type": meal.meal_type,
        "foods": meal.foods,
        "nutrients": meal.nutrients.dict(),
        "date": meal.date,
        "created_at": datetime.utcnow()
    }
    result = nutri_records_collection.insert_one(meal_doc)
    
    return {
        "success": True,
        "id": str(result.inserted_id),
        "message": "식사 기록 완료"
    }

@router.get("/records")
async def get_meal_records(
    start_date: str,
    end_date: str,
    user_id: str = Depends(get_current_user)
):
    """기간별 식사 기록 조회"""
    records = list(nutri_records_collection.find({
        "user_id": user_id,
        "date": {
            "$gte": datetime.fromisoformat(start_date),
            "$lte": datetime.fromisoformat(end_date)
        }
    }).sort("date", -1))
    
    for record in records:
        record["id"] = str(record.pop("_id"))
    
    return {"success": True, "records": records}

@router.delete("/record/{record_id}")
async def delete_meal_record(
    record_id: str,
    user_id: str = Depends(get_current_user)
):
    """식사 기록 삭제"""
    result = nutri_records_collection.delete_one({
        "_id": ObjectId(record_id),
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다")
    
    return {"success": True, "message": "삭제 완료"}
```

**main.py에 라우터 추가**:
```python
from app.api import nutri
app.include_router(nutri.router)
```

**체크리스트**:
- [ ] 식사 기록 생성 API
- [ ] 식사 기록 조회 API
- [ ] 식사 기록 삭제 API
- [ ] Postman으로 테스트

#### 4. 식사 기록 UI

**파일**: `frontend/src/pages/Nutri.tsx`
```typescript
import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { Header } from '@/components/Layout/Header';

interface NutrientInfo {
  calories: number;
  protein: number;
  sodium: number;
  potassium: number;
  phosphorus: number;
}

interface MealRecord {
  nutriRecordId: string;
  meal_type: string;
  foods: string[];
  nutrients: NutrientInfo;
  date: string;
}

export default function Nutri() {
  const [mealType, setMealType] = useState('breakfast');
  const [foods, setFoods] = useState('');
  const [nutrients, setNutrients] = useState<NutrientInfo>({
    calories: 0,
    protein: 0,
    sodium: 0,
    potassium: 0,
    phosphorus: 0
  });
  const [records, setRecords] = useState<MealRecord[]>([]);

  // 오늘 날짜의 식사 기록 불러오기
  useEffect(() => {
    loadTodayRecords();
  }, []);

  const loadTodayRecords = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await apiClient.get('/api/nutri/records', {
        params: {
          start_date: today + 'T00:00:00',
          end_date: today + 'T23:59:59'
        }
      });
      setRecords(response.data.records);
    } catch (error) {
      console.error('기록 불러오기 실패', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/nutri/record', {
        meal_type: mealType,
        foods: foods.split(',').map(f => f.trim()),
        nutrients,
        date: new Date().toISOString()
      });
      alert('식사 기록 완료!');
      setFoods('');
      loadTodayRecords();
    } catch (error) {
      alert('기록 실패');
    }
  };

  const handleDelete = async (nutriRecordId: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/api/nutri/record/${nutriRecordId}`);
      loadTodayRecords();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h1 className="text-3xl font-bold mb-6">영양 관리</h1>
        
        {/* 식사 기록 폼 */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">식사 기록하기</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2">식사 종류</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="breakfast">아침</option>
                <option value="lunch">점심</option>
                <option value="dinner">저녁</option>
                <option value="snack">간식</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2">음식 (쉼표로 구분)</label>
              <input
                type="text"
                value={foods}
                onChange={(e) => setFoods(e.target.value)}
                placeholder="예: 밥, 김치, 된장찌개"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2">칼로리 (kcal)</label>
                <input
                  type="number"
                  value={nutrients.calories}
                  onChange={(e) => setNutrients({...nutrients, calories: Number(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2">단백질 (g)</label>
                <input
                  type="number"
                  value={nutrients.protein}
                  onChange={(e) => setNutrients({...nutrients, protein: Number(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2">나트륨 (mg)</label>
                <input
                  type="number"
                  value={nutrients.sodium}
                  onChange={(e) => setNutrients({...nutrients, sodium: Number(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2">칼륨 (mg)</label>
                <input
                  type="number"
                  value={nutrients.potassium}
                  onChange={(e) => setNutrients({...nutrients, potassium: Number(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              기록하기
            </button>
          </form>
        </div>

        {/* 오늘의 식사 기록 */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">오늘의 식사</h2>
          {records.length === 0 ? (
            <p className="text-gray-500">기록이 없습니다</p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="border p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">
                      {record.meal_type === 'breakfast' && '아침'}
                      {record.meal_type === 'lunch' && '점심'}
                      {record.meal_type === 'dinner' && '저녁'}
                      {record.meal_type === 'snack' && '간식'}
                    </h3>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                  <p className="text-gray-600 mb-2">{record.foods.join(', ')}</p>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>칼로리: {record.nutrients.calories}kcal</div>
                    <div>단백질: {record.nutrients.protein}g</div>
                    <div>나트륨: {record.nutrients.sodium}mg</div>
                    <div>칼륨: {record.nutrients.potassium}mg</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

**체크리스트**:
- [ ] 식사 기록 폼
- [ ] 영양소 입력
- [ ] 오늘의 기록 목록
- [ ] 삭제 기능

### Week 4: 통계 및 레시피 검색

#### 5. 영양소 통계 API

**파일**: `backend/app/api/nutri.py` (추가)
```python
@router.get("/stats")
async def get_nutrition_stats(
    start_date: str,
    end_date: str,
    user_id: str = Depends(get_current_user)
):
    """기간별 영양소 통계"""
    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "date": {
                    "$gte": datetime.fromisoformat(start_date),
                    "$lte": datetime.fromisoformat(end_date)
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "total_calories": {"$sum": "$nutrients.calories"},
                "total_protein": {"$sum": "$nutrients.protein"},
                "total_sodium": {"$sum": "$nutrients.sodium"},
                "total_potassium": {"$sum": "$nutrients.potassium"},
                "avg_calories": {"$avg": "$nutrients.calories"},
                "avg_protein": {"$avg": "$nutrients.protein"},
                "avg_sodium": {"$avg": "$nutrients.sodium"},
                "avg_potassium": {"$avg": "$nutrients.potassium"}
            }
        }
    ]
    
    result = list(nutri_records_collection.aggregate(pipeline))
    
    if not result:
        return {
            "success": True,
            "stats": {
                "total_calories": 0,
                "total_protein": 0,
                "total_sodium": 0,
                "total_potassium": 0,
                "avg_calories": 0,
                "avg_protein": 0,
                "avg_sodium": 0,
                "avg_potassium": 0
            }
        }
    
    return {"success": True, "stats": result[0]}
```

**체크리스트**:
- [ ] MongoDB aggregation 사용
- [ ] 평균 계산
- [ ] 합계 계산

#### 6. 레시피 검색 API

**파일**: `backend/app/api/nutri.py` (추가)
```python
# 간단한 mock 데이터 (실제로는 DB에서 가져오기)
RECIPES = [
    {
        "id": "1",
        "name": "저염 된장찌개",
        "ingredients": ["두부", "호박", "감자", "저염된장"],
        "nutrients": {
            "calories": 120,
            "protein": 8,
            "sodium": 400,
            "potassium": 300
        },
        "instructions": "1. 물을 끓인다. 2. 재료를 넣는다. 3. 된장을 푼다."
    },
    {
        "id": "2",
        "name": "닭가슴살 샐러드",
        "ingredients": ["닭가슴살", "양상추", "토마토", "올리브오일"],
        "nutrients": {
            "calories": 180,
            "protein": 25,
            "sodium": 200,
            "potassium": 400
        },
        "instructions": "1. 닭가슴살을 삶는다. 2. 야채를 썬다. 3. 섞는다."
    }
]

@router.get("/recipes")
async def search_recipes(query: str = ""):
    """레시피 검색"""
    if not query:
        return {"success": True, "recipes": RECIPES}
    
    # 간단한 키워드 검색
    filtered = [
        recipe for recipe in RECIPES
        if query.lower() in recipe["name"].lower() or
           any(query.lower() in ing.lower() for ing in recipe["ingredients"])
    ]
    
    return {"success": True, "recipes": filtered}
```

**체크리스트**:
- [ ] 레시피 데이터 구조
- [ ] 검색 기능
- [ ] Mock 데이터 준비

#### 7. 통계 및 레시피 UI

**파일**: `frontend/src/pages/Nutri.tsx` (추가)
```typescript
// 기존 코드에 추가

const [stats, setStats] = useState<any>(null);
const [recipes, setRecipes] = useState<any[]>([]);
const [recipeQuery, setRecipeQuery] = useState('');

const loadWeeklyStats = async () => {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  try {
    const response = await apiClient.get('/api/nutri/stats', {
      params: {
        start_date: weekAgo.toISOString(),
        end_date: today.toISOString()
      }
    });
    setStats(response.data.stats);
  } catch (error) {
    console.error('통계 불러오기 실패', error);
  }
};

const searchRecipes = async () => {
  try {
    const response = await apiClient.get('/api/nutri/recipes', {
      params: { query: recipeQuery }
    });
    setRecipes(response.data.recipes);
  } catch (error) {
    console.error('레시피 검색 실패', error);
  }
};

// JSX에 추가
<div className="bg-white p-6 rounded shadow mb-6">
  <h2 className="text-xl font-bold mb-4">주간 통계</h2>
  {stats ? (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600">평균 칼로리</p>
        <p className="text-2xl font-bold">{stats.avg_calories.toFixed(0)} kcal</p>
      </div>
      <div>
        <p className="text-gray-600">평균 단백질</p>
        <p className="text-2xl font-bold">{stats.avg_protein.toFixed(1)} g</p>
      </div>
      <div>
        <p className="text-gray-600">평균 나트륨</p>
        <p className="text-2xl font-bold">{stats.avg_sodium.toFixed(0)} mg</p>
      </div>
      <div>
        <p className="text-gray-600">평균 칼륨</p>
        <p className="text-2xl font-bold">{stats.avg_potassium.toFixed(0)} mg</p>
      </div>
    </div>
  ) : (
    <button onClick={loadWeeklyStats} className="text-blue-500">
      통계 불러오기
    </button>
  )}
</div>

<div className="bg-white p-6 rounded shadow">
  <h2 className="text-xl font-bold mb-4">레시피 검색</h2>
  <div className="flex gap-2 mb-4">
    <input
      type="text"
      value={recipeQuery}
      onChange={(e) => setRecipeQuery(e.target.value)}
      placeholder="재료 또는 요리명"
      className="flex-1 p-2 border rounded"
    />
    <button
      onClick={searchRecipes}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      검색
    </button>
  </div>
  <div className="space-y-4">
    {recipes.map((recipe) => (
      <div key={recipe.id} className="border p-4 rounded">
        <h3 className="font-bold mb-2">{recipe.name}</h3>
        <p className="text-sm text-gray-600 mb-2">
          재료: {recipe.ingredients.join(', ')}
        </p>
        <div className="grid grid-cols-4 gap-2 text-sm mb-2">
          <div>칼로리: {recipe.nutrients.calories}kcal</div>
          <div>단백질: {recipe.nutrients.protein}g</div>
          <div>나트륨: {recipe.nutrients.sodium}mg</div>
          <div>칼륨: {recipe.nutrients.potassium}mg</div>
        </div>
        <p className="text-sm">{recipe.instructions}</p>
      </div>
    ))}
  </div>
</div>
```

**체크리스트**:
- [ ] 주간 통계 표시
- [ ] 레시피 검색 UI
- [ ] 레시피 목록 표시

## 완료 기준

### Backend
- [ ] 식사 기록 API 작동 (생성, 조회, 삭제)
- [ ] 영양소 통계 API 작동
- [ ] 레시피 검색 API 작동
- [ ] JWT 인증 적용

### Frontend
- [ ] 식사 기록 폼
- [ ] 오늘의 식사 목록
- [ ] 주간 통계 표시
- [ ] 레시피 검색 기능
- [ ] 반응형 디자인

### 통합
- [ ] jk의 인증 API와 연동
- [ ] Header 컴포넌트 사용
- [ ] API Client 사용

## 추가 기능 (선택)
- 대체 재료 추천 AI
- 영양소 계산기
- 차트로 통계 시각화
- 즐겨찾는 레시피
