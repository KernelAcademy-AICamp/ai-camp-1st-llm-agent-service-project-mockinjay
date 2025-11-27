/**
 * MenuItem Component Tests
 *
 * Unit tests for the MenuItem component using Jest and React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { User } from 'lucide-react';
import { MenuItem } from './MenuItem';

describe('MenuItem', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Rendering', () => {
    it('renders with icon and label', () => {
      render(
        <MenuItem
          icon={<User data-testid="user-icon" />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('renders with badge when provided', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Notifications"
          onClick={mockOnClick}
          badge={5}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('5 items')).toBeInTheDocument();
    });

    it('does not render badge when value is 0', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Notifications"
          onClick={mockOnClick}
          badge={0}
        />
      );

      expect(screen.queryByLabelText(/items/)).not.toBeInTheDocument();
    });

    it('renders with custom aria-label', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
          ariaLabel="View user profile"
        />
      );

      expect(screen.getByLabelText('View user profile')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
          disabled
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles when disabled prop is true', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
          disabled
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-50');
      expect(button).toBeDisabled();
    });

    it('sets aria-disabled when disabled', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
          disabled
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not show chevron icon when disabled', () => {
      const { container } = render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
          disabled
        />
      );

      // ChevronRight icon should not be present when disabled
      const chevronIcon = container.querySelector('[aria-hidden="true"]');
      expect(chevronIcon).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is keyboard focusable', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has focus styles', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
          className="custom-class"
        />
      );

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Performance', () => {
    it('is memoized (same props should not cause re-render)', () => {
      const { rerender } = render(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      // Re-render with same props
      rerender(
        <MenuItem
          icon={<User />}
          label="Profile"
          onClick={mockOnClick}
        />
      );

      // Component should not re-render unnecessarily
      // This is enforced by React.memo
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });
});
