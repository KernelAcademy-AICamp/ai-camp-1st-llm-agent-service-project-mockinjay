# Community Features Test Checklist

Quick reference checklist for testing COM-001 through COM-016 features.

## Pre-Test Setup

- [ ] Backend server running on expected port
- [ ] Database seeded with test data
- [ ] Frontend dev server running on http://localhost:5175
- [ ] Network connectivity verified
- [ ] Test user accounts created

---

## COM-001: Post Board (게시판 글 작성)

### UI Tests
- [x] "글쓰기" button visible on main page
- [x] Create post modal opens
- [x] Title input field (max 200 chars)
- [x] Content textarea (max 5000 chars)
- [x] Category dropdown (질문/정보공유/일상)
- [x] Image upload option (max 2 images)
- [x] Submit and Cancel buttons present

### Functional Tests
- [ ] Create post successfully
- [ ] Form validation works
- [ ] Post appears in list after creation
- [ ] User receives +5P points
- [ ] Error handling for failed submission

### Backend Requirements
- [ ] POST /api/community/posts endpoint working
- [ ] Title/content validation
- [ ] Category field accepts: BOARD, CHALLENGE, SURVEY
- [ ] Points system awards +5P

---

## COM-006: List View (목록 보기)

### UI Tests
- [x] Page title "커뮤니티" displays
- [x] Subtitle with description
- [x] Featured posts section heading
- [x] Empty state message (when no posts)
- [x] Error state with retry button
- [ ] Post cards display in grid/list
- [ ] Post card shows: title, author, time, preview
- [ ] Comment count icon + number
- [ ] Like count icon + number
- [ ] Category badge on each post

### Functional Tests
- [ ] Posts load on page mount
- [ ] Infinite scroll loads more posts
- [ ] Clicking post navigates to detail view
- [ ] "다시 시도" button reloads posts
- [ ] Sort/filter options work

### Backend Requirements
- [ ] GET /api/community/posts endpoint
- [ ] Pagination with cursor
- [ ] Sort by: createdAt, lastActivityAt, likes
- [ ] Returns: posts[], nextCursor, hasMore

---

## COM-007: Detail View (상세 페이지)

### UI Tests
- [ ] Post title displays
- [ ] Category badge shows
- [ ] Author name and timestamp
- [ ] Full post content (not truncated)
- [ ] Images display in 2-column grid
- [ ] Like button with count
- [ ] Comment count
- [ ] Comments list below post
- [ ] Comment input field
- [ ] Back to list button

### Functional Tests
- [ ] Navigate from list to detail
- [ ] Images load correctly
- [ ] Like button works
- [ ] Comments display
- [ ] Back button returns to list
- [ ] URL contains post ID

### Backend Requirements
- [ ] GET /api/community/posts/:id endpoint
- [ ] Returns: post object, comments array
- [ ] 404 handling for non-existent posts

---

## COM-008: Post Creation (게시글 생성)

### UI Tests
- [x] Modal opens for anonymous users
- [x] Modal opens for logged-in users
- [x] All form fields render
- [x] Character counters update
- [x] Anonymous checkbox (logged-in only)

### Functional Tests
- [ ] Anonymous users can create posts
- [ ] Logged-in users can create posts
- [ ] Logged-in users can post anonymously
- [ ] Form submits successfully
- [ ] Redirects to post detail after creation
- [ ] Loading state during submission
- [ ] Error messages display

### Backend Requirements
- [ ] POST /api/community/posts works
- [ ] Accepts anonymousId for consistency
- [ ] Validates title length (max 200)
- [ ] Validates content length (max 5000)
- [ ] Returns created post with ID

---

## COM-009: Post Edit (게시글 수정)

### UI Tests
- [ ] Edit button visible only to author
- [ ] Edit button has proper icon
- [ ] Clicking opens edit modal/form
- [ ] Form pre-filled with existing data
- [ ] Save and Cancel buttons

### Functional Tests
- [ ] Only author can edit post
- [ ] Non-authors don't see edit button
- [ ] Changes save successfully
- [ ] Post updates in list view
- [ ] Updated timestamp changes
- [ ] Error handling

### Backend Requirements
- [ ] PUT /api/community/posts/:id endpoint
- [ ] Authorization check (author only)
- [ ] Validation same as create
- [ ] Returns updated post

---

## COM-010: Post Delete (게시글 삭제)

### UI Tests
- [ ] Delete button visible only to author
- [ ] Delete button in red/warning color
- [ ] Confirmation dialog appears
- [ ] Dialog has "취소" and "삭제" buttons

### Functional Tests
- [ ] Only author can delete post
- [ ] Confirmation required before deletion
- [ ] Post removed from list after deletion
- [ ] Soft delete (not permanent removal)
- [ ] Success message displays
- [ ] Redirect to list view

### Backend Requirements
- [ ] DELETE /api/community/posts/:id endpoint
- [ ] Authorization check (author only)
- [ ] Soft delete (deletedAt timestamp)
- [ ] Returns success status

---

## COM-011: Comment Create (댓글 작성)

### UI Tests
- [ ] Comment input field on detail page
- [ ] Submit button visible
- [ ] Anonymous checkbox (logged-in users)
- [ ] Character count/limit indicator
- [ ] Loading state during submission

### Functional Tests
- [ ] Anonymous users can comment
- [ ] Logged-in users can comment
- [ ] Logged-in users can comment anonymously
- [ ] Same anonymous user gets same number per post
- [ ] Comment appears immediately after posting
- [ ] User receives +2P points
- [ ] Enter key submits comment

### Backend Requirements
- [ ] POST /api/community/posts/:id/comments endpoint
- [ ] Accepts anonymousId for numbering
- [ ] Returns created comment
- [ ] Points system awards +2P

