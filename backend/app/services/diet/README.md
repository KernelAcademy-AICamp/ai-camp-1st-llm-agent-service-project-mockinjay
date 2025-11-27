# Diet Care Service Layer Documentation

## Overview

This package implements the complete service layer for the Diet Care feature, providing AI-powered nutrition analysis, meal logging, goal management, and progress tracking for CKD (Chronic Kidney Disease) patients.

## Architecture

```
app/services/diet/
├── __init__.py                    # Package exports
├── nutrition_analyzer.py          # AI-powered food image analysis
├── meal_service.py                # Meal CRUD operations
├── goal_service.py                # Dietary goal management
├── progress_calculator.py         # Progress tracking and statistics
└── README.md                      # This file
```

## Services

### 1. NutritionAnalyzerService

**File:** `nutrition_analyzer.py`

**Purpose:** AI-powered food image analysis using GPT-4 Vision API.

**Key Features:**
- Multi-modal AI analysis (image + text prompts)
- CKD stage-specific recommendations (stages 1-5)
- High-risk food detection (sodium, potassium, phosphorus)
- Confidence scoring for analysis accuracy
- Structured JSON output with comprehensive nutrition data

**Usage:**

```python
from app.services.diet import nutrition_analyzer_service

# Async usage
result = await nutrition_analyzer_service.analyze_food_image(
    image_data=image_bytes,
    user_profile=UserProfile(ckd_stage=3, age=65),
    prompt="Is this meal safe for my kidney condition?"
)

# Sync usage (for testing)
result = nutrition_analyzer_service.analyze_food_image_sync(
    image_data=image_bytes,
    user_profile=UserProfile(ckd_stage=3)
)

# Access results
print(f"Total sodium: {result.total_sodium_mg}mg")
print(f"Foods detected: {len(result.foods)}")
print(f"Confidence: {result.confidence_score}")

# Check warnings and recommendations
for warning in result.warnings:
    print(f"⚠️ {warning}")

for rec in result.recommendations:
    print(f"💡 {rec}")
```

**Configuration:**
- Requires `OPENAI_API_KEY` environment variable
- Uses GPT-4o model for vision capabilities
- Max image size: 5MB
- Supported formats: JPEG, PNG, WebP

**CKD Stage Limits:**

| Stage | Sodium (mg/day) | Potassium (mg/day) | Phosphorus (mg/day) | Protein (g/day) |
|-------|-----------------|--------------------|--------------------|-----------------|
| 1     | 2300            | 3500               | 1200               | 60              |
| 2     | 2300            | 3000               | 1000               | 55              |
| 3     | 2000            | 2500               | 900                | 50              |
| 4     | 1500            | 2000               | 800                | 40              |
| 5     | 1500            | 2000               | 800                | 40              |

**Error Handling:**
- `ValidationError`: Invalid input parameters
- `OpenAIAPIError`: API call failures
- `ImageProcessingError`: Image processing failures

---

### 2. MealService

**File:** `meal_service.py`

**Purpose:** CRUD operations for meal logging with MongoDB integration.

**Key Features:**
- Create, read, delete meal logs
- Pagination support
- Date range filtering
- Meal type filtering (breakfast, lunch, dinner, snack)
- Daily summary aggregation
- Automatic streak tracking

**Usage:**

```python
from app.services.diet import meal_service
from app.models.diet import CreateMealRequest, MealType

# Create meal log
meal, streak = meal_service.create_meal_log(
    CreateMealRequest(
        user_id="user123",
        meal_type=MealType.BREAKFAST,
        foods=[...],
        total_nutrients=Nutrients(...)
    )
)

print(f"Meal logged: {meal.id}")
print(f"Current streak: {streak['current']} days")

# Get meals with filters
meals, pagination = meal_service.get_meals(
    user_id="user123",
    start_date=datetime(2025, 11, 1),
    end_date=datetime(2025, 11, 30),
    meal_type=MealType.BREAKFAST,
    page=1,
    page_size=20
)

# Get daily summary
summary = meal_service.get_daily_summary(
    user_id="user123",
    date=datetime.now()
)

# Delete meal
meal_service.delete_meal(
    meal_id="meal_id_here",
    user_id="user123"
)
```

**Database Schema:**

