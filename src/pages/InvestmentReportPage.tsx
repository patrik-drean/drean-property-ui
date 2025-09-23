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
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Share as ShareIcon,
  FileCopy as CopyIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { InvestmentReportData } from '../types/investmentReport';
import { getReportData } from '../services/reportSharingService';
import InvestmentSummarySection from '../components/Reports/InvestmentSummarySection';
import InvestmentScoresSection from '../components/Reports/InvestmentScoresSection';
import CashFlowBreakdownSection from '../components/Reports/CashFlowBreakdownSection';
import FinancingDetailsSection from '../components/Reports/FinancingDetailsSection';

const InvestmentReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [reportData, setReportData] = useState<InvestmentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

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
          setReportData(data);
        }
      } catch (err) {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Investment Report - ${reportData?.property.address}`,
          text: 'Check out this investment analysis report',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      // Fallback to copy for browsers without Web Share API
      handleCopyLink();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'opportunity':
        return 'success';
      case 'under contract':
        return 'warning';
      case 'closed':
        return 'info';
      default:
        return 'default';
    }
  };

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
    <Container maxWidth="lg">
      <Box py={4}>
        {/* Header Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
                Investment Summary Report
              </Typography>
              <Typography variant="h5" gutterBottom>
                {property.address}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Chip
                  label={property.status}
                  color={getStatusColor(property.status) as any}
                  size="small"
                />
                {property.squareFootage && (
                  <Typography variant="body2" color="text.secondary">
                    {property.squareFootage.toLocaleString()} sq ft
                  </Typography>
                )}
                {property.units && (
                  <Typography variant="body2" color="text.secondary">
                    {property.units} unit{property.units !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generated on {generatedAt.toLocaleDateString()} at {generatedAt.toLocaleTimeString()}
              </Typography>
            </Box>

            {/* Sharing Controls */}
            <Box display="flex" gap={1}>
              <Tooltip title={copySuccess ? "Link copied!" : "Copy link"}>
                <IconButton onClick={handleCopyLink} color="primary">
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share report">
                <IconButton onClick={handleShare} color="primary">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to PDF">
                <IconButton color="primary" disabled>
                  <PdfIcon />
                </IconButton>
              </Tooltip>
            </Box>
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
  );
};

export default InvestmentReportPage;