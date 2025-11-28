/**
 * useMyPageData Hook Tests
 * 마이페이지 데이터 훅 테스트
 */
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useMyPageData } from '../useMyPageData';
import type { BookmarkedPaper } from '../../../../types/mypage';

// Mock the API
vi.mock('../../../../services/mypageApi', () => ({
  getBookmarkedPapers: vi.fn(() =>
    Promise.resolve({
      bookmarks: [
        {
          id: '1',
          userId: 'user123',
          paperId: 'PMC123',
          title: 'Test Paper',
          authors: ['Author 1'],
          journal: 'Test Journal',
          pubDate: '2024-01-01',
          abstract: 'Test abstract',
          url: 'https://example.com',
          bookmarkedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    })
  ),
  getUserPosts: vi.fn(() =>
    Promise.resolve({
      posts: [
        {
          id: '1',
          userId: 'user123',
          title: '건강한 식단 관리 팁',
          content: '건강한 식단을 유지하는 방법에 대해 공유합니다...',
          category: '영양',
          tags: ['영양', '건강', '식단'],
          likes: 24,
          comments: 8,
          views: 156,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          userId: 'user123',
          title: '당뇨병 관리 경험 공유',
          content: '당뇨병 진단 후 생활 습관 개선 경험을 나눕니다...',
          category: '건강',
          tags: ['당뇨병', '건강관리'],
          likes: 45,
          comments: 15,
          views: 289,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    })
  ),
}));

describe('useMyPageData', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useMyPageData('user123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.posts).toEqual([]);
  });

  it('should fetch bookmarks and posts successfully', async () => {
    const { result } = renderHook(() => useMyPageData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.posts).toHaveLength(2);
    expect(result.current.bookmarksTotal).toBe(1);
    expect(result.current.postsTotal).toBe(2);
  });

  it('should add bookmark optimistically', async () => {
    const { result } = renderHook(() => useMyPageData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newBookmark: BookmarkedPaper = {
      id: '2',
      userId: 'user123',
      paperId: 'PMC456',
      title: 'New Paper',
      authors: ['Author 2'],
      journal: 'New Journal',
      pubDate: '2024-02-01',
      abstract: 'New abstract',
      url: 'https://example2.com',
      bookmarkedAt: new Date().toISOString(),
    };

    result.current.addBookmarkOptimistic(newBookmark);

    expect(result.current.bookmarks).toHaveLength(2);
    expect(result.current.bookmarks[0].id).toBe('2');
    expect(result.current.bookmarksTotal).toBe(2);
  });

  it('should remove bookmark optimistically', async () => {
    const { result } = renderHook(() => useMyPageData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const bookmarkId = result.current.bookmarks[0].id;
    result.current.removeBookmarkOptimistic(bookmarkId);

    expect(result.current.bookmarks).toHaveLength(0);
    expect(result.current.bookmarksTotal).toBe(0);
  });

  it('should update bookmark optimistically', async () => {
    const { result } = renderHook(() => useMyPageData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const bookmarkId = result.current.bookmarks[0].id;
    result.current.updateBookmarkOptimistic(bookmarkId, {
      notes: 'Updated notes',
      tags: ['new-tag'],
    });

    expect(result.current.bookmarks[0].notes).toBe('Updated notes');
    expect(result.current.bookmarks[0].tags).toEqual(['new-tag']);
  });

  it('should handle missing userId', async () => {
    const { result } = renderHook(() => useMyPageData(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('User ID is required');
  });

  it('should support refetch', async () => {
    const { result } = renderHook(() => useMyPageData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bookmarks).toBeDefined();
  });
});
