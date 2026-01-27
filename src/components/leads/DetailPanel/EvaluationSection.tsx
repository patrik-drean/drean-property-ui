import React from 'react';
import { Box, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
import { SectionCard } from './SectionCard';
import { ScoreBadge } from './ScoreBadge';
import { GradeBadge } from './GradeBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ComparablesSection, Comparable } from './ComparablesSection';

interface EvaluationSectionProps {
  lead: QueueLead;
  onEditArv?: () => void;
  onEditRehab?: () => void;
}

/**
 * EvaluationSection - Top-right quadrant of the Lead Detail Panel
 *
 * Displays:
 * - Score badge (circular ring)
 * - ARV with edit button and confidence
 * - Rehab estimate with edit button and confidence
 * - MAO (auto-calculated, read-only)
 * - Spread percentage with color coding
 * - Neighborhood grade
 * - Expandable comps list
 *
 * Note: Full inline editing implemented in TASK-082
 */
export const EvaluationSection: React.FC<EvaluationSectionProps> = ({
  lead,
  onEditArv,
  onEditRehab,
}) => {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSpreadColor = (spread: number | null | undefined): string => {
    if (spread === null || spread === undefined) return '#8b949e';
    // Lower spread = better deal (listing price closer to MAO)
    if (spread <= 5) return '#4ade80';   // Excellent - green
    if (spread <= 15) return '#fbbf24';  // Good - yellow
    if (spread <= 25) return '#f97316';  // Moderate - orange
    return '#f87171';                     // High spread - red
  };

  // Mock ARV and rehab for display (these would come from evaluation data in future)
  // Using MAO to back-calculate approximate values
  const mao = lead.mao ?? null;
  const listingPrice = lead.listingPrice;

  // Estimate ARV from MAO (MAO = ARV * 0.7 - Rehab, assume Rehab ~ 15% of ARV)
  // This is mocked data - real data will come from evaluation API
  const estimatedArv = mao ? Math.round(mao / 0.55) : listingPrice * 1.2;
  const estimatedRehab = mao ? Math.round(estimatedArv * 0.15) : Math.round(listingPrice * 0.15);

  // Mock comparables data for demo
  const mockComps: Comparable[] = [
    {
      address: '123 Oak St',
      salePrice: estimatedArv - 5000,
      pricePerSqft: 115,
      saleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.3,
    },
    {
      address: '456 Elm Ave',
      salePrice: estimatedArv + 3000,
      pricePerSqft: 118,
      saleDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.5,
    },
    {
      address: '789 Pine Dr',
      salePrice: estimatedArv - 2000,
      pricePerSqft: 112,
      saleDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.7,
    },
  ];

  return (
    <SectionCard title="EVALUATION">
      {/* Score Badge (circular ring) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ScoreBadge score={lead.leadScore ?? 0} size="large" />
      </Box>

      {/* Editable Metrics */}
      <Stack spacing={2}>
        {/* ARV */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              ARV (After Repair Value)
            </Typography>
            <Tooltip title="Edit ARV (TASK-082)">
              <IconButton
                size="small"
                onClick={onEditArv}
                sx={{
                  color: '#8b949e',
                  '&:hover': { color: '#4ade80', bgcolor: 'rgba(74, 222, 128, 0.1)' },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
            {formatCurrency(estimatedArv)}
          </Typography>
          <ConfidenceBadge confidence={85} source="ai" />
        </Box>

        {/* Rehab Estimate */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              Rehab Estimate
            </Typography>
            <Tooltip title="Edit Rehab (TASK-082)">
              <IconButton
                size="small"
                onClick={onEditRehab}
                sx={{
                  color: '#8b949e',
                  '&:hover': { color: '#4ade80', bgcolor: 'rgba(74, 222, 128, 0.1)' },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
            {formatCurrency(estimatedRehab)}
          </Typography>
          <ConfidenceBadge confidence={72} source="ai" />
        </Box>

        {/* MAO (read-only, auto-calculated) */}
        <Box>
          <Typography variant="caption" sx={{ color: '#8b949e' }}>
            MAO (Maximum Allowable Offer)
          </Typography>
          <Typography variant="h6" sx={{ color: '#4ade80', fontWeight: 600 }}>
            {formatCurrency(mao)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
            (ARV x 70%) - Rehab
          </Typography>
        </Box>

        {/* Spread % */}
        <Box>
          <Typography variant="caption" sx={{ color: '#8b949e' }}>
            Spread
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: getSpreadColor(lead.spreadPercent),
              fontWeight: 600,
            }}
          >
            {lead.spreadPercent ?? 0}% below asking
          </Typography>
        </Box>

        {/* Neighborhood Grade */}
        <Box>
          <Typography variant="caption" sx={{ color: '#8b949e', mb: 0.5, display: 'block' }}>
            Neighborhood
          </Typography>
          <GradeBadge grade={lead.neighborhoodGrade || 'C'} />
        </Box>
      </Stack>

      {/* Expandable Comps */}
      <ComparablesSection comps={mockComps} />
    </SectionCard>
  );
};

export default EvaluationSection;
