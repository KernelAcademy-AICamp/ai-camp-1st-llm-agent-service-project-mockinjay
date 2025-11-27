/**
 * DietTypeCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DietTypeCard } from '../DietTypeCard';

describe('DietTypeCard', () => {
  const mockProps = {
    title: 'Low Sodium Diet',
    limit: 'Daily sodium intake under 2,000mg',
    tips: ['Use fresh ingredients', 'Avoid processed foods', 'Use natural spices'],
    color: 'border-blue-200 dark:border-blue-800',
  };

  it('renders card with title and limit', () => {
    render(<DietTypeCard {...mockProps} />);

    expect(screen.getByText('Low Sodium Diet')).toBeInTheDocument();
    expect(screen.getByText('Daily sodium intake under 2,000mg')).toBeInTheDocument();
  });

  it('renders all tips', () => {
    render(<DietTypeCard {...mockProps} />);

    mockProps.tips.forEach(tip => {
      expect(screen.getByText(tip)).toBeInTheDocument();
    });
  });

  it('applies custom color class', () => {
    const { container } = render(<DietTypeCard {...mockProps} />);
    const card = container.firstChild;

    expect(card).toHaveClass('border-blue-200');
  });
});
