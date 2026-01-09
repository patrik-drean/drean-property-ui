import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Lock, Message } from '@mui/icons-material';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { PRO_PRICE } from '../../types/subscription';

export const MessagingLockedOverlay: React.FC = () => {
  const { createCheckoutSession } = useSubscription();

  const handleUpgrade = async () => {
    try {
      await createCheckoutSession();
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 3,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
          <Message sx={{ fontSize: 64, color: 'action.disabled' }} />
          <Lock
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              fontSize: 24,
              color: 'warning.main',
              bgcolor: 'background.paper',
              borderRadius: '50%',
            }}
          />
        </Box>

        <Typography variant="h5" gutterBottom>
          Messaging Locked
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          SMS messaging is a Pro feature. Upgrade to contact sellers directly
          from PropGuide with automated outreach.
        </Typography>

        <Button
          variant="contained"
          onClick={handleUpgrade}
          size="large"
        >
          Upgrade to Pro - ${PRO_PRICE}/month
        </Button>
      </Paper>
    </Box>
  );
};
