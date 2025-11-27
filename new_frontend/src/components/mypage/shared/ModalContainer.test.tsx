/**
 * ModalContainer Component Tests
 *
 * Unit tests for the ModalContainer component using Jest and React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalContainer } from './ModalContainer';

describe('ModalContainer', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ModalContainer isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <ModalContainer
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          showCloseButton={false}
        >
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('renders footer when provided', () => {
      render(
        <ModalContainer
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          footer={<button>Save</button>}
        >
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('Size Variations', () => {
    it.each(['sm', 'md', 'lg', 'xl', 'full'] as const)(
      'applies correct size class for %s',
      (size) => {
        const { container } = render(
          <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal" size={size}>
            <p>Modal content</p>
          </ModalContainer>
        );

        const modal = container.querySelector('[role="dialog"]');
        const modalContent = modal?.firstChild as HTMLElement;

        const sizeClasses = {
          sm: 'max-w-md',
          md: 'max-w-lg',
          lg: 'max-w-2xl',
          xl: 'max-w-4xl',
          full: 'max-w-full',
        };

        expect(modalContent).toHaveClass(sizeClasses[size]);
      }
    );
  });

  describe('Close Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      fireEvent.click(screen.getByLabelText('Close modal'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when ESC key is pressed', async () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onClose when ESC is pressed and closeOnEscape is false', async () => {
      render(
        <ModalContainer
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          closeOnEscape={false}
        >
          <p>Modal content</p>
        </ModalContainer>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('calls onClose when backdrop is clicked', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      fireEvent.click(screen.getByText('Modal content'));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when backdrop is clicked and closeOnBackdropClick is false', () => {
      render(
        <ModalContainer
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          closeOnBackdropClick={false}
        >
          <p>Modal content</p>
        </ModalContainer>
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Prevention', () => {
    it('prevents body scroll when modal is open', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal is closed', () => {
      const { rerender } = render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <ModalContainer isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Focus Management', () => {
    it('focuses first focusable element when opened', async () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <input data-testid="first-input" />
          <button>Second button</button>
        </ModalContainer>
      );

      await waitFor(() => {
        const firstInput = screen.getByTestId('first-input');
        expect(firstInput).toHaveFocus();
      });
    });

    it('traps focus within modal (Tab key)', async () => {
      const user = userEvent.setup();
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <input data-testid="first-input" />
          <button data-testid="second-button">Button</button>
        </ModalContainer>
      );

      const firstInput = screen.getByTestId('first-input');
      const secondButton = screen.getByTestId('second-button');
      const closeButton = screen.getByLabelText('Close modal');

      firstInput.focus();
      expect(firstInput).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('restores focus to previous element when closed', async () => {
      const triggerButton = document.createElement('button');
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      rerender(
        <ModalContainer isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });

      document.body.removeChild(triggerButton);
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('has accessible title', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
    });

    it('close button has accessible label', () => {
      render(
        <ModalContainer isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </ModalContainer>
      );

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to modal content', () => {
      const { container } = render(
        <ModalContainer
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          className="custom-modal-class"
        >
          <p>Modal content</p>
        </ModalContainer>
      );

      const modalContent = container.querySelector('.custom-modal-class');
      expect(modalContent).toBeInTheDocument();
    });
  });
});
