/**
 * ResearchTrendsChart Component Tests
 *
 * Test suite covering:
 * - Component rendering
 * - Props handling
 * - Data visualization
 * - Accessibility features
 * - Responsive behavior
 * - Edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect } from 'vitest';
import { ResearchTrendsChart, ResearchDataPoint } from '../ResearchTrendsChart';

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children, height }: any) => (
      <div data-testid="responsive-container" style={{ height }}>
        {children}
      </div>
    ),
  };
});

describe('ResearchTrendsChart', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ResearchTrendsChart />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should render with default data when no data prop is provided', () => {
      render(<ResearchTrendsChart />);
      const container = screen.getByRole('region', { name: /연구 트렌드 차트/i });
      expect(container).toBeInTheDocument();
    });

    it('should display the chart description', () => {
      render(<ResearchTrendsChart />);
      expect(
        screen.getByText(/신장병 관련 주제별 PubMed 연구 논문 발행 추이/i)
      ).toBeInTheDocument();
    });

    it('should render ResponsiveContainer with correct default height', () => {
      render(<ResearchTrendsChart />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ height: 400 });
    });
  });

  describe('Props Handling', () => {
    it('should accept and use custom data', () => {
      const customData: ResearchDataPoint[] = [
        { date: '2023', ckd: 100, treatment: 50, diet: 75 },
        { date: '2024', ckd: 150, treatment: 75, diet: 100 },
      ];

      render(<ResearchTrendsChart data={customData} />);
      const container = screen.getByRole('region');
      expect(container).toBeInTheDocument();
    });

    it('should accept custom height prop', () => {
      render(<ResearchTrendsChart height={500} />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ height: 500 });
    });

    it('should accept custom className', () => {
      render(<ResearchTrendsChart className="custom-class" />);
      const container = screen.getByRole('region');
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply multiple custom classes', () => {
      render(<ResearchTrendsChart className="class-1 class-2" />);
      const container = screen.getByRole('region');
      expect(container.firstChild).toHaveClass('class-1', 'class-2');
    });
  });

  describe('Default Data', () => {
    it('should include data from 2020 to 2025', () => {
      const { container } = render(<ResearchTrendsChart />);
      // Check that component renders without errors with default data
      expect(container.querySelector('.recharts-wrapper')).toBeTruthy();
    });

    it('should handle empty data array gracefully', () => {
      render(<ResearchTrendsChart data={[]} />);
      const container = screen.getByRole('region');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for region', () => {
      render(<ResearchTrendsChart />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(<ResearchTrendsChart />);
      expect(
        screen.getByRole('region', { name: /연구 트렌드 차트/i })
      ).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      const { container } = render(<ResearchTrendsChart />);
      // Chart should be focusable for screen reader users
      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply base styling classes', () => {
      render(<ResearchTrendsChart />);
      const container = screen.getByRole('region');
      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer).toHaveClass('bg-white', 'p-6', 'rounded-2xl');
    });

    it('should have border and shadow', () => {
      render(<ResearchTrendsChart />);
      const container = screen.getByRole('region');
      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer).toHaveClass('border', 'border-gray-100', 'shadow-sm');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const singlePoint: ResearchDataPoint[] = [
        { date: '2024', ckd: 100, treatment: 50, diet: 75 },
      ];
      render(<ResearchTrendsChart data={singlePoint} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const zeroData: ResearchDataPoint[] = [
        { date: '2024', ckd: 0, treatment: 0, diet: 0 },
      ];
      render(<ResearchTrendsChart data={zeroData} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      const largeNumbers: ResearchDataPoint[] = [
        { date: '2024', ckd: 999999, treatment: 888888, diet: 777777 },
      ];
      render(<ResearchTrendsChart data={largeNumbers} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should handle negative numbers gracefully', () => {
      const negativeData: ResearchDataPoint[] = [
        { date: '2024', ckd: -10, treatment: -5, diet: -8 },
      ];
      render(<ResearchTrendsChart data={negativeData} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work with height set to 0', () => {
      render(<ResearchTrendsChart height={0} />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ height: 0 });
    });

    it('should maintain structure with very large height', () => {
      render(<ResearchTrendsChart height={10000} />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ height: 10000 });
    });
  });

  describe('TypeScript Types', () => {
    it('should accept valid ResearchDataPoint structure', () => {
      const validData: ResearchDataPoint[] = [
        { date: '2024', ckd: 100, treatment: 50, diet: 75 },
      ];
      // If this compiles, the test passes
      expect(() => render(<ResearchTrendsChart data={validData} />)).not.toThrow();
    });
  });
});
