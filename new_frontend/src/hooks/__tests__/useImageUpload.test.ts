/**
 * useImageUpload Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from '../useImageUpload';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with null values', () => {
    const { result } = renderHook(() => useImageUpload('ko'));

    expect(result.current.selectedImage).toBeNull();
    expect(result.current.imagePreview).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isValidImage).toBe(false);
  });

  it('provides handler functions', () => {
    const { result } = renderHook(() => useImageUpload('ko'));

    expect(typeof result.current.handleImageSelect).toBe('function');
    expect(typeof result.current.handleImageDrop).toBe('function');
    expect(typeof result.current.clearImage).toBe('function');
    expect(typeof result.current.resetError).toBe('function');
  });

  it('clears image and preview', () => {
    const { result } = renderHook(() => useImageUpload('ko'));

    act(() => {
      result.current.clearImage();
    });

    expect(result.current.selectedImage).toBeNull();
    expect(result.current.imagePreview).toBeNull();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('resets error state', () => {
    const { result } = renderHook(() => useImageUpload('ko'));

    act(() => {
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });
});
