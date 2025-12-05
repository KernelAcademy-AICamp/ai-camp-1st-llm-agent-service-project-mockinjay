/**
 * useModalState Hook Tests
 * 모달 상태 관리 훅 테스트
 */
import { renderHook, act } from '@testing-library/react';
import { useModalState } from '../useModalState';

describe('useModalState', () => {
  it('should initialize with all modals closed', () => {
    const { result } = renderHook(() => useModalState());

    expect(result.current.isOpen('profile')).toBe(false);
    expect(result.current.isOpen('health')).toBe(false);
    expect(result.current.isOpen('settings')).toBe(false);
    expect(result.current.isOpen('bookmarks')).toBe(false);
    expect(result.current.isOpen('posts')).toBe(false);
  });

  it('should open a specific modal', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.open('profile');
    });

    expect(result.current.isOpen('profile')).toBe(true);
    expect(result.current.isOpen('health')).toBe(false);
  });

  it('should close all modals when opening a new one', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.open('profile');
    });

    expect(result.current.isOpen('profile')).toBe(true);

    act(() => {
      result.current.open('health');
    });

    expect(result.current.isOpen('profile')).toBe(false);
    expect(result.current.isOpen('health')).toBe(true);
  });

  it('should close all modals', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.open('settings');
    });

    expect(result.current.isOpen('settings')).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen('settings')).toBe(false);
  });

  it('should toggle a modal', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.toggle('bookmarks');
    });

    expect(result.current.isOpen('bookmarks')).toBe(true);

    act(() => {
      result.current.toggle('bookmarks');
    });

    expect(result.current.isOpen('bookmarks')).toBe(false);
  });

  it('should provide current state', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.open('posts');
    });

    expect(result.current.state).toEqual({
      profile: false,
      health: false,
      settings: false,
      bookmarks: false,
      posts: true,
    });
  });
});
