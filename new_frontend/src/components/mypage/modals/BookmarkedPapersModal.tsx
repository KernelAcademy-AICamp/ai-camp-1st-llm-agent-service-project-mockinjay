/**
 * BookmarkedPapersModal Component
 * 북마크한 논문 목록 모달
 */
import React, { useEffect, useRef } from 'react';
import { X, Bookmark, Clock } from 'lucide-react';

interface BookmarkedPaper {
  id: string;
  title: string;
  authors: string;
  journal?: string;
  year?: string;
  bookmarkedAt: string;
}

interface BookmarkedPapersModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: BookmarkedPaper[];
  onRemoveBookmark: (paperId: string) => void;
}

export const BookmarkedPapersModal: React.FC<BookmarkedPapersModalProps> = ({
  isOpen,
  onClose,
  papers,
  onRemoveBookmark,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      closeButtonRef.current?.focus();
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 포커스 트랩
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab as EventListener);
    return () => modal.removeEventListener('keydown', handleTab as EventListener);
  }, [isOpen]);

  const handleRemove = (paperId: string) => {
    if (window.confirm('북마크를 삭제하시겠습니까?')) {
      onRemoveBookmark(paperId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmarked-papers-title"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark size={24} className="text-[var(--color-primary)]" />
              <h2 id="bookmarked-papers-title" className="text-xl font-bold text-gray-900">
                북마크한 논문 ({papers.length})
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="모달 닫기"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {papers.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-center"
                role="status"
                aria-live="polite"
              >
                <Bookmark size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">북마크한 논문이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {paper.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="truncate">{paper.authors}</p>
                          <p className="text-xs">
                            {paper.journal} • {paper.year}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={14} />
                          <span>
                            {new Date(paper.bookmarkedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(paper.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`${paper.title} 북마크 삭제`}
                      >
                        <Bookmark size={20} className="fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4">
            <button onClick={onClose} className="btn-ghost w-full">
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
