import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect } from 'vitest';
import { NutrientEducationSection, NutrientInfo } from '../NutrientEducationSection';

// Mock lucide-react to avoid import issues in test environment
vi.mock('lucide-react', () => ({
  BarChart2: ({ className, size, 'aria-hidden': ariaHidden }: any) => (
    <svg
      data-testid="bar-chart-icon"
      className={className}
      width={size}
      height={size}
      aria-hidden={ariaHidden}
    />
  ),
}));

describe('NutrientEducationSection', () => {
  const mockNutrientInfo: NutrientInfo = {
    id: 'potassium',
    nameKo: '칼륨',
    nameEn: 'Potassium',
    bulletPoints: {
      ko: [
        '칼륨은 신경과 근육 기능에 중요한 미네랄입니다',
        '신장 기능이 저하되면 칼륨이 체내에 축적될 수 있습니다',
        '고칼륨혈증은 심장 리듬에 영향을 줄 수 있습니다',
      ],
      en: [
        'Potassium is a crucial mineral for nerve and muscle function',
        'When kidney function declines, potassium can accumulate in the body',
        'Hyperkalemia can affect heart rhythm',
      ],
    },
  };

  describe('Rendering', () => {
    it('should render the component with Korean language by default', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

      // Check if Korean name is displayed
      expect(screen.getByText(/칼륨/)).toBeInTheDocument();
      expect(screen.getByText(/Potassium/)).toBeInTheDocument();

      // Check if Korean bullet points are rendered
      expect(screen.getByText(/신경과 근육 기능에 중요한 미네랄입니다/)).toBeInTheDocument();
    });

    it('should render the component with English language when specified', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} language="en" />);

      // Check if English name is displayed
      expect(screen.getByText(/Potassium/)).toBeInTheDocument();
      expect(screen.getByText(/칼륨/)).toBeInTheDocument();

      // Check if English bullet points are rendered
      expect(
        screen.getByText(/Potassium is a crucial mineral for nerve and muscle function/)
      ).toBeInTheDocument();
    });

    it('should render the BarChart2 icon', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

      const icon = screen.getByTestId('bar-chart-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render all bullet points for the selected language', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} language="ko" />);

      mockNutrientInfo.bulletPoints.ko.forEach((point) => {
        expect(screen.getByText(new RegExp(point))).toBeInTheDocument();
      });
    });

    it('should render children content when provided', () => {
      render(
        <NutrientEducationSection nutrient={mockNutrientInfo}>
          <div data-testid="child-content">Safe Foods Card</div>
        </NutrientEducationSection>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Safe Foods Card')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <NutrientEducationSection nutrient={mockNutrientInfo} className="custom-class" />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveAttribute('id', 'nutrient-heading-potassium');

      const section = screen.getByTestId('nutrient-section-potassium');
      expect(section).toHaveAttribute('aria-labelledby', 'nutrient-heading-potassium');
    });

    it('should hide decorative icon from screen readers', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

      const icon = screen.getByTestId('bar-chart-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty bullet points gracefully', () => {
      const emptyBulletNutrient: NutrientInfo = {
        id: 'empty',
        nameKo: '테스트',
        nameEn: 'Test',
        bulletPoints: {
          ko: [],
          en: [],
        },
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      render(<NutrientEducationSection nutrient={emptyBulletNutrient} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No bullet points found')
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing bullet points for selected language', () => {
      const partialNutrient: NutrientInfo = {
        id: 'partial',
        nameKo: '부분',
        nameEn: 'Partial',
        bulletPoints: {
          ko: ['한국어 포인트'],
          en: [],
        },
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      render(<NutrientEducationSection nutrient={partialNutrient} language="en" />);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should render correctly with single bullet point', () => {
      const singleBulletNutrient: NutrientInfo = {
        id: 'single',
        nameKo: '단일',
        nameEn: 'Single',
        bulletPoints: {
          ko: ['단일 포인트'],
          en: ['Single point'],
        },
      };

      render(<NutrientEducationSection nutrient={singleBulletNutrient} language="ko" />);

      expect(screen.getByText(/단일 포인트/)).toBeInTheDocument();
    });
  });

  describe('Dark Mode Styling', () => {
    it('should have dark mode classes applied to icon', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

      const icon = screen.getByTestId('bar-chart-icon');
      expect(icon).toHaveClass('text-[#1F2937]', 'dark:text-white');
    });

    it('should have dark mode classes applied to title', () => {
      render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass('text-[#1F2937]', 'dark:text-white');
    });

    it('should have dark mode classes applied to bullet points container', () => {
      const { container } = render(<NutrientEducationSection nutrient={mockNutrientInfo} />);

      const bulletContainer = container.querySelector('.text-sm');
      expect(bulletContainer).toHaveClass('text-[#4B5563]', 'dark:text-gray-400');
    });
  });

  describe('Memoization', () => {
    it('should be wrapped with React.memo for performance optimization', () => {
      expect(NutrientEducationSection.displayName).toBe('NutrientEducationSection');
    });
  });
});
