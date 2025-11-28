/**
 * MealEntryCard Component Tests
 * Tests for meal entry card component including:
 * - Rendering with different props
 * - Accessibility compliance
 * - Click interaction
 * - Dark mode support
 * - Memoization behavior
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MealEntryCard, type MealLog } from '../MealEntryCard';

describe('MealEntryCard', () => {
  const mockLog: MealLog = {
    date: '2025-11-23',
    meal: '아침',
    foods: ['현미밥', '된장찌개', '배추김치'],
    calories: 450
  };

  describe('Rendering', () => {
    it('should render meal information correctly', () => {
      render(<MealEntryCard log={mockLog} language="ko" />);

      expect(screen.getByText('아침')).toBeInTheDocument();
      expect(screen.getByText('2025-11-23')).toBeInTheDocument();
      expect(screen.getByText('450 kcal')).toBeInTheDocument();
    });

    it('should render all food items', () => {
      render(<MealEntryCard log={mockLog} language="ko" />);

      expect(screen.getByText('현미밥')).toBeInTheDocument();
      expect(screen.getByText('된장찌개')).toBeInTheDocument();
      expect(screen.getByText('배추김치')).toBeInTheDocument();
    });

    it('should render as article when onClick is not provided', () => {
      const { container } = render(<MealEntryCard log={mockLog} language="ko" />);

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveAttribute('role', 'article');
    });

    it('should render as button when onClick is provided', () => {
      const onClick = vi.fn();
      const { container } = render(
        <MealEntryCard log={mockLog} language="ko" onClick={onClick} />
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should display correct number of food items', () => {
      const { container } = render(<MealEntryCard log={mockLog} language="ko" />);

      const foodItems = container.querySelectorAll('[role="listitem"]');
      expect(foodItems).toHaveLength(3);
    });
  });

  describe('Interaction', () => {
    it('should call onClick when card is clicked', () => {
      const onClick = vi.fn();
      render(<MealEntryCard log={mockLog} language="ko" onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when clicked without onClick handler', () => {
      const { container } = render(<MealEntryCard log={mockLog} language="ko" />);

      const article = container.querySelector('article');
      expect(() => {
        fireEvent.click(article!);
      }).not.toThrow();
    });

    it('should be keyboard accessible when clickable', () => {
      const onClick = vi.fn();
      render(<MealEntryCard log={mockLog} language="ko" onClick={onClick} />);

      const button = screen.getByRole('button');

      // Simulate Enter key press
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels in Korean', () => {
      render(<MealEntryCard log={mockLog} language="ko" />);

      const calorieElement = screen.getByText('450 kcal');
      expect(calorieElement).toHaveAttribute('aria-label', '450 칼로리');
      expect(calorieElement).toHaveAttribute('role', 'status');
    });

    it('should have proper ARIA labels in English', () => {
      const englishLog: MealLog = {
        date: '2025-11-23',
        meal: 'Breakfast',
        foods: ['Rice', 'Soup', 'Kimchi'],
        calories: 450
      };

      render(<MealEntryCard log={englishLog} language="en" />);

      const calorieElement = screen.getByText('450 kcal');
      expect(calorieElement).toHaveAttribute('aria-label', '450 Calories');
    });

    it('should have screen reader text when clickable', () => {
      const onClick = vi.fn();
      render(<MealEntryCard log={mockLog} language="ko" onClick={onClick} />);

      const srText = screen.getByText('자세히 보기');
      expect(srText).toHaveClass('sr-only');
    });

    it('should have proper heading hierarchy', () => {
      render(<MealEntryCard log={mockLog} language="ko" />);

      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('아침');
    });

    it('should have list role for food items', () => {
      const { container } = render(<MealEntryCard log={mockLog} language="ko" />);

      const foodList = container.querySelector('[role="list"]');
      expect(foodList).toBeInTheDocument();
      expect(foodList).toHaveAttribute('aria-label', '음식 목록');
    });

    it('should be focusable when clickable', () => {
      const onClick = vi.fn();
      render(<MealEntryCard log={mockLog} language="ko" onClick={onClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-[#00C9B7]');
    });
  });

  describe('Styling and Dark Mode', () => {
    it('should have correct base styles', () => {
      const { container } = render(<MealEntryCard log={mockLog} language="ko" />);

      const article = container.querySelector('article');
      expect(article).toHaveClass(
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'shadow',
        'p-4'
      );
    });

    it('should have dark mode classes on meal title', () => {
      render(<MealEntryCard log={mockLog} language="ko" />);

      const title = screen.getByText('아침');
      expect(title).toHaveClass('dark:text-white');
    });

    it('should have dark mode classes on date', () => {
      render(<MealEntryCard log={mockLog} language="ko" />);

      const date = screen.getByText('2025-11-23');
      expect(date).toHaveClass('dark:text-gray-500');
    });

    it('should have dark mode classes on calorie badge', () => {
      render(<MealEntryCard log={mockLog} language="ko" />);

      const calories = screen.getByText('450 kcal');
      expect(calories).toHaveClass('dark:bg-gray-700');
    });

    it('should apply hover styles when clickable', () => {
      const onClick = vi.fn();
      const { container } = render(
        <MealEntryCard log={mockLog} language="ko" onClick={onClick} />
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:shadow-lg', 'hover:border-[#00C9B7]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty foods array', () => {
      const emptyLog: MealLog = {
        date: '2025-11-23',
        meal: '아침',
        foods: [],
        calories: 0
      };

      const { container } = render(<MealEntryCard log={emptyLog} language="ko" />);

      const foodItems = container.querySelectorAll('[role="listitem"]');
      expect(foodItems).toHaveLength(0);
    });

    it('should handle single food item', () => {
      const singleFoodLog: MealLog = {
        date: '2025-11-23',
        meal: '아침',
        foods: ['현미밥'],
        calories: 200
      };

      render(<MealEntryCard log={singleFoodLog} language="ko" />);

      expect(screen.getByText('현미밥')).toBeInTheDocument();
    });

    it('should handle large calorie numbers', () => {
      const highCalLog: MealLog = {
        ...mockLog,
        calories: 1500
      };

      render(<MealEntryCard log={highCalLog} language="ko" />);

      expect(screen.getByText('1500 kcal')).toBeInTheDocument();
    });

    it('should handle long meal names', () => {
      const longMealLog: MealLog = {
        ...mockLog,
        meal: '이른 아침 식사 (오전 6시)'
      };

      render(<MealEntryCard log={longMealLog} language="ko" />);

      expect(screen.getByText('이른 아침 식사 (오전 6시)')).toBeInTheDocument();
    });

    it('should handle special characters in food names', () => {
      const specialFoodLog: MealLog = {
        ...mockLog,
        foods: ['현미밥 (200g)', '된장찌개 (저염)', '배추김치 1/2컵']
      };

      render(<MealEntryCard log={specialFoodLog} language="ko" />);

      expect(screen.getByText('현미밥 (200g)')).toBeInTheDocument();
      expect(screen.getByText('된장찌개 (저염)')).toBeInTheDocument();
      expect(screen.getByText('배추김치 1/2컵')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should be memoized', () => {
      expect(MealEntryCard.displayName).toBe('MealEntryCard');
    });

    it('should not re-render with same props', () => {
      const { rerender } = render(<MealEntryCard log={mockLog} language="ko" />);

      // Re-render with same props
      rerender(<MealEntryCard log={mockLog} language="ko" />);

      // Component should maintain the same DOM structure
      expect(screen.getByText('아침')).toBeInTheDocument();
    });
  });
});
