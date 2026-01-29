import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';
import { QueueLead, getSpreadColor, calculateScoreFromSpread } from '../../../types/queue';
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
import {
  LeadMetrics,
  leadQueueService,
  ComparableSale,
  RentCastArvResult,
} from '../../../services/leadQueueService';

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

// Extended QueueLead with _metrics and _comparables from useLeadQueue
interface QueueLeadWithMetrics extends QueueLead {
  _metrics?: LeadMetrics;
  _comparables?: ComparableSale[];
}

interface EvaluationSectionProps {
  lead: QueueLeadWithMetrics;
  onEvaluationChange?: (data: Partial<EvaluationData>) => void;
  /** Callback when RentCast data is fetched successfully */
  onRentCastSuccess?: (result: RentCastArvResult) => void;
}

/**
 * EvaluationSection - Top-right quadrant of the Lead Detail Panel
 *
 * Displays:
 * - Score badge (circular ring)
 * - ARV with inline editing, confidence, and RentCast refresh trigger
 * - Rehab estimate with inline editing and confidence
 * - Rent estimate with inline editing and confidence
 * - MAO (auto-calculated, read-only)
 * - Spread percentage with color coding
 * - Neighborhood grade
 * - Expandable comps list (from RentCast or placeholder)
 */
export const EvaluationSection: React.FC<EvaluationSectionProps> = ({
  lead,
  onEvaluationChange,
  onRentCastSuccess,
}) => {
  // Get metrics from lead._metrics (populated by useLeadQueue from API response)
  const metrics = lead._metrics;
  const listingPrice = lead.listingPrice;

  // RentCast loading and error state
  const [loadingRentCast, setLoadingRentCast] = useState(false);
  const [rentCastError, setRentCastError] = useState<string | null>(null);

  // Comparables state - from API or fallback
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [compsVerified, setCompsVerified] = useState(false);

  // Helper to get initial evaluation data from lead metrics
  const getInitialEvaluation = (): EvaluationData => {
    // Use actual metrics from the lead if available
    if (metrics) {
      return {
        arv: metrics.arv ?? Math.round(listingPrice * 1.2),
        arvConfidence: metrics.arvConfidence,
        arvSource: (metrics.arvSource as ConfidenceSource) ?? 'ai',
        arvNote: metrics.arvNote,
        rehab: metrics.rehabEstimate ?? Math.round(listingPrice * 0.15),
        rehabConfidence: metrics.rehabConfidence,
        rehabSource: (metrics.rehabSource as ConfidenceSource) ?? 'ai',
        rehabNote: metrics.rehabNote,
        rent: metrics.rentEstimate ?? Math.round((metrics.arv ?? listingPrice) * 0.008),
        rentConfidence: metrics.rentConfidence,
        rentSource: (metrics.rentSource as ConfidenceSource) ?? 'ai',
        rentNote: metrics.rentNote,
      };
    }

    // Fallback calculation if no metrics available (shouldn't happen in production)
    const mao = lead.mao ?? null;
    const fallbackArv = mao ? Math.round(mao / 0.55) : Math.round(listingPrice * 1.2);
    const fallbackRehab = mao
      ? Math.round(fallbackArv * 0.15)
      : Math.round(listingPrice * 0.15);
    const fallbackRent = Math.round(fallbackArv * 0.008);

    return {
      arv: fallbackArv,
      arvConfidence: undefined,
      arvSource: 'ai',
      arvNote: undefined,
      rehab: fallbackRehab,
      rehabConfidence: undefined,
      rehabSource: 'ai',
      rehabNote: undefined,
      rent: fallbackRent,
      rentConfidence: undefined,
      rentSource: 'ai',
      rentNote: undefined,
    };
  };

  // Convert ComparableSale to Comparable for display
  const mapComparableSaleToComparable = (sale: ComparableSale): Comparable => ({
    id: sale.id,
    address: sale.address,
    salePrice: sale.salePrice,
    pricePerSqft: sale.pricePerSqft,
    saleDate: sale.saleDate,
    distanceMiles: sale.distanceMiles,
    zillowUrl: sale.zillowUrl,
    squareFeet: sale.squareFeet,
    bedrooms: sale.bedrooms,
    bathrooms: sale.bathrooms,
    city: sale.city,
    state: sale.state,
    propertyType: sale.propertyType,
  });

  // Local state for evaluation values - initialized from lead metrics
  const [evaluation, setEvaluation] = useState<EvaluationData>(getInitialEvaluation);

  // Reset evaluation state when lead changes (navigating between leads)
  useEffect(() => {
    setEvaluation(getInitialEvaluation());
    setRentCastError(null);

    // Initialize comps from lead data or use placeholder
    if (lead._comparables && lead._comparables.length > 0) {
      setComparables(lead._comparables.map(mapComparableSaleToComparable));
      setCompsVerified(metrics?.arvSource === 'rentcast');
    } else {
      // Placeholder comps when no RentCast data
      setComparables(generatePlaceholderComps(getInitialEvaluation().arv));
      setCompsVerified(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, metrics?.arv, metrics?.rehabEstimate, metrics?.rentEstimate]);

  // Generate placeholder comps based on ARV
  const generatePlaceholderComps = (arv: number): Comparable[] => [
    {
      address: '123 Oak St',
      salePrice: arv - 5000,
      pricePerSqft: 115,
      saleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.3,
    },
    {
      address: '456 Elm Ave',
      salePrice: arv + 3000,
      pricePerSqft: 118,
      saleDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.5,
    },
    {
      address: '789 Pine Dr',
      salePrice: arv - 2000,
      pricePerSqft: 112,
      saleDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      distanceMiles: 0.7,
    },
  ];

  // Handle RentCast refresh click
  const handleRentCastRefresh = async () => {
    setLoadingRentCast(true);
    setRentCastError(null);

    try {
      const result = await leadQueueService.getRentCastArv(lead.id);

      // Update local evaluation state with RentCast ARV
      const updates = {
        arv: result.arv,
        arvSource: 'rentcast' as ConfidenceSource,
        arvConfidence: result.arvConfidence,
        arvNote: undefined,
      };
      setEvaluation((prev) => ({ ...prev, ...updates }));

      // Update comparables
      if (result.comparables && result.comparables.length > 0) {
        setComparables(result.comparables.map(mapComparableSaleToComparable));
        setCompsVerified(true);
      }

      // Notify parent of changes
      onEvaluationChange?.(updates);
      onRentCastSuccess?.(result);
    } catch (error: unknown) {
      // Handle specific error types
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 429) {
          setRentCastError('Daily RentCast limit reached. Try again tomorrow.');
        } else if (axiosError.response?.status === 404) {
          setRentCastError('Property not found in RentCast database.');
        } else {
          setRentCastError('Failed to fetch RentCast data. Please try again.');
        }
      } else {
        setRentCastError('Failed to fetch RentCast data. Please try again.');
      }
      console.error('RentCast API error:', error);
    } finally {
      setLoadingRentCast(false);
    }
  };

  // Calculate MAO based on current values
  // MAO = (ARV × 70%) - Rehab - $5k (wholesale fee)
  const calculatedMao = useMemo(() => {
    return Math.round(evaluation.arv * 0.7 - evaluation.rehab - 5000);
  }, [evaluation.arv, evaluation.rehab]);

  // Calculate spread (difference between listing and MAO as percentage)
  // Positive spread = listing above MAO, Negative spread = listing below MAO (great deal)
  const calculatedSpread = useMemo(() => {
    if (listingPrice === 0) return 0;
    return Math.round(((listingPrice - calculatedMao) / listingPrice) * 100);
  }, [listingPrice, calculatedMao]);

  // Calculate score based on spread (recalculates when ARV/rehab changes)
  const calculatedScore = useMemo(() => {
    return calculateScoreFromSpread(calculatedSpread);
  }, [calculatedSpread]);

  // Format spread text based on whether it's positive or negative
  const spreadText = useMemo(() => {
    if (calculatedSpread < 0) {
      // Negative spread = listing is below MAO (excellent deal)
      return `${Math.abs(calculatedSpread)}% below MAO!`;
    }
    // Positive spread = MAO is below asking price (need to negotiate down)
    return `${calculatedSpread}% below asking`;
  }, [calculatedSpread]);

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

  return (
    <SectionCard title="EVALUATION">
      {/* Score Badge (circular ring) - uses calculated score based on current ARV/rehab */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ScoreBadge score={calculatedScore} size="large" />
      </Box>

      {/* RentCast Error Alert */}
      {rentCastError && (
        <Alert
          severity="error"
          onClose={() => setRentCastError(null)}
          sx={{
            mb: 2,
            bgcolor: 'rgba(248, 113, 113, 0.1)',
            color: '#f87171',
            '& .MuiAlert-icon': { color: '#f87171' },
          }}
        >
          {rentCastError}
        </Alert>
      )}

      {/* Editable Metrics */}
      <Stack spacing={0}>
        {/* ARV with RentCast trigger */}
        <Box sx={{ position: 'relative' }}>
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
            formatWithCommas
          />

          {/* RentCast Refresh Button - positioned next to label */}
          <Tooltip title="Get RentCast ARV & Comps (~$1 API call)">
            <IconButton
              onClick={handleRentCastRefresh}
              disabled={loadingRentCast}
              size="small"
              aria-label="Get RentCast ARV"
              sx={{
                position: 'absolute',
                top: 0,
                right: 28, // Position next to edit button
                color: '#a78bfa',
                p: 0.5,
                '&:hover': {
                  bgcolor: 'rgba(167, 139, 250, 0.1)',
                },
                '&.Mui-disabled': {
                  color: '#4a5568',
                },
              }}
            >
              {loadingRentCast ? (
                <CircularProgress size={16} sx={{ color: '#a78bfa' }} />
              ) : (
                <SyncIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

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
          formatWithCommas
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
          formatWithCommas
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
              {spreadText}
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
      <ComparablesSection comps={comparables} isVerified={compsVerified} />
    </SectionCard>
  );
};

export default EvaluationSection;
