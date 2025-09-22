import React, { useMemo } from 'react';
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
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { PortfolioAssetReport as PortfolioAssetReportType, ReportError } from '../../types/portfolioReport';
import { PropertyAssetRow } from './PropertyReportRow';
import { formatCurrency, formatPercentage } from '../../utils/portfolioAggregator';

interface PortfolioAssetReportProps {
  properties: Property[];
  report?: PortfolioAssetReportType;
  loading?: boolean;
  errors?: ReportError[];
  onPropertyClick: (propertyId: string) => void;
}

/**
 * Summary card component for asset metrics
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
 * Equity visualization component
 */
const EquityVisualization: React.FC<{
  summary: PortfolioAssetReportType['summary'];
}> = ({ summary }) => {
  const equityPercentage = summary.averageEquityPercent;
  const loanPercentage = 100 - equityPercentage;

  const getEquityColor = (percentage: number) => {
    if (percentage >= 50) return 'success';
    if (percentage >= 25) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" mb={2}>
          Portfolio Equity Analysis
        </Typography>

        {/* Equity ratio visualization */}
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Overall Equity Ratio
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <Box flex={1} mr={2}>
              <LinearProgress
                variant="determinate"
                value={equityPercentage}
                color={getEquityColor(equityPercentage) as any}
                sx={{ height: 12, borderRadius: 6 }}
              />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {formatPercentage(equityPercentage)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Average equity percentage across all properties
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Breakdown */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Total Equity
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {formatCurrency(summary.totalEquity)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPercentage(equityPercentage)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Total Loans
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {formatCurrency(summary.totalLoanValue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPercentage(loanPercentage)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

/**
 * Property distribution component
 */
const PropertyDistribution: React.FC<{
  summary: PortfolioAssetReportType['summary'];
  properties: PortfolioAssetReportType['properties'];
}> = ({ properties }) => {
  const equityRanges = useMemo(() => {
    const ranges = [
      { label: 'High Equity (>75%)', count: 0, color: 'success' },
      { label: 'Good Equity (50-75%)', count: 0, color: 'primary' },
      { label: 'Moderate Equity (25-50%)', count: 0, color: 'warning' },
      { label: 'Low Equity (<25%)', count: 0, color: 'error' }
    ];

    properties.forEach(property => {
      if (property.equityPercent >= 75) ranges[0].count++;
      else if (property.equityPercent >= 50) ranges[1].count++;
      else if (property.equityPercent >= 25) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  }, [properties]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" mb={2}>
          Property Distribution by Equity
        </Typography>
        <Grid container spacing={2}>
          {equityRanges.map((range, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Box textAlign="center">
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  color={`${range.color}.main`}
                >
                  {range.count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {range.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

/**
 * Main asset report component
 */
export const PortfolioAssetReport: React.FC<PortfolioAssetReportProps> = ({
  properties,
  report,
  loading = false,
  errors = [],
  onPropertyClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Memoize sorted properties for better performance
  const sortedProperties = useMemo(() => {
    if (!report) return [];
    return [...report.properties].sort((a, b) => {
      // First sort by status using the same order as properties page
      const statusOrder = ['Opportunity', 'Soft Offer', 'Hard Offer', 'Selling', 'Rehab', 'Needs Tenant', 'Operational'];
      const aStatusIndex = statusOrder.indexOf(a.status);
      const bStatusIndex = statusOrder.indexOf(b.status);

      if (aStatusIndex !== bStatusIndex) {
        return aStatusIndex - bStatusIndex;
      }

      // Then sort alphabetically by address
      return a.address.localeCompare(b.address);
    });
  }, [report]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Generating asset report...
        </Typography>
      </Box>
    );
  }

  if (!report) {
    return (
      <Alert severity="error">
        Unable to generate asset report. Please try again.
      </Alert>
    );
  }

  if (properties.length === 0) {
    return (
      <Alert severity="info">
        No properties found. Add some properties to see your asset analysis.
      </Alert>
    );
  }

  const { summary } = report;

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

      {/* Summary cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Property Value"
            value={formatCurrency(summary.totalPropertyValue)}
            icon={<HomeIcon />}
            color="primary"
            subtitle={`${summary.propertiesCount} total properties`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Loan Value"
            value={formatCurrency(summary.totalLoanValue)}
            icon={<AccountBalanceIcon />}
            color="error"
            subtitle="Outstanding loan balances"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Equity"
            value={formatCurrency(summary.totalEquity)}
            icon={<TrendingUpIcon />}
            color="success"
            subtitle="Net worth in properties"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Average Equity %"
            value={formatPercentage(summary.averageEquityPercent)}
            icon={<AssessmentIcon />}
            color="warning"
            subtitle="Portfolio-wide equity ratio"
          />
        </Grid>
      </Grid>

      {/* Equity visualization and distribution */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <EquityVisualization summary={summary} />
        </Grid>
        <Grid item xs={12} md={4}>
          <PropertyDistribution summary={summary} properties={sortedProperties} />
        </Grid>
      </Grid>

      {/* Properties table */}
      <Paper>
        <Box p={2}>
          <Typography variant="h6" component="div" mb={2}>
            Property Asset Details
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
                  {isMobile ? 'Value' : 'Current Value'}
                </TableCell>
                {!isMobile && <TableCell align="right">Loan Value</TableCell>}
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Equity
                    {!isMobile && (
                      <Chip
                        label="Key Metric"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </TableCell>
                {!isMobile && <TableCell align="right">Equity %</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProperties.map((property) => (
                <PropertyAssetRow
                  key={property.id}
                  property={property}
                  onPropertyClick={onPropertyClick}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Footer note */}
      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          * Asset values use current house value when available, otherwise ARV.
          Loan values use current loan value when available, otherwise calculated loan amounts.
          Only operational properties (Operational, Needs Tenant, Selling, Rehab, Closed) are included in reports.
        </Typography>
      </Box>
    </Box>
  );
};