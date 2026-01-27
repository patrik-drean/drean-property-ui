import React, { useState, useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { QueueLead } from '../../../types/queue';
import { SectionCard } from './SectionCard';
import { ScoreBadge } from './ScoreBadge';
import { GradeBadge } from './GradeBadge';
import { ComparablesSection, Comparable } from './ComparablesSection';
import { InlineEdit, ConfidenceSource } from '../shared';
import {
  formatCurrency,
  parseCurrency,
  validateCurrency,
} from '../../../utils/currencyUtils';

interface EvaluationData {
  arv: number;
  arvConfidence?: number;
  arvSource: ConfidenceSource;
  arvNote?: string;
  rehab: number;
  rehabConfidence?: number;
  rehabSource: ConfidenceSource;
  rehabNote?: string;
  rent: number;
  rentConfidence?: number;
  rentSource: ConfidenceSource;
  rentNote?: string;
}

interface EvaluationSectionProps {
  lead: QueueLead;
  onEvaluationChange?: (data: Partial<EvaluationData>) => void;
}

/**
 * EvaluationSection - Top-right quadrant of the Lead Detail Panel
 *
 * Displays:
 * - Score badge (circular ring)
 * - ARV with inline editing and confidence
 * - Rehab estimate with inline editing and confidence
 * - Rent estimate with inline editing and confidence
 * - MAO (auto-calculated, read-only)
 * - Spread percentage with color coding
 * - Neighborhood grade
 * - Expandable comps list
 */
export const EvaluationSection: React.FC<EvaluationSectionProps> = ({
  lead,
  onEvaluationChange,
}) => {
  // Get initial values from lead or calculate estimates
  const mao = lead.mao ?? null;
  const listingPrice = lead.listingPrice;

  // Calculate initial estimates (these would come from evaluation API in production)
  const initialArv = mao ? Math.round(mao / 0.55) : Math.round(listingPrice * 1.2);
  const initialRehab = mao
    ? Math.round(initialArv * 0.15)
    : Math.round(listingPrice * 0.15);
  const initialRent = Math.round(initialArv * 0.008);

  // Local state for evaluation values
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    arv: initialArv,
    arvConfidence: 85,
    arvSource: 'ai',
    arvNote: undefined,
    rehab: initialRehab,
    rehabConfidence: 72,
    rehabSource: 'ai',
    rehabNote: undefined,
    rent: initialRent,
    rentConfidence: 78,
    rentSource: 'ai',
    rentNote: undefined,
  });

  // Calculate MAO based on current values
  // MAO = (ARV × 70%) - Rehab - $5k (wholesale fee)
  const calculatedMao = useMemo(() => {
    return Math.round(evaluation.arv * 0.7 - evaluation.rehab - 5000);
  }, [evaluation.arv, evaluation.rehab]);

  // Calculate spread (difference between listing and MAO as percentage)
  const calculatedSpread = useMemo(() => {
    if (listingPrice === 0) return 0;
    return Math.round(((listingPrice - calculatedMao) / listingPrice) * 100);
  }, [listingPrice, calculatedMao]);

  const getSpreadColor = (spread: number): string => {
    // Lower spread = better deal (listing price closer to MAO)
    if (spread <= 15) return '#4ade80'; // Excellent - green
    if (spread <= 25) return '#fbbf24'; // Good - yellow
    if (spread <= 35) return '#f97316'; // Moderate - orange
    return '#f87171'; // High spread - red
  };

  const handleArvSave = (value: number | string, note?: string) => {
    const newArv = typeof value === 'number' ? value : parseCurrency(String(value));
    const updates = {
      arv: newArv,
      arvSource: 'manual' as ConfidenceSource,
      arvNote: note,
      arvConfidence: undefined,
    };
    setEvaluation((prev) => ({ ...prev, ...updates }));
    onEvaluationChange?.(updates);
  };

  const handleRehabSave = (value: number | string, note?: string) => {
    const newRehab = typeof value === 'number' ? value : parseCurrency(String(value));
    const updates = {
      rehab: newRehab,
      rehabSource: 'manual' as ConfidenceSource,
      rehabNote: note,
      rehabConfidence: undefined,
    };
    setEvaluation((prev) => ({ ...prev, ...updates }));
    onEvaluationChange?.(updates);
  };

  const handleRentSave = (value: number | string, note?: string) => {
    const newRent = typeof value === 'number' ? value : parseCurrency(String(value));
    const updates = {
      rent: newRent,
      rentSource: 'manual' as ConfidenceSource,
      rentNote: note,
      rentConfidence: undefined,
    };
    setEvaluation((prev) => ({ ...prev, ...updates }));
    onEvaluationChange?.(updates);
  };

  // Mock comparables data for demo
  const mockComps: Comparable[] = [
    {
      address: '123 Oak St',
      salePrice: evaluation.arv - 5000,
      pricePerSqft: 115,
      saleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.3,
    },
    {
      address: '456 Elm Ave',
      salePrice: evaluation.arv + 3000,
      pricePerSqft: 118,
      saleDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.5,
    },
    {
      address: '789 Pine Dr',
      salePrice: evaluation.arv - 2000,
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
      <Stack spacing={0}>
        {/* ARV */}
        <InlineEdit
          label="ARV (After Repair Value)"
          value={evaluation.arv}
          confidence={evaluation.arvConfidence}
          source={evaluation.arvSource}
          note={evaluation.arvNote}
          formatValue={(v) => formatCurrency(Number(v))}
          parseValue={parseCurrency}
          validate={(v) => validateCurrency(Number(v), 10000, 5000000)}
          onSave={handleArvSave}
        />

        {/* Rehab Estimate */}
        <InlineEdit
          label="Rehab Estimate"
          value={evaluation.rehab}
          confidence={evaluation.rehabConfidence}
          source={evaluation.rehabSource}
          note={evaluation.rehabNote}
          formatValue={(v) => formatCurrency(Number(v))}
          parseValue={parseCurrency}
          validate={(v) => validateCurrency(Number(v), 0, 500000)}
          onSave={handleRehabSave}
        />

        {/* Rent Estimate */}
        <InlineEdit
          label="Rent Estimate"
          value={evaluation.rent}
          confidence={evaluation.rentConfidence}
          source={evaluation.rentSource}
          note={evaluation.rentNote}
          formatValue={(v) => `${formatCurrency(Number(v))}/mo`}
          parseValue={parseCurrency}
          validate={(v) => validateCurrency(Number(v), 0, 50000)}
          onSave={handleRentSave}
          infoMessage="Used for rental income projections"
        />

        {/* MAO with Spread (read-only, auto-calculated) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#8b949e' }}>
            MAO (Maximum Allowable Offer)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
            <Typography variant="h6" sx={{ color: '#4ade80', fontWeight: 600 }}>
              {formatCurrency(calculatedMao)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: getSpreadColor(calculatedSpread),
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              {calculatedSpread}% below asking
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block', mt: 0.5 }}
          >
            (ARV × 70%) - Rehab - $5k
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
