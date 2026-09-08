import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { transactionApi } from '../../services/transactionApi';
import PropertyService from '../../services/PropertyService';
import { api } from '../../services/apiConfig';
import {
  generatePortfolioPLReport,
  getIncomeCategories,
  getExpenseCategories,
  calculateMonthlyOccupancy,
  calculatePortfolioMonthlyOccupancy
} from '../../utils/reportUtils';
import type {
  PortfolioPLReport as PLReport,
  MonthlyOccupancy,
  PropertyBreakdown
} from '../../utils/reportUtils';
import type { Property } from '../../types/property';
import { PortfolioKpiStrip } from './PortfolioKpiStrip';
import { PropertyPLTrendChart } from './PropertyPLTrendChart';
import {
  PLMonthlyTable,
  formatCurrency,
  formatMonth,
  formatOccupancy,
  averageOccupied
} from './PLMonthlyTable';

interface PortfolioPLReportProps {
  months?: number;
}

export const PortfolioPLReport: React.FC<PortfolioPLReportProps> = ({ months = 6 }) => {
  const [report, setReport] = useState<PLReport | null>(null);
  const [occupancy, setOccupancy] = useState<MonthlyOccupancy[]>([]);
  const [propertyOccupancy, setPropertyOccupancy] = useState<Record<string, MonthlyOccupancy>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingArchive, setPendingArchive] = useState<PropertyBreakdown | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
      try {
        setLoading(true);

        // Archived properties are excluded server-side so archiving one
        // removes it from this report
        const [properties, transactions] = await Promise.all([
          PropertyService.getAllProperties(false),
          transactionApi.getAll()
        ]);

        // Generate portfolio report
        const plReport = generatePortfolioPLReport(transactions, properties, months);
        const monthKeys = plReport.months.map(m => m.month);

        // Occupancy covers exactly the properties the report reports on, so the
        // KPI tile, the Units Occupied row and the breakdown all agree
        const reportedIds = new Set(plReport.propertyBreakdowns.map(p => p.propertyId));
        const reportedProperties = properties.filter((p: Property) => reportedIds.has(p.id));

        const portfolioOccupancy = calculatePortfolioMonthlyOccupancy(
          reportedProperties,
          transactions,
          monthKeys
        );

        // Last full month occupancy per property, for the breakdown table
        const lastMonthKey = monthKeys[monthKeys.length - 1];
        const perProperty: Record<string, MonthlyOccupancy> = {};
        reportedProperties.forEach((property: Property) => {
          const totalUnits = property.propertyUnits?.length || property.units || 0;
          if (totalUnits === 0) return;

          perProperty[property.id] = calculateMonthlyOccupancy(
            transactions.filter(
              t => t.propertyId === property.id && t.expenseType === 'Operating'
            ),
            totalUnits,
            [lastMonthKey]
          )[0];
        });

        setReport(plReport);
        setOccupancy(portfolioOccupancy);
        setPropertyOccupancy(perProperty);
      } catch (err) {
        console.error('Failed to load portfolio report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
  }, [months]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleConfirmArchive = async () => {
    if (!pendingArchive) return;

    const { propertyId, propertyAddress } = pendingArchive;
    try {
      setArchiving(true);
      await api.archiveProperty(propertyId);
      setPendingArchive(null);
      await loadReport();
      setNotice(`Archived ${propertyAddress}`);
    } catch (err) {
      console.error('Failed to archive property:', err);
      setNotice(
        err instanceof Error ? `Could not archive: ${err.message}` : 'Could not archive property'
      );
    } finally {
      setArchiving(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const rows = [];
    const avgLabel = `${months}-Mo Avg`;

    rows.push(['Category', ...report.months.map(m => formatMonth(m.month)), avgLabel]);

    rows.push(['SUMMARY']);
    if (occupancy.length > 0) {
      rows.push([
        'Units Occupied',
        ...occupancy.map(o => formatOccupancy(o.occupied, o.total)),
        `${averageOccupied(occupancy).toFixed(1)}/${occupancy[0].total}`
      ]);
    }
    rows.push([
      'Net Income',
      ...report.months.map(m => m.netIncome),
      report.sixMonthAverage.netIncome
    ]);

    rows.push(['INCOME']);
    getIncomeCategories(report).forEach(category => {
      rows.push([
        category,
        ...report.months.map(m => m.incomeByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.incomeByCategory[category] || 0), 0) / report.months.length
      ]);
    });
    rows.push([
      'Total Income',
      ...report.months.map(m => m.totalIncome),
      report.sixMonthAverage.totalIncome
    ]);

    rows.push(['EXPENSES']);
    getExpenseCategories(report).forEach(category => {
      rows.push([
        category,
        ...report.months.map(m => m.expensesByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.expensesByCategory[category] || 0), 0) / report.months.length
      ]);
    });
    rows.push([
      'Total Expenses',
      ...report.months.map(m => m.totalExpenses),
      report.sixMonthAverage.totalExpenses
    ]);

    rows.push([
      'Net Income',
      ...report.months.map(m => m.netIncome),
      report.sixMonthAverage.netIncome
    ]);

    // Property breakdown
    rows.push([]);
    rows.push([
      'PROPERTY BREAKDOWN',
      'Occupancy',
      `Income (${months}mo)`,
      `Expenses (${months}mo)`,
      `Net (${months}mo)`,
      'Last Mo Net'
    ]);
    report.propertyBreakdowns.forEach(prop => {
      const occ = propertyOccupancy[prop.propertyId];
      rows.push([
        `"${prop.propertyAddress}"`,
        occ ? formatOccupancy(occ.occupied, occ.total) : '',
        prop.totalIncome,
        prop.totalExpenses,
        prop.netIncome,
        prop.lastMonthNetIncome
      ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio-pl.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!report || report.months.length === 0) {
    return (
      <Box p={4}>
        <Typography color="text.secondary">
          No transaction data available.
        </Typography>
      </Box>
    );
  }

  const dateRange = `${formatMonth(report.months[0].month)} – ${formatMonth(report.months[report.months.length - 1].month)}`;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} px={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Portfolio P&L Report</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {dateRange}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </Box>

      <PortfolioKpiStrip report={report} occupancy={occupancy} />

      <PropertyPLTrendChart months={report.months} />

      <Box mb={3}>
        <PLMonthlyTable
          months={report.months}
          average={report.sixMonthAverage}
          occupancy={occupancy}
          avgLabel={`${months}-Mo Avg`}
        />
      </Box>

      {/* Property Breakdown */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Property Breakdown</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Property</strong></TableCell>
                <TableCell align="right"><strong>Occupancy</strong></TableCell>
                <TableCell align="right"><strong>Income ({months}mo)</strong></TableCell>
                <TableCell align="right"><strong>Expenses ({months}mo)</strong></TableCell>
                <TableCell align="right"><strong>Net ({months}mo)</strong></TableCell>
                <TableCell align="right"><strong>Last Mo Net</strong></TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {report.propertyBreakdowns.map(prop => {
                const occ = propertyOccupancy[prop.propertyId];
                return (
                  <TableRow key={prop.propertyId}>
                    <TableCell>
                      {prop.propertyId === 'business' ? (
                        prop.propertyAddress
                      ) : (
                        <Link
                          href={`#/reports/property-pl/${prop.propertyId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="secondary.main"
                        >
                          {prop.propertyAddress}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={occ && occ.total > 0 && occ.occupied === 0 ? { color: 'error.main' } : undefined}
                    >
                      {occ ? formatOccupancy(occ.occupied, occ.total) : '—'}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(prop.totalIncome)}</TableCell>
                    <TableCell align="right">{formatCurrency(prop.totalExpenses)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: prop.netIncome >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 700
                      }}
                    >
                      {formatCurrency(prop.netIncome)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: prop.lastMonthNetIncome >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 700
                      }}
                    >
                      {formatCurrency(prop.lastMonthNetIncome)}
                    </TableCell>
                    <TableCell align="right" padding="checkbox">
                      {prop.propertyId !== 'business' && (
                        <Tooltip title="Archive property">
                          <IconButton
                            size="small"
                            aria-label={`Archive ${prop.propertyAddress}`}
                            onClick={() => setPendingArchive(prop)}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>

      <Dialog open={!!pendingArchive} onClose={() => setPendingArchive(null)}>
        <DialogTitle>Archive this property?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{pendingArchive?.propertyAddress}</strong> will be removed from the portfolio
            report, including the months it contributed to above, so the totals and averages will
            change. Its transactions are kept, and you can find it again under Archived Properties.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingArchive(null)} disabled={archiving}>
            Cancel
          </Button>
          <Button onClick={handleConfirmArchive} color="error" disabled={archiving}>
            {archiving ? 'Archiving…' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!notice}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
};
