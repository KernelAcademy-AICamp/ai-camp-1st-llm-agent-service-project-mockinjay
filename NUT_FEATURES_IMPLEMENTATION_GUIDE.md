# NUT Features Implementation Guide

This guide provides step-by-step instructions to implement the missing NUT features (NUT-001 to NUT-005) based on the test report findings.

---

## Quick Fixes (Can be done immediately)

### 1. Fix CORS Configuration

**File:** `/backend/app/main.py`

**Current Code:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://192.168.129.32:5173",
        "http://192.168.129.32:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Fix:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",  # Add this line
        "http://192.168.129.32:5173",
        "http://192.168.129.32:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Fix Duplicate H1 Tags

**File:** `/new_frontend/src/pages/DietCarePageEnhanced.tsx`

**Current Code (Line 20-21):**
```tsx
<h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
  {t.nav.dietCare}
</h1>
```

**Fix:** Change to h2 if there's another h1 in the layout, or ensure only one h1 exists per page.

---

## Backend Implementation

### 3. Create Nutrition API Router

**File:** `/backend/app/api/nutri.py` (currently empty)

```python
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import logging

router = APIRouter(prefix="/api/diet-care", tags=["nutrition"])
logger = logging.getLogger(__name__)


@router.post("/nutri-coach")
async def analyze_nutrition(
    session_id: str = Form(...),
    image: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    user_profile: str = Form("patient")
):
    """
    NUT-001: Food/Nutrition Search and Analysis

    Analyzes food image or text input and returns nutrition information
    with risk assessment based on user's disease stage.
    """
    try:
        logger.info(f"Nutrition analysis request - Session: {session_id}")

        if not image and not text:
            raise HTTPException(status_code=400, detail="Either image or text input required")

        # TODO: Implement actual nutrition analysis
        # 1. If image: Use vision model to identify food
        # 2. Query nutrition database for nutrient values
        # 3. Get user's disease stage and target values
        # 4. Compare and calculate risk levels
        # 5. Generate recommendations

        # Placeholder response
        result = {
            "status": "success",
            "response": "음식 분석이 완료되었습니다.",
            "nutrition_data": {
                "foods": [
                    {
                        "name": "사과",
                        "amount": "1개 (200g)",
                        "calories": 104,
                        "protein": 0.5,
                        "sodium": 2,
                        "potassium": 214,
                        "phosphorus": 20
                    }
                ],
                "total": {
                    "calories": 104,
                    "protein": 0.5,
                    "sodium": 2,
                    "potassium": 214,
                    "phosphorus": 20
                },
                "risk_assessment": {
                    "sodium": "safe",
                    "potassium": "caution",
                    "phosphorus": "safe",
                    "protein": "safe"
                },
                "warnings": [
                    "칼륨 함량이 다소 높습니다. CKD 3단계 이상 환자는 섭취량을 조절하세요."
                ],
                "recommendations": [
                    "사과 대신 저칼륨 과일인 딸기나 블루베리를 추천합니다.",
                    "과일은 하루 1회, 1/2컵 이하로 섭취하는 것이 좋습니다."
                ]
            }
        }

        return {"result": result}

    except Exception as e:
        logger.error(f"Nutrition analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/food-search")
async def search_food(
    query: str = Form(...),
    session_id: str = Form(...),
    user_id: Optional[str] = Form(None)
):
    """
    NUT-001: Text-based food search

    Natural language search for ingredients and dishes.
    """
    try:
        # TODO: Implement food search
        # 1. Parse natural language query
        # 2. Search nutrition database
        # 3. Return matching foods with nutrition info

        return {
            "results": [
                {
                    "name": query,
                    "nutrition": {},
                    "risk_level": "safe"
                }
            ]
        }

    except Exception as e:
        logger.error(f"Food search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alternative-ingredients")
async def get_alternative_ingredients(
    ingredient: str = Form(...),
    restricted_nutrient: str = Form(...)
):
    """
    NUT-002: Alternative Ingredients

    Recommends alternative ingredients with lower restricted nutrients.
    """
    try:
        # TODO: Implement alternative ingredient logic
        # 1. Identify the problematic nutrient
        # 2. Search for similar foods with lower levels
        # 3. Rank by similarity and nutritional benefit

        alternatives = [
            {
                "name": "고구마",
                "reason": "감자보다 칼륨이 40% 낮습니다",
                "nutrition_comparison": {
                    "potassium": {"original": 421, "alternative": 250, "reduction": "40%"}
                }
            }
        ]

        return {"alternatives": alternatives}

    except Exception as e:
        logger.error(f"Alternative ingredients error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alternative-recipes")
async def get_alternative_recipe(
    recipe_name: str = Form(...),
    disease_stage: str = Form("CKD_3")
):
    """
    NUT-003: Alternative Recipes

    Provides disease-stage-adjusted recipes with substituted ingredients.
    """
    try:
        # TODO: Implement recipe adjustment
        # 1. Get original recipe
        # 2. Identify high-risk ingredients
        # 3. Substitute with alternatives
        # 4. Recalculate nutrition values

        adjusted_recipe = {
            "name": f"{recipe_name} (CKD 맞춤형)",
            "ingredients": [
                {
                    "original": "김치 200g",
                    "substitute": "저염 김치 150g",
                    "reason": "나트륨 50% 감소"
                }
            ],
            "cooking_tips": [
                "김치는 물에 헹궈 사용하면 나트륨을 더 줄일 수 있습니다."
            ]
        }

        return {"recipe": adjusted_recipe}

    except Exception as e:
        logger.error(f"Alternative recipe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/diet-guide")
async def get_diet_guide(disease_stage: str = "CKD_3"):
    """
    NUT-004: Diet Guide Summary

    RAG-based summary of diet guidelines from 식약처/대한신장학회.
    """
    try:
        # TODO: Implement RAG for diet guidelines
        # 1. Retrieve relevant guidelines from vector DB
        # 2. Generate summary based on disease stage
        # 3. Include specific precautions and recommendations

        guide = {
            "stage": disease_stage,
            "summary": f"{disease_stage} 환자를 위한 식단 가이드",
            "daily_limits": {
                "sodium": "2000mg 이하",
                "protein": "체중 1kg당 0.6-0.8g",
                "potassium": "2000mg 이하",
                "phosphorus": "800-1000mg"
            },
            "cooking_tips": [
                "조리 시 소금 대신 천연 향신료 사용",
                "채소는 물에 데쳐서 칼륨 제거",
                "가공식품 최소화"
            ],
            "recommended_foods": [],
            "foods_to_avoid": []
        }

        return {"guide": guide}

    except Exception as e:
        logger.error(f"Diet guide error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/related-questions")
async def generate_related_questions(
    previous_query: str = Form(...),
    context: str = Form(...)
):
    """
    NUT-005: Related Q&A

    Auto-generates 3-5 related questions after nutrition analysis.
    """
    try:
        # TODO: Implement related question generation
        # 1. Analyze previous query and response
        # 2. Generate semantically related questions
        # 3. Ensure questions are relevant to CKD nutrition

        questions = [
            "콩팥병 환자가 먹으면 좋은 과일은 무엇인가요?",
            "저칼륨 채소에는 어떤 것들이 있나요?",
            "칼륨을 줄이는 조리 방법은 무엇인가요?",
            "하루 단백질 섭취량은 어떻게 계산하나요?",
            "저염식 레시피 추천해주세요"
        ]

        return {"related_questions": questions}

    except Exception as e:
        logger.error(f"Related questions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 4. Register Nutrition Router

**File:** `/backend/app/main.py`

**Add these lines:**

```python
# At the top with other imports
from app.api.nutri import router as nutri_router

