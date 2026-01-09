import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TrialStatus, TRIAL_LIMITS } from '../types/subscription';
import { useAuth } from './AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

interface SubscriptionContextType {
  trialStatus: TrialStatus | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;

  // Computed helpers
  isPro: boolean;
  isInTrial: boolean;
  isTrialExpired: boolean;
  canAccessApp: boolean;
  canCreateLead: boolean;
  canCreateProperty: boolean;
  canUseRentCast: boolean;
  canScoreWithAi: boolean;
  canAccessMessaging: boolean;
  daysRemaining: number;

  // Actions
  createCheckoutSession: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setTrialStatus(null);
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

      const data: TrialStatus = await response.json();
      setTrialStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError('Failed to load subscription status');
      // Default to trial status on error
      setTrialStatus({
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
          rentCastLimitPerDay: TRIAL_LIMITS.rentCastPerDay,
          aiLeadScoresToday: 0,
          aiLeadScoresLimitPerDay: TRIAL_LIMITS.aiScoresPerDay,
          messagingAllowed: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Computed helpers
  const isPro = trialStatus?.hasActiveSubscription || trialStatus?.subscriptionOverride || false;
  const isInTrial = trialStatus?.isInTrial || false;
  const isTrialExpired = trialStatus?.isTrialExpired || false;
  const canAccessApp = isPro || isInTrial;
  const daysRemaining = trialStatus?.daysRemaining || 0;

  const canCreateLead = isPro ||
    (trialStatus?.usage.leadsCreatedToday ?? 0) < (trialStatus?.usage.leadsLimitPerDay ?? 20);

  const canCreateProperty = isPro ||
    (trialStatus?.usage.totalProperties ?? 0) < (trialStatus?.usage.propertiesLimit ?? 10);

  const canUseRentCast = isPro ||
    (trialStatus?.usage.rentCastRequestsToday ?? 0) < (trialStatus?.usage.rentCastLimitPerDay ?? TRIAL_LIMITS.rentCastPerDay);

  const canScoreWithAi = isPro ||
    (trialStatus?.usage.aiLeadScoresToday ?? 0) < (trialStatus?.usage.aiLeadScoresLimitPerDay ?? TRIAL_LIMITS.aiScoresPerDay);

  const canAccessMessaging = trialStatus?.usage.messagingAllowed || false;

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
      trialStatus,
      loading,
      error,
      refreshSubscription,
      isPro,
      isInTrial,
      isTrialExpired,
      canAccessApp,
      canCreateLead,
      canCreateProperty,
      canUseRentCast,
      canScoreWithAi,
      canAccessMessaging,
      daysRemaining,
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
