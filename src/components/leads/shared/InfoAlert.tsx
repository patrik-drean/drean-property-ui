import React from 'react';
import { Box, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

interface InfoAlertProps {
  message: string;
}

/**
 * InfoAlert - Informational alert box with blue styling
 * Used to show contextual hints during editing
 */
export const InfoAlert: React.FC<InfoAlertProps> = ({ message }) => (
  <Box
    sx={{
      p: 1.5,
      mb: 1,
      bgcolor: 'rgba(96, 165, 250, 0.1)',
      border: '1px solid rgba(96, 165, 250, 0.3)',
      borderRadius: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <InfoIcon sx={{ color: '#60a5fa', fontSize: '1rem' }} />
    <Typography variant="caption" sx={{ color: '#60a5fa' }}>
      {message}
    </Typography>
  </Box>
);

export default InfoAlert;
