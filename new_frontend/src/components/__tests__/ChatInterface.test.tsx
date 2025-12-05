import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatInterface from '../ChatInterface';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppProvider } from '../../contexts/AppContext';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

// Mock fetch for streaming
global.fetch = vi.fn();

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    profile: 'patient' as const,
  },
  token: 'mock-token',
  isAuthenticated: true,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      <AuthProvider>{component}</AuthProvider>
    </AppProvider>
  );
};

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Profile Selector', () => {
    it('renders profile selector with default value', () => {
      renderWithProviders(<ChatInterface />);

      expect(screen.getByText('맞춤 정보:')).toBeInTheDocument();
      expect(screen.getByText(/환자\(신장병 환우\)/)).toBeInTheDocument();
    });

    it('allows changing profile selection', async () => {
      renderWithProviders(<ChatInterface />);

      const select = screen.getByRole('combobox');

      fireEvent.change(select, { target: { value: 'general' } });

      await waitFor(() => {
        expect(screen.getByText(/일반인\(간병인\)/)).toBeInTheDocument();
      });
    });

    it('updates profile in auth context when changed', async () => {
      const { updateProfile } = mockAuthContext;
      renderWithProviders(<ChatInterface />);

      const select = screen.getByRole('combobox');

      fireEvent.change(select, { target: { value: 'researcher' } });

      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith('researcher');
      });
    });

    it('displays all profile options', () => {
      renderWithProviders(<ChatInterface />);

      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('환자(신장병 환우)');
      expect(options[1]).toHaveTextContent('일반인(간병인)');
      expect(options[2]).toHaveTextContent('연구원');
    });
  });

  describe('Message Sending', () => {
    it('includes user_profile in API payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValue({ done: true }),
          }),
        },
      });
      global.fetch = mockFetch;

      renderWithProviders(<ChatInterface />);

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('user_profile'),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible profile selector', () => {
      renderWithProviders(<ChatInterface />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('value');
    });

    it('maintains keyboard navigation', () => {
      renderWithProviders(<ChatInterface />);

      const select = screen.getByRole('combobox');

      select.focus();
      expect(document.activeElement).toBe(select);
    });
  });

  describe('Visual Feedback', () => {
    it('renders ChevronDown icon', () => {
      const { container } = renderWithProviders(<ChatInterface />);

      // ChevronDown icon should be present
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('uses correct color scheme', () => {
      renderWithProviders(<ChatInterface />);

      const profileLabel = screen.getByText(/환자\(신장병 환우\)|일반인\(간병인\)|연구원/);
      expect(profileLabel).toHaveClass('text-[#00c8b4]');
    });
  });
});
