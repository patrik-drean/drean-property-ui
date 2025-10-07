import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types/property';
import {
  PortfolioCashFlowReport as CashFlowReportType,
  PortfolioAssetReport as AssetReportType,
  ReportError
} from '../types/portfolioReport';
import { PortfolioCashFlowReport } from '../components/Reports/PortfolioCashFlowReport';
import { PortfolioAssetReport } from '../components/Reports/PortfolioAssetReport';
import { portfolioReportService } from '../services/portfolioReportService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Tab panel component for tabbed content
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`reports-tabpanel-${index}`}
    aria-labelledby={`reports-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

/**
 * Tab accessibility properties
 */
const a11yProps = (index: number) => ({
  id: `reports-tab-${index}`,
  'aria-controls': `reports-tabpanel-${index}`,
});

/**
 * Main reports page component
 */
export const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [cashFlowReport, setCashFlowReport] = useState<CashFlowReportType | undefined>();
  const [assetReport, setAssetReport] = useState<AssetReportType | undefined>();
  const [errors, setErrors] = useState<ReportError[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /**
   * Handle property click navigation
   */
  const handlePropertyClick = useCallback((propertyId: string) => {
    // Navigate to property details page
    navigate(`/properties/${propertyId}`);
  }, [navigate]);

  /**
   * Load initial report data
   */
  const loadReports = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch properties for display
      const propertiesData = await portfolioReportService.getPropertiesForReports();
      setProperties(propertiesData);

      // Generate both reports
      const results = await portfolioReportService.generateAllReports();

      // Update state with results
      setCashFlowReport(results.cashFlow.data);
      setAssetReport(results.assets.data);

      // Collect all errors
      const allErrors = [
        ...results.cashFlow.errors,
        ...results.assets.errors
      ];
      setErrors(allErrors);

      if (showRefreshIndicator && allErrors.length === 0) {
        setSnackbarMessage('Reports refreshed successfully');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setErrors([{
        message: 'Failed to load reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Handle tab change
   */
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = async () => {
    portfolioReportService.refreshReports();
    await loadReports(true);
  };

  /**
   * Handle export functionality
   */
  const handleExport = (reportType: 'cashflow' | 'assets', scenario: 'current' | 'potential' = 'current') => {
    try {
      const reportData = reportType === 'cashflow' ? cashFlowReport : assetReport;
      if (!reportData) {
        setSnackbarMessage('No report data available to export');
        setSnackbarOpen(true);
        return;
      }

      const csvContent = portfolioReportService.exportToCsv(reportType, reportData, scenario);
      const scenarioSuffix = reportType === 'cashflow' ? `-${scenario}` : '';
      const filename = `portfolio-${reportType}${scenarioSuffix}-report-${new Date().toISOString().split('T')[0]}.csv`;

      portfolioReportService.downloadCsv(filename, csvContent);

      const scenarioText = reportType === 'cashflow' ? ` (${scenario} scenario)` : '';
      setSnackbarMessage(`${reportType === 'cashflow' ? 'Cash Flow' : 'Asset'} report${scenarioText} exported successfully`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting report:', error);
      setSnackbarMessage('Failed to export report');
      setSnackbarOpen(true);
    }
  };

  /**
   * Load reports on component mount
   */
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: 2 }}>
      {/* Page header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <AssessmentIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Portfolio Reports
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Button
            variant="outlined"
            onClick={() => navigate('/reports/portfolio-pl')}
            sx={{ mr: 1 }}
          >
            Portfolio P&L
          </Button>
          <Tooltip title="Refresh Reports">
            <IconButton
              onClick={handleRefresh}
              disabled={loading || refreshing}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {!isMobile && (
            <Tooltip title={`Export ${currentTab === 0 ? 'Cash Flow' : 'Asset'} Report`}>
              <IconButton
                onClick={() => handleExport(currentTab === 0 ? 'cashflow' : 'assets')}
                disabled={loading || (!cashFlowReport && !assetReport)}
                color="primary"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
          <Typography variant="h6" ml={2}>
            Loading portfolio reports...
          </Typography>
        </Box>
      )}

      {/* Error state */}
      {!loading && errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Report Generation Issues
          </Typography>
          {errors.map((error, index) => (
            <Typography variant="body2" key={index}>
              • {error.message}
              {error.propertyAddress && ` (${error.propertyAddress})`}
            </Typography>
          ))}
        </Alert>
      )}

      {/* No properties state */}
      {!loading && properties.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HomeIcon color="disabled" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" color="text.secondary" mb={2}>
            No Properties Found
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Add some properties to your portfolio to see detailed reports and analysis.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/properties')}
            startIcon={<HomeIcon />}
          >
            Go to Properties
          </Button>
        </Paper>
      )}

      {/* Reports content */}
      {!loading && properties.length > 0 && (
        <Paper sx={{ width: '100%' }}>
          {/* Refresh indicator */}
          {refreshing && (
            <Box display="flex" alignItems="center" justifyContent="center" p={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" ml={1}>
                Refreshing reports...
              </Typography>
            </Box>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="portfolio reports tabs"
              variant={isMobile ? 'fullWidth' : 'standard'}
            >
              <Tab
                label="Cash Flow Analysis"
                icon={<TrendingUpIcon />}
                iconPosition={isMobile ? 'top' : 'start'}
                {...a11yProps(0)}
              />
              <Tab
                label="Asset Analysis"
                icon={<HomeIcon />}
                iconPosition={isMobile ? 'top' : 'start'}
                {...a11yProps(1)}
              />
            </Tabs>
          </Box>

          {/* Tab panels */}
          <TabPanel value={currentTab} index={0}>
            <PortfolioCashFlowReport
              properties={properties}
              report={cashFlowReport}
              loading={refreshing}
              errors={errors.filter(e => e.message.includes('cash flow'))}
              onPropertyClick={handlePropertyClick}
              onExport={(scenario) => handleExport('cashflow', scenario)}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <PortfolioAssetReport
              properties={properties}
              report={assetReport}
              loading={refreshing}
              errors={errors.filter(e => e.message.includes('asset'))}
              onPropertyClick={handlePropertyClick}
            />
          </TabPanel>

          {/* Mobile export buttons */}
          {isMobile && (
            <Box p={2} textAlign="center">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport(currentTab === 0 ? 'cashflow' : 'assets')}
                disabled={!cashFlowReport && !assetReport}
                fullWidth
              >
                Export {currentTab === 0 ? 'Cash Flow' : 'Asset'} Report
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Success snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};