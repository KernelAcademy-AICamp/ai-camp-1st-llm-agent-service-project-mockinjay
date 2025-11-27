# MyPage Type Changes - Quick Reference

## Critical Breaking Changes

### 1. UserProfile
| Field | Old | New | Notes |
|-------|-----|-----|-------|
| `profileImage` | ❌ Missing | ✅ Added | Backend primary field |
| `profileImageUrl` | ✅ Present | ✅ Present | Kept for compatibility |
| `createdAt` | ❌ Missing | ✅ Added | ISO 8601 string |
| `profile` | Optional | Required | Must be provided |
| `role` | Optional | Required | Must be provided |

### 2. HealthProfile
| Field | Old | New | Notes |
|-------|-----|-----|-------|
| `conditions` | ❌ Missing | ✅ Added | Backend primary field |
| `healthConditions` | ✅ Present | ✅ Present | Alias (backend returns both) |
| `medications` | ✅ Present | ❌ Removed | Not in backend |
| `notes` | ✅ Present | ❌ Removed | Not in backend |
| `gender` | `'prefer_not_to_say'` | ❌ Removed | Backend only has: 'male', 'female', 'other' |

### 3. UserPreferences
| Field | Old | New | Notes |
|-------|-----|-----|-------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'light' \| 'dark'` | 'system' removed |
| `notifications.trends` | ❌ Missing | ✅ Added | Backend uses this |
| `notifications.healthTips` | ✅ Present | ❌ Removed | Not in backend |
| `notifications.paperUpdates` | ✅ Present | ❌ Removed | Not in backend |
| `privacy` | ✅ Present | ❌ Removed | Not in backend |

### 4. BookmarkedPaper (MAJOR CHANGE)
| Field | Old | New | Notes |
|-------|-----|-----|-------|
| `title` | ✅ Top-level | ❌ Removed | Now in `paperData.title` |
| `authors` | ✅ Top-level | ❌ Removed | Now in `paperData.authors` |
| `journal` | ✅ Top-level | ❌ Removed | Now in `paperData.journal` |
| `pubDate` | ✅ Top-level | ❌ Removed | Now in `paperData.pub_date` |
| `abstract` | ✅ Top-level | ❌ Removed | Now in `paperData.abstract` |
| `url` | ✅ Top-level | ❌ Removed | Not in backend |
| `tags` | ✅ Top-level | ❌ Removed | Not in backend |
| `notes` | ✅ Top-level | ❌ Removed | Not in backend |
| `paperData` | ❌ Missing | ✅ Added | Nested object with all paper metadata |
| `bookmarkedAt` | ✅ Present | ❌ Removed | Now `createdAt` |
| `createdAt` | ❌ Missing | ✅ Added | Replaces `bookmarkedAt` |

### 5. Post (Complete Restructure)
| Field | Old | New | Notes |
|-------|-----|-----|-------|
| `authorName` | ❌ Missing | ✅ Added | Author display name |
| `postType` | ❌ Missing | ✅ Added | 'BOARD' \| 'CHALLENGE' \| 'SURVEY' |
| `imageUrls` | ❌ Missing | ✅ Added | Array of image URLs |
| `thumbnailUrl` | ❌ Missing | ✅ Added | Main thumbnail |
| `commentCount` | ❌ Missing | ✅ Added | Number of comments |
| `viewCount` | ❌ Missing | ✅ Added | View count |
| `lastActivityAt` | ❌ Missing | ✅ Added | Last activity timestamp |
| `isPinned` | ❌ Missing | ✅ Added | Pin status |
| `isDeleted` | ❌ Missing | ✅ Added | Deletion status |
| `category` | ✅ Present | ❌ Removed | Not in backend |
| `tags` | ✅ Present | ❌ Removed | Not in backend |
| `comments` | ✅ Present | ❌ Removed | Use `commentCount` |
| `views` | ✅ Present | ❌ Removed | Use `viewCount` |

### 6. New Response Interfaces
| Interface | Status | Purpose |
|-----------|--------|---------|
| `BookmarksResponse` | ✅ Added | Paginated bookmarks list |
| `PostsResponse` | ✅ Added | Paginated posts list |
| `PointsHistoryResponse` | ✅ Added | Paginated points history |
| `PaperData` | ✅ Added | Paper metadata structure |
| `BookmarkCreateRequest` | ✅ Added | Create bookmark payload |
| `PointsHistoryFilters` | ✅ Added | Query params for points history |

### 7. Request Types Changed
| Request Type | Old Field | New Field | Notes |
|--------------|-----------|-----------|-------|
| `ProfileUpdateRequest` | `profileImageUrl` | `profileImage` | Field name change |
| `HealthProfileUpdateRequest` | N/A | `conditions` | New field (primary) |
| `PreferencesUpdateRequest` | `notifications.healthTips` | `notifications.trends` | Field renamed |
| `PreferencesUpdateRequest` | `privacy` | ❌ Removed | Not in backend |

## Code Migration Examples

### Accessing Bookmarked Paper Data

```typescript
// OLD CODE
const title = bookmark.title;
const authors = bookmark.authors;
const journal = bookmark.journal;

// NEW CODE
const title = bookmark.paperData.title;
const authors = bookmark.paperData.authors;
const journal = bookmark.paperData.journal;
```

### Creating a Bookmark

```typescript
// OLD CODE
const request = {
  paperId: "12345",
  title: "Paper Title",
  authors: ["Author 1"],
  // ... other fields
};

// NEW CODE
const request: BookmarkCreateRequest = {
  paperId: "12345",
  paperData: {
    title: "Paper Title",
    authors: ["Author 1"],
    abstract: "...",
    pub_date: "2024-01-01",
    journal: "Journal Name"
  }
};
```

### Updating User Profile

```typescript
// OLD CODE
const update: ProfileUpdateRequest = {
  profileImageUrl: "/uploads/image.jpg"
};

// NEW CODE
const update: ProfileUpdateRequest = {
  profileImage: "/uploads/image.jpg"
};
```

### Updating Health Profile

```typescript
// OLD CODE
const update: HealthProfileUpdateRequest = {
  healthConditions: ["당뇨", "고혈압"]
};

// NEW CODE
const update: HealthProfileUpdateRequest = {
  conditions: ["당뇨", "고혈압"]  // Backend primary field
};
```

### Updating Preferences

```typescript
// OLD CODE
const update: PreferencesUpdateRequest = {
  notifications: {
    healthTips: true,
    paperUpdates: false
  }
};

// NEW CODE
const update: PreferencesUpdateRequest = {
  notifications: {
    trends: true  // Backend consolidated field
  }
};
```

### Pagination Response Handling

```typescript
// OLD CODE
const bookmarks: BookmarkedPaper[] = await fetchBookmarks();

// NEW CODE
const response: BookmarksResponse = await fetchBookmarks();
const { bookmarks, total, hasMore } = response;

// Load more if needed
if (hasMore) {
  const nextPage = await fetchBookmarks({ offset: bookmarks.length });
}
```

## TypeScript Compilation Status

✅ All types compile successfully with no errors
✅ 427 lines of type definitions
✅ Complete alignment with backend API (`/backend/app/api/mypage.py`)

## Files Modified

1. `/new_frontend/src/types/mypage.ts` - Complete rewrite

## Documentation Created

1. `/new_frontend/TYPE_ALIGNMENT_SUMMARY.md` - Detailed change summary
2. `/new_frontend/MYPAGE_TYPE_CHANGES.md` - This quick reference guide
