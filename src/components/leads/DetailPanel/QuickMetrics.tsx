import React, { useMemo } from 'react';
import { Box, Typography, Tooltip, Grid } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { QueueLead, getScoreColor, getScoreLabel, getSpreadColor, calculateScoreFromSpread } from '../../../types/queue';
import { formatCurrency } from '../../../utils/currencyUtils';

interface QuickMetricsProps {
  lead: QueueLead;
}

/**
 * Confidence indicator dot
 */
const ConfidenceDot: React.FC<{ confidence?: number }> = ({ confidence }) => {
  if (confidence === undefined || confidence === null) return null;

  const getConfidenceColor = (conf: number): string => {
    if (conf >= 70) return '#4ade80'; // High - green
    if (conf >= 40) return '#fbbf24'; // Medium - yellow
    return '#f87171'; // Low - red
  };

  return (
    <Tooltip title={`${confidence}% confidence`} arrow placement="top">
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: getConfidenceColor(confidence),
          display: 'inline-block',
          ml: 0.5,
          cursor: 'help',
        }}
      />
    </Tooltip>
  );
};

/**
 * Neighborhood grade badge (compact)
 */
const GradeBadgeCompact: React.FC<{ grade?: string | null }> = ({ grade }) => {
  const getGradeColor = (g: string): string => {
    switch (g?.toUpperCase()) {
      case 'A': return '#4ade80';
      case 'B': return '#60a5fa';
      case 'C': return '#fbbf24';
      case 'D': return '#f87171';
      case 'F': return '#ef4444';
      default: return '#8b949e';
    }
  };

  const color = getGradeColor(grade || '');

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '6px',
        bgcolor: `${color}20`,
        border: `1.5px solid ${color}`,
      }}
    >
      <Typography sx={{ color, fontWeight: 700, fontSize: '0.75rem' }}>
        {grade?.toUpperCase() || '-'}
      </Typography>
    </Box>
  );
};

/**
 * Mini score ring (very compact)
 */
const MiniScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const size = 36;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = getScoreColor(score);

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#30363d"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#f0f6fc' }}>
          {score.toFixed(0)}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * MAO Tooltip Content - shows spread %, formula, and interpretation
 */
