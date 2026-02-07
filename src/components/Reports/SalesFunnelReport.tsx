import React, { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Switch,
  Link,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import BugReportIcon from '@mui/icons-material/BugReport';
import { TimeFilterSelector } from './TimeFilterSelector';
import { SalesFunnelDebugPanel } from './SalesFunnelDebugPanel';
import { StageLeadsModal } from './StageLeadsModal';
import { LeadDetailPanel } from '../leads/DetailPanel';
import { PhotoGalleryPanel } from '../leads/ReviewPage/PhotoGalleryPanel';
import { salesFunnelService } from '../../services/salesFunnelService';
import { leadQueueService } from '../../services/leadQueueService';
import { mapToQueueLead } from '../../hooks/useLeadQueue';
import { calculateDateRange } from '../../utils/timeFilterUtils';
import { SalesFunnelReport, SalesFunnelStage, TimeFilterPreset } from '../../types/salesFunnel';
import { QueueLead } from '../../types/queue';
import { useSearchParams } from 'react-router-dom';

// Stage goals based on target conversion rates
// Updated for Lead entity stages (TASK-126)
const STAGE_GOALS: Record<string, number> = {
  'Contacted': 50,
  'Responding': 40,
  'Negotiating': 33,
  'Under Contract': 15,
  'Closed': 50,
};

export const SalesFunnelReportComponent: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SalesFunnelReport | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<TimeFilterPreset>('last7');

  // Debug mode state - check URL param or localStorage
  const debugFromUrl = searchParams.get('debug') === 'true';
  const [debugMode, setDebugMode] = useState(() => {
    if (debugFromUrl) return true;
    return localStorage.getItem('salesFunnelDebugMode') === 'true';
  });

  // Stage drill-down modal state
  const [selectedStage, setSelectedStage] = useState<SalesFunnelStage | null>(null);

  // Lead detail panel state (reusing LeadDetailPanel from ReviewPage)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [detailPanelLead, setDetailPanelLead] = useState<QueueLead | null>(null);
  const [detailPanelLoading, setDetailPanelLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const loadReport = useCallback(async (includeDebug: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = calculateDateRange(selectedPreset);
      const data = await salesFunnelService.getSalesFunnelReport(startDate, endDate, includeDebug);
      setReport(data);
    } catch (err) {
      console.error('Error loading sales funnel report:', err);
      setError('Failed to load sales funnel report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedPreset]);

  useEffect(() => {
    loadReport(debugMode);
  }, [selectedPreset, debugMode, loadReport]);

  const handleDebugToggle = () => {
    const newValue = !debugMode;
    setDebugMode(newValue);
    localStorage.setItem('salesFunnelDebugMode', String(newValue));
  };

  // Open lead detail panel with full lead data
  const handleOpenLeadDetail = useCallback(async (leadId: string) => {
    setDetailPanelLoading(true);
    setDetailPanelOpen(true);
    try {
      const leadItem = await leadQueueService.getLeadById(leadId);
      setDetailPanelLead(mapToQueueLead(leadItem));
    } catch (err) {
      console.error('Failed to fetch lead details:', err);
      setDetailPanelLead(null);
    } finally {
      setDetailPanelLoading(false);
    }
  }, []);

  // Close detail panel and reset state
  const handleCloseDetailPanel = useCallback(() => {
    setDetailPanelOpen(false);
    setShowGallery(false);
    // Clear lead after animation completes
    setTimeout(() => setDetailPanelLead(null), 300);
  }, []);

  // Handle status change in detail panel
  const handleStatusChange = useCallback(async (status: QueueLead['status']) => {
    if (!detailPanelLead) return;
    try {
      await leadQueueService.updateStatus(detailPanelLead.id, status);
      // Refresh lead data
      const updatedLead = await leadQueueService.getLeadById(detailPanelLead.id);
      setDetailPanelLead(mapToQueueLead(updatedLead));
      // Reload report to reflect status changes
      loadReport(debugMode);
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  }, [detailPanelLead, debugMode, loadReport]);

  const handleStageClick = (stage: SalesFunnelStage) => {
    if (debugMode && stage.leads) {
      setSelectedStage(stage);
    }
  };

  const handleDownloadCsv = async () => {
    const { startDate, endDate } = calculateDateRange(selectedPreset);
    await salesFunnelService.exportLeadsCsv(startDate, endDate);
  };

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
    // Updated for Lead entity stages (TASK-126)
    const verbs: Record<string, string> = {
      'Contacted': 'be contacted',
      'Responding': 'be responding',
      'Negotiating': 'be negotiating',
      'Under Contract': 'be under contract',
      'Closed': 'be closed',
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
    // The funnel order is: Contacted -> Responding -> Negotiating -> Under Contract -> Closed
    // Updated for Lead entity stages (TASK-126)
    const funnelOrder = ['Contacted', 'Responding', 'Negotiating', 'Under Contract', 'Closed'];
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
          <IconButton color="inherit" size="small" onClick={() => loadReport(debugMode)}>
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
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Toggle debug mode to see underlying data">
            <FormControlLabel
              control={
                <Switch
                  checked={debugMode}
                  onChange={handleDebugToggle}
                  size="small"
                  icon={<BugReportIcon />}
                  checkedIcon={<BugReportIcon />}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Debug
                </Typography>
              }
              sx={{ mr: 1 }}
            />
          </Tooltip>
          <Tooltip title="Download CSV">
            <IconButton onClick={handleDownloadCsv} aria-label="download csv">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={() => loadReport(debugMode)} aria-label="refresh report">
            <RefreshIcon />
          </IconButton>
        </Box>
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
              const isClickable = debugMode && stage.leads && stage.leads.length > 0;

              return (
                <TableRow
                  key={stage.stageName}
                  onClick={() => isClickable && handleStageClick(stage)}
                  sx={{
                    backgroundColor: index % 2 === 0 ? 'white' : theme.palette.grey[50],
                    cursor: isClickable ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: isClickable
                        ? theme.palette.primary.light + '20'
                        : theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell component="th" scope="row">
                    {isClickable ? (
                      <Link component="span" sx={{ cursor: 'pointer' }}>
                        {stage.stageName}
                      </Link>
                    ) : (
                      stage.stageName
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {isClickable ? (
                      <Link component="span" sx={{ cursor: 'pointer' }}>
                        {stage.count}
                      </Link>
                    ) : (
                      stage.count
                    )}
                  </TableCell>
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

      {/* Engagement Metrics Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Engagement Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Tooltip title={`Based on ${report.timeToFirstContactLeadCount} leads`}>
              <Card sx={{ cursor: 'help' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Time From Lead Creation to First Contact
                  </Typography>
                  <Typography variant="h4">
                    {report.averageTimeToFirstContactHours !== null
                      ? `${report.averageTimeToFirstContactHours.toFixed(1)} hrs`
                      : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
          <Grid item xs={12} md={6}>
            <Tooltip title={`Based on ${report.responseTimeLeadCount} leads`}>
              <Card sx={{ cursor: 'help' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Our Average First Response Time
                  </Typography>
                  <Typography variant="h4">
                    {report.averageResponseTimeHours !== null
                      ? `${report.averageResponseTimeHours.toFixed(1)} hrs`
                      : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      {/* Debug Panel (only shown when debugMode is enabled and data exists) */}
      {debugMode && report.debugData && (
        <SalesFunnelDebugPanel
          data={report.debugData}
          onNavigateToLead={handleOpenLeadDetail}
        />
      )}

      {/* Stage Leads Modal (for drill-down) */}
      {selectedStage && (
        <StageLeadsModal
          open={!!selectedStage}
          onClose={() => setSelectedStage(null)}
          stageName={selectedStage.stageName}
          leads={selectedStage.leads || []}
          onNavigateToLead={handleOpenLeadDetail}
        />
      )}

      {/* Lead Detail Panel (reused from ReviewPage) */}
      <LeadDetailPanel
        open={detailPanelOpen}
        lead={detailPanelLead}
        loading={detailPanelLoading}
        onClose={handleCloseDetailPanel}
        onStatusChange={handleStatusChange}
        onGalleryToggle={setShowGallery}
        showGallery={showGallery}
        zIndex={1400}
      />

      {/* Photo Gallery Panel (overlay on left when gallery is open) */}
      {detailPanelOpen && showGallery && detailPanelLead && (
        <Box
          sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: { xs: 0, md: 800 },
            bottom: 0,
            zIndex: 1500,
            bgcolor: '#0d1117',
          }}
        >
          <PhotoGalleryPanel
            lead={detailPanelLead}
            onClose={() => setShowGallery(false)}
          />
        </Box>
      )}
    </Box>
  );
};
