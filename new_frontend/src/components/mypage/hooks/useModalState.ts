/**
 * useModalState Hook
 * 마이페이지 모달 상태 통합 관리
 */
import { useState, useCallback } from 'react';

/**
 * Modal Types
 * 사용 가능한 모달 타입
 */
export type ModalType = 'profile' | 'health' | 'settings' | 'bookmarks' | 'posts';

/**
 * Modal State Interface
 * 모달 상태 인터페이스
 */
interface ModalState {
  profile: boolean;
  health: boolean;
  settings: boolean;
  bookmarks: boolean;
  posts: boolean;
}

/**
 * useModalState Return Type
 */
interface UseModalStateReturn {
  /** Check if a specific modal is open */
  isOpen: (modal: ModalType) => boolean;
  /** Open a specific modal */
  open: (modal: ModalType) => void;
  /** Close all modals */
  close: () => void;
  /** Toggle a specific modal */
  toggle: (modal: ModalType) => void;
  /** Current modal state (for debugging) */
  state: ModalState;
}

/**
 * useModalState Hook
 *
 * 5개의 마이페이지 모달 상태를 통합 관리합니다.
 *
 * @returns Modal state management methods
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useModalState();
 *
 * // Open profile modal
 * open('profile');
 *
 * // Check if health modal is open
 * if (isOpen('health')) {
 *   // ...
 * }
 *
 * // Close all modals
 * close();
 *
 * // Toggle settings modal
 * toggle('settings');
 * ```
 */
export function useModalState(): UseModalStateReturn {
  const [modalState, setModalState] = useState<ModalState>({
    profile: false,
    health: false,
    settings: false,
    bookmarks: false,
    posts: false,
  });

  /**
   * Check if a specific modal is open
   */
  const isOpen = useCallback(
    (modal: ModalType): boolean => {
      return modalState[modal];
    },
    [modalState]
  );

  /**
   * Open a specific modal (closes all others)
   */
  const open = useCallback((modal: ModalType) => {
    setModalState({
      profile: false,
      health: false,
      settings: false,
      bookmarks: false,
      posts: false,
      [modal]: true,
    });
  }, []);

  /**
   * Close all modals
   */
  const close = useCallback(() => {
    setModalState({
      profile: false,
      health: false,
      settings: false,
      bookmarks: false,
      posts: false,
    });
  }, []);

  /**
   * Toggle a specific modal
   */
  const toggle = useCallback((modal: ModalType) => {
    setModalState((prev) => ({
      ...prev,
      [modal]: !prev[modal],
    }));
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    state: modalState,
  };
}
