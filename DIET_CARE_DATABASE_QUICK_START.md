# Diet Care Database - Quick Start Guide

## Setup and Initialization

### 1. Initialize Collections

```bash
# Navigate to backend directory
cd backend

# Basic initialization (creates collections and indexes)
python scripts/init_diet_care_collections.py

# With sample data for testing
python scripts/init_diet_care_collections.py --sample-data

# Reset database (WARNING: deletes all data)
python scripts/init_diet_care_collections.py --drop --sample-data
```

### 2. Verify Setup

```python
# Check MongoDB connection
from app.db.connection import check_connection
print(check_connection())

# Test repository
from app.repositories.diet_care_repository import diet_goals_repository
goals = diet_goals_repository.get_user_goals("507f1f77bcf86cd799439011")
print(goals)
```

---

## Usage Examples

### Goal Management

```python
from app.services.diet_care_service import diet_care_service
from app.models.diet import CKDStage, UpdateGoalRequest

# Get or create default goals
goals = diet_care_service.get_or_create_default_goals(
    user_id="507f1f77bcf86cd799439011",
    ckd_stage=CKDStage.STAGE_3
)

# Update goals
request = UpdateGoalRequest(
    user_id="507f1f77bcf86cd799439011",
    sodium_mg=2000,
    protein_g=50,
    potassium_mg=2000,
    phosphorus_mg=800,
    ckd_stage=CKDStage.STAGE_3
)
updated_goals = diet_care_service.update_goals("507f...", request)
```

### Meal Logging

```python
from app.models.diet import CreateMealRequest, MealType, FoodItem, Nutrients
from datetime import datetime

# Create meal request
request = CreateMealRequest(
    user_id="507f1f77bcf86cd799439011",
    meal_type=MealType.BREAKFAST,
    foods=[
        FoodItem(
            name="현미밥",
            portion_g=210,
            sodium_mg=2,
            protein_g=5.2,
            potassium_mg=157,
            phosphorus_mg=189
        )
    ],
    total_nutrients=Nutrients(
        sodium_mg=2,
        protein_g=5.2,
        potassium_mg=157,
        phosphorus_mg=189
    ),
    logged_at=datetime.utcnow()
)

# Log meal
meal, streak = diet_care_service.log_meal("507f...", request)
print(f"Meal logged! Current streak: {streak['current']} days")
```

### Progress Tracking

```python
from datetime import date

# Get daily progress
progress = diet_care_service.get_daily_progress(
    user_id="507f1f77bcf86cd799439011",
    target_date=date.today()
)

print(f"Sodium: {progress.consumed.sodium_mg}mg / {progress.goals.sodium_mg}mg")
print(f"Adherence: {progress.adherence.sodium_mg}%")

# Get weekly summary
summary = diet_care_service.get_weekly_summary(
    user_id="507f...",
    start_date=date.today() - timedelta(days=7),
    end_date=date.today()
)
print(f"Meals logged this week: {summary['total_meals']}")
print(f"Compliance rate: {summary['compliance_rate']}%")
```

---

## Repository Direct Access (Advanced)

```python
from app.repositories.diet_care_repository import (
    diet_goals_repository,
    meal_log_repository,
    diet_session_repository,
    user_streak_repository
)
from datetime import date

# Get meals by date range
meals = meal_log_repository.get_meals_by_date_range(
    user_id="507f...",
    start_date=date(2025, 11, 20),
    end_date=date(2025, 11, 27)
)

# Get nutrition summary
summary = meal_log_repository.get_nutrition_summary(
    user_id="507f...",
    start=date(2025, 11, 20),
    end=date(2025, 11, 27)
)
print(f"Total sodium: {summary['sodium_mg']}mg")

# Check user streak
streak = user_streak_repository.get_user_streak("507f...")
print(f"Current streak: {streak.current_streak} days")
```

---

## MongoDB Query Examples

### Direct MongoDB Queries

