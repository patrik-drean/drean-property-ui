// New trial status response from API
export interface TrialStatus {
  plan: 'pro' | 'trial' | 'expired';
  isInTrial: boolean;
  isTrialExpired: boolean;
  hasActiveSubscription: boolean;
  subscriptionOverride: boolean;
  daysRemaining: number;
  trialEndDate: string | null;
  currentPeriodEnd: string | null;
  usage: TrialUsage;
}

export interface TrialUsage {
  // Existing limits
  leadsCreatedToday: number;
  leadsLimitPerDay: number;
  totalProperties: number;
  propertiesLimit: number;

  // New trial limits
  rentCastRequestsToday: number;
  rentCastLimitPerDay: number;
  aiLeadScoresToday: number;
  aiLeadScoresLimitPerDay: number;
  messagingAllowed: boolean;
}

// Legacy type for backwards compatibility
export interface SubscriptionStatus {
  plan: 'free' | 'pro';
  hasActiveSubscription: boolean;
  subscriptionOverride: boolean;
  currentPeriodEnd: string | null;
  usage: UsageLimits;
}

export interface UsageLimits {
  leadsCreatedToday: number;
  leadsLimitPerDay: number;
  totalProperties: number;
  propertiesLimit: number;
}

// Trial configuration constants
export const TRIAL_LIMITS = {
  durationDays: 60,
  rentCastPerDay: 3,
  aiScoresPerDay: 50,
};

export const FREE_LIMITS = {
  leadsPerDay: 20,
  properties: 10,
};

export const PRO_PRICE = 29;  // Beta price
export const CONTACT_EMAIL = 'team@redlunaproperty.com';
