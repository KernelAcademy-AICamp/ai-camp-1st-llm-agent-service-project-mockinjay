# MyPage Hooks Usage Guide

마이페이지 커스텀 React 훅 사용 가이드

## Overview

이 디렉토리에는 마이페이지 기능을 위한 3개의 커스텀 React 훅이 포함되어 있습니다:

1. **useModalState** - 5개 모달 상태 통합 관리
2. **useQuizStats** - 퀴즈 통계 데이터 로딩 및 관리
3. **useMyPageData** - 북마크 및 게시글 데이터 통합 관리

---

## 1. useModalState

### 기능
- 5개 모달 타입 지원: `'profile' | 'health' | 'settings' | 'bookmarks' | 'posts'`
- 한 번에 하나의 모달만 열리도록 관리
- 간단한 API로 모달 제어

### 사용법

```tsx
import { useModalState } from '@/components/mypage/hooks';

function MyPageComponent() {
  const { isOpen, open, close, toggle } = useModalState();

  return (
    <div>
      {/* Open profile modal */}
      <button onClick={() => open('profile')}>
        Edit Profile
      </button>

      {/* Profile Modal */}
      {isOpen('profile') && (
        <ProfileEditModal
          isOpen={true}
          onClose={close}
        />
      )}

      {/* Health Modal */}
      {isOpen('health') && (
        <HealthProfileModal
          isOpen={true}
          onClose={close}
        />
      )}

      {/* Toggle settings modal */}
      <button onClick={() => toggle('settings')}>
        Toggle Settings
      </button>
    </div>
  );
}
```

### API

| Method | Type | Description |
|--------|------|-------------|
| `isOpen(modal)` | `(modal: ModalType) => boolean` | 특정 모달이 열려있는지 확인 |
| `open(modal)` | `(modal: ModalType) => void` | 특정 모달 열기 (다른 모달은 자동으로 닫힘) |
| `close()` | `() => void` | 모든 모달 닫기 |
| `toggle(modal)` | `(modal: ModalType) => void` | 특정 모달 토글 |
| `state` | `ModalState` | 현재 모달 상태 (디버깅용) |

---

## 2. useQuizStats

### 기능
- 실제 Backend API 연동 (quizApi.ts 사용)
- 퀴즈 통계 데이터 자동 로딩
- Loading/Error 상태 관리
- AbortController로 자동 cleanup
- Refetch 기능 제공

### 사용법

```tsx
import { useQuizStats } from '@/components/mypage/hooks';

function QuizStatsPanel({ userId }: { userId: string }) {
  const { stats, loading, error, refetch } = useQuizStats(userId);

  if (loading) {
    return <div>Loading quiz statistics...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!stats) {
    return <div>No quiz data available</div>;
  }

  return (
    <div className="quiz-stats">
      <h3>Quiz Statistics</h3>
      <div>
        <p>Total Quizzes: {stats.totalQuizzes}</p>
        <p>Correct Answers: {stats.correctAnswers}</p>
        <p>Average Score: {stats.averageScore}%</p>
        <p>Current Streak: {stats.streak} days</p>
      </div>

      {/* Category breakdown */}
      {stats.categoryStats && (
        <div>
          <h4>By Category</h4>
          {stats.categoryStats.map((cat) => (
            <div key={cat.category}>
              <span>{cat.category}</span>
              <span>{cat.accuracy}% accuracy</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={refetch}>Refresh Stats</button>
    </div>
  );
}
```

### API

| Property | Type | Description |
|----------|------|-------------|
| `stats` | `QuizStats \| null` | 퀴즈 통계 데이터 |
| `loading` | `boolean` | 로딩 상태 |
| `error` | `Error \| null` | 에러 상태 |
| `refetch` | `() => Promise<void>` | 데이터 재로딩 |

### QuizStats Type

```typescript
interface QuizStats {
  totalQuizzes: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageScore: number;
  streak: number;
  lastQuizDate?: string;
  categoryStats?: Array<{
    category: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}
```

---

## 3. useMyPageData

### 기능
- 실제 Backend API 연동 (mypageApi.ts 사용)
- 북마크와 게시글 데이터 병렬 로딩
- Optimistic updates 지원 (즉각적인 UI 업데이트)
- Error handling 및 refetch 지원

### 사용법

