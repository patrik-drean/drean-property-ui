import React from 'react';
import { Box, Typography } from '@mui/material';

export type ConfidenceSource = 'ai' | 'manual' | 'rentcast';

interface ConfidenceBadgeProps {
  confidence?: number;
  source?: ConfidenceSource;
}

/**
 * Get configuration for confidence badge based on source and confidence level
 */
const getConfidenceConfig = (
  confidence?: number,
  source?: ConfidenceSource
): { color: string; label: string } => {
  if (source === 'manual') {
    return { color: '#60a5fa', label: 'Manual Override' };
  }
  if (source === 'rentcast') {
    return { color: '#a78bfa', label: 'RentCast Verified' };
  }
  // AI source
  if (!confidence) return { color: '#8b949e', label: 'AI' };
  if (confidence >= 80)
    return { color: '#4ade80', label: `AI - ${confidence}% Confidence` };
  if (confidence >= 50)
    return { color: '#fbbf24', label: `AI - ${confidence}% Confidence` };
  return { color: '#f87171', label: `AI - ${confidence}% Confidence (Low)` };
};

/**
 * ConfidenceBadge - Shows the source and confidence level of an estimate
 *
 * Badge colors:
 * - AI High (80%+): Green dot
 * - AI Medium (50-79%): Yellow dot
 * - AI Low (<50%): Red dot
 * - Manual Override: Blue dot
 * - RentCast Verified: Purple dot
 */
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  source,
}) => {
  const config = getConfidenceConfig(confidence, source);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: config.color,
        }}
      />
      <Typography variant="caption" sx={{ color: '#8b949e' }}>
        {config.label}
      </Typography>
    </Box>
  );
};

export default ConfidenceBadge;
