import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { getScoreColor, getNeighborhoodGradeColor, getSpreadColor } from '../../../types/queue';

interface MetricsGridProps {
  score: number | null;
  mao: number | null;
  spreadPercent: number | null;
  neighborhoodGrade: string | null;
}

interface MetricItemProps {
  label: string;
  value: string;
  color: string;
  tooltip?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, color, tooltip }) => {
  const content = (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        variant="caption"
        sx={{ color: '#8b949e', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}
      >
        {value}
      </Typography>
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
};

/**
 * MetricsGrid - displays key metrics (Score, MAO, Spread%, Grade) in a compact grid
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  score,
  mao,
  spreadPercent,
  neighborhoodGrade,
}) => {
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const formatSpread = (value: number | null) => {
    if (value === null) return '-';
    return `${Math.round(value)}%`;  // Round to whole number
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1.5,
        p: 1.5,
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 1,
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <MetricItem
        label="Score"
        value={score !== null ? String(score) : '-'}
        color={getScoreColor(score)}
        tooltip="Lead score based on MAO spread and property metrics (1-10)"
      />
      <MetricItem
        label="MAO"
        value={formatCurrency(mao)}
        color="#f0f6fc"
        tooltip="Maximum Allowable Offer = (ARV × 70%) - Rehab - $5k"
      />
      <MetricItem
        label="Spread"
        value={formatSpread(spreadPercent)}
        color={getSpreadColor(spreadPercent)}
        tooltip="Difference between listing price and MAO as percentage"
      />
      <MetricItem
        label="Grade"
        value={neighborhoodGrade || '-'}
        color={getNeighborhoodGradeColor(neighborhoodGrade)}
        tooltip="Neighborhood quality grade (A-F)"
      />
    </Box>
  );
};

export default MetricsGrid;