```python
{
    "_id": ObjectId,
    "user_id": ObjectId,
    "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
    "foods": [
        {
            "name": str,
            "portion_g": float,
            "sodium_mg": float,
            "protein_g": float,
            "potassium_mg": float,
            "phosphorus_mg": float
        }
    ],
    "total_nutrients": {
        "sodium_mg": float,
        "protein_g": float,
        "potassium_mg": float,
        "phosphorus_mg": float
    },
    "logged_at": datetime,
    "created_at": datetime
}
```

---

### 3. GoalService

**File:** `goal_service.py`

**Purpose:** Dietary goal management for CKD patients.

**Key Features:**
- Get/create/update user goals
- CKD stage-based default goals
- Goal validation (range checking)
- Recommended goals by CKD stage

**Usage:**

```python
from app.services.diet import goal_service
from app.models.diet import UpdateGoalRequest, CKDStage

# Get or create default goals
goals = goal_service.get_or_create_default_goals(
    user_id="user123",
    ckd_stage=CKDStage.STAGE_3
)

# Update goals
updated_goals = goal_service.update_goals(
    UpdateGoalRequest(
        user_id="user123",
        sodium_mg=2000,
        protein_g=50,
        potassium_mg=2500,
        phosphorus_mg=900,
        ckd_stage=CKDStage.STAGE_3
    )
)

# Get recommended goals
recommended = goal_service.get_recommended_goals_by_stage(
    CKDStage.STAGE_4
)
```

**Validation Ranges:**
- Sodium: 500-5000 mg/day
- Protein: 20-200 g/day
- Potassium: 500-5000 mg/day
- Phosphorus: 400-2000 mg/day

---

### 4. ProgressCalculatorService

**File:** `progress_calculator.py`

**Purpose:** Calculate nutrition progress, statistics, and compliance metrics.

**Key Features:**
- Daily progress calculation with goal comparison
- Weekly trend analysis and aggregation
- Compliance scoring (0-100 scale)
- Violation detection for critical nutrients
- Adaptive recommendations based on consumption patterns
- Streak tracking

**Usage:**

```python
from app.services.diet import progress_calculator_service
from datetime import datetime

# Calculate daily progress
progress = await progress_calculator_service.calculate_daily_progress(
    user_id="user123",
    date=datetime.now()
)

print(f"Sodium: {progress.sodium.percentage:.1f}% ({progress.sodium.status})")
print(f"Meals logged: {progress.meals_logged}/{progress.total_meals}")

# Calculate weekly progress
weekly = await progress_calculator_service.calculate_weekly_progress(
    user_id="user123",
    week_start=datetime(2025, 11, 20)  # Monday
)

print(f"Average compliance: {weekly.average_compliance:.1f}%")
print(f"Streak: {weekly.streak_days} days")

# Generate recommendations
recommendations = progress_calculator_service.generate_recommendations(
    daily_progress=progress,
    user_goals=goals
)

for rec in recommendations:
    print(f"💡 {rec}")

# Get nutrient trends
trends = progress_calculator_service.get_nutrient_trends(
    user_id="user123",
    start_date=datetime(2025, 11, 1),
    end_date=datetime(2025, 11, 30)
)

# sodium_mg trend data
for point in trends["sodium_mg"]:
    print(f"{point['date']}: {point['value']}mg")
```

**Compliance Scoring:**

The compliance score (0-100) is calculated using a weighted average:

| Nutrient     | Weight | Importance         |
|--------------|--------|--------------------|
| Sodium       | 30%    | Critical for CKD   |
| Potassium    | 30%    | Critical for CKD   |
| Phosphorus   | 25%    | Important for CKD  |
| Protein      | 15%    | Important          |

**Scoring Logic:**
- ≤100% of limit: 100 points (optimal)
- 100-120% of limit: 100 - ((ratio - 1.0) × 100) points
- >120% of limit: Penalty applied (max 0 points)

**Progress Status:**

For limits (sodium, potassium, phosphorus):
- `under`: ≤80% (good)
- `optimal`: 80-100% (ideal)
- `over`: >100% (needs improvement)

For goals (protein):
- `under`: <80% (needs more)
- `optimal`: 80-120% (ideal)
- `over`: >120% (too much)

---

## Error Handling

All services use a hierarchical exception structure:

```python
DietCareException (base)
├── ValidationError (400)
│   ├── InvalidImageURLError
│   ├── InvalidMealDataError
│   └── InvalidGoalRangeError
├── ResourceNotFoundError (404)
│   ├── GoalNotFoundError
│   └── MealNotFoundError
├── RateLimitExceededError (429)
│   └── AnalysisLimitExceededError
├── ExternalServiceError (502)
│   ├── OpenAIAPIError
│   └── ImageProcessingError
└── DatabaseError (500)
```

