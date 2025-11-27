/**
 * useMyPageData Hook
 * 북마크 및 게시글 데이터 통합 로딩 및 관리
 */
import { useState, useEffect, useCallback } from 'react';
import { getBookmarkedPapers, getUserPosts } from '../../../services/mypageApi';
import type { BookmarkedPaper, Post } from '../../../types/mypage';

/**
 * MyPage Data State
 */
interface MyPageData {
  bookmarks: BookmarkedPaper[];
  posts: Post[];
  bookmarksTotal: number;
  postsTotal: number;
}

/**
 * useMyPageData Return Type
 */
interface UseMyPageDataReturn {
  /** Bookmarks data */
  bookmarks: BookmarkedPaper[];
  /** Posts data */
  posts: Post[];
  /** Total bookmarks count */
  bookmarksTotal: number;
  /** Total posts count */
  postsTotal: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch all data */
  refetch: () => Promise<void>;
  /** Add bookmark optimistically */
  addBookmarkOptimistic: (bookmark: BookmarkedPaper) => void;
  /** Remove bookmark optimistically */
  removeBookmarkOptimistic: (bookmarkId: string) => void;
  /** Update bookmark optimistically */
  updateBookmarkOptimistic: (bookmarkId: string, updates: Partial<BookmarkedPaper>) => void;
}


/**
 * useMyPageData Hook
 *
 * 사용자의 북마크와 게시글 데이터를 통합 관리합니다.
 * Optimistic updates를 지원하여 빠른 UI 업데이트를 제공합니다.
 *
 * @param userId - User ID
 * @param initialLimit - Initial data fetch limit (default: 20)
 * @returns MyPage data and control methods
 *
 * @example
 * ```tsx
 * const {
 *   bookmarks,
 *   posts,
 *   loading,
 *   error,
 *   refetch,
 *   addBookmarkOptimistic,
 *   removeBookmarkOptimistic,
 * } = useMyPageData(userId);
 *
 * const handleAddBookmark = async (paper) => {
 *   addBookmarkOptimistic(paper); // UI updates immediately
 *   try {
 *     await addBookmark(userId, paper); // API call
 *   } catch (err) {
 *     refetch(); // Revert on error
 *   }
 * };
 * ```
 */
export function useMyPageData(
  userId: string,
  initialLimit = 20
): UseMyPageDataReturn {
  const [data, setData] = useState<MyPageData>({
    bookmarks: [],
    posts: [],
    bookmarksTotal: 0,
    postsTotal: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all mypage data
   */
  const fetchData = useCallback(async () => {
    if (!userId) {
      setError(new Error('User ID is required'));
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Fetch bookmarks and posts in parallel
      const [bookmarksResponse, postsResponse] = await Promise.all([
        getBookmarkedPapers(userId, initialLimit, 0),
        getUserPosts(userId, initialLimit, 0),
      ]);

      setData({
        bookmarks: bookmarksResponse.bookmarks,
        posts: postsResponse.posts,
        bookmarksTotal: bookmarksResponse.total,
        postsTotal: postsResponse.total,
      });
    } catch (err) {
      if (err instanceof Error && err.message !== 'Request aborted') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }

    return () => {
      controller.abort();
    };
  }, [userId, initialLimit]);

  /**
   * Refetch all data (public API)
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Add bookmark optimistically
   */
  const addBookmarkOptimistic = useCallback((bookmark: BookmarkedPaper) => {
    setData((prev) => ({
      ...prev,
      bookmarks: [bookmark, ...prev.bookmarks],
      bookmarksTotal: prev.bookmarksTotal + 1,
    }));
  }, []);

  /**
   * Remove bookmark optimistically
   */
  const removeBookmarkOptimistic = useCallback((bookmarkId: string) => {
    setData((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.filter((b) => b.id !== bookmarkId),
      bookmarksTotal: Math.max(0, prev.bookmarksTotal - 1),
    }));
  }, []);

  /**
   * Update bookmark optimistically
   */
  const updateBookmarkOptimistic = useCallback(
    (bookmarkId: string, updates: Partial<BookmarkedPaper>) => {
      setData((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.map((b) =>
          b.id === bookmarkId ? { ...b, ...updates } : b
        ),
      }));
    },
    []
  );

  /**
   * Initial fetch on mount or userId change
   */
  useEffect(() => {
    const cleanup = fetchData();
    return () => {
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, [fetchData]);

  return {
    bookmarks: data.bookmarks,
    posts: data.posts,
    bookmarksTotal: data.bookmarksTotal,
    postsTotal: data.postsTotal,
    loading,
    error,
    refetch,
    addBookmarkOptimistic,
    removeBookmarkOptimistic,
    updateBookmarkOptimistic,
  };
}
