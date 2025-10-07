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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Download as DownloadIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { format, subMonths, startOfMonth } from 'date-fns';
import { transactionApi } from '../../services/transactionApi';
import PropertyService from '../../services/PropertyService';
import { generatePortfolioPLReport, getIncomeCategories, getExpenseCategories } from '../../utils/reportUtils';
import type { PortfolioPLReport as PLReport } from '../../utils/reportUtils';

interface PortfolioPLReportProps {
  months?: number;
}

export const PortfolioPLReport: React.FC<PortfolioPLReportProps> = ({ months = 6 }) => {
  const [report, setReport] = useState<PLReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);

        // Fetch all properties and transactions
        const [properties, transactions] = await Promise.all([
          PropertyService.getAllProperties(),
          transactionApi.getAll()
        ]);

        // Generate portfolio report
        const plReport = generatePortfolioPLReport(transactions, properties, months);

        setReport(plReport);
      } catch (err) {
        console.error('Failed to load portfolio report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [months]);

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

  const handleExportCSV = () => {
    if (!report) return;

    const rows = [];

    // Header
    rows.push(['Portfolio P&L Report']);
    rows.push([]);

    // Main P&L
    rows.push(['Category', ...report.months.map(m => formatMonth(m.month)), '6-Mo Avg', 'Last Full Mo']);

    const incomeCategories = getIncomeCategories(report);
    rows.push(['INCOME']);
    incomeCategories.forEach(category => {
      const lastMonthValue = report.months.find(m => m.month === format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM'))?.incomeByCategory[category] || 0;
      rows.push([
        category,
        ...report.months.map(m => m.incomeByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.incomeByCategory[category] || 0), 0) / report.months.length,
        lastMonthValue
      ]);
    });
    rows.push([
      'Total Income',
      ...report.months.map(m => m.totalIncome),
      report.sixMonthAverage.totalIncome,
      report.lastFullMonth.totalIncome
    ]);

    const expenseCategories = getExpenseCategories(report);
    rows.push(['EXPENSES']);
    expenseCategories.forEach(category => {
      const lastMonthValue = report.months.find(m => m.month === format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM'))?.expensesByCategory[category] || 0;
      rows.push([
        category,
        ...report.months.map(m => m.expensesByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.expensesByCategory[category] || 0), 0) / report.months.length,
        lastMonthValue
      ]);
    });
    rows.push([
      'Total Expenses',
      ...report.months.map(m => m.totalExpenses),
      report.sixMonthAverage.totalExpenses,
      report.lastFullMonth.totalExpenses
    ]);
    rows.push([
      'Net Income',
      ...report.months.map(m => m.netIncome),
      report.sixMonthAverage.netIncome,
      report.lastFullMonth.netIncome
    ]);

    // Property breakdown
    rows.push([]);
    rows.push(['Property Breakdown']);
    rows.push(['Property', 'Total Income (6mo)', 'Total Expenses (6mo)', 'Net Income (6mo)', 'Last Mo Income', 'Last Mo Expenses', 'Last Mo Net']);
    report.propertyBreakdowns.forEach(p => {
      rows.push([p.propertyAddress, p.totalIncome, p.totalExpenses, p.netIncome, p.lastMonthIncome, p.lastMonthExpenses, p.lastMonthNetIncome]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-pl-report.csv`;
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

  const incomeCategories = getIncomeCategories(report);
  const expenseCategories = getExpenseCategories(report);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Portfolio P&L Report</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </Box>

      {/* Main P&L Table */}
      <Paper sx={{ overflowX: 'auto', mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Category</strong></TableCell>
              {report.months.map(m => (
                <TableCell key={m.month} align="right">
                  <strong>{formatMonth(m.month)}</strong>
                </TableCell>
              ))}
              <TableCell align="right"><strong>6-Mo Avg</strong></TableCell>
              <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                <strong>Last Full Mo</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Income */}
            <TableRow>
              <TableCell colSpan={report.months.length + 3} sx={{ bgcolor: 'grey.100' }}>
                <strong>INCOME</strong>
              </TableCell>
            </TableRow>
            {incomeCategories.map(category => {
              const lastMonthValue = report.months.find(m => m.month === format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM'))?.incomeByCategory[category] || 0;
              return (
                <TableRow key={`income-${category}`}>
                  <TableCell sx={{ pl: 4 }}>{category}</TableCell>
                  {report.months.map(m => (
                    <TableCell key={m.month} align="right">
                      {formatCurrency(m.incomeByCategory[category] || 0)}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    {formatCurrency(
                      report.months.reduce((sum, m) => sum + (m.incomeByCategory[category] || 0), 0) / report.months.length
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                    {formatCurrency(lastMonthValue)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Total Income</strong></TableCell>
              {report.months.map(m => (
                <TableCell key={m.month} align="right">
                  <strong>{formatCurrency(m.totalIncome)}</strong>
                </TableCell>
              ))}
              <TableCell align="right">
                <strong>{formatCurrency(report.sixMonthAverage.totalIncome)}</strong>
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                <strong>{formatCurrency(report.lastFullMonth.totalIncome)}</strong>
              </TableCell>
            </TableRow>

            {/* Expenses */}
            <TableRow>
              <TableCell colSpan={report.months.length + 3} sx={{ bgcolor: 'grey.100' }}>
                <strong>EXPENSES</strong>
              </TableCell>
            </TableRow>
            {expenseCategories.map(category => {
              const lastMonthValue = report.months.find(m => m.month === format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM'))?.expensesByCategory[category] || 0;
              return (
                <TableRow key={`expense-${category}`}>
                  <TableCell sx={{ pl: 4 }}>{category}</TableCell>
                  {report.months.map(m => (
                    <TableCell key={m.month} align="right">
                      {formatCurrency(m.expensesByCategory[category] || 0)}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    {formatCurrency(
                      report.months.reduce((sum, m) => sum + (m.expensesByCategory[category] || 0), 0) / report.months.length
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                    {formatCurrency(lastMonthValue)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Total Expenses</strong></TableCell>
              {report.months.map(m => (
                <TableCell key={m.month} align="right">
                  <strong>{formatCurrency(m.totalExpenses)}</strong>
                </TableCell>
              ))}
              <TableCell align="right">
                <strong>{formatCurrency(report.sixMonthAverage.totalExpenses)}</strong>
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                <strong>{formatCurrency(report.lastFullMonth.totalExpenses)}</strong>
              </TableCell>
            </TableRow>

            {/* Net Income */}
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell><strong>Net Income</strong></TableCell>
              {report.months.map(m => (
                <TableCell key={m.month} align="right">
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
              <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                <strong style={{ color: report.lastFullMonth.netIncome >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(report.lastFullMonth.netIncome)}
                </strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      {/* Property Breakdown */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Property Breakdown</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Property</strong></TableCell>
                <TableCell align="right"><strong>Total Income (6mo)</strong></TableCell>
                <TableCell align="right"><strong>Total Expenses (6mo)</strong></TableCell>
                <TableCell align="right"><strong>Net Income (6mo)</strong></TableCell>
                <TableCell align="right" sx={{ bgcolor: 'success.light' }}><strong>Last Mo Income</strong></TableCell>
                <TableCell align="right" sx={{ bgcolor: 'success.light' }}><strong>Last Mo Expenses</strong></TableCell>
                <TableCell align="right" sx={{ bgcolor: 'success.light' }}><strong>Last Mo Net</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.propertyBreakdowns.map((prop, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {prop.propertyId === 'business' ? (
                      prop.propertyAddress
                    ) : (
                      <a
                        href={`/reports/property-pl/${prop.propertyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'underline' }}
                      >
                        {prop.propertyAddress}
                      </a>
                    )}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(prop.totalIncome)}</TableCell>
                  <TableCell align="right">{formatCurrency(prop.totalExpenses)}</TableCell>
                  <TableCell align="right">
                    <strong style={{ color: prop.netIncome >= 0 ? 'green' : 'red' }}>
                      {formatCurrency(prop.netIncome)}
                    </strong>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                    {formatCurrency(prop.lastMonthIncome)}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                    {formatCurrency(prop.lastMonthExpenses)}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'success.light' }}>
                    <strong style={{ color: prop.lastMonthNetIncome >= 0 ? 'green' : 'red' }}>
                      {formatCurrency(prop.lastMonthNetIncome)}
                    </strong>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
