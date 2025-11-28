/**
 * ClinicalTrialsTab Component Tests
 *
 * Comprehensive test suite for the ClinicalTrialsTab component covering:
 * - Initial loading state
 * - Successful data fetching and rendering
 * - Pagination functionality
 * - Error handling
 * - Empty state
 * - Accessibility features
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinicalTrialsTab from '../ClinicalTrialsTab';
import { ClinicalTrial } from '../../../types/trends';

// ==================== Mock Data ====================

const mockTrials: ClinicalTrial[] = [
  {
    nctId: 'NCT12345678',
    title: 'Study of Treatment for Chronic Kidney Disease',
    status: 'Recruiting',
    phase: 'Phase 3',
    conditions: ['Chronic Kidney Disease', 'Diabetes Mellitus'],
    interventions: ['Drug: Experimental Treatment', 'Drug: Placebo'],
    startDate: '2024-01-15',
    completionDate: '2026-12-31',
    sponsor: 'University Medical Center',
    briefSummary: 'This study evaluates the efficacy of an experimental treatment for CKD patients.',
  },
  {
    nctId: 'NCT87654321',
    title: 'Phase 2 Study of Novel Therapy for Renal Impairment',
    status: 'Active, not recruiting',
    phase: 'Phase 2',
    conditions: ['Renal Insufficiency', 'Hypertension'],
    interventions: ['Drug: Novel Therapy'],
    startDate: '2023-06-01',
    completionDate: '2025-06-30',
    sponsor: 'Research Institute',
    briefSummary: 'Investigating novel therapy for patients with renal impairment.',
  },
];

const mockResponse = {
  trials: mockTrials,
  totalPages: 3,
  currentPage: 1,
  totalTrials: 30,
};

// ==================== Test Setup ====================

// Mock fetch globally
global.fetch = jest.fn();

// Helper to mock successful API response
const mockFetchSuccess = (data = mockResponse) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
};

// Helper to mock API error
const mockFetchError = (statusText = 'Internal Server Error') => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    statusText,
  });
};

// Helper to mock network failure
const mockFetchNetworkError = () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// ==================== Test Suites ====================

describe('ClinicalTrialsTab', () => {
  describe('Initial Render and Loading State', () => {
    it('should display loading state on initial render', () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      expect(screen.getByText('임상시험 정보를 불러오는 중...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display section header and info banner', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      expect(screen.getByText('임상시험')).toBeInTheDocument();
      expect(
        screen.getByText(/신장 질환 관련 임상시험 정보를 ClinicalTrials.gov에서 제공받고 있습니다/)
      ).toBeInTheDocument();
    });

    it('should have proper ARIA labels for accessibility', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: 'Clinical trials information' })).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch and display clinical trials on mount', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
        expect(screen.getByText('NCT87654321')).toBeInTheDocument();
      });
    });

    it('should call API with correct parameters', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/clinical-trials/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            condition: 'kidney',
            page: 1,
            page_size: 10,
          }),
        });
      });
    });

    it('should render correct number of clinical trial cards', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        const list = screen.getByRole('list', { name: 'Clinical trials list' });
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);
      });
    });

    it('should display trial information correctly', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('Study of Treatment for Chronic Kidney Disease')).toBeInTheDocument();
        expect(screen.getByText('Recruiting')).toBeInTheDocument();
        expect(screen.getByText('Phase 3')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls when totalPages > 1', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: 'Previous page' });
        expect(prevButton).toBeDisabled();
        expect(prevButton).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should enable next button when not on last page', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: 'Next page' });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('should render correct page numbers for totalPages <= 5', async () => {
      mockFetchSuccess({ ...mockResponse, totalPages: 3 });
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
      });
    });

    it('should render first 5 pages when on page 1 of many', async () => {
      mockFetchSuccess({ ...mockResponse, totalPages: 10 });
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Page 6' })).not.toBeInTheDocument();
      });
    });

    it('should fetch next page when next button clicked', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });

      mockFetchSuccess({ ...mockResponse, currentPage: 2 });
      const nextButton = screen.getByRole('button', { name: 'Next page' });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith(
          '/api/clinical-trials/list',
          expect.objectContaining({
            body: JSON.stringify({
              condition: 'kidney',
              page: 2,
              page_size: 10,
            }),
          })
        );
      });
    });

    it('should fetch specific page when page number clicked', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });

      mockFetchSuccess({ ...mockResponse, currentPage: 3 });
      const page3Button = screen.getByRole('button', { name: 'Page 3' });
      fireEvent.click(page3Button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
          '/api/clinical-trials/list',
          expect.objectContaining({
            body: JSON.stringify({
              condition: 'kidney',
              page: 3,
              page_size: 10,
            }),
          })
        );
      });
    });

    it('should mark current page with aria-current', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        const currentPageButton = screen.getByRole('button', { name: 'Page 1' });
        expect(currentPageButton).toHaveAttribute('aria-current', 'page');
      });
    });
  });

  describe('Trial Click Handler', () => {
    it('should call onTrialClick when a trial card is clicked', async () => {
      const mockOnTrialClick = jest.fn();
      mockFetchSuccess();
      render(<ClinicalTrialsTab onTrialClick={mockOnTrialClick} />);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });

      const trialCard = screen.getByRole('button', {
        name: /Clinical trial NCT12345678/i,
      });
      fireEvent.click(trialCard);

      expect(mockOnTrialClick).toHaveBeenCalledWith('NCT12345678');
    });

    it('should not throw error when onTrialClick is not provided', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });

      const trialCard = screen.getByRole('button', {
        name: /Clinical trial NCT12345678/i,
      });

      expect(() => fireEvent.click(trialCard)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      mockFetchError();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(
          screen.getByText('임상시험 정보를 불러오는 중 오류가 발생했습니다.')
        ).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      mockFetchError();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      });
    });

    it('should retry API call when retry button clicked', async () => {
      mockFetchError();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      });

      mockFetchSuccess();
      const retryButton = screen.getByRole('button', { name: '다시 시도' });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetchNetworkError();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(
          screen.getByText('임상시험 정보를 불러오는 중 오류가 발생했습니다.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no trials are returned', async () => {
      mockFetchSuccess({ trials: [], totalPages: 0, currentPage: 1, totalTrials: 0 });
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('임상시험 정보를 찾을 수 없습니다.')).toBeInTheDocument();
      });
    });

    it('should not render pagination in empty state', async () => {
      mockFetchSuccess({ trials: [], totalPages: 0, currentPage: 1, totalTrials: 0 });
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('임상시험 정보를 찾을 수 없습니다.')).toBeInTheDocument();
      });

      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-fetch data when props change but page remains the same', async () => {
      mockFetchSuccess();
      const { rerender } = render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });

      const mockOnTrialClick = jest.fn();
      rerender(<ClinicalTrialsTab onTrialClick={mockOnTrialClick} />);

      // Should still only have called fetch once (on mount)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should scroll to top when changing pages', async () => {
      const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation();
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });

      mockFetchSuccess({ ...mockResponse, currentPage: 2 });
      const nextButton = screen.getByRole('button', { name: 'Next page' });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });

      scrollToSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for screen readers', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: 'Clinical trials information' })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: 'Clinical trials list' })).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
      });
    });

    it('should have live regions for dynamic content', async () => {
      mockFetchSuccess();
      render(<ClinicalTrialsTab />);

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');

      await waitFor(() => {
        expect(screen.getByText('NCT12345678')).toBeInTheDocument();
      });
    });

    it('should announce errors assertively', async () => {
      mockFetchError();
      render(<ClinicalTrialsTab />);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });
});
