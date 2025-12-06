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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
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
      </Box>

      {/* Main P&L Table */}
      <Paper sx={{ overflowX: 'auto', mb: 3 }}>
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
            {/* Income */}
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

            {/* Expenses */}
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
                <TableCell align="right"><strong>Total Income (6mo)</strong></TableCell>
                <TableCell align="right"><strong>Total Expenses (6mo)</strong></TableCell>
                <TableCell align="right"><strong>Net Income (6mo)</strong></TableCell>
                <TableCell align="right"><strong>Last Mo Income</strong></TableCell>
                <TableCell align="right"><strong>Last Mo Expenses</strong></TableCell>
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: 'rgb(46, 125, 50) !important',
                    borderLeft: '3px solid',
                    borderColor: 'rgb(46, 125, 50)',
                    fontWeight: 600,
                    color: 'white !important'
                  }}
                >
                  <strong>Last Mo Net</strong>
                </TableCell>
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
                        href={`#/reports/property-pl/${prop.propertyId}`}
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
                  <TableCell align="right">{formatCurrency(prop.lastMonthIncome)}</TableCell>
                  <TableCell align="right">{formatCurrency(prop.lastMonthExpenses)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.15)',
                      borderLeft: '3px solid',
                      borderColor: 'rgb(46, 125, 50)',
                      color: 'rgba(27, 94, 32, 1) !important'
                    }}
                  >
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
