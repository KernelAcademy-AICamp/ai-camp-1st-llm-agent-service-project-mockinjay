/**
 * Bookmark API Service
 * 논문 북마크 관련 API 서비스
 */

import api from './api';
import { storage } from '../utils/storage';
import type { BookmarkedPaper } from '../types/mypage';
import type { PaperResult } from './trendsApi';

// ==================== Types ====================

/**
 * Bookmark creation request
 */
export interface CreateBookmarkRequest {
  userId: string;
  paper: PaperResult;
  tags?: string[];
  notes?: string;
}

/**
 * Bookmark update request
 */
export interface UpdateBookmarkRequest {
  tags?: string[];
  notes?: string;
}

/**
 * Bookmark API response
 */
export interface BookmarkResponse {
  bookmark: BookmarkedPaper;
  status: string;
}

/**
 * Bookmarks list response
 */
export interface BookmarksListResponse {
  bookmarks: BookmarkedPaper[];
  total: number;
  status: string;
}

// ==================== Storage Keys ====================

const BOOKMARKS_STORAGE_KEY = 'careguide_bookmarks';

// ==================== Helper Functions ====================

/**
 * Convert PaperResult to BookmarkedPaper format
 */
function paperToBookmark(
  paper: PaperResult,
  userId: string,
  tags?: string[],
  notes?: string
): BookmarkedPaper {
  const timestamp = new Date().toISOString();
  return {
    id: `bookmark_${paper.pmid}_${Date.now()}`,
    pmid: paper.pmid,
    paperId: paper.pmid,
    userId,
    createdAt: timestamp,
    title: paper.title,
    authors: paper.authors || [],
    journal: paper.journal || '',
    pubDate: paper.pub_date || '',
    abstract: paper.abstract || '',
    url: paper.url || `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`,
    tags: tags || paper.keywords?.slice(0, 3) || [],
    notes: notes || '',
    bookmarkedAt: timestamp,
  };
}

/**
 * Load bookmarks from localStorage
 */
function loadBookmarksFromStorage(userId: string): BookmarkedPaper[] {
  try {
    const allBookmarks = storage.get<BookmarkedPaper[]>(BOOKMARKS_STORAGE_KEY as 'careguide_token') || [];
    return allBookmarks.filter((b) => b.userId === userId);
  } catch (error) {
    console.error('Error loading bookmarks from storage:', error);
    return [];
  }
}

/**
 * Save bookmarks to localStorage
 */
function saveBookmarksToStorage(userId: string, bookmarks: BookmarkedPaper[]): void {
  try {
    // Get all bookmarks from storage
    const allBookmarks = storage.get<BookmarkedPaper[]>(BOOKMARKS_STORAGE_KEY as 'careguide_token') || [];

    // Remove old bookmarks for this user
    const otherUsersBookmarks = allBookmarks.filter((b) => b.userId !== userId);

    // Combine with new bookmarks
    const updatedBookmarks = [...otherUsersBookmarks, ...bookmarks];

    // Save back to storage
    storage.set(BOOKMARKS_STORAGE_KEY as 'careguide_token', updatedBookmarks as unknown as string);
  } catch (error) {
    console.error('Error saving bookmarks to storage:', error);
    throw new Error('북마크 저장에 실패했습니다');
  }
}

// ==================== API Functions ====================

/**
 * Create a new bookmark
 * @param request - Bookmark creation request
 * @returns Promise with bookmark data
 */
export async function createBookmark(
  request: CreateBookmarkRequest
): Promise<BookmarkedPaper> {
  const bookmark = paperToBookmark(
    request.paper,
    request.userId,
    request.tags,
    request.notes
  );

  try {
    // Try to save to backend
    const response = await api.post<BookmarkResponse>('/api/bookmarks', {
      user_id: request.userId,
      paper_id: request.paper.pmid,
      title: request.paper.title,
      authors: request.paper.authors,
      journal: request.paper.journal,
      pub_date: request.paper.pub_date,
      abstract: request.paper.abstract,
      url: request.paper.url,
      tags: request.tags,
      notes: request.notes,
    });

    // Save to localStorage as backup
    const existingBookmarks = loadBookmarksFromStorage(request.userId);
    saveBookmarksToStorage(request.userId, [...existingBookmarks, response.data.bookmark]);

    return response.data.bookmark;
  } catch (error) {
    console.warn('Backend bookmark creation failed, using localStorage:', error);

    // Fallback to localStorage only
    const existingBookmarks = loadBookmarksFromStorage(request.userId);

    // Check if already bookmarked
    const alreadyBookmarked = existingBookmarks.some(
      (b) => b.paperId === request.paper.pmid
    );

    if (alreadyBookmarked) {
      throw new Error('이미 북마크한 논문입니다');
    }

    saveBookmarksToStorage(request.userId, [...existingBookmarks, bookmark]);
    return bookmark;
  }
}

