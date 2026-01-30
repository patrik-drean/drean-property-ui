import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { getScoreColor, getNeighborhoodGradeColor, getSpreadColor, getScoreLabel } from '../../../types/queue';
import { LeadMetrics } from '../../../services/leadQueueService';

interface MetricsGridProps {
  score: number | null;
  mao: number | null;
  spreadPercent: number | null;
  neighborhoodGrade: string | null;
  metrics?: LeadMetrics;
  listingPrice?: number;
}

interface MetricItemProps {
  label: string;
  value: string;
  color: string;
  tooltip?: React.ReactNode;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, color, tooltip }) => {
  const content = (
    <Box sx={{ textAlign: 'center', cursor: tooltip ? 'help' : 'default' }}>
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
      <Tooltip
        title={tooltip}
        arrow
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: '#1c2128',
              border: '1px solid #30363d',
              '& .MuiTooltip-arrow': {
                color: '#1c2128',
                '&::before': {
                  border: '1px solid #30363d',
                }
              },
              maxWidth: 320,
              p: 1.5,
            }
          }
        }}
      >
        {content}
      </Tooltip>
    );
  }

  return content;
};

/**
 * Rich tooltip content for evaluation metrics
 */
const MetricTooltipContent: React.FC<{
  title: string;
  value?: number | null;
  confidence?: number | null;
  source?: string | null;
  note?: string | null;
  formula?: string;
}> = ({ title, value, confidence, source, note, formula }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 1 }}>
      {title}
    </Typography>

    {value !== undefined && value !== null && (
      <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
        Value: <Box component="span" sx={{ color: '#f0f6fc' }}>${value.toLocaleString()}</Box>
      </Typography>
    )}

    {confidence !== undefined && confidence !== null && (
      <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
        Confidence: <Box component="span" sx={{ color: getConfidenceColor(confidence) }}>{confidence}%</Box>
      </Typography>
    )}

    {source && (
      <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
        Source: <Box component="span" sx={{ color: '#60a5fa', textTransform: 'capitalize' }}>{source}</Box>
      </Typography>
    )}

    {note && (
      <Typography variant="body2" sx={{ color: '#8b949e', mt: 1, fontStyle: 'italic', borderTop: '1px solid #30363d', pt: 1 }}>
        "{note}"
      </Typography>
    )}

    {formula && (
      <Typography variant="caption" sx={{ color: '#6e7681', mt: 1, display: 'block' }}>
        {formula}
      </Typography>
    )}
  </Box>
);

/**
 * Score tooltip with breakdown
 */
const ScoreTooltipContent: React.FC<{
  score: number | null;
  spreadPercent: number | null;
  mao: number | null;
  listingPrice?: number;
}> = ({ score, spreadPercent, mao, listingPrice }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 1 }}>
      Lead Score: {score ?? '-'}/10 ({getScoreLabel(score)})
    </Typography>

    <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
      Based on MAO spread percentage
    </Typography>

    {spreadPercent !== null && (
      <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
        Spread: <Box component="span" sx={{ color: getSpreadColor(spreadPercent) }}>{Math.round(spreadPercent)}%</Box>
      </Typography>
    )}

    {mao !== null && listingPrice && (
      <Typography variant="body2" sx={{ color: '#8b949e' }}>
        Gap: ${(listingPrice - mao).toLocaleString()}
      </Typography>
    )}

    <Typography variant="caption" sx={{ color: '#6e7681', mt: 1, display: 'block' }}>
      Lower spread = Higher score = Better deal
    </Typography>
  </Box>
);

/**
 * Neighborhood grade tooltip
 */
const GradeTooltipContent: React.FC<{
  grade: string | null;
  source?: string | null;
}> = ({ grade, source }) => {
  const gradeDescriptions: Record<string, string> = {
    'A': 'Excellent - Premium location, high appreciation potential',
    'B': 'Good - Solid neighborhood, stable values',
    'C': 'Average - Typical market conditions',
    'D': 'Below Average - May have challenges',
    'F': 'Poor - High risk area',
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 1 }}>
        Neighborhood Grade: {grade || '-'}
      </Typography>

      {grade && gradeDescriptions[grade.toUpperCase()] && (
        <Typography variant="body2" sx={{ color: '#8b949e', mb: 0.5 }}>
          {gradeDescriptions[grade.toUpperCase()]}
        </Typography>
      )}

      {source && (
        <Typography variant="body2" sx={{ color: '#8b949e' }}>
          Source: <Box component="span" sx={{ color: '#60a5fa', textTransform: 'capitalize' }}>{source}</Box>
        </Typography>
      )}
    </Box>
  );
};