const MaoTooltipContent: React.FC<{
  mao: number;
  spreadPercent: number;
  listingPrice: number;
  arv: number;
  rehab: number;
}> = ({ mao, spreadPercent, listingPrice, arv, rehab }) => {
  const spreadColor = getSpreadColor(spreadPercent);
  const isGoodDeal = spreadPercent <= 15;
  const isBelowMao = spreadPercent < 0;

  const spreadInterpretation = isBelowMao
    ? `Listing is ${Math.abs(spreadPercent).toFixed(0)}% BELOW MAO - excellent margin`
    : spreadPercent <= 15
    ? `Listing is ${spreadPercent.toFixed(0)}% above MAO - room to negotiate`
    : `Listing is ${spreadPercent.toFixed(0)}% above MAO - challenging`;

  return (
    <Box sx={{ maxWidth: 280 }}>
      <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 1 }}>
        MAO: {formatCurrency(mao)}
      </Typography>

      {/* Spread */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
          Spread:{' '}
          <Box component="span" sx={{ color: spreadColor, fontWeight: 600 }}>
            {isBelowMao ? `-${Math.abs(spreadPercent).toFixed(1)}%` : `+${spreadPercent.toFixed(1)}%`}
          </Box>
        </Typography>
        <Typography variant="caption" sx={{ color: isGoodDeal ? '#4ade80' : '#8b949e' }}>
          {spreadInterpretation}
        </Typography>
      </Box>

      {/* Formula */}
      <Box sx={{ borderTop: '1px solid #30363d', pt: 1, mt: 1 }}>
        <Typography variant="caption" sx={{ color: '#6e7681', display: 'block', mb: 0.5 }}>
          Formula: (ARV × 70%) - Rehab - $5K
        </Typography>
        <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
          ({formatCurrency(arv)} × 0.7) - {formatCurrency(rehab)} - $5,000
        </Typography>
      </Box>

      {/* Gap */}
      <Box sx={{ borderTop: '1px solid #30363d', pt: 1, mt: 1 }}>
        <Typography variant="body2" sx={{ color: '#8b949e' }}>
          Gap from listing: {formatCurrency(Math.abs(listingPrice - mao))}
          {isBelowMao ? ' (below)' : ' (above)'}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * QuickMetrics - Dense grid display of key deal metrics
 *
 * Shows: Score, ARV, Rehab, MAO (with spread tooltip), Neighborhood Grade
 * Designed to be compact and scannable at a glance.
 */
export const QuickMetrics: React.FC<QuickMetricsProps> = ({ lead }) => {
  const metrics = lead.metrics;
  const listingPrice = lead.listingPrice;

  // Get values from metrics or lead-level fields
  const arv = metrics?.arv ?? 0;
  const rehab = metrics?.rehabEstimate ?? 0;
  const arvConfidence = metrics?.arvConfidence;
  const rehabConfidence = metrics?.rehabConfidence;
  const neighborhoodGrade = lead.neighborhoodGrade || metrics?.neighborhoodGrade;

  // Calculate MAO and spread
  const calculatedMao = useMemo(() => {
    return Math.round(arv * 0.7 - rehab - 5000);
  }, [arv, rehab]);

  const calculatedSpread = useMemo(() => {
    if (listingPrice === 0) return 0;
    return ((listingPrice - calculatedMao) / listingPrice) * 100;
  }, [listingPrice, calculatedMao]);

  const calculatedScore = useMemo(() => {
    return calculateScoreFromSpread(calculatedSpread);
  }, [calculatedSpread]);

  // Use lead's score if available, otherwise calculated
  const displayScore = lead.leadScore ?? calculatedScore;
  const displayMao = lead.mao ?? calculatedMao;
  const displaySpread = lead.spreadPercent ?? calculatedSpread;

  const scoreColor = getScoreColor(displayScore);
  const spreadColor = getSpreadColor(displaySpread);

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #30363d' }}>
      {/* Row 1: Score + Neighborhood */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MiniScoreRing score={displayScore} />
            <Box>
              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>
                Score
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: scoreColor, fontWeight: 600, fontSize: '0.8rem', lineHeight: 1 }}
              >
                {getScoreLabel(displayScore)}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GradeBadgeCompact grade={neighborhoodGrade} />
            <Box>
              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>
                Neighborhood
              </Typography>
              <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 500, fontSize: '0.8rem', lineHeight: 1 }}>
                Grade {neighborhoodGrade?.toUpperCase() || '-'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Row 2: ARV | Rehab | MAO - responsive: 3 cols on sm+, 2 cols on xs */}
      <Grid container spacing={1.5}>
        <Grid item xs={6} sm={4}>
          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
            ARV
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 600, fontSize: '0.85rem' }}>
              {arv > 0 ? formatCurrency(arv) : '-'}
            </Typography>
            <ConfidenceDot confidence={arvConfidence} />
          </Box>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
            Rehab
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 600, fontSize: '0.85rem' }}>
              {rehab > 0 ? formatCurrency(rehab) : '-'}
            </Typography>
            <ConfidenceDot confidence={rehabConfidence} />
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
            MAO
          </Typography>
          <Tooltip
            title={
              <MaoTooltipContent
                mao={displayMao}
                spreadPercent={displaySpread}
                listingPrice={listingPrice}
                arv={arv}
                rehab={rehab}
              />
            }
            arrow
            placement="top"
            enterDelay={200}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: '#1c2128',
                  border: '1px solid #30363d',
                  maxWidth: 320,
                  p: 1.5,
                  '& .MuiTooltip-arrow': {
                    color: '#1c2128',
                    '&::before': { border: '1px solid #30363d' },
                  },
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
              <Typography
                variant="body2"
                sx={{ color: spreadColor, fontWeight: 600, fontSize: '0.85rem' }}
              >
                {displayMao > 0 ? formatCurrency(displayMao) : '-'}
              </Typography>
              <InfoIcon sx={{ fontSize: 12, color: '#8b949e', ml: 0.5 }} />
            </Box>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickMetrics;
