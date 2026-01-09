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
import { TrialStatus } from '../../types/subscription';

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
  const mockTrialStatus: TrialStatus = {
    plan: 'trial',
    isInTrial: true,
    isTrialExpired: false,
    hasActiveSubscription: false,
    subscriptionOverride: false,
    daysRemaining: 45,
    trialEndDate: '2026-03-15T00:00:00Z',
    currentPeriodEnd: null,
    usage: {
      leadsCreatedToday: 5,
      leadsLimitPerDay: 20,
      totalProperties: 3,
      propertiesLimit: 10,
      rentCastRequestsToday: 1,
      rentCastLimitPerDay: 3,
      aiLeadScoresToday: 10,
      aiLeadScoresLimitPerDay: 50,
      messagingAllowed: false,
    },
  };

  const mockProSubscription: TrialStatus = {
    plan: 'pro',
    isInTrial: false,
    isTrialExpired: false,
    hasActiveSubscription: true,
    subscriptionOverride: false,
    daysRemaining: 0,
    trialEndDate: null,
    currentPeriodEnd: '2026-02-01T00:00:00Z',
    usage: {
      leadsCreatedToday: 50,
      leadsLimitPerDay: 2147483647, // int.MaxValue
      totalProperties: 25,
      propertiesLimit: 2147483647,
      rentCastRequestsToday: 10,
      rentCastLimitPerDay: 2147483647,
      aiLeadScoresToday: 100,
      aiLeadScoresLimitPerDay: 2147483647,
      messagingAllowed: true,
    },
  };

  const mockOverrideSubscription: TrialStatus = {
    plan: 'pro',
    isInTrial: false,
    isTrialExpired: false,
    hasActiveSubscription: true,
    subscriptionOverride: true,
    daysRemaining: 0,
    trialEndDate: null,
    currentPeriodEnd: null,
    usage: {
      leadsCreatedToday: 100,
      leadsLimitPerDay: 2147483647,
      totalProperties: 50,
      propertiesLimit: 2147483647,
      rentCastRequestsToday: 20,
      rentCastLimitPerDay: 2147483647,
      aiLeadScoresToday: 200,
      aiLeadScoresLimitPerDay: 2147483647,
      messagingAllowed: true,
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
        json: () => Promise.resolve(mockTrialStatus),
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toBeDefined();
      expect(result.current.trialStatus).toBeDefined();
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
          json: () => Promise.resolve(mockTrialStatus),
        });
      });

      expect(result.current.loading).toBe(false);
    });

    it('should set trialStatus to null when not authenticated', async () => {
      const wrapper = createUnauthenticatedWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.trialStatus).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Fetching subscription status', () => {
    it('should fetch subscription status on mount when authenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTrialStatus),
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
      expect(result.current.trialStatus).toEqual(mockTrialStatus);
    });

    it('should handle fetch error and fallback to trial tier', async () => {
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
      expect(result.current.trialStatus).toEqual({
        plan: 'trial',
        isInTrial: true,
        isTrialExpired: false,
        hasActiveSubscription: false,
        subscriptionOverride: false,
        daysRemaining: 60,
        trialEndDate: null,
        currentPeriodEnd: null,
        usage: {
          leadsCreatedToday: 0,
          leadsLimitPerDay: 20,
          totalProperties: 0,
          propertiesLimit: 10,
          rentCastRequestsToday: 0,
          rentCastLimitPerDay: 3,
          aiLeadScoresToday: 0,
          aiLeadScoresLimitPerDay: 50,
          messagingAllowed: false,
        },
      });

      consoleSpy.mockRestore();
    });

    it('should handle network error and fallback to trial tier', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load subscription status');
      expect(result.current.trialStatus?.plan).toBe('trial');
      expect(result.current.trialStatus?.isInTrial).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Computed values', () => {
    describe('isPro', () => {
      it('should return false for free tier', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
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
          json: () => Promise.resolve(mockTrialStatus),
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
          ...mockTrialStatus,
          usage: {
            ...mockTrialStatus.usage,
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
          json: () => Promise.resolve(mockTrialStatus),
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
          ...mockTrialStatus,
          usage: {
            ...mockTrialStatus.usage,
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

    describe('isInTrial', () => {
      it('should return true for trial users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isInTrial).toBe(true);
      });

      it('should return false for pro users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isInTrial).toBe(false);
      });
    });

    describe('isTrialExpired', () => {
      it('should return false for active trial users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isTrialExpired).toBe(false);
      });

      it('should return true for expired trial users', async () => {
        const expiredTrialStatus: TrialStatus = {
          plan: 'expired',
          isInTrial: false,
          isTrialExpired: true,
          hasActiveSubscription: false,
          subscriptionOverride: false,
          daysRemaining: 0,
          trialEndDate: '2026-01-01T00:00:00Z',
          currentPeriodEnd: null,
          usage: {
            ...mockTrialStatus.usage,
            messagingAllowed: false,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(expiredTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isTrialExpired).toBe(true);
      });
    });

    describe('canAccessApp', () => {
      it('should return true for trial users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canAccessApp).toBe(true);
      });

      it('should return true for pro users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canAccessApp).toBe(true);
      });

      it('should return false for expired trial users', async () => {
        const expiredTrialStatus: TrialStatus = {
          plan: 'expired',
          isInTrial: false,
          isTrialExpired: true,
          hasActiveSubscription: false,
          subscriptionOverride: false,
          daysRemaining: 0,
          trialEndDate: '2026-01-01T00:00:00Z',
          currentPeriodEnd: null,
          usage: {
            ...mockTrialStatus.usage,
            messagingAllowed: false,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(expiredTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canAccessApp).toBe(false);
      });
    });

    describe('canUseRentCast', () => {
      it('should return true when under limit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canUseRentCast).toBe(true);
      });

      it('should return false when at limit', async () => {
        const atLimitStatus: TrialStatus = {
          ...mockTrialStatus,
          usage: {
            ...mockTrialStatus.usage,
            rentCastRequestsToday: 3,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(atLimitStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canUseRentCast).toBe(false);
      });

      it('should return true for pro users regardless of count', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canUseRentCast).toBe(true);
      });
    });

    describe('canScoreWithAi', () => {
      it('should return true when under limit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canScoreWithAi).toBe(true);
      });

      it('should return false when at limit', async () => {
        const atLimitStatus: TrialStatus = {
          ...mockTrialStatus,
          usage: {
            ...mockTrialStatus.usage,
            aiLeadScoresToday: 50,
          },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(atLimitStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canScoreWithAi).toBe(false);
      });

      it('should return true for pro users regardless of count', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canScoreWithAi).toBe(true);
      });
    });

    describe('canAccessMessaging', () => {
      it('should return false for trial users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canAccessMessaging).toBe(false);
      });

      it('should return true for pro users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canAccessMessaging).toBe(true);
      });

      it('should return true for subscription override users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOverrideSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.canAccessMessaging).toBe(true);
      });
    });

    describe('daysRemaining', () => {
      it('should return correct days for trial users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.daysRemaining).toBe(45);
      });

      it('should return 0 for pro users', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSubscription(), { wrapper });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.daysRemaining).toBe(0);
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should redirect to Stripe checkout URL on success', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTrialStatus),
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
          json: () => Promise.resolve(mockTrialStatus),
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
          json: () => Promise.resolve(mockTrialStatus),
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
