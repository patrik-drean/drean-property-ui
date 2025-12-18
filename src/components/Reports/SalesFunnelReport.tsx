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
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { TimeFilterSelector } from './TimeFilterSelector';
import { salesFunnelService } from '../../services/salesFunnelService';
import { calculateDateRange } from '../../utils/timeFilterUtils';
import { SalesFunnelReport, TimeFilterPreset } from '../../types/salesFunnel';

// Stage goals based on target conversion rates
const STAGE_GOALS: Record<string, number> = {
  'Contacted': 70,
  'Responded': 40,
  'Converted': 33,
  'Under Contract': 15,
  'Sold': 50,
};

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

  const getConversionRateColor = (stageName: string, rate: number | null): string => {
    if (rate === null) return theme.palette.text.secondary;

    const goal = STAGE_GOALS[stageName];
    if (!goal) return theme.palette.text.secondary;

    if (rate >= goal) {
      return theme.palette.success.main; // Green when meeting goal
    } else {
      return theme.palette.warning.main; // Yellow when below goal
    }
  };

  const formatConversionRate = (rate: number | null): string => {
    if (rate === null) return '-';
    return `${rate.toFixed(2)}%`;
  };

  const getStageVerb = (stageName: string): string => {
    const verbs: Record<string, string> = {
      'Contacted': 'be contacted',
      'Responded': 'respond',
      'Converted': 'be converted',
      'Under Contract': 'be under contract',
      'Sold': 'be sold',
    };
    return verbs[stageName] || stageName.toLowerCase();
  };

  const getTooltipContent = (stageName: string): string => {
    const goal = STAGE_GOALS[stageName];

    if (!goal) {
      return stageName;
    }

    // Calculate cumulative expected count per 150 leads through the funnel
    let expectedCount = 150;
    const stageOrder = ['Contacted', 'Responded', 'Converted', 'Under Contract', 'Sold'];
    const currentStageIndex = stageOrder.indexOf(stageName);

    // Apply conversion rates through the funnel up to current stage
    for (let i = 0; i <= currentStageIndex; i++) {
      const stageGoal = STAGE_GOALS[stageOrder[i]];
      if (stageGoal) {
        expectedCount = expectedCount * (stageGoal / 100);
      }
    }

    const verb = getStageVerb(stageName);
    return `Goal: ${goal}% (For every 150 leads, ${Math.round(expectedCount)} should ${verb})`;
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
            {report.stages.map((stage, index) => {
              const tooltipContent = getTooltipContent(stage.stageName);
              const hasGoal = STAGE_GOALS[stage.stageName] !== undefined;

              return (
                <Tooltip
                  key={stage.stageName}
                  title={tooltipContent}
                  arrow
                  placement="right"
                  enterDelay={hasGoal ? 200 : 999999}
                  disableHoverListener={!hasGoal}
                >
                  <TableRow
                    sx={{
                      backgroundColor: index % 2 === 0 ? 'white' : theme.palette.grey[50],
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      cursor: hasGoal ? 'help' : 'default',
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {stage.stageName}
                    </TableCell>
                    <TableCell align="right">{stage.count}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: getConversionRateColor(stage.stageName, stage.conversionRateFromPrevious),
                        fontWeight: 500,
                      }}
                    >
                      {formatConversionRate(stage.conversionRateFromPrevious)}
                    </TableCell>
                  </TableRow>
                </Tooltip>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