**Example:**

```python
from app.core.exceptions import GoalNotFoundError, OpenAIAPIError

try:
    result = await nutrition_analyzer_service.analyze_food_image(
        image_data=image_bytes
    )
except OpenAIAPIError as e:
    logger.error(f"AI analysis failed: {e.message}")
    # Fallback to manual entry
except ValidationError as e:
    logger.error(f"Invalid input: {e.message}")
    # Return error to user
```

---

## Testing

### Unit Tests

Each service includes test stubs in docstrings. Recommended test structure:

```python
# tests/services/diet/test_nutrition_analyzer.py
import pytest
from unittest.mock import Mock, patch
from app.services.diet import nutrition_analyzer_service

@pytest.mark.asyncio
async def test_analyze_food_image_success():
    """Test successful food image analysis."""
    # Mock OpenAI API response
    mock_response = Mock()
    mock_response.choices[0].message.content = json.dumps({
        "foods": [{"name": "현미밥", "amount": "210g", ...}],
        ...
    })

    with patch.object(nutrition_analyzer_service, '_call_openai_api', return_value=mock_response):
        result = await nutrition_analyzer_service.analyze_food_image(
            image_data=b"fake_image_data",
            user_profile=UserProfile(ckd_stage=3)
        )

        assert len(result.foods) > 0
        assert result.confidence_score > 0
        assert result.total_sodium_mg >= 0
```

### Integration Tests

Test service interactions:

```python
@pytest.mark.asyncio
async def test_full_meal_logging_flow():
    """Test complete meal logging flow."""
    # 1. Analyze image
    analysis = await nutrition_analyzer_service.analyze_food_image(...)

    # 2. Create meal log
    meal, streak = meal_service.create_meal_log(
        CreateMealRequest(
            user_id="test_user",
            foods=analysis.foods,
            ...
        )
    )

    # 3. Calculate progress
    progress = await progress_calculator_service.calculate_daily_progress(
        user_id="test_user",
        date=datetime.now()
    )

    assert progress.meals_logged > 0
```

---

## Performance Considerations

### Caching

Consider implementing caching for:
- User goals (rarely change)
- Daily summaries (recalculate only when new meals added)
- Nutrient trends (cache for date ranges)

### Database Optimization

- Index on `user_id` and `logged_at` for meal queries
- Use aggregation pipelines for daily/weekly totals
- Consider materialized views for frequently accessed summaries

### API Rate Limits

OpenAI API limits:
- Tier 1: 500 requests/day
- Tier 2: 3,500 requests/day
- Tier 3: 5,000 requests/day

Implement rate limiting at application level:
- Max 10 analyses per user per hour
- Queue system for batch processing
- Fallback to manual entry when limit exceeded

---

## Logging

All services use Python's logging module:

```python
import logging
logger = logging.getLogger(__name__)

# Log levels
logger.debug("Detailed diagnostic info")
logger.info("General information")
logger.warning("Warning messages")
logger.error("Error messages")
logger.critical("Critical failures")
```

Configure in `main.py`:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

## Future Enhancements

### Planned Features

1. **Meal Recognition Improvements**
   - Support for multiple cuisines
   - Portion size estimation using reference objects
   - Barcode scanning for packaged foods

2. **Advanced Analytics**
   - Machine learning for personalized recommendations
   - Predictive modeling for health outcomes
   - Anomaly detection for unusual consumption patterns

3. **Integration**
   - Wearable device integration (activity tracking)
   - Electronic health record (EHR) integration
   - Healthcare provider dashboard

4. **Performance**
   - Redis caching layer
   - Asynchronous background processing
   - Database query optimization

---

## Contributing

When adding new features:

1. Follow existing patterns and conventions
2. Add comprehensive docstrings
3. Include type hints for all functions
4. Write unit tests (>90% coverage)
5. Update this documentation
6. Log important events and errors

---

## Support

For questions or issues:
- Internal documentation: `/docs/diet-care/`
- API reference: `/docs/api/diet-care/`
- Code review: Submit PR with detailed description

---

**Last Updated:** 2025-11-27
**Version:** 1.0.0
**Maintainer:** Backend Team
