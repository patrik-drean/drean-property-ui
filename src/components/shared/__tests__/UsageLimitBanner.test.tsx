/**
 * Unit tests for UsageLimitBanner component
 *
 * Tests:
 * - Does not render for pro users
 * - Does not render when usage is below 80%
 * - Renders warning when approaching limit (80-99%)
 * - Renders error when at limit (100%)
 * - Displays correct usage text for leads and properties
 * - Upgrade button triggers checkout session
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UsageLimitBanner } from '../UsageLimitBanner';
import { SubscriptionProvider } from '../../../contexts/SubscriptionContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { SubscriptionStatus } from '../../../types/subscription';

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

describe('UsageLimitBanner', () => {
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

  const createFreeSubscription = (leadsToday: number, properties: number): SubscriptionStatus => ({
    plan: 'free',
    hasActiveSubscription: false,
    subscriptionOverride: false,
    currentPeriodEnd: null,
    usage: {
      leadsCreatedToday: leadsToday,
      leadsLimitPerDay: 20,
      totalProperties: properties,
      propertiesLimit: 10,
    },
  });

  const renderWithProviders = (subscription: SubscriptionStatus, type: 'leads' | 'properties') => {
    setupAuth();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(subscription),
    });

    return render(
      <AuthProvider>
        <SubscriptionProvider>
          <UsageLimitBanner type={type} />
        </SubscriptionProvider>
      </AuthProvider>
    );
  };

  describe('Pro users', () => {
    it('should not render for pro users (leads)', async () => {
      renderWithProviders(mockProSubscription, 'leads');

      // Wait for subscription to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Give it time to render (or not)
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.queryByText(/Limit/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Upgrade' })).not.toBeInTheDocument();
    });

    it('should not render for pro users (properties)', async () => {
      renderWithProviders(mockProSubscription, 'properties');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.queryByText(/Limit/)).not.toBeInTheDocument();
    });
  });

  describe('Free users below 80% threshold', () => {
    it('should not render when leads usage is below 80%', async () => {
      // 15/20 = 75% - should not show
      renderWithProviders(createFreeSubscription(15, 0), 'leads');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.queryByText(/Limit/)).not.toBeInTheDocument();
    });

    it('should not render when properties usage is below 80%', async () => {
      // 7/10 = 70% - should not show
      renderWithProviders(createFreeSubscription(0, 7), 'properties');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.queryByText(/Limit/)).not.toBeInTheDocument();
    });
  });

  describe('Approaching limit (80-99%)', () => {
    it('should show warning when leads usage is at 80%', async () => {
      // 16/20 = 80% - should show warning
      renderWithProviders(createFreeSubscription(16, 0), 'leads');

      await waitFor(() => {
        expect(screen.getByText('Approaching Limit')).toBeInTheDocument();
      });

      expect(screen.getByText('16 / 20 leads today')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
    });

    it('should show warning when properties usage is at 80%', async () => {
      // 8/10 = 80% - should show warning
      renderWithProviders(createFreeSubscription(0, 8), 'properties');

      await waitFor(() => {
        expect(screen.getByText('Approaching Limit')).toBeInTheDocument();
      });

      expect(screen.getByText('8 / 10 properties')).toBeInTheDocument();
    });

    it('should show warning when leads usage is at 95%', async () => {
      // 19/20 = 95% - should show warning
      renderWithProviders(createFreeSubscription(19, 0), 'leads');

      await waitFor(() => {
        expect(screen.getByText('Approaching Limit')).toBeInTheDocument();
      });

      expect(screen.getByText('19 / 20 leads today')).toBeInTheDocument();
    });
  });

  describe('At limit (100%)', () => {
    it('should show error when leads usage is at 100%', async () => {
      // 20/20 = 100% - should show error
      renderWithProviders(createFreeSubscription(20, 0), 'leads');

      await waitFor(() => {
        expect(screen.getByText('Limit Reached')).toBeInTheDocument();
      });

      expect(screen.getByText('20 / 20 leads today')).toBeInTheDocument();
    });

    it('should show error when properties usage is at 100%', async () => {
      // 10/10 = 100% - should show error
      renderWithProviders(createFreeSubscription(0, 10), 'properties');

      await waitFor(() => {
        expect(screen.getByText('Limit Reached')).toBeInTheDocument();
      });

      expect(screen.getByText('10 / 10 properties')).toBeInTheDocument();
    });

    it('should show error when over 100%', async () => {
      // 25/20 = 125% (could happen if limit was lowered)
      renderWithProviders(createFreeSubscription(25, 0), 'leads');

      await waitFor(() => {
        expect(screen.getByText('Limit Reached')).toBeInTheDocument();
      });

      expect(screen.getByText('25 / 20 leads today')).toBeInTheDocument();
    });
  });

  describe('Upgrade button', () => {
    it('should trigger checkout session when clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createFreeSubscription(20, 0)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session-456' }),
        });

      setupAuth();
      render(
        <AuthProvider>
          <SubscriptionProvider>
            <UsageLimitBanner type="leads" />
          </SubscriptionProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Limit Reached')).toBeInTheDocument();
      });

      const upgradeButton = screen.getByRole('button', { name: 'Upgrade' });
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockLocation.href).toBe('https://checkout.stripe.com/session-456');
      }, { timeout: 3000 });
    });

    it('should handle checkout error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createFreeSubscription(20, 0)),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Checkout failed' }),
        });

      setupAuth();
      render(
        <AuthProvider>
          <SubscriptionProvider>
            <UsageLimitBanner type="leads" />
          </SubscriptionProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Limit Reached')).toBeInTheDocument();
      });

      const upgradeButton = screen.getByRole('button', { name: 'Upgrade' });
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to start checkout:',
          expect.any(Error)
        );
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });
  });

  describe('Progress bar', () => {
    it('should display progress bar', async () => {
      renderWithProviders(createFreeSubscription(18, 0), 'leads');

      await waitFor(() => {
        expect(screen.getByText('Approaching Limit')).toBeInTheDocument();
      });

      // MUI LinearProgress should be present
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
