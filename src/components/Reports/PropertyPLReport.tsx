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
  Button
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { format, subMonths, startOfMonth } from 'date-fns';
import { transactionApi } from '../../services/transactionApi';
import PropertyService from '../../services/PropertyService';
import { generatePropertyPLReport, getIncomeCategories, getExpenseCategories } from '../../utils/reportUtils';
import type { PropertyPLReport as PLReport } from '../../utils/reportUtils';
import type { Property } from '../../types/property';
import { PropertyOperationalSummary } from './PropertyOperationalSummary';

interface PropertyPLReportProps {
  propertyId: string;
  months?: number;
}

export const PropertyPLReport: React.FC<PropertyPLReportProps> = ({
  propertyId,
  months = 6
}) => {
  const [report, setReport] = useState<PLReport | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
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

        setProperty(propertyData);
        setReport(plReport);
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

  // Subtle highlight style for last full month following UX best practices
  const getHighlightStyle = (isHighlighted: boolean, baseColor?: string) => {
    if (!isHighlighted) return { bgcolor: baseColor || 'inherit' };
    return {
      bgcolor: 'rgba(76, 175, 80, 0.15)',
      borderLeft: '3px solid',
      borderColor: 'rgb(46, 125, 50)',
      color: 'rgba(27, 94, 32, 1) !important'
    };
  };

  const handleExportCSV = () => {
    if (!report) return;

    // Build CSV content
    const rows = [];

    // Header row
    rows.push(['Category', ...report.months.map(m => formatMonth(m.month)), '6-Mo Avg']);

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Property P&L Report
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {report.propertyAddress}
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

      {/* Operational Summary Dashboard */}
      {property && (
        <PropertyOperationalSummary property={property} plReport={report} />
      )}

      <Paper sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Category</strong></TableCell>
              {report.months.map(m => (
                <TableCell
                  key={m.month}
                  align="right"
                  sx={{
                    ...(isLastFullMonth(m.month) ? {
                      bgcolor: 'rgb(46, 125, 50) !important',
                      borderLeft: '3px solid',
                      borderColor: 'rgb(46, 125, 50)',
                      fontWeight: 600,
                      color: 'white !important'
                    } : {
                      fontWeight: 400
                    })
                  }}
                >
                  <strong>{formatMonth(m.month)}</strong>
                </TableCell>
              ))}
              <TableCell align="right">
                <strong>6-Mo Avg</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Income Section */}
            <TableRow>
              <TableCell colSpan={report.months.length + 2} sx={{ bgcolor: 'grey.100' }}>
                <strong>INCOME</strong>
              </TableCell>
            </TableRow>
            {incomeCategories.map(category => (
              <TableRow key={`income-${category}`}>
                <TableCell sx={{ pl: 4 }}>{category}</TableCell>
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
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Total Income</strong></TableCell>
              {report.months.map(m => (
                <TableCell
                  key={m.month}
                  align="right"
                  sx={{
                    ...getHighlightStyle(isLastFullMonth(m.month)),
                    ...(!isLastFullMonth(m.month) && { bgcolor: 'grey.50' })
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
              <TableCell colSpan={report.months.length + 2} sx={{ bgcolor: 'grey.100' }}>
                <strong>EXPENSES</strong>
              </TableCell>
            </TableRow>
            {expenseCategories.map(category => (
              <TableRow key={`expense-${category}`}>
                <TableCell sx={{ pl: 4 }}>{category}</TableCell>
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
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Total Expenses</strong></TableCell>
              {report.months.map(m => (
                <TableCell
                  key={m.month}
                  align="right"
                  sx={{
                    ...getHighlightStyle(isLastFullMonth(m.month)),
                    ...(!isLastFullMonth(m.month) && { bgcolor: 'grey.50' })
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
            <TableRow>
              <TableCell><strong>Net Income</strong></TableCell>
              {report.months.map(m => (
                <TableCell
                  key={m.month}
                  align="right"
                  sx={getHighlightStyle(isLastFullMonth(m.month))}
                >
                  <strong style={{ color: m.netIncome >= 0 ? 'green' : 'red' }}>
                    {formatCurrency(m.netIncome)}
                  </strong>
                </TableCell>
              ))}
              <TableCell align="right">
                <strong style={{ color: report.sixMonthAverage.netIncome >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(report.sixMonthAverage.netIncome)}
                </strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};
