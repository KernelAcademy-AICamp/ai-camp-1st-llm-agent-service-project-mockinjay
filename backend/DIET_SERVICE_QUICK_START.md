# Diet Care Service Layer - Quick Start Guide

## 🚀 Quick Start

### Import Services

```python
from app.services.diet import (
    nutrition_analyzer_service,
    meal_service,
    goal_service,
    progress_calculator_service
)
```

## 📸 Analyze Food Image

```python
# Async version (recommended)
result = await nutrition_analyzer_service.analyze_food_image(
    image_data=image_bytes,
    user_profile=UserProfile(ckd_stage=3, age=65),
    prompt="이 음식이 콩팥에 안전한가요?"
)

# Sync version (for testing)
result = nutrition_analyzer_service.analyze_food_image_sync(
    image_data=image_bytes,
    user_profile=UserProfile(ckd_stage=3)
)

# Access results
print(f"Foods: {len(result.foods)}")
print(f"Sodium: {result.total_sodium_mg}mg")
print(f"Confidence: {result.confidence_score}")

# Check warnings
for warning in result.warnings:
    print(f"⚠️ {warning}")

# Get recommendations
for rec in result.recommendations:
    print(f"💡 {rec}")
```

## 🍽️ Log a Meal

```python
from app.models.diet import CreateMealRequest, MealType

meal, streak = meal_service.create_meal_log(
    CreateMealRequest(
        user_id="user123",
        meal_type=MealType.BREAKFAST,
        foods=[...],  # From analysis result
        total_nutrients=Nutrients(
            sodium_mg=500,
            protein_g=20,
            potassium_mg=300,
            phosphorus_mg=150
        ),
        logged_at=datetime.now()
    )
)

print(f"Meal ID: {meal.id}")
print(f"Streak: {streak['current']} days")
```

## 📊 Check Daily Progress

```python
# Async version
progress = await progress_calculator_service.calculate_daily_progress(
    user_id="user123",
    date=datetime.now()
)

# Sync version
progress = progress_calculator_service.calculate_daily_progress_sync(
    user_id="user123",
    date=datetime.now()
)

# Check each nutrient
print(f"Sodium: {progress.sodium.percentage:.1f}% - {progress.sodium.status}")
print(f"Protein: {progress.protein.percentage:.1f}% - {progress.protein.status}")
print(f"Meals logged: {progress.meals_logged}/{progress.total_meals}")
```

## 📈 Weekly Analysis

```python
weekly = await progress_calculator_service.calculate_weekly_progress(
    user_id="user123",
    week_start=datetime(2025, 11, 20)  # Monday
)

print(f"Week: {weekly.week_start} to {weekly.week_end}")
print(f"Average compliance: {weekly.average_compliance:.1f}%")
print(f"Streak: {weekly.streak_days} days")
print(f"Total meals: {weekly.total_meals_logged}")

# Daily breakdown
for day in weekly.daily_summaries:
    print(f"{day.date}: {day.meals_count} meals, {day.compliance_score}% compliance")
```

## 🎯 Manage Goals

```python
from app.models.diet import UpdateGoalRequest, CKDStage

# Get or create default goals
goals = goal_service.get_or_create_default_goals(
    user_id="user123",
    ckd_stage=CKDStage.STAGE_3
)

# Update goals
updated = goal_service.update_goals(
    UpdateGoalRequest(
        user_id="user123",
        sodium_mg=2000,
        protein_g=50,
        potassium_mg=2500,
        phosphorus_mg=900,
        ckd_stage=CKDStage.STAGE_3
    )
)

# Get recommendations
recommended = goal_service.get_recommended_goals_by_stage(
    CKDStage.STAGE_4
)
```

## 💡 Generate Recommendations

```python
# Based on daily progress
recommendations = progress_calculator_service.generate_recommendations(
    daily_progress=progress,
    user_goals=goals
)

for rec in recommendations:
    print(f"💡 {rec}")
```

## 📉 Nutrient Trends

```python
trends = progress_calculator_service.get_nutrient_trends(
    user_id="user123",
    start_date=datetime(2025, 11, 1),
    end_date=datetime(2025, 11, 30)
)

# Sodium trend
for point in trends["sodium_mg"]:
    print(f"{point['date']}: {point['value']}mg")
```

## ⚠️ Error Handling

```python
from app.core.exceptions import (
    OpenAIAPIError,
    ValidationError,
    GoalNotFoundError
)

try:
    result = await nutrition_analyzer_service.analyze_food_image(
        image_data=image_bytes
    )
except OpenAIAPIError as e:
    # API failure - suggest manual entry
    logger.error(f"AI analysis failed: {e.message}")
    return {"error": "AI temporarily unavailable"}

except ValidationError as e:
    # Invalid input
    logger.error(f"Validation failed: {e.message}")
    return {"error": e.message}

except GoalNotFoundError as e:
    # User needs to set goals first
    logger.info(f"Goals not set: {e.message}")
    return {"error": "Please set your dietary goals first"}
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for nutrition analysis
OPENAI_API_KEY=sk-...

# Optional configurations
LOG_LEVEL=INFO
MAX_IMAGE_SIZE=5242880  # 5MB in bytes
```

