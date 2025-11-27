/**
 * FoodImageAnalyzer Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodImageAnalyzer } from '../FoodImageAnalyzer';

describe('FoodImageAnalyzer', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders upload area initially', () => {
    render(<FoodImageAnalyzer />);

    expect(screen.getByText(/click to upload or drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, GIF, WEBP/i)).toBeInTheDocument();
  });

  it('displays Korean text when language is ko', () => {
    render(<FoodImageAnalyzer language="ko" />);

    expect(screen.getByText(/음식 사진 분석/)).toBeInTheDocument();
    expect(screen.getByText(/클릭하여 업로드 또는 드래그 앤 드롭/)).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const user = userEvent.setup();
    render(<FoodImageAnalyzer />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/click to upload or drag and drop/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText(/food preview/i)).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    render(<FoodImageAnalyzer maxFileSize={1024} />);

    const largeFile = new File(['x'.repeat(2000)], 'large.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/click to upload or drag and drop/i) as HTMLInputElement;

    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/file size cannot exceed/i)).toBeInTheDocument();
    });
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    render(<FoodImageAnalyzer />);

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/click to upload or drag and drop/i) as HTMLInputElement;

    await user.upload(input, invalidFile);

    await waitFor(() => {
      expect(screen.getByText(/unsupported file format/i)).toBeInTheDocument();
    });
  });

  it('clears image when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<FoodImageAnalyzer />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/click to upload or drag and drop/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText(/food preview/i)).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove image/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByAltText(/food preview/i)).not.toBeInTheDocument();
      expect(screen.getByText(/click to upload or drag and drop/i)).toBeInTheDocument();
    });
  });

  it('rotates image when rotate button is clicked', async () => {
    const user = userEvent.setup();
    render(<FoodImageAnalyzer />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/click to upload or drag and drop/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText(/food preview/i)).toBeInTheDocument();
    });

    const rotateButton = screen.getByRole('button', { name: /rotate/i });
    await user.click(rotateButton);

    const image = screen.getByAltText(/food preview/i);
    expect(image).toHaveStyle({ transform: 'rotate(90deg)' });
  });

  it('analyzes image when analyze button is clicked', async () => {
    const user = userEvent.setup();
    const onAnalysisComplete = vi.fn();
    render(<FoodImageAnalyzer onAnalysisComplete={onAnalysisComplete} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/click to upload or drag and drop/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText(/food preview/i)).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', { name: /analyze nutrition/i });
    await user.click(analyzeButton);

    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/analysis results/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(onAnalysisComplete).toHaveBeenCalled();
  });

  it('handles drag and drop', async () => {
    render(<FoodImageAnalyzer />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const dropzone = screen.getByLabelText(/click to upload or drag and drop/i);

    fireEvent.dragEnter(dropzone, {
      dataTransfer: { files: [file] }
    });

    fireEvent.dragOver(dropzone, {
      dataTransfer: { files: [file] }
    });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(screen.getByAltText(/food preview/i)).toBeInTheDocument();
    });
  });

  it('displays analysis results with warnings and recommendations', async () => {
    const user = userEvent.setup();
    render(<FoodImageAnalyzer language="en" />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/click to upload or drag and drop/i) as HTMLInputElement;

    await user.upload(input, file);

    const analyzeButton = screen.getByRole('button', { name: /analyze nutrition/i });
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/warnings/i)).toBeInTheDocument();
      expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('is accessible with keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<FoodImageAnalyzer />);

    const dropzone = screen.getByLabelText(/click to upload or drag and drop/i);

    dropzone.focus();
    expect(dropzone).toHaveFocus();

    await user.keyboard('{Enter}');
    // This would trigger file input click in a real browser
  });
});