/**
 * MAO tooltip with breakdown
 */
const MaoTooltipContent: React.FC<{
  mao: number | null;
  arv?: number | null;
  rehab?: number | null;
  listingPrice?: number;
}> = ({ mao, arv, rehab, listingPrice }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 1 }}>
      Maximum Allowable Offer
    </Typography>

    {mao !== null && (
      <Typography variant="body2" sx={{ color: '#4ade80', mb: 0.5, fontWeight: 600 }}>
        MAO: ${mao.toLocaleString()}
      </Typography>
    )}

    <Box sx={{ my: 1, borderTop: '1px solid #30363d', pt: 1 }}>
      <Typography variant="caption" sx={{ color: '#6e7681', display: 'block' }}>
        Formula: (ARV × 70%) - Rehab - $5k
      </Typography>

      {arv !== null && arv !== undefined && (
        <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5 }}>
          ARV: ${arv.toLocaleString()} × 70% = ${Math.round(arv * 0.7).toLocaleString()}
        </Typography>
      )}

      {rehab !== null && rehab !== undefined && (
        <Typography variant="body2" sx={{ color: '#8b949e' }}>
          - Rehab: ${rehab.toLocaleString()}
        </Typography>
      )}

      <Typography variant="body2" sx={{ color: '#8b949e' }}>
        - Margin: $5,000
      </Typography>
    </Box>

    {mao !== null && listingPrice && (
      <Typography variant="body2" sx={{ color: mao >= listingPrice ? '#4ade80' : '#f87171', mt: 1 }}>
        {mao >= listingPrice
          ? `✓ Listing is ${Math.round(((mao - listingPrice) / listingPrice) * 100)}% below MAO`
          : `✗ Listing is ${Math.round(((listingPrice - mao) / mao) * 100)}% above MAO`
        }
      </Typography>
    )}
  </Box>
);

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return '#4ade80';
  if (confidence >= 60) return '#fbbf24';
  return '#f87171';
};

/**
 * MetricsGrid - displays key metrics (Score, MAO, Spread%, Grade) in a compact grid with rich tooltips
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  score,
  mao,
  spreadPercent,
  neighborhoodGrade,
  metrics,
  listingPrice,
}) => {
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const formatSpread = (value: number | null) => {
    if (value === null) return '-';
    return `${Math.round(value)}%`;  // Round to whole number
  };

  // Build rich tooltips if metrics available
  const scoreTooltip = (
    <ScoreTooltipContent
      score={score}
      spreadPercent={spreadPercent}
      mao={mao}
      listingPrice={listingPrice}
    />
  );

  const maoTooltip = (
    <MaoTooltipContent
      mao={mao}
      arv={metrics?.arv}
      rehab={metrics?.rehabEstimate}
      listingPrice={listingPrice}
    />
  );

  const spreadTooltip = metrics?.arv ? (
    <MetricTooltipContent
      title="MAO Spread"
      value={spreadPercent !== null ? Math.round((listingPrice || 0) - (mao || 0)) : null}
      note={spreadPercent !== null
        ? `${Math.round(spreadPercent)}% gap between listing price and your maximum offer`
        : undefined}
      formula="Spread = (Listing - MAO) / Listing × 100"
    />
  ) : (
    <Box>
      <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 1 }}>
        MAO Spread
      </Typography>
      <Typography variant="body2" sx={{ color: '#8b949e' }}>
        Difference between listing price and MAO as percentage
      </Typography>
      <Typography variant="caption" sx={{ color: '#6e7681', mt: 1, display: 'block' }}>
        Lower spread = Better deal opportunity
      </Typography>
    </Box>
  );

  const gradeTooltip = (
    <GradeTooltipContent
      grade={neighborhoodGrade}
      source={metrics?.neighborhoodGrade ? 'ai' : undefined}
    />
  );

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
        tooltip={scoreTooltip}
      />
      <MetricItem
        label="MAO"
        value={formatCurrency(mao)}
        color="#f0f6fc"
        tooltip={maoTooltip}
      />
      <MetricItem
        label="Spread"
        value={formatSpread(spreadPercent)}
        color={getSpreadColor(spreadPercent)}
        tooltip={spreadTooltip}
      />
      <MetricItem
        label="Grade"
        value={neighborhoodGrade || '-'}
        color={getNeighborhoodGradeColor(neighborhoodGrade)}
        tooltip={gradeTooltip}
      />
    </Box>
  );
};

export default MetricsGrid;
