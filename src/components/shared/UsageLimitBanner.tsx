import React from 'react';
import { Alert, AlertTitle, Button, LinearProgress, Box } from '@mui/material';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface UsageLimitBannerProps {
  type: 'leads' | 'properties';
}

export const UsageLimitBanner: React.FC<UsageLimitBannerProps> = ({ type }) => {
  const { trialStatus, isPro, createCheckoutSession } = useSubscription();

  if (isPro || !trialStatus) return null;

  const usage = type === 'leads'
    ? { current: trialStatus.usage.leadsCreatedToday, limit: trialStatus.usage.leadsLimitPerDay, label: 'leads today' }
    : { current: trialStatus.usage.totalProperties, limit: trialStatus.usage.propertiesLimit, label: 'properties' };

  const percentage = (usage.current / usage.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usage.current >= usage.limit;

  if (!isNearLimit) return null;

  const handleUpgrade = async () => {
    try {
      await createCheckoutSession();
    } catch (err) {
      console.error('Failed to start checkout:', err);
    }
  };

  return (
    <Alert
      severity={isAtLimit ? 'error' : 'warning'}
      action={
        <Button color="inherit" size="small" onClick={handleUpgrade}>
          Upgrade
        </Button>
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        {isAtLimit ? 'Limit Reached' : 'Approaching Limit'}
      </AlertTitle>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          {usage.current} / {usage.limit} {usage.label}
        </Box>
        <Box sx={{ width: 100 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentage, 100)}
            color={isAtLimit ? 'error' : 'warning'}
          />
        </Box>
      </Box>
    </Alert>
  );
};

export default UsageLimitBanner;
