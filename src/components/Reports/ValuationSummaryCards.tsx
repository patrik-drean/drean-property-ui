import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { RentCastEstimates } from '../../types/property';

interface Props {
  rentCastEstimates: RentCastEstimates;
}

const ValuationSummaryCards: React.FC<Props> = ({ rentCastEstimates }) => {
  // Check if we have the new ARV fields (backward compatible)
  const arv = rentCastEstimates.arv || 0;
  const arvPerSqft = rentCastEstimates.arvPerSqft || 0;

  const hasArvData = arv > 0;

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
