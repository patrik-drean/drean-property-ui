import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { RentCastEstimates, SaleComparable } from '../../types/property';

interface Props {
  rentCastEstimates: RentCastEstimates;
  saleComparables?: SaleComparable[];
  squareFootage?: number | null;
}

const ValuationSummaryCards: React.FC<Props> = ({ rentCastEstimates, saleComparables = [], squareFootage }) => {
  const sqft = squareFootage || 0;

  // Calculate Mid and Quality tier estimates from comparables
  const qualityComps = saleComparables.filter(c => c.tier === 'Quality' && c.squareFootage && c.squareFootage > 0);
  const midComps = saleComparables.filter(c => c.tier === 'Mid' && c.squareFootage && c.squareFootage > 0);

  const qualityAvgPpsf = qualityComps.length > 0
    ? qualityComps.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / qualityComps.length
    : 0;
  const midAvgPpsf = midComps.length > 0
    ? midComps.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / midComps.length
    : 0;

  // Calculate ARV from Quality + Mid tier comps (matches backend logic)
  const arvComps = saleComparables.filter(
    c => (c.tier === 'Quality' || c.tier === 'Mid') && c.squareFootage && c.squareFootage > 0
  );
  const arvAvgPpsf = arvComps.length > 0
    ? arvComps.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / arvComps.length
    : 0;

  // Use calculated ARV from comps, fallback to stored value if no comps
  const arv = sqft > 0 && arvAvgPpsf > 0
    ? arvAvgPpsf * sqft
    : rentCastEstimates.arv || 0;
  const arvPerSqft = arvAvgPpsf > 0 ? arvAvgPpsf : (rentCastEstimates.arvPerSqft || 0);

  const hasArvData = arv > 0;

  // Calculate range estimates
  const qualityEstimate = sqft > 0 ? qualityAvgPpsf * sqft : 0;
  const midEstimate = sqft > 0 ? midAvgPpsf * sqft : 0;
  const hasRangeData = qualityEstimate > 0 && midEstimate > 0;

  return (
    <Box sx={{ mb: 3 }}>
      {/* ARV Estimate Card - show when ARV data is available */}
      {hasArvData ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            ARV Estimate
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: 'success.main' }}>
            ${arv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${arvPerSqft.toLocaleString(undefined, { maximumFractionDigits: 0 })}/sqft
          </Typography>

          {/* Range: Mid to Quality estimates */}
          {hasRangeData && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              Range: ${Math.round(midEstimate / 1000)}K - ${Math.round(qualityEstimate / 1000)}K
            </Typography>
          )}
        </Paper>
      ) : (
        <>
          {/* Fallback to original layout for backward compatibility */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Sales Comps
                </Typography>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  ${rentCastEstimates.price.toLocaleString()}
                </Typography>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Low: ${rentCastEstimates.priceLow.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High: ${rentCastEstimates.priceHigh.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Rent Comps
                </Typography>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  ${rentCastEstimates.rent.toLocaleString()}/month
                </Typography>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Low: ${rentCastEstimates.rentLow.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High: ${rentCastEstimates.rentHigh.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default ValuationSummaryCards;