# With other router registrations (around line 60)
app.include_router(nutri_router)  # Add nutrition router
```

---

## Frontend Enhancements

### 5. Add Text-Based Food Search

**File:** `/new_frontend/src/pages/DietCarePageEnhanced.tsx`

**Add this component in NutriCoachContent, before the image analysis section:**

```tsx
{/* Text-based Food Search */}
<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
  <h3 className="font-semibold text-xl mb-2 flex items-center text-gray-900 dark:text-white">
    <Search className="mr-2 text-blue-600" size={24} />
    {language === 'ko' ? '음식/재료 검색' : 'Food/Ingredient Search'}
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
    {language === 'ko'
      ? '음식이나 재료 이름을 입력하면 영양 정보와 위험도를 확인할 수 있습니다.'
      : 'Enter food or ingredient name to check nutrition info and risk level.'}
  </p>

  <div className="flex gap-2">
    <input
      type="text"
      placeholder={language === 'ko' ? '예: 사과, 김치찌개 1인분' : 'e.g., Apple, Kimchi stew'}
      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <button
      onClick={handleFoodSearch}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
    >
      {language === 'ko' ? '검색' : 'Search'}
    </button>
  </div>

  {/* Search Results */}
  {searchResults && (
    <div className="mt-4 space-y-2">
      {searchResults.map((result, idx) => (
        <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900 dark:text-white">{result.name}</h4>
            <RiskBadge level={result.risk_level} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2 text-sm">
            <div>
              <span className="text-gray-500">칼로리:</span> {result.calories}kcal
            </div>
            <div>
              <span className="text-gray-500">단백질:</span> {result.protein}g
            </div>
            <div>
              <span className="text-gray-500">나트륨:</span> {result.sodium}mg
            </div>
            <div>
              <span className="text-gray-500">칼륨:</span> {result.potassium}mg
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

### 6. Add Risk Badge Component

**Create new file:** `/new_frontend/src/components/RiskBadge.tsx`

```tsx
import React from 'react';

interface RiskBadgeProps {
  level: 'safe' | 'caution' | 'danger';
  label?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, label }) => {
  const config = {
    safe: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700',
      icon: '✓',
      defaultLabel: '안전'
    },
    caution: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-300 dark:border-yellow-700',
      icon: '⚠',
      defaultLabel: '주의'
    },
    danger: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-300 dark:border-red-700',
      icon: '✕',
      defaultLabel: '위험'
    }
  };

  const { bg, text, border, icon, defaultLabel } = config[level];

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${bg} ${text} ${border}`}>
      <span>{icon}</span>
      <span>{label || defaultLabel}</span>
    </span>
  );
};
```

### 7. Add Related Questions Component

**File:** `/new_frontend/src/components/RelatedQuestions.tsx`

```tsx
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface RelatedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  language: 'ko' | 'en';
}

export const RelatedQuestions: React.FC<RelatedQuestionsProps> = ({
  questions,
  onQuestionClick,
  language
}) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
        <HelpCircle size={18} />
        {language === 'ko' ? '관련 질문' : 'Related Questions'}
      </h5>
      <div className="space-y-2">
        {questions.map((question, idx) => (
          <button
            key={idx}
            onClick={() => onQuestionClick(question)}
            className="w-full text-left p-3 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30
              border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-gray-700 dark:text-gray-300
              transition-colors"
          >
            {idx + 1}. {question}
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

## Database Schema

### 8. Create Nutrition Database Tables

**File:** Create new migration or schema file

```sql
-- Nutrition Facts Table
CREATE TABLE nutrition_facts (
    id SERIAL PRIMARY KEY,
    food_name VARCHAR(255) NOT NULL,
    food_name_en VARCHAR(255),
    category VARCHAR(100),
    serving_size VARCHAR(50),
    serving_size_g DECIMAL(10, 2),
    calories DECIMAL(10, 2),
    protein DECIMAL(10, 2),
    fat DECIMAL(10, 2),
    carbohydrates DECIMAL(10, 2),
    sodium DECIMAL(10, 2),
    potassium DECIMAL(10, 2),
    phosphorus DECIMAL(10, 2),
    calcium DECIMAL(10, 2),
    fiber DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(food_name)
);

-- CKD Stage Guidelines Table
CREATE TABLE ckd_stage_guidelines (
    id SERIAL PRIMARY KEY,
    stage VARCHAR(20) NOT NULL,
    sodium_limit_mg DECIMAL(10, 2),
    protein_limit_g_per_kg DECIMAL(10, 2),
    potassium_limit_mg DECIMAL(10, 2),
    phosphorus_limit_mg DECIMAL(10, 2),
    fluid_limit_ml DECIMAL(10, 2),
    guidelines_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alternative Ingredients Table
CREATE TABLE alternative_ingredients (
    id SERIAL PRIMARY KEY,
    original_ingredient VARCHAR(255) NOT NULL,
    alternative_ingredient VARCHAR(255) NOT NULL,
    nutrient_reduced VARCHAR(50),
    reduction_percentage DECIMAL(5, 2),
    similarity_score DECIMAL(3, 2),
    recommendation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Nutrition Targets (for logged-in users)
CREATE TABLE user_nutrition_targets (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    disease_stage VARCHAR(20),
    sodium_target_mg DECIMAL(10, 2),
    protein_target_g DECIMAL(10, 2),
    potassium_target_mg DECIMAL(10, 2),
    phosphorus_target_mg DECIMAL(10, 2),
    custom_restrictions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Diet Log Entries
CREATE TABLE diet_log_entries (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    meal_type VARCHAR(20),
    food_name VARCHAR(255),
    amount_g DECIMAL(10, 2),
    calories DECIMAL(10, 2),
    protein DECIMAL(10, 2),
    sodium DECIMAL(10, 2),
    potassium DECIMAL(10, 2),
    phosphorus DECIMAL(10, 2),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_nutrition_facts_food_name ON nutrition_facts(food_name);
CREATE INDEX idx_user_nutrition_targets_user_id ON user_nutrition_targets(user_id);
CREATE INDEX idx_diet_log_entries_user_id ON diet_log_entries(user_id);
CREATE INDEX idx_diet_log_entries_logged_at ON diet_log_entries(logged_at);
```

---

## Testing After Implementation

### 9. Update Test Suite

After implementing the features, update the test file to verify:

```bash
# Run tests
cd /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend
npx playwright test tests/e2e/nut-features/diet-care.spec.ts

# Expected results after fixes:
# - All 20 tests should pass
# - No CORS errors
# - Text search should work
# - Risk badges should be visible
```

### 10. Manual Testing Checklist

- [ ] Text-based food search returns results
- [ ] Risk badges display with correct colors
- [ ] Image analysis returns nutrition data
- [ ] Alternative ingredients show when nutrients are high
- [ ] Related questions appear after analysis
- [ ] Diet guide shows stage-specific information
- [ ] Mobile view is responsive
- [ ] Dark mode works correctly
- [ ] Error messages display properly
- [ ] Loading states show during API calls

---

## Implementation Priority

### Phase 1 (Week 1)
1. Fix CORS configuration
2. Implement nutrition API router with basic endpoints
3. Add text-based food search to frontend
4. Implement risk badge component
5. Create nutrition database schema

### Phase 2 (Week 2)
6. Integrate nutrition database with sample data
7. Implement NUT-001 (Food/Nutrition Search) fully
8. Add risk calculation logic
9. Implement NUT-004 (Diet Guide Summary)
10. Test and fix issues

### Phase 3 (Week 3)
11. Implement NUT-002 (Alternative Ingredients)
12. Implement NUT-003 (Alternative Recipes)
13. Implement NUT-005 (Related Q&A)
14. Add comprehensive error handling
15. Optimize performance

### Phase 4 (Week 4)
16. Full integration testing
17. Fix mobile responsiveness
18. Add accessibility features
19. Performance optimization
20. Documentation and deployment

---

## Resources Needed

### External APIs/Services
- OpenAI Vision API (for food image recognition)
- OpenAI GPT-4 (for text analysis and Q&A)
- Nutrition database API (e.g., USDA FoodData Central, 식품의약품안전처 API)

### Data Sources
- 식품의약품안전처 (MFDS) nutrition database
- 대한신장학회 (Korean Society of Nephrology) CKD guidelines
- Custom CKD-specific food alternatives database

### Development Tools
- Python packages: `python-multipart`, `Pillow`, `openai`
- Frontend packages: `lucide-react` (already installed)

---

## Success Metrics

After full implementation, verify:

1. **Test Pass Rate:** 100% (20/20 tests passing)
2. **Feature Completion:**
   - NUT-001: 100%
   - NUT-002: 100%
   - NUT-003: 100%
   - NUT-004: 100%
   - NUT-005: 100%
3. **Performance:**
   - Page load time < 2 seconds
   - API response time < 3 seconds
   - Image analysis < 5 seconds
4. **User Experience:**
   - Mobile responsiveness: 100%
   - Accessibility score: > 90
   - Error handling: All edge cases covered

---

**Last Updated:** November 27, 2025
**Implementation Status:** Planning Phase
**Estimated Completion:** 4 weeks
