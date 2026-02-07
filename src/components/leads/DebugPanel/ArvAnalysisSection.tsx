import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  AlertTitle,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ArvEstimate {
  arv: number;
  arvPerSqft: number;
  arvLow?: number;
  arvHigh?: number;
  confidence: number;
  source: string;
  comps?: Comparable[];
  estimatedAt: string;
  // TASK-129: New validation fields
  originalArv?: number;
  benchmarkZestimate?: number;
  benchmarkStatic?: number;
  deviationFromZestimate?: number;
  validationFlags?: string[];
  compQualityScore?: number;
}

interface Comparable {
  address: string;
  salePrice: number;
  pricePerSqft: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  saleDate?: string;
  distanceMiles?: number;
  tier?: string;
  source: string;
}

interface ArvAnalysisSectionProps {
  arvEstimate?: ArvEstimate | null;
  zestimate?: number | null;
}

/**
 * TASK-129: ARV Analysis Section for Debug Panel
 *
 * Shows:
 * - Comparison table: AI ARV vs Zestimate vs Static ARV
 * - Deviation percentage with color coding
 * - Validation flags display
 * - Comp quality score
 * - Comps table with suspicious/stale highlighting
 */
export const ArvAnalysisSection: React.FC<ArvAnalysisSectionProps> = ({
  arvEstimate,
  zestimate,
}) => {
  if (!arvEstimate) {
    return (
      <Typography variant="body2" sx={{ color: '#6e7681', fontStyle: 'italic' }}>
        No ARV estimate available
      </Typography>
    );
  }

  const deviation = arvEstimate.deviationFromZestimate ?? (
    zestimate && zestimate > 0
      ? ((arvEstimate.arv - zestimate) / zestimate * 100)
      : null
  );

  const getDeviationColor = (dev: number | null): 'success' | 'warning' | 'error' | 'default' => {
    if (dev === null) return 'default';
    const absDeviation = Math.abs(dev);
    if (absDeviation <= 25) return 'success';
    if (absDeviation <= 40) return 'warning';
    return 'error';
  };

  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 80) return 'success';
    if (confidence >= 50) return 'warning';
    return 'error';
  };

  const getQualityColor = (score: number | undefined): 'success' | 'warning' | 'error' => {
    if (!score) return 'error';
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  // Check for suspicious comp addresses
  const suspiciousPatterns = ['example', 'sample', 'test', '123 main', '456 elm', '789 oak', '1234 '];
  const isSuspiciousAddress = (address: string): boolean => {
    const lower = address.toLowerCase();
    return suspiciousPatterns.some(p => lower.includes(p));
  };

  // Check for stale comp dates (before 2025)
  const isStaleDate = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getFullYear() < 2025;
  };

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return 'N/A';
    return `$${value.toLocaleString()}`;
  };

  const hasValidationIssues = arvEstimate.validationFlags && arvEstimate.validationFlags.length > 0;
  const wasAdjusted = arvEstimate.originalArv && arvEstimate.originalArv !== arvEstimate.arv;

  return (
    <Box>
      {/* Validation Flags Alert */}
      {hasValidationIssues && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            bgcolor: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid #e3b341',
            '& .MuiAlert-icon': { color: '#e3b341' },
          }}
        >
          <AlertTitle sx={{ color: '#e3b341' }}>Validation Issues Detected</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {arvEstimate.validationFlags?.map((flag, i) => (
              <li key={i} style={{ color: '#8b949e' }}>{flag}</li>
            ))}
          </Box>
          {wasAdjusted && (
            <Typography variant="caption" sx={{ color: '#6e7681', display: 'block', mt: 1 }}>
              Original ARV was {formatCurrency(arvEstimate.originalArv)}, adjusted to {formatCurrency(arvEstimate.arv)}
            </Typography>
          )}
        </Alert>
      )}

      {/* Comparison Table */}
      <Typography variant="subtitle2" sx={{ color: '#8b949e', mb: 1, fontWeight: 600 }}>
        VALUE COMPARISON
      </Typography>
      <Table size="small" sx={{ mb: 2, '& .MuiTableCell-root': { borderColor: '#21262d', py: 1 } }}>
        <TableBody>
          <TableRow>
            <TableCell sx={{ color: '#8b949e', width: 160 }}>AI ARV</TableCell>
            <TableCell sx={{ color: '#f0f6fc', fontWeight: 600 }}>
              {formatCurrency(arvEstimate.arv)}
              {wasAdjusted && (
                <Typography component="span" variant="caption" sx={{ color: '#6e7681', ml: 1 }}>
                  (was {formatCurrency(arvEstimate.originalArv)})
                </Typography>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: '#8b949e' }}>Zestimate</TableCell>
            <TableCell sx={{ color: '#f0f6fc' }}>
              {formatCurrency(zestimate ?? arvEstimate.benchmarkZestimate)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: '#8b949e' }}>Static ARV (Zip)</TableCell>
            <TableCell sx={{ color: '#f0f6fc' }}>
              {formatCurrency(arvEstimate.benchmarkStatic)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: '#8b949e' }}>Deviation from Zestimate</TableCell>
            <TableCell>
              {deviation !== null ? (
                <Chip
                  label={`${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)}%`}
                  size="small"
                  color={getDeviationColor(deviation)}
                  sx={{ height: 24, fontWeight: 600 }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: '#6e7681' }}>N/A</Typography>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: '#8b949e' }}>Confidence</TableCell>
            <TableCell>
              <Chip
                label={`${arvEstimate.confidence}%`}
                size="small"
                color={getConfidenceColor(arvEstimate.confidence)}
                sx={{ height: 24 }}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: '#8b949e' }}>Comp Quality Score</TableCell>
            <TableCell>
              <Chip
                label={arvEstimate.compQualityScore !== undefined ? `${arvEstimate.compQualityScore}/100` : 'N/A'}
                size="small"
                color={getQualityColor(arvEstimate.compQualityScore)}
                sx={{ height: 24 }}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: '#8b949e' }}>$/Sqft</TableCell>
            <TableCell sx={{ color: '#f0f6fc' }}>
              {arvEstimate.arvPerSqft ? `$${arvEstimate.arvPerSqft.toFixed(0)}` : 'N/A'}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Comparable Sales Table */}
      {arvEstimate.comps && arvEstimate.comps.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ color: '#8b949e', mb: 1, fontWeight: 600 }}>
            COMPARABLE SALES ({arvEstimate.comps.length})
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#21262d', py: 0.75 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#6e7681', fontSize: '0.7rem' }}>Address</TableCell>
                  <TableCell sx={{ color: '#6e7681', fontSize: '0.7rem' }}>Price</TableCell>
                  <TableCell sx={{ color: '#6e7681', fontSize: '0.7rem' }}>Date</TableCell>
                  <TableCell sx={{ color: '#6e7681', fontSize: '0.7rem' }}>$/Sqft</TableCell>
                  <TableCell sx={{ color: '#6e7681', fontSize: '0.7rem' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {arvEstimate.comps.map((comp, i) => {
                  const suspicious = isSuspiciousAddress(comp.address);
                  const stale = isStaleDate(comp.saleDate);

                  return (
                    <TableRow
                      key={i}
                      sx={{
                        bgcolor: suspicious ? 'rgba(248, 81, 73, 0.1)' :
                                 stale ? 'rgba(227, 179, 65, 0.1)' : 'inherit',
                      }}
                    >
                      <TableCell sx={{ color: suspicious ? '#f85149' : '#f0f6fc', fontSize: '0.75rem' }}>
                        {comp.address}
                      </TableCell>
                      <TableCell sx={{ color: '#f0f6fc', fontSize: '0.75rem' }}>
                        {formatCurrency(comp.salePrice)}
                      </TableCell>
                      <TableCell sx={{ color: stale ? '#e3b341' : '#8b949e', fontSize: '0.75rem' }}>
                        {comp.saleDate ? new Date(comp.saleDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: '#8b949e', fontSize: '0.75rem' }}>
                        ${comp.pricePerSqft?.toFixed(0) ?? 'N/A'}
                      </TableCell>
                      <TableCell>
                        {suspicious && (
                          <Tooltip title="Suspicious/placeholder address detected">
                            <ErrorIcon sx={{ color: '#f85149', fontSize: 16, mr: 0.5 }} />
                          </Tooltip>
                        )}
                        {stale && (
                          <Tooltip title="Stale data (before 2025)">
                            <WarningIcon sx={{ color: '#e3b341', fontSize: 16, mr: 0.5 }} />
                          </Tooltip>
                        )}
                        {!suspicious && !stale && (
                          <Tooltip title="Valid comp">
                            <CheckIcon sx={{ color: '#4ade80', fontSize: 16 }} />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      {/* No comps message */}
      {(!arvEstimate.comps || arvEstimate.comps.length === 0) && (
        <Typography variant="body2" sx={{ color: '#6e7681', fontStyle: 'italic' }}>
          No comparable sales data available
        </Typography>
      )}
    </Box>
  );
};

export default ArvAnalysisSection;
