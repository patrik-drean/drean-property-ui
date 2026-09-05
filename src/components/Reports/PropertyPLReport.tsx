import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Button,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Download as DownloadIcon } from '@mui/icons-material';
import { format, subMonths, startOfMonth } from 'date-fns';
import { transactionApi } from '../../services/transactionApi';
import PropertyService from '../../services/PropertyService';
import {
  generatePropertyPLReport,
  getIncomeCategories,
  getExpenseCategories,
  calculateMonthlyOccupancy
} from '../../utils/reportUtils';
import type { PropertyPLReport as PLReport, MonthlyOccupancy } from '../../utils/reportUtils';
import type { Property } from '../../types/property';
import { PropertyKpiStrip } from './PropertyKpiStrip';
import { PropertyPLTrendChart } from './PropertyPLTrendChart';

interface PropertyPLReportProps {
  propertyId: string;
  months?: number;
}

export const PropertyPLReport: React.FC<PropertyPLReportProps> = ({
  propertyId,
  months = 6
}) => {
  const theme = useTheme();
  const [report, setReport] = useState<PLReport | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [occupancy, setOccupancy] = useState<MonthlyOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);

        // Fetch property details and transactions
        const [propertyData, transactions] = await Promise.all([
          PropertyService.getPropertyById(propertyId),
          transactionApi.getByProperty(propertyId)
        ]);

        // Generate report from transactions
        const plReport = generatePropertyPLReport(
          transactions,
          propertyId,
          propertyData.address,
          months
        );

        const totalUnits = propertyData.propertyUnits?.length || propertyData.units || 0;
        const monthlyOccupancy = calculateMonthlyOccupancy(
          transactions.filter(t => t.propertyId === propertyId && t.expenseType === 'Operating'),
          totalUnits,
          plReport.months.map(m => m.month)
        );

        setProperty(propertyData);
        setReport(plReport);
        setOccupancy(monthlyOccupancy);
      } catch (err) {
        console.error('Failed to load report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [propertyId, months]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  // Get last full month (e.g., if today is Oct 7, last full month is Sep)
  const getLastFullMonth = () => {
    const lastMonth = subMonths(startOfMonth(new Date()), 1);
    return format(lastMonth, 'yyyy-MM');
  };

  const isLastFullMonth = (monthKey: string) => {
    return monthKey === getLastFullMonth();
  };

  // Subtle highlight for the last full month column
  const getHighlightStyle = (isHighlighted: boolean, baseColor?: string) => {
    if (!isHighlighted) return { bgcolor: baseColor || 'inherit' };
    return {
      bgcolor: alpha(theme.palette.success.main, 0.12),
      borderLeft: '3px solid',
      borderColor: 'success.main'
    };
  };

  // Keep the category column visible while scrolling months horizontally
  const stickyLabel = (bgcolor: string = theme.palette.background.paper) => ({
    position: 'sticky' as const,
    left: 0,
    zIndex: 2,
    bgcolor
  });

  const formatOccupancy = (occupied: number, total: number) => `${occupied}/${total}`;

  const averageOccupied = occupancy.length
    ? occupancy.reduce((sum, o) => sum + o.occupied, 0) / occupancy.length
    : 0;

  const handleExportCSV = () => {
    if (!report) return;

    // Build CSV content
    const rows = [];

    // Header row
    rows.push(['Category', ...report.months.map(m => formatMonth(m.month)), '6-Mo Avg']);

    // Summary section
    rows.push(['SUMMARY']);
    if (occupancy.length > 0) {
      rows.push([
        'Units Occupied',
        ...occupancy.map(o => formatOccupancy(o.occupied, o.total)),
        `${averageOccupied.toFixed(1)}/${occupancy[0].total}`
      ]);
    }
    rows.push([
      'Net Income',
      ...report.months.map(m => m.netIncome),
      report.sixMonthAverage.netIncome
    ]);

    // Income section
    rows.push(['INCOME']);
    const incomeCategories = getIncomeCategories(report);
    incomeCategories.forEach(category => {
      const row = [
        category,
        ...report.months.map(m => m.incomeByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.incomeByCategory[category] || 0), 0) / report.months.length
      ];
      rows.push(row);
    });
    rows.push([
      'Total Income',
      ...report.months.map(m => m.totalIncome),
      report.sixMonthAverage.totalIncome
    ]);

    // Expense section
    rows.push(['EXPENSES']);
    const expenseCategories = getExpenseCategories(report);
    expenseCategories.forEach(category => {
      const row = [
        category,
        ...report.months.map(m => m.expensesByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.expensesByCategory[category] || 0), 0) / report.months.length
      ];
      rows.push(row);
    });
    rows.push([
      'Total Expenses',
      ...report.months.map(m => m.totalExpenses),
      report.sixMonthAverage.totalExpenses
    ]);

    // Net income
    rows.push([
      'Net Income',
      ...report.months.map(m => m.netIncome),
      report.sixMonthAverage.netIncome
    ]);

    // Convert to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `property-pl-${report.propertyAddress.replace(/[^a-z0-9]/gi, '_')}.csv`;
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
          No transaction data available for this property.
        </Typography>
      </Box>
    );
  }

  const incomeCategories = getIncomeCategories(report);
  const expenseCategories = getExpenseCategories(report);
  const dateRange = `${formatMonth(report.months[0].month)} – ${formatMonth(report.months[report.months.length - 1].month)}`;

  // Net income row is shown in the summary block and again after expenses
  const renderNetIncomeRow = (key: string) => (
    <TableRow key={key}>
      <TableCell sx={stickyLabel()}><strong>Net Income</strong></TableCell>
      {report.months.map(m => (
        <TableCell
          key={m.month}
          align="right"
          sx={{
            ...getHighlightStyle(isLastFullMonth(m.month)),
            color: m.netIncome >= 0 ? 'success.main' : 'error.main',
            fontWeight: 700
          }}
        >
          {formatCurrency(m.netIncome)}
        </TableCell>
      ))}
      <TableCell
        align="right"
        sx={{
          color: report.sixMonthAverage.netIncome >= 0 ? 'success.main' : 'error.main',
          fontWeight: 700
        }}
      >
        {formatCurrency(report.sixMonthAverage.netIncome)}
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {report.propertyAddress}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Property P&L Report · {dateRange}
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

      {property && (
        <PropertyKpiStrip property={property} plReport={report} />
      )}

      <PropertyPLTrendChart months={report.months} />

      <Paper sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickyLabel(), zIndex: 3 }}><strong>Category</strong></TableCell>
              {report.months.map(m => (
                <TableCell
                  key={m.month}
                  align="right"
                  sx={{
                    ...(isLastFullMonth(m.month) ? {
                      bgcolor: `${theme.palette.success.dark} !important`,
                      borderLeft: '3px solid',
                      borderColor: 'success.main',
                      fontWeight: 600,
                      color: `${theme.palette.getContrastText(theme.palette.success.dark)} !important`
                    } : {
                      fontWeight: 400
                    })
                  }}
                >
                  <strong>{formatMonth(m.month)}</strong>
                </TableCell>
              ))}
              <TableCell align="right">
                <strong>{months}-Mo Avg</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Summary Section */}
            <TableRow>
              <TableCell colSpan={report.months.length + 2} sx={{ bgcolor: 'action.hover' }}>
                <strong>SUMMARY</strong>
              </TableCell>
            </TableRow>
            {occupancy.length > 0 && (
              <TableRow>
                <TableCell sx={stickyLabel()}>Units Occupied</TableCell>
                {occupancy.map(o => (
                  <TableCell
                    key={o.month}
                    align="right"
                    sx={{
                      ...getHighlightStyle(isLastFullMonth(o.month)),
                      ...(o.total > 0 && o.occupied === 0 && { color: 'error.main' })
                    }}
                  >
                    {formatOccupancy(o.occupied, o.total)}
                  </TableCell>
                ))}
                <TableCell align="right">
                  {`${averageOccupied.toFixed(1)}/${occupancy[0].total}`}
                </TableCell>
              </TableRow>
            )}
            {renderNetIncomeRow('summary-net-income')}

            {/* Income Section */}
            <TableRow>
              <TableCell colSpan={report.months.length + 2} sx={{ bgcolor: 'action.hover' }}>
                <strong>INCOME</strong>
              </TableCell>
            </TableRow>
            {incomeCategories.map(category => (
              <TableRow key={`income-${category}`}>
                <TableCell sx={{ ...stickyLabel(), pl: 4 }}>{category}</TableCell>
                {report.months.map(m => (
                  <TableCell
                    key={m.month}
                    align="right"
                    sx={getHighlightStyle(isLastFullMonth(m.month))}
                  >
                    {formatCurrency(m.incomeByCategory[category] || 0)}
                  </TableCell>
                ))}
                <TableCell align="right">
                  {formatCurrency(
                    report.months.reduce((sum, m) => sum + (m.incomeByCategory[category] || 0), 0) / report.months.length
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'action.selected' }}>
              <TableCell sx={stickyLabel(theme.palette.action.selected)}><strong>Total Income</strong></TableCell>
              {report.months.map(m => (
                <TableCell
                  key={m.month}
                  align="right"
                  sx={{
                    ...getHighlightStyle(isLastFullMonth(m.month)),
                    ...(!isLastFullMonth(m.month) && { bgcolor: 'action.selected' })
                  }}
                >
                  <strong>{formatCurrency(m.totalIncome)}</strong>
                </TableCell>
              ))}
              <TableCell align="right">
                <strong>{formatCurrency(report.sixMonthAverage.totalIncome)}</strong>
              </TableCell>
            </TableRow>

            {/* Expenses Section */}
            <TableRow>
              <TableCell colSpan={report.months.length + 2} sx={{ bgcolor: 'action.hover' }}>
                <strong>EXPENSES</strong>
              </TableCell>
            </TableRow>
            {expenseCategories.map(category => (
              <TableRow key={`expense-${category}`}>
                <TableCell sx={{ ...stickyLabel(), pl: 4 }}>{category}</TableCell>
                {report.months.map(m => (
                  <TableCell
                    key={m.month}
                    align="right"
                    sx={getHighlightStyle(isLastFullMonth(m.month))}
                  >
                    {formatCurrency(m.expensesByCategory[category] || 0)}
                  </TableCell>
                ))}
                <TableCell align="right">
                  {formatCurrency(
                    report.months.reduce((sum, m) => sum + (m.expensesByCategory[category] || 0), 0) / report.months.length
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'action.selected' }}>
              <TableCell sx={stickyLabel(theme.palette.action.selected)}><strong>Total Expenses</strong></TableCell>
              {report.months.map(m => (
                <TableCell
                  key={m.month}
                  align="right"
                  sx={{
                    ...getHighlightStyle(isLastFullMonth(m.month)),
                    ...(!isLastFullMonth(m.month) && { bgcolor: 'action.selected' })
                  }}
                >
                  <strong>{formatCurrency(m.totalExpenses)}</strong>
                </TableCell>
              ))}
              <TableCell align="right">
                <strong>{formatCurrency(report.sixMonthAverage.totalExpenses)}</strong>
              </TableCell>
            </TableRow>

            {/* Net Income */}
            {renderNetIncomeRow('net-income')}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};
