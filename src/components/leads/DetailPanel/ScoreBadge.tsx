import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { getScoreColor, getScoreLabel, getSpreadColor } from '../../../types/queue';
import { RawScore } from '../../../services/leadQueueService';

interface ScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  /** Optional spread percentage for tooltip */
  spreadPercent?: number | null;
  /** Optional MAO for tooltip */
  mao?: number | null;
  /** Optional listing price for tooltip */
  listingPrice?: number | null;
  /** Raw score data for JSON tooltip display */
  rawScore?: RawScore | null;
}

/**
 * Score Tooltip Content - shows breakdown of how score was calculated
 */
const ScoreTooltipContent: React.FC<{
  score: number;
  spreadPercent?: number | null;
  mao?: number | null;
  listingPrice?: number | null;
}> = ({ score, spreadPercent, mao, listingPrice }) => (
  <Box sx={{ maxWidth: 280 }}>
    <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 1 }}>
      Lead Score: {score.toFixed(1)}/10
    </Typography>

    <Box
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: `${getScoreColor(score)}20`,
        border: `1px solid ${getScoreColor(score)}`,
        mb: 1.5,
      }}
    >
      <Typography variant="caption" sx={{ color: getScoreColor(score), fontWeight: 600 }}>
        {getScoreLabel(score)}
      </Typography>
    </Box>

    <Typography variant="body2" sx={{ color: '#8b949e', mb: 1 }}>
      Score is calculated based on the MAO spread percentage - how far the listing price is from your maximum offer.
    </Typography>

    {spreadPercent !== null && spreadPercent !== undefined && (
      <Box sx={{ borderTop: '1px solid #30363d', pt: 1, mt: 1 }}>
        <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
          MAO Spread:{' '}
          <Box component="span" sx={{ color: getSpreadColor(spreadPercent), fontWeight: 600 }}>
            {Math.round(spreadPercent)}%
          </Box>
        </Typography>

        {mao !== null && mao !== undefined && listingPrice !== null && listingPrice !== undefined && (
          <Typography variant="body2" sx={{ color: '#8b949e' }}>
            Gap: ${(listingPrice - mao).toLocaleString()}
          </Typography>
        )}
      </Box>
    )}

    <Box sx={{ borderTop: '1px solid #30363d', pt: 1, mt: 1 }}>
      <Typography variant="caption" sx={{ color: '#6e7681', display: 'block' }}>
        Score thresholds:
      </Typography>
      <Typography variant="caption" sx={{ color: '#6e7681', display: 'block' }}>
        9-10: ≤15% spread (Amazing) | 7-8: ≤25% (Great)
      </Typography>
      <Typography variant="caption" sx={{ color: '#6e7681', display: 'block' }}>
        5-6: ≤40% (Good) | 3-4: ≤60% (Fair) | 1-2: &gt;60% (Poor)
      </Typography>
    </Box>
  </Box>
);

/**
 * ScoreBadge - Circular ring score display for lead scores
 *
 * Features:
 * - Animated SVG ring that fills based on score percentage
 * - Color-coded based on MAO spread scoring (uses centralized helpers)
 * - Three size variants for different contexts
 * - Optional label underneath (e.g., "Amazing", "Great", etc.)
 * - Rich tooltip showing score breakdown on hover
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'medium',
  showLabel = true,
  spreadPercent,
  mao,
  listingPrice,
  rawScore,
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

  const badgeContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'help' }}>
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

  // Raw JSON tooltip content
  const rawTooltipContent = rawScore ? (
    <Box sx={{ maxWidth: 400 }}>
      <Typography
        variant="caption"
        sx={{ color: '#8b949e', display: 'block', mb: 1, fontWeight: 600 }}
      >
        Score
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 0,
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '0.7rem',
          lineHeight: 1.4,
          color: '#f0f6fc',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{JSON.stringify(rawScore, null, 2)}</code>
      </Box>
    </Box>
  ) : null;

  return (
    <Tooltip
      title={
        rawScore ? rawTooltipContent : (
          <ScoreTooltipContent
            score={score}
            spreadPercent={spreadPercent}
            mao={mao}
            listingPrice={listingPrice}
          />
        )
      }
      arrow
      placement="bottom"
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#1c2128',
            border: '1px solid #30363d',
            maxWidth: rawScore ? 420 : 320,
            p: rawScore ? 1.5 : 2,
            '& .MuiTooltip-arrow': {
              color: '#1c2128',
              '&::before': {
                border: '1px solid #30363d',
              },
            },
          },
        },
      }}
    >
      {badgeContent}
    </Tooltip>
  );
};

export default ScoreBadge;