```javascript
// Get user's meals for today
db.meal_logs.find({
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  logged_at: {
    $gte: ISODate("2025-11-27T00:00:00Z"),
    $lte: ISODate("2025-11-27T23:59:59Z")
  }
}).sort({ logged_at: -1 })

// Calculate daily totals
db.meal_logs.aggregate([
  {
    $match: {
      user_id: ObjectId("507f1f77bcf86cd799439011"),
      logged_at: {
        $gte: ISODate("2025-11-27T00:00:00Z"),
        $lte: ISODate("2025-11-27T23:59:59Z")
      }
    }
  },
  {
    $group: {
      _id: null,
      total_sodium: { $sum: "$total_nutrients.sodium_mg" },
      total_protein: { $sum: "$total_nutrients.protein_g" },
      meal_count: { $sum: 1 }
    }
  }
])

// Get top streaks (leaderboard)
db.user_streaks.find({}).sort({ current_streak: -1 }).limit(10)

// Check active sessions
db.diet_sessions.find({
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  expires_at: { $gt: new Date() }
})
```

---

## Testing

### Unit Tests

```python
# tests/test_diet_care_service.py
import pytest
from unittest.mock import Mock, patch
from app.services.diet_care_service import diet_care_service
from app.models.diet import Nutrients

def test_calculate_adherence():
    consumed = Nutrients(
        sodium_mg=1800,
        protein_g=45,
        potassium_mg=1800,
        phosphorus_mg=720
    )
    goals = Nutrients(
        sodium_mg=2000,
        protein_g=50,
        potassium_mg=2000,
        phosphorus_mg=800
    )

    adherence = diet_care_service._calculate_adherence(consumed, goals)

    assert adherence.sodium_mg == 90.0
    assert adherence.protein_g == 90.0
    assert adherence.potassium_mg == 90.0
    assert adherence.phosphorus_mg == 90.0

def test_compliance_score():
    consumed = Nutrients(
        sodium_mg=1900,  # 95% of goal
        protein_g=48,    # 96% of goal
        potassium_mg=1950,  # 97.5% of goal
        phosphorus_mg=780   # 97.5% of goal
    )
    goals = Nutrients(
        sodium_mg=2000,
        protein_g=50,
        potassium_mg=2000,
        phosphorus_mg=800
    )

    score = diet_care_service.calculate_compliance_score(consumed, goals)
    assert score == 100.0  # All within 90-110% range
```

### Integration Tests

```python
# tests/integration/test_meal_logging.py
import pytest
from datetime import datetime
from app.services.diet_care_service import diet_care_service
from app.models.diet import CreateMealRequest, MealType, FoodItem, Nutrients

@pytest.fixture
def test_user_id():
    return "507f1f77bcf86cd799439011"

def test_meal_logging_flow(test_user_id):
    # Setup: Create goals
    goals = diet_care_service.get_or_create_default_goals(test_user_id)
    assert goals is not None

    # Log a meal
    request = CreateMealRequest(
        user_id=test_user_id,
        meal_type=MealType.BREAKFAST,
        foods=[
            FoodItem(
                name="Test Food",
                portion_g=100,
                sodium_mg=100,
                protein_g=10,
                potassium_mg=100,
                phosphorus_mg=100
            )
        ],
        total_nutrients=Nutrients(
            sodium_mg=100,
            protein_g=10,
            potassium_mg=100,
            phosphorus_mg=100
        ),
        logged_at=datetime.utcnow()
    )

    meal, streak = diet_care_service.log_meal(test_user_id, request)

    # Verify
    assert meal.id is not None
    assert streak['current'] >= 1

    # Check progress
    from datetime import date
    progress = diet_care_service.get_daily_progress(test_user_id, date.today())
    assert progress.consumed.sodium_mg >= 100
```

---

## Troubleshooting

### Common Issues

**1. Connection Error**
```python
# Check MongoDB is running
from app.db.connection import check_connection
status = check_connection()
print(status)
# If failed, check MONGODB_URI in .env
```

