import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  AccountBalance as LoanIcon,
  AttachMoney as EquityIcon,
  TrendingUp as ReturnIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { InvestmentCalculations } from '../../types/investmentReport';
import { formatCurrency, formatPercentage, getMetricColor } from '../../services/investmentReportService';

interface FinancingDetailsSectionProps {
  property: Property;
  calculations: InvestmentCalculations;
}

const FinancingDetailsSection: React.FC<FinancingDetailsSectionProps> = ({
  property,
  calculations,
}) => {
  const purchaseAnalysis = [
    { label: 'Purchase Price', amount: calculations.purchasePrice, type: 'neutral' },
    { label: 'Rehab Costs', amount: calculations.rehabCosts, type: 'neutral' },
    { label: 'Total Investment', amount: calculations.totalInvestment, type: 'emphasis' },
  ];

  const financingBreakdown = [
    { label: 'After Repair Value (ARV)', amount: calculations.arv, type: 'positive' },
    { label: 'New Loan Amount (75% ARV)', amount: calculations.newLoanAmount, type: 'neutral' },
    { label: 'Down Payment Required', amount: calculations.downPaymentRequired, type: 'negative' },
    { label: 'Closing Costs', amount: calculations.closingCosts, type: 'negative' },
  ];

  const equityAnalysis = [
    { label: 'Post-Refinance Equity', amount: calculations.postRefinanceEquity, type: 'positive' },
    { label: 'Cash-on-Cash Return', amount: calculations.cashOnCashReturn, type: 'percentage', isReturn: true },
  ];

  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card elevation={1}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Box sx={{ color, mr: 1 }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight="bold" sx={{ color }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const FinancingTable: React.FC<{
    title: string;
    items: Array<{ label: string; amount: number; type: string; isReturn?: boolean }>;
  }> = ({ title, items }) => (
    <Box mb={3}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableBody>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const color = item.type === 'positive' ? '#4CAF50' :
                           item.type === 'negative' ? '#F44336' :
                           item.type === 'emphasis' ? '#1976D2' : '#212121';

              return (
                <TableRow
                  key={index}
                  sx={{
                    bgcolor: item.type === 'emphasis' ? 'grey.50' : 'transparent',
                    ...(isLast && { '& .MuiTableCell-root': { borderBottom: 'none' } })
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={item.type === 'emphasis' ? 'bold' : 'medium'}
                    >
                      {item.label}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={item.type === 'emphasis' ? 'bold' : 'medium'}
                      sx={{ color }}
                    >
                      {item.isReturn
                        ? formatPercentage(item.amount)
                        : formatCurrency(item.amount)
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Financing Details
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Purchase analysis, refinancing strategy, and equity calculations
      </Typography>

      {/* Key Metrics Summary */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <MetricCard
            title="Total Investment"
            value={formatCurrency(calculations.totalInvestment)}
            icon={<CalculateIcon />}
            color="#1976D2"
            subtitle="Purchase + Rehab"
          />
        </Grid>
        <Grid item xs={6}>
          <MetricCard
            title="Post-Refi Equity"
            value={formatCurrency(calculations.postRefinanceEquity)}
            icon={<EquityIcon />}
            color={getMetricColor(calculations.postRefinanceEquity)}
            subtitle="Equity after refinance"
          />
        </Grid>
      </Grid>

      {/* Purchase Analysis */}
      <FinancingTable title="Purchase Analysis" items={purchaseAnalysis} />

      {/* Refinancing Strategy */}
      <FinancingTable title="Refinancing Strategy (BRRRR)" items={financingBreakdown} />

      {/* Returns Analysis */}
      <FinancingTable title="Equity & Returns" items={equityAnalysis} />

      {/* BRRRR Strategy Explanation */}
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          BRRRR Strategy Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card elevation={1} sx={{ bgcolor: 'blue.50', border: '1px solid', borderColor: 'blue.200' }}>
              <CardContent>
                <Typography variant="body2" fontWeight="bold" color="blue.800" mb={1}>
                  Buy - Rehab - Rent - Refinance - Repeat
                </Typography>
                <Typography variant="caption" color="blue.700" display="block" mb={0.5}>
                  1. <strong>Buy:</strong> Purchase at {formatCurrency(calculations.purchasePrice)}
                </Typography>
                <Typography variant="caption" color="blue.700" display="block" mb={0.5}>
                  2. <strong>Rehab:</strong> Invest {formatCurrency(calculations.rehabCosts)} in improvements
                </Typography>
                <Typography variant="caption" color="blue.700" display="block" mb={0.5}>
                  3. <strong>Rent:</strong> Generate {formatCurrency(calculations.monthlyIncome)} monthly
                </Typography>
                <Typography variant="caption" color="blue.700" display="block" mb={0.5}>
                  4. <strong>Refinance:</strong> Pull out {formatCurrency(calculations.newLoanAmount)} (75% of ARV)
                </Typography>
                <Typography variant="caption" color="blue.700" display="block">
                  5. <strong>Repeat:</strong> Use equity for next investment
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card elevation={1} sx={{ bgcolor: 'green.50', border: '1px solid', borderColor: 'green.200' }}>
              <CardContent>
                <Typography variant="body2" fontWeight="bold" color="green.800" mb={2}>
                  Key Assumptions
                </Typography>
                <Typography variant="caption" color="green.700" display="block" mb={0.5}>
                  • 75% LTV refinance on ARV
                </Typography>
                <Typography variant="caption" color="green.700" display="block" mb={0.5}>
                  • {formatPercentage(calculations.closingCosts / calculations.purchasePrice)} closing costs
                </Typography>
                <Typography variant="caption" color="green.700" display="block" mb={0.5}>
                  • Property management at market rates
                </Typography>
                <Typography variant="caption" color="green.700" display="block" mb={0.5}>
                  • Vacancy and CapEx reserves included
                </Typography>
                <Typography variant="caption" color="green.700" display="block">
                  • Conservative rent estimates used
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* ROI Summary */}
      <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="body2" fontWeight="medium" mb={1}>
          Investment Performance Summary:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Cash-on-Cash Return: <strong>{formatPercentage(calculations.cashOnCashReturn || 0)}</strong>
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Annual Cash Flow: <strong>{formatCurrency(calculations.annualCashflow)}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default FinancingDetailsSection;