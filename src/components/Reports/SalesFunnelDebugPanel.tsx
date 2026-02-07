import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  LinearProgress,
  Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import {
  SalesFunnelDebugData,
  DataQualityIssue,
  StageBreakdown,
  DateSequenceError,
  StageDuration,
  LostByStage,
} from '../../types/salesFunnel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

interface SalesFunnelDebugPanelProps {
  data: SalesFunnelDebugData;
  onNavigateToLead?: (leadId: string) => void;
}

export const SalesFunnelDebugPanel: React.FC<SalesFunnelDebugPanelProps> = ({
  data,
  onNavigateToLead,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const totalIssues = data.dataQualityIssues.length + data.dateSequenceErrors.length;
  const errorCount = data.dataQualityIssues.filter(i => i.severity === 'error').length;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatHours = (hours: number): string => {
    if (hours < 24) {
      return `${hours.toFixed(1)} hrs`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours < 1) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{ mt: 3 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight={500}>
            Debug View
          </Typography>
          {totalIssues > 0 && (
            <Chip
              size="small"
              label={`${totalIssues} issue${totalIssues > 1 ? 's' : ''}`}
              color={errorCount > 0 ? 'error' : 'warning'}
              icon={errorCount > 0 ? <ErrorIcon /> : <WarningIcon />}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  Data Quality
                  {data.dataQualityIssues.length > 0 && (
                    <Chip size="small" label={data.dataQualityIssues.length} color="warning" />
                  )}
                </Box>
              }
            />
            <Tab label="Stage Breakdown" />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  Date Sequence
                  {data.dateSequenceErrors.length > 0 && (
                    <Chip size="small" label={data.dateSequenceErrors.length} color="warning" />
                  )}
                </Box>
              }
            />
            <Tab label="Stage Durations" />
            <Tab label="Lost Analysis" />
          </Tabs>
        </Box>

        {/* Data Quality Issues Tab */}
        <TabPanel value={tabValue} index={0}>
          <DataQualityTab
            issues={data.dataQualityIssues}
            onNavigateToLead={onNavigateToLead}
          />
        </TabPanel>

        {/* Stage Breakdown Tab */}
        <TabPanel value={tabValue} index={1}>
          <StageBreakdownTab breakdowns={data.stageBreakdowns} />
        </TabPanel>

        {/* Date Sequence Errors Tab */}
        <TabPanel value={tabValue} index={2}>
          <DateSequenceTab
            errors={data.dateSequenceErrors}
            onNavigateToLead={onNavigateToLead}
          />
        </TabPanel>

        {/* Stage Durations Tab */}
        <TabPanel value={tabValue} index={3}>
          <StageDurationsTab durations={data.stageDurations} formatHours={formatHours} />
        </TabPanel>

        {/* Lost Analysis Tab */}
        <TabPanel value={tabValue} index={4}>
          <LostAnalysisTab lostByStage={data.lostByStage} />
        </TabPanel>
      </AccordionDetails>
    </Accordion>
  );
};

// Data Quality Issues Tab
const DataQualityTab: React.FC<{
  issues: DataQualityIssue[];
  onNavigateToLead?: (leadId: string) => void;
}> = ({ issues, onNavigateToLead }) => {
  if (issues.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No data quality issues found.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Address</TableCell>
            <TableCell>Issue</TableCell>
            <TableCell>Severity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issues.map((issue, index) => (
            <TableRow key={`${issue.leadId}-${index}`}>
              <TableCell>
                {onNavigateToLead ? (
                  <Link
                    component="button"
                    onClick={() => onNavigateToLead(issue.leadId)}
                    sx={{ textAlign: 'left' }}
                  >
                    {issue.address}
                  </Link>
                ) : (
                  issue.address
                )}
              </TableCell>
              <TableCell>{issue.issue}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={issue.severity}
                  color={issue.severity === 'error' ? 'error' : 'warning'}
                  icon={issue.severity === 'error' ? <ErrorIcon /> : <WarningIcon />}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Stage Breakdown Tab
const StageBreakdownTab: React.FC<{ breakdowns: StageBreakdown[] }> = ({ breakdowns }) => {
  if (breakdowns.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No stage breakdown data available.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Stage</TableCell>
            <TableCell align="right">By Status</TableCell>
            <TableCell align="right">With Date</TableCell>
            <TableCell align="right">Missing Date</TableCell>
            <TableCell sx={{ width: 200 }}>Date Coverage</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {breakdowns.map((breakdown) => {
            const coverage = breakdown.totalCount > 0
              ? (breakdown.withDateSet / breakdown.totalCount) * 100
              : 0;
            return (
              <TableRow key={breakdown.stageName}>
                <TableCell>{breakdown.stageName}</TableCell>
                <TableCell align="right">{breakdown.totalCount}</TableCell>
                <TableCell align="right">{breakdown.withDateSet}</TableCell>
                <TableCell align="right">
                  <Typography
                    component="span"
                    color={breakdown.withoutDateSet > 0 ? 'warning.main' : 'text.secondary'}
                  >
                    {breakdown.withoutDateSet}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={coverage}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      color={coverage === 100 ? 'success' : coverage > 80 ? 'primary' : 'warning'}
                    />
                    <Typography variant="body2" sx={{ minWidth: 40 }}>
                      {coverage.toFixed(0)}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Date Sequence Errors Tab
const DateSequenceTab: React.FC<{
  errors: DateSequenceError[];
  onNavigateToLead?: (leadId: string) => void;
}> = ({ errors, onNavigateToLead }) => {
  if (errors.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No date sequence errors found.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Address</TableCell>
            <TableCell>Error</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errors.map((error, index) => (
            <TableRow key={`${error.leadId}-${index}`}>
              <TableCell>
                {onNavigateToLead ? (
                  <Link
                    component="button"
                    onClick={() => onNavigateToLead(error.leadId)}
                    sx={{ textAlign: 'left' }}
                  >
                    {error.address}
                  </Link>
                ) : (
                  error.address
                )}
              </TableCell>
              <TableCell>{error.error}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Stage Durations Tab
const StageDurationsTab: React.FC<{
  durations: StageDuration[];
  formatHours: (hours: number) => string;
}> = ({ durations, formatHours }) => {
  if (durations.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Not enough data to calculate stage durations.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Transition</TableCell>
            <TableCell align="right">Average</TableCell>
            <TableCell align="right">Median</TableCell>
            <TableCell align="right">Min</TableCell>
            <TableCell align="right">Max</TableCell>
            <TableCell align="right">Sample Size</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {durations.map((duration) => (
            <TableRow key={`${duration.fromStage}-${duration.toStage}`}>
              <TableCell>
                {duration.fromStage} → {duration.toStage}
              </TableCell>
              <TableCell align="right">{formatHours(duration.averageHours)}</TableCell>
              <TableCell align="right">{formatHours(duration.medianHours)}</TableCell>
              <TableCell align="right">{formatHours(duration.minHours)}</TableCell>
              <TableCell align="right">{formatHours(duration.maxHours)}</TableCell>
              <TableCell align="right">{duration.sampleSize}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Lost Analysis Tab
const LostAnalysisTab: React.FC<{ lostByStage: LostByStage[] }> = ({ lostByStage }) => {
  if (lostByStage.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No lost leads to analyze.
      </Typography>
    );
  }

  const totalLost = lostByStage.reduce((sum, item) => sum + item.count, 0);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Where leads are lost in the funnel (last stage before marked Lost):
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Last Stage</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">% of Lost</TableCell>
              <TableCell sx={{ width: 200 }}>Distribution</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lostByStage.map((item) => (
              <TableRow key={item.lastStageBeforeLost}>
                <TableCell>{item.lastStageBeforeLost}</TableCell>
                <TableCell align="right">{item.count}</TableCell>
                <TableCell align="right">{item.percentage}%</TableCell>
                <TableCell>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="error"
                  />
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Total Lost</strong></TableCell>
              <TableCell align="right"><strong>{totalLost}</strong></TableCell>
              <TableCell align="right"><strong>100%</strong></TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
