import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Home as HomeIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { PortfolioCashFlowReport as PortfolioCashFlowReportType, ReportError } from '../../types/portfolioReport';
import { PropertyCashFlowRow } from './PropertyReportRow';
import { formatCurrency } from '../../utils/portfolioAggregator';

interface PortfolioCashFlowReportProps {
  properties: Property[];
  report?: PortfolioCashFlowReportType;
  loading?: boolean;
  errors?: ReportError[];
  onPropertyClick: (propertyId: string) => void;
  onExport?: (scenario: 'current' | 'potential') => void;
}

/**
 * Summary card component for cash flow metrics
 */
const SummaryCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" mb={1}>
        <Box mr={1} color={`${color}.main`}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" color={`${color}.main`} fontWeight="bold">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

/**
 * Expense breakdown component
 */
const ExpenseBreakdown: React.FC<{
  expenses: PortfolioCashFlowReportType['summary']['currentTotalExpenses'];
}> = ({ expenses }) => {

  const expenseItems = [
    { label: 'Mortgage Payments', value: expenses.mortgage },
    { label: 'Property Tax', value: expenses.propertyTax },
    { label: 'Property Management', value: expenses.propertyManagement },
    { label: 'Maintenance Reserve', value: expenses.maintenance },
    { label: 'Vacancy Allowance', value: expenses.vacancy },
    { label: 'Insurance & Other', value: expenses.insurance + expenses.other }
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" mb={2}>
          Monthly Expense Breakdown
        </Typography>
        <Grid container spacing={2}>
          {expenseItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(item.value)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Total Monthly Expenses
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="error.main">
            {formatCurrency(expenses.total)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Main cash flow report component
 */
export const PortfolioCashFlowReport: React.FC<PortfolioCashFlowReportProps> = ({
  properties,
  report,
  loading = false,
  errors = [],
  onPropertyClick,
  onExport
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedScenario, setSelectedScenario] = useState<'current' | 'potential'>('current');

  // Memoize sorted properties for better performance
  const sortedProperties = useMemo(() => {
    if (!report) return [];
    return [...report.properties].sort((a, b) => {
      // Sort operational properties first, then by net cash flow descending
      if (a.isOperational !== b.isOperational) {
        return a.isOperational ? -1 : 1;
      }
      const aNetCashFlow = selectedScenario === 'current' ? a.currentNetCashFlow : a.potentialNetCashFlow;
      const bNetCashFlow = selectedScenario === 'current' ? b.currentNetCashFlow : b.potentialNetCashFlow;
      return bNetCashFlow - aNetCashFlow;
    });
  }, [report, selectedScenario]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Generating cash flow report...
        </Typography>
      </Box>
    );
  }

  if (!report) {
    return (
      <Alert severity="error">
        Unable to generate cash flow report. Please try again.
      </Alert>
    );
  }

  if (properties.length === 0) {
    return (
      <Alert severity="info">
        No properties found. Add some properties to see your cash flow analysis.
      </Alert>
    );
  }

  const { summary } = report;

  // Get scenario-specific data
  const scenarioIncome = selectedScenario === 'current' ? summary.currentTotalRentIncome : summary.potentialTotalRentIncome;
  const scenarioExpenses = selectedScenario === 'current' ? summary.currentTotalExpenses : summary.potentialTotalExpenses;
  const scenarioNetCashFlow = selectedScenario === 'current' ? summary.currentTotalNetCashFlow : summary.potentialTotalNetCashFlow;
  const cashFlowColor = scenarioNetCashFlow >= 0 ? 'success' : 'error';

  return (
    <Box>
      {/* Error messages */}
      {errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Some properties could not be processed: {errors.length} error(s)
          </Typography>
        </Alert>
      )}

      {/* Scenario selector and export buttons */}
      <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <ToggleButtonGroup
          value={selectedScenario}
          exclusive
          onChange={(event, newScenario) => {
            if (newScenario !== null) {
              setSelectedScenario(newScenario);
            }
          }}
          aria-label="scenario selection"
        >
          <ToggleButton value="current" aria-label="current scenario">
            Current Income & Cash Flow
          </ToggleButton>
          <ToggleButton value="potential" aria-label="potential scenario">
            Potential Income & Cash Flow
          </ToggleButton>
        </ToggleButtonGroup>

        {onExport && (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => onExport('current')}
              disabled={!report}
            >
              Export Current
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => onExport('potential')}
              disabled={!report}
            >
              Export Potential
            </Button>
          </Box>
        )}
      </Box>

      {/* Summary cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title={`${selectedScenario === 'current' ? 'Current' : 'Potential'} Monthly Income`}
            value={formatCurrency(scenarioIncome)}
            icon={<TrendingUpIcon />}
            color="success"
            subtitle={`${summary.operationalPropertiesCount} operational properties`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Monthly Expenses"
            value={formatCurrency(scenarioExpenses.total)}
            icon={<AccountBalanceIcon />}
            color="error"
            subtitle="All operational expenses"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title={`${selectedScenario === 'current' ? 'Current' : 'Potential'} Net Cash Flow`}
            value={formatCurrency(scenarioNetCashFlow)}
            icon={scenarioNetCashFlow >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            color={cashFlowColor}
            subtitle="Monthly profit/loss"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Properties"
            value={summary.propertiesCount.toString()}
            icon={<HomeIcon />}
            color="primary"
            subtitle={`${summary.operationalPropertiesCount} operational`}
          />
        </Grid>
      </Grid>

      {/* Expense breakdown */}
      {scenarioExpenses.total > 0 && (
        <Box mb={4}>
          <ExpenseBreakdown expenses={scenarioExpenses} />
        </Box>
      )}

      {/* Properties table */}
      <Paper>
        <Box p={2}>
          <Typography variant="h6" component="div" mb={2}>
            Property Cash Flow Details
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Generated on {report.generatedAt.toLocaleString()}
          </Typography>
        </Box>

        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                {!isMobile && <TableCell>Status</TableCell>}
                <TableCell align="right">
                  {isMobile ? 'Rent' : 'Monthly Rent'}
                </TableCell>
                {!isMobile && (
                  <>
                    <TableCell align="right">Mortgage</TableCell>
                    <TableCell align="right">Property Tax</TableCell>
                    <TableCell align="right">Management</TableCell>
                    <TableCell align="right">Total Expenses</TableCell>
                  </>
                )}
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Net Cash Flow
                    {!isMobile && (
                      <Chip
                        label="Key Metric"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProperties.map((property) => (
                <PropertyCashFlowRow
                  key={property.id}
                  property={property}
                  onPropertyClick={onPropertyClick}
                  scenario={selectedScenario}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Footer note */}
      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          * Cash flow calculations include mortgage, property tax (2.5% annually),
          insurance ($130/month), property management (12% of rent), maintenance reserve (5% of rent),
          and vacancy allowance (8% of rent). Current scenario uses actual rent; Potential scenario uses potential rent.
          Only operational properties (Operational, Needs Tenant, Selling, Rehab, Closed) are included in reports.
        </Typography>
      </Box>
    </Box>
  );
};