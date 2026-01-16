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
        Valuation Summary (85% Confidence Interval)
      </Typography>

      {/* Valuation Summary Cards */}
      <ValuationSummaryCards
        rentCastEstimates={rentCastEstimates}
        saleComparables={saleComparables}
        squareFootage={property.squareFootage}
      />

      {/* Comparables Table */}
      <ComparablesTable comparables={saleComparables} />

      {/* Rent Estimate - shown when rent data is available */}
      {rentCastEstimates.rent > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Rent Estimate
          </Typography>
          <Typography variant="h4" sx={{ mb: 1 }}>
            ${rentCastEstimates.rent.toLocaleString()}/mo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Range: ${rentCastEstimates.rentLow.toLocaleString()} - ${rentCastEstimates.rentHigh.toLocaleString()}
          </Typography>
        </Paper>
      )}
    </Paper>
  );
};

export default MarketAnalysisSection;