/**
 * Get all bookmarks for a user
 * @param userId - User ID
 * @returns Promise with bookmarks array
 */
export async function getBookmarks(userId: string): Promise<BookmarkedPaper[]> {
  try {
    // Try to get from backend
    const response = await api.get<BookmarksListResponse>(
      `/api/bookmarks?user_id=${userId}`
    );

    // Sync with localStorage
    saveBookmarksToStorage(userId, response.data.bookmarks);

    return response.data.bookmarks;
  } catch (error) {
    console.warn('Backend bookmark fetch failed, using localStorage:', error);

    // Fallback to localStorage
    return loadBookmarksFromStorage(userId);
  }
}

/**
 * Check if a paper is bookmarked
 * @param userId - User ID
 * @param paperId - Paper PMID
 * @returns Promise with boolean
 */
export async function isBookmarked(userId: string, paperId: string): Promise<boolean> {
  const bookmarks = loadBookmarksFromStorage(userId);
  return bookmarks.some((b) => b.paperId === paperId);
}

/**
 * Update a bookmark
 * @param bookmarkId - Bookmark ID
 * @param userId - User ID
 * @param updates - Bookmark update data
 * @returns Promise with updated bookmark
 */
export async function updateBookmark(
  bookmarkId: string,
  userId: string,
  updates: UpdateBookmarkRequest
): Promise<BookmarkedPaper> {
  try {
    // Try to update on backend
    const response = await api.patch<BookmarkResponse>(
      `/api/bookmarks/${bookmarkId}`,
      updates
    );

    // Update localStorage
    const bookmarks = loadBookmarksFromStorage(userId);
    const updatedBookmarks = bookmarks.map((b) =>
      b.id === bookmarkId ? response.data.bookmark : b
    );
    saveBookmarksToStorage(userId, updatedBookmarks);

    return response.data.bookmark;
  } catch (error) {
    console.warn('Backend bookmark update failed, using localStorage:', error);

    // Fallback to localStorage
    const bookmarks = loadBookmarksFromStorage(userId);
    const bookmarkIndex = bookmarks.findIndex((b) => b.id === bookmarkId);

    if (bookmarkIndex === -1) {
      throw new Error('북마크를 찾을 수 없습니다');
    }

    const existingBookmark = bookmarks[bookmarkIndex]!;
    const updatedBookmark = {
      ...existingBookmark,
      ...updates,
    } as BookmarkedPaper;

    const updatedBookmarks = [...bookmarks];
    updatedBookmarks[bookmarkIndex] = updatedBookmark;

    saveBookmarksToStorage(userId, updatedBookmarks);
    return updatedBookmark;
  }
}

/**
 * Delete a bookmark
 * @param bookmarkId - Bookmark ID
 * @param userId - User ID
 * @returns Promise<void>
 */
export async function deleteBookmark(bookmarkId: string, userId: string): Promise<void> {
  try {
    // Try to delete from backend
    await api.delete(`/api/bookmarks/${bookmarkId}`);
  } catch (error) {
    console.warn('Backend bookmark deletion failed:', error);
  }

  // Always delete from localStorage
  const bookmarks = loadBookmarksFromStorage(userId);
  const updatedBookmarks = bookmarks.filter((b) => b.id !== bookmarkId);
  saveBookmarksToStorage(userId, updatedBookmarks);
}

/**
 * Delete bookmark by paper ID
 * @param paperId - Paper PMID
 * @param userId - User ID
 * @returns Promise<void>
 */
export async function deleteBookmarkByPaperId(
  paperId: string,
  userId: string
): Promise<void> {
  const bookmarks = loadBookmarksFromStorage(userId);
  const bookmark = bookmarks.find((b) => b.paperId === paperId);

  if (bookmark) {
    await deleteBookmark(bookmark.id, userId);
  }
}
