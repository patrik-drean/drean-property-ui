import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { RentCastEstimates } from '../../types/property';

interface Props {
  rentCastEstimates: RentCastEstimates;
}

const ValuationSummaryCards: React.FC<Props> = ({ rentCastEstimates }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* ARV Card */}
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

      {/* Rent Estimate Card */}
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
  );
};

export default ValuationSummaryCards;
