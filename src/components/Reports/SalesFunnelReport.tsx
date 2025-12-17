import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { TimeFilterSelector } from './TimeFilterSelector';
import { salesFunnelService } from '../../services/salesFunnelService';
import { calculateDateRange } from '../../utils/timeFilterUtils';
import { SalesFunnelReport, TimeFilterPreset } from '../../types/salesFunnel';

export const SalesFunnelReportComponent: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SalesFunnelReport | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<TimeFilterPreset>('last7');

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = calculateDateRange(selectedPreset);
      const data = await salesFunnelService.getSalesFunnelReport(startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error('Error loading sales funnel report:', err);
      setError('Failed to load sales funnel report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedPreset]);

  const getConversionRateColor = (rate: number | null): string => {
    if (rate === null) return theme.palette.text.disabled;
    if (rate >= 50) return theme.palette.success.main;
    if (rate >= 25) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const formatConversionRate = (rate: number | null): string => {
    if (rate === null) return '-';
    return `${rate.toFixed(2)}%`;
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading sales funnel report...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={loadReport}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!report || report.totalLeads === 0) {
    return (
      <Box>
        <TimeFilterSelector
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
        />
        <Alert severity="info">
          No leads found for the selected time period. Try adjusting the date range.
        </Alert>
      </Box>
    );
  }

  // Success state - Display table
  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Sales Funnel Analysis
        </Typography>
        <IconButton onClick={loadReport} aria-label="refresh report">
          <RefreshIcon />
        </IconButton>
      </Box>

      <TimeFilterSelector
        selectedPreset={selectedPreset}
        onPresetChange={setSelectedPreset}
      />

      <TableContainer component={Paper}>
        <Table aria-label="sales funnel table">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stage</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                Count
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                Conversion Rate
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.stages.map((stage, index) => (
              <TableRow
                key={stage.stageName}
                sx={{
                  backgroundColor: index % 2 === 0 ? 'white' : theme.palette.grey[50],
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <TableCell component="th" scope="row">
                  {stage.stageName}
                </TableCell>
                <TableCell align="right">{stage.count}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: getConversionRateColor(stage.conversionRateFromPrevious),
                    fontWeight: 500,
                  }}
                >
                  {formatConversionRate(stage.conversionRateFromPrevious)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
