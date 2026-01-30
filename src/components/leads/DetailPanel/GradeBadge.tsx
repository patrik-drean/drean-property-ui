import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { RawNeighborhoodGrade } from '../../../services/leadQueueService';

interface GradeBadgeProps {
  grade: string;
  showLabel?: boolean;
  /** Optional source of the grade (ai, manual, etc.) */
  source?: string;
  /** Raw neighborhood grade data for JSON tooltip display */
  rawGrade?: RawNeighborhoodGrade | null;
}

/**
 * Grade descriptions for the tooltip
 */
const gradeInfo: Record<string, { label: string; description: string; factors: string[] }> = {
  A: {
    label: 'Excellent',
    description: 'Premium location with strong fundamentals',
    factors: [
      'Low crime rates',
      'Top-rated schools',
      'High property values',
      'Strong appreciation potential',
    ],
  },
  B: {
    label: 'Good',
    description: 'Solid neighborhood with stable values',
    factors: [
      'Good schools',
      'Safe area',
      'Steady appreciation',
      'Strong rental demand',
    ],
  },
  C: {
    label: 'Average',
    description: 'Typical market conditions',
    factors: [
      'Average schools',
      'Moderate crime',
      'Standard appreciation',
      'Working class area',
    ],
  },
  D: {
    label: 'Below Average',
    description: 'May have some challenges',
    factors: [
      'Below average schools',
      'Higher crime rates',
      'Slower appreciation',
      'More landlord challenges',
    ],
  },
  F: {
    label: 'Poor',
    description: 'High risk area - proceed with caution',
    factors: [
      'Poor schools',
      'High crime',
      'Declining values',
      'Difficult tenant management',
    ],
  },
};

/**
 * Grade Tooltip Content
 */
const GradeTooltipContent: React.FC<{ grade: string; source?: string }> = ({ grade, source }) => {
  const info = gradeInfo[grade?.toUpperCase()] || gradeInfo['C'];
  const color = getGradeColor(grade);

  return (
    <Box sx={{ maxWidth: 280 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            bgcolor: `${color}20`,
            border: `2px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color, fontWeight: 700, fontSize: '0.9rem' }}>
            {grade?.toUpperCase() || '-'}
          </Typography>
        </Box>
        <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600 }}>
          {info.label} Neighborhood
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: '#8b949e', mb: 1.5 }}>
        {info.description}
      </Typography>

      <Box sx={{ borderTop: '1px solid #30363d', pt: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#6e7681', display: 'block', mb: 0.5 }}>
          Typical characteristics:
        </Typography>
        {info.factors.map((factor, index) => (
          <Typography
            key={index}
            variant="caption"
            sx={{ color: '#8b949e', display: 'block', pl: 1 }}
          >
            • {factor}
          </Typography>
        ))}
      </Box>

      {source && (
        <Box sx={{ borderTop: '1px solid #30363d', pt: 1, mt: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#6e7681' }}>
            Source:{' '}
            <Box component="span" sx={{ color: '#60a5fa', textTransform: 'capitalize' }}>
              {source}
            </Box>
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Get grade color
 */
const getGradeColor = (grade: string): string => {
  switch (grade?.toUpperCase()) {
    case 'A':
      return '#4ade80';
    case 'B':
      return '#60a5fa';
    case 'C':
      return '#fbbf24';
    case 'D':
      return '#f87171';
    case 'F':
      return '#ef4444';
    default:
      return '#8b949e';
  }
};

/**
 * Get grade label
 */
const getGradeLabel = (grade: string): string => {
  return gradeInfo[grade?.toUpperCase()]?.label || 'Unknown';
};

/**
 * GradeBadge - Displays neighborhood grade with color coding and rich tooltip
 *
 * Grades A-F with appropriate colors:
 * - A: Green (#4ade80) - Excellent
 * - B: Blue (#60a5fa) - Good
 * - C: Yellow (#fbbf24) - Average
 * - D: Red (#f87171) - Below Average
 * - F: Dark Red (#ef4444) - Poor
 */
export const GradeBadge: React.FC<GradeBadgeProps> = ({ grade, showLabel = true, source, rawGrade }) => {
  const color = getGradeColor(grade);

  const badgeContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'help' }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          bgcolor: `${color}20`,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            color,
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {grade?.toUpperCase() || '-'}
        </Typography>
      </Box>
      {showLabel && (
        <Typography variant="body2" sx={{ color: '#8b949e' }}>
          {getGradeLabel(grade)}-grade neighborhood
        </Typography>
      )}
    </Box>
  );

  // Raw JSON tooltip content
  const rawTooltipContent = rawGrade ? (
    <Box sx={{ maxWidth: 400 }}>
      <Typography
        variant="caption"
        sx={{ color: '#8b949e', display: 'block', mb: 1, fontWeight: 600 }}
      >
        NeighborhoodGrade
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
        <code>{JSON.stringify(rawGrade, null, 2)}</code>
      </Box>
    </Box>
  ) : null;

  return (
    <Tooltip
      title={rawGrade ? rawTooltipContent : <GradeTooltipContent grade={grade} source={source} />}
      arrow
      placement="top"
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#1c2128',
            border: '1px solid #30363d',
            maxWidth: rawGrade ? 420 : 320,
            p: rawGrade ? 1.5 : 2,
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

export default GradeBadge;
