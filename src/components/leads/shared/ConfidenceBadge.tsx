import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

export type ConfidenceSource = 'ai' | 'manual' | 'rentcast';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

interface ConfidenceBadgeProps {
  /** Confidence level: 'low', 'medium', 'high', or percentage (legacy) */
  confidence?: ConfidenceLevel | number;
  source?: ConfidenceSource;
  /** Optional note shown on hover (e.g., reason for manual override) */
  note?: string;
}

/**
 * Convert percentage to confidence level
 * - Low: < 50%
 * - Medium: 50-79%
 * - High: 80%+
 */
export const percentageToLevel = (pct?: number): ConfidenceLevel => {
  if (!pct || pct < 50) return 'low';
  if (pct < 80) return 'medium';
  return 'high';
};

/**
 * Get configuration for confidence badge based on source and confidence level
 */
const getConfidenceConfig = (
  confidence?: ConfidenceLevel | number,
  source?: ConfidenceSource
): { color: string; label: string } => {
  if (source === 'manual') {
    return { color: '#60a5fa', label: 'Manual Override' };
  }
  if (source === 'rentcast') {
    return { color: '#a78bfa', label: 'RentCast Verified' };
  }

  // AI source - convert percentage to level if needed
  let level: ConfidenceLevel;
  if (typeof confidence === 'number') {
    level = percentageToLevel(confidence);
  } else {
    level = confidence ?? 'low';
  }

  switch (level) {
    case 'high':
      return { color: '#4ade80', label: 'High Confidence' };
    case 'medium':
      return { color: '#fbbf24', label: 'Medium Confidence' };
    case 'low':
    default:
      return { color: '#f87171', label: 'Low Confidence' };
  }
};

/**
 * ConfidenceBadge - Shows the source and confidence level of an estimate
 *
 * Badge colors:
 * - AI High (80%+): Green dot - "High Confidence"
 * - AI Medium (50-79%): Yellow dot - "Medium Confidence"
 * - AI Low (<50%): Red dot - "Low Confidence"
 * - Manual Override: Blue dot
 * - RentCast Verified: Purple dot
 */
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  source,
  note,
}) => {
  const config = getConfidenceConfig(confidence, source);

  const badgeContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, cursor: note ? 'help' : 'default' }}>
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

  if (note) {
    return (
      <Tooltip
        title={`Note: "${note}"`}
        arrow
        placement="top"
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: '#21262d',
              color: '#f0f6fc',
              border: '1px solid #30363d',
              fontSize: '0.75rem',
              '& .MuiTooltip-arrow': {
                color: '#21262d',
              },
            },
          },
        }}
      >
        {badgeContent}
      </Tooltip>
    );
  }

  return badgeContent;
};

export default ConfidenceBadge;
