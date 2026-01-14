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
  'Contacted': 50,
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
    const goal = STAGE_GOALS[stageName];
    if (!goal) return theme.palette.text.secondary;

    // If rate is null (0%), it's below goal so show warning color
    if (rate === null) return theme.palette.warning.main;

    if (rate >= goal) {
      return theme.palette.success.main; // Green when meeting goal
    } else {
      return theme.palette.warning.main; // Yellow when below goal
    }
  };

  const formatConversionRate = (rate: number | null): string => {
    if (rate === null) return '0%';
    return `${Math.round(rate)}%`;
  };

  const formatGoalText = (stageName: string): string | null => {
    const goal = STAGE_GOALS[stageName];
    if (!goal) return null;
    return ` (${goal}% = Goal)`;
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

    const verb = getStageVerb(stageName);

    // For Contacted: "For every 200 leads, 100 should be contacted"
    if (stageName === 'Contacted') {
      return `For every 200 leads, 100 should ${verb}`;
    }

    // Calculate cumulative conversion rate from Contacted through to this stage
    // The funnel order is: Contacted -> Responded -> Converted -> Under Contract -> Sold
    const funnelOrder = ['Contacted', 'Responded', 'Converted', 'Under Contract', 'Sold'];
    const stageIndex = funnelOrder.indexOf(stageName);

    // Start from Responded (index 1) and multiply all rates up to and including current stage
    let cumulativeRate = 1;
    for (let i = 1; i <= stageIndex; i++) {
      const stageGoal = STAGE_GOALS[funnelOrder[i]];
      if (stageGoal) {
        cumulativeRate *= stageGoal / 100;
      }
    }

    const expectedCount = Math.round(100 * cumulativeRate);
    return `For every 100 contacted leads, ${expectedCount} should ${verb}`;
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
                  <TableCell align="right">
                    <Tooltip
                      title={tooltipContent}
                      arrow
                      placement="left"
                      enterDelay={hasGoal ? 200 : 999999}
                      disableHoverListener={!hasGoal}
                    >
                      <span style={{ cursor: hasGoal ? 'help' : 'default' }}>
                        <span
                          style={{
                            color: getConversionRateColor(stage.stageName, stage.conversionRateFromPrevious),
                            fontWeight: 500,
                          }}
                        >
                          {formatConversionRate(stage.conversionRateFromPrevious)}
                        </span>
                        {formatGoalText(stage.stageName) && (
                          <span
                            style={{
                              color: theme.palette.text.secondary,
                              fontWeight: 400,
                            }}
                          >
                            {formatGoalText(stage.stageName)}
                          </span>
                        )}
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
