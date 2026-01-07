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

export const FREE_LIMITS = {
  leadsPerDay: 20,
  properties: 10,
};

export const PRO_PRICE = 49;
