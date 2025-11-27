# MyPage API 3-Layer Architecture Refactoring

## Executive Summary

The MyPage API has been successfully refactored from a monolithic 1,268-line file into a clean 3-Layer Architecture, reducing the main router file to 277 lines while separating concerns into dedicated service and model layers.

**Key Improvements:**
- Separated business logic into service classes
- Extracted Pydantic models into a dedicated models file
- Improved testability and maintainability
- Clear separation of concerns (Router → Service → Database)
- Reduced code duplication with utility functions

## Architecture Overview

```
backend/
├── app/
│   ├── api/
│   │   └── mypage.py (277 lines) - Routing Layer
│   ├── models/
│   │   └── mypage.py (285 lines) - Data Models
│   └── services/
│       └── mypage/
│           ├── __init__.py (21 lines) - Service Exports
│           ├── profile_service.py (145 lines) - Profile Logic
│           ├── health_service.py (137 lines) - Health Profile Logic
│           ├── preferences_service.py (123 lines) - Preferences Logic
│           ├── bookmark_service.py (181 lines) - Bookmark Logic
│           ├── points_service.py (354 lines) - Points & Level Logic
│           └── utils.py (42 lines) - Utility Functions
```

**Total Lines:** 1,565 lines (compared to original 1,268 lines)
- The increase is due to proper separation, documentation, and removal of code duplication

## Layer Definitions

### 1. Router Layer (`app/api/mypage.py`)

**Responsibilities:**
- HTTP request routing
- Request validation (via Pydantic)
- Authentication (via dependencies)
- Response formatting
- HTTP status code management

**Key Pattern:**
```python
@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile information"""
    user_id = str(current_user["_id"])
    return await profile_service.get_profile(user_id, current_user)
```

### 2. Service Layer (`app/services/mypage/`)

**Responsibilities:**
- Business logic implementation
- Data validation
- Database operations
- Error handling
- Logging

**Service Classes:**
- `ProfileService` - User profile management
- `HealthService` - Health profile management
- `PreferencesService` - User preferences management
- `BookmarkService` - Bookmark management
- `PointsService` - Points and level system

**Key Pattern:**
```python
class ProfileService:
    def __init__(self):
        self.users_collection = db["users"]

    async def get_profile(self, user_id: str, current_user: dict) -> Dict[str, Any]:
        # Business logic here
        pass
```

### 3. Data Model Layer (`app/models/mypage.py`)

**Responsibilities:**
- Request/Response schema definitions
- Data validation rules
- Field documentation
- Example data for API docs

**Models Defined:**
- `UserProfileResponse` / `UserProfileUpdateRequest`
- `HealthProfileResponse` / `HealthProfileUpdateRequest`
- `UserPreferencesResponse` / `UserPreferencesUpdateRequest`
- `BookmarkResponse` / `BookmarkCreateRequest`
- `UserLevelResponse`
- `PointsDataResponse` / `PointsHistoryResponse`

## Service Breakdown

### ProfileService (`profile_service.py` - 145 lines)

**Methods:**
- `get_profile(user_id, current_user)` - Retrieve user profile
- `update_profile(user_id, full_name, bio, profile_image)` - Update profile

**Database Collections:** `users`

### HealthService (`health_service.py` - 137 lines)

**Methods:**
- `get_health_profile(user_id)` - Get health profile
- `update_health_profile(user_id, conditions, allergies, ...)` - Update health data

**Database Collections:** `health_profiles`

### PreferencesService (`preferences_service.py` - 123 lines)

**Methods:**
- `get_preferences(user_id)` - Get user preferences
- `update_preferences(user_id, theme, language, notifications)` - Update preferences

**Database Collections:** `user_preferences`

### BookmarkService (`bookmark_service.py` - 181 lines)

**Methods:**
- `get_bookmarks(user_id, limit, offset)` - Get bookmarked papers with pagination
- `add_bookmark(user_id, paper_id, paper_data)` - Add bookmark
- `remove_bookmark(user_id, paper_id)` - Remove bookmark

**Database Collections:** `bookmarks`

### PointsService (`points_service.py` - 354 lines)

**Methods:**
- `get_level(user_id)` - Get user level and XP
- `get_points(user_id)` - Get points summary
- `get_history(user_id, limit, offset, filters)` - Get points transaction history
- `add_points(user_id, amount, source, description)` - Add/deduct points (internal)

**Database Collections:** `user_levels`, `user_badges`, `user_points`, `points_history`

**Level Configuration:**
```python
LEVEL_CONFIG = [
    {"level": 1, "name": "새싹", "min_xp": 0, "max_xp": 100},
    {"level": 2, "name": "초보", "min_xp": 100, "max_xp": 300},
    {"level": 3, "name": "중급", "min_xp": 300, "max_xp": 600},
    {"level": 4, "name": "고수", "min_xp": 600, "max_xp": 1000},
    {"level": 5, "name": "전문가", "min_xp": 1000, "max_xp": None},
]
```

