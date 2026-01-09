import React from 'react';
import { Box, Typography, Button, Paper, Link } from '@mui/material';
import { LockOutlined, Email } from '@mui/icons-material';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { CONTACT_EMAIL, PRO_PRICE } from '../../types/subscription';

export const TrialExpiredPaywall: React.FC = () => {
  const { createCheckoutSession } = useSubscription();

  const handleSubscribe = async () => {
    try {
      await createCheckoutSession();
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 450,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <LockOutlined sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />

        <Typography variant="h4" gutterBottom fontWeight="bold">
          Trial Expired
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your 60-day free trial has ended. Subscribe to continue analyzing deals,
          tracking leads, and growing your real estate portfolio.
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubscribe}
          sx={{ mb: 2 }}
        >
          Subscribe Now - ${PRO_PRICE}/month
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Email fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Questions? Contact us at{' '}
            <Link href={`mailto:${CONTACT_EMAIL}`} color="primary">
              {CONTACT_EMAIL}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
