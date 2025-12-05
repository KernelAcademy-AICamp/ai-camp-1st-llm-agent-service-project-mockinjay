/**
 * FoodImageAnalyzer Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FoodImageAnalyzer } from '../FoodImageAnalyzer';

// Mock hooks
vi.mock('../../../hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    selectedImage: null,
    imagePreview: null,
    error: null,
    handleImageSelect: vi.fn(),
    handleImageDrop: vi.fn(),
    clearImage: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useNutritionAnalysis', () => ({
  useNutritionAnalysis: () => ({
    analyzing: false,
    result: null,
    error: null,
    analyze: vi.fn(),
  }),
}));

describe('FoodImageAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area when no image selected', () => {
    render(<FoodImageAnalyzer language="ko" />);

    expect(screen.getByText(/클릭하여 업로드/i)).toBeInTheDocument();
    expect(screen.getByText(/음식 사진 분석/i)).toBeInTheDocument();
  });

  it('renders in English when language is en', () => {
    render(<FoodImageAnalyzer language="en" />);

    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Food Image Analysis/i)).toBeInTheDocument();
  });

  it('accepts file input', () => {
    render(<FoodImageAnalyzer language="ko" />);

    const input = screen.getByRole('presentation', { hidden: true });
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/*');
  });
});
