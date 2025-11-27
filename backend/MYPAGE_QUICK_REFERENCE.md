# MyPage API Quick Reference Guide

## File Locations

```
backend/app/
├── api/mypage.py              # Router endpoints (277 lines)
├── models/mypage.py           # Pydantic models (285 lines)
└── services/mypage/
    ├── __init__.py            # Service exports
    ├── profile_service.py     # Profile logic
    ├── health_service.py      # Health profile logic
    ├── preferences_service.py # Preferences logic
    ├── bookmark_service.py    # Bookmark logic
    ├── points_service.py      # Points & level logic
    └── utils.py               # Helper functions
```

## How to Use Services

### 1. In the Router (Already Done)

```python
from app.services.mypage import ProfileService

# Initialize once
profile_service = ProfileService()

# Use in endpoint
@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await profile_service.get_profile(user_id, current_user)
```

### 2. In Other Modules (e.g., Quiz, Community)

```python
from app.services.mypage import PointsService

# Initialize service
points_service = PointsService()

# Award points when user completes quiz
async def complete_quiz(user_id: str):
    await points_service.add_points(
        user_id=user_id,
        amount=10,
        source="quiz_completion",
        description="퀴즈 완료"
    )
```

## Service Methods Reference

### ProfileService

```python
# Get user profile
profile = await profile_service.get_profile(user_id, current_user)

# Update profile
updated = await profile_service.update_profile(
    user_id,
    full_name="홍길동",
    bio="건강한 삶을 추구합니다",
    profile_image="/uploads/profile.jpg"
)
```

### HealthService

```python
# Get health profile
health = await health_service.get_health_profile(user_id)

# Update health profile
updated = await health_service.update_health_profile(
    user_id,
    conditions=["고혈압", "당뇨"],
    allergies=["땅콩"],
    dietary_restrictions=["저염식"],
    age=45,
    gender="male"
)
```

### PreferencesService

```python
# Get preferences
prefs = await preferences_service.get_preferences(user_id)

# Update preferences
updated = await preferences_service.update_preferences(
    user_id,
    theme="dark",
    language="en",
    notifications={"email": True, "push": False}
)
```

### BookmarkService

```python
# Get bookmarks (paginated)
result = await bookmark_service.get_bookmarks(user_id, limit=20, offset=0)
# Returns: {"bookmarks": [...], "total": 50, "hasMore": True}

# Add bookmark
bookmark = await bookmark_service.add_bookmark(
    user_id,
    paper_id="12345678",
    paper_data={"title": "Research Paper", "authors": ["Kim, J."]}
)

# Remove bookmark
await bookmark_service.remove_bookmark(user_id, paper_id="12345678")
```

### PointsService

```python
# Get level info
level = await points_service.get_level(user_id)
# Returns: {level, currentXp, requiredXp, title, badges, ...}

# Get points summary
points = await points_service.get_points(user_id)
# Returns: {totalPoints, availablePoints, usedPoints, ...}

# Get points history (paginated)
history = await points_service.get_history(
    user_id,
    limit=20,
    offset=0,
    type_filter="earn",  # Optional: "earn", "spend", "expire"
    source_filter="quiz_completion"  # Optional
)

# Add points (INTERNAL - for use by other services)
await points_service.add_points(
    user_id,
    amount=10,  # Positive for earn, negative for spend
    source="quiz_completion",
    description="퀴즈 완료"
)
```

## Points System Configuration

### Action Points (POINTS_BY_ACTION)

```python
"quiz_completion": 10
"daily_login": 5
"community_post": 15
"community_comment": 5
"community_like_received": 2
"bookmark_paper": 3
"diet_log": 10
"health_check": 5
```

### Level System (LEVEL_CONFIG)

```python
Level 1: "새싹"    0-100 XP
Level 2: "초보"    100-300 XP
Level 3: "중급"    300-600 XP
Level 4: "고수"    600-1000 XP
Level 5: "전문가"  1000+ XP
```