**2. Index Creation Failed**
```bash
# Drop and recreate indexes
python scripts/init_diet_care_collections.py --drop
```

**3. Validation Errors**
```python
# Skip validation for debugging
python scripts/init_diet_care_collections.py --skip-validation
```

**4. Session Rate Limiting**
```python
# Check session status
from app.repositories.diet_care_repository import diet_session_repository
session = diet_session_repository.get_current_session(user_id)
print(f"Remaining: {session.remaining_analyses if session else 'No session'}")
```

---

## Performance Optimization

### Query Performance

```bash
# Check query plans
mongosh careguide

# Explain a query
db.meal_logs.find({
  user_id: ObjectId("507f..."),
  logged_at: { $gte: ISODate("2025-11-27") }
}).explain("executionStats")

# Should show IXSCAN (index scan), not COLLSCAN
```

### Index Usage Stats

```javascript
// Check index utilization
db.meal_logs.aggregate([
  { $indexStats: {} }
])
```

### Cleanup Old Data

```python
# Cleanup expired sessions (runs automatically via TTL)
from app.repositories.diet_care_repository import diet_session_repository
deleted = diet_session_repository.cleanup_expired_sessions()
print(f"Deleted {deleted} expired sessions")

# Cleanup expired analyses
from app.repositories.diet_care_repository import nutrition_analysis_repository
deleted = nutrition_analysis_repository.cleanup_expired_analyses()
print(f"Deleted {deleted} expired analyses")
```

---

## Monitoring

### Health Check Script

```python
# scripts/health_check.py
from app.repositories.diet_care_repository import (
    diet_goals_repository,
    meal_log_repository,
    diet_session_repository,
    user_streak_repository
)

def health_check():
    """Check database health"""
    checks = {
        "goals": diet_goals_repository.count({}),
        "meals": meal_log_repository.count({}),
        "sessions": diet_session_repository.count({}),
        "streaks": user_streak_repository.count({})
    }

    print("Database Health Check:")
    for collection, count in checks.items():
        print(f"  {collection}: {count} documents")

    return checks

if __name__ == "__main__":
    health_check()
```

### Metrics to Track

1. **Database Metrics**:
   - Collection sizes
   - Index usage
   - Query performance
   - Disk usage

2. **Application Metrics**:
   - Meals logged per day
   - Active users
   - Average streak length
   - API response times

3. **Cost Metrics**:
   - Analysis cache hit rate
   - OpenAI API calls saved
   - Session expiration rate

---

## Next Steps

1. **Integrate with API**: Connect repositories to FastAPI endpoints
2. **Add Authentication**: JWT token validation in service layer
3. **Set Up Monitoring**: Prometheus + Grafana dashboards
4. **Load Testing**: Verify performance under load
5. **Documentation**: API documentation with Swagger/OpenAPI

---

## Quick Reference

### File Locations

```
backend/
├── app/
│   ├── repositories/
│   │   └── diet_care_repository.py     # All repositories
│   ├── services/
│   │   └── diet_care_service.py        # Business logic
│   └── models/
│       ├── diet.py                     # Domain models
│       └── diet_care.py                # API models
└── scripts/
    └── init_diet_care_collections.py   # Database setup
```

### Import Shortcuts

```python
# Services (use these in API endpoints)
from app.services.diet_care_service import diet_care_service

# Repositories (for advanced queries)
from app.repositories.diet_care_repository import (
    diet_goals_repository,
    meal_log_repository,
    diet_session_repository,
    user_streak_repository,
    nutrition_analysis_repository
)

# Models
from app.models.diet import (
    DietGoal, MealLog, DietSession, UserStreak,
    CKDStage, MealType, Nutrients, FoodItem,
    CreateMealRequest, UpdateGoalRequest
)
```

### Environment Variables

```bash
# .env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=careguide
```

---

## Support

For issues or questions:
1. Check `DIET_CARE_DATABASE_ARCHITECTURE.md` for detailed documentation
2. Review error logs: `backend/logs/`
3. Run health check: `python scripts/health_check.py`
