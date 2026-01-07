/**
 * Unit tests for PricingPage component
 *
 * Tests:
 * - Displays loading state while fetching subscription
 * - Displays Free and Pro tier cards
 * - Shows correct features for each tier
 * - Shows "Current Plan" for free users on Free tier
 * - Shows "Upgrade to Pro" button for free users
 * - Shows "Manage Subscription" for pro users
 * - Displays subscription info when user has subscription
 * - Upgrade button triggers checkout session
 * - Manage subscription button opens customer portal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PricingPage from '../PricingPage';
import { SubscriptionProvider } from '../../contexts/SubscriptionContext';
import { AuthProvider } from '../../contexts/AuthContext';
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

describe('PricingPage', () => {
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
    currentPeriodEnd: '2026-02-15T00:00:00Z',
    usage: {
      leadsCreatedToday: 50,
      leadsLimitPerDay: 20,
      totalProperties: 25,
      propertiesLimit: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockLocation.href = '';
    (global.fetch as jest.Mock).mockReset();
  });

  const setupAuth = () => {
    localStorage.setItem('authToken', 'valid-jwt-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      pictureUrl: null,
    }));
  };

  const renderWithProviders = (subscription: SubscriptionStatus) => {
    setupAuth();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(subscription),
    });

    return render(
      <AuthProvider>
        <SubscriptionProvider>
          <PricingPage />
        </SubscriptionProvider>
      </AuthProvider>
    );
  };

  describe('Loading state', () => {
    it('should show loading spinner while fetching subscription', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      setupAuth();
      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      render(
        <AuthProvider>
          <SubscriptionProvider>
            <PricingPage />
          </SubscriptionProvider>
        </AuthProvider>
      );

      // Should show loading spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Resolve the promise to avoid act warnings
      await waitFor(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        });
      });
    });
  });

  describe('Page content', () => {
    it('should display page title', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByText('Simple, Transparent Pricing')).toBeInTheDocument();
      });

      expect(screen.getByText('Start free, upgrade when you need more')).toBeInTheDocument();
    });

    it('should display Free tier card', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByText('Free')).toBeInTheDocument();
      });

      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('should display Pro tier card', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByText('Pro')).toBeInTheDocument();
      });

      expect(screen.getByText('$49')).toBeInTheDocument();
      expect(screen.getByText('RECOMMENDED')).toBeInTheDocument();
    });
  });

  describe('Free tier features', () => {
    it('should display correct free tier features', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByText('20 property leads per day')).toBeInTheDocument();
      });

      expect(screen.getByText('10 total properties')).toBeInTheDocument();
      expect(screen.getByText('Basic property analysis')).toBeInTheDocument();
      expect(screen.getByText('Contact management')).toBeInTheDocument();
      expect(screen.getByText('Bookkeeping')).toBeInTheDocument();
    });
  });

  describe('Pro tier features', () => {
    it('should display correct pro tier features', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByText('Unlimited property leads')).toBeInTheDocument();
      });

      expect(screen.getByText('Unlimited properties')).toBeInTheDocument();
      expect(screen.getByText('Investment reports (create & share)')).toBeInTheDocument();
      expect(screen.getByText('RentCast API integration')).toBeInTheDocument();
      expect(screen.getByText('SMS messaging')).toBeInTheDocument();
      expect(screen.getByText('Priority support')).toBeInTheDocument();
    });
  });

  describe('Free user view', () => {
    it('should show "Current Plan" on Free tier card', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Current Plan' })).toBeInTheDocument();
      });
    });

    it('should show "Upgrade to Pro" button', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument();
      });
    });

    it('should trigger checkout when Upgrade button is clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFreeSubscription),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session-789' }),
        });

      setupAuth();
      render(
        <AuthProvider>
          <SubscriptionProvider>
            <PricingPage />
          </SubscriptionProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument();
      });

      const upgradeButton = screen.getByRole('button', { name: 'Upgrade to Pro' });
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockLocation.href).toBe('https://checkout.stripe.com/session-789');
      }, { timeout: 3000 });
    });
  });

  describe('Pro user view', () => {
    it('should show "Manage Subscription" button for pro users', async () => {
      renderWithProviders(mockProSubscription);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Manage Subscription' })).toBeInTheDocument();
      });
    });

    it('should show "Downgrade" on Free tier card for pro users', async () => {
      renderWithProviders(mockProSubscription);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Downgrade' })).toBeInTheDocument();
      });
    });

    it('should open customer portal when Manage Subscription is clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal-abc' }),
        });

      setupAuth();
      render(
        <AuthProvider>
          <SubscriptionProvider>
            <PricingPage />
          </SubscriptionProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Manage Subscription' })).toBeInTheDocument();
      });

      const manageButton = screen.getByRole('button', { name: 'Manage Subscription' });
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(mockLocation.href).toBe('https://billing.stripe.com/portal-abc');
      }, { timeout: 3000 });
    });
  });

  describe('Subscription info display', () => {
    it('should display current plan and renewal date for pro users', async () => {
      renderWithProviders(mockProSubscription);

      await waitFor(() => {
        expect(screen.getByText(/Current plan:/)).toBeInTheDocument();
      });

      expect(screen.getByText(/PRO/)).toBeInTheDocument();
      // Date should be formatted - Feb 15, 2026
      expect(screen.getByText(/Renews/)).toBeInTheDocument();
    });

    it('should not display subscription info for free users without subscription', async () => {
      renderWithProviders(mockFreeSubscription);

      await waitFor(() => {
        expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
      });

      // Free subscription has no currentPeriodEnd, so no subscription info shown
      expect(screen.queryByText(/Renews/)).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle upgrade checkout error gracefully', async () => {
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

      setupAuth();
      render(
        <AuthProvider>
          <SubscriptionProvider>
            <PricingPage />
          </SubscriptionProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument();
      });

      const upgradeButton = screen.getByRole('button', { name: 'Upgrade to Pro' });
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to start checkout:',
          expect.any(Error)
        );
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });

    it('should handle manage subscription error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProSubscription),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Portal error' }),
        });

      setupAuth();
      render(
        <AuthProvider>
          <SubscriptionProvider>
            <PricingPage />
          </SubscriptionProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Manage Subscription' })).toBeInTheDocument();
      });

      const manageButton = screen.getByRole('button', { name: 'Manage Subscription' });
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to open portal:',
          expect.any(Error)
        );
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });
  });
});
