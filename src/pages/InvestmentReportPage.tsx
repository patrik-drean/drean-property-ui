import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { InvestmentReportData } from '../types/investmentReport';
import { getReportData } from '../services/reportSharingService';
import { calculateInvestmentMetrics } from '../services/investmentReportService';
import InvestmentSummarySection from '../components/Reports/InvestmentSummarySection';
import InvestmentScoresSection from '../components/Reports/InvestmentScoresSection';
import MarketAnalysisSection from '../components/Reports/MarketAnalysisSection';
import CashFlowBreakdownSection from '../components/Reports/CashFlowBreakdownSection';
import FinancingDetailsSection from '../components/Reports/FinancingDetailsSection';

const InvestmentReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [reportData, setReportData] = useState<InvestmentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) {
        setError('Report ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = getReportData(reportId);
        if (!data) {
          setError('Report not found or has expired');
        } else {
          // Recalculate metrics using current formulas to ensure accuracy
          const updatedCalculations = calculateInvestmentMetrics(data.property);
          setReportData({
            ...data,
            calculations: updatedCalculations
          });
        }
      } catch (err) {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !reportData) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="error">
            {error || 'Report not found'}
          </Alert>
        </Box>
      </Container>
    );
  }

  const { property, calculations, generatedAt } = reportData;

  return (
    <Box sx={{
      height: '100vh',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <Container maxWidth="lg">
        <Box py={4} pb={6}>
          {/* Header Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
                Investment Summary Report
              </Typography>
              <Typography variant="h5" gutterBottom>
                {property.address}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                {property.squareFootage && (
                  <Typography variant="body2" color="text.secondary">
                    {property.squareFootage.toLocaleString()} sq ft
                  </Typography>
                )}
                {property.units && (
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    {property.units} unit{property.units !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generated on {generatedAt.toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>

          {/* Report Sections */}
          <Grid container spacing={3}>
            {/* Investment Summary Section */}
            <Grid item xs={12}>
              <InvestmentSummarySection
                property={property}
                calculations={calculations}
              />
            </Grid>

            {/* Investment Scores Analysis Section */}
            <Grid item xs={12}>
              <InvestmentScoresSection
                property={property}
                calculations={calculations}
              />
            </Grid>

            {/* Market Analysis & Comparable Sales Section */}
            {property.hasRentcastData && (
              <Grid item xs={12}>
                <MarketAnalysisSection property={property} />
              </Grid>
            )}

            {/* Cash Flow Breakdown Section */}
            <Grid item xs={12} lg={6}>
              <CashFlowBreakdownSection
                property={property}
                calculations={calculations}
              />
            </Grid>

            {/* Financing Details Section */}
            <Grid item xs={12} lg={6}>
              <FinancingDetailsSection
                property={property}
                calculations={calculations}
              />
            </Grid>
          </Grid>

          {/* Footer */}
          <Box mt={4} pt={3} borderTop={1} borderColor="divider">
            <Typography variant="body2" color="text.secondary" align="center">
              Generated by PropGuide Investment Analysis Platform
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default InvestmentReportPage;