---

## COM-014: Like Toggle (좋아요 토글)

### UI Tests
- [ ] Heart icon button visible
- [ ] Like count displays next to icon
- [ ] Visual feedback when liked (filled heart)
- [ ] Visual feedback when unliked (outline heart)

### Functional Tests
- [ ] Anonymous users can like posts
- [ ] Logged-in users can like posts
- [ ] Toggle works (like/unlike)
- [ ] Like count increments/decrements
- [ ] State persists on page reload
- [ ] Optimistic UI update

### Backend Requirements
- [ ] POST /api/community/posts/:id/like endpoint
- [ ] Tracks user's like state
- [ ] Returns updated like count
- [ ] Prevents duplicate likes

---

## COM-015: Featured Cards (인기 게시글)

### UI Tests
- [x] "인기 게시글" heading displays
- [x] Horizontal scrollable container
- [ ] Top 3 posts display
- [ ] Featured card styling distinct from regular cards
- [ ] Cards clickable

### Functional Tests
- [ ] Featured posts load on page mount
- [ ] Clicking navigates to post detail
- [ ] Updates based on algorithm
- [ ] Shows most popular/engaged posts

### Backend Requirements
- [ ] GET /api/community/posts/featured endpoint
- [ ] Returns top 3 posts
- [ ] Sort by: likes + comments + recent activity
- [ ] Caching for performance

---

## COM-016: Image Upload (이미지 업로드)

### UI Tests
- [x] Image upload button in create modal
- [x] File input accepts images
- [x] Upload limit indicator (0/2)
- [x] Max images message
- [ ] Image preview after selection
- [ ] Remove image button on previews
- [ ] Upload progress indicator

### Functional Tests
- [ ] Select image files
- [ ] Upload one image at a time
- [ ] Preview shows selected images
- [ ] Remove selected images
- [ ] Submit post with images
- [ ] Images display in post detail
- [ ] 2-column grid layout
- [ ] Error handling for large files

### Backend Requirements
- [ ] POST /api/community/upload endpoint
- [ ] Accepts multipart/form-data
- [ ] Returns image URL
- [ ] File size validation
- [ ] Image format validation (jpg, png, gif)
- [ ] Storage (S3, local, etc.)

### Known Issues
- [ ] Fix: 3+ images cause 404 error
- [ ] Investigate: Vite proxy configuration
- [ ] Temporary: Limited to 2 images

---

## Additional Tests

### Navigation
- [x] Direct URL to /community
- [ ] Sidebar navigation
- [ ] Bottom nav (mobile)
- [ ] Back button functionality
- [ ] Browser back/forward

### Infinite Scroll
- [ ] Load more on scroll to bottom
- [ ] Loading indicator appears
- [ ] No duplicate posts
- [ ] "모든 게시글을 불러왔습니다" message when done

### Responsive Design
- [x] Desktop layout (1280x720)
- [x] Mobile layout (375x667)
- [ ] Tablet layout (768x1024)
- [ ] Bottom nav on mobile
- [ ] Sidebar hidden on mobile

### Performance
- [x] Page load < 5 seconds
- [ ] Image lazy loading
- [ ] Skeleton loaders
- [ ] Smooth scrolling
- [ ] No layout shifts

### Error Handling
- [x] API failure message
- [x] Retry button
- [ ] Network offline detection
- [ ] Invalid post ID (404)
- [ ] Form validation errors
- [ ] File upload errors

### Accessibility
- [x] Heading hierarchy (h1, h2)
- [x] Button labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Alt text for images

### Security
- [ ] XSS prevention in post content
- [ ] CSRF token validation
- [ ] Image upload validation
- [ ] Authorization checks
- [ ] SQL injection prevention

---

## Test Data Requirements

### Seed Data Needed
```javascript
// Posts
- 20+ posts with varied content
- Posts with 0, 1, 2 images
- Posts with comments
- Posts with likes
- Featured posts (high engagement)

// Users
- Test user (logged-in)
- Anonymous users (multiple)
- Post authors

// Comments
- Comments on various posts
- Anonymous comments
- Logged-in user comments
```

---

## Test Execution Summary

| Feature | UI | Backend | E2E | Status |
|---------|----|---------|----|--------|
| COM-001 | ✅ | ⏳ | ⏳ | Partial |
| COM-006 | ✅ | ❌ | ⏳ | Blocked |
| COM-007 | ✅ | ⏳ | ⏳ | Partial |
| COM-008 | ✅ | ⏳ | ⏳ | Partial |
| COM-009 | ⏳ | ⏳ | ⏳ | Pending |
| COM-010 | ⏳ | ⏳ | ⏳ | Pending |
| COM-011 | ✅ | ⏳ | ⏳ | Partial |
| COM-014 | ✅ | ⏳ | ⏳ | Partial |
| COM-015 | ✅ | ❌ | ⏳ | Blocked |
| COM-016 | ✅ | ⏳ | ⏳ | Partial |

**Legend**:
- ✅ Complete
- ⏳ Pending/In Progress
- ❌ Blocked/Failed

---

## Quick Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run community tests only
npx playwright test tests/e2e/community-features.spec.ts

# Run tests in headed mode (see browser)
npx playwright test tests/e2e/community-features.spec.ts --headed

# Run tests in debug mode
npx playwright test tests/e2e/community-features.spec.ts --debug

# Generate HTML report
npx playwright show-report

# Run specific test
npx playwright test -g "COM-006"
```

---

**Checklist Version**: 1.0
**Last Updated**: 2025-11-27
**Location**: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/new_frontend/COMMUNITY_TEST_CHECKLIST.md`
