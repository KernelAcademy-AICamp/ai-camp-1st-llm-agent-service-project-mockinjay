/**
 * ClinicalTrialCard Component Tests
 *
 * Comprehensive test suite for the ClinicalTrialCard component
 * covering functionality, accessibility, and edge cases.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClinicalTrialCard, { ClinicalTrial } from '../ClinicalTrialCard';

// ==================== Test Data ====================

const mockTrial: ClinicalTrial = {
  nctId: 'NCT12345678',
  title: 'A Phase 3 Study of Novel Treatment for Chronic Kidney Disease',
  status: 'Recruiting',
  phase: 'Phase 3',
  conditions: ['Chronic Kidney Disease', 'Diabetes Mellitus Type 2', 'Hypertension'],
  interventions: [
    'Drug: Experimental Compound A',
    'Drug: Placebo',
    'Behavioral: Lifestyle Modification',
  ],
  startDate: '2024-01-15',
  completionDate: '2026-12-31',
  sponsor: 'University Medical Center',
  briefSummary:
    'This study evaluates the efficacy and safety of an experimental treatment for chronic kidney disease in patients with diabetes.',
};

const minimalTrial: ClinicalTrial = {
  nctId: 'NCT87654321',
  title: 'Minimal Trial Information',
  status: 'Active',
  phase: '',
  conditions: [],
  interventions: [],
};

// ==================== Tests ====================

describe('ClinicalTrialCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  // ==================== Rendering Tests ====================

  describe('Rendering', () => {
    it('renders the card with all trial information', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      // Check NCT ID
      expect(screen.getByText('NCT12345678')).toBeInTheDocument();

      // Check title
      expect(
        screen.getByText('A Phase 3 Study of Novel Treatment for Chronic Kidney Disease')
      ).toBeInTheDocument();

      // Check status badge
      expect(screen.getByText('Recruiting')).toBeInTheDocument();

      // Check phase
      expect(screen.getByText('Phase 3')).toBeInTheDocument();

      // Check sponsor
      expect(screen.getByText('University Medical Center')).toBeInTheDocument();

      // Check brief summary
      expect(
        screen.getByText(/This study evaluates the efficacy and safety/)
      ).toBeInTheDocument();
    });

    it('renders conditions correctly', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      // Should show first 3 conditions
      expect(screen.getByText('Chronic Kidney Disease')).toBeInTheDocument();
      expect(screen.getByText('Diabetes Mellitus Type 2')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    it('renders interventions correctly', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      // Should show first 3 interventions
      expect(screen.getByText('Drug: Experimental Compound A')).toBeInTheDocument();
      expect(screen.getByText('Drug: Placebo')).toBeInTheDocument();
      expect(screen.getByText('Behavioral: Lifestyle Modification')).toBeInTheDocument();
    });

    it('renders minimal trial information correctly', () => {
      render(<ClinicalTrialCard trial={minimalTrial} onClick={mockOnClick} />);

      expect(screen.getByText('NCT87654321')).toBeInTheDocument();
      expect(screen.getByText('Minimal Trial Information')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Should not render conditions/interventions sections if empty
      expect(screen.queryByText('Conditions')).not.toBeInTheDocument();
      expect(screen.queryByText('Interventions')).not.toBeInTheDocument();
    });

    it('handles missing optional fields gracefully', () => {
      const trialWithoutOptionalFields: ClinicalTrial = {
        ...minimalTrial,
        briefSummary: undefined,
        sponsor: undefined,
        startDate: undefined,
        completionDate: undefined,
      };

      render(<ClinicalTrialCard trial={trialWithoutOptionalFields} onClick={mockOnClick} />);

      // Should render without errors
      expect(screen.getByText('NCT87654321')).toBeInTheDocument();
    });
  });

  // ==================== Status Badge Tests ====================

  describe('Status Badge', () => {
    it('renders Recruiting status with green color', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const statusBadge = screen.getByText('Recruiting');
      expect(statusBadge).toHaveStyle({
        backgroundColor: '#ECFDF5',
        color: '#10B981',
      });
    });

    it('renders Completed status with blue color', () => {
      const completedTrial = { ...mockTrial, status: 'Completed' };
      render(<ClinicalTrialCard trial={completedTrial} onClick={mockOnClick} />);

      const statusBadge = screen.getByText('Completed');
      expect(statusBadge).toHaveStyle({
        backgroundColor: '#EFF6FF',
        color: '#3B82F6',
      });
    });

    it('renders Active status with purple color', () => {
      const activeTrial = { ...mockTrial, status: 'Active' };
      render(<ClinicalTrialCard trial={activeTrial} onClick={mockOnClick} />);

      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toHaveStyle({
        backgroundColor: '#F3E8FF',
        color: '#8B5CF6',
      });
    });

    it('renders unknown status with default gray color', () => {
      const unknownTrial = { ...mockTrial, status: 'Unknown Status' };
      render(<ClinicalTrialCard trial={unknownTrial} onClick={mockOnClick} />);

      const statusBadge = screen.getByText('Unknown Status');
      expect(statusBadge).toHaveStyle({
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
      });
    });
  });

  // ==================== Tag Rendering Tests ====================

  describe('Tag Rendering', () => {
    it('shows +N indicator when there are more than 3 conditions', () => {
      const trialWithManyConditions = {
        ...mockTrial,
        conditions: ['Condition 1', 'Condition 2', 'Condition 3', 'Condition 4', 'Condition 5'],
      };

      render(<ClinicalTrialCard trial={trialWithManyConditions} onClick={mockOnClick} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('shows +N indicator when there are more than 3 interventions', () => {
      const trialWithManyInterventions = {
        ...mockTrial,
        interventions: [
          'Intervention 1',
          'Intervention 2',
          'Intervention 3',
          'Intervention 4',
        ],
      };

      render(<ClinicalTrialCard trial={trialWithManyInterventions} onClick={mockOnClick} />);

      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('truncates long condition names', () => {
      const trialWithLongCondition = {
        ...mockTrial,
        conditions: ['A very long condition name that should be truncated to fit properly'],
      };

      render(<ClinicalTrialCard trial={trialWithLongCondition} onClick={mockOnClick} />);

      const conditionTag = screen.getByText(/A very long condition name/);
      expect(conditionTag.textContent?.length).toBeLessThanOrEqual(33); // 30 chars + '...'
    });
  });

  // ==================== Date Formatting Tests ====================

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      // Check if dates are rendered (format may vary by locale)
      expect(screen.getByText(/Start:/)).toBeInTheDocument();
      expect(screen.getByText(/End:/)).toBeInTheDocument();
    });

    it('handles missing start date', () => {
      const trialWithoutStartDate = { ...mockTrial, startDate: undefined };
      render(<ClinicalTrialCard trial={trialWithoutStartDate} onClick={mockOnClick} />);

      expect(screen.queryByText(/Start:/)).not.toBeInTheDocument();
      expect(screen.getByText(/End:/)).toBeInTheDocument();
    });

    it('handles missing completion date', () => {
      const trialWithoutCompletionDate = { ...mockTrial, completionDate: undefined };
      render(<ClinicalTrialCard trial={trialWithoutCompletionDate} onClick={mockOnClick} />);

      expect(screen.getByText(/Start:/)).toBeInTheDocument();
      expect(screen.queryByText(/End:/)).not.toBeInTheDocument();
    });
  });

  // ==================== Interaction Tests ====================

  describe('Interactions', () => {
    it('calls onClick when card is clicked', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Clinical trial NCT12345678/ });
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Clinical trial NCT12345678/ });
      fireEvent.keyPress(card, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Clinical trial NCT12345678/ });
      fireEvent.keyPress(card, { key: ' ', code: 'Space', charCode: 32 });

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick for other keys', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Clinical trial NCT12345678/ });
      fireEvent.keyPress(card, { key: 'a', code: 'KeyA' });

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('has correct role and tabIndex', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('has descriptive aria-label', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Clinical trial NCT12345678')
      );
    });

    it('has proper aria-labels for status and phase', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      expect(screen.getByLabelText(/Status: Recruiting/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phase: Phase 3/)).toBeInTheDocument();
    });

    it('has proper aria-labels for NCT ID', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      expect(screen.getByLabelText(/NCT ID: NCT12345678/)).toBeInTheDocument();
    });

    it('has proper region labels for conditions and interventions', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      expect(screen.getByRole('region', { name: 'Conditions' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Interventions' })).toBeInTheDocument();
    });

    it('has title attributes for truncated text', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const titleElement = screen.getByText(
        'A Phase 3 Study of Novel Treatment for Chronic Kidney Disease'
      );
      expect(titleElement).toHaveAttribute(
        'title',
        'A Phase 3 Study of Novel Treatment for Chronic Kidney Disease'
      );
    });
  });

  // ==================== Styling Tests ====================

  describe('Styling', () => {
    it('has correct border radius', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      expect(card).toHaveClass('rounded-[16px]');
    });

    it('has hover and focus classes', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      expect(card).toHaveClass('hover:shadow-lg', 'hover:border-[#00C9B7]');
      expect(card).toHaveClass('focus:ring-2', 'focus:ring-[#00C9B7]');
    });

    it('applies correct box shadow', () => {
      render(<ClinicalTrialCard trial={mockTrial} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      expect(card).toHaveStyle({
        boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)',
      });
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('handles empty string values', () => {
      const trialWithEmptyStrings: ClinicalTrial = {
        nctId: 'NCT00000000',
        title: '',
        status: '',
        phase: '',
        conditions: [],
        interventions: [],
      };

      render(<ClinicalTrialCard trial={trialWithEmptyStrings} onClick={mockOnClick} />);

      expect(screen.getByText('NCT00000000')).toBeInTheDocument();
    });

    it('handles very long titles', () => {
      const trialWithLongTitle = {
        ...mockTrial,
        title:
          'A Very Long Clinical Trial Title That Should Be Truncated Using Line Clamp To Prevent Overflow And Maintain Clean Layout Design Across Different Screen Sizes',
      };

      render(<ClinicalTrialCard trial={trialWithLongTitle} onClick={mockOnClick} />);

      const titleElement = screen.getByText(/A Very Long Clinical Trial Title/);
      expect(titleElement).toHaveClass('line-clamp-2');
    });

    it('handles invalid date formats gracefully', () => {
      const trialWithInvalidDate = {
        ...mockTrial,
        startDate: 'invalid-date',
        completionDate: 'another-invalid-date',
      };

      render(<ClinicalTrialCard trial={trialWithInvalidDate} onClick={mockOnClick} />);

      // Should render the invalid date as-is rather than crashing
      expect(screen.getByText(/Start:/)).toBeInTheDocument();
    });
  });
});
