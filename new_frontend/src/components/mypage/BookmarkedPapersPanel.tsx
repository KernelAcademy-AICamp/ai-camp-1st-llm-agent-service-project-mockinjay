/**
 * BookmarkedPapersPanel Component
 * 북마크한 논문 패널
 */
import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, ExternalLink, Bookmark, Calendar, Users } from 'lucide-react';
import type { BookmarkedPaper } from '../../types/mypage';

interface BookmarkedPapersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onLoadBookmarks: (userId: string) => Promise<BookmarkedPaper[]>;
  onRemoveBookmark: (bookmarkId: string) => Promise<void>;
}

const BookmarkedPapersPanel: React.FC<BookmarkedPapersPanelProps> = ({
  isOpen,
  onClose,
  userId,
  onLoadBookmarks,
  onRemoveBookmark,
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookmarks when panel opens
  useEffect(() => {
    if (isOpen && userId) {
      loadBookmarks();
    }
  }, [isOpen, userId]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onLoadBookmarks(userId);
      setBookmarks(data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
      setError('북마크를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    if (!window.confirm('북마크를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await onRemoveBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
      alert('북마크 삭제 중 오류가 발생했습니다.');
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">북마크한 논문</h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Close panel"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary-600" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">북마크한 논문이 없습니다.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  트렌드 페이지에서 관심있는 논문을 북마크해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 pr-4">
                        {bookmark.title}
                      </h3>
                      <button
                        onClick={() => handleRemoveBookmark(bookmark.id)}
                        className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                        title="북마크 제거"
                      >
                        <Bookmark size={20} fill="currentColor" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {bookmark.authors.slice(0, 3).join(', ')}
                        {bookmark.authors.length > 3 && ` 외 ${bookmark.authors.length - 3}명`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {bookmark.pubDate}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {bookmark.abstract}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {bookmark.journal}
                      </span>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                      >
                        논문 보기 <ExternalLink size={14} />
                      </a>
                    </div>

                    {bookmark.tags && bookmark.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {bookmark.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {bookmark.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{bookmark.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookmarkedPapersPanel;
