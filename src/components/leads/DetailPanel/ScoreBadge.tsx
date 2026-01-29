import React from 'react';
import { Box, Typography } from '@mui/material';
import { getScoreColor, getScoreLabel } from '../../../types/queue';

interface ScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * ScoreBadge - Circular ring score display for lead scores
 *
 * Features:
 * - Animated SVG ring that fills based on score percentage
 * - Color-coded based on MAO spread scoring (uses centralized helpers)
 * - Three size variants for different contexts
 * - Optional label underneath (e.g., "Amazing", "Great", etc.)
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'medium',
  showLabel = true,
}) => {

  const sizes = {
    small: { ring: 48, stroke: 4, fontSize: '1rem' },
    medium: { ring: 72, stroke: 5, fontSize: '1.5rem' },
    large: { ring: 96, stroke: 6, fontSize: '2rem' },
  };

  const { ring, stroke, fontSize } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = getScoreColor(score);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Circular Score Ring */}
      <Box sx={{ position: 'relative', width: ring, height: ring }}>
        <svg width={ring} height={ring} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="transparent"
            stroke="#30363d"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        {/* Score number */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize,
              fontWeight: 700,
              color: '#f0f6fc',
              lineHeight: 1,
            }}
          >
            {score.toFixed(1)}
          </Typography>
        </Box>
      </Box>

      {/* Label */}
      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            color,
            fontWeight: 600,
            letterSpacing: '0.05em',
            mt: 1,
            fontSize: size === 'small' ? '0.6rem' : '0.7rem',
          }}
        >
          {getScoreLabel(score)}
        </Typography>
      )}
    </Box>
  );
};

export default ScoreBadge;
