import React, { useState } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Snackbar, Alert
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { useSubscription } from '../contexts/SubscriptionContext';
import { FREE_LIMITS, PRO_PRICE } from '../types/subscription';

const PricingPage: React.FC = () => {
  const { isPro, trialStatus, loading, createCheckoutSession, openCustomerPortal, isInTrial, daysRemaining } = useSubscription();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const freeFeatures = [
    `${FREE_LIMITS.leadsPerDay} property leads per day`,
    `${FREE_LIMITS.properties} total properties`,
    'Basic property analysis',
    'Contact management',
    'Bookkeeping',
  ];

  const proFeatures = [
    'Unlimited property leads',
    'Unlimited properties',
    'Investment reports (create & share)',
    'RentCast API integration',
    'SMS messaging',
    'Priority support',
  ];

  const handleUpgrade = async () => {
    try {
      await createCheckoutSession();
    } catch (err) {
      console.error('Failed to start checkout:', err);
      setErrorMessage('Failed to start checkout. Please try again.');
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (err) {
      console.error('Failed to open portal:', err);
      setErrorMessage('Failed to open subscription portal. Please try again.');
    }
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          Simple, Transparent Pricing
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Start free, upgrade when you need more
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {/* Free Tier */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Free
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h3" component="span" fontWeight="bold">
                  $0
                </Typography>
                <Typography variant="body1" component="span" color="text.secondary">
                  /month
                </Typography>
              </Box>
              <List dense>
                {freeFeatures.map((feature, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="outlined"
                fullWidth
                disabled
                sx={{ mt: 2 }}
              >
                {isPro ? 'Downgrade' : 'Current Plan'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Pro Tier */}
        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              height: '100%',
              border: 2,
              borderColor: 'primary.main',
              position: 'relative',
            }}
          >
            <Chip
              label="RECOMMENDED"
              color="primary"
              size="small"
              sx={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Pro
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h3" component="span" fontWeight="bold">
                  ${PRO_PRICE}
                </Typography>
                <Typography variant="body1" component="span" color="text.secondary">
                  /month
                </Typography>
              </Box>
              <List dense>
                {proFeatures.map((feature, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <StarIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              {isPro ? (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleManageSubscription}
                  sx={{ mt: 2 }}
                >
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleUpgrade}
                  sx={{ mt: 2 }}
                >
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current subscription info */}
      {trialStatus && (
        <Box textAlign="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            Current plan: <strong>{trialStatus.plan.toUpperCase()}</strong>
            {isInTrial && (
              <> &bull; {daysRemaining} days remaining in trial</>
            )}
            {trialStatus.currentPeriodEnd && (
              <> &bull; Renews {new Date(trialStatus.currentPeriodEnd).toLocaleDateString()}</>
            )}
          </Typography>
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PricingPage;
