/**
 * useBookmarks Hook
 * 논문 북마크 관리를 위한 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react';
import type { BookmarkedPaper } from '../types/mypage';
import type { PaperResult } from '../services/trendsApi';
import {
  createBookmark,
  getBookmarks,
  deleteBookmark,
  deleteBookmarkByPaperId,
  updateBookmark,
  type CreateBookmarkRequest,
  type UpdateBookmarkRequest,
} from '../services/bookmarkApi';

/**
 * Bookmark state and actions hook
 */
export interface UseBookmarksReturn {
  /** Array of bookmarked papers */
  bookmarks: BookmarkedPaper[];

  /** Loading state for bookmark operations */
  loading: boolean;

  /** Error message if any operation failed */
  error: string | null;

  /** Check if a paper is bookmarked */
  checkIsBookmarked: (paperId: string) => boolean;

  /** Add a paper to bookmarks */
  addBookmark: (paper: PaperResult, tags?: string[], notes?: string) => Promise<void>;

  /** Remove a bookmark by ID */
  removeBookmark: (bookmarkId: string) => Promise<void>;

  /** Remove a bookmark by paper ID */
  removeBookmarkByPaperId: (paperId: string) => Promise<void>;

  /** Update bookmark tags and notes */
  updateBookmarkData: (
    bookmarkId: string,
    updates: UpdateBookmarkRequest
  ) => Promise<void>;

  /** Reload bookmarks from server/storage */
  reloadBookmarks: () => Promise<void>;

  /** Clear error state */
  clearError: () => void;
}

/**
 * Custom hook for managing paper bookmarks
 *
 * @param userId - User ID for bookmark operations
 * @param autoLoad - Whether to automatically load bookmarks on mount (default: true)
 * @returns Bookmark state and action functions
 *
 * @example
 * ```tsx
 * const { bookmarks, addBookmark, removeBookmark, checkIsBookmarked } = useBookmarks(userId);
 *
 * // Check if a paper is bookmarked
 * const isBookmarked = checkIsBookmarked(paper.pmid);
 *
 * // Add a bookmark
 * await addBookmark(paper, ['kidney', 'CKD'], 'Interesting findings');
 *
 * // Remove a bookmark
 * await removeBookmarkByPaperId(paper.pmid);
 * ```
 */
export function useBookmarks(
  userId: string | null | undefined,
  autoLoad: boolean = true
): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<BookmarkedPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load bookmarks from API/storage
   */
  const loadBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getBookmarks(userId);
      setBookmarks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '북마크를 불러오는데 실패했습니다';
      setError(errorMessage);
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Auto-load bookmarks on mount or when userId changes
   */
  useEffect(() => {
    if (autoLoad) {
      loadBookmarks();
    }
  }, [autoLoad, loadBookmarks]);

  /**
   * Check if a paper is bookmarked (local check for fast UI updates)
   */
  const checkIsBookmarked = useCallback(
    (paperId: string): boolean => {
      return bookmarks.some((b) => b.paperId === paperId);
    },
    [bookmarks]
  );

  /**
   * Add a new bookmark
   */
  const addBookmark = useCallback(
    async (paper: PaperResult, tags?: string[], notes?: string): Promise<void> => {
      if (!userId) {
        throw new Error('로그인이 필요합니다');
      }

      try {
        setLoading(true);
        setError(null);

        const request: CreateBookmarkRequest = {
          userId,
          paper,
          tags,
          notes,
        };

        const newBookmark = await createBookmark(request);

        // Optimistically update local state
        setBookmarks((prev) => [newBookmark, ...prev]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '북마크 추가에 실패했습니다';
        setError(errorMessage);
        console.error('Failed to add bookmark:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Remove a bookmark by ID
   */
  const removeBookmark = useCallback(
    async (bookmarkId: string): Promise<void> => {
      if (!userId) {
        throw new Error('로그인이 필요합니다');
      }

      try {
        setLoading(true);
        setError(null);

        await deleteBookmark(bookmarkId, userId);

        // Optimistically update local state
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '북마크 삭제에 실패했습니다';
        setError(errorMessage);
        console.error('Failed to remove bookmark:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Remove a bookmark by paper ID
   */
  const removeBookmarkByPaperId = useCallback(
    async (paperId: string): Promise<void> => {
      if (!userId) {
        throw new Error('로그인이 필요합니다');
      }

      try {
        setLoading(true);
        setError(null);

        await deleteBookmarkByPaperId(paperId, userId);

        // Optimistically update local state
        setBookmarks((prev) => prev.filter((b) => b.paperId !== paperId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '북마크 삭제에 실패했습니다';
        setError(errorMessage);
        console.error('Failed to remove bookmark by paper ID:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Update bookmark tags and notes
   */
  const updateBookmarkData = useCallback(
    async (bookmarkId: string, updates: UpdateBookmarkRequest): Promise<void> => {
      if (!userId) {
        throw new Error('로그인이 필요합니다');
      }

      try {
        setLoading(true);
        setError(null);

        const updatedBookmark = await updateBookmark(bookmarkId, userId, updates);

        // Optimistically update local state
        setBookmarks((prev) =>
          prev.map((b) => (b.id === bookmarkId ? updatedBookmark : b))
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '북마크 업데이트에 실패했습니다';
        setError(errorMessage);
        console.error('Failed to update bookmark:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    bookmarks,
    loading,
    error,
    checkIsBookmarked,
    addBookmark,
    removeBookmark,
    removeBookmarkByPaperId,
    updateBookmarkData,
    reloadBookmarks: loadBookmarks,
    clearError,
  };
}
