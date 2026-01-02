/**
 * Unit tests for AuthContext
 *
 * Tests authentication state management including:
 * - Initial state from localStorage
 * - Login flow with Google token
 * - Logout functionality
 * - Token expiry handling
 * - Context provider requirements
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, User } from '../AuthContext';

// Mock jwt-decode
const mockJwtDecode = jest.fn();
jest.mock('jwt-decode', () => ({
  jwtDecode: (token: string) => mockJwtDecode(token),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockLocation.href = '';
    (global.fetch as jest.Mock).mockReset();
    // Default mock for jwt decode - valid token
    mockJwtDecode.mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    });
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide context when used inside provider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.login).toBeInstanceOf(Function);
      expect(result.current.logout).toBeInstanceOf(Function);
    });
  });

  describe('Initial state', () => {
    it('should have correct initial state with no stored token', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should load user and token from localStorage on mount', async () => {
      const storedUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        pictureUrl: 'https://example.com/pic.jpg',
      };

      // Set up localStorage before rendering
      localStorage.setItem('authToken', 'valid-jwt-token');
      localStorage.setItem('authUser', JSON.stringify(storedUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(storedUser);
      expect(result.current.token).toBe('valid-jwt-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear expired token on mount', async () => {
      // Mock expired token
      mockJwtDecode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      });

      // Set up localStorage before rendering
      localStorage.setItem('authToken', 'expired-jwt-token');
      localStorage.setItem('authUser', JSON.stringify({ id: 'user-123', email: 'test@example.com', name: 'Test', pictureUrl: null }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      // Verify localStorage was cleared
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
    });
  });

  describe('login', () => {
    const mockAuthResponse = {
      token: 'new-jwt-token',
      user: {
        id: 'user-456',
        email: 'newuser@example.com',
        name: 'New User',
        pictureUrl: 'https://example.com/newpic.jpg',
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('should successfully login with Google token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('google-id-token');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/google'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: 'google-id-token' }),
        })
      );

      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(result.current.token).toBe(mockAuthResponse.token);
      expect(result.current.isAuthenticated).toBe(true);
      // Verify localStorage was updated
      expect(localStorage.getItem('authToken')).toBe(mockAuthResponse.token);
      expect(localStorage.getItem('authUser')).toBe(JSON.stringify(mockAuthResponse.user));
    });

    it('should throw error on failed login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid token' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('invalid-google-token');
        })
      ).rejects.toThrow('Invalid token');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set isLoading during login', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('google-id-token').catch(() => {});
      });

      // Should be loading while waiting for response
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockAuthResponse),
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear auth state and localStorage', async () => {
      const storedUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        pictureUrl: null,
      };

      // Set up localStorage before rendering
      localStorage.setItem('authToken', 'valid-jwt-token');
      localStorage.setItem('authUser', JSON.stringify(storedUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      // Verify localStorage was cleared
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
    });

    it('should redirect to login page', async () => {
      // Set up localStorage before rendering
      localStorage.setItem('authToken', 'valid-jwt-token');
      localStorage.setItem('authUser', JSON.stringify({ id: 'user-123', email: 'test@example.com', name: 'Test', pictureUrl: null }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(mockLocation.href).toBe('/#/login');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when both user and token exist', async () => {
      // Set up localStorage before rendering
      localStorage.setItem('authToken', 'valid-jwt-token');
      localStorage.setItem('authUser', JSON.stringify({ id: 'user-123', email: 'test@example.com', name: 'Test', pictureUrl: null }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return false when user is null', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return false when token is null', () => {
      // Only set user, no token
      localStorage.setItem('authUser', JSON.stringify({ id: 'user-123', email: 'test@example.com', name: 'Test', pictureUrl: null }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
