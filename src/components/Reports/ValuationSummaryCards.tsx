import React from 'react';
import { Grid, Paper, Typography, Box, Chip, LinearProgress, Tooltip } from '@mui/material';
import { RentCastEstimates, SaleComparable } from '../../types/property';

interface Props {
  rentCastEstimates: RentCastEstimates;
  comparables?: SaleComparable[];
}

const ValuationSummaryCards: React.FC<Props> = ({ rentCastEstimates, comparables = [] }) => {
  // Check if we have the new ARV fields (backward compatible)
  const arv = rentCastEstimates.arv || 0;
  const arvPerSqft = rentCastEstimates.arvPerSqft || 0;
  const asIsValue = rentCastEstimates.asIsValue || 0;
  const asIsValuePerSqft = rentCastEstimates.asIsValuePerSqft || 0;
  const arvConfidence = rentCastEstimates.arvConfidence || 0;
  const arvCompsUsed = rentCastEstimates.arvCompsUsed || 0;

  const hasArvData = arv > 0 || asIsValue > 0;
  const totalComps = comparables.length;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Dual Estimate Cards - show when ARV data is available */}
      {hasArvData ? (
        <>
          {/* As-Is Value Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                As-Is Value
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                ${asIsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${asIsValuePerSqft.toLocaleString(undefined, { maximumFractionDigits: 0 })}/sqft
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Based on all {totalComps} comps (weighted avg)
              </Typography>
            </Paper>
          </Grid>

          {/* ARV Card - Highlighted */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                bgcolor: 'success.main',
                color: 'success.contrastText',
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2">
                  ARV (After Repair Value)
                </Typography>
                <Tooltip title={`Confidence based on comp count, correlation, and price variance`}>
                  <Chip
                    label={`${arvConfidence.toFixed(0)}% conf`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'inherit',
                      fontSize: '0.7rem',
                      height: 20,
                    }}
                  />
                </Tooltip>
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                ${arv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                ${arvPerSqft.toLocaleString(undefined, { maximumFractionDigits: 0 })}/sqft
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                Based on top {arvCompsUsed} renovated comps
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={arvConfidence}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { bgcolor: 'white' },
                    borderRadius: 1,
                    height: 4,
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Rent Estimate Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Rent Estimate
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                ${rentCastEstimates.rent.toLocaleString()}/mo
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Range: ${rentCastEstimates.rentLow.toLocaleString()} - ${rentCastEstimates.rentHigh.toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </>
      ) : (
        <>
          {/* Fallback to original layout for backward compatibility */}
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
        </>
      )}
    </Grid>
  );
};

export default ValuationSummaryCards;
