import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as NetIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { InvestmentCalculations } from '../../types/investmentReport';
import { formatCurrency, getMetricColor } from '../../services/investmentReportService';

interface CashFlowBreakdownSectionProps {
  property: Property;
  calculations: InvestmentCalculations;
}

const CashFlowBreakdownSection: React.FC<CashFlowBreakdownSectionProps> = ({
  property,
  calculations,
}) => {
  const expenseItems = [
    { label: 'Mortgage Payment', amount: calculations.monthlyExpenses.mortgage },
    { label: 'Property Taxes', amount: calculations.monthlyExpenses.taxes },
    { label: 'Insurance', amount: calculations.monthlyExpenses.insurance },
    { label: 'Property Management', amount: calculations.monthlyExpenses.propertyManagement },
    { label: 'Utilities', amount: calculations.monthlyExpenses.utilities },
    { label: 'Vacancy Allowance', amount: calculations.monthlyExpenses.vacancy },
    { label: 'CapEx Reserve', amount: calculations.monthlyExpenses.capEx },
    { label: 'Other Expenses', amount: calculations.monthlyExpenses.other },
  ].filter(item => item.amount > 0); // Only show non-zero expenses

  const totalExpenses = calculations.monthlyExpenses.total;
  const netCashFlow = calculations.netMonthlyCashflow;

  const MetricCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, amount, icon, color, subtitle }) => (
    <Card elevation={1}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Box sx={{ color, mr: 1 }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight="bold" sx={{ color }}>
          {formatCurrency(amount)}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Cash Flow Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Monthly income vs expenses breakdown with net cash flow projection
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={4}>
          <MetricCard
            title="Monthly Income"
            amount={calculations.monthlyIncome}
            icon={<IncomeIcon />}
            color="#4CAF50"
            subtitle="Potential rental income"
          />
        </Grid>
        <Grid item xs={4}>
          <MetricCard
            title="Total Expenses"
            amount={totalExpenses}
            icon={<ExpenseIcon />}
            color="#F44336"
            subtitle="Monthly operating costs"
          />
        </Grid>
        <Grid item xs={4}>
          <MetricCard
            title="Net Cash Flow"
            amount={netCashFlow}
            icon={<NetIcon />}
            color={getMetricColor(netCashFlow)}
            subtitle="Monthly profit/loss"
          />
        </Grid>
      </Grid>

      {/* Detailed Expense Breakdown */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Monthly Expense Breakdown
        </Typography>
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Expense Category</TableCell>
                <TableCell align="right">Monthly Amount</TableCell>
                <TableCell align="right">% of Rent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenseItems.map((item, index) => {
                const percentage = calculations.monthlyIncome > 0
                  ? (item.amount / calculations.monthlyIncome) * 100
                  : 0;

                return (
                  <TableRow key={index}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(item.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${percentage.toFixed(1)}%`}
                        size="small"
                        color={percentage > 15 ? 'warning' : 'default'}
                        variant={percentage > 15 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    Total Monthly Expenses
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(totalExpenses)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${calculations.monthlyIncome > 0 ? ((totalExpenses / calculations.monthlyIncome) * 100).toFixed(1) : 0}%`}
                    size="small"
                    color="primary"
                    variant="filled"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Annual Projection */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Annual Cash Flow Projection
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="green.50" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Annual Income
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="green.700">
                {formatCurrency(calculations.monthlyIncome * 12)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="red.50" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Annual Expenses
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="red.700">
                {formatCurrency(totalExpenses * 12)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor={netCashFlow >= 0 ? 'green.50' : 'red.50'} borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Annual Cash Flow
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={netCashFlow >= 0 ? 'green.700' : 'red.700'}
              >
                {formatCurrency(calculations.annualCashflow)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="blue.50" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Cash-on-Cash Return
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="blue.700">
                {((calculations.cashOnCashReturn || 0) * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Expense Guidelines */}
      <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="body2" fontWeight="medium" mb={1}>
          Expense Guidelines:
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          • Property Management: Typically 8-12% of rent
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          • Vacancy Allowance: 5-10% of rent annually
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          • CapEx Reserve: 5-10% of rent for major repairs
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          • Total Expenses: Should be 40-60% of rent for good cash flow
        </Typography>
      </Box>
    </Paper>
  );
};

export default CashFlowBreakdownSection;