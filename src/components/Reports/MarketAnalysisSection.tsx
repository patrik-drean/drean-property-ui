import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Property } from '../../types/property';
import ValuationSummaryCards from './ValuationSummaryCards';
import ComparablesTable from './ComparablesTable';

interface Props {
  property: Property;
}

const MarketAnalysisSection: React.FC<Props> = ({ property }) => {
  const { rentCastEstimates, saleComparables } = property;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        📊 Market Analysis & Comparable Sales
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Valuation Summary (85% Confidence Interval)
      </Typography>

      {/* Valuation Summary Cards */}
      <ValuationSummaryCards rentCastEstimates={rentCastEstimates} />

      {/* Comparables Table */}
      <ComparablesTable comparables={saleComparables} />
    </Paper>
  );
};

export default MarketAnalysisSection;
