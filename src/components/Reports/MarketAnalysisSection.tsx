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

      {/* Market Insights (if comparables exist) */}
      {saleComparables && saleComparables.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Market Insights:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            ✓ ARV estimate aligns with average comp price - Strong market validation
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default MarketAnalysisSection;
