/**
 * DailyProgress Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DailyProgress } from '../DailyProgress';

describe('DailyProgress', () => {
  const mockCurrent = {
    calories: 1500,
    protein: 40,
    sodium: 1200,
    potassium: 1800,
    phosphorus: 600,
  };

  const mockTarget = {
    calories: 2000,
    protein: 50,
    sodium: 1500,
    potassium: 2500,
    phosphorus: 800,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all nutrient progress indicators', () => {
    render(<DailyProgress current={mockCurrent} target={mockTarget} />);

    expect(screen.getByLabelText(/calories progress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/protein progress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sodium progress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potassium progress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phosphorus progress/i)).toBeInTheDocument();
  });

  it('displays Korean labels when language is ko', () => {
    render(<DailyProgress current={mockCurrent} target={mockTarget} language="ko" />);

    expect(screen.getByText('칼로리')).toBeInTheDocument();
    expect(screen.getByText('단백질')).toBeInTheDocument();
    expect(screen.getByText('나트륨')).toBeInTheDocument();
    expect(screen.getByText('칼륨')).toBeInTheDocument();
    expect(screen.getByText('인')).toBeInTheDocument();
  });

  it('calculates correct percentages', () => {
    render(<DailyProgress current={mockCurrent} target={mockTarget} />);

    // Calories: 1500/2000 = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
    // Protein: 40/50 = 80%
    expect(screen.getByText('80%')).toBeInTheDocument();
    // Sodium: 1200/1500 = 80%
    // Potassium: 1800/2500 = 72%
    expect(screen.getByText('72%')).toBeInTheDocument();
    // Phosphorus: 600/800 = 75%
  });

  it('displays current and target values with units', () => {
    render(<DailyProgress current={mockCurrent} target={mockTarget} />);

    expect(screen.getByText(/1500.*2000.*kcal/)).toBeInTheDocument();
    expect(screen.getByText(/40.*50.*g/)).toBeInTheDocument();
    expect(screen.getByText(/1200.*1500.*mg/)).toBeInTheDocument();
  });

  it('shows correct status colors for different percentages', () => {
    const overLimit = {
      calories: 2500, // 125% - danger
      protein: 45,    // 90% - warning
      sodium: 1000,   // 67% - good
      potassium: 2000,
      phosphorus: 700,
    };

    render(<DailyProgress current={overLimit} target={mockTarget} />);

    // Should have status indicators
    const statusBars = screen.getAllByRole('button');
    expect(statusBars.length).toBeGreaterThan(0);
  });

  it('displays summary statistics', () => {
    render(<DailyProgress current={mockCurrent} target={mockTarget} />);

    // All nutrients are between 60-80%, so should be "On Track"
    expect(screen.getByText(/on track/i)).toBeInTheDocument();
  });

  it('calls onNutrientClick when a nutrient is clicked', async () => {
    const user = userEvent.setup();
    const onNutrientClick = vi.fn();

    render(
      <DailyProgress
        current={mockCurrent}
        target={mockTarget}
        onNutrientClick={onNutrientClick}
      />
    );

    const caloriesButton = screen.getByLabelText(/calories progress/i);
    await user.click(caloriesButton);

    expect(onNutrientClick).toHaveBeenCalledWith('calories');
  });

  it('handles zero target gracefully', () => {
    const zeroTarget = {
      calories: 0,
      protein: 0,
      sodium: 0,
      potassium: 0,
      phosphorus: 0,
    };

    render(<DailyProgress current={mockCurrent} target={zeroTarget} />);

    // Should show 0% when target is 0
    const percentages = screen.getAllByText('0%');
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('handles missing current values', () => {
    const partialCurrent = {
      calories: 1500,
      protein: 40,
    };

    render(<DailyProgress current={partialCurrent} target={mockTarget} />);

    // Should render without errors
    expect(screen.getByLabelText(/calories progress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/protein progress/i)).toBeInTheDocument();
  });

  it('displays circular progress rings', () => {
    render(<DailyProgress current={mockCurrent} target={mockTarget} />);

    // Check for SVG elements (circular progress)
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows linear progress bars on mobile view', () => {
    render(<DailyProgress current={mockCurrent} target={mockTarget} />);

    // Linear progress bars should exist (hidden on desktop, visible on mobile)
    const progressBars = document.querySelectorAll('[data-slot="progress"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('categorizes nutrients into status groups correctly', () => {
    const mixedProgress = {
      calories: 1500,  // 75% - good
      protein: 48,     // 96% - warning
      sodium: 1600,    // 107% - danger
      potassium: 2000, // 80% - warning
      phosphorus: 600, // 75% - good
    };

    render(<DailyProgress current={mixedProgress} target={mockTarget} />);

    // Should show counts for each status
    expect(screen.getByText(/on track/i)).toBeInTheDocument();
    expect(screen.getByText(/warning/i)).toBeInTheDocument();
    expect(screen.getByText(/over limit/i)).toBeInTheDocument();
  });

  it('animates progress changes', () => {
    const { rerender } = render(
      <DailyProgress current={mockCurrent} target={mockTarget} />
    );

    const updatedCurrent = {
      ...mockCurrent,
      calories: 1800,
    };

    rerender(<DailyProgress current={updatedCurrent} target={mockTarget} />);

    // New percentage should be displayed
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('is accessible with keyboard navigation', async () => {
    const user = userEvent.setup();
    const onNutrientClick = vi.fn();

    render(
      <DailyProgress
        current={mockCurrent}
        target={mockTarget}
        onNutrientClick={onNutrientClick}
      />
    );

    const caloriesButton = screen.getByLabelText(/calories progress/i);
    caloriesButton.focus();
    expect(caloriesButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onNutrientClick).toHaveBeenCalledWith('calories');
  });
});
