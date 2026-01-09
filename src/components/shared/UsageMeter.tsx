import React from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';

interface UsageMeterProps {
  label: string;
  current: number;
  limit: number;
  compact?: boolean;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  label,
  current,
  limit,
  compact = false,
}) => {
  // Handle unlimited (int.MaxValue from backend)
  const isUnlimited = limit > 1000000;
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  const isAtLimit = !isUnlimited && current >= limit;

  if (compact) {
    return (
      <Tooltip title={`${current}/${isUnlimited ? 'Unlimited' : limit} ${label}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color={isAtLimit ? 'error' : 'text.secondary'}>
            {current}/{isUnlimited ? '\u221E' : limit}
          </Typography>
          <Box sx={{ width: 40 }}>
            <LinearProgress
              variant="determinate"
              value={isUnlimited ? 0 : Math.min(percentage, 100)}
              color={isAtLimit ? 'error' : 'primary'}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color={isAtLimit ? 'error' : 'text.secondary'}>
          {current}/{isUnlimited ? 'Unlimited' : limit}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={isUnlimited ? 0 : Math.min(percentage, 100)}
        color={isAtLimit ? 'error' : 'primary'}
      />
    </Box>
  );
};
