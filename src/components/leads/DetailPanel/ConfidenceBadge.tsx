import React from 'react';
import { Box, Typography } from '@mui/material';

export type ConfidenceSource = 'ai' | 'manual' | 'rentcast';

interface ConfidenceBadgeProps {
  confidence?: number;
  source?: ConfidenceSource;
}

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
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, source }) => {
  const getConfidenceColor = (): string => {
    if (source === 'manual') return '#60a5fa'; // Blue for manual
    if (source === 'rentcast') return '#a78bfa'; // Purple for RentCast
    if (!confidence) return '#8b949e';
    if (confidence >= 80) return '#4ade80'; // Green for high
    if (confidence >= 50) return '#fbbf24'; // Yellow for medium
    return '#f87171'; // Red for low
  };

  const getConfidenceLevel = (conf: number): string => {
    if (conf >= 80) return 'High';
    if (conf >= 50) return 'Medium';
    return 'Low';
  };

  const getSourceLabel = (): string => {
    if (source === 'manual') return 'Manual Override';
    if (source === 'rentcast') return 'RentCast Verified';
    if (confidence === undefined || confidence === null) return 'Unknown';
    return `AI - ${getConfidenceLevel(confidence)} Confidence`;
  };

  const color = getConfidenceColor();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: color,
        }}
      />
      <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.7rem' }}>
        {getSourceLabel()}
      </Typography>
    </Box>
  );
};

export default ConfidenceBadge;