## Example: Awarding Points for Actions

### When User Completes Quiz

```python
from app.services.mypage import PointsService

points_service = PointsService()

async def on_quiz_completed(user_id: str):
    await points_service.add_points(
        user_id=user_id,
        amount=10,
        source="quiz_completion",
        description="건강 퀴즈 완료"
    )
```

### When User Creates Community Post

```python
async def on_post_created(user_id: str):
    await points_service.add_points(
        user_id=user_id,
        amount=15,
        source="community_post",
        description="커뮤니티 게시글 작성"
    )
```

### When User Receives Like

```python
async def on_like_received(user_id: str):
    await points_service.add_points(
        user_id=user_id,
        amount=2,
        source="community_like_received",
        description="게시글 좋아요 받음"
    )
```

## API Endpoints (Unchanged)

All endpoints remain the same - backward compatible!

```
GET    /api/mypage/profile
PUT    /api/mypage/profile
GET    /api/mypage/health-profile
PUT    /api/mypage/health-profile
GET    /api/mypage/preferences
PUT    /api/mypage/preferences
GET    /api/mypage/bookmarks
POST   /api/mypage/bookmarks
DELETE /api/mypage/bookmarks/{paper_id}
GET    /api/mypage/posts
GET    /api/mypage/level
GET    /api/mypage/points
GET    /api/mypage/points/history
GET    /api/mypage/health
```

## Common Patterns

### Pattern 1: Get User Data

```python
user_id = str(current_user["_id"])
data = await service.get_something(user_id)
```

### Pattern 2: Update User Data

```python
user_id = str(current_user["_id"])
updated = await service.update_something(
    user_id,
    field1=value1,
    field2=value2
)
```

### Pattern 3: Award Points

```python
await points_service.add_points(
    user_id,
    amount=POINTS_BY_ACTION["action_type"],
    source="action_type",
    description="User-friendly description"
)
```

## Testing Examples

### Test Profile Service

```python
import pytest
from app.services.mypage import ProfileService

@pytest.mark.asyncio
async def test_get_profile():
    service = ProfileService()
    # Mock current_user
    current_user = {
        "_id": "test_id",
        "username": "testuser",
        "email": "test@example.com"
    }

    profile = await service.get_profile("test_id", current_user)
    assert profile["username"] == "testuser"
```

### Test Points Service

```python
@pytest.mark.asyncio
async def test_add_points():
    service = PointsService()

    result = await service.add_points(
        user_id="test_id",
        amount=10,
        source="test",
        description="Test points"
    )

    assert result["totalPoints"] >= 10
```

## Error Handling

All services raise `HTTPException` with appropriate status codes:

```python
from fastapi import HTTPException, status

try:
    await service.something()
except HTTPException as e:
    # e.status_code: 400, 404, 500, etc.
    # e.detail: Korean error message
    pass
```

## Common Errors

```python
400 BAD_REQUEST        # Invalid input (e.g., no fields to update)
404 NOT_FOUND          # Resource not found (e.g., bookmark not found)
500 INTERNAL_SERVER_ERROR  # Server error
```

## Utilities

### Serialize MongoDB Documents

```python
from app.services.mypage.utils import serialize_object_id, serialize_datetime

# Convert _id to id
doc = serialize_object_id({"_id": ObjectId("..."), "name": "test"})
# Result: {"id": "...", "name": "test"}

# Convert datetime to ISO string
doc = serialize_datetime(doc, ["createdAt", "updatedAt"])
```

## Tips

1. **Always use string user_id** in services (convert ObjectId to string)
2. **Services handle all business logic** - keep router thin
3. **Use type hints** for better IDE support
4. **Check logs** for debugging - all services log operations
5. **Points are auto-calculated** to XP (1 point = 1 XP)

## Migration Notes

- No breaking changes - all APIs work the same
- Services can be imported and used anywhere
- Original functionality preserved
- Better organization for future development
