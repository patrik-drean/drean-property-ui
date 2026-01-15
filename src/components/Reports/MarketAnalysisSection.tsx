import React from 'react';
import { Paper, Typography } from '@mui/material';
import { Property } from '../../types/property';
import ValuationSummaryCards from './ValuationSummaryCards';
import ComparablesTable from './ComparablesTable';

interface Props {
  property: Property;
}

const MarketAnalysisSection: React.FC<Props> = ({ property }) => {
  const { rentCastEstimates, saleComparables } = property;

  // Check if we have ARV data to show dual estimates
  const hasArvData = (rentCastEstimates.arv || 0) > 0 || (rentCastEstimates.asIsValue || 0) > 0;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Market Analysis & Comparable Sales
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {hasArvData
          ? 'Dual Estimate Analysis: As-Is Value vs ARV (After Repair Value)'
          : 'Valuation Summary (85% Confidence Interval)'}
      </Typography>

      {/* Valuation Summary Cards - pass comparables for count display */}
      <ValuationSummaryCards
        rentCastEstimates={rentCastEstimates}
        comparables={saleComparables}
      />

      {/* Comparables Table */}
      <ComparablesTable comparables={saleComparables} />
    </Paper>
  );
};

export default MarketAnalysisSection;
