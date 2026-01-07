import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SubscriptionStatus } from '../types/subscription';
import { useAuth } from './AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  isPro: boolean;
  canCreateLead: boolean;
  canCreateProperty: boolean;
  createCheckoutSession: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data: SubscriptionStatus = await response.json();
      setSubscription(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError('Failed to load subscription status');
      // Default to free tier on error
      setSubscription({
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
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const isPro = subscription?.hasActiveSubscription ?? false;

  const canCreateLead = isPro ||
    (subscription?.usage.leadsCreatedToday ?? 0) < (subscription?.usage.leadsLimitPerDay ?? 20);

  const canCreateProperty = isPro ||
    (subscription?.usage.totalProperties ?? 0) < (subscription?.usage.propertiesLimit ?? 10);

  const createCheckoutSession = async () => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/#/settings?checkout=success`,
          cancelUrl: `${window.location.origin}/#/pricing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to open customer portal');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error('Failed to open customer portal:', err);
      throw err;
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      loading,
      error,
      refreshSubscription,
      isPro,
      canCreateLead,
      canCreateProperty,
      createCheckoutSession,
      openCustomerPortal,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
