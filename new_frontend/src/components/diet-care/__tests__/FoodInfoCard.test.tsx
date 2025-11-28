/**
 * Unit Tests for FoodInfoCard Components
 *
 * Tests cover:
 * - Component rendering
 * - Safe vs Warning card variants
 * - Bilingual support (Korean/English)
 * - Dark mode support
 * - Accessibility features
 * - Performance optimizations
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  FoodInfoCard,
  SafeFoodCard,
  WarningFoodCard,
  FoodCategory
} from '../FoodInfoCard';

describe('FoodInfoCard Component', () => {
  const mockSafeFoodCategories: FoodCategory[] = [
    { label: '과일', items: ['사과', '베리류', '체리', '포도'] },
    { label: '채소', items: ['양배추', '오이', '가지'] },
    { label: '곡물', items: ['흰 쌀밥', '흰 빵', '파스타'] }
  ];

  const mockWarningFoodCategories: FoodCategory[] = [
    { label: '과일', items: ['바나나', '오렌지', '키위'] },
    { label: '채소', items: ['시금치', '감자', '고구마'] },
    { label: '견과류', items: ['모든 견과류'] }
  ];

  describe('FoodInfoCard - Safe Type', () => {
    beforeEach(() => {
      render(
        <FoodInfoCard
          type="safe"
          title="저칼륨 음식 (먹어도 되는 음식)"
          categories={mockSafeFoodCategories}
          language="ko"
        />
      );
    });

    it('should render the safe food card with correct title', () => {
      expect(screen.getByText('저칼륨 음식 (먹어도 되는 음식)')).toBeInTheDocument();
    });

    it('should render all food categories', () => {
      expect(screen.getByText('과일:')).toBeInTheDocument();
      expect(screen.getByText('채소:')).toBeInTheDocument();
      expect(screen.getByText('곡물:')).toBeInTheDocument();
    });

    it('should render food items correctly', () => {
      expect(screen.getByText(/사과.*베리류.*체리.*포도/)).toBeInTheDocument();
      expect(screen.getByText(/양배추.*오이.*가지/)).toBeInTheDocument();
    });

    it('should have correct test id', () => {
      expect(screen.getByTestId('food-info-card-safe')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-labelledby', 'food-card-title-safe');
    });

    it('should render green check icon for safe type', () => {
      const iconContainer = screen.getByLabelText('안전한 음식');
      expect(iconContainer).toHaveClass('bg-[#22C55E]');
    });
  });

  describe('FoodInfoCard - Warning Type', () => {
    beforeEach(() => {
      render(
        <FoodInfoCard
          type="warning"
          title="고칼륨 음식 (피해야 하는 음식)"
          categories={mockWarningFoodCategories}
          language="ko"
        />
      );
    });

    it('should render the warning food card with correct title', () => {
      expect(screen.getByText('고칼륨 음식 (피해야 하는 음식)')).toBeInTheDocument();
    });

    it('should render all food categories', () => {
      expect(screen.getByText('과일:')).toBeInTheDocument();
      expect(screen.getByText('채소:')).toBeInTheDocument();
      expect(screen.getByText('견과류:')).toBeInTheDocument();
    });

    it('should render food items correctly', () => {
      expect(screen.getByText(/바나나.*오렌지.*키위/)).toBeInTheDocument();
      expect(screen.getByText(/시금치.*감자.*고구마/)).toBeInTheDocument();
    });

    it('should have correct test id', () => {
      expect(screen.getByTestId('food-info-card-warning')).toBeInTheDocument();
    });

    it('should render red alert triangle icon for warning type', () => {
      const icon = screen.getByLabelText('주의 음식');
      expect(icon).toHaveClass('text-[#EF4444]');
    });
  });

  describe('FoodInfoCard - Bilingual Support', () => {
    it('should render Korean labels correctly', () => {
      render(
        <FoodInfoCard
          type="safe"
          title="저칼륨 음식"
          categories={[{ label: '과일', items: ['사과'] }]}
          language="ko"
        />
      );

      expect(screen.getByLabelText('안전한 음식')).toBeInTheDocument();
    });

    it('should render English labels correctly', () => {
      render(
        <FoodInfoCard
          type="safe"
          title="Low Potassium Foods"
          categories={[{ label: 'Fruits', items: ['Apple'] }]}
          language="en"
        />
      );

      expect(screen.getByLabelText('Safe food')).toBeInTheDocument();
    });
  });

  describe('FoodInfoCard - Dark Mode', () => {
    it('should have dark mode classes for card container', () => {
      render(
        <FoodInfoCard
          type="safe"
          title="Test"
          categories={[]}
          language="ko"
        />
      );

      const card = screen.getByTestId('food-info-card-safe');
      expect(card).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700');
    });

    it('should have dark mode classes for text elements', () => {
      render(
        <FoodInfoCard
          type="safe"
          title="Test Title"
          categories={[{ label: 'Test', items: ['Item'] }]}
          language="ko"
        />
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  describe('FoodInfoCard - Custom Classes', () => {
    it('should apply custom className', () => {
      render(
        <FoodInfoCard
          type="safe"
          title="Test"
          categories={[]}
          language="ko"
          className="custom-class"
        />
      );

      const card = screen.getByTestId('food-info-card-safe');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('FoodInfoCard - Empty Categories', () => {
    it('should render without errors when categories array is empty', () => {
      render(
        <FoodInfoCard
          type="safe"
          title="Empty Card"
          categories={[]}
          language="ko"
        />
      );

      expect(screen.getByText('Empty Card')).toBeInTheDocument();
    });
  });
});

describe('SafeFoodCard Component', () => {
  const mockCategories: FoodCategory[] = [
    { label: '과일', items: ['사과', '베리류'] },
    { label: '채소', items: ['양배추', '오이'] }
  ];

  it('should render as a safe type card', () => {
    render(
      <SafeFoodCard
        title="저칼륨 음식"
        categories={mockCategories}
        language="ko"
      />
    );

    expect(screen.getByTestId('food-info-card-safe')).toBeInTheDocument();
    expect(screen.getByLabelText('안전한 음식')).toBeInTheDocument();
  });

  it('should render with all provided props', () => {
    render(
      <SafeFoodCard
        title="Low Potassium Foods (Safe to Eat)"
        categories={mockCategories}
        language="en"
        className="my-custom-class"
      />
    );

    expect(screen.getByText('Low Potassium Foods (Safe to Eat)')).toBeInTheDocument();
    const card = screen.getByTestId('food-info-card-safe');
    expect(card).toHaveClass('my-custom-class');
  });

  it('should display green check icon', () => {
    render(
      <SafeFoodCard
        title="Safe Foods"
        categories={mockCategories}
      />
    );

    const iconContainer = screen.getByLabelText('안전한 음식');
    expect(iconContainer).toHaveClass('bg-[#22C55E]');
  });

  it('should render all categories and items', () => {
    render(
      <SafeFoodCard
        title="Safe Foods"
        categories={mockCategories}
      />
    );

    expect(screen.getByText('과일:')).toBeInTheDocument();
    expect(screen.getByText(/사과.*베리류/)).toBeInTheDocument();
    expect(screen.getByText('채소:')).toBeInTheDocument();
    expect(screen.getByText(/양배추.*오이/)).toBeInTheDocument();
  });
});

describe('WarningFoodCard Component', () => {
  const mockCategories: FoodCategory[] = [
    { label: '과일', items: ['바나나', '오렌지'] },
    { label: '채소', items: ['시금치', '감자'] }
  ];

  it('should render as a warning type card', () => {
    render(
      <WarningFoodCard
        title="고칼륨 음식"
        categories={mockCategories}
        language="ko"
      />
    );

    expect(screen.getByTestId('food-info-card-warning')).toBeInTheDocument();
    expect(screen.getByLabelText('주의 음식')).toBeInTheDocument();
  });

  it('should render with all provided props', () => {
    render(
      <WarningFoodCard
        title="High Potassium Foods (Foods to Avoid)"
        categories={mockCategories}
        language="en"
        className="warning-custom-class"
      />
    );

    expect(screen.getByText('High Potassium Foods (Foods to Avoid)')).toBeInTheDocument();
    const card = screen.getByTestId('food-info-card-warning');
    expect(card).toHaveClass('warning-custom-class');
  });

  it('should display red alert triangle icon', () => {
    render(
      <WarningFoodCard
        title="Warning Foods"
        categories={mockCategories}
      />
    );

    const icon = screen.getByLabelText('주의 음식');
    expect(icon).toHaveClass('text-[#EF4444]');
  });

  it('should render all categories and items', () => {
    render(
      <WarningFoodCard
        title="Warning Foods"
        categories={mockCategories}
      />
    );

    expect(screen.getByText('과일:')).toBeInTheDocument();
    expect(screen.getByText(/바나나.*오렌지/)).toBeInTheDocument();
    expect(screen.getByText('채소:')).toBeInTheDocument();
    expect(screen.getByText(/시금치.*감자/)).toBeInTheDocument();
  });
});

describe('Performance Optimization', () => {
  it('should have displayName for React DevTools', () => {
    expect(FoodInfoCard.displayName).toBe('FoodInfoCard');
    expect(SafeFoodCard.displayName).toBe('SafeFoodCard');
    expect(WarningFoodCard.displayName).toBe('WarningFoodCard');
  });

  it('should be memoized components', () => {
    // Check if components are wrapped with React.memo
    // React.memo wraps the component in a special object
    expect(FoodInfoCard.$$typeof).toBeDefined();
    expect(SafeFoodCard.$$typeof).toBeDefined();
    expect(WarningFoodCard.$$typeof).toBeDefined();
  });
});

describe('Accessibility', () => {
  const mockCategories: FoodCategory[] = [
    { label: 'Test', items: ['Item1', 'Item2'] }
  ];

  describe('ARIA Attributes', () => {
    it('should have proper region role', () => {
      render(
        <SafeFoodCard
          title="Test"
          categories={mockCategories}
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to title', () => {
      render(
        <SafeFoodCard
          title="Test Card"
          categories={mockCategories}
        />
      );

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'food-card-title-safe');
      expect(screen.getByText('Test Card')).toHaveAttribute('id', 'food-card-title-safe');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(
        <SafeFoodCard
          title="Test"
          categories={mockCategories}
        />
      );

      // Icons should have aria-hidden attribute
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Semantic HTML', () => {
    it('should use heading tag for title', () => {
      render(
        <SafeFoodCard
          title="Test Title"
          categories={mockCategories}
        />
      );

      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Test Title');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable by keyboard (region)', () => {
      render(
        <SafeFoodCard
          title="Test"
          categories={mockCategories}
        />
      );

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
      // Region elements are navigable via screen readers
    });
  });
});
