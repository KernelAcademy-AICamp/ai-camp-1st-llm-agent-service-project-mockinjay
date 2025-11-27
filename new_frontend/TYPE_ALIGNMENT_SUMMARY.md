# Frontend-Backend Type Alignment Summary

## Overview

The frontend types in `/new_frontend/src/types/mypage.ts` have been completely rewritten to match the backend API implementation in `/backend/app/api/mypage.py`.

## Key Changes

### 1. UserProfile Interface

**Added:**
- `profileImage`: Primary field used by backend
- `createdAt`: Account creation timestamp (ISO 8601 string)

**Modified:**
- `profile`: Changed from optional to required (matches backend)
- `role`: Changed from optional to required (matches backend)

**Kept for Compatibility:**
- `profileImageUrl`: Backend returns both `profileImage` and `profileImageUrl` for compatibility

### 2. HealthProfile Interface

**Added:**
- `conditions`: Primary field used by backend (list of health conditions)

**Kept for Compatibility:**
- `healthConditions`: Backend returns both `conditions` and `healthConditions` as aliases

**Removed:**
- `medications`: Not used by backend
- `notes`: Not used by backend

**Modified:**
- `gender`: Updated to match backend types ('male' | 'female' | 'other')

### 3. UserPreferences Interface

**Modified:**
- `theme`: Removed 'system' option (backend only supports 'light' | 'dark')
- `notifications.trends`: Added (backend uses 'trends' instead of separate 'healthTips' and 'paperUpdates')

**Removed:**
- `notifications.healthTips`: Not used by backend
- `notifications.paperUpdates`: Not used by backend
- `privacy`: Not implemented in backend

### 4. BookmarkedPaper Interface

**Major Restructuring:**
- Changed from flat structure to nested `paperData` object
- Backend stores paper metadata in a `paperData` field containing:
  - `title`, `authors`, `abstract`, `pub_date`, `journal`, etc.

**Added:**
- `PaperData` interface to represent the nested paper metadata structure

**Removed:**
- All individual paper fields (title, authors, journal, etc.) are now inside `paperData`

### 5. New Response Interfaces

**Added to match backend pagination responses:**

1. `BookmarksResponse`:
   - `bookmarks`: Array of bookmarked papers
   - `total`: Total count
   - `limit`: Page size
   - `offset`: Page offset
   - `hasMore`: Boolean flag

2. `PostsResponse`:
   - `posts`: Array of posts
   - `total`, `limit`, `offset`, `hasMore`

3. `PointsHistoryResponse`:
   - `history`: Array of history items
   - `total`, `limit`, `offset`, `hasMore`

### 6. Post Interface

**Complete Restructuring to match backend:**
- Added: `authorName`, `postType`, `imageUrls`, `thumbnailUrl`, `commentCount`, `viewCount`, `lastActivityAt`, `isPinned`, `isDeleted`
- Changed: `likes` (number), `createdAt`, `updatedAt` (ISO strings)
- Removed: `category`, `tags`, `comments` (replaced by `commentCount`)

### 7. PointsData Interface

**Simplified:**
- Removed: `history` array (now fetched separately via `/points/history` endpoint)
- Backend returns only summary: `totalPoints`, `availablePoints`, `usedPoints`

### 8. Request Type Updates

**ProfileUpdateRequest:**
- Changed: `profileImageUrl` → `profileImage` (to match backend)

**HealthProfileUpdateRequest:**
- Added: `conditions` field (backend uses this instead of `healthConditions`)
- Removed: `medications`, `notes`

**PreferencesUpdateRequest:**
- Added: `notifications.trends`
- Removed: `notifications.healthTips`, `notifications.paperUpdates`, `privacy`

**BookmarkCreateRequest:**
- New interface matching backend structure
- Requires `paperId` and complete `paperData` object

### 9. New Types Added

1. **PaperData**: Represents paper metadata structure
2. **BookmarkCreateRequest**: For creating bookmarks
3. **PointsHistoryFilters**: Query parameters for points history endpoint

### 10. Constants Added

From backend configuration:

1. **POINTS_BY_ACTION**: Points earned per action type
   - `quiz_completion`: 10
   - `daily_login`: 5
   - `community_post`: 15
   - etc.

2. **LEVEL_CONFIG**: Level system configuration
   - Level 1: 새싹 (0-100 XP)
   - Level 2: 초보 (100-300 XP)
   - Level 3: 중급 (300-600 XP)
   - Level 4: 고수 (600-1000 XP)
   - Level 5: 전문가 (1000+ XP)

## API Endpoint Mapping

All types now match these backend endpoints:

- `GET /api/mypage/profile` → `UserProfile`
- `PUT /api/mypage/profile` → `ProfileUpdateRequest` → `UserProfile`
- `GET /api/mypage/health-profile` → `HealthProfile`
- `PUT /api/mypage/health-profile` → `HealthProfileUpdateRequest` → `HealthProfile`
- `GET /api/mypage/preferences` → `UserPreferences`
- `PUT /api/mypage/preferences` → `PreferencesUpdateRequest` → `UserPreferences`
- `GET /api/mypage/bookmarks` → `BookmarksResponse`
- `POST /api/mypage/bookmarks` → `BookmarkCreateRequest` → `BookmarkedPaper`
- `DELETE /api/mypage/bookmarks/{paper_id}` → 204 No Content
- `GET /api/mypage/posts` → `PostsResponse`
- `GET /api/mypage/level` → `UserLevelData`
- `GET /api/mypage/points` → `PointsData`
- `GET /api/mypage/points/history` → `PointsHistoryResponse`

## Breaking Changes for Frontend Code

Frontend code using these types may need updates:

1. **BookmarkedPaper access pattern change:**
   ```typescript
   // Old
   bookmark.title
   
   // New
   bookmark.paperData.title
   ```

2. **HealthProfile field name:**
   ```typescript
   // Old
   profile.healthConditions
   
   // New (both work, but conditions is primary)
   profile.conditions
   profile.healthConditions // Backend returns both
   ```

3. **UserPreferences notifications:**
   ```typescript
   // Old
   prefs.notifications.healthTips
   prefs.notifications.paperUpdates
   
   // New
   prefs.notifications.trends
   ```

4. **ProfileUpdate request:**
   ```typescript
   // Old
   { profileImageUrl: "..." }
   
   // New
   { profileImage: "..." }
   ```

## Verification

TypeScript compilation: ✅ PASSED (no errors)
Line count: 427 lines
Backend reference: `/backend/app/api/mypage.py` (1268 lines)

## Next Steps

1. Update frontend API service layer to use new types
2. Update components to access nested `paperData` structure
3. Update form submission logic for profile/health/preferences updates
4. Test all API integrations with updated types
