/**
 * Unit tests for UpgradeOverlay component
 *
 * Tests:
 * - Renders children when isPro is true
 * - Renders overlay when isPro is false
 * - showOverlay prop overrides automatic detection
 * - Upgrade button triggers checkout session
 * - Displays correct feature name and price
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpgradeOverlay } from '../UpgradeOverlay';
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

describe('UpgradeOverlay', () => {
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

  const renderWithProviders = (subscription: SubscriptionStatus, children: React.ReactNode) => {
    setupAuth();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(subscription),
    });

    return render(
      <AuthProvider>
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </AuthProvider>
    );
  };

  it('should render children without overlay when isPro is true', async () => {
    renderWithProviders(
      mockProSubscription,
      <UpgradeOverlay feature="Investment Reports">
        <div data-testid="content">Pro Content</div>
      </UpgradeOverlay>
    );

    // Wait for subscription to fully load (isPro becomes true)
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
      // Once isPro is true, overlay should be gone
      expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render overlay when isPro is false', async () => {
    renderWithProviders(
      mockFreeSubscription,
      <UpgradeOverlay feature="Investment Reports">
        <div data-testid="content">Pro Content</div>
      </UpgradeOverlay>
    );

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    // Should show feature name in message
    expect(screen.getByText(/Investment Reports is a Pro feature/)).toBeInTheDocument();

    // Should show price
    expect(screen.getByRole('button', { name: /Upgrade for \$49\/mo/ })).toBeInTheDocument();

    // Content should be blurred (check the parent has blur style)
    const content = screen.getByTestId('content');
    const blurredContainer = content.parentElement;
    expect(blurredContainer).toHaveStyle({ filter: 'blur(2px)' });
  });

  it('should allow showOverlay prop to override automatic detection (force show)', async () => {
    renderWithProviders(
      mockProSubscription,
      <UpgradeOverlay feature="Test Feature" showOverlay={true}>
        <div data-testid="content">Content</div>
      </UpgradeOverlay>
    );

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    // Should show overlay even though user is pro
    expect(screen.getByText(/Test Feature is a Pro feature/)).toBeInTheDocument();
  });

  it('should allow showOverlay prop to override automatic detection (force hide)', async () => {
    renderWithProviders(
      mockFreeSubscription,
      <UpgradeOverlay feature="Test Feature" showOverlay={false}>
        <div data-testid="content">Content</div>
      </UpgradeOverlay>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    // Should NOT show overlay even though user is free
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });

  it('should trigger checkout session when upgrade button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFreeSubscription),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session-123' }),
      });

    setupAuth();
    render(
      <AuthProvider>
        <SubscriptionProvider>
          <UpgradeOverlay feature="SMS Messaging">
            <div data-testid="content">Content</div>
          </UpgradeOverlay>
        </SubscriptionProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByRole('button', { name: /Upgrade for \$49\/mo/ });
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockLocation.href).toBe('https://checkout.stripe.com/session-123');
    }, { timeout: 3000 });
  });

  it('should handle checkout error gracefully', async () => {
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
          <UpgradeOverlay feature="Test Feature">
            <div data-testid="content">Content</div>
          </UpgradeOverlay>
        </SubscriptionProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByRole('button', { name: /Upgrade for \$49\/mo/ });
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to start checkout:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should display lock icon in overlay', async () => {
    renderWithProviders(
      mockFreeSubscription,
      <UpgradeOverlay feature="Test Feature">
        <div data-testid="content">Content</div>
      </UpgradeOverlay>
    );

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    // Lock icon should be present (MUI renders it as svg with data-testid)
    expect(screen.getByTestId('LockIcon')).toBeInTheDocument();
  });
});