### CKD Stage Limits

| Stage | Sodium (mg) | Potassium (mg) | Phosphorus (mg) | Protein (g) |
|-------|-------------|----------------|-----------------|-------------|
| 1     | 2300        | 3500           | 1200            | 60          |
| 2     | 2300        | 3000           | 1000            | 55          |
| 3     | 2000        | 2500           | 900             | 50          |
| 4     | 1500        | 2000           | 800             | 40          |
| 5     | 1500        | 2000           | 800             | 40          |

## 📝 Common Patterns

### Complete Meal Flow

```python
# 1. Analyze image
analysis = await nutrition_analyzer_service.analyze_food_image(
    image_data=image_bytes,
    user_profile=UserProfile(ckd_stage=3)
)

# 2. Log meal
meal, streak = meal_service.create_meal_log(
    CreateMealRequest(
        user_id=user_id,
        meal_type=MealType.LUNCH,
        foods=analysis.foods,
        total_nutrients=Nutrients(
            sodium_mg=analysis.total_sodium_mg,
            protein_g=analysis.total_protein_g,
            potassium_mg=analysis.total_potassium_mg,
            phosphorus_mg=analysis.total_phosphorus_mg
        )
    )
)

# 3. Calculate progress
progress = await progress_calculator_service.calculate_daily_progress(
    user_id=user_id,
    date=datetime.now()
)

# 4. Generate recommendations
recommendations = progress_calculator_service.generate_recommendations(
    daily_progress=progress,
    user_goals=goals
)

# Return complete response
return {
    "meal": meal,
    "streak": streak,
    "progress": progress,
    "recommendations": recommendations,
    "warnings": analysis.warnings
}
```

### Daily Dashboard

```python
async def get_daily_dashboard(user_id: str):
    """Get complete daily nutrition dashboard."""
    today = datetime.now()

    # Get meals
    meals, _ = meal_service.get_meals(
        user_id=user_id,
        start_date=today.replace(hour=0, minute=0, second=0),
        end_date=today.replace(hour=23, minute=59, second=59),
        page=1,
        page_size=10
    )

    # Get progress
    progress = await progress_calculator_service.calculate_daily_progress(
        user_id=user_id,
        date=today
    )

    # Get goals
    goals = goal_service.get_user_goals(user_id)

    # Generate recommendations
    recommendations = progress_calculator_service.generate_recommendations(
        daily_progress=progress,
        user_goals=goals
    )

    return {
        "date": today.strftime("%Y-%m-%d"),
        "meals": meals,
        "progress": progress,
        "goals": goals,
        "recommendations": recommendations
    }
```

## 🧪 Testing

### Mock Analysis Response

```python
import pytest
from unittest.mock import Mock, patch

@pytest.mark.asyncio
async def test_analyze_food():
    # Mock OpenAI response
    mock_response = Mock()
    mock_response.choices[0].message.content = json.dumps({
        "foods": [
            {
                "name": "현미밥",
                "amount": "210g",
                "calories": 310,
                "protein_g": 5.2,
                "sodium_mg": 2,
                "potassium_mg": 157,
                "phosphorus_mg": 189,
                "carbs_g": 65,
                "fat_g": 1,
                "fiber_g": 3
            }
        ],
        "meal_type_suggestion": "breakfast",
        "confidence_score": 0.92,
        "analysis_notes": "건강한 아침 식사"
    })

    with patch.object(
        nutrition_analyzer_service,
        '_call_openai_api',
        return_value=mock_response
    ):
        result = await nutrition_analyzer_service.analyze_food_image(
            image_data=b"fake_image",
            user_profile=UserProfile(ckd_stage=3)
        )

        assert len(result.foods) == 1
        assert result.total_sodium_mg == 2
        assert result.confidence_score == 0.92
```

## 📚 Additional Resources

- **Full Documentation:** `/backend/app/services/diet/README.md`
- **Implementation Summary:** `/backend/DIET_SERVICE_IMPLEMENTATION.md`
- **Models Reference:** `/backend/app/models/diet_care.py`
- **API Endpoints:** `/backend/app/api/diet_care.py`

## 🆘 Troubleshooting

### OpenAI API Key Not Set
```
⚠️ Warning: OPENAI_API_KEY not set - nutrition analysis will fail
```
**Solution:** Set environment variable or use manual entry fallback

### Image Too Large
```
ValidationError: Image size exceeds maximum allowed size
```
**Solution:** Resize image before upload (max 5MB)

### Goals Not Found
```
GoalNotFoundError: User has no goals set
```
**Solution:** Create default goals first using `get_or_create_default_goals()`

### Rate Limit Exceeded
```
OpenAIAPIError: API rate limit exceeded
```
**Solution:** Implement request queuing or wait before retrying

---

**Quick Start Complete!** 🎉

For detailed documentation, see `/backend/app/services/diet/README.md`
