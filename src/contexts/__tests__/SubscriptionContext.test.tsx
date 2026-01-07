/**
 * Unit tests for SubscriptionContext
 *
 * Tests subscription state management including:
 * - Initial state and loading
 * - Fetching subscription status from API
 * - isPro, canCreateLead, canCreateProperty computed values
 * - createCheckoutSession and openCustomerPortal methods
 * - Error handling and fallback to free tier
 * - Context provider requirements
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SubscriptionProvider, useSubscription } from '../SubscriptionContext';
import { AuthProvider } from '../AuthContext';
import { SubscriptionStatus } from '../../types/subscription';

// Mock fetch
global.fetch = jest.fn();

// Mock jwt-decode for AuthContext
jest.mock('jwt-decode', () => ({
  jwtDecode: () => ({
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/pic.jpg',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }),
}));

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('SubscriptionContext', () => {
  const mockFreeSubscription: SubscriptionStatus = {
    plan: 'free',
    hasActiveSubscription: false,
    subscriptionOverride: false,
    currentPeriodEnd: null,
    usage: {
      leadsCreatedToday: 5,
      leadsLimitPerDay: 20,
      totalProperties: 3,
      propertiesLimit: 10,
    },
  };

  const mockProSubscription: SubscriptionStatus = {
    plan: 'pro',
    hasActiveSubscription: true,
    subscriptionOverride: false,
    currentPeriodEnd: '2026-02-01T00:00:00Z',
    usage: {
      leadsCreatedToday: 50,
      leadsLimitPerDay: 20,
      totalProperties: 25,
      propertiesLimit: 10,
    },
  };

  const mockOverrideSubscription: SubscriptionStatus = {
    plan: 'pro',
    hasActiveSubscription: true,
    subscriptionOverride: true,
    currentPeriodEnd: null,
    usage: {
      leadsCreatedToday: 100,
      leadsLimitPerDay: 20,
      totalProperties: 50,
      propertiesLimit: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockLocation.href = '';
    (global.fetch as jest.Mock).mockReset();
  });

  // Wrapper with authenticated user
  const createWrapper = () => {
    // Set up authenticated user in localStorage
    localStorage.setItem('authToken', 'valid-jwt-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      pictureUrl: null,
    }));

    return ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <SubscriptionProvider>{children}</SubscriptionProvider>
      </AuthProvider>
    );
  };

  // Wrapper without authentication
  const createUnauthenticatedWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <SubscriptionProvider>{children}</SubscriptionProvider>
      </AuthProvider>
    );
  };

  describe('useSubscription hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useSubscription());
      }).toThrow('useSubscription must be used within a SubscriptionProvider');

      consoleSpy.mockRestore();
    });

    it('should provide context when used inside provider', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFreeSubscription),
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toBeDefined();
      expect(result.current.subscription).toBeDefined();
      expect(result.current.refreshSubscription).toBeInstanceOf(Function);
      expect(result.current.createCheckoutSession).toBeInstanceOf(Function);
      expect(result.current.openCustomerPortal).toBeInstanceOf(Function);
    });
  });

  describe('Initial state and loading', () => {
    it('should show loading state initially', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      // Should be loading while fetching
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        });
      });

      expect(result.current.loading).toBe(false);
    });

    it('should set subscription to null when not authenticated', async () => {
      const wrapper = createUnauthenticatedWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Fetching subscription status', () => {
    it('should fetch subscription status on mount when authenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFreeSubscription),
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscription/status'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid-jwt-token',
          },
        })
      );
      expect(result.current.subscription).toEqual(mockFreeSubscription);
    });

    it('should handle fetch error and fallback to free tier', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load subscription status');
      expect(result.current.subscription).toEqual({
        plan: 'free',
        hasActiveSubscription: false,
        subscriptionOverride: false,
        currentPeriodEnd: null,
        usage: {
          leadsCreatedToday: 0,
          leadsLimitPerDay: 20,
          totalProperties: 0,
          propertiesLimit: 10,
        },
      });

      consoleSpy.mockRestore();
    });

    it('should handle network error and fallback to free tier', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load subscription status');
      expect(result.current.subscription?.plan).toBe('free');

      consoleSpy.mockRestore();
    });
  });

  describe('Computed values', () => {
    describe('isPro', () => {
      it('should return false for free tier', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isPro).toBe(false);
      });

      it('should return true for pro tier', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isPro).toBe(true);
      });

      it('should return true for subscription override', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOverrideSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isPro).toBe(true);
      });
    });

    describe('canCreateLead', () => {
      it('should return true when under limit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canCreateLead).toBe(true);
      });

      it('should return false when at limit', async () => {
        const atLimitSubscription: SubscriptionStatus = {
          ...mockFreeSubscription,
          usage: {
            ...mockFreeSubscription.usage,
            leadsCreatedToday: 20,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(atLimitSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canCreateLead).toBe(false);
      });

      it('should return true for pro even when over limit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // Pro user has 50 leads which exceeds free limit of 20
        expect(result.current.canCreateLead).toBe(true);
      });
    });

    describe('canCreateProperty', () => {
      it('should return true when under limit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canCreateProperty).toBe(true);
      });

      it('should return false when at limit', async () => {
        const atLimitSubscription: SubscriptionStatus = {
          ...mockFreeSubscription,
          usage: {
            ...mockFreeSubscription.usage,
            totalProperties: 10,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(atLimitSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canCreateProperty).toBe(false);
      });

      it('should return true for pro even when over limit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // Pro user has 25 properties which exceeds free limit of 10
        expect(result.current.canCreateProperty).toBe(true);
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should redirect to Stripe checkout URL on success', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session-id' }),
        });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createCheckoutSession();
      });

      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/stripe/create-checkout-session'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'Content-Type': 'application/json',
          },
        })
      );
      expect(mockLocation.href).toBe('https://checkout.stripe.com/session-id');
    });

    it('should throw error when not authenticated', async () => {
      const wrapper = createUnauthenticatedWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createCheckoutSession();
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error on API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Checkout failed' }),
        });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createCheckoutSession();
        })
      ).rejects.toThrow('Checkout failed');

      consoleSpy.mockRestore();
    });
  });

  describe('openCustomerPortal', () => {
    it('should redirect to Stripe customer portal on success', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal-id' }),
        });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.openCustomerPortal();
      });

      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/stripe/create-portal-session'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
          },
        })
      );
      expect(mockLocation.href).toBe('https://billing.stripe.com/portal-id');
    });

    it('should throw error when not authenticated', async () => {
      const wrapper = createUnauthenticatedWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.openCustomerPortal();
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error on API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Portal failed' }),
        });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.openCustomerPortal();
        })
      ).rejects.toThrow('Portal failed');

      consoleSpy.mockRestore();
    });
  });

  describe('refreshSubscription', () => {
    it('should refetch subscription status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isPro).toBe(false);

      await act(async () => {
        await result.current.refreshSubscription();
      });

      expect(result.current.isPro).toBe(true);
    });
  });
});
