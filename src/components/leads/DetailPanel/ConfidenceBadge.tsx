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
 * Get confidence color based on level
 */
const getConfidenceColor = (
  confidence?: ConfidenceLevel | number,
  source?: ConfidenceSource
): string => {
  if (source === 'manual') return '#60a5fa'; // Blue for manual
  if (source === 'rentcast') return '#a78bfa'; // Purple for RentCast

  // AI source - convert percentage to level if needed
  let level: ConfidenceLevel;
  if (typeof confidence === 'number') {
    level = percentageToLevel(confidence);
  } else {
    level = confidence ?? 'low';
  }

  switch (level) {
    case 'high':
      return '#4ade80'; // Green for high
    case 'medium':
      return '#fbbf24'; // Yellow for medium
    case 'low':
    default:
      return '#f87171'; // Red for low
  }
};

/**
 * Get source label based on source and confidence level
 */
const getSourceLabel = (
  confidence?: ConfidenceLevel | number,
  source?: ConfidenceSource
): string => {
  if (source === 'manual') return 'Manual Override';
  if (source === 'rentcast') return 'RentCast Verified';

  // AI source - convert percentage to level if needed
  let level: ConfidenceLevel;
  if (typeof confidence === 'number') {
    level = percentageToLevel(confidence);
  } else if (confidence === undefined || confidence === null) {
    return 'Low Confidence';
  } else {
    level = confidence;
  }

  switch (level) {
    case 'high':
      return 'High Confidence';
    case 'medium':
      return 'Medium Confidence';
    case 'low':
    default:
      return 'Low Confidence';
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
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, source, note }) => {
  const color = getConfidenceColor(confidence, source);
  const label = getSourceLabel(confidence, source);

  const badgeContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: note ? 'help' : 'default' }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: color,
        }}
      />
      <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.7rem' }}>
        {label}
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
