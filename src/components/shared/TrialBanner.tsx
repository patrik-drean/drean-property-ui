import React from 'react';
import { Alert, Box, Button, LinearProgress, Typography } from '@mui/material';
import { Timer, Warning } from '@mui/icons-material';
import { useSubscription } from '../../contexts/SubscriptionContext';

export const TrialBanner: React.FC = () => {
  const { isInTrial, daysRemaining, createCheckoutSession } = useSubscription();

  if (!isInTrial) return null;

  const isLowDays = daysRemaining <= 7;
  const percentageUsed = ((60 - daysRemaining) / 60) * 100;

  const handleUpgrade = async () => {
    try {
      await createCheckoutSession();
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    }
  };

  return (
    <Alert
      severity={isLowDays ? 'warning' : 'info'}
      icon={isLowDays ? <Warning /> : <Timer />}
      action={
        <Button color="inherit" size="small" onClick={handleUpgrade}>
          Upgrade Now
        </Button>
      }
      sx={{ mb: 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2">
          {isLowDays
            ? `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your trial!`
            : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in trial`}
        </Typography>
        <Box sx={{ width: 100 }}>
          <LinearProgress
            variant="determinate"
            value={percentageUsed}
            color={isLowDays ? 'warning' : 'primary'}
          />
        </Box>
      </Box>
    </Alert>
  );
};
