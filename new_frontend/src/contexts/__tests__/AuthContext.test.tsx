import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../services/api';

// Mock the API module
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

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  it('initializes with no user and no token', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loads user and token from localStorage on mount', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    };
    const mockToken = 'test-token-123';

    localStorage.setItem('careguide_user', JSON.stringify(mockUser));
    localStorage.setItem('careguide_token', mockToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs in successfully and stores credentials', async () => {
    const mockResponse = {
      data: {
        access_token: 'new-token-123',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
      },
    };

    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    expect(result.current.token).toBe('new-token-123');
    expect(result.current.user).toEqual(mockResponse.data.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('careguide_token')).toBe('new-token-123');
    expect(localStorage.getItem('careguide_user')).toBe(
      JSON.stringify(mockResponse.data.user)
    );
  });

  it('handles login failure', async () => {
    const mockError = {
      response: {
        data: {
          detail: 'Invalid credentials',
        },
      },
    };

    vi.mocked(api.post).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await expect(
      act(async () => {
        await result.current.login('testuser', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs out and clears credentials', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    };
    const mockToken = 'test-token-123';

    localStorage.setItem('careguide_user', JSON.stringify(mockUser));
    localStorage.setItem('careguide_token', mockToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('careguide_token')).toBeNull();
    expect(localStorage.getItem('careguide_user')).toBeNull();
  });

  it('updates user profile', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      profile: 'general' as const,
    };
    const mockToken = 'test-token-123';

    localStorage.setItem('careguide_user', JSON.stringify(mockUser));
    localStorage.setItem('careguide_token', mockToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.updateProfile('patient');
    });

    expect(result.current.user?.profile).toBe('patient');
    const storedUser = JSON.parse(localStorage.getItem('careguide_user') || '{}');
    expect(storedUser.profile).toBe('patient');
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