```tsx
import { useMyPageData } from '@/components/mypage/hooks';
import { addBookmark, removeBookmark } from '@/services/mypageApi';

function MyPageContent({ userId }: { userId: string }) {
  const {
    bookmarks,
    posts,
    bookmarksTotal,
    postsTotal,
    loading,
    error,
    refetch,
    addBookmarkOptimistic,
    removeBookmarkOptimistic,
    updateBookmarkOptimistic,
  } = useMyPageData(userId);

  // Optimistic bookmark addition
  const handleAddBookmark = async (paper: any) => {
    const newBookmark = {
      id: `temp_${Date.now()}`, // Temporary ID
      userId,
      ...paper,
      bookmarkedAt: new Date().toISOString(),
    };

    // UI updates immediately
    addBookmarkOptimistic(newBookmark);

    try {
      // Actual API call
      const savedBookmark = await addBookmark(userId, paper);
      // Update with real ID
      updateBookmarkOptimistic(newBookmark.id, savedBookmark);
    } catch (err) {
      // Revert on error
      removeBookmarkOptimistic(newBookmark.id);
      console.error('Failed to add bookmark:', err);
    }
  };

  // Optimistic bookmark removal
  const handleRemoveBookmark = async (bookmarkId: string) => {
    // UI updates immediately
    removeBookmarkOptimistic(bookmarkId);

    try {
      // Actual API call
      await removeBookmark(userId, bookmarkId);
    } catch (err) {
      // Refetch to restore correct state
      await refetch();
      console.error('Failed to remove bookmark:', err);
    }
  };

  if (loading) {
    return <div>Loading your data...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Bookmarks Section */}
      <section>
        <h2>Bookmarks ({bookmarksTotal})</h2>
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id}>
            <h3>{bookmark.title}</h3>
            <p>{bookmark.authors.join(', ')}</p>
            <button onClick={() => handleRemoveBookmark(bookmark.id)}>
              Remove
            </button>
          </div>
        ))}
      </section>

      {/* Posts Section */}
      <section>
        <h2>My Posts ({postsTotal})</h2>
        {posts.map((post) => (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <div>
              {post.likes} likes · {post.comments} comments
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
```

### API

| Property | Type | Description |
|----------|------|-------------|
| `bookmarks` | `BookmarkedPaper[]` | 북마크 목록 |
| `posts` | `Post[]` | 게시글 목록 |
| `bookmarksTotal` | `number` | 전체 북마크 수 |
| `postsTotal` | `number` | 전체 게시글 수 |
| `loading` | `boolean` | 로딩 상태 |
| `error` | `Error \| null` | 에러 상태 |
| `refetch` | `() => Promise<void>` | 데이터 재로딩 |
| `addBookmarkOptimistic` | `(bookmark: BookmarkedPaper) => void` | 북마크 추가 (UI 즉시 업데이트) |
| `removeBookmarkOptimistic` | `(bookmarkId: string) => void` | 북마크 삭제 (UI 즉시 업데이트) |
| `updateBookmarkOptimistic` | `(bookmarkId: string, updates: Partial<BookmarkedPaper>) => void` | 북마크 업데이트 (UI 즉시 업데이트) |

---

## Complete Example

전체 마이페이지 컴포넌트 예제:

```tsx
import React from 'react';
import {
  useModalState,
  useQuizStats,
  useMyPageData,
} from '@/components/mypage/hooks';
import { ProfileEditModal } from './ProfileEditModal';
import { HealthProfileModal } from './HealthProfileModal';

export function MyPage({ userId }: { userId: string }) {
  // Modal state management
  const { isOpen, open, close } = useModalState();

  // Quiz statistics
  const { stats: quizStats, loading: quizLoading } = useQuizStats(userId);

  // Bookmarks and posts
  const {
    bookmarks,
    posts,
    loading: dataLoading,
    removeBookmarkOptimistic,
  } = useMyPageData(userId);

  const loading = quizLoading || dataLoading;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mypage">
      {/* Header */}
      <header>
        <h1>My Page</h1>
        <button onClick={() => open('profile')}>Edit Profile</button>
      </header>

      {/* Quiz Stats */}
      <section>
        <h2>Quiz Performance</h2>
        {quizStats && (
          <div>
            <p>Total: {quizStats.totalQuizzes}</p>
            <p>Score: {quizStats.averageScore}%</p>
          </div>
        )}
      </section>

      {/* Bookmarks */}
      <section>
        <h2>Bookmarks ({bookmarks.length})</h2>
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id}>
            <h3>{bookmark.title}</h3>
            <button onClick={() => removeBookmarkOptimistic(bookmark.id)}>
              Remove
            </button>
          </div>
        ))}
      </section>

      {/* Posts */}
      <section>
        <h2>My Posts ({posts.length})</h2>
        {posts.map((post) => (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        ))}
      </section>

      {/* Modals */}
      {isOpen('profile') && (
        <ProfileEditModal isOpen={true} onClose={close} />
      )}
      {isOpen('health') && (
        <HealthProfileModal isOpen={true} onClose={close} />
      )}
    </div>
  );
}
```

---

## Testing

모든 훅에 대한 테스트 파일이 `__tests__` 디렉토리에 포함되어 있습니다:

- `useModalState.test.ts`
- `useQuizStats.test.ts`
- `useMyPageData.test.ts`

테스트 실행:

```bash
npm test -- hooks
```

---

## Best Practices

1. **Optimistic Updates**: 사용자 경험을 위해 UI를 먼저 업데이트하고, API 호출은 백그라운드에서 처리
2. **Error Handling**: API 실패 시 refetch()를 호출하여 정확한 상태로 복원
3. **Cleanup**: 모든 훅은 컴포넌트 언마운트 시 자동으로 cleanup 수행
4. **Loading States**: 로딩 상태를 적절히 처리하여 사용자에게 피드백 제공

---

## Future Improvements

- [x] useQuizStats: 실제 Backend API 연동 완료
- [x] useMyPageData: 실제 Backend API 연동 완료
- [ ] useMyPageData: 페이지네이션 지원
- [ ] useMyPageData: 캐싱 전략 추가 (React Query 고려)
- [ ] useQuizStats: Category별 통계 Backend API 추가 시 연동
- [ ] 모든 훅에 TypeScript strict mode 적용
