import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { PRO_PRICE } from '../../types/subscription';

interface UpgradeOverlayProps {
  feature: string;
  children: React.ReactNode;
  showOverlay?: boolean; // Override automatic detection
}

export const UpgradeOverlay: React.FC<UpgradeOverlayProps> = ({
  feature,
  children,
  showOverlay
}) => {
  const { isPro, createCheckoutSession } = useSubscription();

  const shouldShowOverlay = showOverlay ?? !isPro;

  if (!shouldShowOverlay) {
    return <>{children}</>;
  }

  const handleUpgrade = async () => {
    try {
      await createCheckoutSession();
    } catch (err) {
      console.error('Failed to start checkout:', err);
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{
        filter: 'blur(2px)',
        opacity: 0.6,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {children}
      </Box>
      <Paper
        elevation={4}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          p: 3,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          maxWidth: 300,
          zIndex: 10,
        }}
      >
        <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Upgrade to Pro
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {feature} is a Pro feature. Upgrade to unlock unlimited access.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<StarIcon />}
          onClick={handleUpgrade}
        >
          Upgrade for ${PRO_PRICE}/mo
        </Button>
      </Paper>
    </Box>
  );
};

export default UpgradeOverlay;