## API Endpoints

All endpoints maintain backward compatibility:

### Profile
- `GET /api/mypage/profile` - Get profile
- `PUT /api/mypage/profile` - Update profile

### Health Profile
- `GET /api/mypage/health-profile` - Get health profile
- `PUT /api/mypage/health-profile` - Update health profile

### Preferences
- `GET /api/mypage/preferences` - Get preferences
- `PUT /api/mypage/preferences` - Update preferences

### Bookmarks
- `GET /api/mypage/bookmarks` - List bookmarks (paginated)
- `POST /api/mypage/bookmarks` - Create bookmark
- `DELETE /api/mypage/bookmarks/{paper_id}` - Delete bookmark

### Posts
- `GET /api/mypage/posts` - Get user posts (paginated)

### Points & Levels
- `GET /api/mypage/level` - Get level info
- `GET /api/mypage/points` - Get points summary
- `GET /api/mypage/points/history` - Get points history (paginated)

### Health Check
- `GET /api/mypage/health` - API health status

## Key Design Decisions

### 1. Service Layer Pattern
**Decision:** Use service classes instead of standalone functions
**Rationale:**
- Better encapsulation of related logic
- Easier dependency injection for testing
- Clear initialization of database collections

### 2. Utility Functions
**Decision:** Extract common serialization logic
**Rationale:**
- DRY principle (Don't Repeat Yourself)
- Consistent data transformation
- Easier to modify serialization behavior

### 3. Backward Compatibility
**Decision:** Maintain all existing API contracts
**Rationale:**
- No breaking changes for frontend
- Smooth transition
- Aliases for field compatibility (e.g., `profileImageUrl` = `profileImage`)

### 4. Error Handling
**Decision:** Keep HTTPException in service layer
**Rationale:**
- Services can make HTTP-aware decisions
- Consistent error responses
- Proper status codes

### 5. Points System Integration
**Decision:** Keep `add_points()` as internal service method
**Rationale:**
- Not exposed as API endpoint
- Used by other services (quiz, community, etc.)
- Centralized points logic

## Testing Strategy

### Unit Testing Services
```python
# Example test for ProfileService
async def test_profile_service_get_profile():
    service = ProfileService()
    # Mock database
    # Test logic
    pass
```

### Integration Testing Router
```python
# Example test for router endpoint
async def test_get_profile_endpoint():
    response = await client.get("/api/mypage/profile")
    assert response.status_code == 200
```

## Migration Guide

### For Developers

**No changes required** - The refactoring is backward compatible.

**To use services in other modules:**
```python
from app.services.mypage import PointsService

points_service = PointsService()
await points_service.add_points(user_id, 10, "quiz_completion", "Completed quiz")
```

### For Frontend

**No changes required** - All API endpoints remain the same with identical request/response formats.

## Benefits of This Architecture

1. **Maintainability**: Each service has a single responsibility
2. **Testability**: Services can be tested independently
3. **Reusability**: Services can be used by other modules
4. **Scalability**: Easy to add new features or modify existing ones
5. **Readability**: Clear structure with well-organized code
6. **Documentation**: Self-documenting code with clear separation

## Future Enhancements

1. **Add Unit Tests**: Create comprehensive test coverage for all services
2. **Add Caching**: Implement caching for frequently accessed data (profiles, preferences)
3. **Add Validation Layer**: Extract validation logic into separate validators
4. **Add Repository Pattern**: Abstract database operations further
5. **Add Event System**: Emit events when points are earned (for notifications)
6. **Add Metrics**: Track API performance and usage

## File Reference

| File Path | Lines | Purpose |
|-----------|-------|---------|
| `app/api/mypage.py` | 277 | Router endpoints |
| `app/models/mypage.py` | 285 | Pydantic models |
| `app/services/mypage/profile_service.py` | 145 | Profile logic |
| `app/services/mypage/health_service.py` | 137 | Health logic |
| `app/services/mypage/preferences_service.py` | 123 | Preferences logic |
| `app/services/mypage/bookmark_service.py` | 181 | Bookmark logic |
| `app/services/mypage/points_service.py` | 354 | Points/Level logic |
| `app/services/mypage/utils.py` | 42 | Utilities |
| `app/services/mypage/__init__.py` | 21 | Exports |

**Total:** 1,565 lines across 9 files

---

**Refactoring Date:** 2025-11-27
**Original File Size:** 1,268 lines
**Refactored Router Size:** 277 lines (78% reduction)
**Architecture:** 3-Layer (Router → Service → Database)
